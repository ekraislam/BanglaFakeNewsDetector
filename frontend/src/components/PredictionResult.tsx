import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  BarChart2,
  HelpCircle,
  FileText,
  Share2,
  Check,
  Percent,
  Printer,
  Tag,
  RotateCcw,
} from 'lucide-react';
import type { PredictResponse } from '../types/api';

interface PredictionResultProps {
  result: PredictResponse;
  onReset: () => void;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);

  const isAuthentic = result.predicted_class === 0;
  const authProb = result.probabilities['authentic_label'] ?? 0;
  const fakeProb = result.probabilities['fake_label'] ?? 0;

  const handleCopySummary = async () => {
    const summary = `[সত্যপরীক্ষা | Bangla Fake News Detector Result]\n` +
      `শিরোনাম: ${result.headline || 'N/A'}\n` +
      `ফলাফল: ${result.display_label_bn} (${result.display_label})\n` +
      `কনফিডেন্স: ${(result.confidence * 100).toFixed(1)}%\n` +
      `নির্ভরযোগ্যতার সম্ভাবনা: ${(authProb * 100).toFixed(1)}%\n` +
      `ভুয়া/চটুলতার সম্ভাবনা: ${(fakeProb * 100).toFixed(1)}%\n` +
      `ব্যাখ্যা: ${result.explanation_bn}\n` +
      `সতর্কতা: ${result.disclaimer}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.confidence_percentage / 100) * circumference;

  return (
    <div
      className={`result-card glass-panel animate-fade-in ${
        isAuthentic ? 'result-authentic' : 'result-fake'
      }`}
    >
      {/* Top Banner / Verdict Header */}
      <div className="result-header">
        <div className="verdict-icon-container">
          {isAuthentic ? (
            <div className="verdict-icon authentic">
              <CheckCircle2 size={42} />
            </div>
          ) : (
            <div className="verdict-icon fake">
              <AlertTriangle size={42} />
            </div>
          )}
        </div>

        <div className="verdict-details">
          <div className="verdict-badge-row">
            <span
              className={`verdict-badge ${
                isAuthentic ? 'badge-authentic' : 'badge-fake'
              }`}
            >
              {isAuthentic ? 'AUTHENTIC PATTERN' : 'FAKE / UNRELIABLE PATTERN'}
            </span>
            <span className="verdict-nature-tag">
              {isAuthentic ? 'মূলধারার সংবাদ শৈলী' : 'চাঞ্চল্যকর বা অতিরঞ্জিত শৈলী'}
            </span>
            <button
              type="button"
              onClick={onReset}
              className="btn-quick-reset"
              title="ইনপুট মুছে নতুন সংবাদ দিতে রিসেট করুন"
            >
              <RotateCcw size={13} />
              <span>রিসেট / নতুন শুরু</span>
            </button>
          </div>

          <h2 className="verdict-title">
            {isAuthentic
              ? 'নির্ভরযোগ্য সংবাদের বৈশিষ্ট্য সম্পন্ন'
              : 'ভুয়া বা চটুল সংবাদের বৈশিষ্ট্য সম্পন্ন'}
          </h2>
          <p className="verdict-subtitle">
            {isAuthentic
              ? 'Mainstream Editorial Journalism Vocabulary Pattern'
              : 'Sensational / Misinformation / Satire Vocabulary Pattern'}
          </p>
        </div>

        {/* Circular Confidence Gauge */}
        <div className="confidence-gauge-container">
          <svg className="gauge-svg" width="108" height="108" viewBox="0 0 108 108">
            <circle
              className="gauge-bg"
              cx="54"
              cy="54"
              r={radius}
              strokeWidth="9"
            />
            <circle
              className={`gauge-fill ${isAuthentic ? 'gauge-emerald' : 'gauge-rose'}`}
              cx="54"
              cy="54"
              r={radius}
              strokeWidth="9"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="gauge-text-overlay">
            <span className="gauge-percent">{result.confidence_percentage}%</span>
            <span className="gauge-sub">কনফিডেন্স</span>
          </div>
        </div>
      </div>

      {/* Optional Display Headline */}
      {result.headline && (
        <div className="result-headline-box">
          <span className="headline-tag">বিশ্লেষিত শিরোনাম / Analyzed Headline:</span>
          <p className="headline-text">“{result.headline}”</p>
        </div>
      )}

      {/* Probability Distribution Meters */}
      <div className="probability-breakdown-card">
        <div className="section-title-row">
          <div className="section-title">
            <BarChart2 size={18} />
            <span>মডেল সম্ভাব্যতা অনুপাত / Model Probability Distribution</span>
          </div>
          <span className="section-hint">মোট যোগফল: ১০০%</span>
        </div>

        <div className="meter-container">
          {/* Authentic Bar */}
          <div className="meter-row">
            <div className="meter-labels">
              <div className="meter-name">
                <span className="meter-bullet emerald" />
                <strong className="meter-title">নির্ভরযোগ্য সংবাদ প্যাটার্ন (Authentic)</strong>
              </div>
              <div className="meter-val text-emerald">
                {(authProb * 100).toFixed(1)}%
              </div>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill fill-emerald"
                style={{ width: `${Math.min(100, Math.max(3, authProb * 100))}%` }}
              />
            </div>
          </div>

          {/* Fake Bar */}
          <div className="meter-row mt-4">
            <div className="meter-labels">
              <div className="meter-name">
                <span className="meter-bullet rose" />
                <strong className="meter-title">ভুয়া / অসত্য সংবাদ প্যাটার্ন (Fake / Sensational)</strong>
              </div>
              <div className="meter-val text-rose">
                {(fakeProb * 100).toFixed(1)}%
              </div>
            </div>
            <div className="meter-track">
              <div
                className="meter-fill fill-rose"
                style={{ width: `${Math.min(100, Math.max(3, fakeProb * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Influencing Keywords (If available from TF-IDF) */}
      {((result.top_fake_indicators && result.top_fake_indicators.length > 0) ||
        (result.top_authentic_indicators && result.top_authentic_indicators.length > 0)) && (
        <div className="keywords-influence-section">
          <div className="section-title mb-2">
            <Tag size={16} />
            <span>প্রভাব বিস্তারকারী শব্দসমূহ / Influential Vocabulary Markers:</span>
          </div>
          <p className="keywords-hint">
            মডেলের TF-IDF ভেক্টরাইজার অনুযায়ী নিচের শব্দগুলো এই ফলাফলে সবচেয়ে বেশি প্রভাব ফেলেছে:
          </p>
          <div className="keywords-groups-row">
            {result.top_fake_indicators && result.top_fake_indicators.length > 0 && (
              <div className="keyword-group-box fake-group">
                <span className="keyword-group-title text-rose">
                  ভুয়া/চটুল দিকের শব্দ (Sensational Markers):
                </span>
                <div className="keywords-pill-wrap">
                  {result.top_fake_indicators.map((word, i) => (
                    <span key={i} className="kw-pill kw-fake">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.top_authentic_indicators && result.top_authentic_indicators.length > 0 && (
              <div className="keyword-group-box auth-group">
                <span className="keyword-group-title text-emerald">
                  নির্ভরযোগ্য দিকের শব্দ (Mainstream Markers):
                </span>
                <div className="keywords-pill-wrap">
                  {result.top_authentic_indicators.map((word, i) => (
                    <span key={i} className="kw-pill kw-auth">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explanation Section */}
      <div className="explanation-card">
        <div className="section-title mb-2">
          <HelpCircle size={17} />
          <span>ফলাফলের বিশ্লেষণ ও ব্যাখ্যা:</span>
        </div>
        <div className="explanation-text-content">
          <p className="explanation-paragraph-bn">{result.explanation_bn}</p>
          <div className="explanation-sub-note">
            * মনে রাখবেন: এই ফলাফলটি বাস্তব জীবনের চূড়ান্ত রায় নয়, বরং ডেটাসেটের সাথে সংবাদটির ভাষার পরিসংখ্যানগত সাদৃশ্য।
          </div>
        </div>
      </div>

      {/* Result Card Footer & Action Buttons */}
      <div className="result-footer">
        <div className="input-stats-group">
          <div className="stat-pill">
            <FileText size={15} />
            <span>{result.word_count.toLocaleString()} শব্দ (Words)</span>
          </div>
          <div className="stat-pill">
            <Percent size={15} />
            <span>{result.char_count.toLocaleString()} অক্ষর (Chars)</span>
          </div>
        </div>

        <div className="result-actions-row">
          <button
            type="button"
            onClick={onReset}
            className="btn-reset-result"
            title="ইনপুট ও পূর্বের ফলাফল মুছে নতুন করে শুরু করুন"
          >
            <RotateCcw size={16} />
            <span>নতুন বিশ্লেষণ / রিসেট</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-print-result"
            title="রিপোর্ট প্রিন্ট বা সেভ করুন"
          >
            <Printer size={16} />
            <span>প্রিন্ট রিপোর্ট</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="btn-copy-result"
            title="ফলাফল কপি করুন"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald" />
                <span>কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Share2 size={16} />
                <span>কপি করুন (Copy)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
