// SubMatch popup — TR/EN + tema/font ayarları

// Dil sözlüğü (website ile ayni localStorage key: sm_website_lang)
const POPUP_STRINGS = {
  en: {
    desc: "Click any subtitle word while watching a video to translate and save it.",
    myCards: "My Flashcards",
    theme: "Theme", font: "Font", underline: "Underlines",
    sysOpt: "System", fontSysOpt: "System", darkOpt: "Dark", lightOpt: "Light",
    onOpt: "On", offOpt: "Off",
    hint: "Works on YouTube, Netflix, Disney+, Amazon Prime & more."
  },
  tr: {
    desc: "Video izlerken çeviri yapıp kaydetmek için altyazıdaki bir kelimeye tıklayın.",
    myCards: "Flashcard'larım",
    theme: "Tema", font: "Yazı Tipi", underline: "Alt Çizgiler",
    sysOpt: "Sistem", fontSysOpt: "Sistem", darkOpt: "Koyu", lightOpt: "Açık",
    onOpt: "Açık", offOpt: "Kapalı",
    hint: "YouTube, Netflix, Disney+, Amazon Prime ve daha fazlasında çalışır."
  }
};

function getPopupLang() {
  let l = null;
  try { l = localStorage.getItem("sm_website_lang"); } catch (e) {}
  if (l === "tr" || l === "en") return l;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.indexOf("tr") === 0 ? "tr" : "en";
}

function applyPopupLang(lang) {
  const d = POPUP_STRINGS[lang] || POPUP_STRINGS.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (d[k] != null) el.textContent = d[k];
  });
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-lang") === lang);
  });
  try { localStorage.setItem("sm_website_lang", lang); } catch (e) {}
  try { chrome.storage.local.set({ sm_website_lang: lang }); } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  const openWebBtn = document.getElementById("openWebBtn");
  if (openWebBtn) {
    openWebBtn.addEventListener("click", () => {
      const dashboardUrl = chrome.runtime.getURL("dashboard/index.html");
      chrome.tabs.create({ url: dashboardUrl });
    });
  }

  const themeSelect = document.getElementById("themeSelect");
  const fontSelect = document.getElementById("fontSelect");
  const underlineSelect = document.getElementById("underlineSelect");

  applyPopupLang(getPopupLang());
  document.querySelectorAll(".lang-btn").forEach(b => {
    b.addEventListener("click", () => applyPopupLang(b.getAttribute("data-lang")));
  });

  chrome.storage.local.get(["smTheme", "smFont", "smUnderline"], (res) => {
    themeSelect.value = res.smTheme || "auto";
    fontSelect.value = res.smFont || "system";
    underlineSelect.value = res.smUnderline || "on";
    applyTheme(themeSelect.value);
    applyFont(fontSelect.value);
  });

  themeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ smTheme: val });
    applyTheme(val);
  });
  fontSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ smFont: val });
    applyFont(val);
  });
  underlineSelect.addEventListener("change", (e) => {
    chrome.storage.local.set({ smUnderline: e.target.value });
  });

  function applyTheme(theme) {
    if (theme === "light" || (theme === "auto" && !window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }
  function applyFont(font) {
    if (font === "sans") document.body.style.fontFamily = "Arial, Helvetica, sans-serif";
    else if (font === "serif") document.body.style.fontFamily = "Georgia, serif";
    else if (font === "mono") document.body.style.fontFamily = "Consolas, monospace";
    else document.body.style.fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif";
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (themeSelect.value === "auto") applyTheme("auto");
  });
});