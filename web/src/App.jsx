import React, { useState, useEffect } from 'react';
import { Volume2, RotateCw, Search, Trash2, Sun, Moon } from 'lucide-react';
import { calculateSM2, INITIAL_DEMO_WORDS } from './utils/sm2';

// ── Chrome storage helper (safe for non-extension context) ──────────────
const chromeStorage = {
  get: (keys, cb) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(keys, cb);
    } else {
      const result = {};
      keys.forEach(k => {
        const v = localStorage.getItem('sm_' + k);
        if (v !== null) try { result[k] = JSON.parse(v); } catch { result[k] = v; }
      });
      cb(result);
    }
  },
  set: (obj) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set(obj);
    } else {
      Object.entries(obj).forEach(([k, v]) => localStorage.setItem('sm_' + k, JSON.stringify(v)));
    }
  },
};

export default function App() {
  const [activeTab, setActiveTab]   = useState('study');
  const [words, setWords]           = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped]   = useState(false);
  const [completed, setCompleted]   = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Settings synced with popup ──────────────────────────────────────────
  const [theme, setTheme]           = useState('dark');   // 'dark' | 'light' | 'auto'
  const [font, setFont]             = useState('system');
  const [underline, setUnderline]   = useState('on');

  // ── Load settings on mount & listen for changes ────────────────────────
  useEffect(() => {
    chromeStorage.get(['smTheme', 'smFont', 'smUnderline'], (res) => {
      if (res.smTheme)    setTheme(res.smTheme);
      if (res.smFont)     setFont(res.smFont);
      if (res.smUnderline) setUnderline(res.smUnderline);
    });

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const settingsListener = (changes, area) => {
        if (area !== 'local') return;
        if (changes.smTheme)    setTheme(changes.smTheme.newValue);
        if (changes.smFont)     setFont(changes.smFont.newValue);
        if (changes.smUnderline) setUnderline(changes.smUnderline.newValue);
      };
      chrome.storage.onChanged.addListener(settingsListener);
      return () => chrome.storage.onChanged.removeListener(settingsListener);
    }
  }, []);

  // ── Load words & live-update on storage change ─────────────────────────
  useEffect(() => {
    loadWords();
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      const wordsListener = (changes, namespace) => {
        if (namespace === 'local' && changes.savedWords) {
          setWords(changes.savedWords.newValue || []);
        }
      };
      chrome.storage.onChanged.addListener(wordsListener);
      return () => chrome.storage.onChanged.removeListener(wordsListener);
    }
  }, []);

  // ── Resolve effective theme ────────────────────────────────────────────
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'auto' && systemDark);

  // ── Toggle theme (button in header) ───────────────────────────────────
  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    chromeStorage.set({ smTheme: next });
  };

  // ── Font mapping ──────────────────────────────────────────────────────
  const fontMap = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    sans:   'Arial, Helvetica, sans-serif',
    serif:  'Georgia, "Times New Roman", serif',
    mono:   'Consolas, monospace',
  };
  const fontFamily = fontMap[font] || fontMap.system;

  const loadWords = () => {
    chromeStorage.get(['savedWords'], (result) => {
      if (result.savedWords && result.savedWords.length > 0) {
        setWords(result.savedWords);
      } else {
        setWords(INITIAL_DEMO_WORDS);
      }
    });
  };

  const saveWords = (newWords) => {
    setWords(newWords);
    chromeStorage.set({ savedWords: newWords });
  };

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentCard = words[currentIndex];

  const handleRating = (quality) => {
    if (!currentCard) return;
    const sm2Result = calculateSM2(quality, currentCard.repetition, currentCard.interval, currentCard.efactor);
    const updatedCard = { ...currentCard, ...sm2Result };
    const updatedWords = words.map(w => w.id === updatedCard.id ? updatedCard : w);
    saveWords(updatedWords);
    if (currentIndex + 1 < words.length) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleDeleteWord = (id, word) => {
    if (!window.confirm(`"${word}" kelimesini silmek istediğinizden emin misiniz?`)) return;
    const filtered = words.filter(w => w.id !== id);
    saveWords(filtered);
  };

  const filteredWords = words.filter(item =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Theme-aware colour palette ────────────────────────────────────────
  const c = isDark ? {
    bg:         '#0F0F0F',
    headerBg:   '#181818',
    headerBorder: '#272727',
    cardBg:     '#181818',
    cardBorder: '#303030',
    cardHover:  '#444444',
    innerBg:    '#242424',
    innerBorder:'#383838',
    text:       '#F1F1F1',
    textMuted:  '#AAAAAA',
    textSub:    '#CCCCCC',
    textHint:   '#888888',
    textDim:    '#666666',
    inputBg:    '#181818',
    inputBorder:'#303030',
    inputFocus: '#555555',
    pill:       '#F1F1F1',
    pillText:   '#0F0F0F',
    pillHover:  '#D9D9D9',
    selection:  'rgba(255,255,255,0.2)',
    speakBtn:   '#2A2A2A',
    speakHover: '#383838',
    tagBg:      '#242424',
    tagBorder:  '#383838',
  } : {
    bg:         '#F5F5F5',
    headerBg:   '#FFFFFF',
    headerBorder:'#E5E5E5',
    cardBg:     '#FFFFFF',
    cardBorder: '#E5E5E5',
    cardHover:  '#CCCCCC',
    innerBg:    '#F9F9F9',
    innerBorder:'#E8E8E8',
    text:       '#1A1A1A',
    textMuted:  '#666666',
    textSub:    '#444444',
    textHint:   '#999999',
    textDim:    '#AAAAAA',
    inputBg:    '#FFFFFF',
    inputBorder:'#E0E0E0',
    inputFocus: '#AAAAAA',
    pill:       '#1A1A1A',
    pillText:   '#FFFFFF',
    pillHover:  '#333333',
    selection:  'rgba(0,0,0,0.1)',
    speakBtn:   '#F0F0F0',
    speakHover: '#E0E0E0',
    tagBg:      '#F0F0F0',
    tagBorder:  '#E0E0E0',
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, color: c.text, display: 'flex', flexDirection: 'column', fontFamily, transition: 'background 0.2s, color 0.2s' }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${c.headerBorder}`, background: c.headerBg, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: c.innerBg, border: `1px solid ${c.innerBorder}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <svg viewBox="0 0 24 24" fill={c.text} style={{ width: '100%', height: '100%' }}>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: c.text }}>SubMatch</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: c.innerBg, border: `1px solid ${c.innerBorder}`, borderRadius: 999, padding: '6px 10px', cursor: 'pointer', color: c.textMuted, display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 4, background: c.innerBg, padding: 4, borderRadius: 999, border: `1px solid ${c.innerBorder}` }}>
              {[['study', `Kart Çalışması (${words.length})`], ['list', 'Kelime Deposu']].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setIsFlipped(false); }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none',
                    background: activeTab === tab ? c.pill : 'transparent',
                    color: activeTab === tab ? c.pillText : c.textMuted,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 576, width: '100%', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {activeTab === 'study' ? (
          completed ? (
            <div style={{ textAlign: 'center', background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 20, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ width: 48, height: 48, background: c.pill, color: c.pillText, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 700, fontSize: 20 }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: c.text }}>Tebrikler! Seans Tamamlandı</h2>
              <p style={{ color: c.textMuted, fontSize: 12, marginBottom: 24 }}>Aralıklı tekrar algoritması kelime tekrar tarihlerinizi güncelledi.</p>
              <button
                onClick={() => { setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: c.pill, color: c.pillText, fontWeight: 600, fontSize: 12, borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              >
                <RotateCw size={14} /> Seansı Tekrar Başlat
              </button>
            </div>
          ) : words.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: c.textMuted }}>
              <p style={{ fontSize: 14 }}>Çalışılacak kelime bulunamadı.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Progress */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.textMuted, fontWeight: 500 }}>
                <span>Kart {currentIndex + 1} / {words.length}</span>
                <span>Anki / SM-2 Algoritması</span>
              </div>

              {/* Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 20, padding: 32, minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, padding: '4px 12px', background: c.tagBg, borderRadius: 999, border: `1px solid ${c.tagBorder}` }}>
                    {isFlipped ? 'Çeviri ve Detaylar' : 'Hedef Kelime'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
                    style={{ padding: 8, background: c.speakBtn, borderRadius: '50%', color: c.text, border: 'none', cursor: 'pointer', display: 'flex', transition: 'background 0.12s' }}
                    title="Okunuşu Dinle"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                {!isFlipped ? (
                  <div style={{ margin: 'auto 0', textAlign: 'center', padding: '16px 0' }}>
                    <h2 style={{ fontSize: 36, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', marginBottom: 16, textDecoration: underline === 'off' ? 'none' : undefined }}>{currentCard.word}</h2>
                    <div style={{ background: c.innerBg, border: `1px solid ${c.innerBorder}`, padding: 16, borderRadius: 12, maxWidth: 400, margin: '0 auto' }}>
                      <p style={{ fontSize: 12, fontStyle: 'italic', color: c.textSub, lineHeight: 1.6 }}>"{currentCard.sentence}"</p>
                    </div>
                    <span style={{ display: 'inline-block', marginTop: 24, fontSize: 11, color: c.textHint, fontWeight: 500 }}>Çeviriyi görmek için karta tıklayın</span>
                  </div>
                ) : (
                  <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left', padding: '8px 0' }}>
                    <div>
                      <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 600, color: c.textMuted }}>Türkçe Çevirisi</span>
                      <h3 style={{ fontSize: 24, fontWeight: 700, color: c.text, marginTop: 2 }}>{currentCard.translation}</h3>
                    </div>
                    {currentCard.sentenceTranslation && (
                      <div style={{ background: c.innerBg, border: `1px solid ${c.innerBorder}`, padding: 14, borderRadius: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 }}>Cümle Çevirisi</span>
                        <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.6 }}>{currentCard.sentenceTranslation}</p>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: 11, color: c.textHint, borderTop: `1px solid ${c.cardBorder}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span>Tekrar Sayısı: {currentCard.repetition || 0}</span>
                  <span>Aralık: {currentCard.interval || 1} gün</span>
                </div>
              </div>

              {/* Rating buttons */}
              {isFlipped && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { quality: 1, label: 'Unuttum', primary: false },
                    { quality: 3, label: 'Zor',     primary: false },
                    { quality: 4, label: 'İyi',     primary: false },
                    { quality: 5, label: 'Çok Kolay', primary: true },
                  ].map(({ quality, label, primary }) => (
                    <button
                      key={quality}
                      onClick={() => handleRating(quality)}
                      style={{
                        padding: '12px 0',
                        background: primary ? c.pill : c.cardBg,
                        color: primary ? c.pillText : c.text,
                        border: primary ? 'none' : `1px solid ${c.tagBorder}`,
                        borderRadius: 999,
                        fontWeight: primary ? 700 : 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          /* Collection Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Search size={14} color={c.textMuted} />
              </div>
              <input
                type="text"
                placeholder="Kelime deponuzda arayın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 10, paddingBottom: 10, background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 999, fontSize: 12, color: c.text, outline: 'none', boxSizing: 'border-box', fontFamily }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredWords.length === 0 && (
                <p style={{ textAlign: 'center', color: c.textMuted, fontSize: 13, padding: 40 }}>Kelime bulunamadı.</p>
              )}
              {filteredWords.map((item) => (
                <div key={item.id} style={{ padding: 16, background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.15s' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 15, color: c.text, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      {item.word}
                      <button onClick={() => speakWord(item.word)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex', padding: 0 }}>
                        <Volume2 size={13} />
                      </button>
                    </h4>
                    <p style={{ fontSize: 12, color: c.textSub }}>{item.translation}</p>
                    <p style={{ fontSize: 11, fontStyle: 'italic', color: c.textHint, marginTop: 4 }}>"{item.sentence}"</p>
                    {item.sentenceTranslation && (
                      <p style={{ fontSize: 11, fontStyle: 'italic', color: c.textDim, marginTop: 2 }}>"{item.sentenceTranslation}"</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteWord(item.id, item.word)} style={{ padding: 8, color: c.textMuted, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${c.headerBorder}`, padding: '24px 0', textAlign: 'center', fontSize: 11, color: c.textHint, fontWeight: 500 }}>
        SubMatch · Universal Subtitle Language Learning Companion
      </footer>
    </div>
  );
}
