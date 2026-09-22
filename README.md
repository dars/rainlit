# 打烊前，還有一位客人

單人網頁恐怖敘事遊戲。由咖啡館探索的討論發展成原創故事，不再以重現既有 CoC 劇本為目標。是否採用 CoC 規則尚未決定。

目前已有首頁、開場與雨蓉篇可玩原型，包含狀態機、Luna 自由對話與伺服器存檔。完整遊戲仍在製作。詳見 [原型說明](docs/rain-playable.md)。

## 正式名稱（已定案）

- 故事中文名：**打烊前，還有一位客人**
- 故事英文名：**One Last Guest Before Closing**
- 店中文名：**雨夜咖啡館**
- 店英文名：**The Rainlit Café**

英文正式展示採上述大小寫與 Café 的重音符號；純 ASCII 場合可寫 The Rainlit Cafe。店名與故事名分別使用，不互相取代。

正式網址：[rainlit.code4soul.dev](https://rainlit.code4soul.dev) · [部署方式](docs/deployment.md)

## 設定文件

- [故事設定與時間線](docs/story-bible.md)
- [角色卡](docs/characters.md)
- [AI 敘事與對話設計提案](docs/ai-narrative.md)
- [雨蓉狀態機設計 v0.1](docs/rain-state-machine.md)
- [說書模型選定與比較紀錄](docs/model-selection.md)
- [待釐清問題](docs/open-questions.md)
- [ChatGPT 後續討論完整對照](docs/discussion-reconciliation.md)（含原始文字存檔連結）

## 維護方式

設定分為「已確認方向」「目前工作稿」「待定」。工作稿保存討論中提出的細節，不代表每個名字、因果與結局都已定案。修改時同步檢查角色、時間線及線索條件；不以最新一段生成對話自動改寫故事真相。

這些文件含完整創作劇透，是作者資料。未來執行時需依角色與遊戲進度選取內容，不應把整份文件直接送入每次 NPC 對話。

## 本機預覽

```sh
npm install
npm run dev
```

開啟 http://localhost:3000 。`npm run build` 檢查正式建置。首頁設計與素材來源見 [首頁試作](docs/homepage-design.md)。

互動 API 本機開發：另一個終端執行 `npm run dev:api`，先執行 `npx wrangler d1 migrations apply rainlit-game --local`。`.dev.vars` 設定 OPENAI_API_KEY 與 ALLOWED_ORIGIN=http://127.0.0.1:3000；不要提交金鑰。
