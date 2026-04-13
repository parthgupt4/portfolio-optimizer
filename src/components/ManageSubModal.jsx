import React from 'react';

export default function ManageSubModal({ userDoc, onClose, onUpgrade }) {
  const plan = userDoc?.plan || 'free';

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Subscription</h2>

        {plan === 'admin' ? (
          <div>
            <div className="sub-admin-badge">Admin</div>
            <p className="sub-admin-text">
              You have full admin access — unlimited optimizations and all Pro features are unlocked.
            </p>
          </div>
        ) : plan === 'pro' ? (
          <div>
            <div className="sub-current-plan">
              <span className="sub-label">Current plan</span>
              <span className="sub-plan-badge pro">Pro</span>
            </div>
            <p className="sub-desc">
              You have unlimited optimizations, PDF export, portfolio comparison, and priority data fetching.
            </p>
            <button className="btn-cancel-sub" onClick={onClose}>
              Cancel subscription
            </button>
            <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              To cancel, email support or manage via your Stripe customer portal.
            </p>
          </div>
        ) : (
          <div>
            <div className="sub-current-plan">
              <span className="sub-label">Current plan</span>
              <span className="sub-plan-badge free">Free</span>
            </div>
            <p className="sub-desc">
              You're on the Free plan with 5 optimizations per day and 30-day history.
            </p>
            <div className="sub-upgrade-features">
              {[
                'Unlimited optimizations',
                'Full history, forever',
                'PDF export',
                'Portfolio comparison',
                'Priority data fetching',
              ].map(f => (
                <div key={f}>
                  <span style={{ color: 'var(--green)', marginRight: 8 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <button className="btn-upgrade-sub" onClick={onUpgrade}>
              Upgrade to Pro — $10/month →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
