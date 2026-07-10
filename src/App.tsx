import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db, logAuditEvent } from '../services/firebase-service';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Import key B2B Portal Views
import LandingPage from './components/LandingPage';
import AuthScreens from './components/AuthScreens';
import SaaSLayout from './components/SaaSLayout';

import { VerificationView } from './components/VerificationView';
import ExecutionPortal from './components/ExecutionPortal';
import CookieConsent from './components/CookieConsent';

// Establish standard paths and fallback route mappings
type RoutePath = 
  | '/' 
  | '/login' 
  | '/register' 
  | '/forgot-password' 
  | '/verify-email' 
  | '/2fa'
  | '/verify'
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
  | '/support'
  | '/docs'
  | '/help'
  | '/trust'
  | '/security'
  | '/ai-docs'
  | '/reset-password';

const verifiedStripeSessions = new Set<string>();

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(() => {
    try {
      const cached = localStorage.getItem('cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  // Keep cached_user in sync with currentUser state
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cached_user', JSON.stringify({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0]
      }));
    } else {
      localStorage.removeItem('cached_user');
    }
  }, [currentUser]);

  const [appInitializing, setAppInitializing] = useState(true);
  
  // Real pathname-based router state with localStorage fallback for reload persistence
  const [currentRoute, setCurrentRoute] = useState<RoutePath>(() => {
    let path = localStorage.getItem('current_route') || window.location.pathname;
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }
    if (path.startsWith('/verify')) path = '/verify';
    const validPaths = [
      '/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa', '/verify',
      '/dashboard', '/repository', '/templates', '/new-contract', '/wallet', '/billing', 
      '/subscription', '/workspace', '/audit', '/settings', '/support',
      '/docs', '/help', '/trust', '/security', '/ai-docs', '/reset-password'
    ];
    return validPaths.includes(path) ? (path as RoutePath) : '/';
  });

  const currentRouteRef = React.useRef(currentRoute);
  useEffect(() => {
    currentRouteRef.current = currentRoute;
  }, [currentRoute]);

  // Synced URL navigator helper to support direct URLs and browser history links
  const navigateTo = (path: string) => {
    let cleanPath = path;
    if (cleanPath.endsWith('/') && cleanPath.length > 1) {
      cleanPath = cleanPath.slice(0, -1);
    }
    window.history.pushState(null, '', cleanPath);
    setCurrentRoute(cleanPath as RoutePath);
    localStorage.setItem('current_route', cleanPath);
  };

  // Sync URL bar on mount if restored from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('current_route');
    // Only restore cached route from localStorage if visiting the default root path
    if (window.location.pathname === '/') {
      if (stored && stored !== window.location.pathname) {
        window.history.replaceState(null, '', stored);
      }
    }
  }, []);

  const [verifyingSession, setVerifyingSession] = useState(false);

  useEffect(() => {
    if (appInitializing) return;

    // Check for session_id on mount
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId && currentUser) {
      handleVerifyStripeSession(sessionId);
    }
  }, [currentUser, appInitializing]);

  const handleVerifyStripeSession = async (sessionId: string) => {
    if (verifiedStripeSessions.has(sessionId)) {
      console.warn("[Stripe Verify] Session already being processed in memory:", sessionId);
      return;
    }
    verifiedStripeSessions.add(sessionId);

    setVerifyingSession(true);
    let verifySuccess = false;
    try {
      const { doc, getDoc, setDoc, updateDoc, collection, addDoc, increment } = await import('firebase/firestore');

      // Idempotency check: check if this Stripe Checkout Session has already been processed
      let sessionSnap;
      const sessionRef = doc(db, 'processed_stripe_sessions', sessionId);
      try {
        sessionSnap = await getDoc(sessionRef);
      } catch (err) {
        console.error("[Stripe Verify] Error reading processed_stripe_sessions for sessionId:", sessionId, err);
        throw err;
      }

      if (sessionSnap.exists()) {
        console.warn("[Stripe Verify] Checkout Session already processed and provisioned:", sessionId);
        verifySuccess = true;
        return;
      }

      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await response.json();

      if (data.success && currentUser) {
        const { userId, planId, mode, billingCycle } = data.metadata;
        console.log("[Stripe Verify] Session verification data success. Metadata:", data.metadata);

        if (mode === 'subscription') {
          // Find plan info
          const plans = [
            { id: 'Starter', price: 29, credits: 500 },
            { id: 'Professional', price: 99, credits: 2500 },
            { id: 'Enterprise', price: 299, credits: 10000 }
          ];
          const planInfo = plans.find(p => p.id === planId);

          if (planInfo) {
            const isAnnual = billingCycle === 'annual';
            const priceVal = isAnnual ? planInfo.price * 10 : planInfo.price;
            const billingCycleStr = isAnnual ? 'Annual' : 'Monthly';
            const periodDays = isAnnual ? 365 : 30;
            const currentPeriodStart = new Date().toISOString();
            const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

            // Update subscription details in Firestore block
            try {
              console.log("[Stripe Verify] Writing to subscriptions:", userId);
              await setDoc(doc(db, 'subscriptions', userId), {
                status: 'active',
                plan: planId,
                amount: priceVal,
                billingCycle: billingCycleStr,
                currentPeriodStart,
                currentPeriodEnd,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.error("[Stripe Verify] Failed to write to subscriptions for userId:", userId, err);
              throw err;
            }

            // Synchronize user profile planId
            try {
              console.log("[Stripe Verify] Writing planId to users:", userId);
              await setDoc(doc(db, 'users', userId), { planId: planId }, { merge: true });
            } catch (err) {
              console.error("[Stripe Verify] Failed to write planId to users for userId:", userId, err);
              throw err;
            }

            // Initialize/update credit wallets capacities
            try {
              console.log("[Stripe Verify] Writing to credit_wallets:", userId);
              await setDoc(doc(db, 'credit_wallets', userId), {
                id: userId,
                userId: userId,
                creditsTotal: planInfo.credits,
                creditsRemaining: planInfo.credits,
                creditsUsed: 0,
                autoRecharge: false,
                rechargeThreshold: 200,
                rechargeAmount: 500
              }, { merge: true });
            } catch (err) {
              console.error("[Stripe Verify] Failed to write to credit_wallets for userId:", userId, err);
              throw err;
            }

            // Synchronize wallets payment method
            try {
              console.log("[Stripe Verify] Writing to wallets:", userId);
              await setDoc(doc(db, 'wallets', userId), {
                isPaymentMethodValid: true,
                lastFour: 'Stripe',
                cardHolder: currentUser.displayName || currentUser.email || 'Customer',
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.error("[Stripe Verify] Failed to write to wallets for userId:", userId, err);
              throw err;
            }

            // Log invoice statement
            try {
              console.log("[Stripe Verify] Adding invoice for userId:", userId);
              await addDoc(collection(db, 'invoices'), {
                userId: userId,
                invoiceNumber: `INV-${100000 + Math.floor(Math.random() * 900000)}`,
                amount: `$${priceVal}.00`,
                status: 'paid',
                date: new Date().toISOString(),
                plan: `${planId} Plan Subscription`,
                description: `B2B ${planId} ${billingCycleStr} Subscription Activation`,
                downloadUrl: '#',
                customerName: currentUser.displayName || currentUser.email || 'Customer',
                workspaceId: `WS-${userId.substring(0, 8).toUpperCase()}`,
                taxNo: 'N/A',
                paymentMethod: 'Credit Card (•••• 4242)',
                paymentProvider: 'Stripe',
                transactionId: `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
              });
            } catch (err) {
              console.error("[Stripe Verify] Failed to add invoice for userId:", userId, err);
              throw err;
            }

            try {
              await logAuditEvent(userId, `Stripe Subscription Payment Verified & Activated: ${planId} Plan (${billingCycleStr}). Price: $${priceVal}.00`, "Billing & Subscription");
            } catch (logErr) {
              console.error("Payment verify log failed:", logErr);
            }

            // Mark session as processed to prevent double-crediting/provisioning
            try {
              console.log("[Stripe Verify] Marking processed_stripe_sessions:", sessionId);
              await setDoc(sessionRef, {
                processedAt: new Date().toISOString(),
                userId: userId,
                planId: planId,
                credits: planInfo.credits,
                mode: mode
              });
            } catch (err) {
              console.error("[Stripe Verify] Failed to mark processed session for sessionId:", sessionId, err);
              throw err;
            }

            verifySuccess = true;
          }
        } else if (mode === 'payment') {
          // It's a top-up (credits or emails)
          const packs = [
            // New packages
            { id: 'pkt_1000', name: 'Credit Pack', credits: 1000, price: '$19.00' },
            { id: 'pkt_3000', name: 'Credit Pack', credits: 3000, price: '$49.00' },
            { id: 'pkt_10000', name: 'Credit Pack', credits: 10000, price: '$129.00' },
            { id: 'emp_500', name: 'Starter Email Pack', credits: 500, price: '$10.00' },
            { id: 'emp_2500', name: 'Business Email Pack', credits: 2500, price: '$35.00' },
            { id: 'emp_10000', name: 'Enterprise Email Pack', credits: 10000, price: '$99.00' },
            // Old packages (for compatibility)
            { id: 'pkt_500', name: 'Starter Pact', credits: 500, price: '$15.00' },
            { id: 'pkt_1500', name: 'Corporate Pact', credits: 1500, price: '$40.00' },
            { id: 'pkt_5000', name: 'Elite Pact', credits: 5000, price: '$99.00' }
          ];
          const pack = packs.find(p => p.id === planId) || packs.find(p => p.name === planId);
          if (pack) {
            try {
              console.log("[Stripe Verify] Updating credit_wallets balance:", userId);
              await updateDoc(doc(db, 'credit_wallets', userId), {
                creditsTotal: increment(pack.credits),
                creditsRemaining: increment(pack.credits)
              });
            } catch (err) {
              console.error("[Stripe Verify] Failed to update credit_wallets for userId:", userId, err);
              throw err;
            }

            try {
              console.log("[Stripe Verify] Adding credit transaction log:", userId);
              await addDoc(collection(db, 'credit_transactions'), {
                userId: userId,
                date: new Date().toISOString().split('T')[0],
                packet: `Stripe Refill: ${pack.name}`,
                changeCredits: pack.credits,
                price: pack.price,
                timestamp: new Date().toISOString()
              });
            } catch (err) {
              console.error("[Stripe Verify] Failed to add credit transaction for userId:", userId, err);
              throw err;
            }

            try {
              console.log("[Stripe Verify] Adding invoice for refill:", userId);
              await addDoc(collection(db, 'invoices'), {
                userId: userId,
                invoiceNumber: `INV-${100000 + Math.floor(Math.random() * 900000)}`,
                date: new Date().toISOString().split('T')[0],
                amount: pack.price,
                status: "paid",
                plan: `Ad-hoc Refill Credits (${pack.credits} Pack)`,
                customerName: currentUser.displayName || currentUser.email || 'Customer',
                workspaceId: `WS-${userId.substring(0, 8).toUpperCase()}`,
                taxNo: 'N/A',
                paymentMethod: 'Credit Card (•••• 4242)',
                paymentProvider: 'Stripe',
                transactionId: `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
              });
            } catch (err) {
              console.error("[Stripe Verify] Failed to add invoice for refill:", userId, err);
              throw err;
            }

            // Synchronize wallets payment method
            try {
              console.log("[Stripe Verify] Writing wallets for refill:", userId);
              await setDoc(doc(db, 'wallets', userId), {
                isPaymentMethodValid: true,
                lastFour: 'Stripe',
                cardHolder: currentUser.displayName || currentUser.email || 'Customer',
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.error("[Stripe Verify] Failed to write to wallets for refill:", userId, err);
              throw err;
            }

            try {
              await logAuditEvent(userId, `Stripe Quota Refill Verified: ${pack.name} (+${pack.credits} Credits)`, "Billing & Subscription");
            } catch (logErr) {
              console.error("Quota refill verify log failed:", logErr);
            }

            // Mark session as processed to prevent double-crediting/provisioning
            try {
              console.log("[Stripe Verify] Marking processed session for top-up:", sessionId);
              await setDoc(sessionRef, {
                processedAt: new Date().toISOString(),
                userId: userId,
                planId: planId,
                credits: pack.credits,
                mode: mode
              });
            } catch (err) {
              console.error("[Stripe Verify] Failed to mark processed session for top-up:", sessionId, err);
              throw err;
            }

            verifySuccess = true;
          }
        }
      }
    } catch (err) {
      console.error("Session verification failed:", err);
      verifiedStripeSessions.delete(sessionId);
    } finally {
      setVerifyingSession(false);
      if (verifySuccess) {
        // Clean URL
        const currentPath = window.location.pathname;
        window.history.replaceState({}, document.title, currentPath);
        if (currentPath === '/') {
          navigateTo('/dashboard');
        } else {
          navigateTo(currentPath as RoutePath);
        }
      }
    }
  };

  useEffect(() => {
    // Sync React routing state with actual browser address bar pathname
    const handleLocationChange = () => {
      let path = window.location.pathname as string;
      if (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
      }
      if (path.startsWith('/verify')) path = '/verify';
      // Filter valid paths
      const validPaths = [
        '/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa', '/verify',
        '/dashboard', '/repository', '/templates', '/new-contract', '/wallet', '/billing', 
        '/subscription', '/workspace', '/audit', '/settings', '/support',
        '/docs', '/help', '/trust', '/security', '/ai-docs', '/reset-password'
      ];
      if (validPaths.includes(path)) {
        setCurrentRoute(path as RoutePath);
        localStorage.setItem('current_route', path);
      } else {
        const stored = localStorage.getItem('current_route');
        if (stored && validPaths.includes(stored)) {
          setCurrentRoute(stored as RoutePath);
        } else {
          setCurrentRoute('/'); // Fallback
        }
      }
    };

    // Listen to back/forward navigation in the iframe and preview tab
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // run immediately

    const isQuotaError = (error: any) => {
      return error && (
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('limit') ||
        error.message?.toLowerCase().includes('resource_exhausted') ||
        error.code === 'resource-exhausted'
      );
    };

    // Bind real-time Firebase Auth state change observer
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      const currentPath = currentRouteRef.current;
      try {
        if (window.sessionStorage.getItem('is_signing_out') === 'true') {
          window.sessionStorage.removeItem('is_signing_out');
          setCurrentUser(null);
          setAppInitializing(false);
          return;
        }
        if (user) {
          const isRegistering = window.sessionStorage.getItem('is_registering') === 'true';
          if (isRegistering) {
            setCurrentUser(user);
            return;
          }

          const quotaActive = window.localStorage.getItem('firestore_quota_exceeded') === 'true';
          if (quotaActive) {
            setCurrentUser(user);
            const urlParams = new URLSearchParams(window.location.search);
            const hasSessionId = urlParams.has('session_id');

            if (['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa'].includes(currentPath) && !hasSessionId) {
              navigateTo('/dashboard');
            }
            return;
          }

          const { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');

          let workspaceOwnerId = null;
          let teammateRole = null;
          let ownerCompanyName = "";

          try {
            const memberQuery = query(collection(db, 'workspace_members'), where('email', '==', user.email || ''));
            const memberSnap = await getDocs(memberQuery);
            
            if (!memberSnap.empty) {
              const memberData = memberSnap.docs[0].data();
              workspaceOwnerId = memberData.userId;
              teammateRole = memberData.role;
              
              // Get owner's company name
              const ownerDocRef = doc(db, 'users', workspaceOwnerId);
              const ownerDocSnap = await getDoc(ownerDocRef);
              if (ownerDocSnap.exists()) {
                ownerCompanyName = ownerDocSnap.data().companyName || "";
              }

              // Update status to 'active' if it was pending
              if (memberData.status === 'pending') {
                await updateDoc(memberSnap.docs[0].ref, { status: 'active' });
              }
            }
          } catch (memberErr) {
            console.error("Workspace member check failed:", memberErr);
          }

          let userDocSnap;
          try {
            const userDocRef = doc(db, 'users', user.uid);
            userDocSnap = await getDoc(userDocRef);
            
            if (!userDocSnap.exists()) {
              if (workspaceOwnerId) {
                // Auto-create user profile for teammate
                await setDoc(userDocRef, {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || user.email?.split('@')[0] || "Team Member",
                  companyName: ownerCompanyName || "Associated Workspace Group",
                  isTeammate: true,
                  workspaceOwnerId: workspaceOwnerId,
                  role: teammateRole,
                  createdAt: new Date().toISOString()
                });
                userDocSnap = await getDoc(userDocRef);
              } else {
                const isSSO = user.providerData.some(p => p.providerId === 'google.com' || p.providerId === 'microsoft.com');
                if (isSSO) {
                  const { seedUserDataIfNecessary } = await import('./lib/firebaseSeeder');
                  await seedUserDataIfNecessary(
                    user.uid,
                    user.email || "",
                    user.displayName || user.email?.split('@')[0] || "SSO User",
                    "Company Operations"
                  );
                  userDocSnap = await getDoc(userDocRef);
                } else {
                  const { signOut } = await import('firebase/auth');
                  await signOut(auth);
                  setCurrentUser(null);
                  window.localStorage.setItem('auth_error', 'Bu hesap Firestore veri tabanında kayıtlı değil. Giriş engellendi.');
                  navigateTo('/login');
                  return;
                }
              }
            } else {
              // Ensure teammate profile fields are up to date if they were invited
              if (workspaceOwnerId && (!userDocSnap.data().workspaceOwnerId || userDocSnap.data().role !== teammateRole)) {
                await setDoc(userDocRef, {
                  isTeammate: true,
                  workspaceOwnerId: workspaceOwnerId,
                  role: teammateRole,
                  companyName: ownerCompanyName || userDocSnap.data().companyName
                }, { merge: true });
                userDocSnap = await getDoc(userDocRef);
              }
            }
          } catch (getDocErr) {
            if (isQuotaError(getDocErr)) {
              console.warn("Quota limit detected during auth verification. Activating offline sandbox fallback.");
              window.localStorage.setItem('firestore_quota_exceeded', 'true');
              (window as any).__markQuotaExceeded?.();
              
              setCurrentUser(user);
              if (['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa'].includes(currentPath)) {
                navigateTo('/dashboard');
              }
              return;
            } else {
              throw getDocErr;
            }
          }
          
          setCurrentUser(user);
          
          const urlParams = new URLSearchParams(window.location.search);
          const hasSessionId = urlParams.has('session_id');

          if (['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa'].includes(currentPath) && !hasSessionId) {
            navigateTo('/dashboard');
          }
        } else {
          window.sessionStorage.removeItem('is_signing_out');
          
          // Check if we have a cached user in localStorage as a fallback for iframe sandbox / refresh persistence
          const cached = localStorage.getItem('cached_user');
          if (cached) {
            try {
              const cachedUserObj = JSON.parse(cached);
              if (cachedUserObj && cachedUserObj.uid) {
                console.log("[Auth Fallback] Restoring cached user from localStorage:", cachedUserObj.email);
                setCurrentUser(cachedUserObj as any);
                setAppInitializing(false);
                return;
              }
            } catch (e) {}
          }
          
          // If not logged in and requesting protected scopes, redirect to login gate
          if (!['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa', '/docs', '/help', '/trust', '/security', '/ai-docs', '/reset-password'].includes(currentPath) && !currentPath.startsWith('/verify')) {
            setCurrentUser(null);
            navigateTo('/login');
          } else {
            setCurrentUser(null);
            localStorage.setItem('current_route', currentPath);
          }
        }
      } catch (err) {
        console.error("Firestore user verification error:", err);
        // Engage simulated sandbox mode fallback for any database error to prevent kicking the user out
        window.localStorage.setItem('firestore_quota_exceeded', 'true');
        if (typeof (window as any).__markQuotaExceeded === 'function') {
          (window as any).__markQuotaExceeded();
        }
        if (user) {
          setCurrentUser(user);
          if (['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa'].includes(currentPath)) {
            navigateTo('/dashboard');
          }
        } else {
          if (!['/', '/login', '/register', '/forgot-password', '/verify-email', '/2fa', '/docs', '/help', '/trust', '/security', '/ai-docs', '/reset-password'].includes(currentPath) && !currentPath.startsWith('/verify')) {
            navigateTo('/login');
          }
        }
      } finally {
        setAppInitializing(false);
      }
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
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/verify-email', '/2fa', '/reset-password'].includes(currentRoute);
  const isVerificationRoute = currentRoute === '/verify' || window.location.pathname.startsWith('/verify');
  const isExecutionRoute = window.location.pathname.startsWith('/execute/');

  // Render routing state machine
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isExecutionRoute ? (
         <ExecutionPortal />
      ) : isVerificationRoute ? (
         <VerificationView />
      ) : currentUser && !isAuthRoute ? (
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
          {(currentRoute === '/' || (!['/login', '/register', '/forgot-password', '/verify-email', '/2fa', '/reset-password'].includes(currentRoute) && !isVerificationRoute && !isExecutionRoute)) && (
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

          {currentRoute === '/reset-password' && (
            <AuthScreens 
              initialMode="reset-password" 
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
      <CookieConsent />
    </div>
  );
};

export default App;
