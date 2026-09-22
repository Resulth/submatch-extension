import io

with io.open('extension/dashboard/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('</head>', '  <script src="clean-url.js"></script>\n  </head>')

with io.open('extension/dashboard/index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(c)
