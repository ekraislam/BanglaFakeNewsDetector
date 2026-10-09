import React from 'react';
import { ShieldCheck, Activity, AlertCircle, Sun, Moon } from 'lucide-react';
import type { HealthResponse } from '../types/api';

interface HeaderProps {
  health: HealthResponse | null;
  healthLoading: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  healthLoading,
  theme,
  onToggleTheme,
}) => {
  const isHealthy = health?.status === 'ok' && health?.model_loaded;

  return (
    <header className="header-container">
      <div className="header-brand">
        <div className="header-logo-icon">
          <ShieldCheck className="icon-shield" size={28} />
          <div className="logo-sparkle" />
        </div>
        <div>
          <div className="header-title-row">
            <h1 className="header-title">সত্যপরীক্ষা</h1>
            <span className="header-tag">AI Detector</span>
          </div>
          <p className="header-subtitle">
            বাংলা সংবাদ সত্যতা যাচাইকরণ পোর্টাল
          </p>
        </div>
      </div>

      <div className="header-actions">
        {/* Backend health status pill */}
        <div
          className={`status-pill ${
            healthLoading
              ? 'status-loading'
              : isHealthy
              ? 'status-online'
              : 'status-offline'
          }`}
          title={
            isHealthy
              ? `Backend Connected (Model: ${health?.model_name || 'Active'})`
              : 'Backend disconnected or model not ready'
          }
        >
          {healthLoading ? (
            <>
              <Activity className="animate-spin status-dot-icon" size={14} />
              <span>সার্ভার চেক হচ্ছে...</span>
            </>
          ) : isHealthy ? (
            <>
              <span className="status-dot green" />
              <span>Backend Online</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} className="status-dot-icon red" />
              <span>Server Offline</span>
            </>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={onToggleTheme}
          className="theme-toggle-btn"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={theme === 'dark' ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-warning-amber" />
          ) : (
            <Moon size={17} className="text-primary" />
          )}
        </button>
      </div>
    </header>
  );
};
