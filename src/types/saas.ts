export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  companyName: string;
  role: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
  acceptableUsePolicyAccepted?: boolean;
  aupAcceptedAt?: string;
}

export interface SaasSubscription {
  id: string;
  userId: string;
  plan: 'Starter' | 'Professional' | 'Enterprise' | 'None';
  billingCycle: 'Monthly' | 'Annual';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'pending_payment';
  amount: number;
  creditsAllocated?: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface CreditWallet {
  id: string;
  userId: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  autoRecharge: boolean;
  rechargeThreshold: number;
  rechargeAmount: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  date: string;
  packet: string;
  changeCredits: number;
  price: string;
  timestamp: any;
}

export interface SaaSContract {
  id: string;
  userId: string;
  title: string;
  agreementType: string;
  seller: string;
  buyer: string;
  contractValue: string;
  currency: string;
  status: 'Draft' | 'Review' | 'Approval' | 'Executed' | 'Expired' | 'Pending Review' | 'Verified' | 'Cancelled' | 'Archived';
  riskScore?: 'Low' | 'Medium' | 'High';
  transactionType?: string;
  applicableLaw?: string;
  jurisdiction?: string;
  renewalDate?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  partyA?: { name: string; role: string; email?: string; address?: string };
  partyB?: { name: string; role: string; email?: string; address?: string };
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'Owner' | 'Legal Counsel' | 'Reviewer' | 'Finance' | 'Executive' | 'External Counsel' | 'Admin' | 'Procurement Manager';
  status: 'active' | 'pending';
  invitedAt: string;
}

export interface AuditLogEvent {
  id: string;
  userId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetDocument: string;
  ipAddress: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  reply?: string;
}

export interface SaaSInvoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  date: string;
  amount: string;
  status: 'paid' | 'unpaid' | 'overdue';
  plan: string;
}
