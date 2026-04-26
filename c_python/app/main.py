"""
Damage detection FastAPI service.
Nest backend calls POST /detect with { "image_url": "<url>" } and expects
{ has_damage, confidence, detections, processed_image_url }.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from app.config import settings
from app.detection import run_detection
from app.engine import run_yolo_on_bytes

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.model_path:
        logger.info("Loading YOLO model from %s", settings.model_path)
        try:
            from app.engine import _load_model
            await asyncio.to_thread(_load_model)
        except Exception as e:
            logger.error("Failed to load YOLO model: %s", e)
            raise
    else:
        logger.info("No MODEL_PATH set; using stub detection")

    if settings.cost_model_path:
        logger.info("Loading cost model from %s", settings.cost_model_path)
        try:
            from app.cost import _load_cost_model
            await asyncio.to_thread(_load_cost_model)
        except Exception as e:
            logger.error("Failed to load cost model: %s", e)
            # Don't raise — cost endpoint will surface the error if hit
    else:
        logger.info("No COST_MODEL_PATH set; /cost-estimate will fail until configured")

    yield
    # shutdown: cleanup if needed
    pass


app = FastAPI(
    title="Damage Detection Service",
    description="YOLOv8-based damage detection; called by Nest backend.",
    lifespan=lifespan,
)

# F-6: Lock CORS to only the NestJS backend (and dev fallbacks). The
# Python service is server-to-server only — the browser never calls it
# directly. `allow_origins=["*"]` with credentials enabled was a quiet
# DoS vector if the Python box was ever exposed publicly. Override the
# allowed origins via the ALLOWED_ORIGINS env var (comma-separated)
# in production.
import os  # noqa: E402 — local import keeps top minimal
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


class Bbox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


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


class CostEstimateResponse(BaseModel):
    cost: int
    costLow: int
    costHigh: int
    currency: str
    severity: str
    decision: str
    unknownFeatures: list[str]
    breakdown: CostEstimateBreakdown
    # Identifies which trained model produced this prediction. Persisted
    # downstream so a future audit can replay the same input against the
    # same model version (or a different one for A/B testing).
    modelVersion: str = "v1"


@app.get("/health")
async def health():
    return {"status": "ok", "service": "damage-detection"}


@app.post("/detect", response_model=DetectResponse)
async def detect(body: DetectRequest):
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
async def detect_upload(file: UploadFile = File(...)):
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


@app.post("/cost-estimate", response_model=CostEstimateResponse)
async def cost_estimate(body: CostEstimateRequest):
    """
    Predict repair cost in PKR for a single damage entry. Used by the
    Carper live-detection page (proxied through NestJS).
    """
    try:
        from app.cost import predict_cost
        result = await asyncio.to_thread(predict_cost, body.dict())
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
        "model_loaded": cost_module._model is not None,
        "model_version": cost_module.COST_MODEL_VERSION,
        "configured_path": settings.cost_model_path,
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
