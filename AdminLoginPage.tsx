import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Shield, 
  ShieldAlert, 
  LogOut, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { user, isAdmin, adminEmail, loading, loginWithGoogle, loginWithPassword, logout } = useAuth();
  const navigate = useNavigate();

  // Mode: 'password' | 'google'
  const [authMode, setAuthMode] = useState<'password' | 'google'>('password');
  
  // Password form state
  const [email, setEmail] = useState('tenderink.story@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Please enter the administrator passcode.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithPassword(password, email);
      toast.success('Admin authorization granted!');
      setFailedAttempts(0);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setFailedAttempts(prev => prev + 1);
      toast.error(err.message || 'Authorization failed. Incorrect passcode.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      toast.success('Successfully authenticated via Google');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Google sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast.info('Signed out');
    } catch (err) {
      console.error(err);
    }
  };

  const autofillDefault = () => {
    setPassword('InkBridge2026!Admin');
    toast.info('Default editorial passcode loaded.');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#1A2027] rounded-[16px] border border-[#E8E2D9] dark:border-[#2A3138] p-8 shadow-soft space-y-6">
        
        {/* Logo and title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" showTagline={true} />
          </div>
          <div className="pt-2">
            <h1 className="text-xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
              InkBridge Editorial CMS
            </h1>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Protected access for editors, authors & publishers
            </p>
          </div>
        </div>

        {/* State 1: Already authorized */}
        {isAdmin && (
          <div className="p-5 rounded-xl bg-[#2F855A]/10 border border-[#2F855A]/30 text-center space-y-4">
            <div className="flex items-center justify-center gap-1.5 text-[#2F855A] font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Admin Session Active</span>
            </div>
            <p className="text-xs text-[#1A1A1A] dark:text-[#E5E7EB]">
              Authenticated as <strong>{adminEmail || 'Administrator'}</strong>
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full py-2.5 px-4 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSignOut}
                className="w-full py-2 px-4 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] text-xs font-medium text-[#6B7280] hover:text-[#1A1A1A] dark:hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* State 2: Not logged in - Authentication Methods */}
        {!isAdmin && (
          <div className="space-y-5">
            
            {/* Tabs: Admin Passcode vs Google Sign-In */}
            <div className="flex items-center p-1 rounded-lg bg-[#FAF7F2] dark:bg-[#0F1419] border border-[#E8E2D9] dark:border-[#2A3138]">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'password'
                    ? 'bg-white dark:bg-[#1A2027] text-[#14213D] dark:text-[#FAF7F2] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-[#D98E04]" />
                <span>Admin Passcode</span>
              </button>
              
              <button
                type="button"
                onClick={() => setAuthMode('google')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'google'
                    ? 'bg-white dark:bg-[#1A2027] text-[#14213D] dark:text-[#FAF7F2] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#4285F4]" />
                <span>Google Sign-In</span>
              </button>
            </div>

            {/* Form 1: Password / Passcode Auth */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
                    Admin Identifier / Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenderink.story@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
                      Master Editorial Passcode
                    </label>
                    <button
                      type="button"
                      onClick={autofillDefault}
                      className="text-[10px] text-[#D98E04] hover:underline"
                    >
                      Use default key
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password..."
                      className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#14213D] dark:hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {failedAttempts > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#C53030]/10 border border-[#C53030]/30 text-[11px] text-[#C53030] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Incorrect passcode ({failedAttempts} failed attempt{failedAttempts === 1 ? '' : 's'}).</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Verifying Authorization...' : 'Authorize and Enter CMS'}</span>
                </button>

                {/* Helpful default credential hint for convenience */}
                <div className="p-3 rounded-lg bg-[#FAF7F2] dark:bg-[#0F1419] border border-[#E8E2D9] dark:border-[#2A3138] text-[11px] text-[#6B7280] dark:text-[#9CA3AF] space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#14213D] dark:text-[#FAF7F2]">
                    <Sparkles className="w-3.5 h-3.5 text-[#D98E04]" />
                    <span>Editorial Passkey Reference</span>
                  </div>
                  <p>
                    Default master key: <code className="text-[#D98E04] font-mono font-bold">InkBridge2026!Admin</code>
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    You can change and customize this passcode anytime from inside the Admin Dashboard.
                  </p>
                </div>
              </form>
            )}

            {/* Form 2: Google Sign-In */}
            {authMode === 'google' && (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={submitting || loading}
                  className="w-full py-3 px-4 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#0F1419] hover:bg-[#FAF7F2] dark:hover:bg-[#151C24] text-xs sm:text-sm font-semibold text-[#14213D] dark:text-[#FAF7F2] flex items-center justify-center gap-3 transition-all shadow-xs disabled:opacity-50"
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
                  <span>{submitting ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>

                <div className="p-3 rounded-lg bg-[#FAF7F2] dark:bg-[#0F1419] border border-[#E8E2D9] dark:border-[#2A3138] text-[11px] text-[#6B7280] dark:text-[#9CA3AF] space-y-1">
                  <p className="font-semibold text-[#14213D] dark:text-[#FAF7F2]">Authorized Google Account</p>
                  <p>Configured bootstrap email: <code className="text-[#D98E04]">tenderink.story@gmail.com</code></p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Public home link */}
        <div className="pt-2 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#14213D] dark:hover:text-[#FAF7F2]"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>Return to public site</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
