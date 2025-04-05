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
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Create Modal app
modal_app = modal.App("aquabov-backend")

# Custom Docker image with all required dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "libgl1",
        "libglib2.0-0",
        "libsm6",
        "libxrender1",
        "libxext6"
    )
    .pip_install(
        "opencv-python-headless==4.9.0.80",
        "ultralytics==8.2.27",
        "pillow==10.3.0",
        "fastapi==0.111.0",
        "python-dotenv==1.0.1",
        "requests==2.32.3"
    )
    .add_local_file("best.pt", "/root/best.pt")
)

# Model Class with updated Modal parameters
@modal_app.cls(
    image=image,
    gpu="T4",
    timeout=300,
    min_containers=1  # Updated from keep_warm
)
class Predictor:
    def __enter__(self):
        try:
            logger.info("Loading YOLO model...")
            self.model = YOLO("/root/best.pt")
            self.model.fuse()
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Model loading failed: {str(e)}")
            raise

    def predict(self, image_bytes: bytes):
        try:
            img = Image.open(io.BytesIO(image_bytes))
            
            # Optimized image processing
            max_dim = 640
            if max(img.size) > max_dim:
                ratio = max_dim / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.LANCZOS)
            
            results = self.model(img, verbose=False)
            
            if not results[0].boxes:
                return {"error": "No cattle detected"}
                
            box = results[0].boxes[0]
            return {
                "breed": CLASS_NAMES.get(int(box.cls[0]), "Unknown"),
                "confidence": round(float(box.conf[0]), 4),
                "dimensions": {
                    "height_cm": round(float(box.xywh[0][3]), 2),
                    "width_cm": round(float(box.xywh[0][2]), 2)
                }
            }
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return {"error": str(e)}

# Health endpoint
@app.get("/health")
async def health():
    return {
        "status": "ready",
        "timestamp": datetime.now().isoformat()
    }

# Prediction endpoint with improved error handling
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        raise HTTPException(400, "Only JPG/PNG images allowed")

    try:
        # Limit to 2MB
        max_size = 2 * 1024 * 1024
        contents = await file.read()
        if len(contents) > max_size:
            raise HTTPException(413, f"Image exceeds {max_size//1024}KB limit")
        
        predictor = Predictor()
        result = await predictor.predict.call(contents)
        
        if "error" in result:
            raise HTTPException(400, result["error"])
            
        return {
            "status": "success",
            **result
        }
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        raise HTTPException(500, str(e))

# Breed suggestion endpoint
@app.post("/suggest_breeds")
async def suggest_breeds(data: dict):
    if not data.get("breed"):
        raise HTTPException(400, "Breed parameter is required")
    
    prompt = f"""Suggest top 5 cattle breeds to cross with {data['breed']}:
    Output in this exact JSON format:
    ```json
    [
        {{"breed": "Breed1", "benefit": "Reason1"}},
        {{"breed": "Breed2", "benefit": "Reason2"}}
    ]
    ```"""
    
    response = fetch_gemini_response(prompt)
    if "error" in response:
        raise HTTPException(502, f"AI service error: {response['error']}")
    
    try:
        suggestions = response if isinstance(response, list) else json.loads(response["text"])
        return {"suggestions": suggestions[:5]}
    except Exception as e:
        raise HTTPException(500, f"Failed to parse suggestions: {str(e)}")

def fetch_gemini_response(prompt: str) -> Dict:
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not found"}
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key={GEMINI_API_KEY}"
    try:
        response = requests.post(
            url, 
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if "```json" in text:
            try:
                json_text = text.split("```json")[1].split("```")[0].strip()
                return json.loads(json_text)
            except json.JSONDecodeError:
                return {"text": text}
        return {"text": text}
    except Exception as e:
        return {"error": str(e)}

# Modal ASGI App with updated parameters
@modal_app.function(
    image=image,
    max_containers=2  # Updated from concurrency_limit
)
@modal.asgi_app()
def wrapper():
    return app