import io

# ── 3. popup.html — fix icon (star → cards/layers icon) ──
with io.open('extension/popup.html', 'r', encoding='utf-8') as f:
    popup = f.read()

old_icon = """    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>"""

# Use a "layers/cards" icon — two overlapping rectangles, represents flashcards
new_icon = """    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"/>
      <path d="M6 2h12a2 2 0 0 1 2 2v12" opacity="0.35"/>
    </svg>"""

popup = popup.replace(old_icon, new_icon)

with io.open('extension/popup.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(popup)

print("popup.html patched OK")

# ── 4. content.js — race condition fix: save button waits for sentenceTranslation ──
with io.open('extension/content.js', 'r', encoding='utf-8') as f:
    content = f.read()

# When save is pressed, if sentenceTranslation is already in currentPopupData use it;
# the currentPopupData is kept in sync by the sentenceTranslationReady handler
# The fix is already there (currentPopupData.sentenceTranslation is updated), 
# but we need to read from currentPopupData at save time, not closure data
old_save_payload = """      wordData: {
        word: data.word,
        translation: data.translation,
        contextExplanation: data.contextExplanation || '',
        sentence,
        sentenceTranslation: data.sentenceTranslation || '',
        exampleSentence: data.exampleSentence || '',
      }"""

new_save_payload = """      wordData: {
        word: data.word,
        translation: data.translation,
        contextExplanation: data.contextExplanation || '',
        sentence,
        // Read from currentPopupData so we get sentenceTranslation even if it arrived async
        sentenceTranslation: (currentPopupData && currentPopupData.sentenceTranslation) || data.sentenceTranslation || '',
        exampleSentence: data.exampleSentence || '',
      }"""

content = content.replace(old_save_payload, new_save_payload)

with io.open('extension/content.js', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("content.js patched OK")
