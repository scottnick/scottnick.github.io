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

  function updateAccordionCounts() {
    document.querySelectorAll('.accordion__content[data-count-id]').forEach((content) => {
      const id = content.dataset.countId;
      const count = content.querySelectorAll('a, li').length;
      const target = document.querySelector(`.accordion__count[data-count-for="${id}"]`);
      if (target) {
        target.textContent = count.toString();
      }
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

    let isClickScrolling = false;

    function activateFromScroll() {
      if (isClickScrolling) return;
      const offset = 120;
      const current = targets
        .map((section) => ({
          id: section.id,
          top: section.getBoundingClientRect().top,
        }))
        .filter((section) => section.top <= offset)
        .sort((a, b) => b.top - a.top)[0];

      if (current) {
        setActive(current.id);
      } else if (targets[0]) {
        setActive(targets[0].id);
      }
    }

    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        isClickScrolling = true;
        setActive(target.id);
        const top = target.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top, behavior: 'smooth' });
        window.setTimeout(() => {
          isClickScrolling = false;
          activateFromScroll();
        }, 400);
      });
    });

    window.addEventListener('scroll', activateFromScroll, { passive: true });
    activateFromScroll();
  }

  function initArticleTocToggle() {
    const toggle = document.getElementById('article-toc-toggle');
    const toc = document.querySelector('.article-toc');
    if (!toggle || !toc) return;

    toggle.addEventListener('click', () => {
      toc.classList.toggle('open');
      const expanded = toc.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded.toString());
    });

    toc.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        toc.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initArticleTocSticky() {
    const toc = document.querySelector('.article-toc');
    const layout = document.querySelector('.article-layout');
    if (!toc || !layout) return;

    const desktopQuery = window.matchMedia('(min-width: 1100px)');
    let startY = 0;

    function readNumberVar(el, name, fallback) {
      const v = getComputedStyle(el).getPropertyValue(name).trim();
      const n = Number.parseFloat(v);
      return Number.isNaN(n) ? fallback : n;
    }

    function recalc() {
      const fixedTop = readNumberVar(toc, '--toc-fixed-top', 120);
      const layoutTop = layout.getBoundingClientRect().top + window.scrollY;
      startY = layoutTop + fixedTop;

      const gap = readNumberVar(toc, '--toc-gap', 20);
      const tocW = toc.getBoundingClientRect().width;
      const layoutLeft = layout.getBoundingClientRect().left;

      toc.style.setProperty('--toc-left', `${layoutLeft - tocW - gap}px`);
    }

    function update() {
      if (!desktopQuery.matches) {
        toc.classList.remove('is-fixed');
        toc.style.removeProperty('--toc-left');
        return;
      }
      toc.classList.toggle('is-fixed', window.scrollY >= startY);
    }

    recalc();
    update();

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => {
      recalc();
      update();
    });
    desktopQuery.addEventListener('change', () => {
      recalc();
      update();
    });
  }

  function initBackToTop() {
    const button = document.querySelector('.back-to-top');
    if (!button) return;

    function toggleVisibility() {
      const shouldShow = window.scrollY > 240;
      button.classList.toggle('is-visible', shouldShow);
    }

    function positionButton() {
      const article = document.querySelector('.article-content, .article-box');
      const rect = article?.getBoundingClientRect();

      if (!rect) {
        button.style.left = '';
        button.style.right = '24px';
        return;
      }

      const preferredLeft = rect.right - button.offsetWidth - 16;
      const minLeft = 16;
      const maxLeft = window.innerWidth - button.offsetWidth - 16;
      const clampedLeft = Math.min(Math.max(preferredLeft, minLeft), maxLeft);
      button.style.left = `${clampedLeft}px`;
      button.style.right = '';
    }

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('resize', positionButton);
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
    positionButton();
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
    updateAccordionCounts();
    initArticleToc();
    initArticleTocToggle();
    initArticleTocSticky();
    initBackToTop();
    setActiveNav();
  });
})();
