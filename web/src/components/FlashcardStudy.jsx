import React, { useState } from 'react';
import { Volume2, Check, RotateCw, Sparkles, BookOpen } from 'lucide-react';
import { calculateSM2 } from '../utils/sm2';

export default function FlashcardStudy({ words, onUpdateWord }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!words || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60 max-w-md mx-auto my-12">
        <BookOpen className="w-16 h-16 text-blue-400 mb-4 opacity-75" />
        <h3 className="text-xl font-bold text-slate-200 mb-2">Çalışılacak Kelime Bulunamaz</h3>
        <p className="text-slate-400 text-sm mb-6">
          Henüz Chrome eklentisi ile kelime kaydetmediniz veya çalışma Listeniz boş.
        </p>
      </div>
    );
  }

  const currentCard = words[currentIndex];

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRating = (quality) => {
    const sm2Result = calculateSM2(quality, currentCard.repetition, currentCard.interval, currentCard.efactor);
    
    const updatedCard = {
      ...currentCard,
      ...sm2Result
    };

    onUpdateWord(updatedCard);

    if (currentIndex + 1 < words.length) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-800/60 rounded-2xl border border-slate-700/80 max-w-lg mx-auto my-12 backdrop-blur-md shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
          <Check className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-100 mb-2">Harika İş! 🎉</h3>
        <p className="text-slate-300 text-base mb-6">
          Bugünkü tüm kelime çalışma seansını başarıyla tamamladınız. Aralıklı tekrar algoritması kelimelerinizi bir sonraki unutma eşiğinizde tekrar karşınıza çıkaracak.
        </p>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/25 cursor-pointer"
        >
          <RotateCw className="w-5 h-5" />
          Seansı Tekrar Başlat
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 px-4">
      {/* İlerleme Çubuğu */}
      <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-400">
        <span>Kart {currentIndex + 1} / {words.length}</span>
        <span>Aralıklı Tekrar (SM-2)</span>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* Flashcard Kutusu */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer min-h-[340px] bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 rounded-3xl p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden backdrop-blur-md"
      >
        <div className="flex justify-between items-start">
          <span className="text-xs uppercase tracking-wider px-3 py-1 bg-slate-700/60 text-slate-300 rounded-full font-medium">
            {isFlipped ? 'Çeviri & Anlam' : 'Kelime & Bağlam'}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
            className="p-2.5 bg-slate-700/50 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 rounded-full transition cursor-pointer"
            title="Okunuşu Dinle"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Kart Ön Yüzü */}
        {!isFlipped ? (
          <div className="my-auto text-center">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 mb-6 tracking-wide">
              {currentCard.word}
            </h2>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40 text-left">
              <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Orijinal Cümle:</p>
              <p className="text-sm text-slate-200 italic leading-relaxed">
                "{currentCard.sentence}"
              </p>
              {currentCard.sentenceTranslation && currentCard.sentenceTranslation.toLowerCase() !== currentCard.sentence?.toLowerCase() && (
                <p className="text-xs text-slate-500 italic leading-relaxed mt-2">
                  {currentCard.sentenceTranslation}
                </p>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-6 animate-pulse font-medium">
              💡 Çeviriyi ve detayları görmek için karta tıkla
            </p>
          </div>
        ) : (
          /* Kart Arka Yüzü */
          <div className="my-auto text-left space-y-4">
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Çeviri</span>
              <h3 className="text-2xl font-extrabold text-emerald-300">{currentCard.translation}</h3>
            </div>
            
            {currentCard.contextExplanation && (
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/40">
                <p className="text-xs text-blue-400 font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Bağlamsal Açıklama (AI)
                </p>
                <p className="text-sm text-slate-300">{currentCard.contextExplanation}</p>
              </div>
            )}

            {currentCard.exampleSentence && (
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Örnek Cümle</span>
                <p className="text-xs text-slate-300 italic mt-0.5">"{currentCard.exampleSentence}"</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-xs text-slate-400 border-t border-slate-700/40 pt-3">
          Tekrar Sayısı: <span className="text-slate-200 font-bold">{currentCard.repetition || 0}</span> | 
          Aralık: <span className="text-slate-200 font-bold">{currentCard.interval || 1} gün</span>
        </div>
      </div>

      {/* Puanlama Butonları (Sadece kart çevrildiğinde aktif) */}
      {isFlipped ? (
        <div className="grid grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => handleRating(1)}
            className="flex flex-col items-center py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl transition cursor-pointer"
          >
            <span className="font-bold text-sm">Unuttum</span>
            <span className="text-[10px] opacity-75">1 Gün</span>
          </button>
          <button
            onClick={() => handleRating(3)}
            className="flex flex-col items-center py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl transition cursor-pointer"
          >
            <span className="font-bold text-sm">Zor</span>
            <span className="text-[10px] opacity-75">Gör</span>
          </button>
          <button
            onClick={() => handleRating(4)}
            className="flex flex-col items-center py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl transition cursor-pointer"
          >
            <span className="font-bold text-sm">İyi</span>
            <span className="text-[10px] opacity-75">Standart</span>
          </button>
          <button
            onClick={() => handleRating(5)}
            className="flex flex-col items-center py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl transition cursor-pointer"
          >
            <span className="font-bold text-sm">Çok Kolay</span>
            <span className="text-[10px] opacity-75">Uzat</span>
          </button>
        </div>
      ) : (
        <div className="text-center mt-6 text-xs text-slate-400">
          Değerlendirmek için önce kartı çeviriniz
        </div>
      )}
    </div>
  );
}
