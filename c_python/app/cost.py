"""
Cost-estimation engine — loads the v4 GradientBoosting pipeline and predicts
repair cost in PKR with breakdown + repair/replace decision.

Ported from new-webxr/api/predict.py. Same input/output contract so the
existing WebXR client + the new Carper live-detection page can both call it.

Supports A/B testing: set COST_MODEL_B_PATH and COST_MODEL_B_WEIGHT in .env
to route a fraction of requests to a second model version.
"""
import hashlib
import json as _json
import logging
import time
from pathlib import Path
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

# Cost-estimation model version. Bump when retraining; the version is
# echoed in the cost-estimate response so callers can audit which model
# produced any given prediction.
COST_MODEL_VERSION: str = "v4"
COST_MODEL_B_VERSION: str = "v2"

# Error metrics from v4 model evaluation (car_damage_cost_model_metrics_v4.json).
# Used to derive data-driven confidence bands instead of hardcoded percentages.
_MODEL_TEST_MAE: float = 2_789.47
_MODEL_TEST_RMSE: float = 3_563.51
_MODEL_CV_RMSE: float = 5_073.01  # more conservative, cross-validated

# Lazy-loaded sklearn pipelines
_model: Any = None
_model_b: Any = None


def _resolve_path(raw: str) -> Path:
    p = Path(raw.strip())
    if not p.is_absolute():
        base = Path(__file__).resolve().parent.parent
        p = (base / p).resolve()
    return p


def _resolve_model_path() -> Path:
    raw = settings.cost_model_path or f"weights/car_damage_cost_regression_pipeline_{COST_MODEL_VERSION}.joblib"
    return _resolve_path(raw)


def _load_cost_model():
    """Load primary sklearn cost-estimation pipeline once."""
    global _model
    if _model is not None:
        return _model
    try:
        import joblib  # type: ignore[import-untyped]
    except ImportError as e:
        raise RuntimeError("Install joblib: pip install joblib") from e

    model_path = _resolve_model_path()
    if not model_path.exists():
        raise FileNotFoundError(
            f"Cost model not found: {model_path}. "
            f"Set COST_MODEL_PATH or place the v4 joblib into c_python/weights/."
        )
    _model = joblib.load(model_path)
    logger.info("Loaded cost model A from %s", model_path)
    return _model


def _load_cost_model_b():
    """Load model B for A/B testing. Returns None if not configured."""
    global _model_b
    if _model_b is not None:
        return _model_b
    if not settings.cost_model_b_path:
        return None
    try:
        import joblib  # type: ignore[import-untyped]
    except ImportError:
        return None
    model_path = _resolve_path(settings.cost_model_b_path)
    if not model_path.exists():
        logger.warning("Cost model B not found: %s — A/B disabled", model_path)
        return None
    _model_b = joblib.load(model_path)
    logger.info("Loaded cost model B from %s", model_path)
    return _model_b


def _select_model(seed: str) -> tuple[Any, str]:
    """Select model A or B deterministically based on seed.

    Same seed always selects the same model — enables reproducible A/B tests.
    """
    model_b = _load_cost_model_b()
    if model_b is not None and settings.cost_model_b_weight > 0:
        h = hashlib.sha256(seed.encode("utf-8")).hexdigest()
        bucket = int(h[:8], 16) / 0xFFFFFFFF
        if bucket < settings.cost_model_b_weight:
            logger.info("A/B: selected model B (%s) seed=%s bucket=%.4f",
                        COST_MODEL_B_VERSION, seed[:16], bucket)
            return model_b, COST_MODEL_B_VERSION
    return _load_cost_model(), COST_MODEL_VERSION


# ── Feature derivation maps ─────────────────────────────────────────────────

DENT_TYPE_MAP = {
    "dent": "dent",
    "scratch": "scratch",
    "crack": "crack",
    "glass_shatter": "crack",
    "lamp_broken": "dent",
    "tire_flat": "dent",
}

PANEL_MATERIAL_MAP = {
    "back_glass": "Glass",
    "front_glass": "Glass",
    "front_bumper": "Plastic",
    "back_bumper": "Plastic",
    "left_mirror": "Plastic",
    "right_mirror": "Plastic",
    "front_left_light": "Polycarbonate",
    "front_right_light": "Polycarbonate",
    "back_left_light": "Polycarbonate",
    "back_right_light": "Polycarbonate",
    "back_light": "Polycarbonate",
    "front_light": "Polycarbonate",
}
# Default Steel for body panels not in the map

REPAIR_METHOD_MAP = {
    "dent": "PDR",
    "scratch": "Spot_Paint",
    "crack": "Glass_Repair_or_Seal",
    "glass_shatter": "Panel_Replacement",
    "lamp_broken": "Panel_Replacement",
    "tire_flat": "Panel_Replacement",
}

# ── Repair vs Replace decision ──────────────────────────────────────────────

_BODY_PANELS = frozenset([
    "back_bumper", "back_door", "back_left_door", "back_right_door",
    "front_bumper", "front_door", "front_left_door", "front_right_door",
    "hood", "tailgate", "trunk",
])
_BUMPERS = frozenset(["front_bumper", "back_bumper"])
_GLASS_PANELS = frozenset(["front_glass", "back_glass"])
_LIGHT_PANELS = frozenset([
    "back_left_light", "back_light", "back_right_light",
    "front_left_light", "front_light", "front_right_light",
])
_MIRROR_PANELS = frozenset(["left_mirror", "right_mirror"])


def get_repair_decision(panel: str | None, damage: str, severity: str) -> str:
    """Return 'repair', 'replace', or 'unknown' for a given panel/damage/severity."""
    if not panel or panel == "object":
        return "unknown"

    low_mod = severity in ("minor", "moderate")

    if panel in _BODY_PANELS:
        if damage in ("dent", "scratch"):
            return "repair" if low_mod else "replace"
        if damage == "crack":
            if panel in _BUMPERS:
                return "repair" if low_mod else "replace"
            return "replace"
        return "unknown"

    if panel in _GLASS_PANELS:
        if damage == "glass_shatter":
            return "replace"
        if damage == "scratch":
            return "repair" if low_mod else "replace"
        if damage == "crack":
            return "repair" if severity == "minor" else "replace"
        return "unknown"

    if panel in _LIGHT_PANELS:
        if damage in ("lamp_broken", "crack", "glass_shatter"):
            return "replace"
        if damage == "scratch":
            return "repair" if severity in ("low", "minor") else "replace"
        return "unknown"

    if panel in _MIRROR_PANELS:
        if damage in ("glass_shatter", "lamp_broken", "crack"):
            return "replace"
        if damage in ("scratch", "dent"):
            return "repair" if low_mod else "replace"
        return "unknown"

    if panel == "wheel":
        if damage in ("crack", "dent"):
            return "replace"
        if damage == "tire_flat":
            return "repair" if low_mod else "replace"
        if damage == "scratch":
            return "repair" if low_mod else "replace"
        return "unknown"

    return "unknown"


LABOR_MAP = {"minor": 1.0, "moderate": 2.5, "significant": 4.0, "severe": 7.0}
PAINT_MAP = {"minor": 0, "moderate": 800, "significant": 2000, "severe": 4000}
DAYS_MAP = {"minor": 1, "moderate": 1, "significant": 2, "severe": 4}

# Categories the model was trained on
KNOWN_MAKES = {"Daihatsu", "Honda", "Hyundai", "Kia", "Nissan", "Suzuki", "Toyota"}
KNOWN_MODELS = {
    "Accord", "Alto", "BR-V", "Camry", "City", "Civic", "Corolla", "Cultus", "Cuore",
    "Dayz", "Elantra", "Fortuner", "Hilux", "Mira", "Picanto", "Sonata",
    "Sportage", "Stonic", "Sunny", "Swift",
}
KNOWN_PANELS = {
    "back_bumper", "back_door", "back_glass", "back_left_door", "back_left_light",
    "back_light", "back_right_door", "back_right_light", "front_bumper", "front_door",
    "front_glass", "front_left_door", "front_left_light", "front_light", "front_right_door",
    "front_right_light", "hood", "left_mirror", "right_mirror",
    "tailgate", "trunk", "wheel",
}


def derive_severity_from_panel_ratio(panel_ratio: float) -> str:
    """
    Severity from damage-as-fraction-of-panel — used when we have real
    measurements via panel-as-ruler. A "10% of hood" dent feels intuitively
    severe; a "0.5% of hood" dent feels minor. These thresholds match
    body-shop heuristics.
    """
    if panel_ratio < 0.01:   # < 1% of panel
        return "minor"
    if panel_ratio < 0.05:   # 1–5%
        return "moderate"
    if panel_ratio < 0.15:   # 5–15%
        return "significant"
    return "severe"          # >= 15%


def derive_severity(area_ratio: float, _confidence: float) -> str:
    """Severity is driven by damage SIZE only, not by detection confidence.

    The previous formula combined area_ratio and confidence into a single
    score, which meant a high-confidence detection of a tiny region would
    be classified as 'severe' — flipping the repair/replace decision and
    inflating the cost estimate. Confidence is already used at the YOLO
    step to filter weak detections; it shouldn't drive severity again here.

    Buckets are set so a small dent on a hood (~3% of frame) is moderate,
    not severe. Tune these against real labelled data when available.
    """
    if area_ratio < 0.01:
        return "minor"
    if area_ratio < 0.04:
        return "moderate"
    if area_ratio < 0.10:
        return "significant"
    return "severe"


def compute_estimate_confidence(
    scale_source: str,
    unknown_features: list[str],
    decision: str,
) -> float:
    """Compute a 0–1 confidence score for the cost estimate.

    Factors:
      - scale_source: panel_reference (best) vs fallback_estimate (worst)
      - unknown_features: each unknown degrades confidence
      - decision: "unknown" repair decision degrades confidence
    """
    if scale_source == "webxr_depth":
        base = 0.95
    elif scale_source == "panel_reference":
        base = 0.90
    elif scale_source == "depth_model":
        base = 0.85
    elif scale_source == "client_provided":
        base = 0.70
    else:
        base = 0.40  # fallback_estimate

    # Each unknown feature drops confidence
    base -= len(unknown_features) * 0.15

    # Unknown repair decision = less trustworthy
    if decision == "unknown":
        base -= 0.10

    return round(max(0.0, min(1.0, base)), 2)


def _compute_error_margin(predicted: float, unknown_features: list[str]) -> int:
    """Data-driven error margin blending absolute RMSE with prediction-scaled component.

    For small predictions the absolute RMSE floor dominates (prevents
    absurdly tiny bands). For large predictions the relative component
    dominates (prevents absurdly wide bands). Unknown features widen
    the band further because the model is extrapolating.
    """
    abs_component = _MODEL_CV_RMSE
    rel_component = predicted * 0.05
    base_margin = max(abs_component, rel_component)

    # Each unknown adds 15% of base margin; capped at 2x total.
    unknown_multiplier = 1.0 + min(len(unknown_features) * 0.15, 1.0)
    return round(base_margin * unknown_multiplier)


def predict_cost(payload: dict[str, Any]) -> dict[str, Any]:
    """Predict repair cost. Same input/output as the standalone Flask /predict."""
    import pandas as pd  # type: ignore[import-untyped]

    t0 = time.perf_counter()

    # Deterministic A/B seed: explicit requestId if provided, else hash of
    # the full payload so identical inputs always route to the same model.
    request_id = payload.get("requestId")
    if request_id:
        ab_seed = request_id
    else:
        canonical = _json.dumps(
            {k: v for k, v in sorted(payload.items()) if k != "requestId"},
            separators=(",", ":"),
            default=str,
        )
        ab_seed = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        request_id = ab_seed[:12]

    model, model_version = _select_model(ab_seed)

    class_name = payload.get("className", "dent")
    raw_panel = payload.get("panelLocation") or "hood"
    bbox = payload.get("bbox", [0, 0, 100, 100])

    try:
        confidence = float(payload.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))
    except (TypeError, ValueError):
        confidence = 0.5

    if not isinstance(bbox, (list, tuple)) or len(bbox) < 4:
        raise ValueError(f"bbox must have 4 elements, got {bbox!r}")

    vehicle_make = payload.get("vehicleMake") or "Toyota"
    vehicle_model = payload.get("vehicleModel") or "Corolla"

    try:
        multiple_dents = max(1, int(payload.get("multipleDentsCount") or 1))
    except (TypeError, ValueError):
        multiple_dents = 1

    parts_cost_input = payload.get("partsCost")

    # Track unknown features → widen error band
    unknown_features: list[str] = []
    if vehicle_make not in KNOWN_MAKES:
        unknown_features.append("vehicleMake")
        vehicle_make = None
    if vehicle_model not in KNOWN_MODELS:
        unknown_features.append("vehicleModel")
        vehicle_model = None

    panel = raw_panel if raw_panel in KNOWN_PANELS else None
    if panel is None:
        unknown_features.append("panelLocation")

    bw, bh = max(0.0, float(bbox[2])), max(0.0, float(bbox[3]))
    frame_area = float(payload.get("frameArea") or (1280 * 720))
    if frame_area <= 0:
        frame_area = 1280 * 720
    area_ratio = (bw * bh) / frame_area

    # Compute area in cm². Three possible sources, in order of preference:
    #   1. panel-as-ruler — uses detected panel size as a known reference
    #   2. client-provided — frontend already computed (legacy)
    #   3. fallback — fixed-distance assumption (least accurate)
    area_cm2: float
    perim_cm: float
    scale_source: str

    panel_bbox = payload.get("panelBbox")
    raw_category = payload.get("vehicleCategory")
    # Resolve category: explicit, then look-up by make/model, default sedan
    from app.panel_dimensions import (  # noqa: PLC0415 — local import keeps module load light
        compute_real_area_cm2,
        get_panel_size_cm,
        resolve_vehicle_category,
    )
    category = raw_category or resolve_vehicle_category(
        payload.get("vehicleMake"), payload.get("vehicleModel"),
    )
    panel_real_cm = get_panel_size_cm(raw_panel, category) if raw_panel else None
    panel_scaled = (
        compute_real_area_cm2(bbox, panel_bbox, panel_real_cm)
        if panel_bbox is not None and panel_real_cm is not None
        else None
    )

    client_scale = payload.get("scaleSource")

    if client_scale == "webxr_depth" and payload.get("areaCm2") is not None:
        # Tier 1: WebXR AR sensor — absolute measurements, trust them
        area_cm2 = round(float(payload["areaCm2"]), 2)
        perim_cm = round(float(payload.get("perimCm", 0)), 2)
        scale_source = "webxr_depth"
    elif panel_scaled is not None:
        # Tier 3: panel-as-ruler (also used when client says "depth_model"
        # since the depth model only improves dent classification, not area)
        area_cm2, perim_cm = panel_scaled
        scale_source = "panel_reference"
    elif payload.get("areaCm2") is not None:
        area_cm2 = round(float(payload["areaCm2"]), 2)
        perim_cm = round(float(payload.get("perimCm", 0)), 2)
        scale_source = "client_provided"
    else:
        # Tier 4: Legacy fixed-distance estimate. Wildly inaccurate but
        # better than nothing — surface in the response so the UI can warn.
        px_per_cm = (frame_area ** 0.5) / 60
        width_cm = bw / px_per_cm
        height_cm = bh / px_per_cm
        area_cm2 = round(width_cm * height_cm, 2)
        perim_cm = round(2 * (width_cm + height_cm), 2)
        scale_source = "fallback_estimate"

    severity_detail: str
    if payload.get("severity") in ("minor", "moderate", "significant", "severe"):
        severity = payload["severity"]
        severity_detail = f"{severity.capitalize()} (client-provided)"
    elif scale_source == "panel_reference" and panel_real_cm is not None:
        # Use damage-as-fraction-of-panel when we have real measurements.
        # This is invariant to camera distance and matches what a body-shop
        # estimator would intuitively use ("a 10% hood dent is a serious dent").
        panel_total_cm2 = panel_real_cm[0] * panel_real_cm[1]
        panel_ratio = area_cm2 / panel_total_cm2 if panel_total_cm2 > 0 else 0
        severity = derive_severity_from_panel_ratio(panel_ratio)
        pct_str = f"{panel_ratio * 100:.1f}%"
        panel_name = raw_panel.replace("_", " ")
        severity_detail = f"{severity.capitalize()} ({pct_str} of {panel_name} area)"
    else:
        severity = derive_severity(area_ratio, confidence)
        pct_str = f"{area_ratio * 100:.1f}%"
        severity_detail = f"{severity.capitalize()} ({pct_str} of frame, approximate)"

    dent_type = DENT_TYPE_MAP.get(class_name, "dent")
    material = PANEL_MATERIAL_MAP.get(raw_panel, "Steel")
    repair_meth = REPAIR_METHOD_MAP.get(class_name, "PDR")

    decision = get_repair_decision(raw_panel, class_name, severity)
    if decision == "replace":
        repair_meth = "Panel_Replacement"
    elif decision == "repair" and repair_meth == "Panel_Replacement":
        # Don't use Panel_Replacement for repairable damage (e.g. minor tire_flat)
        repair_meth = "PDR"

    paint_dam = "yes" if dent_type in ("scratch", "crack") else "no"

    # Dent depth: use actual measurement when available, else heuristic
    depth_mm = payload.get("depthMm")
    depth_source = payload.get("depthSource", "heuristic")
    if depth_mm is not None and depth_source == "webxr":
        dent_depth = "deep" if depth_mm > 5.0 else "shallow"
    elif payload.get("depthCategory"):
        depth_cat = payload["depthCategory"]
        dent_depth = "deep" if depth_cat == "deep" else "shallow"
        if depth_source == "heuristic":
            depth_source = "depth_model"
    else:
        dent_depth = "deep" if severity in ("significant", "severe") else "shallow"

    labor_hrs = LABOR_MAP[severity]
    paint_cost = PAINT_MAP[severity] if paint_dam == "yes" else 0
    parts_cost = float(parts_cost_input) if parts_cost_input is not None else 0
    repair_days = DAYS_MAP[severity]

    # v4 model uses 13 features (dropped Record_ID, On_Body_Line,
    # Vehicle_Year, Vehicle_Make, Damage_Severity_Score, Paint_Damaged,
    # Metal_Stretched — all pruned by feature importance < 0.0005).
    sample = pd.DataFrame([{
        "Vehicle_Model": vehicle_model,
        "Panel_Location": panel,
        "Panel_Material": material,
        "Dent_Type": dent_type,
        "Dent_Area_Cm_Squared": area_cm2,
        "Dent_Perimeter_Centimetres": perim_cm,
        "Dent_Depth": dent_depth,
        "Multiple_Dents_Count": max(1, multiple_dents),
        "Repair_Method": repair_meth,
        "Labor_Hours": labor_hrs,
        "Paint_Materials_Cost": paint_cost,
        "Parts_Cost": parts_cost,
        "Repair_Time_Days": repair_days,
    }])

    predicted = max(0.0, float(model.predict(sample)[0]))
    # Cap absurd predictions (numeric instability guard)
    MAX_COST = 10_000_000
    if predicted > MAX_COST:
        logger.warning("Predicted cost %s exceeds cap %s — clamping", predicted, MAX_COST)
        predicted = MAX_COST

    error_margin = _compute_error_margin(predicted, unknown_features)
    margin_pct = round(error_margin / predicted * 100, 1) if predicted > 0 else 0

    est_confidence = compute_estimate_confidence(scale_source, unknown_features, decision)

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
    logger.info(
        "predict_cost: rid=%s model=%s cost=%d severity=%s decision=%s "
        "scale=%s unknowns=%s confidence=%.2f margin=%d(%.1f%%) elapsed=%.1fms",
        request_id, model_version, round(predicted), severity, decision,
        scale_source, unknown_features, est_confidence,
        error_margin, margin_pct, elapsed_ms,
    )

    # Structured log for replay, drift monitoring, and threshold analysis
    from app.inference_logger import log_cost_prediction  # noqa: PLC0415
    log_cost_prediction(
        request_id=request_id,
        model_version=model_version,
        class_name=class_name,
        panel=raw_panel,
        severity=severity,
        decision=decision,
        cost=round(predicted),
        cost_low=round(max(0, predicted - error_margin)),
        cost_high=round(predicted + error_margin),
        area_cm2=area_cm2,
        scale_source=scale_source,
        unknown_features=unknown_features,
        estimate_confidence=est_confidence,
        elapsed_ms=elapsed_ms,
        input_payload=payload,
    )
    from app.metrics import record_cost  # noqa: PLC0415
    record_cost(
        model_version=model_version,
        severity=severity,
        cost=round(predicted),
        cost_low=round(max(0, predicted - error_margin)),
        cost_high=round(predicted + error_margin),
        scale_source=scale_source,
        unknown_features=unknown_features,
        elapsed_ms=elapsed_ms,
    )

    # Build human-readable confidence explanation
    confidence_reasons: list[str] = []
    if scale_source == "fallback_estimate":
        confidence_reasons.append("panel not fully visible (size is approximate)")
    if unknown_features:
        confidence_reasons.append(
            f"unknown {', '.join(f.replace('vehicle', '').replace('panel', 'panel ').lower().strip() for f in unknown_features)}"
        )
    if decision == "unknown":
        confidence_reasons.append("repair method uncertain")
    confidence_detail = (
        f"{int(est_confidence * 100)}% confidence"
        + (f": {'; '.join(confidence_reasons)}" if confidence_reasons else "")
    )

    return {
        "cost": round(predicted),
        "costLow": round(max(0, predicted - error_margin)),
        "costHigh": round(predicted + error_margin),
        "currency": "PKR",
        "severity": severity,
        "severityDetail": severity_detail,
        "decision": decision,
        "unknownFeatures": unknown_features,
        "estimateConfidence": est_confidence,
        "confidenceDetail": confidence_detail,
        "modelVersion": model_version,
        "requestId": request_id,
        "breakdown": {
            "repairMethod": repair_meth,
            "laborHours": labor_hrs,
            "paintCost": paint_cost,
            "areaCm2": area_cm2,
            "perimeterCm": perim_cm,
            "material": material,
            "severityScore": severity,
            "scaleSource": scale_source,
            "errorMargin": error_margin,
            "errorMarginPct": margin_pct,
            "depthMm": depth_mm,
            "depthSource": depth_source,
        },
    }
