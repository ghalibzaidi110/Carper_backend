"""
YOLOv8 damage-detection engine using best.pt (kept in c_python/weights/).
Loads model once; runs inference on image URL; returns detections and an
annotated image (boxes + labels drawn) as a base64 data URL.
"""
import asyncio
import base64
import io
import logging
from pathlib import Path
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-loaded model (loaded on first use)
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
        from ultralytics import YOLO
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


async def _download_image(url: str) -> bytes:
    """Download image bytes from URL."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.content


def _run_inference(image_bytes: bytes) -> tuple[list[dict[str, Any]], bytes | None]:
    """
    Run YOLO inference on image bytes (sync). Returns
    (detections, annotated_jpeg_bytes or None if no detections).
    """
    import numpy as np
    from PIL import Image

    model = _load_model()
    conf = settings.conf_threshold
    iou = settings.iou_threshold
    imgsz = settings.imgsz

    img = Image.open(io.BytesIO(image_bytes))
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

    # Annotated image: draw boxes and labels on the image (same as training visuals)
    annotated_bytes: bytes | None = None
    if results and len(results) > 0:
        try:
            # result.plot() returns BGR numpy array (uint8)
            plotted = results[0].plot()
            # Convert BGR to RGB and encode as JPEG
            from PIL import Image as PILImage
            rgb = plotted[:, :, ::-1] if plotted.ndim == 3 else plotted
            pil_img = PILImage.fromarray(rgb)
            buf = io.BytesIO()
            pil_img.save(buf, format="JPEG", quality=90)
            annotated_bytes = buf.getvalue()
        except Exception as e:
            logger.warning("Could not generate annotated image: %s", e)

    return out, annotated_bytes


async def run_yolo_detection(image_url: str) -> dict[str, Any]:
    """
    Download image from URL, run YOLO inference, return API-shaped result:
    has_damage, confidence, detections, processed_image_url.
    processed_image_url is a data URL of the annotated image (boxes drawn), or the original URL if annotation failed.
    """
    image_bytes = await _download_image(image_url)
    detections, annotated_bytes = await asyncio.to_thread(_run_inference, image_bytes)

    has_damage = len(detections) > 0
    confidence = max((d["confidence"] for d in detections), default=0.0)

    processed_image_url = image_url
    if annotated_bytes:
        b64 = base64.b64encode(annotated_bytes).decode("ascii")
        processed_image_url = f"data:image/jpeg;base64,{b64}"

    return {
        "has_damage": has_damage,
        "confidence": round(confidence, 4),
        "detections": detections,
        "processed_image_url": processed_image_url,
    }
