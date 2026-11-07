import { useReducer, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useSummary } from '../auth/useSummary';
import { errorKind, errorMessage } from './errors';
import useAudio from './useAudio';
import useRegionName from './useRegionName';
import useRound from './useRound';
import HowToPlay from './HowToPlay';
import ResultsCard from './ResultsCard';
import RoadScene from './RoadScene';
import RoundGate from './RoundGate';
import {
  buildAnswers, canFinish, canNext, currentQuestion, initialQuiz, isLastQuestion, listeningRows,
  progressLabel, quizReducer,
} from './listenLogic';
import './JeepneyStop.css';

// Jeepney stop, the listening game (route /play/listening/:region).
// One question at a time: the player taps "Hear the driver" to hear a word, picks its
// meaning from 4 options, and goes on with Next (no Back button). The last button is
// Finish, which sends all 5 answers. The server scores them; the screen never knows the
// right answers, so there is NO right/wrong feedback until the results (DEC-56).
// No timer in this game. Shared pieces: useRound, useAudio, RoundGate, ResultsCard, errors.js;
// the quiz rules live in listenLogic.js. This file only wires them up.

// A small jeepney beside the title, seen from the side. Decoration only.
function JeepneyIcon() {
  return (
    <svg className="jp-icon" viewBox="0 0 40 32" width="40" height="32" aria-hidden="true" focusable="false">
      <path className="jp-icon-body" d="M4 8h24v6h6l3 4v6H4z" />
      <path className="jp-icon-line" d="M2 7h28" />
      <rect className="jp-icon-window" x="7" y="11" width="5" height="5" />
      <rect className="jp-icon-window" x="14" y="11" width="5" height="5" />
      <rect className="jp-icon-window" x="21" y="11" width="5" height="5" />
      <circle cx="11" cy="25" r="3.5" fill="currentColor" />
      <circle cx="30" cy="25" r="3.5" fill="currentColor" />
    </svg>
  );
}

// ---------- One option: tap it to choose it (you can change your mind before Next) ----------
function Option({ text, chosen, disabled, onChoose }) {
  return (
    <li>
      <button type="button" className={`jp-option${chosen ? ' jp-chosen' : ''}`}
              aria-pressed={chosen} disabled={disabled} onClick={onChoose}>
        {chosen && <span className="jp-now">Selected: </span>}
        {text}
      </button>
    </li>
  );
}

// ---------- One quiz being played. A new round gets a new key, so all of this starts fresh ----------
function QuizGame({ round, region, regionName, onAgain, audio }) {
  const [quiz, dispatch] = useReducer(quizReducer, round.questions, initialQuiz);
  const [result, setResult] = useState(null);       // the submit answer, once it arrives
  const [sending, setSending] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const sendingNow = useRef(false);                  // blocks a second Finish before React re-renders
  const { reload } = useSummary();

  const question = currentQuestion(quiz);
  const last = isLastQuestion(quiz);

  function next() {
    audio.stop();                                    // the old word must not keep playing
    dispatch({ type: 'next' });
  }

  async function finish() {
    if (sendingNow.current || !canFinish(quiz)) return;
    audio.stop();
    sendingNow.current = true;
    setSending(true);
    setSubmitErr(null);
    try {
      const data = await api(`/api/games/listening/${encodeURIComponent(region)}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: buildAnswers(quiz) }),   // client.js sends body as given
      });
      audio.stop();
      setResult(data);
      reload();                                      // the top bar and Profile show the new stars/streak
    } catch (e) {
      setSubmitErr(e);                               // the answers stay, so the player can retry
    } finally {
      sendingNow.current = false;
      setSending(false);
    }
  }

  const header = (
    <header className="jp-head">
      <div className="jp-title">
        <JeepneyIcon />
        <h1>Jeepney stop</h1>
      </div>
      <p className="muted">{regionName}</p>
    </header>
  );

  if (result) {
    return (
      <>
        {/* The street stays visible, dimmed behind the results pop-up: the last jeepney stays parked and
            says goodbye. It is inert while the pop-up is open, so Tab and screen readers skip it. */}
        <div inert>
          {header}
          <div className="jp-end-scene">
            <RoadScene stopIndex={quiz.index} parked>
              <p className="jp-thanks">Thanks for riding!</p>
            </RoadScene>
          </div>
        </div>
        <ResultsCard result={result} rows={listeningRows(result.results, round.questions)}
                     onAgain={onAgain} backTo="/" />
      </>
    );
  }

  if (!question) return header;                      // no questions at all: nothing to ask (should not happen)

  const errKind = submitErr ? errorKind(submitErr) : null;
  const chosen = quiz.choices[question.word_id];
  const playing = Boolean(question.audio_url) && audio.playingUrl === question.audio_url;
  const blocked = last ? !canFinish(quiz) : !canNext(quiz);   // no meaning picked for this question yet

  return (
    <>
      {header}
      <p className="jp-progress">{progressLabel(quiz)}</p>

      {submitErr && (
        <p className="banner error" role="alert">
          {errorMessage(errKind)}{errKind === 'invalid' && ` (${submitErr.message})`}
        </p>
      )}

      <section className="card jp-question" aria-label={progressLabel(quiz)}>
        {/* Directions first, then the controls. True to listenLogic and useAudio: every tap on "Hear the
            driver" plays the word again, the pick can change until Next, and the last button is Finish. */}
        <HowToPlay title={`How to play: ${quiz.questions.length} questions`}
                   steps={['Press Hear the driver and listen.', 'Tap the meaning of the word you heard.',
                           'Press Next. At the end, press Finish.']}
                   note="You can hear each word again. Your results come after Finish." />
        {/* quiz.index (0 = first question) picks which of the two jeepneys is at the stop. */}
        <RoadScene stopIndex={quiz.index} playing={playing}>
          {question.audio_url ? (
            <button type="button" className="btn primary jp-hear" onClick={() => audio.play(question.audio_url)}>
              Hear the driver
            </button>
          ) : (
            <p className="muted">The sound for this question is not available.</p>
          )}
        </RoadScene>
        {playing && <p className="muted" role="status">Playing...</p>}
        {audio.failed && <p className="muted" role="status">Could not play that sound.</p>}

        <h2>What does the driver's word mean?</h2>
        <ul className="jp-options">
          {question.options.map((o) => (
            <Option key={o} text={o} chosen={chosen === o} disabled={sending}
                    onChoose={() => dispatch({ type: 'choose', option: o })} />
          ))}
        </ul>
      </section>

      <div className="actions">
        {last ? (
          <button type="button" className="btn primary" disabled={blocked || sending} onClick={finish}
                  aria-describedby={blocked ? 'jp-next-hint' : undefined}>
            {sending ? 'Checking...' : 'Finish'}
          </button>
        ) : (
          <button type="button" className="btn primary" disabled={blocked} onClick={next}
                  aria-describedby={blocked ? 'jp-next-hint' : undefined}>Next</button>
        )}
      </div>
      {/* The line is always there (empty when the button works), so the button never moves. */}
      <p id="jp-next-hint" className="muted jp-hint">{blocked && `Pick a meaning to ${last ? 'finish' : 'continue'}.`}</p>
    </>
  );
}

// ---------- One region: the loading/error screens, then the quiz ----------
function JeepneyScreen({ region }) {
  const { round, status, kind, attempt, again } = useRound(`/api/games/listening/${encodeURIComponent(region)}`);
  const regionName = useRegionName(region);
  const audio = useAudio();                          // lives here, so it stops when the screen goes away

  if (status !== 'ready') {
    return <RoundGate status={status} kind={kind} again={again} loadingText="Waiting for the jeepney..." />;
  }

  // The key makes React throw away the old answers and results when a new round arrives.
  return <QuizGame key={attempt} round={round} region={region} regionName={regionName}
                   onAgain={again} audio={audio} />;
}

// The key starts everything fresh when the region in the address changes.
export default function JeepneyStop() {
  const { region } = useParams();
  return <JeepneyScreen key={region} region={region} />;
}
