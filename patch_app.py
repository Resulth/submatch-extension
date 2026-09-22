import io

# ── 2. App.jsx — fix isFlipped reset on tab change + delete confirmation ──
with io.open('web/src/App.jsx', 'r', encoding='utf-8') as f:
    app = f.read()

# Fix 1: Reset isFlipped when switching tabs
old_tab_study = "onClick={() => setActiveTab('study')}"
new_tab_study = "onClick={() => { setActiveTab('study'); setIsFlipped(false); }}"
app = app.replace(old_tab_study, new_tab_study)

old_tab_list = "onClick={() => setActiveTab('list')}"
new_tab_list = "onClick={() => { setActiveTab('list'); setIsFlipped(false); }}"
app = app.replace(old_tab_list, new_tab_list)

# Fix 2: Delete with confirmation toast (simple window.confirm for now)
old_delete = "const handleDeleteWord = (id) => {\n    const filtered = words.filter(w => w.id !== id);\n    saveWords(filtered);\n  };"
new_delete = """const handleDeleteWord = (id, word) => {
    if (!window.confirm(`"${word}" kelimesini silmek istediğinizden emin misiniz?`)) return;
    const filtered = words.filter(w => w.id !== id);
    saveWords(filtered);
  };"""
app = app.replace(old_delete, new_delete)

# Fix 3: Pass word to delete handler
old_delete_call = "onClick={() => handleDeleteWord(item.id)}"
new_delete_call = "onClick={() => handleDeleteWord(item.id, item.word)}"
app = app.replace(old_delete_call, new_delete_call)

with io.open('web/src/App.jsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(app)

print("App.jsx patched OK")
