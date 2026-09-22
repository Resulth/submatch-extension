import io

with io.open('store-screenshots.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix git conflict markers
content = content.replace('<<<<<<< HEAD\n</html>\n=======\n</html>\n>>>>>>> 8318fc79fd72eddbe1a3812520da2cf885b50902\n', '</html>\n')

# Add sentence translations to Slide 2 dict-items
# Serendipity
old_s1 = '<div class="dict-sentence">"Finding this cozy cafe was pure serendipity during our rainy walk."</div>\n                        </div>'
new_s1 = '<div class="dict-sentence">"Finding this cozy cafe was pure serendipity during our rainy walk."</div>\n                            <div class="dict-sentence" style="color:#666; margin-top:2px;">"Yağmurlu yürüyüşümüz sırasında bu şirin kafeyi bulmak tamamen tesadüfi bir mutlu keşifti."</div>\n                        </div>'
content = content.replace(old_s1, new_s1)

# Inevitable
old_s2 = '<div class="dict-sentence">"Change is inevitable in life, so we must adapt."</div>\n                        </div>'
new_s2 = '<div class="dict-sentence">"Change is inevitable in life, so we must adapt."</div>\n                            <div class="dict-sentence" style="color:#666; margin-top:2px;">"Hayatta değişim kaçınılmazdır, bu yüzden uyum sağlamalıyız."</div>\n                        </div>'
content = content.replace(old_s2, new_s2)

# Resilience
old_s3 = '<div class="dict-sentence">"The team showed great resilience despite losing their best player."</div>\n                        </div>'
new_s3 = '<div class="dict-sentence">"The team showed great resilience despite losing their best player."</div>\n                            <div class="dict-sentence" style="color:#666; margin-top:2px;">"Takım, en iyi oyuncusunu kaybetmesine rağmen büyük bir direnç gösterdi."</div>\n                        </div>'
content = content.replace(old_s3, new_s3)

with io.open('store-screenshots.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("store-screenshots.html patched OK")
