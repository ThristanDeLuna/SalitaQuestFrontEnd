import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';                         // Leaflet draws the map (DEC-55)
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useSummary } from '../auth/useSummary';
import './RegionMap.css';
import { ISLANDS } from './mapIslands';

// EMERGENCY SWITCH: true = cartoon game map with a "Real map" button. false = the plain OSM street map, no button.
// To go back on the live site, change this one word to false and redeploy.
const USE_ISLANDS = true;

// OpenStreetMap supplies the tiles (DEC-55). The address sits in one place so it is easy to change.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const PHILIPPINES = [12.5, 122.5];
// The map may not be dragged outside the Philippines (a box with some margin).
const PH_BOUNDS = [[3.5, 115.0], [22.0, 128.0]];               // where the map starts, before the regions arrive

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

// The island data is only used if every corner is a pair of real numbers.
const ISLANDS_OK = Array.isArray(ISLANDS) && ISLANDS.length > 0 && ISLANDS.every(
  (poly) => Array.isArray(poly) && poly.length >= 3 && poly.every((pt) => Array.isArray(pt) && pt.length === 2 && pt.every(Number.isFinite)),
);

// Is the point [lat, lng] inside the polygon? (ray casting: count how many edges a ray to the east crosses)
function insidePolygon(lat, lng, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [latI, lngI] = poly[i];
    const [latJ, lngJ] = poly[j];
    if ((latI > lat) !== (latJ > lat) && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI) inside = !inside;
  }
  return inside;
}

function errorText(e) {
  return e.status === 0 ? 'Cannot reach the server.' : 'Something went wrong. Try again.';
}
// One line per game in the sheet: "40/40 Gold", "30/40 Bronze", or "Not played".
// The summary sends null for a game never played, and a medal of null when the pass mark was not reached.
const MEDALS = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
function gameLine(g) {
  if (!g) return 'Not played';
  return g.medal ? `${g.best}/${g.max} ${MEDALS[g.medal]}` : `${g.best}/${g.max}, not passed yet`;
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
// How far a game is from full marks, 0 to 1 (not played counts as 0).
const progress = (r) => (r && r.max ? r.best / r.max : 0);

// Which game to suggest: the one not played yet; if both were played, the one further from full marks.
function nextGame(mine) {
  if (!mine?.matching) return 'matching';
  if (!mine?.listening) return 'listening';
  return progress(mine.listening) < progress(mine.matching) ? 'listening' : 'matching';
}

// One game card in the sheet: title, score, progress bar and a medal chip (or "To do").
// The whole card is a link to that game. Words in the chip mean color is never the only signal.
function GameCard({ title, result, to }) {
  const chip = result?.medal ? MEDALS[result.medal] : (result ? 'Not passed yet' : 'To do');
  const chipClass = result?.medal ? `rm-medal-${result.medal}` : 'rm-todo';
  return (
    <Link className="rm-card" to={to} aria-label={`${title}: ${gameLine(result)}`}>
      <span className="rm-card-title">{title}</span>
      <span className="rm-card-score">{gameLine(result)}</span>
      <span className="rm-bar" aria-hidden="true"><span style={{ width: `${Math.round(progress(result) * 100)}%` }} /></span>
      <span className={`rm-chip ${chipClass}`}>{chip}</span>
    </Link>
  );
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

  const tiles = useRef(null);                      // the real OSM street layer
  const land = useRef(null);                       // the cartoon islands layer
  const [real, setReal] = useState(false);         // false = game map (default)

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

  // The game map is used only when it is switched on, its data is good, and EVERY pin sits on an island.
  // Otherwise the street map is shown, so a pin is never alone on blue sea.
  const gameOk = useMemo(() => {
    if (!USE_ISLANDS || !ISLANDS_OK) return false;
    return (regions || []).every((r) => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      if (r.latitude == null || r.longitude == null || Number.isNaN(lat) || Number.isNaN(lng)) return true;  // no pin, no problem
      return ISLANDS.some((poly) => insidePolygon(lat, lng, poly));
    });
  }, [regions]);

  // ---------- 2. Create the map once, remove it when we leave ----------
  useEffect(() => {
        const m = new L.Map(box.current, {
      center: PHILIPPINES, zoom: 5, minZoom: 5, maxZoom: 12,
      maxBounds: PH_BOUNDS,        // the edges the view cannot leave
      maxBoundsViscosity: 1.0,     // 1.0 = a hard wall; lower values bounce back softly
    });
    tiles.current = new L.TileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 });  // kept, not added yet
    // One polygon per island. interactive:false lets taps pass through to the map.
    land.current = new L.LayerGroup(
            [
        // sand first (drawn underneath), then the grass on top
        ...ISLANDS.map((c) => new L.Polygon(c, { className: 'rm-beach', interactive: false })),
        ...ISLANDS.map((c) => new L.Polygon(c, { className: 'rm-land', interactive: false })),
      ],
    );
    m.attributionControl.setPosition('topright');  // the sheet slides up from the bottom, so keep it clear
    m.on('click', () => setSelected(null));        // tapping empty sea closes the sheet
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // ---------- 2b. Game map or street map ----------
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const game = gameOk && !real;
    m.removeLayer(land.current);                           // removing a layer that is not on the map is harmless
    m.removeLayer(tiles.current);
    (game ? land.current : tiles.current).addTo(m);        // the OSM layer brings its attribution with it (DEC-55)
    m.getContainer().classList.toggle('rm-game', game);    // classList, so Leaflet's own classes are kept
  }, [real, gameOk]);

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
    const mine = open && user ? summary?.regions?.find((s) => s.code === open.code) : null;   // this player's scores here

  return (
    <div onKeyDown={(e) => { if (e.key === 'Escape') setSelected(null); }}>
            <h1 className="rm-hide">Choose a region</h1>
            <p className="muted rm-hide">Tap a pin to see the region.</p>

      {err && (
        <p className="banner error" role="alert">
          {errorText(err)} <button type="button" className="btn" onClick={() => { setErr(null); setReload((n) => n + 1); }}>Try again</button>
        </p>
      )}

      <div className="rm-box">
        {/* Leaflet owns this <div>; React must not put children in it. */}
        <div ref={box} className="rm-map" />
        {gameOk && (
        <button type="button" className="btn rm-switch" onClick={() => setReal((v) => !v)}>
          {real ? 'Game map' : 'Real map'}
        </button>
        )}
        {!regions && !err && <p className="rm-loading" role="status">Loading regions...</p>}

        {open && (
          <section className="rm-sheet" aria-label={`${open.name} details`}>
            <div className="rm-handle" aria-hidden="true" />
            <div className="rm-sheet-head">
              <h2>{open.name}</h2>
              <button type="button" className="btn" onClick={() => setSelected(null)}>Close</button>
            </div>
            <p className="rm-state"><span className="chip">{STATES[openState].label}</span> {open.area}</p>
            <p>{sheetText(openState, Boolean(user))}</p>
            {PLAYABLE.includes(openState) && (
              <>
                {user && (
                  <div className="rm-cards">
                    <GameCard title="Word Pond" result={mine?.matching} to={`/play/matching/${open.code}`} />
                    <GameCard title="Jeepney stop" result={mine?.listening} to={`/play/listening/${open.code}`} />
                  </div>
                )}
                <Link className="btn primary rm-play" to={`/play/${nextGame(mine)}/${open.code}`}>
                  {nextGame(mine) === 'matching' ? 'Play Word Pond' : 'Play Jeepney stop'}
                </Link>
              </>
            )}
            {/* Only a visitor gets this row, so a signed-in user has no empty div */}
            {!user && openState === 'browse' && (
              <div className="rm-actions">
                <Link className="btn primary" to="/signin">Sign in to play</Link>
              </div>
            )}
            <Link className="rm-browse" to={`/regions/${open.code}`}>Browse words</Link>
          </section>
        )}
      </div>

      {/* The same regions as a plain list: works with a keyboard and a screen reader, and when the map tiles do not load. */}
      {regions && (
        <>
          <h2 className="rm-list-title">All regions</h2>
                    <ul className="list rm-list">
            {regions.map((r) => (
              <li key={r.code} className="card rm-region">
                <div className="rm-region-head">
                  <strong className="rm-region-name">{r.name}</strong>
                  <span className="chip">{STATES[states[r.code]].label}</span>
                </div>
                <p className="muted">{r.area}</p>
                <p className="rm-region-count">{r.word_count} words &middot; {r.audio_word_count} with audio</p>
                <Link className="btn" to={`/regions/${r.code}`}>Browse words</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
