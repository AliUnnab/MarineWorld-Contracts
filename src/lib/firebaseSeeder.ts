import { db, handleFirestoreError, OperationType } from '../../services/firebase-service';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { 
  UserProfile, 
  SaasSubscription, 
  CreditWallet, 
  SaaSContract, 
  WorkspaceMember, 
  AuditLogEvent, 
  SupportTicket, 
  SaaSInvoice 
} from '../types/saas';

// Automatically seed necessary Firestore documents for the user to make sure all metrics/modules have database sources
export async function seedUserDataIfNecessary(userId: string, email: string, displayName: string, companyName: string): Promise<void> {
  const userProfileRef = doc(db, 'users', userId);
  
  try {
    const profileSnap = await getDoc(userProfileRef);
    if (profileSnap.exists()) {
      return; // Already initialized
    }
  } catch (error) {
    console.error("Check user profile failed, ignoring and seeding:", error);
  }

  const batchTimestamp = new Date().toISOString();

  // Create User Profile
  try {
    await setDoc(userProfileRef, {
      uid: userId,
      email: email,
      displayName: displayName || email.split('@')[0],
      companyName: companyName || "Global Trade & Maritime Operations Ltd",
      role: "Administrator",
      createdAt: batchTimestamp,
      twoFactorEnabled: false
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }

  // Create Subscription (Professional level seeded by default)
  const subRef = doc(db, 'subscriptions', userId);
  try {
    await setDoc(subRef, {
      id: userId,
      userId: userId,
      plan: 'None',
      billingCycle: 'Monthly',
      status: 'pending_payment',
      amount: 0,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `subscriptions/${userId}`);
  }

  // Create Credit Wallet (Standard No Plan starting grant: 0 credits)
  const walletRef = doc(db, 'credit_wallets', userId);
  try {
    await setDoc(walletRef, {
      id: userId,
      userId: userId,
      creditsTotal: 0,
      creditsUsed: 0,
      creditsRemaining: 0,
      autoRecharge: false,
      rechargeThreshold: 200,
      rechargeAmount: 500
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `credit_wallets/${userId}`);
  }

  // Seed default credit transactions list
  const txCollectionRef = collection(db, 'credit_transactions');
  const transactions = [
    {
      userId,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      packet: "Professional Subscription Starting Grant",
      changeCredits: 2500,
      price: "$99.00",
      timestamp: serverTimestamp()
    },
    {
      userId,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      packet: "Contract Clause Generation (AI)",
      changeCredits: -120,
      price: "-120 Credits",
      timestamp: serverTimestamp()
    },
    {
      userId,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      packet: "Full Risk Assessment Report (AI)",
      changeCredits: -300,
      price: "-300 Credits",
      timestamp: serverTimestamp()
    }
  ];

  for (const tx of transactions) {
    try {
      await addDoc(txCollectionRef, tx);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'credit_transactions');
    }
  }

  // Seed default contracts list
  const contractsCollectionRef = collection(db, 'contracts');
  const seededContracts = [
    {
      userId,
      title: "Eastern Mediterranean Heavy Supply & Parts Procurement Covenant",
      agreementType: "Supply Agreement",
      seller: "Aegean Marine Machinery & Castings Ltd",
      buyer: companyName || "Global Trade & Maritime Operations Ltd",
      contractValue: "5000000",
      currency: "USD",
      status: "Verified",
      version: "v3 Approved",
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      title: "Hamburg Dry-Dock Facility Use & Refitting Framework Agreement",
      agreementType: "Commercial Service Agreement",
      seller: "Hamburg Ship Werft GMBH",
      buyer: companyName || "Global Trade & Maritime Operations Ltd",
      contractValue: "2350000",
      currency: "EUR",
      status: "Draft",
      version: "v1 Generated",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      title: "Maritime Spot Charter Party & Freight Booking Agreement (Shipment #4092)",
      agreementType: "Vessel Charter Agreement",
      seller: companyName || "Global Trade & Maritime Operations Ltd",
      buyer: "Singapore Trading Terminal Consortium",
      contractValue: "890000",
      currency: "USD",
      status: "Executed",
      version: "v5 Signed",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      title: "Bosphorus Agency & Marine Cargo Logistics Agreement",
      agreementType: "Agency Agreement",
      seller: "Bosphorus Brokerage & Representation House",
      buyer: companyName || "Global Trade & Maritime Operations Ltd",
      contractValue: "1120000",
      currency: "EUR",
      status: "Pending Review",
      version: "v2 Seller Revision",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const c of seededContracts) {
    try {
      await addDoc(contractsCollectionRef, c);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'contracts');
    }
  }

  // Seed Default Teammates/Workspace members
  const memberCollectionRef = collection(db, 'workspace_members');
  const teammates = [
    {
      userId,
      name: displayName || "Ali Unnab",
      email: email,
      role: "Owner",
      status: "active",
      invitedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      name: "Marcus Vance",
      email: "marcus.vance@marine-corp.org",
      role: "Legal Counsel",
      status: "active",
      invitedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      name: "Sienna Tanaka",
      email: "sienna.t@marine-corp.org",
      role: "Procurement Manager",
      status: "active",
      invitedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      name: "Jean-Pierre Laurent",
      email: "jp.laurent@trade-eu.com",
      role: "Reviewer",
      status: "pending",
      invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const t of teammates) {
    try {
      await addDoc(memberCollectionRef, t);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'workspace_members');
    }
  }

  // Seed default invoices list
  const invoiceCollectionRef = collection(db, 'invoices');
  const seededInvoices = [
    {
      userId,
      invoiceNumber: `INV-${100000 + Math.floor(Math.random() * 900000)}`,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: "$99.00",
      status: "paid",
      plan: "Professional Plan - June 2026"
    },
    {
      userId,
      invoiceNumber: `INV-${100000 + Math.floor(Math.random() * 900000)}`,
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: "$99.00",
      status: "paid",
      plan: "Professional Plan - May 2026"
    }
  ];

  for (const inv of seededInvoices) {
    try {
      await addDoc(invoiceCollectionRef, inv);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'invoices');
    }
  }

  // Seed default audit logs
  const logsCollectionRef = collection(db, 'audit_logs');
  const defaultAuditLogs = [
    {
      userId,
      actorName: displayName || "Ali Unnab",
      actorEmail: email,
      action: "Secure Login & Session Initialization",
      targetDocument: "Authentication Portal",
      ipAddress: "128.91.44.11",
      timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString()
    },
    {
      userId,
      actorName: "Sienna Tanaka",
      actorEmail: "sienna.t@marine-corp.org",
      action: "Contract Value Updated ($4.5M -> $5.0M)",
      targetDocument: "Eastern Mediterranean Heavy Supply Covenant",
      ipAddress: "144.195.12.83",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      actorName: "Marcus Vance",
      actorEmail: "marcus.vance@marine-corp.org",
      action: "Regulatory Compliance Check Approved (AI Risk Module)",
      targetDocument: "Eastern Mediterranean Heavy Supply Covenant",
      ipAddress: "92.110.4.39",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      userId,
      actorName: displayName || "Ali Unnab",
      actorEmail: email,
      action: "Template Duplication & Extraction Triggered",
      targetDocument: "Heavy Supply & Parts Procurement Agreement",
      ipAddress: "128.91.44.11",
      timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  for (const log of defaultAuditLogs) {
    try {
      await addDoc(logsCollectionRef, log);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'audit_logs');
    }
  }

  // Seed default support tickets
  const supportCollectionRef = collection(db, 'support_tickets');
  const defaultTickets = [
    {
      userId,
      subject: "Stripe Automated Invoicing Integration Queries",
      category: "Billing & Ledger",
      urgency: "normal",
      description: "Need guidance on mapping custom Stripe Connect payment Webhooks to our ERP ledger records synchronously.",
      status: "open",
      createdAt: new Date().toISOString()
    },
    {
      userId,
      subject: "Microsoft SSO Active Directory Sync Inquiry",
      category: "SSO & Identity Security",
      urgency: "high",
      description: "Our legal corp requires AD/SSO integration. Is Microsoft authentication fully covered under standard rules?",
      status: "resolved",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      reply: "SSO credentials mapped. Active Directory integration has been configured. Go to personal Settings -> Security Settings to toggle directory federation."
    }
  ];

  for (const t of defaultTickets) {
    try {
      await addDoc(supportCollectionRef, t);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'support_tickets');
    }
  }

  // Seed Master Contract templates (These are shared. If templates collection is empty, write 4 standard templates)
  try {
    const templatesSnap = await getDocs(collection(db, 'templates'));
    if (templatesSnap.empty) {
      const defaultTemplates = [
        {
          title: "Standard Dry-Cargo Vessel Sale Agreement",
          category: "Commercial",
          agreementType: "Sale Agreement",
          description: "Strict bilateral dry cargo vessel sale template based on Norwegian Sale Form (NSF) parameters.",
          premium: false,
          value: "3,500,000"
        },
        {
          title: "Commercial Maritime Heavy Supply & Foundry Parts Agreement",
          category: "Supply",
          agreementType: "Supply Agreement",
          description: "Engineering-focused parts supply agreement detailing precision parts fabrication, cast moldings, and warranties.",
          premium: false,
          value: "1,200,000"
        },
        {
          title: "Sovereign Yacht Charter Party & Leisure Slot Reservation Covenant",
          category: "Maritime",
          agreementType: "Vessel Charter Agreement",
          description: "Exclusive luxury leisure charter party and VIP marina berthing agreement detailing liability limits.",
          premium: true,
          value: "120,000"
        },
        {
          title: "B2B Legal Consulting Master Services Agreement",
          category: "Consulting",
          agreementType: "Master Services Agreement (MSA)",
          description: "B2B professional maritime law and procurement advisory service contract detailing monthly retainer and IP scopes.",
          premium: false,
          value: "450,000"
        },
        {
          title: "Exclusive Global Distribution & Logistics Hub Agreement",
          category: "Distribution",
          agreementType: "Distribution Agreement",
          description: "Bilateral wholesale distribution covenant with designated geo scopes, regional import clearances, and bulk discounts.",
          premium: true,
          value: "800,000"
        }
      ];

      for (const temp of defaultTemplates) {
        await addDoc(collection(db, 'templates'), temp);
      }
    }
  } catch (err) {
    console.error("Templates preseed error ignored:", err);
  }
}
