"""
Prometheus-compatible metrics for YOLO detection and cost prediction.

Exposes counters, histograms, and gauges that Prometheus scrapes via
GET /metrics. Grafana dashboards can then show:
  - Detection throughput and class distribution
  - Confidence distribution per class (for threshold tuning)
  - Cost prediction distribution (drift monitoring)
  - Inference latency percentiles
  - Cache hit rate

Requires: pip install prometheus_client
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

try:
    from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
    _PROM_AVAILABLE = True
except ImportError:
    _PROM_AVAILABLE = False
    logger.info("prometheus_client not installed — /metrics disabled")

if _PROM_AVAILABLE:
    # ── Detection metrics ────────────────────────────────────────────────
    DETECTION_REQUESTS = Counter(
        "carper_detection_requests_total",
        "Total YOLO inference requests",
        ["source"],  # url | upload | batch
    )
    DETECTION_COUNT = Counter(
        "carper_detections_total",
        "Total individual damage detections",
        ["class_name"],
    )
    DETECTION_CONFIDENCE = Histogram(
        "carper_detection_confidence",
        "Detection confidence scores",
        ["class_name"],
        buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    )
    DETECTION_LATENCY = Histogram(
        "carper_detection_latency_ms",
        "YOLO inference latency in milliseconds",
        buckets=[50, 100, 200, 500, 1000, 2000, 5000],
    )
    DETECTION_CACHE_HITS = Counter(
        "carper_detection_cache_hits_total",
        "Detection cache hits",
    )

    # ── Cost metrics ─────────────────────────────────────────────────────
    COST_REQUESTS = Counter(
        "carper_cost_requests_total",
        "Total cost estimation requests",
        ["model_version"],
    )
    COST_PREDICTED = Histogram(
        "carper_cost_predicted_pkr",
        "Predicted cost in PKR",
        ["severity"],
        buckets=[1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000],
    )
    COST_INTERVAL_WIDTH = Histogram(
        "carper_cost_interval_width_pkr",
        "Prediction interval width (costHigh - costLow)",
        buckets=[1000, 5000, 10000, 25000, 50000, 100000],
    )
    COST_LATENCY = Histogram(
        "carper_cost_latency_ms",
        "Cost prediction latency in milliseconds",
        buckets=[5, 10, 25, 50, 100, 250, 500],
    )
    COST_UNKNOWN_FEATURES = Counter(
        "carper_cost_unknown_features_total",
        "Unknown features encountered in cost predictions",
        ["feature"],
    )
    COST_SCALE_SOURCE = Counter(
        "carper_cost_scale_source_total",
        "Scale source used for area computation",
        ["source"],
    )


def record_detection(
    *,
    source: str,
    detections: list[dict],
    elapsed_ms: float,
    cache_hit: bool = False,
) -> None:
    """Record metrics for one YOLO inference call."""
    if not _PROM_AVAILABLE:
        return
    DETECTION_REQUESTS.labels(source=source).inc()
    if cache_hit:
        DETECTION_CACHE_HITS.inc()
        return
    DETECTION_LATENCY.observe(elapsed_ms)
    for d in detections:
        cls = d.get("label", "unknown")
        conf = d.get("confidence", 0)
        DETECTION_COUNT.labels(class_name=cls).inc()
        DETECTION_CONFIDENCE.labels(class_name=cls).observe(conf)


def record_cost(
    *,
    model_version: str,
    severity: str,
    cost: int,
    cost_low: int,
    cost_high: int,
    scale_source: str,
    unknown_features: list[str],
    elapsed_ms: float,
) -> None:
    """Record metrics for one cost prediction."""
    if not _PROM_AVAILABLE:
        return
    COST_REQUESTS.labels(model_version=model_version).inc()
    COST_PREDICTED.labels(severity=severity).observe(cost)
    COST_INTERVAL_WIDTH.observe(cost_high - cost_low)
    COST_LATENCY.observe(elapsed_ms)
    COST_SCALE_SOURCE.labels(source=scale_source).inc()
    for feat in unknown_features:
        COST_UNKNOWN_FEATURES.labels(feature=feat).inc()


def get_metrics_response() -> tuple[bytes, str]:
    """Return (body, content_type) for the /metrics endpoint."""
    if not _PROM_AVAILABLE:
        return b"# prometheus_client not installed\n", "text/plain"
    return generate_latest(), CONTENT_TYPE_LATEST
