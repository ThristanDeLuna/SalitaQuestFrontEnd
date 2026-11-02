import { useEffect, useState } from 'react';

// A simple stopwatch for the game screens: whole seconds since it started running.
//   const seconds = useCountUp(running);
// It is only for show: there is no deadline and the time is never sent to the server.
// It counts while `running` is true and freezes on the last value when it turns false
// (the results are showing). It is not meant to be paused and resumed: to start again
// from 0, remount the component (give it a new React key), as WordPond does for a new round.
// It works from the clock (Date.now) instead of adding 1 each tick, so a slow tab does not drift.
export default function useCountUp(running) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return undefined;                 // stopped: keep showing the last value
    const startedAt = Date.now();
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  return seconds;
}
