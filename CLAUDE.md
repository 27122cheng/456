# 台股雷達 Pro — 給 Claude Code 的專案說明

這份檔案讓任何一個新的 Claude Code 工作階段一打開倉庫就知道專案是什麼、怎麼改、怎麼出貨。
**不要重寫整個專案**：程式碼已經在這裡，請在既有架構上修改。

## 專案是什麼
純靜態前端的台股分析／交易建議網站，部署在 Vercel（`456-eosin.vercel.app`）。
沒有後端資料庫，所有狀態存在瀏覽器 `localStorage`；唯一的伺服器端程式是 `api/proxy.js`（Vercel Serverless 代理，解決行情來源的 CORS 與限流）。

## 檔案結構（全部手寫，無框架、無打包）
- `index.html` — 所有頁面的 HTML（dashboard／ranking／stock／holdings／daytrade／journal／settings），底部依序載入三支 JS
- `js/indicators.js` — 純技術指標與型態偵測（EMA/RSI/MACD/ADX/ATR、`calculateScore`、`detectBreakout`、訂單塊、量價分佈、趨勢引擎）
- `js/api.js` — 所有資料抓取（Yahoo → 證交所／櫃買官方月線 → FinMind 備援）、代理鏈與熔斷、localStorage 快取、官方 OpenAPI 資料集、MIS 即時報價、新聞 RSS
- `js/app.js` — 全部業務邏輯與渲染（約 12,000 行）：掃描、研判、進場管線、持倉、當沖、實驗室、學習、通知、Telegram
- `css/styles.css` — 深色主題；推薦卡用 `.sig-*` 類別
- `api/proxy.js` — 代理白名單（Yahoo、twse、tpex、Google News、stooq、mis.twse、tdcc、taifex）
- `sw.js` — Service Worker，`CACHE = 'taistock-vNNN'`；**每次出貨必須把版本號 +1**，否則使用者拿到舊快取
- `docs/SPEC.md` — 功能規格總表（想知道某個功能「為什麼這樣設計」先看這裡）

## 核心觀念（改程式前必讀）
1. **絕不捏造資料**：抓不到就顯示「無資料」或誠實說明原因，不用假值頂替。
2. **全站唯一研判來源**是 `buildManagerAnalysis(s)`：證據以 `add(w, d, txt, kind)` 加入，證據家族化（`evidenceFamily`／`FAMILY_CAP`）後得到 `dir`／`agr`／`conf`；其他頁面透過 `getVerdict(s)` 取用，不要另起一套評分。
3. **進場管線**：`entryEnv()` → 每檔 `evalEntry(s, env)`（每道門檻留下 ✓/✗，`FUNNEL_LABELS` 命名）→ `computeEntrySignals()` 彙總。新增門檻一律在 `evalEntry` 內加 `fail('key', 說明)` 並在 `FUNNEL_LABELS` 加名稱。
4. **模擬什麼就建議什麼**：紙上交易 `updateAiSignals()` 的規則必須與推薦卡上寫的紀律一致（限價進場區、+1R 減半保本、續抱型移動停利、跳空以開盤價成交、淨報酬扣稅費）。
5. **學習都有安全閥**：任何自動加嚴都經過 `learnGate()`（最近 40 筆內 ≥5 次且占 ≥30% 才啟用、20 筆後期望值未改善自動回退）。不要新增「兩筆就永久加嚴」的邏輯。
6. **多策略＋盤性路由**：`SWING_STRATEGIES`（突破追蹤／拉回買／均值回歸／動能續抱）由實驗室 `runSwingLab()` 分盤性驗證，`currentSwingStrategy()` 依今日盤性選冠軍；無冠軍且優勢閘門開啟時停發（`noedge`）。
7. **三層回撤控制**：`systemCooldown()` 減半 → `drawdownBreaker()` 停手 → 持倉 `updateTrailingStops()` 的時間衰減與吊燈停損。
8. **Telegram 三報**：08:30 盤前、09:30 開盤後、16:30 盤後，由 `NOTIFY_SLOTS`／`scheduledTick` 在時段內掃描一次後推送；去重用 `tgKeySent`／`tgMarkKeys`。不要增加新的推播時段。

## 開發與出貨流程（每次改動都照做）
1. 改程式後先 `node --check js/app.js`（語法）。
2. 跑測試：倉庫沒有內建測試框架，測試以 Node 模擬瀏覽器全域後 `eval` 三支 JS。範本見 `docs/SPEC.md` 末段「測試框架」；至少做一個冒煙測試（`calculateScore`→`buildManagerAnalysis`→`buildEntryPlan`→`computeEntrySignals`→各 render 函式不拋錯）。
3. `sw.js` 的 `taistock-vNNN` 版本 +1。
4. 在分支開發、commit、`git fetch origin main && git rebase origin/main`、push、開 PR、合併到 `main`（Vercel 自動部署）。
5. 回覆使用者時用中文、直觀、不要堆指標名稱。

## 常見陷阱
- `calcEMA` 回傳整條陣列，不是單一值。
- 日期一律用台北時間 `twClock().date`，不要用 `new Date().toISOString()` 當交易日。
- 證交所月線端點有速率限制：只能經 `throttledProxyFetch`，不要直接 `proxyFetch`。
- `localStorage` 是唯一狀態來源，新增持久化鍵請加進 `SYNC_KEYS`（匯出／匯入才會帶到）。
