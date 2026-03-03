import os
from pathlib import Path

from pydantic_settings import BaseSettings


def _env_path() -> Path:
    return Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    port: int = 8000
    host: str = "0.0.0.0"
    model_path: str | None = None
    log_level: str = "info"
    # YOLO inference (match yolov8n_balanced training)
    conf_threshold: float = 0.25
    iou_threshold: float = 0.45
    imgsz: int = 1024
    max_det: int = 300

    model_config = {
        "env_file": _env_path(),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
