using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class SquircleGen {
    public static void Generate() {
        Make(16, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon16.png");
        Make(48, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon48.png");
        Make(128, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon128.png");
    }

    private static void Make(int size, string path) {
        using (Bitmap bmp = new Bitmap(size, size))
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.Clear(Color.Transparent);

            // Kömür siyahı oval/squircle arka plan kutusu (#242424)
            int radius = size / 4;
            using (GraphicsPath p = new GraphicsPath()) {
                p.AddArc(0, 0, radius * 2, radius * 2, 180, 90);
                p.AddArc(size - radius * 2, 0, radius * 2, radius * 2, 270, 90);
                p.AddArc(size - radius * 2, size - radius * 2, radius * 2, radius * 2, 0, 90);
                p.AddArc(0, size - radius * 2, radius * 2, radius * 2, 90, 90);
                p.CloseFigure();
                using (SolidBrush bg = new SolidBrush(Color.FromArgb(36, 36, 36))) {
                    g.FillPath(bg, p);
                }
            }

            // İçteki beyaz yuvarlatılmış konuşma balonu
            int bx = size * 28 / 100;
            int by = size * 26 / 100;
            int bw = size * 44 / 100;
            int bh = size * 36 / 100;
            int br = size * 8 / 100;

            using (GraphicsPath bp = new GraphicsPath()) {
                bp.AddArc(bx, by, br * 2, br * 2, 180, 90);
                bp.AddArc(bx + bw - br * 2, by, br * 2, br * 2, 270, 90);
                bp.AddArc(bx + bw - br * 2, by + bh - br * 2, br * 2, br * 2, 0, 90);
                bp.AddArc(bx, by + bh - br * 2, br * 2, br * 2, 90, 90);
                bp.CloseFigure();
                
                using (SolidBrush wb = new SolidBrush(Color.White)) {
                    g.FillPath(wb, bp);
                    // Sol alt konuşma balonu kuyruğu
                    PointF[] tail = new PointF[] {
                        new PointF(bx + size * 2 / 100, by + bh - size * 4 / 100),
                        new PointF(bx - size * 2 / 100, by + bh + size * 10 / 100),
                        new PointF(bx + size * 16 / 100, by + bh - size * 2 / 100)
                    };
                    g.FillPolygon(wb, tail);
                }
            }

            bmp.Save(path, ImageFormat.Png);
        }
    }
}
