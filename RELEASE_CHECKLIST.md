# RELEASE CHECKLIST — 每次改版必做

---

## 1) 類別/計數索引更新（必做）
- 確認 GitHub Actions：Build site index 成功
- 確認 repo 根目錄的 `site-index.json` 已更新（buildId 變更、posts 數量合理）
- 上線後若數字未更新：先硬重新整理（Ctrl+F5）或清除站台快取

---

## 2) 檢查類別索引邏輯（必做）
確認以下規則沒有被破壞：

- 類別索引來源是「全站文章」
- C++ 類別頁面只顯示：
  - `/cpp-notes/all problems/` 內文章
- 其他 C++ 子資料夾（grind75 / leetcode75 / neetcode150 / contests...）：
  - 預設不應出現在 C++ 類別文章清單中
  - 除非我明確指定要納入

---

## 3) 快速驗收（建議）
至少檢查以下頁面：

- `categories.html`
  - 類別數量是否正確
  - 類別是否包含非 C++ 文章（例如 ntu-math-special）
- `category.html?name=Easy`
  - 是否只顯示 all problems 的文章
- 搜尋功能：
  - 大小寫搜尋正常（Two / two）
- 排序功能：
  - 字母 / 時間切換正常
  - 上下箭頭方向正確
- 顯示文案：
  - `已顯示 x / 共 y 篇` 顯示正確、位置正常

---

## 4) 新增文章時（提醒）
- 新增文章後：
  - 確認文章結構符合 Two Sum 範本（內容 / 資訊 / 目錄 / `.post-tag`）
  - 若是 C++ 解題文章：
    - 預設需新增到 `cpp-notes/all problems/`（除非明確說不要）
    - 若 all problems 已有相同題號文章，則不重複新增
  - 重新檢查 categories / category 頁
