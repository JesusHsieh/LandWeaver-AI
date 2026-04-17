import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      host: '0.0.0.0',
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
          project01: path.resolve(__dirname, 'src/01-landscape-magic-planner/index.html'),
          project02: path.resolve(__dirname, 'src/02-landscape-concept-ai/index.html'),
          project03: path.resolve(__dirname, 'src/03-space-photo-composite/index.html'),
          project04: path.resolve(__dirname, 'src/04-3d-layout-simulation/index.html'),
        },
      },
    },
  };
});
