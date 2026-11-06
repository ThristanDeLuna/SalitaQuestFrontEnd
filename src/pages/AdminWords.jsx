import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import './AdminWords.css';

// The same limits the server checks (AdminWords.php). The server is still the real check.
const WORD_MAX = 255;
const TRANSLATION_MAX = 255;
const EXAMPLE_MAX = 500;

// Plain words for the errors the API can answer. 401 and 403 are handled by the app already.
// For 409 and 422 the server's own sentence says exactly what is wrong, so it is shown as it is.
function errorText(e) {
  if (e.status === 409 || e.status === 422) return e.message;
  if (e.status === 404) return 'That word no longer exists. Refresh the list.';
  if (e.status === 0) return 'Cannot reach the server.';
  return 'Something went wrong. Try again.';
}

// Check the form before sending it. Returns a message, or '' when it looks fine.
function checkForm(v) {
  if (!v.word.trim()) return 'Type the word.';
  if (!v.translation.trim()) return 'Type the meaning in English.';
  if (v.word.length > WORD_MAX) return `The word can be at most ${WORD_MAX} characters.`;
  if (v.translation.length > TRANSLATION_MAX) return `The meaning can be at most ${TRANSLATION_MAX} characters.`;
  if (v.example_sentence.length > EXAMPLE_MAX) return `The example can be at most ${EXAMPLE_MAX} characters.`;
  return '';
}

// ---------- One form, used for both "Add word" and "Edit" ----------
// onSave(values) returns a promise; if it throws, the message is shown and the form stays open.
function WordForm({ initial, wordLocked, submitLabel, onSave, onCancel }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const first = useRef(null);
  useEffect(() => { first.current?.focus(); }, []);    // the first field gets the focus when the form opens

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const problem = checkForm(v);
    if (problem) { setMsg(problem); return; }
    setBusy(true);
    setMsg('');
    try {
      await onSave({ word: v.word.trim(), translation: v.translation.trim(), example_sentence: v.example_sentence.trim() });
    } catch (err) {
      setMsg(errorText(err));
      setBusy(false);                                   // on success the parent closes the form
    }
  }

  return (
    <form className="aw-form" onSubmit={submit} onKeyDown={(e) => { if (e.key === 'Escape' && !busy) onCancel(); }}>
      <label className="aw-field">
        <span>Word</span>
        <input ref={wordLocked ? null : first} value={v.word} onChange={set('word')} disabled={wordLocked || busy} maxLength={WORD_MAX} />
        {wordLocked && <small className="muted">This word has a recording, so its spelling is locked.</small>}
      </label>
      <label className="aw-field">
        <span>Meaning in English</span>
        <input ref={wordLocked ? first : null} value={v.translation} onChange={set('translation')} disabled={busy} maxLength={TRANSLATION_MAX} />
      </label>
      <label className="aw-field">
        <span>Example sentence (optional)</span>
        <textarea rows={2} value={v.example_sentence} onChange={set('example_sentence')} disabled={busy} maxLength={EXAMPLE_MAX} />
      </label>
      {msg && <p className="banner error" role="alert">{msg}</p>}
      <div className="aw-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}

// ---------- One word as a card: view, edit, or delete-confirm ----------
function WordCard({ w, mode, onEdit, onAskDelete, onClose, onSave, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function confirmDelete() {
    setBusy(true);
    setMsg('');
    try { await onDelete(w); } catch (err) { setMsg(errorText(err)); setBusy(false); }
  }

  return (
    <li className="aw-card">
      {mode === 'edit' ? (
        <WordForm
          initial={{ word: w.word, translation: w.translation, example_sentence: w.example_sentence || '' }}
          wordLocked={w.has_audio}
          submitLabel="Save changes"
          onSave={(values) => onSave(w, values)}
          onCancel={onClose}
        />
      ) : (
        <>
          <h3 className="aw-word">{w.word} {w.has_audio && <span className="chip">Has recording</span>}</h3>
          <p className="aw-meaning">{w.translation}</p>
          {w.example_sentence ? <p className="muted">{w.example_sentence}</p> : <p className="muted">No example sentence.</p>}

          {mode === 'delete' ? (
            <div role="alert">
              <p><strong>Delete &ldquo;{w.word}&rdquo;?</strong> This cannot be undone.</p>
              {msg && <p className="banner error">{msg}</p>}
              <div className="aw-actions">
                <button type="button" className="btn" onClick={onClose} disabled={busy}>No, keep it</button>
                <button type="button" className="btn primary" onClick={confirmDelete} disabled={busy}>
                  {busy ? 'Deleting...' : 'Yes, delete'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="aw-actions">
                <button type="button" className="btn" onClick={() => onEdit(w.id)}>Edit</button>
                <button type="button" className="btn" onClick={() => onAskDelete(w.id)} disabled={w.has_audio}>Delete</button>
              </div>
              {w.has_audio && <p className="muted">A word with a recording cannot be deleted. Remove the recording on the Audio tab first.</p>}
            </>
          )}
        </>
      )}
    </li>
  );
}

export default function AdminWords() {
  const [regions, setRegions] = useState(null);
  const [region, setRegion] = useState('');
  const [words, setWords] = useState(null);        // null = loading
  const [err, setErr] = useState(null);
  const [reload, setReload] = useState(0);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);          // { id, mode: 'edit' | 'delete' } for the one card that is open
  const [note, setNote] = useState('');            // "Word added." and so on

  // ---------- 1. Regions, once ----------
  useEffect(() => {
    let alive = true;                               // ignore an answer that arrives after we left
    api('/api/regions')
      .then((res) => {
        if (!alive) return;
        setRegions(res.data);
        if (res.data.length) setRegion((r) => r || res.data[0].code);
      })
      .catch((e) => { if (alive) setErr(e); });
    return () => { alive = false; };
  }, []);

  // ---------- 2. The words of the chosen region ----------
  useEffect(() => {
    if (!region) return undefined;
    let alive = true;
    api(`/api/admin/words?region=${encodeURIComponent(region)}`)
      .then((res) => { if (alive) { setWords(res.data); setErr(null); } })
      .catch((e) => { if (alive) setErr(e); });
    return () => { alive = false; };
  }, [region, reload]);

  const refresh = (message) => { setNote(message); setOpen(null); setAdding(false); setWords(null); setReload((n) => n + 1); };
  const pickRegion = (code) => { setRegion(code); setWords(null); setOpen(null); setAdding(false); setNote(''); };

  // Create, update and delete. They throw on failure so the form or the card can show the message.
  const create = async (values) => {
    await api('/api/admin/words', { method: 'POST', body: JSON.stringify({ region_code: region, ...values }) });
    refresh('Word added.');
  };
  const update = async (w, values) => {
    // The spelling is sent only when it can change; a word with a recording keeps its spelling.
    const body = { translation: values.translation, example_sentence: values.example_sentence };
    if (!w.has_audio) body.word = values.word;
    await api(`/api/admin/words/${w.id}`, { method: 'PUT', body: JSON.stringify(body) });
    refresh('Changes saved.');
  };
  const remove = async (w) => {
    await api(`/api/admin/words/${w.id}`, { method: 'DELETE' });
    refresh('Word deleted.');
  };

  const regionName = regions?.find((r) => r.code === region)?.name || region;

  return (
    <div>
      <h1>Words</h1>
      <p className="muted">Add, fix or remove the words of a region.</p>

      {err && (
        <p className="banner error" role="alert">
          {err.status === 0 ? 'Cannot reach the server.' : 'Something went wrong. Try again.'}{' '}
          <button type="button" className="btn" onClick={() => { setErr(null); setReload((n) => n + 1); }}>Try again</button>
        </p>
      )}

      {regions && (
        <label className="aw-field">
          <span>Region</span>
          <select value={region} onChange={(e) => pickRegion(e.target.value)}>
            {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
        </label>
      )}

      {note && <p className="banner info" role="status">{note}</p>}

      {region && !adding && (
        <button type="button" className="btn primary aw-add" onClick={() => { setAdding(true); setOpen(null); setNote(''); }}>
          Add a word to {regionName}
        </button>
      )}
      {adding && (
        <div className="aw-card">
          <h2>New word in {regionName}</h2>
          <WordForm
            initial={{ word: '', translation: '', example_sentence: '' }}
            wordLocked={false}
            submitLabel="Add word"
            onSave={create}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {!words && !err && region && <p className="muted" role="status">Loading words...</p>}
      {words && words.length === 0 && <p className="muted">This region has no words yet.</p>}
      {words && words.length > 0 && (
        <>
          <p className="muted">{words.length} words</p>
          <ul className="aw-list">
            {words.map((w) => (
              <WordCard
                key={w.id}
                w={w}
                mode={open?.id === w.id ? open.mode : 'view'}
                onEdit={(id) => { setOpen({ id, mode: 'edit' }); setAdding(false); setNote(''); }}
                onAskDelete={(id) => { setOpen({ id, mode: 'delete' }); setAdding(false); setNote(''); }}
                onClose={() => setOpen(null)}
                onSave={update}
                onDelete={remove}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
