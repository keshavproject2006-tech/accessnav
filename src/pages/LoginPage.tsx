import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Shield,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
} from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  requestPasswordReset,
} from '../lib/firebase';
import { useAccessibility } from '../context/AccessibilityContext';

export const LoginPage: React.FC = () => {
  const { loginAsGuest, t, triggerHaptic, announce } = useAccessibility();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleError = (error: any) => {
    let msg = 'An unexpected error occurred. Please try again.';
    const code = error?.code || '';
    if (code.includes('auth/invalid-email')) {
      msg = 'The email address format is invalid. Please check for typos.';
    } else if (code.includes('auth/user-not-found') || code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      msg = 'Incorrect email or password. Please verify your credentials or reset your password.';
    } else if (code.includes('auth/email-already-in-use')) {
      msg = 'An account already exists with this email. Please sign in instead.';
    } else if (code.includes('auth/weak-password')) {
      msg = 'Password is too weak. Please use at least 6 characters.';
    } else if (code.includes('auth/popup-closed-by-user')) {
      msg = 'Google sign-in popup was closed before finishing.';
    } else if (error?.message) {
      msg = error.message;
    }
    setErrorMessage(msg);
    announce(msg, 'assertive');
    triggerHaptic('warning');
  };

  const handleGoogleSignIn = async () => {
    triggerHaptic('click');
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
      announce('Successfully signed in with Google', 'polite');
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('click');
    if (!email || !password) {
      const msg = 'Please enter both your email and password.';
      setErrorMessage(msg);
      announce(msg, 'assertive');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        announce('Account created successfully. Welcome to AccessNav!', 'polite');
      } else {
        await signInWithEmail(email, password);
        announce('Signed in successfully.', 'polite');
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('click');
    if (!resetEmail) {
      setErrorMessage('Please enter your email to receive a password reset link.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await requestPasswordReset(resetEmail);
      const msg = 'Password reset email sent! Check your inbox.';
      setSuccessMessage(msg);
      announce(msg, 'polite');
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage('');
      }, 3500);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-neutral-50 dark:bg-black transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* App Title & Accessibility Purpose */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl mx-auto flex items-center justify-center font-extrabold text-3xl shadow mb-3 border border-neutral-300 dark:border-neutral-700">
            A
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            AccessNav
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 font-medium">
            AI Accessibility Navigator for visual, hearing, motor & cognitive needs
          </p>
        </div>

        {/* Live Accessible Alert Region */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/60 border-2 border-red-600 rounded-xl text-red-800 dark:text-red-200 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-5 p-3.5 bg-green-50 dark:bg-green-950/60 border-2 border-green-600 rounded-xl text-green-800 dark:text-green-200 text-sm flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* 1. Primary Action: Sign in with Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="touch-target w-full py-3.5 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border-2 border-neutral-900 dark:border-neutral-300 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-sm focus:ring-4 focus:ring-blue-600 active:scale-[0.98] disabled:opacity-50"
          aria-label="Sign in with Google Account"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>{t.signInWithGoogle}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-neutral-300 dark:border-neutral-700"></div>
          <span className="px-3 text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400">
            or with email
          </span>
          <div className="flex-1 border-t border-neutral-300 dark:border-neutral-700"></div>
        </div>

        {/* 2. Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label
              htmlFor="email-input"
              className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              {t.email}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white rounded-xl text-neutral-900 dark:text-white font-medium text-sm focus:outline-none transition-colors"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password-input"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
              >
                {t.password}
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-bold text-blue-600 dark:text-yellow-400 hover:underline"
                >
                  {t.forgotPassword}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'At least 6 characters' : 'Enter password'}
                className="w-full pl-11 pr-12 py-3 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white rounded-xl text-neutral-900 dark:text-white font-medium text-sm focus:outline-none transition-colors"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="touch-target absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="touch-target w-full py-3.5 px-4 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            <span>{isSignUp ? t.signUp : t.login}</span>
          </button>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              setIsSignUp(!isSignUp);
              setErrorMessage('');
            }}
            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
          >
            {isSignUp ? (
              <span>Already have an account? <strong className="underline">Sign in</strong></span>
            ) : (
              <span>Don't have an account? <strong className="underline">Create an account</strong></span>
            )}
          </button>
        </div>

        {/* 3. Continue as Guest Option */}
        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              loginAsGuest();
            }}
            className="touch-target w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 transition-colors"
          >
            <UserCheck className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            <span>{t.continueAsGuest}</span>
          </button>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center mt-2 leading-relaxed">
            Preferences will be stored securely on this device without requiring a cloud login.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reset Password"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              {t.forgotPassword}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              Enter your email address and we'll send you an accessible reset link.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  {t.email}
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="touch-target flex-1 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="touch-target flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl shadow"
                >
                  {t.resetPassword}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
