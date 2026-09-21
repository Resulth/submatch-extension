import io

with io.open('extension/content.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("btn.textContent = '✓ Saved!';", "btn.innerHTML = '<span style=\"color: #10b981; font-weight: bold; margin-right: 4px;\">✓</span> Saved';")

with io.open('extension/content.js', 'w', encoding='utf-8', newline='') as f:
    f.write(js)
