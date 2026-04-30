import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ApiKeyManager from '../shared/ApiKeyManager';
import { ErrorBoundary } from '../shared/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <ApiKeyManager />
    </ErrorBoundary>
  </React.StrictMode>
);
