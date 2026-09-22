import io

# ── 5. website index.html — fix og:image ──
with io.open('../submatch-website/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix og:image to use the actual logo hosted on the site
old_og = '<meta property="og:image" content="https://chromewebstore.google.com/detail/conpjkfgnmeklfcpehkdpggejikdblma">'
new_og = '<meta property="og:image" content="https://submatch-website.vercel.app/logo.png">\n    <meta property="og:url" content="https://submatch-website.vercel.app/">'
html = html.replace(old_og, new_og)

# Fix twitter:card to summary_large_image for better social previews
html = html.replace(
    '<meta name="twitter:card" content="summary">',
    '<meta name="twitter:card" content="summary_large_image">'
)

with io.open('../submatch-website/index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(html)

print("index.html (website) patched OK")
