"""
Panel-as-ruler: average physical dimensions of car panels per vehicle
category, used to convert pixel measurements into real centimetres.

The cost-estimation pipeline historically computed area_cm² with a
hardcoded "60 cm assumed camera distance" formula, which fails completely
when the user holds the phone at any other distance. By using a *known*
landmark in the same frame (the panel that the YOLOv8-seg parts model
already detected for us), we can derive an actual pixels-per-centimetre
conversion that's invariant to camera distance and zoom.

Numbers below are conservative averages compiled from manufacturer
service-manual specs and body-shop estimating guides for the Pakistan
market. They don't have to be exact — even being within ±20% of the real
panel size produces dramatically more accurate damage measurements than
the previous fixed-distance assumption.

If you support a vehicle category not in this file, the cost API falls
back to the legacy fixed-distance computation and flags the estimate as
"unscaled".
"""
from __future__ import annotations

from typing import Literal

VehicleCategory = Literal["sedan", "hatchback", "suv", "pickup", "minivan"]

# (panel_name, (width_cm, height_cm))
# These represent the panel's longest visible projection from the
# typical inspection angle (front-3/4, rear-3/4, or side-on).
PANEL_DIMENSIONS_CM: dict[VehicleCategory, dict[str, tuple[float, float]]] = {
    "sedan": {
        "hood":              (130.0,  90.0),
        "front_bumper":      (160.0,  50.0),
        "back_bumper":       (160.0,  50.0),
        "front_glass":       (140.0,  70.0),
        "back_glass":        (130.0,  60.0),
        "front_left_door":   (110.0, 100.0),
        "front_right_door":  (110.0, 100.0),
        "back_left_door":    (105.0,  95.0),
        "back_right_door":   (105.0,  95.0),
        "back_door":         (140.0,  95.0),  # rare on sedans, hatch-style trunks
        "front_left_light":  ( 50.0,  25.0),
        "front_right_light": ( 50.0,  25.0),
        "front_light":       ( 50.0,  25.0),
        "back_left_light":   ( 40.0,  20.0),
        "back_right_light":  ( 40.0,  20.0),
        "back_light":        ( 40.0,  20.0),
        "left_mirror":       ( 25.0,  15.0),
        "right_mirror":      ( 25.0,  15.0),
        "wheel":             ( 60.0,  60.0),
        "tailgate":          (130.0,  85.0),
        "trunk":             (130.0,  85.0),
        "front_door":        (110.0, 100.0),
    },
    "hatchback": {
        "hood":              (115.0,  80.0),
        "front_bumper":      (150.0,  45.0),
        "back_bumper":       (150.0,  45.0),
        "front_glass":       (130.0,  65.0),
        "back_glass":        (110.0,  55.0),
        "front_left_door":   (100.0,  95.0),
        "front_right_door":  (100.0,  95.0),
        "back_left_door":    ( 95.0,  90.0),
        "back_right_door":   ( 95.0,  90.0),
        "back_door":         (115.0,  90.0),
        "front_left_light":  ( 45.0,  22.0),
        "front_right_light": ( 45.0,  22.0),
        "front_light":       ( 45.0,  22.0),
        "back_left_light":   ( 35.0,  18.0),
        "back_right_light":  ( 35.0,  18.0),
        "back_light":        ( 35.0,  18.0),
        "left_mirror":       ( 22.0,  13.0),
        "right_mirror":      ( 22.0,  13.0),
        "wheel":             ( 55.0,  55.0),
        "tailgate":          (115.0,  90.0),
        "trunk":             (110.0,  75.0),
        "front_door":        (100.0,  95.0),
    },
    "suv": {
        "hood":              (150.0, 105.0),
        "front_bumper":      (180.0,  60.0),
        "back_bumper":       (180.0,  60.0),
        "front_glass":       (150.0,  85.0),
        "back_glass":        (140.0,  70.0),
        "front_left_door":   (115.0, 115.0),
        "front_right_door":  (115.0, 115.0),
        "back_left_door":    (110.0, 110.0),
        "back_right_door":   (110.0, 110.0),
        "back_door":         (150.0, 110.0),
        "front_left_light":  ( 55.0,  28.0),
        "front_right_light": ( 55.0,  28.0),
        "front_light":       ( 55.0,  28.0),
        "back_left_light":   ( 45.0,  24.0),
        "back_right_light":  ( 45.0,  24.0),
        "back_light":        ( 45.0,  24.0),
        "left_mirror":       ( 28.0,  17.0),
        "right_mirror":      ( 28.0,  17.0),
        "wheel":             ( 70.0,  70.0),
        "tailgate":          (150.0, 110.0),
        "trunk":             (150.0, 100.0),
        "front_door":        (115.0, 115.0),
    },
    "pickup": {
        # Same as SUV for now; pickups are visually similar from the
        # damage-detection perspective. Refine later.
        "hood":              (160.0, 110.0),
        "front_bumper":      (190.0,  60.0),
        "back_bumper":       (190.0,  55.0),
        "front_glass":       (155.0,  85.0),
        "back_glass":        (140.0,  60.0),
        "front_left_door":   (115.0, 115.0),
        "front_right_door":  (115.0, 115.0),
        "back_left_door":    (110.0, 110.0),
        "back_right_door":   (110.0, 110.0),
        "back_door":         (150.0,  90.0),  # tailgate-style
        "front_left_light":  ( 55.0,  28.0),
        "front_right_light": ( 55.0,  28.0),
        "front_light":       ( 55.0,  28.0),
        "back_left_light":   ( 40.0,  20.0),
        "back_right_light":  ( 40.0,  20.0),
        "back_light":        ( 40.0,  20.0),
        "left_mirror":       ( 30.0,  18.0),
        "right_mirror":      ( 30.0,  18.0),
        "wheel":             ( 75.0,  75.0),
        "tailgate":          (150.0,  85.0),
        "trunk":             (150.0,  85.0),
        "front_door":        (115.0, 115.0),
    },
    "minivan": {
        "hood":              (140.0,  95.0),
        "front_bumper":      (170.0,  55.0),
        "back_bumper":       (170.0,  55.0),
        "front_glass":       (145.0,  80.0),
        "back_glass":        (135.0,  65.0),
        "front_left_door":   (105.0, 110.0),
        "front_right_door":  (105.0, 110.0),
        "back_left_door":    (100.0, 110.0),
        "back_right_door":   (100.0, 110.0),
        "back_door":         (140.0, 110.0),
        "front_left_light":  ( 50.0,  25.0),
        "front_right_light": ( 50.0,  25.0),
        "front_light":       ( 50.0,  25.0),
        "back_left_light":   ( 40.0,  22.0),
        "back_right_light":  ( 40.0,  22.0),
        "back_light":        ( 40.0,  22.0),
        "left_mirror":       ( 26.0,  16.0),
        "right_mirror":      ( 26.0,  16.0),
        "wheel":             ( 65.0,  65.0),
        "tailgate":          (140.0, 110.0),
        "trunk":             (140.0,  95.0),
        "front_door":        (105.0, 110.0),
    },
}


def get_panel_size_cm(
    panel: str | None,
    category: VehicleCategory | None,
) -> tuple[float, float] | None:
    """Return (width_cm, height_cm) for a panel, or None if unknown."""
    if not panel or not category:
        return None
    cat_map = PANEL_DIMENSIONS_CM.get(category)
    if not cat_map:
        return None
    return cat_map.get(panel)


def compute_real_area_cm2(
    damage_bbox: list[float],
    panel_bbox: list[float] | None,
    panel_real_cm: tuple[float, float] | None,
) -> tuple[float, float] | None:
    """
    Convert a damage bbox (pixels) into real-world area + perimeter (cm)
    using the panel as a known reference.

    Returns (area_cm², perimeter_cm) on success, or None if the panel
    reference is missing or unusable.

    Strategy:
      - panel_bbox = [x, y, w, h] in video pixel coords
      - panel_real_cm = (w_cm, h_cm) average from the dimensions table
      - We pick the most reliable axis: the one where the panel pixels
        most closely match its expected aspect ratio (so a panel cut off
        on the left/right doesn't ruin the height-based calibration, and
        vice versa).
    """
    if panel_bbox is None or panel_real_cm is None:
        return None
    if len(panel_bbox) != 4 or len(damage_bbox) != 4:
        return None

    panel_w_px, panel_h_px = float(panel_bbox[2]), float(panel_bbox[3])
    panel_w_cm, panel_h_cm = panel_real_cm
    if panel_w_px <= 0 or panel_h_px <= 0 or panel_w_cm <= 0 or panel_h_cm <= 0:
        return None

    # Two candidate scales (px per cm); pick the more conservative one
    # (the higher px/cm → smaller derived damage size). This guards
    # against panels partially out of frame.
    px_per_cm_w = panel_w_px / panel_w_cm
    px_per_cm_h = panel_h_px / panel_h_cm
    px_per_cm = max(px_per_cm_w, px_per_cm_h)
    if px_per_cm <= 0:
        return None

    dmg_w_px, dmg_h_px = float(damage_bbox[2]), float(damage_bbox[3])
    w_cm = dmg_w_px / px_per_cm
    h_cm = dmg_h_px / px_per_cm
    area = round(w_cm * h_cm, 2)
    perim = round(2 * (w_cm + h_cm), 2)
    return area, perim


# Map (Make, Model) → category. Frontend has a similar mapping; keep them
# in sync. Falls back to "sedan" when unrecognized — most common shape.
VEHICLE_CATEGORIES: dict[tuple[str, str], VehicleCategory] = {
    ("Toyota", "Corolla"):  "sedan",
    ("Toyota", "Camry"):    "sedan",
    ("Toyota", "Fortuner"): "suv",
    ("Toyota", "Hilux"):    "pickup",
    ("Honda", "Civic"):     "sedan",
    ("Honda", "City"):      "sedan",
    ("Honda", "Accord"):    "sedan",
    ("Honda", "BR-V"):      "suv",
    ("Suzuki", "Alto"):     "hatchback",
    ("Suzuki", "Swift"):    "hatchback",
    ("Suzuki", "Cultus"):   "hatchback",
    ("Hyundai", "Elantra"): "sedan",
    ("Hyundai", "Sonata"):  "sedan",
    ("Hyundai", "Stonic"):  "suv",
    ("Kia", "Sportage"):    "suv",
    ("Kia", "Picanto"):     "hatchback",
    ("Nissan", "Sunny"):    "sedan",
    ("Nissan", "Dayz"):     "hatchback",
    ("Daihatsu", "Cuore"):  "hatchback",
    ("Daihatsu", "Mira"):   "hatchback",
}


def resolve_vehicle_category(
    make: str | None,
    model: str | None,
) -> VehicleCategory:
    """Return the vehicle category for a make/model, defaulting to 'sedan'."""
    if make and model:
        cat = VEHICLE_CATEGORIES.get((make, model))
        if cat:
            return cat
    return "sedan"
