import modal
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import os
from dotenv import load_dotenv
import requests
import json
from typing import Dict

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Cattle breed class names
CLASS_NAMES = {
    0: "Alambadi", 1: "Amrit Mahal", 2: "Banni", 3: "Bargur", 4: "Brown Swiss",
    5: "Dangi", 6: "Deoni", 7: "Gir", 8: "Guernsey", 9: "Hallikar",
    10: "Hariana", 11: "Holstein Friesian", 12: "Jaffarabadi", 13: "Jersey", 14: "Kangayam",
    15: "Kankrej", 16: "Kasaragod", 17: "Khillari", 18: "Malnad Gidda", 19: "Nagori",
    20: "Nagpuri", 21: "Nili-Ravi", 22: "Nimari", 23: "Ongole", 24: "Pulikulam",
    25: "Red Dane", 26: "Red Sindhi", 27: "Sahiwal", 28: "Tharparkar", 29: "Toda",
    30: "Umblachery", 31: "Vechur"
}

# Create Modal app (using new App instead of Stub)
modal_app = modal.App("aquabov-backend")

# Custom Docker image
image = (
    modal.Image.debian_slim()
    .pip_install(
        "python-multipart",
        "ultralytics",
        "pillow",
        "fastapi",
        "python-dotenv",
        "requests"
    )
    .add_local_file("best.pt", "/root/best.pt")
)

# Model Class
@modal_app.cls(image=image, gpu="T4", timeout=300)
class Predictor:
    def __enter__(self):
        self.model = YOLO("/root/best.pt")
        self.model.fuse()
        
    def predict(self, image_bytes: bytes):
        img = Image.open(io.BytesIO(image_bytes))
        results = self.model(img)
        box = results[0].boxes[0]
        return {
            "breed": CLASS_NAMES[int(box.cls[0])],
            "confidence": float(box.conf[0]),
            "height_cm": round(float(box.xywh[0][3]), 2),
            "width_cm": round(float(box.xywh[0][2]), 2)
        }

# Helper Functions
def fetch_gemini_response(prompt: str) -> Dict:
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not found"}
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key={GEMINI_API_KEY}"
    try:
        response = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
        response.raise_for_status()
        data = response.json()
        return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    except Exception as e:
        return {"error": str(e)}

# FastAPI Endpoints
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "Only images allowed")
    
    try:
        contents = await file.read()
        predictor = Predictor()
        result = await predictor.predict.call(contents)
        return {"message": "✅ Prediction successful!", **result}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/suggest_breeds")
async def suggest_breeds(data: dict):
    prompt = f"""Suggest top 5 cattle breeds to cross with {data.get('breed')}:
    [{{"breed": "<name>", "benefit": "<reason>"}}]"""
    response = fetch_gemini_response(prompt)
    return {"suggestions": json.loads(response.split("```json")[1].split("```")[0])}

@app.get("/health")
def health():
    return {"status": "healthy"}

# Modal ASGI App
@modal_app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    return app