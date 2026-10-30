import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Region codes are what the API stores; labels are what people read (DEC-61: "Cebuano").
const REGIONS = [['tagalog', 'Tagalog'], ['cebuano', 'Cebuano'], ['hiligaynon', 'Hiligaynon']];

// Words for each error the API can answer. The server is the real check; this is only friendly text.
function errorText(e) {
  if (e.status === 409) return 'This word is already waiting for review.';
  if (e.status === 422) return 'Please check the word and the meaning.';
  if (e.status === 429) return 'You have too many suggestions waiting. Wait for a review first.';
  if (e.status === 0)   return 'Cannot reach the server. If it was asleep, wait a minute and try again.';
  return 'Something went wrong. Please try again.';
}

// ---------- Segment 1: the form ----------
function NewWord({ onSent }) {
  const [region, setRegion] = useState('cebuano');
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [hint, setHint] = useState(null);       // MyMemory's untouched answer; sent back to the API
  const [note, setNote] = useState(null);       // { kind: 'info' | 'error', text }
  const [busy, setBusy] = useState(false);

  // "Suggest meaning" runs on a button press (not on every key), to save MyMemory's daily quota.
  async function suggest() {
    if (!word.trim()) { setNote({ kind: 'error', text: 'Type the word first.' }); return; }
    setBusy(true); setNote(null);
    try {
      const d = await api(`/api/submissions/suggest?word=${encodeURIComponent(word.trim())}&region_code=${region}`);
      setHint(d.suggestion);                    // null when MyMemory has no usable answer
      if (d.suggestion && !meaning) setMeaning(d.suggestion);
      if (!d.suggestion) setNote({ kind: 'info', text: 'No suggestion this time. Type the meaning yourself.' });
    } catch (e) {
      setNote({ kind: 'error', text: errorText(e) });
    } finally { setBusy(false); }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNote(null);
    try {
      await api('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
          region_code: region, word: word.trim(),
          suggested_translation: meaning.trim(), mymemory_text: hint,
        }),
      });
      setWord(''); setMeaning(''); setHint(null);
      setNote({ kind: 'info', text: 'Sent! An admin will review it.' });
      onSent();                                 // tell the "My words" list to reload
    } catch (e2) {
      setNote({ kind: 'error', text: errorText(e2) });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="form">
      <label htmlFor="region">Language</label>
      <select id="region" value={region} onChange={(e) => { setRegion(e.target.value); setHint(null); }}>
        {REGIONS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>

      <label htmlFor="word">Word</label>
      <input id="word" value={word} maxLength={100} required onChange={(e) => setWord(e.target.value)} />

      <button type="button" className="btn" onClick={suggest} disabled={busy}>Suggest meaning</button>
      {hint && <p className="muted">Machine suggestion (it may be wrong): {hint}</p>}

      <label htmlFor="meaning">Meaning in English</label>
      <input id="meaning" value={meaning} maxLength={255} required onChange={(e) => setMeaning(e.target.value)} />

      <button type="submit" className="btn primary" disabled={busy}>Send for review</button>

      {/* aria-live: screen readers hear the result without the focus moving */}
      <p role="status" aria-live="polite" className={note?.kind === 'error' ? 'banner error' : note ? 'banner info' : ''}>
        {note?.text}
      </p>
    </form>
  );
}

// ---------- Segment 2: my own submissions ----------
function MyWords({ reload, onChange }) {
  const [rows, setRows] = useState(null);       // null = still loading
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;                           // ignore an answer that arrives after we left the page
    api('/api/submissions')
      .then((d) => alive && setRows(d.data))
      .catch((e) => alive && setErr(errorText(e)));
    return () => { alive = false; };
  }, [reload]);

  async function withdraw(id) {
    try { await api(`/api/submissions/${id}`, { method: 'DELETE' }); onChange(); }
    catch (e) { setErr(errorText(e)); }
  }

  if (err) return <p className="banner error" role="alert">{err}</p>;
  if (!rows) return <p className="muted">Loading…</p>;
  if (rows.length === 0) return <p className="muted">You have not suggested any words yet.</p>;

  return (
    <ul className="list">
      {rows.map((r) => (
        <li key={r.id} className="card">
          <strong>{r.word}</strong> <span className="muted">({r.region_code})</span>
          <p>{r.suggested_translation}</p>
          <span className="chip">{r.status}</span>
          {r.status === 'rejected' && r.reject_reason && <p className="muted">Reason: {r.reject_reason}</p>}
          {r.status === 'pending' && (
            <button type="button" className="btn" onClick={() => withdraw(r.id)}>Withdraw</button>
          )}
        </li>
      ))}
    </ul>
  );
}

// ---------- The page ----------
export default function Suggest() {
  const [tab, setTab] = useState('new');
  const [reload, setReload] = useState(0);      // changing this number makes MyWords load again
  const refresh = () => setReload((n) => n + 1);

  return (
    <>
      <h1>Suggest a word</h1>
      <div className="seg" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'new'} onClick={() => setTab('new')}>New word</button>
        <button type="button" role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>My words</button>
      </div>
      {tab === 'new' ? <NewWord onSent={refresh} /> : <MyWords reload={reload} onChange={refresh} />}
    </>
  );
}