---
layout: page
title: C++ 學習筆記
permalink: /cpp/
---

# C++ 學習筆記（LeetCode）

集中紀錄演算法練習與常用模板，方便查詢與複習。

## 題解筆記（範例）
- **Two Sum**：哈希表 O(n) 找補數；注意重複值處理。
- **Binary Tree Level Order Traversal**：使用佇列 BFS，記得分層。
- **LRU Cache**：`unordered_map + list` 維護 O(1) 查找與移動。

## 常用模板
```cpp
// 快速冪
long long fastpow(long long a, long long b, long long mod) {
    long long res = 1;
    while (b) {
        if (b & 1) res = res * a % mod;
        a = a * a % mod;
        b >>= 1;
    }
    return res;
}
```

## 學習提示
- 先寫暴力法，確認正確性後再思考優化。
- 為每題記錄「解題思路、時間複雜度、易犯錯誤」。
- 週期性回顧：每週挑 2 題 Medium 重寫，檢查是否能直接完成。
