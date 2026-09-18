using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class ImageResizer {
    public static void ConvertUserLogo() {
        string srcPath = @"C:\Users\resul\.gemini\antigravity\brain\33c96a6c-e608-4938-adda-3f1391570287\.user_uploaded\media_1789412670724.png";
        Resize(srcPath, 16, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon16.png");
        Resize(srcPath, 48, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon48.png");
        Resize(srcPath, 128, @"C:\Users\resul\.gemini\antigravity\scratch\submatch\extension\icons\icon128.png");
    }

    private static void Resize(string srcPath, int size, string outPath) {
        using (Image img = Image.FromFile(srcPath))
        using (Bitmap bmp = new Bitmap(size, size))
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.DrawImage(img, 0, 0, size, size);
            bmp.Save(outPath, ImageFormat.Png);
        }
    }
}
