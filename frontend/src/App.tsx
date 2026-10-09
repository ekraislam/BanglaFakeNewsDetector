import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { NewsInputForm } from './components/NewsInputForm';
import { PredictionResult } from './components/PredictionResult';
import type {
  HealthResponse,
  PredictRequest,
  PredictResponse,
} from './types/api';
import './App.css';

// Base API endpoints (support both Vite proxy and direct backend port)
const API_BASE = '/api';
const DIRECT_BACKEND = 'http://127.0.0.1:8000';

export function App() {
  const [headline, setHeadline] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Helper to fetch with proxy fallback
  const fetchApi = useCallback(async (path: string, options?: RequestInit) => {
    try {
      const res = await fetch(`${API_BASE}${path}`, options);
      return res;
    } catch {
      return fetch(`${DIRECT_BACKEND}${path}`, options);
    }
  }, []);

  // Poll health status
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const res = await fetchApi('/health');
        if (res.ok) {
          const data: HealthResponse = await res.json();
          if (isMounted) {
            setHealth(data);
            setHealthLoading(false);
          }
        } else {
          if (isMounted) {
            setHealth(null);
            setHealthLoading(false);
          }
        }
      } catch {
        if (isMounted) {
          setHealth(null);
          setHealthLoading(false);
        }
      }
    };

    checkHealth();

    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchApi]);

  const handleDetect = async () => {
    let trimmed = content.trim();
    // If user entered headline but empty content, use headline as content
    if (!trimmed && headline.trim()) {
      trimmed = headline.trim();
    }

    if (!trimmed) {
      setErrorMessage('অনুগ্রহ করে সংবাদের বিবরণ প্রদান করুন (Please enter news article content).');
      return;
    }
    if (trimmed.length < 5) {
      setErrorMessage('সংবাদের পাঠ্য অত্যন্ত ছোট। কমপক্ষে ৫টি অক্ষর প্রদান করুন (At least 5 characters required).');
      return;
    }
    if (trimmed.length > 100000) {
      setErrorMessage('সংবাদের পাঠ্য সর্বোচ্চ ১০০,০০০ অক্ষরের সীমা অতিক্রম করেছে (Text exceeds 100,000 characters).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const payload: PredictRequest = {
      content: trimmed,
      headline: headline.trim() || undefined,
    };

    try {
      const response = await fetchApi('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorDetail = 'Inference server error.';
        try {
          const errData = await response.json();
          errorDetail = errData.detail || errData.error || errorDetail;
        } catch {
          errorDetail = `Server responded with status code ${response.status}.`;
        }
        setErrorMessage(errorDetail);
        setResult(null);
      } else {
        const data: PredictResponse = await response.json();
        setResult(data);
        setErrorMessage(null);
        setTimeout(() => {
          const el = document.getElementById('results-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch {
      setErrorMessage(
        'Unable to connect to the backend server. Please make sure the FastAPI server is running on port 8000.'
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setHeadline('');
    setContent('');
    setResult(null);
    setErrorMessage(null);
    setTimeout(() => {
      const textarea = document.getElementById('content-input') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="app-layout">
      {/* Top Navigation / Brand Header */}
      <Header
        health={health}
        healthLoading={healthLoading}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="main-content container">
        {/* Concise Bangla Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Hero Introduction */}
        <div className="hero-intro">
          <h2 className="hero-heading">
            বাংলা সংবাদ সত্যতা পরীক্ষণ ও ভাষাতাত্ত্বিক বিশ্লেষণ
          </h2>
          <p className="hero-description">
            মেশিন লার্নিং মডেলের মাধ্যমে সংবাদের শব্দ ও বাক্যশৈলী বিশ্লেষণ করে সত্যতা ও নির্ভরযোগ্যতা যাচাই করুন।
          </p>
        </div>

        {/* Input Form Card */}
        <NewsInputForm
          headline={headline}
          setHeadline={setHeadline}
          content={content}
          setContent={setContent}
          onDetect={handleDetect}
          onClear={handleClear}
          isLoading={isLoading}
          errorMessage={errorMessage}
          serverOffline={!healthLoading && health?.status !== 'ok'}
          hasResult={!!result}
        />

        {/* Prediction Results Section */}
        {result && (
          <div id="results-section" className="mt-8">
            <PredictionResult result={result} onReset={handleClear} />
          </div>
        )}
      </main>

      {/* Modern Clean Footer */}
      <footer className="portal-footer">
        <div className="container footer-content">
          <div className="footer-left">
            <strong className="footer-brand-title">সত্যপরীক্ষা | Bangla Fake News Detector</strong>
            <p className="footer-subtext">বাংলা সংবাদের নির্ভরযোগ্যতা ও সত্যতা যাচাইকরণ প্ল্যাটফর্ম</p>
          </div>
          <div className="footer-right">
            <div className="developer-tag">
              <span className="dev-label">Design and Developed by</span>
              <span className="dev-author">Ohi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
