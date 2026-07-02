import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, ArrowRight } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already made a selection
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small timeout to slide in beautifully
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    } else {
      // Initialize analytics based on prior consent
      applyConsent(consent === 'accepted');
    }
  }, []);

  const applyConsent = (accepted: boolean) => {
    if (accepted) {
      console.log("[GDPR Consent] Analytical cookies authorized. Initializing Google Analytics...");
      // Enable GA4/GTM tracking
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        'event': 'consent_granted',
        'analytics_storage': 'granted'
      });
      // Set gtag consent state if loaded
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      }
    } else {
      console.log("[GDPR Consent] Non-essential cookies declined.");
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('consent', 'update', {
          'analytics_storage': 'denied'
        });
      }
    }
  };

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    applyConsent(true);
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    applyConsent(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-[999] animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-[#202636]/95 backdrop-blur-md border border-[#2B3347] hover:border-[#00D4FF]/30 p-6 rounded-2xl shadow-2xl relative select-none">
        
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/25 flex items-center justify-center text-[#00D4FF]">
              <Cookie size={18} />
            </div>
            <div>
              <h4 className="text-xs font-manrope font-bold text-white uppercase tracking-wider">Cookie Clearance & GDPR</h4>
              <p className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider mt-0.5">Privacy Operational Parameters</p>
            </div>
          </div>
          <button 
            onClick={handleDecline}
            className="text-[#80868B] hover:text-white transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="text-[#BBC0C4] text-[10px] md:text-[11px] leading-relaxed mb-6 font-mono uppercase tracking-tighter text-left">
          MarineWorld Contract Studio uses analytical cookies under UPhi™ Security Governance to measure telemetry, optimize workspace workflows, and ensure non-repudiation registry speeds.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-2.5 rounded border border-[#2B3347] hover:bg-[#2B3347] text-[10px] font-mono font-bold text-[#BBC0C4] uppercase tracking-wider transition-all cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 rounded bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
          >
            Accept Telemetry <ArrowRight size={12} />
          </button>
        </div>

      </div>
    </div>
  );
}
