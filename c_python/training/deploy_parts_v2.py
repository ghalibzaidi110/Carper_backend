#!/usr/bin/env python3
"""
Deploy parts-seg v2 model to frontend.

After training + ONNX export, this script:
  1. Copies the ONNX file to frontend/public/models/parts.v2.onnx
  2. Updates parts.v1.json → parts.v2.json with new metadata
  3. Prints the part-segmenter.ts changes needed

Usage:
  python deploy_parts_v2.py \
    --onnx runs/segment/carparts-v2/weights/best.onnx \
    --metrics runs/segment/carparts-v2/carparts_seg_v2_metrics.json \
    --frontend-dir ../../Carper-frontned
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

V2_CLASSES = [
    "back_bumper", "back_door", "back_glass", "back_left_door",
    "back_left_light", "back_light", "back_right_door", "back_right_light",
    "front_bumper", "front_door", "front_glass", "front_left_door",
    "front_left_light", "front_light", "front_right_door", "front_right_light",
    "hood", "left_mirror", "right_mirror",
    "tailgate", "trunk", "wheel",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Deploy parts-seg v2 to frontend")
    parser.add_argument("--onnx", type=Path, required=True, help="Path to exported ONNX file")
    parser.add_argument("--metrics", type=Path, help="Path to metrics JSON (optional)")
    parser.add_argument("--frontend-dir", type=Path, default=Path("../../Carper-frontned"))
    args = parser.parse_args()

    if not args.onnx.exists():
        print(f"[error] ONNX file not found: {args.onnx}", file=sys.stderr)
        sys.exit(1)

    models_dir = args.frontend_dir / "public" / "models"
    if not models_dir.exists():
        print(f"[error] Frontend models dir not found: {models_dir}", file=sys.stderr)
        sys.exit(1)

    # 1. Copy ONNX
    dest_onnx = models_dir / "parts.v2.onnx"
    shutil.copy2(args.onnx, dest_onnx)
    onnx_size = dest_onnx.stat().st_size
    print(f"[copy] {args.onnx} → {dest_onnx} ({onnx_size:,} bytes)")

    # 2. Write metadata JSON
    meta = {
        "name": "parts-segmenter",
        "version": "v2",
        "format": "ONNX",
        "architecture": "YOLOv8n-seg with NMS baked in at export",
        "inputSize": [640, 640],
        "outputShape": "[1, 300, 38]  bbox(4)+conf(1)+cls(1)+mask_coefs(32)",
        "classes": V2_CLASSES,
        "fileSize": onnx_size,
        "fileSizeHuman": f"{onnx_size / 1_000_000:.1f} MB",
        "trainedOn": "Carparts Segmentation Dataset",
        "changes": [
            "Removed 'object' catch-all class (was index 18)",
            "22 classes (down from 23)",
            "Proper train/val split with mAP metrics",
            "Trained from yolov8n-seg.pt pretrained base",
        ],
    }

    if args.metrics and args.metrics.exists():
        train_metrics = json.loads(args.metrics.read_text())
        meta["evaluation"] = train_metrics.get("metrics", {})

    meta_path = models_dir / "parts.v2.json"
    meta_path.write_text(json.dumps(meta, indent=2))
    print(f"[meta] Written {meta_path}")

    # 3. Print required code changes
    print("\n" + "=" * 60)
    print("MANUAL CODE CHANGES NEEDED in part-segmenter.ts:")
    print("=" * 60)
    print("""
1. Update PARTS_MODEL_VERSION:
   - export const PARTS_MODEL_VERSION = "v2";

2. Replace PART_CLASS_KEYS (remove "object" at index 18):
   export const PART_CLASS_KEYS = [
     "back_bumper", "back_door", "back_glass", "back_left_door",
     "back_left_light", "back_light", "back_right_door", "back_right_light",
     "front_bumper", "front_door", "front_glass", "front_left_door",
     "front_left_light", "front_light", "front_right_door", "front_right_light",
     "hood", "left_mirror", "right_mirror",
     "tailgate", "trunk", "wheel",
   ] as const;

3. Remove from PART_DISPLAY:
   - Delete: object: "Other",

4. Remove SKIP_PART_KEYS (no longer needed — "object" not in model):
   - Delete the SKIP_PART_KEYS constant
   - Remove the SKIP_PART_KEYS check in the detection loop

5. Update CONF_THRESHOLD based on PR curve analysis:
   - Run: python train_parts_seg.py --analyze --weights <best.pt>
   - Use F1-optimal threshold from PR curves

6. Delete old model file:
   - rm public/models/parts.v1.onnx
   - rm public/models/parts.v1.json
""")


if __name__ == "__main__":
    main()
