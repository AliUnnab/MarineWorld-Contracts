import React, { useState } from 'react';
import { db, logAuditEvent } from '../../services/firebase-service';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../../services/firebase-service';
import { signOut } from 'firebase/auth';
import PaymentModal from './PaymentModal';
import { StripeService } from '../services/stripe-service';
import { Check } from 'lucide-react';

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
      name: 'Starter',
      priceMonthly: 29,
      priceAnnual: 24, // equivalent monthly
      totalAnnualPrice: 290,
      equivalentMonthly: 'USD 24.17',
      subtitle: 'For Independent Maritime Professionals',
      credits: 500,
      desc: 'Ideal for consultants, surveyors, brokers and independent maritime service providers.',
      features: [
        '1 Workspace User',
        '500 AI Operational Credits / Month',
        '100 Email Notifications / Month',
        'Unlimited Contracts',
        'Unlimited PDF Generation',
        'Registry & SHA-256 Verification'
      ],
      idealFor: 'Independent consultants, surveyors and maritime brokers.',
      cta: 'Start Workspace',
      popular: false
    },
    {
      id: 'Professional',
      name: 'Professional',
      priceMonthly: 99,
      priceAnnual: 82, // equivalent monthly
      totalAnnualPrice: 990,
      equivalentMonthly: 'USD 82.50',
      subtitle: 'For Maritime Companies',
      credits: 2500,
      desc: 'Built for growing maritime businesses managing commercial and operational agreements.',
      features: [
        '3 Workspace Users',
        '2,500 AI Operational Credits / Month',
        '1,000 Email Notifications / Month',
        'Approval Workflows',
        'AI Risk Analysis',
        'Compliance Review',
        'Registry & SHA-256 Verification'
      ],
      idealFor: 'Growing maritime companies and commercial operators.',
      cta: 'Start Workspace',
      popular: true
    },
    {
      id: 'Enterprise',
      name: 'Enterprise',
      priceMonthly: 299,
      priceAnnual: 249, // equivalent monthly
      totalAnnualPrice: 2990,
      equivalentMonthly: 'USD 249.17',
      subtitle: 'For Shipyards, Fleet Operators & Corporate Groups',
      credits: 10000,
      desc: 'Designed for organizations managing high-volume maritime contract operations.',
      features: [
        'Unlimited Workspace Users',
        '10,000 AI Operational Credits / Month',
        '5,000 Email Notifications / Month',
        'Governance Workflows',
        'Audit Traceability',
        'Dedicated Support',
        'Custom Credit Allocations'
      ],
      idealFor: 'Enterprise organizations operating multiple teams and large contract portfolios.',
      cta: 'Contact Sales',
      popular: false
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
      <div className="flex flex-col items-center mb-12">
        <div className="relative mb-3">
          {/* Best Value Badge above "Annual • Save 2 Months" */}
          {billingCycle === 'annual' && (
            <div className="absolute -top-6 right-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <span className="text-[8px] font-bold text-[#00D4FF] border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-2 py-0.5 rounded uppercase tracking-widest font-mono">
                ✓ Best Value
              </span>
            </div>
          )}
          <div className="bg-[#202636] p-1 rounded-lg border border-[#2B354D] inline-flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-md text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-[#00D4FF] text-[#040B18]' : 'text-[#80868B] hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-md text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'annual' ? 'bg-[#00D4FF] text-[#040B18]' : 'text-[#80868B] hover:text-white'
              }`}
            >
              Annual • Save 2 Months
            </button>
          </div>
        </div>
        
        {/* Savings Message */}
        <p className="text-[10px] text-[#80868B] font-mono uppercase tracking-wider text-center max-w-md">
          Annual plans include the equivalent of two months free compared to monthly billing.
        </p>
      </div>

      {/* Grid: 3 columns matching LandingPage */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl mb-8 items-stretch">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isPopular = plan.popular;
          const isMonthly = billingCycle === 'monthly';
          const displayPrice = isMonthly ? `USD ${plan.priceMonthly}` : `USD ${plan.totalAnnualPrice}`;
          const displayPeriod = isMonthly ? '/ Month' : '/ Year';

          return (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-6 md:p-8 rounded-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                isSelected 
                  ? 'border-2 border-[#00D4FF] shadow-[0_0_30px_rgba(0,212,255,0.25)] bg-[#1F293F] scale-102 relative md:-translate-y-2'
                  : isPopular 
                    ? 'bg-gradient-to-b from-[#1F293F] to-[#151D2C] border-2 border-[#00D4FF]/40 hover:border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.08)] scale-102 relative md:-translate-y-2' 
                    : 'bg-gradient-to-b from-[#1C2233] to-[#111622] border border-[#2B354D] hover:border-[#00D4FF]/40 shadow-xl hover:-translate-y-1'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-manrope font-bold text-white tracking-wide">{plan.name}</h3>
                  {isPopular && (
                    <span className="text-[9px] font-bold bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 px-2 py-0.5 rounded tracking-wide font-mono uppercase">
                      Best Value
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-manrope font-extrabold text-[#E8EAED] tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-xs text-[#BBC0C4] font-medium font-mono">
                    {displayPeriod}
                  </span>
                </div>

                {/* Secondary line for Annual equivalent pricing */}
                {!isMonthly && (
                  <div className="text-[10px] text-[#BBC0C4]/80 font-mono mt-0.5 mb-3 lowercase tracking-wider animate-in fade-in duration-200">
                    equivalent to only <span className="text-[#00D4FF] font-bold">{plan.equivalentMonthly}</span>/month
                  </div>
                )}

                <div className="text-[11px] text-[#00D4FF] font-mono min-h-[24px] flex items-center mb-4">
                  {isMonthly ? 'Billed monthly' : `Billed USD ${plan.totalAnnualPrice} / year`}
                </div>
                
                <hr className="my-4 border-white/5 animate-none" />

                <div className="mb-6">
                  <p className="text-[11px] font-bold text-[#80868B] uppercase tracking-wider mb-2 font-mono">
                    Ideal for:
                  </p>
                  <p className="text-xs text-[#BBC0C4] leading-relaxed mb-4 text-left font-sans">
                    {plan.idealFor}
                  </p>
                </div>

                <p className="text-[11px] font-bold text-[#80868B] uppercase tracking-wider mb-3 font-mono">
                  Includes:
                </p>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex gap-2.5 text-xs text-[#BBC0C4] items-start">
                      <Check size={13} className="text-[#00D4FF] shrink-0 mt-0.5" />
                      <span className="leading-tight text-left font-sans">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan.id);
                  }}
                  className={`w-full h-11 rounded-lg text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#00D4FF] text-[#040B18] shadow-[0_4px_12px_rgba(0,212,255,0.2)]'
                      : 'bg-[#202636] hover:bg-[#2B354D] text-white border border-[#2B354D]'
                  }`}
                >
                  {isSelected ? "Selected" : "Select Plan"}
                </button>
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
