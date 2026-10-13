# 台股雷達 Pro

純靜態的台股分析與交易建議網站（HTML + 原生 JS），部署於 Vercel。

- 專案說明與開發規範：`CLAUDE.md`
- 功能規格總表：`docs/SPEC.md`

## 從零開始取得完整程式碼
```bash
git clone https://github.com/27122cheng/456.git
cd 456
```
本機預覽：任何靜態伺服器即可（例如 `npx serve .`）；`/api/proxy` 需在 Vercel 上才會運作（本機會自動退到第三方代理）。

## 部署
推到 `main` 後 Vercel 自動部署。每次改動請把 `sw.js` 的 `taistock-vNNN` 版本 +1。
