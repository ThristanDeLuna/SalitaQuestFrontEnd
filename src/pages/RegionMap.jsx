import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';                         // Leaflet draws the map (DEC-55)
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useSummary } from '../auth/useSummary';
import './RegionMap.css';

// OpenStreetMap supplies the tiles (DEC-55). The address sits in one place so it is easy to change.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const PHILIPPINES = [12.5, 122.5];               // where the map starts, before the regions arrive

// What each pin state means. The glyph and the label are words/shapes, so color is never the only signal.
// "browse" is only for visitors; signed-in users get the other five from GET /api/me/summary (DEC-119).
const STATES = {
  browse:      { label: 'Browse',      glyph: '●' },
  not_started: { label: 'Not started', glyph: '●' },
  in_progress: { label: 'In progress', glyph: '▶' },
  stamped:     { label: 'Stamped',     glyph: '✓' },
  locked:      { label: 'Locked',      glyph: '🔒' },
  coming_soon: { label: 'Coming soon', glyph: '…' },
};
const PLAYABLE = ['not_started', 'in_progress', 'stamped'];

function errorText(e) {
  return e.status === 0 ? 'Cannot reach the server.' : 'Something went wrong. Try again.';
}

// The words under the region name in the bottom sheet.
function sheetText(state, signedIn) {
  if (state === 'coming_soon') return 'Not open for games yet. You can still browse the words.';
  if (state === 'locked') return 'Earn a stamp in the region you started to unlock this island. Pass both of its games.';
  if (state === 'stamped') return 'You have the stamp. Play again to improve your stars.';
  if (PLAYABLE.includes(state)) return 'Pass both games to earn the stamp.';
  return signedIn ? 'Browse the words.' : 'Browse the words. Sign in to play.';
}

// A custom pin is plain HTML drawn by Leaflet (L.DivIcon). It is built with elements, not a string,
// so a region name can never inject markup.
function makeIcon(region, state) {
  const root = document.createElement('div');
  root.className = `rm-pin rm-${state}`;
  const dot = document.createElement('span');
  dot.className = 'rm-dot';
  dot.setAttribute('aria-hidden', 'true');
  dot.textContent = STATES[state].glyph;
  const name = document.createElement('span');
  name.className = 'rm-name';
  name.textContent = region.name;
  root.append(dot, name);
  // iconAnchor puts the middle of the dot (18 px from the top) on the coordinates.
  return new L.DivIcon({ html: root, className: 'rm-icon', iconSize: [110, 60], iconAnchor: [55, 18] });
}

export default function RegionMap() {
  const { user } = useAuth();                      // null means a visitor
  const { summary } = useSummary();                // null until /api/me/summary answers (or for a visitor)
  const [regions, setRegions] = useState(null);    // null = still loading
  const [err, setErr] = useState(null);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState(null);  // code of the region whose sheet is open

  const box = useRef(null);                        // the <div> Leaflet draws into
  const map = useRef(null);                        // the Leaflet map
  const markers = useRef({});                      // code -> Leaflet marker

  // ---------- 1. Load the regions ----------
  useEffect(() => {
    let alive = true;                              // ignore an answer that arrives after we left
    api('/api/regions')
      .then((res) => { if (alive) { setRegions(res.data); setErr(null); } })
      .catch((e) => { if (alive) setErr(e); });
    return () => { alive = false; };
  }, [reload]);

  // The state of every region: server answer for signed-in users, "ready" for visitors.
  const states = useMemo(() => {
    const out = {};
    (regions || []).forEach((r) => {
      const mine = user && summary?.regions?.find((s) => s.code === r.code)?.status;
      out[r.code] = STATES[mine] ? mine : (r.ready ? 'browse' : 'coming_soon');
    });
    return out;
  }, [regions, user, summary]);

  // ---------- 2. Create the map once, remove it when we leave ----------
  useEffect(() => {
    const m = new L.Map(box.current, { center: PHILIPPINES, zoom: 5, minZoom: 4, maxZoom: 12 });
    new L.TileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(m);
    m.attributionControl.setPosition('topright');  // the sheet slides up from the bottom, so keep it clear
    m.on('click', () => setSelected(null));        // tapping empty sea closes the sheet
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // ---------- 3. Draw one pin per region; redraw when a state changes ----------
  useEffect(() => {
    const m = map.current;
    if (!m || !regions) return undefined;
    regions.forEach((r) => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      if (r.latitude == null || r.longitude == null || Number.isNaN(lat) || Number.isNaN(lng)) return;  // no coordinates, no pin
      const state = states[r.code];
      const marker = new L.Marker([lat, lng], {
        icon: makeIcon(r, state),
        title: `${r.name}: ${STATES[state].label}`,
        alt: `${r.name}, ${STATES[state].label}`,
        keyboard: true,                            // Tab to a pin, Enter opens its sheet
      }).addTo(m);
      marker.on('click', () => setSelected(r.code));
      markers.current[r.code] = marker;
    });
    return () => {
      Object.values(markers.current).forEach((mk) => mk.remove());
      markers.current = {};
    };
  }, [regions, states]);

  // ---------- 4. Zoom to show all the pins, once per load ----------
  useEffect(() => {
    const m = map.current;
    const points = (regions || []).filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => [Number(r.latitude), Number(r.longitude)]);
    if (m && points.length) m.fitBounds(points, { padding: [60, 60], maxZoom: 7 });
  }, [regions]);

  // ---------- 5. Mark the open pin, and keep it clear of the sheet ----------
  useEffect(() => {
    Object.entries(markers.current).forEach(([code, mk]) => {
      mk.getElement()?.classList.toggle('rm-selected', code === selected);
    });
    const r = (regions || []).find((x) => x.code === selected);
    if (map.current && r && map.current.panInside) {
      map.current.panInside([Number(r.latitude), Number(r.longitude)], { paddingTopLeft: [30, 70], paddingBottomRight: [30, 250] });
    }
  }, [selected, regions, states]);

  const open = (regions || []).find((r) => r.code === selected);
  const openState = open ? states[open.code] : null;

  return (
    <div onKeyDown={(e) => { if (e.key === 'Escape') setSelected(null); }}>
      <h1>Choose a region</h1>
      <p className="muted">Tap a pin to see the region.</p>

      {err && (
        <p className="banner error" role="alert">
          {errorText(err)} <button type="button" className="btn" onClick={() => { setErr(null); setReload((n) => n + 1); }}>Try again</button>
        </p>
      )}

      <div className="rm-box">
        {/* Leaflet owns this <div>; React must not put children in it. */}
        <div ref={box} className="rm-map" />
        {!regions && !err && <p className="rm-loading" role="status">Loading regions...</p>}

        {open && (
          <section className="rm-sheet" aria-label={`${open.name} details`}>
            <div className="rm-sheet-head">
              <h2>{open.name}</h2>
              <button type="button" className="btn" onClick={() => setSelected(null)}>Close</button>
            </div>
            <p className="rm-state"><span className="chip">{STATES[openState].label}</span> {open.area}</p>
            <p>{sheetText(openState, Boolean(user))}</p>
            <div className="rm-actions">
              <Link className="btn" to={`/regions/${open.code}`}>Browse words</Link>
              {PLAYABLE.includes(openState) && (
                <>
                  <Link className="btn primary" to={`/play/matching/${open.code}`}>Play Word Pond</Link>
                  <Link className="btn primary" to={`/play/listening/${open.code}`}>Play Jeepney stop</Link>
                </>
              )}
              {!user && openState === 'browse' && <Link className="btn primary" to="/signin">Sign in to play</Link>}
            </div>
          </section>
        )}
      </div>

      {/* The same regions as a plain list: works with a keyboard and a screen reader, and when the map tiles do not load. */}
      {regions && (
        <>
          <h2 className="rm-list-title">All regions</h2>
          <ul className="list rm-list">
            {regions.map((r) => (
              <li key={r.code} className="card">
                <strong>{r.name}</strong> <span className="chip">{STATES[states[r.code]].label}</span>
                <p className="muted">{r.area}</p>
                <Link className="btn" to={`/regions/${r.code}`}>Browse words</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
