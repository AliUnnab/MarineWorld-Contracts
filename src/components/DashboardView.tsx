import React, { useState, useEffect } from 'react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { 
  FileText, ShieldCheck, FileClock, Users, Coins, Percent, 
  Activity, Award, ArrowUpRight, Plus, Loader2, Save 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
  SaasSubscription, CreditWallet, SaaSContract, 
  WorkspaceMember, AuditLogEvent 
} from '../types/saas';

interface DashboardViewProps {
  userId: string;
  onNavigateTab: (tab: string) => void;
  orgName: string;
}

export default function DashboardView({ userId, onNavigateTab, orgName }: DashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<SaaSContract[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEvent[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Workspace notes states
  const [workspaceNote, setWorkspaceNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Load workspace notes
    const noteRef = doc(db, 'workspace_notes', userId);
    const noteUnsub = onSnapshot(noteRef, (snap) => {
      if (snap.exists()) {
        setWorkspaceNote(snap.data().content || '');
      }
    });

    // Load wallet real-time stats
    const walletUnsub = onSnapshot(doc(db, 'credit_wallets', userId), (snap) => {
      if (snap.exists()) {
        setWallet({ id: snap.id, ...snap.data() } as CreditWallet);
      }
    });

    // Load subscription stats
    const subUnsub = onSnapshot(doc(db, 'subscriptions', userId), (snap) => {
      if (snap.exists()) {
        setSubscription({ id: snap.id, ...snap.data() } as SaasSubscription);
      }
    });

    // Load active contracts
    const contractsQuery = query(collection(db, 'contracts'), where('userId', '==', userId));
    const contractsUnsub = onSnapshot(contractsQuery, (snap) => {
      const records: SaaSContract[] = [];
      snap.forEach((docSnap) => {
        records.push({ id: docSnap.id, ...docSnap.data() } as SaaSContract);
      });
      setContracts(records);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading contracts failed:", error);
      setLoading(false);
    });

    // Load workspace members headcount
    const membersQuery = query(collection(db, 'workspace_members'), where('userId', '==', userId));
    const membersUnsub = onSnapshot(membersQuery, (snap) => {
      setMembersCount(snap.size);
    });

    // Load credit transactions
    const txQuery = query(collection(db, 'credit_transactions'), where('userId', '==', userId));
    const txUnsub = onSnapshot(txQuery, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setTransactions(list);
    });

    // Load recent activity logs
    const logsQuery = query(
      collection(db, 'audit_logs'), 
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const logsUnsub = onSnapshot(logsQuery, (snap) => {
      const logs: AuditLogEvent[] = [];
      snap.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as AuditLogEvent);
      });
      setRecentLogs(logs);
    }, (err) => {
      // In sandbox we fall back gracefully if composite index is still building on timestamp ordering
      const simpleQuery = query(collection(db, 'audit_logs'), where('userId', '==', userId));
      getDocs(simpleQuery).then((snap) => {
        const logs: AuditLogEvent[] = [];
        snap.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...docSnap.data() } as AuditLogEvent);
        });
        // Sort manually client side
        logs.sort((a, b) => {
          const parseTime = (d: any) => {
            if (!d) return 0;
            if (typeof d === 'string') return new Date(d).getTime();
            if (d.toMillis) return d.toMillis();
            if (d.seconds) return d.seconds * 1000;
            return 0;
          };
          return parseTime(b.timestamp) - parseTime(a.timestamp);
        });
        setRecentLogs(logs.slice(0, 5));
      });
    });

    return () => {
      noteUnsub();
      walletUnsub();
      subUnsub();
      contractsUnsub();
      membersUnsub();
      txUnsub();
      logsUnsub();
    };
  }, [userId]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const noteRef = doc(db, 'workspace_notes', userId);
      await setDoc(noteRef, {
        content: workspaceNote,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await logAuditEvent(userId, "Updated Workspace Operational Note on Dashboard", "Workspace Notes");
      console.log("Workspace note successfully committed to Firestore.");
    } catch (err) {
      console.error("Failed to save workspace note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const normalizeStatus = (status: string) => {
    if (!status) return 'Draft';
    const s = status.trim().toLowerCase();
    if (s === 'draft') return 'Draft';
    if (s === 'executed') return 'Executed';
    if (s === 'review') return 'Review';
    if (s === 'approval') return 'Approval';
    if (s === 'pending review' || s === 'pending_review') return 'Pending Review';
    if (s === 'verified') return 'Verified';
    if (s === 'cancelled') return 'Cancelled';
    if (s === 'archived') return 'Archived';
    if (s === 'expired') return 'Expired';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Aggregate stats
  const userContracts = contracts.filter(c => c.userId === userId);
  const draftCount = userContracts.filter(c => normalizeStatus(c.status) === 'Draft').length;
  const executedCount = userContracts.filter(c => normalizeStatus(c.status) === 'Executed').length;
  const activeCount = userContracts.filter(c => {
    const s = normalizeStatus(c.status);
    return s !== 'Executed' && s !== 'Cancelled' && s !== 'Archived' && s !== 'Expired';
  }).length;
  
  // V1.1 New KPIs
  const pendingApprovalsCount = userContracts.filter(c => ['Review', 'Approval', 'Pending Review'].includes(normalizeStatus(c.status))).length;
  const uniqueCounterparties = new Set([...userContracts.map(c => c.buyer), ...userContracts.map(c => c.seller)].filter(Boolean)).size;
  
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const expiringSoonCount = userContracts.filter(c => {
    if (!c.renewalDate) return false;
    const renewal = new Date(c.renewalDate);
    return renewal > now && renewal <= thirtyDaysFromNow;
  }).length;

  const upcomingObligationsCount = userContracts.filter(c => {
    const s = normalizeStatus(c.status);
    return s === 'Review' || s === 'Approval' || s === 'Pending Review';
  }).length + expiringSoonCount;

  const totalValueUSD = userContracts.reduce((sum, c) => {
    const val = parseFloat(c.contractValue?.toString().replace(/,/g, '') || '0');
    if (isNaN(val)) return sum;
    // Convert EUR/others to USD roughly for dashboard uniformity
    const multiplier = c.currency === 'EUR' ? 1.08 : 1.0;
    return sum + (val * multiplier);
  }, 0);

  const formattedTotalValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(totalValueUSD);

  // Generate last 6 months growth data dynamically based on actual contracts
  const getContractGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      last6Months.push({
        name: months[idx],
        monthNum: idx,
        count: 0
      });
    }
    
    last6Months.forEach((monthData) => {
      let cumulativeSum = 0;
      userContracts.forEach((c) => {
        const cDate = new Date(c.createdAt);
        const cMonth = cDate.getMonth();
        const cYear = cDate.getFullYear();
        const currentYear = new Date().getFullYear();
        
        if (cYear < currentYear || (cYear === currentYear && cMonth <= monthData.monthNum)) {
          const val = parseFloat(c.contractValue?.toString().replace(/,/g, '') || '0');
          if (!isNaN(val)) {
            const multiplier = c.currency === 'EUR' ? 1.08 : 1.0;
            cumulativeSum += (val * multiplier);
          }
        }
      });
      monthData.count = cumulativeSum;
    });
    
    return last6Months;
  };

  const contractGrowthData = getContractGrowthData();

  // Filter for credit usages
  const userTransactions = transactions.filter(t => t.userId === userId);
  const usageTx = userTransactions.filter(t => t.changeCredits < 0);
  const totalDebited = Math.abs(usageTx.reduce((sum, t) => sum + t.changeCredits, 0));

  // Group by category/type for bar chart
  const categories: Record<string, number> = {
    'Gen Clause': 0,
    'Revisions': 0,
    'PDF Render': 0,
    'Risk Review': 0
  };

  usageTx.forEach((t) => {
    const packet = (t.packet || '').toLowerCase();
    const change = Math.abs(t.changeCredits);
    if (packet.includes('clause') || packet.includes('generation')) {
      categories['Gen Clause'] += change;
    } else if (packet.includes('revision') || packet.includes('update')) {
      categories['Revisions'] += change;
    } else if (packet.includes('pdf') || packet.includes('render') || packet.includes('export')) {
      categories['PDF Render'] += change;
    } else {
      categories['Risk Review'] += change;
    }
  });

  const creditUsageData = Object.keys(categories).map(key => ({
    name: key,
    value: categories[key]
  }));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#171B26] relative">
        <div className="text-center text-[#BBC0C4]">
          <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={32} />
          <p className="text-sm font-mono uppercase tracking-widest text-[#80868B]">Resolving Live Firestore Pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto text-[#E8EAED] text-left">
      {/* Header Panel */}
      <div 
        className="px-4 sm:px-6 md:px-8 py-8 md:py-12 border-b border-white/5"
        style={{ background: 'linear-gradient(135deg, #040B18 0%, #071326 50%, #0A1930 100%)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#00D4FF] font-bold font-mono">Operations Intelligence Terminal</span>
            <h2 className="text-2xl md:text-3xl font-manrope font-extrabold tracking-tight text-white mt-1 uppercase">{orgName} Dashboard</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-[#BBC0C4] text-[10px] md:text-xs font-medium tracking-tight uppercase max-w-xl leading-relaxed">
                Global Maritime Operating System active. All terminal sessions encrypted with AES-256 standard protocols.
              </p>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded text-[9px] font-mono font-bold text-[#00D4FF] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse"></span> v1.1 Deployment Active
              </div>
            </div>
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-3 md:gap-4 w-full md:w-auto">
            <div className="flex flex-col items-end px-4 py-2 rounded bg-[#040B18]/40 border border-[#00D4FF]/20 backdrop-blur-sm flex-1 md:flex-none">
              <span className="text-[9px] font-bold text-[#80868B] uppercase tracking-widest leading-none">Security Level</span>
              <span className="text-xs font-mono font-bold text-[#00D68F] mt-1.5 uppercase">L5 - Critical Access</span>
            </div>
            <button 
              onClick={() => onNavigateTab('New Contract')}
              className="flex items-center justify-center gap-2 px-6 py-2.5 md:py-2 rounded bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-[11px] font-bold uppercase transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)] flex-1 md:flex-none h-[52px] md:h-auto"
            >
              <Plus size={14} /> Initialize Draft
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* Main Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-10">
          {/* Active Contracts Card */}
          <div className="p-5 md:p-6 bg-[#202636] rounded-xl border border-white/5 hover:border-[#00D4FF]/30 transition-all flex justify-between items-start group">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-[#80868B] uppercase tracking-widest">Active Agreements</p>
              <h4 className="text-2xl md:text-3xl font-manrope font-semibold text-white mt-2 tracking-tighter">{activeCount}</h4>
              <span className="text-[9px] text-[#00D68F] font-bold flex items-center gap-1.5 mt-4 uppercase tracking-tighter">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] animate-pulse"></span> Query Optimized
              </span>
            </div>
            <div className="p-2.5 md:p-3 rounded-lg bg-[#171B26] text-[#00D4FF] border border-white/5">
              <FileClock size={16} />
            </div>
          </div>

          {/* Pending Approvals Card */}
          <div className="p-5 md:p-6 bg-[#202636] rounded-xl border border-white/5 hover:border-[#FDD663]/30 transition-all flex justify-between items-start">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-[#80868B] uppercase tracking-widest">Pending Approvals</p>
              <h4 className="text-2xl md:text-3xl font-manrope font-semibold text-white mt-2 tracking-tighter">{pendingApprovalsCount}</h4>
              <span className="text-[9px] text-[#FDD663] font-mono mt-4 uppercase tracking-tighter block font-bold">Awaiting Compliance Review</span>
            </div>
            <div className="p-2.5 md:p-3 rounded-lg bg-[#171B26] text-[#FDD663] border border-white/5">
              <ShieldCheck size={16} />
            </div>
          </div>

          {/* Active Counterparties Card */}
          <div className="p-5 md:p-6 bg-[#202636] rounded-xl border border-white/5 hover:border-[#00D4FF]/30 transition-all flex justify-between items-start cursor-pointer group" onClick={() => onNavigateTab('Counterparty Management')}>
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-[#80868B] uppercase tracking-widest">Active Counterparties</p>
              <h4 className="text-2xl md:text-3xl font-manrope font-semibold text-white mt-2 tracking-tighter">{uniqueCounterparties}</h4>
              <span className="text-[9px] text-[#00D4FF] font-bold hover:underline flex items-center gap-1 mt-4 uppercase tracking-tighter">Global Entities <ArrowUpRight size={12} /></span>
            </div>
            <div className="p-2.5 md:p-3 rounded-lg bg-[#171B26] text-[#BBC0C4] border border-white/5 group-hover:text-[#00D4FF] transition-colors">
              <Users size={16} />
            </div>
          </div>

          {/* Total Portfolio Value Card */}
          <div className="p-5 md:p-6 bg-[#202636] rounded-xl border border-white/5 hover:border-[#00D68F]/30 transition-all flex justify-between items-start">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-[#80868B] uppercase tracking-widest">Total Portfolio Value</p>
              <h4 className="text-xl md:text-2xl font-manrope font-semibold text-[#00D68F] mt-2 tracking-tighter">{formattedTotalValue}</h4>
              <span className="text-[9px] text-[#80868B] mt-4 block font-mono uppercase tracking-tighter">Aggregate Maritime Assets</span>
            </div>
            <div className="p-2.5 md:p-3 rounded-lg bg-[#171B26] text-[#00D68F] border border-white/5">
              <Coins size={16} />
            </div>
          </div>
        </div>

        {/* Sub Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-10">
          {/* Contracts Expiring Card */}
          <div className="p-4 md:p-5 bg-[#202636] rounded-xl border border-white/5 hover:border-[#F28B82]/30 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#171B26] flex items-center justify-center text-[#F28B82] border border-white/5 shrink-0">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[8px] font-bold text-[#80868B] uppercase tracking-widest">Contracts Expiring (30D)</p>
              <h5 className="text-lg font-manrope font-bold text-white tracking-tight">{expiringSoonCount} Documents</h5>
            </div>
          </div>

          {/* Upcoming Obligations Card */}
          <div className="p-4 md:p-5 bg-[#202636] rounded-xl border border-white/5 hover:border-[#00D4FF]/30 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#171B26] flex items-center justify-center text-[#00D4FF] border border-white/5 shrink-0">
              <Award size={18} />
            </div>
            <div>
              <p className="text-[8px] font-bold text-[#80868B] uppercase tracking-widest">Upcoming Obligations</p>
              <h5 className="text-lg font-manrope font-bold text-white tracking-tight">{upcomingObligationsCount} Key Milestones</h5>
            </div>
          </div>

          {/* Executed Ledger Card */}
          <div className="p-4 md:p-5 bg-[#202636] rounded-xl border border-white/5 hover:border-[#00D68F]/30 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#171B26] flex items-center justify-center text-[#00D68F] border border-white/5 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[8px] font-bold text-[#80868B] uppercase tracking-widest">Executed Ledger</p>
              <h5 className="text-lg font-manrope font-bold text-white tracking-tight">{executedCount} Verified Covenants</h5>
            </div>
          </div>
        </div>

        {/* Visual Analytics Row - 1 Col on Mobile/Tablet, 3 Col on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 md:mb-10">
          {/* Double charts */}
          <div className="lg:col-span-2 p-6 md:p-8 bg-[#202636] rounded-2xl border border-white/5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <h4 className="text-[11px] md:text-xs font-bold text-white uppercase tracking-[0.1em]">Value Accumulation Metrics</h4>
                <p className="text-[10px] md:text-[11px] text-[#80868B] mt-1 font-mono uppercase tracking-tighter">Cumulative contract value across maritime routes</p>
              </div>
              <span className="text-lg md:text-xl font-bold text-[#00D4FF] font-mono tracking-tighter">{formattedTotalValue} USD</span>
            </div>
            <div className="h-[200px] md:h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={contractGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="#80868B" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#80868B" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#202636', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '10px' }}
                    itemStyle={{ color: '#00D4FF', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#00D4FF" strokeWidth={3} fillOpacity={1} fill="url(#valueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Credit Usage Breakdown bar chart */}
          <div className="p-6 md:p-8 bg-[#202636] rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <h4 className="text-[11px] md:text-xs font-bold text-white uppercase tracking-[0.1em] mb-1">Operational Credit Usage</h4>
              <p className="text-[10px] md:text-[11px] text-[#80868B] font-mono uppercase tracking-tighter">Resource units consumed by advanced services</p>
            </div>
            <div className="h-[180px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={creditUsageData} margin={{ left: -30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="#80868B" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#80868B" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#202636', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '10px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="value" fill="#00D68F" radius={[2, 2, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-white/5 mt-6 text-[9px] md:text-[10px] text-[#BBC0C4] font-bold uppercase tracking-wider">
              <span>Total Debited 30D</span>
              <span className="text-[#00D68F] font-mono">{totalDebited} Credits</span>
            </div>
          </div>
        </div>

        {/* Operations Telemetry & Workspace Directives Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Section */}
          <div className="lg:col-span-2 p-6 md:p-8 bg-[#202636] rounded-2xl border border-white/5 shadow-[0_0_24px_rgba(0,212,255,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <span className="flex items-center gap-1.5 text-[10px] text-[#00D4FF] font-bold uppercase tracking-[0.15em]">
                    <Activity size={12} /> System Telemetry Stream
                  </span>
                  <h4 className="text-[#80868B] text-[10px] md:text-[11px] mt-1 font-mono uppercase tracking-tighter">Real-time audit listening to isolated workspace</h4>
                </div>
                <button 
                  onClick={() => onNavigateTab('Audit Logs')}
                  className="w-full sm:w-auto text-[10px] md:text-[11px] text-[#00D4FF] hover:text-[#33DDFF] font-bold uppercase tracking-widest border border-[#00D4FF]/20 px-4 py-2 rounded-lg transition-all text-center"
                >
                  Expand Ledger
                </button>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-xs text-[#E8EAED]">
                  <thead>
                    <tr className="border-b border-white/5 text-[#80868B] text-left uppercase font-mono tracking-tighter text-[9px]">
                      <th className="pb-4 font-bold">Node Operator</th>
                      <th className="pb-4 font-bold">Action Vector</th>
                      <th className="pb-4 font-bold">Object Pointer</th>
                      <th className="pb-4 font-bold">Vector IP</th>
                      <th className="pb-4 text-right font-bold">Timeframe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-[11px]">
                    {recentLogs.length > 0 ? (
                      recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4">
                            <p className="font-bold text-white uppercase tracking-tight">{log.actorName || "Unresolved"}</p>
                            <span className="text-[9px] text-[#80868B] font-mono">{log.actorEmail}</span>
                          </td>
                          <td className="py-4 text-[#BBC0C4] uppercase tracking-tight">{log.action || "Standard Operation"}</td>
                          <td className="py-4 font-mono text-[#80868B] uppercase tracking-tighter">{log.targetDocument || "System Root"}</td>
                          <td className="py-4 font-mono text-[#80868B]">{log.ipAddress || "127.0.0.1"}</td>
                          <td className="py-4 text-right text-[#80868B] font-mono group-hover:text-white transition-colors">
                            {(() => {
                              if (!log.timestamp) return "Just Now";
                              const date = typeof log.timestamp === 'string' ? new Date(log.timestamp) : (log.timestamp as any).toDate?.() || new Date(log.timestamp);
                              return isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString();
                            })()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#80868B] font-mono uppercase tracking-widest text-[10px]">
                          No immediate audit activity recorded for this secure session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card List View */}
              <div className="lg:hidden space-y-4">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-[#171B26] border border-white/5 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-white uppercase tracking-tight">{log.actorName || "Unresolved"}</p>
                          <p className="text-[9px] text-[#80868B] font-mono">{log.actorEmail}</p>
                        </div>
                        <span className="text-[9px] text-[#80868B] font-mono whitespace-nowrap">
                          {(() => {
                            if (!log.timestamp) return "Just Now";
                            const date = typeof log.timestamp === 'string' ? new Date(log.timestamp) : (log.timestamp as any).toDate?.() || new Date(log.timestamp);
                            return isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString();
                          })()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/[0.03]">
                        <div>
                          <span className="text-[8px] font-bold text-[#80868B] uppercase block">Action</span>
                          <span className="text-[10px] text-[#BBC0C4] uppercase font-medium">{log.action || "Standard Operation"}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-[#80868B] uppercase block">Pointer</span>
                          <span className="text-[10px] text-[#80868B] font-mono truncate block">{log.targetDocument || "System Root"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-[#80868B] font-mono uppercase tracking-widest text-[10px]">
                    No immediate audit activity recorded.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Workspace Notes Card */}
          <div className="p-6 md:p-8 bg-[#202636] rounded-2xl border border-white/5 shadow-[0_0_24px_rgba(0,212,255,0.03)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <span className="flex items-center gap-1.5 text-[10px] text-[#00D4FF] font-bold uppercase tracking-[0.15em]">
                    <FileText size={12} /> Workspace Notes
                  </span>
                  <h4 className="text-[#80868B] text-[10px] md:text-[11px] mt-1 font-mono uppercase tracking-tighter">Operational directives & reminders</h4>
                </div>
              </div>
              <textarea
                value={workspaceNote}
                onChange={(e) => setWorkspaceNote(e.target.value)}
                placeholder="Enter operational directives, reminders, or workspace compliance notes... Data is saved to Firestore."
                className="w-full h-[180px] bg-[#171B26] border border-white/5 rounded-xl p-4 text-xs text-[#E8EAED] focus:outline-none focus:ring-1 focus:ring-[#00D4FF] placeholder-[#80868B] resize-none font-mono leading-relaxed"
              />
            </div>
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00D4FF]/15 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/20 text-[#00D4FF] text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {savingNote ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="animate-spin animate-duration-1000" size={12} /> Saving Directives...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Save size={12} /> Save Workspace Note
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
