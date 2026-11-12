import { useReducer, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useSummary } from '../auth/useSummary';
import { errorKind, errorMessage } from './errors';
import useAudio from './useAudio';
import useCountUp from './useCountUp';
import useRegionName from './useRegionName';
import useRound from './useRound';
import PondScene from './PondScene';
import FishButton from './Fish';
import CatchSparkle from './CatchSparkle';
import HowToPlay from './HowToPlay';
import ResultsCard from './ResultsCard';
import RoundGate from './RoundGate';
import {
  buildPairs, canFinish, caughtWordIds, fishForMeaning, formatTime, initialPond, matchingRows, pondReducer,
} from './pondLogic';
import { pondIntro } from './pondIntro';
import './WordPond.css';

// Word Pond, the matching game (route /play/matching/:region).
// The player gets 4 meanings and a few fish (words; some are decoys). They catch one fish
// for each meaning, press Finish, and the server scores the pairs. The screen never knows
// the right answers, so it shows NO right/wrong feedback until the results arrive (DEC-56).
// Pieces: useRound loads the round, pondLogic holds the catching rules, useAudio plays the
// word, useCountUp is the timer, ResultsCard shows the answer. This file only wires them up.

// A small fish beside the title. Decoration only.
function FishIcon() {
  return (
    <svg className="wp-icon" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
      <path className="wp-icon-fill" d="M22 16l8-6v12z" />
      <ellipse className="wp-icon-fill" cx="13" cy="16" rx="11" ry="7" />
      <circle cx="8" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

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
        {/* The key restarts the pop when a different fish lands here. */}
        <span key={word ?? 'empty'} className={word ? 'chip wp-slot wp-caught' : 'chip wp-slot wp-empty'}>
          {word ? `caught · ${word}` : 'tap a fish'}
        </span>
      </button>
    </li>
  );
}

// ---------- One fish: tap it to catch it (and hear it, if it has a recording) ----------
// The drawing and the button are in Fish.jsx; this keeps the list item and the catch twinkle.
function Fish({ fish, index, onMeaning, playing, disabled, onTap }) {
  return (
    <li className="wp-fish-spot">
      {/* The key replays the twinkle each time this fish lands on a (different) meaning. */}
      {onMeaning && <CatchSparkle key={onMeaning} />}
      <FishButton word={fish.word} index={index} onMeaning={onMeaning} playing={playing} disabled={disabled} onTap={onTap} />
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
        <div className="wp-title">
          <FishIcon />
          <h1>Word Pond</h1>
        </div>
        <p className="muted">{regionName}</p>
      </div>
      <span className="chip" role="timer" aria-label="Time played">{formatTime(seconds)}</span>
    </header>
  );

  if (result) {
    return (
      <>
        {/* The game stays visible, dimmed behind the results pop-up, every lantern lit (all meanings were
            filled to finish). It is inert while the pop-up is open, so Tab and screen readers skip it. */}
        <div inert>
          {header}
          <PondScene caught={pond.meanings.length} total={pond.meanings.length} settled />
        </div>
        <ResultsCard result={result} rows={matchingRows(result.results, round.words)} regionName={regionName}
                     onAgain={onAgain} backTo="/"
                     next={{ to: `/play/listening/${region}`, label: 'Next: Jeepney stop' }} />
      </>
    );
  }

  const errKind = submitErr ? errorKind(submitErr) : null;
  const total = pond.meanings.length;
  const placed = caughtWordIds(pond).length;      // fish placed, not fish right (DEC-56)
  const finishBlocked = !canFinish(pond);
  return (
    <>
      {header}

      {submitErr && (
        <p className="banner error" role="alert">
          {errorMessage(errKind)}{errKind === 'invalid' && ` (${submitErr.message})`}
        </p>
      )}

      {/* One column at every width, in reading (and Tab) order: the intro line, the How to play toggle,
          the live status line, the meanings, then the pond with Finish stuck to its bottom edge. */}
      <p className="wp-intro">{pondIntro(total, round.words.length)}</p>
      {/* The full directions, closed by default. HowToPlay itself is unchanged; its status and message
          props are left out here because they live in the always-visible line below instead. */}
      <details className="wp-help">
        <summary>How to play</summary>
        {/* The steps match pondLogic: the next empty meaning is chosen for you after each catch, and
            catching a placed fish again moves it. */}
        <HowToPlay steps={['Tap a meaning.', 'Tap the fish with the matching word.',
                           `Fill all ${total} meanings, then press Finish.`]}
                   note="You see your results at the end." />
      </details>
      {/* Always visible, one reserved line, so nothing moves when a message comes or goes. The counter
          counts fish placed, never fish right (DEC-56). */}
      <div className="wp-status">
        <p className="wp-message" role="status">
          {audio.failed ? 'Could not play that sound.' : (audio.playingUrl ? 'Playing...' : '')}
        </p>
        <p className="wp-count" aria-live="polite">{`${placed} of ${total} fish placed`}</p>
      </div>

      <h2 className="wp-label">Meanings</h2>
      <ul className="wp-meanings">
        {pond.meanings.map((m) => (
          <MeaningRow key={m} meaning={m} selected={pond.selected === m}
                      word={wordOf(fishForMeaning(pond, m))}
                      onSelect={() => dispatch({ type: 'select', meaning: m })} />
        ))}
      </ul>

      {/* The heading stays for screen readers; on screen the scene itself says "pond". */}
      <h2 className="wp-sr">Fish in the pond</h2>
      {/* One lantern per meaning, lit as fish are caught: it counts catches, never right or wrong.
          The footer (Finish and its hint line) sticks to the bottom of the screen while the pond scrolls. */}
      <PondScene caught={placed} total={total} footer={(
        <>
          <button type="button" className="btn primary wp-finish" disabled={finishBlocked || sending} onClick={finish}
                  aria-describedby={finishBlocked ? 'wp-finish-hint' : undefined}>
            {sending ? 'Checking...' : 'Finish'}
          </button>
          {/* One fixed line under Finish: what is missing while it is blocked, what happens next once it works. */}
          <p id="wp-finish-hint" className="muted htp-hint wp-hint">
            {finishBlocked ? `Fill all ${total} meanings to finish.` : 'Answers are revealed after scoring.'}
          </p>
        </>
      )}>
        <ul className="wp-pond">
          {round.words.map((f, i) => (
            <Fish key={f.word_id} fish={f} index={i} onMeaning={meaningOf(f.word_id)} disabled={sending}
                  playing={f.audio_url !== null && audio.playingUrl === f.audio_url}
                  onTap={() => tapFish(f)} />
          ))}
        </ul>
      </PondScene>
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
