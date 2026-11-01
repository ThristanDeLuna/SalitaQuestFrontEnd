import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import './AdminAudio.css';

// The listening game needs this many recorded words in a region before it can be played.
const AUDIO_NEEDED_PER_REGION = 5;

// Region codes from the API, with the names people read.
const REGIONS = { tagalog: 'Tagalog', cebuano: 'Cebuano', hiligaynon: 'Hiligaynon' };
const regionName = (code) => REGIONS[code] || code;

// The same limits the server checks. The server is still the real check.
const ALLOWED_TYPES = ['mp3', 'm4a', 'wav', 'ogg'];
const MAX_BYTES = 1000000;   // 1 MB (decimal)

// Friendly text for the errors the API can answer. 401 and 403 are handled by the app already.
function errorText(e) {
  if (e.status === 413 || e.status === 422) {
    return 'That file is too large (max 1 MB) or not an allowed type (mp3, m4a, wav, ogg).';
  }
  if (e.status === 404) return 'That word or recording no longer exists. Refresh the list.';
  if (e.status === 502) return 'The audio service had a problem. Try again in a moment.';
  if (e.status === 0)   return 'Cannot reach the server.';
  return 'Something went wrong. Try again.';
}

// Check the chosen file before sending it. Returns a message, or '' when the file looks fine.
function checkFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_TYPES.includes(ext)) return 'That file is not an allowed type (mp3, m4a, wav, ogg).';
  if (file.size > MAX_BYTES) return 'That file is too large (max 1 MB).';
  return '';
}

// 245000 -> "245 KB", 1200000 -> "1.20 MB" (decimal, like the limit).
function formatSize(bytes) {
  return bytes >= MAX_BYTES ? `${(bytes / MAX_BYTES).toFixed(2)} MB` : `${Math.ceil(bytes / 1000)} KB`;
}

// ---------- Dialog frame, like ConfirmSignOut: Cancel gets focus, Escape closes ----------
function Dialog({ id, title, busy, err, confirmLabel, confirmDisabled, onConfirm, onClose, children }) {
  const cancelRef = useRef(null);
  const boxRef = useRef(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);

  // Escape closes the dialog wherever the focus is (so it still works after the buttons were disabled),
  // except while a request is running. The listener is removed when the dialog closes.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // After a failed attempt the disabled Cancel button lost the focus: give it back,
  // unless the user is already inside the dialog (for example on the file input).
  useEffect(() => {
    if (err && !busy && !boxRef.current?.contains(document.activeElement)) cancelRef.current?.focus();
  }, [err, busy]);

  return (
    <div className="overlay">
      <div className="dialog audio-dialog" ref={boxRef} role="dialog" aria-modal="true" aria-labelledby={id}>
        <h2 id={id}>{title}</h2>
        {children}
        <div className="actions">
          <button type="button" className="btn" ref={cancelRef} onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="btn primary" onClick={onConfirm} disabled={busy || confirmDisabled}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Upload (or Replace) one recording ----------
function UploadDialog({ row, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const verb = row.has_audio ? 'Replace' : 'Upload';

  function choose(e) {
    const picked = e.target.files[0] || null;
    setFile(picked);
    setErr(picked ? checkFile(picked) : '');
  }

  async function upload() {
    setBusy(true); setErr('');
    const body = new FormData();
    body.append('file', file);   // the API expects one field named "file"
    try {
      const d = await api(`/api/admin/audio/${row.word_id}`, { method: 'POST', body });
      onDone(`${d.replaced ? 'Replaced' : 'Uploaded'} the recording for “${row.word}”.`);
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  }

  return (
    <Dialog id="au-up-title" title={`${verb} audio for “${row.word}”`} busy={busy} err={err}
            confirmLabel={busy ? `${verb}ing…` : verb}
            confirmDisabled={!file || Boolean(checkFile(file))}
            onConfirm={upload} onClose={onClose}>
      <label htmlFor="au-file" className="audio-label">File</label>
      <input id="au-file" type="file" className="audio-file" accept=".mp3,.m4a,.wav,.ogg"
             onChange={choose} disabled={busy} />
      {file && <p className="audio-picked">{file.name} ({formatSize(file.size)})</p>}
      <p className="muted">mp3, m4a, wav or ogg, up to 1 MB.</p>
      {err && <p className="banner error" role="alert">{err}</p>}
    </Dialog>
  );
}

// ---------- Delete one recording (the word itself stays) ----------
function DeleteDialog({ row, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function remove() {
    setBusy(true); setErr('');
    try {
      await api(`/api/admin/audio/${row.word_id}`, { method: 'DELETE' });
      onDone(`Deleted the recording for “${row.word}”.`);
    } catch (e) {
      setErr(errorText(e));
      setBusy(false);
    }
  }

  return (
    <Dialog id="au-del-title" title={`Delete the recording for “${row.word}”?`} busy={busy} err={err}
            confirmLabel={busy ? 'Deleting…' : 'Delete'} onConfirm={remove} onClose={onClose}>
      <p>The word stays in the list, without audio.</p>
      {err && <p className="banner error" role="alert">{err}</p>}
    </Dialog>
  );
}

// ---------- Coverage card: recorded words per region ----------
function Coverage({ rows }) {
  return (
    <section className="audio-coverage" aria-labelledby="au-title">
      <h1 id="au-title">Audio coverage</h1>
      <p className="muted">Needs {AUDIO_NEEDED_PER_REGION} per region for the listening game</p>
      {rows && (
        <ul className="audio-coverage-list">
          {Object.keys(REGIONS).map((code) => {
            const count = rows.filter((r) => r.region_code === code && r.has_audio).length;
            const missing = AUDIO_NEEDED_PER_REGION - count;
            return (
              <li key={code}>
                <span>{regionName(code)}</span>
                <strong>{count}</strong>
                {missing <= 0
                  ? <span className="chip audio-ready">✓ Ready</span>
                  : <span className="chip audio-short">Needs {missing} more</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ---------- One word ----------
function WordRow({ row, playing, onPlay, onUpload, onDelete }) {
  return (
    <li className="audio-row">
      <div className="audio-row-top">
        <strong className="audio-word">{row.word}</strong>
        {row.has_audio
          ? <span className="chip audio-has">✓ Has audio</span>
          : <span className="chip audio-none">No audio</span>}
      </div>
      <p className="audio-meta">
        <span className="chip">{regionName(row.region_code)}</span> {row.translation}
      </p>
      <div className="audio-buttons">
        {row.has_audio && (
          <button type="button" className="btn" onClick={onPlay} aria-label={`${playing ? 'Stop' : 'Play'} ${row.word}`}>
            {playing ? 'Stop' : 'Play'}
          </button>
        )}
        <button type="button" className={row.has_audio ? 'btn' : 'btn primary'} onClick={onUpload}
                aria-label={`${row.has_audio ? 'Replace' : 'Upload'} audio for ${row.word}`}>
          {row.has_audio ? 'Replace' : 'Upload'}
        </button>
        {row.has_audio && (
          <button type="button" className="btn" onClick={onDelete} aria-label={`Delete audio for ${row.word}`}>
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

// ---------- The page ----------
export default function AdminAudio() {
  const [rows, setRows] = useState(null);       // null = still loading
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [reload, setReload] = useState(0);      // change it to load the list again
  const [region, setRegion] = useState('all');  // filter chip
  const [dialog, setDialog] = useState(null);   // { kind: 'upload' | 'delete', row } opens a dialog
  const [playingId, setPlayingId] = useState(null);
  const player = useRef(null);                  // the one <audio> that is playing, if any

  useEffect(() => {
    let alive = true;                           // ignore answers that arrive after we left
    api('/api/admin/audio')                     // a plain array, not { data: ... }
      .then((d) => { if (alive) { setRows(d); setErr(''); } })
      .catch((e) => alive && setErr(errorText(e)));
    return () => { alive = false; };
  }, [reload]);

  // Stop the sound when the admin leaves this page.
  useEffect(() => () => player.current?.pause(), []);

  function stop() {
    player.current?.pause();
    player.current = null;
    setPlayingId(null);
  }

  // One recording at a time, and only after a tap. The url is played exactly as the API gave it.
  function togglePlay(row) {
    const wasPlaying = playingId === row.word_id;
    stop();
    if (wasPlaying) return;

    const audio = new Audio(row.url);
    player.current = audio;
    setPlayingId(row.word_id);
    const finished = () => { if (player.current === audio) stop(); };
    audio.addEventListener('ended', finished);
    audio.play().catch(() => {
      finished();
      setErr(`Could not play the recording for “${row.word}”.`);
    });
  }

  // After an upload or delete: close the dialog, say what happened, load the list again.
  function done(message) {
    stop();
    setDialog(null);
    setNote(message);
    setReload((n) => n + 1);
  }

  const shown = (rows || []).filter((r) => region === 'all' || r.region_code === region);

  return (
    <>
      <Coverage rows={rows} />

      {note && <p className="banner info" role="status" aria-live="polite">{note}</p>}
      {err && <p className="banner error" role="alert">{err}</p>}

      <div className="audio-filters" role="group" aria-label="Show region">
        {[['all', 'All'], ...Object.entries(REGIONS)].map(([code, label]) => (
          <button key={code} type="button" className="audio-filter" aria-pressed={region === code}
                  onClick={() => setRegion(code)}>
            {label}
          </button>
        ))}
      </div>

      {!rows && !err && <p className="muted">Loading...</p>}
      {rows && shown.length === 0 && <p className="muted">No words yet.</p>}

      <ul className="audio-list">
        {shown.map((r) => (
          <WordRow key={r.word_id} row={r} playing={playingId === r.word_id}
                   onPlay={() => togglePlay(r)}
                   onUpload={() => setDialog({ kind: 'upload', row: r })}
                   onDelete={() => setDialog({ kind: 'delete', row: r })} />
        ))}
      </ul>

      {dialog?.kind === 'upload' && <UploadDialog row={dialog.row} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === 'delete' && <DeleteDialog row={dialog.row} onClose={() => setDialog(null)} onDone={done} />}
    </>
  );
}
