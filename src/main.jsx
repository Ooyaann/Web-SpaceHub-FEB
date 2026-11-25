import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { SpaceHubProvider } from './context/SpaceHubContext';
import { registerSpaceHubServiceWorker } from './lib/systemNotification';
import App from './App';
import './index.css';

registerSpaceHubServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SpaceHubProvider>
        <App />
      </SpaceHubProvider>
    </ThemeProvider>
  </StrictMode>
);
