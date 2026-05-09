#!/usr/bin/env python3
"""
Train YOLOv8-seg on the Carparts Segmentation Dataset.

Produces a parts-segmentation model (v2) that replaces the v1 ONNX model
used by the frontend part-segmenter. Key improvements over v1:
  - "object" catch-all class removed from training labels
  - Proper train/val split with mAP metrics
  - Tuned confidence threshold from PR curves
  - ONNX export with NMS baked in (matches frontend expectations)

Usage:
  # 1. Prepare dataset (see remap_labels() below)
  python train_parts_seg.py --prepare --dataset-dir ../datasets/carparts-seg

  # 2. Train
  python train_parts_seg.py --train --dataset-dir ../datasets/carparts-seg

  # 3. Export to ONNX
  python train_parts_seg.py --export --weights runs/segment/carparts-v2/weights/best.pt

  # All-in-one:
  python train_parts_seg.py --prepare --train --export --dataset-dir ../datasets/carparts-seg

Requirements:
  pip install ultralytics>=8.0.0,<9.0.0
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

# ── Class mapping ───────────────────────────────────────────────────────────
# v1 model had 23 classes including "object" at index 18.
# v2 drops "object" and shifts indices 19-22 down by 1.

V1_CLASSES = [
    "back_bumper", "back_door", "back_glass", "back_left_door",
    "back_left_light", "back_light", "back_right_door", "back_right_light",
    "front_bumper", "front_door", "front_glass", "front_left_door",
    "front_left_light", "front_light", "front_right_door", "front_right_light",
    "hood", "left_mirror", "object", "right_mirror",
    "tailgate", "trunk", "wheel",
]

DROPPED_CLASS_ID = 18  # "object"

# Build v1→v2 remapping: drop 18, shift 19+ down by 1
V1_TO_V2: dict[int, int | None] = {}
new_id = 0
for old_id, name in enumerate(V1_CLASSES):
    if old_id == DROPPED_CLASS_ID:
        V1_TO_V2[old_id] = None  # drop
    else:
        V1_TO_V2[old_id] = new_id
        new_id += 1

V2_CLASSES = [n for i, n in enumerate(V1_CLASSES) if i != DROPPED_CLASS_ID]
assert len(V2_CLASSES) == 22


def remap_labels(dataset_dir: Path) -> None:
    """Remap label files: drop 'object' annotations, shift class IDs.

    Operates in-place on train/ and valid/ label dirs. Creates backups
    in labels_v1_backup/ before modifying.
    """
    for split in ("train", "valid", "test"):
        label_dir = dataset_dir / split / "labels"
        if not label_dir.exists():
            print(f"[skip] {label_dir} not found")
            continue

        backup_dir = dataset_dir / split / "labels_v1_backup"
        if backup_dir.exists():
            print(f"[skip] {backup_dir} already exists — labels already remapped?")
            continue

        shutil.copytree(label_dir, backup_dir)
        print(f"[backup] {label_dir} → {backup_dir}")

        remapped = 0
        dropped = 0
        for label_file in sorted(label_dir.glob("*.txt")):
            lines = label_file.read_text().strip().splitlines()
            new_lines: list[str] = []
            for line in lines:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue
                old_cls = int(parts[0])
                new_cls = V1_TO_V2.get(old_cls)
                if new_cls is None:
                    dropped += 1
                    continue
                parts[0] = str(new_cls)
                new_lines.append(" ".join(parts))
            label_file.write_text("\n".join(new_lines) + "\n" if new_lines else "")
            remapped += 1

        print(f"[{split}] remapped {remapped} files, dropped {dropped} 'object' annotations")


def train(dataset_dir: Path, epochs: int = 100, imgsz: int = 640, batch: int = 16) -> Path:
    """Train YOLOv8-seg on the remapped dataset."""
    from ultralytics import YOLO

    yaml_path = Path(__file__).parent / "carparts_seg.yaml"
    if not yaml_path.exists():
        print(f"[error] Dataset config not found: {yaml_path}", file=sys.stderr)
        sys.exit(1)

    # Start from pretrained YOLOv8n-seg (smallest, fastest for panel detection)
    model = YOLO("yolov8n-seg.pt")

    results = model.train(
        data=str(yaml_path),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project="runs/segment",
        name="carparts-v2",
        exist_ok=True,
        # Augmentation tuned for car panels:
        # - Moderate mosaic (panels need spatial context)
        # - Mild hsv shifts (paint colors vary)
        # - Horizontal flip (left/right doors swap → fine for seg)
        # - No vertical flip (cars aren't upside down)
        mosaic=0.7,
        hsv_h=0.015,
        hsv_s=0.5,
        hsv_v=0.3,
        flipud=0.0,
        fliplr=0.5,
        # Mixed precision for speed
        amp=True,
        # Patience for early stopping
        patience=15,
        # Save best + last
        save=True,
        save_period=-1,
        # Validation
        val=True,
    )

    best_path = Path("runs/segment/carparts-v2/weights/best.pt")
    print(f"\n[done] Best weights: {best_path}")
    print(f"[done] Results: runs/segment/carparts-v2/")

    # Save metrics summary
    _save_metrics(results, best_path.parent.parent)

    return best_path


def _save_metrics(results, run_dir: Path) -> None:
    """Save key metrics to JSON for version tracking."""
    try:
        metrics = {
            "version": "v2",
            "classes": V2_CLASSES,
            "num_classes": len(V2_CLASSES),
            "dropped_classes": ["object"],
            "architecture": "YOLOv8n-seg",
            "input_size": 640,
        }

        # Extract metrics if available
        if hasattr(results, "results_dict"):
            rd = results.results_dict
            metrics["metrics"] = {
                "mAP50": round(rd.get("metrics/mAP50(B)", 0), 4),
                "mAP50_95": round(rd.get("metrics/mAP50-95(B)", 0), 4),
                "mAP50_mask": round(rd.get("metrics/mAP50(M)", 0), 4),
                "mAP50_95_mask": round(rd.get("metrics/mAP50-95(M)", 0), 4),
                "precision": round(rd.get("metrics/precision(B)", 0), 4),
                "recall": round(rd.get("metrics/recall(B)", 0), 4),
            }

        metrics_path = run_dir / "carparts_seg_v2_metrics.json"
        metrics_path.write_text(json.dumps(metrics, indent=2))
        print(f"[metrics] Saved to {metrics_path}")
    except Exception as e:
        print(f"[warn] Could not save metrics: {e}")


def export_onnx(weights_path: Path, imgsz: int = 640) -> Path:
    """Export trained model to ONNX with NMS baked in.

    The frontend part-segmenter.ts expects:
      - Input: [1, 3, 640, 640] float32
      - Output (post-NMS): [1, 300, 38] = bbox(4) + conf(1) + cls(1) + mask_coefs(32)
    """
    from ultralytics import YOLO

    model = YOLO(str(weights_path))

    onnx_path = model.export(
        format="onnx",
        imgsz=imgsz,
        simplify=True,
        opset=17,
        # NMS baked into ONNX graph — matches frontend expectations
        nms=True,
        # Max 300 detections post-NMS (matches v1)
        max_det=300,
    )

    print(f"\n[export] ONNX model: {onnx_path}")
    print(f"[export] Copy to frontend: cp {onnx_path} <frontend>/public/models/parts.v2.onnx")

    return Path(onnx_path)


def analyze_pr_curves(weights_path: Path, dataset_dir: Path) -> None:
    """Run validation and print per-class metrics for threshold tuning.

    After training, use this to determine optimal CONF_THRESHOLD for
    part-segmenter.ts (replacing the current blanket 0.10).
    """
    from ultralytics import YOLO

    yaml_path = Path(__file__).parent / "carparts_seg.yaml"
    model = YOLO(str(weights_path))

    results = model.val(
        data=str(yaml_path),
        imgsz=640,
        conf=0.001,  # low threshold to get full PR curve
        iou=0.5,
        plots=True,  # generates PR curve plots
        save_json=True,
    )

    print("\n[PR] Per-class AP50:")
    if hasattr(results, "ap_class_index") and hasattr(results, "maps"):
        for i, cls_idx in enumerate(results.ap_class_index):
            name = V2_CLASSES[cls_idx] if cls_idx < len(V2_CLASSES) else f"cls_{cls_idx}"
            ap50 = results.maps[i] if i < len(results.maps) else 0
            print(f"  {name:25s} AP50={ap50:.4f}")

    print("\n[PR] Check runs/segment/val/ for PR curve plots.")
    print("[PR] Use per-class F1-optimal thresholds to update CONF_THRESHOLD in part-segmenter.ts")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YOLOv8-seg parts model v2")
    parser.add_argument("--prepare", action="store_true",
                        help="Remap labels: drop 'object' class, shift IDs")
    parser.add_argument("--train", action="store_true",
                        help="Train YOLOv8n-seg on Carparts Segmentation Dataset")
    parser.add_argument("--export", action="store_true",
                        help="Export best.pt to ONNX with NMS")
    parser.add_argument("--analyze", action="store_true",
                        help="Run validation + PR curves for threshold tuning")
    parser.add_argument("--dataset-dir", type=Path, default=Path("../datasets/carparts-seg"),
                        help="Path to Carparts Segmentation Dataset root")
    parser.add_argument("--weights", type=Path,
                        default=Path("runs/segment/carparts-v2/weights/best.pt"),
                        help="Path to trained weights (for --export / --analyze)")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)

    args = parser.parse_args()

    if not any([args.prepare, args.train, args.export, args.analyze]):
        parser.print_help()
        sys.exit(1)

    if args.prepare:
        print("=" * 60)
        print("STEP 1: Remap labels (drop 'object' class)")
        print("=" * 60)
        remap_labels(args.dataset_dir)

    if args.train:
        print("\n" + "=" * 60)
        print("STEP 2: Train YOLOv8n-seg")
        print("=" * 60)
        best = train(args.dataset_dir, epochs=args.epochs, imgsz=args.imgsz, batch=args.batch)
        args.weights = best

    if args.export:
        print("\n" + "=" * 60)
        print("STEP 3: Export to ONNX")
        print("=" * 60)
        export_onnx(args.weights, imgsz=args.imgsz)

    if args.analyze:
        print("\n" + "=" * 60)
        print("STEP 4: PR curve analysis")
        print("=" * 60)
        analyze_pr_curves(args.weights, args.dataset_dir)


if __name__ == "__main__":
    main()
