import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import SystemScreen from '../components/SystemScreen';
import NotFound from './NotFound';
import './WordList.css';

// Set to true after a native speaker has checked the example sentences (then the small note disappears).
const SENTENCES_CHECKED = false;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Friendly text for the errors the API can answer. A 404 is shown as its own screen instead.
function errorText(e) {
  if (e.status === 0) return 'Cannot reach the server.';
  return 'Something went wrong. Try again.';
}

// ---------- One word: tap the row to see its example sentence, tap Play to hear it ----------
function WordRow({ word, open, playing, onToggle, onPlay }) {
  return (
    <li className="wl-row">
      <div className="wl-row-main">
        <button type="button" className="wl-word" aria-expanded={open} onClick={onToggle}>
          <strong>{word.word}</strong>
          <span className="wl-translation">{word.translation}</span>
        </button>
        {word.audio_url
          ? (
            <button type="button" className="btn wl-play" onClick={onPlay}
                    aria-label={`${playing ? 'Stop' : 'Play'} ${word.word}`}>
              {playing ? 'Stop' : 'Play'}
            </button>
          )
          : <span className="chip wl-none">No audio yet</span>}
      </div>
      {open && (
        <div className="wl-example">
          <span className="wl-label">Example</span>
          <p>{word.example_sentence || 'No example sentence yet.'}</p>
          {word.example_sentence && !SENTENCES_CHECKED && (
            <p className="muted">Sample sentence, not yet checked by a speaker.</p>
          )}
        </div>
      )}
    </li>
  );
}

// ---------- The page for one region (the parent remounts it when the region in the address changes) ----------
function RegionWords({ code }) {
  const { user } = useAuth();                  // null means a visitor
  const [region, setRegion] = useState(null);  // one region from GET /api/regions/{code}
  const [words, setWords] = useState(null);    // null = still loading
  const [err, setErr] = useState(null);        // the error we got, if any
  const [reload, setReload] = useState(0);     // change it to load again
  const [openId, setOpenId] = useState(null);  // the word whose example sentence is showing
  const [playingId, setPlayingId] = useState(null);
  const [playErr, setPlayErr] = useState('');
  const player = useRef(null);                 // the one <audio> that is playing, if any

  useEffect(() => {
    let alive = true;                          // ignore answers that arrive after we left
    const path = `/api/regions/${encodeURIComponent(code)}`;
    Promise.all([api(path), api(`${path}/words`)])   // both public: no sign-in needed (DEC-46)
      .then(([r, w]) => { if (alive) { setRegion(r); setWords(w.data); } })
      .catch((e) => alive && setErr(e));
    return () => { alive = false; };
  }, [code, reload]);

  // Stop the sound when the visitor leaves this page.
  useEffect(() => () => player.current?.pause(), []);

  function stop() {
    player.current?.pause();
    player.current = null;
    setPlayingId(null);
  }

  // One recording at a time, and only after a tap (browsers block autoplay anyway).
  function togglePlay(w) {
    const wasPlaying = playingId === w.id;
    stop();
    setPlayErr('');
    if (wasPlaying) return;

    const audio = new Audio(w.audio_url);      // played exactly as the API gave it
    player.current = audio;
    setPlayingId(w.id);
    const finished = () => { if (player.current === audio) stop(); };
    audio.addEventListener('ended', finished);
    audio.play().catch(() => {
      finished();
      setPlayErr(`Could not play “${w.word}”.`);
    });
  }

  function retry() { setErr(null); setReload((n) => n + 1); }

  if (err?.status === 404) return <NotFound />;
  if (err) {
    return (
      <p className="banner error" role="alert">
        {errorText(err)} <button type="button" className="btn" onClick={retry}>Try again</button>
      </p>
    );
  }
  if (!region || !words) return <p className="muted">Loading...</p>;

  // A region with no words at all has nothing to browse yet.
  if (words.length === 0) {
    return (
      <SystemScreen title="Coming soon" actions={<Link className="btn" to="/">Back to the Map</Link>}>
        {region.name} has no words yet.
      </SystemScreen>
    );
  }

  return (
    <>
      <h1>{region.name} words</h1>
      <p className="muted">
        {region.area} · {plural(region.word_count, 'word', 'words')} · {region.audio_word_count} with audio
      </p>

      {!region.ready && (
        <p className="banner info" role="status">
          The games for this region are not open yet. They open when it has enough words and recordings.
        </p>
      )}
      {playErr && <p className="banner error" role="alert">{playErr}</p>}

      <ul className="wl-list">
        {words.map((w) => (
          <WordRow key={w.id} word={w} open={openId === w.id} playing={playingId === w.id}
                   onToggle={() => setOpenId(openId === w.id ? null : w.id)}
                   onPlay={() => togglePlay(w)} />
        ))}
      </ul>

      {/* The server still decides who may play and which regions are open; these are only links. */}
      {region.ready && (
        <div className="actions wl-games">
          {user ? (
            <>
              <Link className="btn primary" to={`/play/matching/${code}`}>Play Word Pond</Link>
              <Link className="btn primary" to={`/play/listening/${code}`}>Play Jeepney stop</Link>
            </>
          ) : (
            <Link className="btn primary" to="/signin">Sign in to play</Link>
          )}
        </div>
      )}
    </>
  );
}

// The key makes React start fresh (empty list, loading) whenever the region in the address changes.
export default function WordList() {
  const { code } = useParams();     // "cebuano" from /regions/cebuano
  return <RegionWords key={code} code={code} />;
}
