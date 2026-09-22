import io

with io.open('web/src/App.jsx', 'r', encoding='utf-8') as f:
    app = f.read()

# Add sentence translation below the English sentence in the word list cards
old_card = '''                    <p className="text-xs text-[#CCCCCC]">{item.translation}</p>
                    <p className="text-[11px] italic text-[#888888] mt-1">"{item.sentence}"</p>
                  </div>'''

new_card = '''                    <p className="text-xs text-[#CCCCCC]">{item.translation}</p>
                    <p className="text-[11px] italic text-[#888888] mt-1">"{item.sentence}"</p>
                    {item.sentenceTranslation && (
                      <p className="text-[11px] italic text-[#666666] mt-0.5">"{item.sentenceTranslation}"</p>
                    )}
                  </div>'''

app = app.replace(old_card, new_card)

with io.open('web/src/App.jsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(app)

print("App.jsx - sentence translation in word list: OK")
