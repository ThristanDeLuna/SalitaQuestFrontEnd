import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import './AdminRegions.css';

// The same limits the server checks (AdminRegions.php). The server is still the real check.
const CODE_RE = /^[a-z0-9_-]{1,32}$/;
const NAME_MAX = 100;
const AREA_MAX = 100;
const DESC_MAX = 1000;

// Plain words for the errors the API can answer. 401 and 403 are handled by the app already.
// For 409 and 422 the server's own sentence says exactly what is wrong, so it is shown as it is.
function errorText(e) {
  if (e.status === 409 || e.status === 422) return e.message;
  if (e.status === 404) return 'That region no longer exists. Refresh the list.';
  if (e.status === 0) return 'Cannot reach the server.';
  return 'Something went wrong. Try again.';
}

// Check the form before sending it. Returns a message, or '' when it looks fine.
function checkForm(v, codeLocked) {
  if (!codeLocked && !CODE_RE.test(v.code.trim().toLowerCase())) {
    return 'The code must be 1 to 32 characters: a to z, 0 to 9, - or _.';
  }
  if (!v.name.trim() || v.name.length > NAME_MAX) return `The name must be 1 to ${NAME_MAX} characters.`;
  if (!v.area.trim() || v.area.length > AREA_MAX) return `The area must be 1 to ${AREA_MAX} characters.`;
  if (v.description.length > DESC_MAX) return `The description can be at most ${DESC_MAX} characters.`;
  const lat = Number(v.latitude);
  const lng = Number(v.longitude);
  if (v.latitude.trim() === '' || Number.isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be a number from -90 to 90.';
  if (v.longitude.trim() === '' || Number.isNaN(lng) || lng < -180 || lng > 180) return 'Longitude must be a number from -180 to 180.';
  return '';
}

// ---------- One form, used for both "Add region" and "Edit" ----------
// onSave(values) returns a promise; if it throws, the message is shown and the form stays open.
function RegionForm({ initial, codeLocked, submitLabel, onSave, onCancel }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const first = useRef(null);
  useEffect(() => { first.current?.focus(); }, []);    // the first field gets the focus when the form opens

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const problem = checkForm(v, codeLocked);
    if (problem) { setMsg(problem); return; }
    setBusy(true);
    setMsg('');
    try {
      await onSave({
        code: v.code.trim().toLowerCase(),
        name: v.name.trim(),
        area: v.area.trim(),
        description: v.description.trim(),
        latitude: Number(v.latitude),
        longitude: Number(v.longitude),
      });
    } catch (err) {
      setMsg(errorText(err));
      setBusy(false);                                   // on success the parent closes the form
    }
  }

  return (
    <form className="ar-form" onSubmit={submit} onKeyDown={(e) => { if (e.key === 'Escape' && !busy) onCancel(); }}>
      <label className="ar-field">
        <span>Code</span>
        <input ref={codeLocked ? null : first} value={v.code} onChange={set('code')} disabled={codeLocked || busy} maxLength={32} autoCapitalize="none" />
        <small className="muted">
          {codeLocked ? 'The code can never be changed, because other tables store it.' : 'Lowercase, for example "bicol". It can never be changed later.'}
        </small>
      </label>
      <label className="ar-field">
        <span>Name</span>
        <input ref={codeLocked ? first : null} value={v.name} onChange={set('name')} disabled={busy} maxLength={NAME_MAX} />
      </label>
      <label className="ar-field">
        <span>Area</span>
        <input value={v.area} onChange={set('area')} disabled={busy} maxLength={AREA_MAX} />
      </label>
      <label className="ar-field">
        <span>Description (optional)</span>
        <textarea rows={2} value={v.description} onChange={set('description')} disabled={busy} maxLength={DESC_MAX} />
      </label>
      <div className="ar-pair">
        <label className="ar-field">
          <span>Latitude</span>
          <input value={v.latitude} onChange={set('latitude')} disabled={busy} inputMode="decimal" />
        </label>
        <label className="ar-field">
          <span>Longitude</span>
          <input value={v.longitude} onChange={set('longitude')} disabled={busy} inputMode="decimal" />
        </label>
      </div>
      <p className="muted">The pin on the Map is drawn at this latitude and longitude.</p>
      {msg && <p className="banner error" role="alert">{msg}</p>}
      <div className="ar-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}

// ---------- One region as a card: view, edit, or delete-confirm ----------
function RegionCard({ r, mode, onEdit, onAskDelete, onClose, onSave, onDelete }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function confirmDelete() {
    setBusy(true);
    setMsg('');
    try { await onDelete(r); } catch (err) { setMsg(errorText(err)); setBusy(false); }
  }

  const hasWords = r.word_count > 0;

  return (
    <li className="ar-card">
      {mode === 'edit' ? (
        <RegionForm
          initial={{
            code: r.code, name: r.name, area: r.area, description: r.description || '',
            latitude: String(r.latitude), longitude: String(r.longitude),
          }}
          codeLocked
          submitLabel="Save changes"
          onSave={(values) => onSave(r, values)}
          onCancel={onClose}
        />
      ) : (
        <>
          <h3 className="ar-name">{r.name} <span className="chip">{r.ready ? 'Ready' : 'Coming soon'}</span></h3>
          <p className="muted">{r.area} &middot; code: {r.code}</p>
          {r.description ? <p>{r.description}</p> : null}
          <p className="muted">
            {r.word_count} words, {r.audio_word_count} with a recording &middot; pin at {r.latitude}, {r.longitude}
          </p>

          {mode === 'delete' ? (
            <div role="alert">
              <p><strong>Delete &ldquo;{r.name}&rdquo;?</strong> This cannot be undone.</p>
              {msg && <p className="banner error">{msg}</p>}
              <div className="ar-actions">
                <button type="button" className="btn" onClick={onClose} disabled={busy}>No, keep it</button>
                <button type="button" className="btn primary" onClick={confirmDelete} disabled={busy}>
                  {busy ? 'Deleting...' : 'Yes, delete'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ar-actions">
                <button type="button" className="btn" onClick={() => onEdit(r.code)}>Edit</button>
                <button type="button" className="btn" onClick={() => onAskDelete(r.code)} disabled={hasWords}>Delete</button>
              </div>
              {hasWords && <p className="muted">A region with words cannot be deleted. Delete its words on the Words tab first.</p>}
            </>
          )}
        </>
      )}
    </li>
  );
}

export default function AdminRegions() {
  const [regions, setRegions] = useState(null);    // null = loading
  const [err, setErr] = useState(null);
  const [reload, setReload] = useState(0);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);          // { code, mode: 'edit' | 'delete' } for the one card that is open
  const [note, setNote] = useState('');            // "Region added." and so on

  useEffect(() => {
    let alive = true;                               // ignore an answer that arrives after we left
    api('/api/regions')
      .then((res) => { if (alive) { setRegions(res.data); setErr(null); } })
      .catch((e) => { if (alive) setErr(e); });
    return () => { alive = false; };
  }, [reload]);

  const refresh = (message) => { setNote(message); setOpen(null); setAdding(false); setRegions(null); setReload((n) => n + 1); };

  // Create, update and delete. They throw on failure so the form or the card can show the message.
  const create = async (values) => {
    await api('/api/admin/regions', { method: 'POST', body: JSON.stringify(values) });
    refresh('Region added.');
  };
  const update = async (r, values) => {
    // The code is never sent: it cannot change.
    const { name, area, description, latitude, longitude } = values;
    await api(`/api/admin/regions/${r.code}`, { method: 'PUT', body: JSON.stringify({ name, area, description, latitude, longitude }) });
    refresh('Changes saved.');
  };
  const remove = async (r) => {
    await api(`/api/admin/regions/${r.code}`, { method: 'DELETE' });
    refresh('Region deleted.');
  };

  return (
    <div>
      <h1>Regions</h1>
      <p className="muted">Add, fix or remove the regions shown on the Map.</p>

      {err && (
        <p className="banner error" role="alert">
          {err.status === 0 ? 'Cannot reach the server.' : 'Something went wrong. Try again.'}{' '}
          <button type="button" className="btn" onClick={() => { setErr(null); setReload((n) => n + 1); }}>Try again</button>
        </p>
      )}

      {note && <p className="banner info" role="status">{note}</p>}

      {regions && !adding && (
        <button type="button" className="btn primary ar-add" onClick={() => { setAdding(true); setOpen(null); setNote(''); }}>
          Add a region
        </button>
      )}
      {adding && (
        <div className="ar-card">
          <h2>New region</h2>
          <RegionForm
            initial={{ code: '', name: '', area: '', description: '', latitude: '', longitude: '' }}
            codeLocked={false}
            submitLabel="Add region"
            onSave={create}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {!regions && !err && <p className="muted" role="status">Loading regions...</p>}
      {regions && regions.length === 0 && <p className="muted">There are no regions yet.</p>}
      {regions && regions.length > 0 && (
        <ul className="ar-list">
          {regions.map((r) => (
            <RegionCard
              key={r.code}
              r={r}
              mode={open?.code === r.code ? open.mode : 'view'}
              onEdit={(code) => { setOpen({ code, mode: 'edit' }); setAdding(false); setNote(''); }}
              onAskDelete={(code) => { setOpen({ code, mode: 'delete' }); setAdding(false); setNote(''); }}
              onClose={() => setOpen(null)}
              onSave={update}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
