import React from 'react';
import './CompareModal.css';

const RISK_COLORS = { safe: '#4ade80', hopeful: '#89CFF0', risky: '#f87171' };
const RISK_LABELS = { safe: 'Safe', hopeful: 'Hopeful', risky: 'Risky' };

function fmt(v, type) {
  if (typeof v !== 'number') return '—';
  if (type === 'pct') return `${(v * 100).toFixed(1)}%`;
  if (type === 'ratio') return v.toFixed(2);
  if (type === 'dollar') return `$${v.toLocaleString()}`;
  return v;
}

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EntryCol({ entry }) {
  const allAssets = [...(entry.stocks || []), ...(entry.indexFunds || [])].join(' · ');
  const ret = entry.results?.stats?.ret;
  const vol = entry.results?.stats?.vol;
  const sharpe = entry.results?.stats?.sharpeRatio;
  const riskColor = RISK_COLORS[entry.riskProfile] || 'var(--text)';
  const allocation = entry.results?.allocation || {};
  const topAlloc = Object.entries(allocation)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="cmp-col">
      <div className="cmp-date">{fmtDate(entry.timestamp)}</div>
      <div className="cmp-risk" style={{ color: riskColor }}>
        {RISK_LABELS[entry.riskProfile] || entry.riskProfile}
      </div>
      <div className="cmp-assets">{allAssets || '—'}</div>

      <div className="cmp-stats">
        <div className="cmp-stat">
          <div className="cmp-stat-label">Expected Return</div>
          <div className="cmp-stat-val" style={{ color: typeof ret === 'number' && ret >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmt(ret, 'pct')}
          </div>
        </div>
        <div className="cmp-stat">
          <div className="cmp-stat-label">Volatility</div>
          <div className="cmp-stat-val">{fmt(vol, 'pct')}</div>
        </div>
        <div className="cmp-stat">
          <div className="cmp-stat-label">Sharpe Ratio</div>
          <div className="cmp-stat-val">{fmt(sharpe, 'ratio')}</div>
        </div>
        <div className="cmp-stat">
          <div className="cmp-stat-label">Investment</div>
          <div className="cmp-stat-val">{fmt(entry.dollarAmount, 'dollar')}</div>
        </div>
        <div className="cmp-stat">
          <div className="cmp-stat-label">Time Range</div>
          <div className="cmp-stat-val">{entry.timeRange}</div>
        </div>
      </div>

      {topAlloc.length > 0 && (
        <>
          <div className="cmp-alloc-title">Top Allocations</div>
          <div className="cmp-alloc">
            {topAlloc.map(([ticker, weight]) => (
              <div key={ticker} className="cmp-alloc-row">
                <span className="cmp-alloc-ticker">{ticker}</span>
                <div className="cmp-alloc-track">
                  <div className="cmp-alloc-fill" style={{ width: `${(weight * 100).toFixed(1)}%` }} />
                </div>
                <span className="cmp-alloc-pct">{(weight * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CompareModal({ entries, onClose }) {
  if (!entries || entries.length < 2) return null;

  return (
    <div className="cmp-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="cmp-modal">
        <div className="cmp-header">
          <h2 className="cmp-title">Portfolio Comparison</h2>
          <button className="cmp-close" onClick={onClose}>×</button>
        </div>
        <div className="cmp-grid">
          <EntryCol entry={entries[0]} />
          <div className="cmp-vs">VS</div>
          <EntryCol entry={entries[1]} />
        </div>
      </div>
    </div>
  );
}
