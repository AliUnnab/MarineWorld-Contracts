import React, { useState, useEffect } from 'react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { 
  Award, Check, Sparkles, RefreshCw, Loader2, Calendar, 
  ShieldCheck, HelpCircle 
} from 'lucide-react';
import { SaasSubscription } from '../types/saas';
import PaymentModal from './PaymentModal';
import { StripeService } from '../services/stripe-service';

interface SubscriptionViewProps {
  userId: string;
}

export default function SubscriptionView({ userId }: SubscriptionViewProps) {
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any>(null);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plansList = [
    {
      id: 'Starter',
      priceMonthly: '$29.00',
      priceAnnual: '$290.00',
      valueMonthly: 29,
      valueAnnual: 290,
      creditsAllocated: 500,
      target: 'Ideal for consultants, surveyors, brokers and independent maritime professionals.',
      features: [
        "1 Workspace User",
        "500 Operational Credits / Month",
        "100 Email Notifications / Month",
        "Unlimited Contracts",
        "Unlimited Repository",
        "Unlimited Deployments",
        "Unlimited PDF Generation",
        "Unlimited Version History"
      ],
      capacity: [
        "166 Contract Assistant Generations",
        "16 Clause Reviews",
        "10 Pre-Execution AI Validations",
        "3 Full Contract Intelligence Reviews"
      ],
      includedServices: [
        "Contract Creation",
        "Contract Editing",
        "Draft Saving",
        "Deploy Agreement",
        "Registry & SHA-256",
        "Contract Locking"
      ]
    },
    {
      id: 'Professional',
      priceMonthly: '$99.00',
      priceAnnual: '$990.00',
      valueMonthly: 99,
      valueAnnual: 990,
      creditsAllocated: 2500,
      target: 'Built for growing maritime businesses managing commercial, technical and operational agreements.',
      features: [
        "3 Workspace Users",
        "2,500 Operational Credits / Month",
        "1,000 Email Notifications / Month",
        "Unlimited Contracts",
        "Unlimited Repository",
        "Unlimited Deployments",
        "Unlimited PDF Generation",
        "Approval Workflows",
        "Priority Support"
      ],
      capacity: [
        "833 Contract Assistant Generations",
        "83 Clause Reviews",
        "50 Pre-Execution AI Validations",
        "16 Full Contract Intelligence Reviews"
      ],
      includedServices: [
        "Contract Creation",
        "Contract Editing",
        "Draft Saving",
        "Deploy Agreement",
        "Registry & SHA-256",
        "Contract Locking"
      ]
    },
    {
      id: 'Enterprise',
      priceMonthly: '$299.00',
      priceAnnual: '$2,990.00',
      valueMonthly: 299,
      valueAnnual: 2990,
      creditsAllocated: 10000,
      target: 'Designed for organizations managing high-volume maritime contract operations across multiple teams.',
      features: [
        "Unlimited Workspace Users",
        "10,000 Operational Credits / Month",
        "5,000 Email Notifications / Month",
        "Unlimited Contracts",
        "Unlimited Repository",
        "Unlimited Deployments",
        "Unlimited PDF Generation",
        "Governance Workflows",
        "Audit Traceability",
        "Dedicated Support"
      ],
      capacity: [
        "3,333 Contract Assistant Generations",
        "333 Clause Reviews",
        "200 Pre-Execution AI Validations",
        "66 Full Contract Intelligence Reviews"
      ],
      includedServices: [
        "Contract Creation",
        "Contract Editing",
        "Draft Saving",
        "Deploy Agreement",
        "Registry & SHA-256",
        "Contract Locking",
        "Custom Credit Allocations Available"
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

  const handleUpdateSubscription = async (planType: 'Starter' | 'Professional' | 'Enterprise', priceAmount: number) => {
    if (subscription?.plan === planType) return;
    setUpdatingId(planType);
    try {
      // Request Stripe Checkout Session from our express backend
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planType,
          priceAmount: priceAmount,
          userId: userId,
          customerEmail: auth.currentUser?.email || "",
          mode: 'subscription',
          billingCycle: billingCycle,
          successPath: '/subscription'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to create secure subscription session.");
      }

      // Redirect browser directly to Stripe-hosted checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Subscription purchase redirection failed:", err);
      alert("Abonelik işlemi başlatılamadı: " + err.message);
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
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">FINANCIAL GOVERNANCE TERMINAL</span>
          <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white mt-1 uppercase">Subscription Center</h2>
          <p className="text-[#BBC0C4] text-[11px] font-mono tracking-tight mt-1 max-w-2xl">Manage workspace access, operational credits and subscription services for your maritime contract environment.</p>
        </div>
      </div>

      {/* Current Active Plan Card */}
      <div className="bg-[#202636] p-5 rounded-xl border border-[#2B3347] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20">
            <Award size={28} />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded bg-[#00D68F]/10 text-[#00D68F] font-mono text-[9px] uppercase font-bold border border-[#00D68F]/20">Active Subscription</span>
            <h3 className="text-lg font-manrope font-bold text-white mt-1 uppercase tracking-tight">Workspace Coverage</h3>
            <p className="text-[10px] text-[#80868B] font-mono uppercase">{subscription?.plan} Tier active in this workspace environment.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 border-l border-[#2B3347] pl-6">
          <div>
            <span className="text-[9px] text-[#80868B] block uppercase font-bold font-mono tracking-widest">Cost</span>
            <span className="text-sm font-bold text-white font-mono tracking-tighter uppercase">${subscription?.amount ?? 0}.00</span>
          </div>
          <div>
            <span className="text-[9px] text-[#80868B] block uppercase font-bold font-mono tracking-widest">Renewal Date</span>
            <span className="text-sm font-bold text-white font-mono tracking-tighter uppercase">
              {subscription?.currentPeriodEnd ? (
                typeof subscription.currentPeriodEnd === 'string' 
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                  : (subscription.currentPeriodEnd as any).toDate?.().toLocaleDateString() || 'Auto Renewal'
              ) : "Auto Renewal"}
            </span>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-[#202636] p-1 rounded-lg border border-[#2B3347] inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest font-mono transition-all ${
              billingCycle === 'monthly' ? 'bg-[#00D4FF] text-black' : 'text-[#80868B] hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest font-mono transition-all ${
              billingCycle === 'annual' ? 'bg-[#00D4FF] text-black' : 'text-[#80868B] hover:text-white'
            }`}
          >
            Annual <span className="ml-1 text-[9px] bg-black/20 px-1.5 py-0.5 rounded text-black mix-blend-multiply">- 2 Months Free</span>
          </button>
        </div>
      </div>

      {/* Plans List Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        {plansList.map((plan) => {
          const isActive = subscription?.plan === plan.id;
          const currentPrice = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
          const currentPeriod = billingCycle === 'annual' ? 'per year' : 'per month';
          const currentValue = billingCycle === 'annual' ? plan.valueAnnual : plan.valueMonthly;

          return (
            <div 
              key={plan.id}
              className={`p-5 bg-[#202636] rounded-xl border transition-all flex flex-col ${
                isActive 
                  ? 'border-[#00D4FF] ring-1 ring-[#00D4FF]/20 bg-[#00D4FF]/5' 
                  : 'border-[#2B3347] hover:border-[#00D4FF]/30'
              }`}
            >
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.2em] font-mono">{plan.id} Tier</h4>
                  {isActive && (
                    <span className="px-2 py-0.5 bg-[#00D68F]/10 text-[#00D68F] border border-[#00D68F]/20 rounded text-[8px] font-bold uppercase tracking-widest">Selected</span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-white font-mono">{currentPrice}</span>
                  <span className="text-[9px] text-[#80868B] font-mono font-bold uppercase">{currentPeriod}</span>
                </div>
                <p className="text-[10px] text-[#80868B] mt-2 font-mono uppercase tracking-tight leading-relaxed">{plan.target}</p>

                <hr className="my-4 border-[#2B3347]" />

                <div className="space-y-5">
                  <div>
                    <h5 className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.15em] font-mono mb-2">Included Features</h5>
                    <ul className="space-y-1.5">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex gap-2 text-[10px] text-[#BBC0C4] font-mono tracking-tight uppercase">
                          <Check size={11} className="text-[#00D4FF] shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.15em] font-mono mb-2">Operational Capacity</h5>
                    <ul className="space-y-1.5">
                      {plan.capacity.map((feat, fIdx) => (
                        <li key={fIdx} className="flex gap-2 text-[10px] text-[#BBC0C4] font-mono tracking-tight uppercase">
                          <div className="w-1 h-1 rounded-full bg-[#00D4FF] mt-1.5 shrink-0" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.15em] font-mono mb-2">Included Services</h5>
                    <ul className="space-y-1.5">
                      {plan.includedServices.map((feat, fIdx) => (
                        <li key={fIdx} className="flex gap-2 text-[10px] text-[#80868B] font-mono tracking-tight uppercase">
                          <Check size={11} className="text-[#00D68F] shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6" onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={isActive || updatingId !== null}
                  onClick={() => {
                    const price = billingCycle === 'annual' ? plan.valueAnnual : plan.valueMonthly;
                    handleUpdateSubscription(plan.id as any, price);
                  }}
                  className={`w-full py-2.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 tracking-wider ${
                    isActive 
                      ? 'bg-[#2B3347] text-[#80868B] cursor-default border border-[#2B3347]' 
                      : 'bg-[#00D4FF] text-[#171B26] hover:bg-[#33DDFF] border border-[#00D4FF]'
                  }`}
                >
                  {updatingId === plan.id ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <Loader2 size={14} className="animate-spin" /> Redirecting...
                    </span>
                  ) : isActive ? (
                    'Current Subscription'
                  ) : (
                    'Upgrade Plan'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Credit Policy Section */}
      <div className="bg-[#202636] border border-[#2B3347] rounded-xl p-6">
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-widest text-[#00D4FF] font-bold font-mono">CREDIT CONSUMPTION FRAMEWORK</span>
          <h3 className="text-lg font-manrope font-bold text-white uppercase tracking-tight mt-1">Operational Credit Policy</h3>
          <p className="text-[#BBC0C4] text-[10px] font-mono uppercase tracking-tight mt-1">Operational Credits are consumed strictly when AI-powered drafting or intelligence services are successfully executed.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h4 className="text-[9px] font-bold text-[#00D4FF] uppercase tracking-widest font-mono mb-3">Always Included (Free)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                "Contract Creation", "Contract Editing", "Draft Saving", "Contract Repository",
                "Agreement Preview", "PDF Generation", "PDF Download", "PDF Preview",
                "Deploy Agreement", "Review Agreement", "Accept Agreement", "Request Revision",
                "Decline Agreement", "Email Distribution", "Registry Update", "SHA-256 Generation",
                "Version History", "Audit Trail", "Firestore Sync", "Contract Locking", "Notifications"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[9px] text-[#80868B] uppercase font-mono tracking-tight">
                  <Check size={10} className="text-[#00D68F] shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[9px] font-bold text-[#FDD663] uppercase tracking-widest font-mono mb-1">Consumption Rules</h4>
            <div className="space-y-3">
              {[
                { title: "Execution Based", desc: "Operational Credits are deducted only after a successful AI execution." },
                { title: "Standard Deployment", desc: "Agreement deployment is free. Recipients never consume your credits." },
                { title: "Email Limits", desc: "Email notifications use dedicated monthly quotas, not operational credits." }
              ].map((rule, ridx) => (
                <div key={ridx}>
                  <p className="text-[10px] font-bold text-white uppercase tracking-tight font-mono">{rule.title}</p>
                  <p className="text-[9px] text-[#80868B] font-mono uppercase leading-relaxed mt-0.5">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
