import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { bootstrapCapacitorNative } from './capacitor-bootstrap';

import './i18n';
import './index.css';
import { loading } from './features';

function mountApp() {
  loading();

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrapCapacitorNative().finally(mountApp);
