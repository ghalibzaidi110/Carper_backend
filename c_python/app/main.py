"""
Damage detection FastAPI service.
Nest backend calls POST /detect with { "image_url": "<url>" } and expects
{ has_damage, confidence, detections, processed_image_url }.
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.detection import run_detection
from app.engine import close_http_client, run_yolo_on_bytes

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# Tracks background model-load state so /ready can report it. Lifespan
# returns immediately after kicking off loads so uvicorn binds the port
# right away — important for PaaS hosts (Render, Fly, Railway) whose
# port scanners time out in ~60–90s while YOLO + sklearn pipelines can
# take 60s+ to deserialize on cold-start.
_load_state: dict[str, str] = {
    "yolo": "pending",
    "cost_a": "pending",
    "cost_b": "pending",
}


async def _load_models_in_background() -> None:
    if settings.model_path:
        logger.info("Loading YOLO model from %s", settings.model_path)
        _load_state["yolo"] = "loading"
        try:
            from app.engine import _load_model
            await asyncio.to_thread(_load_model)
            _load_state["yolo"] = "ready"
        except Exception as e:
            logger.error("Failed to load YOLO model: %s", e)
            _load_state["yolo"] = f"error: {e}"
    else:
        logger.info("No MODEL_PATH set; using stub detection")
        _load_state["yolo"] = "skipped"

    if settings.cost_model_path:
        logger.info("Loading cost model A from %s", settings.cost_model_path)
        _load_state["cost_a"] = "loading"
        try:
            from app.cost import _load_cost_model
            await asyncio.to_thread(_load_cost_model)
            _load_state["cost_a"] = "ready"
        except Exception as e:
            logger.error("Failed to load cost model A: %s", e)
            _load_state["cost_a"] = f"error: {e}"
    else:
        logger.info("No COST_MODEL_PATH set; /cost-estimate will fail until configured")
        _load_state["cost_a"] = "skipped"

    if settings.cost_model_b_path:
        logger.info(
            "Loading cost model B from %s (weight=%.2f)",
            settings.cost_model_b_path, settings.cost_model_b_weight,
        )
        _load_state["cost_b"] = "loading"
        try:
            from app.cost import _load_cost_model_b
            await asyncio.to_thread(_load_cost_model_b)
            _load_state["cost_b"] = "ready"
        except Exception as e:
            logger.error("Failed to load cost model B: %s — A/B disabled", e)
            _load_state["cost_b"] = f"error: {e}"
    else:
        _load_state["cost_b"] = "skipped"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Kick model loads into a background task and return immediately so
    # uvicorn binds the port. /health stays 200 throughout; /ready flips
    # to 200 only once all models are loaded. First request to /detect
    # or /cost-estimate will block on the underlying load if it hasn't
    # finished yet (the loaders are idempotent), so functionality is
    # never lost — only the cold-start wait is deferred.
    asyncio.create_task(_load_models_in_background())

    # Purge stale inference logs on startup
    from app.inference_logger import purge_old_logs
    purge_old_logs()

    yield

    # Cleanup on shutdown
    await close_http_client()


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Damage Detection Service",
    description="YOLOv8-based damage detection; called by Nest backend.",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# F-6: Lock CORS to only the NestJS backend (and dev fallbacks). The
# Python service is server-to-server only — the browser never calls it
# directly. `allow_origins=["*"]` with credentials enabled was a quiet
# DoS vector if the Python box was ever exposed publicly. Override the
# allowed origins via the ALLOWED_ORIGINS env var (comma-separated)
# in production.
_default_origins = [
    "http://localhost:3000",  # NestJS dev
    "http://127.0.0.1:3000",
]
_allowed_env = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = (
    [o.strip() for o in _allowed_env.split(",") if o.strip()]
    if _allowed_env
    else _default_origins
)
logger.info("CORS allow_origins = %s", ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class DetectRequest(BaseModel):
    image_url: HttpUrl | str


class DetectBatchRequest(BaseModel):
    image_urls: list[HttpUrl | str]
    # Max 10 images per batch to prevent abuse
    model_config = {"json_schema_extra": {"examples": [{"image_urls": ["https://example.com/img1.jpg"]}]}}


class DetectBatchItem(BaseModel):
    image_url: str
    result: "DetectResponse | None" = None
    error: str | None = None


class DetectionItem(BaseModel):
    label: str
    confidence: float
    bbox: list[float]  # [x1, y1, x2, y2]


class DetectResponse(BaseModel):
    has_damage: bool
    confidence: float
    detections: list[DetectionItem]
    processed_image_url: str | None = None


class CostEstimateRequest(BaseModel):
    className: str = "dent"
    panelLocation: str | None = None
    # Panel-as-ruler scaling — optional. When present, the backend uses the
    # panel as a known-size reference to convert damage pixels into real cm².
    panelBbox: list[float] | None = None
    frameSize: list[float] | None = None  # [width, height] of source frame
    vehicleCategory: str | None = None    # sedan|hatchback|suv|pickup|minivan
    confidence: float = 0.5
    bbox: list[float] = [0, 0, 100, 100]   # [x, y, w, h] in pixels
    frameArea: float | None = None
    vehicleMake: str = "Toyota"
    vehicleModel: str = "Corolla"
    vehicleYear: int = 2020
    areaCm2: float | None = None
    perimCm: float | None = None
    severity: str | None = None
    multipleDentsCount: int = 1
    partsCost: float | None = None
    requestId: str | None = None  # Optional; seeds A/B selection for reproducibility
    # Depth/measurement tier fields
    scaleSource: str | None = None       # webxr_depth|depth_model|panel_reference|fallback_estimate
    depthMm: float | None = None         # Absolute dent depth in mm (WebXR only)
    depthSource: str | None = None       # webxr|depth_model|heuristic
    depthCategory: str | None = None     # shallow|moderate|deep (from depth model)
    relativeDepthDelta: float | None = None  # Raw relative depth delta from monocular model


class CostEstimateBreakdown(BaseModel):
    repairMethod: str
    laborHours: float
    paintCost: float
    areaCm2: float
    perimeterCm: float
    material: str
    severityScore: str
    # How was areaCm2 computed?
    #   "panel_reference"  — used the detected panel as a known-size ruler
    #   "fallback_estimate" — legacy fixed-distance assumption (less accurate)
    #   "client_provided"  — frontend computed it (we trust them)
    scaleSource: str = "fallback_estimate"
    errorMargin: int | None = None
    errorMarginPct: float | None = None
    depthMm: float | None = None       # Dent depth in mm (when available)
    depthSource: str | None = None     # webxr|depth_model|heuristic


class CostEstimateResponse(BaseModel):
    cost: int
    costLow: int
    costHigh: int
    currency: str
    severity: str
    severityDetail: str | None = None  # e.g. "Moderate (3.2% of hood area)"
    decision: str
    unknownFeatures: list[str]
    # 0–1 confidence in this estimate. Driven by scale source quality,
    # number of unknown features, and repair decision certainty.
    estimateConfidence: float = 1.0
    confidenceDetail: str | None = None  # Human-readable explanation of confidence score
    breakdown: CostEstimateBreakdown
    # Identifies which trained model produced this prediction. Persisted
    # downstream so a future audit can replay the same input against the
    # same model version (or a different one for A/B testing).
    modelVersion: str = "v4"
    requestId: str | None = None  # Echoed back (or auto-generated) for replay/audit


@app.get("/health")
async def health():
    return {"status": "ok", "service": "damage-detection"}


@app.get("/ready")
async def ready():
    """Reports model load progress. 200 once all models that are
    configured have finished loading (or were skipped); 503 while
    any are still loading or errored. Use this for orchestration
    readiness probes; use /health for plain liveness."""
    not_ready = [
        k for k, v in _load_state.items()
        if v in ("pending", "loading") or v.startswith("error")
    ]
    return JSONResponse(
        {"status": "ready" if not not_ready else "loading", "models": _load_state},
        status_code=503 if not_ready else 200,
    )


@app.get("/metrics")
async def metrics():
    """Prometheus-compatible metrics endpoint."""
    from app.metrics import get_metrics_response  # noqa: PLC0415
    body, content_type = get_metrics_response()
    return Response(content=body, media_type=content_type)


# Note on rate limits: slowapi keys by remote IP, and Python is
# server-to-server behind NestJS — so every request appears to come
# from NestJS's single IP. NestJS already throttles per-user with
# @nestjs/throttler, which is the meaningful gate. The limits here
# are a fleet-wide stampede guard only, deliberately set well above
# expected aggregate load so a normal multi-user session can't trip
# them. Tighten if Python becomes directly reachable.
@app.post("/detect", response_model=DetectResponse)
@limiter.limit("200/minute")
async def detect(request: Request, body: DetectRequest):
    url = str(body.image_url)
    try:
        result = await run_detection(url)
        return DetectResponse(
            has_damage=result["has_damage"],
            confidence=result["confidence"],
            detections=[
                DetectionItem(
                    label=d["label"],
                    confidence=d["confidence"],
                    bbox=d["bbox"],
                )
                for d in result["detections"]
            ],
            processed_image_url=result.get("processed_image_url"),
        )
    except Exception as e:
        logger.exception("Detection failed for %s", url)
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/detect-upload", response_model=DetectResponse)
@limiter.limit("200/minute")
async def detect_upload(request: Request, file: UploadFile = File(...)):
    """
    Run YOLO inference directly on uploaded image bytes — no URL download.
    Useful when the caller doesn't have the image hosted (e.g. Cloudinary
    not configured during local development).
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
        result = await run_yolo_on_bytes(image_bytes)
        return DetectResponse(
            has_damage=result["has_damage"],
            confidence=result["confidence"],
            detections=[
                DetectionItem(
                    label=d["label"],
                    confidence=d["confidence"],
                    bbox=d["bbox"],
                )
                for d in result["detections"]
            ],
            processed_image_url=result.get("processed_image_url"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload-based detection failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


MAX_BATCH_SIZE = 10


@app.post("/detect-batch")
@limiter.limit("50/minute")
async def detect_batch(request: Request, body: DetectBatchRequest):
    """
    Run YOLO inference on multiple images. Max 10 per request.
    Returns per-image results; individual failures don't fail the batch.
    """
    urls = body.image_urls[:MAX_BATCH_SIZE]
    if len(body.image_urls) > MAX_BATCH_SIZE:
        logger.warning(
            "Batch request trimmed: %d → %d images",
            len(body.image_urls), MAX_BATCH_SIZE,
        )

    async def _detect_one(url: str) -> DetectBatchItem:
        try:
            result = await run_detection(str(url))
            return DetectBatchItem(
                image_url=str(url),
                result=DetectResponse(
                    has_damage=result["has_damage"],
                    confidence=result["confidence"],
                    detections=[
                        DetectionItem(
                            label=d["label"],
                            confidence=d["confidence"],
                            bbox=d["bbox"],
                        )
                        for d in result["detections"]
                    ],
                    processed_image_url=result.get("processed_image_url"),
                ),
            )
        except Exception as e:
            logger.warning("Batch detection failed for %s: %s", url, e)
            return DetectBatchItem(image_url=str(url), error=str(e))

    results = await asyncio.gather(*[_detect_one(str(u)) for u in urls])
    return {"results": [r.model_dump() for r in results]}


@app.post("/cost-estimate", response_model=CostEstimateResponse)
@limiter.limit("600/minute")
async def cost_estimate(request: Request, body: CostEstimateRequest):
    """
    Predict repair cost in PKR for a single damage entry. Used by the
    Carper live-detection page (proxied through NestJS).
    """
    try:
        from app.cost import predict_cost
        result = await asyncio.to_thread(predict_cost, body.model_dump())
        return CostEstimateResponse(**result)
    except FileNotFoundError as e:
        logger.warning("Cost model missing: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        logger.exception("Cost estimation failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/cost/health")
async def cost_health():
    from app import cost as cost_module
    return {
        "status": "ok",
        "model_a_loaded": cost_module._model is not None,
        "model_a_version": cost_module.COST_MODEL_VERSION,
        "model_b_loaded": cost_module._model_b is not None,
        "model_b_version": cost_module.COST_MODEL_B_VERSION if cost_module._model_b else None,
        "model_b_weight": settings.cost_model_b_weight,
        "configured_path_a": settings.cost_model_path,
        "configured_path_b": settings.cost_model_b_path,
    }


@app.get("/cost/known-vehicles")
async def cost_known_vehicles():
    """
    Canonical list of vehicle makes, models and panels the cost model was
    trained on. F-5: any vehicle not in this list gets the "+7% per
    unknown feature" widening from predict_cost(). The frontend's
    `vehicle.ts` should be a subset of `models` here — drift means user
    estimates are silently inaccurate. Also exposed via NestJS at
    /api/v1/live-detection/known-vehicles.
    """
    from app import cost as cost_module
    return {
        "model_version": cost_module.COST_MODEL_VERSION,
        "makes": sorted(cost_module.KNOWN_MAKES),
        "models": sorted(cost_module.KNOWN_MODELS),
        "panels": sorted(cost_module.KNOWN_PANELS),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
