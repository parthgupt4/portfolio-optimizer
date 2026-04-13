import React from 'react';
import GlobeIcon from './GlobeIcon';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Monte Carlo Simulation Engine',
    desc: '2,000 random portfolio simulations map the full risk-return landscape of your chosen assets, identifying the true efficient frontier.',
  },
  {
    icon: '📡',
    title: 'Multi-Source Real Market Data',
    desc: 'Live price history pulled from Yahoo Finance, Alpha Vantage, and Twelve Data with automatic waterfall fallback between sources.',
  },
  {
    icon: '⚖',
    title: 'Risk Profile Selection',
    desc: 'Choose Safe, Hopeful, or Risky to target minimum variance, maximum Sharpe ratio, or maximum return — your goals, your call.',
  },
  {
    icon: '🕐',
    title: 'Optimization History',
    desc: 'Every optimization is saved to your account. Reload any past result instantly across all your devices — no re-fetching required.',
  },
];

const FREE_FEATURES = [
  { text: '5 optimizations per day', included: true },
  { text: '30-day history', included: true },
  { text: 'Efficient frontier charts', included: true },
  { text: 'Google & email sign-in', included: true },
  { text: 'PDF export', included: false },
  { text: 'Portfolio comparison', included: false },
  { text: 'Priority data fetching', included: false },
];

const PRO_FEATURES = [
  { text: 'Unlimited optimizations', included: true },
  { text: 'Full history, forever', included: true },
  { text: 'PDF export', included: true },
  { text: 'Portfolio comparison', included: true },
  { text: 'Priority data fetching', included: true },
  { text: 'Everything in Free', included: true },
];

export default function LandingPage({ onSignIn, theme, onThemeToggle }) {
  return (
    <div className="landing">
      {/* ── Navigation ── */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <GlobeIcon size={22} color="var(--accent)" strokeWidth={1.5} />
          <span className="landing-brand">Atlas Allocation</span>
        </div>
        <div className="landing-nav-right">
          <button
            className="btn-theme-toggle-landing"
            onClick={onThemeToggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button className="btn-landing-signin" onClick={onSignIn}>Sign in</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-globe">
          <GlobeIcon size={80} color="var(--accent)" strokeWidth={0.9} />
        </div>
        <h1 className="hero-title">Atlas Allocation</h1>
        <p className="hero-tagline">
          Institutional-grade portfolio optimization,<br className="hero-br" /> built for everyone
        </p>
        <button className="btn-hero-cta" onClick={onSignIn}>
          Get started free →
        </button>
        <p className="hero-note">No credit card required · Free plan available</p>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <h2 className="landing-section-title">Everything you need to optimize</h2>
        <p className="landing-section-sub">
          Powered by Modern Portfolio Theory and the Efficient Frontier
        </p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="landing-pricing">
        <h2 className="landing-section-title">Simple, transparent pricing</h2>
        <p className="landing-section-sub">Start free. Upgrade when you're ready.</p>
        <div className="pricing-grid">
          {/* Free */}
          <div className="pricing-card">
            <div className="pricing-plan">Free</div>
            <div className="pricing-price">
              <span className="price-amount">$0</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features-list">
              {FREE_FEATURES.map(f => (
                <li key={f.text} className={f.included ? '' : 'not-included'}>
                  <span className="pf-icon">{f.included ? '✓' : '✗'}</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button className="btn-plan-free" onClick={onSignIn}>
              Get started free
            </button>
          </div>

          {/* Pro */}
          <div className="pricing-card pricing-card-pro">
            <div className="pricing-badge">Most popular</div>
            <div className="pricing-plan">Pro</div>
            <div className="pricing-price">
              <span className="price-amount">$10</span>
              <span className="price-period">/month</span>
            </div>
            <ul className="pricing-features-list">
              {PRO_FEATURES.map(f => (
                <li key={f.text}>
                  <span className="pf-icon">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button className="btn-plan-pro" onClick={onSignIn}>
              Start Pro
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <GlobeIcon size={14} color="var(--text-muted)" />
          <span>Atlas Allocation</span>
        </div>
        <span>© {new Date().getFullYear()} Atlas Allocation. All rights reserved.</span>
      </footer>
    </div>
  );
}
