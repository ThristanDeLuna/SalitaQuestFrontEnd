import { Link } from 'react-router-dom';
import SystemScreen from './SystemScreen';

// For a signed-in user with the wrong role. A visitor is sent to sign in instead (see Guard).
export default function Forbidden() {
  return (
    <SystemScreen title="Not for this account"
                  actions={<Link className="btn" to="/">Back to the Map</Link>}>
      You need a different role to open this page.
    </SystemScreen>
  );
}
