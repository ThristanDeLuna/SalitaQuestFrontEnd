import './HowToPlay.css';

// HowToPlay: a small "How to play" card at the top of a game, so a first-time player sees at once what to
// do, in what order, and when it is over. Presentational only: no buttons, nothing focusable.
// Props:
//   title   the heading (default "How to play")
//   steps   short sentences, one per numbered step (beginner English, one action each)
//   note    optional line under the steps
//   status  optional live line beside the heading (for example "2 of 4 fish placed"); it is announced
//           politely when it changes. It counts what the player did, never whether it was right (DEC-56).
//   message optional short game message ("Playing...", "Could not play that sound.") in a reserved line
//           (role="status"). The line is always there, empty when there is nothing to say, so a message
//           appearing or going away never moves the game below the card.
// HowToPlay.css also holds .htp-hint, the reserved hint line the games put under a disabled Finish / Next.

export default function HowToPlay({ title = 'How to play', steps, note, status, message }) {
  return (
    <section className="htp" aria-labelledby="htp-title">
      <div className="htp-head">
        <h2 id="htp-title" className="htp-title">{title}</h2>
        {status && <p className="htp-status" aria-live="polite">{status}</p>}
      </div>
      <ol className="htp-steps">
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {note && <p className="htp-note">{note}</p>}
      {message !== undefined && <p className="htp-message" role="status">{message}</p>}
    </section>
  );
}
