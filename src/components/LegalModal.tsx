import React from 'react';
import { 
  X, ShieldCheck, FileText, CheckCircle2, Building, Scale, ArrowRight, Sparkles,
  Layers, Anchor, Activity, HelpCircle, History, Landmark, ShieldAlert, BadgeInfo
} from 'lucide-react';

interface LegalModalProps {
  type: 
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
    | null;
  onClose: () => void;
}

const PrivacyPolicy = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope">
    {/* Header Info */}
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <ShieldCheck size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Corporate Information Charter</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">MARINEWORLD CONTRACT STUDIO Privacy Policy</p>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-[10px] font-mono text-[#80868B]">
        <span>EFFECTIVE DATE: JUNE 27, 2026</span>
        <span>VERSION 4.2.1</span>
      </div>
    </div>

    {/* Intro text */}
    <p className="text-sm font-medium text-[#E8EAED] leading-relaxed">
      This Privacy Policy explains how MARINEWORLD Contract Studio ("Platform") collects, processes, stores and protects information when you access or use the Platform.
    </p>
    <p>
      MARINEWORLD Contract Studio is owned and operated by <strong className="text-white">ARGENTO MARITIME WORLDWIDE LLC</strong>, a limited liability company organized under the laws of the State of Wyoming, United States ("Company", "we", "our" or "us").
    </p>
    <p className="border-l-2 border-[#00D4FF]/30 pl-3 italic text-[#80868B]">
      By using the Platform, you acknowledge that you have read and understood this Privacy Policy.
    </p>

    <div className="space-y-6 pt-2">
      {/* SECTION 1 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">1.</span> Platform Scope
        </h3>
        <p className="mb-3">
          MARINEWORLD Contract Studio is an enterprise Software-as-a-Service (SaaS) platform providing secure contract authoring, collaboration, agreement execution, document management, registry services, audit records and AI-assisted contract intelligence.
        </p>
        <p className="text-[#80868B]">
          The Platform provides technology infrastructure only. The Company does not participate in contractual negotiations or commercial relationships between users.
        </p>
      </div>

      {/* SECTION 2 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl space-y-4">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">2.</span> Information We Collect
        </h3>
        <p className="text-[#80868B]">
          Depending on how the Platform is used, we may collect the following structured information vectors:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Business Identity</span>
            <ul className="space-y-1.5 text-[11px] text-[#BBC0C4]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Full Legal Name
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Company Name
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Business Email
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Workspace Information
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Organization Details
              </li>
            </ul>
          </div>

          <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Workspace Information</span>
            <ul className="space-y-1.5 text-[11px] text-[#BBC0C4]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Workspace ID
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> User Roles
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Permissions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Workspace Settings
              </li>
            </ul>
          </div>

          <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Agreement Information</span>
            <ul className="space-y-1.5 text-[11px] text-[#BBC0C4]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Agreement Metadata
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Clause Structures
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Revision History
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Version Information
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Approval & Execution Status
              </li>
            </ul>
          </div>

          <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Uploaded Content</span>
            <ul className="space-y-1.5 text-[11px] text-[#BBC0C4]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Contracts & Annexes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Supporting Documents
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Images & PDFs
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Attachments
              </li>
            </ul>
          </div>

          <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Registry Information</span>
            <ul className="space-y-1.5 text-[11px] text-[#BBC0C4]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Agreement ID & Registry ID
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> SHA-256 Document Fingerprint
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Verification Records
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Audit References
              </li>
            </ul>
          </div>

          <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
            <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Technical & Billing Info</span>
            <ul className="space-y-1.5 text-[11px] text-[#BBC0C4]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Device & OS Logs
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> IP Address & Auth Events
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Subscription Plan Level
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#80868B]"></span> Credit Balances
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-3 text-[#80868B] bg-white/[0.02] border border-white/5 px-4 py-3 rounded-lg">
          Payment card information is processed only by authorized third-party payment providers and is never stored by the Platform.
        </p>
      </div>

      {/* SECTION 3 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">3.</span> How Information Is Used
        </h3>
        <p className="mb-3">
          Information is processed solely for legitimate business purposes, including:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-2 text-[#BBC0C4]">
          {[
            "Operating and maintaining the Platform",
            "Authenticating authorized workspace users",
            "Managing custom enterprise workspaces",
            "Creating and drafting agreements",
            "Executing digital multi-party agreements",
            "Maintaining active contract repositories",
            "Generating verified secure PDF documents",
            "Operating the immutable Contract Registry",
            "Verifying document revision integrity",
            "Managing Operational Credits inside your wallet",
            "Providing intelligent AI-powered services",
            "Maintaining secure audit records for compliance",
            "Improving technical platform security",
            "Customer support & operations",
            "Preventing platform abuse & fraud",
            "Compliance with applicable laws"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <CheckCircle2 size={12} className="text-[#00D4FF] mt-0.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">4.</span> AI Services
        </h3>
        <p className="mb-2">
          When users utilize AI-powered features, including Contract Copilot, AI Assistant or AI Advisor, selected contract content may be processed for the purpose of generating requested outputs.
        </p>
        <p className="mb-2">
          AI services operate only upon explicit user request. The Company does not claim ownership of AI-generated content.
        </p>
        <p className="text-[#80868B] italic">
          Users remain solely responsible for reviewing and approving all AI-generated material before use.
        </p>
      </div>

      {/* SECTION 5 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">5.</span> Customer Data Ownership
        </h3>
        <p className="mb-2">
          Customers retain full ownership of all:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["Contracts", "Business Information", "Uploaded Documents", "Intellectual Property", "Agreement Templates", "Attachments", "Generated Content"].map((item, i) => (
            <span key={i} className="text-[10px] bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded font-mono text-[#E8EAED]">
              {item}
            </span>
          ))}
        </div>
        <p className="text-[#80868B]">
          The Company acquires no ownership rights over customer data.
        </p>
      </div>

      {/* SECTION 6 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">6.</span> Platform Neutrality
        </h3>
        <p className="mb-3">
          MARINEWORLD Contract Studio operates solely as a technology platform. The Company:
        </p>
        <div className="space-y-1.5 pl-3 mb-3 text-[11px] text-[#BBC0C4]">
          <p>• is not a party to agreements;</p>
          <p>• does not negotiate contracts;</p>
          <p>• does not validate legal terms;</p>
          <p>• does not approve commercial arrangements;</p>
          <p>• does not guarantee enforceability;</p>
          <p>• does not supervise contractual performance.</p>
        </div>
        <p className="text-[#80868B]">
          All contractual obligations exist exclusively between the respective parties.
        </p>
      </div>

      {/* SECTION 7 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">7.</span> Agreement Registry
        </h3>
        <p className="mb-2">
          The Platform may generate Agreement IDs, Registry Records, Revision Records, SHA-256 Document Fingerprints, Verification Records, and Audit Events.
        </p>
        <p className="text-[#80868B]">
          These records exist solely for identification, integrity verification and document management purposes. Registry records do not constitute governmental registration or legal certification.
        </p>
      </div>

      {/* SECTION 8 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">8.</span> Electronic Records
        </h3>
        <p className="mb-2">
          Electronic records generated by the Platform may include timestamps, revision history, execution events, audit logs, deployment history, and document verification information.
        </p>
        <p className="text-[#80868B]">
          Electronic records are maintained using secure infrastructure designed to preserve data integrity and traceability.
        </p>
      </div>

      {/* SECTION 9 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">9.</span> Security
        </h3>
        <p className="mb-3">
          The Platform employs commercially reasonable administrative, organizational and technical safeguards, including:
        </p>
        <div className="flex flex-wrap gap-2 text-[#E8EAED] font-mono text-[10px]">
          {[
            "encrypted communications",
            "secure authentication",
            "enterprise workspace isolation",
            "role-based permissions",
            "Firestore security controls",
            "audit logging",
            "cryptographic document fingerprints",
            "secure cloud infrastructure"
          ].map((item, idx) => (
            <span key={idx} className="px-2 py-1 rounded bg-[#1C2233] border border-white/5">
              {item}
            </span>
          ))}
        </div>
        <p className="text-[#80868B] text-[11px] mt-3">
          No internet-connected system can be guaranteed to be completely secure.
        </p>
      </div>

      {/* SECTION 10 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">10.</span> Third-Party Services
        </h3>
        <p className="mb-2">
          The Platform may integrate with trusted third-party providers for services including authentication, payment processing, cloud hosting, email delivery, analytics, AI processing, and communication services.
        </p>
        <p className="text-[#80868B]">
          Each provider processes information in accordance with its own privacy practices.
        </p>
      </div>

      {/* SECTION 11 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">11.</span> International Processing
        </h3>
        <p className="text-[#BBC0C4]">
          Information may be processed or stored in multiple jurisdictions depending on infrastructure providers and customer configuration. Appropriate safeguards are implemented where required.
        </p>
      </div>

      {/* SECTION 12 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">12.</span> Data Retention
        </h3>
        <p className="mb-2">
          Information is retained only for as long as reasonably necessary to operate the Platform, maintain agreement history, preserve audit records, satisfy contractual obligations, and comply with legal requirements.
        </p>
        <p className="text-[#80868B]">
          Customers may request deletion of eligible information, subject to legal or contractual retention requirements.
        </p>
      </div>

      {/* SECTION 13 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">13.</span> User Rights
        </h3>
        <p className="text-[#BBC0C4]">
          Where applicable under law, users may request access to personal information, correction of inaccurate information, deletion of eligible information, restriction of processing, and data portability. Requests may be subject to identity verification.
        </p>
      </div>

      {/* SECTION 14 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">14.</span> Children's Privacy
        </h3>
        <p className="text-[#BBC0C4]">
          The Platform is intended exclusively for business users and is not directed to individuals under the age of 18.
        </p>
      </div>

      {/* SECTION 15 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">15.</span> Policy Updates
        </h3>
        <p className="text-[#BBC0C4]">
          This Privacy Policy may be updated periodically. The latest version will always be published through the Platform. Continued use of the Platform constitutes acceptance of the revised Privacy Policy.
        </p>
      </div>

      {/* SECTION 16 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">16.</span> Contact
        </h3>
        <p className="text-[#BBC0C4]">
          Questions regarding this Privacy Policy may be directed through the official support channels available within MARINEWORLD Contract Studio.
        </p>
      </div>

      {/* SECTION 17 */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">17.</span> Legal Notice
        </h3>
        <p className="text-[#BBC0C4]">
          This Privacy Policy governs the processing of information by the Platform only. It does not govern contractual relationships established between users through agreements created or executed using the Platform.
        </p>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      © 2026 ARGENTO MARITIME WORLDWIDE LLC. All Rights Reserved.
    </p>
  </div>
);

const TermsOfService = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope">
    {/* Header Info */}
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <Scale size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Operational Agreement</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">MARINEWORLD CONTRACT STUDIO Terms of Service</p>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-[10px] font-mono text-[#80868B]">
        <span>EFFECTIVE DATE: JUNE 27, 2026</span>
        <span>VERSION 4.2.1</span>
      </div>
    </div>

    <p className="text-sm font-medium text-[#E8EAED] leading-relaxed">
      These Terms of Service ("Terms") govern access to and use of MARINEWORLD Contract Studio ("Platform"), owned and operated by <strong className="text-white font-semibold">ARGENTO MARITIME WORLDWIDE LLC</strong>, a Wyoming limited liability company ("Company", "we", "our", or "us").
    </p>
    <p className="border-l-2 border-[#00D4FF]/30 pl-3 italic text-[#80868B]">
      By accessing or using the Platform, you agree to be bound by these Terms.
    </p>

    <div className="space-y-6 pt-2">
      {/* 1. Platform Overview */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">1.</span> Platform Overview
        </h3>
        <p className="mb-2">
          MARINEWORLD Contract Studio is an enterprise Software-as-a-Service (SaaS) platform designed for creating, negotiating, reviewing, executing, verifying and managing commercial agreements across the global maritime economy.
        </p>
        <p className="text-[#80868B]">
          The Platform provides technology infrastructure only. The Company does not provide legal representation or participate in agreements created by users.
        </p>
      </div>

      {/* 2. Platform Services */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">2.</span> Platform Services
        </h3>
        <p className="mb-3 text-[#80868B]">
          The Platform may include the following technical modules and services:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            "Contract Studio", "Interactive Clause Workspace", "Contract Copilot", "AI Assistant", 
            "AI Legal Advisor", "Agreement Repository", "Agreement Registry", "SHA-256 Verification", 
            "Multi-Party Execution Portal", "Version History", "Audit Trail", "Operational Credit System", 
            "Enterprise Workspace Management"
          ].map((srv, idx) => (
            <span key={idx} className="text-[10px] bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded font-mono text-[#E8EAED]">
              {srv}
            </span>
          ))}
        </div>
        <p className="text-[#80868B] text-[11px] italic">
          Additional services may be introduced without affecting these Terms.
        </p>
      </div>

      {/* 3. Enterprise Workspace */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">3.</span> Enterprise Workspace
        </h3>
        <p className="mb-3">
          Every customer operates within an isolated enterprise workspace. Each workspace maintains its own:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {["agreements", "users", "permissions", "templates", "repositories", "registry records", "audit history", "Operational Credit balance"].map((item, idx) => (
            <div key={idx} className="bg-[#171B26] border border-white/5 p-2 rounded text-center text-[10px] font-mono text-[#00D4FF]">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Customers remain solely responsible for managing workspace access.
        </p>
      </div>

      {/* 4. Customer Responsibilities */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">4.</span> Customer Responsibilities
        </h3>
        <p className="mb-3">
          Customers are solely responsible for:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "preparing agreements",
            "reviewing contractual language",
            "verifying legal accuracy",
            "obtaining independent legal advice",
            "approving AI-generated content",
            "executing agreements",
            "fulfilling contractual obligations",
            "complying with applicable laws"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] mt-1.5 shrink-0"></div>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          The Platform does not replace professional legal counsel.
        </p>
      </div>

      {/* 5. AI Services */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">5.</span> AI Services
        </h3>
        <p className="mb-3">
          AI-powered services are provided to assist users in preparing and reviewing agreements. Examples include:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["Contract Copilot", "AI Assistant", "AI Legal Advisor", "Clause Drafting", "Risk Review", "Compliance Review", "Contract Intelligence"].map((aiSrv, idx) => (
            <span key={idx} className="text-[10px] bg-cyan-500/[0.03] border border-cyan-500/10 px-2.5 py-1 rounded font-mono text-[#00D4FF]">
              {aiSrv}
            </span>
          ))}
        </div>
        <p className="mb-2">
          AI-generated content is provided for assistance only. Users must independently review all generated content before execution.
        </p>
        <p className="text-[#80868B]">
          The Company makes no warranty regarding legal sufficiency or enforceability.
        </p>
      </div>

      {/* 6. Operational Credits */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">6.</span> Operational Credits
        </h3>
        <p className="mb-3">
          Operational Credits are consumed only when eligible AI-powered services successfully execute.
        </p>
        <div className="bg-[#171B26] border border-white/5 rounded-lg p-4 mb-3">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-2 font-mono">Operational Credits are NEVER consumed for:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[10px] text-[#BBC0C4] font-mono">
            {[
              "Contract Creation", "Contract Editing", "Draft Saving", "Repository Management", 
              "Agreement Preview", "PDF Preview", "PDF Download", "Agreement Deployment", 
              "Review & Accept", "Request Revision", "Decline Agreement", "Version History", 
              "Registry Records", "SHA-256 Generation", "Audit Trail", "Firestore Synchronization", 
              "Notifications"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mb-2">
          Unused Operational Credits expire according to the applicable subscription plan.
        </p>
        <p className="text-[#80868B]">
          Purchased Top-Up Credit Packs remain subject to the applicable subscription terms.
        </p>
      </div>

      {/* 7. Agreement Execution */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">7.</span> Agreement Execution
        </h3>
        <p className="mb-3">
          The Platform enables secure electronic agreement execution through the Agreement Execution Portal. Recipients may:
        </p>
        <div className="flex gap-2 mb-3">
          {["Review & Accept", "Request Revision", "Decline Agreement"].map((action, idx) => (
            <span key={idx} className="text-[10px] bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded font-mono text-white">
              {action}
            </span>
          ))}
        </div>
        <p className="mb-2">
          Recipients are not required to create a MarineWorld account to sign or review.
        </p>
        <p className="text-[#80868B]">
          Execution links are secured using unique cryptographic execution tokens.
        </p>
      </div>

      {/* 8. Electronic Records */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">8.</span> Electronic Records
        </h3>
        <p className="mb-3">
          The Platform may generate dynamic electronic reference records, including:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["Agreement IDs", "Registry IDs", "Revision Numbers", "Execution Records", "SHA-256 Fingerprints", "Audit Events", "Verification Records"].map((rec, idx) => (
            <span key={idx} className="text-[10px] bg-[#171B26] border border-white/5 px-2 py-1 rounded font-mono text-[#00D4FF]">
              {rec}
            </span>
          ))}
        </div>
        <p className="mb-2">
          These records exist solely to support document integrity, authenticity, and operational traceability.
        </p>
        <p className="text-[#80868B]">
          They do not constitute formal governmental registration, judicial registry, or official legal certification.
        </p>
      </div>

      {/* 9. Platform Neutrality */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">9.</span> Platform Neutrality
        </h3>
        <p className="mb-3">
          The Company operates solely as a technology provider. The Company is not:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[11px] text-center font-manrope">
          {["a contracting party", "a law firm", "a legal advisor", "an escrow provider", "a broker", "a notary", "an arbitrator", "a mediator"].map((item, idx) => (
            <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/5 text-white capitalize font-medium">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          The Company neither negotiates nor approves commercial agreements between users.
        </p>
      </div>

      {/* 10. Customer Content */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">10.</span> Customer Content
        </h3>
        <p className="mb-3">
          Customers retain full ownership, title, and intellectual property rights over all:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["contracts", "templates", "clauses", "uploaded documents", "attachments", "business information", "intellectual property"].map((item, idx) => (
            <span key={idx} className="text-[10px] bg-white/[0.04] border border-white/5 px-2.5 py-1 rounded font-mono text-[#E8EAED]">
              {item}
            </span>
          ))}
        </div>
        <p className="text-[#80868B]">
          The Company acquires no ownership rights over customer-created content.
        </p>
      </div>

      {/* 11. Intellectual Property */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">11.</span> Intellectual Property
        </h3>
        <p className="mb-2">
          All software, interfaces, workflows, branding, documentation, source code, designs, AI workflows and Platform technology remain the exclusive intellectual property of <strong className="text-white font-semibold">ARGENTO MARITIME WORLDWIDE LLC</strong>.
        </p>
        <p className="text-[#80868B]">
          No license is granted to any user except as expressly provided under active subscription terms.
        </p>
      </div>

      {/* 12. Subscription Services */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">12.</span> Subscription Services
        </h3>
        <p className="mb-3">
          Access to certain Platform features requires an active enterprise subscription. Subscription plans include:
        </p>
        <div className="grid grid-cols-3 gap-3 mb-3 text-center">
          {["Starter", "Professional", "Enterprise"].map((plan, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-[#171B26] border border-white/5">
              <span className="text-xs font-bold text-white uppercase block">{plan}</span>
            </div>
          ))}
        </div>
        <p className="mb-2">
          Subscription fees are payable in advance on a recurring billing cycle.
        </p>
        <p className="text-[#80868B]">
          Unless required by applicable law, subscription fees are non-refundable.
        </p>
      </div>

      {/* 13. Availability */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">13.</span> Availability
        </h3>
        <p className="mb-3">
          The Company uses commercially reasonable efforts to maintain Platform availability. Temporary interruptions may occur due to:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["maintenance", "upgrades", "infrastructure failures", "security events", "third-party service interruptions"].map((item, idx) => (
            <span key={idx} className="text-[10px] bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded font-mono text-[#80868B]">
              {item}
            </span>
          ))}
        </div>
        <p className="text-[#80868B]">
          Continuous uninterrupted availability is not guaranteed.
        </p>
      </div>

      {/* 14. Third-Party Services */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">14.</span> Third-Party Services
        </h3>
        <p className="mb-2">
          The Platform may integrate with third-party providers including authentication, cloud hosting, payment processing, AI processing and communication services.
        </p>
        <p className="text-[#80868B]">
          Use of those external services is governed exclusively by their respective terms.
        </p>
      </div>

      {/* 15. Acceptable Use */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">15.</span> Acceptable Use
        </h3>
        <p className="mb-3">
          Users shall not:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "upload unlawful or violating content",
            "infringe intellectual property rights",
            "misuse or stress-test AI services",
            "attempt unauthorized access to workspaces",
            "interfere with Platform operations",
            "distribute malware or harmful scripts",
            "conduct fraudulent commercial activities",
            "violate applicable global trade sanctions"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-[#00D4FF] mt-1">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Violation may result in immediate suspension or termination of workspace access.
        </p>
      </div>

      {/* 16. Disclaimer */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">16.</span> Disclaimer
        </h3>
        <p className="mb-2 text-[#E8EAED] font-semibold">
          The Platform is provided "AS IS" and "AS AVAILABLE."
        </p>
        <p className="text-[#80868B]">
          To the fullest extent permitted by law, the Company disclaims all warranties, whether express, implied, or statutory, including warranties of merchantability or fitness for a particular purpose.
        </p>
      </div>

      {/* 17. Limitation of Liability */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">17.</span> Limitation of Liability
        </h3>
        <p className="mb-3">
          To the maximum extent permitted by applicable law, the Company shall not be liable for:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-3 text-[#BBC0C4]">
          {[
            "contract validity & enforceability",
            "commercial or charter party performance",
            "payment or financial transactions",
            "vessel delivery & freight issues",
            "indirect or consequential damages",
            "business interruption or cargo loss",
            "loss of data, profit, or goodwill",
            "regulatory actions or disputes"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 shrink-0"></div>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          The Company's maximum aggregate liability shall not exceed the total subscription fees paid by the customer during the twelve (12) months preceding the event giving rise to the claim.
        </p>
      </div>

      {/* 18. Governing Law */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">18.</span> Governing Law
        </h3>
        <p className="mb-2">
          These Terms are governed exclusively by the laws of the <strong className="text-white">State of Wyoming, United States</strong>, excluding conflict of law principles.
        </p>
        <p className="mb-2">
          Any dispute relating solely to these Terms or the Platform shall be subject to the exclusive jurisdiction of the state or federal courts located within the State of Wyoming.
        </p>
        <p className="text-[#80868B] italic">
          This provision does not affect the governing law or dispute resolution mechanism expressly agreed between parties within individual agreements created using the Platform.
        </p>
      </div>

      {/* 19. Amendments */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">19.</span> Amendments
        </h3>
        <p className="mb-2">
          The Company may update these Terms from time to time. The latest version will always be published through the Platform.
        </p>
        <p className="text-[#80868B]">
          Continued use of the platform after updates constitutes acceptance of the updated Terms.
        </p>
      </div>

      {/* 20. Contact */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">20.</span> Contact
        </h3>
        <p className="text-[#BBC0C4]">
          Questions regarding these Terms may be submitted through the official support channels available within MARINEWORLD Contract Studio.
        </p>
      </div>

      {/* 21. Final Notice */}
      <div className="p-5 bg-gradient-to-r from-cyan-500/5 to-transparent border border-cyan-500/10 rounded-xl">
        <h3 className="text-sm font-extrabold text-[#00D4FF] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">21.</span> Final Notice
        </h3>
        <p className="mb-2 text-[#E8EAED]">
          MARINEWORLD Contract Studio is an enterprise Contract Operating System providing secure contract authoring, collaboration, execution, registry and audit infrastructure.
        </p>
        <p className="text-[#80868B]">
          The Platform facilitates commercial workflows but does not become a party to, validate or guarantee agreements created or executed by its users.
        </p>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      © 2026 ARGENTO MARITIME WORLDWIDE LLC. All Rights Reserved.
    </p>
  </div>
);

const AcceptableUsePolicy = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope">
    {/* Header Info */}
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <CheckCircle2 size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Compliance & Safety</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">MARINEWORLD CONTRACT STUDIO Acceptable Use Policy</p>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-[10px] font-mono text-[#80868B]">
        <span>EFFECTIVE DATE: JUNE 27, 2026</span>
        <span>VERSION 4.2.1</span>
      </div>
    </div>

    <p className="text-sm font-medium text-[#E8EAED] leading-relaxed">
      This Acceptable Use Policy ("Policy") governs the acceptable use of MARINEWORLD Contract Studio ("Platform"), operated by <strong className="text-white font-semibold">ARGENTO MARITIME WORLDWIDE LLC</strong>, a Wyoming limited liability company ("Company").
    </p>
    <p className="border-l-2 border-[#00D4FF]/30 pl-3 italic text-[#80868B]">
      This Policy forms part of the Terms of Service. By accessing or using the Platform, you agree to comply with this Policy.
    </p>

    <div className="space-y-6 pt-2">
      {/* 1. Purpose */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">1.</span> Purpose
        </h3>
        <p className="mb-2">
          MARINEWORLD Contract Studio is an enterprise Contract Operating System designed for legitimate commercial, technical and operational agreement management.
        </p>
        <p className="text-[#80868B]">
          The Platform must be used responsibly and in accordance with applicable laws.
        </p>
      </div>

      {/* 2. Authorized Use */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">2.</span> Authorized Use
        </h3>
        <p className="mb-3 text-[#BBC0C4]">
          Users may use the Platform to:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-1 text-[#BBC0C4]">
          {[
            "Create agreements",
            "Review contracts",
            "Negotiate commercial terms",
            "Collaborate with authorized parties",
            "Execute agreements",
            "Manage contract repositories",
            "Generate PDF agreements",
            "Verify agreement integrity",
            "Use AI-powered contract assistance",
            "Maintain enterprise contract records"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] mt-1.5 shrink-0"></div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Prohibited Activities */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-red-500 font-mono">3.</span> Prohibited Activities
        </h3>
        <p className="mb-3">
          Users may not use the Platform to:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[#BBC0C4]">
          {[
            "violate any applicable law",
            "create fraudulent agreements",
            "impersonate another person or organization",
            "upload malicious software",
            "distribute malware or ransomware",
            "perform unauthorized security testing",
            "interfere with Platform availability",
            "access another customer's workspace",
            "bypass authentication or security controls",
            "exploit software vulnerabilities",
            "transmit spam or unsolicited communications",
            "engage in phishing activities",
            "conduct illegal financial activities"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-red-500/75 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. AI Services */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">4.</span> AI Services
        </h3>
        <p className="mb-3">
          Users remain solely responsible for all AI-generated content. Users shall not:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "rely exclusively on AI output without review",
            "represent AI output as legal advice",
            "intentionally generate misleading legal documents",
            "misuse AI for unlawful activities",
            "attempt to manipulate AI services to bypass Platform safeguards"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-[#00D4FF] mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          AI-generated content must always be independently reviewed before execution.
        </p>
      </div>

      {/* 5. Agreement Responsibility */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">5.</span> Agreement Responsibility
        </h3>
        <p className="mb-3">
          Users remain solely responsible for:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "contract content",
            "commercial negotiations",
            "legal review",
            "governing law",
            "regulatory compliance",
            "execution decisions",
            "contractual obligations"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] mt-1.5 shrink-0"></div>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          The Platform does not verify legal correctness.
        </p>
      </div>

      {/* 6. Intellectual Property */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">6.</span> Intellectual Property
        </h3>
        <p className="mb-3">
          Users shall not upload material that:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "infringes copyrights",
            "violates trademarks",
            "misappropriates trade secrets",
            "infringes patents",
            "violates confidentiality obligations"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-red-500/50 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Users must possess the necessary rights before uploading any content.
        </p>
      </div>

      {/* 7. Security */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">7.</span> Security
        </h3>
        <p className="mb-3">
          Users shall not:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[#BBC0C4]">
          {[
            "share workspace credentials",
            "disclose execution tokens",
            "bypass authentication",
            "interfere with audit logs",
            "modify registry records",
            "falsify timestamps",
            "attempt unauthorized API access"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-red-500/50 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Operational Credits */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">8.</span> Operational Credits
        </h3>
        <p className="mb-3">
          Users may not:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "manipulate Operational Credit balances",
            "exploit AI execution logic",
            "automate credit abuse",
            "interfere with subscription limits",
            "bypass Platform billing controls"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-red-500/50 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Operational Credits may only be used through authorized Platform functionality.
        </p>
      </div>

      {/* 9. Email Execution */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">9.</span> Email Execution
        </h3>
        <p className="mb-3">
          Recipients receiving secure execution links shall not:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "transfer execution links",
            "share one-time execution tokens",
            "attempt multiple executions using expired tokens",
            "impersonate another recipient"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-red-500/50 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Execution links remain personal and non-transferable.
        </p>
      </div>

      {/* 10. Customer Data */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">10.</span> Customer Data
        </h3>
        <p className="mb-2">
          Users may upload only information they are legally authorized to process.
        </p>
        <p className="mb-2">
          Users remain responsible for:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["customer information", "confidential information", "personal information", "regulatory compliance"].map((item, idx) => (
            <span key={idx} className="text-[10px] bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded font-mono text-[#E8EAED]">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* 11. Monitoring */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">11.</span> Monitoring
        </h3>
        <p className="mb-2">
          The Company may monitor Platform activity solely for:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 font-mono text-[10px]">
          {["security", "fraud prevention", "service integrity", "abuse detection", "operational stability"].map((item, idx) => (
            <div key={idx} className="bg-[#171B26] border border-white/5 p-1.5 rounded text-center text-[#00D4FF]">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          The Company does not routinely review customer agreements.
        </p>
      </div>

      {/* 12. Enforcement */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">12.</span> Enforcement
        </h3>
        <p className="mb-3">
          Violation of this Policy may result in:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 text-center">
          {[
            "warning", "temporary suspension", "Operational Credit suspension", 
            "workspace restriction", "account termination", "legal action"
          ].map((item, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-[#171B26] border border-white/5 text-[10px] uppercase font-bold text-red-400">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          The Company reserves the right to determine appropriate enforcement measures.
        </p>
      </div>

      {/* 13. Reporting Abuse */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">13.</span> Reporting Abuse
        </h3>
        <p className="text-[#BBC0C4]">
          Suspected abuse, security vulnerabilities or unauthorized Platform use should be reported through the official support channels available within MARINEWORLD Contract Studio.
        </p>
      </div>

      {/* 14. Policy Updates */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">14.</span> Policy Updates
        </h3>
        <p className="mb-2">
          This Policy may be updated periodically.
        </p>
        <p className="text-[#80868B]">
          Continued use of the Platform constitutes acceptance of the revised version.
        </p>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      © 2026 ARGENTO MARITIME WORLDWIDE LLC. All Rights Reserved.
    </p>
  </div>
);

const AIServicesCreditsPolicy = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope">
    {/* Header Info */}
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <Sparkles size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">AI Systems & Tokenology</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">MARINEWORLD CONTRACT STUDIO AI Services & Operational Credits Policy</p>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-[10px] font-mono text-[#80868B]">
        <span>EFFECTIVE DATE: JUNE 27, 2026</span>
        <span>VERSION 4.2.1</span>
      </div>
    </div>

    <p className="text-sm font-medium text-[#E8EAED] leading-relaxed">
      This AI Services & Operational Credits Policy ("Policy") governs the use of artificial intelligence services, Contract Copilot, AI-powered contract intelligence and the Operational Credit System available through MARINEWORLD Contract Studio ("Platform"), operated by <strong className="text-white font-semibold">ARGENTO MARITIME WORLDWIDE LLC</strong> ("Company").
    </p>
    <p className="border-l-2 border-[#00D4FF]/30 pl-3 italic text-[#80868B]">
      This Policy forms an integral part of the Terms of Service. By using any AI-powered functionality, you agree to this Policy.
    </p>

    <div className="space-y-6 pt-2">
      {/* 1. Purpose */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">1.</span> Purpose
        </h3>
        <p className="mb-2">
          The Platform provides AI-powered tools to assist users in drafting, reviewing, analyzing and managing commercial agreements.
        </p>
        <p className="text-[#80868B]">
          AI services are designed to enhance productivity and decision-making. They do not replace independent legal judgment or professional legal advice.
        </p>
      </div>

      {/* 2. AI Services */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">2.</span> AI Services
        </h3>
        <p className="mb-3 text-[#80868B]">
          The Platform may include, but is not limited to, the following intelligent systems:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            "Contract Copilot", "Contract AI Assistant", "Contract AI Advisor", "Clause Drafting",
            "Clause Rewriting", "Clause Expansion", "Contract Intelligence", "Executive Summaries",
            "Compliance Review", "Risk Assessment", "Redline Analysis", "Missing Clause Detection",
            "Translation Services", "Legal Language Optimization", "Agreement Comparison", "Template Recommendations"
          ].map((srv, idx) => (
            <span key={idx} className="text-[10px] bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded font-mono text-[#E8EAED]">
              {srv}
            </span>
          ))}
        </div>
        <p className="text-[#80868B] text-[11px] italic">
          Additional AI services may be introduced without prior notice.
        </p>
      </div>

      {/* 3. Human Responsibility */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">3.</span> Human Responsibility
        </h3>
        <p className="mb-3">
          All AI-generated content must be independently reviewed by the user. The Company does not guarantee that AI-generated content is:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {["legally accurate", "legally enforceable", "jurisdiction-specific", "complete", "suitable for any particular transaction"].map((item, idx) => (
            <div key={idx} className="bg-[#171B26] border border-white/5 p-2 rounded text-center text-[10px] font-mono text-[#00D4FF] capitalize">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Users remain solely responsible for all final contractual decisions.
        </p>
      </div>

      {/* 4. No Legal Advice */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">4.</span> No Legal Advice
        </h3>
        <p className="mb-3">
          AI-generated responses do not constitute:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "legal advice",
            "legal representation",
            "legal opinion",
            "legal certification",
            "regulatory approval"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 shrink-0"></div>
              <span className="capitalize">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          Professional legal review is recommended before executing legally significant agreements.
        </p>
      </div>

      {/* 5. Contract Copilot */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">5.</span> Contract Copilot
        </h3>
        <p className="mb-3">
          Contract Copilot operates as an intelligent drafting assistant. It may:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "explain clauses",
            "suggest revisions",
            "recommend missing provisions",
            "improve legal language",
            "summarize agreements",
            "identify inconsistencies"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-[#00D4FF] mt-1">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Contract Copilot never becomes a party to any agreement and does not approve contractual content.
        </p>
      </div>

      {/* 6. Operational Credits */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">6.</span> Operational Credits
        </h3>
        <p className="mb-2">
          Operational Credits are the Platform's internal usage units for AI-powered services.
        </p>
        <p className="mb-2">
          Operational Credits are consumed only after successful execution of eligible AI operations.
        </p>
        <p className="text-[#80868B] italic">
          Operational Credits are not currency and have no independent monetary value.
        </p>
      </div>

      {/* 7. AI Operations That Consume Credits */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">7.</span> AI Operations That Consume Credits
        </h3>
        <p className="mb-3">
          Operational Credits may be consumed by services including:
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            "AI Clause Generation", "AI Rewrite", "AI Add Content", "AI Continue Writing",
            "AI Risk Analysis", "Compliance Review", "Contract Intelligence", "Executive Summary",
            "Clause Comparison", "AI Translation", "AI Optimization", "Contract Copilot (where applicable)",
            "Future AI-powered services"
          ].map((srv, idx) => (
            <span key={idx} className="text-[10px] bg-cyan-500/[0.03] border border-cyan-500/10 px-2.5 py-1 rounded font-mono text-[#00D4FF]">
              {srv}
            </span>
          ))}
        </div>
        <p className="text-[#80868B] text-[11px] italic">
          The Platform may adjust Operational Credit requirements as services evolve.
        </p>
      </div>

      {/* 8. Services That Never Consume Credits */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-amber-500 font-mono">8.</span> Services That Never Consume Credits
        </h3>
        <p className="mb-3">
          Operational Credits are never consumed for the following core activities:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[10px] text-[#BBC0C4] font-mono mb-3 bg-[#171B26] p-4 rounded-lg border border-white/5">
          {[
            "Workspace Registration", "User Authentication", "Contract Creation", "Manual Editing",
            "Draft Saving", "Contract Repository", "Agreement Preview", "PDF Preview",
            "Certified PDF Download", "Agreement Deployment", "Review & Accept", "Request Revision",
            "Decline Agreement", "Email Distribution", "Notifications", "Version History",
            "Audit Trail", "Registry Records", "SHA-256 Generation", "Firestore Synchronization",
            "Contract Locking", "Verification Portal", "Multi-Party Execution", "Mobile Review",
            "Workspace Management"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          These services remain included within the applicable subscription plan.
        </p>
      </div>

      {/* 9. Credit Consumption Rules */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">9.</span> Credit Consumption Rules
        </h3>
        <p className="mb-2">
          Operational Credits are deducted only after a successful AI operation.
        </p>
        <p className="mb-2 text-amber-500 font-bold uppercase tracking-wider text-[10px] font-mono">
          Credits are NEVER deducted for:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center font-mono text-[9px]">
          {["before execution", "during execution", "cancelled requests", "failed requests", "interrupted requests", "timeout events", "infrastructure failures", "provider AI errors"].map((item, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 p-1.5 rounded text-[#E8EAED]">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Reserved credits are automatically released if an AI operation fails.
        </p>
      </div>

      {/* 10. Credit Validation */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">10.</span> Credit Validation
        </h3>
        <p className="mb-3">
          Before every AI operation, the Platform validates:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {["active subscription", "monthly allocation", "purchased Top-Up Credits", "available balance", "Firestore balance", "pending transactions"].map((item, idx) => (
            <div key={idx} className="bg-[#171B26] border border-white/5 p-2 rounded text-center text-[10px] font-mono text-[#00D4FF]">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          Client-side cached values are never used as the authoritative balance.
        </p>
      </div>

      {/* 11. Top-Up Operational Credits */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">11.</span> Top-Up Operational Credits
        </h3>
        <p className="mb-2">
          Customers may purchase additional Operational Credit Packs. Purchased credits remain associated with the originating enterprise workspace.
        </p>
        <p className="text-red-400 font-bold uppercase tracking-wider text-[10px] font-mono mb-2">
          Top-Up Credits may not be:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[9px] font-mono text-[#BBC0C4] mb-2">
          {["transferred", "exchanged", "converted to cash", "assigned to other workspace"].map((item, idx) => (
            <div key={idx} className="bg-red-500/[0.02] border border-red-500/10 p-1.5 rounded">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* 12. Subscription Plans */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">12.</span> Subscription Plans
        </h3>
        <p className="mb-2">
          Operational Credit allocations vary according to the selected subscription plan.
        </p>
        <p className="mb-2">
          Unused monthly allocations may expire according to the applicable subscription terms.
        </p>
        <p className="text-[#80868B]">
          Purchased Top-Up Credits remain subject to the applicable subscription policy.
        </p>
      </div>

      {/* 13. Fair Use */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-red-500 font-mono">13.</span> Fair Use
        </h3>
        <p className="mb-3">
          Users shall not:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "automate excessive AI requests",
            "artificially consume Platform resources",
            "exploit AI workflows",
            "manipulate Operational Credit accounting",
            "bypass Platform limitations",
            "reverse engineer AI services"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-red-500/50 mt-0.5 shrink-0">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          The Company may temporarily limit AI usage to preserve service stability.
        </p>
      </div>

      {/* 14. Service Availability */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">14.</span> Service Availability
        </h3>
        <p className="mb-2">
          AI services depend upon cloud infrastructure and external AI providers.
        </p>
        <p className="mb-2">
          Availability, response quality and processing speed may vary.
        </p>
        <p className="text-[#80868B]">
          The Company does not guarantee uninterrupted AI availability.
        </p>
      </div>

      {/* 15. AI Improvements */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">15.</span> AI Improvements
        </h3>
        <p className="mb-3">
          The Company may improve the following aspects without prior notice:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 font-mono text-[10px]">
          {["AI models", "prompt engineering", "drafting quality", "Operational Credit logic", "pricing models", "AI capabilities"].map((item, idx) => (
            <div key={idx} className="bg-[#171B26] border border-white/5 p-1.5 rounded text-center text-[#00D4FF]">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* 16. Audit & Transparency */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">16.</span> Audit & Transparency
        </h3>
        <p className="mb-3">
          Every eligible AI operation may generate audit records including:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center text-[10px] font-mono">
          {["Workspace ID", "User ID", "Agreement ID", "AI Service", "Credit Consumption", "Timestamp", "Revision Reference", "Execution Status"].map((item, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 p-2 rounded text-[#E8EAED]">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          Audit records support operational transparency and billing accuracy.
        </p>
      </div>

      {/* 17. Suspension */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">17.</span> Suspension
        </h3>
        <p className="mb-3">
          The Company may suspend AI access in cases including:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-[#BBC0C4]">
          {[
            "fraud",
            "abuse",
            "security threats",
            "billing violations",
            "repeated misuse of Operational Credits"
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-red-500/50 mt-0.5 shrink-0">•</span>
              <span className="capitalize">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B]">
          Workspace access may continue even if AI services are temporarily restricted.
        </p>
      </div>

      {/* 18. Limitation of Liability */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-red-500 font-mono">18.</span> Limitation of Liability
        </h3>
        <p className="mb-3">
          The Company shall not be liable for:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-3 text-[#BBC0C4]">
          {[
            "decisions based upon AI output",
            "contractual losses",
            "commercial losses",
            "legal disputes",
            "regulatory actions",
            "business interruption resulting from AI-generated content"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 shrink-0"></div>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[#80868B] italic">
          Users remain solely responsible for reviewing all AI-assisted work.
        </p>
      </div>

      {/* 19. Policy Updates */}
      <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">19.</span> Policy Updates
        </h3>
        <p className="mb-2">
          This Policy may be updated periodically to reflect improvements in AI services, Operational Credit functionality and enterprise capabilities.
        </p>
        <p className="text-[#80868B]">
          Continued use of AI services constitutes acceptance of the updated Policy.
        </p>
      </div>

      {/* 20. Final Notice */}
      <div className="p-5 bg-gradient-to-r from-cyan-500/5 to-transparent border border-cyan-500/10 rounded-xl">
        <h3 className="text-sm font-extrabold text-[#00D4FF] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="text-[#00D4FF] font-mono">20.</span> Final Notice
        </h3>
        <p className="mb-2 text-[#E8EAED]">
          MARINEWORLD Contract Studio provides AI-powered contract assistance to support enterprise agreement workflows.
        </p>
        <p className="text-[#80868B]">
          Final legal responsibility, commercial decision-making and contractual approval always remain with the respective users and contracting parties.
        </p>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      © 2026 ARGENTO MARITIME WORLDWIDE LLC. All Rights Reserved.
    </p>
  </div>
);

const ContractStudioContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <Layers size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">PRODUCTS</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Contract Studio</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Enterprise Contract Operating System</span>
    </div>

    <p className="text-sm font-medium text-[#E8EAED] leading-relaxed">
      Enterprise Contract Operating System for creating, negotiating, executing and governing commercial agreements across the global maritime economy.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
        <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Voyage Charters</span>
        <p className="text-[#80868B]">Intelligent creation and negotiation workflow for spot and consecutive voyage agreements.</p>
      </div>
      <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
        <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Time Charters</span>
        <p className="text-[#80868B]">Comprehensive governance standard for period charters, including hire and delivery clauses.</p>
      </div>
      <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
        <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">BIMCO Standards</span>
        <p className="text-[#80868B]">Inherent support for standard international maritime forms, covenants, and rulesets.</p>
      </div>
      <div className="bg-[#171B26] border border-white/5 rounded-lg p-4">
        <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-2 font-mono">Digital Verification</span>
        <p className="text-[#80868B]">Instant cryptographic verification of agreement authenticity via SHA-256 fingerprinting.</p>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Enterprise Agreement Operations • Secure Cloud System
    </p>
  </div>
);

const PricingContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <Landmark size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">PRODUCTS</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Pricing</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Flexible Subscription Plans</span>
    </div>

    <p className="text-sm font-medium text-[#E8EAED] leading-relaxed">
      Compare subscription plans, Operational Credits and enterprise licensing options.
    </p>

    <div className="space-y-4 pt-2">
      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">Professional Tier</span>
          <p className="text-[#80868B] mt-1">Perfect for individual brokers, chartering agents, and boutique operators.</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-[#00D4FF]">$199 / mo</span>
          <span className="text-[9px] text-[#80868B] block uppercase tracking-wider font-mono">Billed Annually</span>
        </div>
      </div>

      <div className="p-4 bg-[#00D4FF]/5 border border-[#00D4FF]/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            Enterprise Tier <span className="bg-[#00D4FF]/10 text-[#00D4FF] text-[8px] px-2 py-0.5 rounded-full">RECOMMENDED</span>
          </span>
          <p className="text-[#80868B] mt-1">For mid-sized fleets, port operators, and shipping management lines.</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-[#00D4FF]">$799 / mo</span>
          <span className="text-[9px] text-[#80868B] block uppercase tracking-wider font-mono">Billed Annually</span>
        </div>
      </div>

      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">Bespoke Enterprise</span>
          <p className="text-[#80868B] mt-1">Tailored for global maritime logistics conglomerates requiring specialized compliance SLAs.</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-white">Custom SLA</span>
          <span className="text-[9px] text-[#80868B] block uppercase tracking-wider font-mono">Contact Sales</span>
        </div>
      </div>
    </div>

    <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg space-y-2 mt-4">
      <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block font-mono">Operational Credits Standard</span>
      <p className="text-[#80868B]">
        Operational Credits power advanced AI tasks such as Smart Clause Drafting, Automated BIMCO audits, and interactive legal risk reports. Standard document creation, secure execution signatures, and ledger status logs are entirely free and unlimited.
      </p>
    </div>
  </div>
);

const SecurityContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <ShieldCheck size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">PRODUCTS</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Security</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Enterprise Security Architecture</span>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Maritime Governance Standard</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Enterprise-grade security, encrypted infrastructure and verifiable document integrity designed for modern contract operations.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="space-y-4">
        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Cryptographic Integrity</span>
          <p className="text-[#80868B]">Every Agreement, revision and execution record is protected with a unique SHA-256 document fingerprint to support integrity verification and version traceability.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Secure Encryption</span>
          <p className="text-[#80868B]">Data is protected using TLS 1.3 during transmission and AES-256 encryption for secure storage.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Enterprise Workspace Isolation</span>
          <p className="text-[#80868B]">Each organization operates within an isolated workspace with role-based access controls and secure separation of agreements, documents and metadata.</p>
        </div>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Verified Integrity • TLS 1.3 • AES-256 • SHA-256
    </p>
  </div>
);

const DocumentationContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <FileText size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">PRODUCTS</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Documentation</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Platform Guides & Documentation</span>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">User Guides</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Access onboarding guides, workspace documentation and operational workflows designed to help you get started with MarineWorld Contract Studio.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="space-y-4">
        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Getting Started</span>
          <p className="text-[#80868B]">Create your enterprise workspace, configure your organization and begin managing agreements.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Agreement Lifecycle</span>
          <p className="text-[#80868B]">Learn how to draft, review, negotiate, deploy and execute agreements through the Contract Studio workflow.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">AI & Contract Intelligence</span>
          <p className="text-[#80868B]">Explore Contract Copilot, AI-powered drafting, Operational Credits and agreement intelligence features.</p>
        </div>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Verified Documentation • Enterprise Guides
    </p>
  </div>
);

const AboutContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <Building size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">COMPANY</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">About</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Maritime Technology Group</span>
    </div>

    <p className="text-sm font-medium text-[#E8EAED] leading-relaxed">
      Learn about ARGENTO MARITIME WORLDWIDE LLC and the vision behind MarineWorld Contract Studio.
    </p>

    <div className="space-y-4">
      <p>
        Argento Maritime Worldwide LLC is a leading global maritime technology group. We build specialized cloud software and secure infrastructure to solve long-standing paper-based overhead challenges in international shipping lines, chartering operations, and logistics corridors.
      </p>
      <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
        <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Our Vision</span>
        <p className="text-[#80868B]">To provide a completely secure, fast, and cryptographically verified digital layer for commercial agreements. We strive to empower operators to execute risk-analyzed contracts in minutes rather than days.</p>
      </div>
      <p>
        ARGENTO MARITIME WORLDWIDE LLC operates as an independent infrastructure provider and is not a direct participant in agreements, transactions, or maritime legal negotiations facilitated by our software tools.
      </p>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Argento Maritime Worldwide LLC • Global Infrastructure Provider
    </p>
  </div>
);

const ContactContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <Scale size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">COMPANY</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Contact</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Corporate Communications</span>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Enterprise Support</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Get in Touch. Our dedicated teams are available to assist with sales, technical support, partnerships and compliance inquiries.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <span className="text-[10px] font-bold text-white block mb-1 font-mono">Enterprise Sales</span>
          <p className="text-[#80868B] mb-2">Licensing, enterprise deployments and commercial inquiries.</p>
          <a href="mailto:sales@argentomaritime.com" className="text-[#00D4FF] font-mono hover:underline">sales@argentomaritime.com</a>
        </div>

        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <span className="text-[10px] font-bold text-white block mb-1 font-mono">Technical Support</span>
          <p className="text-[#80868B] mb-2">Platform support, workspace assistance, Operational Credits and technical inquiries.</p>
          <a href="mailto:support@argentomaritime.com" className="text-[#00D4FF] font-mono hover:underline">support@argentomaritime.com</a>
        </div>

        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <span className="text-[10px] font-bold text-white block mb-1 font-mono">Partnerships</span>
          <p className="text-[#80868B] mb-2">Strategic partnerships, integrations and business development opportunities.</p>
          <a href="mailto:partners@argentomaritime.com" className="text-[#00D4FF] font-mono hover:underline">partners@argentomaritime.com</a>
        </div>

        <div className="p-4 border border-white/5 bg-white/[0.01] rounded-lg">
          <span className="text-[10px] font-bold text-white block mb-1 font-mono">Trust & Compliance</span>
          <p className="text-[#80868B] mb-2">Privacy, security, compliance and regulatory inquiries.</p>
          <a href="mailto:compliance@argentomaritime.com" className="text-[#00D4FF] font-mono hover:underline">compliance@argentomaritime.com</a>
        </div>
      </div>
    </div>
  </div>
);

const StatusContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 text-[#00D68F]">
          <Activity size={20} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">COMPANY</span>
        </div>
        <span className="bg-[#00D68F]/10 text-[#00D68F] text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">ALL SYSTEMS OPERATIONAL</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Status</p>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-[10px] font-mono text-[#80868B]">
        <span>LAST UPDATED: Just Now</span>
        <span>LATENCY: 12ms avg</span>
      </div>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Enterprise Platform Status</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Monitor the operational status of core Platform services and enterprise infrastructure.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { name: 'Platform', uptime: '100.00%', state: 'Operational' },
          { name: 'Authentication', uptime: '100.00%', state: 'Operational' },
          { name: 'AI Services', uptime: '99.98%', state: 'Operational' },
          { name: 'Agreement Execution Portal', uptime: '100.00%', state: 'Operational' },
          { name: 'Contract Registry', uptime: '100.00%', state: 'Operational' },
          { name: 'Email Delivery', uptime: '99.99%', state: 'Operational' }
        ].map((srv, idx) => (
          <div key={idx} className="p-3 bg-[#171B26] border border-white/5 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider block font-mono">{srv.name}</span>
              <span className="text-[#80868B] text-[8px] uppercase tracking-widest font-mono">UPTIME: {srv.uptime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] animate-pulse"></span>
              <span className="text-[#00D68F] font-mono font-bold text-[9px] uppercase tracking-wider">{srv.state}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Verified Integrity • SHA-256 • TLS 1.3
    </p>
  </div>
);

const HelpCenterContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <HelpCircle size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SUPPORT</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Help Center</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Platform Knowledge Base</span>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Knowledge Base</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Find answers to common questions and learn how to get the most from MarineWorld Contract Studio.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="space-y-4">
        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg space-y-2">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider block font-mono">How can I verify an Agreement?</span>
          <p className="text-[#80868B]">Open the Contract Registry and verify an Agreement using its Agreement ID, Verification URL or SHA-256 document fingerprint.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg space-y-2">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider block font-mono">What are Operational Credits?</span>
          <p className="text-[#80868B]">Operational Credits are consumed only when eligible AI-powered services are successfully executed. Standard contract management, PDF generation, agreement execution and registry services never consume credits.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg space-y-2">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider block font-mono">Is my data used to train AI models?</span>
          <p className="text-[#80868B]">No. Your agreements, workspace data and business information remain confidential and are never used to train public AI models. AI services process information only to generate the responses you request.</p>
        </div>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Enterprise Support • Secure Documentation
    </p>
  </div>
);

const ContactSupportContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <ShieldAlert size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SUPPORT</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Contact Support</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Technical Assistance & Ticket Desk</span>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Enterprise Support</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Get assistance with workspace management, technical issues, account services and Platform operations.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="space-y-4">
        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Support Services</span>
          <p className="text-[#80868B]">Submit technical support requests, report issues or contact our team for enterprise assistance.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Response Priorities</span>
          <p className="text-[#80868B]">Critical issues receive priority review and are handled according to your subscription plan and service level. Enterprise customers receive priority support.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Service Availability</span>
          <p className="text-[#80868B]">Support availability and response times vary according to your subscription plan and published Service Level Agreement (SLA).</p>
        </div>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Enterprise Support • Secure Assistance
    </p>
  </div>
);

const ReleaseNotesContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <History size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">SUPPORT</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Release Notes</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Platform Updates & Log</span>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Platform Updates</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Stay informed about new features, platform improvements, performance enhancements and security updates.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="space-y-4">
        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">Version 4.2.0</span>
            <span className="text-[#80868B] text-[9px] font-mono">June 2026</span>
          </div>
          <p className="text-[#80868B]">Introduced Contract Copilot enhancements, improved AI-assisted drafting, refined Agreement Execution workflows and overall performance improvements.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">Version 4.1.5</span>
            <span className="text-[#80868B] text-[9px] font-mono">May 2026</span>
          </div>
          <p className="text-[#80868B]">Enhanced PDF generation, Agreement Registry performance, SHA-256 verification and platform stability.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">Version 4.0.0</span>
            <span className="text-[#80868B] text-[9px] font-mono">March 2026</span>
          </div>
          <p className="text-[#80868B]">Introduced the Enterprise Contract Operating System with Contract Registry, immutable version history, multi-party agreement execution and enterprise audit trails.</p>
        </div>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Product Updates • Security Improvements
    </p>
  </div>
);

const TrustCenterContent = () => (
  <div className="text-xs text-[#BBC0C4] leading-relaxed space-y-6 font-manrope animate-in fade-in duration-300">
    <div className="bg-[#171E2D]/50 border border-white/5 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-2 text-[#00D4FF]">
        <ShieldCheck size={20} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">TRUST</span>
      </div>
      <p className="text-[#E8EAED] text-sm font-semibold">Trust Center</p>
      <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-1">Platform Trust & Integrity</span>
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Trust & Integrity</h3>
        <p className="text-[#E8EAED] font-semibold text-sm leading-relaxed mb-4">
          Learn how MarineWorld Contract Studio protects enterprise agreements, customer information and document integrity through secure infrastructure and verifiable records.
        </p>
      </div>

      <hr className="border-white/5" />

      <div className="space-y-4">
        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Platform Security</span>
          <p className="text-[#80868B]">Enterprise-grade authentication, encrypted communications and secure cloud infrastructure help protect your workspace and business data.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Data Protection</span>
          <p className="text-[#80868B]">Each organization operates within an isolated enterprise workspace with secure separation of agreements, documents and metadata.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Document Integrity</span>
          <p className="text-[#80868B]">Every Agreement, revision and execution record is assigned a unique SHA-256 document fingerprint to support integrity verification and complete version traceability.</p>
        </div>

        <div className="p-4 bg-[#171B26] border border-white/5 rounded-lg">
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider block mb-1 font-mono">Responsible AI</span>
          <p className="text-[#80868B]">AI services assist with drafting, reviewing and analyzing agreements. Customer data remains confidential and is not used to train public AI models.</p>
        </div>
      </div>
    </div>

    <hr className="my-6 border-white/5" />
    <p className="text-[9px] text-[#80868B] uppercase tracking-widest font-mono text-center font-bold">
      Enterprise Trust • SHA-256 • AES-256 • TLS 1.3
    </p>
  </div>
);

export default function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  const titleMap: Record<string, string> = {
    'privacy': 'Enterprise Privacy Policy',
    'terms': 'Enterprise Terms of Service',
    'acceptable': 'Acceptable Use Policy',
    'ai-credits': 'AI Services & Operational Credits Policy',
    'product-studio': 'Contract Studio Overview',
    'product-pricing': 'Subscription Plans & Pricing',
    'product-security': 'Enterprise Security Architecture',
    'product-docs': 'Platform & API Documentation',
    'company-about': 'About Argento Maritime Worldwide LLC',
    'company-contact': 'Corporate Communications Desk',
    'company-status': 'Service Status Registry',
    'support-help': 'Help Center & Knowledge Base',
    'support-contact': 'Technical Support & SLA Desk',
    'support-notes': 'Platform Updates & Release Notes',
    'trust-center': 'Trust & Integrity Charter'
  };

  const title = titleMap[type] || 'Maritime Information Center';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Soft Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#111625] to-[#080B12] border border-[#2B354D] rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-hidden hover:border-[#00D4FF]/30 transition-colors">
        
        {/* Soft Background Blue Glow */}
        <div className="absolute top-0 left-1/4 w-[300px] h-[150px] bg-[#00D4FF]/5 blur-[60px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-5 border-b border-white/5 shrink-0 bg-[#161C2C]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]">
              {type === 'privacy' && <ShieldCheck size={18} />}
              {type === 'terms' && <Scale size={18} />}
              {type === 'acceptable' && <CheckCircle2 size={18} />}
              {type === 'ai-credits' && <Sparkles size={18} />}
              {type === 'product-studio' && <Layers size={18} />}
              {type === 'product-pricing' && <Landmark size={18} />}
              {type === 'product-security' && <ShieldCheck size={18} />}
              {type === 'product-docs' && <FileText size={18} />}
              {type === 'company-about' && <Building size={18} />}
              {type === 'company-contact' && <Scale size={18} />}
              {type === 'company-status' && <Activity size={18} />}
              {type === 'support-help' && <HelpCircle size={18} />}
              {type === 'support-contact' && <ShieldAlert size={18} />}
              {type === 'support-notes' && <History size={18} />}
              {type === 'trust-center' && <ShieldCheck size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white font-manrope uppercase tracking-widest">{title}</h2>
              <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider block mt-0.5">Maritime Governance Standard</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 text-[#80868B] hover:text-white rounded-lg transition-all shrink-0 cursor-pointer border border-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 font-sans scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {type === 'privacy' && <PrivacyPolicy />}
          {type === 'terms' && <TermsOfService />}
          {type === 'acceptable' && <AcceptableUsePolicy />}
          {type === 'ai-credits' && <AIServicesCreditsPolicy />}
          {type === 'product-studio' && <ContractStudioContent />}
          {type === 'product-pricing' && <PricingContent />}
          {type === 'product-security' && <SecurityContent />}
          {type === 'product-docs' && <DocumentationContent />}
          {type === 'company-about' && <AboutContent />}
          {type === 'company-contact' && <ContactContent />}
          {type === 'company-status' && <StatusContent />}
          {type === 'support-help' && <HelpCenterContent />}
          {type === 'support-contact' && <ContactSupportContent />}
          {type === 'support-notes' && <ReleaseNotesContent />}
          {type === 'trust-center' && <TrustCenterContent />}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/5 bg-[#161C2C]/40 backdrop-blur-sm flex items-center justify-between shrink-0">
          <span className="text-[9px] font-mono text-[#80868B] uppercase tracking-wider">
            Verified Integrity • Secure SSL
          </span>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] font-extrabold uppercase tracking-[0.15em] text-[10px] rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_4px_12px_rgba(0,212,255,0.25)] flex items-center gap-2"
          >
            <span>Acknowledge & Close</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
