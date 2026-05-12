import { GoogleGenAI } from '@google/genai';
import { IMAGE_API_KEY_STORE, IMAGE_PROVIDER_STORE } from './apiKeyService';

export type ImageProvider = 'gemini' | 'together' | 'huggingface' | 'stability';

export const PROVIDER_LABELS: Record<ImageProvider, string> = {
  gemini:      '✨ Google Gemini',
  together:    '⚡ Together AI',
  huggingface: '🤗 Hugging Face',
  stability:   '🖌️ Stability AI',
};

export const PROVIDER_NEEDS_KEY: Record<ImageProvider, boolean> = {
  gemini:      true,
  together:    true,
  huggingface: true,
  stability:   true,
};

export const PROVIDER_KEY_HINT: Record<ImageProvider, string> = {
  gemini:      'AIza...',
  together:    'Together API Key',
  huggingface: 'hf_...',
  stability:   'sk-...',
};

export const PROVIDER_LINK: Record<ImageProvider, string> = {
  gemini:      'https://aistudio.google.com/apikey',
  together:    'https://api.together.ai/',
  huggingface: 'https://huggingface.co/settings/tokens',
  stability:   'https://platform.stability.ai/account/keys',
};

export const getImageProvider = (): ImageProvider => {
  const stored = localStorage.getItem(IMAGE_PROVIDER_STORE) as ImageProvider;
  const valid: ImageProvider[] = ['gemini', 'together', 'huggingface', 'stability'];
  return valid.includes(stored) ? stored : 'gemini';
};

export const getImageProviderKey = (): string =>
  localStorage.getItem(IMAGE_API_KEY_STORE) || '';

export const setImageProvider = (p: ImageProvider) =>
  localStorage.setItem(IMAGE_PROVIDER_STORE, p);

export const setImageProviderKey = (k: string) =>
  localStorage.setItem(IMAGE_API_KEY_STORE, k);

export const clearImageProvider = () => {
  localStorage.removeItem(IMAGE_PROVIDER_STORE);
  localStorage.removeItem(IMAGE_API_KEY_STORE);
};

export const isImageProviderReady = (): boolean =>
  !!getImageProviderKey();

/**
 * Unified image generation entry point.
 * - prompt: the full text prompt
 * - width / height: target dimensions
 * - referenceImageBase64: optional base64 image (only used by Gemini)
 */
export async function generateImage(
  prompt: string,
  width = 1024,
  height = 768,
  referenceImageBase64?: string
): Promise<string> {
  const provider = getImageProvider();
  const key = getImageProviderKey();

  switch (provider) {
    // ── Gemini ──────────────────────────────────────────────────────
    case 'gemini': {
      if (!key) throw new Error('請先設定 Gemini API Key');
      const ai = new GoogleGenAI({ apiKey: key });
      const parts: any[] = [];
      if (referenceImageBase64) {
        const clean = referenceImageBase64.split(',')[1] || referenceImageBase64;
        parts.push({ inlineData: { data: clean, mimeType: 'image/png' } });
      }
      parts.push({ text: prompt });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: { parts },
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });
      const resParts = response.candidates?.[0]?.content?.parts;
      if (resParts) {
        for (const p of resParts) {
          if (p.inlineData?.data) return `data:image/png;base64,${p.inlineData.data}`;
        }
      }
      throw new Error('Gemini 未回傳圖片');
    }

    // ── Together AI ──────────────────────────────────────────────────
    case 'together': {
      if (!key) throw new Error('請先設定 Together AI API Key');
      const res = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell-Free',
          prompt,
          n: 1,
          width,
          height,
          response_format: 'b64_json',
        }),
      });
      if (!res.ok) throw new Error(`Together AI 錯誤: ${await res.text()}`);
      const json = await res.json();
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error('Together AI 未回傳圖片');
      return `data:image/png;base64,${b64}`;
    }

    // ── Hugging Face ─────────────────────────────────────────────────
    case 'huggingface': {
      if (!key) throw new Error('請先設定 Hugging Face Token');
      const res = await fetch(
        'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: prompt }),
        }
      );
      if (!res.ok) throw new Error(`Hugging Face 錯誤: ${await res.text()}`);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // ── Stability AI ─────────────────────────────────────────────────
    case 'stability': {
      if (!key) throw new Error('請先設定 Stability AI API Key');
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('output_format', 'png');
      const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
        body: formData,
      });
      if (!res.ok) throw new Error(`Stability AI 錯誤: ${await res.text()}`);
      const json = await res.json();
      const b64 = json.image;
      if (!b64) throw new Error('Stability AI 未回傳圖片');
      return `data:image/png;base64,${b64}`;
    }

    default:
      throw new Error(`未知服務商: ${provider}`);
  }
}
