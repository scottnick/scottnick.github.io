// script.js: 控管導覽列、深淺色模式與筆記目錄的互動，移除統計相關邏輯
(function () {
  const THEME_KEY = 'preferred-theme';
  const root = document.documentElement;

  function updateThemeIcon(theme) {
    document.querySelectorAll('#theme-icon').forEach((icon) => {
      icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    });
  }

  function updateThemeToggleState(theme) {
    const isDark = theme === 'dark';
    document.querySelectorAll('#theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-pressed', isDark.toString());
    });
  }

  function applyTheme(mode) {
    const theme = mode === 'dark' ? 'dark' : 'light';
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeIcon(theme);
    updateThemeToggleState(theme);
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

  async function initRecentUpdates() {
    const list = document.getElementById('recent-updates');
    if (!list) return;

    try {
      const siteIndex = await getSiteIndex();
      const posts = Array.isArray(siteIndex?.posts) ? siteIndex.posts : [];

      const dated = posts.filter((post) => post && post.path && post.title && post.date);
      dated.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const unique = [];
      const seen = new Set();
      for (const post of dated) {
        const key = post.title;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(post);
        if (unique.length >= 3) break;
      }

      if (!unique.length) {
        list.innerHTML = '<li>目前沒有可顯示的更新。</li>';
        return;
      }

      const formatter = new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      list.innerHTML = unique
        .map((post) => {
          const dateText = formatter.format(new Date(post.date));
          const tags = Array.isArray(post.tags) ? post.tags.slice(0, 3) : [];
          const tagText = tags.length ? ` · ${tags.join(' / ')}` : '';
          return `
            <li>
              <a href="${post.path}"><strong>${post.title}</strong></a><br>
              <small>${dateText}${tagText}</small>
            </li>
          `;
        })
        .join('');
    } catch (error) {
      list.innerHTML = '<li>更新載入失敗（請確認 site-index.json 存在）。</li>';
    }
  }

  function initHeroSlideshow() {
    const hero = document.querySelector('.hero.hero-cover');
    const layers = Array.from(document.querySelectorAll('.hero-bg'));
    if (!hero || layers.length === 0) return;

    const images = [
      'assets/hero-1.jpg',
      'assets/hero-2.jpg',
      'assets/hero-3.jpg',
    ];

    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    layers.forEach((layer, index) => {
      layer.style.backgroundImage = `url('${images[index % images.length]}')`;
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let currentIndex = 0;
    layers[currentIndex].classList.add('is-active');

    if (prefersReducedMotion) return;

    window.setInterval(() => {
      layers[currentIndex].classList.remove('is-active');
      currentIndex = (currentIndex + 1) % layers.length;
      layers[currentIndex].classList.add('is-active');
    }, 10000);
  }

  async function initTimeline() {
    const box = document.getElementById('timelineList');
    if (!box) return;

    try {
      const res = await fetch(`timeline.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch timeline.json');
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        box.innerHTML = '<div class="timeline-loading">目前沒有里程碑。</div>';
        return;
      }

      data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      box.innerHTML = data
        .slice(0, 6)
        .map(
          (item) => `
            <div class="timeline-item">
              <div class="timeline-date">${item.date || ''}</div>
              <div class="timeline-content">
                <div class="timeline-title">${item.title || ''}</div>
                <div class="timeline-desc">${item.desc || ''}</div>
                ${
                  item.link
                    ? `<a class="timeline-link" href="${item.link}">查看相關內容 →</a>`
                    : ''
                }
              </div>
            </div>
          `,
        )
        .join('');
    } catch (error) {
      box.innerHTML = '<div class="timeline-loading">里程碑載入失敗（請確認 timeline.json 路徑）。</div>';
    }
  }

  function safeJsonParse(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  const SITE_INDEX_URL = 'site-index.json';
  const SITE_INDEX_CACHE_KEY = 'site_index_cache_v1';

  async function getSiteIndex() {
    const cached = safeJsonParse(localStorage.getItem(SITE_INDEX_CACHE_KEY));

    try {
      const response = await fetch(`${SITE_INDEX_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${SITE_INDEX_URL}: ${response.status}`);
      }
      const data = await response.json();
      localStorage.setItem(SITE_INDEX_CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  }

  async function updateAccordionCounts() {
    const contents = Array.from(document.querySelectorAll('.accordion__content[data-count-id]'));
    if (!contents.length) return;

    let siteIndex = null;
    try {
      siteIndex = await getSiteIndex();
    } catch (error) {
      siteIndex = null;
    }

    contents.forEach((content) => {
      const id = content.dataset.countId;
      const target = document.querySelector(`.accordion__count[data-count-for="${id}"]`);
      if (!target) return;

      const path = content.dataset.countPath;
      if (path) {
        const countFromPosts = siteIndex?.posts
          ?.filter((post) => post.folder === path).length;
        if (typeof countFromPosts === 'number') {
          target.textContent = countFromPosts.toString();
          return;
        }

        if (siteIndex?.folderCounts) {
          const normalizedPath = path.replace(/\/+$/, '');
          const key = encodeURI(`${normalizedPath}/index.html`);
          const count = siteIndex.folderCounts[key];
          if (typeof count === 'number') {
            target.textContent = count.toString();
            return;
          }
        }
      }

      target.textContent = '0';
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

  let sortMode = 'time';
  let sortDir = 'desc';

  function initSortControls(renderFn) {
    const sortDirBtn = document.getElementById('sortDirBtn');
    const sortModeBtn = document.getElementById('sortModeBtn');
    if (!sortDirBtn || !sortModeBtn) return;

    const upSvg = `
      <svg class="sort-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const downSvg = `
      <svg class="sort-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    function syncUI() {
      sortDirBtn.innerHTML = sortDir === 'desc' ? downSvg : upSvg;
      sortModeBtn.textContent = sortMode === 'time' ? '依照時間' : '依照字母';
    }

    syncUI();

    sortDirBtn.addEventListener('click', () => {
      sortDir = sortDir === 'desc' ? 'asc' : 'desc';
      syncUI();
      renderFn();
    });

    sortModeBtn.addEventListener('click', () => {
      sortMode = sortMode === 'time' ? 'alpha' : 'time';
      syncUI();
      renderFn();
    });
  }

  function normalize(text) {
    return (text || '').toString().trim().toLowerCase();
  }

  function toSearchKey(text) {
    const s = normalize(text);
    return s.replace(/[^\p{L}\p{N}]+/gu, '');
  }

  function extractLeadingNumber(title) {
    const match = String(title || '').trim().match(/^(\d+)[\.\-]?\s*/);
    return match ? Number(match[1]) : null;
  }

  function sortItems(list) {
    const items = [...list];

    if (sortMode === 'time') {
      items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } else {
      items.sort((a, b) => {
        const numA = extractLeadingNumber(a.title);
        const numB = extractLeadingNumber(b.title);
        if (numA !== null && numB !== null && numA !== numB) {
          return numA - numB;
        }
        if (numA !== null && numB === null) return -1;
        if (numA === null && numB !== null) return 1;
        return (a.title || '').localeCompare(b.title || '', 'en', { sensitivity: 'base' });
      });
    }

    if (sortDir === 'desc') {
      items.reverse();
    }
    return items;
  }

  function updateCount(shown, total) {
    const countEl = document.getElementById('countInfo');
    if (!countEl) return;
    countEl.textContent = `已顯示 ${shown} / 共 ${total} 篇`;
  }

  function initFilterInputs() {
    const inputs = document.querySelectorAll('[data-filter-input]');
    if (!inputs.length) return;

    inputs.forEach((input) => {
      const targetSelector = input.dataset.filterTarget;
      if (!targetSelector) return;
      const countSelector = input.dataset.countDisplay;
      const countDisplay = countSelector ? document.querySelector(countSelector) : null;

      function update() {
        const items = Array.from(document.querySelectorAll(targetSelector));
        const total = items.length;
        const query = input.value.trim().toLowerCase();
        let visibleCount = 0;
        items.forEach((item) => {
          const text = (item.dataset.filterText || item.textContent || '').toLowerCase();
          const matches = !query || text.includes(query);
          item.style.display = matches ? '' : 'none';
          if (matches) {
            visibleCount += 1;
          }
        });

        if (countDisplay) {
          countDisplay.textContent = `Showing ${visibleCount} / ${total}`;
        }
      }

      input.addEventListener('input', update);
      update();
    });
  }

  function applyScopeFilter(posts) {
    const prefixRaw = document.body?.dataset?.scopePrefix;
    if (!prefixRaw) return posts;

    const prefix1 = prefixRaw;
    const prefix2 = prefixRaw.replaceAll(' ', '%20');
    const prefix3 = prefixRaw.replaceAll('%20', ' ');

    return posts.filter((post) => {
      const url = post.url || post.path || '';
      return url.startsWith(prefix1) || url.startsWith(prefix2) || url.startsWith(prefix3);
    });
  }

  function isAllProblemsArticle(path) {
    const normalized = (path || '').toLowerCase();
    return (
      normalized.includes('cpp-notes/all problems/') ||
      normalized.includes('cpp-notes/all%20problems/')
    );
  }

  function isCppNotesArticle(path) {
    return (path || '').toLowerCase().startsWith('cpp-notes/');
  }

  function isSiteArticle(path) {
    const normalized = (path || '').toLowerCase();
    if (normalized.includes('vendor/') || normalized.includes('assests/')) return false;
    return normalized.endsWith('.html');
  }

  function filterPostsForCategorySystem(posts) {
    return posts.filter((post) => {
      const url = post.path || post.url || '';
      if (!url) return false;
      if (isCppNotesArticle(url)) {
        return isAllProblemsArticle(url);
      }
      return true;
    });
  }

  async function getCategoryIndex(scope = 'all') {
    const siteIndex = await getSiteIndex();
    const scopedPosts = filterPostsForCategorySystem(siteIndex.posts || []);
    const categoryIndex = {};

    scopedPosts.forEach((post) => {
      const tags = Array.isArray(post.tags) ? post.tags : [];
      tags.forEach((tag) => {
        const key = tag || '';
        if (!key) return;
        if (!categoryIndex[key]) {
          categoryIndex[key] = [];
        }
        categoryIndex[key].push({
          title: post.title || '',
          date: post.date || '',
          url: post.path || '',
          tags,
        });
      });
    });

    return {
      builtAt: siteIndex.generatedAt || '',
      sha: siteIndex.buildId || '',
      index: categoryIndex,
    };
  }

  function getCategoryName() {
    const params = new URLSearchParams(window.location.search);
    return params.get('name')?.trim() || '';
  }

  function formatCategoryCount(count) {
    return `${count} 篇`;
  }

  async function initCategoriesPage() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    try {
      const categoryData = await getCategoryIndex();
      const siteIndex = await getSiteIndex();
      const scopedPosts = filterPostsForCategorySystem(siteIndex.posts || []);
      const allPosts = scopedPosts.map((post) => ({
        title: post.title || '',
        date: post.date || '',
        url: post.path || '',
        tags: Array.isArray(post.tags) ? post.tags : [],
      }));
      const categoryIndex = categoryData.index || {};
      const categoryItems = Object.entries(categoryIndex).map(([name, posts]) => {
        const latestDate = posts.reduce((latest, post) => {
          if (!post.date) return latest;
          if (!latest) return post.date;
          return post.date > latest ? post.date : latest;
        }, '');
        return {
          title: name,
          date: latestDate,
          count: posts.length,
        };
      });

      const searchInput = document.getElementById('searchInput');
      const relatedSection = document.getElementById('related-articles-section');
      const relatedList = document.getElementById('related-articles');
      const relatedCountInfo = document.getElementById('relatedCountInfo');

      function render() {
        const query = toSearchKey(searchInput?.value);
        let list = categoryItems.filter((item) => !query || toSearchKey(item.title).includes(query));
        list = sortItems(list);

        grid.innerHTML = '';
        list.forEach((item) => {
          const card = document.createElement('a');
          card.className = 'card category-card';
          card.href = `category.html?name=${encodeURIComponent(item.title)}`;
          card.dataset.filterText = item.title;

          const label = document.createElement('span');
          label.className = 'label';
          label.textContent = item.title;

          const meta = document.createElement('p');
          meta.className = 'card-meta';
          meta.textContent = formatCategoryCount(item.count);

          card.appendChild(label);
          card.appendChild(meta);
          grid.appendChild(card);
        });

        if (!relatedSection || !relatedList) return;

        if (!query) {
          relatedSection.classList.add('hidden');
          relatedList.innerHTML = '';
          if (relatedCountInfo) relatedCountInfo.textContent = '';
          return;
        }

        let related = allPosts.filter((post) => toSearchKey(post.title).includes(query));

        related = sortItems(
          related.map((post) => ({
            title: post.title,
            date: post.date,
            url: post.url,
          }))
        );

        const MAX_SHOW = 30;
        const shown = related.slice(0, MAX_SHOW);

        relatedSection.classList.remove('hidden');
        if (relatedCountInfo) {
          relatedCountInfo.textContent = `已顯示 ${shown.length} / 共 ${related.length} 篇`;
        }

        relatedList.innerHTML = '';
        if (!shown.length) {
          relatedList.innerHTML = '<li class="category-meta-row">目前沒有相關文章。</li>';
          return;
        }

        shown.forEach((post) => {
          const item = document.createElement('li');
          item.className = 'category-article';

          const date = document.createElement('span');
          date.className = 'category-article-date';
          date.textContent = post.date || '未標註日期';

          const link = document.createElement('a');
          link.href = post.url;
          link.textContent = post.title;

          item.appendChild(date);
          item.appendChild(link);
          relatedList.appendChild(item);
        });
      }

      searchInput?.addEventListener('input', render);
      initSortControls(render);
      render();
    } catch (error) {
      grid.innerHTML = '<p class="page-subtitle">類別載入失敗，請稍後再試。</p>';
    }
  }

  async function initCategoryPage() {
    const isCategoryPage = document.body?.dataset?.categoryPage;
    const list = document.getElementById('category-list');
    if (!isCategoryPage || !list) return;

    const categoryName = getCategoryName();
    const title = document.getElementById('category-title');
    if (title) {
      title.textContent = categoryName ? `類別 - ${categoryName}` : '類別';
    }
    document.title = categoryName ? `類別 - ${categoryName} | scottnick` : '類別 | scottnick';

    if (!categoryName) {
      list.innerHTML = '<li class="category-meta-row">尚未指定類別名稱。</li>';
      return;
    }

    try {
      const categoryData = await getCategoryIndex();
      const categories = categoryData.index || {};
      const scopedPosts = applyScopeFilter(categories[categoryName] || []);
      const searchInput = document.getElementById('searchInput');

      const totalAll = scopedPosts.length;

      function render() {
        const query = toSearchKey(searchInput?.value);
        let listItems = scopedPosts
          .filter((post) => !query || toSearchKey(post.title).includes(query))
          .map((post) => ({
            title: post.title,
            date: post.date,
            url: post.url,
          }));

        listItems = sortItems(listItems);

        list.innerHTML = '';
        if (!listItems.length) {
          list.innerHTML = '<li class="category-meta-row">目前沒有相關文章。</li>';
          updateCount(0, totalAll);
          return;
        }

        listItems.forEach((post) => {
          const item = document.createElement('li');
          item.className = 'category-article';
          item.dataset.filterText = post.title;

          const date = document.createElement('span');
          date.className = 'category-article-date';
          date.textContent = post.date || '未標註日期';

          const link = document.createElement('a');
          link.href = post.url;
          link.textContent = post.title;

          item.appendChild(date);
          item.appendChild(link);
          list.appendChild(item);
        });

        updateCount(listItems.length, totalAll);
      }

      searchInput?.addEventListener('input', render);
      initSortControls(render);
      render();
    } catch (error) {
      list.innerHTML = '<li class="category-meta-row">文章載入失敗，請稍後再試。</li>';
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
    initHeroSlideshow();
    initRecentUpdates();
    initTimeline();
    updateAccordionCounts();
    initArticleToc();
    initArticleTocToggle();
    initFilterInputs();
    initCategoriesPage();
    initCategoryPage();
    setActiveNav();
    initCodeHighlighting();
  });
})();
