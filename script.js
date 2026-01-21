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

  async function updateAccordionCounts() {
    const repo = document.body?.dataset.countRepo || 'scottnick/scottnick.github.io';
    const contents = Array.from(document.querySelectorAll('.accordion__content[data-count-id]'));

    await Promise.all(
      contents.map(async (content) => {
        const id = content.dataset.countId;
        const selector = content.dataset.countSelector || 'a, li';
        const target = document.querySelector(`.accordion__count[data-count-for="${id}"]`);
        if (!target) return;

        const path = content.dataset.countPath;
        if (path) {
          try {
            const response = await fetch(
              `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}`
            );
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data)) {
                const count = data.filter(
                  (item) =>
                    item.type === 'file' &&
                    item.name.endsWith('.html') &&
                    item.name !== 'index.html'
                ).length;
                target.textContent = count.toString();
                return;
              }
            }
          } catch (error) {
            console.warn('Failed to load GitHub counts', error);
          }
        }

        const count = content.querySelectorAll(selector).length;
        target.textContent = count.toString();
      })
    );
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


  function setActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((link) => {
      if (link.getAttribute('href') === path) {
        link.classList.add('active');
      }
    });
  }

  function initCodeHighlighting() {
    const codeBlocks = document.querySelectorAll('pre code');
    if (!codeBlocks.length) return;

    function loadOnce(tag, attrs) {
      return new Promise((resolve, reject) => {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
          el[key] = value;
        });
        el.onload = resolve;
        el.onerror = reject;
        document.head.appendChild(el);
      });
    }

    if (window.__hljs_loaded__) {
      window.hljs?.highlightAll?.();
      window.hljs?.initLineNumbersOnLoad?.();
      return;
    }
    window.__hljs_loaded__ = true;

    const cssHref =
      'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';

    Promise.resolve()
      .then(() => loadOnce('link', { rel: 'stylesheet', href: cssHref }))
      .then(() =>
        loadOnce('script', {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
          defer: true,
        })
      )
      .then(() =>
        loadOnce('script', {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/cpp.min.js',
          defer: true,
        })
      )
      .then(() =>
        loadOnce('script', {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/highlightjs-line-numbers.js/2.8.0/highlightjs-line-numbers.min.js',
          defer: true,
        })
      )
      .then(() => {
        window.hljs.highlightAll();
        window.hljs.initLineNumbersOnLoad();
      })
      .catch(() => {});
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
    setActiveNav();
    initCodeHighlighting();
  });
})();
