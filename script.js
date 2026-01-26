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

  function getNextLink(linkHeader) {
    if (!linkHeader) return null;
    const matches = linkHeader.split(',');
    for (const match of matches) {
      const nextMatch = match.match(/<([^>]+)>;\s*rel="next"/);
      if (nextMatch) {
        return nextMatch[1];
      }
    }
    return null;
  }

  async function fetchGithubHtmlCount(repo, path) {
    let url = `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}?per_page=100`;
    let total = 0;

    while (url) {
      const response = await fetch(url);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        return null;
      }
      total += data.filter(
        (item) => item.type === 'file' && item.name.endsWith('.html') && item.name !== 'index.html'
      ).length;
      url = getNextLink(response.headers.get('Link'));
    }

    return total;
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
            const count = await fetchGithubHtmlCount(repo, path);
            if (typeof count === 'number') {
              target.textContent = count.toString();
              return;
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

  function sortItems(list) {
    const items = [...list];

    if (sortMode === 'time') {
      items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    } else {
      items.sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'en', { sensitivity: 'base' })
      );
    }

    if (sortDir === 'desc') {
      items.reverse();
    }
    return items;
  }

  function updateCount(shown, total) {
    const countEl = document.getElementById('countInfo');
    if (!countEl) return;
    countEl.textContent = `顯示 ${shown} / ${total} 篇`;
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

  function getCategoryRepo() {
    return document.body?.dataset?.categoryRepo || 'scottnick/scottnick.github.io';
  }

  function applyScopeFilter(posts) {
    const prefixRaw = document.body?.dataset?.scopePrefix;
    if (!prefixRaw) return posts;

    const prefix1 = prefixRaw;
    const prefix2 = prefixRaw.replaceAll(' ', '%20');
    const prefix3 = prefixRaw.replaceAll('%20', ' ');

    return posts.filter((post) => {
      const url = post.url || '';
      return url.startsWith(prefix1) || url.startsWith(prefix2) || url.startsWith(prefix3);
    });
  }

  async function fetchRepoHtmlPosts() {
    const repo = getCategoryRepo();
    const treeUrl = `https://api.github.com/repos/${repo}/git/trees/main?recursive=1`;
    const response = await fetch(treeUrl);
    if (!response.ok) {
      throw new Error('Failed to load repo tree');
    }

    const data = await response.json();
    const paths = (data.tree || [])
      .filter(
        (item) =>
          item.type === 'blob' &&
          item.path.endsWith('.html') &&
          !item.path.endsWith('index.html') &&
          !item.path.endsWith('categories.html') &&
          !item.path.endsWith('category.html')
      )
      .map((item) => item.path);

    const posts = [];
    const parser = new DOMParser();
    const batchSize = 6;

    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);
      const batchPosts = await Promise.all(
        batch.map(async (path) => {
          const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${path}`;
          const htmlResponse = await fetch(rawUrl);
          if (!htmlResponse.ok) return null;
          const html = await htmlResponse.text();
          return parsePostFromHtml(html, path, parser);
        })
      );
      posts.push(...batchPosts.filter(Boolean));
    }

    return posts;
  }

  function parsePostFromHtml(html, path, parser) {
    const doc = parser.parseFromString(html, 'text/html');
    const title =
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      'Untitled';
    const date =
      doc.querySelector('.meta-field--date .meta-value')?.textContent?.trim() || '';
    const tags = Array.from(doc.querySelectorAll('.post-tag'))
      .map((tag) => tag.textContent.trim())
      .filter(Boolean);

    if (!tags.length) return null;

    return {
      title,
      date,
      tags,
      url: encodeURI(path),
    };
  }

  function buildCategoryIndex(posts) {
    return posts.reduce((acc, post) => {
      post.tags.forEach((tag) => {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push(post);
      });
      return acc;
    }, {});
  }

  function getCachedPosts() {
    const cacheKey = 'category-index-cache-v1';
    const ttl = 6 * 60 * 60 * 1000;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && cached.timestamp && Date.now() - cached.timestamp < ttl) {
        return cached.posts || null;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function setCachedPosts(posts) {
    const cacheKey = 'category-index-cache-v1';
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        posts,
      })
    );
  }

  async function getCategoryIndex() {
    const cached = getCachedPosts();
    if (cached) {
      return buildCategoryIndex(cached);
    }

    const posts = await fetchRepoHtmlPosts();
    setCachedPosts(posts);
    return buildCategoryIndex(posts);
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
      const categoryIndex = await getCategoryIndex();
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

      function render() {
        const query = normalize(searchInput?.value);
        let list = categoryItems.filter((item) => !query || normalize(item.title).includes(query));
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
      const categories = await getCategoryIndex();
      const scopedPosts = applyScopeFilter(categories[categoryName] || []);
      const searchInput = document.getElementById('searchInput');

      function render() {
        const query = normalize(searchInput?.value);
        let listItems = scopedPosts
          .filter((post) => !query || normalize(post.title).includes(query))
          .map((post) => ({
            title: post.title,
            date: post.date,
            url: post.url,
          }));

        listItems = sortItems(listItems);

        list.innerHTML = '';
        if (!listItems.length) {
          list.innerHTML = '<li class="category-meta-row">目前沒有相關文章。</li>';
          updateCount(0, scopedPosts.length);
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

        updateCount(listItems.length, scopedPosts.length);
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
    initRecentUpdates();
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
