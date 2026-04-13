import React from 'react';
import GlobeIcon from './GlobeIcon';
import './PlanSelection.css';

export default function PlanSelection({ user, onSelectFree, onSelectPro, loading }) {
  const firstName = user?.displayName?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'there';

  return (
    <div className="plan-sel-page">
      <div className="plan-sel-inner">
        <div className="plan-sel-logo">
          <GlobeIcon size={36} color="var(--accent)" strokeWidth={1.2} />
        </div>
        <h1 className="plan-sel-title">Welcome, {firstName}</h1>
        <p className="plan-sel-sub">Choose a plan to get started. You can upgrade any time.</p>

        <div className="plan-sel-grid">
          {/* Free */}
          <div className="plan-sel-card">
            <div className="plan-sel-name">Free</div>
            <div className="plan-sel-price">
              <span className="plan-sel-amount">$0</span>/month
            </div>
            <ul className="plan-sel-features">
              <li>✓ 5 optimizations per day</li>
              <li>✓ 30-day history</li>
              <li>✓ Efficient frontier charts</li>
              <li className="plan-sel-no">✗ PDF export</li>
              <li className="plan-sel-no">✗ Portfolio comparison</li>
              <li className="plan-sel-no">✗ Priority data fetching</li>
            </ul>
            <button className="btn-sel-free" onClick={onSelectFree} disabled={loading}>
              {loading ? '…' : 'Start for free'}
            </button>
          </div>

          {/* Pro */}
          <div className="plan-sel-card plan-sel-card-pro">
            <div className="plan-sel-badge">Recommended</div>
            <div className="plan-sel-name">Pro</div>
            <div className="plan-sel-price">
              <span className="plan-sel-amount">$10</span>/month
            </div>
            <ul className="plan-sel-features">
              <li>✓ Unlimited optimizations</li>
              <li>✓ Full history, forever</li>
              <li>✓ PDF export</li>
              <li>✓ Portfolio comparison</li>
              <li>✓ Priority data fetching</li>
              <li>✓ All Free features</li>
            </ul>
            <button className="btn-sel-pro" onClick={onSelectPro} disabled={loading}>
              {loading ? 'Redirecting…' : 'Start Pro →'}
            </button>
          </div>
        </div>

        <p className="plan-sel-note">
          Secure payment via Stripe · Cancel anytime
        </p>
      </div>
    </div>
  );
}
