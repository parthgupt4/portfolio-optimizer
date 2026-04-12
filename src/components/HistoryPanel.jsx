import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import './HistoryPanel.css';

const RISK_COLORS = { safe: '#4ade80', hopeful: '#89CFF0', risky: '#f87171' };
const RISK_LABELS = { safe: 'Safe', hopeful: 'Hopeful', risky: 'Risky' };

function fmtDate(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function HistoryPanel({ user, onClose, onLoad, onSignInClick }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'optimizations'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  return (
    <div className="history-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="history-panel">
        <div className="history-header">
          <div className="history-title">Optimization History</div>
          <button className="history-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="history-body">
          {!user ? (
            <div className="history-unauth">
              <div className="history-unauth-icon">◈</div>
              <div className="history-unauth-title">Sign in to view history</div>
              <p className="history-unauth-sub">
                Your past optimizations are saved automatically and available across all your devices.
              </p>
              <button className="btn-history-signin" onClick={onSignInClick}>Sign in</button>
            </div>
          ) : loading ? (
            <div className="history-loading">
              <div className="history-spinner" />
            </div>
          ) : entries.length === 0 ? (
            <div className="history-empty">
              No saved optimizations yet.<br />Run one to get started.
            </div>
          ) : (
            <ul className="history-list">
              {entries.map(entry => {
                const allAssets = [
                  ...(entry.stocks || []),
                  ...(entry.indexFunds || []),
                ].join(' · ');
                const ret = entry.results?.stats?.ret;
                const retStr = typeof ret === 'number'
                  ? `${ret >= 0 ? '+' : ''}${(ret * 100).toFixed(1)}%`
                  : '—';
                const retColor = typeof ret === 'number'
                  ? (ret >= 0 ? '#4ade80' : '#f87171')
                  : 'var(--text-muted)';
                const riskColor = RISK_COLORS[entry.riskProfile] || '#fff';
                const riskLabel = RISK_LABELS[entry.riskProfile] || entry.riskProfile;

                return (
                  <li key={entry.id} className="history-entry">
                    <div className="history-entry-head">
                      <span className="history-entry-date">{fmtDate(entry.timestamp)}</span>
                      <span className="history-entry-risk" style={{ color: riskColor }}>
                        {riskLabel}
                      </span>
                    </div>
                    <div className="history-entry-assets">{allAssets || '—'}</div>
                    <div className="history-entry-foot">
                      <div className="history-entry-stats">
                        <div className="history-stat">
                          <span className="history-stat-label">Return</span>
                          <span className="history-stat-val" style={{ color: retColor }}>{retStr}</span>
                        </div>
                        {entry.dollarAmount > 0 && (
                          <div className="history-stat">
                            <span className="history-stat-label">Amount</span>
                            <span className="history-stat-val">
                              ${Number(entry.dollarAmount).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="history-stat">
                          <span className="history-stat-label">Range</span>
                          <span className="history-stat-val">{entry.timeRange}</span>
                        </div>
                      </div>
                      <button className="btn-load-entry" onClick={() => onLoad(entry)}>
                        Load ↗
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
