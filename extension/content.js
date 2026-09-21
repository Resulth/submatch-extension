// SubMatch — Universal Subtitle Word Learner
// Zero DOM modification: we never touch subtitle innerHTML.
// Words are detected via caretRangeFromPoint() on click/hover.
'use strict';

// ─── State ────────────────────────────────────────────────────────────────────
let activePopup    = null;
let pausedByUs     = false;
let hoverHighlight = null;
let rafPending     = false; // requestAnimationFrame throttle for mousemove

// ─── Subtitle container selectors ─────────────────────────────────────────────
const CONTAINERS = [
  '.ytp-caption-segment',
  '.player-timedtext-text',
  '.player-timedtext span',
  '.d24-caption-text',
  '.atv-subtitles-text',
  '.vjs-text-track-display span',
  '.vjs-text-track-cue',
  '.jw-text-track-cue',
  '.jw-text-track-container span',
  '.plyr__caption',
  '.art-subtitle',
  '.fluid_subtitles span',
  '.shaka-text-container span',
  '.clappr-subtitles span',
  '.vp-captions-entry',
  '.ttml-text-container span',
  '.bmpui-ui-subtitle-label',
  '.sub-text',
  '.subtitle-text',
];
const CONTAINER_SEL = CONTAINERS.join(',');

// Unicode word character: letters (any language), digits, apostrophe
const WORD_CHAR_RE = /[\p{L}\p{N}']/u;

// ─── Popup / highlight host ───────────────────────────────────────────────────
// In fullscreen mode the browser only shows descendants of fullscreenElement.
// We MUST append our overlays there, not to document.documentElement.
function getHost() {
  return document.fullscreenElement || document.documentElement;
}

// Re-parent our overlays whenever fullscreen state changes
document.addEventListener('fullscreenchange', () => {
  const host = getHost();
  if (activePopup    && !host.contains(activePopup))    host.appendChild(activePopup);
  if (hoverHighlight && !host.contains(hoverHighlight)) host.appendChild(hoverHighlight);
}, { passive: true });

// ─── Word detection ───────────────────────────────────────────────────────────
function getCaretAt(x, y) {
  if (document.caretRangeFromPoint) {          // Chrome / Edge
    const r = document.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  if (document.caretPositionFromPoint) {        // Firefox
    const p = document.caretPositionFromPoint(x, y);
    return p ? { node: p.offsetNode, offset: p.offset } : null;
  }
  return null;
}

function extractWord({ node, offset }) {
  if (node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent;

  let s = offset, e = offset;
  while (s > 0 && WORD_CHAR_RE.test(text[s - 1])) s--;
  while (e < text.length && WORD_CHAR_RE.test(text[e]))  e++;

  const word = text.slice(s, e);
  if (!word.trim()) return null;

  let rect = null;
  try {
    const range = document.createRange();
    range.setStart(node, s);
    range.setEnd(node, e);
    rect = range.getBoundingClientRect();
  } catch { /* ignore */ }

  return { word: word.trim(), rect };
}

// Returns { wordEl, caret, subtitleEl } if pointer is over a subtitle word
function hitTest(x, y) {
  const caret = getCaretAt(x, y);
  if (!caret) return null;

  const parent = caret.node.nodeType === Node.TEXT_NODE
    ? caret.node.parentElement
    : caret.node;
  const subtitleEl = parent?.closest(CONTAINER_SEL);
  if (!subtitleEl) return null;

  const result = extractWord(caret);
  if (!result) return null;

  return { word: result.word, rect: result.rect, subtitleEl };
}

// ─── Hover highlight ──────────────────────────────────────────────────────────
window.addEventListener('mousemove', e => {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit || !hit.rect || hit.rect.width === 0) {
      hideHighlight();
    } else {
      showHighlight(hit.rect);
    }
  });
}, { passive: true });

document.addEventListener('mouseleave', hideHighlight, { passive: true });

function ensureHighlight() {
  if (hoverHighlight) return;
  hoverHighlight = document.createElement('div');
  hoverHighlight.className = 'sm-word-highlight';
  getHost().appendChild(hoverHighlight);
}

function showHighlight(rect) {
  ensureHighlight();
  // If highlight is in wrong container (e.g. after entering fullscreen), move it
  const host = getHost();
  if (!host.contains(hoverHighlight)) host.appendChild(hoverHighlight);

  Object.assign(hoverHighlight.style, {
    left:    `${Math.round(rect.left   - 3)}px`,
    top:     `${Math.round(rect.top    - 3)}px`,
    width:   `${Math.round(rect.width  + 6)}px`,
    height:  `${Math.round(rect.height + 6)}px`,
    display: 'block',
  });
}

function hideHighlight() {
  if (hoverHighlight) hoverHighlight.style.display = 'none';
}

// ─── Click handler ────────────────────────────────────────────────────────────
// Registered on WINDOW (highest in capture chain) → fires before player overlay.
window.addEventListener('pointerdown', e => {
  if (e.button !== 0) return; // left click only

  const hit = hitTest(e.clientX, e.clientY);

  if (!hit) {
    // Clicked outside subtitle — close popup if open
    if (activePopup && !activePopup.contains(e.target)) removeActivePopup();
    return;
  }

  // Beat the player's handler
  e.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();

  const sentence = hit.subtitleEl.textContent.trim();
  const rect = hit.rect || { left: e.clientX, top: e.clientY, width: 0, height: 0, bottom: e.clientY };
  openPopup(hit.word, sentence, rect);
}, { capture: true, passive: false });

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activePopup) removeActivePopup();
}, { passive: true });

// ─── Popup ────────────────────────────────────────────────────────────────────
function openPopup(word, sentence, wordRect) {
  removeActivePopup();
  pauseVideo();

  const popup = buildLoadingPopup(word);
  positionPopup(popup, wordRect);

  const host = getHost();
  host.appendChild(popup);
  activePopup = popup;

  popup.querySelector('.sm-close').addEventListener('click', removeActivePopup);

  safelySendMessage(
    { action: 'lookupWord', word, contextSentence: sentence },
    response => {
      if (!activePopup || activePopup !== popup) return;
      if (response?.success && response.data) {
        renderResult(popup, response.data, sentence);
      } else {
        renderError(popup, word);
      }
    }
  );
}

function positionPopup(popup, rect) {
  const PW = 310, PH = 265;
  const W  = window.innerWidth, H = window.innerHeight;

  let left = (rect.left ?? 0) + (rect.width  ?? 0) / 2 - PW / 2;
  let top  = (rect.top  ?? 0) - PH - 14;

  left = Math.max(10, Math.min(left, W - PW - 10));
  if (top < 10) top = (rect.bottom ?? rect.top ?? 0) + 10;
  top  = Math.max(10, Math.min(top,  H - PH - 10));

  popup.style.left = `${Math.round(left)}px`;
  popup.style.top  = `${Math.round(top)}px`;
}

function buildLoadingPopup(word) {
  const p = document.createElement('div');
  p.className = 'sm-popup';
  p.innerHTML = `
    <div class="sm-header">
      <span class="sm-word">${esc(word)}</span>
      <button class="sm-close" aria-label="Close">✕</button>
    </div>
    <div class="sm-body"><div class="sm-spinner"></div></div>`;
  return p;
}

function renderResult(popup, data, sentence) {
  const sentTr = data.sentenceTranslation || '';
  // Only show sentence translation if it's different from the original
  const showSentTr = sentTr && sentTr.toLowerCase() !== sentence.toLowerCase();

  popup.innerHTML = `
    <div class="sm-header">
      <div class="sm-word-block">
        <span class="sm-word">${esc(data.word)}</span>
        <span class="sm-tr">${esc(data.translation)}</span>
      </div>
      <button class="sm-close" aria-label="Close">✕</button>
    </div>
    <div class="sm-body">
      <p class="sm-sentence">${esc(sentence)}</p>
      ${showSentTr ? `<p class="sm-sentence-tr">${esc(sentTr)}</p>` : ''}
      <button class="sm-save">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        Save to cards
      </button>
    </div>`;
  popup.querySelector('.sm-close').addEventListener('click', removeActivePopup);
  popup.querySelector('.sm-save').addEventListener('click', () => {
    const btn = popup.querySelector('.sm-save');
    btn.disabled = true;
    btn.textContent = '✓ Saved!';
    btn.classList.add('sm-saved');
    safelySendMessage({
      action: 'saveWord',
      wordData: {
        word: data.word,
        translation: data.translation,
        contextExplanation: data.contextExplanation || '',
        sentence,
        sentenceTranslation: data.sentenceTranslation || '',
        exampleSentence: data.exampleSentence || '',
      }
    }, () => setTimeout(removeActivePopup, 800));
  });
}

function renderError(popup, word) {
  popup.innerHTML = `
    <div class="sm-header">
      <span class="sm-word">${esc(word)}</span>
      <button class="sm-close" aria-label="Close">✕</button>
    </div>
    <div class="sm-body">
      <p class="sm-errmsg">Translation unavailable. Try again.</p>
    </div>`;
  popup.querySelector('.sm-close').addEventListener('click', removeActivePopup);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function removeActivePopup() {
  activePopup?.remove();
  activePopup = null;
  resumeVideo();
}

function pauseVideo() {
  const v = document.querySelector('video');
  if (v && !v.paused) { v.pause(); pausedByUs = true; }
}

function resumeVideo() {
  if (!pausedByUs) return;
  pausedByUs = false;
  document.querySelector('video')?.play().catch(() => {});
}

function safelySendMessage(msg, cb) {
  try {
    chrome.runtime.sendMessage(msg, res => {
      if (chrome.runtime.lastError) {
        console.warn('[SubMatch]', chrome.runtime.lastError.message);
        cb?.(null);
        return;
      }
      cb?.(res);
    });
  } catch (err) {
    console.warn('[SubMatch] sendMessage:', err.message);
    cb?.(null);
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
