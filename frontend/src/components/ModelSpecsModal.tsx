import React from 'react';
import { X, Cpu, Database, CheckCircle2, AlertOctagon, Layers, FileCode } from 'lucide-react';
import type { MetadataResponse } from '../types/api';

interface ModelSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: MetadataResponse | null;
}

export const ModelSpecsModal: React.FC<ModelSpecsModalProps> = ({
  isOpen,
  onClose,
  metadata,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Cpu className="text-primary-light" size={22} />
            <div>
              <h3>Model Architecture & Training Specifications</h3>
              <p className="modal-subtitle">Technical Inspection of Trained Artifact</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">Model Name</span>
              <span className="spec-val highlight">{metadata?.model_name || 'Bangla News Text Classifier'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Model Pipeline</span>
              <span className="spec-val">{metadata?.model_type || 'TF-IDF + Logistic Regression'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Input Modality</span>
              <span className="spec-val">{metadata?.input_feature || 'content_only'} (Article Text)</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Artifact File</span>
              <span className="spec-val font-mono">bangla_news_text_model.joblib (~1.1 MB)</span>
            </div>
          </div>

          <div className="specs-section">
            <h4>
              <Database size={16} />
              <span>Dataset & Distribution</span>
            </h4>
            <div className="dataset-stats-cards">
              <div className="data-stat-card">
                <span className="stat-num">{metadata?.training_rows?.toLocaleString() || '51,752'}</span>
                <span className="stat-name">Total Training Articles</span>
              </div>
              <div className="data-stat-card stat-auth">
                <span className="stat-num">{metadata?.authentic_labelled_rows?.toLocaleString() || '48,820'}</span>
                <span className="stat-name">Authentic Label (Class 0)</span>
                <span className="stat-sub">94.3% of corpus</span>
              </div>
              <div className="data-stat-card stat-fake">
                <span className="stat-num">{metadata?.fake_labelled_rows?.toLocaleString() || '2,932'}</span>
                <span className="stat-name">Fake / Rumour Label (Class 1)</span>
                <span className="stat-sub">5.7% of corpus (balanced in LR)</span>
              </div>
            </div>
          </div>

          <div className="specs-section">
            <h4>
              <Layers size={16} />
              <span>Label Mapping Contract</span>
            </h4>
            <div className="mapping-table-wrap">
              <table className="mapping-table">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Saved Label Key</th>
                    <th>Semantic Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>0</code></td>
                    <td><code>authentic_label</code></td>
                    <td><CheckCircle2 size={15} className="text-emerald" /> Editorial journalistic text from established Bangla outlets</td>
                  </tr>
                  <tr>
                    <td><code>1</code></td>
                    <td><code>fake_label</code></td>
                    <td><AlertOctagon size={15} className="text-rose" /> Satire, clickbait, fabricated health claims, social hoaxes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="specs-section">
            <h4>
              <FileCode size={16} />
              <span>Pipeline Configuration</span>
            </h4>
            <ul className="pipeline-steps-list">
              <li>
                <strong>TfidfVectorizer:</strong> max_features=60,000, ngram_range=(1, 2), min_df=2, max_df=0.98, sublinear_tf=True, dtype=float32
              </li>
              <li>
                <strong>LogisticRegression:</strong> class_weight='balanced', max_iter=300, random_state=42, solver='liblinear'
              </li>
            </ul>
          </div>

          <div className="modal-alert-box">
            <strong>Training Dataset File:</strong> {metadata?.training_data || 'binary_candidate_no_known_label_conflicts.csv'}
            <p className="mt-1 text-sm text-secondary">
              {metadata?.warning || 'Predicted probabilities are model statistical scores based on vocabulary patterns, not verified real-world truth.'}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
