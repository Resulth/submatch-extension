import io
import re

with io.open('web/src/App.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Use regex to match and replace, ignoring exact whitespace differences
old_pattern = re.compile(r'\{\s*currentCard\.contextExplanation && \(\s*<div className="bg-\[#242424\] border border-\[#383838\] p-3\.5 rounded-xl">\s*<span className="text-\[10px\] font-semibold text-\[#AAAAAA\] block mb-1">Cümle Bağlamı</span>\s*<p className="text-xs text-\[#CCCCCC\] leading-relaxed">\{currentCard\.contextExplanation\}</p>\s*</div>\s*\)\s*\}')

new_content = '''{currentCard.sentenceTranslation && (
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
                      )}'''

c = old_pattern.sub(new_content, c)

with io.open('web/src/App.jsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
