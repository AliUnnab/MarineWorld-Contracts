import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db, logAuditEvent } from '../../services/firebase-service';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Anchor, LayoutDashboard, FolderKanban, FileType, 
  Wallet, Award, CreditCard, Users, ShieldAlert, Logs, 
  Settings, HelpCircle, LogOut, Loader2, Scale, Menu, X,
  CheckSquare, Workflow
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, SaasSubscription, CreditWallet } from '../types/saas';

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

interface SaaSLayoutProps {
  user: any;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  initialTab?: string;
}

export default function SaaSLayout({ user, onLogout, onNavigate, initialTab = 'Dashboard' }: SaaSLayoutProps) {
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

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to user settings profile to synchronize organization identity
    const profileRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    }, (err) => {
      console.error("Profile listen failed in layout:", err);
    });

    // Listen to subscription state to route onboarding
    const subRef = doc(db, 'subscriptions', user.uid);
    const unsubscribeSub = onSnapshot(subRef, (snap) => {
      if (snap.exists()) {
        setSubscription(snap.data() as SaasSubscription);
      }
      setLoading(false);
    }, (err) => {
       console.error("Subscription listen failed in layout:", err);
       setLoading(false);
    });

    // Listen to wallet state to synchronize remaining credits
    const walletRef = doc(db, 'credit_wallets', user.uid);
    const unsubscribeWallet = onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        setWallet(snap.data() as CreditWallet);
      }
    }, (err) => {
      console.error("Wallet listen failed in layout:", err);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeSub();
      unsubscribeWallet();
    };
  }, [user]);

  // Self-healing wallet credits synchronization
  useEffect(() => {
    if (!user?.uid || !subscription || loading) return;

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
        const walletRef = doc(db, 'credit_wallets', user.uid);
        setDoc(walletRef, {
          id: user.uid,
          userId: user.uid,
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
  }, [user?.uid, subscription, wallet, loading]);

  const handleSignOut = async () => {
    try {
      if (user?.uid) {
        await logAuditEvent(user.uid, "User signed out and terminated active session", "User Session Profile");
      }
      await signOut(auth);
    } catch (err) {
      console.error("Firebase Signout failed:", err);
    } finally {
      onLogout();
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={15} />, path: '/dashboard' },
    { name: 'Contract Repository', icon: <FolderKanban size={15} />, path: '/repository' },
    { name: 'Templates Library', icon: <FileType size={15} />, path: '/templates' },
    { name: 'New Contract', icon: <Anchor size={15} />, path: '/new-contract' },
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

  if ((hasNoPlan || isExpired || isPending) && !isAccountTab) {
    return <OnboardingPricing userId={user.uid} onPaymentSuccess={() => setActiveTab('Dashboard')} onLogout={onLogout} />;
  }

  const companyDisplayName = profile?.companyName || user?.displayName || (user?.email ? `${user.email.split('@')[0]}'s Workspace` : "Global Trade & Maritime Operations Ltd");

  return (
    <div className="min-h-screen bg-[#171B26] text-[#E8EAED] flex font-manrope overflow-hidden relative">
      
      {/* Mobile/Tablet Full Screen Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#141924] lg:hidden flex flex-col"
          >
            <div className="h-16 shrink-0 border-b border-[#2B3347] flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <Anchor size={20} className="text-[#00D4FF]" />
                <h1 className="text-sm font-manrope font-extrabold text-white tracking-tighter uppercase">MARINE<span className="text-[#00D4FF]">WORLD</span></h1>
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
                    className={`w-full h-[56px] px-6 rounded-lg text-[16px] font-bold uppercase flex items-center gap-4 transition-all ${
                      activeTab === navItem.name 
                        ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20' 
                        : navItem.isUpcoming ? 'text-[#4A5568] grayscale opacity-50' : 'text-[#BBC0C4] active:bg-[#2B3347]'
                    }`}
                  >
                    <span className={activeTab === navItem.name ? 'text-[#00D4FF]' : 'text-[#80868B]'}>{navItem.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="tracking-tighter">{navItem.name}</span>
                      {navItem.isUpcoming && <span className="text-[10px] text-[#00D4FF] font-mono tracking-tighter opacity-70">Protocol v1.2</span>}
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-[#2B3347]">
              <button
                onClick={handleSignOut}
                className="w-full h-14 rounded-lg bg-[#202636] text-[#F28B82] border border-[#F28B82]/20 font-bold uppercase text-[14px] flex items-center justify-center gap-2"
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
        className="bg-[#141924] border-r border-[#2B3347] flex flex-col justify-between shrink-0 h-screen select-none overflow-hidden relative z-50 hidden lg:flex"
      >
        <div className={isSidebarOpen ? "w-[280px] flex flex-col h-full" : "w-[80px] flex flex-col h-full items-center"}>
          {/* Upper Brand Selector */}
          <div className={`h-16 flex items-center border-b border-[#2B3347] gap-3 shrink-0 ${isSidebarOpen ? 'px-6' : 'justify-center w-full'}`}>
            <div className="w-8 h-8 rounded bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] shrink-0">
              <Anchor size={16} />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-manrope font-extrabold text-white tracking-tighter uppercase whitespace-nowrap">MARINE<span className="text-[#00D4FF]">WORLD</span></h1>
                <span className="flex items-center gap-1 text-[9px] text-[#00D68F] font-mono mt-0.5 uppercase tracking-tighter whitespace-nowrap">
                  <span className="w-1 h-1 rounded-full bg-[#00D68F] animate-pulse"></span> CONTRACT STUDIO
                </span>
              </div>
            )}
          </div>

          {/* Org Name Bar Selector */}
          {isSidebarOpen && (
            <div className="p-4 px-6 border-b border-[#2B3347]/50 bg-white/[0.01] flex items-center justify-between text-left shrink-0">
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
                  className={`relative flex items-center gap-3 transition-all rounded uppercase font-bold text-xs tracking-tight ${
                    isSidebarOpen ? 'w-full px-4 py-2.5' : 'w-12 h-12 justify-center'
                  } ${
                    isActive 
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20' 
                      : navItem.isUpcoming ? 'text-[#4A5568] grayscale opacity-50' : 'text-[#BBC0C4] hover:text-white hover:bg-[#2B3347]'
                  }`}
                >
                  <span className={isActive ? 'text-[#00D4FF]' : 'text-[#80868B]'}>{navItem.icon}</span>
                  {isSidebarOpen && (
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="tracking-tighter truncate">{navItem.name}</span>
                      {navItem.isUpcoming && <span className="text-[8px] text-[#00D4FF] font-mono tracking-tighter opacity-70">v1.2 Protocol</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Lower Auth Block Footer */}
          <div className={`p-4 border-t border-[#2B3347] bg-white/[0.01] shrink-0 ${!isSidebarOpen ? 'flex flex-col items-center' : ''}`}>
            {isSidebarOpen && (
              <div className="flex items-center justify-between gap-2.5 mb-4 text-left">
                <div className="truncate max-w-[150px]">
                  <p className="text-[10px] font-bold text-white truncate leading-tight uppercase font-mono">{profile?.displayName || user?.displayName || user?.email?.split('@')[0] || "USER"}</p>
                  <span className="text-[9px] text-[#80868B] font-mono block tracking-tight truncate leading-none mt-0.5">{user?.email || "No Email"}</span>
                </div>
                <span className="px-1.5 py-0.5 text-[8px] bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/25 rounded font-mono uppercase font-bold">Admin</span>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className={`rounded bg-[#202636] hover:bg-[#F28B82]/10 border border-[#2B3347] hover:border-[#F28B82]/25 text-[#BBC0C4] hover:text-[#F28B82] text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                isSidebarOpen ? 'w-full py-2.5 px-3' : 'w-12 h-12'
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
        <header className="h-14 border-b border-[#2B3347] bg-[#171B26]/95 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-[60] sticky top-0">
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
               <Anchor size={18} className="text-[#00D4FF]" />
               <h1 className="text-[12px] font-manrope font-extrabold text-white tracking-tighter uppercase">MARINE<span className="text-[#00D4FF]">WORLD</span></h1>
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
                 <span className="text-xs font-mono font-bold text-[#00D68F] mt-1">{wallet?.creditsRemaining ?? subscription?.creditsAllocated ?? 0} Credits</span>
              </div>
              <div className="w-px h-6 bg-[#2B3347]"></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-[#80868B] uppercase leading-none">Subscription Tier</span>
                <span className="text-xs font-bold text-white mt-1 uppercase tracking-tighter">{subscription?.plan || 'Free'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 md:border-l md:border-[#2B3347] md:pl-6">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-[10px] font-bold text-white uppercase tracking-tight leading-none">{profile?.displayName || user.email?.split('@')[0]}</span>
                <span className="text-[9px] font-mono text-[#80868B] uppercase mt-1 tracking-tighter">{profile?.companyName || 'Corporate Entity'}</span>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[#2B3347] border border-[#2B3347] flex items-center justify-center font-bold text-[10px] text-[#00D4FF] font-mono uppercase">
                {user.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

        <main className="flex-1 overflow-hidden flex flex-col relative w-full">
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
                userId={user.uid} 
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
                userId={user.uid} 
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
                userId={user.uid} 
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
              <div className="flex-1 h-full overflow-y-auto">
                {/* Visual Return Bar mapping it deeper inside layout */}
                <div className="h-9 shrink-0 bg-[#202636] border-b border-[#2B3347] px-6 flex items-center justify-between text-[10px] text-[#BBC0C4]">
                  <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse"></span>
                      <span className="font-mono text-[10px] text-white">Active editor terminal session (Direct database bridge)</span>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveTab('Dashboard');
                        onNavigate('/dashboard');
                      }}
                      className="font-bold text-[#00D4FF] hover:underline"
                    >
                      ← Terminate editor & Return to dashboard
                    </button>
                  </div>
                </div>
                <ContractStudio 
                  company={{ id: user.uid, name: companyDisplayName }}
                  onBack={() => {
                    setActiveTab('Dashboard');
                    onNavigate('/dashboard');
                  }} 
                />
              </div>
            )}


            {activeTab === 'Credit Wallet' && (
              <WalletView userId={user.uid} />
            )}

            {activeTab === 'Subscription Center' && (
              <SubscriptionView userId={user.uid} />
            )}

            {activeTab === 'Billing Center' && (
              <BillingView userId={user.uid} userDisplayName={profile?.displayName || user?.displayName} />
            )}

            {activeTab === 'Team Management' && (
              <WorkspaceView userId={user.uid} userEmail={user.email} />
            )}

            {activeTab === 'Audit Logs' && (
              <AuditView userId={user.uid} />
            )}

            {activeTab === 'Settings' && (
              <SettingsView userId={user.uid} />
            )}

            {activeTab === 'Support Center' && (
              <SupportView userId={user.uid} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>
);
}
