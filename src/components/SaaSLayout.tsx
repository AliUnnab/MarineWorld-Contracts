import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db, logAuditEvent } from '../../services/firebase-service';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { CreditService } from '../../services/credit-service';
import {
  LayoutDashboard, FolderKanban, FileType,
  Wallet, Award, CreditCard, Users, ShieldAlert, Logs,
  Settings, HelpCircle, LogOut, Loader2, Scale, Menu, X,
  CheckSquare, Workflow, Globe, ShieldCheck, Cpu, HardDrive, MapPin, Check
} from 'lucide-react';
import { Compass } from './Compass';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, SaasSubscription, CreditWallet } from '../types/saas';
import { mockWallet, mockSubscription } from '../mockDataFallback';

// Import newly created sub-views
import DashboardView from './DashboardView';
import RepositoryView from './RepositoryView';
import TemplatesView from './TemplatesView';
import WalletView from './WalletView';
import BillingView from './BillingView';
import SubscriptionView from './SubscriptionView';
import WorkspaceView from './WorkspaceView';
import AuditView from './AuditView';
import SettingsView from './SettingsView';
import SupportView from './SupportView';
import ContractStudio from '../../components/ContractStudio';
import OnboardingPricing from './OnboardingPricing';
import ComplianceModal from './ComplianceModal';

interface SaaSLayoutProps {
  user: any;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  initialTab?: string;
}

export default function SaaSLayout({ user, onLogout, onNavigate, initialTab = 'Dashboard' }: SaaSLayoutProps) {
  const isTR = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr');
  const t = (en: string, tr: string) => (isTR ? tr : en);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1440);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width < 1024) {
        setIsSidebarOpen(false);
      } else if (width < 1440) {
        setIsSidebarOpen(false); // Collapsed by default on Laptop
      } else {
        setIsSidebarOpen(true); // Expanded on Desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync state if prop changes (e.g. from browser back/forward)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(window.localStorage.getItem('firestore_quota_exceeded') === 'true');
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  useEffect(() => {
    if (loading || !user?.uid) return;
    const dbAccepted = profile?.acceptableUsePolicyAccepted === true;
    const localAccepted = window.localStorage.getItem(`aup_accepted_${user.uid}`) === 'true';

    if (!dbAccepted && !localAccepted) {
      setShowComplianceModal(true);
    } else {
      setShowComplianceModal(false);
    }
  }, [profile, user?.uid, loading]);

  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [deviceContext, setDeviceContext] = useState({
    ip: 'Querying...',
    country: 'Detecting...',
    city: 'Maritime Boundary',
    countryCode: 'TR',
    browser: 'Chrome/WebKit',
    os: 'Windows/MacOS'
  });

  useEffect(() => {
    const fetchDeviceMeta = async () => {
      let ip = '85.105.45.192';
      let country = 'Turkey';
      let city = 'Istanbul';
      let countryCode = 'TR';

      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          ip = data.ip || ip;
          country = data.country_name || country;
          city = data.city || city;
          countryCode = data.country_code || countryCode;
        }
      } catch (err) {
        console.warn("ipapi fallback check");
        try {
          const res2 = await fetch('https://api.ipify.org?format=json');
          if (res2.ok) {
            const data2 = await res2.json();
            ip = data2.ip || ip;
          }
        } catch (e) { }
      }

      const ua = navigator.userAgent;
      let browser = 'Chrome/Safari';
      if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Google Chrome';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
      else if (ua.includes('Edg')) browser = 'Microsoft Edge';

      let os = 'Desktop Client';
      if (ua.includes('Windows')) os = 'Windows OS';
      else if (ua.includes('Macintosh')) os = 'macOS Desktop';
      else if (ua.includes('Linux')) os = 'Linux OS';
      else if (ua.includes('Android')) os = 'Android Mobile';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Mobile';

      setDeviceContext({
        ip,
        country,
        city,
        countryCode,
        browser,
        os
      });
    };

    (window as any).__markQuotaExceeded = () => {
      console.warn("Global Quota Limit detected. Activating offline sandbox memory fallback.");
      window.localStorage.setItem('firestore_quota_exceeded', 'true');
      setQuotaExceeded(true);
    };

    fetchDeviceMeta();
  }, []);

  // 1. Listen to user profile (always based on user.uid)
  useEffect(() => {
    if (!user?.uid) return;

    const isQuotaError = (error: any) => {
      return error && (
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('limit') ||
        error.message?.toLowerCase().includes('resource_exhausted') ||
        error.code === 'resource-exhausted'
      );
    };

    const profileRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    }, (err) => {
      if (isQuotaError(err)) {
        console.warn("Profile listen failed in layout due to quota limit:", err.message);
        (window as any).__markQuotaExceeded?.();
      } else {
        console.error("Profile listen failed in layout:", err);
      }
    });

    return () => {
      unsubscribeProfile();
    };
  }, [user?.uid]);

  const activeWorkspaceId = profile?.workspaceOwnerId || user?.uid;

  // 2. Listen to subscription and wallet based on activeWorkspaceId
  useEffect(() => {
    if (!activeWorkspaceId) return;

    if (quotaExceeded) {
      setLoading(false);
      return;
    }

    const isQuotaError = (error: any) => {
      return error && (
        error.message?.toLowerCase().includes('quota') ||
        error.message?.toLowerCase().includes('limit') ||
        error.message?.toLowerCase().includes('resource_exhausted') ||
        error.code === 'resource-exhausted'
      );
    };

    // Listen to subscription state to route onboarding
    const subRef = doc(db, 'subscriptions', activeWorkspaceId);
    const unsubscribeSub = onSnapshot(subRef, (snap) => {
      if (snap.exists()) {
        setSubscription(snap.data() as SaasSubscription);
      }
      setLoading(false);
    }, (err) => {
      if (isQuotaError(err)) {
        console.warn("Subscription listen failed in layout due to quota limit:", err.message);
        (window as any).__markQuotaExceeded?.();
      } else {
        console.error("Subscription listen failed in layout:", err);
      }
      setLoading(false);
    });

    // Listen to wallet state to synchronize remaining credits
    const unsubscribeWallet = CreditService.subscribeToBalance(activeWorkspaceId, (bal) => {
      if (bal) {
        setWallet(bal as any);
      } else {
        // If wallet doesn't exist, ensure it
        CreditService.ensureBalance(activeWorkspaceId, user.email || '');
      }
    }, (err) => {
      if (isQuotaError(err)) {
        console.warn("Wallet balance listen failed in layout due to quota limit:", err.message);
        (window as any).__markQuotaExceeded?.();
      } else {
        console.error("Wallet balance listen error:", err);
      }
    });

    return () => {
      unsubscribeSub();
      unsubscribeWallet();
    };
  }, [activeWorkspaceId, quotaExceeded]);

  // Self-healing wallet credits synchronization
  useEffect(() => {
    if (!activeWorkspaceId || !subscription || loading) return;

    // If user subscription is active but wallet is empty (creditsTotal === 0 && creditsUsed === 0)
    // or wallet doesn't exist, provision default plan credits to credit_wallets.
    const isWalletEmpty = !wallet || (wallet.creditsTotal === 0 && wallet.creditsUsed === 0);
    const hasActiveSubscription = subscription.status === 'active' && subscription.plan !== 'None';

    if (hasActiveSubscription && isWalletEmpty) {
      const plans = [
        { id: 'Starter', credits: 500 },
        { id: 'Professional', credits: 2500 },
        { id: 'Enterprise', credits: 10000 }
      ];
      const planInfo = plans.find(p => p.id === subscription.plan);
      if (planInfo) {
        console.log(`[Self-Healing Wallet] Provisioning default ${planInfo.credits} credits for ${subscription.plan} plan.`);
        const walletRef = doc(db, 'credit_wallets', activeWorkspaceId);
        setDoc(walletRef, {
          id: activeWorkspaceId,
          userId: activeWorkspaceId,
          creditsTotal: planInfo.credits,
          creditsRemaining: planInfo.credits,
          creditsUsed: 0,
          autoRecharge: false,
          rechargeThreshold: 200,
          rechargeAmount: 500
        }, { merge: true }).catch(err => {
          console.error("[Self-Healing Wallet] Update failed:", err);
        });
      }
    }
  }, [activeWorkspaceId, subscription, wallet, loading]);

  const handleSignOut = async () => {
    try {
      window.sessionStorage.setItem('is_signing_out', 'true');
      if (user?.uid) {
        logAuditEvent(user.uid, "User signed out and terminated active session", "User Session Profile")
          .catch(auditErr => console.warn("Failed to log audit event on signout:", auditErr));
      }
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Signout failed:", err);
    } finally {
      window.localStorage.removeItem('firestore_quota_exceeded');
      onLogout();
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={15} />, path: '/dashboard' },
    { name: 'Contract Repository', icon: <FolderKanban size={15} />, path: '/repository' },
    { name: 'Templates Library', icon: <FileType size={15} />, path: '/templates' },
    { name: 'New Contract', icon: <Compass size={15} className="animate-spin-slow" />, path: '/new-contract' },
    { name: 'Credit Wallet', icon: <Wallet size={15} />, path: '/wallet' },
    { name: 'Subscription Center', icon: <Award size={15} />, path: '/subscription' },
    { name: 'Billing Center', icon: <CreditCard size={15} />, path: '/billing' },
    { name: 'Team Management', icon: <Users size={15} />, path: '/workspace' },
    { name: 'Audit Logs', icon: <Logs size={15} />, path: '/audit' },
    { name: 'Settings', icon: <Settings size={15} />, path: '/settings' },
    { name: 'Support Center', icon: <HelpCircle size={15} />, path: '/support' },
    { type: 'divider' },
    { name: 'Counterparties', icon: <Users size={15} />, path: '#', isUpcoming: true },
    { name: 'Approval Workflow', icon: <CheckSquare size={15} />, path: '#', isUpcoming: true },
    { name: 'Obligations Engine', icon: <Workflow size={15} />, path: '#', isUpcoming: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171B26] text-white">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#00D4FF] mx-auto mb-4" size={32} />
          <p className="text-sm font-mono uppercase tracking-widest text-[#BBC0C4]">Verifying Corporate Authority & Mapping Tenant Workspace...</p>
        </div>
      </div>
    );
  }

  // Intercept the UI if the user registered but has not selected/paid for a package yet, or if their subscription has expired.
  // We allow access to Billing and Subscription tabs so they can fix their account.
  const isAccountTab = activeTab === 'Billing Center' || activeTab === 'Subscription Center';

  const isExpired = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) < new Date() : false;
  const hasNoPlan = subscription?.plan === 'None' || !subscription;
  const isPending = subscription?.status === 'pending_payment';

  const activeWallet = quotaExceeded ? mockWallet : wallet;
  const activeSubscription = quotaExceeded ? mockSubscription : subscription;

  if ((hasNoPlan || isExpired || isPending) && !isAccountTab && !quotaExceeded) {
    return <OnboardingPricing userId={activeWorkspaceId} onPaymentSuccess={() => setActiveTab('Dashboard')} onLogout={onLogout} />;
  }

  const companyDisplayName = profile?.companyName || user?.displayName || (user?.email ? `${user.email.split('@')[0]}'s Workspace` : "Global Trade & Maritime Operations Ltd");

  return (
    <div className="min-h-screen bg-[#171B26] text-[#E8EAED] flex font-manrope overflow-hidden relative">
      {showComplianceModal && (
        <ComplianceModal
          userId={user?.uid || ''}
          userEmail={user?.email || ''}
          onAccepted={() => setShowComplianceModal(false)}
        />
      )}

      {/* Mobile/Tablet Full Screen Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#171B26] lg:hidden flex flex-col"
          >
            <div className="h-16 shrink-0 border-b border-[#2B3347] bg-[#202636] flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <Compass size={32} className="text-[#00D4FF] animate-spin-slow shrink-0" />
                <h1 className="text-sm font-manrope font-extrabold text-[#00D4FF] tracking-tighter uppercase">MARINEWORLD</h1>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-[#BBC0C4] hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item, idx) => {
                if ('type' in item && item.type === 'divider') {
                  return <div key={`mob-div-${idx}`} className="h-px bg-[#2B3347] my-2 mx-2 opacity-50" />;
                }
                const navItem = item as any;
                return (
                  <button
                    key={navItem.name}
                    onClick={() => {
                      if (navItem.isUpcoming) return;
                      setActiveTab(navItem.name);
                      onNavigate(navItem.path);
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={navItem.isUpcoming}
                    className={`w-full h-[56px] px-6 rounded-lg text-[15px] font-semibold normal-case flex items-center gap-4 transition-all ${activeTab === navItem.name
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 font-bold'
                      : navItem.isUpcoming ? 'text-[#4A5568] grayscale opacity-50' : 'text-slate-200 active:bg-[#2B3347]'
                      }`}
                  >
                    <span className={activeTab === navItem.name ? 'text-[#00D4FF]' : 'text-[#80868B]'}>{navItem.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="tracking-normal">{navItem.name}</span>
                      {navItem.isUpcoming && <span className="text-[10px] text-[#00D4FF] font-mono tracking-tighter opacity-70">Protocol v1.2</span>}
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-[#2B3347] bg-[#202636]">
              <button
                onClick={handleSignOut}
                className="w-full h-14 rounded-lg bg-[#202636] text-[#F28B82] border border-[#F28B82]/20 font-bold uppercase text-[14px] flex items-center justify-center gap-2 hover:bg-[#F28B82]/10 transition-all"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Core Rail - Laptop/Desktop only */}
      <motion.aside
        initial={false}
        animate={{
          width: windowWidth < 1024 ? 0 : (isSidebarOpen ? 280 : 80),
          opacity: windowWidth < 1024 ? 0 : 1
        }}
        className="bg-[#202636] border-r border-[#2B3347] flex flex-col justify-between shrink-0 h-screen select-none overflow-hidden relative z-50 hidden lg:flex"
      >
        <div className={isSidebarOpen ? "w-[280px] flex flex-col h-full" : "w-[80px] flex flex-col h-full items-center"}>
          {/* Upper Brand Selector */}
          <div className={`h-14 flex items-center bg-[#202636] border-b border-[#2B3347] gap-3 shrink-0 ${isSidebarOpen ? 'px-6' : 'justify-center w-full'}`}>
            <Compass size={32} className="text-[#00D4FF] animate-spin-slow shrink-0" />
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-manrope font-extrabold text-[#00D4FF] tracking-tighter uppercase whitespace-nowrap">MARINEWORLD</h1>
                <span className="flex items-center gap-1 text-[9px] text-[#00D68F] font-mono mt-0.5 uppercase tracking-tighter whitespace-nowrap">
                  <span className="w-1 h-1 rounded-full bg-[#00D68F] animate-pulse"></span> CONTRACT STUDIO
                </span>
              </div>
            )}
          </div>

          {/* Org Name Bar Selector */}
          {isSidebarOpen && (
            <div className="p-4 px-6 border-b border-[#2B3347]/50 bg-[#2B3347]/30 flex items-center justify-between text-left shrink-0">
              <div className="truncate max-w-[190px]">
                <span className="text-[8px] text-[#80868B] uppercase font-mono font-bold leading-none">Active B2B Tenant</span>
                <p className="text-[11px] font-manrope font-semibold text-white truncate leading-tight mt-0.5 uppercase">{companyDisplayName}</p>
              </div>
              <span className="text-[9px] bg-[#2B3347] text-[#BBC0C4] px-1 border border-[#2B3347] rounded font-mono uppercase">RBAC</span>
            </div>
          )}

          {/* Navigation Links List */}
          <nav className={`p-3 space-y-1 overflow-y-auto flex-1 scrollbar-hide ${!isSidebarOpen ? 'flex flex-col items-center pt-6' : ''}`}>
            {navItems.map((item, idx) => {
              if ('type' in item && item.type === 'divider') {
                return isSidebarOpen ? <div key={`div-${idx}`} className="h-px bg-[#2B3347] my-4 mx-4 opacity-50" /> : null;
              }
              const navItem = item as any;
              const isActive = activeTab === navItem.name;

              return (
                <button
                  key={navItem.name}
                  title={!isSidebarOpen ? navItem.name : undefined}
                  onClick={() => {
                    if (navItem.isUpcoming) return;
                    setActiveTab(navItem.name);
                    onNavigate(navItem.path);
                  }}
                  disabled={navItem.isUpcoming}
                  className={`relative flex items-center gap-3 transition-all rounded normal-case font-semibold text-[13px] tracking-normal ${isSidebarOpen ? 'w-full px-4 py-2.5' : 'w-12 h-12 justify-center'
                    } ${isActive
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 font-bold'
                      : navItem.isUpcoming ? 'text-[#4A5568]/70 grayscale opacity-40' : 'text-slate-200 hover:text-white hover:bg-[#2B3347]'
                    }`}
                >
                  <span className={isActive ? 'text-[#00D4FF]' : 'text-[#80868B]'}>{navItem.icon}</span>
                  {isSidebarOpen && (
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="truncate">{navItem.name}</span>
                      {navItem.isUpcoming && <span className="text-[8px] text-[#00D4FF] font-mono tracking-tighter opacity-70">v1.2 Protocol</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Lower Auth Block Footer */}
          <div className={`p-4 border-t border-[#2B3347] bg-[#2B3347]/30 shrink-0 ${!isSidebarOpen ? 'flex flex-col items-center' : ''}`}>
            {isSidebarOpen && (
              <div className="flex items-center justify-between gap-2.5 mb-4 text-left">
                <div className="truncate max-w-[150px]">
                  <p className="text-[10px] font-bold text-white truncate leading-tight uppercase font-mono">{profile?.displayName || user?.displayName || user?.email?.split('@')[0] || "USER"}</p>
                  <span className="text-[9px] text-[#80868B] font-mono block tracking-tight truncate leading-none mt-0.5">{user?.email || "No Email"}</span>
                </div>
                <span className="px-1.5 py-0.5 text-[8px] bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/25 rounded font-mono uppercase font-bold">
                  {profile?.isTeammate ? (profile?.role || "Team Member") : "Admin"}
                </span>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className={`rounded bg-[#202636] hover:bg-[#F28B82]/10 border border-[#2B3347] hover:border-[#F28B82]/25 text-[#BBC0C4] hover:text-[#F28B82] text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${isSidebarOpen ? 'w-full py-2.5 px-3' : 'w-12 h-12'
                }`}
            >
              <LogOut size={isSidebarOpen ? 11 : 16} /> {isSidebarOpen && "Terminate"}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content viewport */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Global Header - Sticky Top Bar */}
        <header className="h-14 border-b border-[#2B3347] bg-[#202636]/95 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-[60] sticky top-0">
          <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger for Mobile/Tablet */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-[#BBC0C4] hover:text-[#00D4FF]"
              >
                <Menu size={24} />
              </button>

              {/* Collapse/Expand for Laptop/Desktop */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:flex p-1.5 hover:bg-[#2B3347] rounded text-[#80868B] hover:text-[#00D4FF] transition-all"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              {/* Logo for Mobile/Tablet */}
              <div className="lg:hidden flex items-center gap-2">
                <Compass size={32} className="text-[#00D4FF] animate-spin-slow shrink-0" />
                <h1 className="text-[12px] font-manrope font-extrabold text-[#00D4FF] tracking-tighter uppercase">MARINEWORLD</h1>
              </div>

              <div className="hidden md:flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest text-[#80868B]">
                <span className="text-[#00D4FF]">Operations Terminal</span>
                <span className="opacity-20 text-white">/</span>
                <span className="text-white">{activeTab}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="hidden lg:flex items-center gap-4 bg-[#202636] px-3 py-1.5 rounded border border-white/5">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-bold text-[#80868B] uppercase leading-none">Operational Capacity</span>
                  <span className="text-xs font-mono font-bold text-[#00D68F] mt-1">{activeWallet?.creditsRemaining ?? activeSubscription?.creditsAllocated ?? 0} Credits</span>
                </div>
                <div className="w-px h-6 bg-[#2B3347]"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-[#80868B] uppercase leading-none">Subscription Tier</span>
                  <span className="text-xs font-bold text-white mt-1 uppercase tracking-tighter">{activeSubscription?.plan || 'Free'}</span>
                </div>
              </div>

              <button
                onClick={() => setIsProfileDrawerOpen(true)}
                className="flex items-center gap-3 md:border-l md:border-[#2B3347] md:pl-6 text-left group hover:opacity-90 transition-all focus:outline-none"
                title="Profile & System Information"
              >
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tight leading-none group-hover:text-[#00D4FF] transition-colors">{profile?.displayName || user.email?.split('@')[0]}</span>
                  <span className="text-[9px] font-mono text-[#80868B] uppercase mt-1 tracking-tighter group-hover:text-white transition-colors">{profile?.companyName || 'Corporate Entity'}</span>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#2B3347] group-hover:bg-[#00D4FF]/10 border border-[#2B3347] group-hover:border-[#00D4FF]/30 flex items-center justify-center font-bold text-[10px] text-[#00D4FF] group-hover:scale-105 font-mono uppercase transition-all shadow-md">
                  {user.email?.[0].toUpperCase()}
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col relative w-full">
          {quotaExceeded && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-300 font-manrope shrink-0 z-10 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping shrink-0" />
                <span>
                  <strong>⚡ DEMO INFRASTRUCTURE STATUS:</strong> Simulated Sandbox Mode (Offline/Local Memory Fallback Active).
                  The free daily Firestore read quota for this demo has been exceeded. All application views are fully functional using simulated high-performance local memory.
                </span>
              </div>
              <button
                onClick={() => {
                  window.localStorage.removeItem('firestore_quota_exceeded');
                  window.location.reload();
                }}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded font-bold uppercase text-[9px] tracking-wider transition-colors shrink-0 cursor-pointer self-stretch sm:self-auto text-center"
              >
                Retry Live Connection
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-full bg-[#171B26]"
            >
              {activeTab === 'Dashboard' && (
                <DashboardView
                  userId={activeWorkspaceId}
                  orgName={companyDisplayName}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab);
                    const item = navItems.find(n => n.name === tab);
                    if (item) onNavigate(item.path);
                  }}
                />
              )}

              {activeTab === 'Contract Repository' && (
                <RepositoryView
                  userId={activeWorkspaceId}
                  onOpenContract={(contract) => {
                    setActiveTab('New Contract');
                    onNavigate(`/new-contract?id=${contract.id}`);
                  }}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab);
                    const item = navItems.find(n => n.name === tab);
                    if (item) onNavigate(item.path);
                  }}
                />
              )}

              {activeTab === 'Templates Library' && (
                <TemplatesView
                  userId={activeWorkspaceId}
                  companyName={companyDisplayName}
                  onDeployTemplate={(agreementType, contractId) => {
                    if (contractId) {
                      setActiveTab('New Contract');
                      onNavigate(`/new-contract?id=${contractId}`);
                    } else {
                      setActiveTab('Contract Repository');
                      onNavigate('/repository');
                    }
                  }}
                />
              )}

              {activeTab === 'New Contract' && (
                <div className="flex-1 h-full overflow-hidden flex flex-col min-h-0">
                  <ContractStudio
                    company={{ id: activeWorkspaceId, name: companyDisplayName }}
                    onBack={() => {
                      setActiveTab('Dashboard');
                      onNavigate('/dashboard');
                    }}
                  />
                </div>
              )}


              {activeTab === 'Credit Wallet' && (
                <WalletView userId={activeWorkspaceId} />
              )}

              {activeTab === 'Subscription Center' && (
                <SubscriptionView userId={activeWorkspaceId} />
              )}

              {activeTab === 'Billing Center' && (
                <BillingView userId={activeWorkspaceId} userDisplayName={profile?.displayName || user?.displayName} />
              )}

              {activeTab === 'Team Management' && (
                <WorkspaceView
                  userId={activeWorkspaceId}
                  userEmail={user.email}
                  subscriptionPlan={subscription?.plan}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'Audit Logs' && (
                <AuditView userId={activeWorkspaceId} />
              )}

              {activeTab === 'Settings' && (
                <SettingsView userId={activeWorkspaceId} />
              )}

              {activeTab === 'Support Center' && (
                <SupportView userId={activeWorkspaceId} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Interactive Profile & Security Sidebar Drawer */}
        <AnimatePresence>
          {isProfileDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProfileDrawerOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] cursor-pointer"
              />

              {/* Sidebar Sheet */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1B202E] border-l border-[#2B3347] z-[160] shadow-2xl flex flex-col text-left text-sm select-none"
              >
                {/* Header */}
                <div className="p-5 border-b border-[#2B3347] flex items-center justify-between bg-[#202636]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-[#00D4FF]" size={18} />
                    <div>
                      <h3 className="font-manrope font-bold text-white uppercase text-xs tracking-wider">{t("Profile & Operational Security", "Profile & Operational Security")}</h3>
                      <p className="text-[10px] text-[#80868B] font-mono uppercase mt-0.5">Corporate Identity & SecOps</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsProfileDrawerOpen(false)}
                    className="p-1.5 rounded bg-[#171B26] border border-[#2B3347] text-[#BBC0C4] hover:text-white transition-all hover:bg-[#2B3347]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  {/* User Identity Info */}
                  <div className="bg-[#202636] border border-[#2B3347] p-5 rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center font-bold text-lg text-[#00D4FF] font-mono">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base leading-tight uppercase">{profile?.displayName || user.email?.split('@')[0]}</h4>
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 font-mono font-bold uppercase">
                          {profile?.isTeammate ? t(profile?.role || "Team Member", profile?.role || "Team Member") : t("ADMINISTRATOR (ADMIN)", "ADMINISTRATOR (ADMIN)")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3.5 border-t border-[#2B3347]/50 pt-4 text-xs font-mono">
                      <div>
                        <span className="text-[#80868B] text-[9px] uppercase tracking-wider block font-bold">{t("Corporate Email", "Corporate Email")}</span>
                        <p className="text-white font-medium mt-0.5 select-all">{user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[#80868B] text-[9px] uppercase tracking-wider block font-bold">{t("B2B Password Security", "B2B Password Security")}</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-white font-medium">••••••••••••</p>
                          <span className="text-[9px] bg-[#171B26] border border-[#2B3347] text-[#80868B] px-1.5 py-0.5 rounded uppercase">
                            {t("AES-256 Encrypted", "AES-256 Encrypted")}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[#80868B] text-[9px] uppercase tracking-wider block font-bold">{t("Associated Tenant", "Associated Tenant")}</span>
                        <p className="text-[#00D4FF] font-medium mt-0.5 uppercase">{companyDisplayName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Package & Limits Capacity */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono font-bold">{t("Package & Quota limits", "Package & Quota Limits")}</h5>
                    <div className="bg-[#202636] border border-[#2B3347] p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="text-[#FDD663]" size={16} />
                          <span className="text-white font-semibold">{t("Active Plan", "Active Plan")}</span>
                        </div>
                        <span className="text-xs bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/25 font-mono font-bold px-2 py-0.5 rounded uppercase">
                          {activeSubscription?.plan || 'Free'} TIER
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#BBC0C4]">{t("Remaining Credit Balance", "Remaining Credit Balance")}</span>
                          <span className="text-white font-mono font-semibold">{activeWallet?.creditsRemaining ?? 0} / {activeWallet?.creditsTotal ?? 0} Credits</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#171B26] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00D68F] transition-all duration-500"
                            style={{
                              width: `${activeWallet?.creditsTotal ? Math.min(100, Math.max(0, (activeWallet.creditsRemaining / activeWallet.creditsTotal) * 100)) : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Seat Capacity according to plan */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono font-bold">{t("Team & Authorization Seat Capacity", "Team & Authorization Seat Capacity")}</h5>
                    <div className="bg-[#202636] border border-[#2B3347] p-4 rounded-lg space-y-3.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#BBC0C4]">{t("Active Seat Count", "Active Seat Count")}</span>
                        <span className="text-white font-mono font-semibold">
                          {subscription?.plan === 'Starter' ? t('1 Seats Limit', '1 Seats Limit') : subscription?.plan === 'Professional' ? t('3 Seats Limit', '3 Seats Limit') : t('Unlimited', 'Unlimited')}
                        </span>
                      </div>
                      <div className="bg-[#171B26] border border-[#2B3347] p-2.5 rounded text-[11px] text-[#80868B] flex items-start gap-2 font-mono uppercase tracking-tighter">
                        <Users size={12} className="text-[#00D4FF] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-white font-semibold">
                            {subscription?.plan === 'Starter'
                              ? t('Starter pack is limited to 1 user seat.', 'Starter pack is limited to 1 user seat.')
                              : subscription?.plan === 'Professional'
                                ? t('Professional pack is limited to 3 user seats.', 'Professional pack is limited to 3 user seats.')
                                : t('Unlimited team authorization is active.', 'Unlimited team authorization is active.')}
                          </p>
                          <button
                            onClick={() => {
                              setIsProfileDrawerOpen(false);
                              setActiveTab('Team Management');
                              onNavigate('/workspace');
                            }}
                            className="text-[#00D4FF] hover:underline mt-1 block uppercase font-bold text-[10px]"
                          >
                            {t("Manage Team →", "Manage Team →")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand Architecture & Ecosystem Modules */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono font-bold">{t("Brand & Product Architecture", "Brand & Product Architecture")}</h5>
                    <div className="bg-[#202636] border border-[#2B3347] p-4 rounded-lg space-y-3 font-mono">
                      <div className="flex items-center gap-2 pb-2 border-b border-[#2B3347]/50">
                        <div className="w-5 h-5 rounded bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] text-xs font-bold font-manrope">M</div>
                        <div>
                          <span className="text-white font-manrope font-extrabold tracking-tighter text-xs">MARINEWORLD</span>
                          <span className="text-[8px] text-[#80868B] block leading-none">PARENT BRAND</span>
                        </div>
                      </div>

                      <div className="pl-3 border-l-2 border-[#2B3347]/80 space-y-3.5">
                        <div className="flex items-center gap-2 relative">
                          <div className="absolute -left-[14px] top-1/2 w-2 h-0.5 bg-[#2B3347]/80" />
                          <div className="w-4 h-4 rounded bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF]">
                            <Compass size={10} className="animate-spin-slow" />
                          </div>
                          <div>
                            <span className="text-xs font-manrope font-bold text-white tracking-tight">Contract Studio</span>
                            <span className="text-[8px] text-[#00D4FF] block leading-none uppercase font-bold">{t("Active Flagship Product", "Active Flagship Product")}</span>
                          </div>
                        </div>

                        {/* Modules Tree */}
                        <div className="pl-4 border-l border-[#2B3347]/60 space-y-2 text-[10px]">
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="font-medium text-white">Contract Copilot</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="font-medium text-white">Contract AI Assistant</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="font-medium text-white">Contract AI Advisor</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="text-white">Interactive Clause Workspace</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="text-white">Human Revision Workspace</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="text-white">Agreement Execution Portal</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="text-white">Template Library</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="text-white">Registry Center</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="text-white">Credit Wallet</span>
                          </div>
                          <div className="flex items-center gap-2 relative text-slate-350">
                            <div className="absolute -left-[18px] top-1/2 w-3 h-px bg-[#2B3347]/60" />
                            <Check size={9} className="text-[#00D4FF] shrink-0" />
                            <span className="text-white">Audit Center</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secure Device Tracking */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] text-[#80868B] uppercase tracking-widest font-mono font-bold">{t("Device & Location Verification", "Device & Location Verification")}</h5>
                    <div className="bg-[#202636] border border-[#2B3347] p-4 rounded-lg space-y-4">
                      {/* Live IP status indicator */}
                      <div className="flex items-center justify-between border-b border-[#2B3347]/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Cpu className="text-[#00D4FF]" size={15} />
                          <span className="text-white font-medium text-xs">{t("User IP Address", "User IP Address")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs bg-[#171B26] px-2 py-0.5 rounded border border-[#2B3347] text-[#00D68F] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00D68F] animate-pulse"></span>
                          {deviceContext.ip === 'Querying...' ? t("Querying...", "Querying...") : deviceContext.ip}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="bg-[#171B26] p-2.5 rounded border border-[#2B3347]/50">
                          <span className="text-[#80868B] text-[9px] uppercase tracking-wider block">{t("Geographical Country", "Geographical Country")}</span>
                          <div className="flex items-center gap-1.5 mt-1 text-white font-semibold">
                            <MapPin size={12} className="text-[#00D4FF]" />
                            <span className="truncate">{deviceContext.country === 'Detecting...' ? t("Detecting...", "Detecting...") : deviceContext.country}</span>
                          </div>
                        </div>
                        <div className="bg-[#171B26] p-2.5 rounded border border-[#2B3347]/50">
                          <span className="text-[#80868B] text-[9px] uppercase tracking-wider block">{t("City / Region", "City / Region")}</span>
                          <div className="flex items-center gap-1.5 mt-1 text-white font-semibold">
                            <Globe size={12} className="text-[#00D68F]" />
                            <span className="truncate">{deviceContext.city === 'Maritime Boundary' ? t("Maritime Boundary", "Maritime Boundary") : deviceContext.city}</span>
                          </div>
                        </div>
                        <div className="bg-[#171B26] p-2.5 rounded border border-[#2B3347]/50">
                          <span className="text-[#80868B] text-[9px] uppercase tracking-wider block">{t("Web Browser", "Web Browser")}</span>
                          <p className="text-white font-semibold mt-1 truncate">{deviceContext.browser}</p>
                        </div>
                        <div className="bg-[#171B26] p-2.5 rounded border border-[#2B3347]/50">
                          <span className="text-[#80868B] text-[9px] uppercase tracking-wider block">{t("Operating System (OS)", "Operating System (OS)")}</span>
                          <p className="text-white font-semibold mt-1 truncate">{deviceContext.os}</p>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-[#80868B] text-center border-t border-[#2B3347]/50 pt-2.5 uppercase">
                        {t("Secure Connection • TLS 1.3 AES-GCM 256-bit Encryption", "Secure Connection • TLS 1.3 AES-GCM 256-bit Encryption")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Log Out Button */}
                <div className="p-5 border-t border-[#2B3347] bg-[#202636] space-y-3">
                  <button
                    onClick={() => {
                      setIsProfileDrawerOpen(false);
                      handleSignOut();
                    }}
                    className="w-full py-3 rounded-lg bg-[#E57373]/10 hover:bg-[#E57373]/20 text-[#FF8A80] border border-[#FF8A80]/20 font-bold uppercase text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut size={14} /> {t("Secure Log Out", "Secure Log Out")}
                  </button>
                  <div className="text-center text-[9px] text-[#80868B] font-mono uppercase tracking-widest">
                    MARINEWORLD SECURITY PROTOCOL v1.2.0
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
