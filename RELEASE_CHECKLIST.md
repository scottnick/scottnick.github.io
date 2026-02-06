# RELEASE CHECKLIST — 每次改版必做

---

## 0) 發布前必做（索引更新流程）
- 【必做】新增/修改文章後，先在本機執行 `python3 scripts/build_site_index.py`
- 確認 repo 根目錄的 `site-index.json` 已更新：
  - `buildId` 變更
  - `generatedAt` 更新
  - `posts` 數量合理
- 【必做】`site-index.json` 需要跟著本次改動一起 commit/push（不得漏提交）

---

## 1) 類別/計數索引更新（必做）
- 確認 GitHub Actions：Build site index 成功
- 確認上線後類別/計數有更新：
  - 若數字未更新：先 Ctrl+F5 或清除站台快取再確認
- 若 Actions 失敗或 site-index 未更新：本次改版視為未完成，必須修到成功為止

---

## 2) 檢查類別索引邏輯（必做）
確認以下規則沒有被破壞：

- 類別索引來源是「全站文章」（只要文章頁有 `.post-tag` 就要進索引）
- C++ 類別頁面（scope=cpp-notes）只顯示：
  - `/cpp-notes/all problems/` 內文章
- 其他 C++ 子資料夾（grind75 / leetcode75 / neetcode150 / contests...）：
  - 預設不應出現在 C++ 類別文章清單中
  - 除非我明確指定要納入

---

## 3) UI / 顯示驗收（必做）
至少檢查以下頁面與規則：

### 3.0 文章目錄 TOC 驗收（必做）
- TOC 內容必須為「文章內 `.article-content` 的所有 `## (h2)`」
- TOC 僅能收錄 `## (h2)`：
  - 不可包含 `# (h1)`
  - 不可包含 `### (h3)` / `#### (h4)` 或更深層
- TOC 不可出現「文章內不存在」的標題（禁止手寫 TOC 與內容不同步）
- 至少抽查 3 篇文章（含一篇多段落/（一）（二）形式）：
  - TOC 是否完整列出所有 `##`
  - 點擊是否能正確跳轉到段落
  - 重新整理（Ctrl+F5）後 TOC 仍正確（避免快取誤判）

### 3.1 categories.html
- 類別數量是否正確
- 類別是否包含非 C++ 文章（例如 ntu-math-special）
- 「相關文章」命中規則驗收：
  - 必須只用文章標題（title）命中
  - 不可用 tag / category / folder 命中

### 3.2 category.html（任意類別頁，例如 `category.html?name=Easy`）
- 是否只顯示 all problems 的文章（scope=cpp-notes）
- `已顯示 N / 共 M 篇` 顯示規則驗收：
  - `N` 會隨搜尋/篩選/排序改變
  - `M` 必須固定等於該類別總篇數（不得因搜尋改變）
- 分頁顯示規則驗收（±2 + 頭尾 + …）：
  - 永遠顯示：`1`、`last`
  - 永遠顯示：`current-2` ~ `current+2`（在範圍內才顯示）
  - 不連續區間以 `...` 取代
- 分頁 active 樣式驗收：
  - active 不可黑底到看不清楚
  - 必須保持可讀性（淡灰/輕量強調）

### 3.3 搜尋功能（至少測一次）
- 大小寫搜尋正常（Two / two）
- 搜尋後 `已顯示 N` 會變，`共 M` 不變

### 3.4 排序功能（至少測一次）
- 字母 / 時間切換正常
- 上下箭頭方向正確

---

## 4) C++ 計數器驗收（必做）
- `cpp.html`（含資料夾/accordion 計數）不得寫死數字
- 計數必須來自 `site-index.json`
- scope=cpp-notes 的計數必須只計入 `cpp-notes/all problems/`

---

## 5) 新增文章時（提醒）
- 新增文章後：
  - 確認文章結構符合 Two Sum 範本（內容 / 資訊 / 目錄 / `.post-tag`）
  - 若是 C++ 解題文章：
    - 預設需新增到 `cpp-notes/all problems/`（除非明確說不要）
    - 若 all problems 已有相同題號文章，則不重複新增
  - 重新檢查 categories / category / cpp.html 計數是否正確
