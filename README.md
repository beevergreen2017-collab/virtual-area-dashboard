# Virtual Area Dashboard（虛坪改革三頁互動 dashboard）

本專案為 Vite + React + Recharts 製作之互動決策工具，用於檢驗虛坪改革前後：
- 公設比/虛坪率變動
- 權狀面積（T）、室內面積（A）、公設面積（C）之連動
- 總銷固定下的單價上調敏感度（P1 vs k）

## 功能
1. 口徑切換：A 固定（室內固定）/ T 固定（總面積固定）
2. 單位切換：m² / 坪（1 坪 = 3.305785 m²）
3. 單價策略：總銷固定下，P1 = P0/(1-k) 的敏感度曲線 + 表格
4. 分享連結：以 URL query 保存/還原 r0,r1,T0,mode,unit,basis,P0,kMax,kStep

## 符號與計算式
- r：虛坪率（公設比）
- T：權狀面積（總面積）
- A：室內面積（實坪）
- C：公設面積（虛坪）
- 關係式：
  - A = T(1-r)
  - C = Tr
  - T = A/(1-r)
  - C = T - A
- 單位：
  - 1 坪 = 3.305785 m²
  - 坪 = m² / 3.305785
  - m² = 坪 × 3.305785
- 單價策略（總銷固定）：
  - R = P × S
  - S1 = S0(1-k) ⇒ P1 = P0/(1-k)
  - ΔP% = 1/(1-k) - 1
  - S（銷售口徑面積）預設為權狀 T，可切換為室內 A

## Local Development
```bash
npm install
npm run dev
