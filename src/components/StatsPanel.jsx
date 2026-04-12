import React from 'react';
import { fmtPct, RISK_FREE_RATE } from '../utils/financeUtils';
import './StatsPanel.css';

const STATS = [
  {
    key: 'ret',
    label: 'Expected Annual Return',
    fmt: v => fmtPct(v),
    color: '#4ade80',
    explain: 'The projected yearly percentage gain based on the average historical performance of your assets, weighted by their allocations.',
    positive: v => v > 0,
  },
  {
    key: 'vol',
    label: 'Annual Volatility (Risk)',
    fmt: v => fmtPct(v),
    color: '#f87171',
    explain: 'How much the portfolio\'s value is expected to fluctuate over a year. Higher volatility = bigger swings — a 20% volatility means your portfolio could swing ±20% in a typical year.',
    positive: () => false,
  },
  {
    key: 'sharpeRatio',
    label: 'Sharpe Ratio',
    fmt: v => v.toFixed(2),
    color: '#89CFF0',
    explain: `Measures return earned per unit of risk taken, above the risk-free rate (${fmtPct(RISK_FREE_RATE)}). A Sharpe ratio above 1.0 is generally considered good. Above 2.0 is excellent. It answers: "Is this portfolio being adequately rewarded for the risk it takes?"`,
    positive: v => v > 1,
  },
];

export default function StatsPanel({ portfolio }) {
  return (
    <div className="stats-section">
      <h2 className="section-title">Key Statistics</h2>
      <div className="stats-grid">
        {STATS.map(s => {
          const val = portfolio[s.key];
          return (
            <div key={s.key} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>
                {s.fmt(val)}
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{ background: s.color, width: `${Math.min(100, Math.abs(val) * 300)}%` }}
                />
              </div>
              <p className="stat-explain">{s.explain}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
