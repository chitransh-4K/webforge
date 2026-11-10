import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { X, Lock, Mail, UserCheck, LogOut, ArrowRight, HardDriveDownload } from 'lucide-react';

export function AuthModal() {
  const { user, login, register, logout, guestNeedsImport, importGuestToCloud, dismissGuestImport } = useAuthStore();
  const { closeModal, setStatusMessage } = useUIStore();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already logged in and guest import is requested
  if (user && guestNeedsImport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-[#252526] border border-vscode-dark-border rounded-xl shadow-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-sky-400">
            <HardDriveDownload className="w-6 h-6" />
            <h3 className="text-lg font-semibold text-white">Import Guest Project?</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            We noticed you have a guest project stored in your browser. Would you like to import it into your cloud account so it is safely synced across devices?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={dismissGuestImport}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-xs text-gray-300 font-medium transition"
            >
              Skip
            </button>
            <button
              onClick={importGuestToCloud}
              className="px-4 py-2 rounded bg-[#007acc] hover:bg-[#0098ff] text-xs text-white font-medium transition"
            >
              Import to Cloud
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If already logged in, show account details & logout
  if (user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-[#252526] border border-vscode-dark-border rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-vscode-dark-border bg-[#1f1f1f]">
            <div className="flex items-center gap-2 text-white font-medium">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Account Profile</span>
            </div>
            <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4 text-xs">
            <div>
              <label className="text-gray-400 uppercase tracking-wider text-[10px] font-semibold">Signed In As</label>
              <p className="text-sm font-mono text-white mt-1">{user.email}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={async () => {
                  await logout();
                  closeModal();
                  setStatusMessage('Signed out successfully.');
                }}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded bg-red-600/80 hover:bg-red-600 text-white font-medium transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        setStatusMessage('Logged in successfully!');
      } else {
        await register(email, password);
        setStatusMessage('Account created and logged in!');
      }
      if (!useAuthStore.getState().guestNeedsImport) {
        closeModal();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#252526] border border-vscode-dark-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-vscode-dark-border bg-[#1f1f1f]">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Lock className="w-4 h-4 text-[#007acc]" />
            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </div>
          <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-300 font-medium mb-1">Email</label>
            <div className="relative flex items-center">
              <Mail className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#1e1e1e] border border-vscode-dark-border rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#007acc]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-300 font-medium mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1e1e1e] border border-vscode-dark-border rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#007acc]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#007acc] hover:bg-[#0098ff] disabled:opacity-50 text-white font-medium text-xs transition shadow-sm"
          >
            {isSubmitting ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Register Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Toggle mode */}
          <div className="text-center pt-2 text-xs text-gray-400">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-sky-400 hover:underline font-medium"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-sky-400 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
