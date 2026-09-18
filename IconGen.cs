using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class IconGenerator {
    public static void Generate() {
        MakeIcon(16, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon16.png");
        MakeIcon(48, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon48.png");
        MakeIcon(128, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon128.png");
    }

    private static void MakeIcon(int size, string path) {
        using (Bitmap bmp = new Bitmap(size, size))
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.Clear(Color.FromArgb(33, 33, 33)); // Kömür Siyahı Arka Plan
            
            int pad = Math.Max(2, size / 6);
            using (Pen pen = new Pen(Color.FromArgb(241, 241, 241), Math.Max(1, size / 10))) {
                g.DrawRectangle(pen, pad, pad, size - (pad * 2), size - (pad * 2));
            }
            
            using (Brush b = new SolidBrush(Color.FromArgb(241, 241, 241))) {
                g.FillRectangle(b, size / 3, size / 2 - 1, size / 3, Math.Max(1, size / 8));
            }
            bmp.Save(path, ImageFormat.Png);
        }
    }
}
