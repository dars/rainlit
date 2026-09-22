# 部署

正式網址：https://rainlit.code4soul.dev
Cloudflare Worker：rainlit-cafe

目前部署首頁、開場與雨蓉篇，使用 Next.js 靜態匯出搭配 Workers Static Assets，以及同一 Worker 的 /api/* 與 D1 存檔。`wrangler.jsonc` 的 custom_domain 由 Cloudflare 管理 DNS 與憑證。未啟用額外 workers.dev 或預覽網址。

更新：`npm run deploy`（需 Wrangler 已登入）。先執行 `npm run build:cloudflare` 產生 out，再由 Wrangler 上傳 out。只上傳網站檔案；作者資料、測試紀錄、.env.local 均不在發布目錄。

一般 `npm run dev` 保持 Next.js 開發模式；只有 RAINLIT_STATIC_EXPORT=1 時啟用靜態匯出。Luna API 已由 worker/index.ts 在伺服器呼叫，OPENAI_API_KEY 存於 Worker secret，未放前端。D1 rainlit-game 綁定為 DB，新增 migration 需先套用。

首次部署版本：2499b902-83d6-4023-83c5-1baeb457ea23（2026-09-22）。建置、dry-run 與匯出檔金鑰檢查已通過。

驗收：公開 DNS 已解析至 Cloudflare；以公開 DNS 回傳 IP 指定解析，HTTPS 憑證驗證與首頁 HTTP 200 通過。瀏覽器正式站開場互動、背景圖與 JavaScript 錯誤檢查通過。本機系統解析曾有新紀錄快取延遲；未修改本機 hosts 或 DNS 設定。
