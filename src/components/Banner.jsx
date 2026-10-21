import { useEffect, useState } from 'react';
import { setSlowHandler } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import SystemScreen from './SystemScreen';

// "Waking up the server" (free hosting sleeps) and a sign-in error, from the system screens page.
export default function Banner() {
  const { error, clearError } = useAuth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setSlowHandler(setSlow);               // client.js calls this when a request takes over 4 seconds
    return () => setSlowHandler(() => {});
  }, []);

  return (
    <div aria-live="polite">
      {slow && (
        <SystemScreen title="Waking up the server...">
          This can take up to a minute the first time. Please wait.
        </SystemScreen>
      )}
      {error && (
        <p className="banner error" role="alert">
          {error} <button type="button" className="btn" onClick={clearError}>Dismiss</button>
        </p>
      )}
    </div>
  );
}
