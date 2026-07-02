import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Shield, Check, Layers, FileSignature, 
  Database, UserCheck, Activity, Clock, ShieldCheck, FileText, CheckCircle,
  Handshake, PenTool, Menu, X, Users, Package, Settings, History, FileCheck, Sparkles, Cpu, Link, Globe
} from 'lucide-react';
import { Compass } from './Compass';
import { motion, AnimatePresence } from 'motion/react';
import LegalModal from './LegalModal';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<
    | 'privacy' 
    | 'terms' 
    | 'acceptable' 
    | 'ai-credits' 
    | 'product-studio' 
    | 'product-pricing' 
    | 'product-security' 
    | 'product-docs' 
    | 'company-about' 
    | 'company-contact' 
    | 'company-status' 
    | 'support-help' 
    | 'support-contact' 
    | 'support-notes' 
    | 'trust-center' 
    | null
  >(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [showStatusToast, setShowStatusToast] = useState(false);

  useEffect(() => {
    if (showStatusToast) {
      const timer = setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showStatusToast]);

  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname;
      if (path === '/docs') {
        setActiveLegalModal('product-docs');
      } else if (path === '/help') {
        setActiveLegalModal('support-help');
      } else if (path === '/trust') {
        setActiveLegalModal('trust-center');
      } else if (path === '/security') {
        setActiveLegalModal('product-security');
      } else if (path === '/ai-docs') {
        setActiveLegalModal('ai-credits');
      }
    };
    
    // Check path on mount
    handlePath();

    // Also listen to window pathname changes
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  const industryNodes = [
    { name: "Commercial Shipping", desc: "Voyage, time charter, bareboat charter, cargo transportation and freight agreements." },
    { name: "Ship Ownership & Investment", desc: "Ownership structures, vessel acquisitions, joint ventures, equity participation and maritime investment agreements." },
    { name: "Shipbuilding & New Build Programs", desc: "Shipyard construction agreements, EPC contracts, milestone schedules, technical specifications and delivery protocols." },
    { name: "Vessel Sales & Acquisitions", desc: "Memorandums of Agreement (MOA), purchase transactions, delivery procedures and title transfer documentation." },
    { name: "Yacht Sales & Brokerage", desc: "MYBA brokerage mandates, commission agreements, listing authorizations and yacht purchase transactions." },
    { name: "Yacht Management", desc: "Technical management, operational services, ISM support, crew administration and vessel management agreements." },
    { name: "Charter Operations", desc: "Private and commercial charter agreements, booking conditions, operational responsibilities and charter management." },
    { name: "Commercial Vessel Chartering", desc: "BIMCO charter parties, cargo operations, freight obligations and commercial charter management." },
    { name: "Maritime Logistics", desc: "Logistics services, multimodal transportation, cargo handling, warehousing and supply chain agreements." },
    { name: "Freight Forwarding", desc: "Bills of Lading, freight forwarding mandates, customs coordination and international transport documentation." },
    { name: "Ports & Terminal Operations", desc: "Port services, terminal operations, berth allocation, cargo handling and concession agreements." },
    { name: "Marinas & Waterfront Developments", desc: "Berthing agreements, marina operations, waterfront facilities, slip rentals and marina service contracts." },
    { name: "Offshore & Energy", desc: "Offshore vessel services, energy support contracts, subsea operations and offshore logistics agreements." },
    { name: "Marine Engineering", desc: "Engineering consultancy, technical services, design validation and engineering project agreements." },
    { name: "Naval Architecture", desc: "Vessel design, intellectual property protection, stability analysis and naval architecture consulting agreements." },
    { name: "Technical Management", desc: "Planned Maintenance Systems (PMS), Safety Management Systems (SMS), fleet technical operations and maintenance services." },
    { name: "Ship Repair, Refit & Maintenance", desc: "Dry dock projects, repair contracts, modernization programs, warranty management and subcontractor coordination." },
    { name: "Marine Equipment Manufacturing", desc: "OEM manufacturing, equipment supply, production agreements, warranties and distribution arrangements." },
    { name: "Marine Supply & Procurement", desc: "Marine procurement, vessel provisioning, catering, spare parts, consumables and purchasing agreements." },
    { name: "Classification & Marine Survey", desc: "Classification services, statutory inspections, condition surveys, certification and compliance verification." },
    { name: "Insurance & P&I", desc: "Hull & Machinery, Protection & Indemnity (P&I), marine insurance placement and claims support agreements." },
    { name: "Ship Finance & Leasing", desc: "Vessel financing, maritime mortgages, leasing arrangements, refinancing and investment security agreements." },
    { name: "Maritime Legal Services", desc: "Maritime legal advisory, arbitration support, dispute resolution and regulatory representation." },
    { name: "Customs & International Trade", desc: "Customs brokerage, international trade compliance, import/export documentation and agency services." },
    { name: "Maritime Consulting", desc: "Business advisory, operational optimization, digital transformation and strategic consulting engagements." },
    { name: "Professional Services", desc: "Corporate governance, financial advisory, auditing, payroll administration and specialist professional services." }
  ];

  const corePlatformCards = [
    { title: "Contract Studio", desc: "A unified enterprise workspace for authoring, editing, and negotiating maritime agreements.", icon: <FileText size={20} className="text-[#00D4FF]" /> },
    { title: "Interactive Clause Workspace", desc: "Interactive clause-level negotiation, revision approvals, and structured workflows.", icon: <Layers size={20} className="text-[#00D4FF]" /> },
    { title: "Professional Human Revision Workspace", desc: "Seamless integration with human legal revision processes for final verification.", icon: <UserCheck size={20} className="text-[#00D4FF]" /> },
    { title: "Contract Copilot", desc: "AI-driven contract assistant for instant draft optimization and structural analysis.", icon: <Sparkles size={20} className="text-[#00D4FF]" /> },
    { title: "AI Assistant", desc: "Intelligent query terminal for instant question answering and procedural assistance.", icon: <Cpu size={20} className="text-[#00D4FF]" /> },
    { title: "AI Legal Advisor", desc: "Context-aware review of compliance standards, liability risks, and maritime custom.", icon: <Shield size={20} className="text-[#00D4FF]" /> },
    { title: "Agreement Execution Portal", desc: "Secure, no-account-required multi-party signature and review gateway.", icon: <FileSignature size={20} className="text-[#00D4FF]" /> },
    { title: "Contract Repository", desc: "Centralized archival, categorization, and tracking of active and historical contracts.", icon: <Database size={20} className="text-[#00D4FF]" /> },
    { title: "Registry Center", desc: "Immutable ledger tracking of SHA-256 integrity, revision hashes, and validation.", icon: <ShieldCheck size={20} className="text-[#00D4FF]" /> },
    { title: "Audit Center", desc: "Complete, auditable, and court-admissible logs of all workspace operations.", icon: <History size={20} className="text-[#00D4FF]" /> },
    { title: "Version History", desc: "Infinite, immutable backup of every revision and document draft across time.", icon: <Clock size={20} className="text-[#00D4FF]" /> },
    { title: "Credit Wallet", desc: "Flexible operational credit wallet for smart AI analysis and advanced automation.", icon: <Package size={20} className="text-[#00D4FF]" /> }
  ];

  const workflowSteps = [
    { num: "01", step: "Commercial Intent", text: "Define commercial objectives, participating parties, and operational scope." },
    { num: "02", step: "Draft & Collaborate", text: "Create and co-author the initial draft with secure real-time collaboration." },
    { num: "03", step: "AI Review", text: "Execute instant AI risk-screening and compliance checks against maritime codes." },
    { num: "04", step: "Human Revision", text: "Verify and adjust legal clauses in partnership with certified human professionals." },
    { num: "05", step: "Approval", text: "Log formal administrative sign-offs and lock the agreement from unauthorized edits." },
    { num: "06", step: "Secure Deployment", text: "Provision isolated secure links and permissions for recipient review." },
    { num: "07", step: "Multi-Party Execution", text: "Authenticate signatures through the no-account-required recipient gateway." },
    { num: "08", step: "Registry Verification", text: "Anchor the executed contract metadata and SHA-256 hash onto the registry ledger." },
    { num: "09", step: "Immutable Record", text: "Lock final document parameters permanently, generating cryptographic fingerprints." },
    { num: "10", step: "Governance & Archive", text: "File within the secure enterprise repository with role-based governance access." }
  ];

  const aiFeatures = [
    { title: "Contract Copilot", desc: "Generates tailored drafts and custom clauses instantly." },
    { title: "Clause Intelligence", desc: "Identifies liability loops and structures standard BIMCO/MYBA terms." },
    { title: "Executive Summaries", desc: "Transforms complex legal documents into action-ready business briefs." },
    { title: "Risk Detection", desc: "Flags indemnification traps and unfavorable dispute resolutions." },
    { title: "Compliance Review", desc: "Validates conformity with IMO, flag state, and regional maritime regulations." },
    { title: "Jurisdiction Analysis", desc: "Checks dispute resolution terms against major global maritime hubs." },
    { title: "Redline Analysis", desc: "Compares revisions and suggests optimal trade-offs during negotiations." },
    { title: "Missing Clause Detection", desc: "Heuristically spots omitted warranties, force majeure, or liability caps." }
  ];

  const executionFeatures = [
    { title: "One-Time Secure Execution Links", desc: "Generate secure, single-use access links for designated signers." },
    { title: "No Account Required for Recipients", desc: "Signers review, reject, or execute agreements instantly without sign-up friction." },
    { title: "Review & Accept", desc: "Clean, guided interface to read sections, download backups, and sign." },
    { title: "Request Revision", desc: "Enables external parties to propose specific clause modifications directly." },
    { title: "Decline Agreement", desc: "Formal rejection flow with comments, triggering instant alerts to the workspace." },
    { title: "Live Execution Status", desc: "Real-time visual monitoring of opened, pending, and signed states." },
    { title: "Automatic Notifications", desc: "Automated instant emails informing all stakeholders of lifecycle updates." },
    { title: "Firestore Audit Trail", desc: "Immutable record of execution IPs, emails, times, and device handshakes." }
  ];

  const registryFeatures = [
    { title: "SHA-256 Document Fingerprint", desc: "Cryptographic hash generated from final PDF content to guarantee content integrity." },
    { title: "Registry Verification", desc: "Secure portal for third parties or port authorities to verify document validity." },
    { title: "Agreement ID", desc: "Globally unique tracking key bound permanently to the contract profile." },
    { title: "Revision History", desc: "Complete lineage tracking linking structural edits back to source drafts." },
    { title: "Audit Trail", desc: "Immutable logs linking administrative metadata with contract signatures." },
    { title: "QR Verification", desc: "Embedded dynamic QR codes in PDF footers for instant offline verification." },
    { title: "Execution Timeline", desc: "Chronological milestone tracking of all approvals and handshakes." }
  ];

  const plans = [
    {
      name: "Starter",
      target: "Ideal for independent consultants, surveyors and brokers.",
      priceMonthly: "USD 29",
      totalAnnual: "USD 290",
      equivalentMonthly: "USD 24.17",
      features: [
        "1 Workspace User",
        "500 AI Operational Credits / Month",
        "100 Email Notifications / Month",
        "Unlimited Contracts",
        "Unlimited PDF Generation",
        "Registry & SHA-256 Verification"
      ],
      idealFor: "Independent consultants, surveyors and maritime brokers.",
      cta: "Start Workspace"
    },
    {
      name: "Professional",
      target: "Ideal for growing maritime companies and commercial operators.",
      priceMonthly: "USD 99",
      totalAnnual: "USD 990",
      equivalentMonthly: "USD 82.50",
      features: [
        "3 Workspace Users",
        "2,500 AI Operational Credits / Month",
        "1,000 Email Notifications / Month",
        "Approval Workflows",
        "AI Risk Analysis",
        "Compliance Review",
        "Registry & SHA-256 Verification"
      ],
      idealFor: "Growing maritime companies and commercial operators.",
      cta: "Start Workspace",
      popular: true
    },
    {
      name: "Enterprise",
      target: "Ideal for enterprise organizations operating multiple teams and large contract portfolios.",
      priceMonthly: "USD 299",
      totalAnnual: "USD 2,990",
      equivalentMonthly: "USD 249.17",
      features: [
        "Unlimited Workspace Users",
        "10,000 AI Operational Credits / Month",
        "5,000 Email Notifications / Month",
        "Governance Workflows",
        "Audit Traceability",
        "Dedicated Support",
        "Custom Credit Allocations"
      ],
      idealFor: "Enterprise organizations operating multiple teams and large contract portfolios.",
      cta: "Contact Sales"
    }
  ];

  const securityFeatures = [
    { title: "Workspace Isolation", desc: "Complete isolation of tenant data through robust rulesets.", icon: <Shield size={20} /> },
    { title: "Role-Based Permissions", desc: "Enforce precise, team-wide control over viewing and signing.", icon: <Users size={20} /> },
    { title: "Audit Traceability", desc: "Court-admissible logging of all contract modifications and signatures.", icon: <History size={20} /> },
    { title: "Version Control", desc: "Immutable preservation of all historic agreement stages.", icon: <Layers size={20} /> },
    { title: "Identity Verification", desc: "Secure multi-factor and platform identity check systems.", icon: <UserCheck size={20} /> },
    { title: "Data Protection", desc: "Full Firestore rules validation preventing data exposure.", icon: <ShieldCheck size={20} /> },
    { title: "Governance Controls", desc: "Structured hierarchical approvals before contracts go live.", icon: <Settings size={20} /> },
    { title: "Secure Document Storage", desc: "Cloud-hosted enterprise document storage with full index integrity.", icon: <Database size={20} /> },
    { title: "Execution Tracking", desc: "Detailed tracking of multi-party transaction milestones.", icon: <Link size={20} /> }
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
    <div className="min-h-screen bg-[#171B26] text-[#E8EAED] font-manrope selection:bg-[#00D4FF]/30 selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {showStatusToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[200] bg-[#141924] border border-[#00D4FF]/30 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D68F] animate-pulse"></span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">ALL SYSTEMS OPERATIONAL</span>
              <span className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono">SHA-256 LEDGER SECURED • CLOUD ACTIVE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="h-16 shrink-0 border-b border-white/5 bg-[#040B18]/90 backdrop-blur-md sticky top-0 z-[100] flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-3">
          <Compass size={32} className="text-[#00D4FF] animate-spin-slow shrink-0" />
          <span className="text-[13px] md:text-[15px] font-manrope font-extrabold text-[#E8EAED] tracking-tighter uppercase whitespace-nowrap">MARINEWORLD <span className="hidden sm:inline text-[#00D4FF]">CONTRACT STUDIO</span></span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          <a href="#core" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Contract Studio</a>
          <a href="#pricing" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Pricing</a>
          <a href="#security" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Security</a>
          <a href="#wallet" className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest">Documentation</a>
          <a 
            href="#about" 
            onClick={(e) => {
              e.preventDefault();
              setActiveLegalModal('company-about');
            }}
            className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest"
          >
            About
          </a>
          <a 
            href="#contact" 
            onClick={(e) => {
              e.preventDefault();
              setActiveLegalModal('company-contact');
            }}
            className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest"
          >
            Contact
          </a>
          <a 
            href="#status-sec" 
            onClick={(e) => {
              e.preventDefault();
              setActiveLegalModal('company-status');
              setShowStatusToast(true);
            }} 
            className="text-[10px] font-bold text-[#BBC0C4] hover:text-[#00D4FF] transition-all uppercase tracking-widest flex items-center gap-1.5"
          >
            Status <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] animate-pulse"></span>
          </a>
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
                <Compass size={32} className="text-[#00D4FF] animate-spin-slow shrink-0" />
                <span className="text-[15px] font-extrabold uppercase">MARINEWORLD</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <X size={28} />
              </button>
            </div>
            
            <div className="flex flex-col gap-5 mb-12 overflow-y-auto">
              {[
                { name: 'Contract Studio', href: '#core' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'Security', href: '#security' },
                { name: 'Documentation', href: '#wallet' },
                { name: 'About', href: '#about' },
                { name: 'Contact', href: '#contact' },
                { name: 'Status', href: '#status-sec' }
              ].map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (link.name === 'Status') {
                      e.preventDefault();
                      setActiveLegalModal('company-status');
                      setShowStatusToast(true);
                    } else if (link.name === 'About') {
                      e.preventDefault();
                      setActiveLegalModal('company-about');
                    } else if (link.name === 'Contact') {
                      e.preventDefault();
                      setActiveLegalModal('company-contact');
                    }
                  }}
                  className="text-xl font-bold uppercase tracking-tight text-[#E8EAED] hover:text-[#00D4FF] flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  {link.name === 'Status' && (
                    <span className="w-2 h-2 rounded-full bg-[#00D68F] animate-pulse"></span>
                  )}
                </a>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/login');
                }}
                className="h-14 w-full border border-white/10 rounded-lg text-[16px] font-bold uppercase tracking-widest"
              >
                Log In
              </button>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/register');
                }}
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
            {/* Main Focal Point: Operating System Headline */}
            <h1 className="font-manrope font-semibold text-[32px] md:text-[44px] lg:text-[56px] text-[#E8EAED] leading-tight lg:leading-[1.15] mb-4 lg:mb-6 tracking-tight">
              The Contract Operating System for the Global Maritime Economy
            </h1>

            {/* Description */}
            <p className="font-manrope font-normal text-[14px] md:text-[15px] lg:text-[18px] text-[#BBC0C4] max-w-[650px] mx-auto lg:mx-0 leading-relaxed mb-8">
              Create, negotiate, review, execute, verify and govern commercial, technical, financial and operational agreements across shipping, shipbuilding, yachting, logistics, ports, offshore, marine finance and professional maritime services through a unified AI-powered enterprise platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start mt-8">
              <button 
                onClick={() => onNavigate('/register')}
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] font-extrabold rounded transition-all shadow-xl flex items-center justify-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.2em] active:scale-95"
              >
                Start Workspace <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-transparent hover:bg-white/5 text-[#E8EAED] font-extrabold rounded transition-all border border-white/10 text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-center active:scale-95"
              >
                Schedule Demo
              </button>
            </div>
          </div>

          {/* Decorative Icon Frame - Keeping existing beautiful visual style */}
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

            {/* Platform Operational Highlights & Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: "50+", label: "Agreement Types" },
                { value: "24+", label: "Industry Workflows" },
                { value: "AI", label: "Contract Copilot" },
                { value: "SHA-256", label: "Verified Registry" },
                { value: "Enterprise", label: "Multi-Party Execution" },
                { value: "24/7", label: "Cloud Infrastructure" }
              ].map((stat, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/[0.01] border border-white/5 rounded-xl p-3 md:p-3.5 text-center hover:border-[#00D4FF]/20 hover:bg-[#00D4FF]/5 transition-all duration-300 group"
                >
                  <div className="text-[13px] md:text-[14px] font-extrabold text-[#00D4FF] font-mono tracking-tight uppercase group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </div>
                  <div className="text-[8px] text-[#BBC0C4] uppercase font-bold tracking-wider leading-tight mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Industry Coverage Section */}
      <section id="coverage" className="bg-[#171B26] border-b border-white/5 py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-bold tracking-[0.4em] text-[#00D4FF] uppercase">GLOBAL NETWORK ENVIRONMENT</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] mt-3 uppercase tracking-tight">
              Built for the Global Maritime Economy
            </h2>
            <p className="mt-4 text-[#BBC0C4] text-[10px] md:text-xs font-mono uppercase tracking-[0.05em] leading-relaxed">
              Enterprise agreement architectures supporting the complete maritime ecosystem, from commercial shipping and shipbuilding to finance, logistics, legal services and offshore operations.
            </p>
            <div className="w-16 h-0.5 bg-[#00D4FF] mx-auto mt-6"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-3.5 xl:gap-3">
            {industryNodes.map((logo, idx) => (
              <div key={idx} className="flex flex-col justify-between p-5 bg-[#202636] border border-white/5 rounded-lg hover:border-[#00D4FF]/30 hover:bg-[#252C3E] transition-all min-h-[160px] text-left group">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Compass size={14} className="text-[#00D4FF] opacity-65 group-hover:opacity-100 transition-opacity animate-spin-slow" />
                    <h3 className="text-[11px] font-bold text-[#E8EAED] uppercase tracking-wider">{logo.name}</h3>
                  </div>
                  <p className="text-xs text-[#BBC0C4] leading-relaxed mt-2">{logo.desc}</p>
                </div>
                <div className="pt-3 border-t border-white/5 mt-4 flex justify-between items-center text-[8px] font-bold uppercase tracking-wider">
                  <span className="text-[#80868B] bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded font-mono">SPECIALIZED WORKFLOW</span>
                  <span className="text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/20 px-2 py-0.5 rounded font-mono">ACTIVE</span>
                </div>
              </div>
            ))}
          </div>

          {/* Future Scalability Entry Point */}
          <div className="mt-12 p-6 bg-[#202636]/50 border border-white/5 rounded-xl max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-left">
                <span className="text-[8px] font-bold tracking-[0.2em] text-[#00D4FF] uppercase block mb-1">FUTURE ECOSYSTEM SCALABILITY</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">MarineWorld Contract Studio Industry Gateway</h4>
                <p className="text-[11px] text-[#BBC0C4] tracking-wider font-mono leading-relaxed max-w-2xl">
                  Designed as the direct entry point to the complete industry ecosystem. Each node is engineered to dynamically bind with specialized agreement structures and compliance rules.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full md:w-auto">
                {['Agreement Types', 'Clause Libraries', 'Template Store', 'AI Recommendations', 'Studio Workflows'].map((tech, i) => (
                  <span key={i} className="text-[8.5px] font-bold uppercase tracking-wider font-mono text-[#80868B] bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded text-center">
                    + {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Section */}
      <section id="core" className="py-20 md:py-32 px-6 bg-[#171B26]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#00D4FF] uppercase">PRODUCT ARCHITECTURE</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold tracking-tight text-[#E8EAED] mt-3 uppercase">
              Everything Required to Operate Maritime Agreements
            </h2>
            <p className="mt-4 text-[#BBC0C4] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">Comprehensive, modular workspace infrastructure designed for trust</p>
            <div className="w-16 h-0.5 bg-[#00D4FF] mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {corePlatformCards.map((feat, idx) => (
              <div key={idx} className="p-8 bg-[#202636] rounded border border-white/5 hover:bg-[#2B3347] transition-all group flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="mb-6 group-hover:scale-105 transition-transform inline-block p-2 rounded bg-white/[0.02]">
                    {feat.icon}
                  </div>
                  <h3 className="text-xs font-bold text-[#E8EAED] uppercase tracking-wider mb-3">{feat.title}</h3>
                  <p className="text-xs text-[#BBC0C4] leading-relaxed mt-2">{feat.desc}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-white/5 flex justify-between text-[8px] text-[#80868B] font-mono uppercase font-bold">
                  <span>MODULE ID: 0{idx+1}</span>
                  <span className="text-[#00D4FF]">PROVISIONED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Lifecycle Section */}
      <section id="lifecycle" className="bg-[#202636] py-24 md:py-32 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#00D4FF] font-bold">OPERATIONAL PROTOCOL</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold tracking-tight text-[#E8EAED] mt-3 uppercase">
              Enterprise Agreement Lifecycle
            </h2>
            <p className="mt-4 text-[#BBC0C4] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">Integrated sequential state steps from commercial intent to compliance archives</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workflowSteps.map((ws, idx) => (
              <div key={idx} className="p-6 bg-[#171B26] border border-white/5 rounded relative group overflow-hidden flex flex-col justify-between min-h-[180px]">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 -rotate-45 translate-x-8 -translate-y-8"></div>
                <div>
                  <span className="text-2xl md:text-3xl font-manrope font-extrabold text-[#00D4FF] opacity-25 block mb-4">{ws.num}</span>
                  <h3 className="text-[11px] font-bold text-[#E8EAED] uppercase tracking-wider mb-2">{ws.step}</h3>
                </div>
                <p className="text-xs text-[#BBC0C4] leading-relaxed mt-2">{ws.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Intelligence Section */}
      <section id="ai" className="py-20 md:py-32 px-6 bg-[#171B26]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-bold tracking-[0.4em] text-[#00D4FF] uppercase">ARTIFICIAL COGNITION</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] mt-3 uppercase tracking-tight">
              AI That Supports Human Decision-Making
            </h2>
            <p className="mt-4 text-[#BBC0C4] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">Smart contract reasoning strictly managed by human administrators</p>
            <div className="w-16 h-0.5 bg-[#00D4FF] mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {aiFeatures.map((item, id) => (
              <div key={id} className="p-6 bg-[#202636] border border-white/5 rounded hover:border-[#00D4FF]/25 transition-all flex flex-col justify-between min-h-[160px]">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[#00D4FF]" />
                    <h3 className="text-[11px] font-bold text-[#E8EAED] uppercase tracking-wider">{item.title}</h3>
                  </div>
                  <p className="text-xs text-[#BBC0C4] leading-relaxed mt-2">{item.desc}</p>
                </div>
                <span className="text-[8px] text-[#80868B] font-mono mt-4">AI SERVICE EXECUTABLE</span>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-[#202636] border border-white/5 p-6 rounded-lg max-w-3xl mx-auto text-center">
            <p className="text-[10px] md:text-[11px] font-bold text-[#E8EAED] uppercase tracking-widest leading-relaxed">
              <span className="text-[#00D4FF] mr-2">NOTICE:</span>
              Operational Credits are consumed only when AI services are executed. Standard contract management never consumes Operational Credits.
            </p>
          </div>
        </div>
      </section>

      {/* Secure Agreement Execution Section */}
      <section id="execution" className="py-20 md:py-32 px-6 bg-[#202636] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-bold tracking-[0.4em] text-[#00D4FF] uppercase">TRANSACTION ENGINE</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] mt-3 uppercase tracking-tight">
              Secure Multi-Party Agreement Execution
            </h2>
            <p className="mt-4 text-[#BBC0C4] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">Frictionless external party signing and execution environment</p>
            <div className="w-16 h-0.5 bg-[#00D4FF] mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {executionFeatures.map((item, id) => (
              <div key={id} className="p-6 bg-[#171B26] border border-white/5 rounded flex flex-col justify-between min-h-[160px]">
                <div>
                  <h3 className="text-[11px] font-bold text-[#E8EAED] uppercase tracking-wider mb-2">{item.title}</h3>
                  <p className="text-xs text-[#BBC0C4] leading-relaxed mt-2">{item.desc}</p>
                </div>
                <span className="text-[8px] text-[#00D4FF] font-bold font-mono mt-4 font-bold uppercase">PORTAL FUNCTION</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registry & Verification Section */}
      <section id="registry" className="py-20 md:py-32 px-6 bg-[#171B26]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-bold tracking-[0.4em] text-[#00D4FF] uppercase">CRYPTOGRAPHIC VALIDATION</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] mt-3 uppercase tracking-tight">
              Immutable Contract Registry
            </h2>
            <p className="mt-4 text-[#BBC0C4] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">Verify SHA-256 signatures, validation hashes, and audit histories</p>
            <div className="w-16 h-0.5 bg-[#00D4FF] mx-auto mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {registryFeatures.map((item, id) => (
              <div key={id} className="p-6 bg-[#202636] border border-white/5 rounded flex flex-col justify-between min-h-[160px]">
                <div>
                  <h3 className="text-[11px] font-bold text-[#E8EAED] uppercase tracking-wider mb-2">{item.title}</h3>
                  <p className="text-xs text-[#BBC0C4] leading-relaxed mt-2">{item.desc}</p>
                </div>
                <span className="text-[8px] text-[#80868B] font-mono mt-4 uppercase font-bold">REGISTRY LEDGER</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resource Management: Credits Clarification */}
      <section id="wallet" className="py-20 md:py-24 px-6 max-w-7xl mx-auto bg-[#171B26]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.3em]">RESOURCE MANAGEMENT</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] mt-4 uppercase tracking-tighter leading-[1.1]">
              Operational Credits
            </h2>
            <p className="mt-6 text-[#BBC0C4] leading-relaxed text-[12px] md:text-sm uppercase tracking-tight font-bold max-w-xl mx-auto lg:mx-0">
              Operational Credits are consumed only by AI-powered intelligence services.
            </p>
            
            <div className="mt-8 space-y-4">
              <p className="text-[10px] font-bold text-[#80868B] uppercase tracking-widest">NEVER CONSUMED BY STANDARDIZED SERVICES:</p>
              <div className="grid grid-cols-2 gap-y-2.5 max-w-md mx-auto lg:mx-0">
                {[
                  "Contract Creation",
                  "Editing & Saving",
                  "Repository Storage",
                  "Secure Deployments",
                  "PDF Generation",
                  "Agreement Execution",
                  "Registry Audits",
                  "Version History",
                  "Audit Trail"
                ].map((item, id) => (
                  <div key={id} className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle size={12} className="text-[#00D4FF] shrink-0" />
                    <span className="text-[9px] font-bold text-[#E8EAED] uppercase tracking-wider font-mono">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#2B3347] border border-white/5 p-6 md:p-10 rounded-2xl shadow-2xl relative w-full max-w-md mx-auto">
            <div className="flex justify-between items-center pb-6 border-b border-white/5">
              <div>
                <h4 className="text-xs font-bold text-[#E8EAED] uppercase tracking-widest">OPERATIONAL WALLET</h4>
                <p className="text-[9px] text-[#BBC0C4] mt-1 uppercase tracking-widest">WORKSPACE STATE</p>
              </div>
              <span className="px-2.5 py-1 text-[8px] font-bold bg-[#00D68F]/10 text-[#00D68F] border border-[#00D68F]/20 rounded uppercase tracking-widest font-mono">ACTIVE</span>
            </div>
            
            <div className="py-8 text-center md:text-left">
              <p className="text-[10px] text-[#BBC0C4] uppercase font-bold tracking-[0.2em] mb-2">CREDITS REMAINING</p>
              <p className="text-5xl font-manrope font-extrabold text-[#00D4FF] tracking-tighter">18,500</p>
            </div>

            <div className="bg-[#171B26] p-6 rounded border border-white/5">
              <div className="flex justify-between text-[10px] mb-3 uppercase font-bold tracking-[0.2em]">
                <span className="text-[#BBC0C4]">MONTHLY ALLOCATION</span>
                <span className="text-[#E8EAED]">20,000</span>
              </div>
              <div className="w-full bg-[#202636] h-2 rounded-full overflow-hidden mb-4">
                <div className="bg-[#00D4FF] h-full shadow-[0_0_15px_rgba(0,212,255,0.5)]" style={{ width: '92.5%' }}></div>
              </div>
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest pt-3 border-t border-white/5">
                <span className="text-[#80868B]">CURRENT PLAN</span>
                <span className="text-[#00D4FF]">PROFESSIONAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section - Refined for "biraz daha uygun ölçüde" (compact/premium) */}
      <section id="pricing" className="py-20 md:py-32 px-6 bg-[#171B26] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#00D4FF] uppercase font-mono">Enterprise Pricing</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] tracking-tight mt-3">
              Enterprise Pricing
            </h2>
            <div className="mt-4 text-[#BBC0C4] text-[11px] md:text-sm font-medium space-y-1 max-w-2xl mx-auto leading-relaxed">
              <p>Choose the plan that best fits your maritime contract operations.</p>
              <p>All plans include unlimited contract lifecycle management.</p>
              <p className="text-[#00D4FF]">Operational Credits are consumed only when AI-powered services are executed.</p>
            </div>
            <div className="w-16 h-0.5 bg-[#00D4FF] mx-auto mt-6"></div>
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
              <div className="bg-[#202636] p-1 rounded-lg border border-white/5 inline-flex items-center">
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

          {/* Premium Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((pl, idx) => {
              const isPopular = pl.popular;
              const isMonthly = billingCycle === 'monthly';
              const displayPrice = isMonthly ? pl.priceMonthly : pl.totalAnnual;
              const displayPeriod = isMonthly ? '/ Month' : '/ Year';

              return (
                <div 
                  key={idx} 
                  className={`p-6 md:p-8 rounded-2xl transition-all duration-300 flex flex-col justify-between ${
                    isPopular 
                      ? 'bg-gradient-to-b from-[#1F293F] to-[#151D2C] border-2 border-[#00D4FF] shadow-[0_0_30px_rgba(0,212,255,0.15)] scale-102 relative md:-translate-y-2' 
                      : 'bg-gradient-to-b from-[#1C2233] to-[#111622] border border-[#2B354D] hover:border-[#00D4FF]/40 shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-manrope font-bold text-white tracking-wide">
                        {pl.name}
                      </h3>
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
                        equivalent to only <span className="text-[#00D4FF] font-bold">{pl.equivalentMonthly}</span>/month
                      </div>
                    )}

                    <div className="text-[11px] text-[#00D4FF] font-mono min-h-[24px] flex items-center mb-4">
                      {isMonthly ? 'Billed monthly' : `Billed ${pl.totalAnnual} / year`}
                    </div>
                    
                    <hr className="my-4 border-white/5" />

                    <div className="mb-6">
                      <p className="text-[11px] font-bold text-[#80868B] uppercase tracking-wider mb-2 font-mono">
                        Ideal for:
                      </p>
                      <p className="text-xs text-[#BBC0C4] leading-relaxed mb-4">
                        {pl.idealFor}
                      </p>
                    </div>

                    <p className="text-[11px] font-bold text-[#80868B] uppercase tracking-wider mb-3 font-mono">
                      Includes:
                    </p>
                    <ul className="space-y-2.5 mb-6">
                      {pl.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex gap-2.5 text-xs text-[#BBC0C4] items-start">
                          <Check size={13} className="text-[#00D4FF] shrink-0 mt-0.5" />
                          <span className="leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button 
                      onClick={() => onNavigate('/register')}
                      className={`w-full h-11 rounded-lg text-xs font-bold transition-all duration-200 ${
                        isPopular
                          ? 'bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] shadow-[0_4px_12px_rgba(0,212,255,0.2)]'
                          : 'bg-[#202636] hover:bg-[#2B354D] text-white border border-[#2B354D]'
                      }`}
                    >
                      {pl.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Included with every plan strip */}
          <div className="mt-16 pt-12 border-t border-white/5 max-w-5xl mx-auto">
            <h3 className="text-center text-sm font-manrope font-semibold text-white tracking-wide mb-8">
              Included with every plan
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                "Unlimited Contract Creation",
                "Unlimited Agreement Deployment",
                "Unlimited PDF Generation",
                "Unlimited Version History",
                "Contract Repository",
                "Secure Registry",
                "SHA-256 Document Fingerprints",
                "Firestore Synchronization",
                "Multi-Party Execution",
                "Audit Trail"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#202636]/40 border border-white/5 p-3 rounded-lg hover:border-[#00D4FF]/20 transition-all">
                  <Check size={12} className="text-[#00D4FF] shrink-0" />
                  <span className="text-[10px] text-[#BBC0C4] leading-tight font-mono">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Credits Info Card */}
          <div className="mt-12 bg-gradient-to-r from-[#1C2233] to-[#111622] border border-[#2B354D] p-6 md:p-8 rounded-2xl max-w-5xl mx-auto flex flex-col md:flex-row gap-8 justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 text-[9px] font-bold bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 rounded font-mono">
                  Included with Every Subscription
                </span>
              </div>
              <h3 className="text-lg font-manrope font-bold text-white mb-2">Operational Credits</h3>
              <p className="text-xs text-[#BBC0C4] leading-relaxed max-w-xl">
                Operational Credits are consumed only by AI-powered drafting, review and contract intelligence services.
              </p>
            </div>
            <div className="flex-1 w-full">
              <h4 className="text-[10px] font-bold text-[#80868B] uppercase tracking-wider mb-3 font-mono">
                The following never consume Operational Credits:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Contract Creation",
                  "Editing",
                  "Repository",
                  "PDF Generation",
                  "PDF Download",
                  "Agreement Deployment",
                  "Review & Accept",
                  "Request Revision",
                  "Decline Agreement",
                  "Registry",
                  "SHA-256 Generation",
                  "Version History",
                  "Audit Trail"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D68F] shrink-0" />
                    <span className="text-[10px] text-[#BBC0C4] font-mono">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section id="security" className="py-20 md:py-28 px-6 border-b border-white/5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #040B18 0%, #071326 50%, #0A1930 100%)' }}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.4em] mb-3 block">ENTERPRISE MARITIME SECURITY</span>
            <h2 className="text-3xl md:text-5xl font-manrope font-bold text-[#E8EAED] uppercase tracking-tight">TRUST. CONTROL. GOVERNANCE.</h2>
            <p className="mt-4 text-[#BBC0C4] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">Validated structural isolation and immutable document safeguards</p>
            <div className="w-16 h-0.5 bg-[#00D4FF] mx-auto mt-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {securityFeatures.map((item, idx) => (
              <div key={idx} className="p-6 bg-[#202636] border border-white/5 rounded flex items-center gap-4 hover:border-[#00D4FF]/25 transition-all">
                <div className="text-[#00D4FF] shrink-0">{item.icon}</div>
                <div className="text-left">
                  <h3 className="text-[11px] font-bold text-[#E8EAED] uppercase tracking-wider">{item.title}</h3>
                  <p className="text-xs text-[#BBC0C4] leading-relaxed mt-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Availability (Premium Thin Band) */}
      <section className="py-12 px-6 bg-gradient-to-r from-[#0F1420] via-[#1A2234] to-[#0F1420] border-y border-white/5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[100px] bg-[#00D4FF]/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Title and core message */}
            <div className="text-center lg:text-left">
              <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.4em] block mb-2">
                AVAILABLE ACROSS PLATFORMS
              </span>
              <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]"></div>
                  <span className="text-xs font-semibold text-white">Create on Desktop.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]"></div>
                  <span className="text-xs font-semibold text-white">Collaborate on Tablet.</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]"></div>
                  <span className="text-xs font-semibold text-white">Review and Execute Anywhere.</span>
                </div>
              </div>
            </div>

            {/* Platform list with badges */}
            <div className="flex flex-col items-center lg:items-end gap-3 shrink-0">
              <div className="flex flex-wrap items-center justify-center gap-2 bg-[#171B26]/60 border border-white/5 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-[#80868B] uppercase tracking-wider mr-2">Available on:</span>
                {["Web", "Windows", "macOS", "Tablet"].map((platform, i) => (
                  <span key={i} className="text-[10px] font-semibold text-[#E8EAED] bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded font-mono">
                    {platform}
                  </span>
                ))}
                {["App Store", "Google Play"].map((platform, i) => (
                  <div key={i} className="relative group">
                    <span className="text-[10px] font-semibold text-[#80868B] bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded font-mono flex items-center gap-1.5">
                      {platform}
                      <span className="w-1 h-1 rounded-full bg-amber-500/80"></span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[9px] font-semibold font-mono tracking-wider text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-full uppercase">
                <span>App Store & Google Play</span>
                <span>•</span>
                <span>Coming Soon</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section 
        className="py-20 md:py-32 px-6 text-center border-t border-white/5"
        style={{ background: 'linear-gradient(135deg, #040B18 0%, #071326 50%, #0A1930 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-manrope font-extrabold tracking-tighter uppercase leading-[1.15] text-[#E8EAED]">
            Operate Maritime Agreements <br className="hidden md:block"/>With Enterprise Confidence
          </h2>
          <p className="text-[#BBC0C4] max-w-xl mx-auto mt-8 text-[11px] md:text-xs uppercase tracking-[0.2em] font-bold leading-relaxed">
            Replace fragmented documents, spreadsheets and email chains with a unified Contract Operating System designed for the global maritime industry.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => onNavigate('/register')}
              className="h-12 sm:px-10 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] font-extrabold rounded transition-all text-[11px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center"
            >
              Start Workspace
            </button>
            <button
              onClick={() => onNavigate('/login')}
              className="h-12 sm:px-10 bg-transparent hover:bg-white/5 text-[#E8EAED] font-extrabold rounded transition-all border border-white/10 text-[11px] uppercase tracking-[0.3em] flex items-center justify-center"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer id="footer" className="bg-[#141924] text-[#80868B] text-[10px] py-16 md:py-20 px-6 border-t border-white/5 uppercase tracking-widest font-manrope">
        <div className="max-w-7xl mx-auto">
          {/* Trust Band */}
          <div className="border-b border-white/5 pb-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.3em]">Enterprise Contract Operating System</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[#80868B] text-[9px] uppercase tracking-widest font-mono">
              <span>AI-Powered</span>
              <span className="text-white/10">•</span>
              <span>Secure Registry</span>
              <span className="text-white/10">•</span>
              <span>SHA-256 Verified</span>
              <span className="text-white/10">•</span>
              <span>Multi-Party Execution</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
            <div className="max-w-md">
              <div className="flex items-center gap-3 text-[#E8EAED] font-extrabold text-[12px] md:text-sm mb-6">
                <Compass size={32} className="text-[#00D4FF] animate-spin-slow shrink-0" />
                MARINEWORLD CONTRACT STUDIO
              </div>
              <p className="text-[#80868B] text-[10px] font-bold uppercase tracking-widest mb-4">Enterprise Contract Operating System</p>
              <p className="text-[#80868B] text-[9.5px] uppercase tracking-widest leading-relaxed font-mono">
                Providing high-performance tools for digital contract creation, operational workflow execution, and compliance assurance.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 w-full lg:flex-1 lg:max-w-5xl">
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">PRODUCTS</h4>
                <div className="flex flex-col gap-4 items-start">
                  <button onClick={() => setActiveLegalModal('product-studio')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Contract Studio
                  </button>
                  <button onClick={() => setActiveLegalModal('product-pricing')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Pricing
                  </button>
                  <button onClick={() => setActiveLegalModal('product-security')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Security
                  </button>
                  <button onClick={() => setActiveLegalModal('product-docs')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Documentation
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">COMPANY</h4>
                <div className="flex flex-col gap-4 items-start">
                  <button onClick={() => setActiveLegalModal('company-about')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> About
                  </button>
                  <button onClick={() => setActiveLegalModal('company-contact')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Contact
                  </button>
                  <button onClick={() => setActiveLegalModal('company-status')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Status
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">SUPPORT</h4>
                <div className="flex flex-col gap-4 items-start">
                  <button onClick={() => setActiveLegalModal('support-help')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Help Center
                  </button>
                  <button onClick={() => setActiveLegalModal('support-contact')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Contact Support
                  </button>
                  <button onClick={() => setActiveLegalModal('support-notes')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Release Notes
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">TRUST</h4>
                <div className="flex flex-col gap-4 items-start">
                  <button onClick={() => setActiveLegalModal('trust-center')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Trust Center
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-[#E8EAED] font-bold mb-6">LEGAL</h4>
                <div className="flex flex-col gap-4 items-start">
                  <button onClick={() => setActiveLegalModal('privacy')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Privacy Policy
                  </button>
                  <button onClick={() => setActiveLegalModal('terms')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Terms of Service
                  </button>
                  <button onClick={() => setActiveLegalModal('acceptable')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> Acceptable Use Policy
                  </button>
                  <button onClick={() => setActiveLegalModal('ai-credits')} className="hover:text-[#00D4FF] transition-all bg-transparent border-none cursor-pointer p-0 font-manrope text-left uppercase text-[#80868B] flex items-center gap-2">
                    <span className="text-[#00D4FF]">•</span> AI Services Policy
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col items-start gap-4 text-[9px] text-[#80868B]/70 leading-relaxed max-w-5xl normal-case tracking-normal font-sans">
            <p className="uppercase tracking-widest font-mono text-[9px] text-[#80868B] font-bold">&copy; 2026 ARGENTO MARITIME WORLDWIDE LLC. All Rights Reserved.</p>
            <p className="mt-1">MarineWorld Contract Studio is an enterprise Contract Operating System providing secure agreement authoring, collaboration, execution, registry and audit infrastructure.</p>
            <p>ARGENTO MARITIME WORLDWIDE LLC is not a party to agreements created or executed through the Platform.</p>
          </div>
        </div>
      </footer>

      <LegalModal 
        type={activeLegalModal} 
        onClose={() => {
          setActiveLegalModal(null);
          if (['/docs', '/help', '/trust', '/security', '/ai-docs'].includes(window.location.pathname)) {
            onNavigate('/');
          }
        }} 
      />
    </div>
  );
}
