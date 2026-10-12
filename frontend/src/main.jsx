import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import { PlayerProvider } from './context/PlayerContext.jsx';

import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/player.css';
import './styles/pages.css';

/*
 * Provider order matters:
 *   AuthProvider  → gives `user` to everyone
 *   UIProvider     → toasts + confirm dialogs
 *   PlayerProvider → needs both (records plays for the user, shows toast on error)
 */
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UIProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </UIProvider>
    </AuthProvider>
  </React.StrictMode>
);
