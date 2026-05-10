import os
from pathlib import Path

from pydantic_settings import BaseSettings


def _env_path() -> Path:
    return Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    port: int = 8000
    host: str = "0.0.0.0"
    model_path: str | None = None
    cost_model_path: str | None = None
    log_level: str = "info"
    # YOLO inference — imgsz=640 matches frontend ONNX input size so
    # detections are consistent across quick-scan (backend) and live (browser).
    conf_threshold: float = 0.25
    iou_threshold: float = 0.45
    imgsz: int = 640
    max_det: int = 300

    # A/B testing for cost model. Set cost_model_b_path to a second .joblib
    # file and cost_model_b_weight to a float in (0, 1) — that fraction of
    # requests will use model B. Leave cost_model_b_path empty to disable.
    cost_model_b_path: str | None = None
    cost_model_b_weight: float = 0.0  # 0 = all traffic to A, 1 = all to B

    model_config = {
        "env_file": _env_path(),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "protected_namespaces": ("settings_",),
    }


settings = Settings()
