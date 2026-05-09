#!/usr/bin/env python3
"""
Analyze inference logs — PR curves, class distributions, cost drift.

Reads JSONL files produced by inference_logger.py and outputs:
  1. Per-class confidence histograms (for threshold tuning)
  2. Class frequency distribution (drift detection)
  3. Cost distribution by panel/severity (calibration check)
  4. Latency percentiles

Usage:
  python analyze_inference_logs.py --log-dir ../logs
  python analyze_inference_logs.py --log-dir ../logs --since 2026-05-01
  python analyze_inference_logs.py --log-dir ../logs --export csv
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np


def load_jsonl(path: Path) -> list[dict]:
    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def load_all(log_dir: Path, prefix: str, since: str | None = None) -> list[dict]:
    files = sorted(log_dir.glob(f"{prefix}_*.jsonl"))
    if since:
        files = [f for f in files if f.stem.split("_", 1)[1] >= since]
    records = []
    for f in files:
        records.extend(load_jsonl(f))
    return records


def analyze_detections(records: list[dict]) -> None:
    if not records:
        print("No detection records found.")
        return

    print(f"\n{'='*60}")
    print(f"DETECTION LOG ANALYSIS — {len(records)} inference calls")
    print(f"{'='*60}")

    # Flatten all detections
    all_dets = []
    for r in records:
        for d in r.get("detections", []):
            all_dets.append(d)

    total_dets = len(all_dets)
    cache_hits = sum(1 for r in records if r.get("cache_hit"))
    print(f"\nTotal detections: {total_dets}")
    print(f"Cache hit rate: {cache_hits}/{len(records)} ({cache_hits/len(records)*100:.1f}%)")

    # Class distribution
    class_counts = Counter(d["label"] for d in all_dets)
    print("\nClass distribution:")
    for cls, count in class_counts.most_common():
        pct = count / total_dets * 100 if total_dets else 0
        print(f"  {cls:20s} {count:6d} ({pct:5.1f}%)")

    # Confidence distribution per class
    class_confs: dict[str, list[float]] = defaultdict(list)
    for d in all_dets:
        class_confs[d["label"]].append(d["confidence"])

    print("\nConfidence percentiles per class:")
    print(f"  {'class':20s} {'p10':>6s} {'p25':>6s} {'p50':>6s} {'p75':>6s} {'p90':>6s} {'mean':>6s}")
    for cls in sorted(class_confs):
        c = np.array(class_confs[cls])
        p10, p25, p50, p75, p90 = np.percentile(c, [10, 25, 50, 75, 90])
        print(f"  {cls:20s} {p10:6.3f} {p25:6.3f} {p50:6.3f} {p75:6.3f} {p90:6.3f} {c.mean():6.3f}")

    # Latency
    latencies = [r["elapsed_ms"] for r in records if not r.get("cache_hit") and r.get("elapsed_ms", 0) > 0]
    if latencies:
        lat = np.array(latencies)
        p50, p90, p99 = np.percentile(lat, [50, 90, 99])
        print(f"\nInference latency (non-cached): p50={p50:.0f}ms p90={p90:.0f}ms p99={p99:.0f}ms")


def analyze_costs(records: list[dict]) -> None:
    if not records:
        print("No cost records found.")
        return

    print(f"\n{'='*60}")
    print(f"COST LOG ANALYSIS — {len(records)} predictions")
    print(f"{'='*60}")

    costs = np.array([r["cost"] for r in records])
    print(f"\nCost distribution (PKR):")
    print(f"  mean={costs.mean():.0f}  median={np.median(costs):.0f}  "
          f"std={costs.std():.0f}  min={costs.min():.0f}  max={costs.max():.0f}")

    # By model version
    model_counts = Counter(r["model_version"] for r in records)
    print(f"\nModel version split:")
    for mv, count in model_counts.most_common():
        pct = count / len(records) * 100
        subset = [r["cost"] for r in records if r["model_version"] == mv]
        print(f"  {mv}: {count} ({pct:.1f}%) — mean cost {np.mean(subset):.0f}")

    # By severity
    sev_costs: dict[str, list[int]] = defaultdict(list)
    for r in records:
        sev_costs[r["severity"]].append(r["cost"])
    print(f"\nCost by severity:")
    for sev in ["minor", "moderate", "significant", "severe"]:
        if sev in sev_costs:
            c = np.array(sev_costs[sev])
            print(f"  {sev:15s} n={len(c):5d}  mean={c.mean():8.0f}  median={np.median(c):8.0f}")

    # By damage class
    cls_costs: dict[str, list[int]] = defaultdict(list)
    for r in records:
        cls_costs[r["class_name"]].append(r["cost"])
    print(f"\nCost by damage class:")
    for cls in sorted(cls_costs):
        c = np.array(cls_costs[cls])
        print(f"  {cls:20s} n={len(c):5d}  mean={c.mean():8.0f}  median={np.median(c):8.0f}")

    # Scale source distribution
    scale_counts = Counter(r["scale_source"] for r in records)
    print(f"\nScale source distribution:")
    for src, count in scale_counts.most_common():
        print(f"  {src:20s} {count:5d} ({count/len(records)*100:.1f}%)")

    # Unknown features frequency
    unknown_counts = Counter()
    for r in records:
        for uf in r.get("unknown_features", []):
            unknown_counts[uf] += 1
    if unknown_counts:
        print(f"\nUnknown feature frequency:")
        for feat, count in unknown_counts.most_common():
            print(f"  {feat:20s} {count:5d} ({count/len(records)*100:.1f}%)")

    # Interval width analysis
    widths = np.array([r["cost_high"] - r["cost_low"] for r in records])
    print(f"\nPrediction interval width (PKR):")
    print(f"  mean={widths.mean():.0f}  median={np.median(widths):.0f}  "
          f"p90={np.percentile(widths, 90):.0f}")

    # Latency
    latencies = np.array([r["elapsed_ms"] for r in records])
    p50, p90, p99 = np.percentile(latencies, [50, 90, 99])
    print(f"\nCost prediction latency: p50={p50:.0f}ms p90={p90:.0f}ms p99={p99:.0f}ms")


def export_csv(records: list[dict], prefix: str, output_dir: Path) -> None:
    import csv
    out = output_dir / f"{prefix}_export.csv"
    if not records:
        print(f"No {prefix} records to export.")
        return
    keys = list(records[0].keys())
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys, extrasaction="ignore")
        w.writeheader()
        for r in records:
            # Flatten nested fields to strings
            flat = {k: json.dumps(v) if isinstance(v, (list, dict)) else v for k, v in r.items()}
            w.writerow(flat)
    print(f"Exported {len(records)} rows → {out}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze inference logs")
    parser.add_argument("--log-dir", type=Path, default=Path(__file__).parent.parent / "logs")
    parser.add_argument("--since", type=str, default=None, help="Filter logs from this date (YYYY-MM-DD)")
    parser.add_argument("--export", choices=["csv"], default=None, help="Export raw records to CSV")
    args = parser.parse_args()

    if not args.log_dir.exists():
        print(f"Log directory not found: {args.log_dir}", file=sys.stderr)
        sys.exit(1)

    det_records = load_all(args.log_dir, "detection", args.since)
    cost_records = load_all(args.log_dir, "cost", args.since)

    analyze_detections(det_records)
    analyze_costs(cost_records)

    if args.export == "csv":
        export_csv(det_records, "detection", args.log_dir)
        export_csv(cost_records, "cost", args.log_dir)


if __name__ == "__main__":
    main()
