document.addEventListener('DOMContentLoaded', () => {
  const openWebBtn = document.getElementById('openWebBtn');
  if (openWebBtn) {
    openWebBtn.addEventListener('click', () => {
      const dashboardUrl = chrome.runtime.getURL('dashboard/index.html');
      chrome.tabs.create({ url: dashboardUrl });
    });
  }

  const themeSelect = document.getElementById('themeSelect');
  const fontSelect = document.getElementById('fontSelect');
  const underlineSelect = document.getElementById('underlineSelect');

  // Load settings
  chrome.storage.local.get(['smTheme', 'smFont', 'smUnderline'], (res) => {
    themeSelect.value = res.smTheme || 'auto';
    fontSelect.value = res.smFont || 'system';
    underlineSelect.value = res.smUnderline || 'on';
    
    applyTheme(themeSelect.value);
    applyFont(fontSelect.value);
  });

  // Listeners
  themeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ smTheme: val });
    applyTheme(val);
  });

  fontSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ smFont: val });
    applyFont(val);
  });

  underlineSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ smUnderline: e.target.value });
  });

  function applyTheme(theme) {
    if (theme === 'light' || (theme === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }
  
  function applyFont(font) {
    if (font === 'sans') {
      document.body.style.fontFamily = 'Arial, Helvetica, sans-serif';
    } else if (font === 'serif') {
      document.body.style.fontFamily = 'Georgia, "Times New Roman", serif';
    } else if (font === 'mono') {
      document.body.style.fontFamily = 'Consolas, monospace';
    } else {
      document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    }
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (themeSelect.value === 'auto') {
      applyTheme('auto');
    }
  });
});
