import os
import requests
import cv2
import numpy as np
from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image
from io import BytesIO
from flask_cors import CORS
import re  # Add this with other imports at the top
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-pro-latest"

app = Flask(__name__)
CORS(app)
# Load YOLOv8 model
model = YOLO("best.pt")

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


import json

def fetch_gemini_response(prompt):
    """Fetch response from Gemini API and process correctly"""
    if not GEMINI_API_KEY:
        return {"error": "Gemini API key not found"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        response = requests.post(url, headers=headers, json=payload)
        response_data = response.json()

        if "candidates" in response_data and response_data["candidates"]:
            raw_text = response_data["candidates"][0]["content"]["parts"][0]["text"]
            
            # Check if the response contains a JSON block
            if "```json" in raw_text:
                try:
                    json_text = raw_text.split("```json\n")[1].split("\n```")[0]  # Extract JSON part
                    parsed_data = json.loads(json_text)  # Convert string to JSON
                    return {"suggestions": parsed_data}  # Wrap in a dictionary
                except (json.JSONDecodeError, IndexError):
                    return {"error": "Failed to parse AI response JSON"}
            
            return {"text": raw_text}  # Return as plain text if not JSON
        return {"error": "No valid response from AI"}
    except Exception as e:
        return {"error": f"Failed to fetch response: {str(e)}"}



@app.route("/")
def home():
    return "AquaBov API is Running!"


@app.route("/predict", methods=["POST"])
def predict():
    """Predict cattle breed from image"""
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    if file.filename == "" or not file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        return jsonify({"error": "Invalid file format. Only PNG, JPG, JPEG allowed."}), 400

    image = Image.open(BytesIO(file.read())).convert("RGB")
    results = model.predict(image, conf=0.5)

    if len(results[0].boxes) == 0:
        return jsonify({"message": "⚠️ Could not confidently identify the breed. Try a clearer image."})

    box = results[0].boxes[0]
    class_id = int(box.cls[0])
    confidence = float(box.conf[0])
    breed_name = CLASS_NAMES.get(class_id, "Unknown Breed")

    # Extract height and width from YOLO model
    height_cm = round(float(box.xywh[0][3]), 2)  # Height from bounding box
    width_cm = round(float(box.xywh[0][2]), 2)   # Width from bounding box

    return jsonify({
        "breed": breed_name,
        "confidence": round(confidence, 2),
        "height_cm": height_cm,
        "width_cm": width_cm,
        "message": "✅ Prediction successful! Ensure a clear image for better accuracy."
    })


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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
