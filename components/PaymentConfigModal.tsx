import React, { useState } from 'react';
import { CreditCard, X, ShieldCheck, FileText, Landmark, Globe, Activity } from 'lucide-react';

interface PartyPaymentData {
  beneficiary: {
    legalName: string;
    accountHolderName: string;
    registeredAddress: string;
    country: string;
    taxNumber: string;
  };
  banking: {
    bankName: string;
    branchName: string;
    accountNumber: string;
    iban: string;
    swiftBic: string;
    currency: string;
    paymentReference: string;
  };
  digital: {
    stripeAccountId: string;
    stripeConnectedAccount: string;
    mercury: string;
    cenoa: string;
    wiseBusiness: string;
    payoneer: string;
    revolutBusiness: string;
  };
}

interface PaymentConfigData {
  paymentMethod: string;
  paymentCurrency: string;
  paymentSchedule: string;
  paymentDuePeriod: string;
  depositRequirement: string;
  milestonePayments: string;
  finalSettlement: string;
  latePaymentInterest: string;
  taxesIncluded: string;
}

interface PaymentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyA: any;
  partyB: any;
  contractFields: any;
  setContractFields: (fields: any) => void;
}

const emptyPartyData = (): PartyPaymentData => ({
  beneficiary: { legalName: '', accountHolderName: '', registeredAddress: '', country: '', taxNumber: '' },
  banking: { bankName: '', branchName: '', accountNumber: '', iban: '', swiftBic: '', currency: '', paymentReference: '' },
  digital: { stripeAccountId: '', stripeConnectedAccount: '', mercury: '', cenoa: '', wiseBusiness: '', payoneer: '', revolutBusiness: '' }
});

const emptyConfigData = (): PaymentConfigData => ({
  paymentMethod: '', paymentCurrency: '', paymentSchedule: '', paymentDuePeriod: '',
  depositRequirement: '', milestonePayments: '', finalSettlement: '', latePaymentInterest: '', taxesIncluded: ''
});

export const PaymentConfigModal: React.FC<PaymentConfigModalProps> = ({ isOpen, onClose, partyA, partyB, contractFields, setContractFields }) => {
  const [activeTab, setActiveTab] = useState<'partyA' | 'partyB' | 'config'>('partyA');
  
  const partyAData: PartyPaymentData = contractFields.partyAPaymentData || emptyPartyData();
  const partyBData: PartyPaymentData = contractFields.partyBPaymentData || emptyPartyData();
  const configData: PaymentConfigData = contractFields.globalPaymentConfig || emptyConfigData();

  if (!isOpen) return null;

  const handlePartyChange = (party: 'partyA' | 'partyB', section: keyof PartyPaymentData, field: string, value: string) => {
    const currentData = party === 'partyA' ? { ...partyAData } : { ...partyBData };
    currentData[section] = { ...currentData[section], [field]: value } as any;
    setContractFields({ ...contractFields, [party === 'partyA' ? 'partyAPaymentData' : 'partyBPaymentData']: currentData });
  };

  const handleConfigChange = (field: keyof PaymentConfigData, value: string) => {
    const currentData = { ...configData, [field]: value };
    setContractFields({ ...contractFields, globalPaymentConfig: currentData });
  };

  const inputClass = "w-full bg-[#041326]/40 border border-white/10 px-3 py-2 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400/50 transition-all font-sans";
  const labelClass = "block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5";
  const sectionTitleClass = "text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-white/10 pb-2";

  const renderPartyForm = (party: 'partyA' | 'partyB', data: PartyPaymentData, roleName: string) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className={sectionTitleClass}><UserIcon className="w-3.5 h-3.5" /> Beneficiary Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Legal Entity Name</label><input className={inputClass} value={data.beneficiary.legalName} onChange={e => handlePartyChange(party, 'beneficiary', 'legalName', e.target.value)} /></div>
          <div><label className={labelClass}>Account Holder Name</label><input className={inputClass} value={data.beneficiary.accountHolderName} onChange={e => handlePartyChange(party, 'beneficiary', 'accountHolderName', e.target.value)} /></div>
          <div className="col-span-2"><label className={labelClass}>Registered Address</label><input className={inputClass} value={data.beneficiary.registeredAddress} onChange={e => handlePartyChange(party, 'beneficiary', 'registeredAddress', e.target.value)} /></div>
          <div><label className={labelClass}>Country</label><input className={inputClass} value={data.beneficiary.country} onChange={e => handlePartyChange(party, 'beneficiary', 'country', e.target.value)} /></div>
          <div><label className={labelClass}>Tax / Registration Number</label><input className={inputClass} value={data.beneficiary.taxNumber} onChange={e => handlePartyChange(party, 'beneficiary', 'taxNumber', e.target.value)} /></div>
        </div>
      </div>
      <div>
        <h3 className={sectionTitleClass}><Landmark className="w-3.5 h-3.5" /> Banking Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Bank Name</label><input className={inputClass} value={data.banking.bankName} onChange={e => handlePartyChange(party, 'banking', 'bankName', e.target.value)} /></div>
          <div><label className={labelClass}>Branch Name (Optional)</label><input className={inputClass} value={data.banking.branchName} onChange={e => handlePartyChange(party, 'banking', 'branchName', e.target.value)} /></div>
          <div><label className={labelClass}>Account Number</label><input className={inputClass} value={data.banking.accountNumber} onChange={e => handlePartyChange(party, 'banking', 'accountNumber', e.target.value)} /></div>
          <div><label className={labelClass}>IBAN</label><input className={inputClass} value={data.banking.iban} onChange={e => handlePartyChange(party, 'banking', 'iban', e.target.value)} /></div>
          <div><label className={labelClass}>SWIFT / BIC</label><input className={inputClass} value={data.banking.swiftBic} onChange={e => handlePartyChange(party, 'banking', 'swiftBic', e.target.value)} /></div>
          <div><label className={labelClass}>Currency</label><input className={inputClass} value={data.banking.currency} onChange={e => handlePartyChange(party, 'banking', 'currency', e.target.value)} /></div>
          <div className="col-span-2"><label className={labelClass}>Payment Reference</label><input className={inputClass} value={data.banking.paymentReference} onChange={e => handlePartyChange(party, 'banking', 'paymentReference', e.target.value)} /></div>
        </div>
      </div>
      <div>
        <h3 className={sectionTitleClass}><Globe className="w-3.5 h-3.5" /> Digital Payments</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Stripe Account ID</label><input className={inputClass} value={data.digital.stripeAccountId} onChange={e => handlePartyChange(party, 'digital', 'stripeAccountId', e.target.value)} /></div>
          <div><label className={labelClass}>Stripe Connected Account</label><input className={inputClass} value={data.digital.stripeConnectedAccount} onChange={e => handlePartyChange(party, 'digital', 'stripeConnectedAccount', e.target.value)} /></div>
          <div><label className={labelClass}>Mercury</label><input className={inputClass} value={data.digital.mercury} onChange={e => handlePartyChange(party, 'digital', 'mercury', e.target.value)} /></div>
          <div><label className={labelClass}>Cenoa</label><input className={inputClass} value={data.digital.cenoa} onChange={e => handlePartyChange(party, 'digital', 'cenoa', e.target.value)} /></div>
          <div><label className={labelClass}>Wise Business</label><input className={inputClass} value={data.digital.wiseBusiness} onChange={e => handlePartyChange(party, 'digital', 'wiseBusiness', e.target.value)} /></div>
          <div><label className={labelClass}>Payoneer</label><input className={inputClass} value={data.digital.payoneer} onChange={e => handlePartyChange(party, 'digital', 'payoneer', e.target.value)} /></div>
          <div><label className={labelClass}>Revolut Business</label><input className={inputClass} value={data.digital.revolutBusiness} onChange={e => handlePartyChange(party, 'digital', 'revolutBusiness', e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  const renderConfigForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h3 className={sectionTitleClass}><Activity className="w-3.5 h-3.5" /> Global Payment Configuration</h3>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelClass}>Payment Method</label><input className={inputClass} value={configData.paymentMethod} onChange={e => handleConfigChange('paymentMethod', e.target.value)} /></div>
        <div><label className={labelClass}>Payment Currency</label><input className={inputClass} value={configData.paymentCurrency} onChange={e => handleConfigChange('paymentCurrency', e.target.value)} /></div>
        <div><label className={labelClass}>Payment Schedule</label><input className={inputClass} value={configData.paymentSchedule} onChange={e => handleConfigChange('paymentSchedule', e.target.value)} /></div>
        <div><label className={labelClass}>Payment Due Period</label><input className={inputClass} value={configData.paymentDuePeriod} onChange={e => handleConfigChange('paymentDuePeriod', e.target.value)} /></div>
        <div><label className={labelClass}>Deposit Requirement</label><input className={inputClass} value={configData.depositRequirement} onChange={e => handleConfigChange('depositRequirement', e.target.value)} /></div>
        <div><label className={labelClass}>Milestone Payments</label><input className={inputClass} value={configData.milestonePayments} onChange={e => handleConfigChange('milestonePayments', e.target.value)} /></div>
        <div><label className={labelClass}>Final Settlement</label><input className={inputClass} value={configData.finalSettlement} onChange={e => handleConfigChange('finalSettlement', e.target.value)} /></div>
        <div><label className={labelClass}>Late Payment Interest</label><input className={inputClass} value={configData.latePaymentInterest} onChange={e => handleConfigChange('latePaymentInterest', e.target.value)} /></div>
        <div className="col-span-2"><label className={labelClass}>Taxes Included / Excluded</label><input className={inputClass} value={configData.taxesIncluded} onChange={e => handleConfigChange('taxesIncluded', e.target.value)} /></div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 p-4">
      <div className="bg-[#0b1221] border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl shadow-black relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
        
        {/* Header */}
        <div className="p-6 md:p-8 flex justify-between items-start border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-400/10 rounded-2xl flex items-center justify-center border border-emerald-400/20 shrink-0">
              <CreditCard size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">Payment Terms & Config</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Enterprise Payment Configuration Center</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        {/* Tabs */}
        <div className="px-6 md:px-8 border-b border-white/5 flex gap-6 shrink-0">
          <button 
            onClick={() => setActiveTab('partyA')}
            className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'partyA' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Party A ({partyA.role})
          </button>
          <button 
            onClick={() => setActiveTab('partyB')}
            className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'partyB' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Party B ({partyB.role})
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'config' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Global Config
          </button>
        </div>

        {/* Form Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {activeTab === 'partyA' && renderPartyForm('partyA', partyAData, partyA.role)}
          {activeTab === 'partyB' && renderPartyForm('partyB', partyBData, partyB.role)}
          {activeTab === 'config' && renderConfigForm()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#080d17] shrink-0 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-emerald-400/70 leading-relaxed max-w-md">
              Information is encrypted and stored securely. This data will be automatically embedded into the final executed agreement.
            </p>
          </div>
          <button onClick={onClose} className="bg-emerald-500 text-white font-bold tracking-widest uppercase text-xs px-8 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
            Save & Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
