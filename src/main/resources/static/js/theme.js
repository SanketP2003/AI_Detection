(function() {
  const STORAGE_KEY = 'aiinsight-theme';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggles = document.querySelectorAll('[data-theme-toggle]');
    toggles.forEach(btn => {
      btn.setAttribute('aria-pressed', theme !== 'light');
      const label = theme === 'light' ? 'Switch to Dark' : 'Switch to Light';
      btn.title = label;
      const textSpan = btn.querySelector('.theme-toggle__text');
      if (textSpan) textSpan.textContent = theme === 'light' ? 'Light' : 'Dark';
      const icon = btn.querySelector('.theme-toggle__icon');
      if (icon) {
        icon.textContent = theme === 'light' ? '☀️' : '🌙';
      }
    });
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'dark');
    applyTheme(theme);

    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-theme-toggle]');
      if (!target) return;
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
