// SubMatch Background Service Worker
'use strict';

// ─── Message router ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'lookupWord') {
    handleWordLookup(request.word, request.contextSentence, sender.tab?.id)
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

// ─── Word lookup (two-phase: word first, sentence translation async) ───────────
async function handleWordLookup(word, sentence, tabId) {
  if (!word?.trim()) throw new Error('Empty word');

  const uiLang   = chrome.i18n?.getUILanguage?.() ?? 'en';
  const userLang = uiLang.split('-')[0].toLowerCase();

  // Phase 1: translate the word — this is fast, returns immediately
  const wordResult = await googleTranslateLookup(word.trim(), userLang);

  // Phase 2: translate the sentence in the background (no await here)
  // Push result to tab via a separate message so popup renders right away
  if (sentence?.trim() && tabId != null) {
    translateSentenceWithTimeout(sentence.trim(), userLang, 1500).then(sentenceTranslation => {
      if (!sentenceTranslation) return;
      chrome.tabs.sendMessage(tabId, {
        action: 'sentenceTranslationReady',
        sentenceTranslation,
      }).catch(() => {}); // tab may have navigated away — ignore
    });
  }

  // Return word result immediately (sentenceTranslation will arrive via push)
  return { ...wordResult, sentenceTranslation: '' };
}

// ─── Google Translate (free endpoint, no API key required) ─────────────────────
async function googleTranslateLookup(word, targetLang) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', word);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const translation = json?.[0]?.[0]?.[0] ?? '';

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

// ─── Sentence translation ──────────────────────────────────────────────────────
async function translateSentence(sentence, targetLang) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', sentence);

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return '';
    const json = await res.json();
    // Google returns the sentence in chunks — join them all
    const parts = json?.[0] ?? [];
    return parts.map(p => p?.[0] ?? '').join('').trim();
  } catch {
    return '';
  }
}

async function translateSentenceWithTimeout(sentence, targetLang, timeoutMs) {
  try {
    return await Promise.race([
      translateSentence(sentence, targetLang),
      new Promise(resolve => setTimeout(() => resolve(''), timeoutMs))
    ]);
  } catch {
    return '';
  }
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
          translation:         wordItem.translation         ?? words[existing].translation,
          sentence:            wordItem.sentence            ?? words[existing].sentence,
          sentenceTranslation: wordItem.sentenceTranslation ?? words[existing].sentenceTranslation ?? '',
          contextExplanation:  wordItem.contextExplanation  ?? words[existing].contextExplanation,
          exampleSentence:     wordItem.exampleSentence     ?? words[existing].exampleSentence,
          updatedAt: new Date().toISOString(),
        };
      } else {
        const today = new Date().toISOString().split('T')[0];
        words.unshift({
          id:                  `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          word:                wordItem.word                ?? '',
          translation:         wordItem.translation         ?? '',
          contextExplanation:  wordItem.contextExplanation  ?? '',
          sentence:            wordItem.sentence            ?? '',
          sentenceTranslation: wordItem.sentenceTranslation ?? '',
          exampleSentence:     wordItem.exampleSentence     ?? '',
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
