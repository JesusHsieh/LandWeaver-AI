import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Ion } from 'cesium';
import App from './App.tsx';
import './index.css';
import ApiKeyManager from '../shared/ApiKeyManager';

// 初始化 Cesium Ion Token (3D Tiles / 衛星底圖)
const cesiumToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
if (cesiumToken) {
  Ion.defaultAccessToken = cesiumToken;
} else {
  console.warn('[LandWeaver] VITE_CESIUM_ION_TOKEN 未設定，Cesium 3D Tiles 功能將受限。');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <App />
      <ApiKeyManager />
    </>
  </StrictMode>,
);
