/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algoritması
 * @param {number} quality 0 ile 5 arasında hatırlama puanı (0: Tamamen unuttum, 5: Çok kolay hatırladım)
 * @param {number} repetition Üst üste doğru hatırlama sayısı
 * @param {number} interval Önceki tekrar aralığı (gün)
 * @param {number} efactor Önceki zorluk faktörü (Easiness Factor)
 */
export function calculateSM2(quality, repetition = 0, interval = 1, efactor = 2.5) {
  let newRepetition = repetition;
  let newInterval = interval;
  let newEfactor = efactor;

  if (quality >= 3) {
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * efactor);
    }
    newRepetition = repetition + 1;
  } else {
    newRepetition = 0;
    newInterval = 1;
  }

  newEfactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEfactor < 1.3) {
    newEfactor = 1.3;
  }

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + newInterval);

  return {
    repetition: newRepetition,
    interval: newInterval,
    efactor: Number(newEfactor.toFixed(2)),
    dueDate: nextDueDate.toISOString().split('T')[0]
  };
}

// Örnek Demo Verileri (Eğer Chrome Storage boşsa veya tarayıcıdan doğrudan açıldıysa)
export const INITIAL_DEMO_WORDS = [
  {
    id: "1",
    word: "serendipity",
    translation: "tesadüfi mutlu keşif",
    contextExplanation: "Şans eseri değerli veya güzel şeylerin bulunması durumunu ifade eder.",
    sentence: "Finding this cozy cafe was pure serendipity during our rainy walk.",
    exampleSentence: "It was serendipity that brought the two old friends together.",
    savedAt: new Date().toISOString(),
    repetition: 0,
    interval: 1,
    efactor: 2.5,
    dueDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "2",
    word: "inevitable",
    translation: "kaçınılmaz",
    contextExplanation: "Engellenemez veya önlenemez bir şekilde gerçekleşecek olan durum.",
    sentence: "Change is inevitable in life, so we must adapt.",
    exampleSentence: "With all this rain, flooding was inevitable.",
    savedAt: new Date().toISOString(),
    repetition: 1,
    interval: 6,
    efactor: 2.4,
    dueDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "3",
    word: "resilience",
    translation: "direnç, toparlanma gücü",
    contextExplanation: "Zorlukların ardından hızlıca eski gücüne veya durumuna dönebilme yeteneği.",
    sentence: "The team showed great resilience despite losing their best player.",
    exampleSentence: "Her resilience helped her overcome severe illness.",
    savedAt: new Date().toISOString(),
    repetition: 2,
    interval: 15,
    efactor: 2.6,
    dueDate: "2026-09-20"
  }
];
