import { Link } from 'react-router-dom';
import SystemScreen from '../components/SystemScreen';
import NotFound from '../pages/NotFound';
import { errorMessage } from './errors';

// The screen a game shows while its round is loading or could not be loaded.
// Both games use it with the values useRound() returns:
//   const gate = <RoundGate status={status} kind={kind} again={again} loadingText="Filling the pond..." />;
//   if (status !== 'ready') return gate;
// It returns null when the round is ready, so the game can show itself.
//   loading                -> a short muted text (each game passes its own)
//   not_found              -> the normal "page not found" screen
//   coming_soon / locked   -> a friendly card with a Back to the Map link
//   anything else          -> a red banner with a Try again button (calls again for a new round)
export default function RoundGate({ status, kind, again, loadingText = 'Loading...' }) {
  if (status === 'ready') return null;
  if (status === 'loading') return <p className="muted">{loadingText}</p>;

  if (kind === 'not_found') return <NotFound />;
  if (kind === 'coming_soon' || kind === 'locked') {
    return (
      <SystemScreen title={kind === 'locked' ? 'Locked for now' : 'Coming soon'}
                    actions={<Link className="btn" to="/">Back to the Map</Link>}>
        {errorMessage(kind)}
      </SystemScreen>
    );
  }
  return (
    <p className="banner error" role="alert">
      {errorMessage(kind)} <button type="button" className="btn" onClick={again}>Try again</button>
    </p>
  );
}
