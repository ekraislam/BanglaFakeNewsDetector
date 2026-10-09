import React from 'react';
import { Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="disclaimer-banner" role="note">
      <div className="disclaimer-main-row">
        <div className="disclaimer-icon-wrapper">
          <Info className="disclaimer-icon" size={18} />
        </div>
        <div className="disclaimer-summary">
          <p className="disclaimer-primary-quote">
            <strong>নির্দেশনা:</strong> এই এআই মডেলটি বাংলা সংবাদের ভাষাগত প্যাটার্ন ও শব্দবিন্যাস বিশ্লেষণ করে নির্ভরযোগ্যতা যাচাই করে। বাস্তব তথ্য পুরোপুরি নিশ্চিত হতে নির্ভরযোগ্য মূলধারার সংবাদমাধ্যমের সহায়তা নিন।
          </p>
        </div>
      </div>
    </div>
  );
};
