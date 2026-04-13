import React from 'react';

export default function UpgradeModal({ onClose, onUpgrade }) {
  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
          <h2 className="modal-title" style={{ marginBottom: 8, textAlign: 'center' }}>
            Daily limit reached
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Free accounts are limited to 5 optimizations per day. Upgrade to Pro for unlimited access.
          </p>
        </div>

        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {[
            'Unlimited optimizations',
            'Full optimization history',
            'PDF export',
            'Portfolio comparison',
            'Priority data fetching',
          ].map(f => (
            <div key={f} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--green)', marginRight: 8 }}>✓</span>{f}
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 12,
        }}>
          Pro plan · $10/month
        </div>

        <button
          onClick={onUpgrade}
          style={{
            width: '100%',
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            padding: '13px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginBottom: 10,
          }}
        >
          Upgrade to Pro →
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '11px',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
