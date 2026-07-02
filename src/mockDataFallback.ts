import { SaaSContract, SaaSInvoice, AuditLogEvent } from './types/saas';

export const mockContracts: SaaSContract[] = [
  {
    id: "mc-01",
    userId: "mock-user",
    title: "Voyage Charter Party - MV North Star",
    status: "Executed",
    createdAt: "2026-06-25T10:30:00Z",
    updatedAt: "2026-06-25T14:45:00Z",
    agreementType: "Voyage Charter Party Agreement",
    seller: "MarineWorld Logistics Ltd.",
    buyer: "North Star Shipping Corp.",
    contractValue: "125000",
    currency: "USD",
    applicableLaw: "English Maritime Law (LMAA)",
    riskScore: "Low",
    version: "1.0.0",
    partyA: { name: "MarineWorld Logistics Ltd.", role: "Carrier", email: "operations@marineworld.com" },
    partyB: { name: "North Star Shipping Corp.", role: "Charterer", email: "chartering@northstar.com" }
  },
  {
    id: "mc-02",
    userId: "mock-user",
    title: "Bareboat Charter Lease - Tug Atlas VII",
    status: "Executed",
    createdAt: "2026-06-22T08:15:00Z",
    updatedAt: "2026-06-23T09:20:00Z",
    agreementType: "Bareboat Charter Agreement",
    seller: "MarineWorld Fleet Corp.",
    buyer: "Pacific Dredging Joint Venture",
    contractValue: "340000",
    currency: "USD",
    applicableLaw: "Singapore Maritime Law",
    riskScore: "Low",
    version: "1.1.0",
    partyA: { name: "MarineWorld Fleet Corp.", role: "Lessor", email: "fleet@marineworld.com" },
    partyB: { name: "Pacific Dredging Joint Venture", role: "Lessee", email: "contracts@pacificdredge.com" }
  },
  {
    id: "mc-03",
    userId: "mock-user",
    title: "Marine Engineering & Retrofit SLA",
    status: "Draft",
    createdAt: "2026-06-27T16:00:00Z",
    updatedAt: "2026-06-28T11:30:00Z",
    agreementType: "Shipyard Refit & Retrofit Agreement",
    seller: "Symphony Cruise Lines",
    buyer: "Hamburg Marine Engineering GmbH",
    contractValue: "85000",
    currency: "EUR",
    applicableLaw: "German Shipyard Standards",
    riskScore: "Medium",
    version: "0.9.0",
    partyA: { name: "Symphony Cruise Lines", role: "Owner", email: "tech@symphonycruises.com" },
    partyB: { name: "Hamburg Marine Engineering GmbH", role: "Contractor", email: "retrofit@hamburgmarine.de" }
  },
  {
    id: "mc-04",
    userId: "mock-user",
    title: "Port Services & Stevedoring Agreement",
    status: "Review",
    createdAt: "2026-06-24T11:00:00Z",
    updatedAt: "2026-06-26T14:10:00Z",
    agreementType: "Port Agency & Stevedoring Agreement",
    seller: "MarineWorld Cargo Agency",
    buyer: "Terminal Operators Inc. (Houston)",
    contractValue: "62000",
    currency: "USD",
    applicableLaw: "US Maritime Law",
    riskScore: "Low",
    version: "1.0.0",
    partyA: { name: "MarineWorld Cargo Agency", role: "Agent", email: "cargo@marineworld.com" },
    partyB: { name: "Terminal Operators Inc. (Houston)", role: "Terminal Operator", email: "houston.ops@terminalops.com" }
  }
];

export const mockInvoices: SaaSInvoice[] = [
  {
    id: "minv-01",
    userId: "mock-user",
    date: "2026-06-25",
    plan: "Professional Plan",
    amount: "99.00",
    status: "paid",
    invoiceNumber: "INV-2026-0041"
  },
  {
    id: "minv-02",
    userId: "mock-user",
    date: "2026-06-12",
    plan: "B2B Credit Package - 1,000 credits",
    amount: "50.00",
    status: "paid",
    invoiceNumber: "INV-2026-0038"
  },
  {
    id: "minv-03",
    userId: "mock-user",
    date: "2026-05-25",
    plan: "Professional Plan",
    amount: "99.00",
    status: "paid",
    invoiceNumber: "INV-2026-0012"
  }
];

export const mockTransactions = [
  {
    id: "mtx-01",
    userId: "mock-user",
    amount: 1000,
    type: "credit",
    description: "B2B Auto Recharge Refill",
    timestamp: "2026-06-25T11:45:00Z"
  },
  {
    id: "mtx-02",
    userId: "mock-user",
    amount: 100,
    type: "debit",
    description: "AI drafting: Charter contract analysis",
    timestamp: "2026-06-25T10:35:00Z"
  },
  {
    id: "mtx-03",
    userId: "mock-user",
    amount: 150,
    type: "debit",
    description: "Compliance Scan: Tug Atlas VII",
    timestamp: "2026-06-23T08:30:00Z"
  }
];

export const mockAuditLogs: AuditLogEvent[] = [
  {
    id: "maudit-01",
    userId: "mock-user",
    actorName: "MarineWorld Admin",
    actorEmail: "unnabgroup@gmail.com",
    action: "Voyage Charter party agreement executed & signed securely by all signing parties.",
    timestamp: "2026-06-25T14:45:00Z",
    targetDocument: "Voyage Charter Party - MV North Star",
    ipAddress: "85.105.45.192"
  },
  {
    id: "maudit-02",
    userId: "mock-user",
    actorName: "MarineWorld Admin",
    actorEmail: "unnabgroup@gmail.com",
    action: "B2B wallet balance recharged automatically (+1,000 Credits).",
    timestamp: "2026-06-25T11:45:00Z",
    targetDocument: "Credit Wallet",
    ipAddress: "85.105.45.192"
  },
  {
    id: "maudit-03",
    userId: "mock-user",
    actorName: "MarineWorld Admin",
    actorEmail: "unnabgroup@gmail.com",
    action: "Security compliance scan completed for vessel Tug Atlas VII.",
    timestamp: "2026-06-23T08:30:00Z",
    targetDocument: "Bareboat Charter Lease - Tug Atlas VII",
    ipAddress: "85.105.45.192"
  },
  {
    id: "maudit-04",
    userId: "mock-user",
    actorName: "MarineWorld Admin",
    actorEmail: "unnabgroup@gmail.com",
    action: "Bareboat Charter Lease deployed and cryptographic links generated.",
    timestamp: "2026-06-22T08:15:00Z",
    targetDocument: "Bareboat Charter Lease - Tug Atlas VII",
    ipAddress: "85.105.45.192"
  }
];

export const mockWallet = {
  id: "mock-wallet-id",
  userId: "mock-user",
  creditsRemaining: 1850,
  creditsTotal: 2500,
  creditsUsed: 650,
  autoRecharge: true,
  rechargeThreshold: 200,
  rechargeAmount: 500
};

export const mockSubscription = {
  id: "mock-sub-id",
  userId: "mock-user",
  plan: "Professional",
  billingCycle: "Monthly",
  status: "active",
  amount: 99.00,
  creditsAllocated: 2500,
  currentPeriodStart: "2026-06-01T00:00:00Z",
  currentPeriodEnd: "2026-07-01T00:00:00Z"
};
