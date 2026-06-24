import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase-service';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { 
  HelpCircle, MessageSquare, AlertCircle, FileText, Send, 
  CheckCircle2, Loader2, RefreshCw, ChevronRight,
  ShieldAlert, Terminal, Monitor, Activity, ExternalLink
} from 'lucide-react';
import { SupportTicket } from '../types/saas';

interface SupportViewProps {
  userId: string;
}

export default function SupportView({ userId }: SupportViewProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submit state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Query');
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Listen to user tickets
    const qTickets = query(collection(db, 'support_tickets'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(qTickets, (snap) => {
      const records: SupportTicket[] = [];
      snap.forEach((docSnap) => {
        records.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
      });
      // Sort oldest first or newest first
      records.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      setTickets(records);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Loading support tickets failed:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setSubmitting(true);
    try {
      const ticketsRef = collection(db, 'support_tickets');
      await addDoc(ticketsRef, {
        userId,
        subject,
        category,
        urgency,
        description,
        status: 'open',
        createdAt: new Date().toISOString()
      });

      setSubject('');
      setDescription('');
      setCategory('General Query');
      setUrgency('normal');
      console.log("Ticket successfully logged in Firestore databases! A technical SLA support specialist has been assigned.");
    } catch (err) {
      console.error("Failed to commit support ticket:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const knowledgeCategories = [
    {
      title: "Maritime Compliance",
      icon: <ShieldAlert size={16} className="text-[#00D4FF]" />,
      articles: [
        { title: "Bunker Convention Protocols 2025", excerpt: "Implementation of revised liability limits for oil pollution damage from ship bunkers." },
        { title: "MARPOL Annex VI Compliance Guide", excerpt: "Operational requirements for sulfur emission control areas (SECAs) and global caps." },
        { title: "Vessel Identity Verification L5", excerpt: "Standard operating procedures for biometric and digital certificate validation of crew." }
      ]
    },
    {
      title: "Contract Clauses",
      icon: <Terminal size={16} className="text-[#FDD663]" />,
      articles: [
        { title: "Standard Force Majeure in Shipping", excerpt: "Reviewing strike, war, and pandemic exclusions in time charterparty agreements." },
        { title: "Bilateral Indemnity Frameworks", excerpt: "Structuring mutual hold harmless agreements for complex offshore operations." },
        { title: "Demurrage & Detention Clauses", excerpt: "Automated calculation logic for port congestion and equipment turnover." }
      ]
    },
    {
      title: "Legal Guidance",
      icon: <Monitor size={16} className="text-[#81C995]" />,
      articles: [
        { title: "Governing Law: London vs Singapore", excerpt: "Comparative analysis of maritime arbitration seats for chartering disputes." },
        { title: "Digital Signature Non-Repudiation", excerpt: "Legal standing of cryptographically sealed documents in Admiralty Courts." },
        { title: "Cargo Lien Execution Procedures", excerpt: "Procedural steps for exercising possessory liens on third-party property." }
      ]
    },
    {
      title: "Best Practices",
      icon: <Activity size={16} className="text-[#F28B82]" />,
      articles: [
        { title: "Signature Lock Workflow Optimization", excerpt: "Reducing turnaround time for bilateral corporate execution through automation." },
        { title: "Clause Library Version Control", excerpt: "Managing legacy and active templates across globally distributed legal teams." },
        { title: "Risk Scoring Methodology", excerpt: "Determining contract exposure levels through automated metadata analysis." }
      ]
    }
  ];

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">SUPPORT & KNOWLEDGE ACCESS</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Support Center</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight">Access maritime compliance manuals, review contract best practices, and request SLA-bound technical assistance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: KB */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeCategories.map((cat, idx) => (
              <div key={idx} className="bg-[#202636] rounded-xl border border-[#2B3347] overflow-hidden flex flex-col hover:border-[#00D4FF]/30 transition-all shadow-lg">
                <div className="bg-[#171B26] px-4 py-3 border-b border-[#2B3347] flex items-center gap-3">
                  {cat.icon}
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">{cat.title}</h3>
                </div>
                <div className="p-4 space-y-4 flex-1">
                  {cat.articles.map((art, aIdx) => (
                    <div key={aIdx} className="group cursor-pointer">
                      <h4 className="text-[11px] font-bold text-[#E8EAED] group-hover:text-[#00D4FF] transition-colors flex items-center justify-between uppercase tracking-tight">
                        {art.title} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <p className="text-[10px] text-[#80868B] mt-1 leading-relaxed font-mono uppercase tracking-tighter">{art.excerpt}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-[#171B26]/50 border-t border-[#2B3347]">
                  <button className="text-[9px] font-bold text-[#00D4FF] uppercase tracking-widest hover:underline flex items-center gap-1">
                    Explore Manuals <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="p-6 bg-[#202636] rounded-xl border border-[#2B3347] shadow-lg">
            <h4 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2 tracking-tight">
              <MessageSquare size={14} className="text-[#00D4FF]" /> Request Technical SLA Assistance
            </h4>

            <form onSubmit={handleSubmitTicket} className="space-y-4 max-w-2xl">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-1.5">Query Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white font-bold font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
                  >
                    <option value="Billing & Ledger">Billing & Contract Credit ledger</option>
                    <option value="SSO & Identity Security">SSO & Identity Directory security</option>
                    <option value="Clause Editing AI">AI Advise Clause Editing errors</option>
                    <option value="General Query">General B2B Operating Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-1.5">Urgency Severity</label>
                  <select
                    value={urgency}
                    onChange={(e: any) => setUrgency(e.target.value)}
                    className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white uppercase font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#00D4FF]"
                  >
                    <option value="low">Low (Standard reply)</option>
                    <option value="normal">Normal SLA (4 hours response)</option>
                    <option value="high">High SLA (1 hour priority response)</option>
                    <option value="critical">Critical (Immediate alert page dispatch)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-1.5">Subject Headline</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Azure Directory synchronization mapping queries"
                  className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] placeholder-[#80868B] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono mb-1.5">Comprehensive Issue Specification</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail error hashes, URL contexts or integration parameters clearly..."
                  className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] placeholder-[#80868B] font-mono uppercase"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  disabled={submitting}
                  type="submit"
                  className="px-6 py-2.5 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-[10px] font-bold rounded transition-all uppercase flex items-center gap-2 shadow-md tracking-widest disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Dispatch Ticket
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: History */}
        <div className="space-y-6">
          <div className="bg-[#202636] rounded-xl border border-[#2B3347] overflow-hidden shadow-lg h-fit">
            <div className="bg-[#171B26] px-5 py-3 border-b border-[#2B3347] flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-white uppercase tracking-widest font-mono">Incident History</h4>
              <span className="text-[9px] font-bold text-[#80868B] uppercase font-mono tracking-tighter">{tickets.length} Records</span>
            </div>
            <div className="p-0 divide-y divide-[#2B3347] max-h-[400px] overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="py-8 text-center text-[#80868B] font-mono uppercase tracking-widest text-[10px]">
                  <RefreshCw size={18} className="animate-spin text-[#00D4FF] mx-auto mb-2" />
                  Synchronizing queue...
                </div>
              ) : tickets.length > 0 ? (
                tickets.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-[#2B3347] transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] uppercase font-mono font-bold px-1 py-0.5 rounded border ${
                            t.urgency === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#2B3347] border-[#2B3347] text-[#BBC0C4]'
                          }`}>{t.urgency}</span>
                          <span className={`px-2 py-0.5 rounded-[2px] text-[8px] font-bold uppercase border ${
                            t.status === 'open' ? 'bg-[#FDD663]/10 text-[#FDD663] border-[#FDD663]/20 animate-pulse' : 'bg-[#00D68F]/10 text-[#00D68F] border border-[#00D68F]/20'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <h5 className="text-[11px] font-bold text-white group-hover:text-[#00D4FF] transition-colors uppercase tracking-tight line-clamp-1">{t.subject}</h5>
                        <p className="text-[9px] text-[#80868B] mt-1 font-mono uppercase tracking-tighter line-clamp-1">{new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight size={14} className="text-[#80868B] shrink-0 mt-1" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[#80868B] text-[10px] font-mono uppercase tracking-widest">
                  No incidents recorded.
                </div>
              )}
            </div>
          </div>

          <div className="p-5 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl">
            <h4 className="text-xs font-bold text-[#00D4FF] uppercase tracking-tight mb-2 flex items-center gap-2">
              <HelpCircle size={14} /> Global SLA Notice
            </h4>
            <p className="text-[10px] text-[#BBC0C4] leading-relaxed font-mono uppercase tracking-tighter">
              Your organization is covered under <b className="text-white">Enterprise Global 24/7</b> support. Initial response time for <b className="text-white text-red-400">CRITICAL</b> events is &lt; 15 mins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal inline mock import of History icon since standard lucide-react exports it
import { History } from 'lucide-react';
