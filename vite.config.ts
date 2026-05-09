import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), cesium()],
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // NLSC WFS API（都市計畫分區查詢）
        '/nlsc-wfs': {
          target: 'https://wfs.nlsc.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nlsc-wfs/, '/wfs'),
          secure: true,
        },
        // NLSC WMTS API（電子地圖 / 正射影像 圖層）
        '/nlsc-wmts': {
          target: 'https://wmts.nlsc.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nlsc-wmts/, '/wmts'),
          secure: true,
        },
        // NLSC WMS API（土地使用分區 / 都市計畫色塊）
        '/nlsc-wms': {
          target: 'https://wms.nlsc.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nlsc-wms/, '/wms'),
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes, req) => {
              // 只快取 GetMap tile 回應（分區色塊圖磚），避免快取 GetCapabilities
              if (req.url?.includes('REQUEST=GetMap') || req.url?.includes('REQUEST=getmap')) {
                proxyRes.headers['cache-control'] = 'public, max-age=3600'; // 1 小時快取
              }
            });
          },
        },
        // NLSC REST API（行政區 / 地籍查詢）
        '/nlsc-api': {
          target: 'https://api.nlsc.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nlsc-api/, ''),
          secure: true,
        },
        // 08B+08D 地質調查及礦業管理中心 CGS WMS（液化潛勢 / 活動斷層）
        '/cgs-wms': {
          target: 'https://geomap.gsmma.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cgs-wms/, ''),
          secure: true,
        },
        // 08C 土石流潛勢 水保局 SWCB WMS
        '/swcb-wms': {
          target: 'https://246.ardswc.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/swcb-wms/, ''),
          secure: false,
        },
        // 08E 淹水潛勢 水利署 WRA WMS
        '/wra-wms': {
          target: 'https://maps.wra.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/wra-wms/, ''),
          secure: true,
        },
        // 08F 山坡地 / 地質敏感區 水保局 soil WMS
        '/soil-wms': {
          target: 'https://serv.ardswc.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/soil-wms/, ''),
          secure: true,
        },
        // 08G 飲用水保護區 環境部 MOENV WMS
        '/moenv-wms': {
          target: 'https://wsserver.moenv.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/moenv-wms/, ''),
          secure: true,
        },
        // 08H 文化資產 文化部 BOCH WMS (fallback: NCDR hazard)
        '/ncdr-wms': {
          target: 'https://dmap.ncdr.nat.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ncdr-wms/, ''),
          secure: true,
        },
        // PVGIS 太陽能資料 EU JRC（繞過瀏覽器 CORS 限制）
        '/pvgis': {
          target: 'https://re.jrc.ec.europa.eu',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/pvgis/, ''),
          secure: true,
        },
        // Open-Elevation DEM（提升速度，避免直連 CORS 問題）
        '/open-elevation': {
          target: 'https://api.open-elevation.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/open-elevation/, ''),
          secure: true,
        },
        // 台北市行道樹 Azure Blob（繞過 CORS 限制）
        '/tpe-tree': {
          target: 'https://tppkl.blob.core.windows.net',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tpe-tree/, '/blobfs'),
          secure: true,
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@':          path.resolve(__dirname, './src'),
        '@shared':    path.resolve(__dirname, './src/shared'),
        '@app-shell': path.resolve(__dirname, './src/app-shell'),
        '@styles':    path.resolve(__dirname, './src/shared/styles'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main:      path.resolve(__dirname, 'index.html'),
          project01: path.resolve(__dirname, 'src/01-landscape-concept-ai/index.html'),
          project02: path.resolve(__dirname, 'src/02-landscape-magic-planner/index.html'),
          project03: path.resolve(__dirname, 'src/03-space-photo-composite/index.html'),
          project04: path.resolve(__dirname, 'src/04-3d-layout-simulation/index.html'),
          project05: path.resolve(__dirname, 'src/05-landscape-geo-analysis/index.html'),
          project06: path.resolve(__dirname, 'src/06-taipei-greenery-calc/index.html'),
        },
      },
    },
  };
});
