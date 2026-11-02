import { useCallback, useEffect, useRef, useState } from 'react';

// Plays one recording at a time for a game screen.
//   const { playingUrl, failed, play, stop } = useAudio();
// - play(url) is only ever called from a tap handler: we never autoplay (browsers block it anyway).
// - A tap always restarts the sound from the beginning, even if the same one is playing.
// - playingUrl is the url that is playing now (or null). failed is true when the last play was refused;
//   it is cleared on the next play() or on stop(), so the note does not carry over to the next question.
// - The sound stops when the screen goes away.
// Same pattern as src/pages/WordList.jsx: the ref holds the one Audio that is "current".
// Each play makes a fresh Audio (so it starts at 0:00), and any older one is paused first.
// Events from an older Audio are ignored by comparing it with the ref.
export default function useAudio() {
  const current = useRef(null);                     // the Audio that is playing, or null
  const [playingUrl, setPlayingUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  // Pause and forget the current sound (no state change, so it is safe on unmount).
  const release = useCallback(() => {
    current.current?.pause();
    current.current = null;
  }, []);

  const stop = useCallback(() => {
    release();
    setPlayingUrl(null);
    setFailed(false);
  }, [release]);

  const play = useCallback((url) => {
    if (!url) return;                               // a word without a recording: nothing to play
    release();                                      // one sound at a time
    setFailed(false);                               // a new try clears the old "could not play" note

    const audio = new Audio(url);                   // a new Audio always starts from the start
    current.current = audio;
    setPlayingUrl(url);

    // Only the CURRENT Audio may change state. An older one (paused by a later tap)
    // can still fire 'ended' or reject its play(): those are ignored here.
    audio.addEventListener('ended', () => {
      if (current.current === audio) { current.current = null; setPlayingUrl(null); }
    });
    audio.play().catch(() => {
      if (current.current === audio) { current.current = null; setPlayingUrl(null); setFailed(true); }
    });
  }, [release]);

  // Leaving the screen stops the sound.
  useEffect(() => release, [release]);

  return { playingUrl, failed, play, stop };
}
