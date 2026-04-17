/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Gemini AI (all modules)
  readonly GEMINI_API_KEY: string;
  // Module 05 — Landscape Geo Analysis
  readonly VITE_CESIUM_ION_TOKEN: string;
  readonly VITE_CWA_API_KEY: string;
  readonly VITE_EPA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
