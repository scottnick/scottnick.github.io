---
layout: home
title: 主頁
---

<div class="home-hero">
  <h1 class="title">scottnick 的主頁</h1>
  <div class="subtitle">家教經驗 · 修課紀錄 · C++ 學習筆記（LeetCode）</div>
</div>

<div class="home-intro">
  <h2>關於這個網站</h2>
  <p>
    這裡是我整理學習紀錄與教學經驗的個人空間：上方能快速瀏覽各頁面，
    下方則會放置最新統計與更新日期，方便你掌握網站內容的活絡度。
  </p>
</div>

<div class="home-buttons">
  <a class="big-btn" href="/">
    <div class="btn-title">主頁</div>
    <p class="btn-desc">網站導覽、最新更新與瀏覽統計的集中入口。</p>
  </a>

  <a class="big-btn" href="/tutoring/">
    <div class="btn-title">家教經驗</div>
    <p class="btn-desc">整理教學科目、帶過的學生類型、教學方法與成果紀錄。</p>
  </a>

  <a class="big-btn" href="/courses/">
    <div class="btn-title">修課紀錄</div>
    <p class="btn-desc">以學期/課名整理我的修課清單、心得與重點整理。</p>
  </a>

  <a class="big-btn" href="/cpp/">
    <div class="btn-title">C++ 學習筆記</div>
    <p class="btn-desc">LeetCode 解題思路、常用模板、踩雷整理與複雜度分析。</p>
  </a>
</div>

<div class="home-highlight">
  <h3>如何使用這個網站？</h3>
  <ul>
    <li><strong>想了解我的教學風格：</strong> 點擊「家教經驗」查看科目、授課紀錄與學習資源。</li>
    <li><strong>想看課程反思：</strong> 在「修課紀錄」中以學期為單位回顧修課心得與重點。</li>
    <li><strong>想練習演算法：</strong> 「C++ 學習筆記」提供題解思路、模板與時間複雜度整理。</li>
  </ul>
</div>

<div class="footer-stats">
  <div>總瀏覽次數（Total Views）</div>
  <div class="stat-value"><span id="pv">—</span></div>
  <div style="margin-top:0.5rem; font-size:0.95rem; opacity:0.85;">
    最後更新：{{ site.time | date: "%Y-%m-%d" }}
  </div>
</div>

<style>
  .home-hero { text-align: center; padding: 2.5rem 1rem 1.2rem; }
  .home-hero .title { font-size: 2.6rem; margin: 0; }
  .home-hero .subtitle { color: #666; margin-top: 0.5rem; font-size: 1.15rem; }
  .home-intro, .home-highlight { max-width: 860px; margin: 0 auto; padding: 1rem 1.2rem; line-height: 1.7; }
  .home-intro h2, .home-highlight h3 { margin-bottom: 0.4rem; }
  .home-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1rem; max-width: 1100px; margin: 1rem auto; padding: 0 1rem; }
  .big-btn { display: block; border: 1px solid #e2e2e2; border-radius: 10px; padding: 1rem 1.2rem; text-decoration: none; background: #fafafa; color: inherit; box-shadow: 0 2px 6px rgba(0,0,0,0.06); transition: transform 0.1s ease, box-shadow 0.2s ease; }
  .big-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(0,0,0,0.08); }
  .btn-title { font-size: 1.2rem; font-weight: 700; }
  .btn-desc { margin: 0.25rem 0 0; color: #555; line-height: 1.5; }
  .home-highlight ul { padding-left: 1.1rem; margin: 0.5rem 0 0; }
  .footer-stats { text-align: center; margin: 2rem auto 1.5rem; padding: 1.2rem 1rem; max-width: 420px; border: 1px solid #e5e5e5; border-radius: 10px; background: linear-gradient(180deg, #fdfdfd 0%, #f7f7f7 100%); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .stat-value { font-size: 2rem; font-weight: 800; margin-top: 0.2rem; color: #444; }
</style>

<script>
  // ✅ 免註冊統計（CountAPI）
  // namespace/key 只要能唯一代表你的站就好
  // 你可以保留這組，也可以自己改成別的（英文/數字/連字號）
  const namespace = "scottnick-github-io";
  const key = "home";

  // 每次載入首頁就 +1，並回傳目前總數
  fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`)
    .then(r => r.json())
    .then(data => {
      const n = data && typeof data.value === "number" ? data.value : null;
      document.getElementById("pv").textContent = (n === null) ? "（統計讀取失敗）" : n.toLocaleString();
    })
    .catch(() => {
      document.getElementById("pv").textContent = "（統計讀取失敗）";
    });
</script>
