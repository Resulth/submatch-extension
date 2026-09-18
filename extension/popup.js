document.addEventListener('DOMContentLoaded', () => {
  const openWebBtn = document.getElementById('openWebBtn');

  if (openWebBtn) {
    openWebBtn.addEventListener('click', () => {
      // Doğrudan Chrome Eklentisi içindeki dahili dashboard sayfasını yeni sekmede aç
      const dashboardUrl = chrome.runtime.getURL('dashboard/index.html');
      chrome.tabs.create({ url: dashboardUrl });
    });
  }
});
