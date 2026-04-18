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
        // 代理 NLSC WFS API，避免瀏覽器 CORS 限制
        '/nlsc-wfs': {
          target: 'https://wfs.nlsc.gov.tw',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nlsc-wfs/, '/wfs'),
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
        },
      },
    },
  };
});
