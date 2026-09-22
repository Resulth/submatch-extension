import React, { useState, useEffect } from 'react';
import { Volume2, Check, RotateCw, Search, Trash2 } from 'lucide-react';
import { calculateSM2, INITIAL_DEMO_WORDS } from './utils/sm2';

export default function App() {
  const [activeTab, setActiveTab] = useState('study');
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['savedWords'], (result) => {
        if (result.savedWords && result.savedWords.length > 0) {
          setWords(result.savedWords);
        } else {
          setWords(INITIAL_DEMO_WORDS);
        }
      });
    } else {
      const local = localStorage.getItem('submatch_words');
      if (local) {
        setWords(JSON.parse(local));
      } else {
        setWords(INITIAL_DEMO_WORDS);
      }
    }
  };

  const saveWords = (newWords) => {
    setWords(newWords);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ savedWords: newWords });
    } else {
      localStorage.setItem('submatch_words', JSON.stringify(newWords));
    }
  };

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
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

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#F1F1F1] flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Universal Header */}
      <header className="border-b border-[#272727] bg-[#181818] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Attığın Görseldeki Kusursuz Oval (Squircle) İkon */}
            <div className="w-9 h-9 bg-[#242424] border border-[#383838] rounded-xl flex items-center justify-center p-2 shadow-md">
              <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-full h-full">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              SubMatch
            </h1>
          </div>

          <div className="flex gap-2 bg-[#242424] p-1 rounded-full border border-[#383838]">
            <button
              onClick={() => { setActiveTab('study'); setIsFlipped(false); }}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === 'study' ? 'bg-[#F1F1F1] text-[#0F0F0F] font-bold shadow-sm' : 'text-[#AAAAAA] hover:text-white'
              }`}
            >
              Kart Çalışması ({words.length})
            </button>
            <button
              onClick={() => { setActiveTab('list'); setIsFlipped(false); }}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                activeTab === 'list' ? 'bg-[#F1F1F1] text-[#0F0F0F] font-bold shadow-sm' : 'text-[#AAAAAA] hover:text-white'
              }`}
            >
              Kelime Deposu
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        {activeTab === 'study' ? (
          completed ? (
            <div className="text-center py-16 bg-[#181818] border border-[#303030] rounded-2xl p-8 shadow-2xl">
              <div className="w-12 h-12 bg-[#F1F1F1] text-[#0F0F0F] rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Tebrikler! Seans Tamamlandı</h2>
              <p className="text-[#AAAAAA] text-xs mb-6">Aralıklı tekrar algoritması kelime tekrar tarihlerinizi güncelledi.</p>
              <button
                onClick={() => { setCurrentIndex(0); setIsFlipped(false); setCompleted(false); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F1F1F1] hover:bg-[#D9D9D9] text-[#0F0F0F] font-semibold text-xs rounded-full transition cursor-pointer shadow-md"
              >
                <RotateCw className="w-4 h-4" /> Seansı Tekrar Başlat
              </button>
            </div>
          ) : words.length === 0 ? (
            <div className="text-center py-20 text-[#AAAAAA]">
              <p className="text-sm">Çalışılacak kelime bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex justify-between items-center text-xs text-[#AAAAAA] font-medium">
                <span>Kart {currentIndex + 1} / {words.length}</span>
                <span>Anki / SM-2 Algoritması</span>
              </div>

              {/* Mat Kömür Siyahı Kart (#181818) */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="bg-[#181818] border border-[#303030] hover:border-[#444444] rounded-2xl p-8 min-h-[340px] flex flex-col justify-between shadow-2xl cursor-pointer transition-all duration-200 relative overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-[#AAAAAA] px-3 py-1 bg-[#242424] rounded-full border border-[#383838]">
                    {isFlipped ? 'Çeviri ve Detaylar' : 'Hedef Kelime'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
                    className="p-2 bg-[#2A2A2A] hover:bg-[#383838] rounded-full text-[#F1F1F1] transition cursor-pointer"
                    title="Okunuşu Dinle"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {!isFlipped ? (
                  <div className="my-auto text-center py-4">
                    <h2 className="text-4xl font-bold text-white tracking-tight mb-4">
                      {currentCard.word}
                    </h2>
                    <div className="bg-[#242424] border border-[#383838] p-4 rounded-xl max-w-md mx-auto">
                      <p className="text-xs italic text-[#CCCCCC] leading-relaxed">
                        "{currentCard.sentence}"
                      </p>
                    </div>
                    <span className="inline-block mt-6 text-[11px] text-[#888888] font-medium animate-pulse">
                      Çeviriyi görmek için karta tıklayın
                    </span>
                  </div>
                ) : (
                  <div className="my-auto space-y-4 text-left py-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#AAAAAA]">Türkçe Çevirisi</span>
                      <h3 className="text-2xl font-bold text-white mt-0.5">{currentCard.translation}</h3>
                    </div>

                    {currentCard.sentenceTranslation && (
                        <div className="bg-[#242424] border border-[#383838] p-3.5 rounded-xl mb-3">
                          <span className="text-[10px] font-semibold text-[#AAAAAA] block mb-1">Cümle Çevirisi</span>
                          <p className="text-xs text-[#CCCCCC] leading-relaxed">{currentCard.sentenceTranslation}</p>
                        </div>
                      )}

                      {currentCard.contextExplanation && (
                        <div className="bg-[#242424] border border-[#383838] p-3.5 rounded-xl">
                          <span className="text-[10px] font-semibold text-[#AAAAAA] block mb-1">Bağlam / Açıklama</span>
                          <p className="text-xs text-[#CCCCCC] leading-relaxed">{currentCard.contextExplanation}</p>
                        </div>
                      )}
                  </div>
                )}

                <div className="text-[11px] text-[#888888] border-t border-[#303030] pt-3 flex justify-between">
                  <span>Tekrar Sayısı: {currentCard.repetition || 0}</span>
                  <span>Aralık: {currentCard.interval || 1} gün</span>
                </div>
              </div>

              {/* Mat Beyaz & Gri Pill Rating Buttons */}
              {isFlipped && (
                <div className="grid grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleRating(1)}
                    className="py-3 bg-[#181818] hover:bg-[#282828] border border-[#383838] rounded-full text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Unuttum
                  </button>
                  <button
                    onClick={() => handleRating(3)}
                    className="py-3 bg-[#181818] hover:bg-[#282828] border border-[#383838] rounded-full text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Zor
                  </button>
                  <button
                    onClick={() => handleRating(4)}
                    className="py-3 bg-[#181818] hover:bg-[#282828] border border-[#383838] rounded-full text-white font-semibold text-xs transition cursor-pointer"
                  >
                    İyi
                  </button>
                  <button
                    onClick={() => handleRating(5)}
                    className="py-3 bg-[#F1F1F1] hover:bg-[#D9D9D9] text-[#0F0F0F] rounded-full font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    Çok Kolay
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          /* Collection Tab */
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                <Search className="w-4 h-4 text-[#AAAAAA] -mt-[2px]" />
              </div>
              <input
                type="text"
                placeholder="Kelime deponuzda arayın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#181818] border border-[#303030] rounded-full text-xs text-white placeholder-[#AAAAAA] outline-none focus:border-[#555555] transition"
              />
            </div>

            <div className="space-y-2.5">
              {filteredWords.map((item) => (
                <div key={item.id} className="p-4 bg-[#181818] border border-[#303030] rounded-xl flex items-center justify-between hover:border-[#444444] transition">
                  <div>
                    <h4 className="font-bold text-base text-white flex items-center gap-2">
                      {item.word}
                      <button onClick={() => speakWord(item.word)} className="text-[#AAAAAA] hover:text-white">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </h4>
                    <p className="text-xs text-[#CCCCCC]">{item.translation}</p>
                    <p className="text-[11px] italic text-[#888888] mt-1">"{item.sentence}"</p>
                    {item.sentenceTranslation && (
                      <p className="text-[11px] italic text-[#666666] mt-0.5">"{item.sentenceTranslation}"</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteWord(item.id, item.word)} className="p-2 text-[#AAAAAA] hover:text-red-400 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#272727] py-6 text-center text-[11px] text-[#888888] font-medium">
        SubMatch &bull; Universal Subtitle Language Learning Companion
      </footer>
    </div>
  );
}
