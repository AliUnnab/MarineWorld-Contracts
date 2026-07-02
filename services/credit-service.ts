import { 
  doc, 
  getDoc, 
  runTransaction, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './firebase-service';
import { 
  CreditBalance, 
  CreditLedgerEntry, 
  PLAN_LIMITS, 
  SubscriptionPlan,
  ASSISTANT_COST,
  ADVISOR_COSTS
} from '../src/types/credits';

export class CreditService {
  private static BALANCES_COLLECTION = 'credit_wallets';
  private static LEDGER_COLLECTION = 'credit_transactions';

  /**
   * Initializes or returns the credit balance for a user
   */
  static async ensureBalance(userId: string, email: string): Promise<CreditBalance> {
    const balanceRef = doc(db, this.BALANCES_COLLECTION, userId);
    const balanceSnap = await getDoc(balanceRef);

    if (!balanceSnap.exists()) {
      const defaultPlan: SubscriptionPlan = 'Starter';
      const initialCredits = PLAN_LIMITS[defaultPlan];
      
      const newBalance: Partial<CreditBalance> = {
        id: userId,
        userId,
        plan: defaultPlan,
        creditsTotal: initialCredits,
        creditsRemaining: initialCredits,
        creditsUsed: 0,
        monthlyAllocation: initialCredits,
        purchasedCredits: 0,
        consumedCredits: 0,
        todayUsage: 0,
        assistantUsage: 0,
        advisorUsage: 0,
        autoRecharge: false,
        rechargeThreshold: 500,
        rechargeAmount: 500,
        lastResetDate: new Date().toISOString(),
      };

      await runTransaction(db, async (transaction) => {
        transaction.set(balanceRef, {
          ...newBalance,
          updatedAt: serverTimestamp()
        });
        
        // Log initialization
        const ledgerRef = doc(collection(db, this.LEDGER_COLLECTION));
        transaction.set(ledgerRef, {
          timestamp: serverTimestamp(),
          date: new Date().toISOString().split('T')[0],
          userId,
          workspaceId: userId,
          userEmail: email,
          module: 'Monthly Allocation',
          action: 'Initial Allocation (Starter)',
          packet: 'Monthly Allocation: Initial Allocation (Starter)',
          creditsConsumed: 0,
          changeCredits: initialCredits,
          creditsRemaining: initialCredits,
          status: 'success',
          price: '0.00 USD',
          transactionId: ledgerRef.id
        });
      });

      return (await getDoc(balanceRef)).data() as CreditBalance;
    }

    return balanceSnap.data() as CreditBalance;
  }

  /**
   * Checks if the user has sufficient credits using the latest Firestore data
   */
  static async checkBalance(userId: string, cost: number): Promise<boolean> {
    const balanceRef = doc(db, this.BALANCES_COLLECTION, userId);
    try {
      const balanceSnap = await getDoc(balanceRef);
      if (!balanceSnap.exists()) return false;
      const balance = balanceSnap.data() as CreditBalance;
      return balance.creditsRemaining >= cost;
    } catch (err) {
      console.error("Error checking balance:", err);
      return false;
    }
  }

  /**
   * Deducts credits for an AI operation atomically
   */
  static async deductCredits(
    userId: string, 
    email: string, 
    module: 'Contract Assistant' | 'Contract AI Advisor',
    action: string,
    cost: number
  ): Promise<{ success: boolean; error?: string; warning?: string }> {
    const balanceRef = doc(db, this.BALANCES_COLLECTION, userId);

    try {
      return await runTransaction(db, async (transaction) => {
        const balanceSnap = await transaction.get(balanceRef);
        
        if (!balanceSnap.exists()) {
          throw new Error('Credit balance not initialized');
        }

        const balance = balanceSnap.data() as CreditBalance;

        if (balance.creditsRemaining < cost) {
          return { success: false, error: 'Insufficient operational credits' };
        }

        const newRemaining = balance.creditsRemaining - cost;
        const newUsed = (balance.creditsUsed || 0) + cost;
        const newConsumed = (balance.consumedCredits || 0) + cost;
        const newToday = (balance.todayUsage || 0) + cost;
        const newAssistant = module === 'Contract Assistant' ? (balance.assistantUsage || 0) + cost : (balance.assistantUsage || 0);
        const newAdvisor = module === 'Contract AI Advisor' ? (balance.advisorUsage || 0) + cost : (balance.advisorUsage || 0);

        // Update balance
        transaction.update(balanceRef, {
          creditsRemaining: newRemaining,
          creditsUsed: newUsed,
          consumedCredits: newConsumed,
          todayUsage: newToday,
          assistantUsage: newAssistant,
          advisorUsage: newAdvisor,
          updatedAt: serverTimestamp()
        });

        // Create ledger entry
        const ledgerRef = doc(collection(db, this.LEDGER_COLLECTION));
        transaction.set(ledgerRef, {
          timestamp: serverTimestamp(),
          date: new Date().toISOString().split('T')[0],
          userId,
          workspaceId: userId,
          userEmail: email,
          module,
          action,
          packet: `${module}: ${action}`,
          creditsConsumed: cost,
          changeCredits: -cost,
          creditsRemaining: newRemaining,
          status: 'success',
          price: 'Operational',
          transactionId: ledgerRef.id
        });

        // Check for Auto-Recharge
        if (balance.autoRecharge && newRemaining < 500) {
          const rechargeCredits = 500;
          const finalRemaining = newRemaining + rechargeCredits;
          
          transaction.update(balanceRef, {
            creditsRemaining: finalRemaining,
            creditsTotal: (balance.creditsTotal || 0) + rechargeCredits,
            purchasedCredits: (balance.purchasedCredits || 0) + rechargeCredits,
            updatedAt: serverTimestamp()
          });

          const rechargeLedgerRef = doc(collection(db, this.LEDGER_COLLECTION));
          transaction.set(rechargeLedgerRef, {
            timestamp: serverTimestamp(),
            date: new Date().toISOString().split('T')[0],
            userId,
            workspaceId: userId,
            userEmail: email,
            module: 'Auto-Recharge',
            action: 'Auto-Purchased Starter Pact (500 Credits)',
            packet: 'Auto-Recharge: Starter Pact (+500)',
            creditsConsumed: -rechargeCredits,
            changeCredits: rechargeCredits,
            creditsRemaining: finalRemaining,
            status: 'success',
            price: '15.00 USD',
            transactionId: rechargeLedgerRef.id
          });
        }

        return { success: true };
      });
    } catch (error: any) {
      console.warn('Credit deduction failed:', error);
      
      // If it's a quota error, we allow the action to proceed to not block the user during development/testing.
      if (error?.message?.includes("Quota exceeded") || error?.message?.includes("quota limits")) {
         return { success: true, warning: 'Quota exceeded, bypassing credit deduction for dev environment.' };
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Internal Credit System Error' };
    }
  }

  /**
   * Top-up credits manually
   */
  static async topUp(userId: string, email: string, credits: number, action: string, price: string = "$0"): Promise<void> {
    const balanceRef = doc(db, this.BALANCES_COLLECTION, userId);

    await runTransaction(db, async (transaction) => {
      const balanceSnap = await transaction.get(balanceRef);
      if (!balanceSnap.exists()) throw new Error('Balance not found');
      
      const balance = balanceSnap.data() as CreditBalance;
      const newRemaining = balance.creditsRemaining + credits;
      
      transaction.update(balanceRef, {
        creditsRemaining: newRemaining,
        purchasedCredits: (balance.purchasedCredits || 0) + credits,
        updatedAt: serverTimestamp()
      });

      const ledgerRef = doc(collection(db, this.LEDGER_COLLECTION));
      transaction.set(ledgerRef, {
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
        userId,
        workspaceId: userId,
        userEmail: email,
        module: 'Top-Up',
        action: action,
        packet: action,
        changeCredits: credits,
        creditsConsumed: -credits,
        creditsRemaining: newRemaining,
        price: price,
        status: 'success',
        transactionId: ledgerRef.id
      });
    });
  }

  /**
   * Subscribe to real-time balance
   */
  static subscribeToBalance(userId: string, callback: (balance: CreditBalance | null) => void, onError?: (err: any) => void) {
    return onSnapshot(doc(db, this.BALANCES_COLLECTION, userId), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as CreditBalance);
      } else {
        callback(null);
      }
    }, onError);
  }

  /**
   * Get transaction history
   */
  static subscribeToLedger(userId: string, callback: (entries: CreditLedgerEntry[]) => void) {
    const q = query(
      collection(db, this.LEDGER_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snap) => {
      const entries: CreditLedgerEntry[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        entries.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
        } as CreditLedgerEntry);
      });
      callback(entries);
    });
  }

  /**
   * Update Auto-Recharge setting
   */
  static async setAutoRecharge(userId: string, enabled: boolean): Promise<void> {
    const balanceRef = doc(db, this.BALANCES_COLLECTION, userId);
    await updateDoc(balanceRef, { autoRecharge: enabled, updatedAt: serverTimestamp() });
  }
}
