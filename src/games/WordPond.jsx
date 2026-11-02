import { useReducer, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useSummary } from '../auth/useSummary';
import { errorKind, errorMessage } from './errors';
import useAudio from './useAudio';
import useCountUp from './useCountUp';
import useRegionName from './useRegionName';
import useRound from './useRound';
import ResultsCard from './ResultsCard';
import RoundGate from './RoundGate';
import {
  buildPairs, canFinish, fishForMeaning, formatTime, initialPond, matchingRows, pondReducer,
} from './pondLogic';
import './WordPond.css';

// Word Pond, the matching game (route /play/matching/:region).
// The player gets 4 meanings and a few fish (words; some are decoys). They catch one fish
// for each meaning, press Finish, and the server scores the pairs. The screen never knows
// the right answers, so it shows NO right/wrong feedback until the results arrive (DEC-56).
// Pieces: useRound loads the round, pondLogic holds the catching rules, useAudio plays the
// word, useCountUp is the timer, ResultsCard shows the answer. This file only wires them up.

// ---------- One meaning: tap it to choose where the next fish goes ----------
function MeaningRow({ meaning, word, selected, onSelect }) {
  return (
    <li>
      <button type="button" className={`wp-meaning${selected ? ' wp-selected' : ''}`}
              aria-pressed={selected} onClick={onSelect}>
        <span className="wp-meaning-text">
          {selected && <span className="wp-now">Selected: </span>}
          {meaning}
        </span>
        <span className={word ? 'wp-caught' : 'muted'}>{word ?? 'tap a fish'}</span>
      </button>
    </li>
  );
}

// ---------- One fish: tap it to catch it (and hear it, if it has a recording) ----------
function Fish({ fish, onMeaning, playing, disabled, onTap }) {
  return (
    <li>
      <button type="button" className={`wp-fish${onMeaning ? ' wp-fish-caught' : ''}`}
              disabled={disabled} onClick={onTap}>
        <strong>{fish.word}</strong>
        {onMeaning && <span className="muted">on: {onMeaning}</span>}
        {playing && <span className="muted">playing</span>}
      </button>
    </li>
  );
}

// ---------- One round being played. A new round gets a new key, so all of this starts fresh ----------
function PondGame({ round, region, regionName, onAgain, audio }) {
  const [pond, dispatch] = useReducer(pondReducer, round.meanings, initialPond);
  const [result, setResult] = useState(null);       // the submit answer, once it arrives
  const [sending, setSending] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const sendingNow = useRef(false);                  // blocks a second Finish before React re-renders
  const seconds = useCountUp(result === null);       // cosmetic: never sent to the server
  const { reload } = useSummary();

  // word_id -> word text, for the meaning rows.
  const wordOf = (id) => round.words.find((w) => w.word_id === id)?.word ?? null;
  // word_id -> the meaning it is caught on, for the fish.
  const meaningOf = (id) => pond.meanings.find((m) => pond.caught[m] === id) ?? null;

  function tapFish(fish) {
    dispatch({ type: 'catch', wordId: fish.word_id });
    audio.play(fish.audio_url);                      // a null audio_url just catches silently
  }

  async function finish() {
    if (sendingNow.current || !canFinish(pond)) return;
    sendingNow.current = true;
    setSending(true);
    setSubmitErr(null);
    try {
      const data = await api(`/api/games/matching/${encodeURIComponent(region)}/submit`, {
        method: 'POST',
        body: JSON.stringify({ pairs: buildPairs(pond) }),   // client.js sends body as given
      });
      audio.stop();
      setResult(data);
      reload();                                      // the top bar and Profile show the new stars/streak
    } catch (e) {
      setSubmitErr(e);                               // the catches stay, so the player can retry
    } finally {
      sendingNow.current = false;
      setSending(false);
    }
  }

  const header = (
    <header className="wp-head">
      <div>
        <h1>Word Pond</h1>
        <p className="muted">{regionName}</p>
      </div>
      <span className="chip" role="timer" aria-label="Time played">{formatTime(seconds)}</span>
    </header>
  );

  if (result) {
    return (
      <>
        {header}
        <ResultsCard result={result} rows={matchingRows(result.results, round.words)}
                     onAgain={onAgain} backTo="/" />
      </>
    );
  }

  const errKind = submitErr ? errorKind(submitErr) : null;
  return (
    <>
      {header}
      <p className="muted">Choose a meaning, then catch the fish (word) that matches it.</p>

      {submitErr && (
        <p className="banner error" role="alert">
          {errorMessage(errKind)}{errKind === 'invalid' && ` (${submitErr.message})`}
        </p>
      )}
      {audio.failed && <p className="muted" role="status">Could not play that sound.</p>}

      <h2 className="wp-label">Meanings</h2>
      <ul className="wp-meanings">
        {pond.meanings.map((m) => (
          <MeaningRow key={m} meaning={m} selected={pond.selected === m}
                      word={wordOf(fishForMeaning(pond, m))}
                      onSelect={() => dispatch({ type: 'select', meaning: m })} />
        ))}
      </ul>

      <h2 className="wp-label">Fish in the pond</h2>
      <ul className="wp-pond">
        {round.words.map((f) => (
          <Fish key={f.word_id} fish={f} onMeaning={meaningOf(f.word_id)} disabled={sending}
                playing={f.audio_url !== null && audio.playingUrl === f.audio_url}
                onTap={() => tapFish(f)} />
        ))}
      </ul>

      <div className="actions">
        <button type="button" className="btn primary" disabled={!canFinish(pond) || sending} onClick={finish}>
          {sending ? 'Checking...' : 'Finish'}
        </button>
      </div>
    </>
  );
}

// ---------- One region: the loading/error screens, then the game ----------
function PondScreen({ region }) {
  const { round, status, kind, attempt, again } = useRound(`/api/games/matching/${encodeURIComponent(region)}`);
  const regionName = useRegionName(region);
  const audio = useAudio();                          // lives here, so it stops when the screen goes away

  // Loading and error screens are shared with Jeepney stop (RoundGate.jsx).
  if (status !== 'ready') {
    return <RoundGate status={status} kind={kind} again={again} loadingText="Filling the pond..." />;
  }

  // The key makes React throw away the old pond, timer and results when a new round arrives.
  return <PondGame key={attempt} round={round} region={region} regionName={regionName}
                   onAgain={again} audio={audio} />;
}

// The key starts everything fresh when the region in the address changes.
export default function WordPond() {
  const { region } = useParams();
  return <PondScreen key={region} region={region} />;
}
