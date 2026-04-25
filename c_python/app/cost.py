"""
Cost-estimation engine — loads cost_estimation.joblib (sklearn RandomForest)
and predicts repair cost in PKR with breakdown + repair/replace decision.

Ported from new-webxr/api/predict.py. Same input/output contract so the
existing WebXR client + the new Carper live-detection page can both call it.
"""
import logging
import warnings
from pathlib import Path
from typing import Any

from app.config import settings

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)

# Lazy-loaded sklearn pipeline (loaded on first prediction)
_model: Any = None


def _resolve_model_path() -> Path:
    raw = settings.cost_model_path or "weights/cost_estimation.joblib"
    p = Path(raw.strip())
    if not p.is_absolute():
        base = Path(__file__).resolve().parent.parent
        p = (base / p).resolve()
    return p


def _load_cost_model():
    """Load sklearn cost-estimation pipeline once. Safe to call repeatedly."""
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
            f"Set COST_MODEL_PATH or copy cost_estimation.joblib into c_python/weights/."
        )
    _model = joblib.load(model_path)
    logger.info("Loaded cost model from %s", model_path)
    return _model


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

    low_mod = severity in ("low", "moderate", "minor")
    sig_sev = severity in ("significant", "severe")  # noqa: F841 (kept for parity)

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
            return "repair" if severity in ("low", "minor") else "replace"
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
    "front_right_light", "hood", "left_mirror", "object", "right_mirror",
}


def derive_severity(area_ratio: float, confidence: float) -> str:
    score = area_ratio * 0.7 + (confidence - 0.5) * 0.6
    if score < 0.02:
        return "minor"
    if score < 0.06:
        return "moderate"
    if score < 0.14:
        return "significant"
    return "severe"


def predict_cost(payload: dict[str, Any]) -> dict[str, Any]:
    """Predict repair cost. Same input/output as the standalone Flask /predict."""
    import pandas as pd  # type: ignore[import-untyped]

    model = _load_cost_model()

    class_name = payload.get("className", "dent")
    raw_panel = payload.get("panelLocation") or "hood"
    confidence = float(payload.get("confidence", 0.5))
    bbox = payload.get("bbox", [0, 0, 100, 100])
    vehicle_make = payload.get("vehicleMake") or "Toyota"
    vehicle_model = payload.get("vehicleModel") or "Corolla"
    vehicle_year = int(payload.get("vehicleYear") or 2020)

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

    bw, bh = float(bbox[2]), float(bbox[3])
    frame_area = float(payload.get("frameArea") or (1280 * 720))
    area_ratio = (bw * bh) / frame_area

    if payload.get("areaCm2") is not None:
        area_cm2 = round(float(payload["areaCm2"]), 2)
        perim_cm = round(float(payload.get("perimCm", 0)), 2)
    else:
        px_per_cm = (frame_area ** 0.5) / 60
        width_cm = bw / px_per_cm
        height_cm = bh / px_per_cm
        area_cm2 = round(width_cm * height_cm, 2)
        perim_cm = round(2 * (width_cm + height_cm), 2)

    if payload.get("severity") in ("minor", "moderate", "significant", "severe"):
        severity = payload["severity"]
    else:
        severity = derive_severity(area_ratio, confidence)

    dent_type = DENT_TYPE_MAP.get(class_name, "dent")
    material = PANEL_MATERIAL_MAP.get(raw_panel, "Steel")
    repair_meth = REPAIR_METHOD_MAP.get(class_name, "PDR")

    decision = get_repair_decision(raw_panel, class_name, severity)
    if decision == "replace":
        repair_meth = "Panel_Replacement"

    paint_dam = "yes" if dent_type in ("scratch", "crack") else "no"
    dent_depth = "deep" if severity in ("significant", "severe") else "shallow"
    metal_str = "yes" if (dent_type == "dent" and severity == "severe") else "no"

    labor_hrs = LABOR_MAP[severity]
    paint_cost = PAINT_MAP[severity] if paint_dam == "yes" else 0
    parts_cost = 0
    repair_days = DAYS_MAP[severity]

    sample = pd.DataFrame([{
        "Record_ID": 0,
        "Vehicle_Make": vehicle_make,
        "Vehicle_Model": vehicle_model,
        "Vehicle_Year": vehicle_year,
        "Panel_Location": panel,
        "Panel_Material": material,
        "Dent_Type": dent_type,
        "Dent_Area_Cm_Squared": area_cm2,
        "Dent_Perimeter_Centimetres": perim_cm,
        "Dent_Depth": dent_depth,
        "Multiple_Dents_Count": 1,
        "On_Body_Line": "no",
        "Paint_Damaged": paint_dam,
        "Metal_Stretched": metal_str,
        "Damage_Severity_Score": severity,
        "Repair_Method": repair_meth,
        "Labor_Hours": labor_hrs,
        "Paint_Materials_Cost": paint_cost,
        "Parts_Cost": parts_cost,
        "Repair_Time_Days": repair_days,
    }])

    predicted = float(model.predict(sample)[0])

    base_margin = 0.15
    extra = len(unknown_features) * 0.07
    margin_pct = min(base_margin + extra, 0.40)
    error_margin = round(predicted * margin_pct)

    return {
        "cost": round(predicted),
        "costLow": round(max(0, predicted - error_margin)),
        "costHigh": round(predicted + error_margin),
        "currency": "PKR",
        "severity": severity,
        "decision": decision,
        "unknownFeatures": unknown_features,
        "breakdown": {
            "repairMethod": repair_meth,
            "laborHours": labor_hrs,
            "paintCost": paint_cost,
            "areaCm2": area_cm2,
            "perimeterCm": perim_cm,
            "material": material,
            "severityScore": severity,
        },
    }
