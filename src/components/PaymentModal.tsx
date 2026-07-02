import React, { useState } from 'react';
import { Lock, CreditCard, HelpCircle, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  title?: string;
  price?: number;
  period?: string;
  isTrial?: boolean;
  onClose: () => void;
  onSubmit: (cardData: any) => Promise<void>;
  loading?: boolean;
}

export default function PaymentModal({ title = "Secure Payment", price, period = "month", isTrial = false, onClose, onSubmit, loading = false }: PaymentModalProps) {
  const [name, setName] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, card, expiry, cvc });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#040B18] border border-[#2B3347] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" translate="no">
        {/* Header */}
        <div className="p-6 border-b border-[#2B3347] bg-[#0A1121]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock size={16} className="text-[#80868B]" />
            <h2 className="text-lg font-semibold text-white font-sans tracking-tight">{title}</h2>
          </div>
          
          <div className="text-center space-y-1">
            {isTrial ? (
              <>
                <div className="text-3xl font-bold text-white font-sans tracking-tight">Due Today: $0.00</div>
                {price !== undefined && (
                  <div className="text-xs text-[#80868B] font-medium">(${price.toFixed(2)}/{period} starts after your 7-day free trial)</div>
                )}
              </>
            ) : price !== undefined ? (
              <>
                <div className="text-3xl font-bold text-white font-sans tracking-tight">Total Due: ${price.toFixed(2)} <span className="text-sm font-medium text-[#80868B]">/ {period}</span></div>
                <div className="text-[10px] text-[#80868B] font-medium mt-1">Local currency will be applied automatically based on your location: USD ($), EUR (€), GBP (£), etc.</div>
              </>
            ) : (
              <div className="text-sm text-[#80868B] font-medium">Update your secure payment method</div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#E8EAED] mb-1.5 uppercase tracking-wider">Cardholder Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe" 
                className="w-full px-3 py-2.5 bg-[#141924] border border-[#2B3347] rounded-lg text-sm text-white placeholder-[#80868B] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#E8EAED] mb-1.5 uppercase tracking-wider">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={card}
                  onChange={e => setCard(e.target.value)}
                  placeholder="•••• •••• •••• ••••" 
                  className="w-full px-3 py-2.5 bg-[#141924] border border-[#2B3347] rounded-lg text-sm text-white placeholder-[#80868B] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all pr-10 font-mono"
                />
                <CreditCard size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#80868B]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#E8EAED] mb-1.5 uppercase tracking-wider">Expiry Date</label>
                <input 
                  type="text" 
                  required
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  placeholder="MM / YY" 
                  className="w-full px-3 py-2.5 bg-[#141924] border border-[#2B3347] rounded-lg text-sm text-white placeholder-[#80868B] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E8EAED] mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  CVC
                  <HelpCircle size={12} className="text-[#80868B]" />
                </label>
                <input 
                  type="text" 
                  required
                  value={cvc}
                  onChange={e => setCvc(e.target.value)}
                  placeholder="•••" 
                  className="w-full px-3 py-2.5 bg-[#141924] border border-[#2B3347] rounded-lg text-sm text-white placeholder-[#80868B] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] font-bold tracking-wider uppercase py-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-[#040B18]/20 border-t-[#040B18] rounded-full animate-spin inline-block" />
              )}
              <span>{price !== undefined ? "Start Subscription" : "Save Payment Method"}</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full bg-transparent border border-[#2B3347] hover:bg-[#141924] text-[#E8EAED] font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-[10px] text-[#80868B] leading-relaxed text-center mt-4">
            By clicking {price !== undefined ? "Start Subscription" : "Save Payment Method"}, you agree to our Terms of Service and Privacy Policy. {price !== undefined ? "Your subscription will automatically renew at the end of each billing period unless canceled. " : ""}You may be redirected to your bank's 3D Secure page to verify your payment.
          </p>
        </form>

        {/* Footer */}
        <div className="bg-[#0A1121] border-t border-[#2B3347] p-4 flex flex-col items-center justify-center space-y-3">
          <div className="text-[10px] text-[#80868B] font-medium flex items-center justify-center gap-1.5 w-full text-center">
            <Lock size={12} className="shrink-0" /> 
            <span>Encrypted, secure payment processed by Stripe. We never store your card details.</span>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-bold text-[#80868B] uppercase tracking-wider">
            <span className="flex items-center gap-1 text-[#BBC0C4]"><ShieldCheck size={11} /> Stripe</span>
            <span className="w-1 h-1 rounded-full bg-[#2B3347]"></span>
            <span>PCI-DSS Compliant</span>
            <span className="w-1 h-1 rounded-full bg-[#2B3347]"></span>
            <span>3D Secure Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
