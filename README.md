# 🌊🐄 AquaBov – AI-Powered Cattle Breed Detection & Smart Assistance

![AquaBov Logo](frontend/public/images/cow-logo.png)

🔗 **[Live Demo](https://aqua-bov.vercel.app/)** | 🐝 **[Project Repository](https://github.com/Maheshh-S/AquaBov/)** | 💡 **Empowering Farmers with AI**

---

## 🚀 Introduction

**AquaBov** is an **AI-powered cattle breed detection and advisory platform** built to make **AI accessible to farmers**. By simply uploading a **photo**, farmers can:

✅ **Identify their cattle's breed** with a **custom-trained machine learning model** (trained on 4,500+ images)  
✅ **Receive smart breeding suggestions** to improve yield and cattle health  
✅ **Chat in real-time** with **Dr. Moo**, an AI-powered cattle assistant  
✅ **Get personalized nutrition plans** based on breed, age, weight, and local weather  

### 🌟 Why AquaBov?
- 🔄 **Bridging AI & Agriculture** – Bringing data-driven tools to empower farmers
- 🌍 **Real-World Impact** – Better cattle health and improved productivity
- 🎨 **User-Centered Design** – Clean interface tailored for rural users

---

## 💡 How It Works

### 🗘️ Step-by-Step Flow
```mermaid
graph TD;
    A["Upload Cow Image"] --> B["Preprocessing Layer"]
    B --> C["Breed Detection Model"]
    C -->|"Prediction"| D["MongoDB - Breed Data Storage"]
    D --> E["Breeding Suggestion Engine (Gemini AI)"]
    D --> F["Nutrition Planner - Weather + Breed Data"]
    D --> G["Chat Assistant - Dr. Moo"]
    E --> H["Top Crossbreeding Suggestions"]
    F --> I["Customized Diet Plan"]
    G --> J["Answer Farmer Queries"]
    H --> K["Display All Insights on UI"]
    I --> K
    J --> K
```

### 📸 Image Upload & Detection
```mermaid
graph TD;
    U["Farmer Uploads Image"] --> P["Image Enhancement"]
    P --> R["ML Breed Detection Model"]
    R --> S["Filter Results by Confidence"]
    S --> D["Store Data in MongoDB"]
    D --> M["Track History / Metadata"]
```

### 🔬 Breeding Suggestion Engine
```mermaid
graph TD;
    B["Detected Breed"] --> C["Gemini AI Suggests Crossbreeds"]
    C --> D["Verify with Compatibility Database"]
    D --> E["Rank by Health, Yield, Climate Fitness"]
    E --> F["Create Visual List for User"]
```

### 💬 Dr. Moo Chatbot
```mermaid
graph TD;
    Q["User Asks Question"] --> A["Intent Detection + NLP Layer"]
    A --> B["Gemini AI Prompt Handler"]
    B --> C["Answer Generation"]
    C --> D["Translate (Kannada/English)"]
    D --> E["Chat UI Display"]
```

### 🍽️ Nutrition Planning Engine
```mermaid
graph TD;
    I["Input: Age, Breed, Weight, Weather"] --> A["Nutrition Recommendation Engine"]
    A --> B["Match with Global Feed DB"]
    B --> C["Breed-specific Adjustments"]
    C --> D["Generate Meal Charts"]
    D --> E["Push as Scrollable Cards in UI"]
```

---

## 🚀 Key Features

- ✅ **Breed Detection** – ML model trained on **4,500+ labeled images**
- ✅ **Crossbreeding Suggestions** – Gemini AI recommends **top 5 healthy pairs**
- ✅ **Dr. Moo Chatbot** – Real-time **cattle expert assistant**
- ✅ **Personalized Nutrition Plans** – Daily & weekly plans based on breed, age & climate
- ✅ **Farmer-Friendly UI** – Built with simplicity and accessibility in mind

---

## ☔️ Tech Stack

| **Category** | **Technology** |
|--------------|----------------|
| **Frontend** | React.js, Tailwind CSS |
| **Backend** | Flask (Python), REST API |
| **Database** | MongoDB |
| **ML Model** | Custom-trained on 4,500+ cattle images |
| **AI Assistant** | Gemini AI (Chat + Breeding + Diet Suggestions) |
| **Hosting** | Firebase (Backend), Vercel (Frontend) |
| **APIs** | Gemini AI, Weather API |

---

## 📅 Development Timeline

- ✅ **ML Model Integration & Testing**
- ✅ **Frontend + Image Upload UI**
- ✅ **Chatbot with Gemini API**
- ⏳ **Database Integration + Auth System (Ongoing)**
- ⏳ **Mobile Responsiveness + UX Optimizations (Next)**

---

## 📷 Live Demo Preview

![Breed Detection Demo](https://via.placeholder.com/600x350?text=Breed+Detected+%3A+Gir+%7C+Confidence+%3A+96%25)

- **Breed Detected:** Gir
- **Confidence:** 96.2%
- **Nutrition Tip:** Add protein-rich feed during hot weather.
- **Suggested Crossbreed:** Gir x Sahiwal – Best for yield and heat resistance

---

## 🌌 Future Scope

- 🚀 **Mobile App (Android/iOS)**
- 🎤 **Voice Support in Local Languages**
- 💉 **Disease Detection via Image Analysis**
- 🔐 **Blockchain for Cattle Medical History**
- 🏢 **Farmer Marketplace for Cattle Trading**

---

## 📞 Contact

- ✉️ **Email:** your-email@example.com  
- 🐝 **GitHub:** [Maheshh-S](https://github.com/Maheshh-S)  
- 🌐 **Live Site:** [aqua-bov.vercel.app](https://aqua-bov.vercel.app/)

---

## ✨ Show Some Love

If this project helped or inspired you, consider giving it a **star ⭐ on GitHub!**

> _"Empowering farmers with AI, one cow at a time!"_ 🐄️🌱

