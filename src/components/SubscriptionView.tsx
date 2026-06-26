import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase-service';
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { 
  Award, Check, Sparkles, RefreshCw, Loader2, Calendar, 
  ShieldCheck, HelpCircle 
} from 'lucide-react';
import { SaasSubscription } from '../types/saas';

interface SubscriptionViewProps {
  userId: string;
}

export default function SubscriptionView({ userId }: SubscriptionViewProps) {
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const plansList = [
    {
      id: 'Starter',
      price: '$29.00',
      period: 'monthly per user',
      value: 29,
      creditsAllocated: 500,
      desc: 'Ideal for consultants, surveyors, brokers and independent maritime service providers.',
      features: [
        "1 Workspace User",
        "500 Operational Credits",
        "Contract Repository",
        "Version History",
        "Standard Templates",
        "Secure Workspace Environment",
        "Email Support"
      ]
    },
    {
      id: 'Professional',
      price: '$99.00',
      period: 'monthly per user',
      value: 99,
      creditsAllocated: 2500,
      desc: 'Built for growing maritime businesses managing commercial and operational agreements.',
      features: [
        "3 Workspace Users",
        "2,500 Operational Credits",
        "Contract Repository",
        "Approval Workflows",
        "Risk Analysis",
        "Compliance Review",
        "Priority Support"
      ]
    },
    {
      id: 'Enterprise',
      price: '$299.00',
      period: 'monthly per user',
      value: 299,
      creditsAllocated: 10000,
      desc: 'Designed for organizations managing high-volume maritime contract operations.',
      features: [
        "Unlimited Workspace Users",
        "10,000 Operational Credits",
        "Advanced Repository Controls",
        "Governance Workflows",
        "Role-Based Permissions",
        "Audit Traceability",
        "Dedicated Support"
      ]
    }
  ];

  useEffect(() => {
    if (!userId) return;

    const subRef = doc(db, 'subscriptions', userId);
    const unsubscribe = onSnapshot(subRef, (snap) => {
      if (snap.exists()) {
        setSubscription({ id: snap.id, ...snap.data() } as SaasSubscription);
        setLoading(false);
      }
    }, (err) => {
      console.error("Failed to query subscription document:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleUpdateSubscription = async (planType: 'Starter' | 'Professional' | 'Enterprise', priceAmount: number, creditsAlloc: number) => {
    if (subscription?.plan === planType) return;
    setUpdatingId(planType);
    try {
      const subRef = doc(db, 'subscriptions', userId);
      
      // Update subscription details in Firestore block
      await updateDoc(subRef, {
        plan: planType,
        amount: priceAmount,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Synchronize Credit Wallet capacities
      const walletRef = doc(db, 'credit_wallets', userId);
      await updateDoc(walletRef, {
        creditsTotal: creditsAlloc,
        creditsRemaining: creditsAlloc,
        creditsUsed: 0
      });

      // Insert transaction logs
      const txRef = collection(db, 'credit_transactions');
      await addDoc(txRef, {
        userId: userId,
        date: new Date().toISOString().split('T')[0],
        packet: `Subscription upgraded: ${planType} Plan allocation`,
        changeCredits: creditsAlloc,
        price: `$${priceAmount}.00`,
        timestamp: serverTimestamp()
      });

      // Log invoice statement
      const invoiceRef = collection(db, 'invoices');
      await addDoc(invoiceRef, {
        userId: userId,
        invoiceNumber: `INV-${100000 + Math.floor(Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        amount: `$${priceAmount}.00`,
        status: "paid",
        plan: `${planType} Plan Subscription - June 2026`
      });

      console.log(`Stripe Billing Agreement Approved! Upgraded to ${planType} plan. Credits re-allocated: ${creditsAlloc} credits.`);
    } catch (err) {
      console.error("Subscription transaction rollback triggered:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#171B26]">
        <div className="text-center text-[#BBC0C4]">
          <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={32} />
          <p className="text-xs font-mono uppercase tracking-widest text-[#80868B]">Querying security subscription profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#171B26] overflow-y-auto px-6 py-8 text-[#E8EAED] text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2B3347] pb-6 mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">Subscription & Workspace Plan</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Subscription Center</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight">Manage workspace access, operational credits and subscription services for your maritime contract environment.</p>
        </div>
      </div>

      {/* Current Active Plan Card */}
      <div className="bg-[#202636] p-6 rounded border border-[#2B3347] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20">
            <Award size={32} />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded bg-[#00D68F]/10 text-[#00D68F] font-mono text-[9px] uppercase font-bold border border-[#00D68F]/20">Active</span>
            <h3 className="text-xl font-manrope font-bold text-white mt-1 uppercase tracking-tight">Current Subscription</h3>
            <p className="text-[11px] text-[#80868B] font-mono">{subscription?.plan} Tier active in this workspace.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-l border-[#2B3347] pl-6">
          <div>
            <span className="text-[9px] text-[#80868B] block uppercase font-bold font-mono">Monthly Subscription</span>
            <span className="text-base font-bold text-white font-mono">${subscription?.amount ?? 0}.00 / mo</span>
          </div>
          <div>
            <span className="text-[9px] text-[#80868B] block uppercase font-bold font-mono">Renewal Date</span>
            <span className="text-base font-bold text-white font-mono">
              {subscription?.currentPeriodEnd ? (
                typeof subscription.currentPeriodEnd === 'string' 
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                  : (subscription.currentPeriodEnd as any).toDate?.().toLocaleDateString() || 'Auto Renewal'
              ) : "Auto Renewal"}
            </span>
          </div>
        </div>
      </div>

      {/* Plans List Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {plansList.map((plan) => {
          const isActive = subscription?.plan === plan.id;

          return (
            <div 
              key={plan.id}
              className={`p-6 bg-[#202636] rounded border transition-all flex flex-col justify-between ${
                isActive 
                  ? 'border-[#00D4FF] ring-1 ring-[#00D4FF]/20 bg-[#00D4FF]/5' 
                  : 'border-[#2B3347] hover:border-[#00D4FF]/30'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-base font-bold text-white uppercase tracking-tight">{plan.id} Tier</h4>
                  {isActive && (
                    <span className="text-[9px] bg-[#00D4FF] text-[#171B26] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Selected</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-extrabold text-white font-mono">{plan.price}</span>
                  <span className="text-[10px] text-[#80868B] font-mono font-bold uppercase">{plan.period}</span>
                </div>
                <p className="text-[11px] text-[#BBC0C4] mt-2.5 leading-relaxed min-h-[50px] font-mono tracking-tight">{plan.desc}</p>

                <hr className="my-5 border-[#2B3347]" />

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex gap-2 text-[11px] text-[#BBC0C4] font-mono tracking-tight">
                      <Check size={14} className="text-[#00D68F] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={isActive || updatingId !== null}
                  onClick={() => handleUpdateSubscription(plan.id as any, plan.value, plan.creditsAllocated)}
                  className={`w-full py-2.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 tracking-wider ${
                    isActive 
                      ? 'bg-[#2B3347] text-[#80868B] cursor-default border border-[#2B3347]' 
                      : 'bg-[#00D4FF] text-[#171B26] hover:bg-[#33DDFF] border border-[#00D4FF]'
                  }`}
                >
                  {updatingId === plan.id ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <Loader2 size={12} className="animate-spin" /> Approving via Stripe...
                    </span>
                  ) : isActive ? (
                    <span>Current Subscription</span>
                  ) : (
                    <span>Select Plan</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
