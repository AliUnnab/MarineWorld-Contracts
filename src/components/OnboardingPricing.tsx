import React, { useState } from 'react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../../services/firebase-service';
import { signOut } from 'firebase/auth';
import PaymentModal from './PaymentModal';
import { StripeService } from '../services/stripe-service';

interface OnboardingPricingProps {
  userId: string;
  onPaymentSuccess: () => void;
  onLogout: () => void;
}

export default function OnboardingPricing({ userId, onPaymentSuccess, onLogout }: OnboardingPricingProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const plans = [
    {
      id: 'Starter',
      priceMonthly: 29,
      priceAnnual: 24, // equivalent monthly
      totalAnnualPrice: 290,
      subtitle: 'For Independent Maritime Professionals',
      credits: 500,
      desc: 'Ideal for consultants, surveyors, brokers and independent maritime service providers.',
      features: ['1 Workspace User', '500 Operational Credits', 'Contract Repository', 'Version History', 'Standard Templates', 'Secure Workspace Environment', 'Email Support']
    },
    {
      id: 'Professional',
      priceMonthly: 99,
      priceAnnual: 82, // equivalent monthly
      totalAnnualPrice: 990,
      subtitle: 'For Maritime Companies',
      credits: 2500,
      isPopular: true,
      desc: 'Built for growing maritime businesses managing commercial and operational agreements.',
      features: ['3 Workspace Users', '2,500 Operational Credits', 'Contract Repository', 'Approval Workflows', 'Risk Analysis', 'Compliance Review', 'Priority Support']
    },
    {
      id: 'Enterprise',
      priceMonthly: 299,
      priceAnnual: 249, // equivalent monthly
      totalAnnualPrice: 2990,
      subtitle: 'For Shipyards, Fleet Operators & Corporate Groups',
      credits: 10000,
      desc: 'Designed for organizations managing high-volume maritime contract operations.',
      features: ['Unlimited Workspace Users', '10,000 Operational Credits', 'Advanced Repository Controls', 'Governance Workflows', 'Role-Based Permissions', 'Audit Traceability', 'Dedicated Support']
    }
  ];

  const processPayment = async (planId: string, priceAmount: number) => {
    setLoading(true);
    setSuccessMsg("Redirecting to secure payment environment...");
    
    try {
      const planInfo = plans.find(p => p.id === planId);
      if (!planInfo) throw new Error("Plan not found");

      // Request Stripe Checkout Session from our express backend
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,
          priceAmount: priceAmount,
          userId: userId,
          customerEmail: auth.currentUser?.email || "",
          mode: 'subscription',
          billingCycle: billingCycle,
          successPath: '/dashboard'
        })
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Failed to create secure payment session.");
      }

      // Redirect browser directly to Stripe-hosted checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Payment processing failed:", err);
      alert("Payment processing failed: " + err.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      window.sessionStorage.setItem('is_signing_out', 'true');
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      onLogout();
    }
  };

  const getPlanPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  };

  const getPlanChargePrice = (plan: typeof plans[0]) => {
    return billingCycle === 'annual' ? plan.totalAnnualPrice : plan.priceMonthly;
  };

  return (
    <div className="min-h-screen bg-[#171B26] text-[#E8EAED] flex flex-col items-center p-6 md:p-12 font-sans">
      
      <div className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="max-w-3xl">
          <h1 className="text-lg font-manrope font-semibold tracking-tight text-white mb-2 uppercase">Select Workspace Plan</h1>
          <p className="text-[#BBC0C4] leading-relaxed max-w-2xl text-[11px] mb-1 font-mono">
            Activate a Maritime Contract Studio workspace and choose the operational capacity that best matches your organization's contract management requirements.
          </p>
          <p className="text-[#BBC0C4] leading-relaxed max-w-2xl text-[11px] font-mono">
            All plans include secure workspace access, contract repository management, version control, audit traceability and operational workflows.
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-[9px] font-bold text-[#BBC0C4] hover:text-white flex items-center transition-colors bg-[#202636] px-3.5 py-1.5 border border-[#2B3347] hover:border-[#00D4FF]/30 rounded uppercase tracking-wider font-mono"
        >
          Logout
        </button>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-[#202636] p-1 rounded-lg border border-[#2B3347] inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest font-mono transition-all ${
              billingCycle === 'monthly' ? 'bg-[#00D4FF] text-[#040B18]' : 'text-[#80868B] hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest font-mono transition-all flex items-center gap-1.5 ${
              billingCycle === 'annual' ? 'bg-[#00D4FF] text-[#040B18]' : 'text-[#80868B] hover:text-white'
            }`}
          >
            Annual <span className="text-[8px] bg-black/25 px-1.5 py-0.5 rounded text-inherit">Save ~2 Months</span>
          </button>
        </div>
      </div>

      {/* Grid: 3 columns, more compact and "uygun ölçüde" */}
      <div className="grid md:grid-cols-3 gap-4 w-full max-w-5xl mb-8">
        {plans.map((plan) => {
          const displayPrice = getPlanPrice(plan);
          const isSelected = selectedPlan === plan.id;

          return (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative bg-[#202636] border cursor-pointer transition-all rounded-lg p-4 flex flex-col justify-between min-h-[350px] ${
                isSelected 
                  ? 'border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.08)] bg-[#242B3A]' 
                  : 'border-[#2B3347] hover:border-[#00D4FF]/30 hover:bg-[#2B3347]'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-manrope font-semibold text-sm text-white uppercase tracking-wide">{plan.id}</h3>
                  {plan.isPopular && (
                    <span className="text-[7px] bg-[#00D4FF]/10 text-[#00D4FF] px-1.5 py-0.5 rounded border border-[#00D4FF]/20 font-bold uppercase tracking-wider font-mono">Popular</span>
                  )}
                </div>
                <p className="text-[9px] text-[#BBC0C4] font-medium leading-normal min-h-[28px] uppercase font-mono">{plan.subtitle}</p>

                <div className="my-3 border-b border-[#2B3347] pb-3">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-extrabold text-white font-mono">${displayPrice}</span>
                    <span className="text-[9px] text-[#80868B] ml-1 uppercase font-mono">/ Month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-[8px] text-[#00D68F] uppercase tracking-wider font-mono mt-0.5">Billed ${plan.totalAnnualPrice} / year</p>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-[8px] font-bold text-[#80868B] uppercase mb-2 tracking-wider font-mono">Included Features:</p>
                  <ul className="space-y-1.5">
                    {plan.features.slice(0, 5).map((feature, i) => (
                      <li key={i} className="flex items-start text-[10px] text-[#BBC0C4] before:content-['•'] before:mr-2 before:text-[#00D4FF]">
                        <span className="leading-tight uppercase tracking-tight font-mono">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="pt-3 border-t border-[#2B3347] mt-auto">
                <p className="text-[8px] text-[#80868B] leading-normal uppercase tracking-wider font-mono">
                  {plan.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <div className="bg-[#202636] border border-[#2B3347] p-5 w-full max-w-5xl rounded-lg animate-in fade-in slide-in-from-bottom-3 mb-4" translate="no">
          <div className="mb-4 border-b border-[#2B3347] pb-4">
            <p className="text-[9px] text-[#80868B] font-bold uppercase tracking-wider mb-1 font-mono">Selected Plan Summary</p>
            <div className="flex justify-between items-end">
              <h3 className="text-md font-manrope font-semibold text-white uppercase">
                <span>{selectedPlan} Workspace ({billingCycle === 'annual' ? 'Annual' : 'Monthly'})</span>
              </h3>
              <div className="text-lg font-bold text-white font-mono">
                 <span>${billingCycle === 'annual' ? plans.find(p => p.id === selectedPlan)?.totalAnnualPrice : plans.find(p => p.id === selectedPlan)?.priceMonthly}</span>
                 <span className="text-xs font-normal text-[#80868B]">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
              </div>
            </div>
          </div>
          
          <div className="mb-5">
             <p className="text-[9px] font-bold text-[#80868B] uppercase mb-2 tracking-wider font-mono">Full Features & Capacity Included:</p>
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 gap-x-4">
                {plans.find(p => p.id === selectedPlan)?.features?.map((feature, i) => (
                    <li key={i} className="text-[10px] text-[#BBC0C4] before:content-['•'] before:mr-2 before:text-[#80868B] font-mono uppercase tracking-tight">
                      {feature}
                    </li>
                ))}
            </ul>
          </div>
          
          <button 
            onClick={() => {
              const plan = plans.find(p => p.id === selectedPlan);
              if (plan) {
                const price = getPlanChargePrice(plan);
                processPayment(selectedPlan, price);
              }
            }}
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 font-bold text-[#171B26] bg-[#00D4FF] hover:bg-[#33DDFF] transition-colors uppercase tracking-widest text-xs rounded font-mono"
          >
            <span>{loading ? "PROCESSING..." : "ACTIVATE WORKSPACE SUBSCRIPTION"}</span>
          </button>
          
          <p className="text-[9px] text-center mt-4 text-[#80868B] uppercase tracking-wider leading-relaxed font-mono">
            Your workspace subscription will be activated after secure payment authorization.<br/>
            You will be redirected to the billing environment to complete subscription setup and workspace provisioning.
          </p>
        </div>
      )}

    </div>
  );
}
