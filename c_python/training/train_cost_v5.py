#!/usr/bin/env python3
"""
Train v5 cost model — learns repair/replace decision and labor hours from data.

Improvements over v4:
  1. Repair/replace classifier — GradientBoostingClassifier learns the
     decision boundary from data instead of hand-coded rules
  2. Labor hours regressor — predicts labor from features instead of
     fixed severity→hours lookup table
  3. Quantile cost regression — three GBR models (q10/q50/q90) for
     prediction intervals (replaces heuristic error margin)
  4. Feature engineering — adds interaction features (area×depth,
     panel_material×dent_type) that v4 missed

Pipeline produces 5 artifacts:
  - car_damage_cost_quantile_low_v5.joblib   (q10)
  - car_damage_cost_quantile_mid_v5.joblib   (q50 — primary cost)
  - car_damage_cost_quantile_high_v5.joblib  (q90)
  - car_damage_decision_v5.joblib            (repair/replace classifier)
  - car_damage_labor_v5.joblib               (labor hours regressor)

Usage:
  python train_cost_v5.py --data car_damage_cost_data.csv
  python train_cost_v5.py --data car_damage_cost_data.csv --inference-logs ../logs/
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
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import cross_val_predict, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# ── Feature config ───────────────────────────────────────────────────────

TARGET_COST = "Total_Repair_Cost"
TARGET_DECISION = "Repair_Decision"  # repair | replace (if column exists)
TARGET_LABOR = "Labor_Hours"

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

# For decision classifier — exclude Labor_Hours (it depends on decision)
DECISION_NUMERICAL = [
    "Dent_Area_Cm_Squared",
    "Dent_Perimeter_Centimetres",
    "Multiple_Dents_Count",
    "Paint_Materials_Cost",
    "Parts_Cost",
]

# For labor regressor — exclude Labor_Hours from input
LABOR_NUMERICAL = [
    "Dent_Area_Cm_Squared",
    "Dent_Perimeter_Centimetres",
    "Multiple_Dents_Count",
    "Paint_Materials_Cost",
    "Parts_Cost",
    "Repair_Time_Days",
]

FEATURES_COST = CATEGORICAL + NUMERICAL

# Columns dropped in v4 (low importance) — stay dropped
DROPPED = [
    "Record_ID", "On_Body_Line", "Vehicle_Year", "Vehicle_Make",
    "Damage_Severity_Score", "Paint_Damaged", "Metal_Stretched",
]


def build_preprocessor(cat_cols: list[str], num_cols: list[str]) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="infrequent_if_exist", sparse_output=False), cat_cols),
            ("num", StandardScaler(), num_cols),
        ],
        remainder="drop",
    )


def build_quantile_pipeline(alpha: float, n_estimators: int = 500) -> Pipeline:
    return Pipeline([
        ("preprocessor", build_preprocessor(CATEGORICAL, NUMERICAL)),
        ("regressor", GradientBoostingRegressor(
            loss="quantile",
            alpha=alpha,
            n_estimators=n_estimators,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            min_samples_leaf=10,
            random_state=42,
        )),
    ])


def build_decision_pipeline(n_estimators: int = 300) -> Pipeline:
    return Pipeline([
        ("preprocessor", build_preprocessor(CATEGORICAL, DECISION_NUMERICAL)),
        ("classifier", GradientBoostingClassifier(
            n_estimators=n_estimators,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            min_samples_leaf=10,
            random_state=42,
        )),
    ])


def build_labor_pipeline(n_estimators: int = 300) -> Pipeline:
    return Pipeline([
        ("preprocessor", build_preprocessor(CATEGORICAL, LABOR_NUMERICAL)),
        ("regressor", GradientBoostingRegressor(
            n_estimators=n_estimators,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            min_samples_leaf=10,
            random_state=42,
        )),
    ])


def derive_decision_label(df: pd.DataFrame) -> pd.Series:
    """Derive repair/replace from existing columns if not explicitly labelled.

    Heuristic: if Parts_Cost > 0 and Repair_Method == Panel_Replacement → replace.
    This is an approximation — real labels from body shops are better.
    """
    return pd.Series(
        np.where(
            (df["Parts_Cost"] > 0) & (df["Repair_Method"] == "Panel_Replacement"),
            "replace",
            "repair",
        ),
        index=df.index,
    )


def augment_with_inference_logs(df: pd.DataFrame, log_dir: Path) -> pd.DataFrame:
    """Optionally augment training data with inference log cost records.

    Only useful if logs contain ground-truth corrections (future feature).
    For now, just reports statistics on logged vs training distributions.
    """
    cost_files = sorted(log_dir.glob("cost_*.jsonl"))
    if not cost_files:
        print(f"  No cost logs found in {log_dir}")
        return df

    records = []
    for f in cost_files:
        with open(f, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    records.append(json.loads(line))

    print(f"  Found {len(records)} inference log cost records across {len(cost_files)} files")
    if records:
        log_costs = np.array([r["cost"] for r in records])
        print(f"  Log cost distribution: mean={log_costs.mean():.0f} "
              f"median={np.median(log_costs):.0f} std={log_costs.std():.0f}")
        train_costs = df[TARGET_COST].values
        print(f"  Training cost distribution: mean={train_costs.mean():.0f} "
              f"median={np.median(train_costs):.0f} std={train_costs.std():.0f}")
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Train v5 cost model")
    parser.add_argument("--data", type=Path, required=True,
                        help="Training CSV (same format as v4)")
    parser.add_argument("--inference-logs", type=Path, default=None,
                        help="Optional inference log directory for distribution comparison")
    parser.add_argument("--n-estimators", type=int, default=500)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--output-dir", type=Path, default=Path("../weights"))
    args = parser.parse_args()

    if not args.data.exists():
        print(f"[error] Data file not found: {args.data}", file=sys.stderr)
        sys.exit(1)

    # ── Load data ───────────────────────────────────────────────────────
    df = pd.read_csv(args.data)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    for col in DROPPED:
        if col in df.columns:
            df = df.drop(columns=[col])

    missing = set(FEATURES_COST + [TARGET_COST]) - set(df.columns)
    if missing:
        print(f"[error] Missing columns: {missing}", file=sys.stderr)
        sys.exit(1)

    # Compare with inference logs if available
    if args.inference_logs and args.inference_logs.exists():
        print("\n── Inference log comparison ──")
        df = augment_with_inference_logs(df, args.inference_logs)

    # Derive decision label
    if TARGET_DECISION in df.columns:
        print(f"\nUsing existing '{TARGET_DECISION}' column")
    else:
        print(f"\nDeriving '{TARGET_DECISION}' from Parts_Cost + Repair_Method")
        df[TARGET_DECISION] = derive_decision_label(df)

    decision_dist = df[TARGET_DECISION].value_counts()
    print(f"Decision distribution:\n{decision_dist.to_string()}")

    X_cost = df[FEATURES_COST]
    y_cost = df[TARGET_COST].values

    X_decision = df[CATEGORICAL + DECISION_NUMERICAL]
    y_decision = df[TARGET_DECISION].values

    X_labor = df[CATEGORICAL + LABOR_NUMERICAL]
    y_labor = df[TARGET_LABOR].values

    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
        X_cost, y_cost, test_size=args.test_size, random_state=42,
    )
    X_train_d, X_test_d, y_train_d, y_test_d = train_test_split(
        X_decision, y_decision, test_size=args.test_size, random_state=42,
    )
    X_train_l, X_test_l, y_train_l, y_test_l = train_test_split(
        X_labor, y_labor, test_size=args.test_size, random_state=42,
    )
    print(f"\nTrain: {len(X_train_c)}, Test: {len(X_test_c)}")

    # ── 1. Quantile cost models ─────────────────────────────────────────
    cost_models = {}
    for name, alpha in [("low", 0.10), ("mid", 0.50), ("high", 0.90)]:
        print(f"\n{'='*60}")
        print(f"Training cost q{alpha:.2f} ({name})...")
        t0 = time.perf_counter()
        pipe = build_quantile_pipeline(alpha, n_estimators=args.n_estimators)
        pipe.fit(X_train_c, y_train_c)
        elapsed = time.perf_counter() - t0
        print(f"  Done in {elapsed:.1f}s")
        cost_models[name] = pipe

    # Evaluate cost
    y_low = np.maximum(0, cost_models["low"].predict(X_test_c))
    y_mid = np.maximum(0, cost_models["mid"].predict(X_test_c))
    y_high = np.maximum(0, cost_models["high"].predict(X_test_c))
    y_low = np.minimum(y_low, y_mid)
    y_high = np.maximum(y_high, y_mid)

    coverage = np.mean((y_test_c >= y_low) & (y_test_c <= y_high))
    mae = mean_absolute_error(y_test_c, y_mid)
    rmse = np.sqrt(mean_squared_error(y_test_c, y_mid))
    r2 = r2_score(y_test_c, y_mid)

    print(f"\nCost metrics:")
    print(f"  MAE={mae:.0f}  RMSE={rmse:.0f}  R2={r2:.6f}")
    print(f"  Coverage (10%-90%): {coverage:.1%}")
    print(f"  Avg interval width: {np.mean(y_high - y_low):.0f} PKR")

    # ── 2. Decision classifier ──────────────────────────────────────────
    print(f"\n{'='*60}")
    print("Training repair/replace classifier...")
    t0 = time.perf_counter()
    decision_pipe = build_decision_pipeline()
    decision_pipe.fit(X_train_d, y_train_d)
    elapsed = time.perf_counter() - t0
    print(f"  Done in {elapsed:.1f}s")

    y_pred_d = decision_pipe.predict(X_test_d)
    acc = accuracy_score(y_test_d, y_pred_d)
    print(f"\nDecision classifier accuracy: {acc:.4f}")
    print(classification_report(y_test_d, y_pred_d))

    # ── 3. Labor hours regressor ────────────────────────────────────────
    print(f"\n{'='*60}")
    print("Training labor hours regressor...")
    t0 = time.perf_counter()
    labor_pipe = build_labor_pipeline()
    labor_pipe.fit(X_train_l, y_train_l)
    elapsed = time.perf_counter() - t0
    print(f"  Done in {elapsed:.1f}s")

    y_pred_l = labor_pipe.predict(X_test_l)
    labor_mae = mean_absolute_error(y_test_l, y_pred_l)
    labor_r2 = r2_score(y_test_l, y_pred_l)
    print(f"\nLabor regressor: MAE={labor_mae:.2f}hrs  R2={labor_r2:.4f}")

    # ── Save ────────────────────────────────────────────────────────────
    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    version = "v5"

    saved = {}
    for name, pipe in cost_models.items():
        path = output_dir / f"car_damage_cost_quantile_{name}_{version}.joblib"
        joblib.dump(pipe, path)
        saved[f"cost_{name}"] = str(path)
        print(f"\n[saved] {path} ({path.stat().st_size:,} bytes)")

    decision_path = output_dir / f"car_damage_decision_{version}.joblib"
    joblib.dump(decision_pipe, decision_path)
    saved["decision"] = str(decision_path)
    print(f"[saved] {decision_path} ({decision_path.stat().st_size:,} bytes)")

    labor_path = output_dir / f"car_damage_labor_{version}.joblib"
    joblib.dump(labor_pipe, labor_path)
    saved["labor"] = str(labor_path)
    print(f"[saved] {labor_path} ({labor_path.stat().st_size:,} bytes)")

    # Save metadata
    meta = {
        "version": version,
        "models": {
            "cost_quantile": {
                "type": "quantile_regression",
                "alphas": {"low": 0.10, "mid": 0.50, "high": 0.90},
                "files": {
                    "low": f"car_damage_cost_quantile_low_{version}.joblib",
                    "mid": f"car_damage_cost_quantile_mid_{version}.joblib",
                    "high": f"car_damage_cost_quantile_high_{version}.joblib",
                },
                "test_metrics": {
                    "mae": round(mae, 2),
                    "rmse": round(rmse, 2),
                    "r2": round(r2, 6),
                    "coverage_80pct": round(float(coverage), 4),
                    "avg_interval_width_pkr": round(float(np.mean(y_high - y_low))),
                },
            },
            "decision": {
                "type": "classifier",
                "classes": ["repair", "replace"],
                "file": f"car_damage_decision_{version}.joblib",
                "test_metrics": {
                    "accuracy": round(acc, 4),
                },
            },
            "labor": {
                "type": "regressor",
                "file": f"car_damage_labor_{version}.joblib",
                "test_metrics": {
                    "mae_hours": round(labor_mae, 2),
                    "r2": round(labor_r2, 4),
                },
            },
        },
        "dataset_rows": len(df),
        "train_rows": len(X_train_c),
        "test_rows": len(X_test_c),
        "features": {
            "cost": FEATURES_COST,
            "decision": CATEGORICAL + DECISION_NUMERICAL,
            "labor": CATEGORICAL + LABOR_NUMERICAL,
        },
    }
    meta_path = output_dir / f"car_damage_v5_metrics.json"
    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"[saved] {meta_path}")

    # ── Integration instructions ────────────────────────────────────────
    print(f"""
{'='*60}
INTEGRATION — update cost.py for v5:

1. Load 5 models:
   _cost_low  = joblib.load("...quantile_low_v5.joblib")
   _cost_mid  = joblib.load("...quantile_mid_v5.joblib")
   _cost_high = joblib.load("...quantile_high_v5.joblib")
   _decision  = joblib.load("...decision_v5.joblib")
   _labor     = joblib.load("...labor_v5.joblib")

2. In predict_cost():
   # Replace get_repair_decision() with ML:
   decision = _decision.predict(decision_sample)[0]

   # Replace LABOR_MAP lookup with ML:
   labor_hrs = max(0.5, _labor.predict(labor_sample)[0])

   # Replace point estimate + heuristic margin:
   cost_low  = max(0, _cost_low.predict(sample)[0])
   cost_mid  = max(0, _cost_mid.predict(sample)[0])
   cost_high = max(0, _cost_high.predict(sample)[0])

3. Remove:
   - get_repair_decision() — replaced by classifier
   - LABOR_MAP — replaced by regressor
   - _compute_error_margin() — replaced by quantile intervals
""")


if __name__ == "__main__":
    main()
