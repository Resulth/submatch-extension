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

// ─── Word lookup (parallel: word + sentence together) ───────────────────────
async function handleWordLookup(word, sentence, tabId) {
  if (!word?.trim()) throw new Error('Empty word');

  const uiLang   = chrome.i18n.getUILanguage() ?? 'en';
  const userLang = uiLang.split('-')[0].toLowerCase();

  // Fetch word translation and sentence translation in parallel
  const [wordResult, sentenceTranslation] = await Promise.all([
    googleTranslateLookup(word.trim(), userLang),
    sentence?.trim()
      ? translateSentenceWithTimeout(sentence.trim(), userLang, 3000)
      : Promise.resolve(''),
  ]);

  return { ...wordResult, sentenceTranslation: sentenceTranslation || '' };
}

// ─── Google Translate (free endpoint, no API key required) ─────────────────────
function buildTranslateUrl(word, targetLang, includeDictionary = true) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('q', word);
  if (includeDictionary) {
    url.searchParams.append('dt', 't');
    url.searchParams.append('dt', 'd');
  } else {
    url.searchParams.set('dt', 't');
  }
  return url.toString();
}

function extractTranslationText(json) {
  const blocks = Array.isArray(json?.[0]) ? json[0] : [];
  const texts = [];

  for (const block of blocks) {
    if (Array.isArray(block)) {
      const text = block[0];
      if (typeof text === 'string' && text.trim()) texts.push(text.trim());
    } else if (typeof block === 'string' && block.trim()) {
      texts.push(block.trim());
    }
  }

  if (texts.length > 0) return texts.join('');
  return typeof json?.[0]?.[0]?.[0] === 'string' ? json[0][0][0] : '';
}

async function fetchTranslateJson(urls) {
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  throw new Error('Translation request failed');
}

async function googleTranslateLookup(word, targetLang) {
  const normalizedWord = String(word || '').trim();
  if (!normalizedWord) return { word: normalizedWord, translation: '', contextExplanation: '', exampleSentence: '' };

  const urls = [
    buildTranslateUrl(normalizedWord, targetLang),
    targetLang !== 'en' ? buildTranslateUrl(normalizedWord, 'en') : null,
  ].filter(Boolean);

  try {
    const json = await fetchTranslateJson(urls);
    const translation = extractTranslationText(json).trim();

    let contextExplanation = '';
    try {
      const dictEntries = Array.isArray(json?.[1]) ? json[1] : [];
      const defs = [];
      for (const entry of dictEntries) {
        const pos = entry?.[0] ?? '';
        const terms = Array.isArray(entry?.[1]) ? entry[1] : [];
        if (terms.length > 0) {
          const termStr = terms.slice(0, 2).join(', ');
          defs.push(pos ? `${pos}: ${termStr}` : termStr);
        }
        if (defs.length >= 2) break;
      }
      contextExplanation = defs.join(' / ');
    } catch {
      contextExplanation = '';
    }

    if (translation && translation.toLowerCase() !== normalizedWord.toLowerCase()) {
      return { word: normalizedWord, translation, contextExplanation, exampleSentence: '' };
    }

    if (targetLang !== 'en') {
      try {
        const fallbackJson = await fetchTranslateJson([buildTranslateUrl(normalizedWord, 'en')]);
        const fallbackTranslation = extractTranslationText(fallbackJson).trim();
        if (fallbackTranslation && fallbackTranslation.toLowerCase() !== normalizedWord.toLowerCase()) {
          return { word: normalizedWord, translation: fallbackTranslation, contextExplanation, exampleSentence: '' };
        }
      } catch {
        // fall through to empty translation instead of failing the whole lookup
      }
    }

    return { word: normalizedWord, translation: translation || '', contextExplanation, exampleSentence: '' };
  } catch {
    return { word: normalizedWord, translation: '', contextExplanation: '', exampleSentence: '' };
  }
}

// ─── Sentence translation ──────────────────────────────────────────────────────
async function translateSentence(sentence, targetLang) {
  const normalizedSentence = String(sentence || '').trim();
  if (!normalizedSentence) return '';

  const url = buildTranslateUrl(normalizedSentence, targetLang, false);

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return '';
    const json = await response.json();
    return extractTranslationText(json).trim();
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
