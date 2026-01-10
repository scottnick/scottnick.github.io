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

  function initRecentUpdates() {
    const list = document.getElementById('recent-updates');
    if (!list) return;

    const repo = list.dataset.repo;
    if (!repo) return;

    fetch(`https://api.github.com/repos/${repo}/commits?per_page=3`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load updates');
        }
        return response.json();
      })
      .then((commits) => {
        if (!Array.isArray(commits) || commits.length === 0) {
          list.innerHTML = '<li>目前沒有可顯示的更新。</li>';
          return;
        }

        const formatter = new Intl.DateTimeFormat('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        list.innerHTML = commits
          .map((commit) => {
            const message = commit?.commit?.message?.split('\n')[0] || '更新內容';
            const date = commit?.commit?.author?.date
              ? formatter.format(new Date(commit.commit.author.date))
              : '日期未知';
            return `
              <li>
                <strong>${date}</strong> — 更新：${message}<br>
                <small>最新更新資訊</small>
              </li>
            `;
          })
          .join('');
      })
      .catch(() => {
        list.innerHTML = '<li>更新載入失敗，請稍後再試。</li>';
      });
  }

  function initArticleToc() {
    const toc = document.querySelector('.article-toc');
    if (!toc) return;

    const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
    const targets = links
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!targets.length) return;

    function setActive(id) {
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    targets.forEach((section) => observer.observe(section));

    if (targets[0]) {
      setActive(targets[0].id);
    }
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
    initRecentUpdates();
    initArticleToc();
    setActiveNav();
  });
})();
