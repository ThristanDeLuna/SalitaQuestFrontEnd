import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { initial, roleLabel } from '../auth/roles';
import { stampCount, useSummary } from '../auth/useSummary';
import ReportLink from '../components/ReportLink';

// "Sign out of Salita Quest? Your progress is saved." (wireframe page 4). Escape also cancels.
function ConfirmSignOut({ onCancel, onConfirm }) {
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return (
    <div className="overlay" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="so-title">
        <h2 id="so-title">Sign out of Salita Quest?</h2>
        <p>Your progress is saved.</p>
        <div className="actions">
          <button type="button" className="btn" ref={cancelRef} onClick={onCancel}>Cancel</button>
          <button type="button" className="btn primary" onClick={onConfirm}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

// Profile (wireframe page 4): the user's own name and email only. Never show another user's email.
export default function Profile() {
  const { user, ready, signOut } = useAuth();
  const { summary } = useSummary();   // null until GET /api/me/summary answers, so the numbers are hidden
  const location = useLocation();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);   // true when the user chose to sign out

  // This page does its own check (instead of Guard) so a deliberate sign-out lands on the Map,
  // while a visitor who opens /profile is sent to sign in.
  if (!ready) return <p className="muted">Loading…</p>;
  if (!user) {
    return leaving
      ? <Navigate to="/" replace />
      : <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return (
    <section className="profile">
      <div className="avatar big" aria-hidden="true">{initial(user)}</div>
      <h1>{user.name}</h1>
      <p className="muted">{user.email}</p>
      <p><span className="chip">{roleLabel(user)}</span></p>

      {summary && (
        <ul className="stats">
          <li><strong>{summary.stars}</strong> stars</li>
          <li><strong>{summary.streak.current}</strong> day streak</li>
          <li><strong>{stampCount(summary)}</strong> stamps</li>
        </ul>
      )}

      <div className="stack">
        {user.role === 'learner' && <ReportLink>Request Contributor access</ReportLink>}
        <ReportLink>Report a problem</ReportLink>
        <button type="button" className="btn" onClick={() => setConfirming(true)}>Sign out</button>
      </div>

      {confirming && (
        <ConfirmSignOut onCancel={() => setConfirming(false)}
                        onConfirm={() => { setLeaving(true); signOut(); }} />
      )}
    </section>
  );
}
