# 台股雷達 Pro — 從零重建提示詞（可整段複製貼給空白的 Claude Code）

> 說明：這份提示詞不含任何程式碼，貼給全新的 Claude Code 後，它會依規格從零建出功能與架構相同的網站。程式碼不會逐字相同，但頁面、資料來源、分析邏輯、交易建議、學習機制、Telegram 推播都一樣。
> 使用方式：先在空資料夾啟動 Claude Code，把下方「=== 提示詞開始 ===」到「=== 提示詞結束 ===」之間的內容整段貼上。它會分階段做，每個階段完成會回報，你回「繼續」即可。

=== 提示詞開始 ===

你是我的工程夥伴。請在這個空資料夾從零建立一個台股分析與交易建議網站「台股雷達 Pro」。以下是完整規格，請完全照做。分八個階段實作，每完成一個階段就跑測試、回報、等我說「繼續」再做下一階段。全程用中文回覆。

## 0. 不可違反的規則
1. 純靜態前端：HTML + 原生 JavaScript + CSS。不用任何框架、不用打包工具、不用 npm 相依。檔案固定為：`index.html`、`js/indicators.js`、`js/api.js`、`js/app.js`、`css/styles.css`、`api/proxy.js`、`sw.js`、`manifest.json`、`vercel.json`、`package.json`（只含 `"type": "module"`）。
2. 部署在 Vercel。`vercel.json` 把所有非 `/api/` 的路徑重寫到 `index.html`。`api/proxy.js` 是唯一的 Serverless 函式。
3. **絕不捏造資料**。抓不到就顯示「無資料」並說明原因，不用假值頂替，不用亂數假裝行情。
4. 所有狀態（設定、持倉、紙上交易、學習結果、快取）都存在瀏覽器 `localStorage`，沒有資料庫。
5. 日期一律用台北時間（`Intl.DateTimeFormat` 取 `Asia/Taipei`），不要用 `toISOString()` 當交易日。
6. 每次出貨：`node --check js/app.js` 語法檢查 → 跑測試 → 把 `sw.js` 的 `CACHE = 'taistock-vNNN'` 版本號加一 → commit。
7. 全站只能有一個研判來源（見 4.1），其他頁面都從它取結論，不准另起一套評分。
8. 所有自動學習的加嚴都必須有安全閥（見 7.3），不准「兩筆就永久加嚴」。
9. 回覆與介面文字用繁體中文、直觀、不堆指標名稱。

## 1. 技術基礎
- `index.html`：單頁應用，頁面有 dashboard（總覽）、ranking（排名）、stock（個股）、holdings（持有中：推薦交易與持倉）、daytrade（當沖）、journal（交易總結）、settings（設定）。頂部導覽列＋手機側欄（漢堡）。底部依序載入 `js/indicators.js`、`js/api.js`、`js/app.js`。
- `css/styles.css`：深色主題，CSS 變數 `--bull`（綠）、`--bear`（紅）、`--blue`、`--yellow`、`--text1/2/3`、`--border`、`--mono`。
- `sw.js`：Service Worker，網路優先、失敗才用快取，`/api/` 不攔截；`CACHE` 版本字串每次出貨 +1，activate 時清舊快取。
- `manifest.json`：PWA 基本資訊。
- `api/proxy.js`（Vercel）：`?url=` 參數，白名單正則只允許以下網域：`query1/query2.finance.yahoo.com`、`www.twse.com.tw`、`openapi.twse.com.tw`、`www.tpex.org.tw`、`news.google.com`、`stooq.com/q/`、`mis.twse.com.tw`、`opendata.tdcc.com.tw`、`openapi.taifex.com.tw`。帶桌面瀏覽器 User-Agent；對 `mis.twse.com.tw` 先請求 `https://mis.twse.com.tw/stock/fibest.jsp` 取 cookie（warm instance 內重用 10 分鐘）並帶 Referer／Origin；上游 429 或 5xx 等 400ms 重試一次；MIS 回應 `Cache-Control: no-store`，其他 `s-maxage=120, stale-while-revalidate=600`；CORS 允許所有來源。

## 2. 資料來源（js/api.js）
### 2.1 代理鏈與熔斷
- 代理順序：自家 `/api/proxy?url=` 最優先，備援 `https://api.allorigins.win/raw?url=`、`https://corsproxy.io/?url=`、`https://api.codetabs.com/v1/proxy?quest=`、`https://api.allorigins.win/get?url=`（取 `contents`）。
- 代理連續失敗 2 次冷卻 5 分鐘，持久化到 localStorage；上游回 429／403／404 不算代理故障。
- 來源級熔斷 `srcMarkDead(name, 10 分鐘)`；提供帶狀態碼的 `proxyFetchEx` 回 `{data, status}`。
- localStorage 快取 `cacheGet(key, ttl)`／`cacheSet`／`cacheGetStale(key, maxAge)`，空間滿時汰舊留新。

### 2.2 日 K 線（最重要）
- 主來源 Yahoo：`https://query1.finance.yahoo.com/v8/finance/chart/{代號}.TW?interval=1d&range=6mo&events=div`（上櫃用 `.TWO`，記住哪些代號是上櫃）。除息事件標在對應 K 棒（`exDiv`、`divAmt`）。快取 10 分鐘；Yahoo 失敗標記 10 分鐘內不再試，回 72 小時內的陳舊快取。
- Yahoo 無資料**或資料落後 ≥3 個交易日**時走官方月線：上市 `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=YYYYMM01&stockNo=代號&response=json`（欄位：日期(民國)、成交股數、成交金額、開、高、低、收、漲跌價差(含 X 代表除權息)、筆數）；上櫃 `https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock?code=代號&date=YYYY/MM/01&response=json`（`tables[0].data` 或 `aaData`，成交量單位仟股 ×1000）。抓最近 14 個月、**由新到舊排隊**、合併去重排序。
- 官方月線一律經**節流佇列**：全域最多 3 個並行、請求間隔 150ms、遇 429 全體暫停 20 秒起指數退避（最長 2 分鐘）後重試一次。
- 月快取：當月 30 分鐘、過去月份 7 天；快取物件帶 `complete` 旗標（在該月未結束時抓的資料進入下月後視為不完整要重抓）；官方明確回「無資料」的過去月份記負快取。
- 兩邊合併（同日以官方為準）。官方仍補不齊且使用者設定了 FinMind token 時走 `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=代號&start_date=YYYY-MM-DD&token=`（瀏覽器直連，支援 CORS）。
- 記錄每檔的來源診斷（Yahoo 正常／僅舊資料／限流中／無資料、證交所…）供介面顯示。
- 清快取函式：清掉「最後一根 K 之後」所有月份（含當月）的月快取與 Yahoo 快取。

### 2.3 其他資料
- 全市場當日行情（支援 CORS，直抓失敗才走代理）：`https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`、`https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes`。14:00 後才合併進日線最後一根（盤中是前一日資料）。
- 即時報價與五檔：`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_2330.tw|otc_XXXX.tw&json=1&delay=0`（批次）；備援 FinMind `TaiwanStockPriceTick`（需 token，5 分鐘冷卻、最多 6 檔）與 Yahoo（2 分鐘冷卻、最多 10 檔）。盤中以即時價更新最後一根 K、累積 5 分 K 給當沖用。
- 三大法人買賣超：`https://openapi.twse.com.tw/v1/fund/T86`（備援 `https://www.twse.com.tw/rwd/zh/fund/T86?date=YYYYMMDD&selectType=ALLBUT0999&response=json`），每日累積歷史以計算「法人連續買賣超天數」。
- 融資融券：`https://www.twse.com.tw/rwd/zh/marginTrading/MI_MARGN?date=YYYYMMDD&selectType=ALL&response=json`（券資比、融資融券日增減）。
- 集保股權分散（週更）：`https://opendata.tdcc.com.tw/getOD.ashx?id=1-5`（千張大戶持股比、股東人數；累積歷史算週變化）。
- 外資持股比率：`https://openapi.twse.com.tw/v1/fund/MI_QFIIS`。
- 除權息：已發生 `https://openapi.twse.com.tw/v1/exchangeReport/TWT49U`、預告 `https://openapi.twse.com.tw/v1/exchangeReport/TWT48U`。
- 期貨籌碼：`https://openapi.taifex.com.tw/v1/PutCallRatio`、`https://openapi.taifex.com.tw/v1/MarketDataOfMajorInstitutionalTradersDetailsOfFuturesContractsBytheDate`（外資台指期淨部位）。
- 公司基本資料／產業別：`https://openapi.twse.com.tw/v1/opendata/t187ap03_L`。月營收：`t187ap05_L`（櫃買 `https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O`）。財報：`t187ap06_L_`、`t187ap07_L_`（櫃買對應 `mopsfin_` 版本）。本益比／殖利率：`https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL`、`https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis`。
- 加權指數：`https://www.twse.com.tw/rwd/zh/afterTrading/FMTQIK?date=YYYYMM01&response=json`（含成交金額）、`https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_HIST?date=YYYYMM01&response=json`（開高低收）。
- 處置／注意股：`https://openapi.twse.com.tw/v1/announcement/punish`、`/notice`。
- 當沖成交統計：`https://openapi.twse.com.tw/v1/exchangeReport/TWTB4U`。
- 國際指數（費半、標普、那斯達克、道瓊、VIX、美元台幣、台積電 ADR、EWT）：Yahoo 失敗退 `https://stooq.com/q/d/l/?s=^sox&i=d` 等 CSV。
- 新聞：`https://news.google.com/rss/search?q=關鍵字&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`，10 分鐘 TTL，解析成個股／族群的題材分數。
- 證交所 OpenAPI 目錄：`https://openapi.twse.com.tw/v1/swagger.json`，依重要性自動載入額外資料集（借券、董監質押、庫藏股、營益分析、減資…），預算 8 項，失效的資料集標記後跳過。

### 2.4 過期資料自動重抓
- 落後 ≥3 個交易日視為過期，停止評分與建議並顯示橫幅（含來源狀態與「重抓」按鈕）。
- 掃描結束時全部過期股重抓（3 個 worker）、打開個股頁自動重抓（每檔 10 分鐘最多一次）、每 10 分鐘背景重抓。

## 3. 技術分析（js/indicators.js，純函式）
- `calcEMA(closes, n)`（回傳整條陣列）、RSI(14)、MACD(12,26,9)、ADX(14)、ATR(14)、布林(20,2)、成交量 20 日均量與量比。
- `calculateScore(ohlcv)` 回傳 analysis 物件：price、prevClose、lastVol、volMA、ema20/50/200、rsi、macd、adx、boll、位階百分位（zone: high/mid/low）、趨勢引擎 `trend`（phase: strong-up/up/range/down/strong-down；maturity: early/mid/late；EMA20 斜率、持續性、Choppiness、波段第幾段、乖離年線）、`brk` 突破偵測（breakout-vol／breakout-novol／breakout-weak／breakdown／distribution／accumulation／churn／failed-break）、`falseBreak`（Upthrust 假突破）、`ob` 訂單塊（未被回補的多方／空方 OB）、`vp` 量價分佈（POC／VAH／VAL）、`diverg` 量價背離、Dow 結構、`risk`（最大回撤等）。
- `detectReversal`、`classifyTrend(bars)`（可套在加權指數上）、`calcSR`（支撐壓力）。

## 4. 個股研判與大盤看法（js/app.js）
### 4.1 全站唯一研判來源 `buildManagerAnalysis(s)`
- 證據以 `add(w, d, txt, kind)` 加入（w 權重、d 方向 ±1、中文說明、kind: tech/volume/chip/fund/context/news/risk）。
- 證據來源：趨勢引擎、均線結構、年線、MACD、Dow、相對強弱、量能、量價背離、法人連買賣超天數、**法人連買但 5 日價跌（出貨消化）扣分／連賣但價不跌加分**、外資持股趨勢、集保千張大戶增減、股東人數增減、融資券與軋空三條件、盤中五檔失衡（低權重、3 分鐘內有效）、月營收年增、毛利率淨利率、本益比歷史位階、大盤環境、族群輪動、新聞題材、處置注意股、主力誘多判別。
- **證據家族化**：每項證據歸入家族（trend/momentum/volume/chips/fund/context/news/risk），每家族貢獻設上限（trend 3.0、momentum 2.5、volume 2.5、chips 3.0、fund 2.5、context 2.0、news 0.8、risk 3.0，可由命中率校正 0.6~1.25）；方向 `dir` ＝家族貢獻相加；一致性 `agr` 在家族之間計算；信心 `conf` ＝ agr × 家族數/5。ADX ≥30 放大方向、<20 打八折；盤整市打七折；大盤環境作調節係數。
- 輸出：dir、agr、conf、stance（中文）、stanceColor、evidence、fams、notes、horizon、atr、ret5、ret20、sup、res、mtfAligned。
- `getVerdict(s)` 把 dir 換算成 0~100 分與「強勢多頭／多頭／中性／空頭／強勢空頭」，資料過期時回「資料過期」。
- `trapAnalysis(s)` 主力誘多／洗盤判別：位置（高檔急拉）、量價（爆量長上影）、假突破（突破前高收回且收黑）、情緒過熱（連漲 4 天且單日 ≥3%、討論度）、籌碼（5 日大漲但外資賣或大戶減）、後續（回檔縮量、守住月線或 OB 支撐）；輸出 trap／caution／washout／none 與中文原因。

### 4.2 大盤看法 `marketRegime()`
- 五成分：大盤技術結構 30%（趨勢引擎跑在加權指數上）、國際連動 25%（費半／標普／那斯達克／VIX／美元台幣／台積電 ADR 溢價／EWT，去重計分）、市場寬度 20%（掃描池多空比，含寬度背離）、法人籌碼 15%（三大法人合計＋期貨 PCR 與外資台指期）、大盤量能 10%。分數 −100~+100、信心度（成分一致性）、資料完整度。
- 權重自我校正：每個成分的歷史命中率（預測記錄結算後）調整權重。
- 盤性：趨勢／盤整／轉換（加權指數 ADX ≥25 且 Chop <55 為趨勢；Chop ≥61 或 ADX <18 為盤整；其餘轉換），**遲滯**：原判要連 2 個交易日相同才切換生效盤性；波動位階（ATR 百分位）。
- 預測記錄：每日存一筆（分數、信心、盤性、方向、各成分分數、重點股、5 天內事件），7 天後對答案；信心低、盤性轉換、重大事件、技術與寬度背離時方向記中性不計分；**看錯學習**歸納原因（事件衝擊、低信心、盤性轉換、寬度背離、國際反向）並經安全閥自動加嚴。
- **方向機率模型**：用已驗證的預測記錄做單純貝氏校準（特徵＝各成分方向與盤性，Laplace 平滑，logit 乘 0.5 溫度），輸出 7 日上漲機率；42%~58% 棄權。
- 資金潮汐／事件行事曆：外資常見撤出流入月份、節日、繳稅季、農曆年、FOMC、台指結算、季底作帳、財報截止、月營收公布期等，提前 5 天納入簡報與分析。

## 5. 進場推薦管線
### 5.1 結構
- `entryEnv()` 一次算好環境：學習濾網、大盤逆風、實績回饋規則、嚴格模式（大盤偏空或盤性轉換：A 級 80 分、風報比 2.0；否則 75、1.5）、A 級門檻自我校準、組合風險、系統冷卻、回撤斷路器、實驗室採用改法、現行策略與調參參數。
- `evalEntry(s, env)` 每檔逐道門檻，每道留下 `{k, ok, txt}`，失敗即停；`computeEntrySignals()` 彙總並統計漏斗（每道門檻各擋掉幾檔，`FUNNEL_LABELS` 中文名）。個股頁顯示「推薦門檻體檢」。
- 門檻順序：資料過期 → 組合風險已滿 → 回撤斷路器 → 無經驗證優勢 → 大盤逆風（20 日跑贏大盤 ≥10pp 例外）→ 研判強度（均值回歸策略 0.5、其餘 3）→ 策略型態（拉回買：RSI 45~60 且乖離 ≤3%；均值回歸：RSI<42、價在 EMA50 上、貼近 20 日低 4% 內、當日收紅；動能續抱：突破 20 日高 5 天內；含調參的 RSI 上限／ADX 下限）→ 進場計畫 → 已追高（現價高於掛買區上緣 2%）→ 風報比 → 流動性（20 日均成交金額 ≥3,000 萬）→ 週線逆勢（週線 EMA10 方向）→ 結構站穩（近 5 日 ≥3 日收在 EMA20 上且 EMA20 ≥ EMA50；均值回歸免）→ 事件視窗（學習後）→ 排除條件（處置股、頂背離大漲、營收重衰、本業虧損、RSI ≥85）→ 盤整盤位置（乖離 >3% 或無量突破不要）→ 學習門檻 → 實驗室採用改法 → 利多已反映 → 主力誘多 → 進場品質 → 三支柱缺二（籌碼支撐／基本面不拖後腿／題材討論度）→ 族群上限（含持倉與追蹤中訊號，同族群最多 2 檔）。
### 5.2 進場品質（0~100）
- 因子：位置（離 EMA20 乖離）20、趨勢階段 15、量能 10、相對大盤 10、族群內強弱 5、型態新鮮度（突破後天數）8、族群輪動 10、籌碼 15、一致性 10、風報比 5；正規化為 100。因子權重依贏單輸單區分力校正（分盤性，該盤性 ≥20 筆才分組）。
- 扣分：賠率不對稱 15、說不出續漲動力 15、誘多警訊 10、續漲動力單薄 5、除息在即 8、財報截止在即 5、月營收公布在即（每月 7~10 日）3、週線無趨勢 5、與持倉 60 日相關 ≥0.7 扣 10、跳空頻繁（近 120 日開盤跳空 ≥3% 比例 ≥8%）8、目標偏遠（目標距離 >2× ATR×√20）5、實績低勝率情境每項 6；實績高勝率情境每項加 4。
- A 級門檻自我校準：75~80 分區間 ≥10 筆勝率 <45% 且 ≥80 分高出 ≥15pp → 上調 5（最高 85），不自動下調。
### 5.3 進場計畫 `buildEntryPlan(s, m, {mode, tuned})`
- 掛買區（回踩 EMA20／支撐／現價 −1.2ATR 取高，上緣不超過現價 1%）；停損（支撐與 5 日低取低 ×0.99 或 lo−ATR，上限 min(8%, 3×ATR 或調參倍數)；贏單 MAE90×1.3 實證收緊；跳空頻繁註記）；目標（真實壓力：樞紐高、前 20/60 日高、布林上軌、空方 OB、VAH/POC，排除最近 3 根，相差 <1% 合併；無壓力→續抱並給移動停利）；三情境（樂觀／中性／悲觀，不對稱判定）；續漲動力鏈與「利多已反映」；部位（停損法：單筆風險 2% 或 ≥30 筆後半凱利 0.5~2%，高波動 ×0.75，冷卻 ×0.5，Beta ≥1.5 等比縮小；災難法：可接受虧損 ÷ 最慘跌幅；流動性上限：≤日均成交 5%；三者取最嚴；不足一張給零股）；分批計畫；稅費（手續費 0.1425%×2＋交易稅 0.3%）；事件、週線、流動性三問。
- 策略覆寫：均值回歸（停損＝近 2 日低 ×0.98、目標＝回到 EMA20、10 日時間停損、不分批）；動能續抱（不設目標、吊燈停損＝最高收盤 −3ATR）；調參採用時固定 R 目標與停損 ATR 倍數。

## 6. 持倉、當沖、長期名單
- 持倉：`checkHoldingExit`（跌破停損、研判轉空、均線雙破、頂背離、外資賣超、營收轉差、達目標、財報截止、除息預告、時間停損 40 日／長期 120 日、誘多→減碼／洗盤→續抱、買進理由檢查、健康度階段 試煉/保護/保本/追蹤）；`updateTrailingStops`（+1R 上移至成本、+2R 結構位＝max(現價−2ATR, EMA20)、動能續抱吊燈、持有 ≥10 日仍在 ±0.5R 內停損收至 −0.5R）；組合風險總量（全部停損額 ÷ 資金，上限 6%、盤整轉換 4%；族群集中；60 日相關 ≥0.7）；盤中停損逼近／觸發推播。
- 當沖 `computeDayTradePicks` 多空雙向：成交 ≥3000 張且 ≥2 億、ATR% 覆蓋全成本（稅費 0.1425%×2＋0.15%＋tick 價差）、日線與週線同邊、法人籌碼、大盤方向、日內相對強度、ORB／VWAP 進出場、掛單價含通知緩衝；紙上追蹤到止盈／止損／收盤；當沖頁含訊號、追蹤中、實驗室（10 策略走動式驗證、分盤性冠軍、有界自動調參）、交易紀錄（保留 30 筆，止損原因與學習不刪）。
- 長期名單（持久化、放半年以上）：成長＋估值＋資金流三證據、60 日贏大盤、乖離年線 ≤25%；年線二次確認才剔除；剔除學習。

## 7. 紙上交易、學習與風控
### 7.1 紙上交易（AI 訊號成績單）
- 推薦出現即建檔「待成交」：限價掛進場區；開盤在區內以開盤價成交、開高後盤中回區以上緣成交、3 日未進區記未成交；成交前開盤已破停損記未成交；成交當日破停損記停損；+1R 減半、停損上移成本；固定目標達到出場；續抱型 +1R 後移動停利 max(收盤−2ATR, EMA20) 只升不降；固定目標 20 日／續抱 40 日到期結算；跳空以開盤價成交；除息還原；報酬含息、淨報酬扣稅費；記錄 MAE／MFE 與進場情境快照（RSI、位階、一致性、大盤分數、ADX、乖離、趨勢、成熟度、營收、家族、品質因子、週線、事件、流動性、盤性、策略、新鮮度、跳空頻率、族群內強弱、可達性、法人連買天數、大戶、題材）。
### 7.2 止損學習
- 波段止損原因：大盤同期轉弱、末升段、高位階、乖離過大、證據分歧、營收轉差、賺過又變虧、從未有利、族群流出、事件跳空、週線無趨勢、流動性偏薄、跳空跳過停損、目標偏遠到期、追老化突破；每類對應一條加嚴規則。當沖、長期各有自己的原因表。
### 7.3 安全閥 `learnGate`
- 最近 40 筆窗口內該原因 ≥5 次且占虧損 ≥30% 才啟用；啟用後再 20 筆結算，期望值未改善自動回退並冷卻 30 筆。
### 7.4 統計與風控
- 期望值（淨 R）、獲利因子、最大連虧、贏單 MAE90、出場效率、半凱利；情境分組期望值（趨勢、階段、位階、大盤、籌碼、基本面、題材、盤性、策略、型態）；實績回饋規則（情境 ≥8 筆，勝率用 (wins+2)/(n+4) 收縮，<40% 扣分、≥60% 加分）。
- 系統冷卻：連虧 3 筆或最近 20 筆淨 R 為負 → 部位減半。
- 回撤斷路器：最近 30 筆權益曲線由高點回撤 ≥6R → 停發新訊號；觸發後 ≥10 個交易日且最近 3 筆淨 R ≥0 自動解除，可手動重置。
- 全域錯誤記錄與「系統健康」列；掃描鎖定最長 15 分鐘自動解除。

## 8. 策略實驗室（交易總結頁）
- 技術回測引擎 `backtestStock(s, opts)`：收盤 > EMA20 > EMA50、MACD > 訊號、RSI 區間、ADX ≥ 門檻、可選回踩確認／量能確認／乖離上限、次日開盤進場、停損＝5 日低 ×0.99 與 entry−ATR 取低、上限 min(8%, N×ATR)、目標＝真實壓力區（掛前緣 0.995）或固定 R、1R 減半保本、連 2 收破 EMA20 出場、40 日時間停損、除息還原、MAE/MFE；模式 meanrev（EMA50 上、RSI<42、貼近 20 日低、收紅；回 EMA20 即走；10 日時間停損）與 trail（吊燈 −3ATR）；選項：fresh、gapMax、settled、weekly、rsMarket、confirmDay、stopATR、targetR、timeStop、decayStop。大盤濾網＝加權指數收盤 > 50 日 EMA。
- 波段改法實驗室：13 個改法（拉回進場 RSI 45~60、只追剛突破 ≤5 天、排除常跳空、結構站穩、週線同向、不輸大盤、隔日確認、ADX≥25、停損 2×ATR、固定 1.5R、時間停損 20 日、取消量能確認、時間衰減停損）各自套回全池；時間 70/30 切分只看驗證段：n≥15、勝率 ≥基準+3pp 且平均 R ≥基準+0.10 為有效，平均 R ≤基準−0.10 為更差；疊加有效改法再驗；一鍵採用成硬門檻；每 5 個交易日自動重跑。
- 策略庫：突破追蹤／拉回買／均值回歸／動能續抱，驗證段依進場日盤性（加權指數 20 日效率比：≥0.35 趨勢、≤0.2 盤整）分組；每種盤性取「n≥12 且平均 R>0」最高者為冠軍；實盤依今日盤性切換；無冠軍且優勢閘門開啟則停發。
- 目標導向調參：每策略在訓練段於「n≥25、期望值 ≥+0.1R、權益回撤 ≥−4R」內找勝率最高參數（RSI 上限 60/65/70、停損 1.5/2/3 ATR、目標 1.2/1.5/2R 或壓力區、ADX 20/25、時間衰減開關；均值回歸調時間停損 6/10/15；動能續抱調 2/3 ATR），驗證段打分，顯示「此池可達勝率」；贏單 MAE p90 與 MFE 中位作為實證止損止盈距離；驗證段 n≥12 且期望值為正者可一鍵採用接進實盤。

## 9. 介面規格
- 推薦交易頁頂部「行動摘要」六~七格：可進場、觀察、當沖、長期名單、大盤（偏多/中性/偏空＋盤性）、波段策略（名稱＋驗證段成績）、出手模式（正常/嚴格/冷卻中/斷路器/無優勢停發）。
- 直觀訊號卡：左上等級圓章（A/B 與分數；當沖為多/空），右上「✅ 可進場」或「⏳ 先觀察」；一句話理由（人話，三個最強依據）；三格大字價位 🟥 停損（跌破就走）・🟦 掛買區（不追價）・🟩 目標（先減半）；價位尺（紅＝風險、藍＝掛買區、綠＝報酬，寬度按價差比例）；一行「賠率／部位／+1R 減半保本」；警示只列會影響決策的；B 級顯示升級條件（距 A 級幾分、最弱因子、扣分項）；依據／情境／停損邏輯收進「詳細」可展開；篩選漏斗收進「為什麼只有這些？」。
- 持倉卡：狀態圓章（🟢續抱/🟡留意/🔴出場）、報酬大字、三格（停損距幾 %、成本→現價、目標還差幾 %）、價位尺標出現價、「下一步」一句話、其餘觀察收合、已賣出／AI 看法／移除按鈕。
- 個股頁：價格與即時時間戳、過期橫幅、K 線圖（日/週/月/5 分/15 分，EMA20/50）、研判與證據、AI 進場建議（三價位＋價位尺＋紀律＋依據／情境／分批／部位／進場前三問／誘多卡／推薦門檻體檢）、型態、籌碼、基本面、多時框、風險、同業。
- 交易總結頁：學習總覽（當沖／波段／長期止損學習、證據家族校正、進場品質因子校正、回撤斷路器、系統健康、A 級門檻校準、大盤看錯學習、策略實驗室）、期望值與風控學習、AI 訊號成績單、技術訊號歷史回測、波段改法實驗室、大盤預測準確度、教訓學習、交易紀錄（月/年報）。
- 設定頁：資金規模、可接受最大虧損 %、優勢閘門開關、時間框架、更新頻率、多空門檻、Telegram（token、chat id、開關、訊號/事件/重點股分類）、FinMind token 與資料目錄、證交所 OpenAPI 資料目錄、匯出／匯入（含所有學習鍵）。
- 當沖頁：訊號（與推薦卡同一套樣式）、追蹤中、分頁「實驗室」與「交易紀錄」。

## 10. Telegram（Bot API `sendMessage`）
- 固定三報（台北時間、交易日）：08:30 盤前簡報（昨收、夜盤美股與 ADR、新聞、法人、事件提醒、開盤研判）、09:30 開盤後（進場訊號與當沖）、16:30 盤後總結（法人、持倉檢查、明日重點）。排程每分鐘檢查時段，到時段內掃描一次再推送，20 分鐘內補發。
- 其他即時：當沖 ORB 觸發（含可掛單價與緩衝）、13:00 平倉提醒、持倉停損逼近與觸發。
- 進場訊號格式：每檔第一行「名稱(代號) A 級 分數」，第二行「🟦 掛買 lo~hi 🟥 停損（−x%）🟩 目標（+y%）」，第三行「賠率｜部位｜+1R 價位 減半保本」，第四行理由（人話），第五行只列警示；訊息底部圖例與出手模式。日曆日去重，內容去重（已在簡報列過的不重推）。

## 11. 測試框架與出貨
- 建立 `tests/run.js`（Node，無相依）：以 Proxy 模擬 `localStorage`（`Object.keys` 要回傳已存鍵）、`document.getElementById` 回傳帶 `innerHTML/style/classList` 的空物件、`window=global`、`fetch` 一律拒絕、`setInterval` 無作用；把三支 JS 與測試檔串成一個字串 `eval`；提供 `T(name, cond)`、`done(label)`、`synthBars(n, {drift, vol, seed, volume, startDate})`（固定種子的合成日 K，週末跳過）、`mkStock(id, name, sector, bars, extra)`。
- 每階段至少一個冒煙測試：`calculateScore` → `buildManagerAnalysis` → `buildEntryPlan` → `computeEntrySignals` → 各 render 函式不拋錯。
- 出貨：`node --check js/app.js`、跑全部測試、`sw.js` 版本 +1、commit。

## 12. 實作階段（照順序做，每階段完成回報並等我說「繼續」）
1. 骨架：檔案結構、index.html 七頁與導覽、styles.css、proxy.js、sw.js、manifest、vercel.json、設定頁與匯出匯入、測試框架。
2. 資料層：2.1~2.4 全部（含節流佇列、快取完整性、來源診斷、過期自動重抓）、即時報價、新聞。
3. 技術分析：第 3 節全部，排名頁與個股頁基本面板。
4. 研判與大盤：4.1、4.2（含預測記錄、看錯學習、方向機率模型、事件行事曆、資金潮汐）、總覽頁。
5. 進場管線與計畫：第 5 節全部、直觀訊號卡與行動摘要、個股頁進場建議與門檻體檢。
6. 持倉、當沖、長期名單：第 6 節全部與對應頁面。
7. 紙上交易、學習、風控：第 7 節全部、交易總結頁各區塊。
8. 實驗室與 Telegram：第 8 節、第 10 節全部。

現在從階段 1 開始。開始前先用一段話複述你理解的架構與規則，再動手。

=== 提示詞結束 ===
