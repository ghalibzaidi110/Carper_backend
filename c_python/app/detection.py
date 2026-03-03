"""
Damage detection: uses YOLOv8 engine (yolov8n_balanced/weights/best.pt) when MODEL_PATH is set.
"""
import logging
from typing import Any

from app.config import settings
from app.engine import run_yolo_detection

logger = logging.getLogger(__name__)


async def run_detection(image_url: str) -> dict[str, Any]:
    """
    Run damage detection on image at image_url.
    Returns dict with keys: has_damage, confidence, detections, processed_image_url.
    """
    if settings.model_path:
        return await run_yolo_detection(image_url)
    return _stub_detection(image_url)


def _stub_detection(image_url: str) -> dict[str, Any]:
    """Return stub result when no model is configured."""
    return {
        "has_damage": False,
        "confidence": 0.0,
        "detections": [],
        "processed_image_url": image_url,
    }
