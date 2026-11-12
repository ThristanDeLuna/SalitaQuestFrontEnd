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
import { doneShare } from './jeepneyLook';
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

  // Row (a) of the stage, first part: the title and the region. The progress and the status line follow it.
  const header = (
    <header className="js-head">
      <div className="js-title">
        <JeepneyIcon />
        <h1>Jeepney stop</h1>
        <p className="muted js-region">{regionName}</p>
      </div>
    </header>
  );

  if (result) {
    return (
      <>
        {/* The street stays visible, dimmed behind the results pop-up, in the same card: the last jeepney
            stays parked and says goodbye. It is inert while the pop-up is open, so Tab and screen readers
            skip it. */}
        <div inert className="js-stage js-stage-done">
          {header}
          <div className="js-end-scene">
            <RoadScene stopIndex={quiz.index} parked regionName={regionName}>
              <p className="jp-thanks">Thanks for riding!</p>
            </RoadScene>
          </div>
        </div>
        <ResultsCard result={result} rows={listeningRows(result.results, round.questions)} regionName={regionName}
                     onAgain={onAgain} backTo="/" />
      </>
    );
  }

  if (!question) return <div className="js-stage js-stage-done">{header}</div>;   // no questions at all (should not happen)

  const errKind = submitErr ? errorKind(submitErr) : null;
  const chosen = quiz.choices[question.word_id];
  const playing = Boolean(question.audio_url) && audio.playingUrl === question.audio_url;
  const blocked = last ? !canFinish(quiz) : !canNext(quiz);   // no meaning picked for this question yet

  return (
    // The stage: one card that fills the main area, so the whole game fits on one screen (JeepneyStop.css).
    // Its rows, in reading (and Tab) order: (a) title, progress and status line, (b) the question and the
    // How to play toggle, (c) the street and the answers, which take all the room left, (d) Next / Finish
    // and its hint.
    <div className="js-stage">
      {header}
      <p className="js-progress">{progressLabel(quiz)}</p>
      {/* How many questions are done (N-1 at the start of question N). Only progress, never right or wrong
          (DEC-56); hidden from screen readers because the line above already says it. */}
      <div className="js-bar" aria-hidden="true">
        <div className="js-bar-done" style={{ width: `${doneShare(quiz.index, quiz.questions.length) * 100}%` }} />
      </div>
      {/* Always visible, one reserved line, so nothing moves when a message comes or goes. */}
      <p className="js-status" role="status">{audio.failed ? 'Could not play that sound.' : (playing ? 'Playing...' : '')}</p>

      <section className="js-quiz" aria-label={progressLabel(quiz)}>
        <div className="js-lead">
          {submitErr && (
            <p className="banner error" role="alert">
              {errorMessage(errKind)}{errKind === 'invalid' && ` (${submitErr.message})`}
            </p>
          )}
          <h2 className="js-question">What does the driver's word mean?</h2>
          {/* The full directions, closed by default. HowToPlay itself is unchanged; its message prop is left
              out because the status line above shows it instead. True to listenLogic and useAudio: every tap
              on "Hear the driver" plays the word again, the pick can change until Next, and the last button
              is Finish. */}
          <details className="js-help">
            <summary>How to play</summary>
            <HowToPlay title={`How to play: ${quiz.questions.length} questions`}
                       steps={['Press Hear the driver and listen.', 'Tap the meaning of the word you heard.',
                               'Press Next. At the end, press Finish.']}
                       note="You can hear each word again. Your results come after Finish." />
          </details>
        </div>

        <div className="js-play">
          {/* quiz.index (0 = first question) picks which of the two jeepneys is at the stop. */}
          <RoadScene stopIndex={quiz.index} playing={playing} regionName={regionName}>
            {question.audio_url ? (
              <button type="button" className="btn primary jp-hear" onClick={() => audio.play(question.audio_url)}>
                Hear the driver
              </button>
            ) : (
              <p className="muted">The sound for this question is not available.</p>
            )}
          </RoadScene>
          <ul className="jp-options">
            {question.options.map((o) => (
              <Option key={o} text={o} chosen={chosen === o} disabled={sending}
                      onChoose={() => dispatch({ type: 'choose', option: o })} />
            ))}
          </ul>
        </div>
      </section>

      {/* Next / Finish takes half the card and its hint the other half, so the row never changes height and
          the button never moves. The hint line is always there (empty when the button works). */}
      <div className="js-foot">
        {last ? (
          <button type="button" className="btn primary js-next" disabled={blocked || sending} onClick={finish}
                  aria-describedby={blocked ? 'jp-next-hint' : undefined}>
            {sending ? 'Checking...' : 'Finish'}
          </button>
        ) : (
          <button type="button" className="btn primary js-next" disabled={blocked} onClick={next}
                  aria-describedby={blocked ? 'jp-next-hint' : undefined}>Next</button>
        )}
        <p id="jp-next-hint" className="muted htp-hint js-hint">{blocked && `Pick a meaning to ${last ? 'finish' : 'continue'}.`}</p>
      </div>
    </div>
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
