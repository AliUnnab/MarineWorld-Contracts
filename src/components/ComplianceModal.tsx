import React, { useState } from 'react';
import { 
  ShieldCheck, Scale, CheckCircle2, Sparkles, AlertTriangle, ArrowRight, Lock, Calendar, FileText
} from 'lucide-react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { doc, setDoc } from 'firebase/firestore';

interface ComplianceModalProps {
  userId: string;
  userEmail: string;
  onAccepted: () => void;
}

export default function ComplianceModal({ userId, userEmail, onAccepted }: ComplianceModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'acceptable' | 'ai-credits'>('acceptable');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!accepted) return;
    setSubmitting(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', userId);
      const timestamp = new Date().toISOString();

      // 1. Save to Offline-First Local storage immediately to guarantee persistence
      window.localStorage.setItem(`aup_accepted_${userId}`, 'true');
      window.localStorage.setItem(`aup_accepted_at_${userId}`, timestamp);

      try {
        // 2. Attempt to update User Record in Firebase
        await setDoc(userRef, {
          acceptableUsePolicyAccepted: true,
          aupAcceptedAt: timestamp
        }, { merge: true });

        // 3. Attempt to log Audit Trail
        await logAuditEvent(
          userId,
          `Legal Agreement Confirmed: Privacy Policy, Terms of Service, Acceptable Use, AI Services accepted by ${userEmail}`,
          "Legal & Regulatory Sign-off"
        );
      } catch (dbErr: any) {
        console.warn("Database storage failed during legal agreement confirmation, using offline-first fallback:", dbErr);
        // If it's a quota exceeded error, mark the session state
        if (dbErr?.message?.toLowerCase().includes('quota') || dbErr?.code === 'resource-exhausted') {
          window.localStorage.setItem('firestore_quota_exceeded', 'true');
        }
      }

      // 4. Trigger callback to let user enter the platform
      onAccepted();
    } catch (err: any) {
      console.error("Failed to save legal agreement:", err);
      setError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      {/* Dynamic Ambient Background Blur */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[250px] bg-[#00D4FF]/5 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[200px] bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-5xl h-[85vh] bg-[#111625] border border-[#2B354D] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Banner Alert Header */}
        <div className="bg-gradient-to-r from-[#171E2D] to-[#0A0E17] border-b border-white/5 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-[#00D4FF] border border-cyan-500/20 shrink-0">
              <ShieldCheck size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00D4FF] font-bold uppercase tracking-[0.25em]">Argento Maritime Worldwide LLC</span>
              <h2 className="text-sm md:text-base font-extrabold text-white uppercase tracking-wider font-manrope">Mandatory Compliance & Legal Onboarding</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-400 text-[10px] font-mono uppercase tracking-wider self-start md:self-auto">
            <AlertTriangle size={14} className="shrink-0" />
            <span>MANDATORY DIGITAL SIGN-OFF REQUIRED</span>
          </div>
        </div>

        {/* Inner Content Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Tab Sidebar Selector */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[#161C2C]/30 p-4 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-hide">
            <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-widest hidden md:block mb-2 font-bold px-3">
              Governance Charters
            </span>

            {[
              { id: 'acceptable', label: 'Acceptable Use Policy', icon: <CheckCircle2 size={16} /> },
              { id: 'terms', label: 'Terms of Service', icon: <Scale size={16} /> },
              { id: 'privacy', label: 'Privacy Policy', icon: <ShieldCheck size={16} /> },
              { id: 'ai-credits', label: 'AI Services Policy', icon: <Sparkles size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 md:shrink-1 ${
                  activeTab === tab.id 
                    ? 'bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/25 font-bold' 
                    : 'text-[#BBC0C4] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-[#00D4FF]' : 'text-[#80868B]'}>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}

            <div className="hidden md:block p-4 mt-auto rounded-lg bg-white/[0.01] border border-white/5">
              <span className="text-[10px] font-mono text-white/50 font-bold block mb-1">DATA PROTECTION</span>
              <p className="text-[10px] text-[#80868B] leading-relaxed">
                All agreements, metadata, and workspace files are isolated securely and protected via TLS 1.3 & AES-256 encryption keys.
              </p>
            </div>
          </div>

          {/* Right Scrollable Policy Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#131926]/40 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent">
            {activeTab === 'acceptable' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#00D4FF] border-b border-white/5 pb-3">
                  <CheckCircle2 size={18} />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest font-manrope">Acceptable Use Policy (AUP)</h3>
                </div>
                <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-4 font-manrope">
                  <p className="font-semibold text-white">1. System Integrity Guidelines</p>
                  <p>
                    Users must use MarineWorld Contract Studio exclusively for legitimate corporate contract, operational and commercial charter operations. Any attempt to exploit, reverse-engineer, or probe the platform infrastructure is strictly prohibited.
                  </p>
                  <p className="font-semibold text-white">2. Abuse Prevention & Spam</p>
                  <p>
                    Bulk spamming, creation of malicious automated bots, mass scraping, or uploading files containing scripts, malware, or executable code is a breach of security and will result in immediate tenant termination and legal reports.
                  </p>
                  <p className="font-semibold text-white">3. Compliance & Sanctions Control</p>
                  <p>
                    The platform cannot be used to conduct transactions, draft charter agreements, or organize shipments that violate active international maritime sanctions, counter-terrorism laws, or legal trade restrictions imposed by global regulatory authorities.
                  </p>
                  <p className="font-semibold text-white">4. Breach & Penalty System</p>
                  <p>
                    Argento Maritime Worldwide LLC reserves the right to suspend or permanently block any account, workspace, or entity determined to be in violation of these conditions, retaining detailed SHA-256 logging data for legal compliance.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#00D4FF] border-b border-white/5 pb-3">
                  <Scale size={18} />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest font-manrope">Terms of Service (ToS)</h3>
                </div>
                <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-4 font-manrope">
                  <p className="font-semibold text-white">1. B2B SaaS Service Provider Status</p>
                  <p>
                    Argento Maritime Worldwide LLC operates exclusively as a technology software infrastructure provider. We are not a contracting party, broker, legal counsel, or notary to any agreement managed inside the studio.
                  </p>
                  <p className="font-semibold text-white">2. Electronic Signatures and Verifiable Records</p>
                  <p>
                    By executing contracts on the platform, you understand and acknowledge that electronic signatures hold the same legal weight as traditional wet-ink signatures under national and international commercial treaties.
                  </p>
                  <p className="font-semibold text-white">3. Agreement Registry and Traceability</p>
                  <p>
                    Every agreement receives an immutable cryptographic fingerprint (SHA-256) which is logged to support version authenticity. Users agree that these records are valid for dispute-resolution auditing.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#00D4FF] border-b border-white/5 pb-3">
                  <ShieldCheck size={18} />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest font-manrope">Enterprise Privacy Policy</h3>
                </div>
                <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-4 font-manrope">
                  <p className="font-semibold text-white">1. Absolute Confidentiality</p>
                  <p>
                    We never sell, rent, or lease customer data, uploaded charter parties, or metadata. Each tenant workspace operates in secure cryptographic isolation.
                  </p>
                  <p className="font-semibold text-white">2. Data Security & Encryption</p>
                  <p>
                    All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Cloud-hosted Firestore datastores are protected with strict custom B2B security rules.
                  </p>
                  <p className="font-semibold text-white">3. Session Analytics & Security Audits</p>
                  <p>
                    Platform logs collect sign-in IP addresses, country coordinates, and security access points to maintain robust audit trails and protect organizations from internal or external corporate espionage.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ai-credits' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#00D4FF] border-b border-white/5 pb-3">
                  <Sparkles size={18} />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest font-manrope">AI Services & Operational Credits Policy</h3>
                </div>
                <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-4 font-manrope">
                  <p className="font-semibold text-white">1. Confidential Processing of Contract Content</p>
                  <p>
                    When using AI Copilot or AI Advisor features, selected contract data is processed for analysis. We explicitly do NOT train public AI models on your proprietary business agreements or contract clauses.
                  </p>
                  <p className="font-semibold text-white">2. Operational Credit System & Resource Consumption</p>
                  <p>
                    Credits are only consumed when eligible AI services successfully complete. Regular contract drafting, PDF saving, exporting, or executing agreements will NEVER consume your corporate credit balance.
                  </p>
                  <p className="font-semibold text-white">3. No Replacement for Legal Counsel</p>
                  <p>
                    AI analysis is provided for efficiency and organizational productivity. Users must review all AI drafts before signing; the platform does not assume liability for AI drafting outcomes.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Area with Mandatory Controls */}
        <div className="border-t border-white/5 bg-[#171E2D] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 max-w-xl">
            <input 
              id="compliance-consent-checkbox"
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 border-[#2B354D] rounded text-[#00D4FF] focus:ring-[#00D4FF] focus:ring-opacity-25 bg-[#0F1420] shrink-0 cursor-pointer h-4 transition-colors"
            />
            <label 
              htmlFor="compliance-consent-checkbox"
              className="text-[11px] text-[#BBC0C4] leading-relaxed select-none cursor-pointer"
            >
              I hereby certify that I have read, understood, and voluntarily accept all terms, conditions, and operating rules specified in the <span className="text-white font-bold">Privacy Policy</span>, <span className="text-white font-bold">Terms of Service</span>, <span className="text-white font-bold">Acceptable Use Policy</span>, and <span className="text-white font-bold">AI Services Policy</span>. I authorize the recording of this digital signature into my B2B security profile.
            </label>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {error && (
              <span className="text-[10px] text-red-400 font-medium max-w-xs text-right mb-1">
                {error}
              </span>
            )}
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider hidden sm:block">
                © 2026 ARGENTO MARITIME WORLDWIDE LLC
              </span>
              <button
                id="compliance-submit-button"
                onClick={handleAccept}
                disabled={!accepted || submitting}
                className={`px-6 py-3 font-extrabold uppercase tracking-[0.15em] text-[10px] rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md ${
                  accepted && !submitting
                    ? 'bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] cursor-pointer hover:shadow-[0_4px_12px_rgba(0,212,255,0.25)]'
                    : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[#040B18] border-t-transparent animate-spin"></span>
                    <span>AUTHORIZING...</span>
                  </>
                ) : (
                  <>
                    <span>Acknowledge & Close</span>
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
