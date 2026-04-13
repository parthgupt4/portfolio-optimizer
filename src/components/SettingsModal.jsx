import React from 'react';

export default function SettingsModal({ user, theme, onThemeToggle, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Settings</h2>

        <div className="settings-row">
          <div>
            <div className="settings-label">Display name</div>
            <div className="settings-value">{user.displayName || '—'}</div>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Email</div>
            <div className="settings-value">{user.email}</div>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-label">Appearance</div>
            <div className="settings-value">
              {theme === 'dark' ? '🌙 Dark mode' : '☀ Light mode'}
            </div>
          </div>
          <button className="btn-toggle-theme" onClick={onThemeToggle}>
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </button>
        </div>
      </div>
    </div>
  );
}
