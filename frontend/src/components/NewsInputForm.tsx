import React, { useRef, useState } from 'react';
import {
  Search,
  RotateCcw,
  Sparkles,
  FileText,
  Type,
  AlertCircle,
  HelpCircle,
  ClipboardPaste,
  Upload,
  Check,
} from 'lucide-react';
import { EXAMPLE_ARTICLES } from '../data/examples';
import type { ExampleNews } from '../types/api';

interface NewsInputFormProps {
  headline: string;
  setHeadline: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  onDetect: () => void;
  onClear: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  serverOffline: boolean;
  hasResult?: boolean;
}

export const NewsInputForm: React.FC<NewsInputFormProps> = ({
  headline,
  setHeadline,
  content,
  setContent,
  onDetect,
  onClear,
  isLoading,
  errorMessage,
  serverOffline,
  hasResult = false,
}) => {
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('lg');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isOverLimit = charCount > 100000;
  const isTooShort = content.trim().length > 0 && content.trim().length < 5;
  const canSubmit = content.trim().length >= 5 && !isOverLimit && !isLoading;

  const handleSelectExample = (example: ExampleNews) => {
    setHeadline(example.headline);
    setContent(example.content);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setContent(text);
          setCopiedNotification('ক্লিপবোর্ড থেকে পেস্ট করা হয়েছে!');
          setTimeout(() => setCopiedNotification(null), 2200);
        }
      }
    } catch {
      // If browser permission is blocked, notify gracefully
      setCopiedNotification('ক্লিপবোর্ড পারমিশন পাওয়া যায়নি। ম্যানুয়ালি পেস্ট করুন (Ctrl+V)');
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setContent(text);
          setCopiedNotification(`ফাইল আপলোড হয়েছে: ${file.name}`);
          setTimeout(() => setCopiedNotification(null), 2500);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="input-card glass-panel">
      {/* Examples Bar */}
      <div className="examples-section">
        <div className="examples-header">
          <div className="examples-title">
            <Sparkles size={17} className="text-accent" />
            <span>নমুনা সংবাদ দিয়ে পরীক্ষা করুন (Click an Example):</span>
          </div>
        </div>
        <div className="examples-pills">
          {EXAMPLE_ARTICLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pill-example ${
                item.tag === 'authentic' ? 'pill-auth' : 'pill-fake'
              }`}
              onClick={() => handleSelectExample(item)}
              title={`${item.title_en} (${item.category_en})`}
            >
              <span className={`pill-dot ${item.tag}`} />
              <span className="pill-text">{item.title}</span>
              <span className="pill-tag-name">
                {item.tag === 'authentic' ? 'নির্ভরযোগ্য প্যাটার্ন' : 'ভুয়া/রম্য প্যাটার্ন'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Headline Field */}
      <div className="input-group">
        <div className="input-label-row">
          <label htmlFor="headline-input" className="input-label">
            <Type size={16} />
            <span>সংবাদের শিরোনাম (ঐচ্ছিক)</span>
          </label>
        </div>
        <input
          id="headline-input"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="সংবাদের শিরোনাম দিন... (ঐচ্ছিক)"
          maxLength={500}
          className="headline-field"
        />
      </div>

      {/* Article Content Textarea */}
      <div className="input-group mt-4">
        <div className="input-label-row">
          <label htmlFor="content-input" className="input-label required">
            <FileText size={17} />
            <span>সংবাদের মূল বিবরণ / Full Article Content</span>
          </label>

          {/* Text Area Toolbar (Font Size Controls & Paste) */}
          <div className="textarea-toolbar">
            <div className="font-size-toggles" title="লেখার সাইজ পরিবর্তন করুন (Adjust Text Size)">
              <span className="font-size-label">ফন্ট:</span>
              <button
                type="button"
                className={`btn-font-scale ${fontSize === 'md' ? 'active' : ''}`}
                onClick={() => setFontSize('md')}
                title="সাধারণ ফন্ট (16px)"
              >
                A
              </button>
              <button
                type="button"
                className={`btn-font-scale ${fontSize === 'lg' ? 'active' : ''}`}
                onClick={() => setFontSize('lg')}
                title="বড় ফন্ট (18px)"
              >
                A+
              </button>
              <button
                type="button"
                className={`btn-font-scale ${fontSize === 'xl' ? 'active' : ''}`}
                onClick={() => setFontSize('xl')}
                title="অতিরিক্ত বড় ফন্ট (20px)"
              >
                A++
              </button>
            </div>

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="btn-toolbar-action"
              title="ক্লিপবোর্ড থেকে পেস্ট করুন (Paste from Clipboard)"
            >
              <ClipboardPaste size={15} />
              <span>পেস্ট করুন</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-toolbar-action"
              title="টেক্সট ফাইল আপলোড করুন (.txt)"
            >
              <Upload size={15} />
              <span>ফাইল</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Floating Notification */}
        {copiedNotification && (
          <div className="copied-toast animate-fade-in">
            <Check size={14} className="text-authentic" />
            <span>{copiedNotification}</span>
          </div>
        )}

        <textarea
          id="content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="এখানে বাংলা বা ইংরেজি সংবাদের মূল অনুচ্ছেদ পেস্ট করুন... (কমপক্ষে ৫টি অক্ষর প্রয়োজন)

Paste the full Bangla news article text here for machine learning classification..."
          rows={10}
          className={`content-textarea font-scale-${fontSize} ${isOverLimit ? 'input-error' : ''}`}
        />

        {/* Word & Character Count Bar */}
        <div className="textarea-footer-metrics">
          <div className="char-counter">
            <span className={isOverLimit ? 'text-rose font-bold' : ''}>
              {charCount.toLocaleString()} / ১০০,০০০ অক্ষর
            </span>
            <span className="char-divider">•</span>
            <span>{wordCount.toLocaleString()} শব্দ</span>
          </div>
        </div>

        {isTooShort && (
          <div className="validation-warning">
            <AlertCircle size={15} />
            <span>কমপক্ষে ৫টি অক্ষর লিখুন (Please enter at least 5 characters).</span>
          </div>
        )}

        {isOverLimit && (
          <div className="validation-error">
            <AlertCircle size={15} />
            <span>
              সংবাদের দৈর্ঘ্য সর্বোচ্চ ১০০,০০০ অক্ষরের সীমা অতিক্রম করেছে (Text exceeds 100,000 characters).
            </span>
          </div>
        )}
      </div>

      {/* Inline API Error Alert */}
      {errorMessage && (
        <div className="error-banner animate-fade-in" role="alert">
          <AlertCircle size={18} className="error-banner-icon" />
          <div className="error-banner-content">
            <strong className="error-banner-title">Error Processing Request</strong>
            <p className="error-banner-text">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Server Offline Warning */}
      {serverOffline && (
        <div className="warning-banner animate-fade-in">
          <HelpCircle size={18} className="warning-banner-icon" />
          <div className="warning-banner-content">
            <strong>Backend API Offline</strong>
            <p>
              Please start the FastAPI backend service (<code>python run_backend.py</code>) to run news predictions.
            </p>
          </div>
        </div>
      )}

      {/* Actions Toolbar */}
      <div className="form-actions-toolbar">
        <button
          type="button"
          onClick={onClear}
          className="btn-reset"
          title="ইনপুট ও পূর্বের ফলাফল মুছে রিসেট করুন (Reset All)"
          disabled={isLoading || (!content && !headline && !hasResult)}
        >
          <RotateCcw size={17} />
          <span>রিসেট করুন / Reset</span>
        </button>

        <button
          type="button"
          onClick={onDetect}
          disabled={!canSubmit || serverOffline}
          className={`btn-detect ${isLoading ? 'btn-loading' : ''}`}
        >
          {isLoading ? (
            <>
              <span className="button-spinner" />
              <span>বিশ্লেষণ চলছে / Analyzing...</span>
            </>
          ) : (
            <>
              <Search size={19} />
              <span>যাচাই করুন / Detect Fake News</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
