import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { SummaryProvider } from './auth/useSummary.js';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;   // public by design

const app = (
  <BrowserRouter>
    <AuthProvider>
      <SummaryProvider>
        <App />
      </SummaryProvider>
    </AuthProvider>
  </BrowserRouter>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {clientId ? <GoogleOAuthProvider clientId={clientId}>{app}</GoogleOAuthProvider> : app}
  </StrictMode>,
);
