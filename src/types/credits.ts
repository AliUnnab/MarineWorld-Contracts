export type SubscriptionPlan = 'Starter' | 'Professional' | 'Enterprise' | 'None';

export interface CreditBalance {
  id: string; // userId
  userId: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  autoRecharge: boolean;
  rechargeThreshold: number;
  rechargeAmount: number;
  
  // New Operational Fields
  plan: SubscriptionPlan;
  monthlyAllocation: number;
  purchasedCredits: number;
  consumedCredits: number;
  todayUsage: number;
  assistantUsage: number;
  advisorUsage: number;
  lastResetDate: string;
  updatedAt: any;
}

export interface CreditLedgerEntry {
  id?: string;
  timestamp: string;
  userId: string;
  workspaceId: string; // usually same as userId in this app
  userEmail: string;
  module: 'Contract Assistant' | 'Contract AI Advisor' | 'Auto-Recharge' | 'Top-Up' | 'Monthly Allocation';
  action: string;
  creditsConsumed: number;
  creditsRemaining: number;
  status: 'success' | 'failed' | 'cancelled';
  transactionId: string;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  'Starter': 500,
  'Professional': 2500,
  'Enterprise': 10000,
  'None': 0
};

export const TOP_UP_PACKS = [
  { name: 'Starter Pact', credits: 500, price: 15 },
  { name: 'Corporate Pact', credits: 1500, price: 40 },
  { name: 'Elite Pact', credits: 5000, price: 99 }
];

export const ADVISOR_COSTS: Record<string, number> = {
  'Contract Summary': 15,
  'Executive Summary': 20,
  'Jurisdiction Analysis': 25,
  'Sanctions Screening': 25,
  'Clause Review': 30,
  'Liability Analysis': 30,
  'Missing Clause Detection': 35,
  'Redline Analysis': 35,
  'Risk Detection': 40,
  'Compliance Review': 40,
  'Full Contract Intelligence': 150
};

export const ASSISTANT_COST = 3;
export const REWRITE_COST = 1;

export const AI_COSTS = {
  ASSISTANT: ASSISTANT_COST,
  REWRITE: REWRITE_COST,
  ADVISOR_BASE: 5 // Base cost for general chat
};
