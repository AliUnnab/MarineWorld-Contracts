import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase-service';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Search, ArrowUpDown, ChevronDown, ChevronUp, FileText, 
  ExternalLink, Trash2, Calendar, ShieldCheck, PenTool, 
  Plus, AlertCircle, RefreshCw 
} from 'lucide-react';
import { SaaSContract } from '../types/saas';
import { mockContracts } from '../mockDataFallback';

interface RepositoryViewProps {
  userId: string;
  onOpenContract: (contract: SaaSContract) => void;
  onNavigateTab: (tab: string) => void;
}

export default function RepositoryView({ userId, onOpenContract, onNavigateTab }: RepositoryViewProps) {
  const [contracts, setContracts] = useState<SaaSContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedValueRange, setSelectedValueRange] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedRiskScore, setSelectedRiskScore] = useState<string>('ALL');
  const [selectedLaw, setSelectedLaw] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';

    const isQuotaError = (error: any) => {
      return error && (
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('limit') ||
        error.message?.toLowerCase().includes('resource_exhausted') ||
        error.code === 'resource-exhausted'
      );
    };

    if (quotaActive) {
      setContracts(mockContracts);
      setLoading(false);
      return;
    }

    const triggerQuotaFallback = () => {
      (window as any).__markQuotaExceeded?.();
      setContracts(mockContracts);
      setLoading(false);
    };

    const qContracts = query(collection(db, 'contracts'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(qContracts, (snap) => {
      const records: SaaSContract[] = [];
      snap.forEach((docSnap) => {
        records.push({ id: docSnap.id, ...docSnap.data() } as SaaSContract);
      });
      setContracts(records);
      setLoading(false);
    }, (err) => {
      console.error("Repository listener bound error:", err);
      if (isQuotaError(err)) {
        triggerQuotaFallback();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const groupedAgreementTypes = {
    "Maritime Logistics & Sea Trade": [
      "Charter Agreement", "Bareboat Charter Agreement", "Crewed Charter Agreement", "Time Charter Party Agreement", "Voyage Charter Party Agreement", "Bill of Lading (B/L) Contract", "Marine Freight Logistics Agreement", "Ocean Towage & Salvage Contract", "Vessel Brokerage & Cargo Agency"
    ],
    "Marine Shipyard & Refit Services": [
      "Shipbuilding Contract", "New Build Agreement", "Shipyard Refit & Retrofit Agreement", "Dry Docking Services Agreement", "Marine Engineering & Technical Services", "Vessel Maintenance & Repair (M&R)", "Equipment Supply & OEM Production"
    ],
    "Marina, Berthing & Port Operations": [
      "Berthing Lease Agreement", "Marina Services Agreement", "Port Agency & Stevedoring Agreement", "Wharfage & Cargo Handling Agreement", "Operational Support Agreement"
    ],
    "Vessel Ownership & Management": [
      "Vessel Sale & Purchase (S&P) Agreement", "Yacht Sale & Purchase Agreement", "Memorandum of Agreement (MOA)", "Sea Trial & Pre-Purchase Agreement", "Vessel Management Agreement (SHIPMAN)", "Technical & Fleet Management Agreement"
    ],
    "Marine Legal, HR & Advisory": [
      "Crew Employment Agreement (SEA)", "Captain Employment Agreement", "Crew Management & Crewing Services", "Marine Insurance Placement Contract", "Maritime Legal Advisory & Representation", "Condition & Pre-Purchase Survey Agreement"
    ],
    "Technology & Marine AI": [
      "Software Licensing & Vessel IoT SaaS", "API Access & Telematics Data Sharing", "Marine Cybersecurity Audit Services", "AI Navigation Consulting Agreement"
    ]
  };

  const groupedTransactionTypes = {
    "Logistics & Sea Operations": [
      "Yacht Charter", "Bareboat Charter", "Crewed Charter", "Day Charter", "Seasonal Charter", "Charter Management", "Voyage Chartering", "Time Chartering", "Cargo Carriage"
    ],
    "Shipyard & Services": [
      "New Build Fabrication", "Refit Services", "Retrofit Engineering", "Manufacturing", "Equipment Supply", "Spare Parts Supply", "OEM Production", "Engineering Services", "Commissioning Services", "Warranty Services"
    ],
    "Marina & Port": [
      "Berthing Space Rental", "Marina Services", "Technical Services", "Port Agency Services", "Vessel Management", "Annual Maintenance", "Dry Dock Services", "Stevedoring Operations"
    ],
    "Legal & Advisory": [
      "Maritime Legal Advisory", "Due Diligence Audits", "Vessel Certification", "Compliance Review", "Insurance Placement", "Settlement Routing", "Vessel Financing Support"
    ],
    "Marine Technology & AI": [
      "Software Licensing", "SaaS Subscription", "API Access Billing", "Digital Integration", "Cybersecurity Auditing", "Marine AI Consulting"
    ]
  };

  const getContractCategory = (type: string) => {
    for (const [key, values] of Object.entries(groupedAgreementTypes)) {
      if (values.includes(type)) return key;
    }
    return 'Other';
  };

  const getContractSector = (c: SaaSContract) => {
    for (const [key, values] of Object.entries(groupedTransactionTypes)) {
      if (values.includes(c.transactionType)) return key;
    }
    return 'Other';
  };

  const matchValue = (valStr: any, range: string) => {
    if (range === 'ALL') return true;
    const val = parseFloat((valStr || '').toString().replace(/,/g, ''));
    if (isNaN(val)) return true;

    if (range === 'UNDER_100K') return val < 100000;
    if (range === '100K_1M') return val >= 100000 && val <= 1000000;
    if (range === '1M_5M') return val > 1000000 && val <= 5000000;
    if (range === 'OVER_5M') return val > 5000000;
    return true;
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

  const toggleSort = (field: 'title' | 'createdAt' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (e: React.MouseEvent, contractId: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'contracts', contractId));
    } catch (err) {
      console.error("Firesore delete error:", err);
    }
  };

  // Status Style Maps
  const statusColors: Record<string, string> = {
    'Draft': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
    'Review': 'bg-[#FDD663]/10 text-[#FDD663] border-[#FDD663]/25',
    'Approval': 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/25',
    'Executed': 'bg-[#81C995]/10 text-[#81C995] border-[#81C995]/25 font-bold',
    'Expired': 'bg-[#F28B82]/10 text-[#F28B82] border-[#F28B82]/25',
    'Pending Review': 'bg-[#FDD663]/10 text-[#FDD663] border-[#FDD663]/25',
    'Verified': 'bg-[#81C995]/10 text-[#81C995] border-[#81C995]/25',
    'Cancelled': 'bg-[#F28B82]/10 text-[#F28B82] border-[#F28B82]/25',
    'Archived': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  const riskColors: Record<string, string> = {
    'Low': 'text-[#00D68F]',
    'Medium': 'text-[#FDD663]',
    'High': 'text-[#F28B82]'
  };

  // Filter and sort mechanics
  const filteredContracts = contracts
    .filter(c => {
      if (c.userId !== userId) return false;
      const matchSearch = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.agreementType || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || normalizeStatus(c.status) === selectedStatus;
      
      const category = getContractCategory(c.agreementType);
      const matchCat = selectedCategory === 'ALL' || category === selectedCategory;

      const sector = getContractSector(c);
      const matchSec = selectedSector === 'ALL' || sector === selectedSector;

      const matchVal = matchValue(c.contractValue, selectedValueRange);
      
      const matchCurr = selectedCurrency === 'ALL' || c.currency === selectedCurrency;
      
      const matchRisk = selectedRiskScore === 'ALL' || c.riskScore === selectedRiskScore;
      
      const matchLaw = selectedLaw === 'ALL' || c.applicableLaw === selectedLaw;

      return matchSearch && matchStatus && matchCat && matchSec && matchVal && matchCurr && matchRisk && matchLaw;
    })
    .sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (sortBy === 'status') {
        valA = normalizeStatus(a.status);
        valB = normalizeStatus(b.status);
      }

      if (sortBy === 'createdAt') {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }

      if (sortOrder === 'desc') {
        return valB.localeCompare(valA);
      } else {
        return valA.localeCompare(valB);
      }
    });

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 text-[#E8EAED] text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-[#2B3347] pb-6 mb-6 md:mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">Document Management system</span>
          <h2 className="text-xl md:text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Contracts Repository</h2>
          <p className="text-[#BBC0C4] text-[10px] md:text-[11px] font-mono tracking-tight mt-1">Verify signature locks, check versions, and review bilateral corporate covenants.</p>
        </div>
        <button 
          onClick={() => onNavigateTab('New Contract')}
          className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-5 py-3 md:py-2 rounded bg-[#00D4FF] hover:bg-[#33DDFF] text-[#171B26] text-xs font-bold transition-colors uppercase tracking-wider h-[52px] md:h-auto"
        >
          <Plus size={14} /> New Contract
        </button>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="bg-[#202636] p-5 rounded-xl border border-[#2B3347] mb-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search agreement titles, vessel names, counterparties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2.5 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00D4FF] placeholder-[#80868B] font-medium text-left"
          />
        </div>

        {/* Multi-Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Status Select */}
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] text-[#80868B] uppercase tracking-wider font-mono block font-bold">Envelope State</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-medium"
            >
              <option value="ALL">All States</option>
              <option value="Draft">Drafts</option>
              <option value="Review">In Review</option>
              <option value="Approval">Awaiting Approval</option>
              <option value="Executed">Executed Signatures</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Category Select */}
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] text-[#80868B] uppercase tracking-wider font-mono block font-bold">Agreement Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-medium"
            >
              <option value="ALL">All Categories</option>
              {Object.keys(groupedAgreementTypes).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Transaction Sector Select */}
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] text-[#80868B] uppercase tracking-wider font-mono block font-bold">Transaction Sector</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-medium"
            >
              <option value="ALL">All Sectors</option>
              {Object.keys(groupedTransactionTypes).map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          {/* Value Range Select */}
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] text-[#80868B] uppercase tracking-wider font-mono block font-bold">Valuation Range</span>
            <select
              value={selectedValueRange}
              onChange={(e) => setSelectedValueRange(e.target.value)}
              className="w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-medium"
            >
              <option value="ALL">All Valuations</option>
              <option value="UNDER_100K">Under 100,000</option>
              <option value="100K_1M">100,000 - 1,000,000</option>
              <option value="1M_5M">1,000,000 - 5,000,000</option>
              <option value="OVER_5M">Over 5,000,000</option>
            </select>
          </div>

          {/* Currency Select */}
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] text-[#80868B] uppercase tracking-wider font-mono block font-bold">Currency</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-medium"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="SGD">SGD</option>
              <option value="AED">AED</option>
              <option value="CHF">CHF</option>
              <option value="TRY">TRY</option>
            </select>
          </div>

          {/* Applicable Law Select */}
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] text-[#80868B] uppercase tracking-wider font-mono block font-bold">Applicable Law</span>
            <select
              value={selectedLaw}
              onChange={(e) => setSelectedLaw(e.target.value)}
              className="w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-medium"
            >
              <option value="ALL">All Laws</option>
              <option value="English Law (LMAA)">English Law</option>
              <option value="Singapore Law (SCMA)">Singapore Law</option>
              <option value="New York State Law (SMA)">New York Law</option>
              <option value="Swiss Law">Swiss Law</option>
              <option value="French Law">French Law</option>
              <option value="German Law">German Law</option>
              <option value="UAE Law (DIFC)">UAE Law (DIFC)</option>
              <option value="Turkish Law">Turkish Law</option>
            </select>
          </div>

          {/* Risk Score Select */}
          <div className="space-y-1.5 text-left">
            <span className="text-[9px] text-[#80868B] uppercase tracking-wider font-mono block font-bold">Risk Level</span>
            <select
              value={selectedRiskScore}
              onChange={(e) => setSelectedRiskScore(e.target.value)}
              className="w-full px-3 py-2 bg-[#171B26] border border-[#2B3347] rounded-lg text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-[#00D4FF] font-medium"
            >
              <option value="ALL">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View (lg: and up) */}
      <div className="hidden lg:block bg-[#202636] rounded-xl border border-[#2B3347] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-[#E8EAED]">
            <thead>
              <tr className="bg-[#141924] border-b border-[#2B3347] font-mono text-[#BBC0C4] uppercase tracking-wider">
                <th colSpan={2} className="py-3.5 px-4 text-left font-semibold">
                  <button onClick={() => toggleSort('title')} className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors">
                    Agreement Description <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-left font-semibold">Risk Score</th>
                <th className="py-3.5 px-4 text-left font-semibold">Type</th>
                <th className="py-3.5 px-4 text-left font-semibold">Key Parties</th>
                <th className="py-3.5 px-4 text-left font-semibold text-right">Value</th>
                <th className="py-3.5 px-4 text-left font-semibold">Renewal</th>
                <th className="py-3.5 px-4 text-left font-semibold">
                  <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors">
                    State <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="py-3.5 px-4 text-right font-semibold pr-6">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3347]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#80868B]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#00D4FF]" />
                      <span>Syncing cloud folder contracts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map((c) => {
                  const valParsed = parseFloat(c.contractValue?.toString().replace(/,/g, '') || '0');
                  const formattedValue = isNaN(valParsed) ? c.contractValue : new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: c.currency || 'USD',
                    maximumFractionDigits: 0
                  }).format(valParsed);
                  
                  const isExpanded = expandedRowId === c.id;
                  const riskValue = c.riskScore || (valParsed > 500000 ? 'High' : valParsed > 100000 ? 'Medium' : 'Low');

                  return (
                    <React.Fragment key={c.id}>
                      <tr 
                        onClick={() => setExpandedRowId(isExpanded ? null : c.id)}
                        className={`hover:bg-[#2B3347] cursor-pointer transition-colors ${isExpanded ? 'bg-[#2B3347]' : ''}`}
                      >
                        <td className="py-4 pl-4 text-[#BBC0C4]">
                          <span className="inline-flex">
                            {isExpanded ? <ChevronUp key="up" size={16} /> : <ChevronDown key="down" size={16} />}
                          </span>
                        </td>
                        <td className="py-4 pr-4 font-semibold text-white max-w-[280px] truncate">
                          {c.title}
                          <span className="block text-[10px] text-[#80868B] font-mono mt-0.5">
                            Created: {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                           <span className={`font-mono font-bold text-[10px] uppercase ${riskColors[riskValue]}`}>{riskValue}</span>
                        </td>
                        <td className="py-4 px-4 text-[#BBC0C4] font-medium">{c.agreementType}</td>
                        <td className="py-4 px-4 text-[11px] max-w-[170px] truncate">
                          <span className="text-[#00D4FF] font-semibold">{c.seller}</span>
                          <span className="text-[#80868B] block">→ {c.buyer}</span>
                        </td>
                        <td className="py-4 px-4 font-mono text-right text-[#00D68F]">{formattedValue}</td>
                        <td className="py-4 px-4 font-mono text-[10px] text-[#80868B]">
                          {c.renewalDate ? new Date(c.renewalDate).toLocaleDateString() : new Date(new Date(c.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[normalizeStatus(c.status)] || ''}`}>
                            {normalizeStatus(c.status)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => onOpenContract(c)}
                              className="p-1 px-1.5 hover:bg-[#00D4FF] hover:text-[#171B26] border border-[#2B3347] rounded text-[#BBC0C4] block text-[10px] uppercase font-bold tracking-wider transition-all"
                            >
                              Edit Link
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, c.id)}
                              className="p-1 text-[#F28B82] hover:bg-[#F28B82]/10 border border-[#F28B82]/10 rounded transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-[#141924] px-8 py-5 border-y border-[#2B3347]">
                            <div className="text-left max-w-4xl grid md:grid-cols-3 gap-6">
                              <div>
                                <h5 className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider mb-2 font-mono">Bilateral Corporate Keys</h5>
                                <div className="space-y-3 bg-[#171B26] p-3 rounded border border-[#2B3347] text-[11px]">
                                  <div>
                                    <p className="text-[#80868B] text-[9px] uppercase font-mono tracking-wider font-bold">Party A</p>
                                    <p className="text-white font-semibold text-xs mt-0.5">{c.seller}</p>
                                    <p className="text-[#00D4FF] text-[10px] font-mono mt-1 uppercase">Role: {c.partyA?.role || 'Seller'}</p>
                                  </div>
                                  <div className="border-t border-[#2B3347]/50 my-2"></div>
                                  <div>
                                    <p className="text-[#80868B] text-[9px] uppercase font-mono tracking-wider font-bold">Party B</p>
                                    <p className="text-white font-semibold text-xs mt-0.5">{c.buyer}</p>
                                    <p className="text-[#00D4FF] text-[10px] font-mono mt-1 uppercase">Role: {c.partyB?.role || 'Buyer'}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-2 flex flex-col justify-between">
                                <div>
                                  <h5 className="text-[10px] font-bold text-[#00D68F] uppercase tracking-wider mb-2 font-mono">Contractual Intelligence Summary</h5>
                                  <p className="text-[#E8EAED] text-xs leading-relaxed font-mono">
                                    This agreement represents an active {c.agreementType} covenant between {c.seller} and {c.buyer}. 
                                    With a secured commercial ledger valuation of {formattedValue} {c.currency}, the parameters meet global structures.
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#2B3347]">
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-[#00D4FF]" />
                                    <div>
                                      <span className="text-[9px] text-[#80868B] block uppercase font-semibold">Expiration Date Target</span>
                                      <span className="text-[11px] text-[#E8EAED] font-mono">{new Date(new Date(c.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-[#00D68F]" />
                                    <div>
                                      <span className="text-[9px] text-[#80868B] block uppercase font-semibold">Integrity Lock</span>
                                      <span className="text-[10px] text-[#00D68F] font-mono truncate max-w-[120px] block">SEC-F-{c.id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#80868B]">No corporate agreement filters matched.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card Feed View (hidden on lg:) */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="py-12 text-center text-[#80868B] flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#00D4FF]" />
            <span>Syncing contracts...</span>
          </div>
        ) : filteredContracts.length > 0 ? (
          filteredContracts.map((c) => {
            const valParsed = parseFloat(c.contractValue?.toString().replace(/,/g, '') || '0');
            const formattedValue = isNaN(valParsed) ? c.contractValue : new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: c.currency || 'USD',
              maximumFractionDigits: 0
            }).format(valParsed);

            return (
              <div 
                key={c.id} 
                className="bg-[#202636] border border-[#2B3347] rounded-xl p-5 space-y-4 hover:border-[#00D4FF]/30 transition-all cursor-pointer"
                onClick={() => onOpenContract(c)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 pr-4">
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-tight leading-tight">{c.title}</h3>
                    <p className="text-[10px] text-[#80868B] font-mono">Version {c.version || 'v1.0'} • {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${statusColors[normalizeStatus(c.status)] || ''}`}>
                    {normalizeStatus(c.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/[0.03]">
                  <div>
                    <span className="text-[8px] font-bold text-[#80868B] uppercase block mb-1">Agreement Type</span>
                    <span className="text-[10px] text-[#BBC0C4] font-medium uppercase">{c.agreementType}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-[#80868B] uppercase block mb-1">Contract Value</span>
                    <span className="text-[10px] text-[#00D68F] font-mono font-bold">{formattedValue}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-[#80868B] uppercase mb-1">Counterparties</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-semibold truncate max-w-[80px]">{c.seller}</span>
                      <span className="text-[#80868B]">→</span>
                      <span className="text-white font-semibold truncate max-w-[80px]">{c.buyer}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onOpenContract(c); }}
                      className="p-2.5 bg-[#00D4FF] text-[#171B26] rounded-lg shadow-lg"
                    >
                      <PenTool size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, c.id)}
                      className="p-2.5 bg-[#171B26] border border-[#F28B82]/20 text-[#F28B82] rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-[#80868B] font-mono uppercase tracking-widest text-[10px] bg-[#202636] rounded-xl border border-white/5">
            No matching corporate agreements found.
          </div>
        )}
      </div>
    </div>
  );
}
