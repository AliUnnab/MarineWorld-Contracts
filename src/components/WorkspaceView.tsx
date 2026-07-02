import React, { useState, useEffect } from 'react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  Users, UserPlus, ShieldAlert, Check, X, Loader2, 
  Trash2, Mail, Briefcase, RefreshCw, Star 
} from 'lucide-react';
import { WorkspaceMember } from '../types/saas';
import { CreditBalance, CreditLedgerEntry } from '../types/credits';
import { CreditService } from '../../services/credit-service';
import { 
  Activity, ArrowUpRight, BarChart3, Coins, History, 
  Settings2, Zap, ZapOff, CheckCircle2, AlertCircle, PlusCircle
} from 'lucide-react';

interface WorkspaceViewProps {
  userId: string;
  userEmail: string;
  subscriptionPlan?: "None" | "Starter" | "Professional" | "Enterprise";
  onNavigate?: (tab: string) => void;
}

export default function WorkspaceView({ userId, userEmail, subscriptionPlan, onNavigate }: WorkspaceViewProps) {
  const isTR = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr');
  const t = (en: string, tr: string) => (isTR ? tr : en);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'teammates' | 'credits'>('teammates');
  
  // Invite state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeWarning, setShowUpgradeWarning] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Owner' | 'Legal Counsel' | 'Reviewer' | 'Finance' | 'Executive' | 'External Counsel'>('Reviewer');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Ensure balance initialized
    CreditService.ensureBalance(userId, userEmail).then(setBalance);

    // Listen to credits balance
    const unsubBalance = CreditService.subscribeToBalance(userId, setBalance);

    // Listen to credit ledger
    const unsubLedger = CreditService.subscribeToLedger(userId, setLedger);

    // Listen to workspace teammates
    const qMembers = query(collection(db, 'workspace_members'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(qMembers, (snap) => {
      const records: WorkspaceMember[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === userId) {
          records.push({ id: docSnap.id, ...data } as WorkspaceMember);
        }
      });
      setMembers(records);
      setLoading(false);
    }, (err) => {
      console.error("Firestore workspace member listen failed:", err);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubBalance();
      unsubLedger();
    };
  }, [userId]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    setSubmittingInvite(true);
    try {
      // Add member to Firestore
      const membersRef = collection(db, 'workspace_members');
      await addDoc(membersRef, {
        userId: userId,
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: "pending",
        invitedAt: new Date().toISOString()
      });

      // Log to audit log
      await logAuditEvent(userId, `Workspace Teammate Invitation Sent to ${inviteEmail} as ${inviteRole}`, "Workspace Directory Security");

      // Reset and close
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Reviewer');
      setShowInviteModal(false);
      console.log(`Invitation dispatched successfully to ${inviteEmail}!`);
    } catch (err) {
      console.error("Failed to insert workspace teammate:", err);
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleDeleteMember = async (memberId: string, email: string) => {
    if (email === userEmail) {
      console.log("You cannot remove your own administrative Owner account from the workspace environment.");
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'workspace_members', memberId));
      
      // Log to audit log
      await logAuditEvent(userId, `Revoked Workspace access keys for teammate ${email}`, "Workspace Directory Security");
    } catch (err) {
      console.error("Audit deletion teammate error:", err);
    }
  };

  const handleRoleUpdate = async (memberId: string, email: string, newRole: any) => {
    if (email === userEmail) {
      console.log("You cannot change your own workspace executive Owner role.");
      return;
    }
    try {
      await updateDoc(doc(db, 'workspace_members', memberId), {
        role: newRole
      });
      await logAuditEvent(userId, `Updated teammate role for ${email} to ${newRole}`, "Workspace Directory Security");
    } catch (err) {
      console.error("Teammate role update failed:", err);
    }
  };

  const handleInviteClick = () => {
    let limit = Infinity;
    if (subscriptionPlan === 'Starter') {
      limit = 1;
    } else if (subscriptionPlan === 'Professional') {
      limit = 3;
    }

    if (members.length >= limit) {
      setShowUpgradeWarning(true);
    } else {
      setShowInviteModal(true);
    }
  };

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-[#202636] border border-[#2B3347] rounded-lg w-fit mb-8">
        <button
          onClick={() => setActiveSubTab('teammates')}
          className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all tracking-wider ${
            activeSubTab === 'teammates' ? 'bg-[#2B3347] text-[#00D4FF] shadow-sm' : 'text-[#80868B] hover:text-white'
          }`}
        >
          <Users size={12} className="inline mr-1.5" /> Team Management
        </button>
        <button
          onClick={() => setActiveSubTab('credits')}
          className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all tracking-wider ${
            activeSubTab === 'credits' ? 'bg-[#2B3347] text-[#00D4FF] shadow-sm' : 'text-[#80868B] hover:text-white'
          }`}
        >
          <Coins size={12} className="inline mr-1.5" /> Operational Credits
        </button>
      </div>

      {activeSubTab === 'teammates' ? (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">WORKSPACE ACCESS PERMISSIONS</span>
              <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Team & Workspace</h2>
              <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight mt-1 max-w-2xl">Configure granular role-based access limits (RBAC) across counsels, reviewers, and procurement officers.</p>
              
              <div className="flex gap-6 mt-4">
                <div className="bg-[#202636] border border-[#2B3347] rounded px-4 py-2 flex flex-col">
                  <span className="text-[10px] text-[#80868B] uppercase tracking-widest font-bold">Starter Tier</span>
                  <span className="text-xs text-white font-mono mt-1">1 Workspace User</span>
                </div>
                <div className="bg-[#202636] border border-[#2B3347] rounded px-4 py-2 flex flex-col">
                  <span className="text-[10px] text-[#80868B] uppercase tracking-widest font-bold">Professional Tier</span>
                  <span className="text-xs text-white font-mono mt-1">3 Workspace Users</span>
                </div>
                <div className="bg-[#202636] border border-[#2B3347] rounded px-4 py-2 flex flex-col">
                  <span className="text-[10px] text-[#80868B] uppercase tracking-widest font-bold">Enterprise Tier</span>
                  <span className="text-xs text-white font-mono mt-1">Unlimited Workspace Users</span>
                </div>
              </div>

              {/* Numeric seat utilization status */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <div className="bg-[#2B3347]/40 border border-[#2B3347] rounded-lg p-3 px-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]">
                    <Users size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] text-[#80868B] uppercase font-mono font-bold leading-none block">Active Seat Capacity</span>
                    <p className="text-sm font-mono font-bold text-white mt-0.5">
                      {members.length} / {subscriptionPlan === 'Starter' ? '1' : subscriptionPlan === 'Professional' ? '3' : 'Unlimited'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#2B3347]/40 border border-[#2B3347] rounded-lg p-3 px-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00D68F]/10 flex items-center justify-center text-[#00D68F]">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <span className="text-[9px] text-[#80868B] uppercase font-mono font-bold leading-none block">Workspace Status</span>
                    <p className="text-xs font-mono font-bold text-[#00D68F] mt-0.5 uppercase">
                      {members.length >= (subscriptionPlan === 'Starter' ? 1 : subscriptionPlan === 'Professional' ? 3 : Infinity) 
                        ? 'Full Capacity' 
                        : 'Seats Available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={handleInviteClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-[10px] uppercase font-bold transition-all shadow-sm tracking-wider shrink-0 mt-4 md:mt-0"
            >
              <UserPlus size={14} /> Invite Teammate
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={32} />
              <p className="text-xs font-mono text-[#80868B] uppercase tracking-widest">Querying workspace collaboration list...</p>
            </div>
          ) : (
            <div className="bg-[#202636] rounded border border-[#2B3347] overflow-hidden">
              <table className="w-full text-xs text-[#E8EAED]">
                <thead>
                  <tr className="bg-[#171B26] border-b border-[#2B3347] font-mono text-[#80868B] uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-6 text-left font-bold">User Identity Name</th>
                    <th className="py-3.5 px-6 text-left font-bold">Teammate Email</th>
                    <th className="py-3.5 px-6 text-left font-bold">Operational Role Limits</th>
                    <th className="py-3.5 px-6 text-left font-bold">Status</th>
                    <th className="py-3.5 px-6 text-left font-bold">Access Checklists</th>
                    <th className="py-3.5 px-6 text-right pr-6 font-bold">Revocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3347]">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-[#2B3347] transition-colors">
                        {/* User profile */}
                        <td className="py-4 px-6 font-semibold text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-[#171B26] border border-[#2B3347] flex items-center justify-center font-bold text-xs text-[#00D4FF] uppercase font-mono">
                            {member.name ? member.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="uppercase tracking-tight">{member.name}</p>
                            <span className="text-[9px] text-[#80868B] font-mono uppercase">Colleague ID</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-6 text-[#BBC0C4] font-mono select-all text-[11px]">
                          {member.email}
                        </td>

                        {/* Operational Limits / Roles */}
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          {member.email === userEmail ? (
                            <span className="px-2 py-1 bg-[#171B26] border border-[#2B3347] rounded font-mono text-[9px] text-[#00D4FF] flex items-center gap-1.5 w-fit uppercase font-bold tracking-widest">
                              <Star size={11} className="text-[#FDD663]" /> {member.role}
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleUpdate(member.id, member.email, e.target.value)}
                              className="bg-[#171B26] border border-[#2B3347] px-2 py-1 rounded text-[10px] text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#00D4FF] uppercase"
                            >
                              <option value="Owner">Owner</option>
                              <option value="Legal Counsel">Legal Counsel</option>
                              <option value="Reviewer">Reviewer</option>
                              <option value="Finance">Finance</option>
                              <option value="Executive">Executive</option>
                              <option value="External Counsel">External Counsel</option>
                            </select>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            member.status === 'active' 
                              ? 'bg-[#00D68F]/10 text-[#00D68F] border-[#00D68F]/20' 
                              : 'bg-[#FDD663]/10 text-[#FDD663] border-[#FDD663]/20'
                          }`}>
                            {member.status}
                          </span>
                        </td>

                        {/* Standard Role Permissions */}
                        <td className="py-4 px-6 text-[10px] text-[#80868B] max-w-[190px] truncate font-mono uppercase tracking-tighter">
                          {member.role === 'Owner' || member.role === 'Executive' ? (
                            <span className="text-[#00D68F] font-bold">Total Write & Sign access</span>
                          ) : member.role === 'Legal Counsel' || member.role === 'External Counsel' ? (
                            "Edit clauses, lock, generate summaries"
                          ) : member.role === 'Finance' ? (
                            "Edit values, export pdf envelopes, billing access"
                          ) : (
                            "Suggest revisions only"
                          )}
                        </td>

                        {/* Revocation trigger */}
                        <td className="py-4 px-6 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          {member.email !== userEmail && (
                            <button
                              onClick={() => handleDeleteMember(member.id, member.email)}
                              className="p-1 px-2.5 rounded border border-[#F28B82]/20 text-[#F28B82] hover:bg-[#F28B82]/10 transition-colors uppercase font-bold text-[9px] tracking-wider"
                              title="Revoke session tokens"
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#80868B] uppercase font-mono tracking-widest">
                        No colleagues mapped under this tenant id.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Credit Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6">
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">OPERATIONAL CAPACITY TERMINAL</span>
              <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Credit Dashboard</h2>
              <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight mt-1 max-w-2xl">Monitor resource units consumed by AI Assistant and AI Advisor modules in real-time.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-[#171B26] border border-[#2B3347] px-4 py-2 rounded shadow-inner">
                <span className="text-[10px] font-bold text-[#80868B] uppercase font-mono tracking-widest">Auto Recharge:</span>
                <button
                  onClick={() => CreditService.setAutoRecharge(userId, !balance?.autoRecharge)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors relative border border-[#2B3347] ${
                    balance?.autoRecharge ? 'bg-[#00D68F]' : 'bg-[#171B26]'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${balance?.autoRecharge ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
                {balance?.autoRecharge ? <Zap size={14} className="text-[#00D68F]" /> : <ZapOff size={14} className="text-[#80868B]" />}
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-[#202636] border border-[#2B3347] rounded-xl flex flex-col justify-between group hover:border-[#00D4FF]/30 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.15em] font-mono">Credits Remaining</span>
                  <Coins size={16} className="text-[#00D4FF]" />
                </div>
                <h4 className="text-3xl font-manrope font-bold text-white mt-3 tracking-tighter">{balance?.creditsRemaining ?? 0}</h4>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2B3347] flex justify-between items-center text-[10px] font-mono text-[#80868B]">
                <span>TOTAL CAPACITY</span>
                <span className="text-white font-bold">{balance?.creditsTotal ?? 0}</span>
              </div>
            </div>

            <div className="p-5 bg-[#202636] border border-[#2B3347] rounded-xl flex flex-col justify-between hover:border-[#00D68F]/30 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.15em] font-mono">Credits Consumed</span>
                  <BarChart3 size={16} className="text-[#00D68F]" />
                </div>
                <h4 className="text-3xl font-manrope font-bold text-white mt-3 tracking-tighter">{balance?.creditsUsed ?? 0}</h4>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2B3347] flex justify-between items-center text-[10px] font-mono text-[#80868B]">
                <span>TODAY'S USAGE</span>
                <span className="text-[#00D68F] font-bold">-{balance?.todayUsage ?? 0}</span>
              </div>
            </div>

            <div className="p-5 bg-[#202636] border border-[#2B3347] rounded-xl flex flex-col justify-between hover:border-[#FDD663]/30 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.15em] font-mono">Monthly Allocation</span>
                  <Activity size={16} className="text-[#FDD663]" />
                </div>
                <h4 className="text-3xl font-manrope font-bold text-white mt-3 tracking-tighter">{balance?.monthlyAllocation ?? 0}</h4>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2B3347] flex justify-between items-center text-[10px] font-mono text-[#80868B]">
                <span>CURRENT PLAN</span>
                <span className="text-white font-bold uppercase">{balance?.plan ?? 'Starter'}</span>
              </div>
            </div>

            <div className="p-5 bg-[#202636] border border-[#2B3347] rounded-xl flex flex-col justify-between hover:border-[#00D4FF]/30 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.15em] font-mono">Credits Purchased</span>
                  <PlusCircle size={16} className="text-[#00D4FF]" />
                </div>
                <h4 className="text-3xl font-manrope font-bold text-white mt-3 tracking-tighter">{balance?.purchasedCredits ?? 0}</h4>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2B3347] flex justify-between items-center text-[10px] font-mono text-[#80868B]">
                <span>TOP-UP PACKS</span>
                <button onClick={() => onNavigate?.('Credit Wallet')} className="text-[#00D4FF] hover:underline font-bold uppercase text-[9px]">Refill Wallet</button>
              </div>
            </div>
          </div>

          {/* Detailed Usage & Ledger */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 bg-[#202636] border border-[#2B3347] rounded-xl">
                <h5 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono mb-6">Service Consumption</h5>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] mb-2 font-mono uppercase">
                      <span className="text-[#80868B]">Assistant Usage</span>
                      <span className="text-white font-bold">{balance?.assistantUsage ?? 0} Units</span>
                    </div>
                    <div className="w-full bg-[#171B26] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#00D4FF] h-full" style={{ width: `${Math.min(100, ((balance?.assistantUsage ?? 0) / (balance?.creditsTotal ?? 1)) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-2 font-mono uppercase">
                      <span className="text-[#80868B]">AI Advisor Usage</span>
                      <span className="text-white font-bold">{balance?.advisorUsage ?? 0} Units</span>
                    </div>
                    <div className="w-full bg-[#171B26] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#00D68F] h-full" style={{ width: `${Math.min(100, ((balance?.advisorUsage ?? 0) / (balance?.creditsTotal ?? 1)) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#2B3347] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-[#00D68F] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-tight">Atomic Synchronization</p>
                      <p className="text-[9px] text-[#80868B] font-mono uppercase leading-tight mt-0.5">Balance is verified in real-time across all nodes.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-[#FDD663] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-tight">Threshold Lock</p>
                      <p className="text-[9px] text-[#80868B] font-mono uppercase leading-tight mt-0.5">AI execution blocked if balance is below cost.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-[#202636] border border-[#2B3347] rounded-xl overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-[#2B3347] flex justify-between items-center bg-[#171B26]/30">
                  <h5 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Permanent Credit Ledger</h5>
                  <span className="text-[9px] text-[#80868B] font-mono uppercase">Last 50 Transmissions</span>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-xs text-[#E8EAED]">
                    <thead>
                      <tr className="bg-[#171B26] border-b border-[#2B3347] text-[#80868B] text-left uppercase tracking-tighter font-mono text-[9px]">
                        <th className="py-3 px-6 font-bold">Transaction ID</th>
                        <th className="py-3 px-6 font-bold">Vector Module</th>
                        <th className="py-3 px-6 font-bold">Status</th>
                        <th className="py-3 px-6 text-right font-bold">Units</th>
                        <th className="py-3 px-6 text-right font-bold">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2B3347]">
                      {ledger.length > 0 ? (
                        ledger.map((entry) => (
                          <tr key={entry.id} className="hover:bg-[#2B3347] transition-colors group">
                            <td className="py-3 px-6 font-mono text-[10px] text-[#80868B]">
                              TX_{entry.id?.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="py-3 px-6">
                              <p className="text-[10px] font-bold text-white uppercase tracking-tight">{entry.module}</p>
                              <span className="text-[9px] text-[#80868B] font-mono uppercase block">{entry.action}</span>
                            </td>
                            <td className="py-3 px-6">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                entry.status === 'success' ? 'bg-[#00D68F]/10 text-[#00D68F] border-[#00D68F]/20' : 'bg-[#F28B82]/10 text-[#F28B82] border-[#F28B82]/20'
                              }`}>
                                {entry.status}
                              </span>
                            </td>
                            <td className={`py-3 px-6 text-right font-mono font-bold ${entry.creditsConsumed > 0 ? 'text-[#F28B82]' : 'text-[#00D68F]'}`}>
                              {entry.creditsConsumed > 0 ? `-${entry.creditsConsumed}` : `+${Math.abs(entry.creditsConsumed)}`}
                            </td>
                            <td className="py-3 px-6 text-right font-mono text-white font-bold">{entry.creditsRemaining}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[#80868B] font-mono uppercase tracking-widest text-[10px]">
                            No operational ledger entries recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Warning Modal */}
      {showUpgradeWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#040B18]/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-md bg-[#202636] border border-[#2B3347] rounded p-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowUpgradeWarning(false)}
              className="absolute top-4 right-4 text-[#80868B] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-[#2B3347] pb-4 mb-6">
              <div className="w-10 h-10 rounded bg-[#F28B82]/10 text-[#F28B82] border border-[#F28B82]/20 flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Limit Reached</h3>
                <p className="text-[10px] text-[#80868B] font-mono uppercase">Upgrade required to add teammates</p>
              </div>
            </div>

            <p className="text-sm text-[#BBC0C4] mb-6">
              Your current {subscriptionPlan} subscription allows up to {subscriptionPlan === 'Starter' ? '1 Workspace User' : '3 Workspace Users'}. To add more colleagues to your workspace, please upgrade your operational tier in the Subscription Center.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowUpgradeWarning(false)}
                className="px-4 py-2 bg-[#2B3347] hover:bg-[#323D52] text-[10px] text-[#80868B] rounded transition-all font-bold uppercase tracking-wider"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeWarning(false);
                  if (onNavigate) {
                    onNavigate('Subscription Center');
                  }
                }}
                className="px-4 py-2 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-[10px] font-bold rounded transition-all uppercase flex items-center justify-center tracking-wider"
              >
                Go to Subscription Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite teammate Modal Drawer */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#040B18]/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-md bg-[#202636] border border-[#2B3347] rounded p-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-[#80868B] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-[#2B3347] pb-4 mb-6">
              <div className="w-10 h-10 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Invite Corporate Teammate</h3>
                <p className="text-[10px] text-[#80868B] font-mono uppercase">Register billing seats under your workspace ID</p>
              </div>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono">Colleague Full Name</label>
                <div className="mt-1 relative rounded shadow-sm">
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Jean-Pierre Laurent"
                    className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#00D4FF] placeholder-[#80868B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono">Business Email Address</label>
                <div className="mt-1 relative rounded shadow-sm">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company-group.org"
                    className="block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] placeholder-[#80868B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-[#80868B] uppercase font-bold font-mono">Operational Seat Authorization</label>
                <select
                  value={inviteRole}
                  onChange={(e: any) => setInviteRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded text-xs text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#00D4FF] uppercase"
                >
                  <option value="Owner">Owner (Full administrative edit)</option>
                  <option value="Legal Counsel">Legal Counsel (Edit clauses only)</option>
                  <option value="Reviewer">Reviewer (Suggest revisions only)</option>
                  <option value="Finance">Finance (Billing & Values)</option>
                  <option value="Executive">Executive (Full access)</option>
                  <option value="External Counsel">External Counsel (Specialized edit)</option>
                </select>
              </div>

              <div className="bg-[#171B26] p-3.5 rounded border border-[#2B3347] text-[10px] text-[#BBC0C4] flex gap-2 font-mono uppercase tracking-tight">
                <ShieldAlert size={16} className="text-[#FDD663] shrink-0" />
                <span>Inviting will automatically allocate and assign a legal seat matching local billing agreements.</span>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-[#2B3347] hover:bg-[#323D52] text-[10px] text-[#80868B] rounded transition-all font-bold uppercase tracking-wider"
                >
                  Close Drawer
                </button>
                <button
                  disabled={submittingInvite}
                  type="submit"
                  className="px-4 py-2 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-[10px] font-bold rounded transition-all uppercase flex items-center justify-center gap-1 tracking-wider"
                >
                  {submittingInvite && <Loader2 size={12} className="animate-spin" />}
                  <span>Dispatch invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
