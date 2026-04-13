import React, { useState, useRef, useEffect } from 'react';
import './UserButton.css';

const PLAN_LABEL = { admin: 'Admin', pro: 'Pro', free: 'Free' };
const PLAN_COLOR = { admin: '#f87171', pro: 'var(--accent)', free: 'var(--text-muted)' };

export default function UserButton({
  user,
  userDoc,
  onSignInClick,
  onSignOutClick,
  onHistoryClick,
  onProfileClick,
  onManageSubClick,
  onSettingsClick,
  theme,
  onThemeToggle,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function close(cb) {
    setOpen(false);
    cb?.();
  }

  const plan = userDoc?.plan || 'free';

  /* ── Not signed in ── */
  if (!user) {
    return (
      <div className="ub-guest">
        <button
          className="ub-theme"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
        <button className="ub-signin" onClick={onSignInClick}>Sign in</button>
      </div>
    );
  }

  /* ── Signed in ── */
  return (
    <div className="ub-wrap" ref={wrapRef}>
      {/* Theme toggle outside dropdown */}
      <button
        className="ub-theme"
        onClick={onThemeToggle}
        title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀' : '🌙'}
      </button>

      {/* Avatar button */}
      <button className="ub-avatar-btn" onClick={() => setOpen(o => !o)} aria-label="Account menu">
        {user.photoURL ? (
          <img
            className="ub-avatar"
            src={user.photoURL}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="ub-avatar-init">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
        <span className="ub-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="ub-dropdown">
          {/* Header */}
          <div className="ub-dd-head">
            {user.photoURL ? (
              <img className="ub-dd-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="ub-dd-avatar-init">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="ub-dd-info">
              <div className="ub-dd-name">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </div>
              <div className="ub-dd-email">{user.email}</div>
            </div>
            <span
              className="ub-plan-badge"
              style={{ color: PLAN_COLOR[plan], borderColor: PLAN_COLOR[plan] }}
            >
              {PLAN_LABEL[plan]}
            </span>
          </div>

          <div className="ub-divider" />

          <button className="ub-item" onClick={() => close(onHistoryClick)}>
            <span>🕐</span> History
          </button>
          <button className="ub-item" onClick={() => close(onProfileClick)}>
            <span>👤</span> Profile
          </button>
          <button className="ub-item" onClick={() => close(onManageSubClick)}>
            <span>💳</span> Manage Subscription
          </button>
          <button className="ub-item" onClick={() => close(onSettingsClick)}>
            <span>⚙</span> Settings
          </button>

          <div className="ub-divider" />

          <button className="ub-item ub-signout" onClick={() => close(onSignOutClick)}>
            <span>↗</span> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
