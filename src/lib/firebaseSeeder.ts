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
export async function seedUserDataIfNecessary(
  userId: string, 
  email: string, 
  displayName: string, 
  companyName: string,
  verificationCode?: string
): Promise<void> {
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
      role: "2 exhibitor",
      createdAt: batchTimestamp,
      twoFactorEnabled: false,
      emailVerifiedCustom: verificationCode ? false : true,
      verificationCodeCustom: verificationCode || null
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

  // Seed Workspace Owner Member
  const memberCollectionRef = collection(db, 'workspace_members');
  try {
    await addDoc(memberCollectionRef, {
      userId,
      name: displayName || email.split('@')[0],
      email: email,
      role: "Owner",
      status: "active",
      invitedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'workspace_members');
  }

  // Seed workspace initialization audit log
  const logsCollectionRef = collection(db, 'audit_logs');
  try {
    await addDoc(logsCollectionRef, {
      userId,
      actorName: displayName || email.split('@')[0],
      actorEmail: email,
      action: "Workspace environment initialized",
      targetDocument: "System Root",
      ipAddress: "127.0.0.1",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'audit_logs');
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
