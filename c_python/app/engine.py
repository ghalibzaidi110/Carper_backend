"""
YOLOv8 damage-detection engine using best.pt (kept in c_python/weights/).
Loads model once; runs inference on image URL; returns detections and an
annotated image (boxes + labels drawn) as a base64 data URL.
"""
import asyncio
import base64
import hashlib
import io
import logging
import time
from pathlib import Path
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Lazy-loaded model ──────────────────────────────────────────────────────

_model = None


def _resolve_model_path() -> Path:
    p = Path(settings.model_path.strip())
    if not p.is_absolute():
        base = Path(__file__).resolve().parent.parent
        p = (base / p).resolve()
    return p


def _load_model():
    """Load YOLOv8 model (sync). Call from thread if needed."""
    global _model
    if _model is not None:
        return _model
    try:
        from ultralytics import YOLO  # type: ignore[import-untyped]
    except ImportError as e:
        raise RuntimeError(
            "Install ultralytics: pip install ultralytics"
        ) from e
    model_path = _resolve_model_path()
    if not model_path.exists():
        raise FileNotFoundError(f"Model weights not found: {model_path}")
    _model = YOLO(str(model_path))
    logger.info("Loaded YOLO model from %s", model_path)
    return _model


# ── Reusable httpx client ─────────────────────────────────────────────────

_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    """Return a module-level AsyncClient, creating it once."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
    return _http_client


async def _download_image(url: str) -> bytes:
    """Download image bytes from URL using the shared client."""
    client = _get_http_client()
    r = await client.get(url)
    r.raise_for_status()
    return r.content


async def close_http_client() -> None:
    """Close the shared httpx client. Call on app shutdown."""
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None


# ── Per-class confidence & NMS (parity with frontend classes.ts) ──────────

# Must match frontend src/lib/live-detection/classes.ts exactly.
CLASS_NAMES = ["dent", "scratch", "crack", "glass_shatter", "lamp_broken", "tire_flat"]

# Per-class minimum confidence (F-8). Acts as floor on top of the global
# conf_threshold from settings. Matches frontend CLASS_CONF_THRESHOLDS.
CLASS_CONF_THRESHOLDS: dict[str, float] = {
    "dent": 0.30,
    "scratch": 0.35,
    "crack": 0.40,
    "glass_shatter": 0.55,
    "lamp_broken": 0.45,
    "tire_flat": 0.50,
}

# Per-class NMS IoU threshold (F-9). Matches frontend CLASS_NMS_IOU.
CLASS_NMS_IOU: dict[str, float] = {
    "scratch": 0.30,
    "crack": 0.40,
    "dent": 0.50,
    "glass_shatter": 0.55,
    "lamp_broken": 0.55,
    "tire_flat": 0.60,
}


def _iou(a: list[float], b: list[float]) -> float:
    """IoU for two [x1, y1, x2, y2] boxes."""
    ix1 = max(a[0], b[0])
    iy1 = max(a[1], b[1])
    ix2 = min(a[2], b[2])
    iy2 = min(a[3], b[3])
    if ix2 <= ix1 or iy2 <= iy1:
        return 0.0
    inter = (ix2 - ix1) * (iy2 - iy1)
    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[2] - b[0]) * (b[3] - b[1])
    return inter / (area_a + area_b - inter + 1e-6)


def _apply_per_class_filters(
    detections: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Apply per-class confidence floor + class-aware NMS.

    1. Drop detections below the per-class confidence floor.
    2. Class-aware greedy NMS: for each class, suppress lower-confidence
       boxes that overlap a higher-confidence box above the class IoU
       threshold.
    """
    # Step 1: per-class confidence floor
    filtered = []
    for d in detections:
        floor = CLASS_CONF_THRESHOLDS.get(d["label"], 0.4)
        if d["confidence"] >= floor:
            filtered.append(d)

    # Step 2: class-aware NMS
    filtered.sort(key=lambda d: d["confidence"], reverse=True)
    kept: list[dict[str, Any]] = []
    for d in filtered:
        thresh = CLASS_NMS_IOU.get(d["label"], 0.5)
        suppressed = any(
            k["label"] == d["label"] and _iou(d["bbox"], k["bbox"]) > thresh
            for k in kept
        )
        if not suppressed:
            kept.append(d)
    return kept


# ── Detection result cache ────────────────────────────────────────────────

_CACHE_TTL = 300  # 5 minutes
_CACHE_MAX = 200  # max entries

_detection_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def _cache_key_for_url(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def _cache_key_for_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _cache_get(key: str) -> dict[str, Any] | None:
    entry = _detection_cache.get(key)
    if entry is None:
        return None
    ts, result = entry
    if time.monotonic() - ts > _CACHE_TTL:
        del _detection_cache[key]
        return None
    return result


def _cache_put(key: str, result: dict[str, Any]) -> None:
    # Evict expired + enforce size cap
    if len(_detection_cache) >= _CACHE_MAX:
        now = time.monotonic()
        expired = [k for k, (ts, _) in _detection_cache.items() if now - ts > _CACHE_TTL]
        for k in expired:
            del _detection_cache[k]
        # Still over cap? Drop oldest
        if len(_detection_cache) >= _CACHE_MAX:
            oldest = min(_detection_cache, key=lambda k: _detection_cache[k][0])
            del _detection_cache[oldest]
    _detection_cache[key] = (time.monotonic(), result)


# ── Inference ─────────────────────────────────────────────────────────────

def _run_inference(image_bytes: bytes) -> tuple[list[dict[str, Any]], bytes | None]:
    """
    Run YOLO inference on image bytes (sync). Returns
    (detections, annotated_jpeg_bytes or None if no detections).

    Uses a low global conf_threshold to let ultralytics produce candidates,
    then applies per-class confidence floors and class-aware NMS to match
    frontend detection behavior.
    """
    import numpy as np
    from PIL import Image

    t0 = time.perf_counter()
    model = _load_model()
    conf = settings.conf_threshold
    iou = settings.iou_threshold
    imgsz = settings.imgsz

    img = Image.open(io.BytesIO(image_bytes))
    if img.mode == "RGBA":
        img = img.convert("RGB")
    img_np = np.array(img)

    results = model.predict(
        img_np,
        conf=conf,
        iou=iou,
        imgsz=imgsz,
        verbose=False,
        max_det=settings.max_det,
    )

    out = []
    names = model.names or {}
    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            xyxy = box.xyxy[0].cpu().numpy()
            x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
            cls_id = int(box.cls[0].item())
            conf_val = float(box.conf[0].item())
            label = names.get(cls_id, f"class_{cls_id}")
            out.append({
                "label": label,
                "confidence": round(conf_val, 4),
                "bbox": [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)],
            })

    # Apply per-class confidence floors + class-aware NMS
    out = _apply_per_class_filters(out)

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
    logger.info(
        "YOLO inference: %d detections, %.1fms, img=%dx%d",
        len(out), elapsed_ms, img_np.shape[1], img_np.shape[0],
    )

    # Structured inference log for PR curve analysis / drift monitoring
    from app.inference_logger import log_detection  # noqa: PLC0415
    log_detection(
        detections=out,
        image_source="bytes",
        image_hash=hashlib.sha256(image_bytes).hexdigest()[:16],
        image_size=(img_np.shape[1], img_np.shape[0]),
        elapsed_ms=elapsed_ms,
    )
    from app.metrics import record_detection  # noqa: PLC0415
    record_detection(source="bytes", detections=out, elapsed_ms=elapsed_ms)

    # Annotated image: draw boxes and labels on the image (same as training visuals)
    annotated_bytes: bytes | None = None
    if results and len(results) > 0:
        try:
            # result.plot() returns BGR numpy array (uint8)
            plotted = results[0].plot()
            # Convert BGR to RGB and encode as JPEG
            rgb = plotted[:, :, ::-1] if plotted.ndim == 3 else plotted
            pil_img = Image.fromarray(rgb)
            buf = io.BytesIO()
            pil_img.save(buf, format="JPEG", quality=90)
            annotated_bytes = buf.getvalue()
        except Exception as e:
            logger.warning("Could not generate annotated image: %s", e)

    return out, annotated_bytes


def _build_response(image_bytes_for_inference: bytes, fallback_processed_url: str | None) -> dict[str, Any]:
    """Run inference on raw bytes and assemble the API-shaped response."""
    detections, annotated_bytes = _run_inference(image_bytes_for_inference)
    has_damage = len(detections) > 0
    confidence = max((d["confidence"] for d in detections), default=0.0)
    processed_image_url = fallback_processed_url
    if annotated_bytes:
        b64 = base64.b64encode(annotated_bytes).decode("ascii")
        processed_image_url = f"data:image/jpeg;base64,{b64}"
    return {
        "has_damage": has_damage,
        "confidence": round(confidence, 4),
        "detections": detections,
        "processed_image_url": processed_image_url,
    }


# ── Public API ────────────────────────────────────────────────────────────

async def run_yolo_detection(image_url: str) -> dict[str, Any]:
    """Download image from URL, run YOLO inference, return API-shaped result.
    Results are cached by URL hash for 5 minutes."""
    cache_key = _cache_key_for_url(image_url)
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("Cache hit for %s", image_url)
        from app.inference_logger import log_detection  # noqa: PLC0415
        log_detection(
            detections=cached.get("detections", []),
            image_source="url",
            image_hash=cache_key[:16],
            image_size=(0, 0),
            elapsed_ms=0,
            cache_hit=True,
        )
        from app.metrics import record_detection  # noqa: PLC0415
        record_detection(source="url", detections=cached.get("detections", []), elapsed_ms=0, cache_hit=True)
        return cached

    image_bytes = await _download_image(image_url)
    result = await asyncio.to_thread(_build_response, image_bytes, image_url)
    _cache_put(cache_key, result)
    return result


async def run_yolo_on_bytes(image_bytes: bytes) -> dict[str, Any]:
    """Run YOLO inference directly on bytes (no URL download). Annotated image
    is returned as a base64 data URL; processed_image_url is None on failure.
    Results are cached by content hash for 5 minutes."""
    cache_key = _cache_key_for_bytes(image_bytes)
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.debug("Cache hit for uploaded bytes")
        from app.inference_logger import log_detection  # noqa: PLC0415
        log_detection(
            detections=cached.get("detections", []),
            image_source="upload",
            image_hash=cache_key[:16],
            image_size=(0, 0),
            elapsed_ms=0,
            cache_hit=True,
        )
        from app.metrics import record_detection  # noqa: PLC0415
        record_detection(source="upload", detections=cached.get("detections", []), elapsed_ms=0, cache_hit=True)
        return cached

    result = await asyncio.to_thread(_build_response, image_bytes, None)
    _cache_put(cache_key, result)
    return result
