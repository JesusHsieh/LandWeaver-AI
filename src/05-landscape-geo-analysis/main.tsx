import React from 'react';
import { createRoot } from 'react-dom/client';
import { Ion } from 'cesium';
import App from './App.tsx';
import './index.css';
import ApiKeyManager from '../shared/ApiKeyManager';
import { ErrorBoundary } from '../shared/ErrorBoundary';

// 初始化 Cesium Ion Token (3D Tiles / 衛星底圖)
const cesiumToken = localStorage.getItem('VITE_CESIUM_ION_TOKEN') || import.meta.env.VITE_CESIUM_ION_TOKEN;
if (cesiumToken) {
  Ion.defaultAccessToken = cesiumToken;
} else {
  console.warn('[LandWeaver] VITE_CESIUM_ION_TOKEN 未設定，請至 ⚙ 設定 填入 Cesium Ion Token。');
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <ApiKeyManager />
    </ErrorBoundary>
  </React.StrictMode>,
);
