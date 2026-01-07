// script.js: 控管導覽列、深淺色模式與筆記目錄的互動，移除統計相關邏輯
(function () {
  const THEME_KEY = 'preferred-theme';
  const root = document.documentElement;

  function updateThemeIcon(theme) {
    document.querySelectorAll('#theme-icon').forEach((icon) => {
      icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    });
  }

  function applyTheme(mode) {
    const theme = mode === 'dark' ? 'dark' : 'light';
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeIcon(theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  function initThemeToggle() {
    const toggleButtons = document.querySelectorAll('#theme-toggle');
    if (!toggleButtons.length) return;

    toggleButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        applyTheme(isDark ? 'light' : 'dark');
        btn.setAttribute('aria-pressed', (!isDark).toString());
      });
    });
  }

  function initNavToggle() {
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');
    if (!menuBtn || !navLinks) return;
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const expanded = navLinks.classList.contains('open');
      menuBtn.setAttribute('aria-expanded', expanded.toString());
    });
  }

  function initNoteTocToggle() {
    const tocToggle = document.getElementById('toc-toggle');
    const sidebar = document.getElementById('note-sidebar');
    if (!tocToggle || !sidebar) return;

    tocToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      tocToggle.setAttribute('aria-expanded', sidebar.classList.contains('open').toString());
    });

    sidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('open');
        tocToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((link) => {
      if (link.getAttribute('href') === path) {
        link.classList.add('active');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initThemeToggle();
    initNavToggle();
    initNoteTocToggle();
    setActiveNav();
  });
})();
