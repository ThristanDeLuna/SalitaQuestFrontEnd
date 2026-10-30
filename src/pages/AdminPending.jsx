import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Friendly text for the errors the API can answer (the server is the real check).
function errorText(e) {
  if (e.status === 404) return 'That suggestion no longer exists.';
  if (e.status === 409) return 'Someone already reviewed this one.';
  if (e.status === 422) return 'The reason is too long (255 characters at most).';
  if (e.status === 0)   return 'Cannot reach the server. If it was asleep, wait a minute and try again.';
  return 'Something went wrong. Please try again.';
}

// ---------- Dialog: ask for an optional reason, then reject ----------
function RejectDialog({ item, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Escape closes the dialog (keyboard users)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function reject() {
    setBusy(true); setErr('');
    try {
      const d = await api(`/api/admin/submissions/${item.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),   // empty is fine: the API stores NULL (DEC-104)
      });
      onDone(d.email_sent);
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  }

  return (
    <div className="overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="rj-title">
        <h2 id="rj-title">Reject “{item.word}”?</h2>
        <label htmlFor="rj-reason">Reason (optional, shown to the contributor)</label>
        <textarea id="rj-reason" rows={3} maxLength={255} value={reason}
                  onChange={(e) => setReason(e.target.value)} />
        {err && <p className="banner error" role="alert">{err}</p>}
        <div className="actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="btn primary" onClick={reject} disabled={busy}>Reject</button>
        </div>
      </div>
    </div>
  );
}

// ---------- The page ----------
export default function AdminPending() {
  const [rows, setRows] = useState(null);      // null = still loading
  const [err, setErr] = useState('');
  const [target, setTarget] = useState(null);  // the row being rejected (opens the dialog)
  const [note, setNote] = useState('');
  const [reload, setReload] = useState(0);     // change it to load the queue again

  useEffect(() => {
    let alive = true;                          // ignore answers that arrive after we left
    api('/api/admin/submissions?status=pending')
      .then((d) => { if (alive) { setRows(d.data); setErr(''); } })
      .catch((e) => alive && setErr(errorText(e)));
    return () => { alive = false; };
  }, [reload]);

  function rejected(emailSent) {
    setTarget(null);
    setNote(emailSent ? 'Rejected. The contributor was emailed.'
                      : 'Rejected. The email could not be sent.');
    setReload((n) => n + 1);
  }

  return (
    <>
      <h1>Pending suggestions</h1>
      {note && <p className="banner info" role="status" aria-live="polite">{note}</p>}
      {err && <p className="banner error" role="alert">{err}</p>}
      {!rows && !err && <p className="muted">Loading…</p>}
      {rows && rows.length === 0 && <p className="muted">Nothing is waiting for review.</p>}

      <ul className="list">
        {(rows || []).map((r) => (
          <li key={r.id} className="card">
            <strong>{r.word}</strong> <span className="muted">({r.region_code})</span>
            <p>{r.suggested_translation}</p>
            {r.mymemory_text && <p className="muted">Machine suggestion: {r.mymemory_text}</p>}
            <p className="muted">From {r.user_name || r.user_email}</p>
            <div className="actions">
              {/* Approve needs B's Word_model and the approve endpoint */}
              <button type="button" className="btn primary" disabled title="Coming soon">Approve</button>
              <button type="button" className="btn" onClick={() => setTarget(r)}>Reject</button>
            </div>
          </li>
        ))}
      </ul>

      {target && <RejectDialog item={target} onClose={() => setTarget(null)} onDone={rejected} />}
    </>
  );
}