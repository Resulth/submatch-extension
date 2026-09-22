import io
import re

# ── 1. background.js — contextExplanation via Google Translate dictionary (dt=d) ──
with io.open('extension/background.js', 'r', encoding='utf-8') as f:
    bg = f.read()

# Replace the googleTranslateLookup function to also fetch definitions
old_lookup = """async function googleTranslateLookup(word, targetLang) {
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
}"""

new_lookup = """async function googleTranslateLookup(word, targetLang) {
  // Request both translation (t) and dictionary definitions (d) in one call
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLang);
  url.searchParams.append('dt', 't');
  url.searchParams.append('dt', 'd'); // dictionary definitions
  url.searchParams.set('q', word);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const translation = json?.[0]?.[0]?.[0] ?? '';

  // json[1] contains dictionary entries: [[partOfSpeech, [def1, def2, ...]], ...]
  let contextExplanation = '';
  try {
    const dictEntries = json?.[1] ?? [];
    const defs = [];
    for (const entry of dictEntries) {
      const pos   = entry?.[0] ?? '';   // e.g. "noun"
      const terms = entry?.[1] ?? [];   // synonyms/definitions in target lang
      if (terms.length > 0) {
        // Take up to 2 terms per part-of-speech
        const termStr = terms.slice(0, 2).join(', ');
        defs.push(pos ? `${pos}: ${termStr}` : termStr);
      }
      if (defs.length >= 2) break; // keep it short
    }
    contextExplanation = defs.join(' / ');
  } catch { /* ignore */ }

  if (!translation || translation.toLowerCase() === word.toLowerCase()) {
    if (targetLang !== 'en') {
      const fallbackUrl = new URL(url.toString());
      fallbackUrl.searchParams.set('tl', 'en');
      const fb = await fetch(fallbackUrl.toString(), { cache: 'no-store' });
      if (fb.ok) {
        const fbJson  = await fb.json();
        const fbTrans = fbJson?.[0]?.[0]?.[0] ?? '';
        if (fbTrans && fbTrans.toLowerCase() !== word.toLowerCase()) {
          return { word, translation: fbTrans, contextExplanation, exampleSentence: '' };
        }
      }
    }
  }

  return { word, translation, contextExplanation, exampleSentence: '' };
}"""

bg = bg.replace(old_lookup, new_lookup)

with io.open('extension/background.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(bg)

print("background.js patched OK")
