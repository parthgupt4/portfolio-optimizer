import React, { useState } from 'react';
import GlobeIcon from './GlobeIcon';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './AuthModal.css';

function friendlyError(code) {
  const msgs = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/popup-blocked': 'Popup blocked. Allow popups and try again.',
  };
  return msgs[code] || 'Something went wrong. Please try again.';
}

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function switchMode(m) {
    setMode(m);
    setError('');
    setResetSent(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (!email) { setError('Enter your email address first.'); return; }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>
        <div className="auth-logo">
          <GlobeIcon size={32} color="var(--accent)" />
        </div>
        <h2 className="auth-title">
          {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
        </h2>
        <p className="auth-sub">Atlas Allocation</p>

        {mode !== 'reset' && (
          <>
            <button className="btn-google" onClick={handleGoogle} disabled={loading}>
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>or</span></div>
          </>
        )}

        {mode === 'reset' ? (
          resetSent ? (
            <div className="auth-reset-sent">
              Reset link sent to <strong>{email}</strong>. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleReset} className="auth-form">
              <input
                className="auth-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <div className="auth-error">{error}</div>}
              <button className="btn-auth-submit" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <div className="auth-error">{error}</div>}
            <button className="btn-auth-submit" type="submit" disabled={loading}>
              {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {mode === 'signin' && (
            <>
              <button className="auth-link" onClick={() => switchMode('signup')}>Create an account</button>
              <span className="auth-sep">·</span>
              <button className="auth-link" onClick={() => switchMode('reset')}>Forgot password?</button>
            </>
          )}
          {mode === 'signup' && (
            <button className="auth-link" onClick={() => switchMode('signin')}>
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button className="auth-link" onClick={() => switchMode('signin')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
