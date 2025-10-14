// src/services/autoTranslate.js
// Google Translate API integration for auto-translation
// Usage: import { autoTranslate } from './autoTranslate';
// Call autoTranslate(text, targetLang) to get translated text

const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Auto-translate text using Google Translate API
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code (e.g., 'hi', 'en', 'bn')
 * @param {string} [sourceLang] - Optional source language code
 * @returns {Promise<string>} - The translated text
 */
export async function autoTranslate(text, targetLang, sourceLang) {
  if (!API_KEY) throw new Error('Google Translate API key not set');
  const body = {
    q: text,
    target: targetLang,
    format: 'text',
  };
  if (sourceLang) body.source = sourceLang;
  const params = new URLSearchParams({ key: API_KEY });
  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Translation API error');
  const data = await res.json();
  return data.data.translations[0].translatedText;
}
