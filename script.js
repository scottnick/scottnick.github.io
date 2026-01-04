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
  const el = document.getElementById('total-views');
  if (!el) return;

  if (!GOATCOUNTER_SITE || GOATCOUNTER_SITE === 'YOUR_GOATCOUNTER_SITE') {
    el.textContent = '待設定';
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
  setActiveNav();
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  updateTotalViews();
});
