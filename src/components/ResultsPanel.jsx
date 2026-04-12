import React, { useRef } from 'react';
import EfficientFrontierChart from './EfficientFrontierChart';
import AllocationPanel from './AllocationPanel';
import StatsPanel from './StatsPanel';
import BenchmarkPanel from './BenchmarkPanel';
import './ResultsPanel.css';

const RISK_LABELS = {
  safe: { label: 'Safe — Long Term Growth', sub: 'Minimum Variance Portfolio', color: '#4ade80' },
  hopeful: { label: 'Hopeful — Balanced', sub: 'Maximum Sharpe Ratio Portfolio', color: '#89CFF0' },
  risky: { label: 'Risky — Big Swings', sub: 'Maximum Return Portfolio', color: '#f87171' },
};

export default function ResultsPanel({
  portfolios,
  frontier,
  special,
  selectedPortfolio,
  tickers,
  investment,
  timeRange,
  riskProfile,
  spyStats,
  onBack,
  onLogoReset,
  user,
  onSignInClick,
  onSignOutClick,
  onHistoryClick,
}) {
  const resultsRef = useRef();
  const riskInfo = RISK_LABELS[riskProfile];

  async function handleExportPDF() {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = resultsRef.current;
    const opt = {
      margin: [10, 10],
      filename: `portfolio-optimization-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, backgroundColor: '#000000', useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    html2pdf().set(opt).from(element).save();
  }

  return (
    <div className="results-outer">
      {/* Top bar */}
      <div className="results-topbar">
        <div className="results-topbar-left">
          <button className="results-logo-btn" onClick={onLogoReset} title="Reset everything">
            <div className="logo-icon-sm">◈</div>
            <div>
              <div className="results-title">Portfolio Optimizer</div>
              <div className="results-meta">
                {tickers.length} assets · {timeRange} ·{' '}
                <span style={{ color: riskInfo.color }}>{riskInfo.sub}</span>
              </div>
            </div>
          </button>
        </div>
        <div className="results-topbar-right">
          <button className="btn-header-action" onClick={onHistoryClick}>
            History
          </button>
          {user ? (
            <div className="header-user">
              {user.photoURL ? (
                <img
                  className="user-avatar"
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="user-avatar-initial">
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <button className="btn-signout" onClick={onSignOutClick}>Sign out</button>
            </div>
          ) : (
            <button className="btn-signin" onClick={onSignInClick}>Sign in</button>
          )}
          <button className="btn-export" onClick={handleExportPDF}>
            ↓ Export PDF
          </button>
          <button className="btn-reset" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>

      {/* Risk Profile Banner */}
      <div className="risk-banner" style={{ borderColor: `${riskInfo.color}33`, background: `${riskInfo.color}0d` }}>
        <div className="risk-banner-label" style={{ color: riskInfo.color }}>
          {riskInfo.label}
        </div>
        <div className="risk-banner-sub">{riskInfo.sub}</div>
      </div>

      {/* All sections wrapped for PDF */}
      <div ref={resultsRef} className="results-content">
        <EfficientFrontierChart
          portfolios={portfolios}
          frontier={frontier}
          special={special}
          riskProfile={riskProfile}
          tickers={tickers}
        />
        <AllocationPanel
          portfolio={selectedPortfolio}
          tickers={tickers}
          investment={investment}
        />
        <StatsPanel portfolio={selectedPortfolio} />
        <BenchmarkPanel portfolio={selectedPortfolio} spyStats={spyStats} />
      </div>
    </div>
  );
}
