import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Shield, Check, Layers, FileSignature, 
  Database, UserCheck, HelpCircle, Anchor, Activity, Clock, ShieldCheck, FileText, CheckCircle,
  Handshake, PenTool, Menu, X, Users, Package, MapPin, Settings, History, FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const trustLogos = [
    { name: "Commercial Shipping" },
    { name: "Shipbuilding" },
    { name: "Refit & Maintenance" },
    { name: "Yachting" },
    { name: "Marinas" },
    { name: "Ports" },
    { name: "Brokerage" },
    { name: "Charter Operations" },
    { name: "Marine Engineering" },
    { name: "Technical Management" },
    { name: "Marine Supply" },
    { name: "Professional Services" }
  ];

  const features = [
    {
      icon: <Anchor size={22} className="text-[#00D4FF]" />,
      title: "1. Vessel Transactions",
      description: "Manage purchase, sale and transfer agreements for yachts, vessels and marine assets."
    },
    {
      icon: <Layers size={22} className="text-[#00D4FF]" />,
      title: "2. Shipbuilding & New Build Programs",
      description: "Control contractual obligations, milestone schedules, technical specifications and delivery requirements."
    },
    {
      icon: <Activity size={22} className="text-[#00D4FF]" />,
      title: "3. Refit & Technical Services",
      description: "Manage maintenance, repair, warranty, refit and shipyard service agreements."
    },
    {
      icon: <Handshake size={22} className="text-[#00D4FF]" />,
      title: "4. Brokerage Operations",
      description: "Coordinate brokerage agreements, commissions, agency relationships and commercial mandates."
    },
    {
      icon: <Clock size={22} className="text-[#00D4FF]" />,
      title: "5. Charter Operations",
      description: "Manage charter contracts, operational terms, liabilities and commercial obligations."
    },
    {
      icon: <Users size={22} className="text-[#00D4FF]" />,
      title: "6. Crew Agreements",
      description: "Structure employment, placement and crew management agreements."
    },
    {
      icon: <Database size={22} className="text-[#00D4FF]" />,
      title: "7. Procurement Management",
      description: "Manage supplier contracts, equipment sourcing and operational procurement workflows."
    },
    {
      icon: <Package size={22} className="text-[#00D4FF]" />,
      title: "8. Marine Supply & Provisions",
      description: "Control commercial agreements related to provisioning, catering, consumables and marine support services."
    },
    {
      icon: <FileText size={22} className="text-[#00D4FF]" />,
      title: "9. Contract Repository",
      description: "Maintain a centralized repository for active, archived and executed agreements."
    },
    {
      icon: <Settings size={22} className="text-[#00D4FF]" />,
      title: "10. Approval Workflows",
      description: "Manage reviews, approvals and execution procedures through structured workflows."
    },
    {
      icon: <FileCheck size={22} className="text-[#00D4FF]" />,
      title: "11. Version Control & Audit Traceability",
      description: "Track every revision, approval and modification across the contract lifecycle."
    },
    {
      icon: <ShieldCheck size={22} className="text-[#00D4FF]" />,
      title: "12. Compliance Documentation",
      description: "Organize obligations, certificates, supporting records and regulatory documentation."
    }
  ];

  const workflowSteps = [
    { num: "01", step: "Commercial Intent", text: "Define commercial objectives, participating parties, operational scope and contractual requirements." },
    { num: "02", step: "Negotiation", text: "Collaborate on terms, revisions and commercial conditions within a controlled workspace environment." },
    { num: "03", step: "Technical Review", text: "Validate specifications, deliverables, milestones and operational obligations." },
    { num: "04", step: "Legal Approval", text: "Perform compliance reviews, contractual assessments and internal approval procedures." },
    { num: "05", step: "Execution", text: "Finalize approved agreements and establish an auditable execution record." },
    { num: "06", step: "Archive & Governance", text: "Maintain structured access to executed agreements, supporting documentation and historical records." }
  ];

  const plans = [
    {
      name: "STARTER",
      target: "For Independent Maritime Professionals",
      price: "$29",
      period: "/month",
      features: [
        "1 Workspace User",
        "500 Operational Credits",
        "Contract Repository",
        "Version History",
        "Standard Templates",
        "Secure Workspace Environment",
        "Email Support"
      ],
      cta: "Start Workspace",
      popular: false
    },
    {
      name: "PROFESSIONAL",
      target: "For Maritime Companies",
      price: "$99",
      period: "/month",
      features: [
        "3 Workspace Users",
        "2,500 Operational Credits",
        "Contract Repository",
        "Approval Workflows",
        "Risk Analysis",
        "Compliance Review",
        "Priority Support"
      ],
      cta: "Start Workspace",
      popular: true
    },
    {
      name: "ENTERPRISE",
      target: "For Shipyards, Fleet Operators & Maritime Groups",
      price: "$299",
      period: "/month",
      features: [
        "Unlimited Workspace Users",
        "10,000 Operational Credits",
        "Advanced Repository Controls",
        "Governance Workflows",
        "Role-Based Permissions",
        "Audit Traceability",
        "Dedicated Support"
      ],
      cta: "Start Workspace",
      popular: false
    }
  ];

  const faqs = [
    { q: "Can Contract Studio manage yacht sale agreements?", a: "Yes, the system is designed to handle the complexity of multi-stage vessel acquisitions from initial LOI to final Protocol of Delivery and Acceptance." },
    { q: "Can shipyards use custom contract templates?", a: "Absolutely. You can implement your specific yard standard forms, refit agreements, and vendor procurement contracts." },
    { q: "How are contract revisions tracked?", a: "All revisions are logged with exact timestamps and author attribution in an immutable cloud database, providing a complete structural history of the negotiation." },
    { q: "Can multiple stakeholders review the same agreement?", a: "Yes, Role-Based Access Controls allow brokers, legal counsel, technical managers, and principals to interact within isolated permission scopes." },
    { q: "How are audit records maintained?", a: "Every action, modification, and signature creates an encrypted payload that is added to the contract's permanent audit trail document." },
    { q: "Is contract data isolated per workspace?", a: "Yes, we utilize strict Firestore indexing and rulesets to guarantee complete tenant isolation for sensitive commercial agreements." }
  ];

  return (
    <div className="min-h-screen bg-[#171B26] text-[#E8EAED] font-manrope selection:bg-[#00D4FF]/30 selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="h-16 shrink-0 border-b border-white/5 bg-[#040B18] sticky top-0 z-[100] flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF]">
            <Anchor size={16} />
          </div>
          <span className="text-[13px] md:text-[15px] font-manrope font-extrabold text-[#E8EAED] tracking-tighter uppercase whitespace-nowrap">MARINEWORLD <span className="hidden sm:inline text-[#00D4FF]">CONTRACT STUDIO</span></span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          <a href="#features" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Features</a>
          <a href="#workflow" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Lifecycle</a>
          <a href="#pricing" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Pricing</a>
          <a href="#faq" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Security</a>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={() => onNavigate('/login')}
              className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest px-4 py-2"
            >
              Log In
            </button>
            <button 
              onClick={() => onNavigate('/register')}
              className="text-[10px] font-bold bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] px-5 py-2 rounded transition-all uppercase tracking-widest"
            >
              Get Started
            </button>
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-[#BBC0C4] hover:text-[#00D4FF]"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[110] bg-[#141924] flex flex-col p-6 lg:hidden"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <Anchor size={20} className="text-[#00D4FF]" />
                <span className="text-[15px] font-extrabold uppercase">MARINEWORLD</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <X size={28} />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 mb-12">
              {['Features', 'Lifecycle', 'Pricing', 'Security'].map((link) => (
                <a 
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-bold uppercase tracking-tight text-[#E8EAED] hover:text-[#00D4FF]"
                >
                  {link}
                </a>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4">
              <button 
                onClick={() => onNavigate('/login')}
                className="h-14 w-full border border-white/10 rounded-lg text-[16px] font-bold uppercase tracking-widest"
              >
                Log In
              </button>
              <button 
                onClick={() => onNavigate('/register')}
                className="h-14 w-full bg-[#00D4FF] text-[#040B18] rounded-lg text-[16px] font-bold uppercase tracking-widest"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header 
        className="min-h-[700px] lg:min-h-[850px] flex items-center px-6 md:px-12 border-b border-white/5 relative overflow-hidden py-16 lg:py-0"
        style={{ background: 'linear-gradient(135deg, #040B18 0%, #071326 50%, #0A1930 100%)' }}
      >
        <div className="max-w-7xl w-full mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            {/* Brand Label */}
            <div className="font-manrope font-medium text-[12px] md:text-[14px] text-[#00D4FF] uppercase tracking-[0.4em] mb-4">
              MARINEWORLD
            </div>

            {/* Main Focal Point: Contract Studio */}
            <h1 className="font-manrope font-semibold text-[36px] md:text-[48px] lg:text-[72px] text-[#E8EAED] leading-tight lg:leading-none uppercase mb-4 lg:mb-6 tracking-tight">
              Contract Studio
            </h1>

            {/* Category Definition */}
            <div className="font-manrope font-medium text-[16px] md:text-[20px] lg:text-[28px] text-[#BBC0C4] uppercase tracking-tight mb-4">
              Maritime Contract Operating System
            </div>

            {/* Slogan */}
            <h2 className="font-manrope font-semibold text-[20px] md:text-[28px] lg:text-[36px] text-[#E8EAED] tracking-tight mb-6 md:mb-8">
              The Operating System For Maritime Agreements
            </h2>

            {/* Description */}
            <p className="font-manrope font-normal text-[14px] md:text-[16px] lg:text-[20px] text-[#BBC0C4] max-w-[650px] mx-auto lg:mx-0 leading-relaxed mb-8 md:mb-12">
              Designed for the global maritime industry, enabling structured contract operations across commercial, technical and operational environments.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-6 justify-center lg:justify-start mt-8 md:mt-12">
              <button 
                onClick={() => onNavigate('/register')}
                className="w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-5 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] font-extrabold rounded-lg transition-all shadow-xl flex items-center justify-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] active:scale-95"
              >
                Initialize Studio <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-5 bg-transparent hover:bg-white/5 text-[#E8EAED] font-extrabold rounded-lg transition-all border border-white/10 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center active:scale-95"
              >
                Request Access
              </button>
            </div>
          </div>

          {/* Decorative Icon Frame / Screenshot Second on Mobile */}
          <div className="flex-1 w-full max-w-sm lg:max-w-none mx-auto lg:mx-0 order-1 lg:order-2">
            <div className="flex flex-col gap-6 p-6 md:p-10 border border-white/5 rounded-3xl relative bg-white/[0.02] backdrop-blur-sm">
              <div className="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-[#00D4FF]/30"></div>
              <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-[#00D4FF]/30"></div>
              
              <div className="grid grid-cols-2 gap-6 md:gap-8">
                {[
                  { icon: <FileText size={32} strokeWidth={0.75} />, label: "Contract" },
                  { icon: <Handshake size={32} strokeWidth={0.75} />, label: "Negotiate" },
                  { icon: <ShieldCheck size={32} strokeWidth={0.75} />, label: "Verify" },
                  { icon: <PenTool size={32} strokeWidth={0.75} />, label: "Signature" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3 group">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border border-white/[0.05] flex items-center justify-center text-[#BBC0C4] group-hover:text-[#00D4FF] group-hover:border-[#00D4FF]/20 transition-all duration-500">
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-bold text-[#80868B] uppercase tracking-[0.2em] group-hover:text-[#BBC0C4] transition-colors">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Section */}
      <section className="bg-[#171B26] border-b border-white/5 py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[10px] font-bold tracking-[0.4em] text-[#80868B] uppercase mb-12 lg:mb-16">
            INDUSTRY-STANDARD MARITIME NODES
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {trustLogos.map((logo, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-4 md:p-6 bg-[#202636] border border-white/5 rounded-lg text-[10px] md:text-[11px] font-bold text-[#E8EAED] uppercase tracking-[0.15em] md:tracking-widest hover:border-[#00D4FF]/20 transition-all text-center min-h-[70px] md:min-h-[90px] leading-tight md:leading-normal">
                <span className="max-w-[120px]">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-6 bg-[#171B26]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-manrope font-bold tracking-tight text-[#E8EAED] uppercase">
              MARITIME CONTRACT OPERATIONS
            </h2>
            <p className="mt-6 text-[#BBC0C4] text-[13px] md:text-sm font-bold uppercase tracking-[0.2em]">Structured Contract Operations Across The Maritime Industry</p>
            <p className="mt-4 text-[#80868B] text-[11px] md:text-xs uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">Manage the complete lifecycle of maritime commercial, technical and operational agreements through a unified contract operating environment.</p>
            <div className="w-20 h-1 bg-[#00D4FF] mx-auto mt-8"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div key={idx} className="p-8 md:p-10 bg-[#202636] rounded border border-white/5 hover:bg-[#2B3347] transition-all group">
                <div className="mb-8 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-bold text-[#E8EAED] uppercase tracking-tight mb-4">{feat.title}</h3>
                <p className="text-[11.5px] text-[#BBC0C4] leading-relaxed uppercase tracking-tighter">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maritime Contract Lifecycle Section */}
      <section id="workflow" className="bg-[#202636] py-24 md:py-32 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#00D4FF] font-bold">OPERATIONAL PROTOCOL</span>
            <h2 className="text-4xl md:text-5xl font-manrope font-bold tracking-tight text-[#E8EAED] mt-4 uppercase">
              CONTRACT LIFECYCLE
            </h2>
            <p className="mt-4 text-[#BBC0C4] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">Structured Maritime Contract Operations</p>
            <p className="mt-2 text-[#80868B] text-[10px] md:text-[11px] uppercase tracking-widest max-w-xl mx-auto leading-relaxed">Manage agreements through a controlled lifecycle from initial commercial intent to final execution and archival.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((ws, idx) => (
              <div key={idx} className="p-8 md:p-10 bg-[#171B26] border border-white/5 rounded relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -rotate-45 translate-x-12 -translate-y-12"></div>
                <span className="text-4xl md:text-5xl font-manrope font-extrabold text-[#00D4FF] opacity-20 block mb-6">{ws.num}</span>
                <h3 className="text-sm font-bold text-[#E8EAED] uppercase tracking-tight mb-4">{ws.step}</h3>
                <p className="text-[11.5px] text-[#BBC0C4] leading-relaxed uppercase tracking-tighter">{ws.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operational Credit System Section */}
      <section id="wallet" className="py-20 md:py-32 px-6 max-w-7xl mx-auto bg-[#171B26]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.3em]">RESOURCE MANAGEMENT</span>
            <h2 className="text-4xl md:text-5xl font-manrope font-bold text-[#E8EAED] mt-4 uppercase tracking-tighter leading-[1.1] lg:leading-[0.9]">
              Operational Credit System
            </h2>
            <p className="mt-8 text-[#BBC0C4] leading-relaxed text-[13px] md:text-sm uppercase tracking-tight font-bold max-w-xl mx-auto lg:mx-0">
              Operational Credits represent measurable usage units consumed when advanced contract intelligence and compliance services are requested.
            </p>
            <p className="mt-4 text-[#80868B] text-[11px] uppercase tracking-widest font-bold">Credits are only consumed when advanced services are executed.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 mt-10 max-w-md mx-auto lg:mx-0">
              {[
                "Clause Analysis",
                "Liability Review",
                "Compliance Mapping",
                "Risk Assessment",
                "Regulatory Review",
                "Executive Summaries",
                "Document Validation",
                "Contract Intelligence"
              ].map((item, id) => (
                <div key={id} className="flex items-center gap-3 justify-center lg:justify-start">
                  <CheckCircle size={14} className="text-[#00D4FF] shrink-0" />
                  <span className="text-[10px] font-bold text-[#E8EAED] uppercase tracking-widest">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#2B3347] border border-white/5 p-8 md:p-12 rounded-2xl shadow-2xl relative w-full">
            <div className="flex justify-between items-center pb-10 border-b border-white/5">
              <div>
                <h4 className="text-sm font-bold text-[#E8EAED] uppercase tracking-widest">OPERATIONAL WALLET</h4>
                <p className="text-[10px] text-[#BBC0C4] mt-2 uppercase tracking-widest">WORKSPACE STATUS</p>
              </div>
              <span className="px-3 py-1.5 text-[10px] font-bold bg-[#00D68F]/10 text-[#00D68F] border border-[#00D68F]/20 rounded uppercase tracking-widest">ACTIVE</span>
            </div>
            
            <div className="py-12 text-center md:text-left">
              <p className="text-[11px] text-[#BBC0C4] uppercase font-bold tracking-[0.3em] mb-4">CREDITS REMAINING</p>
              <p className="text-7xl font-manrope font-extrabold text-[#00D4FF] tracking-tighter">18,500</p>
            </div>

            <div className="bg-[#171B26] p-8 rounded border border-white/5">
              <div className="flex justify-between text-[11px] mb-4 uppercase font-bold tracking-[0.2em]">
                <span className="text-[#BBC0C4]">MONTHLY ALLOCATION</span>
                <span className="text-[#E8EAED]">20,000</span>
              </div>
              <div className="w-full bg-[#202636] h-3 rounded-full overflow-hidden mb-6">
                <div className="bg-[#00D4FF] h-full shadow-[0_0_15px_rgba(0,212,255,0.5)]" style={{ width: '92.5%' }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                <span className="text-[#80868B]">CURRENT PLAN</span>
                <span className="text-[#00D4FF]">PROFESSIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-6 bg-[#171B26] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] uppercase tracking-tight">Subscription & Workspace Plan</h2>
            <div className="w-16 h-1 bg-[#00D4FF] mx-auto mt-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Reorder for mobile: PROFESSIONAL (popular) first */}
            {[...plans].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0)).map((pl, idx) => (
              <div key={idx} className={`p-8 md:p-12 bg-[#202636] border rounded-2xl transition-all flex flex-col ${
                pl.popular 
                  ? 'bg-[#2B3347] border-[#00D4FF]/25 shadow-[0_0_32px_rgba(0,212,255,0.12)] order-first lg:order-none scale-100 lg:scale-105' 
                  : 'border-white/5'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#BBC0C4]">{pl.target}</p>
                </div>
                <h3 className="text-2xl font-manrope font-bold text-[#E8EAED] uppercase tracking-tight">{pl.name}</h3>
                <div className="flex items-baseline gap-2 mt-6 lg:mt-8">
                  <span className="text-4xl md:text-5xl font-manrope font-bold text-[#E8EAED] tracking-tighter">{pl.price}</span>
                  <span className="text-[11px] text-[#BBC0C4] font-bold uppercase tracking-widest">{pl.period}</span>
                </div>
                
                <hr className="my-8 lg:my-10 border-white/5" />

                <ul className="space-y-4 lg:space-y-5 mb-10 lg:mb-12 flex-1">
                  {pl.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex gap-4 text-[12px] text-[#BBC0C4] font-medium uppercase tracking-tight items-center">
                      <Check size={16} className="text-[#00D4FF] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => onNavigate('/register')}
                  className={`w-full h-14 rounded-lg text-[13px] font-bold uppercase tracking-[0.3em] transition-all mt-auto ${
                    pl.name === 'ENTERPRISE' 
                      ? 'bg-transparent border border-white/10 hover:bg-white/5 text-[#E8EAED]' 
                      : 'bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18]'
                  }`}
                >
                  {pl.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 md:py-40 px-6 border-b border-white/5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #040B18 0%, #071326 50%, #0A1930 100%)' }}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.4em] mb-4 block">ENTERPRISE MARITIME SECURITY</span>
            <h2 className="text-4xl md:text-5xl font-manrope font-bold text-[#E8EAED] uppercase tracking-tight">TRUST. CONTROL. GOVERNANCE.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Workspace Isolation", icon: <Shield size={24} /> },
              { title: "Role-Based Permissions", icon: <Users size={24} /> },
              { title: "Audit Traceability", icon: <History size={24} /> },
              { title: "Version Control", icon: <Layers size={24} /> },
              { title: "Identity Verification", icon: <UserCheck size={24} /> },
              { title: "Data Protection", icon: <ShieldCheck size={24} /> },
              { title: "Governance Controls", icon: <Settings size={24} /> },
              { title: "Secure Document Storage", icon: <Database size={24} /> }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-[#202636] border border-white/5 rounded-xl flex flex-col items-center text-center gap-4 hover:border-[#00D4FF]/20 transition-all">
                <div className="text-[#00D4FF]">{item.icon}</div>
                <h3 className="text-[10px] font-bold text-[#E8EAED] uppercase tracking-widest">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        className="py-20 md:py-32 px-6 text-center border-t border-white/5"
        style={{ background: 'linear-gradient(135deg, #040B18 0%, #071326 50%, #0A1930 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-manrope font-extrabold tracking-tighter uppercase leading-[1.1] text-[#E8EAED]">
            Operate Maritime Agreements <br className="hidden md:block"/>With Confidence
          </h2>
          <p className="text-[#BBC0C4] max-w-xl mx-auto mt-8 md:mt-10 text-[11px] md:text-xs uppercase tracking-[0.2em] font-bold leading-relaxed">
            Replace fragmented documents, emails and spreadsheets with a structured maritime contract operating system.
          </p>
          <div className="mt-12 md:mt-16 flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
            <button
              onClick={() => onNavigate('/register')}
              className="h-14 sm:h-auto sm:px-12 sm:py-5 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] font-extrabold rounded transition-all text-[11px] sm:text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center"
            >
              Start Workspace
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="h-14 sm:h-auto sm:px-12 sm:py-5 bg-transparent hover:bg-white/5 text-[#E8EAED] font-extrabold rounded transition-all border border-white/10 text-[11px] sm:text-xs uppercase tracking-[0.3em] flex items-center justify-center"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#141924] text-[#80868B] text-[10px] py-16 md:py-20 px-6 border-t border-white/5 uppercase tracking-widest font-manrope">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 text-[#E8EAED] font-extrabold text-[12px] md:text-sm mb-6">
                <div className="w-8 h-8 rounded bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]">
                  <Anchor size={18} />
                </div>
                MARINEWORLD CONTRACT STUDIO
              </div>
              <p className="text-[#80868B] text-[10px] font-bold uppercase tracking-widest mb-4">The Operating System For Maritime Agreements</p>
              <p className="text-[#80868B] text-[9px] uppercase tracking-widest leading-relaxed">
                Structured contract operations for the global maritime industry.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-16 w-full lg:w-auto">
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">RESOURCES</h4>
                <div className="flex flex-col gap-4">
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Platform</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Security</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Documentation</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Support</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Pricing</a>
                </div>
              </div>
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">COMPANY</h4>
                <div className="flex flex-col gap-4">
                  <a href="#" className="hover:text-[#00D4FF] transition-all">About</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Network</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Governance</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Contact</a>
                </div>
              </div>
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">SUPPORT</h4>
                <div className="flex flex-col gap-4">
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Support Center</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">System Status</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Documentation</a>
                  <a href="#" className="hover:text-[#00D4FF] transition-all">Service Updates</a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p>&copy; 2026 MarineWorld Contract Studio. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-[#E8EAED] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#E8EAED] transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

