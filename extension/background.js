// SubMatch Background Service Worker
'use strict';

// ─── Message router ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'lookupWord') {
    handleWordLookup(request.word, request.contextSentence)
      .then(data  => sendResponse({ success: true, data }))
      .catch(err  => sendResponse({ success: false, error: err.message }));
    return true; // keep message channel open for async response
  }

  if (request.action === 'saveWord') {
    saveWordToStorage(request.wordData)
      .then(()   => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ─── Word lookup ───────────────────────────────────────────────────────────────
async function handleWordLookup(word, sentence) {
  if (!word?.trim()) throw new Error('Empty word');

  // Detect user's browser language (e.g. "tr", "en", "de")
  const uiLang   = chrome.i18n?.getUILanguage?.() ?? 'en';
  const userLang = uiLang.split('-')[0].toLowerCase();

  try {
    const result = await googleTranslateLookup(word.trim(), userLang);
    return result;
  } catch (err) {
    console.warn('[SubMatch] Translate failed:', err.message);
    // Silent fallback — return original word so popup still shows
    return { word: word.trim(), translation: '', contextExplanation: '', exampleSentence: '' };
  }
}

// ─── Google Translate (free endpoint, no API key required) ─────────────────────
async function googleTranslateLookup(word, targetLang) {
  // If user's language is the same as the video language, translate to English instead
  // so the user always sees a useful translation.
  // We let Google auto-detect source; if source === target it returns the original word.
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');      // auto-detect source language
  url.searchParams.set('tl', targetLang);  // user's browser language
  url.searchParams.set('dt', 't');         // return translation
  url.searchParams.set('q', word);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();

  // Response shape: [ [ [translatedText, originalText, …], … ], detectedLang ]
  const translation = json?.[0]?.[0]?.[0] ?? '';

  // If translation equals original word, Google couldn't translate (e.g. name, acronym)
  // Try translating to English as fallback so popup isn't empty
  if (!translation || translation.toLowerCase() === word.toLowerCase()) {
    if (targetLang !== 'en') {
      const fallbackUrl = url.toString().replace(`tl=${targetLang}`, 'tl=en');
      const fb = await fetch(fallbackUrl, { cache: 'no-store' });
      if (fb.ok) {
        const fbJson  = await fb.json();
        const fbTrans = fbJson?.[0]?.[0]?.[0] ?? '';
        if (fbTrans && fbTrans.toLowerCase() !== word.toLowerCase()) {
          return { word, translation: fbTrans, contextExplanation: '', exampleSentence: '' };
        }
      }
    }
  }

  return { word, translation, contextExplanation: '', exampleSentence: '' };
}

// ─── Storage: save with SM-2 spaced repetition defaults ────────────────────────
async function saveWordToStorage(wordItem) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('savedWords', result => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));

      const words = result.savedWords ?? [];

      // If the same word was already saved (case-insensitive), just update it
      const existing = words.findIndex(
        w => w.word.toLowerCase() === (wordItem.word ?? '').toLowerCase()
      );

      if (existing >= 0) {
        words[existing] = {
          ...words[existing],
          translation:        wordItem.translation        ?? words[existing].translation,
          sentence:           wordItem.sentence           ?? words[existing].sentence,
          contextExplanation: wordItem.contextExplanation ?? words[existing].contextExplanation,
          exampleSentence:    wordItem.exampleSentence    ?? words[existing].exampleSentence,
          updatedAt: new Date().toISOString(),
        };
      } else {
        const today = new Date().toISOString().split('T')[0];
        words.unshift({
          id:                 `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          word:               wordItem.word               ?? '',
          translation:        wordItem.translation        ?? '',
          contextExplanation: wordItem.contextExplanation ?? '',
          sentence:           wordItem.sentence           ?? '',
          exampleSentence:    wordItem.exampleSentence    ?? '',
          savedAt:            new Date().toISOString(),
          // SM-2 initial values
          interval:   1,
          repetition: 0,
          efactor:    2.5,
          dueDate:    today,
        });
      }

      chrome.storage.local.set({ savedWords: words }, () => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        resolve();
      });
    });
  });
}
