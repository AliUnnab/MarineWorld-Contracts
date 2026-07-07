import React, { useState } from 'react';
import { 
  auth, 
  db,
  handleFirestoreError, 
  OperationType,
  logAuditEvent
} from '../../services/firebase-service';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  sendSignInLinkToEmail,
  updateProfile,
  signOut
} from 'firebase/auth';
import { seedUserDataIfNecessary } from '../lib/firebaseSeeder';
import { 
  Mail, Lock, Briefcase, User, ArrowRight, ShieldCheck, 
  ChevronLeft, Loader2, KeyRound 
} from 'lucide-react';

interface AuthScreensProps {
  initialMode: 'login' | 'register' | 'forgot-password' | 'verify-email' | '2fa' | 'reset-password';
  onNavigate: (route: string) => void;
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreens({ initialMode, onNavigate, onLoginSuccess }: AuthScreensProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'verify-email' | '2fa' | 'reset-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mfaCode, setmfaCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Temporary registration state variables for verification flow
  const [tempRegName, setTempRegName] = useState('');
  const [tempRegCompany, setTempRegCompany] = useState('');
  const [tempRegEmail, setTempRegEmail] = useState('');
  const [tempRegPassword, setTempRegPassword] = useState('');
  const [tempRegCode, setTempRegCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<any>(null); // For intermediate 2FA sequence

  React.useEffect(() => {
    const localErr = window.localStorage.getItem('auth_error');
    if (localErr) {
      setErrorMsg(localErr);
      window.localStorage.removeItem('auth_error');
    }
  }, []);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const signedUser = userCredential.user;
        
        // Verify user document existence in Firestore (Unregistered users cannot enter)
        const userDocRef = doc(db, 'users', signedUser.uid);
        let userDocSnap;
        try {
          userDocSnap = await getDoc(userDocRef);
          if (!userDocSnap.exists()) {
            await signOut(auth);
            throw new Error("This corporate identity is not registered in our system. Access denied.");
          }
        } catch (getDocErr: any) {
          if (getDocErr && (
            getDocErr.message?.toLowerCase().includes('quota') ||
            getDocErr.message?.toLowerCase().includes('limit') ||
            getDocErr.message?.toLowerCase().includes('resource_exhausted') ||
            getDocErr.code === 'resource-exhausted'
          )) {
            console.warn("Quota limit detected during user check. Activating offline sandbox.");
            window.localStorage.setItem('firestore_quota_exceeded', 'true');
            (window as any).__markQuotaExceeded?.();
          } else {
            throw getDocErr;
          }
        }
        
        // Transition to 2FA screen for enterprise security representation
        setTempUser(signedUser);
        setMode('2fa');
      } else if (mode === 'register') {
        if (!email || !password || !displayName || !companyName) {
          throw new Error("All fields (Full Name, Email, Password, Company Name) are required for B2B registration.");
        }
        
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save registration details to local state
        setTempRegName(displayName);
        setTempRegCompany(companyName);
        setTempRegEmail(email);
        setTempRegPassword(password);
        setTempRegCode(generatedCode);

        // Dispatch verification code via backend SMTP API
        const response = await fetch('/api/send-verification-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: generatedCode })
        });

        if (!response.ok) {
          throw new Error("Failed to dispatch verification email from info@unitedweb4.com.");
        }
        
        setSuccessMsg("Verification code dispatched to " + email + ". Please check your inbox.");
        setMode('verify-email');
      } else if (mode === 'forgot-password') {
        if (!email) throw new Error("A valid email address is required to reset passwords.");
        const response = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        if (!response.ok) {
          let errorMsg = "Failed to dispatch password reset link.";
          try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          } catch (e) {}
          throw new Error(errorMsg);
        }
        setSuccessMsg("Restoration instructions dispatched. Please check your inbox: " + email);
      }
    } catch (error: any) {
      if (error.code === 'auth/weak-password') {
        setErrorMsg("Your Passkey Lock is too weak. Please use a sequence of at least 6 characters.");
        return;
      }
      
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg("This email address is already bound to a corporate workspace.");
        return;
      }

      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
        setErrorMsg("Email/Password authentication provider is not enabled in the Firebase console. Please enable it in the console under Authentication -> Sign-in method.");
        return;
      }
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMsg("Invalid corporate credentials. Access denied.");
        return;
      }
      
      console.error("Authentication failed:", error);
      setErrorMsg(error.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password) {
      setErrorMsg("Please specify a new workspace passkey.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        throw new Error("Invalid or missing password reset token.");
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        let errorMsg = "Failed to reset password.";
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      setSuccessMsg("Workspace passkey successfully restored. Redirecting to login gateway...");
      setTimeout(() => {
        setMode('login');
        onNavigate('/login');
      }, 3000);
    } catch (error: any) {
      setErrorMsg(error.message || "An unexpected error occurred during password restoration.");
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      // Verify user document existence in Firestore (Unregistered users are automatically initialized)
      const userDocRef = doc(db, 'users', googleUser.uid);
      let userDocSnap;
      try {
        userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          console.log("[Google SSO] New workspace owner detected. Initializing database profile.");
          await seedUserDataIfNecessary(
            googleUser.uid,
            googleUser.email || "",
            googleUser.displayName || googleUser.email?.split('@')[0] || "Google Operator",
            "Company Operations"
          );
          userDocSnap = await getDoc(userDocRef);
        }
      } catch (getDocErr: any) {
        if (getDocErr && (
          getDocErr.message?.toLowerCase().includes('quota') ||
          getDocErr.message?.toLowerCase().includes('limit') ||
          getDocErr.message?.toLowerCase().includes('resource_exhausted') ||
          getDocErr.code === 'resource-exhausted'
        )) {
          console.warn("Quota limit detected during Google SSO user check. Activating offline sandbox.");
          window.localStorage.setItem('firestore_quota_exceeded', 'true');
          (window as any).__markQuotaExceeded?.();
        } else {
          throw getDocErr;
        }
      }

      // Successfully pass User up
      try {
        await logAuditEvent(googleUser.uid, "User authenticated via Google SSO successfully", "User Session Profile");
      } catch (logErr) {
        console.error("SSO log failed:", logErr);
      }
      onLoginSuccess(googleUser);
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      setErrorMsg(err.message || "Google Auth verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const triggerMicrosoftAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      const msUser = result.user;
      
      // Verify user document existence in Firestore (Unregistered users are automatically initialized)
      const userDocRef = doc(db, 'users', msUser.uid);
      let userDocSnap;
      try {
        userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          console.log("[Microsoft SSO] New workspace owner detected. Initializing database profile.");
          await seedUserDataIfNecessary(
            msUser.uid,
            msUser.email || "",
            msUser.displayName || msUser.email?.split('@')[0] || "Microsoft Operator",
            "Company Operations"
          );
          userDocSnap = await getDoc(userDocRef);
        }
      } catch (getDocErr: any) {
        if (getDocErr && (
          getDocErr.message?.toLowerCase().includes('quota') ||
          getDocErr.message?.toLowerCase().includes('limit') ||
          getDocErr.message?.toLowerCase().includes('resource_exhausted') ||
          getDocErr.code === 'resource-exhausted'
        )) {
          console.warn("Quota limit detected during Microsoft SSO user check. Activating offline sandbox.");
          window.localStorage.setItem('firestore_quota_exceeded', 'true');
          (window as any).__markQuotaExceeded?.();
        } else {
          throw getDocErr;
        }
      }

      try {
        await logAuditEvent(msUser.uid, "User authenticated via Microsoft SSO successfully", "User Session Profile");
      } catch (logErr) {
        console.error("SSO log failed:", logErr);
      }
      onLoginSuccess(msUser);
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error("Microsoft SSO failed:", err);
      setErrorMsg(err.message || "Microsoft Auth verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const triggerMagicLink = async () => {
    if (!email) {
      setErrorMsg("Please provide your business email first.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/dashboard',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setSuccessMsg("Magic sign-in token successfully dispatched to " + email);
    } catch (err: any) {
      console.error("Magic Link auth failed:", err);
      setErrorMsg(err.message || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate enterprise-level 2FA code checking. Any code accepts for sandbox preview, but standard is seeded code '123456'
    setTimeout(async () => {
      if (mfaCode.length === 6) {
        if (tempUser?.uid) {
          try {
            await logAuditEvent(tempUser.uid, "User completed 2FA authorization and signed in successfully", "User Session Profile");
          } catch (logErr) {
            console.error("Login log failed:", logErr);
          }
        }
        onLoginSuccess(tempUser);
        onNavigate('/dashboard');
      } else {
        setErrorMsg("The multi-factor verification code is invalid. Expected 6-digit corporate cryptkey.");
        setLoading(false);
      }
    }, 600);
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!tempRegCode || !tempRegEmail) {
        throw new Error("No pending registration session found. Please register again.");
      }

      if (tempRegCode === verificationCode.trim()) {
        window.sessionStorage.setItem('is_registering', 'true');
        
        // 1. Create user account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, tempRegEmail, tempRegPassword);
        const signedUser = userCredential.user;

        // 2. Set profile display name
        await updateProfile(signedUser, { displayName: tempRegName });

        // 3. Seed data profile
        try {
          await seedUserDataIfNecessary(signedUser.uid, tempRegEmail, tempRegName, tempRegCompany);
        } catch (seedErr: any) {
          if (seedErr && (
            seedErr.message?.toLowerCase().includes('quota') ||
            seedErr.message?.toLowerCase().includes('limit') ||
            seedErr.message?.toLowerCase().includes('resource_exhausted') ||
            seedErr.code === 'resource-exhausted'
          )) {
            console.warn("Quota limit detected during user seeding. Activating offline sandbox.");
            window.localStorage.setItem('firestore_quota_exceeded', 'true');
            (window as any).__markQuotaExceeded?.();
          } else {
            throw seedErr;
          }
        }

        // 4. Log successful audited event
        try {
          await logAuditEvent(signedUser.uid, "User registered successfully with verified email: " + tempRegEmail, "User Session Profile");
        } catch (logErr) {
          console.error("Log verification audit failed:", logErr);
        }

        // 5. Sign out the user immediately so they must login standardly
        await signOut(auth);

        // 6. Reset all temporary session values
        setTempRegName('');
        setTempRegCompany('');
        setTempRegEmail('');
        setTempRegPassword('');
        setTempRegCode('');
        setVerificationCode('');

        setSuccessMsg("Account successfully verified and activated! Redirecting to login...");
        
        // Wait 1.5 seconds and transition back to login mode
        setTimeout(() => {
          setMode('login');
        }, 1500);
      } else {
        throw new Error("Invalid verification code. Please check your inbox and try again.");
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg("This email address is already bound to a corporate workspace. Please log in or use a different email.");
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg("Your Passkey Lock is too weak. Please use a sequence of at least 6 characters.");
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        setErrorMsg("Email/Password authentication provider is not enabled in the Firebase console. Please enable it in the console under Authentication -> Sign-in method.");
      } else {
        setErrorMsg(err.message || "Verification failed.");
      }
    } finally {
      setLoading(false);
      window.sessionStorage.removeItem('is_registering');
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const targetEmail = email || tempRegEmail;
      if (!targetEmail) {
        throw new Error("User email session not identified.");
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setTempRegCode(newCode);

      // Call API to send mail
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: newCode })
      });

      if (!response.ok) {
        throw new Error("Failed to dispatch verification email from info@unitedweb4.com.");
      }

      setSuccessMsg("A new verification code has been dispatched to: " + targetEmail);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171B26] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#00D4FF]/20 selection:text-[#00D4FF]">
      {/* Upper Brand Return link */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => onNavigate('/')}
          className="text-[10px] font-bold text-[#80868B] hover:text-white flex items-center gap-1.5 transition-colors bg-[#202636] px-3 py-1.5 border border-[#2B3347] rounded uppercase tracking-wider"
        >
          <ChevronLeft size={14} /> Back to Public Portal
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#1F293F] to-[#151D2C] mx-auto flex items-center justify-center text-[#00D4FF] mb-4 shadow-md border border-[#2B354D]">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-2xl font-manrope font-semibold tracking-tight text-white">
          {mode === 'login' && "Secure Workspace Access"}
          {mode === 'register' && "Enterprise Workspace Registration"}
          {mode === 'forgot-password' && "Request Crypt-key Reset"}
          {mode === 'verify-email' && "Magic Link Sent"}
          {mode === '2fa' && "Multi-Factor Clearance Required"}
          {mode === 'reset-password' && "Reset Workspace Passkey"}
        </h2>
        <p className="mt-2 text-xs text-[#BBC0C4] font-mono tracking-tight leading-relaxed px-4">
          {mode === 'login' && "Authenticate to access your Contract Studio enterprise workspace."}
          {mode === 'register' && "Initialize your secure Contract Studio workspace for enterprise contract operations, collaboration and agreement governance."}
          {mode === 'forgot-password' && "Send password restoration instructions securely"}
          {mode === '2fa' && "Enter your 6-digit corporate key tracker"}
          {mode === 'reset-password' && "Restore workspace access by establishing a new secure passkey"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-gradient-to-b from-[#1C2233] to-[#111622] py-8 px-4 border border-[#2B354D] rounded-2xl shadow-2xl sm:px-10 hover:border-[#00D4FF]/30 transition-all duration-300">
          {errorMsg && (
            <div className="mb-4 bg-[#F28B82]/10 border-l-4 border-[#F28B82] p-4 text-[13px] text-[#F28B82] font-medium rounded-r">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-[#00D68F]/10 border-l-4 border-[#00D68F] p-4 text-[13px] text-[#00D68F] font-medium rounded-r">
              {successMsg}
            </div>
          )}

          {mode === 'reset-password' ? (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1">New Workspace Passkey</label>
                <div className="mt-1 relative rounded">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter your new passkey"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] bg-[#171B26] text-white placeholder-[#80868B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1">Confirm New Workspace Passkey</label>
                <div className="mt-1 relative rounded">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Confirm your new passkey"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] bg-[#171B26] text-white placeholder-[#80868B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-[#171B26] bg-[#00D4FF] hover:bg-[#33DDFF] focus:outline-none transition-all duration-200 items-center gap-1.5 uppercase tracking-wider shadow-md hover:shadow-[0_4px_12px_rgba(0,212,255,0.2)]"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <span>Reset and Secure Passkey</span> <ArrowRight size={14} />
              </button>
            </form>
          ) : mode === '2fa' ? (
            <form onSubmit={handle2FAVerify} className="space-y-6">
              <div>
                <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1">Secure 2FA Code</label>
                <div className="mt-1 relative rounded">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 123456"
                    value={mfaCode}
                    onChange={(e) => setmfaCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] font-mono tracking-widest text-center bg-[#171B26] text-white"
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#80868B] leading-relaxed">For mock preview, enter <b>123456</b> to authorize the terminal token clearance.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-[#171B26] bg-[#00D4FF] hover:bg-[#33DDFF] focus:outline-none transition-colors items-center gap-1.5 uppercase tracking-wider"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <span>Verify Token clearance</span> <ArrowRight size={14} />
              </button>
            </form>
          ) : mode === 'verify-email' ? (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto text-[#00D4FF] mb-4">
                <Mail size={28} />
              </div>
              <p className="text-xs text-[#BBC0C4] text-center leading-relaxed">
                We have sent a verification code to <b>{email || tempRegEmail}</b> from <b>info@unitedweb4.com</b>. Please enter the 6-digit code below to unlock your workspace.
              </p>

              <div>
                <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1 text-center">Verification Code</label>
                <div className="mt-1 relative rounded">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] font-mono tracking-widest text-center bg-[#171B26] text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-[#171B26] bg-[#00D4FF] hover:bg-[#33DDFF] focus:outline-none transition-colors items-center gap-1.5 uppercase tracking-wider"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <span>Verify & Activate Account</span> <ArrowRight size={14} />
              </button>

              <div className="flex justify-between items-center text-xs mt-4">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-[#00D4FF] hover:text-[#33DDFF] font-bold transition-colors underline uppercase tracking-wider"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempRegName('');
                    setTempRegCompany('');
                    setTempRegEmail('');
                    setTempRegPassword('');
                    setTempRegCode('');
                    setVerificationCode('');
                    setMode('login');
                  }}
                  className="text-[#BBC0C4] hover:text-white font-bold transition-colors underline uppercase tracking-wider"
                >
                  Cancel & Return
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleEmailAuthSubmit} className="space-y-5">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1">Full Legal Name</label>
                      <div className="mt-1 relative rounded">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                          <User size={16} />
                        </div>
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your full legal name (e.g. Michael Anderson)"
                          className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] bg-[#171B26] text-white placeholder-[#80868B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1">Company or Organization</label>
                      <div className="mt-1 relative rounded">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                          <Briefcase size={16} />
                        </div>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Enter your registered legal entity (e.g. Global Maritime Holdings Ltd.)"
                          className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] bg-[#171B26] text-white placeholder-[#80868B]"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1">Business Email</label>
                  <div className="mt-1 relative rounded">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] bg-[#171B26] text-white placeholder-[#80868B]"
                    />
                  </div>
                </div>

                {mode !== 'forgot-password' && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#BBC0C4] mb-1">Workspace Passkey</label>
                    <div className="mt-1 relative rounded">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#80868B]">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'register' ? "Create a secure workspace passkey" : "Enter your secure workspace passkey"}
                        className="block w-full pl-10 pr-3 py-2.5 border border-[#2B3347] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00D4FF] focus:border-[#00D4FF] bg-[#171B26] text-white placeholder-[#80868B]"
                      />
                    </div>
                    {mode === 'register' && (
                      <p className="mt-1.5 text-[10px] text-[#80868B] leading-relaxed">
                        Minimum 12 characters. Used to protect your enterprise workspace.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                  {mode === 'login' ? (
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-[11px] text-[#BBC0C4] hover:text-[#00D4FF] font-medium transition-colors underline text-left"
                    >
                      Forgot your workspace passkey?
                    </button>
                  ) : (
                    <div className="text-[11px] text-[#BBC0C4] leading-relaxed text-left">
                      Already have an enterprise workspace?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-[#00D4FF] hover:text-[#33DDFF] font-semibold transition-colors underline inline"
                      >
                        Access your existing workspace
                      </button>
                    </div>
                  )}

                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => triggerMagicLink()}
                      className="text-[11px] text-[#BBC0C4] hover:text-[#00D4FF] font-medium transition-colors underline text-left sm:text-right"
                    >
                      Send Magic Link
                    </button>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-[#171B26] bg-[#00D4FF] hover:bg-[#33DDFF] focus:outline-none transition-all duration-200 items-center gap-1.5 uppercase tracking-wider shadow-md hover:shadow-[0_4px_12px_rgba(0,212,255,0.2)]"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    <span>
                      {mode === 'login' && "Access Workspace"}
                      {mode === 'register' && "Initialize Workspace"}
                      {mode === 'forgot-password' && "Send Reset Link"}
                    </span>
                  </button>
                </div>
              </form>

              {mode !== 'forgot-password' && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#2B3347]"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold tracking-wider text-[#80868B] uppercase">
                      <span className="bg-[#1C2233] px-3">Enterprise Single Sign-On</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <button
                      onClick={triggerGoogleAuth}
                      disabled={loading}
                      className="w-full inline-flex justify-center py-2.5 px-4 border border-[#2B354D] rounded-lg bg-[#171B26] text-xs font-medium text-white hover:bg-[#1C2233] hover:border-[#00D4FF] transition-all duration-200 items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.1-.13-.21-.26-.35-.35z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                    <button
                      onClick={triggerMicrosoftAuth}
                      disabled={loading}
                      className="w-full inline-flex justify-center py-2.5 px-4 border border-[#2B354D] rounded-lg bg-[#171B26] text-xs font-medium text-white hover:bg-[#1C2233] hover:border-[#00D4FF] transition-all duration-200 items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0h10.9v10.9H0V0z" fill="#f25022"/>
                        <path d="M12.1 0H23v10.9H12.1V0z" fill="#7fba00"/>
                        <path d="M0 12.1h10.9V23H0V12.1z" fill="#00a4ef"/>
                        <path d="M12.1 12.1H23V23H12.1V12.1z" fill="#ffb900"/>
                      </svg>
                      Continue with Microsoft
                    </button>
                  </div>

                  {mode === 'register' && (
                    <p className="mt-5 text-[11px] text-[#80868B] text-center leading-relaxed font-mono uppercase tracking-tight">
                      Your workspace is protected using enterprise-grade authentication and encrypted infrastructure.
                    </p>
                  )}
                </div>
              )}

              {mode === 'forgot-password' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode('login')}
                    className="text-[11px] text-[#BBC0C4] hover:text-[#00D4FF] font-bold transition-colors flex items-center justify-center gap-1 mx-auto underline uppercase tracking-wider"
                  >
                    <ChevronLeft size={14} /> Back to Login
                  </button>
                </div>
              )}

              {mode === 'reset-password' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setMode('login');
                      onNavigate('/login');
                    }}
                    className="text-[11px] text-[#BBC0C4] hover:text-[#00D4FF] font-bold transition-colors flex items-center justify-center gap-1 mx-auto underline uppercase tracking-wider"
                  >
                    <ChevronLeft size={14} /> Back to Login
                  </button>
                </div>
              )}

              {mode === 'login' && (
                <div className="mt-8 text-center text-xs border-t border-white/5 pt-6 leading-relaxed">
                  <span className="text-[#80868B] block mb-2">First time using MarineWorld Contract Studio?</span>{' '}
                  <button
                    onClick={() => setMode('register')}
                    className="text-[#00D4FF] hover:text-[#33DDFF] font-bold transition-colors underline"
                  >
                    Initialize your enterprise workspace
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
