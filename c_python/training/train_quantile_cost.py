#!/usr/bin/env python3
"""
Train quantile regression cost model — outputs honest prediction intervals
instead of point estimates with heuristic margins.

Trains three GradientBoostingRegressors (alpha=0.10, 0.50, 0.90) on the
same dataset as v4, producing a 80% prediction interval:
  - q10 model → costLow  (10th percentile)
  - q50 model → cost     (median, more robust than mean)
  - q90 model → costHigh (90th percentile)

The resulting pipeline replaces the heuristic `_compute_error_margin()`
in cost.py with statistically grounded intervals that widen naturally
for uncertain regions of the feature space.

Usage:
  python train_quantile_cost.py --data car_damage_cost_data.csv
  python train_quantile_cost.py --data car_damage_cost_data.csv --alphas 0.05 0.50 0.95

Requirements:
  pip install scikit-learn>=1.6 pandas joblib
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_predict, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# ── Feature config (matches v4) ────────────────────────────────────────────

TARGET = "Total_Repair_Cost"

CATEGORICAL = [
    "Vehicle_Model",
    "Panel_Location",
    "Panel_Material",
    "Dent_Type",
    "Dent_Depth",
    "Repair_Method",
]

NUMERICAL = [
    "Dent_Area_Cm_Squared",
    "Dent_Perimeter_Centimetres",
    "Multiple_Dents_Count",
    "Labor_Hours",
    "Paint_Materials_Cost",
    "Parts_Cost",
    "Repair_Time_Days",
]

FEATURES = CATEGORICAL + NUMERICAL

# Features dropped from v1→v4 (low importance). Keep dropped for v5-quantile.
DROPPED = [
    "Record_ID", "On_Body_Line", "Vehicle_Year", "Vehicle_Make",
    "Damage_Severity_Score", "Paint_Damaged", "Metal_Stretched",
]


def build_pipeline(alpha: float, n_estimators: int = 500) -> Pipeline:
    """Build a quantile regression pipeline for a given alpha."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="infrequent_if_exist", sparse_output=False), CATEGORICAL),
            ("num", StandardScaler(), NUMERICAL),
        ],
        remainder="drop",
    )

    model = GradientBoostingRegressor(
        loss="quantile",
        alpha=alpha,
        n_estimators=n_estimators,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=10,
        random_state=42,
    )

    return Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", model),
    ])


def evaluate(y_true: np.ndarray, y_low: np.ndarray, y_mid: np.ndarray, y_high: np.ndarray) -> dict:
    """Compute metrics for quantile predictions."""
    # Coverage: fraction of true values within [q_low, q_high]
    coverage = np.mean((y_true >= y_low) & (y_true <= y_high))

    # Interval width (average)
    avg_width = np.mean(y_high - y_low)
    median_width = np.median(y_high - y_low)

    # Point estimate quality (median model)
    mae = mean_absolute_error(y_true, y_mid)
    rmse = np.sqrt(mean_squared_error(y_true, y_mid))
    r2 = r2_score(y_true, y_mid)

    # Pinball losses for each quantile
    def pinball(y, yhat, alpha):
        diff = y - yhat
        return np.mean(np.where(diff >= 0, alpha * diff, (alpha - 1) * diff))

    return {
        "coverage": round(float(coverage), 4),
        "avg_interval_width_pkr": round(float(avg_width)),
        "median_interval_width_pkr": round(float(median_width)),
        "median_mae_pkr": round(float(mae), 2),
        "median_rmse_pkr": round(float(rmse), 2),
        "median_r2": round(float(r2), 6),
        "pinball_low": round(float(pinball(y_true, y_low, 0.10)), 2),
        "pinball_mid": round(float(pinball(y_true, y_mid, 0.50)), 2),
        "pinball_high": round(float(pinball(y_true, y_high, 0.90)), 2),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train quantile cost model")
    parser.add_argument("--data", type=Path, required=True,
                        help="Path to training CSV (same as v4)")
    parser.add_argument("--alphas", nargs=3, type=float, default=[0.10, 0.50, 0.90],
                        help="Three quantile alphas: low median high (default: 0.10 0.50 0.90)")
    parser.add_argument("--n-estimators", type=int, default=500)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--output-dir", type=Path, default=Path("../weights"))
    args = parser.parse_args()

    if not args.data.exists():
        print(f"[error] Data file not found: {args.data}", file=sys.stderr)
        sys.exit(1)

    alpha_low, alpha_mid, alpha_high = args.alphas
    print(f"Quantiles: {alpha_low}, {alpha_mid}, {alpha_high}")
    print(f"Data: {args.data}")

    # ── Load data ───────────────────────────────────────────────────────────
    df = pd.read_csv(args.data)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    # Drop features pruned in v4
    for col in DROPPED:
        if col in df.columns:
            df = df.drop(columns=[col])

    # Verify required columns
    missing = set(FEATURES + [TARGET]) - set(df.columns)
    if missing:
        print(f"[error] Missing columns: {missing}", file=sys.stderr)
        sys.exit(1)

    X = df[FEATURES]
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42,
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")

    # ── Train three quantile models ─────────────────────────────────────────
    models = {}
    for name, alpha in [("low", alpha_low), ("mid", alpha_mid), ("high", alpha_high)]:
        print(f"\n{'='*60}")
        print(f"Training q{alpha:.2f} ({name})...")
        t0 = time.perf_counter()
        pipe = build_pipeline(alpha, n_estimators=args.n_estimators)
        pipe.fit(X_train, y_train)
        elapsed = time.perf_counter() - t0
        print(f"  Done in {elapsed:.1f}s")
        models[name] = pipe

    # ── Evaluate ────────────────────────────────────────────────────────────
    y_low = np.maximum(0, models["low"].predict(X_test))
    y_mid = np.maximum(0, models["mid"].predict(X_test))
    y_high = np.maximum(0, models["high"].predict(X_test))

    # Enforce monotonicity: low <= mid <= high
    y_low = np.minimum(y_low, y_mid)
    y_high = np.maximum(y_high, y_mid)

    metrics = evaluate(y_test, y_low, y_mid, y_high)
    print(f"\n{'='*60}")
    print("Test metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    # ── Compare with v4 point estimate ──────────────────────────────────────
    print(f"\n  v4 comparison: MAE={2789} RMSE={3564} R2={0.9853}")
    print(f"  Quantile:      MAE={metrics['median_mae_pkr']} RMSE={metrics['median_rmse_pkr']} R2={metrics['median_r2']}")
    print(f"  Coverage ({alpha_low:.0%}–{alpha_high:.0%}): {metrics['coverage']:.1%}")

    # ── Save ────────────────────────────────────────────────────────────────
    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    version = "v5q"
    for name, pipe in models.items():
        path = output_dir / f"car_damage_cost_quantile_{name}_{version}.joblib"
        joblib.dump(pipe, path)
        print(f"\n[saved] {path} ({path.stat().st_size:,} bytes)")

    # Save metrics
    meta = {
        "version": version,
        "type": "quantile_regression",
        "alphas": {"low": alpha_low, "mid": alpha_mid, "high": alpha_high},
        "dataset_rows": len(df),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "features": FEATURES,
        "categorical_features": CATEGORICAL,
        "numerical_features": NUMERICAL,
        "n_estimators": args.n_estimators,
        "test_metrics": metrics,
        "model_files": {
            "low": f"car_damage_cost_quantile_low_{version}.joblib",
            "mid": f"car_damage_cost_quantile_mid_{version}.joblib",
            "high": f"car_damage_cost_quantile_high_{version}.joblib",
        },
    }
    meta_path = output_dir / f"car_damage_cost_quantile_metrics_{version}.json"
    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"[saved] {meta_path}")

    # ── Integration instructions ────────────────────────────────────────────
    print(f"""
{'='*60}
INTEGRATION — replace heuristic margins in cost.py:

1. Load three models instead of one:
   _model_low  = joblib.load("...quantile_low_{version}.joblib")
   _model_mid  = joblib.load("...quantile_mid_{version}.joblib")
   _model_high = joblib.load("...quantile_high_{version}.joblib")

2. In predict_cost(), replace:
   predicted = model.predict(sample)[0]
   error_margin = _compute_error_margin(predicted, unknown_features)

   With:
   cost_low  = max(0, _model_low.predict(sample)[0])
   cost_mid  = max(0, _model_mid.predict(sample)[0])
   cost_high = max(0, _model_high.predict(sample)[0])
   # Enforce monotonicity
   cost_low  = min(cost_low, cost_mid)
   cost_high = max(cost_high, cost_mid)

3. Response:
   "cost": round(cost_mid),
   "costLow": round(cost_low),
   "costHigh": round(cost_high),

4. Remove _compute_error_margin() — no longer needed.

5. The unknown-feature widening can stay as a multiplier on the
   interval width: width *= (1 + 0.15 * len(unknowns))
""")


if __name__ == "__main__":
    main()
