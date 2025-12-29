---
layout: page
title: "LeetCode 0001 - Two Sum"
---

## 題目描述
給定一個整數陣列 `nums` 與一個整數 `target`，
找出兩個不同 index，使得 `nums[i] + nums[j] == target`。

---

## 解題思路

這題的關鍵在於：

- 我們在掃描陣列時，希望能快速知道  
  「`target - nums[i]` 是否已經出現過」
- 使用 `unordered_map` 可以在 **O(1)** 平均時間查找

流程：
1. 從左到右遍歷陣列
2. 對每個 `nums[i]`，計算 `need = target - nums[i]`
3. 如果 `need` 已經在 map 裡 → 找到答案
4. 否則把 `nums[i]` 存進 map

---

## C++ 實作

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
            int need = target - nums[i];
            if (mp.count(need)) {
                return {mp[need], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};
