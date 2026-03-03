"""
Detection logic: stub by default; replace with YOLOv8 when MODEL_PATH is set.
"""
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


async def run_detection(image_url: str) -> dict[str, Any]:
    """
    Run damage detection on image at image_url.
    Returns dict with keys: has_damage, confidence, detections, processed_image_url.
    """
    if settings.model_path:
        return await _run_yolo(image_url)
    return _stub_detection(image_url)


def _stub_detection(image_url: str) -> dict[str, Any]:
    """Return stub result when no model is configured."""
    return {
        "has_damage": False,
        "confidence": 0.0,
        "detections": [],
        "processed_image_url": image_url,
    }


async def _run_yolo(image_url: str) -> dict[str, Any]:
    """Run YOLOv8 model (placeholder: implement with ultralytics when MODEL_PATH is set)."""
    # TODO: download image from image_url, run model, return detections + optional processed image URL
    logger.warning("YOLO not implemented yet; returning stub for %s", image_url)
    return _stub_detection(image_url)
