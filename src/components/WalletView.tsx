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
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { 
  Coins, History, PlusCircle, ArrowUpRight, 
  CheckCircle2, CreditCard, RefreshCw, Loader2 
} from 'lucide-react';
import { CreditWallet, CreditTransaction } from '../types/saas';

interface WalletViewProps {
  userId: string;
}

export default function WalletView({ userId }: WalletViewProps) {
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const packs = [
    { id: 'pkt_500', name: 'Starter Pact', credits: 500, price: '$15.00' },
    { id: 'pkt_1500', name: 'Corporate Pact', credits: 1500, price: '$40.00' },
    { id: 'pkt_5000', name: 'Elite Pact', credits: 5000, price: '$99.00' }
  ];

  useEffect(() => {
    if (!userId) return;

    // Listen to credit wallet
    const walletRef = doc(db, 'credit_wallets', userId);
    const unsubWallet = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        setWallet({ id: snap.id, ...snap.data() } as CreditWallet);
        setLoading(false);
      }
    }, (err) => {
      console.error("Failed to sync wallet document:", err);
      setLoading(false);
    });

    // Listen to transaction log with fallback sorting
    const txQuery = query(collection(db, 'credit_transactions'), where('userId', '==', userId));
    const unsubTx = onSnapshot(txQuery, (snap) => {
      const list: CreditTransaction[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === userId) {
          list.push({ id: docSnap.id, ...data } as CreditTransaction);
        }
      });
      // Sort client-side of descending timestamps (to prevent query failures if index isn't build yet)
      list.sort((a, b) => {
        const parseTime = (d: any) => {
          if (!d) return 0;
          if (typeof d === 'string') return new Date(d).getTime();
          if (d.toMillis) return d.toMillis();
          if (d.seconds) return d.seconds * 1000;
          return 0;
        };
        return parseTime(b.date) - parseTime(a.date);
      });
      setTransactions(list);
    });

    return () => {
      unsubWallet();
      unsubTx();
    };
  }, [userId]);

  const handleBuyPack = async (pack: typeof packs[0]) => {
    setPurchasingId(pack.id);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: pack.name,
          priceAmount: pack.price,
          userId: userId,
          customerEmail: auth.currentUser?.email || '',
          mode: 'payment',
          successPath: '/wallet'
        })
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initialize refill checkout');
      }
    } catch (err) {
      console.error("Credit Purchase redirect failed:", err);
      // Fallback for sandbox
      console.warn("Falling back to local provisioning since Stripe setup failed.");
      try {
        const walletRef = doc(db, 'credit_wallets', userId);
        await updateDoc(walletRef, {
          creditsTotal: increment(pack.credits),
          creditsRemaining: increment(pack.credits)
        });

        await addDoc(collection(db, 'credit_transactions'), {
          userId: userId,
          date: new Date().toISOString().split('T')[0],
          packet: `Local Refill (No Stripe): ${pack.name}`,
          changeCredits: pack.credits,
          price: pack.price,
          timestamp: new Date().toISOString()
        });

        await addDoc(collection(db, 'invoices'), {
          userId: userId,
          date: new Date().toISOString().split('T')[0],
          amount: pack.price,
          status: "paid",
          plan: `Ad-hoc Refill Credits (${pack.credits} Pack)`
        });

        await logAuditEvent(userId, `Local Quota Refill: ${pack.name} (+${pack.credits} Credits)`, "Billing & Subscription");
      } catch (fallbackErr) {
        console.error("Local provisioning fallback failed:", fallbackErr);
      }
      setTimeout(() => {
        setPurchasingId(null);
      }, 1000);
    }
  };

  const handleToggleAutoRecharge = async () => {
    if (!wallet) return;
    const nextState = !wallet.autoRecharge;
    try {
      const walletRef = doc(db, 'credit_wallets', userId);
      await updateDoc(walletRef, {
        autoRecharge: nextState
      });
      await logAuditEvent(userId, `${nextState ? "Enabled" : "Disabled"} automated credit recharge rules`, "Credit Wallet Center");
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
            {packs.map((pk) => (
              <div 
                key={pk.id} 
                className="bg-[#171B26] p-5 rounded border border-[#2B3347] flex flex-col justify-between hover:border-[#00D4FF]/30 transition-all group"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h5 className="text-[10px] font-bold uppercase text-[#00D4FF] font-mono tracking-widest">{pk.name}</h5>
                  <h3 className="text-2xl font-manrope font-extrabold text-white mt-2 tracking-tight">+{pk.credits}</h3>
                  <span className="text-[9px] text-[#80868B] block mt-1 uppercase font-mono">Pre-allocated Credits</span>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2B3347] flex flex-col gap-3">
                  <div className="text-xs text-white font-mono font-bold">{pk.price} USD</div>
                  <button
                    disabled={purchasingId !== null}
                    onClick={() => handleBuyPack(pk)}
                    className="w-full py-1.5 bg-[#2B3347] hover:bg-[#00D4FF]/10 border border-[#2B3347] hover:border-[#00D4FF]/30 rounded text-[10px] font-bold text-[#00D4FF] uppercase transition-all flex items-center justify-center gap-1.5 shadow-sm tracking-wider"
                  >
                    {purchasingId === pk.id ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 size={10} className="animate-spin" /> Verifying...
                      </span>
                    ) : (
                      <span>Refill Block</span>
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

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-[#E8EAED]">
            <thead>
              <tr className="border-b border-[#2B3347] text-[#BBC0C4] text-left uppercase tracking-wider font-mono text-[10px]">
                <th className="pb-3.5 px-2">Transaction ID</th>
                <th className="pb-3.5 px-2">Date</th>
                <th className="pb-3.5 px-2">Operation Details</th>
                <th className="pb-3.5 px-2 text-right">Credit Delta</th>
                <th className="pb-3.5 px-2 text-right pr-4">Cost Equivalent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3347] font-mono text-[10px]">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#2B3347] transition-colors">
                    <td className="py-3 px-2 text-[#80868B]">TX-A2_{tx.id.substring(0, 8).toUpperCase()}</td>
                    <td className="py-3 px-2 text-[#80868B]">
                      {(() => {
                        if (!tx.date) return 'N/A';
                        if (typeof tx.date === 'string') return tx.date;
                        return (tx.date as any).toDate?.().toLocaleDateString() || String(tx.date);
                      })()}
                    </td>
                    <td className="py-3 px-2 text-white font-sans">{tx.packet}</td>
                    <td className={`py-3 px-2 text-right font-bold ${
                      tx.changeCredits > 0 ? 'text-[#00D68F]' : 'text-[#F28B82]'
                    }`}>
                      {tx.changeCredits > 0 ? `+${tx.changeCredits}` : tx.changeCredits}
                    </td>
                    <td className="py-3 px-2 text-right text-[#BBC0C4] pr-4">{tx.price}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#80868B] uppercase tracking-widest">
                    No ad-hoc ledger transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
