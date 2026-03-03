"""
Damage detection FastAPI service.
Nest backend calls POST /detect with { "image_url": "<url>" } and expects
{ has_damage, confidence, detections, processed_image_url }.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from app.config import settings
from app.detection import run_detection

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.model_path:
        logger.info("Loading model from %s", settings.model_path)
        try:
            from app.engine import _load_model
            await asyncio.to_thread(_load_model)
        except Exception as e:
            logger.error("Failed to load YOLO model: %s", e)
            raise
    else:
        logger.info("No MODEL_PATH set; using stub detection")
    yield
    # shutdown: cleanup if needed
    pass


app = FastAPI(
    title="Damage Detection Service",
    description="YOLOv8-based damage detection; called by Nest backend.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
