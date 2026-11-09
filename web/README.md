# SubMatch Web

SubMatch uygulamasının React tabanlı web arayüzünü içerir. Bu arayüz, kaydedilen kelimeleri görüntüler, arar, düzenler ve SM-2 algoritması ile aralıklı tekrar için hazır hale getirir.

## Özellikler

- Kelime listesi ve arama
- Flashcard çalışma ekranı
- SM-2 aralıklı tekrar bilgileri
- Tema desteği (dark/light)
- Chrome eklentisi verisi ile senkronize çalışma

## Geliştirme

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Proje yapısı

- `src/App.jsx`: Ana arayüz ve state yönetimi
- `src/components/FlashcardStudy.jsx`: Flashcard çalışma ekranı
- `src/utils/sm2.js`: SM-2 tekrar algoritması ve örnek veri seti

## Notlar

Bu web arayüzü, extension tarafında toplanan kelime verilerini göstermek ve öğrenme sürecini yürütmek için tasarlanmıştır. Çalışan uygulama, extension ile aynı `chrome.storage.local` verisini okuyabilir ve bunun üzerine çalışır.

