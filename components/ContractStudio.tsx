import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, FileText, User, Anchor, 
  History, PenTool, Scale, Eye, Download, Search, AlertCircle, Cpu, Shield, UploadCloud, X, ArrowRight, ShieldAlert, Mail, FileSignature, ShieldCheck,
  Menu, ChevronLeft, Send, Trash2, Plus, Loader2, CreditCard, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import { chatWithContractAdvisor, rewriteContractClauseWithAi } from '../services/gemini';
import { db, logAuditEvent } from '../services/firebase-service';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';



const agreementTypes = [
  "--- COMMERCIAL & SALES AGREEMENTS ---",
  "Sale Agreement",
  "Purchase Agreement",
  "Commercial Service Agreement",
  "Supply Agreement",
  "Framework Agreement",
  "Master Services Agreement (MSA)",
  "Commercial Cooperation Agreement",
  "Strategic Partnership Agreement",
  "Joint Venture Agreement",
  "Revenue Sharing Agreement",
  "Referral Agreement",
  "Commission Agreement",
  "--- BROKERAGE & REPRESENTATION AGREEMENTS ---",
  "Brokerage Agreement",
  "Yacht Brokerage Agreement",
  "Vessel Brokerage Agreement",
  "Commercial Representation Agreement",
  "Sales Representation Agreement",
  "Exclusive Representation Agreement",
  "Non-Exclusive Representation Agreement",
  "Agency Agreement",
  "Exclusive Agency Agreement",
  "Regional Agency Agreement",
  "Global Agency Agreement",
  "--- SALES AUTHORIZATION AGREEMENTS ---",
  "Sales Authorization Agreement",
  "Exclusive Sales Authorization Agreement",
  "Vessel Sales Authorization Agreement",
  "Charter Sales Authorization Agreement",
  "Listing Authorization Agreement",
  "Yacht Listing Agreement",
  "Commercial Listing Agreement",
  "--- DISTRIBUTION & DEALER AGREEMENTS ---",
  "Distribution Agreement",
  "Exclusive Distribution Agreement",
  "Regional Distribution Agreement",
  "Global Distribution Agreement",
  "Dealer Agreement",
  "Exclusive Dealer Agreement",
  "Authorized Dealer Agreement",
  "Reseller Agreement",
  "Value Added Reseller Agreement (VAR)",
  "--- YACHT SALES & CHARTER AGREEMENTS ---",
  "Yacht Sale Agreement",
  "Vessel Sale Agreement",
  "Purchase Reservation Agreement",
  "Deposit Agreement",
  "Memorandum of Agreement (MOA)",
  "Sea Trial Agreement",
  "Delivery Acceptance Agreement",
  "Charter Agreement",
  "Bareboat Charter Agreement",
  "Crewed Charter Agreement",
  "Seasonal Charter Agreement",
  "Charter Management Agreement",
  "Charter Marketing Agreement",
  "Charter Representation Agreement",
  "--- SHIPYARD & REFIT AGREEMENTS ---",
  "Shipbuilding Agreement",
  "New Build Agreement",
  "Refit Agreement",
  "Retrofit Agreement",
  "Engineering Agreement",
  "Manufacturing Agreement",
  "OEM Agreement",
  "Equipment Supply Agreement",
  "Spare Parts Agreement",
  "Warranty Agreement",
  "Commissioning Agreement",
  "Dry Dock Agreement",
  "--- MARINA & PORT AGREEMENTS ---",
  "Marina Services Agreement",
  "Berthing Agreement",
  "Annual Berthing Agreement",
  "Port Services Agreement",
  "Vessel Management Agreement",
  "Technical Management Agreement",
  "Fleet Management Agreement",
  "Operational Support Agreement",
  "--- CREW & EMPLOYMENT AGREEMENTS ---",
  "Crew Employment Agreement",
  "Captain Employment Agreement",
  "Crew Placement Agreement",
  "Crew Management Agreement",
  "Maritime Employment Agreement",
  "Contractor Agreement",
  "Independent Consultant Agreement",
  "--- LEGAL & FINANCIAL AGREEMENTS ---",
  "Legal Services Agreement",
  "Retainer Agreement",
  "Direct Settlement Agreement",
  "Financing Agreement",
  "Loan Agreement",
  "Insurance Agreement",
  "Advisory Agreement",
  "Due Diligence Agreement",
  "Compliance Agreement",
  "--- SURVEY & CERTIFICATION AGREEMENTS ---",
  "Survey Agreement",
  "Condition Survey Agreement",
  "Pre-Purchase Survey Agreement",
  "Valuation Survey Agreement",
  "Inspection Agreement",
  "Classification Agreement",
  "Certification Agreement",
  "Audit Agreement",
  "Verification Agreement",
  "--- TECHNOLOGY AGREEMENTS ---",
  "Software License Agreement",
  "SaaS Agreement",
  "API Access Agreement",
  "Data Processing Agreement",
  "Managed Services Agreement",
  "White Label Agreement",
  "Cybersecurity Agreement",
  "--- PROTECTIVE AGREEMENTS ---",
  "NDA",
  "Mutual NDA",
  "Non-Circumvention Agreement",
  "Non-Compete Agreement",
  "Confidentiality Agreement",
  "Intellectual Property Agreement"
];
const transactionTypes = ["--- SHIPYARD.CITY ---", "New Build", "Refit", "Retrofit", "Manufacturing", "Equipment Supply", "Spare Parts Supply", "OEM Production", "Engineering Services", "Commissioning", "Warranty Services", "--- CHARTER.CITY ---", "Yacht Charter", "Bareboat Charter", "Crewed Charter", "Day Charter", "Seasonal Charter", "Charter Management", "Yacht Sale", "Yacht Brokerage", "--- MARINA.CITY ---", "Berthing", "Marina Services", "Technical Services", "Port Services", "Vessel Management", "Annual Maintenance", "Dry Dock Services", "--- OFFSHORE.CITY ---", "Offshore Engineering", "Infrastructure Project", "Subsea Services", "Inspection Services", "Energy Project", "--- MARINELEGAL.CITY ---", "Legal Advisory", "Due Diligence", "Certification", "Compliance Review", "Insurance Placement", "Settlement Routing", "Financing Services", "--- MARINEAI.CITY ---", "Software Licensing", "SaaS Subscription", "API Access", "Digital Transformation", "Cybersecurity Services", "AI Consulting"];
const subjectMatters = [
  "Yacht Sales",
  "Vessel Sales",
  "Yacht Brokerage",
  "Vessel Brokerage",
  "Charter Brokerage",
  "Yacht Marketing",
  "Charter Marketing",
  "Distribution Rights",
  "Dealer Operations",
  "Agency Operations",
  "Commercial Representation",
  "Marine Equipment Sales",
  "Marine Equipment Distribution",
  "Yacht Management",
  "Fleet Management",
  "Shipyard Operations",
  "Vessel Construction",
  "Refit Management",
  "Marina Operations",
  "Port Operations",
  "Marine Survey Services",
  "Classification Services",
  "Crew Recruitment",
  "Crew Employment",
  "Insurance Placement",
  "Settlement Services",
  "Financing Services",
  "Maritime Legal Services",
  "Maritime Compliance Services",
  "Marine Engineering Services",
  "Vessel Maintenance",
  "Yacht Refit Services",
  "Equipment Manufacturing",
  "Crew Management",
  "Technical Consultancy",
  "Charter Operations",
  "Brokerage Services",
  "Classification Survey",
  "Vessel Inspection",
  "Insurance Brokerage",
  "Financing Support",
  "Digital Infrastructure Services",
  "Custom"
];
const objectives = [
  "Yacht Sale",
  "Vessel Sale",
  "Asset Disposal",
  "Asset Acquisition",
  "Charter Revenue Generation",
  "Charter Fleet Expansion",
  "Charter Representation",
  "Yacht Marketing",
  "Vessel Marketing",
  "Exclusive Sales Rights",
  "Exclusive Charter Rights",
  "Commercial Representation",
  "Regional Representation",
  "Global Representation",
  "Distribution Rights",
  "Dealer Appointment",
  "Market Development",
  "Territory Development",
  "Lead Generation",
  "Brokerage Services",
  "Commission-Based Sales",
  "Fleet Management",
  "Crew Placement",
  "Crew Recruitment",
  "Vessel Certification",
  "Regulatory Compliance",
  "Insurance Placement",
  "Financing Arrangement",
  "Refit Project Delivery",
  "Shipbuilding Project Delivery",
  "Technical Consulting",
  "Strategic Alliance",
  "Joint Operations",
  "Technology Licensing",
  "Vessel Purchase",
  "Fleet Optimization",
  "Operational Support",
  "Technical Support",
  "Long-Term Maintenance",
  "Charter Operations",
  "Dealer Network Expansion",
  "Market Entry",
  "Revenue Sharing",
  "Strategic Partnership",
  "Compliance Management",
  "Certification Management",
  "Crew Employment",
  "Project Delivery",
  "Infrastructure Development"
];
const geoScopes = ["Global", "Europe", "Mediterranean", "Eastern Mediterranean", "Western Mediterranean", "Black Sea", "Middle East", "North Africa", "GCC Region", "North America", "South America", "Asia Pacific", "Worldwide", "Custom"];
const operatingAreas = ["Aegean Sea", "Levant Basin", "Adriatic Sea", "Ionian Sea", "Tyrrhenian Sea", "Western Mediterranean", "Black Sea", "Red Sea", "Arabian Gulf", "Gulf of Oman", "Indian Ocean", "Atlantic Ocean", "Worldwide Operations", "Custom"];
const serviceLocations = ["Marina", "Shipyard", "Port", "Vessel Onboard", "Offshore Platform", "Dry Dock", "Customer Facility", "Remote Operations", "International Waters", "Custom"];
const currencies = ["USD", "EUR", "GBP", "CHF", "AED", "SAR", "NOK", "SEK", "DKK", "SGD", "HKD", "JPY"];
const commercialModels = ["Fixed Price", "Cost Plus", "Retainer", "Subscription", "Revenue Share", "Commission Based", "Milestone Based", "Time & Materials", "Daily Rate", "Monthly Rate", "Annual Contract", "Hybrid"];
const paymentStructures = ["100% Advance", "NET 7", "NET 15", "NET 30", "NET 45", "NET 60", "Monthly", "Quarterly", "Semi Annual", "Annual", "Milestone Based", "Progress Payment", "Direct Settlement Based", "Deposit + Final Payment"];
const contractDurations = ["One Time", "30 Days", "90 Days", "6 Months", "12 Months", "24 Months", "36 Months", "60 Months", "Custom Duration"];
const renewalTermsList = ["No Renewal", "Automatic Renewal", "Annual Renewal", "Mutual Renewal", "Renewal By Written Consent", "Evergreen Agreement"];
const noticePeriods = ["Immediate", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days", "180 Days", "Custom"];
const applicableLaws = ["English Law", "New York Law", "Swiss Law", "Singapore Law", "UAE Law", "Maltese Law", "Dutch Law", "German Law", "French Law", "Italian Law", "Turkish Law", "Custom Jurisdiction"];
const arbitrationSeats = ["London", "Singapore", "Geneva", "Dubai", "Paris", "New York", "Hamburg", "Malta", "Monaco", "Istanbul", "Custom"];

export default function ContractStudio({ template, company, userType, onBack }: { template?: string, company?: any, userType?: string, onBack?: () => void }) {
  const sections = [
    "Commercial Foundation",
    "Parties",
    "Participants",
    "Deliverables",
    "Commercial Terms",
    "Payment Terms",
    "Delivery Terms",
    "Warranty",
    "Liability",
    "Confidentiality",
    "Termination",
    "Jurisdiction",
    "Arbitration",
    "Signatures",
    "Annexes",
    "Attachments",
    "Verification",
    "Audit Trail",
    "Contract AI Advisor"
  ];

  const [workflowStep, setWorkflowStep] = useState<'hub' | 'editor'>('hub');
  
  // Firestore active contract states
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [dbContracts, setDbContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState<boolean>(true);
  
  // Search & filter states for the hub
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeSection, setActiveSection] = useState(sections[0]);

  // ADIM 1 Wizard Data State
  const [wizardData, setWizardData] = useState({
    agreementType: "Vessel Sale Agreement",
    seller: "Argento Marine",
    buyer: "ABC Holdings",
    contractValue: "4500000",
    currency: "EUR",
    jurisdiction: "English Law",
    arbitrationSeat: "London",
    deliveryPort: "Monaco",
    broker: "XYZ Brokerage"
  });

  // Dynamic Clauses List State
  const [clauses, setClauses] = useState<Array<{
    id: string;
    title: string;
    content: string;
    status: 'v1 Generated' | 'v2 Seller Revision' | 'v3 Buyer Revision' | 'v4 Approved' | 'v5 Signed';
    isEditing?: boolean;
    alternativeReplacementsCount?: number;
  }>>([]);

  // Version Control State
  const [currentVersion, setCurrentVersion] = useState<'v1 Generated' | 'v2 Seller Revision' | 'v3 Buyer Revision' | 'v4 Approved' | 'v5 Signed'>('v1 Generated');

  // Generation Loading Animation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);

  // Contract Intelligence Panel State (Non-conversational)
  const [intelReport, setIntelReport] = useState<{
    type: 'none' | 'analysis' | 'risk' | 'compare';
    loading: boolean;
    content: string;
  }>({ type: 'none', loading: false, content: "" });

  const [aiRevisionInstruction, setAiRevisionInstruction] = useState("");
  const [isAiRevising, setIsAiRevising] = useState(false);
  const [individualAiRewriteId, setIndividualAiRewriteId] = useState<string | null>(null);
  const [individualAiInstruction, setIndividualAiInstruction] = useState("");
  const [showAlternativeDropdownId, setShowAlternativeDropdownId] = useState<string | null>(null);

  // Pre-configured replacement pools for quick 'Replace' feature
  const clauseAlternatives: { [key: string]: string[] } = {
    clause_parties: [
      "ALTERNATIVE A: This framework is established through strategic partnership where Party A grants operational delegation to Party B for cross-docking.",
      "ALTERNATIVE B: This Agreement represents a strict arm's-length transactional covenant between non-affiliate specialized maritime carriers."
    ],
    clause_commercial: [
      "ALTERNATIVE A: Commercial structure is billed as modular progressive Milestones, subject to 5% monthly handling surcharges.",
      "ALTERNATIVE B: Fixed global sum payable strictly within 45 days of physical execution, backed by solid bank letter of guarantee."
    ],
    clause_delivery: [
      "ALTERNATIVE A: Delivery shall operate under Ex-Works (EXW) dry dock conditions, with Buyer absorbing all subsequent maritime transit liability.",
      "ALTERNATIVE B: Physical handover occurs at shipyard dry dock prior to official naming certificate clearance."
    ],
    clause_warranty: [
      "ALTERNATIVE A: Subject matter is sold strictly 'As-Is, Where-Is' without any secondary performance warranty or classification guarantees.",
      "ALTERNATIVE B: Standard warranty capped at 24 Months, specifically extended to core hydraulic shafts and navigation hardware."
    ],
    clause_liability: [
      "ALTERNATIVE A: Liability is capped at exactly €500,000 flat sum, overriding any valuations of cargo or technical allocations.",
      "ALTERNATIVE B: Mutual indemnification protects both parties from any environmental, hull oil pollution, or salvage costs."
    ],
    clause_disputes: [
      "ALTERNATIVE A: All disputes are submitted to the Maritime Chamber of Monaco under Local Monaco Civil Law.",
      "ALTERNATIVE B: ICC Arbitration in Geneva, Switzerland govern this transaction, operating under Swiss commercial conventions."
    ],
    clause_broker: [
      "ALTERNATIVE A: XYZ Brokerage fee is structured as a deferred annuity paid over 3 equal installments matching milestone acceptances.",
      "ALTERNATIVE B: No brokers are recognized. Each party warrants that no brokerage intermediaries played a part in this transaction."
    ]
  };

  const generateInitialClauses = (data: typeof wizardData) => {
    const formattedVal = `${data.currency} ${Number(data.contractValue?.toString().replace(/,/g, '') || 0).toLocaleString()}`;
    return [
      {
        id: "clause_parties",
        title: "Clause 1. Parties & Commercial Preamble",
        content: `This Agreement is officially made and entered into on this 14th day of June 2026, by and between:

1. SELLER / PROVIDER: ${data.seller}, a premier marine corporation operating under designated corporate ordinances, acting as the vessel transferrer / technical contractor.

2. BUYER / CLIENT: ${data.buyer}, an international purchasing group / commercial charter operator, acting as the primary receiver.

Hereinafter referred to collectively as the "Parties" and individually as a "Party". This transaction represents the absolute commercial intent to transfer and operate maritime assets.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_commercial",
        title: "Clause 2. Commercial Foundation, Valuation & Financing",
        content: `The total agreed base commercial valuation that governs this transactional structure is established at the absolute sum of ${formattedVal}. Payment shall operate under a Direct Settlement structure, with advance deposit sums processed directly through Secure Connected Accounts. Any delays in funding releases trigger automatic demurrage assessments.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_delivery",
        title: "Clause 3. Physical Vessel Delivery & Logistics",
        content: `The physical delivery, sea trials, and official transfer of operational command shall successfully culminate at the designated Port of ${data.deliveryPort} under strict DDP Incoterms 2020. The Buyer maintains the absolute right to commission technical surveys and sea trial tests within a maximum envelope of 15 days from arrival. All logistical costs are allocated according to Appendix specifications.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_warranty",
        title: "Clause 4. Maritime Warranties & Structural Compliance",
        content: `The Seller warrants that the vessel maintains active, unrestricted compliance status with leading international classification registries, notably DNV (Det Norske Veritas) and Lloyd's Register. Standard engineering warranties shall operate for a default duration of 12 Months from completion of acceptances. Marine engine components and drive shafts are fully certified against metal fatigue.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_liability",
        title: "Clause 5. Limitation of Legal Liabilities",
        content: `The total collective liability of either Party for any claims, breaches, indemnities, or operational errors under this contract shall remain strictly restricted to a cap of 100% of the active Contract Value (${formattedVal}). Both parties agree to a mutual waiver of all indirect, consequential, environmental loss, or speculative commercial damages of any kind.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_disputes",
        title: "Clause 6. Governing Jurisdiction & LMAA Arbitration",
        content: `This Agreement, its execution, and all resulting contractual disputes shall be strictly governed by the substantive laws of ${data.jurisdiction}. Any claims or legal conflicts that cannot be settled amicably shall be referred to and finally resolved by binding maritime arbitration in ${data.arbitrationSeat} under standard LMAA (London Maritime Arbitrators Association) Rules.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_execution",
        title: "Clause 7. Cryptographic Execution & Signatures",
        content: `Each authorized signatory below warrants full administrative clearance from their respective corporate boards. Upon digital execution, a cryptographic verification hash: 8A7F-31CC-0E2A-5501-7F03 is permanently recorded to the secure decentralized Maritime Ledger, serving as an immutable, non-repudiable audit track of execution.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_broker",
        title: "Clause 8. Broker Protection & Commission Terms",
        content: `The Parties acknowledge that ${data.broker} has served as the designated transactional Brokerage Agent in facilitating this commercial covenant. In consideration of these services, a total commission fee fixed at 2.5% of the total Agreement Value (${formattedVal}) is legally locked for the Broker, payable immediately upon vessel acceptance.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      }
    ];
  };
  
  // States for Foundation
  const [foundation, setFoundation] = useState<any>({
    type: "Service Agreement",
    title: "Eastern Mediterranean Technical Service Agreement",
    transactionType: "Maintenance",
    subjectMatter: "Provision of marine engineering and technical operational support services.",
    objective: "To maintain optimal operational efficiency of the vessel fleet.",
    description: "This Agreement establishes the commercial framework between the parties for the provision of marine engineering, technical support, maintenance, and operational consulting services for vessels operating within the designated region.",
    value: "5,000,000",
    currency: "USD",
    geoScope: "Eastern Mediterranean",
    operatingArea: "Aegean Sea & Levant Basin",
    serviceLocation: "Greece & Cyprus Ports",
    duration: "24 Months",
    effectiveDate: "2026-06-14",
    expirationDate: "2028-06-13",
    renewalTerms: "Automatic Renewal",
    noticePeriod: "90 Days"
  });

  // State for Jurisdiction
  const [jurisdiction, setJurisdiction] = useState<any>({
    law: "England & Wales",
    seat: "London",
    institution: "LMAA"
  });

  // Participant State with Emails
  const [partyA, setPartyA] = useState<any>({ 
    name: company?.name || "GLOBAL DYNAMICS LTD", 
    role: "Seller",
    email: company?.email || "owner@global-dynamics.com",
    address: "",
    idNumber: "",
    confirmEmail: false,
    additionalEmails: []
  });
  const [partyB, setPartyB] = useState<any>({ 
    name: "ARGENTO MARINE", 
    role: "Buyer",
    email: "legal@argentomarine.com",
    address: "",
    idNumber: "",
    confirmEmail: false,
    additionalEmails: []
  });

  // Centralized Contract Fields for filled values
  const [contractFields, setContractFields] = useState<any>({
    deliverables: "Provision of marine engineering, dry docking oversight, and technical operational diagnostics for the designated container fleet. Includes technical consultant site audits at all operating service locations.",
    milestones: `Milestone 1: Preliminary Site Inspection (End of Month 1)
Milestone 2: Critical Asset Diagnostic (Month 3)
Milestone 3: Fleet Maintenance Deployment (Ongoing)`,
    commercialTerms: "Base service pricing is calculated on a modular structure with optional operational hours priced according to standard Annex rates. Direct procurement materials are billed separately with a 5% handling surcharge.",
    surcharges: "Demurrage claims and vessel waiting time caps are subject to a maximum threshold of $15,000 per 24-hour cycle.",
    paymentTerms: "Payment is payable monthly in advance on receipt of corresponding company service invoice. Invoices must list the detailed breakdown of technical resources deployed in the field.",
    paymentMethod: "SWIFT Wire Transfer / Confirmed Irrevocable Letter of Credit (LC)",
    incoterms: "DDP (Delivered Duty Paid)",
    deliveryLocation: "Piraeus Port & Limassol Terminal",
    warrantyPeriod: "12 Months from completion",
    warrantyScope: "Guarantee of technical operational integrity, service quality and spare parts procurement compliance with leading classification society regulations.",
    liabilityLimit: "100% of Contract Value",
    consequentialDamages: "Excluded by mutual waiver",
    confidentialityDuration: "60 Months standard non-disclosure scope from agreement expiration",
    terminationNotice: "90 Days written notice for convenience by either party.",
    arbitrationRules: "LMAA Terms 2021 & standard Arbitrators Rules",
    annexes: `Annex A: Vessel Fleet Allocation Matrix
Annex B: Hourly Fee Rates and Overtime Standards`,
    verificationCode: "8A7F-31CC-0E2A-5501-7F03",
    auditTrail: `1. Record Initialized: 2026-06-14 10:14 UTC
2. AI Risk Screened: Verified
3. Compliance Certificate attached`
  });

  const [aiState, setAiState] = useState<{task: string | null, status: 'idle' | 'loading' | 'complete', result?: string}>({ task: null, status: 'idle' });
  const [isExecuted, setIsExecuted] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executionState, setExecutionState] = useState<'signing' | 'sending_emails' | 'completed'>('signing');
  const [emailStatus, setEmailStatus] = useState<Array<{ email: string; role: string; name: string; status: 'sending' | 'sent' }>>([]);

  // Expanded interactive States for Participants & Identity upload
  const [participants, setParticipants] = useState<any[]>([
    { id: 'p1', name: "DNV Classification Society", role: "Classification and Compliance Auditor", contact: "dnv-compliance@dnv.com" },
    { id: 'p2', name: "Standard Chartered Settlement Router", role: "Direct Settlement & Payment Custodian", contact: "settle@sc.com" }
  ]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ name: '', role: '', contact: '' });

  const [identityDocs, setIdentityDocs] = useState<Array<{
    id: string;
    type: string;
    name: string;
    size: string;
    date: string;
    party: string;
    previewUrl?: string;
    issuedDate?: string;
    expiryDate?: string;
  }>>([]);
  const [documentTypes, setDocumentTypes] = useState<string[]>([
    "National ID Copy", "Passport", "Corporate Registration", "Power Of Attorney", "Survey Certificate", "Insurance Certificate", "Trade License"
  ]);
  const [newCustomDocType, setNewCustomDocType] = useState("");
  const [uploadSelectedParty, setUploadSelectedParty] = useState("Party A");

  const [showUploadModal, setShowUploadModal] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState(false);

  // Attachment upload form states & validations
  const [tempDocType, setTempDocType] = useState<string>("");
  const [tempIssuedDate, setTempIssuedDate] = useState<string>("");
  const [tempExpiryDate, setTempExpiryDate] = useState<string>("");
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [tempFileName, setTempFileName] = useState<string>("");
  const [tempFileSize, setTempFileSize] = useState<string>("");
  const [tempPreviewUrl, setTempPreviewUrl] = useState<string>("");
  const [tempValidationError, setTempValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (showUploadModal) {
      setTempDocType(showUploadModal);
      setTempIssuedDate("");
      setTempExpiryDate("");
      setTempFile(null);
      setTempFileName("");
      setTempFileSize("");
      setTempPreviewUrl("");
      setTempValidationError(null);
    }
  }, [showUploadModal]);

  // Sidebar collapsible state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- CONTRACT DEPLOYMENT CREDIT SYSTEM ---
  const [creditsBalance, setCreditsBalance] = useState<number>(100); // Default placeholder
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [purchaseHistory, setPurchaseHistory] = useState<Array<{ date: string; packet: string; credits: number; price: string }>>([
    { date: "2026-06-12", packet: "Professional Pack", credits: 500, price: "$100" },
    { date: "2026-05-14", packet: "Starter Pack", credits: 100, price: "$25" }
  ]);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [isCreditsLoading, setIsCreditsLoading] = useState<boolean>(true);
  const [isPaymentMethodValid, setIsPaymentMethodValid] = useState<boolean>(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Auto-generate QR code when verificationCode changes
  useEffect(() => {
    const generateQrCode = async () => {
      try {
        const verifyUrl = `${window.location.origin}?verify=${contractFields.verificationCode || '8A7F-31CC-0E2A-5501-7F03'}`;
        const url = await QRCode.toDataURL(verifyUrl, {
          margin: 1,
          width: 250,
          color: {
            dark: '#0f172a', // Clean dark slate
            light: '#ffffff' // Pure white background
          }
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("Auto QR generation failed:", err);
      }
    };
    generateQrCode();
  }, [contractFields.verificationCode]);

  // Sync with Firestore
  useEffect(() => {
    if (!company?.id) {
      setIsCreditsLoading(false);
      return;
    }

    const loadCreditsAndHistory = async () => {
      try {
        setIsCreditsLoading(true);
        const compRef = doc(db, "companies", company.id);
        const compSnap = await getDoc(compRef);

        if (compSnap.exists()) {
          const data = compSnap.data();
          
          // If no credits system exists yet, initialize it with a starting free grant (AgentPlace style)
          if (data.contractCredits === undefined) {
            const initialCredits = 100;
            const initialHistory = [
              { date: new Date().toISOString().split('T')[0], packet: "Starting Free Grant (AgentPlace style)", credits: 100, price: "$0" }
            ];

            await setDoc(compRef, {
              contractCredits: initialCredits,
              creditPurchaseHistory: initialHistory,
              isPaymentMethodValid: true
            }, { merge: true });

            setCreditsBalance(initialCredits);
            setPurchaseHistory(initialHistory);
            setIsPaymentMethodValid(true);
          } else {
            setCreditsBalance(data.contractCredits ?? 0);
            setPurchaseHistory(data.creditPurchaseHistory ?? []);
            setIsPaymentMethodValid(data.isPaymentMethodValid !== false);
          }
        } else {
          // If company doc doesn't exist, create it with default starter values
          const initialCredits = 100;
          const initialHistory = [
            { date: new Date().toISOString().split('T')[0], packet: "Starting Free Grant (AgentPlace style)", credits: 100, price: "$0" }
          ];
          await setDoc(compRef, {
            id: company.id,
            name: company.name || "GLOBAL DYNAMICS LTD",
            contractCredits: initialCredits,
            creditPurchaseHistory: initialHistory,
            isPaymentMethodValid: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setCreditsBalance(initialCredits);
          setPurchaseHistory(initialHistory);
          setIsPaymentMethodValid(true);
        }
      } catch (err) {
        console.error("Error loading credit details from Firestore:", err);
      } finally {
        setIsCreditsLoading(false);
      }
    };

    loadCreditsAndHistory();
  }, [company?.id]);

  // Fetch contracts list from Firestore in real-time
  useEffect(() => {
    if (!company?.id) {
      setLoadingContracts(false);
      return;
    }
    setLoadingContracts(true);
    const q = query(collection(db, "contracts"), where("userId", "==", company.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contractsList: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Ensure partyA and partyB are objects in the final contract item for editor compatibility
        const finalPartyA = data.partyA || { name: data.seller || "Party A", role: "Seller", email: "", address: "", idNumber: "", confirmEmail: false, additionalEmails: [] };
        const finalPartyB = data.partyB || { name: data.buyer || "Party B", role: "Buyer", email: "", address: "", idNumber: "", confirmEmail: false, additionalEmails: [] };
        
        // Get string names for display/search
        const sellerName = data.seller || finalPartyA.name || "Party A";
        const buyerName = data.buyer || finalPartyB.name || "Party B";

        contractsList.push({
          ...data,
          id: docSnap.id,
          title: data.title || "Untitled Contract",
          type: data.agreementType || "Service Agreement",
          seller: sellerName,
          buyer: buyerName,
          partyA: finalPartyA,
          partyB: finalPartyB,
          date: data.updatedAt ? data.updatedAt.split('T')[0] : (data.createdAt ? data.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          status: data.status?.toLowerCase() === 'executed' ? 'executed' : 'draft',
          value: data.contractValue || "0"
        });
      });
      // Sort by updatedAt desc
      contractsList.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setDbContracts(contractsList);
      setLoadingContracts(false);
    }, (error) => {
      console.error("Error loading contracts from Firestore:", error);
      setLoadingContracts(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Auto-save contract draft back to Firestore with debounce
  useEffect(() => {
    if (!activeContractId || !company?.id || workflowStep !== 'editor') return;

    const saveTimeout = setTimeout(async () => {
      try {
        const contractRef = doc(db, "contracts", activeContractId);
        await updateDoc(contractRef, {
          title: foundation.title,
          agreementType: foundation.type,
          seller: partyA.name,
          buyer: partyB.name,
          contractValue: foundation.value,
          currency: foundation.currency,
          status: isExecuted ? "executed" : "draft",
          version: currentVersion,
          updatedAt: new Date().toISOString(),
          foundation,
          jurisdiction,
          partyA,
          partyB,
          contractFields,
          participants,
          clauses
        });
        console.log("Draft auto-saved successfully to Firestore.");
      } catch (err) {
        console.error("Error auto-saving contract draft:", err);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(saveTimeout);
  }, [
    activeContractId,
    foundation,
    jurisdiction,
    partyA,
    partyB,
    contractFields,
    participants,
    clauses,
    isExecuted,
    currentVersion,
    workflowStep,
    company?.id
  ]);

  const buyCredits = async (credits: number, packetName: string, price: string) => {
    if (!company?.id) return;
    try {
      const newBalance = creditsBalance + credits;
      const newHistoryEntry = { 
        date: new Date().toISOString().split('T')[0], 
        packet: packetName, 
        credits, 
        price 
      };
      const updatedHistory = [newHistoryEntry, ...purchaseHistory];

      // 1) Update Firestore credits balance and history
      const compRef = doc(db, "companies", company.id);
      await updateDoc(compRef, {
        contractCredits: newBalance,
        creditPurchaseHistory: updatedHistory
      });

      // 2) Write an instant Invoice document record to the documents subcollection!
      const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const docRef = collection(db, "companies", company.id, "documents");
      await addDoc(docRef, {
        documentId: invoiceId,
        documentType: "Invoice",
        workflowId: `credits-refill-${Date.now()}`,
        companyId: company.id,
        status: "paid",
        creditsAdded: credits,
        packet: packetName,
        pricePaid: price,
        createdAt: new Date().toISOString()
      });

      setCreditsBalance(newBalance);
      setPurchaseHistory(updatedHistory);
      setPurchaseSuccessMessage(`Hesabınıza başarıyla ${credits} Kredi tanımlandı ve fatura anında tanzim edildi! (${packetName})`);
      setTimeout(() => setPurchaseSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Error purchasing credits:", err);
      console.error("Credits purchase failed:", err);
      // alert("Credits purchase failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const togglePaymentMethodValid = async () => {
    if (!company?.id) return;
    try {
      const targetState = !isPaymentMethodValid;
      const compRef = doc(db, "companies", company.id);
      await updateDoc(compRef, {
        isPaymentMethodValid: targetState
      });
      setIsPaymentMethodValid(targetState);
    } catch (err) {
      console.error("Error updating payment validity toggle:", err);
    }
  };

  const getContractCost = (type: string): number => {
    const costMap: { [key: string]: number } = {
      "Sale Agreement": 10,
      "Purchase Agreement": 10,
      "Commercial Service Agreement": 2,
      "Supply Agreement": 2,
      "Framework Agreement": 2,
      "Master Services Agreement (MSA)": 2,
      "Commercial Cooperation Agreement": 2,
      "Strategic Partnership Agreement": 2,
      "Joint Venture Agreement": 2,
      "Revenue Sharing Agreement": 2,
      "Referral Agreement": 2,
      "Commission Agreement": 2,
      "Brokerage Agreement": 3,
      "Yacht Brokerage Agreement": 3,
      "Vessel Brokerage Agreement": 3,
      "Commercial Representation Agreement": 3,
      "Sales Representation Agreement": 3,
      "Exclusive Representation Agreement": 3,
      "Non-Exclusive Representation Agreement": 3,
      "Agency Agreement": 3,
      "Exclusive Agency Agreement": 3,
      "Regional Agency Agreement": 3,
      "Global Agency Agreement": 3,
      "Sales Authorization Agreement": 3,
      "Exclusive Sales Authorization Agreement": 3,
      "Vessel Sales Authorization Agreement": 3,
      "Charter Sales Authorization Agreement": 3,
      "Listing Authorization Agreement": 3,
      "Yacht Listing Agreement": 3,
      "Commercial Listing Agreement": 3,
      "Distribution Agreement": 3,
      "Exclusive Distribution Agreement": 3,
      "Regional Distribution Agreement": 3,
      "Global Distribution Agreement": 3,
      "Dealer Agreement": 3,
      "Exclusive Dealer Agreement": 3,
      "Authorized Dealer Agreement": 3,
      "Reseller Agreement": 3,
      "Value Added Reseller Agreement (VAR)": 3,
      "Yacht Sale Agreement": 10,
      "Vessel Sale Agreement": 10,
      "Purchase Reservation Agreement": 3,
      "Deposit Agreement": 3,
      "Memorandum of Agreement (MOA)": 5,
      "Sea Trial Agreement": 3,
      "Delivery Acceptance Agreement": 3,
      "Charter Agreement": 4,
      "Bareboat Charter Agreement": 4,
      "Crewed Charter Agreement": 4,
      "Seasonal Charter Agreement": 4,
      "Charter Management Agreement": 4,
      "Charter Marketing Agreement": 4,
      "Charter Representation Agreement": 4,
      "Shipbuilding Agreement": 8,
      "New Build Agreement": 8,
      "Refit Agreement": 5,
      "Retrofit Agreement": 5,
      "Engineering Agreement": 3,
      "Manufacturing Agreement": 4,
      "OEM Agreement": 4,
      "Equipment Supply Agreement": 3,
      "Spare Parts Agreement": 2,
      "Warranty Agreement": 2,
      "Commissioning Agreement": 3,
      "Dry Dock Agreement": 5,
      "Marina Services Agreement": 3,
      "Berthing Agreement": 3,
      "Annual Berthing Agreement": 4,
      "Port Services Agreement": 3,
      "Vessel Management Agreement": 5,
      "Technical Management Agreement": 5,
      "Fleet Management Agreement": 5,
      "Operational Support Agreement": 3,
      "Crew Employment Agreement": 3,
      "Captain Employment Agreement": 3,
      "Crew Placement Agreement": 3,
      "Crew Management Agreement": 3,
      "Maritime Employment Agreement": 3,
      "Contractor Agreement": 2,
      "Independent Consultant Agreement": 2,
      "Legal Services Agreement": 3,
      "Retainer Agreement": 3,
      "Direct Settlement Agreement": 5,
      "Financing Agreement": 5,
      "Loan Agreement": 4,
      "Insurance Agreement": 3,
      "Advisory Agreement": 3,
      "Due Diligence Agreement": 3,
      "Compliance Agreement": 3,
      "Survey Agreement": 3,
      "Condition Survey Agreement": 3,
      "Pre-Purchase Survey Agreement": 3,
      "Valuation Survey Agreement": 3,
      "Inspection Agreement": 3,
      "Classification Agreement": 4,
      "Certification Agreement": 4,
      "Audit Agreement": 3,
      "Verification Agreement": 3,
      "Software License Agreement": 3,
      "SaaS Agreement": 3,
      "API Access Agreement": 3,
      "Data Processing Agreement": 2,
      "Managed Services Agreement": 3,
      "White Label Agreement": 4,
      "Cybersecurity Agreement": 4,
      "NDA": 1,
      "Mutual NDA": 1,
      "Non-Circumvention Agreement": 1,
      "Non-Compete Agreement": 1,
      "Confidentiality Agreement": 1,
      "Intellectual Property Agreement": 1
    };
    return costMap[type] || 2; // Default is 2 credits
  };

  // Gemini AI Advisor States
  const [advisorMessages, setAdvisorMessages] = useState<any[]>([
    {
      role: 'model',
      text: "Hello, I am the Corporate Sovereign AI Advisor. I specialize in legal commerce structures and secure trade protocols. I am synchronously tracking your active document flow and will adapt objectively to assist you when queried. How may I be of service?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sectionName: sections[0]
    }
  ]);
  const [advisorInput, setAdvisorInput] = useState('');
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
  const [advisorFeedbackText, setAdvisorFeedbackText] = useState("");

  const getMacroStepIndex = (sec: string): number => {
    if (sec === 'Commercial Foundation') return 0;
    if (['Parties', 'Participants'].includes(sec)) return 1;
    if (sec === 'Deliverables') return 2;
    if (sec === 'Signatures') return 4;
    return 3;
  };

  const isSectionCompleted = (secName: string): boolean => {
    switch (secName) {
      case "Commercial Foundation":
        return !!foundation.title && !!foundation.description;
      case "Parties":
        return !!partyA.name && !!partyB.name;
      case "Participants":
        return participants.length > 0;
      case "Deliverables":
        return !!contractFields.deliverables;
      case "Commercial Terms":
        return !!contractFields.commercialTerms;
      case "Payment Terms":
        return !!contractFields.paymentTerms;
      case "Delivery Terms":
        return !!contractFields.deliveryLocation;
      case "Warranty":
        return !!contractFields.warrantyScope;
      case "Liability":
        return !!contractFields.liabilityLimit;
      case "Confidentiality":
        return !!contractFields.confidentialityDuration;
      case "Termination":
        return !!contractFields.terminationNotice;
      case "Jurisdiction":
        return !!jurisdiction.law;
      case "Arbitration":
        return !!contractFields.arbitrationRules;
      case "Signatures":
        return isExecuted;
      case "Annexes":
        return !!contractFields.annexes;
      case "Attachments":
        return identityDocs.length > 0;
      case "Verification":
        return !!contractFields.verificationCode;
      case "Audit Trail":
        return !!contractFields.auditTrail;
      case "Contract AI Advisor":
        return true;
      default:
        return false;
    }
  };

  const handleAdvisorConsult = async (customQuery?: string) => {
    const query = customQuery || advisorInput;
    if (!query.trim()) return;

    setIsAdvisorLoading(true);
    setAdvisorInput('');
    const userMsg = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sectionName: activeSection
    };
    setAdvisorMessages(prev => [...prev, userMsg]);

    const historyForGemini = [...advisorMessages, userMsg].map(m => ({
      role: (m.role === 'model' ? 'model' : 'user') as 'user' | 'model',
      text: m.text
    }));

    try {
      const response = await chatWithContractAdvisor(
        query,
        historyForGemini,
        activeSection,
        {
          foundation,
          jurisdiction,
          partyA,
          partyB,
          contractFields,
          participants
        }
      );

      const botMsg = {
        role: 'model',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sectionName: activeSection
      };

      setAdvisorMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg = {
        role: 'model',
        text: "Hata: Mesaj iletilemedi. Lütfen internet bağlantısını kontrol edip tekrar deneyiniz.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sectionName: activeSection
      };
      setAdvisorMessages(prev => [...prev, errMsg]);
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const [showBillingWallModal, setShowBillingWallModal] = useState(false);

  const handleExecute = async () => {
    if (!isPaymentMethodValid) {
      console.error("Hata: Firmanın ödeme yöntemi geçerli değil veya yetkilendirilmemiş!");
      // alert("Hata: Firmanın ödeme yöntemi geçerli değil veya yetkilendirilmemiş! Lütfen fatura alanından kartınızı güncelleyin.");
      return;
    }

    const cost = getContractCost(foundation.type);
    if (creditsBalance < cost) {
      setShowBillingWallModal(true);
      return;
    }

    try {
      const newBalance = creditsBalance - cost;

      // 1) Update Firestore credits balance
      if (company?.id) {
        const compRef = doc(db, "companies", company.id);
        await updateDoc(compRef, {
          contractCredits: newBalance
        });

        // 2) Create a record invoice/document inside companies/{companyId}/documents
        const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
        const docRef = collection(db, "companies", company.id, "documents");
        await addDoc(docRef, {
          documentId: invoiceId,
          documentType: "Contract Deployment Charge",
          workflowId: `deploy-charge-${Date.now()}`,
          companyId: company.id,
          status: "paid",
          creditsDeducted: cost,
          contractTitle: foundation.title,
          createdAt: new Date().toISOString()
        });

        // 3) Create or update record in contracts collection so it shows up in RepositoryView
        if (activeContractId) {
          const contractRef = doc(db, "contracts", activeContractId);
          await updateDoc(contractRef, {
            status: 'executed',
            version: 'v5 Signed',
            updatedAt: new Date().toISOString()
          });
        } else {
          const contractsRef = collection(db, "contracts");
          await addDoc(contractsRef, {
            userId: company.id,
            title: foundation.title,
            agreementType: foundation.type || 'Service Agreement',
            seller: partyA.name,
            buyer: partyB.name,
            contractValue: foundation.value,
            currency: foundation.currency || 'USD',
            status: 'executed',
            version: 'v5 Signed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        try {
          await logAuditEvent(company.id, `Contract Executed & Signed: ${foundation.title}`, foundation.title);
        } catch (logErr) {
          console.error("Execution log failed:", logErr);
        }
      }

      setCreditsBalance(newBalance);
      setIsExecuted(true);
      setShowExecutionModal(true);
      setExecutionState('signing');
      
      // Prepare targeted emails to send based on current inputs and active participants list
      const targets: Array<{ email: string; role: string; name: string; status: 'sending' | 'sent' }> = [
        { email: partyA.email || 'party-a@shipping-node.com', role: 'Party A (Primary Sponsor)', name: partyA.name || 'Party A', status: 'sending' },
        { email: partyB.email || 'party-b@ocean-carrier.com', role: 'Party B (Contracting Sponsor)', name: partyB.name || 'Party B', status: 'sending' }
      ];
      
      // Expand list with any dynamic participants added by the participant engine
      participants.forEach((p, idx) => {
        if (p.contact) {
          targets.push({
            email: p.contact,
            role: p.role || 'Contract Participant',
            name: p.name || `iştirakçi_${idx + 1}`,
            status: 'sending'
          });
        }
      });
      
      setEmailStatus(targets);

      // Progress flow:
      // 1) Cryptographic Ledger Signing (1.5 seconds)
      // 2) Progressive email dispatch (900ms per target)
      // 3) Complete state
      setTimeout(() => {
        setExecutionState('sending_emails');
        
        targets.forEach((target, index) => {
          setTimeout(() => {
            setEmailStatus(current => 
              current.map(item => 
                item.email === target.email ? { ...item, status: 'sent' } : item
              )
            );
            
            if (index === targets.length - 1) {
              setTimeout(() => {
                setExecutionState('completed');
              }, 800);
            }
          }, (index + 1) * 900);
        });
      }, 1500);
    } catch (err) {
      console.error("Error executing contract with credits:", err);
      console.error("Deduction failed:", err);
      // alert("Deduction failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const triggerUploadSimulation = (docType: string, filename: string, partyOwner: string, customSize?: string, customPreviewUrl?: string, issuedDate?: string, expiryDate?: string) => {
    let progress = 0;
    const progressKey = docType + "_" + partyOwner;
    setUploadProgress(prev => ({ ...prev, [progressKey]: progress }));
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          let finalPreviewUrl = customPreviewUrl;
          if (!finalPreviewUrl) {
            const isCard = docType.toLowerCase().includes("passport") || docType.toLowerCase().includes("id") || docType.toLowerCase().includes("national");
            const randomId = Math.floor(100000 + Math.random() * 900000);
            const currentDate = new Date().toISOString().split('T')[0];
            const secureHash = '0x' + Math.random().toString(16).substr(2, 8).toUpperCase();
            
            const svgContent = isCard ? `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 280" width="100%" height="100%">
  <rect width="450" height="280" rx="14" fill="#0c1524" stroke="#1e293b" stroke-width="2"/>
  <rect x="6" y="6" width="438" height="268" rx="10" fill="none" stroke="#19a7c1" stroke-width="1.5" stroke-opacity="0.25"/>
  <path d="M-50 140 C 100 80, 200 200, 500 140" fill="none" stroke="#19a7c1" stroke-width="0.7" stroke-opacity="0.15"/>
  <path d="M-50 165 C 100 110, 205 210, 500 165" fill="none" stroke="#22c55e" stroke-width="0.5" stroke-opacity="0.1"/>
  
  <rect x="15" y="15" width="420" height="40" rx="6" fill="#010610" opacity="0.9"/>
  <text x="25" y="38" fill="#19a7c1" font-family="monospace" font-size="9" font-weight="bold" letter-spacing="1">SECURE IDENTITY DEPLOYMENT</text>
  <text x="320" y="38" fill="#475569" font-family="monospace" font-size="8" font-weight="bold">INDEX # ${randomId}</text>
  
  <rect x="25" y="70" width="40" height="30" rx="4" fill="#d97706" stroke="#f59e0b" stroke-width="0.8"/>
  <line x1="38" y1="70" x2="38" y2="100" stroke="#f59e0b" stroke-width="0.5"/>
  <line x1="52" y1="70" x2="52" y2="100" stroke="#f59e0b" stroke-width="0.5"/>
  <line x1="25" y1="85" x2="65" y2="85" stroke="#f59e0b" stroke-width="0.5"/>
  <rect x="34" y="77" width="22" height="16" rx="2" fill="none" stroke="#f59e0b" stroke-width="0.5"/>

  <rect x="25" y="115" width="100" height="125" rx="6" fill="#020617" stroke="#1e293b" stroke-width="1.5"/>
  <circle cx="75" cy="160" r="22" fill="#1e293b"/>
  <path d="M 40 215 C 40 185, 110 185, 110 215 Z" fill="#1e293b"/>
  <circle cx="110" cy="210" r="16" fill="none" stroke="#22c55e" stroke-width="1" stroke-dasharray="2,2"/>
  <text x="104" y="213" fill="#22c55e" font-family="sans-serif" font-weight="extrabold" font-size="7">OK</text>
  
  <text x="145" y="80" fill="#64748b" font-family="sans-serif" font-size="7.5" font-weight="bold" letter-spacing="0.5">DOCUMENT CLASSIFICATION</text>
  <text x="145" y="96" fill="#f8fafc" font-family="sans-serif" font-size="11.5" font-weight="extrabold">${docType.toUpperCase()}</text>
  
  <text x="145" y="125" fill="#64748b" font-family="sans-serif" font-size="7.5" font-weight="bold" letter-spacing="0.5">AUTHORIZED DELEGATOR</text>
  <text x="145" y="141" fill="#22c55e" font-family="monospace" font-size="10.5" font-weight="bold">${partyOwner.toUpperCase()}</text>
  
  <text x="145" y="170" fill="#64748b" font-family="sans-serif" font-size="7.5" font-weight="bold" letter-spacing="0.5">SOURCE FILE COMPILATION</text>
  <text x="145" y="184" fill="#94a3b8" font-family="monospace" font-size="8.5" font-weight="medium">${filename}</text>
  
  <rect x="375" y="70" width="45" height="45" rx="4" fill="#ffffff" p="1"/>
  <rect x="379" y="74" width="37" height="37" fill="#000" opacity="0.1"/>
  
  <g opacity="0.6">
    <rect x="145" y="205" width="2" height="15" fill="#94a3b8"/>
    <rect x="150" y="205" width="1" height="15" fill="#94a3b8"/>
    <rect x="153" y="205" width="3" height="15" fill="#94a3b8"/>
    <rect x="158" y="205" width="1" height="15" fill="#94a3b8"/>
    <rect x="162" y="205" width="2" height="15" fill="#94a3b8"/>
    <text x="145" y="232" fill="#475569" font-family="monospace" font-size="7">${secureHash}</text>
  </g>

  <text x="290" y="235" fill="#19a7c1" font-family="serif" font-style="italic" font-size="11" opacity="0.4" font-weight="bold">Verified Security</text>
</svg>
` : `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 280" width="100%" height="100%">
  <rect width="450" height="280" rx="14" fill="#020617" stroke="#1e293b" stroke-width="2"/>
  <rect x="12" y="12" width="426" height="256" rx="8" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-opacity="0.3"/>
  <rect x="16" y="16" width="418" height="248" rx="6" fill="none" stroke="#19a7c1" stroke-width="0.5" stroke-dasharray="4,2" stroke-opacity="0.25"/>
  
  <circle cx="225" cy="55" r="20" fill="#111827" stroke="#19a7c1" stroke-width="1.5"/>
  <polygon points="225,42 230,53 242,53 232,60 236,71 225,64 214,71 218,60 208,53 220,53" fill="#19a7c1"/>
  
  <text x="225" y="98" text-anchor="middle" fill="#0f172a" font-family="serif" font-size="9" font-weight="bold" letter-spacing="1">CERTIFICATION OF DEPLOYED LEGALITY</text>
  
  <text x="225" y="125" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="7.5" font-weight="bold" letter-spacing="0.5">THIS COVENANT HEREBY CERTIFIES</text>
  <text x="225" y="146" text-anchor="middle" fill="#0c4a6e" font-family="sans-serif" font-size="11" font-weight="extrabold">${docType.toUpperCase()}</text>
  
  <text x="225" y="175" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="7.5" font-weight="bold" letter-spacing="0.5">DELEGATED SIGNATORY OR ENTITY</text>
  <text x="225" y="192" text-anchor="middle" fill="#22c55e" font-family="monospace" font-size="10.5" font-weight="bold" letter-spacing="0.5">${partyOwner.toUpperCase()}</text>
  
  <line x1="40" y1="215" x2="410" y2="215" stroke="#1e293b" stroke-width="1"/>
  
  <text x="50" y="235" fill="#475569" font-family="monospace" font-size="7">FILE: ${filename.length > 30 ? filename.slice(0, 27) + '...' : filename}</text>
  <text x="225" y="235" text-anchor="middle" fill="#475569" font-family="monospace" font-size="7">DATED: ${currentDate}</text>
  <text x="400" y="235" text-anchor="end" fill="#19a7c1" font-family="monospace" font-size="7" font-weight="bold">${secureHash}</text>
  
  <path d="M 12 40 L 40 12" stroke="#22c55e" stroke-width="2" stroke-opacity="0.4"/>
  <path d="M 438 40 L 410 12" stroke="#22c55e" stroke-width="2" stroke-opacity="0.4"/>
</svg>
`;
            finalPreviewUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgContent.trim())));
          }
 
          setIdentityDocs(prev => [
            ...prev,
            {
              id: 'doc_' + Math.random().toString(36).substr(2, 9),
              type: docType,
              name: filename,
              size: customSize || ((Math.random() * 1.8 + 0.5).toFixed(1) + " MB"),
              date: new Date().toISOString().split('T')[0],
              party: partyOwner,
              previewUrl: finalPreviewUrl,
              issuedDate,
              expiryDate
            }
          ]);
          setShowUploadModal(null);
        }, 150);
      }
      setUploadProgress(prev => ({ ...prev, [progressKey]: progress }));
    }, 80);
  };

  const handleDownload = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    setPdfProgress(0);

    try {
      const sheets = document.querySelectorAll('.contract-page-sheet');
      
      if (!sheets || sheets.length === 0) {
        console.warn("No .contract-page-sheet elements found, compiling text copy.");
        const content = `===========================================================
               DIGITAL COMMERCIAL AGREEMENT
===========================================================
Title: ${foundation.title}
Agreement Type: ${foundation.type}
Transaction Type: ${foundation.transactionType}
Reference Cryptographic ID: ${contractFields.verificationCode || "8A7F-31CC-0E2A-5501-7F03"}
Status: ${isExecuted ? "EXECUTED & VERIFIED ON LEDGER" : "DRAFT"}
Execution Date: ${new Date().toISOString().split('T')[0]}

-----------------------------------------------------------
PARTIES & COUNTERPARTIES
-----------------------------------------------------------
PARTY A (Primary Partner):
- Entity Name: ${partyA.name}
- Representative Role: ${partyA.role}
- Registered Email: ${partyA.email}

PARTY B (Commercial Counterparty):
- Entity Name: ${partyB.name}
- Representative Role: ${partyB.role}
- Registered Email: ${partyB.email}

-----------------------------------------------------------
SECTION 01: COMMERCIAL FOUNDATION METRICS
-----------------------------------------------------------
- Agreement Type: ${foundation.type}
- Subject Matter: ${foundation.subjectMatter}
- Primary Objective: ${foundation.objective}
- Value of Contract: ${foundation.currency} ${foundation.value}
- Pricing Model: ${foundation.commercialModel || "Fixed Price"}
- Invoicing Framework: ${foundation.paymentStructure || "100% Advance"}
- Geographic Scope: ${foundation.geoScope}
- Assigned Operating Area: ${foundation.operatingArea}
- Selected Service Locations: ${Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation.join(', ') : foundation.serviceLocation}
- Contract Duration: ${foundation.duration}
- Renewal Structure: ${foundation.renewalTerms}
- Notices Period: ${foundation.noticePeriod}
- Effective Commencement: ${foundation.effectiveDate}
- Expiration Milestone: ${foundation.expirationDate}

-----------------------------------------------------------
SECTION 04: DELIVERABLES & TECHNICAL SCOPE
-----------------------------------------------------------
Scope of Goods/Services:
${contractFields.deliverables}

Milestones & Timelines:
${contractFields.milestones}

-----------------------------------------------------------
SECTION 05: COMMERCIAL & PRICING REGULATORY TERMS
-----------------------------------------------------------
Commercial Terms:
${contractFields.commercialTerms}

Surcharges / Demurrage:
${contractFields.surcharges}

-----------------------------------------------------------
SECTION 06: PAYMENT TERMS
-----------------------------------------------------------
Payment Invoicing Procedures:
${contractFields.paymentTerms}

Payment Methods:
${contractFields.paymentMethod}

-----------------------------------------------------------
SECTION 07: DELIVERY & LOGISTICAL INCOTERMS
-----------------------------------------------------------
- Incoterms 2020: ${contractFields.incoterms}
- Assigned Logistical Terminal: ${contractFields.deliveryLocation}

-----------------------------------------------------------
SECTION 08: WARRANTY & CUSTOMER SERVICE STANDARDS
-----------------------------------------------------------
- Active Warranty Period: ${contractFields.warrantyPeriod}
Details:
${contractFields.warrantyScope}

-----------------------------------------------------------
SECTION 10: LIMITATION OF LIABILITY
-----------------------------------------------------------
- Liability Cap: ${contractFields.liabilityLimit}
- Consequential Damages Waiver: ${contractFields.consequentialDamages}

-----------------------------------------------------------
SECTION 11: CONFIDENTIALITY & NON-DISCLOSURE
-----------------------------------------------------------
- NDA Duration Profile: ${contractFields.confidentialityDuration}

-----------------------------------------------------------
SECTION 12: DISENGAGEMENT & TERMINATION POLICY
-----------------------------------------------------------
Notice Terms & Effects:
${contractFields.terminationNotice}

-----------------------------------------------------------
SECTION 13: GOVERNING LAW & ARBITRATION TRIBUNAL
-----------------------------------------------------------
- Applicable Substantive Law: ${jurisdiction.law}
- Place / Seat of Arbitration: ${jurisdiction.seat}
- Registry Institution: ${jurisdiction.institution}
- Dispute Resolution Rules:
${contractFields.arbitrationRules}

-----------------------------------------------------------
SECTION 14: SIGNATURES & VERIFICATION RECORD
-----------------------------------------------------------
[DIGITAL IDENTITY SECURE SIGNATURE RECORD]

Primary Entity Representative (${partyA.role}):
Representative Code: ${partyA.name.replace(/\s+/g, '_').substring(0, 10).toUpperCase()}
Direct Contact: ${partyA.email}
Sign State: ${isExecuted ? "Verified Digital Signature ✓" : "Pending Signature"}
Verification Log: ${isExecuted ? "MATCHED SECURE CHAIN RECORD" : "UNMATCHED"}

Counterparty Representative (${partyB.role}):
Representative Code: ${partyB.name.replace(/\s+/g, '_').substring(0, 10).toUpperCase()}
Direct Contact: ${partyB.email}
Sign State: ${isExecuted ? "Verified Digital Signature ✓" : "Pending Signature"}
Verification Log: ${isExecuted ? "MATCHED SECURE CHAIN RECORD" : "UNMATCHED"}

-----------------------------------------------------------
SECTION 15: ATTACHED ANNEXES & SCHEDULE DETAILS
-----------------------------------------------------------
${contractFields.annexes}

-----------------------------------------------------------
SECTION 18: BLOCK LEDGER RECORD AUDIT TRAIL
-----------------------------------------------------------
${contractFields.auditTrail}
===========================================================`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VERIFIED_CONTRACT_${foundation.title.replace(/\s+/g, "_")}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsGeneratingPDF(false);
        return;
      }

      // High precision multi-page setup
      // A4 is 210mm x 297mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const totalSheets = sheets.length;
      for (let i = 0; i < totalSheets; i++) {
        setPdfProgress(Math.round(((i + 0.1) / totalSheets) * 100));
        const sheetElement = sheets[i] as HTMLElement;

        // Briefly wait to let layout sit perfectly
        await new Promise((r) => setTimeout(r, 60));

        const canvas = await html2canvas(sheetElement, {
          scale: 2, // 2x density is crystal-clear for PDF text printing
          useCORS: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          width: 800,
          height: 1131,
          windowWidth: 800,
          windowHeight: 1131,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
        setPdfProgress(Math.round(((i + 1) / totalSheets) * 100));
      }

      pdf.save(`DIGITAL_CONTRACT_${foundation.title.replace(/\s+/g, "_") || "DOCUMENT"}.pdf`);
    } catch (err) {
      console.error("PDF generator failure:", err);
      console.warn("PDF compilation sandbox error. Falling back to secure download.");
      // alert("A system sandbox error occurred during PDF compiling. Falling back to secure raw copy download.");
      const textFallback = `FALLBACK SECURE CODE CONSOLE COPY`;
      const fallbackBlob = new Blob([textFallback], { type: 'text/plain;charset=utf-8' });
      const fallbackUrl = URL.createObjectURL(fallbackBlob);
      const fallbackLink = document.createElement('a');
      fallbackLink.href = fallbackUrl;
      fallbackLink.download = `FALLBACK_CONTRACT_${foundation.title.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(0);
    }
  };

  const runAdvisor = async (task: string) => {
    setAiState({ task, status: 'loading' });
    try {
      const promptMap: { [key: string]: string } = {
        "Clause Review": "Please analyze all sections in the contract fields and conduct a clause-by-clause legal review.",
        "Risk Detection": "Within the framework of international maritime trade law, detect contradictions, loopholes, and high-level risks in the existing draft one by one.",
        "Jurisdiction Analysis": "Analyze the contract's choice of jurisdiction and governing law based on existing information from the perspective of maritime arbitration (especially LMAA) rules.",
        "Classification Compliance": "Examine the compliance of the delivery and warranty terms in the contract with standard surveyor and classification audits of international classification societies like DNV, Lloyd's Register.",
        "Flag State Considerations": "Address the relationship of all parties with the flag state registration of the subject vessel and maritime administrative requirements, along with liability boundaries.",
        "Sanctions Screening Alerts": "Provide a maritime trade sanctions status analysis of the parties within the scope of sanctions lists (OFAC, EU, UN) and suggest standard logistics protective clauses to be appended.",
        "Redline Analysis": "Identify potential revision sections (redlines) in the agreement, listing sentences that require revision with their original and recommended versions."
      };

      const query = promptMap[task] || `Please perform the operation "${task}" in detail on this agreement.`;
      
      const response = await chatWithContractAdvisor(
        query,
        [],
        activeSection,
        {
          foundation,
          jurisdiction,
          partyA,
          partyB,
          contractFields,
          participants
        }
      );
      setAiState({ task, status: 'complete', result: response });
    } catch (err) {
      console.error(err);
      setAiState({ task, status: 'complete', result: "A connection error occurred. Please check your Gemini API configuration and try again." });
    }
  };

  const inputClass = "w-full h-10 bg-[#2D354B] border border-white/10 rounded-lg p-3 text-[13px] text-white placeholder-slate-400 focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 outline-none transition-all shadow-inner font-inter";
  const selectClass = "w-full h-10 bg-[#242B3B] border border-white/5 rounded-lg p-2 text-[13px] text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none font-inter";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-manrope";
  const sectionTitleClass = "text-[16px] font-bold text-white uppercase tracking-wide mb-6 border-b border-white/5 pb-3 font-manrope";
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleNewContract = async () => {
    if (!company?.id) return;
    try {
      const newDocRef = doc(collection(db, "contracts"));
      const initialFoundation = {
        type: "Service Agreement",
        title: "Eastern Mediterranean Technical Service Agreement",
        transactionType: "Maintenance",
        subjectMatter: "Provision of marine engineering and technical operational support services.",
        objective: "To maintain optimal operational efficiency of the vessel fleet.",
        description: "This Agreement establishes the commercial framework between the parties for the provision of marine engineering, technical support, maintenance, and operational consulting services for vessels operating within the designated region.",
        value: "5,000,000",
        currency: "USD",
        geoScope: "Eastern Mediterranean",
        operatingArea: "Aegean Sea & Levant Basin",
        serviceLocation: "Greece & Cyprus Ports",
        duration: "24 Months",
        effectiveDate: "2026-06-14",
        expirationDate: "2028-06-13",
        renewalTerms: "Automatic Renewal",
        noticePeriod: "90 Days"
      };
      const initialJurisdiction = {
        law: "England & Wales",
        seat: "London",
        institution: "LMAA"
      };
      const initialPartyA = {
        name: company.name || "GLOBAL DYNAMICS LTD",
        role: "Seller",
        email: company.email || "owner@global-dynamics.com",
        address: "",
        idNumber: "",
        confirmEmail: false,
        additionalEmails: []
      };
      const initialPartyB = {
        name: "ARGENTO MARINE",
        role: "Buyer",
        email: "legal@argentomarine.com",
        address: "",
        idNumber: "",
        confirmEmail: false,
        additionalEmails: []
      };
      const initialContractFields = {
        deliverables: "Provision of marine engineering, dry docking oversight, and technical operational diagnostics for the designated container fleet. Includes technical consultant site audits at all operating service locations.",
        milestones: `Milestone 1: Preliminary Site Inspection (End of Month 1)
Milestone 2: Critical Asset Diagnostic (Month 3)
Milestone 3: Fleet Maintenance Deployment (Ongoing)`,
        commercialTerms: "Base service pricing is calculated on a modular structure with optional operational hours priced according to standard Annex rates. Direct procurement materials are billed separately with a 5% handling surcharge.",
        surcharges: "Demurrage claims and vessel waiting time caps are subject to a maximum threshold of $15,000 per 24-hour cycle.",
        paymentTerms: "Payment is payable monthly in advance on receipt of corresponding company service invoice. Invoices must list the detailed breakdown of technical resources deployed in the field.",
        paymentMethod: "SWIFT Wire Transfer / Confirmed Irrevocable Letter of Credit (LC)",
        incoterms: "DDP (Delivered Duty Paid)",
        deliveryLocation: "Piraeus Port & Limassol Terminal",
        warrantyPeriod: "12 Months from completion",
        warrantyScope: "Guarantee of technical operational integrity, service quality and spare parts procurement compliance with leading classification society regulations.",
        liabilityLimit: "100% of Contract Value",
        consequentialDamages: "Excluded by mutual waiver",
        confidentialityDuration: "60 Months standard non-disclosure scope from agreement expiration",
        terminationNotice: "90 Days written notice for convenience by either party.",
        arbitrationRules: "LMAA Terms 2021 & standard Arbitrators Rules",
        annexes: `Annex A: Vessel Fleet Allocation Matrix
Annex B: Hourly Fee Rates and Overtime Standards`,
        verificationCode: `VERIFY-${Math.floor(1000 + Math.random() * 9000)}`,
        auditTrail: `1. Record Initialized: ${new Date().toISOString().replace('T', ' ').substring(0, 16)} UTC
2. AI Risk Screened: Pending
3. Compliance Certificate pending`
      };
      const initialParticipants = [
        { id: 'p1', name: "DNV Classification Society", role: "Classification and Compliance Auditor", contact: "dnv-compliance@dnv.com" },
        { id: 'p2', name: "Standard Chartered Settlement Router", role: "Direct Settlement & Payment Custodian", contact: "settle@sc.com" }
      ];
      const initialClauses = generateInitialClauses({
        agreementType: initialFoundation.type,
        seller: initialPartyA.name,
        buyer: initialPartyB.name,
        contractValue: initialFoundation.value,
        currency: initialFoundation.currency,
        jurisdiction: initialJurisdiction.law,
        arbitrationSeat: initialJurisdiction.seat,
        deliveryPort: initialContractFields.deliveryLocation,
        broker: "XYZ Brokerage"
      });

      const contractData = {
        userId: company.id,
        title: initialFoundation.title,
        agreementType: initialFoundation.type,
        seller: initialPartyA.name,
        buyer: initialPartyB.name,
        contractValue: initialFoundation.value,
        currency: initialFoundation.currency,
        status: "draft",
        version: "v1 Generated",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        foundation: initialFoundation,
        jurisdiction: initialJurisdiction,
        partyA: initialPartyA,
        partyB: initialPartyB,
        contractFields: initialContractFields,
        participants: initialParticipants,
        clauses: initialClauses
      };

      await setDoc(newDocRef, contractData);

      try {
        await logAuditEvent(company.id, `Contract Draft Created: ${initialFoundation.title}`, initialFoundation.title);
      } catch (logErr) {
        console.error("New contract draft log failed:", logErr);
      }

      setActiveContractId(newDocRef.id);
      setFoundation(initialFoundation);
      setJurisdiction(initialJurisdiction);
      setPartyA(initialPartyA);
      setPartyB(initialPartyB);
      setContractFields(initialContractFields);
      setParticipants(initialParticipants);
      setClauses(initialClauses);
      setIsExecuted(false);
      setCurrentVersion("v1 Generated");
      setWorkflowStep('editor');
    } catch (err) {
      console.error("Error creating new contract draft:", err);
    }
  };

  const loadContractIntoEditor = (contract: any) => {
    setActiveContractId(contract.id);
    
    if (company?.id && contract.id) {
      logAuditEvent(company.id, `Loaded contract in editor: ${contract.title || contract.id}`, contract.title || contract.id || "Contract Editor").catch(err => {
        console.error("Log resume draft audit failed:", err);
      });
    }
    
    if (contract.foundation) {
      setFoundation(contract.foundation);
    } else {
      setFoundation({
        type: contract.agreementType || "Service Agreement",
        title: contract.title || "Eastern Mediterranean Technical Service Agreement",
        value: contract.contractValue || "0",
        currency: contract.currency || "USD",
        transactionType: contract.transactionType || "Maintenance",
        subjectMatter: contract.subjectMatter || "",
        objective: contract.objective || "",
        description: contract.description || "",
        geoScope: contract.geoScope || "",
        operatingArea: contract.operatingArea || "",
        serviceLocation: contract.serviceLocation || "",
        duration: contract.duration || "",
        effectiveDate: contract.effectiveDate || "",
        expirationDate: contract.expirationDate || "",
        renewalTerms: contract.renewalTerms || "",
        noticePeriod: contract.noticePeriod || ""
      });
    }

    if (contract.jurisdiction) {
      setJurisdiction(contract.jurisdiction);
    } else {
      setJurisdiction({
        law: contract.applicableLaw || "English Law",
        seat: contract.arbitrationSeat || "London",
        institution: contract.arbitrationInstitution || "LMAA"
      });
    }

    if (contract.partyA) {
      setPartyA(contract.partyA);
    } else {
      setPartyA({
        name: contract.seller || company?.name || "GLOBAL DYNAMICS LTD",
        role: "Seller",
        email: company?.email || "owner@global-dynamics.com",
        address: "",
        idNumber: "",
        confirmEmail: false,
        additionalEmails: []
      });
    }

    if (contract.partyB) {
      setPartyB(contract.partyB);
    } else {
      setPartyB({
        name: contract.buyer || "ARGENTO MARINE",
        role: "Buyer",
        email: "legal@argentomarine.com",
        address: "",
        idNumber: "",
        confirmEmail: false,
        additionalEmails: []
      });
    }

    if (contract.contractFields) {
      setContractFields(contract.contractFields);
    }

    if (contract.participants) {
      setParticipants(contract.participants);
    }

    if (contract.clauses) {
      setClauses(contract.clauses);
    } else {
      const initialClauses = generateInitialClauses({
        agreementType: contract.agreementType || "Service Agreement",
        seller: contract.seller || "GLOBAL DYNAMICS LTD",
        buyer: contract.buyer || "ARGENTO MARINE",
        contractValue: contract.contractValue || "0",
        currency: contract.currency || "USD",
        jurisdiction: contract.applicableLaw || "English Law",
        arbitrationSeat: contract.arbitrationSeat || "London",
        deliveryPort: contract.deliveryLocation || "Piraeus Port",
        broker: contract.broker || "XYZ Brokerage"
      });
      setClauses(initialClauses);
    }

    setIsExecuted(contract.status === 'executed');
    setCurrentVersion(contract.version || 'v1 Generated');
    setWorkflowStep('editor');
  };

  // Load contract from URL query parameters (?id=...) if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contractIdFromUrl = urlParams.get('id');

    if (contractIdFromUrl && contractIdFromUrl !== activeContractId && company?.id) {
      const loadFromDb = async () => {
        try {
          const docRef = doc(db, 'contracts', contractIdFromUrl);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userId === company.id) {
              loadContractIntoEditor({ id: docSnap.id, ...data });
              setWorkflowStep('editor');
            } else {
              console.error("Access denied: You do not own this contract draft.");
              setWorkflowStep('hub');
              window.history.pushState(null, '', '/new-contract');
            }
          } else {
            console.error("Contract draft not found in Firestore registry.");
          }
        } catch (err) {
          console.error("Failed to load contract from URL param:", err);
        }
      };
      loadFromDb();
    }
  }, [activeContractId, company?.id]);

  // Synchronize browser URL query parameters with active editor state
  useEffect(() => {
    if (workflowStep === 'hub') {
      if (window.location.pathname === '/new-contract' && window.location.search) {
        window.history.pushState(null, '', '/new-contract');
      }
      setActiveContractId(null);
    } else if (workflowStep === 'editor' && activeContractId) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('id') !== activeContractId) {
        window.history.pushState(null, '', `/new-contract?id=${activeContractId}`);
      }
    }
  }, [workflowStep, activeContractId]);

  if (workflowStep === 'hub') {
    // Filter contracts based on search queries and dropdown filters
    const filteredData = dbContracts.filter(contract => {
      const matchesSearch = 
        contract.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.buyer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || contract.status === statusFilter;
      const matchesType = !typeFilter || contract.type.toLowerCase().includes(typeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesType;
    });

    let sortedData = [...filteredData];
    if (sortConfig !== null) {
      sortedData.sort((a, b) => {
        let valA = a[sortConfig.key as keyof typeof a] || '';
        let valB = b[sortConfig.key as keyof typeof a] || '';
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    const requestSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    };

    const toggleRow = (id: string) => {
      const newExpanded = new Set(expandedRows);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      setExpandedRows(newExpanded);
    };

    return (
      <div className="flex flex-col h-full w-full bg-[#040B18] text-[#E8EAED] p-8 overflow-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
            <div>
              <h2 className="text-h2 tracking-tight">Contract Repository</h2>
              <p className="text-body text-[#BBC0C4] mt-1">Manage and execute your maritime legal agreements.</p>
            </div>
            <button 
              onClick={handleNewContract}
              className="bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] flex items-center justify-center gap-2 px-6 py-2.5 rounded shadow-sm transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} /> <span className="text-[13px] font-semibold uppercase tracking-wider">New Contract</span>
            </button>
          </div>

          <div className="bg-[#141924] border border-white/5 p-4 rounded-md flex flex-col sm:flex-row gap-4 mb-4 shadow-sm">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868B]" />
              <input 
                type="text" 
                placeholder="Search by ID, Parties, or Contract Type..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-[#040B18] border border-white/5 rounded px-10 text-[13px] text-[#E8EAED] placeholder:text-[#80868B] focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 bg-[#040B18] border border-white/5 rounded px-4 text-[13px] text-[#BBC0C4] focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">All Statuses</option>
                <option value="draft">Active Draft</option>
                <option value="executed">Executed</option>
              </select>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 bg-[#040B18] border border-white/5 rounded px-4 text-[13px] text-[#BBC0C4] focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] outline-none transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="">All Types</option>
                <option value="Sale">Vessel Sale</option>
                <option value="Charter">Charter Agreement</option>
                <option value="Service">Service Agreement</option>
              </select>
            </div>
          </div>

          <div className="bg-[#141924] border border-white/5 rounded-md overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#2D2D2D]/30">
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#BBC0C4] uppercase tracking-widest w-[15%]">Contract ID</th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#BBC0C4] uppercase tracking-widest w-[25%] cursor-pointer hover:text-[#E8EAED] transition-colors" onClick={() => requestSort('title')}>
                    <div className="flex items-center gap-1">Agreement {sortConfig?.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#BBC0C4] uppercase tracking-widest w-[20%]">Parties</th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#BBC0C4] uppercase tracking-widest w-[10%] cursor-pointer hover:text-[#E8EAED] transition-colors" onClick={() => requestSort('date')}>
                    <div className="flex items-center gap-1">Date {sortConfig?.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#BBC0C4] uppercase tracking-widest w-[15%] cursor-pointer hover:text-[#E8EAED] transition-colors" onClick={() => requestSort('status')}>
                    <div className="flex items-center gap-1">Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
                  </th>
                  <th className="py-3 px-5 text-[11px] font-semibold text-[#BBC0C4] uppercase tracking-widest w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingContracts ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-2" size={24} />
                      Loading dynamic maritime agreements...
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No contracts found in this workspace.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((contract) => (
                    <React.Fragment key={contract.id}>
                      <tr onClick={() => toggleRow(contract.id)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                        <td className="py-4 px-5 text-[13px] font-medium text-[#E8EAED] flex items-center gap-2">
                          <span className="inline-flex">
                            {expandedRows.has(contract.id) ? <ChevronUp key="up" size={14} className="text-[#80868B]" /> : <ChevronDown key="down" size={14} className="text-[#80868B]" />}
                          </span>
                          <span>{contract.id}</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-semibold text-[#E8EAED] text-[14px]">{contract.title}</div>
                          <div className="text-[12px] text-[#BBC0C4] mt-1">{contract.type}</div>
                        </td>
                        <td className="py-4 px-5 text-[13px] text-[#BBC0C4] font-medium">
                          <span className="text-[#E8EAED]">{contract.seller}</span> <span className="opacity-50 mx-1">v</span> <span className="text-[#E8EAED]">{contract.buyer}</span>
                        </td>
                        <td className="py-4 px-5 text-[13px] text-[#BBC0C4]">
                          {contract.date}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${contract.status === 'executed' ? "bg-green-500/10 text-[#81C995] border border-green-500/20" : "bg-yellow-500/10 text-[#FDD663] border border-yellow-500/20"}`}>
                            {contract.status === 'executed' ? "Executed ✓" : "Active Draft"}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => loadContractIntoEditor(contract)}
                            className="text-[12px] font-medium text-[#00D4FF] hover:text-white transition-colors cursor-pointer"
                          >
                            {contract.status === 'executed' ? "View Document" : "Resume Draft"}
                          </button>
                        </td>
                      </tr>
                    {expandedRows.has(contract.id) && (
                      <tr className="bg-[#121212]/50 border-none">
                        <td colSpan={6} className="py-4 px-6 relative">
                           {/* Subtle left indicator border */}
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1E1E1E]"></div>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-white/5 rounded-md bg-[#18181A]">
                              <div>
                                 <h4 className="text-[10px] uppercase tracking-widest text-[#80868B] mb-2 font-semibold">Contract Summary</h4>
                                 <div className="text-[12px] text-[#BBC0C4] bg-[#2D2D2D]/30 p-3 rounded border border-white/5">
                                   Standard terms applied for {contract.type.toLowerCase()}. Total contract value validated at {contract.value} USD. Initialized and locked via internal digital signature process.
                                 </div>
                              </div>
                              <div>
                                 <h4 className="text-[10px] uppercase tracking-widest text-[#80868B] mb-2 font-semibold">Key Entities</h4>
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[12px] text-[#BBC0C4] bg-[#2D2D2D]/30 px-3 py-2 rounded">
                                       <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]"></div> {contract.seller} (Principal)
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px] text-[#BBC0C4] bg-[#2D2D2D]/30 px-3 py-2 rounded">
                                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> {contract.buyer} (Counterparty)
                                    </div>
                                 </div>
                              </div>
                              <div>
                                 <h4 className="text-[10px] uppercase tracking-widest text-[#80868B] mb-2 font-semibold">Validation & Lifecycle</h4>
                                 <div className="space-y-2">
                                     <div className="flex items-center gap-2 text-[12px] text-[#BBC0C4] bg-[#2D2D2D]/30 px-3 py-2 rounded">
                                       <Shield size={12} className="text-[#81C995]"/> {contract.status === 'executed' ? 'Audit Log: Verified' : 'Audit Log: Drafted'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px] text-[#BBC0C4] bg-[#2D2D2D]/30 px-3 py-2 rounded">
                                       <Calendar size={12}/> Target Completion: 30 Days
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-system-bg text-system-text-primary font-manrope overflow-hidden">
      
      {/* Top Navbar */}
      <div className="h-12 shrink-0 border-b border-system-border-base flex items-center justify-between px-6 bg-system-surface z-20 shadow-sm animate-in fade-in">
        <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
          <button onClick={() => {
            setWorkflowStep('hub');
          }} className="text-[#00D4FF] hover:text-white transition-all group relative">
            <ArrowLeft size={16} />
            <span className="absolute left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] tracking-widest whitespace-nowrap bg-[#0a1c34]/20 text-white px-2 py-1 rounded">
              Return to Legal Entrance
            </span>
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#00D4FF]/5 border border-[#00D4FF]/15 flex items-center justify-center rounded-lg">
                <FileSignature size={14} className="text-[#00D4FF]" />
             </div>
             <div>
               <div className="text-[12px] font-bold uppercase tracking-wider text-white leading-none">CONTRACT STUDIO V4</div>
               <div className="text-[9px] text-[#6B7280] uppercase tracking-widest mt-1 font-semibold font-manrope">Enterprise Maritime Operating System</div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-[10px] text-[#10B981] uppercase tracking-wider font-bold flex items-center gap-2 font-manrope">
             {isExecuted ? <CheckCircle2 size={14} className="text-[#10B981]" /> : <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>}
             {isExecuted ? "EXECUTED" : "SYNCHRONIZED"}
           </div>
           <button 
             onClick={handleExecute} 
             disabled={isExecuted} 
             className={`h-9 px-4 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all ${
               isExecuted ? 'bg-emerald-600 text-white cursor-not-allowed shadow-none' : 'bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:bg-[#33DDFF] hover:shadow-md'
             }`}>
             {isExecuted ? 'AGREEMENT EXECUTED ✓' : `DEPLOY (${getContractCost(foundation.type || 'Service Agreement')} CREDITS)`}
           </button>
        </div>
      </div>

      </div>

      {!isPaymentMethodValid ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a1c34]/20 overflow-y-auto animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#041326]/40 border border-white/10 rounded-2xl p-8 text-center shadow-lg space-y-6">
            <div className="w-16 h-16 bg-red-500/5 border border-red-900/30 flex items-center justify-center rounded-2xl mx-auto shadow-sm text-red-400">
              <ShieldAlert size={32} className="animate-pulse text-red-500" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">SERVICES SUSPENDED</h3>
              <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Critical Error: Corporate Payment Method Invalid</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your company's corporate payment authorization has been revoked or has expired. To resume 
              <strong> Contract Studio V4</strong> ecosystem services (including document revisioning, real-time AI legal advisory, secure cryptographic ledger signing, and PDF downloading), please define a valid payment method.
            </p>

            <div className="p-4 bg-[#0a1c34]/20 border border-white/10 rounded-xl text-left space-y-2 text-[10px]">
              <div className="flex justify-between text-slate-400 font-semibold uppercase">
                <span>Company Name:</span>
                <span className="text-white font-manrope">{company?.name || "GLOBAL DYNAMICS LTD"}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-semibold uppercase">
                <span>Domain Slug:</span>
                <span className="text-white font-manrope">{company?.subdomain || company?.companySlug || "argento"}</span>
              </div>
              <div className="flex justify-between text-red-400 font-bold uppercase">
                <span>Status:</span>
                <span>Unsuitable / Overdue Payment Channel</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={async () => {
                  setWorkflowStep('hub');
                  setTimeout(() => {
                    const el = document.getElementById("billing-panel");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
className="w-full h-10 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/30 text-[#00D4FF] hover:text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.1)] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                <CreditCard size={14} /> Go to Billing Panel & Authorize Payment
              </button>
              
              <button 
                onClick={() => setWorkflowStep('hub')}
                className="w-full h-10 bg-[#041326]/40 hover:bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider border border-white/10 rounded-xl transition-all cursor-pointer">
                Return to Hub Main
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* --- HORIZONTAL TRANSACTION MICRO-PROCESS GRAPH --- */}
          <div className="h-12 shrink-0 bg-[#0a1c34]/20 border-b border-white/10 px-8 flex items-center z-10 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between gap-8">
              <div className="flex items-center gap-2 shrink-0">
          <div className="text-[10px] font-extrabold text-white uppercase tracking-wider font-manrope">Transaction Status:</div>
          <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
        </div>
        <div className="flex flex-1 items-center justify-around max-w-5xl mx-auto gap-4 px-6">
          {[
            { label: 'Commercial Foundation', targetSec: 'Commercial Foundation' },
            { label: 'Parties', targetSec: 'Parties' },
            { label: 'Deliverables', targetSec: 'Deliverables' },
            { label: 'Legal Review', targetSec: 'Commercial Terms' },
            { label: 'Execution', targetSec: 'Signatures' }
          ].map((step, idx) => {
            const activeIdx = getMacroStepIndex(activeSection);
            let status: 'completed' | 'active' | 'pending' = 'pending';
            if (activeIdx > idx) status = 'completed';
            else if (activeIdx === idx) status = 'active';

            return (
              <button
                key={step.label}
                onClick={() => {
                  setActiveSection(step.targetSec);
                }}
                className="flex items-center gap-2.5 focus:outline-none group relative cursor-pointer"
              >
                {/* Node Number/Check */}
                <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-manrope font-bold transition-all ${
                  status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    : status === 'active'
                      ? 'bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.3)] border border-[#00D4FF] ring-4 ring-[#00D4FF]/10'
                      : 'bg-[#041326]/40 text-slate-500 border border-white/10 group-hover:border-slate-500 group-hover:text-slate-300'
                }`}>
                  {status === 'completed' ? '✓' : `0${idx + 1}`}
                </div>
                <div className="flex flex-col text-left">
                  <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${
                    status === 'completed'
                      ? 'text-emerald-500'
                      : status === 'active'
                        ? 'text-[#00D4FF]'
                        : 'text-slate-500 group-hover:text-slate-300'
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-[7.5px] font-manrope uppercase tracking-widest leading-none mt-0.5 text-slate-500">
                    {status === 'completed' ? '✓ Completed' : status === 'active' ? 'In Progress' : 'Pending'}
                  </span>
                </div>

                {idx < 4 && (
                  <div className="text-slate-700 font-normal text-[10px] ml-4 pointer-events-none hidden md:block">
                    ➔
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[9.5px] font-manrope text-slate-500 shrink-0 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 flex items-center gap-2">
          <span>KOD:</span>
          <span className="text-slate-700 font-bold">{contractFields.verificationCode.slice(0, 9)}</span>
        </div>
        </div>
      </div>

      {/* Main Grid (25% | 35% | 40%) */}
      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        
        {/* LEFT PANEL - Contract Structure (with Collapsible Sidebar and Vertical Milestones) */}
        <div className={`shrink-0 border-r border-white/5 flex flex-col bg-[#141924] text-slate-300 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[320px]'}`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between overflow-hidden">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate font-manrope">Agreement Sections</div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all mx-auto cursor-pointer"
              title={sidebarCollapsed ? "Expand" : "Collapse"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 relative bg-[#141924]">
            
            {/* Elegant visual thin vertical timeline line connecting milestones */}
            <div className={`absolute top-6 bottom-6 w-[1.5px] bg-white/10 transition-all duration-300 ${sidebarCollapsed ? 'left-[35px]' : 'left-[31px]'}`} />

            {sections.map((sec, idx) => {
              const completed = isSectionCompleted(sec);
              const active = activeSection === sec;
              
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 relative group cursor-pointer ${active ? 'bg-[#00D4FF]/10 text-white font-semibold' : 'hover:bg-white/5 text-slate-400'}`}
                >
                  {/* Timeline milestone node bubble */}
                  <div className="z-10 shrink-0">
                    {completed ? (
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-manrope font-bold transition-all ${
                          active 
                            ? 'bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.3)] border border-[#00D4FF] ring-4 ring-[#00D4FF]/10 scale-105' 
                            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        }`}
                        title="Stage Ready"
                      >
                        ✓
                      </div>
                    ) : (
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-manrope font-bold border transition-all ${
                          active 
                            ? 'bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.3)] border-[#00D4FF] ring-4 ring-[#00D4FF]/10 scale-105' 
                            : 'bg-[#141924]/50 border-white/10 text-slate-500 group-hover:border-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* Text labels: hidden when collapsed */}
                  {!sidebarCollapsed ? (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest truncate transition-colors ${active ? 'text-white font-manrope' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {sec}
                      </span>
                      <span className={`text-[8.5px] font-manrope uppercase tracking-widest mt-0.5 font-bold ${completed ? 'text-emerald-400' : 'text-slate-500/60'}`}>
                        {completed ? "READY ✓" : "PENDING"}
                      </span>
                    </div>
                  ) : (
                    /* Hover tooltip in collapsed mode */
                    <div className="absolute left-[64px] bg-[#141924] border border-white/10 text-white text-[9px] uppercase font-bold tracking-widest px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                      {sec} <span className={`text-[8px] font-manrope ml-2 ${completed ? "text-emerald-400" : "text-amber-500"}`}>{completed ? "READY ✓" : "PENDING"}</span>
                    </div>
                  )}

                  {!sidebarCollapsed && active && (
                    <ChevronRight size={12} className="ml-auto text-[#00D4FF] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER PANEL - AI Generated + Human Revised Workspace */}
        <div className={`shrink-0 border-r border-white/10 flex flex-col bg-[#0a1c34]/20 shadow-sm z-10 relative transition-all duration-300 ${sidebarCollapsed ? 'w-[520px]' : 'w-[500px]'}`}>
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-[#141924] shrink-0">
            <div className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 font-manrope">
              <FileSignature size={14} className="text-[#00D4FF]" /> INTERACTIVE CLAUSE WORKSPACE
            </div>
            
            <span className="px-2 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] text-[8px] font-manrope rounded tracking-wider uppercase font-bold border border-[#00D4FF]/20">
              Active: {currentVersion}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 no-scrollbar custom-scrollbar space-y-6">

            {/* VERSION CONTROL STEPS */}
            <div className="bg-[#041326]/40 border border-white/10 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-white uppercase tracking-widest block font-manrope">Agreement Version History</span>
                <span className="text-[8px] text-slate-500 font-manrope">Select revision state</span>
              </div>
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[
                  { tag: 'v1 Generated', label: 'v1 (AI Draft)' },
                  { tag: 'v2 Seller Refined', label: 'v2 (Seller)' },
                  { tag: 'v3 Buyer Refined', label: 'v3 (Buyer)' },
                  { tag: 'v4 Approved', label: 'v4 (Approved)' },
                  { tag: 'v5 Signed', label: 'v5 (Signed)' },
                ].map((v) => {
                  const isCurrent = currentVersion === v.tag;
                  return (
                    <button
                      key={v.tag}
                      onClick={() => {
                        setCurrentVersion(v.tag as any);
                        setClauses(prev => prev.map(c => ({ ...c, status: v.tag as any })));
                      }}
                      className={`py-1.5 px-0.5 rounded text-[8.5px] font-manrope font-bold tracking-tight uppercase border transition-all cursor-pointer ${
                        isCurrent
? 'bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.3)] border-[#00D4FF] shadow-sm'
                          : 'bg-[#0a1c34]/20 text-slate-400 border-white/10 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
             {/* Dynamic AI Contract Advisor Widget embedded permanently at the top of form pages */}
             {activeSection !== "Contract AI Advisor" && (
                <div id="contract-ai-advisor-widget" className="bg-[#041326]/40 border border-white/10 rounded-xl p-4 mb-6 shadow-sm relative overflow-hidden group animate-in fade-in">
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D4FF]/45 to-transparent"></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] ring-1 ring-[#00D4FF]/20">
                        <Cpu size={11} className="animate-pulse" />
                      </div>
                      <span className="text-[10px] font-bold text-white tracking-wider uppercase font-manrope">Contract AI Advisor</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] text-[8px] font-manrope rounded tracking-wider uppercase font-bold">
                      {activeSection} ANALYSIS
                    </span>
                  </div>
                  
                  <div className="text-[10.5px] leading-relaxed text-slate-300 mb-3 bg-[#0a1c34]/20 p-3 rounded-lg border border-white/10">
                    The digital contract intelligence engine is active, monitoring all clauses in real-time. Input custom instructions below or click the prompt helpers to conduct an instantaneous risk scan of the selected <strong className="text-[#00D4FF] font-bold font-manrope">{activeSection}</strong> parameters.
                  </div>

                  {/* Suggest standard prompt helpers based on active section */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <button 
                      onClick={() => handleAdvisorConsult(`Recommend the ideal legal and commercial wording for the active ${activeSection} terms to mitigate shipping delays and limit demurrage liabilities under English law.`)}
                      className="text-[8px] uppercase tracking-wider font-bold bg-[#19A7C1]/10 hover:bg-[#19A7C1]/20 text-[#19A7C1] border border-[#19A7C1]/20 hover:border-[#19A7C1]/40 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      💡 Wording Suggestion
                    </button>
                    <button 
                      onClick={() => handleAdvisorConsult(`Conduct an intensive maritime legal risk assessment of this ${activeSection} setup. Highlight exposure points and suggest protective covenants.`)}
                      className="text-[8px] uppercase tracking-wider font-bold bg-[#19A7C1]/10 hover:bg-[#19A7C1]/20 text-[#19A7C1] border border-[#19A7C1]/20 hover:border-[#19A7C1]/40 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      ⚓ Legal Risk Scan
                    </button>
                  </div>

                  {/* AI response display block if there are answers related to this section */}
                  {advisorMessages.filter(m => m.sectionName === activeSection).length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-3 max-h-[160px] overflow-y-auto custom-scrollbar space-y-2 bg-[#0a1c34]/20 p-2.5 rounded-lg border border-white/10">
                      {advisorMessages.filter(m => m.sectionName === activeSection).map((msg, mIdx) => (
                        <div key={mIdx} className="text-[10px] leading-relaxed border-b border-white/10 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[8px] font-manrope uppercase tracking-wider font-bold ${msg.role === 'user' ? 'text-[#00D4FF]' : 'text-slate-400'}`}>
                              {msg.role === 'user' ? '👤 ANALYTICAL REQUEST' : '📊 CONTRACT INTELLIGENCE ADVISE'}
                            </span>
                            <span className="text-[7px] text-slate-500 font-manrope">{msg.timestamp}</span>
                          </div>
                          <div className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-[#00D4FF]' : 'text-slate-200 font-serif'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Immediate Input form */}
                  <div className="flex gap-1.5 mt-3">
                    <input 
                      type="text" 
                      placeholder="Consult Maritime AI (e.g. Incoterms allocation, indemnity limits...)" 
                      value={advisorInput}
                      onChange={e => setAdvisorInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAdvisorConsult();
                        }
                      }}
                      disabled={isAdvisorLoading}
                      className="flex-1 bg-[#0a1c34]/20 border border-white/10 text-[10.5px] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] text-white placeholder-slate-500 disabled:opacity-50 transition-all font-manrope"
                    />
                    <button 
                      onClick={() => handleAdvisorConsult()}
                      disabled={isAdvisorLoading || !advisorInput.trim()}
                      className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 hover:bg-[#00D4FF]/20 text-[#00D4FF] hover:text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent shrink-0 cursor-pointer"
                    >
                      {isAdvisorLoading ? <Loader2 size={12} className="animate-spin text-[#00D4FF]" /> : <Send size={11} />}
                    </button>
                  </div>
                </div>
             )}

             {/* Dynamic Clause Lock/Unlock and Alternate Replacements for Clause-based sections */}
             {(() => {
                const sectionToClauseId: { [key: string]: string } = {
                  "Parties": "clause_parties",
                  "Commercial Foundation": "clause_commercial",
                  "Commercial Terms": "clause_commercial",
                  "Delivery Terms": "clause_delivery",
                  "Warranty": "clause_warranty",
                  "Liability": "clause_liability",
                  "Jurisdiction": "clause_disputes",
                  "Arbitration": "clause_disputes",
                  "Signatures": "clause_execution",
                  "Annexes": "clause_execution"
                };

                const mappedClauseId = sectionToClauseId[activeSection];
                const activeClause = clauses.find(c => c.id === mappedClauseId);
                if (!activeClause) return null;

                const isLocked = activeClause.status.includes('Approved') || activeClause.status.includes('Signed');
                const alternatives = clauseAlternatives[activeClause.id] || [];

                return (
                  <div className="bg-[#041326]/40 border border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col mb-6 animate-in fade-in">
                    {/* Header with status & security lock */}
                    <div className="px-5 py-4 border-b border-white/10 bg-[#0a1c34]/20/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider block font-manrope">
                          {activeClause.title}
                        </span>
                        <span className={`text-[8.5px] font-semibold mt-0.5 inline-block uppercase ${isLocked ? 'text-emerald-400 font-manrope' : 'text-[#00D4FF] font-manrope'}`}>
                          Status: {activeClause.status}
                        </span>
                      </div>

                      {/* Lock Toggle Button */}
                      <button
                        onClick={() => {
                          setClauses(prev => prev.map(c => {
                            if (c.id === activeClause.id) {
                              return {
                                ...c,
                                status: isLocked ? 'v2 Seller Revision' as any : 'v4 Approved' as any
                              };
                            }
                            return c;
                          }));
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-manrope font-bold uppercase transition-all cursor-pointer ${
                          isLocked
                            ? 'bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-900/20'
                            : 'bg-emerald-950/10 text-emerald-400 border-emerald-900/20 hover:bg-emerald-900/10'
                        }`}
                        title={isLocked ? "Unlock clause for human editing & AI revision" : "Lock clause as Approved / Freeze terms"}
                      >
                        {isLocked ? (
                          <>
                            <Shield size={12} className="text-red-500 animate-pulse" /> LOCKED (🔒)
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={12} className="text-emerald-500" /> UNLOCKED (🔓)
                          </>
                        )}
                      </button>
                    </div>

                    {/* AI Rewrite Terminal integrated inside the active editing segment */}
                    <div className="p-5 border-b border-white/10 bg-slate-950 text-white space-y-3 font-manrope text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#00D4FF] font-bold tracking-widest uppercase text-[9px]">🔮 AI CLAUSE TUNER TERMINAL</span>
                        <span className="text-slate-500 text-[8px]">MODEL: GEMINI-2.5-FLASH</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={isLocked ? "Unlock the clause first to enable AI adjustments..." : "e.g. Translate to Spanish, make warranty 24 months, add strict force majeure..."} 
                          value={individualAiInstruction}
                          onChange={e => setIndividualAiInstruction(e.target.value)}
                          disabled={isLocked || isAiRevising}
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && individualAiInstruction.trim()) {
                              e.preventDefault();
                              setIsAiRevising(true);
                              const prompt = individualAiInstruction;
                              setIndividualAiInstruction("");
                              try {
                                const result = await rewriteContractClauseWithAi(activeClause.title, activeClause.content, prompt, {
                                  agreementType: foundation.type, seller: partyA.name, buyer: partyB.name, contractValue: foundation.value, currency: foundation.currency,
                                  jurisdiction: jurisdiction.law, arbitrationSeat: jurisdiction.seat, deliveryPort: contractFields.deliveryLocation, broker: "XYZ Brokerage"
                                });
                                setClauses(prev => prev.map(c => c.id === activeClause.id ? { ...c, content: result, status: 'v2 Seller Revision' as any } : c));
                                setCreditsBalance(prev => Math.max(0, prev - 1));
                              } catch (err) {} finally { setIsAiRevising(false); }
                            }
                          }}
                          className="flex-1 bg-[#0a1c34]/20 border border-white/10 text-[10.5px] px-3 py-2 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#00D4FF] disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                        <button 
                          onClick={async () => {
                            setIsAiRevising(true);
                            const prompt = individualAiInstruction;
                            setIndividualAiInstruction("");
                            try {
                              const result = await rewriteContractClauseWithAi(activeClause.title, activeClause.content, prompt, {
                                agreementType: foundation.type, seller: partyA.name, buyer: partyB.name, contractValue: foundation.value, currency: foundation.currency,
                                jurisdiction: jurisdiction.law, arbitrationSeat: jurisdiction.seat, deliveryPort: contractFields.deliveryLocation, broker: "XYZ Brokerage"
                              });
                              setClauses(prev => prev.map(c => c.id === activeClause.id ? { ...c, content: result, status: 'v2 Seller Revision' as any } : c));
                              setCreditsBalance(prev => Math.max(0, prev - 1));
                            } catch (err) {} finally { setIsAiRevising(false); }
                          }}
                          disabled={isLocked || isAiRevising || !individualAiInstruction.trim()}
                          className="bg-[#00D4FF]/10 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/30 text-[#00D4FF] hover:text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.1)] font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isAiRevising ? <Loader2 size={13} className="animate-spin" /> : "REWRITE"}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] text-[#34D399]">
                        <span>• Cost: 1 Credit/Prompt</span>
                        <span>• Status: Ready</span>
                      </div>
                    </div>

                    {/* Standard Text Area for Human draft revision */}
                    <div className="p-5 flex-1 space-y-4 bg-[#041326]/40">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-manrope">
                          Professional Human Revise Workspace
                        </label>
                        <textarea
                          value={activeClause.content}
                          disabled={isLocked}
                          onChange={e => {
                            const updatedText = e.target.value;
                            setClauses(prev => prev.map(c => {
                              if (c.id === activeClause.id) {
                                return {
                                  ...c,
                                  content: updatedText,
                                  status: 'v2 Seller Revision' as any
                                };
                              }
                              return c;
                            }));
                          }}
                          className={`w-full min-h-[180px] text-xs font-serif leading-relaxed border p-4 rounded-xl focus:outline-none transition-all ${
                            isLocked
                              ? 'bg-[#0a1c34]/20 border-white/10 text-slate-550 cursor-not-allowed'
                              : 'bg-[#0a1c34]/20 border-white/10 text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] shadow-inner'
                          }`}
                          placeholder="You can edit the clause text directly here..."
                        />
                      </div>

                      {isLocked && (
                        <div className="bg-amber-950/20 border border-amber-900/35 p-3 rounded-lg text-[10px] text-amber-400 font-manrope flex items-center gap-2">
                          <AlertCircle size={14} className="text-amber-500 shrink-0" />
                          <div>
                            <strong>Lock Active:</strong> Human edit is disabled. Select the <strong>UNLOCKED (🔓)</strong> button in the clause header to manually input modifications.
                          </div>
                        </div>
                      )}

                      {/* Alternative template options list */}
                      {alternatives.length > 0 && !isLocked && (
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-white uppercase tracking-widest block font-manrope">
                              Template Store (Clause Library Alternatives)
                            </label>
                            <span className="text-[8px] text-slate-500 font-manrope font-bold">1-Click Swap</span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {alternatives.map((alt, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => {
                                  setClauses(prev => prev.map(c => {
                                    if (c.id === activeClause.id) {
                                      return {
                                        ...c,
                                        content: alt,
                                        status: 'v2 Seller Revision' as any,
                                        alternativeReplacementsCount: (c.alternativeReplacementsCount || 0) + 1
                                      };
                                    }
                                    return c;
                                  }));
                                }}
                                className="w-full text-left p-3 bg-[#0a1c34]/20 hover:bg-white/5 border border-white/10 hover:border-[#00D4FF] rounded-xl text-[10.5px] leading-relaxed text-slate-300 transition-all hover:shadow-s font-manrope cursor-pointer animate-in slide-in-from-top-1 dur-150"
                              >
                                <span className="font-bold text-[8px] text-[#00D4FF] block uppercase tracking-wider mb-0.5 font-manrope">
                                  Alternative Clause Template #{aIdx + 1}
                                </span>
                                {alt.length > 150 ? alt.slice(0, 150) + "..." : alt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
             })()}

             {activeSection === "Commercial Foundation" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>COMMERCIAL FOUNDATION</h2>
                  
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Agreement Type</label>
                    <div className="relative">
                      <select className={selectClass} value={foundation.type} onChange={e => setFoundation({...foundation, type: e.target.value})}>
                        {agreementTypes.map(t => <option key={t} disabled={t.startsWith("---")}>{t}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Agreement Title</label>
                    <input className={inputClass} value={foundation.title} onChange={e => setFoundation({...foundation, title: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Transaction Type</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.transactionType} onChange={e => setFoundation({...foundation, transactionType: e.target.value})}>
                          {transactionTypes.map(t => <option key={t} disabled={t.startsWith("---")}>{t}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Contract Value & Currency</label>
                      <div className="flex gap-2">
                        <input className={`${inputClass} flex-1`} value={foundation.value} onChange={e => setFoundation({...foundation, value: e.target.value})} />
                        <div className="relative w-24">
                          <select className={`${selectClass} w-full pr-8`} value={foundation.currency} onChange={e => setFoundation({...foundation, currency: e.target.value})}>
                            {currencies.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                            <ChevronRight size={14} className="rotate-90" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Commercial Subject Matter</label>
                    <div className="relative">
                      <select className={selectClass} value={foundation.subjectMatter} onChange={e => setFoundation({...foundation, subjectMatter: e.target.value})}>
                        {subjectMatters.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Primary Commercial Objective</label>
                    <div className="relative">
                      <select className={selectClass} value={foundation.objective} onChange={e => setFoundation({...foundation, objective: e.target.value})}>
                        {objectives.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Commercial Model & Payment Structure</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select className={`${selectClass} w-full pr-8`} value={foundation.commercialModel || "Fixed Price"} onChange={e => setFoundation({...foundation, commercialModel: e.target.value})}>
                          {commercialModels.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                      <div className="relative flex-1">
                        <select className={`${selectClass} w-full pr-8`} value={foundation.paymentStructure || "100% Advance"} onChange={e => setFoundation({...foundation, paymentStructure: e.target.value})}>
                          {paymentStructures.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Project Description</label>
                    <textarea className={`${inputClass} min-h-[100px] resize-y py-3`} value={foundation.description} onChange={e => setFoundation({...foundation, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Geographic Scope</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.geoScope} onChange={e => setFoundation({...foundation, geoScope: e.target.value})}>
                          {geoScopes.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Operating Area</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.operatingArea} onChange={e => setFoundation({...foundation, operatingArea: e.target.value})}>
                          {operatingAreas.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Service Location (Multi-Select)</label>
                    <select multiple size={4} className={`${selectClass} h-auto`} value={Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation : [foundation.serviceLocation]} onChange={e => setFoundation({...foundation, serviceLocation: Array.from(e.target.selectedOptions, option => option.value)})}>
                      {serviceLocations.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="text-[9px] text-slate-500 mt-2 uppercase">Hold Ctrl/Cmd to select multiple</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Contract Duration</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.duration} onChange={e => setFoundation({...foundation, duration: e.target.value})}>
                          {contractDurations.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Renewal Terms</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.renewalTerms} onChange={e => setFoundation({...foundation, renewalTerms: e.target.value})}>
                          {renewalTermsList.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Effective Date</label>
                      <input type="date" className={inputClass} value={foundation.effectiveDate} onChange={e => setFoundation({...foundation, effectiveDate: e.target.value})} />
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Expiration Date</label>
                      <input type="date" className={inputClass} value={foundation.expirationDate} onChange={e => setFoundation({...foundation, expirationDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Notice Period</label>
                    <div className="relative">
                      <select className={selectClass} value={foundation.noticePeriod} onChange={e => setFoundation({...foundation, noticePeriod: e.target.value})}>
                        {noticePeriods.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
             )}

             {activeSection === "Jurisdiction" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>JURISDICTION ENGINE</h2>
                  
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>APPLICABLE LAW</label>
                    <div className="relative">
                      <select className={selectClass} value={jurisdiction.law} onChange={e => setJurisdiction({...jurisdiction, law: e.target.value})}>
                        {applicableLaws.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>ARBITRATION SEAT</label>
                    <div className="relative">
                      <select className={selectClass} value={jurisdiction.seat} onChange={e => setJurisdiction({...jurisdiction, seat: e.target.value})}>
                        {arbitrationSeats.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>ARBITRATION INSTITUTION</label>
                    <select className={selectClass} value={jurisdiction.institution} onChange={e => setJurisdiction({...jurisdiction, institution: e.target.value})}>
                      {["LCIA", "ICC", "SIAC", "LMAA", "GAFTA", "FOSFA", "UNCITRAL", "Custom"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
             )}

             {activeSection === "Parties" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>PARTIES & COUNTERPARTIES</h2>
                  
                  {/* Party A Card */}
                  <div className="bg-[#0a1c34]/20 border border-[#19A7C1]/30 p-5 rounded-lg space-y-4">
                    <div className="text-[10px] font-bold text-[#19A7C1] uppercase tracking-[0.2em] border-b border-[#19A7C1]/10 pb-1.5 flex justify-between items-center">
                      <span>Party A (Primary / Executing Entity)</span>
                      <span className="text-[9px] bg-[#19A7C1]/10 px-2 py-0.5 rounded text-[#19A7C1]">PRE-SET</span>
                    </div>
                    
                    <div>
                      <label className={labelClass}>Entity Name / Authorized Corporate Name</label>
                      <input className={inputClass} value={partyA.name} onChange={e => setPartyA({...partyA, name: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Role in Agreement (e.g., Seller, Owner, Consultant)</label>
                      <input className={inputClass} value={partyA.role} onChange={e => setPartyA({...partyA, role: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Official Registered Address / Main Office</label>
                      <textarea
                        className="w-full h-16 bg-[#0a1c34]/20 border border-white/10 rounded-lg p-3 text-[13px] text-white placeholder-slate-500 focus:border-[#19A7C1] outline-none transition-all resize-none"
                        placeholder="e.g., 54 Harborside Plaza, London, EC1Y 8SY, United Kingdom"
                        value={partyA.address || ""}
                        onChange={e => setPartyA({...partyA, address: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Legal Registration / ID / Passport Number</label>
                      <input 
                        className={inputClass} 
                        placeholder="e.g., UK Registration No: 1245789-A or Passport No: TR9843210"
                        value={partyA.idNumber || ""} 
                        onChange={e => setPartyA({...partyA, idNumber: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Primary Email Address for Execution</label>
                      <input className={inputClass} type="email" value={partyA.email} onChange={e => setPartyA({...partyA, email: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Additional Notification Email Addresses</label>
                      <div className="flex gap-2">
                        <input 
                          id="partyA-new-email"
                          type="email" 
                          placeholder="e.g., billing@global-dynamics.com" 
                          className={`${inputClass} !h-9 flex-1`}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const inputEl = document.getElementById('partyA-new-email') as HTMLInputElement;
                              const val = inputEl?.value?.trim();
                              if (val && !partyA.additionalEmails?.includes(val)) {
                                setPartyA({
                                  ...partyA,
                                  additionalEmails: [...(partyA.additionalEmails || []), val]
                                });
                                if (inputEl) inputEl.value = '';
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const inputEl = document.getElementById('partyA-new-email') as HTMLInputElement;
                            const val = inputEl?.value?.trim();
                            if (val && !partyA.additionalEmails?.includes(val)) {
                              setPartyA({
                                  ...partyA,
                                  additionalEmails: [...(partyA.additionalEmails || []), val]
                              });
                              if (inputEl) inputEl.value = '';
                            }
                          }}
                          className="px-3 bg-[#19A7C1]/10 hover:bg-[#19A7C1]/20 border border-[#19A7C1]/30 hover:border-[#19A7C1] text-[#19A7C1] hover:text-white rounded text-[11px] font-manrope font-bold cursor-pointer transition-all uppercase"
                        >
                          Add
                        </button>
                      </div>
                      
                      {partyA.additionalEmails && partyA.additionalEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {partyA.additionalEmails.map((ml: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 bg-[#00050d] border border-white/10 text-slate-300 text-[10.5px] px-2.5 py-0.5 rounded-full">
                              <span>{ml}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  setPartyA({
                                    ...partyA,
                                    additionalEmails: partyA.additionalEmails.filter((_: any, i: number) => i !== idx)
                                  });
                                }}
                                className="text-rose-450 hover:text-rose-400 font-bold ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 bg-[#00050d] p-3 rounded border border-white/10 mt-2">
                      <input 
                        type="checkbox" 
                        id="partyA-confirm-email"
                        className="mt-1 accent-[#19A7C1] cursor-pointer w-4 h-4 rounded" 
                        checked={partyA.confirmEmail || false}
                        onChange={e => setPartyA({...partyA, confirmEmail: e.target.checked})}
                      />
                      <label htmlFor="partyA-confirm-email" className="text-[11px] text-slate-300 font-medium cursor-pointer select-none leading-relaxed">
                        I declare and confirm that these email addresses belong to me / my authorized business entity.<br/>
                        <span className="text-[9.5px] text-slate-500 font-manrope">Mandatory security assurance to guarantee cryptographic execution legitimacy.</span>
                      </label>
                    </div>
                  </div>

                  {/* Party B Card */}
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-5 rounded-lg space-y-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-white/10/50 pb-1.5 opacity-90">
                      Party B (Counterparty)
                    </div>
                    
                    <div>
                      <label className={labelClass}>Entity Name / Authorized Corporate Name</label>
                      <input className={inputClass} value={partyB.name} onChange={e => setPartyB({...partyB, name: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Role in Agreement (e.g., Buyer, Counterparty, Charterer)</label>
                      <input className={inputClass} value={partyB.role} onChange={e => setPartyB({...partyB, role: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Official Registered Address / Main Office</label>
                      <textarea
                        className="w-full h-16 bg-[#0a1c34]/20 border border-white/10 rounded-lg p-3 text-[13px] text-white placeholder-slate-500 focus:border-[#19A7C1] outline-none transition-all resize-none"
                        placeholder="e.g., Via Marina Grande 142, Genoa, 16121, Italy"
                        value={partyB.address || ""}
                        onChange={e => setPartyB({...partyB, address: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Legal Registration / ID / Passport Number</label>
                      <input 
                        className={inputClass} 
                        placeholder="e.g., Italy REA No: GE-98441 or Passport No: IT2345112"
                        value={partyB.idNumber || ""} 
                        onChange={e => setPartyB({...partyB, idNumber: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Primary Email Address for Execution</label>
                      <input className={inputClass} type="email" value={partyB.email} onChange={e => setPartyB({...partyB, email: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Additional Notification Email Addresses</label>
                      <div className="flex gap-2">
                        <input 
                          id="partyB-new-email"
                          type="email" 
                          placeholder="e.g., operations@argentomarine.com" 
                          className={`${inputClass} !h-9 flex-1`}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const inputEl = document.getElementById('partyB-new-email') as HTMLInputElement;
                              const val = inputEl?.value?.trim();
                              if (val && !partyB.additionalEmails?.includes(val)) {
                                setPartyB({
                                  ...partyB,
                                  additionalEmails: [...(partyB.additionalEmails || []), val]
                                });
                                if (inputEl) inputEl.value = '';
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const inputEl = document.getElementById('partyB-new-email') as HTMLInputElement;
                            const val = inputEl?.value?.trim();
                            if (val && !partyB.additionalEmails?.includes(val)) {
                              setPartyB({
                                  ...partyB,
                                  additionalEmails: [...(partyB.additionalEmails || []), val]
                              });
                              if (inputEl) inputEl.value = '';
                            }
                          }}
                          className="px-3 bg-[#19A7C1]/10 hover:bg-[#19A7C1]/20 border border-[#19A7C1]/30 hover:border-[#19A7C1] text-[#19A7C1] hover:text-white rounded text-[11px] font-manrope font-bold cursor-pointer transition-all uppercase"
                        >
                          Add
                        </button>
                      </div>
                      
                      {partyB.additionalEmails && partyB.additionalEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {partyB.additionalEmails.map((ml: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 bg-[#00050d] border border-white/10 text-slate-300 text-[10.5px] px-2.5 py-0.5 rounded-full">
                              <span>{ml}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  setPartyB({
                                    ...partyB,
                                    additionalEmails: partyB.additionalEmails.filter((_: any, i: number) => i !== idx)
                                  });
                                }}
                                className="text-rose-450 hover:text-rose-400 font-bold ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 bg-[#00050d] p-3 rounded border border-white/10 mt-2">
                      <input 
                        type="checkbox" 
                        id="partyB-confirm-email"
                        className="mt-1 accent-[#19A7C1] cursor-pointer w-4 h-4 rounded" 
                        checked={partyB.confirmEmail || false}
                        onChange={e => setPartyB({...partyB, confirmEmail: e.target.checked})}
                      />
                      <label htmlFor="partyB-confirm-email" className="text-[11px] text-slate-300 font-medium cursor-pointer select-none leading-relaxed">
                        I declare and confirm that these email addresses belong to me / my authorized business entity.<br/>
                        <span className="text-[9.5px] text-slate-500 font-manrope">Mandatory security assurance to guarantee cryptographic execution legitimacy.</span>
                      </label>
                    </div>
                  </div>
                </div>
             )}

             {activeSection === "Participants" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className="text-[14px] font-bold text-white uppercase tracking-widest font-manrope">PARTICIPANTS & IDENTITY</h2>
                    <button
                      onClick={() => setShowAddParticipant(!showAddParticipant)}
className="text-[9px] uppercase tracking-widest font-bold text-[#00D4FF] hover:text-white px-2.5 py-1 bg-[#00D4FF]/10 rounded border border-[#00D4FF]/30 flex items-center gap-1.5 transition-all text-center cursor-pointer"
                    >
                      <Plus size={11} /> {showAddParticipant ? "Close Form" : "Add Participant"}
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-slate-400">Manage independent third parties, surveyors, classification societies, financial institutions, or logistics service providers involved in the agreement draft from this interactive panel.</p>
                  
                  {/* Add Participant Form */}
                  {showAddParticipant && (
                    <div className="bg-[#020b18] border border-white/10 p-4 rounded-lg space-y-3 animate-in slide-in-from-top duration-200">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest font-manrope">NEW PARTICIPANT DETAIL</h4>
                      <div>
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Participant / Institution Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Bureau Veritas Marine, Lloyd's Bank..."
                          value={newParticipant.name}
                          onChange={e => setNewParticipant({...newParticipant, name: e.target.value})}
                          className="w-full h-8 bg-[#00050d] border border-white/10 rounded px-2.5 text-[10.5px] text-white focus:border-[#19A7C1] outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Role in Contract</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Vessel Surveyor, Financial Intermediary..."
                            value={newParticipant.role}
                            onChange={e => setNewParticipant({...newParticipant, role: e.target.value})}
                            className="w-full h-8 bg-[#00050d] border border-white/10 rounded px-2.5 text-[10.5px] text-white focus:border-[#19A7C1] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                          <input 
                            type="email" 
                            placeholder="surveyor@bureauveritas.com"
                            value={newParticipant.contact}
                            onChange={e => setNewParticipant({...newParticipant, contact: e.target.value})}
                            className="w-full h-8 bg-[#00050d] border border-white/10 rounded px-2.5 text-[10.5px] text-white focus:border-[#19A7C1] outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          onClick={() => setShowAddParticipant(false)}
                          className="px-3 py-1 text-[9px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            if (!newParticipant.name || !newParticipant.role || !newParticipant.contact) {
                              console.warn("Form validation failed: Empty fields detected.");
                              // alert("Please fill in all fields.");
                              return;
                            }
                            const added = {
                              id: 'p-' + Date.now(),
                              name: newParticipant.name,
                              role: newParticipant.role,
                              contact: newParticipant.contact
                            };
                            setParticipants([...participants, added]);
                            setNewParticipant({ name: '', role: '', contact: '' });
                            setShowAddParticipant(false);
                          }}
className="px-4 py-1 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/30 text-[#00D4FF] hover:text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.1)] font-bold text-[9px] uppercase tracking-widest rounded transition-colors cursor-pointer font-manrope"
                        >
                          Save Participant
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active Participants List */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">CONTRACT PARTICIPANTS</h3>
                    {participants.length === 0 ? (
                      <div className="bg-[#0a1c34]/20 border border-white/10 p-6 rounded-lg text-center text-slate-500 text-[10px] uppercase font-manrope tracking-widest">
                        No registered participants found.
                      </div>
                    ) : (
                      <div className="grid gap-2.5">
                        {participants.map(p => (
                          <div key={p.id} className="bg-[#0a1c34]/20 border border-white/10 p-3 rounded-lg flex items-center justify-between hover:border-white/10 transition-colors animate-in zoom-in-95">
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold text-white uppercase tracking-wider truncate">{p.name}</div>
                              <div className="text-[9px] text-slate-400 font-manrope tracking-wide mt-0.5">{p.role}</div>
                              <div className="text-[8.5px] text-slate-500 flex items-center gap-1.5 mt-1">
                                <Mail size={10} className="text-[#00D4FF]" /> {p.contact}
                              </div>
                            </div>
                            <button 
                              onClick={() => setParticipants(participants.filter(item => item.id !== p.id))}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Delete Participant"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
             )}

             {activeSection === "Attachments" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h2 className={sectionTitleClass}>IDENTITY CREDENTIALS & ATTACHMENTS</h2>
                    <p className="text-[11px] text-slate-400 mt-1 mb-4">
                      Attach visual credentials, passports, or company registry documents. To ensure high speed and lightweight compilation, only high-resolution PNG or JPG image formats are accepted. Files are cryptographically referenced and compiled in Section 6.3 of the contract appendix.
                    </p>
                  </div>

                  {/* Document Configuration Workspace */}
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-5 rounded-lg space-y-4 animate-in fade-in">
                    <h3 className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-widest border-b border-white/10/50 pb-2 font-manrope">
                      New Attachment Configuration
                    </h3>

                    {/* Owner assignment */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 font-manrope">
                        1. Associate with Participant / Party
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "Party A", label: `Party A: ${partyA.name || "Primary Entity"}` },
                          { id: "Party B", label: `Party B: ${partyB.name || "Counterparty"}` },
                          { id: "Witness / Surveyor", label: "Third Party Witness or Auditor" }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setUploadSelectedParty(opt.id)}
                            className={`p-2.5 rounded border text-left text-[10px] flex flex-col justify-between transition-all cursor-pointer ${
                              uploadSelectedParty === opt.id
                                ? "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]"
                                : "bg-[#00050d] text-slate-400 border-white/10 hover:bg-white/5"
                            }`}
                          >
                            <span className="font-manrope text-[8px] font-bold uppercase tracking-wider opacity-75">{opt.id}</span>
                            <span className="font-semibold block truncate mt-1 text-[9.5px] uppercase tracking-wider">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pre-defined types selector with Custom option */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-manrope">
                          2. Select Document Type to Upload
                        </label>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {documentTypes.map(docType => (
                          <button
                            key={docType}
                            type="button"
                            onClick={() => {
                              setShowUploadModal(docType);
                              setUploadProgress(prev => ({ ...prev, [docType + "_" + uploadSelectedParty]: 0 }));
                            }}
                            className="bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/20 hover:border-[#00D4FF]/50 text-[#00D4FF] hover:text-white px-2.5 py-1.5 rounded text-[10px] uppercase font-manrope font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus size={10} /> {docType}
                          </button>
                        ))}
                      </div>

                      {/* Custom + Type Adder Option */}
                      <div className="bg-[#00050d] border border-white/10 p-3 rounded-lg flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Or type custom document type... e.g., Tax Registry"
                          value={newCustomDocType}
                          onChange={e => setNewCustomDocType(e.target.value)}
className="text-[11px] bg-[#0a1c34]/20 border border-white/10 rounded p-1.5 flex-1 placeholder-slate-650 h-9 font-medium text-white shadow-inner focus:border-[#00D4FF] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newCustomDocType.trim();
                            if (trimmed) {
                              if (!documentTypes.includes(trimmed)) {
                                setDocumentTypes([...documentTypes, trimmed]);
                              }
                              setShowUploadModal(trimmed);
                              setUploadProgress(prev => ({ ...prev, [trimmed + "_" + uploadSelectedParty]: 0 }));
                              setNewCustomDocType("");
                            }
                          }}
                          className="px-3.5 h-9 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/30 text-[#00D4FF] text-[10px] font-manrope font-bold rounded uppercase tracking-wider transition-all disabled:opacity-55 cursor-pointer flex items-center gap-1"
                          disabled={!newCustomDocType.trim()}
                        >
                          <Plus size={11} /> Add & Upload
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2 font-manrope">
                      ACTIVE SECURE ATTACHMENTS ({identityDocs.length})
                    </h3>
                    
                    {identityDocs.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                        {identityDocs.map((doc, idx) => {
                          const isCard = doc.type.toLowerCase().includes("passport") || doc.type.toLowerCase().includes("id") || doc.type.toLowerCase().includes("national");
                          const isPartyA = doc.party === "Party A";
                          const ownerName = isPartyA ? partyA.name : partyB.name;
                          
                          return (
                            <div
                              key={doc.id || idx}
                              className="bg-[#050c1e] border border-white/10 rounded-xl overflow-hidden hover:border-[#00D4FF]/50 transition-all duration-300 shadow-xl flex flex-col md:flex-row group animate-in fade-in zoom-in-95"
                            >
                              {/* Left column: Highly styled visual card / certificate frame */}
                              <div className="w-full md:w-[155px] bg-[#0a1c34]/20 p-3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative shrink-0">
                                <div className="absolute top-1.5 left-1.5 text-[8px] font-manrope text-slate-500 font-extrabold uppercase bg-slate-950/80 px-1 py-0.5 rounded tracking-wide border border-slate-850 z-10">
                                  PREVIEW
                                </div>
                                
                                {isCard ? (
                                  /* ID/Passport Frame - Rounded plastic card look */
                                  <div className="w-[130px] h-[82px] rounded-lg border-2 border-white/10 bg-[#041326]/40 overflow-hidden shadow-md relative group-hover:scale-[1.03] transition-transform duration-300">
                                    {doc.previewUrl ? (
                                      <img src={doc.previewUrl} alt={doc.type} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-950 font-manrope text-[8px] text-slate-500 uppercase">
                                        No Card View
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* Certificate/Document Frame - Certificate borders with corner seals */
                                  <div className="w-[130px] h-[82px] rounded-md border border-amber-600/30 bg-[#041326]/40 overflow-hidden shadow-md relative p-1.5 group-hover:scale-[1.03] transition-transform duration-300">
                                    <div className="absolute inset-0.5 border border-dashed border-[#00D4FF]/20"></div>
                                    {doc.previewUrl ? (
                                      <img src={doc.previewUrl} alt={doc.type} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-950 font-manrope text-[8px] text-slate-500 uppercase">
                                        No Doc View
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right column: Document details */}
                              <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-[12px] font-bold text-white uppercase tracking-wider truncate font-manrope">
                                      {doc.type}
                                    </h4>
                                    <span className={`text-[8px] font-manrope font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                      isPartyA 
                                        ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30" 
                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    }`}>
                                      {doc.party}
                                    </span>
                                  </div>

                                  <div className="mt-1.5 space-y-1 text-[10px]">
                                    <div className="text-slate-400 font-manrope truncate">
                                      Owner: <span className="text-white font-bold">{ownerName}</span>
                                    </div>
                                    <div className="text-slate-500 font-manrope truncate text-[9px]">
                                      File: <span className="text-slate-300 font-normal">{doc.name}</span>
                                    </div>
                                    {doc.issuedDate && doc.expiryDate && (
                                      <div className="text-slate-500 font-manrope text-[8.5px] flex flex-wrap gap-x-2 gap-y-0.5">
                                        <span className="text-slate-400 font-manrope">Issued: <strong className="text-slate-300 font-manrope">{doc.issuedDate}</strong></span>
                                        <span className="text-slate-400 font-manrope">Expires: <strong className="text-rose-400 font-manrope">{doc.expiryDate}</strong></span>
                                      </div>
                                    )}
                                    <div className="text-slate-500 font-manrope text-[8px] flex items-center gap-2">
                                      <span>Size: {doc.size}</span>
                                      <span>•</span>
                                      <span>Index: {doc.id ? doc.id.replace('doc_', '').slice(0, 6).toUpperCase() : "SEC-ID"}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between">
                                  <div className="inline-flex items-center gap-1.5 text-emerald-400 font-manrope text-[8.5px] font-extrabold tracking-wider bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 uppercase">
                                    <Shield size={10} className="stroke-[2.5]" />
                                    AES-256 SECURED
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIdentityDocs(identityDocs.filter(d => d.id !== doc.id));
                                    }}
                                    className="text-[9px] uppercase tracking-widest font-manrope font-extrabold text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <X size={10} className="stroke-[2.5]" /> Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-[#00050d] border border-dashed border-white/10 p-8 text-center rounded-lg mt-3">
                        <p className="text-[10.5px] text-slate-500 font-semibold uppercase tracking-wider">No identity document credentials attached to this contract yet.</p>
                        <p className="text-[9px] text-slate-650 mt-1 uppercase tracking-widest font-manrope">Select a participant and a document type above to begin securing credentials.</p>
                      </div>
                    )}
                  </div>
                </div>
             )}

             {activeSection === "Contract AI Advisor" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>CONTRACT AI ADVISOR</h2>
                  <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 p-4 rounded text-[#00D4FF] text-[10px] leading-relaxed uppercase tracking-widest font-bold mb-6">
                    <Cpu size={16} className="mb-2" />
                    Purpose: Contract assistance only. Not legal advice. Not law firm services.
                  </div>
                  
                  {aiState.task ? (
                     <div className="bg-[#0a1c34]/20 border border-white/10 p-6 rounded-lg text-center animate-in fade-in zoom-in-95">
<Cpu size={32} className={`mx-auto mb-4 ${aiState.status === 'loading' ? 'text-[#00D4FF] animate-pulse' : 'text-emerald-400'}`} />
                        <div className="text-[12px] font-bold text-white uppercase tracking-widest mb-2">{aiState.task}</div>
                        {aiState.status === 'loading' ? (
<div className="text-[10px] text-[#00D4FF] uppercase tracking-widest">Processing request...</div>
                        ) : (
                           <div className="mt-4">
                              <div className="text-[11px] text-slate-300 bg-[#041326]/40 p-4 rounded border border-white/10 text-left leading-relaxed">
                                {aiState.result}
                              </div>
<button onClick={() => setAiState({task: null, status: 'idle'})} className="mt-6 text-[10px] text-[#00D4FF] uppercase tracking-widest font-bold hover:text-white transition-colors border border-[#00D4FF]/30 py-2 px-4 rounded">
                                Return to Advisor
                              </button>
                           </div>
                        )}
                     </div>
                  ) : (
                    <div className="grid gap-3">
                      {["Clause Review", "Risk Detection", "Jurisdiction Analysis", "Classification Compliance", "Flag State Considerations", "Sanctions Screening Alerts", "Redline Analysis"].map((f) => (
<button key={f} onClick={() => runAdvisor(f)} className="text-left bg-[#0a1c34]/20 border border-white/10 p-4 rounded hover:border-[#00D4FF]/50 transition-colors group">
                          <div className="text-[11px] font-bold text-white uppercase tracking-widest">{f}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 group-hover:text-[#00D4FF]">Initialize Process <ArrowRight size={12} className="inline"/></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
             )}

             {activeSection === "Deliverables" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>DELIVERABLES & SCOPE</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Scope of Goods & Services</label>
                    <textarea className={`${inputClass} min-h-[140px] leading-relaxed py-2`} value={contractFields.deliverables} onChange={e => setContractFields({...contractFields, deliverables: e.target.value})} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Key Milestones & Project Timelines</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.milestones} onChange={e => setContractFields({...contractFields, milestones: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Commercial Terms" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>COMMERCIAL TERMS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Base Commercial Formula & Pricing Terms</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.commercialTerms} onChange={e => setContractFields({...contractFields, commercialTerms: e.target.value})} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Surcharges / Demurrage Limits</label>
                    <input className={inputClass} value={contractFields.surcharges} onChange={e => setContractFields({...contractFields, surcharges: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Payment Terms" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>PAYMENT TERMS & CONFIG</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Payment Terms, Net Limits & Invoicing Procedures</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.paymentTerms} onChange={e => setContractFields({...contractFields, paymentTerms: e.target.value})} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Supported Payment Execution Methods</label>
                    <input className={inputClass} value={contractFields.paymentMethod} onChange={e => setContractFields({...contractFields, paymentMethod: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Delivery Terms" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>DELIVERY & CARGO LOGISTICS</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Target Incoterms (2020)</label>
                      <input className={inputClass} value={contractFields.incoterms} onChange={e => setContractFields({...contractFields, incoterms: e.target.value})} />
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Discharge Location / Port</label>
                      <input className={inputClass} value={contractFields.deliveryLocation} onChange={e => setContractFields({...contractFields, deliveryLocation: e.target.value})} />
                    </div>
                  </div>
                </div>
             )}

             {activeSection === "Warranty" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>WARRANTY & PERFORMANCE SLAS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Standard Warranty Period</label>
                    <input className={inputClass} value={contractFields.warrantyPeriod} onChange={e => setContractFields({...contractFields, warrantyPeriod: e.target.value})} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Performance Execution Warranty Scope</label>
                    <textarea className={`${inputClass} min-h-[110px] leading-relaxed py-2`} value={contractFields.warrantyScope} onChange={e => setContractFields({...contractFields, warrantyScope: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Liability" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>LIABILITY COVENANTS</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Total Liability Limit Cap</label>
                      <input className={inputClass} value={contractFields.liabilityLimit} onChange={e => setContractFields({...contractFields, liabilityLimit: e.target.value})} />
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Consequential Damage Exemptions</label>
                      <input className={inputClass} value={contractFields.consequentialDamages} onChange={e => setContractFields({...contractFields, consequentialDamages: e.target.value})} />
                    </div>
                  </div>
                </div>
             )}

             {activeSection === "Confidentiality" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>CONFIDENTIALITY POLICY</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>NDA Non-Disclosure Duration</label>
                    <input className={inputClass} value={contractFields.confidentialityDuration} onChange={e => setContractFields({...contractFields, confidentialityDuration: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Termination" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>TERMINATION & CURE DEFICITS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Termination Notice Periods & Special Provisions</label>
                    <textarea className={`${inputClass} min-h-[130px] leading-relaxed py-2`} value={contractFields.terminationNotice} onChange={e => setContractFields({...contractFields, terminationNotice: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Arbitration" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>ARBITRATION RESOLUTION RULES</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Custom Arbitration Rules & Framework Procedures</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.arbitrationRules} onChange={e => setContractFields({...contractFields, arbitrationRules: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Signatures" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>CONTRACT SIGNATORY DEFINITIONS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Party A Authorized Signatory</label>
                    <input className={`${inputClass} border-white/10 opacity-60`} value={`${partyA.name} (${partyA.email})`} disabled />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Party B Authorized Signatory</label>
                    <input className={`${inputClass} border-white/10 opacity-60`} value={`${partyB.name} (${partyB.email})`} disabled />
                  </div>
                </div>
             )}

             {activeSection === "Annexes" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>ANNEXES & SCHEDULE LAYOUT</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Linked Supplementary Document Listings & Appendices</label>
                    <textarea className={`${inputClass} min-h-[140px] leading-relaxed py-2`} value={contractFields.annexes} onChange={e => setContractFields({...contractFields, annexes: e.target.value})} />
                  </div>
                </div>
             )}

             {activeSection === "Verification" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>IDENTITY VERIFICATION & ENCRYPTION</h2>
                  
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-xl space-y-4 font-manrope">
                    <div>
                      <label className={labelClass}>Active Ledger Verification Reference</label>
                      <input className={inputClass} value={contractFields.verificationCode} onChange={e => setContractFields({...contractFields, verificationCode: e.target.value})} />
                    </div>

                    <div className="border-t border-white/10 pt-4 flex flex-col items-center">
                      <span className="text-[10px] font-manrope text-cyan-400 font-bold uppercase tracking-widest mb-3">Live Scannable Certificate QR</span>
                      
                      {qrDataUrl ? (
                        <div className="bg-white p-2.5 rounded-xl border border-white/10/50 shadow-lg shadow-black/40 flex items-center justify-center">
                          <img src={qrDataUrl} alt="Contract Verification Certificate" className="w-[120px] h-[120px]" />
                        </div>
                      ) : (
                        <div className="w-[120px] h-[120px] border border-dashed border-white/10 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-manrope">
                          Generating QR Code...
                        </div>
                      )}

                      <div className="text-center mt-3 space-y-1">
                        <div className="text-[11.5px] text-slate-200 font-bold uppercase tracking-wide">Decentralized Verification Gateway</div>
                        <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed mt-1 font-medium">
                          This QR code embeds an authorized digital signature verification link. Stakeholders can scan it in printed or digital form to verify real-time execution records.
                        </p>
                      </div>

                      <div className="w-full mt-4">
                        <button
                          onClick={() => {
                            const verifyUrl = `${window.location.origin}?verify=${contractFields.verificationCode || '8A7F-31CC-0E2A-5501-7F03'}`;
                            navigator.clipboard.writeText(verifyUrl);
                            console.log("Sovereign verification link successfully copied to clipboard.");
                            // alert("Sovereign verification link successfully copied to clipboard.");
                          }}
className="w-full bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30 hover:border-[#00D4FF] text-[#00D4FF] hover:text-white transition-all text-[9.5px] font-manrope font-bold tracking-widest uppercase py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <FileSignature size={12} /> COPY VERIFIABLE LINK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
             )}

             {activeSection === "Audit Trail" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>CRYPTOGRAPHIC AUDIT TRAIL LOGS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Verified Digital Ledger History (Chronological Logs)</label>
                    <textarea className={`${inputClass} min-h-[140px] font-manrope text-emerald-400 text-[10px] leading-relaxed tracking-wider py-2`} value={contractFields.auditTrail} onChange={e => setContractFields({...contractFields, auditTrail: e.target.value})} />
                  </div>
                </div>
             )}

          </div>
        </div>

        {/* RIGHT PANEL - Live Execution Copy (Adaptable dynamic width) */}
        <div className="flex-1 bg-[#0b0f19] flex flex-col z-0 relative overflow-hidden min-w-0 transition-all duration-300 border-l border-white/10">
          {/* Output Toolbar */}
          <div className="h-12 bg-[#0a1c34]/20/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 shrink-0 absolute top-0 left-0 right-0 z-10">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-manrope flex items-center gap-2">
<Eye size={14} className="text-[#00D4FF]" /> LIVE EXECUTIVE DOCUMENT WORKSPACE
            </div>
            <div className="flex items-center gap-4 text-slate-400">
               <button className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Search"><Search size={14} /></button>
              <button onClick={handleDownload} className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Download PDF"><Download size={14} /></button>
            </div>
          </div>

          <div id="contract-pages-container" className="flex-1 overflow-auto pt-20 pb-20 px-8 flex flex-col items-center bg-[#0b0f19] min-w-0 font-sans">
            
            {/* --- THE A4 PDF RENDERING PAGE --- */}
            {/* A4 is 210x297. We use aspect ratio and max-width to simulate it properly. */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
               
               {/* 0.5px border inside margin */}
               <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>

               {/* Document Content Wrapper */}
               <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                 
                 {/* Heading */}
                 <div className="text-center mt-12 mb-20">
                   <h1 className="text-xl font-serif uppercase text-black font-bold tracking-tight mb-2" style={{ fontFamily: '"Source Serif 4", serif' }}>
                     {foundation.title}
                   </h1>
                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Commercial Agreement</div>
                 </div>

                 {/* Cover Page Details / Foundation Summary */}
                 <div className="space-y-6 flex-1 px-8">
                   <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-slate-200 pb-4">
                     <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Agreement Type</span>
                     <span className="text-[12px] font-serif">{foundation.type}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-slate-200 pb-4">
                     <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Effective Date</span>
                     <span className="text-[12px] font-serif">{foundation.effectiveDate}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-slate-200 pb-4">
                     <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Transaction</span>
                     <span className="text-[12px] font-serif">{foundation.transactionType}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-slate-200 pb-4">
                     <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Parties</span>
                     <div className="text-[11px] font-sans space-y-3">
                        <div>
                          <span className="font-serif uppercase font-bold text-black text-[11.5px]">{partyA.name}</span>
                          <span className="text-[9px] text-slate-400 font-sans tracking-widest ml-1.5 uppercase font-medium">({partyA.role})</span>
                          {partyA.address && <div className="text-slate-600 text-[9.5px] mt-0.5 leading-tight">Address: {partyA.address}</div>}
                          {partyA.idNumber && <div className="text-slate-650 text-[9.5px] mt-0.5">ID/Passport: {partyA.idNumber}</div>}
                          <div className="text-[#19A7C1] text-[9.5px] font-sans mt-0.5">
                            Emails: {[partyA.email, ...(partyA.additionalEmails || [])].filter(Boolean).join(", ")}
                            {partyA.confirmEmail && <span className="ml-1.5 inline-flex items-center text-[7.5px] font-extrabold bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded font-sans tracking-wide uppercase border border-emerald-200">✓ OWNER_VERIFIED</span>}
                          </div>
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-2">
                          <span className="font-serif uppercase font-bold text-black text-[11.5px]">{partyB.name}</span>
                          <span className="text-[9px] text-slate-400 font-sans tracking-widest ml-1.5 uppercase font-medium">({partyB.role})</span>
                          {partyB.address && <div className="text-slate-600 text-[9.5px] mt-0.5 leading-tight">Address: {partyB.address}</div>}
                          {partyB.idNumber && <div className="text-slate-650 text-[9.5px] mt-0.5">ID/Passport: {partyB.idNumber}</div>}
                          <div className="text-[#19A7C1] text-[9.5px] font-sans mt-0.5">
                            Emails: {[partyB.email, ...(partyB.additionalEmails || [])].filter(Boolean).join(", ")}
                            {partyB.confirmEmail && <span className="ml-1.5 inline-flex items-center text-[7.5px] font-extrabold bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded font-sans tracking-wide uppercase border border-emerald-200">✓ OWNER_VERIFIED</span>}
                          </div>
                        </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-slate-200 pb-4">
                     <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Value</span>
                     <span className="text-[12px] font-serif">{foundation.currency} {foundation.value}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-slate-200 pb-4">
                     <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Governing Law</span>
                     <span className="text-[12px] font-serif">{jurisdiction.law}</span>
                   </div>
                   <div className="grid grid-cols-[140px_1fr] gap-2 pb-4">
                     <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Arbitration Seat</span>
                     <span className="text-[12px] font-serif">{jurisdiction.seat} ({jurisdiction.institution})</span>
                   </div>
                 </div>

                 {/* Signatures Abstract for Page 1 Overview */}
                 <div className="mt-8 px-8 hidden">
                   <div className="grid grid-cols-2 gap-12">
                      <div className="border-t border-black pt-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest">For & On Behalf Of</div>
                        <div className="text-[11px] font-serif mt-1 font-bold">{partyA.name}</div>
                      </div>
                      <div className="border-t border-black pt-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest">For & On Behalf Of</div>
                        <div className="text-[11px] font-serif mt-1 font-bold">{partyB.name}</div>
                      </div>
                   </div>
                 </div>

                 {/* Footer replacement as requested */}
                 <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                    <div>
                      <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                      <div className="mt-1">Verified Execution Record | Digital Infrastructure Reference</div>
                    </div>
                    <div className="text-right">
                      <div className="uppercase tracking-widest font-bold text-slate-800">Verification Hash</div>
                      <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]} | DOC-REF-902</div>
                    </div>
                 </div>

               </div>
            </div>

            {/* Second Page (Structure) */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
               <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
               <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                  <h2 className="text-[11px] font-serif font-bold uppercase tracking-widest mb-8 border-b border-black pb-4 text-center">TABLE OF CONTENTS</h2>
                  <div className="space-y-4 px-12 text-[11px] flex-1">
                     {sections.map((sec, idx) => {
                       if (sec === "Contract AI Advisor" || sec === "Verification" || sec === "Participants") return null;
                       return (
                         <div key={sec} className="flex justify-between items-end border-b border-slate-100 pb-1">
                           <span className="font-sans uppercase tracking-widest"><span className="text-slate-400 mr-2">{String(idx + 1).padStart(2, '0')}.</span> {sec}</span>
                           <span className="text-slate-400 font-sans text-[9px]">P. {idx + 3}</span>
                         </div>
                       );
                     })}
                  </div>
                  
                  <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                    <div>
                      <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                      <div className="mt-1">Verified Execution Record | Digital Infrastructure Reference</div>
                    </div>
                    <div className="text-right">
                      <div className="uppercase tracking-widest font-bold text-slate-800">Verification Hash</div>
                      <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]} | DOC-REF-902</div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Page 3 - Section 02 - Deliverables */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
              <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
              <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                <h2 className="text-[10.5px] font-serif font-black text-black uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
                  <span>SECTION 02 - DELIVERABLES & TECHNICAL SCOPE</span>
                  <span className="text-slate-400">P. 3</span>
                </h2>
                
                <div className="space-y-6 text-[11px] leading-relaxed font-serif text-slate-800 flex-1">
                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">2.1 Scope of Goods & Services Delivery</p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300">{contractFields.deliverables}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6">2.2 Project Execution Milestones & Target Timeline</p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300">{contractFields.milestones}</p>

                  <p className="text-slate-400 italic text-[10px] mt-12 leading-normal">
                    * The above defined scope outlines the absolute operational requirements bound by the transactional agreement. Any deviations from specified progress timelines must be reported in writing.
                  </p>
                </div>

                <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                  <div>
                    <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                    <div className="mt-1">Verified Execution Record | Section 02</div>
                  </div>
                  <div className="text-right">
                    <div className="uppercase tracking-widest font-bold text-slate-800">Page 3 of 8</div>
                    <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 4 - Section 03 - Commercials */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
              <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
              <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                <h2 className="text-[10.5px] font-serif font-black text-black uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
                  <span>SECTION 03 - COMMERCIALS, COSTS & MODEL</span>
                  <span className="text-slate-400">P. 4</span>
                </h2>
                
                <div className="space-y-6 text-[11px] leading-relaxed font-serif text-slate-800 flex-1">
                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">3.1 Contract Valuation & Currency Indexing</p>
                  <p className="text-slate-800">
                    The total agreed base commercial valuation for the duration of this agreement is calculated at: <strong className="text-black text-sm">{foundation.currency} {foundation.value}</strong>.
                  </p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">3.2 Structural Formula Parameters</p>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border border-slate-200 font-sans text-[10px] uppercase tracking-widest">
                    <div>
                      <span className="text-slate-500 block">Pricing Model:</span>
                      <strong className="text-slate-800">{foundation.commercialModel || "Fixed Price"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Payment Invoicing:</span>
                      <strong className="text-slate-800">{foundation.paymentStructure || "100% Advance"}</strong>
                    </div>
                  </div>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6">3.3 Additional Commercial Adjustments</p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300">{contractFields.commercialTerms}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-4">3.4 Demurrage / Surcharges & Extra waiting</p>
                  <p className="text-slate-800 pl-2 border-l border-slate-300">{contractFields.surcharges}</p>
                </div>

                <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                  <div>
                    <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                    <div className="mt-1">Verified Execution Record | Section 03</div>
                  </div>
                  <div className="text-right">
                    <div className="uppercase tracking-widest font-bold text-slate-800">Page 4 of 8</div>
                    <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 5 - Section 04 - Invoicing and Logistics */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
              <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
              <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                <h2 className="text-[10.5px] font-serif font-black text-black uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
                  <span>SECTION 04 - PAYMENT TERMS & LOGISTICS</span>
                  <span className="text-slate-400">P. 5</span>
                </h2>
                
                <div className="space-y-6 text-[11px] leading-relaxed font-serif text-slate-800 flex-1">
                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">4.1 Net Terms & Invoicing Procedures</p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300">{contractFields.paymentTerms}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">4.2 Supported Remittance Methods</p>
                  <p className="text-slate-800 pl-2 border-l border-slate-300">{contractFields.paymentMethod}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6">4.3 Physical Delivery & Incoterms Profile</p>
                  <p className="text-slate-800">
                    The logistical supply delivery operates under: <strong>{contractFields.incoterms}</strong>.
                  </p>
                  <p className="text-slate-800">
                    Designated discharge/logistics terminal: <strong>{contractFields.deliveryLocation}</strong>.
                  </p>
                </div>

                <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                  <div>
                    <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                    <div className="mt-1">Verified Execution Record | Section 04</div>
                  </div>
                  <div className="text-right">
                    <div className="uppercase tracking-widest font-bold text-slate-800">Page 5 of 8</div>
                    <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 6 - Section 05 - Warranty and Liabilities */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
              <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
              <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                <h2 className="text-[12px] font-serif font-bold uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
                  <span>SECTION 05 - WARRANTIES & LIABILITY COVENANTS</span>
                  <span className="text-slate-400">P. 6</span>
                </h2>
                
                <div className="space-y-6 text-[11px] leading-relaxed font-serif text-slate-800 flex-1">
                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">5.1 Warranty Service Duration Profile</p>
                  <p className="text-slate-800">
                    Active warranty timeline covers: <strong>{contractFields.warrantyPeriod}</strong>.
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300">{contractFields.warrantyScope}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6">5.2 Limitations of Liabilities & waivers</p>
                  <p className="text-slate-800">
                    The total collective cap for monetary liability under this contractual arrangement is restricted to: <strong className="text-black">{contractFields.liabilityLimit}</strong>.
                  </p>
                  <p className="text-slate-800">
                    Special waiver of consequential/indirect loss: <strong>{contractFields.consequentialDamages}</strong>.
                  </p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6">5.3 Confidentiality Non-Disclosure Timeline</p>
                  <p className="text-slate-800">
                    All intellectual materials shared during this agreement shall remain protected under strict NDA terms for: <strong>{contractFields.confidentialityDuration}</strong>.
                  </p>
                </div>

                <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                  <div>
                    <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                    <div className="mt-1">Verified Execution Record | Section 05</div>
                  </div>
                  <div className="text-right">
                    <div className="uppercase tracking-widest font-bold text-slate-800">Page 6 of 8</div>
                    <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 7 - Section 06 - Terminations and Annexes */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
              <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
              <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                <h2 className="text-[12px] font-serif font-bold uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
                  <span>SECTION 06 - TERMINATION POLICY & ANNEXES</span>
                  <span className="text-slate-400">P. 7</span>
                </h2>
                
                <div className="space-y-6 text-[11px] leading-relaxed font-serif text-slate-800 flex-1">
                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">6.1 Termination Notice Guidelines</p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300">{contractFields.terminationNotice}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6">6.2 Supplementary Schedules & Appendices</p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300">{contractFields.annexes}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6 font-sans">6.3 Verified Contracting Participants & Identity Credentials</p>
                  <div className="space-y-4 pl-2 border-l border-slate-300">
                    {/* Participants List */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans block mb-1.5">Registered Witnesses & Surveyors</span>
                      {participants && participants.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                          {participants.map((p, idx) => (
                            <div key={p.id || idx} className="bg-slate-50 p-2 rounded border border-slate-150">
                              <span className="font-sans font-bold text-slate-800 uppercase block">{p.name}</span>
                              <span className="text-slate-500 block text-[9.5px]">Role: {p.role}</span>
<span className="text-[#00D4FF] font-sans block text-[9px]">{p.contact}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">No additional participants registered.</span>
                      )}
                    </div>

                    {/* Identity Docs List */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans block mb-1.5">Verified Identity and Registration Certificates</span>
                      {identityDocs.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                          {identityDocs.map((doc, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-150 flex items-center justify-between">
                              <div>
                                <span className="font-sans font-bold text-slate-800 uppercase text-[9px] block tracking-wide">
                                  {doc.type} <span className="text-slate-400 font-normal text-[8px]">({doc.party})</span>
                                </span>
                                <span className="text-slate-500 block text-[9.5px] truncate max-w-[170px]">{doc.name}</span>
                              </div>
                              <div className="text-right">
 <span className="text-[#00D4FF] font-extrabold uppercase text-[7px] bg-slate-50 border border-slate-200 px-1 py-0.2 rounded font-sans tracking-wide block mb-0.5">SECURE_REF</span>
                                <span className="text-slate-400 font-sans text-[8px] block">{doc.size}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">No identity certification files attached.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                  <div>
                    <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                    <div className="mt-1">Verified Execution Record | Section 06</div>
                  </div>
                  <div className="text-right">
                    <div className="uppercase tracking-widest font-bold text-slate-800">Page 7 of 8</div>
                    <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 8 - Section 07 - Execution Signatures */}
            <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
              <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
              <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                <h2 className="text-[12px] font-serif font-bold uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
                  <span>SECTION 07 - DISPUTES & EXECUTION SIGNATURES</span>
                  <span className="text-slate-400">P. 8</span>
                </h2>
                
                <div className="space-y-6 text-[11px] leading-relaxed font-serif text-slate-800 flex-1">
                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">7.1 Governing Law and Dispute Seat</p>
                  <p className="text-slate-800">
                    This agreement is regulated sub-textually under: <strong>{jurisdiction.law}</strong>. All disputes are submitted to active local arbitration at seat: <strong>{jurisdiction.seat}</strong> under <strong>{jurisdiction.institution}</strong> guidelines.
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap pl-2 border-l border-slate-300 text-[10px]">{contractFields.arbitrationRules}</p>

                  <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700 mt-6">7.2 Digital Identity Authorized Signatures</p>
                  <div className="grid grid-cols-2 gap-12 mt-4 pt-4 border-t border-slate-100">
                    <div className="border-t border-black pt-2 relative">
<div className="text-[9px] font-bold uppercase tracking-widest text-[#00D4FF]">For & On Behalf Of (A)</div>
                      <div className="text-[11px] font-serif mt-1 font-bold">{partyA.name}</div>
                      <div className="text-[9px] text-slate-500 mt-1 font-sans">
                        Emails: {[partyA.email, ...(partyA.additionalEmails || [])].filter(Boolean).join(", ")}
                      </div>
                      {partyA.idNumber && <div className="text-[9px] text-slate-650 mt-0.5 font-sans">Reg/ID: {partyA.idNumber}</div>}
                      {isExecuted ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/15 px-2.5 py-1 rounded-md text-[10px] font-sans font-extrabold text-emerald-700 tracking-wider uppercase animate-in fade-in zoom-in-95 leading-none">
                          <ShieldCheck size={12} className="text-[#10b981] shrink-0 stroke-[2.2]" />
                          <span>Verified Signature</span>
                        </div>
                      ) : (
                        <div className="mt-3 text-[9px] text-amber-600 font-sans uppercase tracking-[0.1em] bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block font-bold">Pending Signature</div>
                      )}
                    </div>
                    <div className="border-t border-black pt-2 relative">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">For & On Behalf Of (B)</div>
                      <div className="text-[11px] font-serif mt-1 font-bold">{partyB.name}</div>
                      <div className="text-[9px] text-slate-500 mt-1 font-sans">
                        Emails: {[partyB.email, ...(partyB.additionalEmails || [])].filter(Boolean).join(", ")}
                      </div>
                      {partyB.idNumber && <div className="text-[9px] text-slate-650 mt-0.5 font-sans">Reg/ID: {partyB.idNumber}</div>}
                      {isExecuted ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/15 px-2.5 py-1 rounded-md text-[10px] font-sans font-extrabold text-emerald-700 tracking-wider uppercase animate-in fade-in zoom-in-95 leading-none">
                          <ShieldCheck size={12} className="text-[#10b981] shrink-0 stroke-[2.2]" />
                          <span>Verified Signature</span>
                        </div>
                      ) : (
                        <div className="mt-3 text-[9px] text-amber-600 font-sans uppercase tracking-[0.1em] bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block font-bold">Pending Signature</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_130px] gap-6 mt-6">
                    <div>
                      <p className="font-bold underline uppercase tracking-wider text-[10px] text-slate-700">7.3 Cryptographic Chain Ledger Audit Logs</p>
                      <div className="bg-slate-50 p-3 rounded font-sans text-[8.5px] text-slate-600 border border-slate-200 mt-2 whitespace-pre-wrap leading-relaxed h-[115px] overflow-hidden">
                        VERIFICATION HASH: {contractFields.verificationCode}<br/>
                        {contractFields.auditTrail}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 self-end">
                      <div className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-sans leading-none text-center">SECURE VERIFY</div>
                      {qrDataUrl ? (
                        <div className="relative group">
                          <img src={qrDataUrl} alt="Verification QR Code" className="w-[80px] h-[80px] border border-slate-200 bg-white p-0.5 rounded shadow-sm" />
                          <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded pointer-events-none flex items-center justify-center">
                            <span className="bg-[#041326]/40/90 text-[6px] text-emerald-450 px-1 py-0.5 rounded uppercase font-bold tracking-wider">LIVE RECORD</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-[80px] h-[80px] border border-dashed border-slate-300 rounded bg-white flex items-center justify-center text-[8px] text-slate-400 font-sans">No Code</div>
                      )}
                      <div className="text-[6.5px] font-sans text-slate-400 mt-2 text-center leading-none tracking-tight">ID: {contractFields.verificationCode ? contractFields.verificationCode.slice(0, 9) : "PENDING"}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                  <div>
                    <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                    <div className="mt-1">Verified Execution Record | Section 07</div>
                  </div>
                  <div className="text-right">
                    <div className="uppercase tracking-widest font-bold text-slate-800">Page 8 of 8</div>
                    <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 9 - Appendix of Attached Identity Documents */}
            {identityDocs.length > 0 && (
              <div className="contract-page-sheet w-[800px] h-[1131px] bg-white relative p-12 lg:p-16 flex flex-col shrink-0 mt-8 rounded-sm animate-in fade-in" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
                <div className="absolute top-[20mm] bottom-[20mm] left-[20mm] right-[20mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
                <div className="relative z-10 w-full h-full flex flex-col font-sans px-8 py-8 text-slate-900">
                  <h2 className="text-[12px] font-serif font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 flex justify-between">
                    <span>ANNEX A - SECURE IDENTITY &amp; REGISTRATION CREDENTIALS</span>
                    <span className="text-slate-400">P. 9</span>
                  </h2>
                  
                  <div className="space-y-6 text-[11px] leading-relaxed font-serif text-slate-800 flex-1 overflow-hidden">
                    <p className="text-[10px] text-slate-500 font-sans tracking-wide leading-relaxed mb-4">
                      The following credential attachments have been electronically checked, cryptographically signed, and securely appended to this contract. They remain tamper-evident and protected under AES-256 standard protocols.
                    </p>

                    <div className="grid grid-cols-2 gap-8 h-[780px]">
                      {/* Party A Attachments Column */}
                      <div className="border-r border-slate-200 pr-4 flex flex-col h-full">
                        <div className="text-[10px] font-sans font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5 mb-3 flex items-center justify-between">
                          <span>{partyA.name || "Party A"} Attachments</span>
<span className="text-[8px] bg-[#00D4FF]/10 text-[#00D4FF] px-1.5 py-0.2 rounded font-sans font-bold">PARTY A</span>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                          {identityDocs.filter(d => d.party === "Party A").length > 0 ? (
                            identityDocs.filter(d => d.party === "Party A").map((doc, idx) => {
                              const isCard = doc.type.toLowerCase().includes("passport") || doc.type.toLowerCase().includes("id") || doc.type.toLowerCase().includes("national");
                              return (
                                <div key={doc.id || idx} className="border border-slate-250 rounded-lg p-2.5 bg-slate-50 relative flex flex-col">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-sans font-bold text-slate-950 uppercase">{doc.type}</span>
                                    <span className="text-[7.5px] font-sans text-slate-400">{doc.size}</span>
                                  </div>
                                  
                                  {/* Container Frame */}
                                  <div className={`p-1.5 rounded bg-slate-950 flex items-center justify-center relative overflow-hidden h-[120px] ${
                                    isCard ? "border-2 border-slate-705 shadow-inner" : "border border-amber-600/35"
                                  }`}>
                                    {isCard && <div className="absolute top-1 left-1 w-2.5 h-1.5 bg-amber-500/70 rounded-xs"></div>}
                                    {doc.previewUrl ? (
                                      <img src={doc.previewUrl} alt={doc.type} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className="text-slate-600 font-sans text-[8px]">NO VIEW</span>
                                    )}
                                  </div>
                                  
                                  <div className="text-[7.5px] font-sans text-slate-500 mt-2 truncate flex justify-between items-center">
                                    <span className="truncate">Source: {doc.name}</span>
                                    <span className="text-emerald-600 shrink-0 font-bold ml-1 font-sans">✓ SECURE_SEAL</span>
                                  </div>
                                  {doc.issuedDate && doc.expiryDate && (
                                    <div className="text-[7px] text-slate-500 font-sans mt-1 flex justify-between border-t border-slate-200/60 pt-1">
                                      <span>Issue: <strong>{doc.issuedDate}</strong></span>
                                      <span className="text-rose-600 font-semibold">Expiry: <strong>{doc.expiryDate}</strong></span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-28 border border-dashed border-slate-200 rounded flex flex-col items-center justify-center text-slate-400 text-[9.5px] italic">
                              No credential attached for Party A.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Party B Attachments Column */}
                      <div className="flex flex-col h-full">
                        <div className="text-[10px] font-sans font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5 mb-3 flex items-center justify-between">
                          <span>{partyB.name || "Party B"} Attachments</span>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-700 px-1.5 py-0.2 rounded font-sans font-bold">PARTY B</span>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                          {identityDocs.filter(d => d.party === "Party B").length > 0 ? (
                            identityDocs.filter(d => d.party === "Party B").map((doc, idx) => {
                              const isCard = doc.type.toLowerCase().includes("passport") || doc.type.toLowerCase().includes("id") || doc.type.toLowerCase().includes("national");
                              return (
                                <div key={doc.id || idx} className="border border-slate-250 rounded-lg p-2.5 bg-slate-50 relative flex flex-col">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-sans font-bold text-slate-950 uppercase">{doc.type}</span>
                                    <span className="text-[7.5px] font-sans text-slate-400">{doc.size}</span>
                                  </div>
                                  
                                  {/* Container Frame */}
                                  <div className={`p-1.5 rounded bg-slate-950 flex items-center justify-center relative overflow-hidden h-[120px] ${
                                    isCard ? "border-2 border-slate-705 shadow-inner" : "border border-amber-600/35"
                                  }`}>
                                    {isCard && <div className="absolute top-1 left-1 w-2.5 h-1.5 bg-amber-500/70 rounded-xs"></div>}
                                    {doc.previewUrl ? (
                                      <img src={doc.previewUrl} alt={doc.type} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className="text-slate-600 font-sans text-[8px]">NO VIEW</span>
                                    )}
                                  </div>
                                  
                                  <div className="text-[7.5px] font-sans text-slate-500 mt-2 truncate flex justify-between items-center">
                                    <span className="truncate">Source: {doc.name}</span>
                                    <span className="text-emerald-600 shrink-0 font-bold ml-1 font-sans">✓ SECURE_SEAL</span>
                                  </div>
                                  {doc.issuedDate && doc.expiryDate && (
                                    <div className="text-[7px] text-slate-500 font-sans mt-1 flex justify-between border-t border-slate-200/60 pt-1">
                                      <span>Issue: <strong>{doc.issuedDate}</strong></span>
                                      <span className="text-rose-600 font-semibold">Expiry: <strong>{doc.expiryDate}</strong></span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-28 border border-dashed border-slate-200 rounded flex flex-col items-center justify-center text-slate-400 text-[9.5px] italic">
                              No credential attached for Party B.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 text-[8px] text-slate-500 border-t border-slate-200 flex justify-between font-sans">
                    <div>
                      <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL COMMERCIAL CONTRACT</div>
                      <div className="mt-1">Verified Execution Record | Secure Appendices</div>
                    </div>
                    <div className="text-right">
                      <div className="uppercase tracking-widest font-bold text-slate-800">Page 9 of 9</div>
                      <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="h-20 shrink-0"></div>
          </div>
        </div>
      </div>
    </>
  )}
      {showExecutionModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0a1c34]/20/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0A203D] border border-emerald-500/30 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_60px_rgba(16,185,129,0.25)] text-center relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-[#00D4FF] animate-pulse"></div>
            
            {executionState === 'signing' && (
              <div className="py-6 space-y-5 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-emerald-400 animate-spin mx-auto"></div>
                <div>
                  <h3 className="text-[11px] font-sans font-bold text-emerald-400 tracking-widest uppercase">GENERATING SEAL</h3>
                  <h2 className="text-lg font-serif text-white font-bold leading-relaxed mt-2 uppercase">Applying Cryptographic Signatures</h2>
                  <p className="text-[10px] text-slate-400 mt-2 font-sans px-8 leading-relaxed">
                    The contract document is being sealed with an immutable SHA-256 algorithm and recorded inside the decentralized validation ledgers...
                  </p>
                </div>
              </div>
            )}

            {executionState === 'sending_emails' && (
              <div className="py-2 space-y-4 text-left animate-in fade-in duration-250 font-sans">
                <div className="text-center mb-4">
<div className="w-12 h-12 bg-[#00D4FF]/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <Mail size={22} className="text-[#00D4FF]" />
                  </div>
                  <h3 className="text-[11px] font-sans font-bold text-[#00D4FF] tracking-widest uppercase">EMAIL DISTRIBUTION</h3>
                  <h2 className="text-base font-bold text-white mt-1 uppercase">Dispatching Contract Copies to Parties</h2>
                </div>
                
                <div className="bg-[#0a1c34]/20 border border-white/10 rounded-lg p-4 space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                  {emailStatus.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-white/10/50 pb-2.5 last:border-b-0 last:pb-0">
                      <div className="min-w-0 pr-3">
                        <div className="text-[10.5px] font-bold text-white uppercase tracking-wide truncate">{item.name}</div>
<div className="text-[8px] text-[#00D4FF] font-sans mt-0.5 uppercase tracking-wider">{item.role}</div>
                        <div className="text-[9px] text-slate-400 font-sans mt-0.5 truncate">{item.email}</div>
                      </div>
                      
                      <div className="shrink-0">
                        {item.status === 'sending' ? (
<span className="text-[8.5px] font-sans font-bold text-[#00D4FF] animate-pulse flex items-center gap-1.5 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-ping"></span> Sending
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-sans font-bold text-emerald-400 flex items-center gap-1 uppercase">
                            ✓ Dispatched
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {executionState === 'completed' && (
              <div className="animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 size={34} className="text-emerald-400" />
                </div>
                
                <h3 className="text-[11px] font-sans font-bold text-emerald-400 tracking-widest uppercase">AGREEMENT ACTIVE</h3>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider mt-2 font-serif">Contract Fully Executed</h2>
                
                <p className="text-[10.5px] text-slate-400 mt-2 leading-relaxed font-sans px-2">
                  All digital signatures have been applied and validated. The signed master copy of this agreement and execution proofs have been safely dispatched to the registered emails.
                </p>

                <div className="bg-[#0a1c34]/20 border border-white/10 rounded-lg p-3 mt-4 text-left text-[9.5px] text-slate-400 space-y-1.5 font-sans">
                  <div className="flex justify-between border-b border-white/10/50 pb-1.5">
                    <span className="text-[8px] uppercase">Ledger Status:</span>
                    <span className="text-emerald-450 font-bold uppercase">Success (Committed)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10/50 pb-1.5">
                    <span className="text-[8px] uppercase">Signatory Parties:</span>
                    <span className="text-slate-300 truncate">{partyA.email} | {partyB.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px] uppercase">Security Check:</span>
                    <span className="text-emerald-450">SHA-256 SECURED ✓</span>
                  </div>
                </div>

                {qrDataUrl && (
                  <div className="bg-[#0a1c34]/20 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-4 text-left mt-3">
                    <div className="bg-white p-1 rounded-lg shrink-0 border border-white/10 flex items-center justify-center">
                      <img src={qrDataUrl} alt="Signature Validation QR" className="w-14 h-14" />
                    </div>
                    <div>
                      <div className="text-[9.5px] font-sans text-emerald-400 font-extrabold uppercase tracking-widest">Verifiable Safe Seal</div>
                      <div className="text-[11px] text-white font-sans font-bold mt-0.5">Secure Physical-Digital Anchor</div>
                      <p className="text-[9.5px] text-slate-400 leading-normal font-sans mt-0.5">
                        Scan the embedded QR on any printed sheet to verify real-time digital credentials and ledger hashes instantly.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button 
                    onClick={handleDownload} 
className="w-full bg-[#00D4FF]/10 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/30 text-[#00D4FF] hover:text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.1)] font-bold tracking-widest uppercase text-[10px] py-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,212,255,0.15)] cursor-pointer font-sans"
                  >
                    <Download size={13} /> DOWNLOAD AGREEMENT
                  </button>
                  <button 
                    onClick={() => setShowExecutionModal(false)}
                    className="w-full bg-[#041326]/40 border border-white/10 text-slate-350 font-bold tracking-widest uppercase text-[10px] py-3.5 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer font-sans"
                  >
                    VIEW PREVIEW
                  </button>
                </div>
                
                <button 
                  onClick={() => {
                    setShowExecutionModal(false);
                    onBack(); // calling onBack to return directly to the Legal Entrance page / city!
                  }} 
                  className="w-full mt-3 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white font-bold tracking-widest uppercase text-[10px] py-3 rounded-lg hover:bg-emerald-500/10 transition-all cursor-pointer font-sans"
                >
                  ◀ BACK TO LEGAL PORTAL HUB
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showBillingWallModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-system-surface border border-white/10 p-8 rounded-2xl max-w-lg w-full shadow-2xl shadow-black/80 text-center relative overflow-hidden animate-in zoom-in-95 font-manrope">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary"></div>
            
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <CreditCard size={26} className="text-amber-500" />
            </div>
            
            <h3 className="text-[10px] font-manrope font-bold text-amber-500 tracking-wider uppercase mb-1">Insufficient Credit Balance</h3>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2 font-manrope">Execution Blocked</h2>
            
            <p className="text-[11.5px] text-slate-400 leading-relaxed mb-6 font-manrope">
              To publish this agreement (<strong className="text-white font-semibold font-manrope">{foundation.type || 'Contract'}</strong>) and initiate certified signature distribution, <strong className="text-primary font-bold font-manrope">{getContractCost(foundation.type)} Credits</strong> are required. You do not have sufficient balance.<br/><br/>
              Your Current Balance: <span className="text-rose-400 font-bold font-manrope">{creditsBalance} Credits</span>
            </p>

            <div className="bg-system-bg border border-white/5 rounded-xl p-4 mb-6 space-y-3 text-left">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide font-manrope">Secure Credit Top-up Packages:</div>
              <div className="space-y-2">
                {[
                  { name: "Starter Pack", credits: 10, price: "$5", description: "Individual Agreements" },
                  { name: "Professional Pack", credits: 100, price: "$25", description: "Brokers & Distributors" },
                  { name: "Enterprise Pack", credits: 1000, price: "$200", description: "Shipyards & Fleet Owners" }
                ].map((pack) => (
                  <button
                    key={pack.name}
                    onClick={() => {
                      buyCredits(pack.credits, pack.name, pack.price);
                      setShowBillingWallModal(false);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-system-surface border border-white/10 hover:border-primary rounded-lg text-left transition-all hover:bg-white/5 group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white font-manrope">{pack.name}</div>
                      <div className="text-[10px] text-slate-400 font-manrope">{pack.description} (+{pack.credits} Credits)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-primary group-hover:underline font-manrope">{pack.credits} CREDITS</div>
                      <div className="text-[10px] font-manrope text-emerald-400">{pack.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBillingWallModal(false)}
                className="flex-1 bg-[#041326]/40 border border-white/10 text-slate-300 font-bold tracking-wider uppercase text-[10px] py-3 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer font-sans"
              >
                Cancel Process
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (() => {
        const progressKey = tempDocType + "_" + uploadSelectedParty;
        const isUploading = uploadProgress[progressKey] !== undefined && uploadProgress[progressKey] > 0;

        const processSelectedFile = (file: File) => {
          const isImg = file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".png") || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");
          if (!isImg) {
            setTempValidationError("Invalid file format. Please upload PNG, JPG or JPEG images only.");
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            setTempValidationError("File is too large. Maximum size allowed is 10MB.");
            return;
          }
          const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
          setTempFile(file);
          setTempFileName(file.name);
          setTempFileSize(sizeStr);
          setTempValidationError(null);

          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target && typeof e.target.result === "string") {
              setTempPreviewUrl(e.target.result);
            }
          };
          reader.readAsDataURL(file);
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            processSelectedFile(files[0]);
            e.target.value = "";
          }
        };

        return (
          <div className="fixed inset-0 bg-[#0a1c34]/20/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#041326]/40 border border-white/10 w-full max-w-md rounded-xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowUploadModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
              
              <h3 className="text-[11px] font-sans font-bold text-[#00D4FF] tracking-widest uppercase mb-1">DOCUMENT UPLOAD</h3>
              <h2 className="text-[12px] font-bold text-white uppercase tracking-wider mb-2 font-sans">
                {tempFile ? "Confirm Details" : `Upload ${showUploadModal}`}
              </h2>
              <div className="text-[9.5px] uppercase font-sans tracking-wider text-slate-400 mb-4 bg-[#041326]/40 border border-white/10 px-2 py-1 rounded inline-block">
                Assigned Owner: <span className="text-[#00D4FF] font-bold">{uploadSelectedParty}</span>
              </div>
              
              {/* Interactive file upload simulation zone */}
              {isUploading ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-[#00D4FF] animate-spin mx-auto"></div>
                  <div>
                    <div className="text-[10px] text-white font-sans uppercase tracking-widest font-bold">Encrypting & Uploading File...</div>
                    <div className="text-[16px] text-[#00D4FF] font-sans mt-1 font-bold">{uploadProgress[progressKey]}%</div>
                  </div>
                  <div className="w-full bg-[#041326]/40 h-1.5 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-[#00D4FF] h-full transition-all duration-100" style={{ width: `${uploadProgress[progressKey]}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!tempFile ? (
                    <div>
                      <input 
                        id="attachments-file-input" 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                      <div 
                        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={e => {
                          e.preventDefault();
                          setDragActive(false);
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            processSelectedFile(files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                          dragActive ? 'border-[#00D4FF] bg-[#00D4FF]/10' : 'border-white/10 hover:border-white/10 bg-[#0a1c34]/20'
                        }`}
                        onClick={() => {
                          document.getElementById('attachments-file-input')?.click();
                        }}
                      >
                        <UploadCloud size={28} className="mx-auto text-slate-500 mb-3 hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">Drag Image Here or Click to Select</p>
                        <p className="text-[8px] text-[#00D4FF] font-sans uppercase mt-1">Reads actual file name & size</p>
                        <p className="text-[8px] text-rose-400 font-sans uppercase mt-0.5">PNG, JPG formats only (Max 10MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {/* Exact visual representation/preview of user-uploaded file */}
                      <div className="border border-white/10 bg-[#0a1c34]/20 rounded-lg p-2.5 flex items-center gap-3 relative overflow-hidden">
                        <div className="w-[84px] h-[56px] rounded bg-slate-950 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                          {tempPreviewUrl ? (
                            <img src={tempPreviewUrl} alt="Attached identity preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[8px] font-sans text-slate-655">No View</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-white truncate">{tempFileName}</div>
                          <div className="text-[9px] text-[#00D4FF] font-sans mt-0.5">File size: {tempFileSize}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTempFile(null);
                            setTempFileName("");
                            setTempFileSize("");
                            setTempPreviewUrl("");
                          }}
                          className="text-[9px] uppercase tracking-widest font-sans font-bold text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 px-2 py-1 rounded transition-all cursor-pointer shrink-0"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Mandatory Metadata Fields with Integrity Validation */}
                      <div className="bg-[#041326]/40/60 border border-white/10 rounded-lg p-4 space-y-3 text-left">
                        <div>
                          <label className="block text-[8.5px] uppercase font-sans font-extrabold text-slate-400 mb-1">
                            Document Type *
                          </label>
                          <select
                            value={tempDocType}
                            onChange={(e) => {
                              setTempDocType(e.target.value);
                              setTempValidationError(null);
                            }}
                            className="w-full bg-[#0a1c34]/20 border border-slate-850 rounded-md px-2.5 py-1.5 text-[11px] text-white focus:border-[#00D4FF] outline-none font-sans"
                          >
                            <option value="">-- Choose Type --</option>
                            {documentTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8.5px] uppercase font-sans font-extrabold text-slate-400 mb-1">
                              Issued Date *
                            </label>
                            <input
                              type="date"
                              value={tempIssuedDate}
                              onChange={(e) => {
                                setTempIssuedDate(e.target.value);
                                setTempValidationError(null);
                              }}
                              className="w-full bg-[#0a1c34]/20 border border-slate-850 rounded-md px-2 py-1 text-[10px] text-white focus:border-[#19A7C1] outline-none font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[8.5px] uppercase font-sans font-extrabold text-slate-400 mb-1">
                              Expiry Date *
                            </label>
                            <input
                              type="date"
                              value={tempExpiryDate}
                              onChange={(e) => {
                                setTempExpiryDate(e.target.value);
                                setTempValidationError(null);
                              }}
                              className="w-full bg-[#0a1c34]/20 border border-slate-850 rounded-md px-2 py-1 text-[10px] text-white focus:border-[#19A7C1] outline-none font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {tempValidationError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-[9.5px] text-left font-semibold">
                      ⚠ {tempValidationError}
                    </div>
                  )}

                  {tempFile && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTempFile(null);
                          setTempFileName("");
                          setTempFileSize("");
                          setTempPreviewUrl("");
                          setTempValidationError(null);
                        }}
                        className="flex-1 bg-[#041326]/40 border border-white/10 text-slate-300 font-bold tracking-wider uppercase text-[10px] py-3 rounded-lg hover:bg-slate-850 hover:text-white transition-all cursor-pointer font-sans"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!tempDocType) {
                            setTempValidationError("Please choose a Document Type.");
                            return;
                          }
                          if (!tempIssuedDate) {
                            setTempValidationError("Issued Date is mandatory.");
                            return;
                          }
                          if (!tempExpiryDate) {
                            setTempValidationError("Expiry Date is mandatory.");
                            return;
                          }
                          const issued = new Date(tempIssuedDate);
                          const expiry = new Date(tempExpiryDate);
                          if (expiry <= issued) {
                            setTempValidationError("Expiry Date must be after the Issued Date.");
                            return;
                          }
                          
                          // Run triggerUploadSimulation with the loaded metadata
                          triggerUploadSimulation(tempDocType, tempFileName, uploadSelectedParty, tempFileSize, tempPreviewUrl, tempIssuedDate, tempExpiryDate);
                        }}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg font-sans transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.1 cursor-pointer"
                      >
                        <Shield size={10} className="stroke-[2.5]" /> Secure Upload
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="text-[9px] text-slate-500 text-center uppercase tracking-wider mt-4 font-sans">
                Security: Files are encrypted with industry-standard AES-256.
              </div>
            </div>
          </div>
        );
      })()}

      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[11000] flex flex-col items-center justify-center bg-[#0a1c34]/20/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#041326]/40 border border-white/10 p-8 rounded-2xl max-w-sm w-full shadow-2xl shadow-black/80 text-center relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#00D4FF]" />
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00D4FF]/20">
              <Loader2 size={24} className="text-[#00D4FF] animate-spin" />
            </div>
            <h3 className="text-[10px] font-sans font-bold text-[#00D4FF] tracking-wider uppercase mb-1">
              Document Compiler Active
            </h3>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-2 font-sans">
              Compiling PDF...
            </h2>
            <div className="w-full bg-[#0a1c34]/20 border border-white/10 h-2.5 rounded-full overflow-hidden mt-4 mb-2">
              <div 
                className="bg-[#00D4FF] h-full transition-all duration-300"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-sans font-bold text-slate-400">
              {pdfProgress}% Generated
            </span>
            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-sans font-medium">
              Snapping secure digital copies of pages. Do not close your browser tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
