import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  LogIn, 
  UserPlus, 
  User as UserIcon, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Cloud,
  CheckCircle2,
  LogOut,
  UploadCloud,
  DownloadCloud,
  Copy,
  ExternalLink
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  loginAsGuest, 
  logoutUser,
  batchUploadLocalBets
} from '../lib/firebase';
import { Bet } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  localBets: Bet[];
  onCloudSyncSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  localBets,
  onCloudSyncSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyHost = () => {
    if (currentHost && navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setUnauthorizedDomain(null);
    try {
      const user = await loginWithGoogle();
      setSuccessMsg(`Welcome, ${user.displayName || user.email || 'Sharp bettor'}!`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(currentHost || 'run.app');
        setErrorMsg(null);
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups or use email sign in.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signup') {
        const user = await registerWithEmail(email, password);
        setSuccessMsg(`Account created! Logged in as ${user.email}`);
      } else {
        const user = await loginWithEmail(email, password);
        setSuccessMsg(`Welcome back, ${user.email}!`);
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please click "Sign In" instead.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginAsGuest();
      setSuccessMsg('Signed in with Temporary Guest Account! Your data is backed up.');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to start guest session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setSuccessMsg('Successfully signed out.');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushLocalToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setErrorMsg(null);
    try {
      await batchUploadLocalBets(currentUser.uid, localBets);
      setSuccessMsg(`Successfully synced ${localBets.length} bets to your Cloud account!`);
      if (onCloudSyncSuccess) onCloudSyncSuccess();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to sync bets to cloud.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {currentUser ? 'Cloud Account & Data Sync' : 'Account Access'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser ? 'Your data is secured in Firestore Cloud' : 'Save and retrieve your bets & bankroll across devices'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Unauthorized Domain Guide Card */}
          {unauthorizedDomain && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3 text-xs text-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300">Firebase Domain Authorization Note</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Google OAuth popups require adding this preview domain to your Firebase Console under <span className="text-white font-medium">Authentication &gt; Settings &gt; Authorized domains</span>.
                  </p>
                </div>
              </div>

              {/* Hostname with 1-click copy */}
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="font-mono text-[10px] text-emerald-400 truncate max-w-[240px]">
                  {unauthorizedDomain}
                </span>
                <button
                  type="button"
                  onClick={handleCopyHost}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer shrink-0 font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 font-medium">
                👉 <strong>Instant Solution:</strong> Use <strong>Email &amp; Password</strong> or <strong>Guest Login</strong> below — both work immediately without domain authorization!
              </div>
            </div>
          )}

          {/* Status Message Banners */}
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* IF LOGGED IN: Profile & Sync Management View */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-base">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : 'U')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {currentUser.displayName || (currentUser.isAnonymous ? 'Guest Bettor' : currentUser.email?.split('@')[0])}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{currentUser.isAnonymous ? 'Anonymous Session' : currentUser.email}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
                  <span>Cloud Database:</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-semibold">Google Firestore</span>
                </div>
              </div>

              {/* Cloud Sync Action */}
              <div className="space-y-2">
                <button
                  onClick={handlePushLocalToCloud}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing Bets to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Backup {localBets.length} Bets to Cloud Database</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  All new bets, edits, and bankroll adjustments save automatically in real-time.
                </p>
              </div>

              {/* Sign Out Button */}
              <div className="pt-2">
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700/60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* IF LOGGED OUT: Sign In / Sign Up Form */
            <div className="space-y-4">
              {/* Google 1-Click Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all flex items-center justify-center gap-3 shadow-md cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold absolute">
                  or with email
                </span>
              </div>

              {/* Mode Switch Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`py-1.5 rounded-lg transition-all ${
                    mode === 'signin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-1.5 rounded-lg transition-all ${
                    mode === 'signup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sharpbettor@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'signin' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In &amp; Retrieve My Data</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account &amp; Save Data</span>
                    </>
                  )}
                </button>
              </form>

              {/* Instant Guest / Anonymous Access Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={isLoading}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test with One-Click Guest Account</span>
                </button>
                <p className="text-[11px] text-slate-500 text-center mt-1.5">
                  Allows immediate cloud persistence without typing credentials.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
