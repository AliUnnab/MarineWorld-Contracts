import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase-service';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { 
  User, Briefcase, Mail, KeyRound, ShieldAlert, Check, 
  Save, Loader2, Bell, ShieldOff, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { UserProfile } from '../types/saas';

interface SettingsViewProps {
  userId: string;
}

export default function SettingsView({ userId }: SettingsViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [notifs, setNotifs] = useState({
    contractEdits: true,
    signatureLocks: true,
    billingAlerts: false
  });

  useEffect(() => {
    if (!userId) return;

    const profileRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setName(data.displayName || '');
        setCompany(data.companyName || '');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const profileRef = doc(db, 'users', userId);
      await updateDoc(profileRef, {
        displayName: name,
        companyName: company
      });
      console.log("Corporate identity settings updated in secure Firestore registries.");
    } catch (err) {
      console.error("Failed to commit profile updates:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!profile) return;
    try {
      const profileRef = doc(db, 'users', userId);
      await updateDoc(profileRef, {
        twoFactorEnabled: !profile.twoFactorEnabled
      });
    } catch (err) {
      console.error("MFA toggle commit failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#171B26]">
        <div className="text-center text-[#BBC0C4]">
          <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={32} />
          <p className="text-xs font-mono uppercase tracking-widest text-[#80868B]">Syncing administrative user settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">TENANT CONFIGURATION CONSOLE</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Global Settings</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight">Configure bilateral legal frameworks, signature preferences, and corporate identity protocols.</p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-[11px] font-bold transition-all uppercase tracking-wider disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Commit Changes
        </button>
      </div>

      <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {/* SECTION 1: COMPANY PROFILE */}
        <div className="bg-[#202636] rounded-xl border border-[#2B3347] overflow-hidden flex flex-col h-full shadow-lg">
          <div className="bg-[#171B26] px-5 py-4 border-b border-[#2B3347] flex items-center gap-2.5">
            <User size={16} className="text-[#00D4FF]" />
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest font-mono">Company Profile</h3>
          </div>
          <div className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Company Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MarineWorld Logistics"
                className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Legal Entity Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Global Maritime S.A."
                className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Registered Jurisdiction</label>
              <input
                type="text"
                placeholder="e.g. Marshall Islands / Singapore"
                className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Corporate Auth Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-[#80868B] cursor-not-allowed font-mono mt-1"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: NOTIFICATION SETTINGS */}
        <div className="bg-[#202636] rounded-xl border border-[#2B3347] overflow-hidden flex flex-col h-full shadow-lg">
          <div className="bg-[#171B26] px-5 py-4 border-b border-[#2B3347] flex items-center gap-2.5">
            <Bell size={16} className="text-[#FDD663]" />
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest font-mono">Notification Settings</h3>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="flex items-center justify-between p-3.5 bg-[#171B26] rounded border border-[#2B3347]">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Email Notifications</p>
                <p className="text-[10px] text-[#80868B] font-mono mt-0.5 uppercase tracking-tighter leading-tight">Daily summary of contract status updates</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifs.contractEdits}
                onChange={(e) => setNotifs({...notifs, contractEdits: e.target.checked})}
                className="w-4 h-4 accent-[#00D4FF]" 
              />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-[#171B26] rounded border border-[#2B3347]">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Renewal Alerts</p>
                <p className="text-[10px] text-[#80868B] font-mono mt-0.5 uppercase tracking-tighter leading-tight">30/60/90 day pre-expiry event triggers</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#00D4FF]" />
            </div>
            <div className="flex items-center justify-between p-3.5 bg-[#171B26] rounded border border-[#2B3347]">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Approval Alerts</p>
                <p className="text-[10px] text-[#80868B] font-mono mt-0.5 uppercase tracking-tighter leading-tight">Instant ping for review-required status</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifs.signatureLocks}
                onChange={(e) => setNotifs({...notifs, signatureLocks: e.target.checked})}
                className="w-4 h-4 accent-[#00D4FF]" 
              />
            </div>
            <div className="pt-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded text-[9px] text-[#BBC0C4] font-mono leading-relaxed uppercase tracking-tight">
              Alerts are dispatched via MarineWorld SMTP relay nodes. Ensure whitelisting of @marineworld.org domain.
            </div>
          </div>
        </div>

        {/* SECTION 3: LEGAL JURISDICTION */}
        <div className="bg-[#202636] rounded-xl border border-[#2B3347] overflow-hidden flex flex-col h-full shadow-lg">
          <div className="bg-[#171B26] px-5 py-4 border-b border-[#2B3347] flex items-center gap-2.5">
            <Mail size={16} className="text-[#00D68F]" />
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest font-mono">Legal Jurisdiction</h3>
          </div>
          <div className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Governing Law (Default)</label>
              <select className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-bold uppercase font-mono">
                <option>English Law (LMAA)</option>
                <option>New York State Law</option>
                <option>Singapore Maritime Law</option>
                <option>Hong Kong SAR Law</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Arbitration Location</label>
              <input
                type="text"
                placeholder="e.g. London / Singapore / New York"
                className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Contract Default Jurisdiction</label>
              <input
                type="text"
                placeholder="e.g. High Court of Justice, London"
                className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: SIGNATURE PREFERENCES */}
        <div className="bg-[#202636] rounded-xl border border-[#2B3347] overflow-hidden flex flex-col h-full shadow-lg">
          <div className="bg-[#171B26] px-5 py-4 border-b border-[#2B3347] flex items-center gap-2.5">
            <ToggleRight size={16} className="text-[#F28B82]" />
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest font-mono">Signature Preferences</h3>
          </div>
          <div className="p-6 space-y-5 flex-1">
            <div className="flex items-center justify-between p-3.5 bg-[#171B26] rounded border border-[#2B3347]">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Electronic Signature Enabled</p>
                <p className="text-[10px] text-[#80868B] font-mono mt-0.5 uppercase tracking-tighter leading-tight">Allow digital sealing of corporate documents</p>
              </div>
              <button 
                type="button"
                onClick={handleToggle2FA}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${profile?.twoFactorEnabled ? 'bg-[#00D68F]' : 'bg-[#2B3347]'}`}
              >
                <span className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-lg ring-0 transition-transform ${profile?.twoFactorEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-2">Signature Verification Requirements</label>
              <select className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-bold uppercase font-mono">
                <option>Multi-Factor (Email + Session Token)</option>
                <option>Email Verification Only</option>
                <option>Digital Certificate (PKI) Required</option>
                <option>Hardware Key (FIDO2) Required</option>
              </select>
            </div>
            <div className="p-3 bg-[#00D68F]/5 border border-[#00D68F]/10 rounded text-[9px] text-[#00D68F] font-mono leading-relaxed uppercase tracking-tight flex items-start gap-2">
              <Check size={14} className="shrink-0 mt-0.5" /> 
              <span>All signatures are cryptographically hashed and anchored to the Global MarineWorld Sovereign Ledger.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export {  };
