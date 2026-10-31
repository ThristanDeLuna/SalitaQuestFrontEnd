import { Link } from 'react-router-dom';
import SystemScreen from '../components/SystemScreen';

export default function NotFound() {
  return (
    <SystemScreen title="Lost at sea" actions={<Link className="btn" to="/">Back to the Map</Link>}>
      We could not find that page.
    </SystemScreen>
  );
}
