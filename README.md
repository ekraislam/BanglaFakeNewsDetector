# সত্যপরীক্ষা | Bangla Fake News Detector

An academic and research-oriented web application for **Bangla Fake News Detection** using a trained Machine Learning model. The system evaluates the linguistic patterns and vocabulary distributions of Bangla news articles to classify whether they match authentic journalistic reporting or sensational/unreliable news patterns.

---

## ⚠️ Important Research Disclaimer

> **“This tool predicts labels learned from its training datasets. It does not independently verify whether a news article is true or false. Predictions may be wrong, especially for unfamiliar sources or topics.”**
>
> — *এই মডেলটি প্রশিক্ষণে ব্যবহৃত ডেটাসেটের বৈশিষ্ট্য অনুসারে পূর্বাভাস প্রদান করে। এটি বাস্তব ঘটনা বা খবরের সত্যতা সরাসরি যাচাই করে না। অপরিচিত উৎস বা অপ্রচলিত বিষয়ের ক্ষেত্রে পূর্বাভাস ভুল হতে পারে।*

---

## 🔍 Model Architecture & Artifact Inspection

The backend uses the original trained artifact without modification or retraining:
- **Model File**: `bangla_news_text_model.joblib` (~1.1 MB)
- **Metadata**: `model_metadata.json`
- **Model Type**: Scikit-Learn `Pipeline` combining:
  1. `TfidfVectorizer` (sublinear TF, ngram range `(1, 2)`, max features `60,000`, min_df `2`, max_df `0.98`)
  2. `LogisticRegression` (solver `'liblinear'`, max iter `300`, `class_weight='balanced'`)
- **Input Feature**: Article body content text only (`content_only`). Headlines are optional for display and do not affect model scoring.
- **Label Mapping**:
  - `0`: `authentic_label` (Mainstream editorial news)
  - `1`: `fake_label` (Sensational claims, health hoaxes, clickbait, and satire)
- **Training Corpus**: 51,752 articles (48,820 authentic, 2,932 fake/satire)
- **Inference**: Runs entirely on **CPU (Windows, no GPU required)**.

---

## 🛠️ Technology Stack

- **Backend**:
  - Python 3.12+
  - FastAPI & Uvicorn
  - Pydantic v2
  - Scikit-learn & Joblib
  - Pytest & HTTPX
- **Frontend**:
  - React 19 + TypeScript
  - Vite
  - Lucide React (Icons)
  - Modern Responsive CSS (Glassmorphism & Bengali Typography)

---

## 📁 Project Structure

```
BanglaFakeNewsDetector/
├── bangla_news_text_model.joblib   # Original trained model artifact
├── model_metadata.json             # Model training metadata & label mapping
├── README_model.txt                # Original model notes
├── requirements.txt                # Python backend dependencies
├── .gitignore                      # Git ignore rules
├── README.md                       # Comprehensive documentation
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py               # Robust model file locator & config
│   │   ├── schemas.py              # Pydantic schemas with strict validation
│   │   ├── model_service.py        # Model loading singleton & inference
│   │   └── main.py                 # FastAPI app, lifespan, CORS, endpoints
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py             # 8 unit/integration tests
│   ├── requirements.txt
│   └── pytest.ini
└── frontend/
    ├── package.json
    ├── vite.config.ts              # Vite proxy configuration
    ├── index.html                  # Bengali Google Fonts & metadata
    └── src/
        ├── App.tsx                 # Main application UI orchestrator
        ├── App.css                 # Responsive stylesheet & animations
        ├── index.css               # Global design system & theme tokens
        ├── components/
        │   ├── Header.tsx          # Brand header & server status pill
        │   ├── DisclaimerBanner.tsx# Prominent research disclaimer
        │   ├── NewsInputForm.tsx   # Article input, word counter & controls
        │   ├── PredictionResult.tsx# Prediction verdict, confidence & meters
        │   └── ModelSpecsModal.tsx # Technical specifications modal
        ├── types/api.ts            # TypeScript interfaces
        └── data/examples.ts        # Pre-curated authentic and fake samples
```

---

## 🚀 Getting Started (Windows PowerShell)

Follow these exact steps to run the application locally on Windows.

### Prerequisites

- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** with npm

> **PowerShell Script Policy Tip:** If PowerShell blocks script execution for `npm`, you can use `npm.cmd` or run:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

### Step 1: Backend Setup & Execution

Open a PowerShell terminal in the `BanglaFakeNewsDetector` directory:

1. **(Optional) Create and activate a virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install Python backend dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Run backend tests:**
   ```powershell
   python -m pytest backend/tests
   ```

4. **Start the FastAPI backend server:**
   ```powershell
   cd backend
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

The backend API will start at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`
- **Model Metadata**: `http://127.0.0.1:8000/metadata`

---

### Step 2: Frontend Setup & Execution

Open a **second** PowerShell terminal in the `BanglaFakeNewsDetector` directory:

1. **Navigate to the frontend folder:**
   ```powershell
   cd frontend
   ```

2. **Install npm dependencies (if not already installed):**
   ```powershell
   npm.cmd install
   ```

3. **Start the Vite development server:**
   ```powershell
   npm.cmd run dev
   ```

The frontend application will be live at:
👉 **`http://localhost:5173`**

---

## 📡 API Endpoints

### 1. `GET /health`
Returns system status and model loading readiness.
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_name": "Bangla News Text Classifier",
  "model_type": "TF-IDF + Logistic Regression",
  "classes": [0, 1],
  "version": "1.0.0"
}
```

### 2. `GET /metadata`
Returns details on training data, class distribution, and feature settings.

### 3. `POST /predict`
Performs news text classification.

**Request Body:**
```json
{
  "headline": "পদ্মা সেতুতে রেকর্ড পরিমাণ টোল আদায় (ঐচ্ছিক)",
  "content": "পদ্মা সেতু চালুর পর থেকে দেশের দক্ষিণ-পশ্চিমাঞ্চলের ২১টি জেলার সাথে রাজধানীর যোগাযোগ ব্যবস্থায় এক বৈপ্লবিক পরিবর্তন সাধিত হয়েছে..."
}
```

**Response Body:**
```json
{
  "predicted_class": 0,
  "predicted_label": "authentic_label",
  "display_label": "Authentic / Reliable",
  "display_label_bn": "নির্ভরযোগ্য সংবাদ প্যাটার্ন",
  "confidence": 0.8394,
  "confidence_percentage": 83.9,
  "probabilities": {
    "authentic_label": 0.8394,
    "fake_label": 0.1606
  },
  "detailed_probabilities": [
    {
      "class_index": 0,
      "label_name": "authentic_label",
      "display_name": "Authentic News Pattern",
      "display_name_bn": "নির্ভরযোগ্য সংবাদ প্যাটার্ন",
      "probability": 0.8394,
      "percentage": 83.9
    },
    {
      "class_index": 1,
      "label_name": "fake_label",
      "display_name": "Fake / Suspicious Pattern",
      "display_name_bn": "ভুয়া / সন্দেহজনক প্যাটার্ন",
      "probability": 0.1606,
      "percentage": 16.1
    }
  ],
  "headline": "পদ্মা সেতুতে রেকর্ড পরিমাণ টোল আদায় (ঐচ্ছিক)",
  "char_count": 312,
  "word_count": 42,
  "explanation": "The model classified this article as matching the 'authentic_label' distribution...",
  "explanation_bn": "মডেলটি এই সংবাদের ভাষাগত বৈশিষ্ট্য ও শব্দবিন্যাস বিশ্লেষণ করে...",
  "disclaimer": "This tool predicts labels learned from its training datasets...",
  "model_name": "Bangla News Text Classifier",
  "model_type": "TF-IDF + Logistic Regression"
}
```

---

## 🧪 Input Validation Rules

- **Empty / Whitespace Input**: Rejected with HTTP `422 Unprocessable Content` and clean error message.
- **Minimum Content Length**: At least 5 characters.
- **Maximum Content Length**: Capped at 100,000 characters to prevent denial of service and memory strain.
- **Error Sanitization**: Server paths and internal exceptions are suppressed from client responses.

---

## 🔒 Security & Quality Standards

- Model is loaded **once** at server startup using FastAPI's `lifespan` handler.
- Original model files (`bangla_news_text_model.joblib`, `model_metadata.json`, `README_model.txt`) remain completely untouched.
- Clean separation between frontend (React + Vite) and backend (FastAPI).

---

## 📄 License & Attribution

This project is licensed under the [MIT License](LICENSE).

```text
Copyright (c) 2026 ekraislam (https://github.com/ekraislam)
```

Anyone using, modifying, or distributing this codebase is legally required to retain the above copyright notice and original attribution to the author. You may not claim this work as solely your own without crediting the original creator.
