---
layout: home
title: 主頁
---

<div class="home-hero">
  <h1 class="title">scottnick 的主頁</h1>
  <div class="subtitle">家教經驗 · 修課紀錄 · C++ 學習筆記（LeetCode）</div>
</div>

<div class="home-buttons">
  <a class="big-btn" href="/">
    <div class="btn-title">主頁</div>
    <p class="btn-desc">這裡會放我近期更新、網站導覽，以及最重要的入口。</p>
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

<div class="footer-stats">
  <div>總瀏覽次數（Total Views）</div>
  <div class="stat-value"><span id="pv">—</span></div>
  <div style="margin-top:0.5rem; font-size:0.95rem; opacity:0.85;">
    最後更新：{{ site.time | date: "%Y-%m-%d" }}
  </div>
</div>

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
