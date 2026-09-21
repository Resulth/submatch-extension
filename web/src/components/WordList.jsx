import React, { useState } from 'react';
import { Search, Trash2, Volume2, Calendar, Sparkles } from 'lucide-react';

export default function WordList({ words, onDeleteWord }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWords = words.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sentence.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Arama Barı */}
      <div className="relative mb-6">
        <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 -translate-y-[3px]" />
        </div>
        <input
          type="text"
          placeholder="Kaydedilen kelimelerde veya cümlelerde ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-400 outline-none transition shadow-lg"
        />
      </div>

      {/* Kelime Kartları Izgarası */}
      {filteredWords.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/40">
          <p className="text-slate-400 text-base">Aranan kelime bulunamadı veya kelime deponuz henüz boş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map((item) => (
            <div 
              key={item.id}
              className="bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-blue-400 flex items-center gap-2">
                      {item.word}
                      <button 
                        onClick={() => speakWord(item.word)}
                        className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-blue-300 transition cursor-pointer"
                        title="Sesli Oku"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </h3>
                    <span className="text-sm font-semibold text-emerald-400">{item.translation}</span>
                  </div>
                  <button
                    onClick={() => onDeleteWord(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title="Kelimeyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30 text-xs text-slate-300 italic">
                    "{item.sentence}"
                  </div>

                  {item.contextExplanation && (
                    <p className="text-xs text-slate-400 flex items-start gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{item.contextExplanation}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-700/40">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Gelecek Tekrar: <strong className="text-slate-200">{item.dueDate || 'Bugün'}</strong>
                </span>
                <span>Tekrar: <strong className="text-slate-200">{item.repetition || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
