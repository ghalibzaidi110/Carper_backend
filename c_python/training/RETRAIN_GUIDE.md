# Model Retraining Guide

## Parts Segmentation v2

### Prerequisites
```bash
pip install ultralytics>=8.0.0,<9.0.0
```

### Dataset
Download [Carparts Segmentation Dataset](https://universe.roboflow.com/gianmarco-russo-vt9bx/carparts-seg/dataset/4) in YOLOv8 format:
```bash
mkdir -p datasets/carparts-seg
cd datasets/carparts-seg
# Download and extract the dataset here
# Expected structure: train/images/, train/labels/, valid/images/, valid/labels/
```

### Train
```bash
cd training/

# Step 1: Remap labels (drop "object" class, shift IDs)
python train_parts_seg.py --prepare --dataset-dir ../datasets/carparts-seg

# Step 2: Train (100 epochs, ~2-4 hours on GPU)
python train_parts_seg.py --train --dataset-dir ../datasets/carparts-seg

# Step 3: Export to ONNX
python train_parts_seg.py --export --weights runs/segment/carparts-v2/weights/best.pt

# Step 4: Analyze PR curves for threshold tuning
python train_parts_seg.py --analyze --weights runs/segment/carparts-v2/weights/best.pt

# Step 5: Deploy to frontend
python deploy_parts_v2.py \
  --onnx runs/segment/carparts-v2/weights/best.onnx \
  --metrics runs/segment/carparts-v2/carparts_seg_v2_metrics.json \
  --frontend-dir ../../Carper-frontned
```

### Frontend changes after deploy
1. Update `PARTS_MODEL_VERSION` in `part-segmenter.ts` from `"v1"` to `"v2"`
2. Remove `"object"` from `PART_CLASS_KEYS` array
3. Update `SKIP_PART_KEYS` (no longer needed — "object" not in model)
4. Shift class indices for classes after index 18

---

## Cost Model v5

### Prerequisites
```bash
pip install scikit-learn>=1.6,<1.7 pandas joblib
```

### Train (quantile regression only)
```bash
python train_quantile_cost.py --data car_damage_cost_data.csv
```

### Train (full v5 — cost + decision + labor)
```bash
python train_cost_v5.py --data car_damage_cost_data.csv

# With inference log comparison:
python train_cost_v5.py --data car_damage_cost_data.csv --inference-logs ../logs/
```

### Outputs
- `weights/car_damage_cost_quantile_{low,mid,high}_v5.joblib`
- `weights/car_damage_decision_v5.joblib`
- `weights/car_damage_labor_v5.joblib`
- `weights/car_damage_v5_metrics.json`

---

## Inference Log Analysis

After accumulating production logs:
```bash
# Full analysis
python analyze_inference_logs.py --log-dir ../logs

# Filter by date
python analyze_inference_logs.py --log-dir ../logs --since 2026-05-01

# Export to CSV for external tools
python analyze_inference_logs.py --log-dir ../logs --export csv
```

---

## Prometheus Metrics

Scrape endpoint: `GET http://python-service:8000/metrics`

Key metrics:
- `carper_detection_confidence` — histogram by class (threshold tuning)
- `carper_detections_total` — counter by class (drift)
- `carper_cost_predicted_pkr` — histogram by severity (calibration)
- `carper_cost_interval_width_pkr` — histogram (interval quality)
- `carper_detection_latency_ms` — inference speed
- `carper_cost_latency_ms` — cost prediction speed
