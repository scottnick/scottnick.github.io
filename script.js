// script.js: 控管導覽列、深淺色模式及統計數的邏輯，若要更換追蹤或動畫可在此調整
const GOATCOUNTER_SITE = 'YOUR_GOATCOUNTER_SITE'; // 替換成你的 GoatCounter site slug（例如 mysite）

function setTheme(mode) {
  document.body.classList.toggle('dark-mode', mode === 'dark');
  localStorage.setItem('preferred-theme', mode);
  const toggleIcon = document.getElementById('theme-icon');
  const toggleText = document.getElementById('theme-text');
  if (toggleIcon) toggleIcon.textContent = mode === 'dark' ? '🌙' : '☀️';
  if (toggleText) toggleText.textContent = mode === 'dark' ? '深色' : '淺色';
}

function initTheme() {
  const saved = localStorage.getItem('preferred-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = saved || (systemPrefersDark ? 'dark' : 'light');
  setTheme(mode);
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  setTheme(isDark ? 'light' : 'dark');
}

function initNavToggle() {
  const menuBtn = document.getElementById('menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (!menuBtn || !navLinks) return;
  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
}

async function updateTotalViews() {
  const el = document.getElementById('gc-total');
  if (!el) return;

  try {
    // v1.3：首頁 footer 總瀏覽次數與聯絡資訊
    const goatScript = document.querySelector('script[data-goatcounter]');
    const base = goatScript?.getAttribute('data-goatcounter');
    if (!base) throw new Error('no-goatcounter');

    const apiBase = base.replace(/\/count.*$/, '').replace(/\/$/, '');
    const res = await fetch(`${apiBase}/counter/TOTAL.json`);
    if (!res.ok) throw new Error('network');
    const data = await res.json();
    const total = data?.count ?? data?.hits ?? data?.total ?? null;
    el.textContent = total ? `${total}` : '—';
  const el = document.getElementById('total-views');
  if (!el) return;

  if (!GOATCOUNTER_SITE || GOATCOUNTER_SITE === 'YOUR_GOATCOUNTER_SITE') {
    // v1.1：首頁 footer 總瀏覽次數（中文、純數字）
    el.textContent = '—';
    return;
  }

  try {
    const res = await fetch(`https://${GOATCOUNTER_SITE}.goatcounter.com/api/v0/stats/total`);
    if (!res.ok) throw new Error('network');
    const data = await res.json();
    const total = data.hits_total ?? data.total ?? data.count ?? null;
    el.textContent = total !== null ? total.toLocaleString() : '—';
  } catch (err) {
    console.error('GoatCounter total fetch failed', err);
    el.textContent = '—';
  }
}

// v1.3：首頁 footer 總瀏覽次數與聯絡資訊
function updateLastUpdated() {
  const el = document.getElementById('last-updated');
  if (!el) return;
  const modified = new Date(document.lastModified);
  const pad = (n) => String(n).padStart(2, '0');
  const formatted = `${modified.getFullYear()}-${pad(modified.getMonth() + 1)}-${pad(modified.getDate())} ${pad(modified.getHours())}:${pad(modified.getMinutes())}`;
  el.textContent = formatted;
}

// v1.1：cpp.html 兩欄筆記頁（左側清單 + 右側內文）
function initNoteTocToggle() {
  const tocToggle = document.getElementById('toc-toggle');
  const sidebar = document.getElementById('note-sidebar');
  if (!tocToggle || !sidebar) return;

  tocToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    tocToggle.setAttribute('aria-expanded', sidebar.classList.contains('open'));
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
  initNavToggle();
  initNoteTocToggle();
  setActiveNav();
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  updateTotalViews();
  updateLastUpdated();
});
