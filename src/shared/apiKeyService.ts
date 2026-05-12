export const IMAGE_PROVIDER_STORE = 'IMAGE_GEN_PROVIDER';
export const IMAGE_API_KEY_STORE = 'IMAGE_GEN_KEY';

export function getStoredGeminiApiKey(): string {
  const provider = localStorage.getItem(IMAGE_PROVIDER_STORE);
  if (provider && provider !== 'gemini') return '';
  return localStorage.getItem(IMAGE_API_KEY_STORE) || '';
}

export function getConfiguredGeminiApiKey(): string {
  return getStoredGeminiApiKey() ||
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    '';
}
