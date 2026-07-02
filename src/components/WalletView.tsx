import React, { useState, useEffect } from 'react';
import { auth, db, logAuditEvent } from '../../services/firebase-service';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  collection, 
  query, 
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { CreditService } from '../../services/credit-service';
import { 
  Coins, History, PlusCircle, ArrowUpRight, 
  CheckCircle2, CreditCard, RefreshCw, Loader2 
} from 'lucide-react';
import { CreditWallet, CreditTransaction } from '../types/saas';
import PaymentModal from './PaymentModal';
import { StripeService } from '../services/stripe-service';

interface WalletViewProps {
  userId: string;
}

export default function WalletView({ userId }: WalletViewProps) {
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [selectedPackForPurchase, setSelectedPackForPurchase] = useState<any>(null);

  const packs = [
    { id: 'pkt_1000', name: 'Credit Pack', credits: 1000, price: 'USD 19', type: 'credits' },
    { id: 'pkt_3000', name: 'Credit Pack', credits: 3000, price: 'USD 49', popular: true, type: 'credits' },
    { id: 'pkt_10000', name: 'Credit Pack', credits: 10000, price: 'USD 129', type: 'credits' },
    { id: 'emp_500', name: 'Starter Email Pack', emails: 500, price: 'USD 10', type: 'emails' },
    { id: 'emp_2500', name: 'Business Email Pack', emails: 2500, price: 'USD 35', type: 'emails' },
    { id: 'emp_10000', name: 'Enterprise Email Pack', emails: 10000, price: 'USD 99', type: 'emails' }
  ];

  useEffect(() => {
    if (!userId) return;

    const unsubWallet = CreditService.subscribeToBalance(userId, (bal) => {
      if (bal) {
        setWallet(bal as any);
        setLoading(false);
      }
    });

    const unsubLedger = CreditService.subscribeToLedger(userId, (list) => {
      setTransactions(list as any);
    });

    return () => {
      unsubWallet();
      unsubLedger();
    };
  }, [userId]);

  const handleBuyPack = async (pack: typeof packs[0]) => {
    setPurchasingId(pack.id);
    try {
      const priceVal = parseInt(pack.price.replace(/[^\d]/g, ''));
      
      // Request Stripe Checkout Session from our express backend
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: pack.id,
          priceAmount: priceVal,
          userId: userId,
          customerEmail: auth.currentUser?.email || "",
          mode: 'payment',
          successPath: '/wallet'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to create secure payment session.");
      }

      // Redirect browser directly to Stripe-hosted checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Initiating checkout session failed:", err);
      alert("Ödeme başlatılamadı: " + err.message);
      setPurchasingId(null);
    }
  };

  const handleToggleAutoRecharge = async () => {
    if (!userId) return;
    try {
      await CreditService.setAutoRecharge(userId, !wallet?.autoRecharge);
      await logAuditEvent(userId, `${!wallet?.autoRecharge ? "Enabled" : "Disabled"} automated credit recharge rules`, "Credit Wallet Center");
    } catch (err) {
      console.error("Toggle Auto Recharge error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#171B26]">
        <div className="text-[#BBC0C4] text-center">
          <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={32} />
          <p className="text-xs font-mono uppercase tracking-widest text-[#80868B]">Loading Credit Ledger and Wallet status...</p>
        </div>
      </div>
    );
  }

  const creditsUsedPercentage = (wallet && (wallet.creditsTotal || 0) > 0) 
    ? Math.round(((wallet.creditsUsed || 0) / wallet.creditsTotal) * 100) 
    : 0;

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">Subscription & Workspace Plan</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Credit Wallet Center</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight">Buy operational credits, monitor billing debits, and toggle automated threshold refilling locks.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Core Wallet Balance Summary */}
        <div className="p-6 bg-[#202636] rounded border border-[#2B3347] flex flex-col justify-between">
          <div>
            <span className="flex items-center gap-2 text-[10px] text-[#00D68F] font-bold uppercase tracking-widest font-mono">
              <Coins size={14} /> Global Ledger
            </span>
            <div className="mt-6">
              <p className="text-[10px] text-[#80868B] uppercase font-mono tracking-wider font-semibold">Operational Credits Remaining</p>
              <h3 className="text-5xl font-manrope font-extrabold text-white tracking-tight mt-1">{wallet?.creditsRemaining ?? 0}</h3>
            </div>
            <div className="mt-4 pt-4 border-t border-[#2B3347] space-y-2">
              <div className="flex justify-between text-[11px] text-[#BBC0C4] font-mono tracking-tight">
                <span className="uppercase">Total Capacity:</span>
                <span className="font-bold text-white">{wallet?.creditsTotal ?? 0}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#BBC0C4] font-mono tracking-tight">
                <span className="uppercase">Operational Credits Consumed:</span>
                <span className="font-bold text-white">{wallet?.creditsUsed ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-[9px] text-[#80868B] mb-1.5 uppercase font-mono font-bold tracking-widest">
              <span>Operational Usage</span>
              <span>{creditsUsedPercentage}% Consumed</span>
            </div>
            <div className="w-full bg-[#171B26] h-2 rounded overflow-hidden border border-[#2B3347]">
              <div className="bg-[#00D68F] h-full" style={{ width: `${Math.min(100, Math.max(0, 100 - creditsUsedPercentage))}%` }}></div>
            </div>
          </div>
        </div>

        {/* Recharge block packages */}
        <div className="lg:col-span-2 p-6 bg-[#202636] rounded border border-[#2B3347]">
          <h4 className="text-sm font-bold text-white uppercase mb-1 tracking-tight">Top-Up Operational Credits</h4>
          <p className="text-[11px] text-[#80868B] mb-6 font-mono">Instantly inject verified credits into your active team workspace.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {packs.filter(p => p.type === 'credits').map((pk) => (
              <div 
                key={pk.id} 
                className={`bg-[#171B26] p-5 rounded border ${pk.popular ? 'border-[#00D4FF]' : 'border-[#2B3347] hover:border-[#00D4FF]/30'} flex flex-col justify-between transition-all group relative`}
                onClick={(e) => e.stopPropagation()}
              >
                {pk.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#00D4FF] text-[#041326] px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                    ⭐ Most Popular
                  </div>
                )}
                <div>
                  <h5 className={`text-[10px] font-bold uppercase font-mono tracking-widest ${pk.popular ? 'text-[#00D4FF]' : 'text-slate-400'}`}>{pk.name}</h5>
                  <h3 className="text-2xl font-manrope font-extrabold text-white mt-2 tracking-tight">+{pk.credits?.toLocaleString()}</h3>
                  <span className="text-[9px] text-[#80868B] block mt-1 uppercase font-mono">Pre-allocated Credits</span>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2B3347] flex flex-col gap-3">
                  <div className="text-xs text-white font-mono font-bold">{pk.price}</div>
                  <button
                    disabled={purchasingId !== null}
                    onClick={() => handleBuyPack(pk)}
                    className={`w-full py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm tracking-wider ${
                      pk.popular 
                        ? 'bg-[#00D4FF] text-[#041326] hover:bg-[#33DDFF]' 
                        : 'bg-[#2B3347] hover:bg-[#00D4FF]/10 border border-[#2B3347] hover:border-[#00D4FF]/30 text-[#00D4FF]'
                    }`}
                  >
                    {purchasingId === pk.id ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 size={10} className="animate-spin" /> Redirecting...
                      </span>
                    ) : (
                      <span>Refill Block</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h4 className="text-sm font-bold text-white uppercase mt-8 mb-1 tracking-tight">Email Notification Packs</h4>
          <p className="text-[11px] text-[#80868B] mb-6 font-mono">Expand your monthly email distribution capacity independently of AI credits.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {packs.filter(p => p.type === 'emails').map((pk) => (
              <div 
                key={pk.id} 
                className="bg-[#171B26] p-5 rounded border border-[#2B3347] hover:border-[#00D68F]/30 flex flex-col justify-between transition-all group relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h5 className="text-[10px] font-bold uppercase font-mono tracking-widest text-[#00D68F]">{pk.name}</h5>
                  <h3 className="text-2xl font-manrope font-extrabold text-white mt-2 tracking-tight">+{pk.emails?.toLocaleString()}</h3>
                  <span className="text-[9px] text-[#80868B] block mt-1 uppercase font-mono">Email Notifications</span>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2B3347] flex flex-col gap-3">
                  <div className="text-xs text-white font-mono font-bold">{pk.price}</div>
                  <button
                    disabled={purchasingId !== null}
                    onClick={() => handleBuyPack(pk)}
                    className="w-full py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm tracking-wider bg-[#2B3347] hover:bg-[#00D68F]/10 border border-[#2B3347] hover:border-[#00D68F]/30 text-[#00D68F]"
                  >
                    {purchasingId === pk.id ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 size={10} className="animate-spin" /> Redirecting...
                      </span>
                    ) : (
                      <span>Buy Pack</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto Recharge Rules Panel */}
      <div className="bg-[#202636] p-6 rounded border border-[#2B3347] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-tight">Automated Operational Credit Recharge</h4>
          <p className="text-[11px] text-[#80868B] max-w-2xl mt-1 leading-relaxed font-mono">
            Ensure your maritime contract operations never stall. If balance drains below {wallet?.rechargeThreshold || 200} credits, our billing system automatic triggers purchase of an additional {wallet?.rechargeAmount || 500} credits.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-[#BBC0C4] font-mono uppercase tracking-widest">Auto Refill:</span>
          <button
            onClick={handleToggleAutoRecharge}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors relative border border-[#2B3347] ${
              wallet?.autoRecharge ? 'bg-[#00D68F]' : 'bg-[#171B26]'
            }`}
          >
            <div 
              className={`w-4.5 h-4.5 bg-white rounded-full transition-transform shadow ${
                wallet?.autoRecharge ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Transactions History Table */}
      <div className="p-6 bg-[#202636] rounded border border-[#2B3347]">
        <h4 className="text-sm font-bold text-white uppercase mb-1 tracking-tight">Operational Credit History</h4>
        <p className="text-[11px] text-[#80868B] mb-6 font-mono">Bilateral financial audits matching workspace UID</p>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-[#171B26] border border-[#2B3347] rounded-lg p-4 flex items-center justify-between hover:border-[#00D4FF]/30 transition-all group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[#80868B] font-mono uppercase">TX-A2_{tx.id.substring(0, 8).toUpperCase()}</span>
                    <span className="w-1 h-1 bg-[#2B3347] rounded-full"></span>
                    <span className="text-[9px] text-[#80868B] font-mono">
                      {(() => {
                        if (!tx.date) return 'N/A';
                        if (typeof tx.date === 'string') return tx.date;
                        return (tx.date as any).toDate?.().toLocaleDateString() || String(tx.date);
                      })()}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-white">{tx.packet}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[12px] font-bold font-mono ${tx.changeCredits > 0 ? 'text-[#00D68F]' : 'text-[#F28B82]'}`}>
                    {tx.changeCredits > 0 ? `+${tx.changeCredits}` : tx.changeCredits}
                  </div>
                  <div className="text-[9px] text-[#80868B] font-mono uppercase mt-0.5">{tx.price}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#80868B] text-[11px] font-mono uppercase tracking-widest border border-dashed border-[#2B3347] rounded-lg">
              No ad-hoc ledger transactions recorded yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
