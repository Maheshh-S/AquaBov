import os
import requests
import json
import re
from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
from io import BytesIO
from flask_cors import CORS
from dotenv import load_dotenv
import torch
from waitress import serve  # Production-ready server
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-pro-latest"

app = Flask(__name__)
CORS(app)

# Global model loading (only once at startup)
try:
    logger.info("Loading YOLOv8 model...")
    model = YOLO("best.pt", verbose=False)  # Disable verbose logging
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {str(e)}")
    raise

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

# Image size limits
MAX_IMAGE_SIZE = 1024 * 1024  # 1MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def fetch_gemini_response(prompt):
    """Fetch response from Gemini API with error handling"""
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not found"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        response_data = response.json()

        if "candidates" not in response_data or not response_data["candidates"]:
            return {"error": "No valid response from AI"}

        raw_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Extract JSON if present
        if "```json" in raw_text:
            try:
                json_text = raw_text.split("```json\n")[1].split("\n```")[0]
                return {"suggestions": json.loads(json_text)}
            except (json.JSONDecodeError, IndexError) as e:
                logger.error(f"JSON parsing error: {str(e)}")
                return {"error": "Failed to parse AI response JSON"}
        
        return {"text": raw_text}
    except requests.exceptions.RequestException as e:
        logger.error(f"API request failed: {str(e)}")
        return {"error": f"Failed to fetch response: {str(e)}"}

@app.route("/health")
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route("/predict", methods=["POST"])
def predict():
    """Optimized prediction endpoint"""
    # Validate request
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files["image"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format. Only PNG, JPG, JPEG allowed."}), 400

    # Check image size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_IMAGE_SIZE:
        return jsonify({"error": f"Image too large. Max size is {MAX_IMAGE_SIZE//1024}KB"}), 400

    try:
        # Process image
        image = Image.open(BytesIO(file.read())).convert("RGB")
        
        # Resize large images while maintaining aspect ratio
        max_dim = 640
        if max(image.size) > max_dim:
            ratio = max_dim / max(image.size)
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.LANCZOS)
        
        # Predict with timeout
        results = model.predict(image, conf=0.5, imgsz=max_dim, verbose=False)

        if len(results[0].boxes) == 0:
            return jsonify({"message": "⚠️ Could not confidently identify the breed. Try a clearer image."})

        box = results[0].boxes[0]
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        breed_name = CLASS_NAMES.get(class_id, "Unknown Breed")

        # Extract dimensions
        height_cm = round(float(box.xywh[0][3]), 2)
        width_cm = round(float(box.xywh[0][2]), 2)

        return jsonify({
            "breed": breed_name,
            "confidence": round(confidence, 2),
            "height_cm": height_cm,
            "width_cm": width_cm,
            "message": "✅ Prediction successful!"
        })

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": "Prediction failed", "details": str(e)}), 500

# [Keep your existing /suggest_breeds, /ask, and /nutrition endpoints unchanged]



@app.route("/suggest_breeds", methods=["POST"])
def suggest_breeds():
    """Suggest best breeds for crossbreeding"""
    data = request.json
    detected_breed = data.get("breed")

    if not detected_breed:
        return jsonify({"error": "No breed provided"}), 400

    prompt = f"""
    Suggest the top 5 best cattle breeds to cross with {detected_breed} for strong offspring.
    Provide a JSON response in the format:
    [
        {{"breed": "<breed_name>", "benefit": "<reason>"}},
        ...
    ]
    """
    
    try:
        response = fetch_gemini_response(prompt)  # Get AI-generated suggestions

        # Check if response is already a dictionary (which is common in many API calls)
        if isinstance(response, dict):
            suggestions = response.get("suggestions", [])
        else:
            # If the response is in a different format, handle it (or raise an error)
            return jsonify({"error": "Invalid response format from Gemini"}), 500

        # If the suggestions are in a valid format, return them
        if isinstance(suggestions, list):
            return jsonify({"suggestions": suggestions})

        # If suggestions aren't found or are not in the correct format
        return jsonify({"error": "No valid suggestions found"}), 400

    except Exception as e:
        # Catch any other errors and log them
        return jsonify({"error": f"Error fetching breed suggestions: {str(e)}"}), 500


@app.route("/ask", methods=["POST"])
def chat_support():
    """AI-powered chat support for cattle-related questions"""
    data = request.json
    user_query = data.get("query", "").strip()

    if not user_query:
        return jsonify({"error": "Query cannot be empty"}), 400

    prompt = f"Provide a Precise small length answer as a cattle expert :\n{user_query}"
    response = fetch_gemini_response(prompt)  

    # Ensure response is in a structured format
    ai_text = response.get("text", "No response from AI")

    # Convert response to a bullet-point list
    bullet_points = ai_text.split("\n")  # Split response by new lines
    formatted_response = [f"• {point.strip()}" for point in bullet_points if point.strip()]

    return jsonify({"answer": formatted_response})

@app.route("/nutrition", methods=["POST"])
def nutrition():
    """Provide nutritional recommendations for the detected breed"""
    data = request.json
    breed = data.get("breed")
    
    if not breed:
        return jsonify({"success": False, "error": "Breed not provided"}), 400

    prompt = f"""You are an expert in cattle nutrition. Provide a detailed nutrition plan for a {breed} cow in this exact format:

    Forage:
    - Name: [specific forage type]
    - Amount: [daily amount with units]
    - Description: [1-2 sentence benefit explanation]

    Grain:
    - Name: [specific grain type]
    - Amount: [daily amount with units]
    - Description: [1-2 sentence benefit explanation]

    Liquid:
    - Name: [specific liquid type]
    - Amount: [daily amount with units]
    - Description: [1-2 sentence benefit explanation]

    Supplement:
    - Name: [specific supplement type]
    - Amount: [daily amount with units]
    - Description: [1-2 sentence benefit explanation]

    Include seasonal considerations and use metric units."""

    try:
        response = fetch_gemini_response(prompt)
        
        # Debugging: Print the raw response
        print("Gemini Response:", response)

        if 'error' in response:
            return jsonify({
                "success": False,
                "error": "AI service error",
                "details": response['error']
            }), 500

        if 'text' not in response:
            return jsonify({
                "success": False,
                "error": "No text response from AI",
                "details": str(response)
            }), 500

        # Parse the text response
        plan_data = parse_nutrition_response(response['text'])
        
        return jsonify({
            "success": True,
            "plan": plan_data,
            "breed": breed
        })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to generate nutrition plan",
            "details": str(e)
        }), 500

def parse_nutrition_response(text: str):
    """Parse the nutrition plan from text response"""
    # Initialize with defaults
    plan = {
        "forage": {
            "name": "Alfalfa Hay",
            "amount": "12-15 kg/day",
            "description": "High-quality forage for digestive health"
        },
        "grain": {
            "name": "Mixed Grain Feed",
            "amount": "8-10 kg/day",
            "description": "Balanced grain mix for energy"
        },
        "liquid": {
            "name": "Fresh Water",
            "amount": "80-110 liters/day",
            "description": "Clean water essential for health"
        },
        "supplement": {
            "name": "Mineral Mix",
            "amount": "150-200 g/day",
            "description": "Essential minerals and vitamins"
        }
    }

    # Try to extract information from text
    sections = {
        "forage": extract_section(text, "Forage"),
        "grain": extract_section(text, "Grain"),
        "liquid": extract_section(text, "Liquid"),
        "supplement": extract_section(text, "Supplement")
    }

    # Update plan with extracted data
    for category, section_text in sections.items():
        if section_text:
            name = extract_value(section_text, "Name")
            amount = extract_value(section_text, "Amount")
            description = extract_value(section_text, "Description")
            
            if name:
                plan[category]["name"] = name
            if amount:
                plan[category]["amount"] = amount
            if description:
                plan[category]["description"] = description

    return plan

def extract_section(text: str, section_name: str):
    """Extract a specific section from the response text"""
    pattern = rf"{section_name}:(.*?)(?:\n\n|$)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else None

def extract_value(section_text: str, field_name: str):
    """Extract a specific value from a section"""
    pattern = rf"{field_name}:\s*(.+?)(?:\n|$)"
    match = re.search(pattern, section_text, re.IGNORECASE)
    return match.group(1).strip() if match else None

import os

if __name__ == "__main__":
    # Production server configuration
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"Starting server on port {port}")
    
    # Use Waitress production server
    serve(app, host="0.0.0.0", port=port, threads=4)
