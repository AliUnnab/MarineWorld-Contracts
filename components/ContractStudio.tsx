import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

import { 
  ArrowLeft, ArrowDown, CheckCircle2, ChevronRight, FileText, User, Anchor, 
  History, PenTool, Scale, Eye, Download, Search, AlertCircle, Cpu, Shield, UploadCloud, X, ArrowRight, ShieldAlert, Mail, FileSignature, ShieldCheck, Zap,
  Menu, ChevronLeft, Send, Trash2, Plus, Loader2, CreditCard, ChevronDown, ChevronUp, Calendar, Undo2, Printer, Check, Lock, Unlock, Bot, Sparkles, RefreshCw, PlusCircle, Copy, Info
} from 'lucide-react';
import { chatWithContractAdvisor, rewriteContractClauseWithAi } from '../services/gemini';
import { CreditService } from '../services/credit-service';
import { RegistryTransactionService } from '../services/registry-transaction-service';
import { AI_COSTS, SubscriptionPlan, ADVISOR_COSTS } from '../src/types/credits';
import { auth, db, logAuditEvent } from '../services/firebase-service';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import Markdown from 'react-markdown';
import { PaymentConfigModal } from './PaymentConfigModal';
import { ContractCopilot } from './ContractCopilot';
import { LegalMarkdown } from '../utils/LegalMarkdownEngine';
import { mockContracts } from '../src/mockDataFallback';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isQuota = error && (
    (error as any).message?.toLowerCase().includes('quota') ||
    (error as any).message?.toLowerCase().includes('limit') ||
    (error as any).message?.toLowerCase().includes('resource_exhausted') ||
    (error as any).code === 'resource-exhausted'
  );

  if (isQuota) {
    console.warn("Firestore Quota Limit Detected on operation", operationType, "for path", path);
    window.localStorage.setItem('firestore_quota_exceeded', 'true');
    (window as any).__markQuotaExceeded?.();
    return; // Don't throw! Return gracefully.
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const groupedAgreementTypes = {
  "Corporate & Corporate Finance": [
    "Shareholders Agreement",
    "Subscription Agreement",
    "Memorandum of Understanding (MoU)",
    "Letter of Intent (LOI)",
    "Heads of Terms",
    "Term Sheet",
    "Financing Agreement",
    "Loan Agreement",
    "Escrow Agreement",
    "Investment Agreement"
  ],
  "Commercial Agreements": [
    "Sales Agreement",
    "Purchase Agreement",
    "Distribution Agreement",
    "Agency Agreement",
    "Partnership Agreement",
    "Joint Venture Agreement",
    "Franchise Agreement",
    "License Agreement",
    "Reseller Agreement",
    "Commercial Cooperation Agreement"
  ],
  "Technology Agreements": [
    "Master Development Agreement (MDA)",
    "Statement of Work (SOW)",
    "Software Development Agreement",
    "Development Services Agreement",
    "Technology Partnership Agreement",
    "API Integration Agreement",
    "Maintenance & Support Agreement",
    "Service Level Agreement (SLA)",
    "Non-Disclosure Agreement (NDA)",
    "Intellectual Property Assignment Agreement",
    "Software License Agreement",
    "SaaS Agreement",
    "Data Processing Agreement (DPA)",
    "API Access & Telematics Data Sharing"
  ],
  "Professional Services": [
    "Service Agreement",
    "Master Service Agreement (MSA)",
    "Consulting Agreement",
    "Advisory Agreement",
    "Independent Contractor Agreement",
    "Project Management Agreement"
  ],
  "Employment & HR": [
    "Employment Agreement",
    "Crew Employment Agreement",
    "Contractor Agreement",
    "Internship Agreement"
  ],
  "Procurement & Supply Chain": [
    "Supply Agreement",
    "Procurement Agreement",
    "Equipment Purchase Agreement",
    "Spare Parts Agreement",
    "Vendor Agreement",
    "Framework Supply Agreement",
    "Logistics Agreement",
    "Warehousing Agreement"
  ],
  "Legal, Risk & Compliance": [
    "NDA (Non-Disclosure Agreement)",
    "Mutual NDA",
    "Non-Compete Agreement",
    "Insurance Placement Agreement",
    "Claims Handling Agreement",
    "Warranty Agreement",
    "Indemnity Agreement"
  ],
  "Business Ecosystem": [
    "Licensing",
    "Operators",
    "Partnerships",
    "Distribution",
    "Media",
    "Advertising",
    "Marketplace",
    "SaaS & Technology",
    "Investment",
    "Global Operator Agreement",
    "National Operator Agreement",
    "Exclusive Territory Agreement",
    "Digital Territory Agreement",
    "MarineWorld Certified Partner Agreement",
    "MarineWorld Technology Partner Agreement",
    "MarineWorld Marketplace Operator Agreement",
    "MarineWorld Media Network Agreement",
    "MarineWorld Industry Association Agreement",
    "MarineWorld Strategic Alliance Agreement"
  ],
  "Maritime Operations": [
    "Ship Sale & Purchase",
    "Yacht Sale Agreement",
    "Charter Party",
    "Brokerage Agreement",
    "Ship Management Agreement",
    "Technical Management Agreement",
    "Crew Management Agreement",
    "Manning Agreement",
    "Ship Agency Agreement",
    "Port Agency Agreement"
  ]
};

const agreementTypes = Object.values(groupedAgreementTypes).flat();

const groupedTransactionTypes = {
  "Logistics & Sea Operations": [
    "Yacht Charter",
    "Bareboat Charter",
    "Crewed Charter",
    "Day Charter",
    "Seasonal Charter",
    "Charter Management",
    "Voyage Chartering",
    "Time Chartering",
    "Cargo Carriage"
  ],
  "Shipyard & Services": [
    "New Build Fabrication",
    "Refit Services",
    "Retrofit Engineering",
    "Manufacturing",
    "Equipment Supply",
    "Spare Parts Supply",
    "OEM Production",
    "Engineering Services",
    "Commissioning Services",
    "Warranty Services"
  ],
  "Marina & Port": [
    "Berthing Space Rental",
    "Marina Services",
    "Technical Services",
    "Port Agency Services",
    "Vessel Management",
    "Annual Maintenance",
    "Dry Dock Services",
    "Stevedoring Operations"
  ],
  "Legal & Advisory": [
    "Maritime Legal Advisory",
    "Due Diligence Audits",
    "Vessel Certification",
    "Compliance Review",
    "Insurance Placement",
    "Settlement Routing",
    "Vessel Financing Support"
  ],
  "Marine Technology & AI": [
    "Software Licensing",
    "SaaS Subscription",
    "API Access Billing",
    "Digital Integration",
    "Cybersecurity Auditing",
    "Marine AI Consulting"
  ]
};

const transactionTypes = Object.values(groupedTransactionTypes).flat();

const getFieldsForAgreementType = (type: string) => {
  const t = (type || '').toLowerCase();
  
  // CHARTER AGREEMENT
  if (t.includes('charter') || t.includes('voyage charter') || t.includes('time charter') || t.includes('lading') || t.includes('towage') || t.includes('freight')) {
    return {
      deliverables: "The Owner agrees to let and the Charterer agrees to hire the Vessel for the specified duration to transport designated dry or wet bulk cargo between international safe ports, subject to sea trial and classification constraints.",
      milestones: `Milestone 1: Delivery of Vessel at designated delivery port (On Hire)
Milestone 2: Cargo loading operations & Bill of Lading (B/L) issuance
Milestone 3: Vessel discharge & Redelivery at designated safe port (Off Hire)`,
      commercialTerms: "Charter hire rate is calculated on a daily rate, payable in advance. All port charges, canal transits, pilotage, and bunker consumption are to be borne by the Charterer as per Time Charter conditions.",
      surcharges: "Demurrage at the loading/discharging ports shall be calculated at a rate of USD 18,000 per day or pro-rata. Dispatch shall be payable at half the demurrage rate.",
      paymentTerms: "Hire payments shall be paid in full every 15 days in advance. Deductions for off-hire periods shall be settled during the final voyage account reconciliation.",
      paymentMethod: "SWIFT Wire Transfer / Confirmed Irrevocable Letter of Credit (LC)",
      incoterms: "CIF (Cost, Insurance and Freight) for cargo",
      deliveryLocation: "Rotterdam Sector / Singapore Anchorage",
      warrantyPeriod: "Duration of the Charter Party Agreement",
      warrantyScope: "Owner warrants that the Vessel is, and shall be maintained in, a thoroughly seaworthy condition, fully manned with qualified crew, and carrying valid SOLAS and MARPOL certificates.",
      liabilityLimit: "Total Charter Hire Value plus direct hull insurance coverage",
      consequentialDamages: "Mutually excluded under BIMCO standard consequential damage waiver clauses.",
      confidentialityDuration: "36 Months post-redelivery and final settlement of charter accounts.",
      terminationNotice: "30 Days written notice if vessel is declared a constructive total loss, or in event of war/force majeure preventing performance.",
      arbitrationRules: "LMAA Terms 2021 & standard Maritime Arbitrators guidelines",
      annexes: `Annex A: Vessel Technical Specification and Performance Speed/Consumption Curve
Annex B: Cargo Stowage Plan and Excluded Cargo Categories`
    };
  }

  // SHIPBUILDING / NEW BUILD / REFIT / RETROFIT
  if (t.includes('shipbuilding') || t.includes('new build') || t.includes('refit') || t.includes('retrofit') || t.includes('dry dock') || t.includes('repair')) {
    return {
      deliverables: "Complete shipyard fabrication, construction, outfitting, testing, and delivery of one (1) hull in accordance with the technical specifications, drawings, and leading classification society class notation guidelines.",
      milestones: `Milestone 1: Keel Laying & Steel Cutting Verification (15% progress)
Milestone 2: Vessel Launching & Engine Installation (40% progress)
Milestone 3: Sea Trials & Official Handover (100% progress)`,
      commercialTerms: "The total contract value is fixed, subject only to modifications authorized via written change order forms signed by both the Owner and the Shipyard Directors.",
      surcharges: "Late delivery penalties shall be calculated at USD 10,000 per day after a 15-day grace period, up to a maximum cap of 5% of the contract value.",
      paymentTerms: "Stage payments are payable upon completion of designated construction milestones, subject to independent surveyor sign-off.",
      paymentMethod: "Irrevocable Bank Guarantee for Shipbuilding Refund",
      incoterms: "FOB Shipyard (Free on Board)",
      deliveryLocation: "Shipyard Docking Facility (Hamburg / Piraeus)",
      warrantyPeriod: "24 Months from physical delivery acceptance",
      warrantyScope: "Shipyard guarantees the Vessel against all defects in material, machinery, and workmanship. Excludes normal wear and tear or owner-furnished equipment.",
      liabilityLimit: "Refund of all installments paid plus interest in the event of default",
      consequentialDamages: "Shipyard's liability is strictly limited to repair/replacement, excluding loss of profit or charter hire.",
      confidentialityDuration: "60 Months standard non-disclosure scope from keel laying.",
      terminationNotice: "Immediate termination for insolvency; 14 days notice for uncured material default of stage payments.",
      arbitrationRules: "Rotterdam Rules & SCMA Arbitration Guidelines",
      annexes: `Annex A: Approved General Arrangement (GA) and Technical Drawings
Annex B: Maker's List of Approved Machinery and Equipment Suppliers`
    };
  }

  // MARINA, BERTHING & PORT SERVICES
  if (t.includes('marina') || t.includes('berthing') || t.includes('port') || t.includes('dock') || t.includes('wharfage')) {
    return {
      deliverables: "Provision of safe berth allocation, fresh water supply, shore power connectivity, garbage disposal, and marina security services for the designated yacht or fleet.",
      milestones: `Milestone 1: Vessel Arrival & Docking Clearance Inspection
Milestone 2: Mid-Season Operational Survey & Berth Compliance Check
Milestone 3: Departure clearance and account settlement`,
      commercialTerms: "Berthing fees are calculated based on overall length (LOA) multiplied by beam, subject to peak seasonal surcharges during summer months.",
      surcharges: "Vessel staying over the scheduled check-out hour shall be subject to a daily transient rate of 150% of the standard berthing rate.",
      paymentTerms: "Annual berthing is payable in advance in quarterly installments. Day-use berthing is payable immediately upon booking reservation.",
      paymentMethod: "Direct Debit / Credit Card Authorization / SEPA Transfer",
      incoterms: "Ex Works (EXW) Marina Shore Office",
      deliveryLocation: "Marina Mooring Berth & Fuel Dock Terminal",
      warrantyPeriod: "Active duration of berthing reservation",
      warrantyScope: "Marina warrants the physical structural integrity of the docks and mooring lines. No warranty is expressed for acts of God, storm damage, or third-party theft.",
      liabilityLimit: "Restricted to the total berthing fees paid during the current billing year.",
      consequentialDamages: "Marina shall not be liable for damage to the vessel or loss of onboard personal property.",
      confidentialityDuration: "24 Months standard confidentiality regarding berth assignment and owner identity.",
      terminationNotice: "15 Days written notice by either party for monthly leases.",
      arbitrationRules: "SCMA Rules or Local Chamber of Commerce Arbitration",
      annexes: `Annex A: Marina Code of Conduct & Environment Safety Guidelines
Annex B: Rate Sheet for Auxiliary Technical and Shore Services`
    };
  }

  // VESSEL MANAGEMENT / FLEET / TECHNICAL MANAGEMENT (SHIPMAN)
  if (t.includes('management') || t.includes('shipman') || t.includes('technical management')) {
    return {
      deliverables: "The Manager agrees to provide technical management, crew management, commercial operations, and dry dock supervision for the Vessel in accordance with sound ship management practice.",
      milestones: `Milestone 1: Vessel Technical Take-Over & Safety Management Audit (ISM Code)
Milestone 2: Quarterly Technical Performance Reporting & Budget Review
Milestone 3: Annual Classification Society Class Renewal Audits`,
      commercialTerms: "The Management Fee is fixed per vessel per month. All operational expenses (OPEX) are funded via a separate Owner-funded operations account.",
      surcharges: "Overtime management services during dry docking or emergency salvage shall be billed at a premium daily rate of USD 1,200.",
      paymentTerms: "The monthly management fee is payable in advance on the first business day of each calendar month.",
      paymentMethod: "Escrow Account funding / Bank Wire Transfer",
      incoterms: "CIF Ship's Spares at Port of Delivery",
      deliveryLocation: "Designated Fleet Management Center (Singapore / Limassol)",
      warrantyPeriod: "Duration of the Shipman Agreement",
      warrantyScope: "The Manager warrants to use its best endeavors to provide ship management services in accordance with the guidelines of BIMCO SHIPMAN and ISO 9001 standard protocols.",
      liabilityLimit: "Limited to ten (10) times the monthly management fee.",
      consequentialDamages: "Manager shall have no liability for loss of profit, loss of charter, or cargo damage unless caused by gross negligence.",
      confidentialityDuration: "60 Months standard non-disclosure scope from contract termination.",
      terminationNotice: "90 Days written notice by either party, subject to BIMCO SHIPMAN standard compensation provisions.",
      arbitrationRules: "LMAA Terms 2021 & standard Arbitrators Rules",
      annexes: `Annex A: Vessel Fleet Operational Budget and Crew Allocation Plan
Annex B: Safety Management System (SMS) Compliance Guidelines`
    };
  }

  // CREW / EMPLOYMENT / HR
  if (t.includes('crew') || t.includes('employment') || t.includes('captain') || t.includes('placement')) {
    return {
      deliverables: "Provision of certified, qualified, and medically fit marine officers and crew members in accordance with STCW 2010 regulations and MLC 2006 guidelines.",
      milestones: `Milestone 1: Crew Pre-boarding Medical Examination & Visa Processing
Milestone 2: Safe Boarding & Duty Handover Verification at designated port
Milestone 3: Sign-Off, Repatriation, and Crew Evaluation at end of contract`,
      commercialTerms: "Base monthly wage rates are fixed in accordance with ITF standard collective agreements or mutually agreed custom individual contracts.",
      surcharges: "Unscheduled overtime hours shall be compensated at 125% of the standard hourly crew rate, subject to maximum work-hour limits.",
      paymentTerms: "Wages are payable monthly in arrears into the designated crew bank accounts on or before the 5th day of the following calendar month.",
      paymentMethod: "Direct Bank Transfer (IBAN) / Marine Payroll Cards",
      incoterms: "DAP (Delivered at Place) Boarding Port",
      deliveryLocation: "Designated Crew Embarkation Port",
      warrantyPeriod: "Duration of the Sea Service Contract",
      warrantyScope: "Agency/Crew warrants that all personnel hold genuine, valid certificates of competency (CoC) and necessary endorsements from relevant flag administrations.",
      liabilityLimit: "Standard maritime compensation liability limits in accordance with P&I Club rules.",
      consequentialDamages: "Exclusion of all commercial or freight loss liabilities for individual crew member acts.",
      confidentialityDuration: "Indefinite protection of crew biometric, health, and personal records.",
      terminationNotice: "30 Days written notice for convenience by either party; immediate dismissal for gross misconduct.",
      arbitrationRules: "Maritime Labor Arbitration Rules or standard ITF guidelines",
      annexes: `Annex A: ITF Wage Scale and Crew Benefit Matrix
Annex B: Code of Conduct & Alcohol/Drug Policy onboard`
    };
  }

  // DEFAULT / COMMERCIAL SERVICES
  return {
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
Annex B: Hourly Fee Rates and Overtime Standards`
  };
};
const groupedSubjectMatters = {
  "Sales & Brokerage": [
    "Yacht Sales",
    "Vessel Sales",
    "Yacht Brokerage",
    "Vessel Brokerage",
    "Charter Brokerage",
    "Yacht Marketing",
    "Charter Marketing",
    "Distribution Rights",
    "Dealer Operations",
    "Agency Operations"
  ],
  "Sea Freight & Operations": [
    "Ocean Freight Transport",
    "Vessel Chartering Operations",
    "Cargo Stevedoring",
    "Vessel Towage & Salvage",
    "Fleet Fuel Supply & Bunkering"
  ],
  "Technical & Yard Operations": [
    "Vessel Construction",
    "Refit Management",
    "Yacht Refit Services",
    "Vessel Maintenance",
    "Shipyard Operations",
    "Equipment Manufacturing",
    "Marine Engineering Services"
  ],
  "Marina, Port & Agency": [
    "Marina Operations",
    "Berth Slot Allocations",
    "Port Terminal Operations",
    "Yacht Mooring & Storage"
  ],
  "Legal, HR & Certification": [
    "Crew Recruitment",
    "Crew Employment",
    "Crew Management",
    "Insurance Placement",
    "Settlement Services",
    "Financing Services",
    "Maritime Legal Services",
    "Maritime Compliance Services",
    "Technical Consultancy",
    "Classification Survey",
    "Vessel Inspection",
    "Insurance Brokerage",
    "Financing Support"
  ],
  "Marine AI & IoT Tech": [
    "Digital Infrastructure Services",
    "Vessel IoT & Telemetry",
    "Marine Navigation Software",
    "Custom Subject"
  ]
};
const subjectMatters = Object.values(groupedSubjectMatters).flat();

const groupedObjectives = {
  "Asset Acquisition & Sales": [
    "Yacht Sale",
    "Vessel Sale",
    "Vessel Purchase",
    "Asset Disposal",
    "Asset Acquisition",
    "Exclusive Sales Rights",
    "Vessel Marketing"
  ],
  "Revenue & Fleet Chartering": [
    "Charter Revenue Generation",
    "Charter Fleet Expansion",
    "Charter Representation",
    "Charter Operations",
    "Exclusive Charter Rights",
    "Revenue Sharing"
  ],
  "Yard Project Delivery": [
    "Refit Project Delivery",
    "Shipbuilding Project Delivery",
    "Technical Support",
    "Long-Term Maintenance",
    "Project Delivery",
    "Infrastructure Development"
  ],
  "Management & Network Expansion": [
    "Fleet Management",
    "Fleet Optimization",
    "Operational Support",
    "Dealer Appointment",
    "Dealer Network Expansion",
    "Market Entry",
    "Market Development",
    "Territory Development"
  ],
  "Compliance, Crew & Support": [
    "Crew Placement",
    "Crew Recruitment",
    "Crew Employment",
    "Vessel Certification",
    "Regulatory Compliance",
    "Insurance Placement",
    "Financing Arrangement",
    "Compliance Management",
    "Certification Management",
    "Technical Consulting"
  ]
};
const objectives = Object.values(groupedObjectives).flat();

const continents = [
  "Global / Worldwide",
  "North America",
  "South America",
  "Europe",
  "Asia",
  "Africa",
  "Oceania",
  "Antarctica"
];

const countries = [
  "All Countries",
  "United States",
  "United Kingdom",
  "China",
  "Japan",
  "Germany",
  "France",
  "Turkey",
  "India",
  "Brazil",
  "Singapore",
  "United Arab Emirates",
  "Greece",
  "Cyprus",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "South Korea",
  "Australia",
  "Custom Country"
];

const groupedGeoScopes = {
  "Global Markets": [
    "Global Worldwide",
    "Oceanwide Trades",
    "International Waters"
  ],
  "Regional Segments": [
    "Mediterranean Basin",
    "Eastern Mediterranean",
    "Western Mediterranean",
    "Adriatic & Black Sea",
    "Middle East & GCC Region",
    "Europe & Baltic",
    "North America & Caribbean",
    "South America",
    "Asia Pacific",
    "Custom Scope"
  ]
};
const geoScopes = Object.values(groupedGeoScopes).flat();

const groupedOperatingAreas = {
  "Mediterranean & Black Sea": [
    "Aegean Sea",
    "Levant Basin",
    "Adriatic Sea",
    "Ionian Sea",
    "Tyrrhenian Sea",
    "Western Mediterranean Sector",
    "Black Sea Zone"
  ],
  "Red Sea & Arabian Gulf": [
    "Red Sea Sector",
    "Arabian Gulf",
    "Gulf of Oman",
    "Arabian Sea"
  ],
  "Oceans & Worldwide": [
    "Indian Ocean Sector",
    "Atlantic Ocean Crossings",
    "North Sea & Baltic Sea",
    "Pacific Ocean Lanes",
    "Worldwide Operations",
    "Custom Operating Area"
  ]
};
const operatingAreas = Object.values(groupedOperatingAreas).flat();

const groupedServiceLocations = {
  "Mediterranean & Aegean Hubs": [
    "Piraeus, Greece",
    "Athens, Greece",
    "Thessaloniki, Greece",
    "Istanbul, Turkey",
    "Izmir, Turkey",
    "Bodrum, Turkey",
    "Marmaris, Turkey",
    "Antalya, Turkey",
    "Limassol, Cyprus",
    "Valletta, Malta",
    "Genoa, Italy",
    "Naples, Italy",
    "Marseille, France",
    "Barcelona, Spain"
  ],
  "Major Maritime Hubs (Europe)": [
    "Rotterdam, Netherlands",
    "Antwerp, Belgium",
    "Hamburg, Germany",
    "Algeciras, Spain",
    "Valencia, Spain",
    "Felixstowe, UK",
    "Bremen/Bremerhaven, Germany",
    "Gioia Tauro, Italy",
    "Le Havre, France"
  ],
  "Major Maritime Hubs (Asia)": [
    "Shanghai, China",
    "Singapore",
    "Ningbo-Zhoushan, China",
    "Shenzhen, China",
    "Guangzhou, China",
    "Busan, South Korea",
    "Hong Kong",
    "Port Klang, Malaysia",
    "Tanjung Pelepas, Malaysia",
    "Kaohsiung, Taiwan",
    "Laem Chabang, Thailand",
    "Ho Chi Minh City, Vietnam",
    "Yokohama, Japan",
    "Tokyo, Japan",
    "Colombo, Sri Lanka",
    "Jawaharlal Nehru Port (Nhava Sheva), India"
  ],
  "Major Maritime Hubs (Middle East & Africa)": [
    "Jebel Ali, UAE",
    "Tanger Med, Morocco",
    "Port Said, Egypt",
    "Salalah, Oman",
    "Durban, South Africa",
    "Mombasa, Kenya",
    "Jeddah, Saudi Arabia",
    "King Abdullah Port, Saudi Arabia",
    "Lomé, Togo",
    "Abidjan, Ivory Coast"
  ],
  "Major Maritime Hubs (Americas)": [
    "Los Angeles, USA",
    "Long Beach, USA",
    "New York/New Jersey, USA",
    "Savannah, USA",
    "Houston, USA",
    "Santos, Brazil",
    "Manzanillo, Panama",
    "Balboa, Panama",
    "Callao, Peru",
    "Cartagena, Colombia",
    "Vancouver, Canada",
    "Montreal, Canada",
    "Veracruz, Mexico"
  ],
  "Major Maritime Hubs (Oceania)": [
    "Melbourne, Australia",
    "Sydney, Australia",
    "Brisbane, Australia",
    "Auckland, New Zealand",
    "Tauranga, New Zealand"
  ],
  "Yard & Port Facilities": [
    "Marina",
    "Shipyard",
    "Port Terminal",
    "Dry Dock",
    "Anchorage Area"
  ],
  "Vessel & Offshore": [
    "Vessel Onboard",
    "Offshore Platform",
    "International Waters",
    "High Seas / Oceanic"
  ],
  "Corporate & Remote": [
    "Customer Facility",
    "Vendor Workshop",
    "Remote Operations",
    "Digital / Cloud Environment"
  ],
  "Custom": [
    "Custom Location"
  ]
};
const serviceLocations = Object.values(groupedServiceLocations).flat();
const currencies = ["USD", "EUR", "GBP", "CHF", "AED", "SAR", "NOK", "SEK", "DKK", "SGD", "HKD", "JPY"];

const groupedCommercialModels = {
  "Time & Rate Charters (Vessel & Crew)": [
    "Daily Hire Rate (Bareboat/Time)",
    "Monthly Flat Rate",
    "Lump Sum Voyage Charter",
    "Demurrage & Dispatch Based",
    "Trip Time Charter Rate"
  ],
  "Yard & Technical Pricing (New Build & Refit)": [
    "Milestone Based Progress (Stage Payments)",
    "Cost Plus Margin (Cost-Reimbursable)",
    "Time & Materials (T&M)",
    "Fixed Price Turnkey",
    "Guaranteed Maximum Price (GMP)"
  ],
  "Logistics & Freight Rating": [
    "Freight Rate per Ton/CBM",
    "Deadfreight Rate",
    "Bunker Adjustment Factor (BAF) Included"
  ],
  "Agency, Brokerage & Advisory": [
    "Commission Based (Percentage of Sale)",
    "Retainer Based Services",
    "Revenue Share Agreement",
    "Brokerage Success Fee",
    "Performance/KPI Bonus Structure",
    "Hybrid Model (Retainer + Success Fee)"
  ]
};
const commercialModels = Object.values(groupedCommercialModels).flat();

const groupedPaymentStructures = {
  "Advance & Charter Hire": [
    "100% Advance Hire",
    "Hire Payable 15 Days in Advance",
    "Deposit + Final Account Settlement",
    "Cash on Delivery (COD)"
  ],
  "Stage & Milestone Payments (Yard/Refit)": [
    "Shipyard Standard (e.g. 10/20/30/40)",
    "Milestone Progress Payments",
    "Keel Laying / Launching Instalments",
    "Delivery Acceptance Settlement"
  ],
  "Trade Finance & Secure Routing": [
    "Irrevocable Letter of Credit (LC)",
    "Standby Letter of Credit (SBLC)",
    "Escrow Account Disbursement",
    "Documentary Collection (D/P, D/A)",
    "Bank Guarantee (Refund Guarantee)"
  ],
  "Credit Account Terms": [
    "NET 7 Days",
    "NET 15 Days",
    "NET 30 Days End of Month",
    "NET 60 Days",
    "NET 90 Days"
  ],
  "Cyclic Billing": [
    "Monthly Arrears",
    "Quarterly Advance",
    "Semi-Annual Installments",
    "Annual Subscription"
  ]
};
const paymentStructures = Object.values(groupedPaymentStructures).flat();
const contractDurations = ["One Time", "30 Days", "90 Days", "6 Months", "12 Months", "24 Months", "36 Months", "60 Months", "Custom Duration"];
const renewalTermsList = ["No Renewal", "Automatic Renewal", "Annual Renewal", "Mutual Renewal", "Renewal By Written Consent", "Evergreen Agreement"];
const noticePeriods = ["Immediate", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days", "180 Days", "Custom"];
const applicableLaws = [
  "English Law (LMAA)",
  "Singapore Law (SCMA)",
  "New York State Law (SMA)",
  "Hong Kong Law (HKMAG)",
  "Swiss Law",
  "French Law",
  "German Law",
  "Dutch Law",
  "Swedish Law",
  "Danish Law",
  "Norwegian Law",
  "Finnish Law",
  "Italian Law",
  "Spanish Law",
  "Turkish Law",
  "UAE Law (DIFC)",
  "Chinese Law",
  "Japanese Law",
  "Australian Law",
  "Canadian Law",
  "Brazilian Law",
  "Marshall Islands Law",
  "Panama Law",
  "Liberian Law",
  "Maltese Law",
  "Greek Law",
  "Custom Jurisdiction"
];
const arbitrationSeats = [
  "London",
  "Singapore",
  "New York",
  "Hong Kong",
  "Paris",
  "Geneva",
  "Zurich",
  "Stockholm",
  "The Hague",
  "Vienna",
  "Dubai (DIFC)",
  "Istanbul",
  "Miami",
  "Houston",
  "Tokyo",
  "Seoul",
  "Beijing",
  "Shanghai",
  "Sydney",
  "Toronto",
  "Vancouver",
  "Sao Paulo",
  "Panama City",
  "Valletta",
  "Piraeus",
  "Custom"
];
const arbitrationInstitutions = [
  "LMAA (London Maritime Arbitrators Association)",
  "SCMA (Singapore Chamber of Maritime Arbitration)",
  "LCIA (London Court of International Arbitration)",
  "ICC (International Chamber of Commerce)",
  "SIAC (Singapore International Arbitration Centre)",
  "HKIAC (Hong Kong International Arbitration Centre)",
  "DIAC (Dubai International Arbitration Centre)",
  "ISTAC (Istanbul Arbitration Centre)",
  "AAA-ICDR (American Arbitration Association – International Centre for Dispute Resolution)",
  "UNCITRAL Rules (ad hoc arbitration)",
  "Custom"
];
const standardForms = [
  "Custom Agreement",
  "Company Template",
  "BIMCO Standard",
  "MYBA Standard",
  "SALEFORM",
  "FIDIC",
  "Upload Existing Contract"
];
const groupedComplianceFrameworks = {
  "International Maritime": [
    "IMO Conventions",
    "SOLAS",
    "MARPOL",
    "COLREG",
    "STCW",
    "Load Line Convention",
    "Ballast Water Management (BWM)",
    "Anti-Fouling Convention (AFS)",
    "Hong Kong Convention",
    "Nairobi Wreck Removal Convention"
  ],
  "Safety & Security": [
    "ISM Code",
    "ISPS Code",
    "MLC 2006",
    "ILO Maritime Standards",
    "Flag State Requirements (SOLAS, MARPOL, MLC compliance)",
    "Port State Control (PSC)"
  ],
  "Trade & Commercial": [
    "Incoterms® 2020",
    "UCP 600",
    "URDG 758",
    "CISG (Vienna Convention)",
    "ISP98",
    "UNCITRAL Model Law"
  ],
  "Sanctions & Export Controls": [
    "OFAC Sanctions (USA)",
    "UK Sanctions",
    "EU Sanctions",
    "UN Sanctions",
    "Swiss Sanctions"
  ],
  "Data & Privacy": [
    "GDPR",
    "UK GDPR",
    "CCPA",
    "PDPL (UAE)",
    "KVKK (Türkiye)"
  ],
  "Technology Compliance": [
    "ISO 27001",
    "SOC 2",
    "GDPR",
    "EU AI Act",
    "OWASP",
    "OAuth 2.0",
    "OpenID Connect",
    "Secure SDLC",
    "DevSecOps",
    "SLA"
  ],
  "Cyber Security": [
    "IMO Cyber Risk Management",
    "ISO/IEC 27001",
    "NIST Cybersecurity Framework",
    "Cyber Security Policy"
  ],
  "Insurance & Liability": [
    "P&I Club Rules",
    "Hull & Machinery Insurance",
    "Marine Cargo Insurance",
    "Salvage Convention",
    "General Average"
  ],
  "Environmental & Sustainability": [
    "EU ETS",
    "FuelEU Maritime",
    "Carbon Intensity Indicator (CII)",
    "EEXI",
    "ESG Reporting",
    "Ship Energy Efficiency Management Plan (SEEMP)"
  ],
  "Corporate Compliance": [
    "Anti-Bribery",
    "Anti-Corruption",
    "Anti-Money Laundering (AML)",
    "Know Your Customer (KYC)",
    "Beneficial Ownership",
    "Whistleblower Protection",
    "Corporate Governance"
  ],
  "Classification Societies": [
    "ABS",
    "DNV",
    "Lloyd's Register",
    "Bureau Veritas",
    "RINA",
    "ClassNK",
    "CCS"
  ]
};
const complianceFrameworks = Object.values(groupedComplianceFrameworks).flat();
const governingLanguages = [
  "English",
  "Turkish",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Arabic",
  "Chinese"
];
const governingTimeZones = [
  "UTC",
  "GMT",
  "CET",
  "TRT",
  "GST",
  "SGT"
];
const signatureMethods = [
  "Electronic Signature",
  "Qualified Electronic Signature",
  "Wet Signature",
  "Digital Certificate"
];

const getSmartRecommendations = (category: string, type: string) => {
  const cat = (category || '').toLowerCase();
  const t = (type || '').toLowerCase();

  // Initialize defaults
  let standardForm = [
    { value: "Custom Agreement", confidence: 95, label: "Custom Agreement (Tailored for general contracts)" },
    { value: "Company Template", confidence: 85, label: "Company Template (Enterprise Standard)" },
    { value: "BIMCO Standard", confidence: 70, label: "BIMCO Standard (Common for maritime)" },
    { value: "FIDIC", confidence: 60, label: "FIDIC Standard Form" }
  ];
  
  let complianceFramework = [
    { value: ["Incoterms® 2020", "CISG (Vienna Convention)"], confidence: 95, label: "Incoterms® 2020 & CISG (Global trade)" },
    { value: ["ISO 27001", "GDPR"], confidence: 85, label: "ISO 27001 & GDPR (Information security)" },
    { value: ["IMO Conventions", "SOLAS"], confidence: 70, label: "IMO Conventions & SOLAS (Basic safety)" }
  ];

  let law = [
    { value: "English Law (LMAA)", confidence: 95, label: "English Law (LMAA - Global maritime standard)" },
    { value: "Singapore Law (SCMA)", confidence: 85, label: "Singapore Law (SCMA - APAC center)" },
    { value: "New York State Law (SMA)", confidence: 75, label: "New York State Law (SMA - Americas)" },
    { value: "Swiss Law", confidence: 65, label: "Swiss Law (Neutral European)" }
  ];

  let arbitrationRules = [
    { value: "LMAA (London Maritime Arbitrators Association)", confidence: 95, label: "LMAA Rules (London maritime arbitration)" },
    { value: "SCMA (Singapore Chamber of Maritime Arbitration)", confidence: 85, label: "SCMA Rules (Singapore arbitration)" },
    { value: "UNCITRAL Rules (ad hoc arbitration)", confidence: 75, label: "UNCITRAL Rules (Global ad-hoc)" },
    { value: "ICC (International Chamber of Commerce)", confidence: 65, label: "ICC Rules (Standard commercial)" }
  ];

  let objective = [
    { value: "Operational Support", confidence: 95, label: "Operational Support" },
    { value: "Project Delivery", confidence: 85, label: "Project Delivery" },
    { value: "Regulatory Compliance", confidence: 75, label: "Regulatory Compliance" }
  ];

  let transactionType = [
    { value: "Engineering Services", confidence: 95, label: "Engineering Services" },
    { value: "Technical Services", confidence: 85, label: "Technical Services" },
    { value: "Marine AI Consulting", confidence: 75, label: "Marine AI Consulting" }
  ];

  let subjectMatter = [
    { value: "Technical Consultancy", confidence: 95, label: "Technical Consultancy" },
    { value: "Vessel Maintenance", confidence: 85, label: "Vessel Maintenance" },
    { value: "Marine Engineering Services", confidence: 75, label: "Marine Engineering Services" }
  ];

  let commercialModel = [
    { value: "Fixed Price Turnkey", confidence: 95, label: "Fixed Price Turnkey" },
    { value: "Time & Materials (T&M)", confidence: 85, label: "Time & Materials (T&M)" },
    { value: "Milestone Based Progress (Stage Payments)", confidence: 75, label: "Milestone Based Progress (Stage Payments)" }
  ];

  // Specific rule overrides
  if (cat.includes('maritime') || t.includes('charter') || t.includes('ship') || t.includes('vessel') || t.includes('yacht') || t.includes('broker') || t.includes('manning') || t.includes('crew') || cat.includes('business ecosystem')) {
    if (t.includes('charter') || t.includes('party')) {
      standardForm = [
        { value: "BIMCO Standard", confidence: 95, label: "BIMCO Standard (Gold standard for shipping charters)" },
        { value: "MYBA Standard", confidence: 85, label: "MYBA Standard (Yachting association charter rules)" },
        { value: "Custom Agreement", confidence: 75, label: "Custom Agreement (Tailored terms)" }
      ];
      complianceFramework = [
        { value: ["IMO Conventions", "SOLAS", "MARPOL", "ISM Code", "MLC 2006"], confidence: 95, label: "Maritime Safety, MLC, and Pollution Package (Fully compliant)" },
        { value: ["Incoterms® 2020", "Port State Control (PSC)"], confidence: 85, label: "Incoterms & Port State Control" }
      ];
      objective = [
        { value: "Charter Revenue Generation", confidence: 95, label: "Charter Revenue Generation" },
        { value: "Charter Operations", confidence: 85, label: "Charter Operations" },
        { value: "Revenue Sharing", confidence: 75, label: "Revenue Sharing" }
      ];
      transactionType = [
        { value: "Voyage Chartering", confidence: 95, label: "Voyage Chartering" },
        { value: "Time Chartering", confidence: 85, label: "Time Chartering" },
        { value: "Cargo Carriage", confidence: 75, label: "Cargo Carriage" }
      ];
      subjectMatter = [
        { value: "Vessel Chartering Operations", confidence: 95, label: "Vessel Chartering Operations" },
        { value: "Ocean Freight Transport", confidence: 85, label: "Ocean Freight Transport" }
      ];
      commercialModel = [
        { value: "Daily Hire Rate (Bareboat/Time)", confidence: 95, label: "Daily Hire Rate (Bareboat/Time)" },
        { value: "Lump Sum Voyage Charter", confidence: 85, label: "Lump Sum Voyage Charter" },
        { value: "Trip Time Charter Rate", confidence: 75, label: "Trip Time Charter Rate" }
      ];
    } else if (t.includes('sale') || t.includes('purchase') || t.includes('saleform')) {
      standardForm = [
        { value: "SALEFORM", confidence: 95, label: "SALEFORM (Standard memorandum of agreement for ship sales)" },
        { value: "BIMCO Standard", confidence: 85, label: "BIMCO Standard (Ship Sale / Purchase)" },
        { value: "Custom Agreement", confidence: 70, label: "Custom Agreement (Direct Contract)" }
      ];
      complianceFramework = [
        { value: ["Incoterms® 2020", "Flag State Requirements (SOLAS, MARPOL, MLC compliance)", "P&I Club Rules"], confidence: 95, label: "Trade & Flag State Standards" },
        { value: ["Anti-Bribery", "Anti-Corruption", "Know Your Customer (KYC)"], confidence: 85, label: "AML / KYC Compliance Suite" }
      ];
      objective = [
        { value: "Vessel Purchase", confidence: 95, label: "Vessel Purchase" },
        { value: "Vessel Sale", confidence: 85, label: "Vessel Sale" },
        { value: "Yacht Sale", confidence: 75, label: "Yacht Sale" }
      ];
      transactionType = [
        { value: "New Build Fabrication", confidence: 95, label: "New Build Fabrication" },
        { value: "Equipment Supply", confidence: 85, label: "Equipment Supply" }
      ];
      subjectMatter = [
        { value: "Vessel Sales", confidence: 95, label: "Vessel Sales" },
        { value: "Yacht Sales", confidence: 85, label: "Yacht Sales" }
      ];
      commercialModel = [
        { value: "Fixed Price Turnkey", confidence: 95, label: "Fixed Price Turnkey" },
        { value: "Milestone Based Progress (Stage Payments)", confidence: 85, label: "Milestone Based Progress" }
      ];
    } else if (t.includes('management') || t.includes('shipman') || t.includes('technical')) {
      standardForm = [
        { value: "BIMCO Standard", confidence: 95, label: "BIMCO SHIPMAN Standard Form (Standard ship management template)" },
        { value: "Company Template", confidence: 85, label: "Company Template (Predefined operational framework)" },
        { value: "Custom Agreement", confidence: 75, label: "Custom Agreement (Bespoke parameters)" }
      ];
      complianceFramework = [
        { value: ["ISM Code", "ISPS Code", "SOLAS", "MARPOL", "MLC 2006"], confidence: 95, label: "ISM/ISPS Maritime Management Pack (Highly recommended)" },
        { value: ["IMO Conventions", "Port State Control (PSC)", "P&I Club Rules"], confidence: 85, label: "Operational & Insurance Compliance" }
      ];
      objective = [
        { value: "Fleet Management", confidence: 95, label: "Fleet Management" },
        { value: "Fleet Optimization", confidence: 85, label: "Fleet Optimization" },
        { value: "Operational Support", confidence: 75, label: "Operational Support" }
      ];
      transactionType = [
        { value: "Vessel Management", confidence: 95, label: "Vessel Management" },
        { value: "Annual Maintenance", confidence: 85, label: "Annual Maintenance" }
      ];
      subjectMatter = [
        { value: "Crew Management", confidence: 95, label: "Crew Management" },
        { value: "Vessel Maintenance", confidence: 85, label: "Vessel Maintenance" }
      ];
      commercialModel = [
        { value: "Monthly Flat Rate", confidence: 95, label: "Monthly Flat Rate (BIMCO SHIPMAN standard)" },
        { value: "Retainer Based Services", confidence: 85, label: "Retainer Based Services" }
      ];
    } else if (t.includes('manning') || t.includes('crew') || t.includes('employment')) {
      standardForm = [
        { value: "Company Template", confidence: 95, label: "Company Crew Employment Template" },
        { value: "BIMCO Standard", confidence: 85, label: "BIMCO Crewman (Standard crewing contract)" },
        { value: "Custom Agreement", confidence: 75, label: "Custom Crewing Terms" }
      ];
      complianceFramework = [
        { value: ["MLC 2006", "STCW", "ILO Maritime Standards"], confidence: 95, label: "STCW & MLC 2006 Labor Standard (Mandatory for crew)" },
        { value: ["Flag State Requirements (SOLAS, MARPOL, MLC compliance)"], confidence: 85, label: "Flag State Requirements" }
      ];
      objective = [
        { value: "Crew Employment", confidence: 95, label: "Crew Employment" },
        { value: "Crew Placement", confidence: 85, label: "Crew Placement" }
      ];
      transactionType = [
        { value: "Maritime Legal Advisory", confidence: 95, label: "Maritime Legal Advisory" }
      ];
      subjectMatter = [
        { value: "Crew Employment", confidence: 95, label: "Crew Employment" },
        { value: "Crew Recruitment", confidence: 85, label: "Crew Recruitment" }
      ];
      commercialModel = [
        { value: "Monthly Flat Rate", confidence: 95, label: "Monthly Flat Rate" },
        { value: "Daily Hire Rate (Bareboat/Time)", confidence: 85, label: "Daily Rate" }
      ];
    }
  } else if (cat.includes('technology') || t.includes('saas') || t.includes('software') || t.includes('api') || t.includes('integration') || t.includes('telematics')) {
    standardForm = [
      { value: "Custom Agreement", confidence: 95, label: "Custom Agreement (SaaS / API specialized structure)" },
      { value: "Company Template", confidence: 85, label: "Company Technology Services Template" },
      { value: "Upload Existing Contract", confidence: 60, label: "Upload Existing Contract" }
    ];
    complianceFramework = [
      { value: ["ISO 27001", "SOC 2", "GDPR"], confidence: 95, label: "ISO 27001, SOC 2, and GDPR Security Bundle (Essential for tech)" },
      { value: ["EU AI Act", "OAuth 2.0", "Secure SDLC"], confidence: 85, label: "AI & Modern API Security Standards" },
      { value: ["UK GDPR", "CCPA"], confidence: 75, label: "Privacy Compliance Package" }
    ];
    law = [
      { value: "English Law (LMAA)", confidence: 90, label: "English Law (Highly preferred for international tech contracts)" },
      { value: "Swiss Law", confidence: 85, label: "Swiss Law (Neutral option)" },
      { value: "Singapore Law (SCMA)", confidence: 80, label: "Singapore Law (APAC Tech standard)" }
    ];
    arbitrationRules = [
      { value: "ICC (International Chamber of Commerce)", confidence: 95, label: "ICC Rules (Standard for international software disputes)" },
      { value: "LCIA (London Court of International Arbitration)", confidence: 85, label: "LCIA Rules" },
      { value: "UNCITRAL Rules (ad hoc arbitration)", confidence: 75, label: "UNCITRAL Rules" }
    ];
    objective = [
      { value: "Operational Support", confidence: 95, label: "Operational Support" },
      { value: "Fleet Optimization", confidence: 85, label: "Fleet Optimization" },
      { value: "Technical Consulting", confidence: 75, label: "Technical Consulting" }
    ];
    transactionType = [
      { value: "SaaS Subscription", confidence: 95, label: "SaaS Subscription" },
      { value: "Software Licensing", confidence: 85, label: "Software Licensing" },
      { value: "API Access Billing", confidence: 75, label: "API Access Billing" }
    ];
    subjectMatter = [
      { value: "Marine Navigation Software", confidence: 95, label: "Marine Navigation Software" },
      { value: "Vessel IoT & Telemetry", confidence: 85, label: "Vessel IoT & Telemetry" },
      { value: "Digital Infrastructure Services", confidence: 75, label: "Digital Infrastructure Services" }
    ];
    commercialModel = [
      { value: "Monthly Flat Rate", confidence: 95, label: "Monthly SaaS Subscription Rate" },
      { value: "Retainer Based Services", confidence: 85, label: "Retainer Based Services" },
      { value: "Revenue Share Agreement", confidence: 70, label: "Revenue Share" }
    ];
  } else if (cat.includes('corporate') || cat.includes('finance') || t.includes('shareholder') || t.includes('loan') || t.includes('investment') || t.includes('financing')) {
    standardForm = [
      { value: "Company Template", confidence: 95, label: "Company Corporate Finance Template" },
      { value: "Custom Agreement", confidence: 85, label: "Custom Agreement (High specificity)" }
    ];
    complianceFramework = [
      { value: ["Anti-Bribery", "Anti-Corruption", "Anti-Money Laundering (AML)", "Know Your Customer (KYC)"], confidence: 95, label: "Comprehensive AML/KYC & Anti-Corruption Suite" },
      { value: ["Beneficial Ownership", "Corporate Governance"], confidence: 85, label: "Corporate Governance Package" }
    ];
    law = [
      { value: "English Law (LMAA)", confidence: 95, label: "English Law (Standard for international finance)" },
      { value: "New York State Law (SMA)", confidence: 85, label: "New York State Law (Americas finance)" },
      { value: "Swiss Law", confidence: 75, label: "Swiss Law" }
    ];
    arbitrationRules = [
      { value: "ICC (International Chamber of Commerce)", confidence: 95, label: "ICC Rules (Preferred for international finance)" },
      { value: "LCIA (London Court of International Arbitration)", confidence: 85, label: "LCIA Rules (London-focused)" }
    ];
    objective = [
      { value: "Financing Arrangement", confidence: 95, label: "Financing Arrangement" },
      { value: "Asset Acquisition", confidence: 85, label: "Asset Acquisition" }
    ];
    transactionType = [
      { value: "Vessel Financing Support", confidence: 95, label: "Vessel Financing Support" },
      { value: "Due Diligence Audits", confidence: 85, label: "Due Diligence Audits" }
    ];
    subjectMatter = [
      { value: "Financing Support", confidence: 95, label: "Financing Support" },
      { value: "Insurance Brokerage", confidence: 85, label: "Insurance Brokerage" }
    ];
    commercialModel = [
      { value: "Retainer Based Services", confidence: 95, label: "Retainer Based" },
      { value: "Commission Based (Percentage of Sale)", confidence: 85, label: "Commission Based" }
    ];
  } else if (cat.includes('procurement') || cat.includes('supply') || t.includes('vendor') || t.includes('spare') || t.includes('equipment')) {
    standardForm = [
      { value: "Company Template", confidence: 95, label: "Company Procurement Template" },
      { value: "Custom Agreement", confidence: 85, label: "Custom Supply Terms" },
      { value: "FIDIC", confidence: 70, label: "FIDIC Standard Form" }
    ];
    complianceFramework = [
      { value: ["Incoterms® 2020", "CISG (Vienna Convention)", "UCP 600"], confidence: 95, label: "Incoterms® 2020 & CISG Sales Package (Standard trade)" },
      { value: ["Anti-Bribery", "Anti-Corruption", "Sanctions & Export Controls (UN/EU/US)"], confidence: 85, label: "Trade Sanctions & compliance" }
    ];
    objective = [
      { value: "Long-Term Maintenance", confidence: 95, label: "Long-Term Maintenance" },
      { value: "Project Delivery", confidence: 85, label: "Project Delivery" }
    ];
    transactionType = [
      { value: "Equipment Supply", confidence: 95, label: "Equipment Supply" },
      { value: "Spare Parts Supply", confidence: 85, label: "Spare Parts Supply" }
    ];
    subjectMatter = [
      { value: "Equipment Manufacturing", confidence: 95, label: "Equipment Manufacturing" },
      { value: "Vessel Maintenance", confidence: 85, label: "Vessel Maintenance" }
    ];
    commercialModel = [
      { value: "Fixed Price Turnkey", confidence: 95, label: "Fixed Price Turnkey" },
      { value: "Cost Plus Margin (Cost-Reimbursable)", confidence: 85, label: "Cost Plus Margin" }
    ];
  }

  return {
    standardForm,
    complianceFramework,
    law,
    arbitrationRules,
    objective,
    transactionType,
    subjectMatter,
    commercialModel
  };
};

const generateSuggestedDescription = (
  category: string,
  type: string,
  objective: string,
  subjectMatter: string,
  seller: string,
  buyer: string,
  value: string,
  currency: string,
  geoScope: string
) => {
  const buyerName = buyer || "the Buyer";
  const sellerName = seller || "the Seller";
  const valStr = value ? `${value} ${currency || 'USD'}` : "the specified valuation";
  const locStr = geoScope ? ` within the ${geoScope} region` : "";

  return `This ${type || 'Agreement'} establishes the binding commercial and operational framework between ${sellerName} and ${buyerName}. The primary commercial objective is ${objective || 'to facilitate business collaboration'}, focusing specifically on the subject matter of ${subjectMatter || 'defined corporate and marine services'}. Under the terms of this Agreement, the total commercial valuation is designated at ${valStr}${locStr}, subject to robust compliance with international trade parameters and standard operational covenants.`;
};

const AIRecommendationHelper = ({
  fieldName,
  currentValue,
  options,
  onAccept,
  manuallyConfirmedFields,
  setManuallyConfirmedFields
}: {
  fieldName: string;
  currentValue: any;
  options: { value: any; confidence: number; label: string }[];
  onAccept: (val: any) => void;
  manuallyConfirmedFields: Record<string, boolean>;
  setManuallyConfirmedFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) => {
  const isManuallyConfirmed = !!manuallyConfirmedFields[fieldName];

  return (
    <div className="mt-2.5 p-3 bg-[#0a1c34]/50 border border-blue-900/30 rounded-lg space-y-1.5 animate-in fade-in duration-300 text-left">
      <div className="flex items-center justify-between text-[8.5px] font-manrope">
        <span className="text-[#00D4FF] font-extrabold tracking-widest uppercase flex items-center gap-1">
          <Sparkles size={9} className="text-[#00D4FF]" /> AI CONFIGURATION RECO
        </span>
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/30">
          {isManuallyConfirmed ? "LOCK: PRESERVED" : "AUTO: OPTIMIZED"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt, idx) => {
          const isSelected = JSON.stringify(opt.value) === JSON.stringify(currentValue);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onAccept(opt.value);
                setManuallyConfirmedFields(prev => ({ ...prev, [fieldName]: true }));
              }}
              className={`px-2 py-1 text-[9px] font-semibold rounded transition-all cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/40 font-bold shadow-[0_0_10px_rgba(0,212,255,0.15)]'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border-white/5 hover:border-white/10 hover:bg-slate-900/80'
              }`}
            >
              <span className={`text-[7px] px-1 rounded font-extrabold uppercase tracking-widest ${
                idx === 0 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' 
                  : 'bg-slate-950 text-slate-400'
              }`}>
                {opt.confidence}% MATCH
              </span>
              <span className="truncate max-w-[150px] md:max-w-[250px]">
                {Array.isArray(opt.value) ? opt.value.join(", ") : String(opt.value)}
              </span>
            </button>
          );
        })}
        
        {isManuallyConfirmed && (
          <button
            type="button"
            onClick={() => {
              setManuallyConfirmedFields(prev => {
                const next = { ...prev };
                delete next[fieldName];
                return next;
              });
              if (options.length > 0) {
                onAccept(options[0].value);
              }
            }}
            className="ml-auto text-[8px] text-red-400 hover:text-red-300 transition-all font-bold tracking-wider uppercase flex items-center gap-0.5"
          >
            ⚡ Reset to Auto
          </button>
        )}
      </div>
    </div>
  );
};

const FieldAiAssistant = ({
  label,
  onGenerate,
  onApply,
  hasPaid = false
}: {
  label: string;
  onGenerate: (prompt: string, label: string) => Promise<string | null>;
  onApply: (text: string) => void;
  hasPaid?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="mt-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] text-[#00D4FF] uppercase font-bold tracking-widest hover:text-white transition-colors"
      >
        <Anchor size={12} /> {isOpen ? 'Close Contract Assistant' : (hasPaid ? 'Use Contract Assistant (0 Credits)' : `Unlock Contract Assistant (${AI_COSTS.ASSISTANT} Credits)`)}
      </button>

      {isOpen && (
        <div className="mt-2 bg-[#041326]/60 border border-[#00D4FF]/20 rounded-lg p-3 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={`E.g., Please draft a standard ${label}...`}
              className="flex-1 bg-[#0a1c34]/40 border border-[#00D4FF]/20 rounded px-3 py-2 text-[11px] text-white focus:border-[#00D4FF] focus:outline-none"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
            <button
              onClick={async () => {
                if (!prompt) return;
                setIsGenerating(true);
                const result = await onGenerate(prompt, label);
                if (result) setGeneratedText(result);
                setIsGenerating(false);
              }}
              disabled={isGenerating || !prompt}
              className="bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          
                    {generatedText && (
                      <div className="bg-[#0a1c34]/60 border border-[#00D4FF]/20 rounded overflow-hidden mt-3 shadow-xl relative z-20 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center bg-white/5 px-3 py-2 border-b border-white/5">
                          <span className="text-[9px] uppercase font-bold text-[#00D4FF] tracking-widest">AI Drafting Result</span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest">Review & Confirm Below</span>
                        </div>
                        <div className="p-4 text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto bg-slate-950/40">
                          {generatedText}
                        </div>
                        <div className="p-3 bg-white/5 border-t border-white/5 flex justify-end gap-3">
                          <button 
                            onClick={() => setGeneratedText("")}
                            className="text-[9px] text-slate-400 uppercase tracking-widest font-bold hover:text-white px-3 py-2 transition-colors"
                          >
                            Discard
                          </button>
                          <button 
                            onClick={() => {
                              onApply(generatedText);
                              setIsOpen(false);
                              setPrompt("");
                              setGeneratedText("");
                            }}
                            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/30 px-5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-1.5"
                          >
                            <Check size={12} /> Approve & Insert to Field
                          </button>
                        </div>
                      </div>
                    )}
        </div>
      )}
    </div>
  );
};

const RealisticSealStamp = ({ companyName = "GLOBAL DYNAMICS", verificationCode = "8A7F-31CC", date = "2026-06-14", size = "w-32 h-32" }: any) => {
  return (
    <div className={`relative ${size} flex items-center justify-center select-none pointer-events-none self-center mx-auto transition-all duration-300 hover:scale-105`}>
      {/* Curved outer and inner text seal svg */}
      <svg className="absolute w-full h-full text-[#1d4ed8]" viewBox="0 0 100 100">
        <defs>
          {/* Outer text path (r=40) */}
          <path id="outerSealPath" d="M 50 10 A 40 40 0 1 1 49.9 10" fill="none" />
          {/* Inner text path (r=26) */}
          <path id="innerSealPath" d="M 50 24 A 26 26 0 1 1 49.9 24" fill="none" />
        </defs>

        {/* Concentric Circular Borders */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeOpacity="0.9" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#1d4ed8" strokeWidth="0.75" strokeDasharray="2,1.5" strokeOpacity="0.75" />
        <circle cx="50" cy="50" r="37" fill="none" stroke="#1d4ed8" strokeWidth="1.25" strokeOpacity="0.8" />
        <circle cx="50" cy="50" r="21" fill="none" stroke="#1d4ed8" strokeWidth="1" strokeDasharray="1,1" strokeOpacity="0.6" />

        {/* Dış Halka: CONTRACT ID • VERSION • EXECUTION DATE • VERIFIED EXECUTION • AGREEMENT RECORD */}
        <text className="font-mono text-[3.4px] uppercase tracking-[0.11em] font-black fill-[#1d4ed8]">
          <textPath href="#outerSealPath" startOffset="0%">
            • CONTRACT ID: {verificationCode || "8A7F-31CC"} • VERSION: V4.0 • EXECUTION DATE: {date || "2026-06-14"} • VERIFIED EXECUTION • AGREEMENT RECORD
          </textPath>
        </text>

        {/* İç Halka: Contract Studio */}
        <text className="font-sans text-[4.5px] uppercase tracking-[0.16em] font-black fill-[#1d4ed8]/95">
          <textPath href="#innerSealPath" startOffset="0%">
            • Contract Studio • Contract Studio • Contract Studio • Contract Studio
          </textPath>
        </text>

        {/* Merkez: EXECUTION CERTIFIED */}
        <text x="50" y="47" textAnchor="middle" className="font-sans text-[5.8px] uppercase font-black fill-[#1d4ed8] tracking-widest">
          EXECUTION
        </text>
        <text x="50" y="55" textAnchor="middle" className="font-sans text-[5.8px] uppercase font-black fill-[#1d4ed8] tracking-widest">
          CERTIFIED
        </text>
      </svg>
    </div>
  );
};

const DigitalSignatureBlock = ({ approvalData, partyA, partyB, additionalParties, isExecuted, contractFields, firestoreContractData }: any) => {
  // Check for 'approved' flag in the root of the Firestore document OR inside any clauses in the Firestore document
  const isFirestoreApproved = firestoreContractData?.approved === true || 
    (firestoreContractData?.clauses && Array.isArray(firestoreContractData.clauses) && firestoreContractData.clauses.some((c: any) => c.approved === true));

  const isApproved = approvalData?.approved || isExecuted || isFirestoreApproved;
  if (!isApproved) return null;

  // Find approved clauses to list in the signature block
  const approvedClauses = (firestoreContractData?.clauses || []).filter((c: any) => c.approved === true || c.status === 'v4 Approved');

  return (
    <div className="mt-8 p-5 bg-[#F8FAFC] border-2 border-emerald-500/30 rounded-xl text-slate-800 space-y-4 font-sans animate-in fade-in shadow-sm">
      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase font-mono">
            SECURE DIGITAL SIGNATURE ENGINE ✓
          </span>
        </div>
        <span className="text-[7.5px] text-slate-400 font-mono">
          DOC-ID: {firestoreContractData?.id || approvalData?.contractId || "SECURE-LEDGER-HASH"}
        </span>
      </div>
      
      <p className="text-[9.5px] text-slate-600 leading-relaxed">
        This document has been cryptographically finalized and signed under the <strong>Interactive Clauses Framework</strong> using the selected global protocol <strong>{contractFields?.signatureMethod || "Qualified Electronic Signature"}</strong>. The legal seal below represents irrevocable binding execution of all contract clauses.
      </p>
      
      {approvedClauses.length > 0 && (
        <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-500/10 text-[8.5px] text-slate-650">
          <p className="font-bold text-emerald-850 uppercase tracking-wider text-[8px] mb-1">Approved & Execution-Locked Sections:</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono">
            {approvedClauses.map((c: any, i: number) => (
              <p key={i}>✓ {c.title}: Finalized & Recorded</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2 items-center">
        <div className="text-[9px] space-y-2">
          <p className="font-bold text-slate-700 uppercase tracking-widest text-[7.5px]">Authorized Corporate Signatories:</p>
          <div className="space-y-1 bg-white/60 p-2.5 rounded border border-slate-200/60 shadow-inner">
            <p className="font-medium text-slate-900">• {partyA?.name || "Seller Signatory"} <span className="text-slate-450 text-[7.5px]">({partyA?.email || "unnabgroup@gmail.com"})</span></p>
            <p className="font-medium text-slate-900">• {partyB?.name || "Buyer Signatory"} <span className="text-slate-450 text-[7.5px]">({partyB?.email || "verified_party_b@merchant.com"})</span></p>
            {additionalParties?.map((p: any, i: number) => p.name && (
              <p key={i} className="font-medium text-slate-900">• {p.name} <span className="text-slate-450 text-[7.5px]">({p.email || "verified_additional@merchant.com"})</span></p>
            ))}
          </div>
          <div className="text-[7.5px] text-slate-400 font-mono mt-1">
            METHOD: <span className="text-emerald-700 font-bold uppercase">{contractFields?.signatureMethod || "ELECTRONIC SIGNATURE"}</span><br/>
            CONFIRMED AT: {firestoreContractData?.updatedAt || approvalData?.confirmedAt || new Date().toISOString()}
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <p className="font-bold text-slate-700 uppercase tracking-widest text-[7.5px] mb-1">EXECUTION CERTIFICATE STAMP</p>
          <RealisticSealStamp 
            companyName={partyA?.name || "GLOBAL DYNAMICS"} 
            verificationCode={contractFields?.verificationCode || "8A7F-31CC"}
            date={(firestoreContractData?.updatedAt || approvalData?.confirmedAt || new Date().toISOString()).split('T')[0]}
            size="w-16 h-16"
          />
        </div>
      </div>
    </div>
  );
};

export default function ContractStudio({ 
  template, 
  company, 
  userType, 
  onBack,
  silentBackupContractId = null,
  onSilentBackupComplete
}: { 
  template?: string, 
  company?: any, 
  userType?: string, 
  onBack?: () => void,
  silentBackupContractId?: string | null,
  onSilentBackupComplete?: (success: boolean) => void
}) {
  const isTR = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr');
  const t = (en: string, tr: string) => (isTR ? tr : en);

  const coreSectionsPre = [
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
    "Arbitration"
  ];
  
  const coreSectionsPost = [
    "Signatures",
    "Annexes",
    "Attachments",
    "Verification",
    "Audit Trail",
    "Contract AI Advisor"
  ];

  const hardcodedClauseIds = new Set([
    "clause_parties", "clause_commercial_foundation", "clause_deliverables", 
    "clause_commercial_terms", "clause_payment_terms", "clause_delivery_terms", 
    "clause_warranty", "clause_liability", "clause_confidentiality", 
    "clause_termination", "clause_jurisdiction", "clause_arbitration", 
    "clause_execution", "clause_annexes", "clause_broker"
  ]);

  const [workflowStep, setWorkflowStep] = useState<'hub' | 'editor'>('hub');
  
  // Firestore active contract states
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [dbContracts, setDbContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState<boolean>(true);
  
  // Search & filter states for the hub
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>("Commercial Foundation");
  const [manuallyCompletedSections, setManuallyCompletedSections] = useState<string[]>([]);

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
    pageBreakBefore?: boolean;
  }>>([]);

  const [editingTitleClauseId, setEditingTitleClauseId] = useState<string | null>(null);
  const [tempTitleVal, setTempTitleVal] = useState<string>('');

  const customSections = clauses.filter(cl => !hardcodedClauseIds.has(cl.id) && cl.title);
  
  const sections = [
    ...coreSectionsPre,
    ...customSections.map(c => c.title),
    ...coreSectionsPost
  ];

  // Version Control State
  const [currentVersion, setCurrentVersion] = useState<'v1 Generated' | 'v2 Seller Revision' | 'v3 Buyer Revision' | 'v4 Approved' | 'v5 Signed'>('v1 Generated');

  // Auto-saved & Revision History states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [revisions, setRevisions] = useState<any[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState<boolean>(false);

  // Pending AI Revision Preview state
  const [pendingRevision, setPendingRevision] = useState<{
    originalText: string;
    aiActionType: string;
    aiOutput: string;
    timestamp: string;
    clauseId: string;
    clauseTitle: string;
  } | null>(null);

  const handleAcceptRejectRevision = async (apply: boolean, decision: 'Accepted' | 'Rejected' | 'Continue Editing') => {
    if (!pendingRevision) return;

    const newRevision = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clauseKey: pendingRevision.clauseId,
      clauseLabel: pendingRevision.clauseTitle,
      previousValue: pendingRevision.originalText,
      newValue: apply ? pendingRevision.aiOutput : pendingRevision.originalText,
      aiOutput: pendingRevision.aiOutput,
      aiActionType: pendingRevision.aiActionType,
      userDecision: decision,
      timestamp: new Date().toISOString(),
      author: company?.name || "Corporate Operator",
      versionTag: decision === 'Accepted' ? 'AI Accepted' : decision === 'Rejected' ? 'AI Rejected' : 'AI Continue Editing'
    };

    setRevisions(prev => [newRevision, ...prev]);

    if (decision === 'Accepted') {
      setClauses(prev => prev.map(c => c.id === pendingRevision.clauseId ? { ...c, content: pendingRevision.aiOutput, status: 'v2 Seller Revision' as any } : c));
      syncClauseToFields(pendingRevision.clauseId, pendingRevision.aiOutput);
      setShowSyncSuccessToast(true);
      setTimeout(() => setShowSyncSuccessToast(false), 3000);
    } else if (decision === 'Continue Editing') {
      setClauses(prev => prev.map(c => c.id === pendingRevision.clauseId ? { ...c, content: pendingRevision.aiOutput, status: 'v2 Seller Revision' as any } : c));
      syncClauseToFields(pendingRevision.clauseId, pendingRevision.aiOutput);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }

    setPendingRevision(null);
  };
  
  // Track focused field values for capturing complete onBlur revision logs
  const originalValuesRef = React.useRef<{ [key: string]: string }>({});
  
  // Ref for the clause workspace scroll sync
  const workspaceScrollRef = React.useRef<HTMLDivElement>(null);

  // Ref for the revision workspace textarea
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState(false);

  // Real-time Firestore active contract state
  const [firestoreContractData, setFirestoreContractData] = useState<any>(null);
  const [interactiveClausesApproval, setInteractiveClausesApproval] = useState<any>(null);
  
  const [documentHash, setDocumentHash] = useState<string>('');

  // Global mapping to retrieve activeClause in real-time
  const globalSectionToClauseId: { [key: string]: string } = useMemo(() => {
    const map: { [key: string]: string } = {
      "Parties": "clause_parties",
      "Commercial Foundation": "clause_commercial_foundation",
      "Deliverables": "clause_deliverables",
      "Commercial Terms": "clause_commercial_terms",
      "Payment Terms": "clause_payment_terms",
      "Delivery Terms": "clause_delivery_terms",
      "Warranty": "clause_warranty",
      "Liability": "clause_liability",
      "Confidentiality": "clause_confidentiality",
      "Termination": "clause_termination",
      "Jurisdiction": "clause_jurisdiction",
      "Arbitration": "clause_arbitration",
      "Signatures": "clause_execution",
      "Annexes": "clause_annexes"
    };

    const hardcodedClauseIds = new Set(Object.values(map));
    clauses.forEach(cl => {
      if (!hardcodedClauseIds.has(cl.id) && cl.title) {
        map[cl.title] = cl.id;
      }
    });

    return map;
  }, [clauses]);

  const activeClause = useMemo(() => {
    const mappedClauseId = globalSectionToClauseId[activeSection];
    return clauses.find(c => c.id === mappedClauseId);
  }, [activeSection, clauses, globalSectionToClauseId]);

  // Export to PDF preview overlay options
  const [showPdfPreviewOverlay, setShowPdfPreviewOverlay] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(75);
  const [previewShowCropMarks, setPreviewShowCropMarks] = useState<boolean>(true);
  const [previewIncludeSeal, setPreviewIncludeSeal] = useState<boolean>(true);
  const [previewPrintMode, setPreviewPrintMode] = useState<boolean>(false);
  const [isScrollSyncEnabled, setIsScrollSyncEnabled] = useState<boolean>(true);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(true);

  // Automatically collapse preview on smaller screens (e.g. tablet, small laptop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1124) {
        setShowLivePreview(false);
      } else {
        setShowLivePreview(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getFieldFriendlyLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      deliverables: "Section 02 - Deliverables & Technical Scope",
      milestones: "Section 02 - Critical Milestones",
      commercialTerms: "Section 03 - Commercials & Costs",
      surcharges: "Section 03 - Surcharges & Demurrage",
      paymentTerms: "Section 04 - Invoicing and Logistics",
      paymentMethod: "Section 04 - Payment Method",
      incoterms: "Section 04 - Incoterms",
      deliveryLocation: "Section 04 - Logistical Terminal",
      warrantyPeriod: "Section 05 - Warranty Period",
      warrantyScope: "Section 05 - Warranty Scope",
      liabilityLimit: "Section 05 - Liability Limit",
      consequentialDamages: "Section 05 - Consequential Damages Waiver",
      confidentialityDuration: "Section 05 - Confidentiality Duration",
      terminationNotice: "Section 06 - Termination Notice",
      arbitrationRules: "Section 07 - Disputes & Arbitrators Rules",
      annexes: "Section 06 - Table of Annexes",
      verificationCode: "Section 07 - Verification Code",
      auditTrail: "Section 07 - Cryptographic Audit Trail"
    };
    return labels[key] || key;
  };

  const handleFieldFocus = (fieldKey: string) => {
    if (originalValuesRef.current[fieldKey] === undefined) {
      originalValuesRef.current[fieldKey] = contractFields[fieldKey] || "";
    }
  };

  const syncFieldToClause = (fieldKey: string, content: string) => {
    setClauses(prev => prev.map(c => {
      if (fieldKey === 'commercialTerms' && c.id === 'clause_commercial_terms') return { ...c, content };
      if (fieldKey === 'deliverables' && c.id === 'clause_deliverables') return { ...c, content };
      if (fieldKey === 'warrantyScope' && c.id === 'clause_warranty') return { ...c, content };
      if (fieldKey === 'liabilityLimit' && c.id === 'clause_liability') return { ...c, content };
      if (fieldKey === 'arbitrationRules' && c.id === 'clause_arbitration') return { ...c, content };
      if (fieldKey === 'paymentTerms' && c.id === 'clause_payment_terms') return { ...c, content };
      if (fieldKey === 'deliveryLocation' && c.id === 'clause_delivery_terms') return { ...c, content };
      if (fieldKey === 'confidentialityDuration' && c.id === 'clause_confidentiality') return { ...c, content };
      if (fieldKey === 'terminationNotice' && c.id === 'clause_termination') return { ...c, content };
      return c;
    }));
  };

  const handleFieldUpdate = (fieldKey: string, value: string) => {
    setContractFields(prev => ({ ...prev, [fieldKey]: value }));
    syncFieldToClause(fieldKey, value);
  };

  const handleFieldBlur = (fieldKey: string) => {
    const prevVal = originalValuesRef.current[fieldKey];
    const newVal = contractFields[fieldKey] || "";
    if (prevVal !== undefined && prevVal !== newVal) {
      const newRevision = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clauseKey: fieldKey,
        clauseLabel: getFieldFriendlyLabel(fieldKey),
        previousValue: prevVal,
        newValue: newVal,
        timestamp: new Date().toISOString(),
        author: company?.name || "Corporate Operator",
        versionTag: currentVersion
      };
      setRevisions(prev => [newRevision, ...prev]);
      originalValuesRef.current[fieldKey] = newVal;
      syncFieldToClause(fieldKey, newVal);
    }
  };

  const handleRevertClause = (key: string, value: string) => {
    const originalVal = contractFields[key] || "";
    const newRevision = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clauseKey: key,
      clauseLabel: getFieldFriendlyLabel(key),
      previousValue: originalVal,
      newValue: value,
      timestamp: new Date().toISOString(),
      author: company?.name || "Corporate Operator",
      versionTag: `${currentVersion} (Reverted)`
    };
    
    setContractFields(prev => ({
      ...prev,
      [key]: value
    }));
    setRevisions(prev => [newRevision, ...prev]);
    originalValuesRef.current[key] = value;
  };

  const syncClauseToFields = (clauseId: string, content: string) => {
    setContractFields(prev => {
      const next = { ...prev };
      if (clauseId === 'clause_commercial_terms') next.commercialTerms = content;
      if (clauseId === 'clause_deliverables') next.deliverables = content;
      if (clauseId === 'clause_warranty') next.warrantyScope = content;
      if (clauseId === 'clause_liability') next.liabilityLimit = content;
      if (clauseId === 'clause_arbitration') next.arbitrationRules = content;
      if (clauseId === 'clause_payment_terms') next.paymentTerms = content;
      if (clauseId === 'clause_delivery_terms') next.deliveryLocation = content;
      if (clauseId === 'clause_confidentiality') next.confidentialityDuration = content;
      if (clauseId === 'clause_termination') next.terminationNotice = content;
      return next;
    });
  };

  const handleToolbarAction = async (action: string, activeClause: any) => {
    if (isAiRevising) return;
    
    // Manual Edit
    if (action === 'manual_edit') {
      const isCurrentlyLocked = activeClause.status.includes('Signed');
      if (isCurrentlyLocked) {
        // Unlock clause by setting status to a revision status
        setClauses(prev => prev.map(c => c.id === activeClause.id ? { ...c, status: 'v2 Seller Revision' as any } : c));
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return;
    }

    // Approve
    if (action === 'approve') {
      const updatedClauses = clauses.map(c => 
        c.id === activeClause.id ? { ...c, status: 'v4 Approved' as any, approved: true } : c
      );
      setClauses(updatedClauses);
      
      // Immediately push approved content to the agreement state
      syncClauseToFields(activeClause.id, activeClause.content);
      const updatedFields = { ...contractFields };
      if (activeClause.id === 'clause_commercial_terms') updatedFields.commercialTerms = activeClause.content;
      if (activeClause.id === 'clause_deliverables') updatedFields.deliverables = activeClause.content;
      if (activeClause.id === 'clause_warranty') updatedFields.warrantyScope = activeClause.content;
      if (activeClause.id === 'clause_liability') updatedFields.liabilityLimit = activeClause.content;
      if (activeClause.id === 'clause_arbitration') updatedFields.arbitrationRules = activeClause.content;
      if (activeClause.id === 'clause_payment_terms') updatedFields.paymentTerms = activeClause.content;
      if (activeClause.id === 'clause_delivery_terms') updatedFields.deliveryLocation = activeClause.content;
      if (activeClause.id === 'clause_confidentiality') updatedFields.confidentialityDuration = activeClause.content;
      if (activeClause.id === 'clause_termination') updatedFields.terminationNotice = activeClause.content;

      const newRevision = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clauseKey: activeClause.id,
        clauseLabel: activeClause.title,
        previousValue: activeClause.content,
        newValue: activeClause.content,
        timestamp: new Date().toISOString(),
        author: company?.name || "Corporate Operator",
        versionTag: 'Approved'
      };
      const updatedRevisions = [newRevision, ...revisions];
      setRevisions(updatedRevisions);

      // Immediately write back to Firestore to trigger instant PDF generation
      if (activeContractId) {
        try {
          await RegistryTransactionService.autoSaveDraft(activeContractId, {
            clauses: updatedClauses,
            revisions: updatedRevisions,
            contractFields: updatedFields,
            updatedAt: new Date().toISOString()
          });

          const contractDataRef = doc(db, "contract_data", activeContractId);
          await setDoc(contractDataRef, {
            clauses: updatedClauses,
            revisions: updatedRevisions,
            contractFields: updatedFields,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn("Direct Firestore write failure:", err);
        }
      }

      // Show temporary beautiful success banner
      setShowSyncSuccessToast(true);
      setTimeout(() => setShowSyncSuccessToast(false), 3000);
      return;
    }

    // Send to Agreement
    if (action === 'send_to_agreement') {
      const updatedClauses = clauses.map(c => 
        c.id === activeClause.id ? { ...c, status: 'v4 Approved' as any, approved: true } : c
      );
      setClauses(updatedClauses);
      
      // Sync activeClause.content with the correct contractField immediately
      const updatedText = activeClause.content;
      syncClauseToFields(activeClause.id, updatedText);
      const updatedFields = { ...contractFields };
      if (activeClause.id === 'clause_commercial_terms') updatedFields.commercialTerms = updatedText;
      if (activeClause.id === 'clause_deliverables') updatedFields.deliverables = updatedText;
      if (activeClause.id === 'clause_warranty') updatedFields.warrantyScope = updatedText;
      if (activeClause.id === 'clause_liability') updatedFields.liabilityLimit = updatedText;
      if (activeClause.id === 'clause_arbitration') updatedFields.arbitrationRules = updatedText;
      if (activeClause.id === 'clause_payment_terms') updatedFields.paymentTerms = updatedText;
      if (activeClause.id === 'clause_delivery_terms') updatedFields.deliveryLocation = updatedText;
      if (activeClause.id === 'clause_confidentiality') updatedFields.confidentialityDuration = updatedText;
      if (activeClause.id === 'clause_termination') updatedFields.terminationNotice = updatedText;

      const newRevision = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clauseKey: activeClause.id,
        clauseLabel: activeClause.title,
        previousValue: activeClause.content,
        newValue: updatedText,
        timestamp: new Date().toISOString(),
        author: company?.name || "Corporate Operator",
        versionTag: 'Sent to Agreement'
      };
      const updatedRevisions = [newRevision, ...revisions];
      setRevisions(updatedRevisions);

      // Immediately write back to Firestore to trigger instant PDF generation
      if (activeContractId) {
        try {
          await RegistryTransactionService.autoSaveDraft(activeContractId, {
            clauses: updatedClauses,
            revisions: updatedRevisions,
            contractFields: updatedFields,
            updatedAt: new Date().toISOString()
          });

          const contractDataRef = doc(db, "contract_data", activeContractId);
          await setDoc(contractDataRef, {
            clauses: updatedClauses,
            revisions: updatedRevisions,
            contractFields: updatedFields,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn("Direct Firestore write failure:", err);
        }
      }

      // Show temporary beautiful success banner
      setShowSyncSuccessToast(true);
      setTimeout(() => setShowSyncSuccessToast(false), 3000);
      return;
    }

    // Delete
    if (action === 'delete') {
      setClauses(prev => prev.map(c => c.id === activeClause.id ? { ...c, content: "", status: 'v2 Seller Revision' as any } : c));
      syncClauseToFields(activeClause.id, "");

      const newRevision = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clauseKey: activeClause.id,
        clauseLabel: activeClause.title,
        previousValue: activeClause.content,
        newValue: "",
        timestamp: new Date().toISOString(),
        author: company?.name || "Corporate Operator",
        versionTag: 'Cleared Content'
      };
      setRevisions(prev => [newRevision, ...prev]);
      return;
    }

    // AI Actions (Rewrite, Add Content, Remove Content, Improve Wording, Continue Writing)
    const cost = AI_COSTS.REWRITE;
    if (company?.id) {
      const hasCredits = await CreditService.checkBalance(company.id, cost);
      if (!hasCredits) {
        setShowBillingWallModal(true);
        return;
      }
    }

    setIsAiRevising(true);
    let promptInstruction = "";
    let isAppend = false;
    const userPrompt = individualAiInstruction.trim();

    if (action === 'rewrite') {
      promptInstruction = `Rewrite the selected clause while preserving its original meaning and contractual intent. Do not add new obligations unless requested.${userPrompt ? ` User Request: ${userPrompt}` : ''}`;
    } else if (action === 'add_content') {
      promptInstruction = `Extend the selected clause by adding only the additional content requested by the user. Preserve all existing approved text.${userPrompt ? ` Additional content requested: ${userPrompt}` : ''}`;
    } else if (action === 'remove_content') {
      promptInstruction = `Remove only the content explicitly identified by the user. Never modify unrelated text.${userPrompt ? ` Content to remove: ${userPrompt}` : ''}`;
    } else if (action === 'improve_wording') {
      promptInstruction = `Improve grammar, readability, consistency and professional legal drafting. Do not change commercial intent. Do not change legal meaning.${userPrompt ? ` Focus on: ${userPrompt}` : ''}`;
    } else if (action === 'continue_writing') {
      promptInstruction = `Continue the selected clause naturally using the existing drafting style. Do not rewrite existing approved content. Generate only the missing continuation.${userPrompt ? ` Guidance: ${userPrompt}` : ''}`;
      isAppend = true;
    }

    try {
      const result = await rewriteContractClauseWithAi(activeClause.title, activeClause.content, promptInstruction, {
        agreementType: foundation.type, seller: partyA.name, buyer: partyB.name, contractValue: foundation.value, currency: foundation.currency,
        jurisdiction: jurisdiction.law, arbitrationSeat: jurisdiction.seat, deliveryPort: contractFields.deliveryLocation, broker: "XYZ Brokerage"
      });

      const finalContent = isAppend ? (activeClause.content + "\n\n" + result) : result;
      
      // Store the preview instead of directly updating the active clause!
      setPendingRevision({
        originalText: activeClause.content,
        aiActionType: action,
        aiOutput: finalContent,
        timestamp: new Date().toISOString(),
        clauseId: activeClause.id,
        clauseTitle: activeClause.title
      });

      await CreditService.deductCredits(
        company.id,
        auth.currentUser?.email || '',
        'Contract Assistant',
        `AI ${action.replace('_', ' ').toUpperCase()}: ${activeClause.title}`,
        cost
      );
      setIndividualAiInstruction("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiRevising(false);
    }
  };

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

  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

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

  const generateInitialClauses = (data: any) => {
    const formattedVal = `${data.currency || 'USD'} ${Number(data.contractValue?.toString().replace(/,/g, '') || 0).toLocaleString()}`;
    const dateStr = data.effectiveDate ? new Date(data.effectiveDate).toLocaleDateString() : new Date().toLocaleDateString();
    
    const isService = data.agreementType?.includes("Service") || data.agreementType?.includes("Consulting") || data.agreementType?.includes("Management");
    const isSoftware = data.agreementType?.includes("Software") || data.agreementType?.includes("SaaS") || data.agreementType?.includes("Technology") || data.agreementType?.includes("Data");
    const isFinance = data.agreementType?.includes("Financing") || data.agreementType?.includes("Loan") || data.agreementType?.includes("Shareholder") || data.agreementType?.includes("Investment");
    const isMaritime = data.agreementType?.includes("Charter") || data.agreementType?.includes("Ship") || data.agreementType?.includes("Vessel") || data.agreementType?.includes("Maritime");
    
    let scopeDesc = data.deliverables || "[Insert detailed scope of deliverables here]";
    let warrantyDesc = data.warrantyScope || "Guarantee of operational integrity and compliance with relevant industry regulations.";
    
    if (!data.deliverables) {
        if (isSoftware) {
            scopeDesc = "Provision of software licensing, cloud hosting architecture, and technical maintenance services with 99.9% uptime SLA.";
            warrantyDesc = "The Software shall perform substantially in accordance with its documentation. Provider warrants that no malicious code is knowingly introduced.";
        }
        else if (isFinance) {
            scopeDesc = "Provision of financial instruments, capital injection, and equity distribution as structured in the capitalization table annex.";
            warrantyDesc = "Each party warrants its legal capacity and corporate authority to execute these financial instruments.";
        }
        else if (isMaritime) {
            scopeDesc = "Vessel charter, marine logistics, and operational navigation services across the designated maritime zones.";
            warrantyDesc = "The Vessel maintains active, unrestricted compliance status with leading international classification registries (e.g., DNV, Lloyd's Register).";
        }
        else if (isService) {
            scopeDesc = "Provision of professional consulting and operational support services as detailed in the attached Statement of Work.";
            warrantyDesc = "Services shall be performed in a professional and workmanlike manner consistent with industry standards.";
        }
    }

    return [
      {
        id: "clause_parties",
        title: "Clause 1. Parties & Preamble",
        content: `This ${data.agreementType || "Agreement"} is entered into on ${dateStr}, by and between:

1. ${data.seller || "[Party A Name]"} (Hereinafter the "Disclosing Party" or "Provider").

2. ${data.buyer || "[Party B Name]"} (Hereinafter the "Receiving Party" or "Client").

Hereinafter referred to collectively as the "Parties" and individually as a "Party".`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_commercial_foundation",
        title: "Clause 2. Commercial Foundation",
        content: `The total agreed base commercial valuation that governs this ${data.agreementType || "transactional structure"} is established at ${formattedVal}.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_deliverables",
        title: "Clause 3. Scope of Deliverables",
        content: `The primary scope comprises: ${scopeDesc}
        
Milestones and acceptance timelines: ${data.milestones || "To be defined in the appended schedules."}`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_commercial_terms",
        title: "Clause 4. Pricing & Surcharges",
        content: `Base Commercial Formula: ${data.commercialTerms || "Fixed fee structure unless otherwise specified."}
        
Surcharges and adjustments: ${data.surcharges || "Standard late payment penalties of 1.5% per month shall apply to overdue balances."}`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_payment_terms",
        title: "Clause 5. Payment Procedures",
        content: `Payment Terms: ${data.paymentTerms || "Net 30 days from invoice date. Invoices dispatched electronically."}
        
Payment Method: ${data.paymentMethod || "Electronic Bank Wire Transfer."}`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_delivery_terms",
        title: "Clause 6. Logistics & Transfer of Risk",
        content: `Delivery/Execution Location: ${data.deliveryPort || data.deliveryLocation || "Standard Operating Location"}

Incoterms/Logistics Standard: ${data.incoterms || (isSoftware ? "Digital Delivery (Cloud Access)" : "DDP")}

Transfer of Risk: Risk of loss or damage passes upon formal acceptance at the designated location.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_warranty",
        title: "Clause 7. Warranties",
        content: `Warranty Period: ${data.warrantyPeriod || "12 Months from completion"}

Warranty Scope: ${warrantyDesc}`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_liability",
        title: "Clause 8. Limitation of Liability",
        content: `Total Liability Limit Cap: ${data.liabilityLimit || "100% of Contract Value"}

Consequential Damages: ${data.consequentialDamages || "Excluded. Neither party shall be liable for indirect or consequential damages."}`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_confidentiality",
        title: "Clause 9. Confidentiality (NDA)",
        content: `Non-Disclosure Duration: ${data.confidentialityDuration || "5 Years from the effective date."}

Both parties agree to hold in strict confidence all proprietary data, financial information, and operational secrets exchanged.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_termination",
        title: "Clause 10. Termination",
        content: `Termination Notice: ${data.terminationNotice || "30 Days written notice is required for standard termination."}

Immediate termination allowed for uncured material breach (30-day cure period).`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_jurisdiction",
        title: "Clause 11. Governing Law",
        content: `This Agreement shall be governed by the laws of ${data.jurisdiction || data.applicableLaw || "England & Wales"}.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      },
      {
        id: "clause_arbitration",
        title: "Clause 12. Dispute Resolution",
        content: `Any disputes shall be finally resolved by binding arbitration in ${data.arbitrationSeat || "London, United Kingdom"} under ${data.arbitrationRules || "standard arbitration rules"}.`,
        status: 'v1 Generated' as const,
        alternativeReplacementsCount: 0
      }
    ];
  };
  
  // States for Foundation
  const [foundation, setFoundation] = useState<any>({
    category: "Professional Services",
    type: "Service Agreement",
    title: "Eastern Mediterranean Technical Service Agreement",
    transactionType: "Maintenance",
    subjectMatter: "Provision of marine engineering and technical operational support services.",
    objective: "To maintain optimal operational efficiency of the vessel fleet.",
    description: "This Agreement establishes the commercial framework between the parties for the provision of marine engineering, technical support, maintenance, and operational consulting services for vessels operating within the designated region.",
    value: "5,000,000",
    currency: "USD",
    geoScope: "Eastern Mediterranean",
    continent: "Europe",
    country: "Greece",
    operatingArea: "Aegean Sea & Levant Basin",
    serviceLocation: "Greece & Cyprus Ports",
    duration: "24 Months",
    effectiveDate: "2026-06-14",
    expirationDate: "2028-06-13",
    renewalTerms: "Automatic Renewal",
    noticePeriod: "90 Days",
    standardForm: "Custom Contract",
    complianceFramework: []
  });

  // State for Jurisdiction
  const [jurisdiction, setJurisdiction] = useState<any>({
    law: "England & Wales",
    seat: "London",
    institution: "LMAA (London Maritime Arbitrators Association)",
    language: "English",
    timeZone: "UTC"
  });
  
  const [complianceCategory, setComplianceCategory] = useState("International Maritime");

  // Participant State with Emails
  const [partyA, setPartyA] = useState<any>({ 
    name: company?.name || "GLOBAL DYNAMICS LTD", 
    role: "Seller",
    email: company?.email || "owner@global-dynamics.com",
    address: "",
    idNumber: "",
    confirmEmail: true,
    additionalEmails: []
  });
  const [partyB, setPartyB] = useState<any>({ 
    name: "ARGENTO MARINE", 
    role: "Buyer",
    email: "legal@argentomarine.com",
    address: "",
    idNumber: "",
    confirmEmail: true,
    additionalEmails: []
  });
  const [additionalParties, setAdditionalParties] = useState<any[]>([]);

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
    partyABankDetails: "",
    partyBBankDetails: "",
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
    signatureMethod: "Electronic Signature",
    verificationCode: "8A7F-31CC-0E2A-5501-7F03",
    auditTrail: `1. Record Initialized: 2026-06-14 10:14 UTC
2. AI Risk Screened: Verified
3. Compliance Certificate attached`
  });

  // Smart Recommendation Engine States
  const [manuallyConfirmedFields, setManuallyConfirmedFields] = useState<Record<string, boolean>>({});
  const [isGeneratingDescription, setIsGeneratingDescription] = useState<boolean>(false);

  useEffect(() => {
    // 1. Get smart recommendations based on selected category and type
    const recs = getSmartRecommendations(foundation.category, foundation.type);

    // 2. Automatically update non-confirmed fields
    setFoundation((prev: any) => {
      let updated = { ...prev };
      let changed = false;

      if (!manuallyConfirmedFields.standardForm) {
        const topVal = recs.standardForm[0]?.value;
        if (topVal && prev.standardForm !== topVal) {
          updated.standardForm = topVal;
          changed = true;
        }
      }

      if (!manuallyConfirmedFields.complianceFramework) {
        const topVal = recs.complianceFramework[0]?.value;
        if (topVal && JSON.stringify(prev.complianceFramework) !== JSON.stringify(topVal)) {
          updated.complianceFramework = topVal;
          changed = true;
        }
      }

      if (!manuallyConfirmedFields.objective) {
        const topVal = recs.objective[0]?.value;
        if (topVal && prev.objective !== topVal) {
          updated.objective = topVal;
          changed = true;
        }
      }

      if (!manuallyConfirmedFields.transactionType) {
        const topVal = recs.transactionType[0]?.value;
        if (topVal && prev.transactionType !== topVal) {
          updated.transactionType = topVal;
          changed = true;
        }
      }

      if (!manuallyConfirmedFields.subjectMatter) {
        const topVal = recs.subjectMatter[0]?.value;
        if (topVal && prev.subjectMatter !== topVal) {
          updated.subjectMatter = topVal;
          changed = true;
        }
      }

      if (!manuallyConfirmedFields.commercialModel) {
        const topVal = recs.commercialModel[0]?.value;
        if (topVal && prev.commercialModel !== topVal) {
          updated.commercialModel = topVal;
          changed = true;
        }
      }

      // Project Description
      if (!manuallyConfirmedFields.description) {
        const suggestedDesc = generateSuggestedDescription(
          updated.category,
          updated.type,
          updated.objective,
          updated.subjectMatter,
          partyA.name,
          partyB.name,
          updated.value,
          updated.currency,
          updated.geoScope
        );
        if (prev.description !== suggestedDesc) {
          updated.description = suggestedDesc;
          changed = true;
        }
      }

      return changed ? updated : prev;
    });

    // Handle law & arbitration Rules in jurisdiction / contractFields
    setJurisdiction((prev: any) => {
      let updated = { ...prev };
      let changed = false;

      if (!manuallyConfirmedFields.law) {
        const topVal = recs.law[0]?.value;
        if (topVal && prev.law !== topVal) {
          updated.law = topVal;
          changed = true;
        }
      }

      if (!manuallyConfirmedFields.arbitrationRules) {
        const topVal = recs.arbitrationRules[0]?.value;
        if (topVal && prev.institution !== topVal) {
          updated.institution = topVal;
          changed = true;
        }
      }

      return changed ? updated : prev;
    });

    setContractFields((prev: any) => {
      let updated = { ...prev };
      let changed = false;

      if (!manuallyConfirmedFields.arbitrationRules) {
        const topVal = recs.arbitrationRules[0]?.value;
        if (topVal && prev.arbitrationRules !== topVal) {
          updated.arbitrationRules = topVal;
          changed = true;
        }
      }

      return changed ? updated : prev;
    });

  }, [
    foundation.category,
    foundation.type,
    jurisdiction.law,
    foundation.complianceFramework,
    foundation.standardForm
  ]);

  const prevContractFieldsRef = useRef(contractFields);
  const prevClausesRef = useRef(clauses);
  const prevFoundationRef = useRef(foundation);
  const prevJurisdictionRef = useRef(jurisdiction);
  const prevPartyARef = useRef(partyA);
  const prevPartyBRef = useRef(partyB);

  const currentRecs = useMemo(() => {
    return getSmartRecommendations(foundation.category, foundation.type);
  }, [foundation.category, foundation.type]);

  useEffect(() => {
    // 1. Sync from foundation, jurisdiction, partyA, partyB to clauses
    const prevFoundation = prevFoundationRef.current;
    const prevJurisdiction = prevJurisdictionRef.current;
    const prevPartyA = prevPartyARef.current;
    const prevPartyB = prevPartyBRef.current;

    const foundationChanged = JSON.stringify(prevFoundation) !== JSON.stringify(foundation);
    const jurisdictionChanged = JSON.stringify(prevJurisdiction) !== JSON.stringify(jurisdiction);
    const partyAChanged = JSON.stringify(prevPartyA) !== JSON.stringify(partyA);
    const partyBChanged = JSON.stringify(prevPartyB) !== JSON.stringify(partyB);

    let nextClauses = [...clauses];
    let didUpdateClauses = false;

    if (foundationChanged || jurisdictionChanged || partyAChanged || partyBChanged) {
      nextClauses = nextClauses.map(cl => {
        if (cl.id === 'clause_parties') {
          const content = `This Agreement is officially made and entered into on this 14th day of June 2026, by and between:

1. SELLER / PROVIDER: ${partyA.name || "GLOBAL DYNAMICS LTD"}, a premier marine corporation with email address ${partyA.email || "owner@global-dynamics.com"} and role as ${partyA.role || "Seller"}.

2. BUYER / CLIENT: ${partyB.name || "ARGENTO MARINE"}, an international purchasing group / commercial charter operator with email address ${partyB.email || "legal@argentomarine.com"} and role as ${partyB.role || "Buyer"}.

Hereinafter referred to collectively as the "Parties" and individually as a "Party". This transaction represents the absolute commercial intent to transfer and operate maritime assets.`;
          if (cl.content !== content) {
            didUpdateClauses = true;
            return { ...cl, content };
          }
        }
        if (cl.id === 'clause_commercial_foundation') {
          const content = `The Commercial Foundation of this transactional structure is governed by the following core covenants and parameters:

1. AGREEMENT CLASSIFICATION:
   - Agreement Category: ${foundation.category || "N/A"}
   - Agreement Type: ${foundation.type || "N/A"}
   - Standard Form: ${foundation.standardForm || "N/A"}
   - Compliance Frameworks: ${foundation.complianceFramework && foundation.complianceFramework.length > 0 ? foundation.complianceFramework.join(", ") : "None"}

2. TRANSACTION DESCRIPTION & OBJECTIVES:
   - Transaction Type: ${foundation.transactionType || "N/A"}
   - Subject Matter: ${foundation.subjectMatter || "N/A"}
   - Primary Commercial Objective: ${foundation.objective || "N/A"}
   - Project Description: ${foundation.description || "N/A"}

3. FINANCIAL VALUATION:
   - Base Valuation: ${foundation.currency || "USD"} ${Number(foundation.value?.toString().replace(/,/g, '') || 0).toLocaleString()}
   - Operating Area / Geographical Scope: ${foundation.geoScope || "N/A"} (${foundation.operatingArea || "N/A"})
   - Target Region: ${foundation.country || "Greece"} / ${foundation.continent || "Europe"}

These confirmed parameters define the fundamental commercial basis of this binding instrument.`;
          if (cl.content !== content) {
            didUpdateClauses = true;
            return { ...cl, content };
          }
        }
        if (cl.id === 'clause_jurisdiction') {
          const content = `This Agreement and its execution shall be strictly governed by the substantive laws of ${jurisdiction.law || "England & Wales"}. All legal actions must be brought within designated corporate seats.`;
          if (cl.content !== content) {
            didUpdateClauses = true;
            return { ...cl, content };
          }
        }
        if (cl.id === 'clause_arbitration') {
          const content = `Any claims or legal conflicts that cannot be settled amicably shall be referred to and finally resolved by binding maritime arbitration in ${jurisdiction.seat || "London, United Kingdom"} under the rules of ${jurisdiction.institution || "LMAA (London Maritime Arbitrators Association)"}. The governing language of all proceedings shall be ${jurisdiction.language || "English"}, operating under the ${jurisdiction.timeZone || "UTC"} time zone.`;
          if (cl.content !== content) {
            didUpdateClauses = true;
            return { ...cl, content };
          }
        }
        return cl;
      });
      if (didUpdateClauses) {
        setClauses(nextClauses);
      }
    }

    prevFoundationRef.current = foundation;
    prevJurisdictionRef.current = jurisdiction;
    prevPartyARef.current = partyA;
    prevPartyBRef.current = partyB;

    // 2. Sync from contractFields to clauses
    const prevFields = prevContractFieldsRef.current;
    let fieldsUpdatedClauses = false;
    let fieldsClauses = didUpdateClauses ? nextClauses : [...clauses];

    if (prevFields.commercialTerms !== contractFields.commercialTerms) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_commercial_terms' ? { ...cl, content: contractFields.commercialTerms, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.deliverables !== contractFields.deliverables) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_deliverables' ? { ...cl, content: contractFields.deliverables, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.warrantyScope !== contractFields.warrantyScope) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_warranty' ? { ...cl, content: contractFields.warrantyScope, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.liabilityLimit !== contractFields.liabilityLimit) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_liability' ? { ...cl, content: contractFields.liabilityLimit, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.arbitrationRules !== contractFields.arbitrationRules) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_arbitration' ? { ...cl, content: contractFields.arbitrationRules, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.paymentTerms !== contractFields.paymentTerms) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_payment_terms' ? { ...cl, content: contractFields.paymentTerms, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.deliveryLocation !== contractFields.deliveryLocation) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_delivery_terms' ? { ...cl, content: contractFields.deliveryLocation, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.confidentialityDuration !== contractFields.confidentialityDuration) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_confidentiality' ? { ...cl, content: contractFields.confidentialityDuration, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    if (prevFields.terminationNotice !== contractFields.terminationNotice) {
      fieldsClauses = fieldsClauses.map(cl => cl.id === 'clause_termination' ? { ...cl, content: contractFields.terminationNotice, status: 'v2 Seller Revision' as any } : cl);
      fieldsUpdatedClauses = true;
    }
    prevContractFieldsRef.current = contractFields;

    if (fieldsUpdatedClauses) {
      setClauses(fieldsClauses);
    }

    // 3. Sync from clauses to contractFields (using fieldsClauses to avoid stale-state circular loops)
    const prevClauses = prevClausesRef.current;
    const commercial = fieldsClauses.find(c => c.id === 'clause_commercial_terms')?.content;
    const prevCommercial = prevClauses.find(c => c.id === 'clause_commercial_terms')?.content;
    if (commercial !== undefined && commercial !== prevCommercial && commercial !== contractFields.commercialTerms) {
      setContractFields(f => ({ ...f, commercialTerms: commercial }));
    }

    const delivery = fieldsClauses.find(c => c.id === 'clause_deliverables')?.content;
    const prevDelivery = prevClauses.find(c => c.id === 'clause_deliverables')?.content;
    if (delivery !== undefined && delivery !== prevDelivery && delivery !== contractFields.deliverables) {
      setContractFields(f => ({ ...f, deliverables: delivery }));
    }

    const warranty = fieldsClauses.find(c => c.id === 'clause_warranty')?.content;
    const prevWarranty = prevClauses.find(c => c.id === 'clause_warranty')?.content;
    if (warranty !== undefined && warranty !== prevWarranty && warranty !== contractFields.warrantyScope) {
      setContractFields(f => ({ ...f, warrantyScope: warranty }));
    }

    const liability = fieldsClauses.find(c => c.id === 'clause_liability')?.content;
    const prevLiability = prevClauses.find(c => c.id === 'clause_liability')?.content;
    if (liability !== undefined && liability !== prevLiability && liability !== contractFields.liabilityLimit) {
      setContractFields(f => ({ ...f, liabilityLimit: liability }));
    }

    const disputes = fieldsClauses.find(c => c.id === 'clause_arbitration')?.content;
    const prevDisputes = prevClauses.find(c => c.id === 'clause_arbitration')?.content;
    if (disputes !== undefined && disputes !== prevDisputes && disputes !== contractFields.arbitrationRules) {
      setContractFields(f => ({ ...f, arbitrationRules: disputes }));
    }

    const payment = fieldsClauses.find(c => c.id === 'clause_payment_terms')?.content;
    const prevPayment = prevClauses.find(c => c.id === 'clause_payment_terms')?.content;
    if (payment !== undefined && payment !== prevPayment && payment !== contractFields.paymentTerms) {
      setContractFields(f => ({ ...f, paymentTerms: payment }));
    }

    const delLocation = fieldsClauses.find(c => c.id === 'clause_delivery_terms')?.content;
    const prevDelLocation = prevClauses.find(c => c.id === 'clause_delivery_terms')?.content;
    if (delLocation !== undefined && delLocation !== prevDelLocation && delLocation !== contractFields.deliveryLocation) {
      setContractFields(f => ({ ...f, deliveryLocation: delLocation }));
    }

    const confDuration = fieldsClauses.find(c => c.id === 'clause_confidentiality')?.content;
    const prevConfDuration = prevClauses.find(c => c.id === 'clause_confidentiality')?.content;
    if (confDuration !== undefined && confDuration !== prevConfDuration && confDuration !== contractFields.confidentialityDuration) {
      setContractFields(f => ({ ...f, confidentialityDuration: confDuration }));
    }

    const termNotice = fieldsClauses.find(c => c.id === 'clause_termination')?.content;
    const prevTermNotice = prevClauses.find(c => c.id === 'clause_termination')?.content;
    if (termNotice !== undefined && termNotice !== prevTermNotice && termNotice !== contractFields.terminationNotice) {
      setContractFields(f => ({ ...f, terminationNotice: termNotice }));
    }

    prevClausesRef.current = clauses;
  }, [contractFields, clauses, foundation, jurisdiction, partyA, partyB]);

  const [showDeployModal, setShowDeployModal] = useState(false);
  const [customInputModal, setCustomInputModal] = useState<{
    isOpen: boolean;
    fieldId: string;
    fieldTitle: string;
    value: string;
    callback?: (val: string) => void;
  } | null>(null);
  const [selectedAiValidation, setSelectedAiValidation] = useState<'none' | 'full'>('none');
  const [aiState, setAiState] = useState<{task: string | null, status: 'idle' | 'loading' | 'complete', result?: string}>({ task: null, status: 'idle' });
  const [isExecuted, setIsExecuted] = useState(false);
  const [partyASigned, setPartyASigned] = useState(false);
  const [partyBSigned, setPartyBSigned] = useState(false);
  const [additionalSigned, setAdditionalSigned] = useState<{[key: string]: boolean}>({});
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executionState, setExecutionState] = useState<'validating' | 'signing' | 'sending_emails' | 'completed'>('signing');
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
  const [creditsBalance, setCreditsBalance] = useState<number>(0);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('Professional');
  const [hasPaidAssistantFee, setHasPaidAssistantFee] = useState<boolean>(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState<boolean>(false);
  const [purchaseHistory, setPurchaseHistory] = useState<Array<any>>([]);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [isCreditsLoading, setIsCreditsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!company?.id) return;

    // Initial check
    CreditService.ensureBalance(company.id, auth.currentUser?.email || '').then(bal => {
      setCreditsBalance(bal.creditsRemaining);
      setIsCreditsLoading(false);
    });

    const unsubBalance = CreditService.subscribeToBalance(company.id, (bal) => {
      if (bal) {
        setCreditsBalance(bal.creditsRemaining);
        setCurrentPlan(bal.plan || 'Starter');
      }
    });

    const unsubLedger = CreditService.subscribeToLedger(company.id, (list) => {
      setPurchaseHistory(list);
    });

    return () => {
      unsubBalance();
      unsubLedger();
    };
  }, [company?.id]);
  const [enabledPdfSections, setEnabledPdfSections] = useState<string[]>([
    "Parties", "Commercial Foundation", "Deliverables", "Commercial Terms", 
    "Payment Terms", "Delivery Terms", "Warranty", "Liability", "Confidentiality", "Termination", "Jurisdiction", "Arbitration", "Signatures", "Annexes"
  ]);

  const [isPaymentMethodValid, setIsPaymentMethodValid] = useState<boolean>(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  
  // DYNAMIC PAGINATION ENGINE
  
  const splitContentIntoPages = (content: string, maxCharsPerPage: number = 2200): string[] => {
    if (!content) return [""];
    
    // Smart Pagination: we return the whole content for the section.
    // The actual splitting is handled by CSS `break-inside: avoid` and `page-break-after`
    // during print, and by a continuous layout in the preview.
    // BUT to satisfy the "container-based numbering system" in the UI:
    return [content]; // We will render sections dynamically.
  };



  const pdfStructure = useMemo(() => {
    const structure: { title: string, id: string, type: string, data?: any, clauseId?: string, baseSectionId?: string, pageIndex?: number, totalPages?: number, content?: string, isSplit?: boolean, sections?: any[] }[] = [
      { title: "Page 1 - General Registry & Corporate Parties", id: "Title", type: "title" },
      { title: "Page 2 - Commercial Scope, Logistics & Terms", id: "CommercialScopePage", type: "commercial_scope_page" }
    ];

    // Read directly from the Firestore schema in real-time if available
    const dbManuallyCompleted = firestoreContractData?.manuallyCompletedSections || manuallyCompletedSections || [];
    const dbStatus = firestoreContractData?.status || (isExecuted ? 'executed' : 'draft');
    const isDeployed = dbStatus === 'executed';
    const dbClauses = firestoreContractData?.clauses || clauses || [];
    const dbEnabledPdfSections = firestoreContractData?.enabledPdfSections || enabledPdfSections || [];

    // Core Sections Mapping
    const coreSections = [
      { id: "Parties", title: "Section 01 - Parties & Commercial Preamble", type: "section", clauseId: "clause_parties" },
      { id: "Commercial Foundation", title: "Section 02 - Commercial Foundation & Valuation", type: "section", clauseId: "clause_commercial_foundation" },
      { id: "Deliverables", title: "Section 03 - Deliverables & Technical Scope", type: "section", clauseId: "clause_deliverables" },
      { id: "Commercial Terms", title: "Section 04 - Commercial Pricing & Formula", type: "section", clauseId: "clause_commercial_terms" },
      { id: "Payment Terms", title: "Section 05 - Payment Terms & Invoicing", type: "section", clauseId: "clause_payment_terms" },
      { id: "Delivery Terms", title: "Section 06 - Logistics & Delivery (Incoterms)", type: "section", clauseId: "clause_delivery_terms" },
      { id: "Warranty", title: "Section 07 - Warranty & Structural Compliance", type: "section", clauseId: "clause_warranty" },
      { id: "Liability", title: "Section 08 - Limitation of Liabilities", type: "section", clauseId: "clause_liability" },
      { id: "Confidentiality", title: "Section 09 - Confidentiality & Non-Disclosure", type: "section", clauseId: "clause_confidentiality" },
      { id: "Termination", title: "Section 10 - Termination & Notice", type: "section", clauseId: "clause_termination" },
      { id: "Jurisdiction", title: "Section 11 - Governing Law & Venue", type: "section", clauseId: "clause_jurisdiction" },
      { id: "Arbitration", title: "Section 12 - Maritime Arbitration Tribunal", type: "section", clauseId: "clause_arbitration" },
    ];

    const activeSectionsList: any[] = [];
    coreSections.forEach(sec => {
      if (dbEnabledPdfSections.includes(sec.id)) {
        const linkedClause = dbClauses.find(cl => cl.id === sec.clauseId);
        const hasContent = linkedClause && linkedClause.content && linkedClause.content.trim().length > 0;
        const isConfirmed = dbManuallyCompleted.includes(sec.id);
        const isActive = activeSection === sec.id;
        
        // Show section if it has content
        if (hasContent) {
          activeSectionsList.push({
            ...sec,
            title: linkedClause.title || sec.title,
            content: linkedClause.content,
            isSplit: false
          });
        }
      }
    });

    // Scan clauses for any other custom/dynamic/approved clauses (e.g. clause_broker, custom segments)
    const hardcodedClauseIds = new Set(coreSections.map(s => s.clauseId));
    hardcodedClauseIds.add("clause_execution");
    hardcodedClauseIds.add("clause_annexes");

    const customSectionsList: any[] = [];
    dbClauses.forEach((cl) => {
      if (!hardcodedClauseIds.has(cl.id) && cl.content?.trim()) {
        customSectionsList.push({
          title: cl.title || "Custom Section",
          id: cl.id,
          baseSectionId: cl.id,
          content: cl.content,
          isSplit: false,
          type: "section",
          clauseId: cl.id,
          titleDisplay: cl.title || "Custom Section"
        });
      }
    });

    
    const totalContentSections = activeSectionsList.length + customSectionsList.length;

    if (totalContentSections > 0) {
      structure.push({ title: "Table of Contents", id: "TOC", type: "toc" });
    }

    // --- INTELLIGENT PAGINATION ENGINE ---
    const allSections = [...activeSectionsList, ...customSectionsList];
    let currentSectionsGroup = [];
    let currentHeightEstimate = 0;
    const MAX_PAGE_CAPACITY_PX = 950; // Printable area height (1131px total - margins - footer)

    const estimateSectionHeightPx = (sec: any) => {
      let height = 55; // Base height for title (h2) + margins + border
      const text = sec.content || "";
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.match(/^\|.*\|$/)) {
          height += 30; // Table row
        } else if (line.match(/^#+\s+/)) {
          height += 40; // Heading
        } else {
          // Normal text
          const charCount = line.length;
          const wrapLines = Math.max(1, Math.ceil(charCount / 95)); // Approx 95 chars per line in this layout
          height += wrapLines * 22; // 22px line height
        }
        height += 14; // Paragraph gap
      }

      // Add extra height for custom injected blocks
      if (sec.id === "Commercial Foundation") height += 180;
      else if (sec.id === "Parties") height += 280;

      return height;
    };

    allSections.forEach((sec) => {
      const secHeight = estimateSectionHeightPx(sec);
      const remainingSpace = MAX_PAGE_CAPACITY_PX - currentHeightEstimate;
      
      const linkedClause = dbClauses.find((cl: any) => cl.id === sec.clauseId);
      const forcePageBreak = linkedClause?.pageBreakBefore;
      
      if (forcePageBreak && currentSectionsGroup.length > 0) {
        structure.push({ 
          title: currentSectionsGroup[0]?.title || "Agreement Terms", 
          id: `DocBody_${structure.length}`, 
          type: "document_body", 
          sections: currentSectionsGroup 
        });
        currentSectionsGroup = [sec];
        currentHeightEstimate = secHeight;
      } else if (secHeight <= remainingSpace || currentSectionsGroup.length === 0) {
        currentSectionsGroup.push(sec);
        currentHeightEstimate += secHeight;
      } else {
        // Move to next page to prevent splitting/orphans
        structure.push({ 
          title: currentSectionsGroup[0]?.title || "Agreement Terms", 
          id: `DocBody_${structure.length}`, 
          type: "document_body", 
          sections: currentSectionsGroup 
        });
        currentSectionsGroup = [sec];
        currentHeightEstimate = secHeight;
      }
    });

    if (currentSectionsGroup.length > 0) {
      structure.push({ 
        title: currentSectionsGroup[0]?.title || "Agreement Terms", 
        id: `DocBody_${structure.length}`, 
        type: "document_body", 
        sections: currentSectionsGroup 
      });
    }
    // --- END INTELLIGENT PAGINATION ENGINE ---


    const hasApprovedClause = dbClauses.some((c: any) => c.approved === true || c.status === 'v4 Approved');
    if (dbEnabledPdfSections.includes("Signatures") || hasApprovedClause) {
      structure.push({ title: "Section 13 - Dispute Seat & Execution Signatures", id: "Signatures", type: "section", clauseId: "clause_execution" });
    }
    
    if (dbEnabledPdfSections.includes("Annexes")) {
      structure.push({ title: "Annex A - Core Registration and Identification", id: "Annexes", type: "section", clauseId: "clause_annexes" });
      
      if (identityDocs && identityDocs.length > 0) {
        const docsPerPage = 2; // 2 documents per page for perfect layout
        for (let i = 0; i < identityDocs.length; i += docsPerPage) {
          structure.push({ 
            title: `Annex B - Secure Attached Credentials (Part ${Math.floor(i/docsPerPage) + 1})`, 
            id: `identityDocs_${i}`, 
            type: "identityDocs", 
            data: identityDocs.slice(i, i + docsPerPage) 
          });
        }
      }
    }
    
    
    // verification page added here
    structure.push({ title: "Platform Verification Record", id: "VerificationRecord", type: "verification_record" });
    return structure;
  }, [
    enabledPdfSections, 
    clauses, 
    identityDocs, 
    foundation, 
    partyA, 
    partyB, 
    jurisdiction, 
    additionalParties, 
    activeSection, 
    contractFields,
    manuallyCompletedSections,
    firestoreContractData,
    isExecuted
  ]);

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

  // Smooth scroll the PDF preview sheet corresponding to activeSection into view
  const syncPdfToActiveSection = useCallback((highlight = false) => {
    if (!isScrollSyncEnabled || showPdfPreviewOverlay) {
      // Clear any remaining outlines if we are switching to preview or disabled
      document.querySelectorAll('[id^="pdf-section-"], [id^="pdf-page-"]').forEach(el => {
        (el as HTMLElement).style.outline = 'none';
      });
      return;
    }
    
    let targetPageId = activeSection;
    if (activeSection === "Commercial Foundation") targetPageId = "Commercial Foundation";
    else if (activeSection === "Parties" || activeSection === "Participants") targetPageId = "Parties";
    else if (activeSection === "Deliverables") targetPageId = "Deliverables";
    else if (activeSection === "Commercial Terms") targetPageId = "Commercial Terms";
    else if (activeSection === "Payment Terms") targetPageId = "Payment Terms";
    else if (activeSection === "Delivery Terms") targetPageId = "Delivery Terms";
    else if (activeSection === "Warranty") targetPageId = "Warranty";
    else if (activeSection === "Liability") targetPageId = "Liability";
    else if (activeSection === "Confidentiality") targetPageId = "Confidentiality";
    else if (activeSection === "Termination") targetPageId = "Termination";
    else if (activeSection === "Jurisdiction") targetPageId = "Jurisdiction";
    else if (activeSection === "Arbitration") targetPageId = "Arbitration";
    else if (activeSection === "Signatures") targetPageId = "Signatures";
    else if (activeSection === "Annexes" || activeSection === "Attachments") targetPageId = "Annexes";
    else if (activeSection === "Verification" || activeSection === "Audit Trail") targetPageId = "VerificationRecord";

    // First try finding the specific section, then fallback to page
    let element = document.getElementById(`pdf-section-${targetPageId}`);
    if (!element) {
      element = document.getElementById(`pdf-page-${targetPageId}`);
    }
    
    const container = document.getElementById('contract-pages-container');
    const workspace = workspaceScrollRef.current;
    
    if (element && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
      
      let additionalScroll = 0;
      if (!highlight && workspace && workspace.scrollHeight > workspace.clientHeight) {
        // If not highlighting (just syncing), maintain the proportional scroll from workspace
        const scrollPercentage = workspace.scrollTop / (workspace.scrollHeight - workspace.clientHeight);
        const elementScrollableHeight = Math.max(0, elementRect.height - containerRect.height);
        additionalScroll = elementScrollableHeight * scrollPercentage;
      }
      
      container.scrollTo({
        top: Math.max(0, relativeTop - 30 + additionalScroll),
        behavior: highlight ? 'smooth' : 'auto'
      });

      if (highlight) {
        // Add a temporary subtle glowing highlight animation to the focused sheet
        element.style.outline = '3px solid #00D4FF';
        element.style.outlineOffset = '2px';
        element.style.transition = 'outline 0.3s ease-out';
        
        setTimeout(() => {
          element.style.outline = 'none';
        }, 2200);
      }
    }
  }, [activeSection, isScrollSyncEnabled, showPdfPreviewOverlay]);

  // Highlight when activeSection changes (menu click)
  useEffect(() => {
    setTimeout(() => syncPdfToActiveSection(true), 100);
  }, [activeSection, syncPdfToActiveSection]);

  // Keep synced on content edits without re-highlighting
  useEffect(() => {
    const timer = setTimeout(() => syncPdfToActiveSection(false), 800);
    return () => clearTimeout(timer);
  }, [pdfStructure, syncPdfToActiveSection]);

  const handleWorkspaceScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    syncPdfToActiveSection(false);
  }, [syncPdfToActiveSection]);

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
          setIsPaymentMethodValid(data.isPaymentMethodValid !== false);
          setIsDriveConnected(!!data.driveRefreshToken);
        } else {
          // If company doc doesn't exist, create it with default starter values
          await setDoc(compRef, {
            id: company.id,
            name: company.name || "GLOBAL DYNAMICS LTD",
            isPaymentMethodValid: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setIsPaymentMethodValid(true);
        }
      } catch (err: any) {
        console.error("Error loading credit details from Firestore:", err);
        const isQuota = err && (
          err.message?.toLowerCase().includes('quota') ||
          err.message?.toLowerCase().includes('limit') ||
          err.message?.toLowerCase().includes('resource_exhausted') ||
          err.code === 'resource-exhausted'
        );
        if (isQuota) {
          console.warn("Quota limit detected during credit load. Activating offline fallback.");
          window.localStorage.setItem('firestore_quota_exceeded', 'true');
          (window as any).__markQuotaExceeded?.();
          setIsPaymentMethodValid(true);
        }
      } finally {
        setIsCreditsLoading(false);
      }
    };

    loadCreditsAndHistory();
  }, [company?.id]);

  const savePdfToFirestoreCache = async (contractId: string, base64data: string) => {
    try {
      const pdfCacheRef = doc(db, "contract_pdfs", contractId);
      const totalSize = base64data.length;
      const chunkSize = 800 * 1024; // 800 KB chunks (safe below 1MB document limit)
      
      if (totalSize < 1000000) {
        await setDoc(pdfCacheRef, {
          pdfData: base64data,
          isChunked: false,
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Cached PDF directly in Firestore for contract: ${contractId}`);
      } else {
        const totalChunks = Math.ceil(totalSize / chunkSize);
        
        await setDoc(pdfCacheRef, {
          isChunked: true,
          totalChunks: totalChunks,
          updatedAt: serverTimestamp()
        });
        
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, totalSize);
          const chunkStr = base64data.substring(start, end);
          
          const chunkRef = doc(db, `contract_pdfs/${contractId}/chunks`, `chunk_${i}`);
          await setDoc(chunkRef, {
            index: i,
            chunkData: chunkStr,
            updatedAt: serverTimestamp()
          });
        }
        console.log(`✅ Cached chunked PDF (${totalChunks} chunks) in Firestore for contract: ${contractId}`);
      }
    } catch (err) {
      console.warn("Failed to cache PDF in Firestore:", err);
    }
  };

  // Debounced silent background PDF caching to Firestore
  useEffect(() => {
    if (!activeContractId || workflowStep !== 'editor' || silentBackupContractId) return;

    const timer = setTimeout(() => {
      console.log("Idle detected. Generating silent contract PDF cache...");
      const element = document.getElementById('contract-pages-container');
      if (!element) return;
      
      // Apply print styling to the actual element directly
      element.classList.add('pdf-generating');

      const title = foundation.title || "Untitled Agreement";
      const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}_${activeContractId}.pdf`;
      const opt = {
        margin:       0,
        filename:     fileName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      html2pdf().from(element).set(opt).outputPdf('blob').then((blob: Blob) => {
        // Clean up print styling
        element.classList.remove('pdf-generating');

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          await savePdfToFirestoreCache(activeContractId, base64data);
        };
      }).catch((err: any) => {
        console.warn("Silent PDF generation failed:", err);
        element.classList.remove('pdf-generating');
      });
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timer);
  }, [
    activeContractId,
    workflowStep,
    foundation,
    jurisdiction,
    partyA,
    partyB,
    contractFields,
    clauses,
    revisions,
    additionalParties,
    partyASigned,
    partyBSigned,
    additionalSigned
  ]);

  // Fetch contracts list from Firestore in real-time
  useEffect(() => {
    if (!company?.id) {
      setLoadingContracts(false);
      return;
    }
    setLoadingContracts(true);

    const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
    if (quotaActive) {
      const fallbackList = mockContracts.map(c => ({
        ...c,
        id: c.id,
        title: c.title,
        type: c.agreementType,
        seller: c.seller,
        buyer: c.buyer,
        date: c.updatedAt ? c.updatedAt.split('T')[0] : (c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        status: c.status?.toLowerCase() === 'executed' ? 'executed' : 'draft',
        value: c.contractValue || "0"
      }));
      setDbContracts(fallbackList);
      setLoadingContracts(false);
      return;
    }

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
      const isQuota = error && (
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('limit') ||
        error.message?.toLowerCase().includes('resource_exhausted') ||
        error.code === 'resource-exhausted'
      );
      if (isQuota) {
        console.warn("Quota limit detected during contracts load. Activating offline fallback.");
        window.localStorage.setItem('firestore_quota_exceeded', 'true');
        (window as any).__markQuotaExceeded?.();
        const fallbackList = mockContracts.map(c => ({
          ...c,
          id: c.id,
          title: c.title,
          type: c.agreementType,
          seller: c.seller,
          buyer: c.buyer,
          date: c.updatedAt ? c.updatedAt.split('T')[0] : (c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          status: c.status?.toLowerCase() === 'executed' ? 'executed' : 'draft',
          value: c.contractValue || "0"
        }));
        setDbContracts(fallbackList);
      }
      setLoadingContracts(false);
    });

    return () => unsubscribe();
  }, [company?.id]);

  // Real-time Firestore active contract snapshot listener
  useEffect(() => {
    if (!activeContractId || workflowStep !== 'editor') {
      setFirestoreContractData(null);
      return;
    }
    const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
    if (quotaActive) {
      console.warn("Skipping contract_data snapshot listener due to active quota limit.");
      return;
    }
    const docRef = doc(db, "contract_data", activeContractId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setFirestoreContractData(snap.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `contract_data/${activeContractId}`);
    });
    return () => unsubscribe();
  }, [activeContractId, workflowStep]);

  
  // Refs for Heartbeat mechanism
  const aiStateRef = useRef(aiState);
  const activeSectionRef = useRef(activeSection);
  const pendingRevisionRef = useRef(pendingRevision);
  
  useEffect(() => {
    aiStateRef.current = aiState;
    activeSectionRef.current = activeSection;
    pendingRevisionRef.current = pendingRevision;
  }, [aiState, activeSection, pendingRevision]);

  // Heartbeat & Idle Timeout Mechanism
  useEffect(() => {
    if (workflowStep !== 'editor' || !activeContractId || !company?.id || silentBackupContractId) return;

    let idleTimer: NodeJS.Timeout;
    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    const handleActivity = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setWorkflowStep('hub');
        setActiveContractId(null);
        alert("Session expired due to 30 minutes of inactivity. You have been returned to the hub.");
      }, IDLE_TIMEOUT_MS);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    handleActivity();

    const heartbeatInterval = setInterval(async () => {
      try {
        const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
        if (quotaActive) return;

        await RegistryTransactionService.autoSaveDraft(activeContractId, {
          lastHeartbeat: new Date().toISOString(),
          aiStateSnapshot: aiStateRef.current,
          activeSectionSnapshot: activeSectionRef.current,
          pendingRevisionSnapshot: pendingRevisionRef.current
        });
        
        const contractDataRef = doc(db, "contract_data", activeContractId);
        await setDoc(contractDataRef, {
          lastHeartbeat: new Date().toISOString(),
          aiStateSnapshot: aiStateRef.current,
          activeSectionSnapshot: activeSectionRef.current,
          pendingRevisionSnapshot: pendingRevisionRef.current
        }, { merge: true });
        
      } catch (err) {
        console.warn("Heartbeat sync failed:", err);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearTimeout(idleTimer);
      clearInterval(heartbeatInterval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [workflowStep, activeContractId, company?.id]);

// Real-time interactive clauses approval snapshot listener
  useEffect(() => {
    if (!activeContractId || workflowStep !== 'editor') {
      setInteractiveClausesApproval(null);
      return;
    }
    const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
    if (quotaActive) {
      console.warn("Skipping interactive_clauses snapshot listener due to active quota limit.");
      return;
    }
    const docRef = doc(db, "interactive_clauses", activeContractId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setInteractiveClausesApproval(snap.data());
      } else {
        setInteractiveClausesApproval(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `interactive_clauses/${activeContractId}`);
    });
    return () => unsubscribe();
  }, [activeContractId, workflowStep]);

  // Real-time synchronization to contract_data in Firestore (300ms debounce for zero PDF lag)
  useEffect(() => {
    if (!activeContractId || !company?.id || workflowStep !== 'editor') return;

    const saveTimeout = setTimeout(async () => {
      try {
        const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
        if (quotaActive) return;

        const contractDataRef = doc(db, "contract_data", activeContractId);
        await setDoc(contractDataRef, {
          title: foundation.title,
          agreementType: foundation.type,
          seller: partyA.name,
          buyer: partyB.name,
          contractValue: foundation.value,
          currency: foundation.currency,
          applicableLaw: jurisdiction.law,
          jurisdictionSeat: jurisdiction.seat,
          status: isExecuted ? "executed" : "draft",
          version: currentVersion,
          updatedAt: new Date().toISOString(),
          foundation,
          jurisdiction,
          partyA,
          partyB,
          contractFields,
          participants,
          clauses,
          revisions,
          identityDocs,
          additionalParties,
          partyASigned,
          partyBSigned,
          additionalSigned,
          manuallyCompletedSections,
          enabledPdfSections,
          manuallyConfirmedFields
        }, { merge: true });
      } catch (err) {
        console.warn("Error auto-saving to contract_data:", err);
      }
    }, 2500);

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
    company?.id,
    revisions,
    identityDocs,
    additionalParties,
    partyASigned,
    partyBSigned,
    additionalSigned,
    manuallyCompletedSections,
    enabledPdfSections,
    manuallyConfirmedFields
  ]);

  // Standard Auto-save contract draft back to contracts collection (1.5s debounce)
  useEffect(() => {
    if (!activeContractId || !company?.id || workflowStep !== 'editor' || silentBackupContractId) return;

    setSaveStatus('saving');

    const saveTimeout = setTimeout(async () => {
      try {
        await RegistryTransactionService.autoSaveDraft(activeContractId, {
          title: foundation.title,
          agreementType: foundation.type,
          seller: partyA.name,
          buyer: partyB.name,
          contractValue: foundation.value,
          currency: foundation.currency,
          applicableLaw: jurisdiction.law,
          jurisdictionSeat: jurisdiction.seat,
          status: isExecuted ? "executed" : "draft",
          version: currentVersion,
          updatedAt: new Date().toISOString(),
          foundation,
          jurisdiction,
          partyA,
          partyB,
          contractFields,
          participants,
          clauses,
          revisions,
          identityDocs,
          additionalParties,
          partyASigned,
          partyBSigned,
          additionalSigned,
          manuallyCompletedSections
        });
        setSaveStatus('saved');
        console.log("Draft auto-saved successfully to Firestore.");
      } catch (err) {
        setSaveStatus('error');
        console.warn("Error auto-saving contract draft:", err);
      }
    }, 3000);

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
    company?.id,
    revisions,
    identityDocs,
    additionalParties,
    partyASigned,
    partyBSigned,
    additionalSigned,
    manuallyCompletedSections
  ]);

  const buyCredits = async (credits: number, packetName: string, price: string) => {
    if (!company?.id) return;
    try {
      await CreditService.topUp(company.id, auth.currentUser?.email || '', credits, packetName, price);

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

      setPurchaseSuccessMessage(`Hesabınıza başarıyla ${credits} Kredi tanımlandı ve fatura anında tanzim edildi! (${packetName})`);
      setTimeout(() => setPurchaseSuccessMessage(null), 5000);
    } catch (err: any) {
      console.warn("Error purchasing credits:", err);
      if (err?.message?.includes("Quota")) {
         alert("Firestore quota limit exceeded. Please try again later or upgrade the project's billing plan.");
      } else {
         alert("Credits purchase failed. Please try again.");
      }
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
    return 10; // Modified to consume 10 CR for all contracts
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
    return manuallyCompletedSections.includes(secName);
  };

  const handleAdvisorConsult = async (customQuery?: string) => {
    const query = customQuery || advisorInput;
    if (!query.trim()) return;

    // Credit Deduction
    const cost = AI_COSTS.ADVISOR_BASE;
    if (company?.id) {
      const hasCredits = await CreditService.checkBalance(company.id, cost);
      if (!hasCredits) {
        setShowBillingWallModal(true);
        return;
      }
    }

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

      // Deduct Credits in Firestore
      await CreditService.deductCredits(
        company.id, 
        auth.currentUser?.email || '',
        'Contract AI Advisor', 
        `Consultation regarding: ${query.substring(0, 30)}...`,
        cost
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
  const [showWalletCenterModal, setShowWalletCenterModal] = useState(false);
  const [deploymentLinks, setDeploymentLinks] = useState<any[]>([]);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [currentContractId, setCurrentContractId] = useState<string | null>(null);
  const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(null);
  const [recipientStatuses, setRecipientStatuses] = useState<any[]>([]);

  useEffect(() => {
    if (!showDeploymentModal || !currentContractId || !currentDeploymentId) {
      return;
    }

    const recipientsRef = collection(db, `contracts/${currentContractId}/deployments/${currentDeploymentId}/recipients`);
    
    const unsubscribe = onSnapshot(recipientsRef, (snapshot) => {
      const recs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipientStatuses(recs);
    }, (err) => {
      console.error("Error listening to recipient statuses:", err);
    });

    return () => unsubscribe();
  }, [showDeploymentModal, currentContractId, currentDeploymentId]);

   const handleExecute = async (validationCost: number = 0) => {
    if (!isPaymentMethodValid) {
      console.error("Hata: Firmanın ödeme yöntemi geçerli değil veya yetkilendirilmemiş!");
      return;
    }

    const cost = validationCost;
    if (company?.id) {
      const hasCredits = await CreditService.checkBalance(company.id, cost);
      if (!hasCredits) {
        setShowBillingWallModal(true);
        return;
      }
    }

    setSaveStatus('saving');

    const result = await RegistryTransactionService.executeDeployment({
      companyId: company?.id,
      activeContractId,
      cost,
      foundation,
      jurisdiction,
      partyA,
      partyB,
      contractFields,
      participants,
      clauses,
      revisions,
      identityDocs,
      additionalParties,
      fullySignedAdditional: additionalParties.reduce((acc, p, idx) => ({ ...acc, [p.id || idx]: true }), {}),
      userId: auth.currentUser?.uid || 'anonymous',
      userEmail: auth.currentUser?.email || ''
    });

    if (!result.success) {
      if (result.error === 'Insufficient credits.') {
        setShowBillingWallModal(true);
      } else {
        console.warn("Deployment failed:", result.error);
        alert("Deployment failed: " + result.error);
      }
      setSaveStatus('saved');
      return;
    }

    // Success -> Update local UI State
    if (cost > 0) {
      setCreditsBalance(prev => prev - cost);
    }
    
    setDocumentHash(result.hash);
    
    // Do not set isExecuted yet, wait for recipients to accept
    // setIsExecuted(true); 

    setCurrentContractId(result.contractId || null);
    setCurrentDeploymentId(result.deploymentId || null);

    const tokens = (globalThis as any).__deploymentTokens || [];
    setDeploymentLinks(tokens);
    setShowDeploymentModal(true);
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);

    // Refresh UI
    const handleRefresh = () => {};
    handleRefresh();
  };;

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

  
  
  const syncContractPdfToDrive = async (showSuccessAlert = true) => {
    const element = document.getElementById('contract-pages-container');
    if (!element) return;

    setIsSyncingDrive(true);
    element.classList.add('pdf-generating');
    
    const title = foundation.title || "Untitled Agreement";
    const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}_${activeContractId}.pdf`;

    const opt = {
      margin:       0,
      filename:     fileName,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    try {
      const blob = await html2pdf().from(element).set(opt).outputPdf('blob');

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise<void>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(',')[1];
            
            // Save cache to Firestore
            if (activeContractId) {
              await savePdfToFirestoreCache(activeContractId, base64data);
            }

            const targetCompanyId = company?.id || auth.currentUser?.uid;
            if (!targetCompanyId) {
              throw new Error("Missing companyId/userId context.");
            }

            // Call backend upload endpoint
            const response = await fetch("/api/backup/upload-pdf", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                companyId: targetCompanyId,
                fileName: fileName,
                fileData: base64data
              })
            });

            if (response.ok) {
              console.log(`✅ Pixel-perfect contract PDF successfully synced to Google Drive: ${fileName}`);
              if (showSuccessAlert) {
                alert(`Pixel-perfect contract PDF successfully synced to Google Drive: ${fileName}`);
              }
              resolve();
            } else {
              const errData = await response.json();
              throw new Error(errData.error || "Upload failed");
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
      });
    } catch (err: any) {
      console.error("Failed to generate and sync PDF to Google Drive:", err);
      alert("Failed to sync PDF to Google Drive: " + err.message);
    } finally {
      element.classList.remove('pdf-generating');
      setIsSyncingDrive(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('contract-pages-container');
    if (!element) return;

    // To ensure high quality, we clone the node or temporarily remove the scale transform
    // html2pdf handles it if we pass the right options
    
    // We only want to capture the actual pages, let's wrap them in a container if needed,
    // but the container itself is fine.
    
    // Set a class to indicate printing mode for any CSS tweaks
    element.classList.add('pdf-generating');
    
    const title = foundation.title || "Untitled Agreement";
    const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}_${activeContractId || 'Draft'}.pdf`;

    const opt = {
      margin:       0,
      filename:     fileName,
      image:        { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf().from(element).set(opt).save();

      // Auto background sync to Google Drive on download
      if (isDriveConnected) {
        setTimeout(() => {
          syncContractPdfToDrive(false).catch(err => console.warn("Background Drive sync failed:", err));
        }, 1000);
      }
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      element.classList.remove('pdf-generating');
    }
  };

  const handleExportDocx = async () => {
    // Basic DOCX generation from pdfStructure
    try {
      const docChildren = [];
      
      pdfStructure.forEach(page => {
        if (page.type === 'title') {
           docChildren.push(new Paragraph({ text: "AGREEMENT", heading: HeadingLevel.HEADING_1 }));
           docChildren.push(new Paragraph({ text: "\n" }));
        } else if (page.type === 'document_body' || page.type === 'section') {
           if (page.sections) {
             page.sections.forEach(sec => {
               docChildren.push(new Paragraph({ text: sec.title || "", heading: HeadingLevel.HEADING_2 }));
               if (sec.content) {
                 const lines = sec.content.split('\n');
                 lines.forEach(line => {
                    if (line.trim()) {
                      docChildren.push(new Paragraph({ children: [new TextRun(line.replace(/#/g, '').trim())] }));
                    }
                 });
               }
               docChildren.push(new Paragraph({ text: "\n" }));
             });
           } else {
             docChildren.push(new Paragraph({ text: page.title || "", heading: HeadingLevel.HEADING_2 }));
             if (page.content) {
               const lines = page.content.split('\n');
               lines.forEach(line => {
                  if (line.trim()) {
                    docChildren.push(new Paragraph({ children: [new TextRun(line.replace(/#/g, '').trim())] }));
                  }
               });
             }
             docChildren.push(new Paragraph({ text: "\n" }));
           }
        }
      });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Contract_${activeContractId || 'Draft'}.docx`);
    } catch (err) {
      console.error("DOCX generation failed", err);
    }
  };



  const handleFieldAssistantGenerate = async (prompt: string, fieldLabel: string) => {
    const cost = AI_COSTS.ASSISTANT;
    if (company?.id) {
      const hasCredits = await CreditService.checkBalance(company.id, cost);
      if (!hasCredits) {
        setShowBillingWallModal(true);
        return null;
      }
    }
    
    try {
      const response = await chatWithContractAdvisor(
        `Please act as a legal contract assistant. I need to fill the "${fieldLabel}" field for a "${foundation.type}" agreement. The user requests: "${prompt}". Provide ONLY the exact text to be inserted into the contract field. Do not include markdown formatting, explanations, or quotes. The text should be professional, legally sound, and directly usable.`,
        [],
        "Field Generation",
        {
          foundation,
          jurisdiction,
          partyA,
          partyB,
          contractFields,
          participants: participants || []
        }
      );
      
      const deduction = await CreditService.deductCredits(
        company.id,
        auth.currentUser?.email || '',
        'Contract Assistant',
        `Generated content for field: ${fieldLabel}`,
        cost
      );

      if (!deduction.success) {
        setShowBillingWallModal(true);
        return null;
      }

      return response;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const runAdvisor = async (task: string) => {
    // Plan Restrictions
    const professionalTasks = ["Risk Detection", "Compliance Review", "Sanctions Screening", "Redline Analysis"];
    if (professionalTasks.includes(task) && currentPlan === 'Starter') {
      alert("This advanced feature requires a Professional or Enterprise plan.");
      // In a real app we'd show a specialized upgrade modal
      return;
    }

    const cost = ADVISOR_COSTS[task] || AI_COSTS.ADVISOR_BASE;
    if (company?.id) {
      const hasCredits = await CreditService.checkBalance(company.id, cost);
      if (!hasCredits) {
        setShowBillingWallModal(true);
        return;
      }
    }

    setAiState({ task, status: 'loading' });
    try {
      const promptMap: { [key: string]: string } = {
        "Clause Review": "Please analyze all sections in the contract and conduct a clause-by-clause legal review.",
        "Risk Detection": "Detect contradictions, loopholes, and high-level risks in the existing draft.",
        "Executive Summary": "Provide a high-level executive summary of this contract's main purpose, key obligations, and financial terms.",
        "Missing Clause Detection": "Identify critical missing clauses that should be included based on this type of agreement and industry standards.",
        "Jurisdiction Analysis": "Analyze the contract's choice of jurisdiction and governing law, highlighting any potential enforcement or dispute resolution issues.",
        "Liability Analysis": "Conduct an in-depth analysis of the liability limits, indemnities, warranties, and consequential damage exclusions.",
        "Compliance Review": "Examine the contract's compliance with stated regulatory frameworks (such as GDPR, ISO, maritime laws, etc.).",
        "Sanctions Screening": "Provide an analysis of the parties and operational scope against standard international sanctions lists (OFAC, EU, UN).",
        "Redline Analysis": "Identify potential revision sections (redlines) in the agreement, listing sentences that require revision with their original and recommended versions.",
        "Contract Summary": "Provide a comprehensive operational and commercial summary of the agreement."
      };

      const ADVISOR_SYSTEM_PROMPT = `
# CONTRACT AI ADVISOR — Module Instructions

## General Rules (Apply to Every Module)

### DO

* Analyze only the currently selected contract.
* Read the entire contract before generating any output.
* Base every finding exclusively on the contract contents.
* Cross-reference related sections before reporting findings.
* Reference relevant sections whenever possible.
* Clearly distinguish facts from observations.
* State "Information not found within the analyzed contract" when information is missing.
* Maintain a neutral and objective tone.
* Produce concise, structured and copy-friendly output.
* Ensure every statement is traceable to the analyzed document.

### DO NOT

* Do not provide legal advice.
* Do not provide legal opinions.
* Do not predict court outcomes.
* Do not determine enforceability.
* Do not determine legality.
* Do not invent clauses, parties, dates or obligations.
* Do not infer missing information.
* Do not speculate.
* Do not exaggerate risk.
* Do not rewrite contractual language unless explicitly requested.
* Do not use information outside the analyzed contract unless the selected analysis specifically requires comparison against an identified framework.

---

# Clause Review

### DO

* Review every clause individually.
* Evaluate clarity, consistency and completeness.
* Identify duplicate or conflicting provisions.
* Highlight ambiguous wording.
* Report observations with section references.

### DO NOT

* Do not rewrite clauses.
* Do not recommend legal language.
* Do not judge enforceability.
* Do not interpret commercial intentions.

---

# Risk Detection

### DO

* Identify operational, commercial and contractual risks.
* Explain why a potential risk was identified.
* Assign a severity level.
* Reference supporting sections.

### DO NOT

* Do not classify risks as legal violations.
* Do not predict litigation.
* Do not assume future events.
* Do not overstate findings.

---

# Executive Summary

### DO

* Summarize the contract objectively.
* Highlight the principal commercial elements.
* Describe the overall contractual structure.
* Keep the summary concise.

### DO NOT

* Do not introduce new information.
* Do not interpret legal consequences.
* Do not provide recommendations.
* Do not omit material contractual elements.

---

# Missing Clause Detection

### DO

* Identify commonly expected clauses that are not found.
* Clearly state that the clause was not identified.
* Explain why the clause may be relevant.

### DO NOT

* Do not state that the contract is defective.
* Do not assume the clause should exist.
* Do not recommend mandatory wording.

---

# Jurisdiction Analysis

### DO

* Review governing law.
* Review dispute resolution provisions.
* Review arbitration information.
* Identify inconsistencies between selected provisions.

### DO NOT

* Do not determine legal validity.
* Do not conclude jurisdiction is invalid.
* Do not predict judicial outcomes.

---

# Liability Analysis

### DO

* Review liability allocation.
* Review limitation of liability.
* Review indemnity provisions.
* Review warranty allocation.

### DO NOT

* Do not determine fairness.
* Do not calculate damages.
* Do not determine enforceability.

---

# Compliance Review

### DO

* Compare the contract against the selected compliance framework only.
* Report missing references.
* Identify observable inconsistencies.

### DO NOT

* Do not certify compliance.
* Do not state regulatory violations.
* Do not claim legal non-compliance.

---

# Sanctions Screening

### DO

* Review references to sanctioned jurisdictions, entities or contractual restrictions contained in the contract.
* Highlight areas that may require additional review.

### DO NOT

* Do not perform external sanctions verification.
* Do not identify parties as sanctioned unless such information is explicitly contained in the analyzed contract or supplied by an integrated sanctions database.
* Do not accuse parties of violations.

---

# Redline Analysis

### DO

* Compare document versions.
* Identify added, removed and modified text.
* Present changes clearly.

### DO NOT

* Do not evaluate whether changes are beneficial.
* Do not recommend acceptance or rejection.
* Do not interpret negotiation strategy.

---

# Contract Summary

### DO

* Produce a structured summary.
* Include parties, scope, duration, payment, obligations, governing law and termination.
* Preserve factual accuracy.

### DO NOT

* Do not simplify away important obligations.
* Do not omit critical commercial terms.
* Do not introduce assumptions.
`;

      const query = (promptMap[task] || `Please perform the operation "${task}" in detail on this agreement.`) + "\n\n" + ADVISOR_SYSTEM_PROMPT;

      
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

      await CreditService.deductCredits(
        company.id,
        auth.currentUser?.email || '',
        'Contract AI Advisor',
        `Ran analysis: ${task}`,
        cost
      );
    } catch (err) {
      console.error(err);
      setAiState({ task, status: 'complete', result: "A connection error occurred. Please check your Gemini API configuration and try again." });
    }
  };

  const handleAgreementCategoryChange = (category: string) => {
    const list = (groupedAgreementTypes as any)[category] || [];
    const firstType = list[0] || `${category} Agreement`;
    setFoundation(prev => ({
      ...prev,
      category,
      type: firstType,
      title: `${firstType} - ${prev.operatingArea || 'Global Operations'}`
    }));
    const fields = getFieldsForAgreementType(firstType);
    setContractFields(prev => ({
      ...prev,
      ...fields
    }));
  };

  const handleAgreementTypeChange = (type: string) => {
    setFoundation(prev => ({
      ...prev,
      type,
      title: `${type} - ${prev.operatingArea || 'Global Operations'}`
    }));
    const fields = getFieldsForAgreementType(type);
    setContractFields(prev => ({
      ...prev,
      ...fields
    }));
  };

  const inputClass = "w-full h-10 bg-[#2D354B] border border-white/10 rounded-lg p-3 text-[13px] text-white placeholder-slate-400 focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 outline-none transition-all shadow-inner font-inter";
  const selectClass = "w-full h-10 bg-[#242B3B] border border-white/5 rounded-lg p-2 text-[13px] text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none font-inter";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-manrope";
  const sectionTitleClass = "text-[16px] font-bold text-white uppercase tracking-wide mb-6 border-b border-white/5 pb-3 font-manrope";
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleNewContract = async () => {
    if (!company?.id) return;

    // Reset and clear local workspace session before initialization
    setActiveContractId(null);
    if (typeof setFirestoreContractData === 'function') {
      setFirestoreContractData(null);
    }
    if (typeof setInteractiveClausesApproval === 'function') {
      setInteractiveClausesApproval(null);
    }
    setIdentityDocs([]);
    setAdditionalParties([]);
    setEnabledPdfSections([
      "Parties", "Commercial Foundation", "Deliverables", "Commercial Terms", 
      "Payment Terms", "Delivery Terms", "Warranty", "Liability", "Confidentiality", "Termination", "Jurisdiction", "Arbitration", "Signatures", "Annexes"
    ]);
    setActiveSection("Commercial Foundation");
    window.history.pushState(null, '', window.location.pathname);

    // Explicitly set clean blank/default states instead of any previous contract data
    const cleanFoundation = {
      category: "",
      type: "Custom Agreement",
      title: "Untitled Contract",
      transactionType: "",
      subjectMatter: "",
      objective: "",
      description: "",
      value: "",
      currency: "USD",
      geoScope: "",
      continent: "",
      country: "",
      operatingArea: "",
      serviceLocation: "",
      duration: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: "",
      renewalTerms: "",
      noticePeriod: "",
      standardForm: "Custom Contract",
      complianceFramework: []
    };

    const cleanJurisdiction = { 
      law: "", 
      seat: "", 
      institution: "", 
      language: "", 
      timeZone: "" 
    };

    const cleanPartyA = { 
      name: company?.name || "", 
      role: "Party A", 
      email: company?.email || "", 
      address: "", 
      idNumber: "", 
      confirmEmail: false, 
      additionalEmails: [] 
    };

    const cleanPartyB = { 
      name: "", 
      role: "Buyer", 
      email: "", 
      address: "", 
      idNumber: "", 
      confirmEmail: false, 
      additionalEmails: [] 
    };

    const cleanContractFields = {
      deliverables: "",
      milestones: "",
      commercialTerms: "",
      surcharges: "",
      paymentTerms: "",
      paymentMethod: "",
      partyABankDetails: "",
      partyBBankDetails: "",
      incoterms: "",
      deliveryLocation: "",
      warrantyPeriod: "",
      warrantyScope: "",
      liabilityLimit: "",
      consequentialDamages: "",
      confidentialityDuration: "",
      terminationNotice: "",
      arbitrationRules: "",
      annexes: "",
      signatureMethod: "Electronic Signature",
      verificationCode: `VERIFY-${Math.floor(1000 + Math.random() * 9000)}`,
      auditTrail: `1. Record Initialized: ${new Date().toISOString().replace('T', ' ').substring(0, 16)} UTC`
    };

    const cleanClauses = generateInitialClauses({
      agreementType: cleanFoundation.type,
      seller: cleanPartyA.name,
      buyer: cleanPartyB.name,
      contractValue: cleanFoundation.value,
      currency: cleanFoundation.currency,
      jurisdiction: cleanJurisdiction.law,
      arbitrationSeat: cleanJurisdiction.seat,
      deliveryPort: cleanContractFields.deliveryLocation,
      broker: "XYZ Brokerage"
    });

    setFoundation(cleanFoundation);
    setJurisdiction(cleanJurisdiction);
    setPartyA(cleanPartyA);
    setPartyB(cleanPartyB);
    setContractFields(cleanContractFields);
    setParticipants([]);
    setClauses(cleanClauses);
    setManuallyCompletedSections([]);
    setRevisions([]);
    setManuallyConfirmedFields({});
    setIsExecuted(false);
    setPartyASigned(false);
    setPartyBSigned(false);
    setAdditionalSigned({});

    try {
      const newDocRef = doc(collection(db, "contracts"));
      const contractData = {
        userId: company.id,
        title: cleanFoundation.title,
        agreementType: cleanFoundation.type,
        seller: cleanPartyA.name,
        buyer: cleanPartyB.name,
        contractValue: cleanFoundation.value,
        currency: cleanFoundation.currency,
        status: "draft",
        version: "v1 Generated",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        foundation: cleanFoundation,
        jurisdiction: cleanJurisdiction,
        partyA: cleanPartyA,
        partyB: cleanPartyB,
        contractFields: cleanContractFields,
        participants: [],
        clauses: cleanClauses,
        revisions: [],
        manuallyCompletedSections: []
      };

      await setDoc(newDocRef, contractData);

      // Create matching entry in contract_data collection for unified schema
      const contractDataDocRef = doc(db, "contract_data", newDocRef.id);
      await setDoc(contractDataDocRef, {
        ...contractData,
        enabledPdfSections: [
          "Parties", "Commercial Foundation", "Deliverables", "Commercial Terms", 
          "Payment Terms", "Delivery Terms", "Warranty", "Liability", "Confidentiality", "Termination", "Jurisdiction", "Arbitration", "Signatures", "Annexes"
        ]
      });

      try {
        await logAuditEvent(company.id, `Contract Draft Created: ${cleanFoundation.title}`, cleanFoundation.title);
      } catch (logErr) {
        console.error("New contract draft log failed:", logErr);
      }

      setActiveContractId(newDocRef.id);
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
    
    const defaultFoundation = {
      category: "",
      type: "Custom Agreement",
      title: "Untitled Contract",
      transactionType: "",
      subjectMatter: "",
      objective: "",
      description: "",
      value: "",
      currency: "USD",
      geoScope: "",
      continent: "",
      country: "",
      operatingArea: "",
      serviceLocation: "",
      duration: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: "",
      renewalTerms: "",
      noticePeriod: "",
      standardForm: "Custom Contract",
      complianceFramework: []
    };

    if (contract.foundation) {
      setFoundation({ ...defaultFoundation, ...contract.foundation });
    } else {
      setFoundation({
        ...defaultFoundation,
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

    const defaultJurisdiction = {
      law: "England & Wales",
      seat: "London",
      institution: "LMAA (London Maritime Arbitrators Association)",
      language: "English",
      timeZone: "UTC"
    };

    if (contract.jurisdiction) {
      setJurisdiction({ ...defaultJurisdiction, ...contract.jurisdiction });
    } else {
      setJurisdiction({
        ...defaultJurisdiction,
        law: contract.applicableLaw || "England & Wales",
        seat: contract.arbitrationSeat || "London",
        institution: contract.arbitrationInstitution || "LMAA"
      });
    }

    const defaultPartyA = {
      name: company?.name || "GLOBAL DYNAMICS LTD",
      role: "Seller",
      email: company?.email || "owner@global-dynamics.com",
      address: "",
      idNumber: "",
      confirmEmail: false,
      additionalEmails: []
    };

    if (contract.partyA) {
      setPartyA({ ...defaultPartyA, ...contract.partyA });
    } else {
      setPartyA({
        ...defaultPartyA,
        name: contract.seller || company?.name || "GLOBAL DYNAMICS LTD",
      });
    }

    const defaultPartyB = {
      name: "ARGENTO MARINE",
      role: "Buyer",
      email: "legal@argentomarine.com",
      address: "",
      idNumber: "",
      confirmEmail: false,
      additionalEmails: []
    };

    if (contract.partyB) {
      setPartyB({ ...defaultPartyB, ...contract.partyB });
    } else {
      setPartyB({
        ...defaultPartyB,
        name: contract.buyer || "ARGENTO MARINE",
      });
    }

    const defaultContractFields = {
      deliverables: "",
      milestones: "",
      commercialTerms: "",
      surcharges: "",
      paymentTerms: "",
      paymentMethod: "",
      partyABankDetails: "",
      partyBBankDetails: "",
      incoterms: "",
      deliveryLocation: "",
      warrantyPeriod: "",
      warrantyScope: "",
      liabilityLimit: "",
      consequentialDamages: "",
      confidentialityDuration: "",
      terminationNotice: "",
      arbitrationRules: "",
      annexes: "",
      verificationCode: `VERIFY-${Math.floor(1000 + Math.random() * 9000)}`,
      auditTrail: `1. Record Initialized: ${new Date().toISOString().replace('T', ' ').substring(0, 16)} UTC
2. AI Risk Screened: Pending
3. Compliance Certificate pending`
    };

    if (contract.contractFields) {
      setContractFields({ ...defaultContractFields, ...contract.contractFields });
    } else {
      setContractFields(defaultContractFields);
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

    if (contract.revisions) {
      setRevisions(contract.revisions);
    } else {
      setRevisions([]);
    }

    if (contract.identityDocs) {
      setIdentityDocs(contract.identityDocs);
    } else {
      setIdentityDocs([]);
    }

    if (contract.manuallyCompletedSections) {
      setManuallyCompletedSections(contract.manuallyCompletedSections);
    } else {
      setManuallyCompletedSections([]);
    }

    setIsExecuted(contract.status === 'executed');
    setPartyASigned(contract.partyASigned || contract.status === 'executed');
    setPartyBSigned(contract.partyBSigned || contract.status === 'executed');
    setAdditionalSigned(contract.additionalSigned || (contract.status === 'executed' ? (contract.additionalParties || []).reduce((acc: any, p: any, idx: number) => ({ ...acc, [p.id || idx]: true }), {}) : {}));
    setCurrentVersion(contract.version || 'v1 Generated');
    setWorkflowStep('editor');
  };

  // Load contract from URL query parameters (?id=...) if present
  useEffect(() => {
    if (silentBackupContractId) return;
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
              window.history.pushState(null, '', window.location.pathname);
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

  const loadingBackupContractIdRef = useRef<string | null>(null);

  // Load contract for silent backup in background if requested
  useEffect(() => {
    if (silentBackupContractId && silentBackupContractId !== activeContractId && company?.id) {
      if (loadingBackupContractIdRef.current === silentBackupContractId) return;
      loadingBackupContractIdRef.current = silentBackupContractId;

      const loadFromDb = async () => {
        try {
          const docRef = doc(db, 'contracts', silentBackupContractId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            loadContractIntoEditor({ id: docSnap.id, ...data });
            setWorkflowStep('editor');
            setShowPdfPreviewOverlay(true);
            setPreviewShowCropMarks(true);
            setPreviewIncludeSeal(true);
            setPreviewPrintMode(false);
          } else {
            console.error("Contract draft not found for silent backup in Firestore registry.");
            onSilentBackupComplete?.(false);
          }
        } catch (err) {
          console.error("Failed to load silent backup contract:", err);
          onSilentBackupComplete?.(false);
        } finally {
          loadingBackupContractIdRef.current = null;
        }
      };
      loadFromDb();
    }
  }, [silentBackupContractId, activeContractId, company?.id]);

  // Generate and cache/upload PDF silently in background for silent backup mode
  useEffect(() => {
    if (!silentBackupContractId || !activeContractId || silentBackupContractId !== activeContractId) return;
    if (workflowStep !== 'editor') return;

    const timer = setTimeout(async () => {
      console.log(`[Silent Backup] Compiling PDF for contract: ${activeContractId}`);
      const element = document.getElementById('contract-pages-container');
      if (!element) {
        console.error("Pages container not found for silent backup.");
        onSilentBackupComplete?.(false);
        return;
      }

      element.classList.add('pdf-generating');

      const title = foundation.title || "Untitled Agreement";
      const fileName = `${title.replace(/[/\\?%*:|"<>]/g, "-")}_${activeContractId}.pdf`;
      const opt = {
        margin:       0,
        filename:     fileName,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'px', format: [794, 1123] as [number, number], orientation: 'portrait' as 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      try {
        const blob = await html2pdf().from(element).set(opt).outputPdf('blob');
        element.classList.remove('pdf-generating');

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(',')[1];
            await savePdfToFirestoreCache(activeContractId, base64data);

            const targetCompanyId = company?.id || auth.currentUser?.uid;
            if (targetCompanyId) {
              const response = await fetch("/api/backup/upload-pdf", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  companyId: targetCompanyId,
                  fileName: fileName,
                  fileData: base64data
                })
              });
              if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Upload failed");
              }
            }

            console.log(`[Silent Backup] PDF cached and uploaded for: ${activeContractId}`);
            onSilentBackupComplete?.(true);
          } catch (uploadErr: any) {
            console.error("Failed to upload/cache silent backup PDF:", uploadErr);
            onSilentBackupComplete?.(false);
          }
        };
        reader.onerror = () => {
          onSilentBackupComplete?.(false);
        };
      } catch (err) {
        console.error("Silent PDF generation failed:", err);
        element.classList.remove('pdf-generating');
        onSilentBackupComplete?.(false);
      }
    }, 2000); // 2 seconds delay to allow full rendering

    return () => clearTimeout(timer);
  }, [activeContractId, silentBackupContractId, workflowStep, foundation, clauses, additionalParties, partyASigned, partyBSigned, additionalSigned]);

  // Synchronize browser URL query parameters with active editor state
  useEffect(() => {
    if (silentBackupContractId) return;
    if (workflowStep === 'hub') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('id')) {
        window.history.pushState(null, '', window.location.pathname);
      }
      setActiveContractId(null);
    } else if (workflowStep === 'editor' && activeContractId) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('id') !== activeContractId) {
        window.history.pushState(null, '', `${window.location.pathname}?id=${activeContractId}`);
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
            <div className="flex items-center gap-4">
              <div 
                onClick={() => setShowWalletCenterModal(true)}
                className="bg-[#141924] border border-white/5 px-4 py-2 rounded-md shadow-sm flex flex-col items-end cursor-pointer hover:border-[#00D4FF]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentPlan} Tier Active</span>
                    <span className="text-[13px] text-emerald-400 font-bold">{creditsBalance} Credits</span>
                  </div>
                  <div className="w-8 h-8 rounded bg-[#00D4FF]/10 flex items-center justify-center border border-[#00D4FF]/20">
                    <ShieldCheck size={16} className="text-[#00D4FF]" />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleNewContract}
                className="bg-[#00D4FF] hover:bg-[#33DDFF] text-[#040B18] flex items-center justify-center gap-2 px-6 py-2.5 rounded shadow-sm transition-all cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.5} /> <span className="text-[13px] font-semibold uppercase tracking-wider">New Contract</span>
              </button>
            </div>
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
    <div className="contract-studio-wrapper flex flex-col h-full w-full bg-system-bg text-system-text-primary font-manrope overflow-hidden print:overflow-visible print:h-auto">
      


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
          {/* --- UNIFIED CONTRACT STUDIO DASHBOARD HEADER --- */}
          <div className="h-16 shrink-0 bg-[#0a1c34]/40 border-b border-[#2B3347] px-4 md:px-6 flex items-center justify-between z-10 shadow-sm backdrop-blur-md">
            
            {/* Left: Navigation & Branding */}
            <div className="flex items-center gap-4 shrink-0">
              <button onClick={() => {
                if (onBack) onBack(); 
                else setWorkflowStep('hub');
              }} className="text-[#00D4FF] hover:text-white transition-all group relative bg-[#00D4FF]/10 p-2 rounded-lg cursor-pointer">
                <ArrowLeft size={16} />
              </button>
              <div className="hidden md:flex items-center gap-3">
                 <div className="w-8 h-8 bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center rounded-lg shadow-[0_0_10px_rgba(0,212,255,0.1)]">
                    <FileSignature size={14} className="text-[#00D4FF]" />
                 </div>
                 <div>
                   <div className="text-[12px] font-extrabold uppercase tracking-wider text-white leading-none">CONTRACT STUDIO V4</div>
                   <div className="text-[9px] text-[#00D4FF]/70 uppercase tracking-widest mt-1 font-semibold font-manrope">Execution Workspace</div>
                 </div>
              </div>
            </div>

            {/* Middle: Micro-Process Graph */}
            <div className="flex flex-1 items-center justify-center max-w-4xl mx-auto gap-2 md:gap-6 px-4 overflow-x-auto no-scrollbar">
              {[
                { label: 'Foundation', targetSec: 'Commercial Foundation' },
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
                  <div key={step.label} className="flex items-center gap-2 md:gap-4 shrink-0">
                    <button
                      onClick={() => setActiveSection(step.targetSec)}
                      className="flex items-center gap-2 focus:outline-none group relative cursor-pointer"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-manrope font-bold transition-all ${
                        status === 'completed'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                          : status === 'active'
                            ? 'bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.3)] border border-[#00D4FF]'
                            : 'bg-[#041326]/60 text-slate-500 border border-white/10 group-hover:border-slate-400 group-hover:text-slate-300'
                      }`}>
                        {status === 'completed' ? <Check size={12} /> : `0${idx + 1}`}
                      </div>
                      <div className="flex flex-col text-left hidden lg:flex">
                        <span className={`text-[10px] uppercase tracking-wider font-bold transition-colors ${
                          status === 'completed' ? 'text-[#10B981]' : status === 'active' ? 'text-[#00D4FF]' : 'text-slate-500 group-hover:text-slate-300'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    </button>
                    {idx < 4 && <div className="text-slate-700 font-normal text-[10px] pointer-events-none hidden md:block">➔</div>}
                  </div>
                );
              })}
            </div>

            {/* Right: Deploy & Verification Code */}
            <div className="flex items-center gap-4 shrink-0">
               <div className="hidden xl:flex items-center gap-2 bg-[#040B18] border border-white/10 rounded-md px-3 py-1.5">
                 <span className="text-[9px] font-manrope text-slate-500 uppercase">KOD:</span>
                 <span className="text-[10px] text-slate-300 font-mono font-bold tracking-widest">{contractFields.verificationCode.slice(0, 9)}</span>
               </div>
               
               <div className="h-6 w-px bg-white/10 hidden md:block"></div>

               <div className="flex items-center gap-3">
                 <div className="hidden lg:flex items-center gap-2 text-[10px] font-manrope uppercase tracking-wider font-bold">
                   {isExecuted ? <CheckCircle2 size={14} className="text-[#10B981]" /> : <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>}
                   <span className={isExecuted ? "text-[#10B981]" : "text-slate-300"}>{isExecuted ? "EXECUTED" : "SYNCHRONIZED"}</span>
                 </div>
                 {isExecuted ? (
                   <button 
                     onClick={() => {
                       setIsExecuted(false);
                       setCurrentVersion('v2 Seller Revision');
                     }} 
                     className="h-9 px-4 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-2 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 hover:bg-[#F59E0B]/30 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                   >
                     <Unlock size={14} /> REVISE CONTRACT
                   </button>
                 ) : (
                   <button 
                     onClick={() => setShowDeployModal(true)} 
                     disabled={isExecuted} 
                     className="h-9 px-4 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-2 bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:bg-[#00D4FF]/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] cursor-pointer"
                   >
                     READY TO DEPLOY
                   </button>
                 )}
               </div>
            </div>
          </div>

      {/* Main Grid (25% | 35% | 40%) */}
      <div className="flex flex-1 min-h-0 overflow-hidden w-full relative">
        
        {/* LEFT PANEL - Contract Structure (with Collapsible Sidebar and Vertical Milestones) */}
        <div className={`print:hidden shrink-0 border-r border-[#2B3347] flex flex-col bg-[#071326] text-slate-300 transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[140px]'} ${showPdfPreviewOverlay ? 'hidden' : ''}`}>
          <div className={`h-12 px-4 border-b border-[#2B3347] bg-[#040B18] flex items-center overflow-hidden shrink-0 ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-[11px] font-bold text-slate-300 normal-case tracking-normal font-manrope truncate">Sections</div>
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer flex-shrink-0"
              title={sidebarCollapsed ? "Expand" : "Collapse"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 relative bg-[#071326]">
            
            {/* Elegant visual thin vertical timeline line connecting milestones */}
            <div className="absolute top-6 bottom-6 w-[2px] bg-white/10 transition-all duration-300 left-[27px]" />

            {sections.map((sec, idx) => {
              const completed = isSectionCompleted(sec);
              const active = activeSection === sec;
              
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 relative group cursor-pointer ${active ? 'bg-[#00D4FF]/10 text-white font-semibold' : 'hover:bg-[#0A1930] text-slate-400'}`}
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
                            : 'bg-[#071326]/50 border-white/10 text-slate-500 group-hover:border-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                    )}
                  </div>

                  {/* Text labels: hidden when collapsed */}
                  {!sidebarCollapsed ? (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`text-[12px] font-semibold normal-case tracking-normal truncate transition-colors ${active ? 'text-white font-manrope' : 'text-slate-350 group-hover:text-slate-200'}`}>
                        {sec}
                      </span>
                      <span className={`text-[10px] font-manrope normal-case tracking-normal mt-0.5 font-bold ${completed ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {completed ? "ready ✓" : "pending"}
                      </span>
                    </div>
                  ) : (
                    /* Hover tooltip in collapsed mode */
                    <div className="absolute left-[64px] bg-[#040B18] border border-white/10 text-white text-[10px] normal-case font-semibold tracking-normal px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                      {sec} <span className={`text-[9px] font-manrope ml-2 ${completed ? "text-emerald-400" : "text-amber-500"}`}>{completed ? "ready ✓" : "pending"}</span>
                    </div>
                  )}

                  {!sidebarCollapsed && active && (
                    <ChevronRight size={12} className="ml-auto text-[#00D4FF] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Sticky footer for Add Custom Section */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-[#2B3347] bg-[#040B18]">
              <button 
                onClick={() => {
                   const title = prompt("Enter Custom Section Title:");
                   if (title) {
                      const newId = `Custom_${Date.now()}`;
                      setClauses(prev => [...prev, {
                         id: newId,
                         title: title,
                         content: "",
                         status: 'v1 Generated' as any
                      }]);
                      setEnabledPdfSections(prev => [...prev, newId]);
                      setActiveSection(title);
                   }
                }}
                className="w-full py-2 border border-dashed border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 text-[10px] uppercase font-bold tracking-widest rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Plus size={12} /> Add Section
              </button>
            </div>
          )}
        </div>

        {/* CENTER PANEL - AI Generated + Human Revised Workspace */}
        <div className={`border-r border-[#2B3347] flex bg-[#171B26] shadow-sm z-10 relative transition-all duration-300 ${
          !showLivePreview 
            ? 'flex-1 min-w-0' 
            : `${sidebarCollapsed ? 'flex-[1.6]' : 'flex-[1.4]'} ${showHistorySidebar ? 'flex-[2]' : ''} shrink-0`
        } ${showPdfPreviewOverlay ? 'hidden' : ''}`}>
          
          {/* Main Workspace content wrapper */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            <div className="h-12 border-b border-[#2B3347] flex items-center justify-between px-6 bg-[#202636] shrink-0">
              <button 
                onClick={() => setShowLivePreview(!showLivePreview)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-manrope font-extrabold uppercase tracking-wider transition-all border cursor-pointer shadow-sm ${
                  showLivePreview 
                    ? 'bg-[#2B3347]/50 text-slate-300 border-[#2B3347] hover:bg-[#2B3347]/85' 
                    : 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/25 hover:bg-[#00D4FF]/20'
                }`}
                title={showLivePreview ? "Hide Live Document Preview" : "Show Live Document Preview"}
              >
                <Eye size={12} />
                <span>{showLivePreview ? "Hide Preview" : "Show Live Preview"}</span>
              </button>
            
            <div className="flex items-center gap-3">
              {/* Unobtrusive Auto-saved Status Indicator */}
              <div className="flex items-center gap-1.5 text-[9px] font-manrope transition-all duration-300">
                {saveStatus === 'saving' && (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-amber-400 font-semibold tracking-wider uppercase">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-emerald-400 font-medium tracking-wider uppercase">Auto-saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-rose-400 font-bold tracking-wider uppercase">Error Saving</span>
                  </>
                )}
              </div>

              {/* Version History Sidebar Toggle Button */}
              <button 
                onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[8px] font-manrope font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  showHistorySidebar 
                    ? 'bg-[#00D4FF]/20 text-white border-[#00D4FF]' 
                    : 'bg-[#2B3347] text-slate-300 border-[#2B3347]/50 hover:bg-[#2B3347]/80'
                }`}
                title="View Clause Edit Log"
              >
                <History size={11} />
                <span>History ({revisions.length})</span>
              </button>

              <span className="px-2 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] text-[8px] font-manrope rounded tracking-wider uppercase font-bold border border-[#00D4FF]/20">
                Active: {currentVersion}
              </span>
            </div>
          </div>

          <div 
            ref={workspaceScrollRef}
            className="flex-1 overflow-y-auto p-6 no-scrollbar custom-scrollbar space-y-6"
            onScroll={handleWorkspaceScroll}
          >

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
                      className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 hover:bg-[#00D4FF]/20 text-[#00D4FF] hover:text-white px-3 py-1.5 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent shrink-0 cursor-pointer"
                    >
                      {isAdvisorLoading ? <Loader2 size={14} className="animate-spin text-[#00D4FF]" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
             )}

             {/* Dynamic Clause Lock/Unlock and Alternate Replacements for Clause-based sections */}
             {(() => {
                const sectionToClauseId: { [key: string]: string } = {
                  "Parties": "clause_parties",
                  "Commercial Foundation": "clause_commercial_foundation",
                  "Deliverables": "clause_deliverables",
                  "Commercial Terms": "clause_commercial_terms",
                  "Payment Terms": "clause_payment_terms",
                  "Delivery Terms": "clause_delivery_terms",
                  "Warranty": "clause_warranty",
                  "Liability": "clause_liability",
                  "Confidentiality": "clause_confidentiality",
                  "Termination": "clause_termination",
                  "Jurisdiction": "clause_jurisdiction",
                  "Arbitration": "clause_arbitration",
                  "Signatures": "clause_execution",
                  "Annexes": "clause_annexes"
                };

                const mappedClauseId = sectionToClauseId[activeSection];
                const activeClause = clauses.find(c => c.id === mappedClauseId);
                if (!activeClause) return null;

                const isLocked = activeClause.status.includes('Signed');
                const alternatives = clauseAlternatives[activeClause.id] || [];

                return (
                  <div className="bg-[#041326]/40 border border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col mb-6 animate-in fade-in">
                    {/* Header with status & security lock */}
                    <div className="px-5 py-4 border-b border-white/10 bg-[#0a1c34]/20/50 flex items-center justify-between">
                      <div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Section / Clause Title (Editable/Translatable)</label>
                          <input
                            type="text"
                            value={activeClause.title || ''}
                            onChange={(e) => {
                              const newTitle = e.target.value;
                              setClauses(prev => prev.map(c => c.id === activeClause.id ? { ...c, title: newTitle } : c));
                            }}
                            className="bg-transparent text-[11px] text-[#00D4FF] font-bold uppercase tracking-wider font-manrope outline-none border-b border-dashed border-[#00D4FF]/30 focus:border-[#00D4FF] w-[260px] py-0.5"
                            placeholder="Translate Section Title..."
                            title="Translate or customize section title"
                          />
                        </div>
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
                                status: isLocked ? 'v2 Seller Revision' as any : 'v5 Signed' as any
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
                        title={isLocked ? "Unlock clause for human editing & AI revision" : "Lock clause as Signed / Freeze terms"}
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
                                   {/* Standard Text Area for Human draft revision */}
                    <div className="p-5 flex-1 space-y-4 bg-[#041326]/40">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-manrope">
                          Professional Human Revise Workspace
                        </label>

                        {pendingRevision ? (
                          <div className="border border-[#00D4FF]/30 rounded-xl overflow-hidden bg-[#07162c] shadow-lg shadow-[#00D4FF]/5 animate-in fade-in duration-350 my-3">
                            {/* Header */}
                            <div className="px-4 py-3 bg-[#0a203c] border-b border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  pendingRevision.aiActionType === 'rewrite' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' :
                                  pendingRevision.aiActionType === 'improve_wording' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                                  pendingRevision.aiActionType === 'add_content' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                                  pendingRevision.aiActionType === 'remove_content' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' :
                                  pendingRevision.aiActionType === 'continue_writing' ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' :
                                  'bg-slate-400'
                                }`} />
                                <div>
                                  <span className="text-[10px] font-bold text-white uppercase tracking-wider font-manrope">
                                    AI Revision Proposed
                                  </span>
                                  <span className="text-[8px] text-slate-400 block font-mono">
                                    ACTION: {pendingRevision.aiActionType.toUpperCase().replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded font-mono ${
                                pendingRevision.aiActionType === 'rewrite' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                pendingRevision.aiActionType === 'improve_wording' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                pendingRevision.aiActionType === 'add_content' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                pendingRevision.aiActionType === 'remove_content' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                pendingRevision.aiActionType === 'continue_writing' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                'bg-slate-500/10 text-slate-400'
                              }`}>
                                Preview Mode
                              </span>
                            </div>

                            {/* Content side-by-side or stacked */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/5 bg-[#030e1d]">
                              {/* Left side: Original */}
                              <div className="p-4 border-r border-white/5 flex flex-col min-h-[160px]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-manrope">Original Text</span>
                                  <span className="text-[8px] text-slate-500 font-mono">Unchanged</span>
                                </div>
                                <div className="text-xs text-slate-400 font-serif leading-relaxed overflow-y-auto max-h-[220px] whitespace-pre-wrap select-none p-3 bg-[#051121] rounded border border-white/[0.02]">
                                  {pendingRevision.originalText || "(Empty Clause)"}
                                </div>
                              </div>

                              {/* Right side: Proposed */}
                              <div className={`p-4 flex flex-col min-h-[160px] ${
                                pendingRevision.aiActionType === 'rewrite' ? 'bg-blue-950/5' :
                                pendingRevision.aiActionType === 'improve_wording' ? 'bg-emerald-950/5' :
                                pendingRevision.aiActionType === 'add_content' ? 'bg-amber-950/5' :
                                pendingRevision.aiActionType === 'remove_content' ? 'bg-red-950/5' :
                                pendingRevision.aiActionType === 'continue_writing' ? 'bg-purple-950/5' :
                                ''
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-[8px] font-bold uppercase tracking-wider font-manrope ${
                                    pendingRevision.aiActionType === 'rewrite' ? 'text-blue-400' :
                                    pendingRevision.aiActionType === 'improve_wording' ? 'text-emerald-400' :
                                    pendingRevision.aiActionType === 'add_content' ? 'text-amber-400' :
                                    pendingRevision.aiActionType === 'remove_content' ? 'text-red-400' :
                                    pendingRevision.aiActionType === 'continue_writing' ? 'text-purple-400' :
                                    'text-slate-300'
                                  }`}>
                                    Proposed AI Output
                                  </span>
                                  <span className="text-[8px] text-[#00D4FF] font-mono font-bold animate-pulse">Generated</span>
                                </div>
                                <div className={`text-xs text-white font-serif leading-relaxed overflow-y-auto max-h-[220px] whitespace-pre-wrap p-3 rounded border ${
                                  pendingRevision.aiActionType === 'rewrite' ? 'bg-blue-950/10 border-blue-500/25 text-blue-100' :
                                  pendingRevision.aiActionType === 'improve_wording' ? 'bg-emerald-950/10 border-emerald-500/25 text-emerald-100' :
                                  pendingRevision.aiActionType === 'add_content' ? 'bg-amber-950/10 border-amber-500/25 text-amber-100' :
                                  pendingRevision.aiActionType === 'remove_content' ? 'bg-red-950/10 border-red-500/25 text-red-100' :
                                  pendingRevision.aiActionType === 'continue_writing' ? 'bg-purple-950/10 border-purple-500/25 text-purple-100' :
                                  'bg-[#061427] border-white/5'
                                }`}>
                                  {pendingRevision.aiOutput}
                                </div>
                              </div>
                            </div>

                            {/* Buttons Footer */}
                            <div className="p-3 bg-[#07162c] flex flex-wrap gap-2 items-center justify-between">
                              <div className="text-[8px] text-slate-400 font-mono">
                                PREVIEW CREATED: {new Date(pendingRevision.timestamp).toLocaleTimeString()}
                              </div>
                              <div className="flex items-center gap-2">
                                {/* REJECT */}
                                <button
                                  onClick={() => handleAcceptRejectRevision(false, 'Rejected')}
                                  className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 text-[10px] font-manrope font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                                >
                                  <X size={11} strokeWidth={2.5} /> Reject Revision
                                </button>

                                {/* CONTINUE EDITING */}
                                <button
                                  onClick={() => handleAcceptRejectRevision(true, 'Continue Editing')}
                                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[10px] font-manrope font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                                >
                                  <PenTool size={11} strokeWidth={2} /> Continue Editing
                                </button>

                                {/* ACCEPT */}
                                <button
                                  onClick={() => handleAcceptRejectRevision(true, 'Accepted')}
                                  className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-manrope font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm shadow-emerald-950/40"
                                >
                                  <Check size={11} strokeWidth={2.5} /> Accept Revision
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <textarea
                              ref={textareaRef}
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

                                // Sync with technical fields
                                if (activeClause.id === 'clause_commercial_terms') setContractFields(prev => ({ ...prev, commercialTerms: updatedText }));
                                if (activeClause.id === 'clause_deliverables') setContractFields(prev => ({ ...prev, deliverables: updatedText }));
                                if (activeClause.id === 'clause_warranty') setContractFields(prev => ({ ...prev, warrantyScope: updatedText }));
                                if (activeClause.id === 'clause_liability') setContractFields(prev => ({ ...prev, liabilityLimit: updatedText }));
                                if (activeClause.id === 'clause_arbitration') setContractFields(prev => ({ ...prev, arbitrationRules: updatedText }));
                                if (activeClause.id === 'clause_payment_terms') setContractFields(prev => ({ ...prev, paymentTerms: updatedText }));
                                if (activeClause.id === 'clause_delivery_terms') setContractFields(prev => ({ ...prev, deliveryLocation: updatedText }));
                                if (activeClause.id === 'clause_confidentiality') setContractFields(prev => ({ ...prev, confidentialityDuration: updatedText }));
                                if (activeClause.id === 'clause_termination') setContractFields(prev => ({ ...prev, terminationNotice: updatedText }));
                              }}
                              className={`w-full min-h-[180px] text-xs font-serif leading-relaxed border p-4 rounded-xl focus:outline-none transition-all ${
                                isLocked
                                  ? 'bg-[#0a1c34]/20 border-white/10 text-slate-550 cursor-not-allowed'
                                  : 'bg-[#0a1c34]/20 border-white/10 text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] shadow-inner'
                              }`}
                              placeholder="You can edit the clause text directly here..."
                            />

                            {activeClause.id === 'clause_deliverables' && contractFields.milestones && (
                              <div className="mt-6 border-t border-white/10 pt-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#00D4FF] mb-3">Key Milestones & Project Timelines</h4>
                                <div className="bg-[#0a1c34]/20 border border-white/5 p-4 rounded-xl">
                                  <div className="whitespace-pre-wrap text-xs font-serif leading-relaxed text-slate-300">
                                    {contractFields.milestones}
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeClause.id === 'clause_payment_terms' && (contractFields.globalPaymentConfig || contractFields.partyAPaymentData || contractFields.partyBPaymentData) && (
                              <div className="mt-6 border-t border-white/10 pt-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#34D399] mb-3">Enterprise Payment Configuration</h4>
                                <div className="bg-[#0a1c34]/20 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                  <div className="text-xs text-slate-300">
                                    Global Banking & Digital Config Registered
                                  </div>
                                  <button onClick={() => setShowBankDetailsModal(true)} className="px-4 py-1.5 bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold rounded-lg border border-[#34D399]/30 hover:bg-[#34D399]/30 transition-all uppercase tracking-wider">
                                    View / Edit
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ⚠️ Empty Clause Warning Alert */}
                            {!activeClause.content.trim() && (
                              <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-xs text-red-400 font-manrope space-y-2 mb-3 mt-3">
                                <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider">
                                  <AlertCircle size={14} className="text-red-500" /> Clause is Empty
                                </div>
                                <p className="text-slate-300 text-[11px]">
                                  This clause has been deleted or cleared. It will not appear in the generated PDF agreement. You can restore the official default legal text for this section below.
                                </p>
                                <button
                                  onClick={() => {
                                    const defaultList = generateInitialClauses({ currency: foundation.currency, contractValue: foundation.value });
                                    const defaultMatch = defaultList.find(c => c.id === activeClause.id);
                                    if (defaultMatch) {
                                      setClauses(prev => prev.map(c => c.id === activeClause.id ? { ...c, content: defaultMatch.content, status: 'v1 Generated' as any } : c));
                                      // Immediately push restored content to the agreement state
                                      syncClauseToFields(activeClause.id, defaultMatch.content);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30 text-[#00D4FF] text-[9.5px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <RefreshCw size={11} /> Restore Default Legal Template
                                </button>
                              </div>
                            )}
                          </>
                        )}




                        {/* Standard Revision Toolbar */}
                        <div className="mt-4 p-4 bg-[#0a1c34]/60 border border-white/10 rounded-xl space-y-4 relative">
                          {pendingRevision && (
                            <div className="absolute inset-0 bg-slate-950/80 rounded-xl backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                              <Sparkles size={20} className="text-[#00D4FF] animate-pulse mb-1.5" />
                              <div className="text-[11px] font-bold text-white uppercase tracking-wider font-manrope">AI ACTION IN PREVIEW MODE</div>
                              <p className="text-[9px] text-slate-400 max-w-[280px] mt-1 leading-relaxed">
                                Please **Accept**, **Reject**, or **Continue Editing** the proposed AI revision preview above to unlock other AI capabilities.
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[#00D4FF] text-[9px] font-bold tracking-widest uppercase flex items-center gap-1 font-manrope">
                              <Sparkles size={11} className="text-[#00D4FF]" /> PROFESSIONAL REVISION WORKSPACE
                            </span>
                            <span className="text-slate-500 text-[8px] font-mono uppercase">Interactive Workspace</span>
                          </div>

                          {showSyncSuccessToast && (
                            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-2 px-3 rounded-lg text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                              <CheckCircle2 size={12} className="text-emerald-400 animate-bounce" />
                              <span className="font-semibold uppercase tracking-wider font-manrope">SUCCESS: Clause Sent & Placed into Agreement structure & PDF render!</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {/* 1. REWRITE (🟦 Blue) */}
                            <button
                              onClick={() => handleToolbarAction('rewrite', activeClause)}
                              disabled={isLocked || isAiRevising || !!pendingRevision}
                              className="group relative p-2 bg-slate-950 hover:bg-blue-950/20 border border-blue-500/20 hover:border-blue-500/40 text-left rounded-lg transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 p-1 bg-blue-950/40 text-blue-400 rounded transition-colors">
                                  {isAiRevising ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Rewrite</div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">🟦 Structure & Meaning</div>
                                </div>
                              </div>
                            </button>

                            {/* 2. ADD CONTENT (🟨 Yellow) */}
                            <button
                              onClick={() => handleToolbarAction('add_content', activeClause)}
                              disabled={isLocked || isAiRevising || !!pendingRevision}
                              className="group relative p-2 bg-slate-950 hover:bg-amber-950/20 border border-amber-500/20 hover:border-amber-500/40 text-left rounded-lg transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 p-1 bg-amber-950/40 text-amber-400 rounded transition-colors">
                                  {isAiRevising ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">Add Content</div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">🟨 Append depth</div>
                                </div>
                              </div>
                            </button>

                            {/* 3. REMOVE CONTENT (🟥 Red) */}
                            <button
                              onClick={() => handleToolbarAction('remove_content', activeClause)}
                              disabled={isLocked || isAiRevising || !!pendingRevision}
                              className="group relative p-2 bg-slate-950 hover:bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-left rounded-lg transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 p-1 bg-red-950/40 text-red-400 rounded transition-colors">
                                  {isAiRevising ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Remove Content</div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">🟥 Trim identified terms</div>
                                </div>
                              </div>
                            </button>

                            {/* 4. IMPROVE WORDING (🟩 Green) */}
                            <button
                              onClick={() => handleToolbarAction('improve_wording', activeClause)}
                              disabled={isLocked || isAiRevising || !!pendingRevision}
                              className="group relative p-2 bg-slate-950 hover:bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/40 text-left rounded-lg transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 p-1 bg-emerald-950/40 text-emerald-400 rounded transition-colors">
                                  {isAiRevising ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide font-manrope">Improve Wording</div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">🟩 Readability & Tone</div>
                                </div>
                              </div>
                            </button>

                            {/* 5. CONTINUE WRITING (🟪 Purple) */}
                            <button
                              onClick={() => handleToolbarAction('continue_writing', activeClause)}
                              disabled={isLocked || isAiRevising || !!pendingRevision}
                              className="group relative p-2 bg-slate-950 hover:bg-purple-950/20 border border-purple-500/20 hover:border-purple-500/40 text-left rounded-lg transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 p-1 bg-purple-950/40 text-purple-400 rounded transition-colors">
                                  {isAiRevising ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Continue Writing</div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">🟪 Extend naturally</div>
                                </div>
                              </div>
                            </button>

                            {/* 6. MANUAL EDIT (⚪ Grey) */}
                            <button
                              onClick={() => handleToolbarAction('manual_edit', activeClause)}
                              disabled={!!pendingRevision}
                              className="group relative p-2 bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-left rounded-lg transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 p-1 bg-slate-900 text-slate-300 rounded transition-colors">
                                  <PenTool size={12} />
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Manual Edit</div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">⚪ No AI processing</div>
                                </div>
                              </div>
                            </button>

                            {/* 9. DELETE */}
                            <button
                              onClick={() => handleToolbarAction('delete', activeClause)}
                              disabled={isLocked || !!pendingRevision}
                              className="group relative p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-left rounded-lg transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 p-1 bg-red-950/50 rounded text-red-400 group-hover:bg-red-500/10 transition-colors">
                                  <X size={12} />
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-red-400 group-hover:text-red-300 uppercase tracking-wide font-manrope">Delete</div>
                                  <div className="text-[8px] text-slate-500 mt-0.5">Clear active clause</div>
                                </div>
                              </div>
                            </button>
                          </div>
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
                                  const updatedAlt = alt;
                                  setClauses(prev => prev.map(c => {
                                    if (c.id === activeClause.id) {
                                      return {
                                        ...c,
                                        content: updatedAlt,
                                        status: 'v2 Seller Revision' as any,
                                        alternativeReplacementsCount: (c.alternativeReplacementsCount || 0) + 1
                                      };
                                    }
                                    return c;
                                  }));

                                  // Sync with technical fields
                                  syncClauseToFields(activeClause.id, updatedAlt);
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
                </div>
              );
            })()}

              <div className={`${manuallyCompletedSections.includes(activeSection) && !["Verification", "Audit Trail", "Contract AI Advisor"].includes(activeSection) ? 'opacity-50 pointer-events-none select-none grayscale-[20%]' : ''}`}>
               {activeSection === "Commercial Foundation" && (
                 <div className="space-y-6 animate-in fade-in">
                   <h2 className={sectionTitleClass}>COMMERCIAL FOUNDATION</h2>
                  
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Agreement Category</label>
                    <div className="relative mb-4">
                      <select className={selectClass} value={foundation.category} onChange={e => {
                        if (e.target.value === "___add_custom___") {
                          setCustomInputModal({
                            isOpen: true,
                            fieldId: 'category',
                            fieldTitle: 'Agreement Category',
                            value: '',
                            callback: (custom) => {
                              if (custom) handleAgreementCategoryChange(custom);
                            }
                          });
                        } else {
                          handleAgreementCategoryChange(e.target.value);
                        }
                      }}>
                        {Object.keys(groupedAgreementTypes).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                        {!Object.keys(groupedAgreementTypes).includes(foundation.category) && foundation.category && (
                          <option value={foundation.category}>{foundation.category}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>

                    <label className={labelClass}>Agreement Type</label>
                    <div className="relative">
                      <select className={selectClass} value={foundation.type} onChange={e => {
                        if (e.target.value === "___add_custom___") {
                          setCustomInputModal({
                            isOpen: true,
                            fieldId: 'type',
                            fieldTitle: 'Agreement Type',
                            value: '',
                            callback: (custom) => {
                              if (custom) handleAgreementTypeChange(custom);
                            }
                          });
                        } else {
                          handleAgreementTypeChange(e.target.value);
                        }
                      }}>
                        {groupedAgreementTypes[foundation.category as keyof typeof groupedAgreementTypes]?.map(t => (
                          <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                            {t}
                          </option>
                        ))}
                        {!(groupedAgreementTypes[foundation.category as keyof typeof groupedAgreementTypes] || []).includes(foundation.type) && foundation.type && (
                          <option value={foundation.type} className="bg-[#242B3B] text-white font-normal">{foundation.type}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Standard Form</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={foundation.standardForm} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'standardForm',
                              fieldTitle: 'Standard Form',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setFoundation({...foundation, standardForm: custom});
                                  setManuallyConfirmedFields(prev => ({ ...prev, standardForm: true }));
                                }
                              }
                            });
                          } else {
                            setFoundation({...foundation, standardForm: e.target.value});
                            setManuallyConfirmedFields(prev => ({ ...prev, standardForm: true }));
                          }
                        }}
                      >
                        {standardForms.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                        {!standardForms.includes(foundation.standardForm) && foundation.standardForm && (
                          <option value={foundation.standardForm}>{foundation.standardForm}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="standardForm"
                      currentValue={foundation.standardForm}
                      options={currentRecs.standardForm}
                      onAccept={(val) => setFoundation(prev => ({ ...prev, standardForm: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Compliance Framework</label>
                    <div className="mb-3">
                      <select className={selectClass} value={complianceCategory} onChange={e => setComplianceCategory(e.target.value)}>
                        {Object.keys(groupedComplianceFrameworks).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                      <div className="flex flex-wrap gap-2">
                        {groupedComplianceFrameworks[complianceCategory as keyof typeof groupedComplianceFrameworks].map(framework => (
                          <label key={framework} className="flex items-center gap-2 text-sm text-slate-300 bg-[#171B26] px-3 py-1.5 rounded border border-[#2B3347] cursor-pointer hover:border-[#00D4FF]/50">
                            <input 
                              type="checkbox" 
                              className="rounded border-[#2B3347] text-[#00D4FF] focus:ring-[#00D4FF]/20 bg-[#0A1121]"
                              checked={!!foundation.complianceFramework?.includes(framework)}
                              onChange={(e) => {
                                setManuallyConfirmedFields(prev => ({ ...prev, complianceFramework: true }));
                                if (e.target.checked) {
                                  setFoundation({...foundation, complianceFramework: [...(foundation.complianceFramework || []), framework]});
                                } else {
                                  setFoundation({...foundation, complianceFramework: (foundation.complianceFramework || []).filter((f: string) => f !== framework)});
                                }
                              }}
                            />
                            {framework}
                          </label>
                        ))}
                        
                        {foundation.complianceFramework?.filter((f: string) => !groupedComplianceFrameworks[complianceCategory as keyof typeof groupedComplianceFrameworks]?.includes(f)).map((framework: string) => (
                          <label key={framework} className="flex items-center gap-2 text-sm text-[#00D4FF] bg-[#171B26] px-3 py-1.5 rounded border border-[#00D4FF]/50 cursor-pointer hover:border-red-500/50">
                            <input 
                              type="checkbox" 
                              className="rounded border-[#2B3347] text-[#00D4FF] focus:ring-[#00D4FF]/20 bg-[#0A1121]"
                              checked={true}
                              onChange={(e) => {
                                setManuallyConfirmedFields(prev => ({ ...prev, complianceFramework: true }));
                                setFoundation({...foundation, complianceFramework: (foundation.complianceFramework || []).filter((f: string) => f !== framework)});
                              }}
                            />
                            {framework}
                          </label>
                        ))}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCustomInputModal({
                            isOpen: true,
                            fieldId: 'complianceFramework',
                            fieldTitle: 'Compliance Framework',
                            value: '',
                            callback: (custom) => {
                              if (custom && !(foundation.complianceFramework || []).includes(custom)) {
                                setManuallyConfirmedFields(prev => ({ ...prev, complianceFramework: true }));
                                setFoundation({...foundation, complianceFramework: [...(foundation.complianceFramework || []), custom]});
                              }
                            }
                          });
                        }}
                        className="self-start mt-1 flex items-center gap-2 text-xs text-[#00D4FF] bg-[#171B26] px-3 py-1.5 rounded border border-dashed border-[#00D4FF]/30 cursor-pointer hover:border-[#00D4FF] hover:bg-[#00D4FF]/10 font-bold"
                      >
                        + ADD CUSTOM
                      </button>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="complianceFramework"
                      currentValue={foundation.complianceFramework}
                      options={currentRecs.complianceFramework}
                      onAccept={(val) => setFoundation(prev => ({ ...prev, complianceFramework: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Governing Law</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={jurisdiction.law} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'governingLaw',
                              fieldTitle: 'Governing Law',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setJurisdiction({...jurisdiction, law: custom});
                                  setManuallyConfirmedFields(prev => ({ ...prev, law: true }));
                                }
                              }
                            });
                          } else {
                            setJurisdiction({...jurisdiction, law: e.target.value});
                            setManuallyConfirmedFields(prev => ({ ...prev, law: true }));
                          }
                        }}
                      >
                        {applicableLaws.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                        {!applicableLaws.includes(jurisdiction.law) && jurisdiction.law && (
                          <option value={jurisdiction.law}>{jurisdiction.law}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="law"
                      currentValue={jurisdiction.law}
                      options={currentRecs.law}
                      onAccept={(val) => setJurisdiction((prev: any) => ({ ...prev, law: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Arbitration Rules & Institution</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={jurisdiction.institution} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'arbitrationInstitution',
                              fieldTitle: 'Arbitration Rules & Institution',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setJurisdiction({...jurisdiction, institution: custom});
                                  setContractFields({...contractFields, arbitrationRules: custom});
                                  setManuallyConfirmedFields(prev => ({ ...prev, arbitrationRules: true }));
                                }
                              }
                            });
                          } else {
                            setJurisdiction({...jurisdiction, institution: e.target.value});
                            setContractFields({...contractFields, arbitrationRules: e.target.value});
                            setManuallyConfirmedFields(prev => ({ ...prev, arbitrationRules: true }));
                          }
                        }}
                      >
                        {arbitrationInstitutions.map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                        {!arbitrationInstitutions.includes(jurisdiction.institution) && jurisdiction.institution && (
                          <option value={jurisdiction.institution}>{jurisdiction.institution}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="arbitrationRules"
                      currentValue={jurisdiction.institution}
                      options={currentRecs.arbitrationRules}
                      onAccept={(val) => {
                        setJurisdiction((prev: any) => ({ ...prev, institution: val }));
                        setContractFields((prev: any) => ({ ...prev, arbitrationRules: val }));
                      }}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Agreement Title</label>
                    <input className={inputClass} value={foundation.title || ''} onChange={e => setFoundation({...foundation, title: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left flex flex-col justify-between">
                      <div>
                        <label className={labelClass}>Transaction Type</label>
                        <div className="relative">
                          <select 
                            className={selectClass} 
                            value={foundation.transactionType} 
                            onChange={e => {
                              if (e.target.value === "___add_custom___") {
                                setCustomInputModal({
                                  isOpen: true,
                                  fieldId: 'transactionType',
                                  fieldTitle: 'Transaction Type',
                                  value: '',
                                  callback: (custom) => {
                                    if (custom) {
                                      setFoundation({...foundation, transactionType: custom});
                                      setManuallyConfirmedFields(prev => ({ ...prev, transactionType: true }));
                                    }
                                  }
                                });
                              } else {
                                setFoundation({...foundation, transactionType: e.target.value});
                                setManuallyConfirmedFields(prev => ({ ...prev, transactionType: true }));
                              }
                            }}
                          >
                            {Object.entries(groupedTransactionTypes).map(([category, items]) => (
                              <optgroup key={category} label={category} className="bg-[#171B26] text-[#00D4FF] font-bold">
                                {items.map(t => (
                                  <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                                    {t}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                            {!Object.values(groupedTransactionTypes).flat().includes(foundation.transactionType) && foundation.transactionType && (
                              <option value={foundation.transactionType}>{foundation.transactionType}</option>
                            )}
                            <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                            <ChevronRight size={14} className="rotate-90" />
                          </div>
                        </div>
                      </div>
                      <AIRecommendationHelper 
                        fieldName="transactionType"
                        currentValue={foundation.transactionType}
                        options={currentRecs.transactionType}
                        onAccept={(val) => setFoundation(prev => ({ ...prev, transactionType: val }))}
                        manuallyConfirmedFields={manuallyConfirmedFields}
                        setManuallyConfirmedFields={setManuallyConfirmedFields}
                      />
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                      <label className={labelClass}>Contract Value & Currency</label>
                      <div className="flex gap-2 mb-2">
                        <input className={`${inputClass} flex-1`} value={foundation.value || ''} onChange={e => setFoundation({...foundation, value: e.target.value})} />
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

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Commercial Subject Matter</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={foundation.subjectMatter} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'subjectMatter',
                              fieldTitle: 'Commercial Subject Matter',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setFoundation({...foundation, subjectMatter: custom});
                                  setManuallyConfirmedFields(prev => ({ ...prev, subjectMatter: true }));
                                }
                              }
                            });
                          } else {
                            setFoundation({...foundation, subjectMatter: e.target.value});
                            setManuallyConfirmedFields(prev => ({ ...prev, subjectMatter: true }));
                          }
                        }}
                      >
                        {Object.entries(groupedSubjectMatters).map(([category, items]) => (
                          <optgroup key={category} label={category} className="bg-[#171B26] text-[#00D4FF] font-bold">
                            {items.map(t => (
                              <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                                {t}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        {!Object.values(groupedSubjectMatters).flat().includes(foundation.subjectMatter) && foundation.subjectMatter && (
                          <option value={foundation.subjectMatter}>{foundation.subjectMatter}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="subjectMatter"
                      currentValue={foundation.subjectMatter}
                      options={currentRecs.subjectMatter}
                      onAccept={(val) => setFoundation(prev => ({ ...prev, subjectMatter: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Primary Commercial Objective</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={foundation.objective} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'objective',
                              fieldTitle: 'Primary Commercial Objective',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setFoundation({...foundation, objective: custom});
                                  setManuallyConfirmedFields(prev => ({ ...prev, objective: true }));
                                }
                              }
                            });
                          } else {
                            setFoundation({...foundation, objective: e.target.value});
                            setManuallyConfirmedFields(prev => ({ ...prev, objective: true }));
                          }
                        }}
                      >
                        {Object.entries(groupedObjectives).map(([category, items]) => (
                          <optgroup key={category} label={category} className="bg-[#171B26] text-[#00D4FF] font-bold">
                            {items.map(t => (
                              <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                                {t}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        {!Object.values(groupedObjectives).flat().includes(foundation.objective) && foundation.objective && (
                          <option value={foundation.objective}>{foundation.objective}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="objective"
                      currentValue={foundation.objective}
                      options={currentRecs.objective}
                      onAccept={(val) => setFoundation(prev => ({ ...prev, objective: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Commercial Model & Payment Structure</label>
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <select 
                          className={`${selectClass} w-full pr-8`} 
                          value={foundation.commercialModel || "Fixed Price"} 
                          onChange={e => {
                            if (e.target.value === "___add_custom___") {
                              setCustomInputModal({
                                isOpen: true,
                                fieldId: 'commercialModel',
                                fieldTitle: 'Commercial Model',
                                value: '',
                                callback: (custom) => {
                                  if (custom) {
                                    setFoundation({...foundation, commercialModel: custom});
                                    setManuallyConfirmedFields(prev => ({ ...prev, commercialModel: true }));
                                  }
                                }
                              });
                            } else {
                              setFoundation({...foundation, commercialModel: e.target.value});
                              setManuallyConfirmedFields(prev => ({ ...prev, commercialModel: true }));
                            }
                          }}
                        >
                          {Object.entries(groupedCommercialModels).map(([category, items]) => (
                            <optgroup key={category} label={category} className="bg-[#171B26] text-[#00D4FF] font-bold">
                              {items.map(t => (
                                <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                                  {t}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          {!Object.values(groupedCommercialModels).flat().includes(foundation.commercialModel || "Fixed Price") && foundation.commercialModel && (
                            <option value={foundation.commercialModel}>{foundation.commercialModel}</option>
                          )}
                          <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                      <div className="relative flex-1">
                        <select 
                          className={`${selectClass} w-full pr-8`} 
                          value={foundation.paymentStructure || "100% Advance"} 
                          onChange={e => {
                            if (e.target.value === "___add_custom___") {
                              setCustomInputModal({
                                isOpen: true,
                                fieldId: 'paymentStructure',
                                fieldTitle: 'Payment Structure',
                                value: '',
                                callback: (custom) => {
                                  if (custom) setFoundation({...foundation, paymentStructure: custom});
                                }
                              });
                            } else {
                              setFoundation({...foundation, paymentStructure: e.target.value});
                            }
                          }}
                        >
                          {Object.entries(groupedPaymentStructures).map(([category, items]) => (
                            <optgroup key={category} label={category} className="bg-[#171B26] text-[#00D4FF] font-bold">
                              {items.map(t => (
                                <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                                  {t}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          {!Object.values(groupedPaymentStructures).flat().includes(foundation.paymentStructure || "100% Advance") && foundation.paymentStructure && (
                            <option value={foundation.paymentStructure}>{foundation.paymentStructure}</option>
                          )}
                          <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="commercialModel"
                      currentValue={foundation.commercialModel}
                      options={currentRecs.commercialModel}
                      onAccept={(val) => setFoundation(prev => ({ ...prev, commercialModel: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Contract Party Distributions</label>
                    <div className="space-y-3">
                      {[partyA, partyB, ...additionalParties].map((party, index) => {
                        const currentDists = foundation.partyDistributions || [];
                        const roleName = party.role ? `${party.name || 'Unnamed'} (${party.role})` : (party.name || `Party ${index + 1}`);
                        const partyDist = currentDists[index] || { role: roleName, percentage: '', amount: '', email: party.email };
                        
                        return (
                          <div key={index} className="flex gap-2 items-center">
                            <div className={`${inputClass} flex-[2] bg-[#171B26] text-xs flex items-center text-white/70 overflow-hidden text-ellipsis whitespace-nowrap cursor-not-allowed opacity-80`} title={roleName}>
                              {roleName}
                            </div>
                            <div className="flex-[1] relative">
                              <input 
                                className={`${inputClass} w-full bg-[#171B26] text-xs pr-8`} 
                                value={partyDist.percentage || ''}
                                placeholder="%"
                                onChange={e => {
                                  const newDists = [...currentDists];
                                  if (!newDists[index]) newDists[index] = { role: roleName, percentage: '', amount: '', email: party.email };
                                  newDists[index].percentage = e.target.value;
                                  newDists[index].role = roleName;
                                  newDists[index].email = party.email;
                                  setFoundation({...foundation, partyDistributions: newDists});
                                }}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                            </div>
                            <div className="flex-[1.2] flex">
                              <select
                                className={`${selectClass} w-[70px] min-w-[70px] bg-[#171B26] text-[10px] pl-2 pr-6 border-r-0 rounded-r-none`}
                                value={partyDist.currency || foundation.currency || 'USD'}
                                onChange={e => {
                                  const newDists = [...currentDists];
                                  if (!newDists[index]) newDists[index] = { role: roleName, percentage: '', amount: '', currency: '', email: party.email };
                                  newDists[index].currency = e.target.value;
                                  newDists[index].role = roleName;
                                  newDists[index].email = party.email;
                                  setFoundation({...foundation, partyDistributions: newDists});
                                }}
                              >
                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <input 
                                className={`${inputClass} w-full bg-[#171B26] text-xs pl-2 rounded-l-none`} 
                                value={partyDist.amount || ''}
                                placeholder="Amount"
                                onChange={e => {
                                  const newDists = [...currentDists];
                                  if (!newDists[index]) newDists[index] = { role: roleName, percentage: '', amount: '', currency: '', email: party.email };
                                  newDists[index].amount = e.target.value;
                                  newDists[index].role = roleName;
                                  newDists[index].email = party.email;
                                  if (!newDists[index].currency) newDists[index].currency = foundation.currency || 'USD';
                                  setFoundation({...foundation, partyDistributions: newDists});
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setAdditionalParties([...additionalParties, { name: "", role: "Broker", email: "", address: "", idNumber: "", confirmEmail: true, additionalEmails: [] }])}
                      className="w-full mt-3 py-2 bg-[#0a1c34]/20 hover:bg-[#0a1c34]/40 border border-[#00D4FF]/20 hover:border-[#00D4FF]/50 rounded-lg text-[#00D4FF] hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      + Add Contract Party
                    </button>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Project Description</label>
                    <textarea 
                      className={`${inputClass} min-h-[100px] resize-y py-3`} 
                      value={foundation.description || ''} 
                      onChange={e => {
                        setFoundation({...foundation, description: e.target.value});
                        setManuallyConfirmedFields(prev => ({ ...prev, description: true }));
                      }} 
                    />
                    <AIRecommendationHelper 
                      fieldName="description"
                      currentValue={foundation.description}
                      options={[{
                        value: generateSuggestedDescription(
                          foundation.category,
                          foundation.type,
                          foundation.objective,
                          foundation.subjectMatter,
                          partyA.name,
                          partyB.name,
                          foundation.value,
                          foundation.currency,
                          foundation.geoScope
                        ),
                        confidence: 95,
                        label: "Auto-synthesized dynamic commercial summary from selected parameters."
                      }]}
                      onAccept={(val) => setFoundation(prev => ({ ...prev, description: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                    <FieldAiAssistant label="Project Description" onGenerate={handleFieldAssistantGenerate} onApply={(val) => {
                      setFoundation({...foundation, description: val});
                      setManuallyConfirmedFields(prev => ({ ...prev, description: true }));
                    }} hasPaid={hasPaidAssistantFee} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                      <label className={labelClass}>Geographic Scope</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.geoScope} onChange={e => setFoundation({...foundation, geoScope: e.target.value})}>
                          {Object.entries(groupedGeoScopes).map(([category, items]) => (
                            <optgroup key={category} label={category} className="bg-[#171B26] text-[#00D4FF] font-bold">
                              {items.map(t => (
                                <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                                  {t}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                      <label className={labelClass}>Operating Area</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.operatingArea} onChange={e => setFoundation({...foundation, operatingArea: e.target.value})}>
                          {Object.entries(groupedOperatingAreas).map(([category, items]) => (
                            <optgroup key={category} label={category} className="bg-[#171B26] text-[#00D4FF] font-bold">
                              {items.map(t => (
                                <option key={t} value={t} className="bg-[#242B3B] text-white font-normal">
                                  {t}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                      <label className={labelClass}>Continent</label>
                      <div className="relative">
                        <select className={selectClass} value={foundation.continent} onChange={e => setFoundation({...foundation, continent: e.target.value})}>
                          {continents.map(c => <option key={c} value={c} className="bg-[#242B3B] text-white font-normal">{c}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                          <ChevronRight size={14} className="rotate-90" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                      <label className={labelClass}>Country (Multi-Select)</label>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-2 mt-2">
                        {countries.map(c => {
                          const isSelected = Array.isArray(foundation.country) 
                            ? foundation.country.includes(c) 
                            : foundation.country === c;
                          
                          return (
                            <label key={c} className="flex items-center gap-2 cursor-pointer group">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#00D4FF] border-[#00D4FF]' : 'border-slate-500 bg-transparent group-hover:border-[#00D4FF]/50'}`}>
                                {isSelected && <Check size={10} className="text-[#041326]" />}
                              </div>
                              <span className={`text-[11px] ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{c}</span>
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={isSelected}
                                onChange={(e) => {
                                  const current = Array.isArray(foundation.country) ? foundation.country : (foundation.country ? [foundation.country] : []);
                                  if (e.target.checked) {
                                    setFoundation({...foundation, country: [...current, c]});
                                  } else {
                                    setFoundation({...foundation, country: current.filter(item => item !== c)});
                                  }
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>Service Location (Multi-Select)</label>
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mt-3 space-y-4">
                      {Object.entries(groupedServiceLocations).map(([category, items]) => (
                        <div key={category} className="space-y-2">
                          <div className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-wider sticky top-0 bg-[#06101D] py-1 z-10">{category}</div>
                          <div className="grid grid-cols-2 gap-2 pl-2">
                            {items.map(t => {
                              const isSelected = Array.isArray(foundation.serviceLocation) 
                                ? foundation.serviceLocation.includes(t) 
                                : foundation.serviceLocation === t;
                                
                              return (
                                <label key={t} className="flex items-center gap-2 cursor-pointer group">
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-[#00D4FF] border-[#00D4FF]' : 'border-slate-500 bg-transparent group-hover:border-[#00D4FF]/50'}`}>
                                    {isSelected && <Check size={8} className="text-[#041326]" />}
                                  </div>
                                  <span className={`text-[10.5px] leading-normal ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{t}</span>
                                  <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const current = Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation : (foundation.serviceLocation ? [foundation.serviceLocation] : []);
                                      if (e.target.checked) {
                                        setFoundation({...foundation, serviceLocation: [...current, t]});
                                      } else {
                                        setFoundation({...foundation, serviceLocation: current.filter(item => item !== t)});
                                      }
                                    }}
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <label className={labelClass}>Manual / Custom Location Entry</label>
                      <input 
                        type="text"
                        className={inputClass}
                        placeholder="Type custom location and press Enter"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              const currentLocs = Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation : [foundation.serviceLocation].filter(Boolean);
                              if (!currentLocs.includes(val)) {
                                setFoundation({...foundation, serviceLocation: [...currentLocs, val]});
                              }
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation : [foundation.serviceLocation]).filter(loc => loc && !serviceLocations.includes(loc)).map((customLoc, idx) => (
                          <div key={idx} className="bg-[#19A7C1]/20 text-[#00D4FF] text-[10px] px-2 py-1 rounded border border-[#19A7C1]/30 flex items-center gap-1">
                            {customLoc}
                            <button onClick={() => {
                              const currentLocs = Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation : [foundation.serviceLocation];
                              setFoundation({...foundation, serviceLocation: currentLocs.filter(l => l !== customLoc)});
                            }} className="hover:text-white"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
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
                      <input type="date" className={inputClass} value={foundation.effectiveDate || ''} onChange={e => setFoundation({...foundation, effectiveDate: e.target.value})} />
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Expiration Date</label>
                      <input type="date" className={inputClass} value={foundation.expirationDate || ''} onChange={e => setFoundation({...foundation, expirationDate: e.target.value})} />
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
                  
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>APPLICABLE LAW</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={jurisdiction.law} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'governingLaw',
                              fieldTitle: 'Applicable Law',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setJurisdiction({...jurisdiction, law: custom});
                                  setManuallyConfirmedFields(prev => ({ ...prev, law: true }));
                                }
                              }
                            });
                          } else {
                            setJurisdiction({...jurisdiction, law: e.target.value});
                            setManuallyConfirmedFields(prev => ({ ...prev, law: true }));
                          }
                        }}
                      >
                        {applicableLaws.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                        {!applicableLaws.includes(jurisdiction.law) && jurisdiction.law && (
                          <option value={jurisdiction.law}>{jurisdiction.law}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="law"
                      currentValue={jurisdiction.law}
                      options={currentRecs.law}
                      onAccept={(val) => setJurisdiction((prev: any) => ({ ...prev, law: val }))}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>ARBITRATION SEAT</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={jurisdiction.seat} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'arbitrationSeat',
                              fieldTitle: 'Arbitration Seat',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setJurisdiction({...jurisdiction, seat: custom});
                                }
                              }
                            });
                          } else {
                            setJurisdiction({...jurisdiction, seat: e.target.value});
                          }
                        }}
                      >
                        {arbitrationSeats.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                        {!arbitrationSeats.includes(jurisdiction.seat) && jurisdiction.seat && (
                          <option value={jurisdiction.seat}>{jurisdiction.seat}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg text-left">
                    <label className={labelClass}>ARBITRATION INSTITUTION</label>
                    <div className="relative">
                      <select 
                        className={selectClass} 
                        value={jurisdiction.institution} 
                        onChange={e => {
                          if (e.target.value === "___add_custom___") {
                            setCustomInputModal({
                              isOpen: true,
                              fieldId: 'arbitrationInstitution',
                              fieldTitle: 'Arbitration Institution',
                              value: '',
                              callback: (custom) => {
                                if (custom) {
                                  setJurisdiction({...jurisdiction, institution: custom});
                                  setContractFields({...contractFields, arbitrationRules: custom});
                                  setManuallyConfirmedFields(prev => ({ ...prev, arbitrationRules: true }));
                                }
                              }
                            });
                          } else {
                            setJurisdiction({...jurisdiction, institution: e.target.value});
                            setContractFields({...contractFields, arbitrationRules: e.target.value});
                            setManuallyConfirmedFields(prev => ({ ...prev, arbitrationRules: true }));
                          }
                        }}
                      >
                        {arbitrationInstitutions.map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                        {!arbitrationInstitutions.includes(jurisdiction.institution) && jurisdiction.institution && (
                          <option value={jurisdiction.institution}>{jurisdiction.institution}</option>
                        )}
                        <option value="___add_custom___" className="text-[#00D4FF] font-bold">+ ADD CUSTOM...</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                    <AIRecommendationHelper 
                      fieldName="arbitrationRules"
                      currentValue={jurisdiction.institution}
                      options={currentRecs.arbitrationRules}
                      onAccept={(val) => {
                        setJurisdiction((prev: any) => ({ ...prev, institution: val }));
                        setContractFields((prev: any) => ({ ...prev, arbitrationRules: val }));
                      }}
                      manuallyConfirmedFields={manuallyConfirmedFields}
                      setManuallyConfirmedFields={setManuallyConfirmedFields}
                    />
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>GOVERNING LANGUAGE</label>
                    <div className="relative">
                      <select className={selectClass} value={jurisdiction.language} onChange={e => setJurisdiction({...jurisdiction, language: e.target.value})}>
                        {governingLanguages.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>GOVERNING TIME ZONE</label>
                    <div className="relative">
                      <select className={selectClass} value={jurisdiction.timeZone} onChange={e => setJurisdiction({...jurisdiction, timeZone: e.target.value})}>
                        {governingTimeZones.map(l => <option key={l}>{l}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
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
                      <input className={inputClass} value={partyA.name || ''} onChange={e => setPartyA({...partyA, name: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Role in Agreement (e.g., Seller, Owner, Consultant)</label>
                      <input className={inputClass} value={partyA.role || ''} onChange={e => setPartyA({...partyA, role: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Authorized Representative Name (Authorized Signatory)</label>
                      <input className={inputClass} placeholder="e.g., Captain John Doe, Managing Director" value={partyA.representative || ''} onChange={e => setPartyA({...partyA, representative: e.target.value})} />
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
                      <input className={inputClass} type="email" value={partyA.email || ''} onChange={e => setPartyA({...partyA, email: e.target.value})} />
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
                      <input className={inputClass} value={partyB.name || ''} onChange={e => setPartyB({...partyB, name: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Role in Agreement (e.g., Buyer, Counterparty, Charterer)</label>
                      <input className={inputClass} value={partyB.role || ''} onChange={e => setPartyB({...partyB, role: e.target.value})} />
                    </div>

                    <div>
                      <label className={labelClass}>Authorized Representative Name (Authorized Signatory)</label>
                      <input className={inputClass} placeholder="e.g., Marcus Aurelius, Managing Director" value={partyB.representative || ''} onChange={e => setPartyB({...partyB, representative: e.target.value})} />
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
                      <input className={inputClass} type="email" value={partyB.email || ''} onChange={e => setPartyB({...partyB, email: e.target.value})} />
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

                  {additionalParties.map((party, idx) => (
                    <div key={idx} className="bg-[#0a1c34]/20 border border-white/10 p-5 rounded-lg space-y-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-white/10/50 pb-1.5 opacity-90 flex justify-between items-center">
                        <span>Additional Party {idx + 1}</span>
                        <button 
                          onClick={() => setAdditionalParties(additionalParties.filter((_, i) => i !== idx))}
                          className="text-rose-450 hover:text-rose-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div>
                        <label className={labelClass}>Entity Name / Authorized Corporate Name</label>
                        <input className={inputClass} value={party.name || ''} onChange={e => {
                          const newParties = [...additionalParties];
                          newParties[idx].name = e.target.value;
                          setAdditionalParties(newParties);
                        }} />
                      </div>

                      <div>
                        <label className={labelClass}>Role in Agreement (e.g., Broker, Guarantor, Agent)</label>
                        <input className={inputClass} value={party.role || ''} onChange={e => {
                          const newParties = [...additionalParties];
                          newParties[idx].role = e.target.value;
                          setAdditionalParties(newParties);
                        }} />
                      </div>

                      <div>
                        <label className={labelClass}>Official Registered Address / Main Office</label>
                        <textarea
                          className="w-full h-16 bg-[#0a1c34]/20 border border-white/10 rounded-lg p-3 text-[13px] text-white placeholder-slate-500 focus:border-[#19A7C1] outline-none transition-all resize-none"
                          value={party.address || ""}
                          onChange={e => {
                            const newParties = [...additionalParties];
                            newParties[idx].address = e.target.value;
                            setAdditionalParties(newParties);
                          }}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Legal Registration / ID / Passport Number</label>
                        <input 
                          className={inputClass} 
                          value={party.idNumber || ""} 
                          onChange={e => {
                            const newParties = [...additionalParties];
                            newParties[idx].idNumber = e.target.value;
                            setAdditionalParties(newParties);
                          }} 
                        />
                      </div>
                      
                      <div>
                        <label className={labelClass}>Primary Email Address for Execution</label>
                        <input className={inputClass} type="email" value={party.email || ''} onChange={e => {
                          const newParties = [...additionalParties];
                          newParties[idx].email = e.target.value;
                          setAdditionalParties(newParties);
                        }} />
                      </div>
                      
                      <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input 
                            type="checkbox" 
                            className="peer appearance-none w-4 h-4 border-2 border-slate-500 rounded-sm checked:bg-[#19A7C1] checked:border-[#19A7C1] transition-all cursor-pointer"
                            checked={party.confirmEmail || false}
                            onChange={(e) => {
                              const newParties = [...additionalParties];
                              newParties[idx].confirmEmail = e.target.checked;
                              setAdditionalParties(newParties);
                            }}
                          />
                          <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                        <span className="text-[10px] leading-relaxed text-slate-400 group-hover:text-slate-300 font-sans">
                          I declare that the email addresses listed above are the officially authorized communication channels for this party.
                        </span>
                      </label>
                    </div>
                  ))}

                  <button
                    onClick={() => setAdditionalParties([...additionalParties, { name: "", role: "Broker", email: "", address: "", idNumber: "", confirmEmail: true, additionalEmails: [] }])}
                    className="w-full py-3 bg-[#0a1c34]/40 hover:bg-[#0a1c34]/60 border border-white/10 hover:border-[#19A7C1]/50 rounded-lg text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    + Add Additional Party
                  </button>
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
                          value={newParticipant.name || ''}
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
                            value={newParticipant.role || ''}
                            onChange={e => setNewParticipant({...newParticipant, role: e.target.value})}
                            className="w-full h-8 bg-[#00050d] border border-white/10 rounded px-2.5 text-[10.5px] text-white focus:border-[#19A7C1] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                          <input 
                            type="email" 
                            placeholder="surveyor@bureauveritas.com"
                            value={newParticipant.contact || ''}
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
                          value={newCustomDocType || ''}
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

             {activeSection === "Deliverables" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>DELIVERABLES & SCOPE</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Scope of Goods & Services</label>
                    <textarea className={`${inputClass} min-h-[140px] leading-relaxed py-2`} value={contractFields.deliverables || ''} onChange={e => handleFieldUpdate('deliverables', e.target.value)} onFocus={() => handleFieldFocus('deliverables')} onBlur={() => handleFieldBlur('deliverables')} />
                    <FieldAiAssistant label="Scope of Goods & Services" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('deliverables', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Key Milestones & Project Timelines</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.milestones || ''} onChange={e => handleFieldUpdate('milestones', e.target.value)} onFocus={() => handleFieldFocus('milestones')} onBlur={() => handleFieldBlur('milestones')} />
                    <FieldAiAssistant label="Key Milestones & Project Timelines" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('milestones', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {activeSection === "Commercial Terms" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>COMMERCIAL TERMS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Base Commercial Formula & Pricing Terms</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.commercialTerms || ''} onChange={e => handleFieldUpdate('commercialTerms', e.target.value)} onFocus={() => handleFieldFocus('commercialTerms')} onBlur={() => handleFieldBlur('commercialTerms')} />
                    <FieldAiAssistant label="Base Commercial Formula & Pricing Terms" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('commercialTerms', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Surcharges / Demurrage Limits</label>
                    <input className={inputClass} value={contractFields.surcharges || ''} onChange={e => handleFieldUpdate('surcharges', e.target.value)} onFocus={() => handleFieldFocus('surcharges')} onBlur={() => handleFieldBlur('surcharges')} />
                    <FieldAiAssistant label="Surcharges / Demurrage Limits" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('surcharges', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {activeSection === "Payment Terms" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>PAYMENT TERMS & CONFIG</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Payment Terms, Net Limits & Invoicing Procedures</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.paymentTerms || ''} onChange={e => handleFieldUpdate('paymentTerms', e.target.value)} onFocus={() => handleFieldFocus('paymentTerms')} onBlur={() => handleFieldBlur('paymentTerms')} />
                    <FieldAiAssistant label="Payment Terms, Net Limits & Invoicing Procedures" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('paymentTerms', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Supported Payment Execution Methods</label>
                    <input className={inputClass} value={contractFields.paymentMethod || ''} onChange={e => handleFieldUpdate('paymentMethod', e.target.value)} onFocus={() => handleFieldFocus('paymentMethod')} onBlur={() => handleFieldBlur('paymentMethod')} />
                    <FieldAiAssistant label="Supported Payment Execution Methods" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('paymentMethod', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <label className={labelClass}>Global Banking Information</label>
                      <p className="text-[10px] text-slate-400 font-manrope">Enter accepted bank account details for both parties (Stripe & standard transfers compatible).</p>
                    </div>
                    <button
                      onClick={() => setShowBankDetailsModal(true)}
                      className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold tracking-wider uppercase text-[10px] px-6 py-2.5 rounded-lg hover:bg-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] whitespace-nowrap"
                    >
                      Configure Bank Accounts
                    </button>
                  </div>
                </div>
             )}

             {activeSection === "Delivery Terms" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>DELIVERY & CARGO LOGISTICS</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Target Incoterms (2020)</label>
                      <input className={inputClass} value={contractFields.incoterms || ''} onChange={e => handleFieldUpdate('incoterms', e.target.value)} onFocus={() => handleFieldFocus('incoterms')} onBlur={() => handleFieldBlur('incoterms')} />
                      <FieldAiAssistant label="Target Incoterms (2020)" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('incoterms', val)} hasPaid={hasPaidAssistantFee} />
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Discharge Location / Port</label>
                      <input className={inputClass} value={contractFields.deliveryLocation || ''} onChange={e => handleFieldUpdate('deliveryLocation', e.target.value)} onFocus={() => handleFieldFocus('deliveryLocation')} onBlur={() => handleFieldBlur('deliveryLocation')} />
                      <FieldAiAssistant label="Discharge Location / Port" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('deliveryLocation', val)} hasPaid={hasPaidAssistantFee} />
                    </div>
                  </div>
                </div>
             )}

             {activeSection === "Warranty" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>WARRANTY & PERFORMANCE SLAS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Standard Warranty Period</label>
                    <input className={inputClass} value={contractFields.warrantyPeriod || ''} onChange={e => handleFieldUpdate('warrantyPeriod', e.target.value)} onFocus={() => handleFieldFocus('warrantyPeriod')} onBlur={() => handleFieldBlur('warrantyPeriod')} />
                    <FieldAiAssistant label="Standard Warranty Period" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('warrantyPeriod', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Performance Execution Warranty Scope</label>
                    <textarea className={`${inputClass} min-h-[110px] leading-relaxed py-2`} value={contractFields.warrantyScope || ''} onChange={e => handleFieldUpdate('warrantyScope', e.target.value)} onFocus={() => handleFieldFocus('warrantyScope')} onBlur={() => handleFieldBlur('warrantyScope')} />
                    <FieldAiAssistant label="Performance Execution Warranty Scope" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('warrantyScope', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {activeSection === "Liability" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>LIABILITY COVENANTS</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Total Liability Limit Cap</label>
                      <input className={inputClass} value={contractFields.liabilityLimit || ''} onChange={e => handleFieldUpdate('liabilityLimit', e.target.value)} onFocus={() => handleFieldFocus('liabilityLimit')} onBlur={() => handleFieldBlur('liabilityLimit')} />
                      <FieldAiAssistant label="Total Liability Limit Cap" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('liabilityLimit', val)} hasPaid={hasPaidAssistantFee} />
                    </div>
                    <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                      <label className={labelClass}>Consequential Damage Exemptions</label>
                      <input className={inputClass} value={contractFields.consequentialDamages || ''} onChange={e => handleFieldUpdate('consequentialDamages', e.target.value)} onFocus={() => handleFieldFocus('consequentialDamages')} onBlur={() => handleFieldBlur('consequentialDamages')} />
                      <FieldAiAssistant label="Consequential Damage Exemptions" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('consequentialDamages', val)} hasPaid={hasPaidAssistantFee} />
                    </div>
                  </div>
                </div>
             )}

             {activeSection === "Confidentiality" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>CONFIDENTIALITY POLICY</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>NDA Non-Disclosure Duration</label>
                    <input className={inputClass} value={contractFields.confidentialityDuration || ''} onChange={e => handleFieldUpdate('confidentialityDuration', e.target.value)} onFocus={() => handleFieldFocus('confidentialityDuration')} onBlur={() => handleFieldBlur('confidentialityDuration')} />
                    <FieldAiAssistant label="NDA Non-Disclosure Duration" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('confidentialityDuration', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {activeSection === "Termination" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>TERMINATION & CURE DEFICITS</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Termination Notice Periods & Special Provisions</label>
                    <textarea className={`${inputClass} min-h-[130px] leading-relaxed py-2`} value={contractFields.terminationNotice || ''} onChange={e => handleFieldUpdate('terminationNotice', e.target.value)} onFocus={() => handleFieldFocus('terminationNotice')} onBlur={() => handleFieldBlur('terminationNotice')} />
                    <FieldAiAssistant label="Termination Notice Periods & Special Provisions" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('terminationNotice', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {activeSection === "Arbitration" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className={sectionTitleClass}>ARBITRATION RESOLUTION RULES</h2>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-[#00D4FF] uppercase bg-[#00D4FF]/10 px-2.5 py-1.5 rounded border border-[#00D4FF]/30 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={enabledPdfSections.includes("Arbitration")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (!enabledPdfSections.includes("Arbitration")) {
                              setEnabledPdfSections([...enabledPdfSections, "Arbitration"]);
                            }
                          } else {
                            setEnabledPdfSections(enabledPdfSections.filter(s => s !== "Arbitration"));
                          }
                        }}
                        className="rounded border-white/20 text-[#00D4FF] focus:ring-0 cursor-pointer w-3.5 h-3.5 bg-slate-900"
                      />
                      <span>Include in PDF</span>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    This section defines custom arbitration procedures, including maritime arbitration tribunals. This page/clause is <strong>optional</strong> and can be toggled on or off from the document compile flow using the switch above.
                  </p>

                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Custom Arbitration Rules & Framework Procedures</label>
                    <textarea className={`${inputClass} min-h-[120px] leading-relaxed py-2`} value={contractFields.arbitrationRules || ''} onChange={e => handleFieldUpdate('arbitrationRules', e.target.value)} onFocus={() => handleFieldFocus('arbitrationRules')} onBlur={() => handleFieldBlur('arbitrationRules')} />
                    <FieldAiAssistant label="Custom Arbitration Rules & Framework Procedures" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('arbitrationRules', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {!coreSectionsPre.includes(activeSection) && !coreSectionsPost.includes(activeSection) && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <input 
                       className="bg-transparent text-[11px] text-[#00D4FF] font-bold uppercase tracking-widest font-manrope outline-none w-[300px] border-b border-dashed border-[#00D4FF]/30 focus:border-[#00D4FF]"
                       value={activeSection}
                       onChange={(e) => {
                          const newTitle = e.target.value;
                          setClauses(prev => prev.map(c => c.title === activeSection ? { ...c, title: newTitle } : c));
                          setActiveSection(newTitle);
                       }}
                    />
                    <div className="flex items-center gap-3">
                       <label className="flex items-center gap-2 text-[10px] font-bold text-[#00D4FF] uppercase bg-[#00D4FF]/10 px-2.5 py-1.5 rounded border border-[#00D4FF]/30 cursor-pointer select-none">
                         <input 
                           type="checkbox" 
                           checked={enabledPdfSections.includes(activeClause?.id || '')}
                           onChange={(e) => {
                              const clauseId = activeClause?.id;
                              if (e.target.checked && clauseId) {
                                setEnabledPdfSections(prev => [...prev, clauseId]);
                              } else if (clauseId) {
                                setEnabledPdfSections(prev => prev.filter(s => s !== clauseId));
                              }
                           }}
                           className="rounded border-white/20 text-[#00D4FF] focus:ring-0 cursor-pointer w-3.5 h-3.5 bg-slate-900"
                         />
                         <span>Include in PDF</span>
                       </label>
                       <button
                         onClick={() => {
                            if (window.confirm("Delete this custom section?")) {
                               const clauseId = activeClause?.id;
                               if (clauseId) {
                                 setClauses(prev => prev.filter(c => c.id !== clauseId));
                                 setEnabledPdfSections(prev => prev.filter(s => s !== clauseId));
                                 setActiveSection(coreSectionsPre[0]);
                               }
                            }
                         }}
                         className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition-colors"
                         title="Delete Section"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Custom Clause Content</label>
                    <textarea 
                      className={`${inputClass} min-h-[300px] leading-relaxed py-2 font-serif text-sm`} 
                      value={activeClause?.content || ''} 
                      onChange={e => {
                         const val = e.target.value;
                         setClauses(prev => prev.map(c => c.id === activeClause?.id ? { ...c, content: val, status: 'v2 Seller Revision' as any } : c));
                      }} 
                    />
                  </div>
                </div>
             )}

             {activeSection === "Signatures" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>DIGITAL SIGNATURE & APPROVAL HUB</h2>
                  
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-xl">
                    <label className={labelClass}>Signature Method</label>
                    <div className="relative">
                      <select className={selectClass} value={contractFields.signatureMethod} onChange={e => handleFieldUpdate('signatureMethod', e.target.value)}>
                        {signatureMethods.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#19A7C1]">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Party A (Seller) signing container */}
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <label className="text-[10px] text-[#00D4FF] font-bold uppercase tracking-widest block font-manrope">PARTY A - {partyA.role ? partyA.role.toUpperCase() : 'SELLER'} SIGNATORY</label>
                        <h3 className="text-sm font-bold text-white mt-1">{partyA.name}</h3>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{partyA.email}</span>
                      </div>
                      <div>
                        {partyASigned ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Approved & Signed
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </div>

                    {partyASigned ? (
                      <div className="bg-black/30 border border-emerald-500/15 rounded-xl p-4 flex flex-col items-center justify-center relative group">
                        {/* Organic Simulated Signature */}
                        <svg className="w-48 h-12 text-emerald-400/90" viewBox="0 0 120 40" fill="none" stroke="currentColor">
                          <path d="M 10 32 C 15 20, 25 8, 35 15 C 45 22, 38 35, 48 30 C 58 25, 62 10, 72 18 C 82 26, 88 12, 105 15 Q 110 18, 115 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M 20 22 C 30 18, 55 12, 85 14" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                        <span className="text-[8px] font-mono text-emerald-500/60 mt-2 uppercase tracking-wide">
                          SHA-256 SECURED LEDGER SIGNATURE RECORD
                        </span>
                        <span className="text-[7px] font-mono text-slate-500 mt-0.5">
                          TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 194.22.81.41
                        </span>
                        {!isExecuted && (
                          <button 
                            onClick={() => setPartyASigned(false)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-white px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setPartyASigned(true)}
                        className="w-full bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30 hover:border-[#00D4FF]/50 text-[#00D4FF] font-bold text-[10px] tracking-wider uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-inner"
                      >
                        ✍ CLICK TO DIGITALLY APPROVE & SIGN AS {partyA.role ? partyA.role.toUpperCase() : 'SELLER'}
                      </button>
                    )}
                  </div>

                  {/* Party B (Buyer) signing container */}
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <label className="text-[10px] text-[#00D4FF] font-bold uppercase tracking-widest block font-manrope">PARTY B - {partyB.role ? partyB.role.toUpperCase() : 'BUYER'} SIGNATORY</label>
                        <h3 className="text-sm font-bold text-white mt-1">{partyB.name}</h3>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{partyB.email}</span>
                      </div>
                      <div>
                        {partyBSigned ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Approved & Signed
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </div>

                    {partyBSigned ? (
                      <div className="bg-black/30 border border-emerald-500/15 rounded-xl p-4 flex flex-col items-center justify-center relative group">
                        {/* Organic Simulated Signature */}
                        <svg className="w-48 h-12 text-teal-400/90" viewBox="0 0 120 40" fill="none" stroke="currentColor">
                          <path d="M 8 28 C 18 10, 22 35, 36 28 C 50 20, 45 8, 58 12 C 71 16, 75 32, 88 18 C 101 4, 105 28, 114 25" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M 15 25 Q 40 20 100 24" strokeWidth="0.8" strokeLinecap="round" />
                        </svg>
                        <span className="text-[8px] font-mono text-teal-400/60 mt-2 uppercase tracking-wide">
                          SHA-256 SECURED LEDGER SIGNATURE RECORD
                        </span>
                        <span className="text-[7px] font-mono text-slate-500 mt-0.5">
                          TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 81.109.112.59
                        </span>
                        {!isExecuted && (
                          <button 
                            onClick={() => setPartyBSigned(false)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-white px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setPartyBSigned(true)}
                        className="w-full bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30 hover:border-[#00D4FF]/50 text-[#00D4FF] font-bold text-[10px] tracking-wider uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-inner"
                      >
                        ✍ CLICK TO DIGITALLY APPROVE & SIGN AS {partyB.role ? partyB.role.toUpperCase() : 'BUYER'}
                      </button>
                    )}
                  </div>

                  {/* Additional Signatories */}
                  {additionalParties.map((party, idx) => {
                    const isPartySigned = additionalSigned[party.id || idx];
                    return (
                      <div key={idx} className="bg-[#0a1c34]/20 border border-white/10 p-5 rounded-xl space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <label className="text-[10px] text-[#00D4FF] font-bold uppercase tracking-widest block font-manrope">
                              ADDITIONAL PARTY {idx + 1} - {party.role || 'Witness'}
                            </label>
                            <h3 className="text-sm font-bold text-white mt-1">{party.name || 'Unnamed Witness'}</h3>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{party.email || 'No email declared'}</span>
                          </div>
                          <div>
                            {isPartySigned ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Approved & Signed
                              </span>
                            ) : (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Pending Approval
                              </span>
                            )}
                          </div>
                        </div>

                        {isPartySigned ? (
                          <div className="bg-black/30 border border-emerald-500/15 rounded-xl p-4 flex flex-col items-center justify-center relative group">
                            <svg className="w-48 h-12 text-cyan-400/90" viewBox="0 0 120 40" fill="none" stroke="currentColor">
                              <path d="M 12 25 Q 35 15, 60 30 T 110 20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M 30 12 C 40 25, 45 5, 55 22" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="text-[8px] font-mono text-cyan-400/60 mt-2 uppercase tracking-wide">
                              SHA-256 SECURED LEDGER SIGNATURE RECORD
                            </span>
                            <span className="text-[7px] font-mono text-slate-500 mt-0.5">
                              TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 104.18.23.95
                            </span>
                            {!isExecuted && (
                              <button 
                                onClick={() => setAdditionalSigned(prev => ({ ...prev, [party.id || idx]: false }))}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-white px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setAdditionalSigned(prev => ({ ...prev, [party.id || idx]: true }))}
                            className="w-full bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/30 hover:border-[#00D4FF]/50 text-[#00D4FF] font-bold text-[10px] tracking-wider uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-inner"
                          >
                            ✍ CLICK TO DIGITALLY APPROVE & SIGN AS {party.role?.toUpperCase() || 'WITNESS'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
             )}

             {activeSection === "Annexes" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>ANNEXES & SCHEDULE LAYOUT</h2>
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-lg">
                    <label className={labelClass}>Linked Supplementary Document Listings & Appendices</label>
                    <textarea className={`${inputClass} min-h-[140px] leading-relaxed py-2`} value={contractFields.annexes || ''} onChange={e => handleFieldUpdate('annexes', e.target.value)} onFocus={() => handleFieldFocus('annexes')} onBlur={() => handleFieldBlur('annexes')} />
                    <FieldAiAssistant label="Linked Supplementary Document Listings & Appendices" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('annexes', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {activeSection === "Verification" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>IDENTITY VERIFICATION & ENCRYPTION</h2>
                  
                  <div className="bg-[#0a1c34]/20 border border-white/10 p-4 rounded-xl space-y-4 font-manrope">
                    <div>
                      <label className={labelClass}>Active Ledger Verification Reference</label>
                      <input className={inputClass} value={contractFields.verificationCode || ''} onChange={e => handleFieldUpdate('verificationCode', e.target.value)} />
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
                    <textarea className={`${inputClass} min-h-[140px] font-manrope text-emerald-400 text-[10px] leading-relaxed tracking-wider py-2`} value={contractFields.auditTrail || ''} onChange={e => handleFieldUpdate('auditTrail', e.target.value)} />
                    <FieldAiAssistant label="Verified Digital Ledger History (Chronological Logs)" onGenerate={handleFieldAssistantGenerate} onApply={(val) => handleFieldUpdate('auditTrail', val)} hasPaid={hasPaidAssistantFee} />
                  </div>
                </div>
             )}

             {activeSection === "Contract AI Advisor" && (
                <div className="space-y-6 animate-in fade-in">
                  <h2 className={sectionTitleClass}>CONTRACT AI ADVISOR</h2>
                  <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 p-4 rounded text-[#00D4FF] text-[10px] leading-relaxed tracking-wider font-bold mb-6">
                    <Cpu size={16} className="mb-2" />
                    AI-generated analyses are based solely on the contents of the analyzed contract and are provided for informational and operational assistance only.
                    <br/><br/>
                    The Platform is not a law firm and does not provide legal advice, legal opinions or legal representation.
                    <br/><br/>
                    The AI does not intentionally generate, assume or infer contractual facts that are not present in the analyzed document.
                    <br/><br/>
                    Users remain solely responsible for reviewing their agreements and obtaining independent legal advice where appropriate.
                  </div>
                  
                  {aiState.task ? (
                     <div className="bg-[#0a1c34]/20 border border-white/10 p-6 rounded-lg text-center animate-in fade-in zoom-in-95">
                        <Cpu size={32} className={`mx-auto mb-4 ${aiState.status === 'loading' ? 'text-[#00D4FF] animate-pulse' : 'text-emerald-400'}`} />
                        <div className="text-[12px] font-bold text-white uppercase tracking-widest mb-2">{aiState.task}</div>
                        {aiState.status === 'loading' ? (
                           <div className="text-[10px] text-[#00D4FF] uppercase tracking-widest">Processing request...</div>
                        ) : (
                           <div className="mt-4">
                              <div id="ai-analysis-content" className="text-[13px] font-inter text-slate-300 bg-[#041326]/40 p-8 rounded border border-white/10 text-left leading-[1.7] max-w-[760px] mx-auto overflow-hidden min-h-[500px]">
                                <Markdown
                                  components={{
                                    h1: ({node, ...props}) => <h1 className="text-[18px] font-bold text-white mt-8 mb-4 pb-2 border-b border-white/10 tracking-wide" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-[15px] font-semibold text-[#00D4FF] mt-6 mb-3 tracking-wide" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-[13px] font-medium text-white mt-5 mb-2 uppercase tracking-widest" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-5 text-slate-300 font-light leading-[1.85] tracking-wide" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-6 space-y-2.5 text-slate-300 font-light tracking-wide leading-[1.85]" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-6 space-y-2.5 text-slate-300 font-light tracking-wide leading-[1.85]" {...props} />,
                                    li: ({node, ...props}) => <li className="pl-2 marker:text-[#00D4FF]" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-semibold text-white bg-[#00D4FF]/10 px-1 py-0.5 rounded border-b border-[#00D4FF]/30" {...props} />,
                                    em: ({node, ...props}) => <em className="italic text-slate-400 font-medium" {...props} />,
                                    a: ({node, ...props}) => <a className="text-[#00D4FF] underline decoration-[#00D4FF]/40 underline-offset-4 hover:decoration-[#00D4FF] font-medium" {...props} />,
                                    hr: ({node, ...props}) => <hr className="border-white/10 my-8" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-[#00D4FF] pl-5 py-2 my-5 text-slate-300 bg-[#00D4FF]/5 rounded-r italic font-light" {...props} />,
                                    code: ({node, inline, ...props}: any) => inline 
                                      ? <code className="bg-[#040B18] px-1.5 py-0.5 rounded text-[11px] font-mono text-[#00D4FF] border border-white/5" {...props} />
                                      : <pre className="bg-[#040B18] p-5 rounded-lg my-5 overflow-x-auto border border-white/10 shadow-inner"><code className="text-[12px] font-mono text-slate-300 leading-relaxed" {...props} /></pre>
                                  }}
                                >
                                  {aiState.result}
                                </Markdown>
                              </div>
                              <div className="mt-6 flex flex-wrap justify-center gap-4">
                                <button onClick={() => setAiState({task: null, status: 'idle'})} className="text-[10px] text-[#00D4FF] uppercase tracking-widest font-bold hover:text-white transition-colors border border-[#00D4FF]/30 hover:bg-[#00D4FF]/10 py-2.5 px-5 rounded-lg flex items-center gap-2">
                                  <ChevronLeft size={14} /> Return to Advisor
                                </button>
                                <button onClick={() => {
                                  if (aiState.result) {
                                    navigator.clipboard.writeText(aiState.result);
                                    alert("Analysis copied to clipboard");
                                  }
                                }} className="text-[10px] text-slate-400 uppercase tracking-widest font-bold hover:text-white transition-colors border border-white/10 hover:bg-white/5 py-2.5 px-5 rounded-lg flex items-center gap-2">
                                  Copy Analysis
                                </button>
                                <button 
                                  onClick={() => {
                                    if (!aiState.result) return;
                                    
                                    const clauseTitleToId: {[key: string]: string} = {
                                      "Parties": "clause_parties",
                                      "Commercial Foundation": "clause_commercial_foundation",
                                      "Deliverables": "clause_deliverables",
                                      "Commercial Terms": "clause_commercial_terms",
                                      "Payment Terms": "clause_payment_terms",
                                      "Delivery Terms": "clause_delivery_terms",
                                      "Warranty": "clause_warranty",
                                      "Liability": "clause_liability",
                                      "Confidentiality": "clause_confidentiality",
                                      "Termination": "clause_termination",
                                      "Jurisdiction": "clause_jurisdiction",
                                      "Arbitration": "clause_arbitration",
                                      "Execution": "clause_execution",
                                      "Annexes": "clause_annexes",
                                      "Broker": "clause_broker"
                                    };

                                    let matchedClause = clauses.find(c => aiState.result?.toLowerCase().includes(c.title.toLowerCase().split('.')[0]));
                                    
                                    if (!matchedClause) {
                                      for (const [kw, id] of Object.entries(clauseTitleToId)) {
                                        if (aiState.result?.toLowerCase().includes(kw.toLowerCase())) {
                                          matchedClause = clauses.find(c => c.id === id);
                                          if (matchedClause) break;
                                        }
                                      }
                                    }

                                    if (matchedClause) {
                                      const updatedContent = aiState.result;
                                      setClauses(prev => prev.map(c => c.id === matchedClause!.id ? { ...c, content: updatedContent, status: 'v2 Seller Revision' as any } : c));
                                      
                                      if (matchedClause.id === 'clause_commercial') setContractFields(prev => ({ ...prev, commercialTerms: updatedContent }));
                                      if (matchedClause.id === 'clause_delivery') setContractFields(prev => ({ ...prev, deliverables: updatedContent }));
                                      if (matchedClause.id === 'clause_warranty') setContractFields(prev => ({ ...prev, warrantyScope: updatedContent }));
                                      if (matchedClause.id === 'clause_liability') setContractFields(prev => ({ ...prev, liabilityLimit: updatedContent }));
                                      if (matchedClause.id === 'clause_disputes') setContractFields(prev => ({ ...prev, arbitrationRules: updatedContent }));
                                      
                                      alert(`AI suggestions successfully synchronized with: ${matchedClause.title}`);
                                    } else {
                                      setContractFields(prev => ({ ...prev, annexes: (prev.annexes || '') + '\n\n--- AI ADVISOR ANALYSIS ---\n' + aiState.result }));
                                      alert("AI analysis appended to Annexes (No exact clause match detected).");
                                    }
                                  }}
                                  className="text-[10px] bg-emerald-500/20 text-emerald-400 uppercase tracking-widest font-bold hover:bg-emerald-500/40 border border-emerald-500/30 py-2.5 px-5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all"
                                >
                                  <Check size={14} /> Apply to Contract
                                </button>
                                <button onClick={() => {
                                  const content = document.getElementById("ai-analysis-content")?.innerHTML;
                                  if (!content) return;
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                    printWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>Contract AI Analysis</title>
                                          <style>
                                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                                            body { font-family: 'Inter', sans-serif; line-height: 1.85; background-color: #041326; color: #cbd5e1; max-width: 800px; margin: 120px auto; padding: 40px; font-size: 14px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-weight: 300; }
                                            h1 { font-size: 20px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-top: 32px; margin-bottom: 20px; color: #ffffff; font-weight: 700; letter-spacing: 0.025em; }
                                            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 12px; color: #00D4FF; font-weight: 600; letter-spacing: 0.025em; }
                                            h3 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; color: #ffffff; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
                                            ul, ol { padding-left: 24px; margin-bottom: 16px; color: #cbd5e1; }
                                            li { margin-bottom: 8px; }
                                            li::marker { color: #00D4FF; }
                                            p { margin-bottom: 16px; color: #cbd5e1; }
                                            hr { border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0; }
                                            strong { font-weight: 600; color: #ffffff; background-color: rgba(0, 212, 255, 0.1); padding: 2px 4px; border-radius: 4px; border-bottom: 1px solid rgba(0,212,255,0.3); }
                                            em { font-style: italic; color: #94a3b8; font-weight: 500; }
                                            a { color: #00D4FF; text-decoration: underline; text-decoration-color: rgba(0,212,255,0.4); text-underline-offset: 4px; font-weight: 500; }
                                            blockquote { border-left: 4px solid #00D4FF; padding-left: 16px; margin: 16px 0; color: #cbd5e1; background-color: rgba(0,212,255,0.05); padding: 8px 16px; border-radius: 0 8px 8px 0; font-style: italic; font-weight: 300; }
                                            pre { background: rgba(4,11,24,1); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
                                            code { font-family: monospace; font-size: 12px; color: #00D4FF; }
                                            pre code { color: #cbd5e1; line-height: 1.7; }
                                            @media print {
                                              body { margin: 40px auto; background-color: white !important; color: black !important; border: none; }
                                              h1, h2, h3, p, li, strong, blockquote, div { color: black !important; }
                                              h1 { border-bottom: 2px solid rgba(0,0,0,0.1) !important; page-break-before: always; break-before: page; margin-top: 0; }
                                              h1:first-of-type { page-break-before: auto; break-before: auto; }
                                              h2 { page-break-after: avoid; break-after: avoid; margin-top: 32px; }
                                              h3 { page-break-after: avoid; break-after: avoid; }
                                              p, li, blockquote, pre { page-break-inside: avoid; break-inside: avoid; }
                                              strong { background-color: transparent !important; color: black !important; border-bottom: 1px solid rgba(0,0,0,0.2) !important; }
                                              blockquote { background-color: #f1f5f9 !important; border-left: 4px solid #475569 !important; color: #334155 !important; }
                                              h2, a, code, li::marker { color: #0f172a !important; }
                                              pre { background-color: #f8fafc !important; border: 1px solid #e2e8f0 !important; }
                                              pre code { color: #0f172a !important; }
                                              hr { border-top: 1px solid rgba(0,0,0,0.1) !important; }
                                            }
                                          </style>
                                        </head>
                                        <body>
                                          ${content}
                                          <script>
                                            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
                                          </script>
                                        </body>
                                      </html>
                                    `);
                                    printWindow.document.close();
                                  }
                                }} className="text-[10px] text-purple-400 uppercase tracking-widest font-bold hover:text-white transition-colors border border-purple-400/30 hover:bg-purple-400/10 py-2.5 px-5 rounded-lg flex items-center gap-2">
                                  <Printer size={14} /> Print / Export PDF
                                </button>
                              </div>
                           </div>
                        )}
                     </div>
                  ) : (
                    <div className="grid gap-3">
                      {["Clause Review", "Risk Detection", "Executive Summary", "Missing Clause Detection", "Jurisdiction Analysis", "Liability Analysis", "Compliance Review", "Sanctions Screening", "Redline Analysis", "Contract Summary"].map((f) => (
                        <button key={f} onClick={() => runAdvisor(f)} className="text-left bg-[#0a1c34]/20 border border-white/10 p-4 rounded hover:border-[#00D4FF]/50 transition-colors group">
                          <div className="text-[11px] font-bold text-white uppercase tracking-widest">{f}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 group-hover:text-[#00D4FF]">Initialize Process <ArrowRight size={12} className="inline"/></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
             )}
             </div>

             {/* Section Completion & Next action */}
             <div className="pt-8 pb-4 mt-auto">
               {manuallyCompletedSections.includes(activeSection) ? (
                 <button 
                   onClick={() => setManuallyCompletedSections(manuallyCompletedSections.filter(s => s !== activeSection))}
                   className="ml-auto flex items-center gap-2 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/30 hover:border-[#F59E0B] text-[#F59E0B] hover:text-white transition-all text-[10px] font-manrope font-bold tracking-widest uppercase py-2.5 px-5 rounded-lg cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                 >
                   <Unlock size={14} /> UNLOCK FOR REVISION
                 </button>
               ) : (
                 <button 
                   onClick={() => {
                     setManuallyCompletedSections([...manuallyCompletedSections, activeSection]);
                     const currentIndex = sections.indexOf(activeSection);
                     if (currentIndex < sections.length - 1) {
                       setActiveSection(sections[currentIndex + 1]);
                     }
                   }}
                   className="ml-auto flex items-center gap-2 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 hover:border-[#10B981] text-[#10B981] hover:text-white transition-all text-[10px] font-manrope font-bold tracking-widest uppercase py-2.5 px-5 rounded-lg cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                 >
                   <Lock size={14} /> LOCK & CONFIRM SECTION
                 </button>
               )}
             </div>

          </div>

          {/* 🌟 Persistent Fixed Primary Actions Dock */}
          {activeClause && (
            <div id="persistent-clause-actions-dock" className="shrink-0 bg-[#161c28] border-t border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-25">
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  activeClause.status.includes('Approved') || activeClause.status.includes('Signed') 
                    ? 'bg-emerald-500' 
                    : 'bg-amber-500'
                }`} />
                <div>
                  <div className="text-[10px] font-bold text-slate-250 uppercase tracking-widest font-manrope">Primary Clause Control</div>
                  <span className="text-[8px] text-slate-400 font-mono">WORKSPACE STATE: <span className="text-[#00D4FF] font-bold">{activeClause.status}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* APPROVE */}
                <button
                   onClick={() => handleToolbarAction('approve', activeClause)}
                   className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-manrope font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm shadow-emerald-950/20"
                   title="Approve and finalize current clause text"
                >
                  <Check size={12} strokeWidth={2.5} /> Approve Clause
                </button>

                {/* SEND TO AGREEMENT */}
                <button
                   onClick={() => handleToolbarAction('send_to_agreement', activeClause)}
                   className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/25 border border-[#00D4FF]/40 text-[#00D4FF] text-[10px] font-manrope font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm shadow-[#00D4FF]/5"
                   title="Sync modifications to live preview and PDF document"
                >
                  <Send size={12} strokeWidth={2.5} /> Send to Agreement
                </button>
              </div>
            </div>
          )}
          </div> {/* Closes main workspace content wrapper */}

          {/* Collapsible History Sidebar */}
          {showHistorySidebar && (
            <div className="w-[280px] border-l border-[#2B3347] h-full flex flex-col bg-[#202636] shrink-0 animate-in slide-in-from-right duration-300">
              <div className="h-12 border-b border-[#2B3347] px-4 flex items-center justify-between shrink-0 bg-[#2B3347]">
                <span className="text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-manrope">
                  <History size={12} className="text-[#00D4FF]" /> Clause Revision History
                </span>
                <button onClick={() => setShowHistorySidebar(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar custom-scrollbar bg-[#171B26]">
                {revisions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 font-manrope">
                    <History size={24} className="opacity-30 mb-2" />
                    <p className="text-[11px] font-semibold text-slate-350">No edits recorded yet</p>
                    <p className="text-[9px] mt-1 text-slate-500 leading-relaxed max-w-[200px]">
                      Start modifying the contract clause fields on the left to record automated revision snapshots.
                    </p>
                  </div>
                ) : (
                  revisions.map((rev) => (
                    <div key={rev.id} className="bg-[#202636] border border-[#2B3347] hover:border-[#00D4FF]/30 rounded-lg p-3 transition-all space-y-2 text-left relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#00D4FF] uppercase truncate max-w-[150px]">{rev.clauseLabel}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{new Date(rev.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 line-clamp-3 bg-black/20 p-2 rounded border border-white/[0.02] font-mono leading-relaxed break-words whitespace-pre-wrap">
                        {rev.newValue}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-[#2B3347]">
                        <span className="text-[8px] text-slate-400 font-mono">By: {rev.author}</span>
                        <button 
                          onClick={() => handleRevertClause(rev.clauseKey, rev.previousValue)}
                          className="text-[9px] text-[#00D4FF] hover:text-[#33DDFF] font-bold flex items-center gap-1 transition-all cursor-pointer bg-[#00D4FF]/5 hover:bg-[#00D4FF]/10 px-1.5 py-0.5 rounded border border-[#00D4FF]/10"
                        >
                          <Undo2 size={10} /> Revert
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Live Execution Copy (Adaptable dynamic width) */}
        <div className={`bg-[#0b0f19] flex flex-col min-w-0 transition-all duration-300 ${
          showPdfPreviewOverlay 
            ? 'flex-1 bg-[#171B26] h-full !border-l-0 relative overflow-hidden' 
            : 'xl:flex-[1.5] border-l border-[#2B3347] xl:relative absolute inset-0 z-[150] w-full h-full overflow-hidden'
        } ${!showLivePreview && !showPdfPreviewOverlay ? 'hidden' : ''}`}>
          {/* Output Toolbar / PDF Simulation Top Bar */}
          <div className={`print:hidden border-b shrink-0 flex items-center justify-between px-6 z-[10000] ${
            showPdfPreviewOverlay 
              ? 'h-16 bg-[#202636] border-[#2B3347]' 
              : 'h-12 bg-[#0a1c34]/20/95 backdrop-blur-md border-[#2B3347] absolute top-0 left-0 right-0'
          }`}>
            <div className="flex items-center gap-2.5">
              {showPdfPreviewOverlay ? (
                <>
                  <Printer className="text-[#00D4FF]" size={18} />
                  <div>
                    <h1 className="text-xs font-bold text-white uppercase tracking-wider font-manrope">PDF Export Simulation Portal</h1>
                    <p className="text-[9px] text-slate-400 font-manrope font-medium mt-0.5">Verify pagination, margins, crop marks, and cryptographic stamp seals prior to finalization.</p>
                  </div>
                </>
              ) : (
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-manrope flex items-center gap-2">
                  <Eye size={14} className="text-[#00D4FF]" /> LIVE EXECUTIVE DOCUMENT WORKSPACE
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              {showPdfPreviewOverlay ? (
                /* SIMULATION OPTIONS CONTROLS */
                <div className="flex items-center gap-5">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-[#171B26] border border-[#2B3347] px-3 py-1 rounded-md">
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Zoom</span>
                    <input 
                      type="range" 
                      min="40" 
                      max="100" 
                      value={previewZoom} 
                      onChange={e => setPreviewZoom(Number(e.target.value))} 
                      className="w-20 h-1 bg-[#2B3347] rounded-lg appearance-none cursor-pointer accent-[#00D4FF]"
                    />
                    <span className="text-[9px] font-mono text-[#00D4FF] font-bold w-7 text-right">{previewZoom}%</span>
                  </div>

                  {/* Print simulation toggles */}
                  <div className="flex items-center gap-4 bg-[#171B26] border border-[#2B3347] px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <label className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={previewShowCropMarks} 
                        onChange={e => setPreviewShowCropMarks(e.target.checked)} 
                        className="rounded border-[#2B3347] bg-[#202636] text-[#00D4FF] focus:ring-0 cursor-pointer w-3 h-3"
                      />
                      <span>Crop Marks</span>
                    </label>
                    <div className="w-px h-3.5 bg-[#2B3347]" />
                    <label className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={previewIncludeSeal} 
                        onChange={e => setPreviewIncludeSeal(e.target.checked)} 
                        className="rounded border-[#2B3347] bg-[#202636] text-[#00D4FF] focus:ring-0 cursor-pointer w-3 h-3"
                      />
                      <span>Stamp Seal</span>
                    </label>
                    <div className="w-px h-3.5 bg-[#2B3347]" />
                    <label className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={previewPrintMode} 
                        onChange={e => setPreviewPrintMode(e.target.checked)} 
                        className="rounded border-[#2B3347] bg-[#202636] text-[#00D4FF] focus:ring-0 cursor-pointer w-3 h-3"
                      />
                      <span>B&W Ink</span>
                    </label>
                  </div>



                  {/* Print Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleDownload}
                      className="bg-[#00D4FF] hover:bg-[#33DDFF] text-black font-manrope font-extrabold uppercase tracking-widest text-[9px] py-1.5 px-3.5 rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,212,255,0.25)] border border-[#00D4FF]/20"
                    >
                      <Download size={11} />
                      <span>Download PDF</span>
                    </button>
                    <button 
                      onClick={handleExportDocx}
                      className="bg-[#6B7280] hover:bg-[#4B5563] text-white font-manrope font-extrabold uppercase tracking-widest text-[9px] py-1.5 px-3.5 rounded flex items-center gap-1.5 transition-all cursor-pointer border border-[#4B5563]"
                    >
                      <Download size={11} />
                      <span>Export DOCX</span>
                    </button>
                    <button 
                      onClick={() => setShowPdfPreviewOverlay(false)}
                      className="bg-[#2B3347] hover:bg-[#2B3347]/85 text-white font-manrope font-bold uppercase tracking-widest text-[9px] py-1.5 px-3 rounded border border-white/5 transition-all cursor-pointer"
                    >
                      Close Simulation
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDARD CONTROLS */
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 border-r border-[#2B3347] pr-4">
                     <div className="text-[10px] text-[#10B981] uppercase tracking-wider font-bold flex items-center gap-2 font-manrope">
                       {isExecuted ? <CheckCircle2 size={14} className="text-[#10B981]" /> : <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>}
                       {isExecuted ? "EXECUTED" : "SYNCHRONIZED"}
                     </div>
                     {isExecuted ? (
                       <button 
                         onClick={() => {
                           setIsExecuted(false);
                           setCurrentVersion('v2 Seller Revision');
                         }} 
                         className="h-7 px-3 rounded text-[9px] uppercase tracking-wider font-bold transition-all bg-[#F59E0B]/20 text-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:bg-[#F59E0B]/30 cursor-pointer flex items-center gap-1.5"
                       >
                         <Unlock size={11} /> REVISE
                       </button>
                     ) : (
                       <button 
                         onClick={() => setShowDeployModal(true)} 
                         disabled={isExecuted} 
                         className="h-7 px-3 rounded text-[9px] uppercase tracking-wider font-bold transition-all bg-[#00D4FF]/20 text-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.3)] hover:bg-[#33DDFF] hover:shadow-md cursor-pointer"
                       >
                         DEPLOY
                       </button>
                     )}
                  </div>
                  <label className="flex items-center gap-1.5 hover:text-[#00D4FF] transition-colors cursor-pointer select-none text-[9px] font-manrope font-bold uppercase tracking-wider text-slate-400 border-r border-[#2B3347] pr-4">
                    <input 
                      type="checkbox" 
                      checked={isScrollSyncEnabled} 
                      onChange={e => setIsScrollSyncEnabled(e.target.checked)} 
                      className="rounded border-[#2B3347] bg-[#202636] text-[#00D4FF] focus:ring-0 cursor-pointer w-3 h-3"
                    />
                    <span>Scroll Sync</span>
                  </label>
                  <button 
                    onClick={() => setShowPdfPreviewOverlay(true)} 
                    className="hover:text-[#00D4FF] hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/10 transition-all cursor-pointer flex items-center gap-1 bg-[#00D4FF]/5 text-[#00D4FF] px-2.5 py-1 rounded text-[9px] font-manrope font-bold uppercase tracking-wider border border-[#00D4FF]/20" 
                    title="Export & Simulate Print Layout"
                  >
                    <Printer size={11} />
                    <span>Print Preview</span>
                  </button>
                  <button className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Search"><Search size={14} /></button>
                  <button onClick={handleDownload} className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Download PDF"><Download size={14} /></button>
                  <button onClick={handleExportDocx} className="hover:text-[#00D4FF] transition-colors cursor-pointer" title="Export DOCX"><Download size={14} /></button>
                  <button 
                    onClick={() => setShowLivePreview(false)} 
                    className="bg-[#FF8A80]/10 border border-[#FF8A80]/20 hover:bg-[#FF8A80]/20 hover:text-white text-rose-400 px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 text-[9px] font-manrope font-bold uppercase tracking-wider shadow-sm" 
                    title="Close Live Preview"
                  >
                    <X size={11} />
                    <span>Close Preview</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div id="contract-pages-container" className="flex-1 overflow-auto print:overflow-visible print:pt-0 print:pb-0 print:px-0 pt-20 pb-20 px-8 flex flex-col items-center bg-[#0b0f19] print:bg-white pdf-generating:bg-white min-w-0 font-sans">
            <div 
              style={showPdfPreviewOverlay ? {
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out'
              } : undefined}
              className={`print:block print:transform-none flex flex-col items-center w-full origin-top transition-all duration-300 ${
                previewPrintMode && showPdfPreviewOverlay ? 'grayscale contrast-125 brightness-[0.98]' : ''
              }`}
            >
            
            {/* --- DYNAMIC PDF RENDERING SYSTEM --- */}
            {pdfStructure.map((page, pageIdx) => {
              const pageNum = pageIdx + 1;
              const totalPages = pdfStructure.length;

              const PageFooter = () => (
                <div className="mt-auto pt-6 font-inter font-medium text-[8pt] text-slate-500 border-t border-slate-200 flex justify-between">
                  <div>
                    <div className="font-bold text-slate-800 uppercase tracking-widest">DIGITAL {foundation.type?.toUpperCase() || "AGREEMENT"}</div>
                    <div className="mt-1">Verified Execution Record | {page.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="uppercase tracking-widest font-bold text-slate-800">Page {pageNum} of {totalPages}</div>
                    <div className="mt-1">8A7F-31CC-0E2A-5501-7F03 | {new Date().toISOString().split('T')[0]} | DOC-REF-902</div>
                  </div>
                </div>
              );

              return (
                <div key={page.id} id={`pdf-page-${page.id}`} className="contract-page-sheet w-[794px] min-h-[1122px] h-auto bg-white relative p-6 lg:p-8 flex flex-col shrink-0 mt-8 rounded-sm first:mt-0 [&:not(:last-child)]:break-after-page [&:not(:last-child)]:page-break-after-always" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.08)', border: '1px solid #D6DCE5' }}>
                  <div className="absolute top-[10mm] bottom-[10mm] left-[10mm] right-[10mm] border-[0.5px] border-slate-300 pointer-events-none"></div>
                  <div className="relative z-10 w-full h-full flex flex-col font-sans px-5 py-5 text-slate-900">
                    
                    {page.type === 'title' && (
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Centered Document Title */}
                        <div className="text-center my-1 py-2 border-y border-slate-200">
                          <h1 className="font-manrope font-bold text-[24pt] tracking-[0.5px] text-black uppercase leading-normal mb-2">
                            {foundation.title || "COVENANT OF MUTUAL COMMERCIAL AGREEMENT"}
                          </h1>
                          <div className="font-inter font-semibold text-[9pt] text-slate-500 uppercase">
                            CATEGORY: {foundation.category} • TYPE: {foundation.type}
                          </div>
                        </div>

                        {/* Double-column parameters block */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 my-2 text-[10px]">
                          <div className="border-b border-slate-100 pb-2 flex flex-col justify-between">
                            <span className="text-[8.5px] text-slate-450 uppercase tracking-wider font-bold">Compliance Framework</span>
                            <span className="font-serif font-semibold text-slate-800 mt-1">
                              {foundation.complianceFramework && foundation.complianceFramework.length > 0 
                                ? foundation.complianceFramework.join(', ') 
                                : 'Standard Corporate Guidelines'}
                            </span>
                          </div>
                          <div className="border-b border-slate-100 pb-2 flex flex-col justify-between">
                            <span className="text-[8.5px] text-slate-450 uppercase tracking-wider font-bold">Governing Law</span>
                            <span className="font-serif font-semibold text-slate-800 mt-1">
                              {jurisdiction.law || 'English Law'}
                            </span>
                          </div>
                          <div className="border-b border-slate-100 pb-2 flex flex-col justify-between">
                            <span className="text-[8.5px] text-slate-450 uppercase tracking-wider font-bold">Global Signature Protocol</span>
                            <span className="font-serif font-bold text-emerald-700 mt-1 uppercase">
                              {contractFields?.signatureMethod || "Electronic Signature"}
                            </span>
                          </div>
                        </div>

                        {/* PARTIES & COUNTERPARTIES Block */}
                        <div className="my-1">
                          <h3 className="text-[9px] font-sans font-bold text-slate-800 uppercase tracking-[0.2em] mb-2 border-b border-slate-200 pb-1">
                            I. DESIGNATED PARTIES & SIGNATORIES REGISTRY
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Party A */}
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
                              <div>
                                <span className="text-[8px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Party A ({partyA.role || "Primary Corporate Entity"})</span>
                                <h4 className="text-[11px] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1 pt-1 pb-1 overflow-visible">{partyA.name}</h4>
                                <div className="text-[8.5px] text-slate-500 font-sans tracking-wider mt-0.5 uppercase font-medium">Role: {partyA.role || "Seller"}</div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1 text-[8.5px]">
                                {partyA.representative && <div><strong className="text-slate-600">Representative:</strong> {partyA.representative}</div>}
                                {partyA.idNumber && <div><strong className="text-slate-600">ID / Reg No:</strong> {partyA.idNumber}</div>}
                                <div><strong className="text-slate-600">Email:</strong> {partyA.email}</div>
                                {partyA.address && <div className="text-slate-600 leading-normal mt-0.5"><strong className="text-slate-600">Address:</strong> {partyA.address}</div>}
                              </div>
                            </div>

                            {/* Party B */}
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
                              <div>
                                <span className="text-[8px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Party B ({partyB.role || "Counterparty / Buyer"})</span>
                                <h4 className="text-[11px] font-serif font-bold text-slate-900 uppercase tracking-tight mt-1 pt-1 pb-1 overflow-visible">{partyB.name}</h4>
                                <div className="text-[8.5px] text-slate-500 font-sans tracking-wider mt-0.5 uppercase font-medium">Role: {partyB.role || "Buyer"}</div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1 text-[8.5px]">
                                {partyB.representative && <div><strong className="text-slate-600">Representative:</strong> {partyB.representative}</div>}
                                {partyB.idNumber && <div><strong className="text-slate-600">ID / Reg No:</strong> {partyB.idNumber}</div>}
                                <div><strong className="text-slate-600">Email:</strong> {partyB.email}</div>
                                {partyB.address && <div className="text-slate-600 leading-normal mt-0.5"><strong className="text-slate-600">Address:</strong> {partyB.address}</div>}
                              </div>
                            </div>
                          </div>

                          {/* Additional Parties (if any) */}
                          {additionalParties && additionalParties.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              {additionalParties.map((p: any, idx: number) => (
                                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[8.5px]">
                                  <span className="text-[7.5px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Additional Party {idx + 1}</span>
                                  <h4 className="text-[10px] font-serif font-bold text-slate-900 uppercase mt-0.5 pt-1 pb-1 overflow-visible">{p.name || `Signatory ${idx+1}`}</h4>
                                  <div className="text-[8px] text-slate-500 mt-0.5 uppercase">Role: {p.role || "Broker"}</div>
                                  <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-slate-600">
                                    {p.idNumber && <div>Reg No: {p.idNumber}</div>}
                                    <div>Email: {p.email}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* PARTICIPANTS & IDENTITY Block */}
                        {participants && participants.length > 0 && (
                          <div className="my-1">
                            <h3 className="font-manrope font-semibold text-[12pt] text-slate-800 uppercase tracking-[0.15em] mb-1 border-b border-slate-200 pb-0.5">
                              II. DESIGNATED THIRD-PARTY PARTICIPANTS & CERTIFIERS
                            </h3>
                            <div className="grid grid-cols-3 gap-2.5">
                              {participants.map((p: any) => (
                                <div key={p.id} className="p-2 border border-slate-200 rounded text-[8.5px] bg-slate-50/50 leading-relaxed">
                                  <strong className="text-slate-900 block font-bold pt-1 pb-1 overflow-visible">{p.name}</strong>
                                  <span className="text-slate-500 font-manrope block">{p.role}</span>
                                  <span className="text-slate-400 font-mono block mt-0.5">{p.contact}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom Seal & Stamps */}
                        <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-auto">
                          <div className="text-[8px] text-slate-500 font-mono">
                            <div>SECURE LEDGER RECORD VALIDATED</div>
                            <div>REF CODE: {contractFields?.verificationCode || "8A7F-31CC-0E2A-5501-7F03"}</div>
                            <div>STAMP HASH: SHA256-REGISTRY-BLOCK-1</div>
                          </div>
                          <RealisticSealStamp 
                            companyName={partyA.name || "GLOBAL DYNAMICS"} 
                            verificationCode={contractFields?.verificationCode || "8A7F-31CC"}
                            date={foundation.effectiveDate || new Date().toISOString().split('T')[0]}
                            size="w-16 h-16"
                          />
                        </div>
                      </div>
                    )}

                    {page.type === 'commercial_scope_page' && (
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Header bar */}
                        <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-4">
                          <div>
                            <div className="font-manrope font-bold text-[13pt] tracking-[0.3px] text-black uppercase">SECTION II - COMMERCIAL SCOPE & LOGISTICS COVER</div>
                            <div className="text-[7.5px] text-slate-400 font-mono">REGISTRY HASH: {contractFields?.verificationCode || "8A7F-31CC"}</div>
                          </div>
                          <span className="text-[8px] text-slate-500 font-mono">PAGE 2 OF {totalPages}</span>
                        </div>

                        {/* Main Body Grid */}
                        <div className="grid grid-cols-12 gap-5 flex-1 items-start text-[10px]">
                          {/* Left Column: Commercial parameters & Project desc */}
                          <div className="col-span-7 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-1">Commercial Subject Matter</span>
                              <span className="font-inter font-medium text-[10.5pt] text-slate-900">{foundation.subjectMatter || "Designated Commercial Materials"}</span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-1">Primary Commercial Objective</span>
                              <span className="font-inter font-medium text-[10.5pt] text-slate-800">{foundation.objective || "Mutual Strategic Logistics Operation"}</span>
                            </div>

                            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                              <span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-1.5">Project & Technical Operations Scope</span>
                              <p className="font-inter font-normal text-[10.5pt] text-slate-700 leading-[1.45] whitespace-pre-line text-left">
                                {foundation.description || "No project and technical operations description filed."}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-0.5">Commercial Model</span>
                                <span className="font-inter font-medium text-[10.5pt] text-slate-800">{foundation.commercialModel || "Fixed Price"}</span>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <span className="font-manrope font-semibold text-[11pt] text-slate-500 uppercase tracking-wider block mb-0.5">Payment Structure</span>
                                <span className="font-inter font-medium text-[10.5pt] text-slate-800">{foundation.paymentStructure || "100% Advance"}</span>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                              <span className="text-[8.5px] text-slate-450 uppercase tracking-wider font-bold">Designated Contract Valuation</span>
                              <span className="font-serif font-black text-slate-900 text-[12px]">{foundation.currency || "USD"} {foundation.value || "0.00"}</span>
                            </div>
                          </div>

                          {/* Right Column: Party Distributions, Geography, Timing */}
                          <div className="col-span-5 space-y-4">
                            {/* Contract Party Distributions */}
                            {foundation.partyDistributions && foundation.partyDistributions.length > 0 && (
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <span className="text-[8.5px] text-slate-450 uppercase tracking-wider font-bold block mb-2 border-b border-slate-250 pb-1">Designated Share Distributions</span>
                                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                  {foundation.partyDistributions.map((dist: any, idx: number) => dist.role && (
                                    <div key={idx} className="flex justify-between items-center text-[9px] border-b border-slate-150 pb-1 last:border-0 last:pb-0">
                                      <span className="font-medium text-slate-700 truncate w-24" title={dist.role}>{dist.role}</span>
                                      <div className="text-right font-mono text-slate-800 font-bold">
                                        {dist.percentage && <span>{dist.percentage}%</span>}
                                        {dist.percentage && dist.amount && <span className="mx-1">|</span>}
                                        {dist.amount && <span>{dist.currency || foundation.currency} {dist.amount}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Geographical scope parameters */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                              <span className="text-[8.5px] text-slate-450 uppercase tracking-wider font-bold block border-b border-slate-250 pb-1">Geographical Scope Parameters</span>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px]">
                                <div><strong className="text-slate-500">Continent:</strong> <span className="text-slate-800 font-medium">{foundation.continent || "Global"}</span></div>
                                <div><strong className="text-slate-500">Country:</strong> <span className="text-slate-800 font-medium">{foundation.country || "International"}</span></div>
                                <div className="col-span-2"><strong className="text-slate-500">Operating Area:</strong> <span className="text-slate-800 font-medium">{foundation.operatingArea || "Standard Sea Lanes"}</span></div>
                              </div>
                              {foundation.serviceLocation && (Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation.length > 0 : foundation.serviceLocation) && (
                                <div className="pt-1.5 border-t border-dashed border-slate-200">
                                  <strong className="text-[8px] text-slate-500 uppercase tracking-wider block mb-1">Service Locations / Waypoints:</strong>
                                  <div className="flex flex-wrap gap-1">
                                    {(Array.isArray(foundation.serviceLocation) ? foundation.serviceLocation : [foundation.serviceLocation]).map((loc, idx) => (
                                      <span key={idx} className="bg-slate-200/70 text-slate-800 font-medium text-[7.5px] px-1.5 py-0.5 rounded border border-slate-300">
                                        {loc}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Duration & Milestones parameters */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                              <span className="text-[8.5px] text-slate-450 uppercase tracking-wider font-bold block border-b border-slate-250 pb-1">Duration & Timing Milestones</span>
                              <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                                <div><strong className="text-slate-500">Duration:</strong> <span className="text-slate-800 font-semibold">{foundation.duration}</span></div>
                                <div><strong className="text-slate-500">Renewal Terms:</strong> <span className="text-slate-800 font-semibold">{foundation.renewalTerms}</span></div>
                                <div><strong className="text-slate-500">Effective Date:</strong> <span className="text-slate-800 font-semibold">{foundation.effectiveDate || "—"}</span></div>
                                <div><strong className="text-slate-500">Expiration Date:</strong> <span className="text-slate-800 font-semibold">{foundation.expirationDate || "—"}</span></div>
                                <div className="col-span-2 pt-1 border-t border-dashed border-slate-150"><strong className="text-slate-500">Termination Notice:</strong> <span className="text-slate-800 font-bold">{foundation.noticePeriod || "90 Days"}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom declaration */}
                        <div className="border-t border-slate-200 pt-4 mt-4 text-[8.5px] text-slate-500 text-justify leading-relaxed">
                          The commercial parameters, geographic waypoints, distribution structures, and timing milestones declared above constitute the official <strong>Commercial Foundation</strong> of this Agreement, and are legally binding upon execution. Any modifications to this core scope must be processed through formal written amendments locked in the Registry.
                        </div>
                      </div>
                    )}

                    {page.type === 'toc' && (
                      <div className="flex-1 flex flex-col">
                        <h2 className="text-[11px] font-serif font-bold uppercase tracking-widest mb-8 border-b border-black pb-4 text-center">TABLE OF CONTENTS</h2>
                        <div className="space-y-3 px-12 text-[11px] flex-1">
                          {(() => {
                            const contentPages = pdfStructure.filter(p => !['toc', 'title', 'commercial_scope_page'].includes(p.type));
                            const indexedPages: typeof contentPages = [];
                            const seenSections = new Set<string>();

                            const dbManuallyCompleted = firestoreContractData?.manuallyCompletedSections || manuallyCompletedSections || [];
                            const dbStatus = firestoreContractData?.status || (isExecuted ? 'executed' : 'draft');
                            const isDeployed = dbStatus === 'executed';

                            const officialPages = pdfStructure;

                            contentPages.forEach(p => {
                              const baseId = p.baseSectionId || p.id;
                              
                              if (!seenSections.has(baseId)) {
                                seenSections.add(baseId);
                                indexedPages.push(p);
                              }
                            });

                            if (indexedPages.length === 0) {
                              return (
                                <div className="text-center py-12 text-slate-400 italic text-[10px] font-manrope">
                                  No confirmed agreement sections loaded in registry yet.<br />
                                  <span className="text-[9px] mt-1 block">Please lock and confirm clauses to index them.</span>
                                </div>
                              );
                            }

                            return indexedPages.map((p, idx) => {
                              const actualPageNum = officialPages.findIndex(item => item.id === p.id) + 1;
                              const displayTitle = p.title
                                .replace(/\s*\(Part\s+\d+\/\d+\)/gi, '')
                                .replace(/^Section \d+ - /, '')
                                .replace(/^Annex [A-Z] - /, '');

                              return (
                                <div key={p.id} className="flex justify-between items-baseline py-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] text-emerald-600 font-bold">
                                      {String(idx + 1).padStart(2, '0')}.
                                    </span>
                                    <span className="font-sans uppercase tracking-wider text-[9px] font-semibold text-slate-700">
                                      {displayTitle}
                                    </span>
                                  </div>
                                  <div className="flex-1 border-b border-dotted border-slate-300 mx-2"></div>
                                  <span className="text-slate-500 font-mono text-[9px] font-bold">P. {actualPageNum > 0 ? actualPageNum : "—"}</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    
                    {page.type === 'document_body' && (
                      <div className="flex-1 flex flex-col gap-[40px]">
                        {page.sections.map((section, idx) => {
                          const linkedClause = section.clauseId ? clauses.find((c: any) => c.id === section.clauseId) : null;
                          const contentToRender = section.content !== undefined ? section.content : (linkedClause ? linkedClause.content : null);
                          const titleMatch = (section.title || "").match(/(?:Section|Clause)\s*0*(\d+)/i) || (section.title || "").match(/\b(\d+)\b/);
                          const startNum = titleMatch ? parseInt(titleMatch[1], 10) : 1;
                          
                          return (
                            <div key={section.id} id={`pdf-section-${section.id}`} className="page-break-inside-avoid">
                              <h2 className="group font-manrope font-semibold text-[16pt] uppercase mb-[16px] border-b border-slate-200 pb-2 flex justify-between items-center text-black break-after-avoid page-break-after-avoid">
                                <div className="flex-1">
                                  {editingTitleClauseId === linkedClause?.id ? (
                                    <input
                                      type="text"
                                      className="bg-slate-50 border border-slate-300 text-slate-900 rounded px-2 py-0.5 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold uppercase w-full max-w-[450px]"
                                      value={tempTitleVal}
                                      onChange={(e) => setTempTitleVal(e.target.value)}
                                      onBlur={() => {
                                        if (tempTitleVal.trim() && linkedClause) {
                                          setClauses(prev => prev.map(c => c.id === linkedClause.id ? { ...c, title: tempTitleVal } : c));
                                        }
                                        setEditingTitleClauseId(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          if (tempTitleVal.trim() && linkedClause) {
                                            setClauses(prev => prev.map(c => c.id === linkedClause.id ? { ...c, title: tempTitleVal } : c));
                                          }
                                          setEditingTitleClauseId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingTitleClauseId(null);
                                        }
                                      }}
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span 
                                      className="flex items-center gap-2 cursor-pointer hover:text-[#00D4FF] transition-colors group/title text-[15px]"
                                      onClick={() => {
                                        if (!isExecuted && linkedClause) {
                                          setEditingTitleClauseId(linkedClause.id);
                                          setTempTitleVal(section.title);
                                        }
                                      }}
                                      title={!isExecuted ? "Click to translate or customize this section title" : undefined}
                                    >
                                      {section.title.toUpperCase()}
                                      {!isExecuted && linkedClause && (
                                        <PenTool size={11} className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-[#00D4FF] transition-opacity ml-1 print:hidden" />
                                      )}
                                    </span>
                                  )}
                                </div>
                                {!isExecuted && (
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (linkedClause) {
                                        setClauses(prev => prev.map(c => c.id === linkedClause.id ? { ...c, pageBreakBefore: !c.pageBreakBefore } : c));
                                      }
                                    }}
                                    className={`transition-colors text-[10px] px-2 py-1 rounded font-sans flex items-center gap-1 cursor-pointer shadow-sm print:hidden border ${
                                      linkedClause?.pageBreakBefore 
                                        ? 'bg-[#00D4FF] text-[#041326] border-[#00D4FF]' 
                                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                                    }`}
                                  >
                                    <ArrowDown size={12} /> {linkedClause?.pageBreakBefore ? "Page Break Set" : "Force Page Break"}
                                  </button>
                                )}
                              </h2>
                              
                              <div className="space-y-6">
                                {contentToRender && (
                                  <div className="text-slate-900">
                                    <LegalMarkdown content={contentToRender} startNumber={startNum} />
                                  </div>
                                )}
                                
                                <div className="space-y-4">
                                  {section.id === "Commercial Foundation" && (
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Agreement Type</p>
                                        <p className="font-bold text-slate-900">{foundation.type}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Transaction Value</p>
                                        <p className="font-bold text-[#00D4FF]">{foundation.currency} {foundation.value}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Duration</p>
                                        <p className="font-bold text-slate-900">{foundation.duration}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Jurisdiction</p>
                                        <p className="font-bold text-slate-900">{jurisdiction.law}</p>
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Arbitration Rules & Institution</p>
                                        <p className="font-bold text-slate-900">{jurisdiction.institution || 'LMAA Rules / Tribunal'}</p>
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Objective</p>
                                        <p className="text-[10px] text-slate-700">{foundation.objective}</p>
                                      </div>
                                    </div>
                                  )}

                                  {section.id === "Parties" && (
                                    <div className="space-y-4 my-6">
                                      <div className="p-4 bg-slate-50 rounded border border-slate-200">
                                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-2 tracking-wider">Party A ({partyA.role || "Seller"})</div>
                                        <div className="font-bold text-slate-900">{partyA.name}</div>
                                        <div className="text-[10px] text-slate-600 mt-1">{partyA.address}</div>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded border border-slate-200">
                                        <div className="text-[9px] text-slate-400 uppercase font-bold mb-2 tracking-wider">Party B ({partyB.role || "Buyer"})</div>
                                        <div className="font-bold text-slate-900">{partyB.name}</div>
                                        <div className="text-[10px] text-slate-600 mt-1">{partyB.address}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {page.type === 'section' && (
                      <div className="flex-1 flex flex-col">
                        <h2 className="font-manrope font-semibold text-[16pt] uppercase mb-[16px] border-b border-slate-200 pb-2 flex justify-between text-black">
                          <span>{page.title.toUpperCase()}</span>
                          <span className="text-slate-400">P. {pageNum}</span>
                        </h2>
                        
                        <div className="flex-1">
                          {(() => {
                            const linkedClause = page.clauseId ? clauses.find((c: any) => c.id === page.clauseId) : null;
                            const contentToRender = page.content !== undefined ? page.content : (linkedClause ? linkedClause.content : null);
                            
                            // Extract section number from title (e.g. "Section 05 - Payment Terms" -> 5)
                            const titleMatch = (page.title || "").match(/(?:Section|Clause)\s*0*(\d+)/i) || (page.title || "").match(/\b(\d+)\b/);
                            const startNum = titleMatch ? parseInt(titleMatch[1], 10) : 1;

                            return (
                              <div className="space-y-6">
                                {contentToRender && (
                                  <div className="text-slate-900">
                                    <LegalMarkdown content={contentToRender} startNumber={startNum} />
                                  </div>
                                )}

                                <div className="space-y-4">
                                  {page.id === "Commercial Foundation" && (
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Agreement Type</p>
                                        <p className="font-bold text-slate-900">{foundation.type}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Transaction Value</p>
                                        <p className="font-bold text-[#00D4FF]">{foundation.currency} {foundation.value}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Duration</p>
                                        <p className="font-bold text-slate-900">{foundation.duration}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Jurisdiction</p>
                                        <p className="font-bold text-slate-900">{jurisdiction.law}</p>
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Arbitration Rules & Institution</p>
                                        <p className="font-bold text-slate-900">{jurisdiction.institution || 'LMAA Rules / Tribunal'}</p>
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <p className="text-[9px] uppercase text-slate-400 font-bold">Objective</p>
                                        <p className="text-[10px] text-slate-700">{foundation.objective}</p>
                                      </div>
                                    </div>
                                  )}

                                  {page.id === "Deliverables" && contractFields.milestones && (
                                    <div className="mt-8">
                                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 mb-3 border-b border-slate-200 pb-2">Key Milestones & Project Timelines</h3>
                                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                        <div className="whitespace-pre-wrap text-[10.5px] font-serif text-slate-800 leading-relaxed">
                                          {contractFields.milestones}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {page.id === "Payment Terms" && (
                                    <div className="space-y-8 mt-8">
                                      {/* Global Payment Config */}
                                      {contractFields.globalPaymentConfig && (
                                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 mb-3 border-b border-slate-200 pb-2">Global Payment Configuration</h4>
                                          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[9.5px]">
                                            {Object.entries(contractFields.globalPaymentConfig).map(([key, value]) => value && (
                                              <div key={key} className="space-y-0.5">
                                                <span className="text-slate-400 font-bold uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                <p className="text-slate-800 font-mono">{String(value)}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Party A & B Bank Details */}
                                      {(contractFields.partyAPaymentData || contractFields.partyBPaymentData || contractFields.partyABankDetails || contractFields.partyBBankDetails) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {/* Party A */}
                                          {(contractFields.partyAPaymentData || contractFields.partyABankDetails) && (
                                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-3 border-b border-slate-200 pb-2">Banking Details - {partyA.role}</p>
                                              {contractFields.partyAPaymentData ? (
                                                <div className="space-y-3">
                                                  {contractFields.partyAPaymentData.beneficiary?.legalName && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">Beneficiary:</span> <span className="font-mono text-slate-800">{contractFields.partyAPaymentData.beneficiary.legalName}</span></div>
                                                  )}
                                                  {contractFields.partyAPaymentData.banking?.bankName && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">Bank:</span> <span className="font-mono text-slate-800">{contractFields.partyAPaymentData.banking.bankName}</span></div>
                                                  )}
                                                  {contractFields.partyAPaymentData.banking?.accountNumber && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">Account/IBAN:</span> <span className="font-mono text-slate-800">{contractFields.partyAPaymentData.banking.accountNumber} {contractFields.partyAPaymentData.banking.iban}</span></div>
                                                  )}
                                                  {contractFields.partyAPaymentData.banking?.swiftBic && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">SWIFT/BIC:</span> <span className="font-mono text-slate-800">{contractFields.partyAPaymentData.banking.swiftBic}</span></div>
                                                  )}
                                                  {contractFields.partyAPaymentData.digital && Object.entries(contractFields.partyAPaymentData.digital).map(([key, value]) => value && (
                                                    <div key={key} className="text-[9.5px]">
                                                      <span className="text-slate-400 font-bold uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> <span className="font-mono text-slate-800">{String(value)}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="whitespace-pre-wrap text-[10px] font-mono text-slate-800 leading-relaxed">
                                                  {contractFields.partyABankDetails}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          
                                          {/* Party B */}
                                          {(contractFields.partyBPaymentData || contractFields.partyBBankDetails) && (
                                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                                              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-3 border-b border-slate-200 pb-2">Banking Details - {partyB.role}</p>
                                              {contractFields.partyBPaymentData ? (
                                                <div className="space-y-3">
                                                  {contractFields.partyBPaymentData.beneficiary?.legalName && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">Beneficiary:</span> <span className="font-mono text-slate-800">{contractFields.partyBPaymentData.beneficiary.legalName}</span></div>
                                                  )}
                                                  {contractFields.partyBPaymentData.banking?.bankName && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">Bank:</span> <span className="font-mono text-slate-800">{contractFields.partyBPaymentData.banking.bankName}</span></div>
                                                  )}
                                                  {contractFields.partyBPaymentData.banking?.accountNumber && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">Account/IBAN:</span> <span className="font-mono text-slate-800">{contractFields.partyBPaymentData.banking.accountNumber} {contractFields.partyBPaymentData.banking.iban}</span></div>
                                                  )}
                                                  {contractFields.partyBPaymentData.banking?.swiftBic && (
                                                    <div className="text-[9.5px]"><span className="text-slate-400 font-bold uppercase">SWIFT/BIC:</span> <span className="font-mono text-slate-800">{contractFields.partyBPaymentData.banking.swiftBic}</span></div>
                                                  )}
                                                  {contractFields.partyBPaymentData.digital && Object.entries(contractFields.partyBPaymentData.digital).map(([key, value]) => value && (
                                                    <div key={key} className="text-[9.5px]">
                                                      <span className="text-slate-400 font-bold uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> <span className="font-mono text-slate-800">{String(value)}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="whitespace-pre-wrap text-[10px] font-mono text-slate-800 leading-relaxed">
                                                  {contractFields.partyBBankDetails}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {page.id === "Signatures" && (
                                    <div className="space-y-12">
                                      <div>
                                        <p className="font-medium uppercase tracking-wider text-[10px] text-slate-600">9.1 Governing Law & Seat</p>
                                        <p className="mt-2 pl-2 border-l border-slate-300">Law: {jurisdiction.law} | Seat: {jurisdiction.seat}</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-8 gap-y-16 mt-16">
                                        {/* Party A */}
                                        <div className="flex flex-col min-h-[70px]">
                                          {partyASigned ? (
                                            <div className="flex flex-col mb-2">
                                              <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span className="text-[7.5px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shadow-sm">
                                                  ✓ APPROVED & SECURED
                                                </span>
                                              </div>
                                              <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">
                                                TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 194.22.81.41
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="text-[8.5px] text-slate-400 italic font-mono flex items-center gap-1.5 mb-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-450"></span> Pending Signature Execution
                                            </div>
                                          )}
                                          
                                          <div className="mt-auto pt-1">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{partyA.name}</div>
                                            <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-medium">Authorized Signatory ({partyA.role || 'Seller'})</div>
                                          </div>
                                        </div>
 
                                        {/* Party B */}
                                        <div className="flex flex-col min-h-[70px]">
                                          {partyBSigned ? (
                                            <div className="flex flex-col mb-2">
                                              <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span className="text-[7.5px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shadow-sm">
                                                  ✓ APPROVED & SECURED
                                                </span>
                                              </div>
                                              <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">
                                                TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 81.109.112.59
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="text-[8.5px] text-slate-400 italic font-mono flex items-center gap-1.5 mb-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-450"></span> Pending Signature Execution
                                            </div>
                                          )}
                                          
                                          <div className="mt-auto pt-1">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{partyB.name}</div>
                                            <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-medium">Authorized Signatory ({partyB.role || 'Buyer'})</div>
                                          </div>
                                        </div>
 
                                        {/* Additional Signatories if any */}
                                        {additionalParties.map((p, idx) => {
                                          if (!p.name) return null;
                                          const isPartySigned = additionalSigned[p.id || idx];
                                          return (
                                            <div key={idx} className="pt-4 relative flex flex-col justify-end min-h-[90px]">
                                              {isPartySigned ? (
                                                <div className="absolute top-[-45px] left-2 select-none pointer-events-none w-full flex flex-col">
                                                  {/* Verified Badge */}
                                                  <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span className="text-[7.5px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shadow-sm">
                                                      ✓ APPROVED & SECURED
                                                    </span>
                                                  </div>
                                                  <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">
                                                    TIMESTAMP: {foundation.effectiveDate || '2026-06-14'} 10:14 UTC | IP: 104.18.23.95
                                                  </span>
                                                </div>
                                              ) : (
                                                <div className="absolute top-[-25px] left-0 text-[8.5px] text-slate-400 italic font-mono flex items-center gap-1.5">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-450"></span> Pending Signature Execution
                                                </div>
                                              )}
                                              
                                              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">{p.name}</div>
                                              <div className="text-[8px] text-slate-500 uppercase mt-0.5 font-medium">Authorized Signatory ({p.role || 'Signatory'})</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <DigitalSignatureBlock 
                                        approvalData={interactiveClausesApproval} 
                                        partyA={partyA} 
                                        partyB={partyB} 
                                        additionalParties={additionalParties} 
                                        isExecuted={isExecuted} 
                                        contractFields={contractFields} 
                                        firestoreContractData={firestoreContractData}
                                      />
                                    </div>
                                  )}
                                {page.id === "Annexes" && (
                                  <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded border border-slate-200">
                                      <h3 className="text-[10px] font-bold uppercase mb-4">A.1 Party Registration</h3>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="text-[9px]">
                                          <span className="block font-bold">Party A: {partyA.name}</span>
                                          <span className="block text-slate-500">ID: {partyA.idNumber}</span>
                                        </div>
                                        <div className="text-[9px]">
                                          <span className="block font-bold">Party B: {partyB.name}</span>
                                          <span className="block text-slate-500">ID: {partyB.idNumber}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-10 flex flex-col items-center">
                                       <div className="text-[10px] font-bold uppercase tracking-widest mb-4">CRITICAL SECURITY VERIFICATION</div>
                                       {qrDataUrl && <img src={qrDataUrl} alt="Verification QR" className="w-32 h-32 border-4 border-white shadow-lg" />}
                                       <div className="mt-4 text-center">
                                          <div className="text-[11px] font-mono font-bold text-slate-800 tracking-widest">
                                            VERIFICATION HASH: {contractFields.verificationCode}<br/>
                                            ID: {contractFields.verificationCode ? contractFields.verificationCode.slice(0, 9) : "PENDING"}
                                          </div>
                                          <div className="mt-2 text-[8px] text-slate-400 max-w-[400px]">
                                            This QR code and verification hash link directly to the immutable record on the Contract Studio ledger.
                                          </div>
                                       </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                        </div>
                      </div>
                    )}

                    {page.type === 'clauses' && (
                      <div className="flex-1 flex flex-col">
                        <h2 className="font-manrope font-semibold text-[16pt] uppercase mb-[16px] border-b border-slate-200 pb-2 flex justify-between text-black">
                          <span>{page.title.toUpperCase()}</span>
                          <span className="text-slate-400">P. {pageNum}</span>
                        </h2>
                        
                        <div className="space-y-5 text-[10px] leading-relaxed font-serif text-slate-800 flex-1">
                          {page.data.map((clause: any) => (
                            <div key={clause.id} className="border-l-2 border-[#00D4FF]/20 pl-4 py-1">
                              <h3 className="text-[10px] font-bold uppercase tracking-tight text-slate-900 mb-1.5">{clause.title}</h3>
                              <div className="whitespace-pre-wrap text-slate-700 leading-[1.6]">{clause.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {page.type === 'identityDocs' && (
                      <div className="flex-1 flex flex-col">
                        <h2 className="text-[11px] font-serif font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 flex justify-between">
                          <span>ANNEX A - SECURE IDENTITY CREDENTIALS</span>
                          <span className="text-slate-400">P. {pageNum}</span>
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          {page.data.map((doc: any, idx: number) => {
                             return (
                               <div key={doc.id || idx} className="border border-slate-200 rounded p-2 bg-slate-50 relative flex flex-col h-[280px]">
                                 <div className="flex justify-between items-start mb-1">
                                   <span className="text-[8px] font-bold text-slate-900 uppercase">{doc.type}</span>
                                   <span className="text-[8px] font-bold text-[#00D4FF]">{doc.party}</span>
                                 </div>
                                 <div className={`flex-1 rounded bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-200`}>
                                   {doc.previewUrl ? (
                                      <img src={doc.previewUrl} alt={doc.type} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                                   ) : (
                                      <span className="text-slate-600 text-[8px]">NO VIEW</span>
                                   )}
                                 </div>
                                 <div className="text-[7px] text-slate-500 mt-1 truncate">File: {doc.name}</div>
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    )}

                    
                    {page.type === 'verification_record' && (
                      <div className="mt-8 flex flex-col page-break-inside-avoid">
                        {/* Enhanced Header metadata bar */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                          <div className="w-full">
                            <div className="text-[14px] font-sans font-black text-slate-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                              <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
                              OFFICIAL IMMUTABLE CONTRACT RECORD
                            </div>
                            
                            <div className="mb-6 w-full border border-slate-200 rounded p-4 bg-slate-50 flex items-center justify-between">
                              {[
                                { id: 'draft', label: 'Draft' },
                                { id: 'review', label: 'Review' },
                                { id: 'approved', label: 'Approved' },
                                { id: 'published', label: 'Published' },
                                { id: 'hashed', label: 'Hash Generated' },
                                { id: 'verified', label: 'Registry Verified' },
                                { id: 'executed', label: 'Executed' }
                              ].map((step, idx, arr) => {
                                const isActive = isExecuted || idx === 0;
                                return (
                                  <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                      <div className={`w-3 h-3 rounded-full mb-1.5 flex items-center justify-center ${isActive ? 'bg-emerald-500' : 'bg-slate-200 border border-slate-300'}`}>
                                        {isActive && <Check size={8} className="text-white stroke-[3]" />}
                                      </div>
                                      <span className={`text-[6px] text-center uppercase font-bold tracking-widest ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {step.label}
                                      </span>
                                    </div>
                                    {idx < arr.length - 1 && (
                                      <div className={`flex-1 h-px ${isActive ? 'bg-emerald-400' : 'bg-slate-200'} mx-2`}></div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>

                            <div className="text-[9.5px] text-slate-700 bg-slate-50 p-5 border border-slate-200 rounded">
                              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Agreement ID</div>
                                  <div className="font-mono font-bold text-slate-900">{activeContractId || "uF7iCaQ3Gaosw1jxzLKr"}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Execution Status</div>
                                  <div className={`font-sans font-bold uppercase tracking-wider ${isExecuted ? 'text-emerald-600' : 'text-amber-600'}`}>{isExecuted ? "EXECUTED & LOCKED" : "DRAFT"}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Revision Number</div>
                                  <div className="font-mono font-bold text-slate-900">REV-{revisions.length + 1}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Approved Version</div>
                                  <div className="font-sans font-bold text-slate-900">{currentVersion}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5 col-span-2">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Verification URL</div>
                                  <div className="font-mono text-slate-600">https://contracts.marineworld.city/verify/VERIFY-{contractFields?.verificationCode || (activeContractId ? activeContractId.substring(0, 4).toUpperCase() : '9011')}</div>
                                </div>
                                <div className="border-b border-slate-200 pb-1.5 col-span-2">
                                  <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-1">Document Fingerprint (SHA-256)</div>
                                  <div className={`font-mono break-all ${isExecuted ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {isExecuted ? (firestoreContractData?.documentHash || documentHash || "Pending Publication") : "Pending Publication"}
                                  </div>
                                </div>
                              </div>
                              <div className="pt-3">
                                <div className="font-sans font-bold text-slate-500 uppercase tracking-wide mb-2">Immutable Ledger Record</div>
                                <ul className="space-y-1.5 font-mono text-[9px] text-slate-600">
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Record Initialized: {contractFields?.createdAt ? new Date(contractFields.createdAt).toISOString().replace("T", " ").substring(0, 19) : "2026-06-27 15:03:42"} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Final Approval: {contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 19) : "2026-06-27 15:48:11"} UTC</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Document Locked: {isExecuted ? (contractFields?.updatedAt ? new Date(contractFields.updatedAt).toISOString().replace("T", " ").substring(0, 19) : "2026-06-27 15:49:05") : "PENDING EXECUTION"} {isExecuted ? "UTC" : ""}</li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Registry Status: <span className={`${isExecuted ? 'text-emerald-600' : 'text-amber-500'} font-bold ml-1`}>{isExecuted ? "VERIFIED" : "NOT REGISTERED"}</span></li>
                                  <li className="flex items-center"><span className="mr-2 text-slate-400">•</span> Integrity Status: <span className={`${isExecuted ? 'text-emerald-600' : 'text-amber-500'} font-bold ml-1`}>{isExecuted ? "HASH VERIFIED" : "NOT AVAILABLE"}</span></li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-[8.5px] leading-[1.4] text-slate-600 font-inter text-justify border-t border-slate-300 pt-4 mt-6">
                          <div className="font-bold mb-1.5 uppercase tracking-wide text-slate-700">Platform Notice</div>
                          <p className="mb-2">
                            This Agreement was generated through MarineWorld Contract Studio, operated by ARGENTO MARITIME WORLDWIDE LLC, a Wyoming limited liability company. MarineWorld Contract Studio provides secure contract authoring, document management, registry, and integrity verification infrastructure only, and is not a party to this Agreement. The Platform does not assume responsibility for the commercial terms, legal validity, negotiations, execution, performance, or contractual obligations of the Parties, and all use is subject to the MarineWorld Terms of Service.
                          </p>
                          <p className="mb-2">
                            This Agreement has been registered within the MarineWorld Contract Studio Registry. Document integrity is protected through cryptographic hashing, version control, audit records, and secure registry verification. The cryptographic hash associated with this Agreement enables integrity verification by confirming that the document has not been altered since its registered version was generated.
                          </p>
                          <p className="mb-2">
                            Electronic records are maintained using infrastructure and recordkeeping practices aligned with applicable electronic transactions laws, including the Wyoming Uniform Electronic Transactions Act (UETA), without affecting the governing law expressly chosen by the Parties under this Agreement.
                          </p>
                          <p className="font-semibold">
                            Copyright &copy; MarineWorld Contract Studio. All rights reserved.
                          </p>
                        </div>
                      </div>
                    )}
                    <PageFooter />
                  </div>
                </div>
              );
            })}
            {/* --- END DYNAMIC PDF --- */}







                



                    </div>













            </div> {/* Closes zoom/print wrapper (5791) */}
          </div> {/* Closes contract-pages-container (5790) */}
        </div> {/* Closes main preview container (5624) */}
      </>
    )}
      {showExecutionModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0a1c34]/20/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0A203D] border border-emerald-500/30 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_60px_rgba(16,185,129,0.25)] text-center relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-[#00D4FF] animate-pulse"></div>
            
            {executionState === 'validating' && (
              <div className="py-8 space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-20 h-20 bg-[#00D4FF]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#00D4FF]/20 animate-pulse">
                    <Cpu size={36} className="text-[#00D4FF]" />
                  </div>
                  <div className="absolute top-0 right-1/2 translate-x-10 -translate-y-2">
                    <Zap size={18} className="text-amber-400 animate-bounce" fill="currentColor" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-sans font-bold text-[#00D4FF] tracking-widest uppercase mb-2">Contract Intelligence</h3>
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider font-manrope">Running AI Validation</h2>
                  <p className="text-[10px] text-slate-400 mt-3 font-sans px-4 leading-relaxed italic">
                    AI is scanning 14 technical clauses for liability gaps, jurisdictional conflicts, and commercial risks...
                  </p>
                </div>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

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
                    onClick={handleExportDocx} 
                    className="w-full mt-3 bg-[#6B7280]/10 hover:bg-[#6B7280]/25 border border-[#6B7280]/30 text-[#6B7280] hover:text-[#6B7280] shadow-[0_0_15px_rgba(107,114,128,0.1)] font-bold tracking-widest uppercase text-[10px] py-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(107,114,128,0.15)] cursor-pointer font-sans"
                  >
                    <Download size={13} /> EXPORT DOCX
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

      {showWalletCenterModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-[#0a1c34] border border-white/10 p-6 sm:p-8 rounded-2xl max-w-2xl w-full shadow-2xl shadow-black/80 relative overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-400"></div>
            
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-400/10 rounded-full flex items-center justify-center border border-emerald-400/20">
                  <CreditCard size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-wider font-manrope">Credit Wallet Center</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Operational Credits Consumed & Purchase History</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWalletCenterModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              >
                X
              </button>
            </div>

            <div className="mb-6 flex justify-between items-center bg-[#041326]/50 p-4 rounded-xl border border-emerald-400/20">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Current Balance</div>
                <div className="text-2xl font-bold text-emerald-400">{creditsBalance} <span className="text-[12px] text-emerald-400/70">CREDITS</span></div>
              </div>
              <button 
                onClick={() => {
                  setShowWalletCenterModal(false);
                  setShowBillingWallModal(true);
                }}
                className="bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Buy Credits
              </button>
            </div>

            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider mb-3">Transaction History</h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
              {purchaseHistory.length === 0 ? (
                <div className="text-center py-8 text-[#80868B] text-[11px] font-mono uppercase tracking-widest border border-dashed border-[#2B3347] rounded-lg">No transaction history found.</div>
              ) : (
                purchaseHistory.map((log, idx) => (
                  <div key={idx} className="bg-[#171B26] border border-[#2B3347] rounded-lg p-3 flex items-center justify-between hover:border-[#00D4FF]/30 transition-all group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-[#80868B] font-mono uppercase">TX-A2_{Math.random().toString(36).substring(2,10).toUpperCase()}</span>
                        <span className="w-1 h-1 bg-[#2B3347] rounded-full"></span>
                        <span className="text-[9px] text-[#80868B] font-mono">{log.date}</span>
                      </div>
                      <div className="text-[11px] font-bold text-white">{log.packet}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[12px] font-bold font-mono ${log.credits < 0 ? 'text-[#F28B82]' : 'text-[#00D68F]'}`}>
                        {log.credits > 0 ? '+' : ''}{log.credits}
                      </div>
                      <div className="text-[9px] text-[#80868B] font-mono uppercase mt-0.5">{log.price}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showDeploymentModal && (() => {
        const totalRecipients = deploymentLinks.length;
        
        // Merge state with dynamic recipientStatuses
        const activeRecipientsList = deploymentLinks.map(linkObj => {
          const dbMatch = recipientStatuses.find(r => r.email === linkObj.email || r.name === linkObj.name);
          return {
            ...linkObj,
            status: dbMatch ? dbMatch.status : 'PENDING'
          };
        });

        const acceptedCount = activeRecipientsList.filter(r => r.status === 'ACCEPTED').length;
        const underReviewCount = activeRecipientsList.filter(r => r.status === 'UNDER_REVIEW' || r.status === 'VIEWED').length;
        const revisionCount = activeRecipientsList.filter(r => r.status === 'REVISION REQUESTED' || r.status === 'REVISION_REQUESTED').length;
        const declinedCount = activeRecipientsList.filter(r => r.status === 'DECLINED').length;

        // Overall status message
        let overallStatusText = 'Awaiting Recipient Responses';
        let overallColorClass = 'text-yellow-400';
        let dotColorClass = 'bg-yellow-400';
        
        if (acceptedCount === totalRecipients && totalRecipients > 0) {
          overallStatusText = 'Fully Executed';
          overallColorClass = 'text-[#10B981]';
          dotColorClass = 'bg-[#10B981]';
        } else if (declinedCount > 0) {
          overallStatusText = 'Execution Declined';
          overallColorClass = 'text-rose-500';
          dotColorClass = 'bg-rose-500';
        } else if (revisionCount > 0) {
          overallStatusText = 'Revision Requested';
          overallColorClass = 'text-amber-500';
          dotColorClass = 'bg-amber-500';
        } else if (underReviewCount > 0) {
          overallStatusText = 'Under Review';
          overallColorClass = 'text-[#00D4FF]';
          dotColorClass = 'bg-[#00D4FF]';
        }

        return (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#071326]/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0b1b36] border border-white/10 p-8 rounded-2xl max-w-2xl w-full shadow-2xl shadow-[#00D4FF]/5 relative overflow-hidden animate-in zoom-in-95 font-manrope text-left flex flex-col max-h-[90vh]">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#10B981] to-[#00D4FF]"></div>
              
              <div className="flex items-start gap-5 mb-6 shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-[#10B981]/20 to-[#00D4FF]/20 rounded-full flex items-center justify-center border border-[#10B981]/30 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="text-[#10B981]" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Agreement Successfully Deployed</h3>
                  <div className="text-[13px] text-slate-300 mt-2 space-y-1.5 leading-relaxed">
                    <p className="font-semibold text-emerald-400">Secure execution invitations have been sent to all designated parties.</p>
                    <p>Recipients will receive a secure email allowing them to review the Agreement, request revisions, or formally accept its terms.</p>
                    <p className="text-slate-400">All responses will be automatically tracked within the Contract Studio Registry.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar space-y-5">
                {/* Recipients List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipients & Invitation Links</h4>
                  {activeRecipientsList.map((linkObj, idx) => {
                    const mailtoLink = `mailto:${linkObj.email}?subject=Signature Request: ${encodeURIComponent(contractFields.commercialFoundation?.title || 'Contract')}&body=${encodeURIComponent(`Hello ${linkObj.name},\n\nPlease review and sign the contract using the secure link below:\n\n${linkObj.link}\n\nThank you.`)}`;
                    
                    return (
                      <div key={idx} className="bg-[#050f1f] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-700 group-hover:bg-[#00D4FF] transition-colors"></div>
                        <div className="flex items-start justify-between mb-3 pl-2">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Part {idx + 1}</span>
                              <span className="text-xs font-bold text-[#00D4FF]">{linkObj.role}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                linkObj.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                linkObj.status === 'UNDER_REVIEW' || linkObj.status === 'VIEWED' ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20' :
                                linkObj.status === 'REVISION REQUESTED' || linkObj.status === 'REVISION_REQUESTED' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                linkObj.status === 'DECLINED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {linkObj.status === 'PENDING' ? 'AWAITING' : linkObj.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-white">{linkObj.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <Mail size={11} className="text-slate-500" />
                              {linkObj.email}
                            </div>
                          </div>
                          <a 
                            href={mailtoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                            title="Open email client to send link manually"
                          >
                            <Send size={10} className="text-slate-400" />
                            SEND EMAIL
                          </a>
                        </div>
                        <div className="flex gap-2 pl-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={linkObj.link}
                            className="flex-1 bg-black/60 border border-[#00D4FF]/20 rounded-md px-3 py-1.5 text-[10px] text-[#00D4FF] font-mono focus:outline-none selection:bg-[#00D4FF]/30"
                          />
                          <button 
                            onClick={() => navigator.clipboard.writeText(linkObj.link)}
                            className="bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 px-3 py-1.5 rounded-md flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                          >
                            <Copy size={12} /> COPY
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Execution Status Card */}
                <div className="bg-[#050f1f] border border-white/10 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3.5 border-b border-white/5 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Status</span>
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${overallColorClass} ${overallStatusText === 'Awaiting Recipient Responses' ? 'animate-pulse' : ''}`}>
                      <span className={`w-2 h-2 ${dotColorClass} rounded-full`}></span>
                      {overallStatusText}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-[#0b1b36] p-2.5 rounded-lg border border-white/5 text-center">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Notified</div>
                      <div className="text-sm font-extrabold text-white">{totalRecipients} of {totalRecipients}</div>
                    </div>
                    
                    <div className="bg-[#0b1b36] p-2.5 rounded-lg border border-white/5 text-center">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Accepted</div>
                      <div className="text-sm font-extrabold text-[#10B981]">{acceptedCount}</div>
                    </div>

                    <div className="bg-[#0b1b36] p-2.5 rounded-lg border border-white/5 text-center">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Under Review</div>
                      <div className="text-sm font-extrabold text-[#00D4FF]">{underReviewCount}</div>
                    </div>

                    <div className="bg-[#0b1b36] p-2.5 rounded-lg border border-white/5 text-center">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Revision Req.</div>
                      <div className="text-sm font-extrabold text-amber-500">{revisionCount}</div>
                    </div>

                    <div className="bg-[#0b1b36] p-2.5 rounded-lg border border-white/5 text-center">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Declined</div>
                      <div className="text-sm font-extrabold text-rose-500">{declinedCount}</div>
                    </div>
                  </div>
                </div>

                {/* Secure Notice Block */}
                <div className="p-4 bg-[#050f1f] border border-[#00D4FF]/20 rounded-xl flex items-start gap-3">
                  <Info size={18} className="text-[#00D4FF] shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <p className="font-semibold text-[#00D4FF] mb-0.5">Recipients are not required to create a MarineWorld account.</p>
                    <p className="text-slate-400">Each invitation contains a secure one-time execution link.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-5 border-t border-white/10 shrink-0">
                <div className="text-[10px] text-slate-400 font-mono">
                  <ShieldCheck size={12} className="inline mr-1 text-[#10B981] mb-0.5" /> 
                  Real-time synchronization active.
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setShowDeploymentModal(false);
                      if (onBack) onBack();
                    }}
                    className="py-2.5 px-5 bg-gradient-to-r from-[#00D4FF] to-[#0070F3] hover:from-[#00c2ff] hover:to-[#005ec3] text-white font-extrabold uppercase tracking-widest text-[10px] rounded-lg transition-all cursor-pointer shadow-lg shadow-[#00D4FF]/20 flex items-center gap-1.5"
                  >
                    Open Execution Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      setShowDeploymentModal(false);
                      if (onBack) onBack();
                    }}
                    className="py-2.5 px-6 bg-white hover:bg-slate-200 text-black font-extrabold uppercase tracking-widest text-[10px] rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-xl shadow-white/10"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showBillingWallModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-system-surface border border-white/10 p-8 rounded-2xl max-w-lg w-full shadow-2xl shadow-black/80 text-center relative overflow-hidden animate-in zoom-in-95 font-manrope">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-primary"></div>
            
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <CreditCard size={26} className="text-amber-500" />
            </div>
            
            <h3 className="text-[10px] font-manrope font-bold text-amber-500 tracking-wider uppercase mb-1">Insufficient Credit Balance</h3>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2 font-manrope">Execution Blocked</h2>
            
            <p className="text-[11.5px] text-slate-400 leading-relaxed mb-4 font-manrope">
              To perform AI assisted deployment, <strong className="text-primary font-bold font-manrope">Operational Credits</strong> are required. Standard deployment remains included in your subscription.
            </p>
            
            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
              <div className="text-left">
                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Active Plan</div>
                <div className="text-xs text-white font-bold">{currentPlan}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Available Credits</div>
                <div className="text-xs text-rose-400 font-bold">{creditsBalance}</div>
              </div>
            </div>

            <div className="bg-system-bg border border-white/5 rounded-xl p-4 mb-6 space-y-3 text-left">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wide font-manrope">Secure Credit Top-up Packages:</div>
              <div className="space-y-2">
                {[
                  { name: "Credit Pack 1,000", credits: 1000, price: "USD 19", description: "Starter Pack" },
                  { name: "Credit Pack 3,000", credits: 3000, price: "USD 49", description: "⭐ Most Popular" },
                  { name: "Credit Pack 10,000", credits: 10000, price: "USD 129", description: "Enterprise operations" }
                ].map((pack) => (
                  <button
                    key={pack.name}
                    onClick={() => {
                      buyCredits(pack.credits, pack.name, pack.price);
                      setShowBillingWallModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 bg-system-surface border rounded-lg text-left transition-all group cursor-pointer relative overflow-hidden ${
                      pack.description.includes("⭐") 
                        ? 'border-[#00D4FF] bg-[#00D4FF]/5 hover:bg-[#00D4FF]/10' 
                        : 'border-white/10 hover:border-[#00D4FF]/50 hover:bg-white/5'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-bold font-manrope ${pack.description.includes("⭐") ? 'text-[#00D4FF]' : 'text-white'}`}>{pack.name}</div>
                      <div className="text-[10px] text-slate-400 font-manrope">{pack.description} (+{pack.credits} Credits)</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold group-hover:underline font-manrope ${pack.description.includes("⭐") ? 'text-[#00D4FF]' : 'text-[#00D4FF]/80'}`}>{pack.credits.toLocaleString()} CREDITS</div>
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

      <PaymentConfigModal 
        isOpen={showBankDetailsModal} 
        onClose={() => setShowBankDetailsModal(false)}
        partyA={partyA}
        partyB={partyB}
        contractFields={contractFields}
        setContractFields={setContractFields}
      />

      {customInputModal?.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0b1221] border border-[#2B3347] p-6 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-bold tracking-wide">
                ADD CUSTOM {customInputModal.fieldTitle.toUpperCase()}
              </h3>
              <button 
                onClick={() => setCustomInputModal(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder={`Enter custom ${customInputModal.fieldTitle.toLowerCase()}`}
                className="w-full h-10 bg-[#171B26] border border-[#2B3347] rounded-lg px-3 text-sm text-white focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 outline-none transition-all placeholder:text-slate-500"
                value={customInputModal.value}
                onChange={(e) => setCustomInputModal({ ...customInputModal, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (customInputModal.callback && customInputModal.value.trim()) {
                      customInputModal.callback(customInputModal.value.trim());
                      setCustomInputModal(null);
                    }
                  } else if (e.key === 'Escape') {
                    setCustomInputModal(null);
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomInputModal(null)}
                  className="flex-1 py-2 rounded-lg border border-[#2B3347] text-slate-300 text-xs font-bold hover:bg-[#171B26] hover:text-white transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (customInputModal.callback && customInputModal.value.trim()) {
                      customInputModal.callback(customInputModal.value.trim());
                      setCustomInputModal(null);
                    }
                  }}
                  disabled={!customInputModal.value.trim()}
                  className="flex-1 py-2 rounded-lg bg-[#00D4FF] text-black text-xs font-bold hover:bg-[#00D4FF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ADD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeployModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#0b1221] border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl shadow-black relative overflow-hidden animate-in zoom-in-95 font-manrope">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#00D4FF] to-blue-600"></div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-2xl flex items-center justify-center border border-[#00D4FF]/20">
                <UploadCloud size={24} className="text-[#00D4FF]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Ready to Deploy</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Standard Deployment Process</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Cpu size={14} className="text-[#00D4FF]" />
                AI Validation (Recommended)
              </div>
              
              <div className="grid gap-3">
                <button 
                  onClick={() => setSelectedAiValidation('none')}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedAiValidation === 'none' ? 'bg-[#00D4FF]/5 border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAiValidation === 'none' ? 'border-[#00D4FF]' : 'border-slate-600'}`}>
                      {selectedAiValidation === 'none' && <div className="w-2.5 h-2.5 bg-[#00D4FF] rounded-full" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white">Skip AI Validation</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tight">Direct Standard Deployment</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Free</div>
                </button>

                <button 
                  onClick={() => setSelectedAiValidation('full')}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedAiValidation === 'full' ? 'bg-[#00D4FF]/5 border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAiValidation === 'full' ? 'border-[#00D4FF]' : 'border-slate-600'}`}>
                      {selectedAiValidation === 'full' && <div className="w-2.5 h-2.5 bg-[#00D4FF] rounded-full" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        Pre-Execution AI Validation
                        <span className="bg-[#00D4FF]/20 text-[#00D4FF] text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest">Premium</span>
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-tight">Final check: Risks, Missing Clauses, Compliance</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-widest">50 CR</div>
                </button>
              </div>
            </div>

            <div className="bg-black/40 rounded-2xl p-5 mb-8 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estimated Cost</span>
                <span className={`text-lg font-bold ${selectedAiValidation === 'full' ? 'text-[#00D4FF]' : 'text-white'}`}>
                  {selectedAiValidation === 'full' ? '50' : '0'} Operational Credits
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                {selectedAiValidation === 'full' 
                  ? "After validation the contract will be deployed automatically."
                  : "Standard deployment is included with every active subscription."
                }
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDeployModal(false)}
                className="bg-white/5 border border-white/10 text-slate-400 font-bold tracking-wider uppercase text-[10px] py-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                Back to Editor
              </button>
              
              {selectedAiValidation === 'full' ? (
                <button
                  onClick={async () => {
                    setShowDeployModal(false);
                    await handleExecute(50);
                  }}
                  className="bg-[#00D4FF] text-[#041326] font-bold tracking-widest uppercase text-[10px] py-4 rounded-xl hover:bg-[#33DDFF] transition-all shadow-[0_0_25px_rgba(0,212,255,0.3)] flex items-center justify-center gap-2"
                >
                  <Zap size={14} fill="currentColor" />
                  Run & Deploy
                </button>
              ) : (
                <button
                  onClick={async () => {
                    setShowDeployModal(false);
                    await handleExecute(0);
                  }}
                  className="bg-emerald-500 text-white font-bold tracking-widest uppercase text-[10px] py-4 rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                >
                  Deploy Without AI
                </button>
              )}
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
                      <button 
                        onClick={() => setShowUploadModal(null)}
                        className="w-full mt-4 bg-slate-500/10 hover:bg-slate-500/25 border border-slate-500/30 text-slate-400 font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg font-sans transition-all flex items-center justify-center cursor-pointer"
                      >
                        Cancel Upload
                      </button>
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
                              value={tempIssuedDate || ''}
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
                              value={tempExpiryDate || ''}
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
                      <button 
                        onClick={() => setShowUploadModal(null)}
                        className="flex-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg font-sans transition-all shadow-[0_4px_12px_rgba(244,63,94,0.15)] flex items-center justify-center gap-1.1 cursor-pointer"
                      >
                        Cancel
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

      {showPdfPreviewOverlay && previewShowCropMarks && (
        <style>{`
          .contract-page-sheet::before {
            content: '';
            position: absolute;
            top: 12px; left: 12px; right: 12px; bottom: 12px;
            border: 1px dashed rgba(148, 163, 184, 0.45);
            pointer-events: none;
            z-index: 50;
          }
          .contract-page-sheet {
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.05) !important;
          }
        `}</style>
      )}

      <ContractCopilot 
        contractId={activeContractId} 
        companyId={company?.id} 
        contractState={{ foundation, partyA, partyB, contractFields, jurisdiction, participants, clauses, wizardData, currentVersion, activeSection }}
      />
    </div>
  );
}
