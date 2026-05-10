"""
Structured inference logging — writes JSON-lines to rotating files.

Every YOLO detection and cost prediction is logged as a single JSON line,
enabling downstream analysis:
  - PR curve computation for confidence threshold tuning
  - Drift monitoring (class distribution shifts, cost distribution shifts)
  - Latency tracking
  - Model A/B comparison

Files rotate daily; kept for 30 days by default. Override via env:
  INFERENCE_LOG_DIR  — directory for log files (default: c_python/logs/)
  INFERENCE_LOG_DAYS — retention in days (default: 30)

Two log streams:
  detection_YYYY-MM-DD.jsonl — one line per YOLO inference call
  cost_YYYY-MM-DD.jsonl      — one line per cost prediction
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_write_lock = threading.Lock()

_LOG_DIR: Path | None = None
_RETENTION_DAYS: int = 30


def _resolve_log_dir() -> Path:
    global _LOG_DIR, _RETENTION_DAYS
    if _LOG_DIR is not None:
        return _LOG_DIR
    raw = os.getenv("INFERENCE_LOG_DIR", "").strip()
    if raw:
        _LOG_DIR = Path(raw)
    else:
        _LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
    _LOG_DIR.mkdir(parents=True, exist_ok=True)
    _RETENTION_DAYS = int(os.getenv("INFERENCE_LOG_DAYS", "30"))
    return _LOG_DIR


def _today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _write_line(prefix: str, record: dict[str, Any]) -> None:
    """Append one JSON line to the day's log file."""
    try:
        log_dir = _resolve_log_dir()
        path = log_dir / f"{prefix}_{_today_str()}.jsonl"
        line = json.dumps(record, separators=(",", ":"), default=str)
        with _write_lock, open(path, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception as e:
        # Never let logging failures break inference
        logger.warning("inference_logger write failed: %s", e)


def log_detection(
    *,
    detections: list[dict[str, Any]],
    image_source: str,
    image_hash: str,
    image_size: tuple[int, int],
    elapsed_ms: float,
    cache_hit: bool = False,
) -> None:
    """Log one YOLO inference call (may contain 0+ detections)."""
    now = datetime.now(timezone.utc).isoformat()
    _write_line("detection", {
        "ts": now,
        "image_source": image_source,
        "image_hash": image_hash,
        "image_w": image_size[0],
        "image_h": image_size[1],
        "num_detections": len(detections),
        "detections": [
            {
                "label": d.get("label"),
                "confidence": d.get("confidence"),
                "bbox": d.get("bbox"),
            }
            for d in detections
        ],
        "elapsed_ms": round(elapsed_ms, 1),
        "cache_hit": cache_hit,
    })


def log_cost_prediction(
    *,
    request_id: str,
    model_version: str,
    class_name: str,
    panel: str | None,
    severity: str,
    decision: str,
    cost: int,
    cost_low: int,
    cost_high: int,
    area_cm2: float,
    scale_source: str,
    unknown_features: list[str],
    estimate_confidence: float,
    elapsed_ms: float,
    input_payload: dict[str, Any] | None = None,
) -> None:
    """Log one cost prediction with full feature vector for replay."""
    now = datetime.now(timezone.utc).isoformat()
    record: dict[str, Any] = {
        "ts": now,
        "request_id": request_id,
        "model_version": model_version,
        "class_name": class_name,
        "panel": panel,
        "severity": severity,
        "decision": decision,
        "cost": cost,
        "cost_low": cost_low,
        "cost_high": cost_high,
        "area_cm2": round(area_cm2, 2),
        "scale_source": scale_source,
        "unknown_features": unknown_features,
        "estimate_confidence": estimate_confidence,
        "elapsed_ms": round(elapsed_ms, 1),
    }
    if input_payload:
        record["input"] = input_payload
    _write_line("cost", record)


def purge_old_logs(days: int | None = None) -> int:
    """Delete log files older than retention period. Returns count deleted."""
    log_dir = _resolve_log_dir()
    cutoff_days = days if days is not None else _RETENTION_DAYS
    now = time.time()
    deleted = 0
    for p in log_dir.glob("*.jsonl"):
        age_days = (now - p.stat().st_mtime) / 86400
        if age_days > cutoff_days:
            p.unlink()
            deleted += 1
    if deleted:
        logger.info("Purged %d old inference log files", deleted)
    return deleted
