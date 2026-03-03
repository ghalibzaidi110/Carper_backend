# Damage Detection Service (Python)

FastAPI service used by the Nest backend for car damage detection. Nest calls `DAMAGE_DETECTION_SERVICE_URL` (default `http://localhost:8000`).

## Setup

1. **Create virtual env and install deps**
   ```bash
   cd c_python
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```

2. **Model**
   - The app uses `weights/best.pt` inside `c_python/` (copy from `yolov8n_balanced/weights/best.pt` if setting up elsewhere).

3. **Env**
   - Copy `.env.example` to `.env`. `MODEL_PATH` defaults to `weights/best.pt`.
   - Nest expects this service at `http://localhost:8000` by default.

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
# or
python -m app.main
```

- **Health:** `GET /health`
- **Detect:** `POST /detect` with body `{ "image_url": "https://..." }`  
  Response: `{ "has_damage", "confidence", "detections", "processed_image_url" }`.  
  `processed_image_url` is the **annotated image** (same image with damage boxes and labels drawn), as a base64 data URL.

Without `MODEL_PATH`, the API returns stub responses so Nest can run end-to-end.
