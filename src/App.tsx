import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../services/firebase-service';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Import key B2B Portal Views
import LandingPage from './components/LandingPage';
import AuthScreens from './components/AuthScreens';
import SaaSLayout from './components/SaaSLayout';

// Establish standard paths and fallback route mappings
type RoutePath = 
  | '/' 
  | '/login' 
  | '/register' 
  | '/forgot-password' 
  | '/verify-email' 
  | '/2fa'
  | '/dashboard'
  | '/repository'
  | '/templates'
  | '/new-contract'
  | '/wallet'
  | '/billing'
  | '/subscription'
  | '/workspace'
  | '/audit'
  | '/settings'
  | '/support';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appInitializing, setAppInitializing] = useState(true);
  
  // Real pathname-based router state
  const [currentRoute, setCurrentRoute] = useState<RoutePath>('/');

  // Synced URL navigator helper to support direct URLs and browser history links
  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentRoute(path as RoutePath);
  };

  const [verifyingSession, setVerifyingSession] = useState(false);

  useEffect(() => {
    // Check for session_id on mount
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId && currentUser) {
      handleVerifyStripeSession(sessionId);
    }
  }, [currentUser]);

  const handleVerifyStripeSession = async (sessionId: string) => {
    setVerifyingSession(true);
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await response.json();

      if (data.success && currentUser) {
        const { userId, planId, mode } = data.metadata;
        const { doc, setDoc, updateDoc, collection, addDoc, increment } = await import('firebase/firestore');

        if (mode === 'subscription') {
          // Find plan info
          const plans = [
            { id: 'Starter', price: 29, credits: 500 },
            { id: 'Professional', price: 99, credits: 2500 },
            { id: 'Enterprise', price: 450, credits: 10000 }
          ];
          const planInfo = plans.find(p => p.id === planId);

          if (planInfo) {
            // Update Firestore
            await setDoc(doc(db, 'subscriptions', currentUser.uid), {
              status: 'active',
              plan: planId,
              updatedAt: new Date().toISOString()
            }, { merge: true });

            await setDoc(doc(db, 'credit_wallets', currentUser.uid), {
              id: currentUser.uid,
              userId: currentUser.uid,
              creditsTotal: planInfo.credits,
              creditsRemaining: planInfo.credits,
              creditsUsed: 0,
              autoRecharge: false,
              rechargeThreshold: 200,
              rechargeAmount: 500
            }, { merge: true });

            await addDoc(collection(db, 'invoices'), {
              userId: currentUser.uid,
              invoiceNumber: `INV-${100000 + Math.floor(Math.random() * 900000)}`,
              amount: `$${planInfo.price}.00`,
              status: 'paid',
              date: new Date().toISOString(),
              plan: `${planId} Plan Subscription`,
              description: `B2B ${planId} Subscription Activation`,
              downloadUrl: '#'
            });
          }
        } else if (mode === 'payment') {
          // It's a top-up
          const packs = [
            { id: 'pkt_500', name: 'Starter Pact', credits: 500, price: '$15.00' },
            { id: 'pkt_1500', name: 'Corporate Pact', credits: 1500, price: '$40.00' },
            { id: 'pkt_5000', name: 'Elite Pact', credits: 5000, price: '$99.00' }
          ];
          const pack = packs.find(p => p.name === planId);
          if (pack) {
            await updateDoc(doc(db, 'credit_wallets', currentUser.uid), {
              creditsTotal: increment(pack.credits),
              creditsRemaining: increment(pack.credits)
            });

            await addDoc(collection(db, 'credit_transactions'), {
              userId: currentUser.uid,
              date: new Date().toISOString().split('T')[0],
              packet: `Stripe Refill: ${pack.name}`,
              changeCredits: pack.credits,
              price: pack.price,
              timestamp: new Date().toISOString()
            });

            await addDoc(collection(db, 'invoices'), {
              userId: currentUser.uid,
              invoiceNumber: `INV-${100000 + Math.floor(Math.random() * 900000)}`,
              date: new Date().toISOString().split('T')[0],
              amount: pack.price,
              status: "paid",
              plan: `Ad-hoc Refill Credits (${pack.credits} Pack)`
            });
          }
        }
      }
    } catch (err) {
      console.error("Session verification failed:", err);
    } finally {
      setVerifyingSession(false);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  useEffect(() => {
    // Sync React routing state with actual browser address bar pathname
    const handleLocationChange = () => {
      const path = window.location.pathname as RoutePath;
      // Filter valid paths
      const validPaths = [
        '/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa',
        '/dashboard', '/repository', '/templates', '/new-contract', '/wallet', '/billing', 
        '/subscription', '/workspace', '/audit', '/settings', '/support'
      ];
      if (validPaths.includes(path)) {
        setCurrentRoute(path);
      } else {
        setCurrentRoute('/'); // Fallback
      }
    };

    // Listen to back/forward navigation in the iframe and preview tab
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // run immediately

    // Bind real-time Firebase Auth state change observer
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // If they are logged in and hit the root public page, move them to workspace.
        // We DO NOT auto-redirect from /login or /register here, because
        // AuthScreens handles its own post-login sequences (2FA, Verify Email) and will call navigateTo manually.
        const currentPath = window.location.pathname;
        if (currentPath === '/') {
          navigateTo('/dashboard');
        }
      } else {
        setCurrentUser(null);
        // If not logged in and requesting protected scopes, redirect to login gate
        const currentPath = window.location.pathname;
        if (!['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa'].includes(currentPath)) {
          navigateTo('/');
        }
      }
      setAppInitializing(false);
    });

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      unsubscribeAuth();
    };
  }, []);

  if (appInitializing || verifyingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171B26] text-white">
        <div className="text-center font-mono">
          <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={36} />
          <p className="text-xs uppercase tracking-widest leading-relaxed text-[#BBC0C4]">
            {verifyingSession ? "Verifying B2B Secure Payment Authorization..." : "Initializing B2B Security Authorization Keyrings..."}
          </p>
        </div>
      </div>
    );
  }

  // Check if we are in an active auth screen route
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/verify-email', '/2fa'].includes(currentRoute);

  // Render routing state machine
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {currentUser && !isAuthRoute ? (
        // Evironment 02: Platform Workspace (Dark mode theme context is coordinated in SaaSLayout)
        <SaaSLayout 
          user={currentUser} 
          onLogout={() => {
            setCurrentUser(null);
            navigateTo('/');
          }}
          onNavigate={navigateTo}
          initialTab={
            currentRoute === '/repository' ? 'Contract Repository' :
            currentRoute === '/templates' ? 'Templates Library' :
            currentRoute === '/new-contract' ? 'New Contract' :
            currentRoute === '/wallet' ? 'Credit Wallet' :
            currentRoute === '/subscription' ? 'Subscription Center' :
            currentRoute === '/billing' ? 'Billing Center' :
            currentRoute === '/workspace' ? 'Team Management' :
            currentRoute === '/audit' ? 'Audit Logs' :
            currentRoute === '/settings' ? 'Settings' :
            currentRoute === '/support' ? 'Support Center' :
            'Dashboard'
          }
        />
      ) : (
        // Environment 01: Public Portal (Light style Stripe/Linear context)
        <>
          {currentRoute === '/' && (
            <LandingPage onNavigate={navigateTo} />
          )}

          {currentRoute === '/login' && (
            <AuthScreens 
              initialMode="login" 
              onNavigate={navigateTo} 
              onLoginSuccess={(signed) => setCurrentUser(signed)} 
            />
          )}

          {currentRoute === '/register' && (
            <AuthScreens 
              initialMode="register" 
              onNavigate={navigateTo} 
              onLoginSuccess={(signed) => setCurrentUser(signed)} 
            />
          )}

          {currentRoute === '/forgot-password' && (
            <AuthScreens 
              initialMode="forgot-password" 
              onNavigate={navigateTo} 
              onLoginSuccess={(signed) => setCurrentUser(signed)} 
            />
          )}

          {currentRoute === '/verify-email' && (
            <AuthScreens 
              initialMode="verify-email" 
              onNavigate={navigateTo} 
              onLoginSuccess={(signed) => setCurrentUser(signed)} 
            />
          )}

          {currentRoute === '/2fa' && (
            <AuthScreens 
              initialMode="2fa" 
              onNavigate={navigateTo} 
              onLoginSuccess={(signed) => setCurrentUser(signed)} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
