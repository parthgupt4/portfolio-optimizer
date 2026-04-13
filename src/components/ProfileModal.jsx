import React from 'react';

export default function ProfileModal({ user, userDoc, onClose }) {
  const joinDate = userDoc?.createdAt?.toDate?.()
    ? userDoc.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const plan = userDoc?.plan || 'free';

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Profile</h2>

        <div className="profile-avatar-row">
          {user.photoURL ? (
            <img className="profile-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="profile-avatar-init">
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-field">
          <span className="profile-label">Name</span>
          <span className="profile-value">{user.displayName || '—'}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user.email}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Plan</span>
          <span className={`plan-badge plan-badge-${plan}`}>
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Member since</span>
          <span className="profile-value">{joinDate}</span>
        </div>
      </div>
    </div>
  );
}
