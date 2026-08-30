import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.tsx';
import './index.css';

const domain =
  import.meta.env.VITE_AUTH0_DOMAIN ||
  'icfg-5qgdjxyskxeyawhf3smwvjne.us.auth0.com';

const clientId =
  import.meta.env.VITE_AUTH0_CLIENT_ID ||
  'XJS0prsHuy59Gxp15wG3sByvv8sYnyGv';

const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
        ...(audience ? { audience } : {}),
        scope: 'openid profile email',
      }}
      cacheLocation="localstorage"
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
);

