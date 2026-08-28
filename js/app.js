// ── State ──────────────────────────────────────────────────────────────────

// mkt: 'twse'=上市 / 'tpex'=上櫃。興櫃無官方日 K（STOCK_DAY／tradingStock 均不涵蓋），
// 故預設清單不收興櫃；使用者自行加入的興櫃股會誠實顯示「查無官方日 K」。
const DEFAULT_STOCKS = [
  // ── 上市：半導體/IC ──
  { id:'2330', name:'台積電',    sector:'半導體', mkt:'twse' },
  { id:'2303', name:'聯電',      sector:'半導體', mkt:'twse' },
  { id:'2454', name:'聯發科',    sector:'半導體', mkt:'twse' },
  { id:'3711', name:'日月光投控',sector:'半導體', mkt:'twse' },
  { id:'2379', name:'瑞昱',      sector:'IC設計', mkt:'twse' },
  { id:'3034', name:'聯詠',      sector:'IC設計', mkt:'twse' },
  { id:'6770', name:'力積電',    sector:'半導體', mkt:'twse' },
  { id:'3443', name:'創意',      sector:'IC設計', mkt:'twse' },
  { id:'3661', name:'世芯-KY',   sector:'IC設計', mkt:'twse' },
  { id:'6415', name:'矽力-KY',   sector:'IC設計', mkt:'twse' },
  { id:'2344', name:'華邦電',    sector:'記憶體', mkt:'twse' },
  { id:'2337', name:'旺宏',      sector:'記憶體', mkt:'twse' },
  { id:'6239', name:'力成',      sector:'封測',   mkt:'twse' },
  { id:'2449', name:'京元電子',  sector:'封測',   mkt:'twse' },
  // ── 上市：電子製造/AI 供應鏈 ──
  { id:'2317', name:'鴻海',      sector:'電子製造', mkt:'twse' },
  { id:'2382', name:'廣達',      sector:'AI伺服器', mkt:'twse' },
  { id:'6669', name:'緯穎',      sector:'AI伺服器', mkt:'twse' },
  { id:'3231', name:'緯創',      sector:'AI伺服器', mkt:'twse' },
  { id:'2356', name:'英業達',    sector:'AI伺服器', mkt:'twse' },
  { id:'2308', name:'台達電',    sector:'電子零組件', mkt:'twse' },
  { id:'2301', name:'光寶科',    sector:'電子零組件', mkt:'twse' },
  { id:'2385', name:'群光',      sector:'電子零組件', mkt:'twse' },
  { id:'2327', name:'國巨',      sector:'被動元件', mkt:'twse' },
  { id:'2492', name:'華新科',    sector:'被動元件', mkt:'twse' },
  { id:'3037', name:'欣興',      sector:'PCB',    mkt:'twse' },
  { id:'2383', name:'台光電',    sector:'PCB',    mkt:'twse' },
  { id:'8046', name:'南電',      sector:'PCB',    mkt:'twse' },
  { id:'2313', name:'華通',      sector:'PCB',    mkt:'twse' },
  { id:'2357', name:'華碩',      sector:'電腦',   mkt:'twse' },
  { id:'2353', name:'宏碁',      sector:'電腦',   mkt:'twse' },
  { id:'2376', name:'技嘉',      sector:'電腦',   mkt:'twse' },
  { id:'2377', name:'微星',      sector:'電腦',   mkt:'twse' },
  { id:'2324', name:'仁寶',      sector:'電腦',   mkt:'twse' },
  { id:'4938', name:'和碩',      sector:'電子製造', mkt:'twse' },
  { id:'2354', name:'鴻準',      sector:'機殼',   mkt:'twse' },
  { id:'2474', name:'可成',      sector:'機殼',   mkt:'twse' },
  { id:'2395', name:'研華',      sector:'工業電腦', mkt:'twse' },
  { id:'2345', name:'智邦',      sector:'網通',   mkt:'twse' },
  { id:'2360', name:'致茂',      sector:'量測設備', mkt:'twse' },
  { id:'6176', name:'瑞儀',      sector:'背光模組', mkt:'twse' },
  // ── 上市：光電/面板 ──
  { id:'3008', name:'大立光',    sector:'光學',   mkt:'twse' },
  { id:'3019', name:'亞光',      sector:'光學',   mkt:'twse' },
  { id:'2409', name:'友達',      sector:'面板',   mkt:'twse' },
  { id:'3481', name:'群創',      sector:'面板',   mkt:'twse' },
  // ── 上市：金融 ──
  { id:'2881', name:'富邦金',    sector:'金融',   mkt:'twse' },
  { id:'2882', name:'國泰金',    sector:'金融',   mkt:'twse' },
  { id:'2886', name:'兆豐金',    sector:'金融',   mkt:'twse' },
  { id:'2891', name:'中信金',    sector:'金融',   mkt:'twse' },
  { id:'2892', name:'第一金',    sector:'金融',   mkt:'twse' },
  { id:'5880', name:'合庫金',    sector:'金融',   mkt:'twse' },
  { id:'2884', name:'玉山金',    sector:'金融',   mkt:'twse' },
  { id:'2885', name:'元大金',    sector:'金融',   mkt:'twse' },
  { id:'2880', name:'華南金',    sector:'金融',   mkt:'twse' },
  { id:'2883', name:'開發金',    sector:'金融',   mkt:'twse' },
  { id:'2887', name:'台新金',    sector:'金融',   mkt:'twse' },
  { id:'2890', name:'永豐金',    sector:'金融',   mkt:'twse' },
  { id:'5871', name:'中租-KY',   sector:'租賃',   mkt:'twse' },
  { id:'5876', name:'上海商銀',  sector:'金融',   mkt:'twse' },
  // ── 上市：航運/航空 ──
  { id:'2603', name:'長榮',      sector:'航運',   mkt:'twse' },
  { id:'2609', name:'陽明',      sector:'航運',   mkt:'twse' },
  { id:'2615', name:'萬海',      sector:'航運',   mkt:'twse' },
  { id:'2618', name:'長榮航',    sector:'航空',   mkt:'twse' },
  { id:'2610', name:'華航',      sector:'航空',   mkt:'twse' },
  // ── 上市：傳產/電信/內需 ──
  { id:'2412', name:'中華電',    sector:'電信',   mkt:'twse' },
  { id:'4904', name:'遠傳',      sector:'電信',   mkt:'twse' },
  { id:'3045', name:'台灣大',    sector:'電信',   mkt:'twse' },
  { id:'1301', name:'台塑',      sector:'塑化',   mkt:'twse' },
  { id:'1303', name:'南亞',      sector:'塑化',   mkt:'twse' },
  { id:'1326', name:'台化',      sector:'塑化',   mkt:'twse' },
  { id:'6505', name:'台塑化',    sector:'石化',   mkt:'twse' },
  { id:'2002', name:'中鋼',      sector:'鋼鐵',   mkt:'twse' },
  { id:'2027', name:'大成鋼',    sector:'鋼鐵',   mkt:'twse' },
  { id:'1605', name:'華新',      sector:'電線電纜', mkt:'twse' },
  { id:'1101', name:'台泥',      sector:'水泥',   mkt:'twse' },
  { id:'1102', name:'亞泥',      sector:'水泥',   mkt:'twse' },
  { id:'2105', name:'正新',      sector:'輪胎',   mkt:'twse' },
  { id:'2207', name:'和泰車',    sector:'汽車',   mkt:'twse' },
  { id:'2912', name:'統一超',    sector:'零售',   mkt:'twse' },
  { id:'1216', name:'統一',      sector:'食品',   mkt:'twse' },
  { id:'9904', name:'寶成',      sector:'製鞋',   mkt:'twse' },
  { id:'9910', name:'豐泰',      sector:'製鞋',   mkt:'twse' },
  { id:'1476', name:'儒鴻',      sector:'紡織',   mkt:'twse' },
  { id:'1402', name:'遠東新',    sector:'紡織',   mkt:'twse' },
  { id:'0050', name:'元大台灣50',sector:'ETF',    mkt:'twse' },
  { id:'0056', name:'元大高股息',sector:'ETF',    mkt:'twse' },
  // ── 上櫃（TPEx）──
  { id:'5483', name:'中美晶',    sector:'半導體', mkt:'tpex' },
  { id:'6488', name:'環球晶',    sector:'半導體', mkt:'tpex' },
  { id:'3105', name:'穩懋',      sector:'砷化鎵', mkt:'tpex' },
  { id:'5347', name:'世界先進',  sector:'半導體', mkt:'tpex' },
  { id:'8299', name:'群聯',      sector:'記憶體', mkt:'tpex' },
  { id:'3529', name:'力旺',      sector:'IC設計', mkt:'tpex' },
  { id:'4966', name:'譜瑞-KY',   sector:'IC設計', mkt:'tpex' },
  { id:'5274', name:'信驊',      sector:'IC設計', mkt:'tpex' },
  { id:'6510', name:'精測',      sector:'半導體檢測', mkt:'tpex' },
  { id:'8069', name:'元太',      sector:'電子紙', mkt:'tpex' },
  { id:'3293', name:'鈊象',      sector:'遊戲',   mkt:'tpex' },
  { id:'6180', name:'橘子',      sector:'遊戲',   mkt:'tpex' },
  { id:'8044', name:'網家',      sector:'電商',   mkt:'tpex' },
  { id:'6446', name:'藥華藥',    sector:'生技',   mkt:'tpex' },
  { id:'1795', name:'美時',      sector:'生技',   mkt:'tpex' },
];

let allStocks = [];       // { ...meta, ohlcv, analysis, reversal }
let currentPage = 'dashboard';
let currentTF = '1d';
let refreshInterval = null;
let refreshSec = 60;
let refreshTimer = null;
let currentStockId = null;
let rankingFilter = 'all';
let rankingSort = { col: 'score', dir: -1 };
let scanning = false;

// ── Init ───────────────────────────────────────────────────────────────────

async function initApp() {
  // 任一面板初始化失敗都不得中斷後續流程 —— 尤其不能擋住掃描啟動
  const safe = (label, fn) => { try { const r = fn(); if (r?.catch) r.catch(e => console.warn(label, e)); }
                                catch (e) { console.warn(`初始化 ${label} 失敗:`, e); } };
  safe('設定', loadSettings);
  safe('自選股清單', renderCustomStocksList);
  safe('搜尋', initNavSearch);
  safe('事件監聽', initEventListeners);
  // Hide loader immediately — scan runs in background with its own progress bar
  safe('載入遮罩', hideLoader);
  safe('財經事件', renderEvents);
  safe('資金流動', renderCapitalFlow);
  safe('本週新聞', renderWeeklyNews);
  safe('頂底反轉', renderTopBottomReversal);
  safe('刷新循環', startRefreshCycle);
  safe('每日簡報', startDailyBriefingCheck);
  safe('掃描', startScan);
}

// ── Scan ───────────────────────────────────────────────────────────────────

async function startScan() {
  if (scanning) return;
  scanning = true;
  // 最後防線：無論發生什麼事，60 秒後一定解除鎖定，
  // 避免任何未預期的例外讓 scanning 永遠卡在 true → 之後再也不會掃描
  const failsafe = setTimeout(() => {
    if (scanning) { scanning = false; showScanBar(false); console.warn('掃描逾時，已自動解除鎖定'); }
  }, 60000);
  try {
    await runScan();
  } catch (e) {
    console.error('掃描發生錯誤:', e);
    showToast('掃描過程發生錯誤，下輪將自動重試', 'error');
  } finally {
    clearTimeout(failsafe);
    scanning = false;
    showScanBar(false);
  }
}

async function runScan() {

  // 掃描範圍 = 正式清單 + 法人自動追蹤清單（全市場粗篩自動納入，不必手動加）
  const baseList = getStockList();
  const baseIds = new Set(baseList.map(x => x.id));
  const stocks = [...baseList, ...getAutoStocks().filter(a => !baseIds.has(a.id))];
  allStocks = stocks.map(s => ({ ...s, ohlcv: [], analysis: null, reversal: null }));
  // 上櫃股預先標記市場別，跳過「先試上市再試上櫃」的空探（100 檔時差很多）
  allStocks.forEach(s => {
    if (s.mkt === 'tpex') {
      try { localStorage.setItem(`sym-suffix:${s.id}`, 'TWO'); localStorage.setItem(`mkt:${s.id}`, 'tpex'); } catch {}
    }
  });

  showScanBar(true);
  updateLoadingText('掃描台股技術指標...');

  // Fetch market index + outlook + institutional overview in parallel
  fetchTWII().then(renderMarketIndex).catch(() => {});
  loadMarketOutlook();
  loadInstitutionalOverview();
  fetchTWDayAll().catch(() => {});   // 預熱官方全市場行情（不走 proxy，供全部個股合併最新價）
  fetchMarketAlerts().then(m => {    // 注意股/處置股警示（進場前的必要風險檢查）
    if (!m) return;
    allStocks.forEach(s => { s._alert = m[s.id] || null; });
  }).catch(() => {});
  // 預熱月營收與季報，掛到 allStocks 供推薦 AI 的基本面維度使用
  fetchRevenueAll().then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s.rev = m[s.id]; });
    // 逐月累積營收歷史，供「成長動能加速/減速」判斷（官方僅提供最新月）
    try {
      const h = JSON.parse(localStorage.getItem('rev-hist') || '{}');
      const tracked = new Set([
        ...getHoldings().map(x => x.id),
        ...getLongTermList().map(x => x.id),
        ...getAiSignals().filter(t => t.status === 'open').map(t => t.id),
      ]);
      allStocks.forEach(s => {
        const r = m[s.id];
        if (!r?.ym) return;
        const arr = h[s.id] = h[s.id] || [];
        if (!arr.some(x => x.ym === r.ym)) {
          arr.push({ ym: r.ym, yoy: r.yoy, mom: r.mom });
          // 基本面即時：新月份營收「剛公布」— 標記供研判註記，追蹤標的記入流水帳
          s._revNew = r.ym;
          if (tracked.has(s.id) && r.yoy != null)
            logSignal(r.yoy >= 0 ? 'entry' : 'alert', `${s.name}（${s.id}）${r.ym} 營收公布`,
              `年增 ${r.yoy >= 0 ? '+' : ''}${r.yoy.toFixed(1)}%${r.mom != null ? `｜月增 ${r.mom >= 0 ? '+' : ''}${r.mom.toFixed(1)}%` : ''} — 剛公布，留意開盤反應`,
              { id: s.id, dir: r.yoy >= 10 ? 1 : r.yoy <= -10 ? -1 : 0, dedupKey: `rev-${s.id}-${r.ym}` });
        }
        arr.sort((a, b) => String(a.ym).localeCompare(String(b.ym)));
        h[s.id] = arr.slice(-24);
      });
      localStorage.setItem('rev-hist', JSON.stringify(h));
    } catch {}
    renderFocusStocks();
  }).catch(() => {});
  fetchFinancialsAll().then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s._fin = m[s.id]; });
    renderFocusStocks();
  }).catch(() => {});
  fetchBalanceSheetAll().then(m => {   // 財務體質（ROE／負債比）供研判使用
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id] && s._fin) Object.assign(s._fin, m[s.id]); });
  }).catch(() => {});
  fetchTWFundAll().then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s._fd = m[s.id]; });
  }).catch(() => {});
  // 使用者於目錄頁啟用的額外資料集
  loadEnabledDatasets().catch(() => {});
  // FinMind 啟用的資料集（每檔一請求，故只取重點標的）
  (async () => {
    const prio = [currentStockId, ...getHoldings().map(h => h.id),
      ...allStocks.map(x => x.id)].filter(Boolean);
    const m = await fetchFinmindDatasets([...new Set(prio)], 10).catch(() => ({}));
    for (const [id, sets] of Object.entries(m)) {
      const s2 = allStocks.find(x => x.id === id);
      if (!s2) continue;
      s2._oapi = s2._oapi || {};
      for (const [ds, row] of Object.entries(sets)) s2._oapi[`FinMind:${ds}`] = row;
    }
  })().catch(() => {});
  // 全市場產業別（證交所公司基本資料）：讓清單外／自動加入的股票也有正確族群，
  // 族群排名因此能涵蓋任何加入的標的，而不是只顯示「自訂」「法人動向」
  fetchCompanyInfo().then(m => {
    if (!m) return;
    let changed = false;
    allStocks.forEach(s => {
      const info = m[s.id];
      if (!info) return;
      if (info.sector && (!s.sector || ['自訂', '法人動向', '其他'].includes(s.sector))) { s.sector = info.sector; changed = true; }
      if (info.name && (!s.name || s.name === s.id)) { s.name = info.name; changed = true; }
    });
    if (changed) { try { renderRanking(); } catch {} }
  }).catch(() => {});
  // 當日沖銷成交量：當沖推薦需要知道該股當天是否真的有當沖成交、比重多高
  fetchDayTradeStats().then(m => {
    if (!m) return;
    allStocks.forEach(s => { s._dayTrade = m[s.id] || null; });
  }).catch(() => {});
  // 官方除權息表：以精確的權值息值標記 K 棒，取代用缺口反推
  fetchExDividend().then(list => {
    if (!list?.length) return;
    const byId = {};
    for (const e of list) (byId[e.id] = byId[e.id] || []).push(e);
    allStocks.forEach(s => {
      const evs = byId[s.id];
      if (!evs || !s.ohlcv?.length) return;
      for (const e of evs) {
        const bar = s.ohlcv.find(b => b.time === e.date);
        if (bar) { bar.exDiv = true; bar.divAmt = e.amt; }   // 官方金額優先於缺口推算
      }
    });
  }).catch(() => {});
  // 除權息「預告」：持倉遇到即將除息要提前警示（跳空與棄息賣壓風險）
  fetchExDivCalendar().then(list => { if (list?.length) { _exDivCal = list; renderHoldings(); } }).catch(() => {});
  // 外資持股比率（存量）：單日買賣超只看得到流量，看不到水位
  fetchForeignHolding().then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s._fgn = m[s.id]; });
    accumulateForeignHist(m);
    allStocks.forEach(s => { if (m[s.id]) s._fgnTrend = foreignTrend(s.id); });
  }).catch(() => {});
  // 集保股權分散（週更）：千張大戶持股比率 — 比單日法人買賣超更穩定的大戶證據
  fetchTDCCAll(new Set(allStocks.map(s => s.id))).then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s._tdcc = m[s.id]; });
    accumulateTDCCHist(m);
    allStocks.forEach(s => { if (m[s.id]) s._tdccTrend = tdccTrend(s.id); });
  }).catch(() => {});
  // 預熱官方加權指數日線（供相對強弱、Beta、市場面計算；不再依賴 Yahoo）
  fetchTWIIOHLC(5).then(bars => {
    if (bars?.length) { _twiiSeries = bars; renderFocusStocks(); }
  }).catch(() => {});

  // 並行掃描（5 個 worker 同時抓，取代逐檔串行 + 300ms 延遲 → 快 5-8 倍）
  const queue = [...allStocks];
  const total = allStocks.length;
  let done = 0;
  async function scanWorker() {
    while (queue.length) {
      const s = queue.shift();
      try {
        const ohlcv = await fetchStockOHLCV(s.id, currentTF, currentTF === '1d' ? '6mo' : '2y');
        s.ohlcv = ohlcv;
        if (ohlcv.length >= 20) {
          s.analysis = calculateScore(ohlcv);
          s.reversal = detectReversal(ohlcv, s.analysis);
        }
      } catch (e) {
        console.warn(`Failed ${s.id}:`, e);
      }
      done++;
      // 渲染錯誤絕不能讓 worker 死掉 —— 否則 Promise.all 中斷、scanning 永遠卡在 true
      try {
        setScanProgress((done / total) * 100, `分析 ${s.name} (${s.id})... ${done}/${total}`);
        if (done % 5 === 0 || done === total) {
          renderDashboard();
          renderFocusStocks(); // 邊掃邊更新，掃描未完成也不會卡在初始文字
          if (currentPage === 'ranking') renderRanking();
        }
      } catch (e) { console.warn('渲染失敗（不影響掃描）:', e); }
    }
  }
  // 自家代理有 CDN 快取且無限流，可提高並行度；請求本身已去重
  await Promise.all(Array.from({ length: 8 }, scanWorker));

  // 第一輪失敗的個股再重試一次（免費 proxy 偶發逾時很常見，重試通常就會成功）
  const failed = allStocks.filter(s => !s.ohlcv?.length);
  if (failed.length) {
    setScanProgress(99, `重試 ${failed.length} 檔載入失敗個股...`);
    for (const s of failed) {
      try {
        const ohlcv = await fetchStockOHLCV(s.id, currentTF, currentTF === '1d' ? '6mo' : '2y');
        s.ohlcv = ohlcv;
        if (ohlcv.length >= 20) {
          s.analysis = calculateScore(ohlcv);
          s.reversal = detectReversal(ohlcv, s.analysis);
        }
      } catch {}
    }
    renderDashboard();
    const still = allStocks.filter(s => !s.ohlcv?.length);
    if (still.length) {
      // 歷史 K 線抓不到 → 至少掛上官方當日行情，個股頁還能看到價格
      try {
        const dayAll = await fetchTWDayAll();
        still.forEach(s => { if (dayAll?.[s.id]) s.official = dayAll[s.id]; });
      } catch {}
      const why = ohlcvFailReason[still[0].id];
      showToast(`⚠ ${still.length} 檔歷史資料載入失敗：${still.slice(0, 5).map(x => x.name).join('、')}${still.length > 5 ? '…' : ''}${why ? `。原因：${why}` : '（價格改用官方行情，下輪自動重試）'}`, 'error');
    }
  }

  // 資料過期重抓：有資料但停在數個交易日前者，清當月快取後強制重抓
  const stale = allStocks.filter(s => s.ohlcv?.length && isStaleData(s));
  if (stale.length) {
    setScanProgress(99, `重抓 ${stale.length} 檔過期資料...`);
    for (const s of stale.slice(0, 30)) {
      try {
        clearCurrentMonthCache(s.id);
        const ohlcv = await fetchStockOHLCV(s.id, currentTF, currentTF === '1d' ? '6mo' : '2y');
        if (ohlcv.length >= 20) {
          s.ohlcv = ohlcv;
          s.analysis = calculateScore(ohlcv);
          s.reversal = detectReversal(ohlcv, s.analysis);
          delete s._verdict;
        }
      } catch {}
    }
    const stillStale = allStocks.filter(s => s.ohlcv?.length && isStaleData(s));
    stillStale.forEach(s => { s._staleDays = dataAgeDays(s); });
    allStocks.filter(s => !isStaleData(s)).forEach(s => { delete s._staleDays; });
    if (stillStale.length) {
      showToast(`⚠ ${stillStale.length} 檔資料仍停留在 ${String(stillStale[0].ohlcv[stillStale[0].ohlcv.length-1].time).slice(5)} 前後`
        + `（${stillStale.slice(0, 4).map(x => x.name).join('、')}${stillStale.length > 4 ? '…' : ''}）—— 這些股票已停止提供評分與建議`, 'error');
    }
  }

  setScanProgress(100, '掃描完成');
  setTimeout(() => showScanBar(false), 1500);
  const lu = document.getElementById('last-updated');
  if (lu) lu.textContent = new Date().toLocaleTimeString('zh-TW');

  // 掃描後的收尾工作各自獨立，任一失敗都不影響其他項目
  const after = (label, fn) => { try { fn(); } catch (e) { console.warn(`${label} 失敗:`, e); } };
  after('市場多空總覽', renderMarketOutlook);   // 需等 breadth（多空家數）算完
  // 回填今日法人歷史的收盤價（掃描開始時 analysis 尚未就緒，當時存的是 null）
  after('法人價格回填', () => {
    const hist = JSON.parse(localStorage.getItem('inst-hist') || '{}');
    let changed = false;
    allStocks.forEach(s => {
      const arr = hist[s.id];
      if (!arr?.length || !s.analysis?.price) return;
      const last = arr[arr.length - 1];
      if (last.p == null) { last.p = s.analysis.price; changed = true; }
    });
    if (changed) localStorage.setItem('inst-hist', JSON.stringify(hist));
  });
  after('重點關注股', renderFocusStocks);
  // AI 預測準確度：先結算到期預測，再記錄今日預測（順序不可調換）
  after('結算預測', resolvePredictions);
  after('記錄預測', recordPredictions);
  after('預測準確度', renderPredAccuracy);
  after('分析基準價', () => { allStocks.forEach(s => { if (s.analysis) s._anaPrice = s.analysis.price; }); });
  after('即時報價復原', () => { reapplyLiveQuotes(); refreshLivePrices(); });   // 復原後立即再抓一次，不等下個 tick
  after('我的持倉', () => { updateTrailingStops(); renderHoldings(); });
  after('AI 訊號追蹤', () => { updateAiSignals(); recordAiSignals(); renderAiSignals(); });
  after('大戶動向偵測', () => { detectWhales().catch(e => console.warn('大戶偵測失敗:', e)); });
  after('全市場大戶粗篩', () => { marketWideWhaleScreen().catch(e => console.warn('全市場粗篩失敗:', e)); });
  after('價格警報', checkAlerts);
  after('本週開盤佈局', () => { renderWeeklyBrief(); });
  after('訊號流水帳', () => { renderSignalLog(); });
  after('Telegram 推送', () => {
    // 盤後總結（約 16:30 法人資料出爐後，一天一則）
    notifyAfterClose();
    // 其餘推播只在可下單的時段：08:30 盤前 ~ 14:30 盤後定價撮合
    if (!inNotifyWindow()) return;
    // 訊息紀律：一天固定三份報告（08:30 盤前、09:30 開盤後、16:30 盤後），
    // 其餘只在「有事發生」時推（新進場訊號、持倉等級變化、大戶動向、價格警報）。
    // 強勢多頭／重點關注／數據倒數原為獨立推播 — 內容已併入簡報，
    // 不再單獨發送：相似訊息太多則，比重複更擾人。
    notifyPreOpen();        // 每日 08:30 盤前簡報（昨收＋夜盤＋新聞＋數據＋關注＋機會）
    notifyDailyBrief();     // 09:00 市場簡報 — 僅在盤前簡報未發出時補位
    notifyEntrySignals();   // 事件型：簡報之後出現的「新」進場訊號才發
    notifyHoldingExits();   // 事件型：持倉等級變化才發
    notifyWeeklyBrief();    // 週一 09:30 本週佈局（每週一次）
    notifyPostOpen();       // 每日 09:30 開盤後追蹤
  });
}

// ── Dashboard Rendering ────────────────────────────────────────────────────

function renderDashboard() {
  const ready = allStocks.filter(s => s.analysis);

  const bull   = ready.filter(s => verdictScore(s) >= getThreshold('bull'));
  const bear   = ready.filter(s => verdictScore(s) <= getThreshold('bear'));
  const neutral = ready.filter(s => verdictScore(s) > getThreshold('bear') && verdictScore(s) < getThreshold('bull'));

  // Counters
  document.getElementById('ov-total').textContent   = ready.length;
  document.getElementById('ov-bull').textContent    = bull.length;
  document.getElementById('ov-bear').textContent    = bear.length;
  document.getElementById('ov-neutral').textContent = neutral.length;

  // Bull table
  const bullSorted = [...bull].sort((a, b) => verdictScore(b) - verdictScore(a)).slice(0, 10);
  document.getElementById('bull-count').textContent = bull.length;
  document.getElementById('bull-tbody').innerHTML = bullSorted.length
    ? bullSorted.map(s => stockTableRow(s)).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:16px">目前無多頭訊號</td></tr>';

  // Bear table
  const bearSorted = [...bear].sort((a, b) => verdictScore(a) - verdictScore(b)).slice(0, 10);
  document.getElementById('bear-count').textContent = bear.length;
  document.getElementById('bear-tbody').innerHTML = bearSorted.length
    ? bearSorted.map(s => stockTableRow(s)).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:16px">目前無空頭訊號</td></tr>';

  // Reversal grid
  const reversals = ready.filter(s => s.reversal).slice(0, 8);
  document.getElementById('rev-count').textContent = reversals.length;
  document.getElementById('reversal-grid').innerHTML = reversals.length
    ? reversals.map(s => reversalCard(s)).join('')
    : '<div class="rev-placeholder">目前無明顯反轉訊號</div>';
}

function stockTableRow(s) {
  const a = s.analysis;
  const price = a.price?.toFixed(2) ?? '--';
  const prev  = a.prevClose;
  const chg   = prev ? ((a.price - prev) / prev * 100) : null;
  const chgHtml = chg !== null
    ? `<span class="${chg >= 0 ? 'change-up' : 'change-dn'}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>`
    : '--';
  const v = getVerdict(s);
  const vScore = v?.score ?? a.score;
  const vSignal = v?.signal ?? a.signal;
  const scoreColor = scoreToColor(vScore);

  return `<tr onclick="openStock('${s.id}')">
    <td>
      <div class="stock-cell">
        <div class="stock-avatar">${s.id.slice(-2)}</div>
        <div class="stock-cell-info">
          <span class="stock-cell-id">${s.id}</span>
          <span class="stock-cell-name">${s.name}</span>
        </div>
      </div>
    </td>
    <td class="price-mono">${price}</td>
    <td><span class="trend-badge trend-${signalClass(vSignal)}">${vSignal}</span></td>
    <td>
      <div class="score-inline">
        <div class="score-mini-bar"><div class="score-mini-fill" style="width:${vScore}%;background:${scoreColor}"></div></div>
        <span class="score-val">${vScore}</span>
      </div>
    </td>
    <td class="${rsiClass(a.rsi)}">${a.rsi?.toFixed(1) ?? '--'}</td>
    <td class="vol-cell">${fmtVol(a.lastVol)}</td>
  </tr>`;
}

function reversalCard(s) {
  const r = s.reversal;
  const a = s.analysis;
  return `<div class="rev-card" onclick="openStock('${s.id}')">
    <div class="rev-card-top">
      <div>
        <div class="rev-card-id">${s.id}</div>
        <div class="rev-card-name">${s.name}</div>
      </div>
      <span class="rev-card-type">${r.type}</span>
    </div>
    <div class="rev-card-price">${a.price?.toFixed(2) ?? '--'}</div>
    <div class="rev-card-rsi">${r.desc}</div>
  </div>`;
}

// ── Market Outlook (多空總覽) ──────────────────────────────────────────────

let outlookData = { factors: [], instTotal: null };

const OUTLOOK_SYMBOLS = [
  { sym: '^TWII', name: '加權指數',     weight: 2, type: 'index' },
  { sym: '^SOX',  name: '費城半導體',   weight: 2, type: 'index' },
  { sym: '^GSPC', name: 'S&P 500',     weight: 1, type: 'index' },
  { sym: '^IXIC', name: '那斯達克',     weight: 1, type: 'index' },
  { sym: '^DJI',  name: '道瓊工業',     weight: 1, type: 'index' },
  { sym: '^VIX',  name: 'VIX 恐慌指數', weight: 1, type: 'vix' },
  { sym: 'TWD=X', name: '美元兌台幣',   weight: 1, type: 'fx' },
];

async function loadMarketOutlook() {
  // 7 個指數並行抓（過去序列 + 150ms 延遲 → 最壞要等 7 輪逾時）
  const results = await Promise.all(OUTLOOK_SYMBOLS.map(async cfg => {
    const q = await fetchIndexQuote(cfg.sym).catch(() => null);
    return q ? { ...cfg, ...q } : null;
  }));
  outlookData.factors = results.filter(Boolean);
  renderMarketOutlook();
  // 隔夜訊號（台積電 ADR / EWT）— 需要 2330 收盤價算溢價，抓到再刷新
  loadOvernight();
  // 大盤量能（無量下跌／爆量止跌）— 另外抓，回來再刷新一次
  fetchMarketTurnover().then(rows => {
    const t = analyzeTurnover(rows);
    if (t) { outlookData.turnover = t; renderMarketOutlook(); }
  }).catch(() => {});
  // 期貨籌碼（外資台指期淨部位＋選擇權 PCR）— 現貨看不到的方向部位
  loadDerivatives();
}

// ── 期貨籌碼載入與解讀 ─────────────────────────────────────────────────────
async function loadDerivatives() {
  try {
    const [pcr, ftx] = await Promise.all([
      fetchTaifexPCR().catch(() => null),
      fetchTaifexForeignTX().catch(() => null),
    ]);
    if (!pcr && !ftx) { outlookData.derivs = null; return; }   // 誠實無資料
    outlookData.derivs = { pcr, ftx };
    renderMarketOutlook();
  } catch { outlookData.derivs = null; }
}

// 期貨籌碼摘要（給儀表板與簡報共用）；無資料回 null
function derivsSummary() {
  const d = outlookData.derivs;
  if (!d) return null;
  const parts = [];
  let dir = 0;
  if (d.ftx?.net != null) {
    const n = d.ftx.net;
    const lvl = Math.abs(n) >= 30000 ? '大幅' : Math.abs(n) >= 10000 ? '明顯' : '小幅';
    parts.push(`外資台指期淨${n >= 0 ? '多' : '空'}單 ${Math.abs(n).toLocaleString()} 口（${lvl}${n >= 0 ? '偏多' : '偏空'}）`);
    if (Math.abs(n) >= 10000) dir += n > 0 ? 1 : -1;
    // 期現貨背離：現貨研判偏多但期貨大空（或反向）→ 提醒
    const norm = outlookData.norm ?? 0;
    if (n <= -20000 && norm >= 15) parts.push('⚠ 現貨面偏多但外資期貨大幅偏空 — 期現背離，慎防誘多');
    else if (n >= 20000 && norm <= -15) parts.push('現貨面偏空但外資期貨大幅偏多 — 期現背離，空方追價需謹慎');
  }
  if (d.pcr?.ratio != null) {
    const r = d.pcr.ratio;
    parts.push(`選擇權 P/C 比 ${r.toFixed(2)}（${r >= 1.2 ? '避險情緒偏高' : r <= 0.8 ? '樂觀偏貪婪' : '中性'}）`);
    if (r >= 1.3) dir -= 0.5;                 // 極端避險常伴隨壓回
    else if (r <= 0.7) dir += 0.5;
  }
  if (!parts.length) return null;
  return { parts, dir, date: d.ftx?.date || d.pcr?.date || null };
}

// 隔夜訊號載入：台積電 ADR 溢價需要 2330 收盤價（掃描或官方行情皆可）
async function loadOvernight() {
  try {
    let tsmcClose = allStocks.find(s => s.id === '2330')?.analysis?.price ?? null;
    if (!tsmcClose) {
      const day = await fetchTWDayAll().catch(() => null);
      tsmcClose = day?.['2330']?.close ?? null;
    }
    const o = await fetchOvernightSignals(tsmcClose);
    if (o) { outlookData.overnight = o; renderMarketOutlook(); }
  } catch (e) { console.warn('隔夜訊號載入失敗:', e); }
}

// 隔夜訊號評分：ADR 漲跌 + 溢價率，並與費半去重（同向時不重複計分）
// 誠實界限：隔夜訊號對「開盤方向」預測力強，對「收盤」弱 → 權重控制在 1.5
function scoreOvernight(o, soxPts) {
  if (!o?.adr) return null;
  const adrChg = o.adr.chg1;
  let pts = 0;
  if (adrChg > 2) pts = 1.5; else if (adrChg > 0.8) pts = 1;
  else if (adrChg < -2) pts = -1.5; else if (adrChg < -0.8) pts = -1;
  // 溢價率：>3% 台股開盤有補漲空間、<-2% ADR 已先反映利空
  if (o.premium != null) {
    if (o.premium > 3) pts += 0.5; else if (o.premium < -2) pts -= 0.5;
  }
  // EWT 佐證（涵蓋台積電以外）
  if (o.ewt) {
    if (o.ewt.chg1 > 1 && pts > 0) pts += 0.3;
    else if (o.ewt.chg1 < -1 && pts < 0) pts -= 0.3;
  }
  // 去重：費半與 ADR 同向時，隔夜訊號只計一半（兩者本質是同一件事）
  if (soxPts != null && Math.sign(soxPts) === Math.sign(pts) && pts !== 0) pts *= 0.5;
  pts = Math.max(-2, Math.min(2, pts));
  const parts = [`ADR ${adrChg >= 0 ? '+' : ''}${adrChg}%`];
  if (o.premium != null) parts.push(`溢價 ${o.premium >= 0 ? '+' : ''}${o.premium}%`);
  if (o.ewt) parts.push(`EWT ${o.ewt.chg1 >= 0 ? '+' : ''}${o.ewt.chg1}%`);
  return { pts, display: parts.join('・'), dir: pts > 0.05 ? 'up' : pts < -0.05 ? 'dn' : 'flat' };
}

// Score one factor: returns { pts, dir } where dir is 'up'|'dn'|'flat' for display
function scoreFactor(f) {
  if (f.type === 'vix') {
    // VIX: level matters more than change. >25 fear, <16 calm.
    if (f.price >= 28) return { pts: -2 * f.weight, dir: 'dn' };
    if (f.price >= 22) return { pts: -1 * f.weight, dir: 'dn' };
    if (f.price <= 15) return { pts: 1 * f.weight, dir: 'up' };
    return { pts: 0, dir: 'flat' };
  }
  if (f.type === 'fx') {
    // USD/TWD rising = TWD depreciation = foreign outflow pressure = bearish for TW stocks
    if (f.chg5 > 0.8) return { pts: -1 * f.weight, dir: 'dn' };
    if (f.chg5 < -0.8) return { pts: 1 * f.weight, dir: 'up' };
    return { pts: 0, dir: 'flat' };
  }
  // Regular index: 5 日趨勢為主（權重 2/3）、1 日為輔（1/3）
  // 過去 1 日與 5 日等權，導致「5 日跌 1.2% 但今日小漲」被判成偏多的矛盾
  let p5 = 0;
  if (f.chg5 > 1.5) p5 = 1; else if (f.chg5 > 0.4) p5 = 0.5;
  else if (f.chg5 < -1.5) p5 = -1; else if (f.chg5 < -0.4) p5 = -0.5;
  let p1 = 0;
  if (f.chg1 > 0.8) p1 = 1; else if (f.chg1 > 0.3) p1 = 0.5;
  else if (f.chg1 < -0.8) p1 = -1; else if (f.chg1 < -0.3) p1 = -0.5;
  const pts = (p5 * 0.67 + p1 * 0.33) * f.weight;
  return { pts, dir: pts > 0.05 ? 'up' : pts < -0.05 ? 'dn' : 'flat' };
}

function renderMarketOutlook() {
  const el = document.getElementById('market-outlook-body');
  if (!el) return;
  const { factors, instTotal } = outlookData;
  if (!factors.length) {
    el.innerHTML = '<div class="adv-loading">載入市場多空分析...</div>';
    return;
  }

  let totalPts = 0, maxPts = 0;
  const rows = factors.map(f => {
    const { pts, dir } = scoreFactor(f);
    totalPts += pts;
    maxPts += Math.abs(f.weight) * (f.type === 'vix' ? 2 : 1);
    return { f, pts, dir };
  });

  // 隔夜訊號 factor（台積電 ADR / 溢價 / EWT）— 與費半去重後計分
  const soxRow = rows.find(r => r.f.sym === '^SOX');
  const ov = scoreOvernight(outlookData.overnight, soxRow?.pts ?? null);
  if (ov) {
    totalPts += ov.pts; maxPts += 2;
    rows.push({ f: { name: '隔夜訊號(台積電ADR)', price: null, chg1: null, display: ov.display },
                pts: ov.pts, dir: ov.dir });
  }

  // 三大法人 factor
  if (instTotal !== null) {
    let pts = 0;
    if (instTotal.foreign > 5000) pts = 2;
    else if (instTotal.foreign > 0) pts = 1;
    else if (instTotal.foreign < -5000) pts = -2;
    else if (instTotal.foreign < 0) pts = -1;
    totalPts += pts; maxPts += 2;
    rows.push({
      f: { name: '外資買賣超(全市場)', price: null, chg1: null,
           display: fmtK(instTotal.foreign) },
      pts, dir: pts > 0 ? 'up' : pts < 0 ? 'dn' : 'flat',
    });
  }

  // 市場寬度 factor (from scanned stocks)
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length >= 10) {
    const bullN = ready.filter(s => verdictScore(s) >= getThreshold('bull')).length;
    const bearN = ready.filter(s => verdictScore(s) <= getThreshold('bear')).length;
    const pct = bullN / ready.length;
    let pts = 0;
    if (pct > 0.5) pts = 2; else if (pct > 0.35) pts = 1;
    else if (bearN / ready.length > 0.5) pts = -2;
    else if (bearN / ready.length > 0.35) pts = -1;
    totalPts += pts; maxPts += 2;
    rows.push({
      f: { name: '市場寬度(掃描池)', price: null, chg1: null,
           display: `多${bullN} / 空${bearN} / 共${ready.length}` },
      pts, dir: pts > 0 ? 'up' : pts < 0 ? 'dn' : 'flat',
    });
  }

  // Composite verdict: normalize to -100..+100
  // 分母用「完整因子組」的理論總權重，而非只用抓到的因子 —
  // 否則只成功 3~4 項時，全部同向就會給出 ±100 的假滿分（與實際盤勢矛盾）
  const fullMax = OUTLOOK_SYMBOLS.reduce((n, c) => n + Math.abs(c.weight) * (c.type === 'vix' ? 2 : 1), 0) + 2 + 2 + 2;
  const denom = Math.max(maxPts, fullMax * 0.75); // 資料齊全度低於 75% 時分母不再縮水
  const norm = denom ? Math.round((totalPts / denom) * 100) : 0;
  const coverage = fullMax ? Math.round(maxPts / fullMax * 100) : 0;
  outlookData.norm = norm;
  outlookData.coverage = coverage;
  let vClass, vIcon, vTitle, vAction;
  if (norm >= 35)       { vClass = 'v-bull';    vIcon = '🐂'; vTitle = '偏多 BULLISH';   vAction = '順勢偏多操作，回檔找買點'; }
  else if (norm >= 15)  { vClass = 'v-bull';    vIcon = '📈'; vTitle = '中性偏多';        vAction = '可小幅偏多，嚴設停損'; }
  else if (norm <= -35) { vClass = 'v-bear';    vIcon = '🐻'; vTitle = '偏空 BEARISH';   vAction = '降低持股、避免追高，反彈減碼'; }
  else if (norm <= -15) { vClass = 'v-bear';    vIcon = '📉'; vTitle = '中性偏空';        vAction = '保守操作，現金為王'; }
  else                  { vClass = 'v-neutral'; vIcon = '⚖️'; vTitle = '中性盤整';        vAction = '區間操作，等待方向表態'; }

  // Prediction text from the strongest factors
  const sorted = [...rows].sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts));
  const drivers = sorted.filter(r => r.pts !== 0).slice(0, 4)
    .map(r => `${r.f.name}${r.pts > 0 ? '偏多' : '偏空'}`).join('、');
  const twii = factors.find(f => f.sym === '^TWII');
  const sox  = factors.find(f => f.sym === '^SOX');
  let predict = `綜合 ${rows.length} 項因子，市場評分 <strong>${norm > 0 ? '+' : ''}${norm}</strong>（區間 -100 ~ +100）`;
  predict += coverage >= 85
    ? '。'
    : `，<span style="color:var(--yellow)">資料完整度 ${coverage}%（部分來源未回應，評分僅供參考）</span>。`;
  if (drivers) predict += `主要驅動：${drivers}。`;
  if (twii?.chg5 != null) predict += ` 加權指數 5 日${twii.chg5 >= 0 ? '上漲' : '下跌'} ${Math.abs(twii.chg5).toFixed(1)}%`;
  if (sox?.chg5 != null)  predict += `，費半 5 日${sox.chg5 >= 0 ? '+' : ''}${sox.chg5.toFixed(1)}%（台股電子權值高度連動）`;
  predict += `。<strong>後市看法：${vAction}。</strong>`;

  const arrow = d => d === 'up' ? '<span style="color:var(--bull)">▲</span>' : d === 'dn' ? '<span style="color:var(--bear)">▼</span>' : '<span style="color:var(--text3)">─</span>';

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);display:flex;align-items:center;gap:8px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        市場多空總覽
      </h3>
      <span style="font-size:0.72rem;color:var(--text3)">台股・美股・匯率・法人・寬度 綜合判斷</span>
    </div>

    <div class="verdict-box ${vClass}">
      <div class="verdict-icon">${vIcon}</div>
      <div>
        <div class="verdict-title">${vTitle}</div>
        <div class="verdict-sub">${vAction}</div>
      </div>
      <div class="verdict-score-wrap">
        <div class="verdict-score" style="color:${norm >= 15 ? 'var(--bull)' : norm <= -15 ? 'var(--bear)' : 'var(--yellow)'}">${norm > 0 ? '+' : ''}${norm}</div>
        <div class="verdict-score-lbl">綜合評分 (-100~+100)</div>
      </div>
    </div>

    <div class="factor-grid">
      ${rows.map(({ f, dir }) => `
        <div class="factor-row">
          <span class="factor-arrow">${arrow(dir)}</span>
          <span class="factor-name">${f.name}</span>
          <span class="factor-val">${f.display ?? (f.price != null ? f.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--')}</span>
          ${f.chg1 != null ? `<span class="factor-chg ${f.chg1 >= 0 ? 'change-up' : 'change-dn'}">${f.chg1 >= 0 ? '+' : ''}${f.chg1.toFixed(2)}%</span>` : ''}
        </div>`).join('')}
    </div>

    ${outlookData.turnover ? (() => {
      const t = outlookData.turnover;
      const c = t.tone === 'bull' ? 'var(--bull)' : t.tone === 'bear' ? 'var(--bear)' : 'var(--yellow)';
      return `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:${c}0d;border-left:3px solid ${c};font-size:0.82rem">
        <span style="color:var(--text3);font-size:0.72rem">大盤量能 ${t.date}｜成交 ${(t.amount/1e8).toFixed(0)} 億（20日均量的 ${t.ratio.toFixed(2)} 倍）</span><br>
        <strong style="color:${c}">${t.verdict}</strong>
      </div>`;
    })() : ''}

    ${(() => {
      const dv = derivsSummary();
      if (!dv) return '';
      const c = dv.dir >= 1 ? 'var(--bull)' : dv.dir <= -1 ? 'var(--bear)' : 'var(--yellow)';
      return `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:${c}0d;border-left:3px solid ${c};font-size:0.8rem">
        <span style="color:var(--text3);font-size:0.72rem">期貨籌碼（期交所${dv.date ? '・' + dv.date : ''}）</span><br>
        ${dv.parts.map(p => `<span style="color:${p.startsWith('⚠') ? 'var(--bear)' : 'var(--text1)'}">${p}</span>`).join('<br>')}
      </div>`;
    })()}

    <div class="outlook-text">${predict}<br>
      <span style="font-size:0.75rem;color:var(--text3)">⚠ 以上為技術面與資金面的規則化分析，僅供參考，非投資建議。</span>
    </div>`;

  // Refresh dependent widgets
  renderSentiment();
  renderEvents();
}

// ── 台股恐慌貪婪指數 ───────────────────────────────────────────────────────
// 自行計算（台股無官方恐貪 API）：VIX、大盤動能、市場寬度、外資資金流 加權合成

function computeFearGreed() {
  const { factors, instTotal } = outlookData;
  if (!factors.length) return null;

  let score = 50;
  const vix  = factors.find(f => f.type === 'vix');
  const twii = factors.find(f => f.sym === '^TWII');
  const sox  = factors.find(f => f.sym === '^SOX');

  // VIX: 12→+15, 35→-25
  if (vix) score += Math.max(-25, Math.min(15, (20 - vix.price) * 1.8));
  // TWII momentum
  if (twii) { score += Math.max(-12, Math.min(12, twii.chg5 * 3)); score += Math.max(-6, Math.min(6, twii.chg1 * 4)); }
  // SOX momentum
  if (sox) score += Math.max(-8, Math.min(8, sox.chg5 * 2));
  // Foreign flow
  if (instTotal) score += instTotal.foreign > 0 ? Math.min(10, instTotal.foreign / 2000) : Math.max(-10, instTotal.foreign / 2000);
  // Breadth
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length >= 10) {
    const bullPct = ready.filter(s => verdictScore(s) >= getThreshold('bull')).length / ready.length;
    score += (bullPct - 0.3) * 40;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function fgLabel(v) {
  if (v >= 75) return { txt: '極度貪婪', color: 'var(--bull)' };
  if (v >= 60) return { txt: '貪婪', color: '#86efac' };
  if (v >= 40) return { txt: '中性', color: 'var(--neutral)' };
  if (v >= 25) return { txt: '恐慌', color: '#fca5a5' };
  return { txt: '極度恐慌', color: 'var(--bear)' };
}

function renderSentiment() {
  const el = document.getElementById('sentiment-body');
  if (!el) return;
  const fg = computeFearGreed();
  if (fg === null) { el.innerHTML = '<div class="adv-loading">計算台股恐貪指數...</div>'; return; }
  const lbl = fgLabel(fg);

  // 今日 / 本週 AI 偏向
  const twii = outlookData.factors.find(f => f.sym === '^TWII');
  const biasOf = chg => chg > 0.4 ? { txt: '偏多 📈', c: 'var(--bull)' } : chg < -0.4 ? { txt: '偏空 📉', c: 'var(--bear)' } : { txt: '中性 ⚖️', c: 'var(--yellow)' };
  const today = twii ? biasOf(twii.chg1) : { txt: '--', c: 'var(--text3)' };
  const week  = twii ? biasOf(twii.chg5) : { txt: '--', c: 'var(--text3)' };

  el.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">台股恐慌貪婪指數</h3>
    <span style="font-size:0.7rem;color:var(--text3)">VIX・大盤動能・市場寬度・外資資金流 合成</span>
    <div class="fg-gauge-wrap">
      <div>
        <div class="fg-value" style="color:${lbl.color}">${fg}</div>
        <div class="fg-label" style="color:${lbl.color}">${lbl.txt}</div>
      </div>
      <div style="flex:1">
        <div class="fg-bar-track"><div class="fg-bar-marker" style="left:${fg}%"></div></div>
        <div class="fg-scale"><span>0 極恐</span><span>25</span><span>50</span><span>75</span><span>100 極貪</span></div>
      </div>
    </div>
    <div class="bias-chips">
      <div class="bias-chip">
        <div class="bias-chip-lbl">今日 AI 走勢偏向</div>
        <div class="bias-chip-val" style="color:${today.c}">${today.txt}</div>
      </div>
      <div class="bias-chip">
        <div class="bias-chip-lbl">本週 AI 走勢偏向</div>
        <div class="bias-chip-val" style="color:${week.c}">${week.txt}</div>
      </div>
    </div>`;
}

// ── 重要財經事件倒計時 ─────────────────────────────────────────────────────

// N 個日曆日內的重大事件（含今日 day=0）— 簡報倒數與研判環境註記共用。
// 用台北日曆日差，不用時數（時數 ceil 會把今天下午的事件標成「1 天後」）
function imminentEvents(withinDays = 5) {
  const fmtTW = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(d);
  const todayTW = twClock().date;
  return (getUpcomingEvents() || [])
    .map(e => {
      const iso = (() => { try { return fmtTW(e.date instanceof Date ? e.date : new Date(e.date)); } catch { return null; } })();
      if (!iso) return null;
      const days = Math.round((new Date(iso + 'T00:00:00Z') - new Date(todayTW + 'T00:00:00Z')) / 86400000);
      return { name: e.name, impact: e.impact, days };
    })
    .filter(e => e && e.days >= 0 && e.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}

function getUpcomingEvents() {
  const now = new Date();
  const events = [];

  // 每月10日：台灣上市公司營收公布截止
  const rev = new Date(now.getFullYear(), now.getMonth(), 10);
  if (rev < now) rev.setMonth(rev.getMonth() + 1);
  events.push({ name: '台灣上市櫃月營收公布截止', date: rev, impact: '個股波動' });

  // 美國 CPI（約每月 13 日公布）
  const cpi = new Date(now.getFullYear(), now.getMonth(), 13);
  if (cpi < now) cpi.setMonth(cpi.getMonth() + 1);
  events.push({ name: '美國 CPI 通膨數據', date: cpi, impact: '全球風向' });

  // FOMC 2026 會議（已知排程）
  const fomcDates = ['2026-01-28','2026-03-18','2026-04-29','2026-06-17','2026-07-29','2026-09-16','2026-10-28','2026-12-09'];
  const nextFomc = fomcDates.map(d => new Date(d + 'T14:00:00')).find(d => d > now);
  if (nextFomc) events.push({ name: 'FOMC 利率決議', date: nextFomc, impact: '重大' });

  // 台灣央行理監事會（季度，2026 約 3/6/9/12 月中下旬）
  const cbcDates = ['2026-03-19','2026-06-18','2026-09-24','2026-12-17'];
  const nextCbc = cbcDates.map(d => new Date(d)).find(d => d > now);
  if (nextCbc) events.push({ name: '台灣央行理監事會議', date: nextCbc, impact: '台股利率' });

  // 台指期結算（每月第三個週三）— 台股自身最固定的波動日，結算前後易有異常拉抬/摜壓
  const settle = (() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + 14);
    if (d < now) {
      const n2 = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      while (n2.getDay() !== 3) n2.setDate(n2.getDate() + 1);
      n2.setDate(n2.getDate() + 14);
      return n2;
    }
    return d;
  })();
  events.push({ name: '台指期月結算', date: settle, impact: '台股波動' });

  // 美國非農（每月第一個週五）
  const nfp = new Date(now.getFullYear(), now.getMonth(), 1);
  while (nfp.getDay() !== 5) nfp.setDate(nfp.getDate() + 1);
  if (nfp < now) {
    nfp.setMonth(nfp.getMonth() + 1); nfp.setDate(1);
    while (nfp.getDay() !== 5) nfp.setDate(nfp.getDate() + 1);
  }
  events.push({ name: '美國非農就業數據', date: nfp, impact: '全球風向' });

  return events.sort((a, b) => a.date - b.date).slice(0, 5);
}

function renderEvents() {
  const el = document.getElementById('events-body');
  if (!el) return;
  const events = getUpcomingEvents();
  const now = new Date();

  // AI 預測：以當前綜合多空評分作為事件前偏向
  const twii = outlookData.factors?.find(f => f.sym === '^TWII');
  const bias = twii && twii.chg5 > 0.5 ? { txt: '預測偏多', bg: 'rgba(34,197,94,0.12)', c: 'var(--bull)' }
             : twii && twii.chg5 < -0.5 ? { txt: '預測偏空', bg: 'rgba(239,68,68,0.12)', c: 'var(--bear)' }
             : { txt: '預測中性', bg: 'rgba(245,158,11,0.1)', c: 'var(--yellow)' };

  el.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">重要財經事件倒計時</h3>
    <span style="font-size:0.7rem;color:var(--text3)">AI 依當前市場動能給出事件前偏向預測</span>
    <div style="margin-top:10px">
      ${events.map(e => {
        const days = Math.ceil((e.date - now) / 86400000);
        const dateStr = `${e.date.getMonth()+1}/${e.date.getDate()}`;
        return `<div class="event-row">
          <div class="event-countdown">${days <= 0 ? '今日' : days + '天'}</div>
          <div>
            <div class="event-name">${e.name}</div>
            <div class="event-date">${dateStr} · 影響：${e.impact}</div>
          </div>
          <span class="event-predict" style="background:${bias.bg};color:${bias.c}">${bias.txt}</span>
        </div>`;
      }).join('')}
    </div>`;
}

// ── 交易日誌 + 止損學習系統 ────────────────────────────────────────────────



// ── 匯入 / 匯出 ────────────────────────────────────────────────────────────








// ── AI 自動交易系統（待進場 → 回踩成交 → 持倉 → 自動止損/停利） ─────────────


// ── SQ 訊號品質評分（台股 12 因子，等級 SS≥11 / S≥9 / A≥6 / B≥4 / C≥2 / D<2）──
// 未達 A 級（6分）不建單；掛單期間每次掃描重評，跌破 B 級自動取消
function computeSQ(s) {
  const a = s.analysis;
  if (!a) return { sq: 0, grade: 'D', gradeLabel: '無數據', factors: [] };
  let sq = 0;
  const factors = [];
  const volR = a.volMA ? a.lastVol / a.volMA : 1;

  // ① EMA 均線結構
  if (a.ema20 > a.ema50 && a.price > a.ema20) { sq += 2; factors.push('✅ EMA 多頭排列且站上 EMA20 +2'); }
  else if (a.price > a.ema20) { sq += 1; factors.push('✅ 站上 EMA20 +1'); }
  else { sq -= 1; factors.push('❌ 均線結構偏弱 -1'); }
  // ② 長線結構 EMA200
  if (a.ema200 && a.price > a.ema200) { sq += 1; factors.push('✅ EMA200 上方（長多結構）+1'); }
  else if (a.ema200 && a.price < a.ema200) { sq -= 1; factors.push('❌ EMA200 下方 -1'); }
  // ③ RSI 健康多頭區
  if (a.rsi != null && a.rsi >= 50 && a.rsi < 68) { sq += 1; factors.push(`✅ RSI ${a.rsi.toFixed(0)} 健康多頭區 +1`); }
  else if (a.rsi != null && a.rsi >= 72) { sq -= 1; factors.push(`❌ RSI ${a.rsi.toFixed(0)} 過熱 -1`); }
  // ④ MACD
  if (a.macd?.macd > a.macd?.signal && a.macd?.hist > 0) { sq += 1; factors.push('✅ MACD 金叉且柱體擴張 +1'); }
  else if (a.macd?.macd < a.macd?.signal) { sq -= 1; factors.push('❌ MACD 死叉 -1'); }
  // ⑤ ADX 趨勢強度
  if (a.adx >= 30) { sq += 1; factors.push(`✅ ADX ${a.adx.toFixed(0)} 趨勢強勁 +1`); }
  else if (a.adx != null && a.adx < 20) { sq -= 1; factors.push(`❌ ADX ${a.adx.toFixed(0)} 過弱 -1`); }
  // ⑥ 量能（溫和放量最佳，爆量或萎縮扣分）
  if (volR >= 1.3 && volR <= 3) { sq += 1; factors.push(`✅ 溫和放量 ${volR.toFixed(1)}x +1`); }
  else if (volR < 0.6) { sq -= 1; factors.push(`❌ 量能萎縮 ${volR.toFixed(1)}x -1`); }
  // ⑦ 綜合評分強度
  if (a.score >= 80) { sq += 2; factors.push(`✅ 綜合評分 ${a.score} 極強 +2`); }
  else if (a.score >= 72) { sq += 1; factors.push(`✅ 綜合評分 ${a.score} +1`); }
  // ⑧ 大盤環境
  const norm = outlookData.norm ?? 0;
  if (norm >= 15) { sq += 1; factors.push(`✅ 大盤偏多（${Math.round(norm)}）+1`); }
  else if (norm <= -15) { sq -= 2; factors.push(`❌ 大盤偏空（${Math.round(norm)}）-2`); }
  // ⑨ 法人籌碼（loadInstitutionalOverview 附掛的外資買賣超）
  if (s.foreign != null) {
    if (s.foreign > 1000) { sq += 1; factors.push(`✅ 外資買超 ${s.foreign.toLocaleString()} 張 +1`); }
    else if (s.foreign < -1000) { sq -= 1; factors.push(`❌ 外資賣超 ${Math.abs(s.foreign).toLocaleString()} 張 -1`); }
  }
  // ⑩ 布林位置（中軌與上軌之間 = 多頭有序推進）
  if (a.boll && a.price > a.boll.middle && a.price < a.boll.upper) { sq += 1; factors.push('✅ 布林中上軌區間推進 +1'); }
  // ⑪ 20 日動能
  const closes = s.ohlcv.map(d => d.close);
  if (closes.length >= 21) {
    const ret20 = (a.price - closes[closes.length - 21]) / closes[closes.length - 21] * 100;
    if (ret20 > 5) { sq += 1; factors.push(`✅ 20日動能 +${ret20.toFixed(1)}% +1`); }
    else if (ret20 < -5) { sq -= 1; factors.push(`❌ 20日動能 ${ret20.toFixed(1)}% -1`); }
  }
  // ⑫ 突破結構（貼近 20 日高點）
  const hi20 = Math.max(...s.ohlcv.slice(-20).map(d => d.high));
  if (a.price >= hi20 * 0.99) { sq += 1; factors.push('✅ 貼近 20 日高點（突破結構）+1'); }

  sq = Math.max(0, sq);
  const grade = sq >= 11 ? 'SS' : sq >= 9 ? 'S' : sq >= 6 ? 'A' : sq >= 4 ? 'B' : sq >= 2 ? 'C' : 'D';
  const gradeLabel = { SS: '完美訊號', S: '頂級訊號', A: '優質訊號', B: '良好訊號', C: '一般訊號', D: '訊號偏弱' }[grade];
  return { sq, grade, gradeLabel, factors };
}

function sqGradeColor(grade) {
  return { SS: '#ff6ef7', S: '#f0c040', A: '#22c55e', B: '#60a5fa', C: '#f59e0b', D: '#ef4444' }[grade] || '#9ca3af';
}












// 某年某月的第三個星期五（富時/ETF 成分股調整生效日）
function thirdFriday(y, m) {
  const d = new Date(y, m, 1);
  // 先找到當月第一個週五，再加兩週
  d.setDate(1 + ((5 - d.getDay() + 7) % 7) + 14);
  return d;
}

function getCapitalFlowEvents() {
  const now = new Date();
  const horizon = 183 * 86400000;
  const out = [];
  const push = (d, name, dir, desc) => {
    const diff = d - now;
    if (diff > -86400000 && diff <= horizon) out.push({ date: d, name, dir, desc });
  };
  for (const y of [now.getFullYear(), now.getFullYear() + 1]) {
    push(new Date(y, 0, 10), '年終獎金行情', 'in', '散戶資金回流，中小型與題材股活躍');
    push(new Date(y, 4, 1),  '綜所稅繳稅賣壓（5月）', 'out', '繳稅資金抽離市場，量能轉弱');
    push(new Date(y, 6, 1),  '除權息旺季（7-8月）', 'in', '現金股利逾兆元回流市場，高股息與權值股受惠');
    for (const m of [1, 4, 7, 10]) push(new Date(y, m, 28), 'MSCI 季度調整生效', 'mix', '外資被動資金調整台股權重，尾盤爆量');
    for (const m of [2, 5, 8, 11]) push(thirdFriday(y, m), '富時/ETF 成分股調整', 'mix', '0050 等被動基金換股，成分股進出現大量');
    for (const m of [2, 5, 8, 11]) push(new Date(y, m + 1, 0), '投信季底作帳', 'in', '投信拉抬持股淨值，集中買超中小型股');
    for (const m of [0, 3, 6, 9]) push(new Date(y, m, 15), '台積電法說會', 'mix', '電子權值風向球，半導體族群波動加大');
  }
  return out.sort((a, b) => a.date - b.date).slice(0, 8);
}

function renderCapitalFlow() {
  const el = document.getElementById('capital-flow-body');
  if (!el) return;
  const events = getCapitalFlowEvents();
  const now = new Date();
  const dirTag = d => d === 'in'
    ? '<span class="event-predict" style="background:rgba(34,197,94,0.12);color:var(--bull)">資金流入</span>'
    : d === 'out'
    ? '<span class="event-predict" style="background:rgba(239,68,68,0.12);color:var(--bear)">資金流出</span>'
    : '<span class="event-predict" style="background:rgba(245,158,11,0.1);color:var(--yellow)">雙向波動</span>';

  el.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">台股資金流動事件</h3>
    <span style="font-size:0.7rem;color:var(--text3)">未來六個月內影響台股資金動能的關鍵日程</span>
    <div style="margin-top:10px">
      ${events.map(e => {
        const days = Math.max(0, Math.ceil((e.date - now) / 86400000));
        return `<div class="event-row">
          <div class="event-countdown">${days === 0 ? '本週' : days + '天'}</div>
          <div style="min-width:0">
            <div class="event-name">${e.name}</div>
            <div class="event-date">${e.date.getMonth()+1}/${e.date.getDate()} · ${e.desc}</div>
          </div>
          ${dirTag(e.dir)}
        </div>`;
      }).join('')}
    </div>`;
}

// ── 策略報表（月度 / 年度） ────────────────────────────────────────────────

let reportPeriod = 'month';



// ── Institutional Overview (全市場三大法人) ────────────────────────────────

async function loadInstitutionalOverview() {
  const el = document.getElementById('institutional-body');
  const rows = await fetchT86All();
  if (!rows || !rows.length) {
    if (el) el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">三大法人資料暫時無法取得（非交易日或 TWSE API 未更新）</p>';
    return;
  }

  // Sum market-wide totals (張) — 欄位以名稱定位，避免索引錯位
  let foreign = 0, investment = 0, dealer = 0, total = 0;
  const idx = t86ColIdx();
  const parsed = rows.map(r => parseT86Row(r, idx)).filter(p => isRealStockId(p.id));
  parsed.forEach(p => { foreign += p.foreign; investment += p.investment; dealer += p.dealer; total += p.total; });

  // 把個股法人買賣超附加到 allStocks（供機會實驗室「主力吸貨」偵測用）
  const instMap = {};
  parsed.forEach(p => { if (p.id) instMap[p.id] = p; });
  allStocks.forEach(s => {
    const m = instMap[s.id];
    if (m) { s.foreign = m.foreign; s.investment = m.investment; s.dealer = m.dealer; s.instTotal = m.total; }
  });

  // 逐日累積個股法人真實歷史（個股頁 5 日籌碼趨勢用真實數據取代模擬）
  try {
    const hist = JSON.parse(localStorage.getItem('inst-hist') || '{}');
    const dataDate = localStorage.getItem('t86-last-date') || new Date().toISOString().slice(0, 10);
    allStocks.forEach(s => {
      const m = instMap[s.id];
      if (!m) return;
      const arr = hist[s.id] = hist[s.id] || [];
      if (!arr.some(r => r.d === dataDate))
        arr.push({ d: dataDate, f: m.foreign, i: m.investment, dl: m.dealer, p: s.analysis?.price ?? null });
      else {
        const rec = arr.find(r => r.d === dataDate);
        if (rec && rec.p == null && s.analysis?.price) rec.p = s.analysis.price;
      }
      if (arr.length > 10) hist[s.id] = arr.slice(-10);
    });
    localStorage.setItem('inst-hist', JSON.stringify(hist));
  } catch {}

  outlookData.instTotal = { foreign, investment, dealer, total };
  renderMarketOutlook();

  const topBuy  = [...parsed].sort((a, b) => b.foreign - a.foreign).slice(0, 5);
  const topSell = [...parsed].sort((a, b) => a.foreign - b.foreign).slice(0, 5);

  const fmtInst = v => {
    const cls = v > 0 ? 'inst-bull' : v < 0 ? 'inst-bear' : 'inst-neutral';
    return `<span class="${cls}">${v > 0 ? '+' : ''}${v.toLocaleString()} 張</span>`;
  };

  if (el) el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2)">三大法人全市場買賣超</h3>
      <span style="font-size:0.72rem;color:var(--text3)">單位：張</span>
    </div>
    <div class="inst-grid">
      <div class="inst-card"><div class="inst-card-lbl">外資</div><div class="inst-card-val">${fmtInst(foreign)}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">投信</div><div class="inst-card-val">${fmtInst(investment)}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">自營商</div><div class="inst-card-val">${fmtInst(dealer)}</div></div>
    </div>
    <div class="inst-top-row">
      <div class="inst-top-list">
        <div class="inst-top-ttl">🟢 外資買超 Top 5</div>
        ${topBuy.map(p => `<div class="inst-top-item" onclick="openStock('${p.id}')"><span>${p.id} ${p.name}</span>${fmtInst(p.foreign)}</div>`).join('')}
      </div>
      <div class="inst-top-list">
        <div class="inst-top-ttl">🔴 外資賣超 Top 5</div>
        ${topSell.map(p => `<div class="inst-top-item" onclick="openStock('${p.id}')"><span>${p.id} ${p.name}</span>${fmtInst(p.foreign)}</div>`).join('')}
      </div>
    </div>`;
}

// ── Market Index ───────────────────────────────────────────────────────────

function renderMarketIndex(data) {
  if (!data || data.length < 2) {
    document.getElementById('market-index-body').innerHTML = '<p style="color:var(--text3);font-size:0.85rem">大盤指數暫時無法載入</p>';
    return;
  }
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const chg  = last.close - prev.close;
  const chgPct = (chg / prev.close * 100);
  const isUp = chg >= 0;
  const color = isUp ? 'var(--bull)' : 'var(--bear)';

  document.getElementById('market-index-body').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);display:flex;align-items:center;gap:8px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 1 18"/></svg>
        大盤指數
      </h3>
      <span style="font-size:0.75rem;color:var(--text3)">${last.time}</span>
    </div>
    <div class="index-row">
      <div class="index-card">
        <div class="index-card-lbl">加權指數 TWII</div>
        <div class="index-card-val" style="color:${color}">${last.close.toLocaleString()}</div>
        <div class="index-card-chg" style="color:${color}">${isUp ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)} (${chgPct > 0 ? '+' : ''}${chgPct.toFixed(2)}%)</div>
      </div>
      <div class="index-card">
        <div class="index-card-lbl">今日開盤</div>
        <div class="index-card-val">${last.open?.toLocaleString() ?? '--'}</div>
      </div>
      <div class="index-card">
        <div class="index-card-lbl">今日最高</div>
        <div class="index-card-val" style="color:var(--bull)">${last.high?.toLocaleString() ?? '--'}</div>
      </div>
      <div class="index-card">
        <div class="index-card-lbl">今日最低</div>
        <div class="index-card-val" style="color:var(--bear)">${last.low?.toLocaleString() ?? '--'}</div>
      </div>
    </div>`;
}



// ── 即時價流入完整分析 ─────────────────────────────────────────────────────
// 先前只更新 analysis.price，指標（RSI/MACD/EMA/ADX/趨勢/型態）與研判評分
// 仍停在掃描當下 —— 價格是即時的，結論卻是舊的。
// 這裡以更新後的 K 棒重算整份分析，研判快取因物件更換而自動失效。
function recomputeAnalysis(s) {
  if (!s?.ohlcv || s.ohlcv.length < 20) return false;
  try {
    const prev = s.analysis;
    const next = calculateScore(s.ohlcv);
    // 重算結果不完整就保留原分析 —— 寧可指標稍舊，也不能讓整份分析消失
    if (!next || next.price == null) return false;
    s.analysis = next;
    s.reversal = detectReversal(s.ohlcv, next);
    if (!next.prevClose && prev?.prevClose) next.prevClose = prev.prevClose;
    s._anaPrice = next.price;                   // 記錄重算當下的價格，供漲跌幅門檻判斷
    const prevStance = s._verdict?.stance, prevDir = s._verdict?.dir;
    delete s._verdict;                          // 研判必須跟著重算
    // 即時價帶動研判翻轉（多↔空）時記一筆流水帳 —— 盤中最需要被看見的變化
    if (prevStance) {
      const v = getVerdict(s);
      if (v && v.stance !== prevStance && Math.sign(v.dir) !== Math.sign(prevDir) && Math.sign(v.dir) !== 0)
        logSignal('flip', `${s.name}（${s.id}）研判由「${prevStance}」轉為「${v.stance}」`,
          `現價 ${next.price}｜綜合 ${v.score}`, { id: s.id, dir: Math.sign(v.dir), dedupKey: `${s.id}|${v.stance}` });
    }
    return true;
  } catch (e) { console.warn(`重算分析失敗 ${s.id}:`, e); return false; }
}

// 決定哪些股票需要重算：正在檢視的、持倉、追蹤中的訊號一定重算；
// 其餘只在價格較上次重算變動 >=0.2% 時才重算（避免每 15 秒空轉 100 檔）
function pickRecomputeTargets(updated, cap = 40) {
  const must = new Set([currentStockId,
    ...getHoldings().map(h => h.id),
    ...getAiSignals().filter(t => t.status === 'open').map(t => t.id)].filter(Boolean));
  const moved = [];
  for (const s of updated) {
    if (must.has(s.id)) continue;
    const base = s._anaPrice;
    const d = base > 0 ? Math.abs(s.analysis.price - base) / base : 1;
    if (d >= 0.002) moved.push({ s, d });
  }
  moved.sort((a, b) => b.d - a.d);
  return [...updated.filter(s => must.has(s.id)), ...moved.slice(0, Math.max(0, cap - must.size)).map(x => x.s)];
}

// ── 資料新鮮度：日 K 落後幾個交易日 ────────────────────────────────────────
// 為什麼需要：當月 STOCK_DAY 請求失敗時，過去月份仍有 7 天快取，
// 於是資料停在上個月底卻「有資料」，既不會被重試、也照樣拿去算分數與給建議。
function tradingDaysBetween(fromISO, toISO) {
  if (!fromISO || !toISO || fromISO >= toISO) return 0;
  let n = 0;
  const d = new Date(`${fromISO}T00:00:00Z`), end = new Date(`${toISO}T00:00:00Z`);
  while (d < end) {
    d.setUTCDate(d.getUTCDate() + 1);
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

function dataAgeDays(s) {
  if (!s?.ohlcv?.length) return null;
  const last = String(s.ohlcv[s.ohlcv.length - 1].time).slice(0, 10);
  return tradingDaysBetween(last, twClock().date);
}

// 資料落後 3 個交易日以上即視為過期：分數與建議都不該再採信
const STALE_LIMIT = 3;
function isStaleData(s) { const n = dataAgeDays(s); return n != null && n >= STALE_LIMIT; }

// ── 權威研判：全站唯一結論來源 ─────────────────────────────────────────────
// 過去有三套獨立評分並存 —— 排名頁用 calculateScore（純技術）、交易員視角與
// AI 研判用 buildManagerAnalysis（證據加權，含籌碼／基本面／趨勢引擎／新聞）、
// 推薦交易用 scoreStockDimensions（五維度）。同一檔股票因此會在不同頁面得到
// 相反結論。現在一律以 buildManagerAnalysis 為準，排名分數由其淨方向換算，
// 五維度僅用於「推薦與否」的額外門檻，不再影響方向判定。
function getVerdict(s) {
  if (!s?.analysis) return null;
  // 資料過期就不該再給方向與分數 —— 用三週前的 K 線算出「強勢多頭」會誤導決策
  if (s._staleDays >= STALE_LIMIT)
    return { score: 50, signal: '資料過期', dir: 0, stance: '資料過期',
             stanceColor: 'var(--yellow)', agr: 0, conf: 0, m: null, stale: s._staleDays };
  if (s._verdict && s._verdictOf === s.analysis) return s._verdict;
  // 再入防護：研判的任何輸入若不慎回頭呼叫本函式，退回技術分而非無限遞迴
  if (s._verdictBusy) return { score: s.analysis.score, signal: s.analysis.signal, dir: 0,
                               stance: s.analysis.signal, agr: 0, conf: 0, m: null };
  s._verdictBusy = true;
  let m = null;
  try { m = buildManagerAnalysis(s); } finally { s._verdictBusy = false; }
  if (!m) return null;
  // 淨方向 → 0~100（dir 實務區間約 ±10；±6 已是極端）
  const score = Math.max(0, Math.min(100, Math.round(50 + m.dir * 6)));
  const bull = getThreshold('bull'), bear = getThreshold('bear');
  const signal = score >= bull + 15 ? '強勢多頭' : score >= bull ? '多頭'
               : score <= bear - 10 ? '強勢空頭' : score <= bear ? '空頭' : '中性';
  const v = { score, signal, dir: m.dir, stance: m.stance, stanceColor: m.stanceColor,
              agr: m.agr, conf: m.conf, m };
  s._verdict = v; s._verdictOf = s.analysis;
  return v;
}
// 排名／寬度等處統一取用（取不到研判時退回技術分，並標記來源）
function verdictScore(s) { return getVerdict(s)?.score ?? s.analysis?.score ?? 50; }
function verdictSignal(s) { return getVerdict(s)?.signal ?? s.analysis?.signal ?? '中性'; }

// ── 族群排名（依成交量）─────────────────────────────────────────────────────
// 先看資金流向哪個族群，再看族群內誰最強 —— 比一次攤開 100 檔更符合實際選股順序。
// 成交金額（價 × 量）比成交張數公平：低價股的張數天生較大。
let sectorOpen = null;

function sectorStats() {
  const ready = allStocks.filter(s => s.analysis && s.ohlcv?.length);
  const map = {};
  for (const s of ready) {
    const sec = s.sector || '其他';
    const g = map[sec] = map[sec] || { sector: sec, value: 0, vol: 0, n: 0, bull: 0, bear: 0, chgSum: 0, stocks: [] };
    const a = s.analysis;
    const vol = a.lastVol || 0;                    // 股
    g.value += vol * a.price;                      // 成交金額（元）
    g.vol += vol;
    g.n++;
    const sig = verdictSignal(s);
    if (sig.includes('多')) g.bull++;
    else if (sig.includes('空')) g.bear++;
    const chg = a.prevClose ? (a.price - a.prevClose) / a.prevClose * 100 : 0;
    g.chgSum += chg;
    g.stocks.push(s);
  }
  return Object.values(map)
    .map(g => ({ ...g, avgChg: g.n ? g.chgSum / g.n : 0,
                 rotation: sectorRotation(g.stocks),
                 score: g.n ? Math.round(g.stocks.reduce((x, s) => x + verdictScore(s), 0) / g.n) : 50 }))
    .sort((a, b) => b.value - a.value);
}

// 族群資金輪動：近 5 日平均報酬 −（近 20 日平均報酬 ÷ 4）＝短期是否「加速」。
// 排名快照只看得到「現在誰大」，輪動看的是「資金正往哪裡去」— 波段要買
// 加速中的族群，不是已經漲完的族群。
function sectorRotation(stocks) {
  let r5s = 0, r20s = 0, n = 0;
  for (const s of stocks) {
    const c = s.ohlcv?.map(b => b.close);
    if (!c || c.length < 21) continue;
    const p = c[c.length - 1];
    r5s += (p - c[c.length - 6]) / c[c.length - 6] * 100;
    r20s += (p - c[c.length - 21]) / c[c.length - 21] * 100;
    n++;
  }
  if (n < 2) return null;                              // 樣本太少不判
  const r5 = r5s / n, r20 = r20s / n;
  const accel = +(r5 - r20 / 4).toFixed(2);            // 近 5 日跑贏自身月線步調的幅度
  return { r5: +r5.toFixed(2), r20: +r20.toFixed(2), accel,
           state: accel >= 1.5 ? 'in' : accel <= -1.5 ? 'out' : 'flat' };
}

// ── 族群論點引擎：哪個族群現在好、為什麼、有什麼佐證 ─────────────────────
// 「AI 族群🔥流入」只是現象；論點要能回答為什麼 — 動能／量能／籌碼／
// 新聞／基本面五路證據各自具名，缺哪路就誠實少哪路，湊不齊就不喊看好。
function sectorThesis() {
  const stats = sectorStatsCached();
  const out = [];
  stats.forEach((g, idx) => {
    if (g.n < 2) return;                       // 單檔不成族群
    const ev = [];
    let pts = 0;
    // ① 資金動能（輪動加速度）
    if (g.rotation?.state === 'in') { pts += 2; ev.push(`資金動能：5 日平均 ${g.rotation.r5 >= 0 ? '+' : ''}${g.rotation.r5}%，相對自身月線步調加速（資金流入中）`); }
    else if (g.rotation?.state === 'out') { pts -= 2; ev.push(`資金動能：5 日 ${g.rotation.r5}%，資金流出中`); }
    // ② 量能地位
    if (idx < 5) { pts += 1; ev.push(`量能：成交金額全市場第 ${idx + 1} 名 — 主戰場，進出不愁流動性`); }
    // ③ 籌碼（成分股法人合計）
    const net = g.stocks.reduce((a, s) => a + ((s.foreign ?? 0) + (s.investment ?? 0)), 0);
    if (net > 500) { pts += 1; ev.push(`籌碼：成分股法人合計買超 ${net.toLocaleString()} 張`); }
    else if (net < -500) { pts -= 1; ev.push(`籌碼：成分股法人合計賣超 ${Math.abs(net).toLocaleString()} 張`); }
    // ④ 新聞佐證（近 7 日，引用實際標題）
    const ns = _newsSignals?.sectors?.[g.sector];
    if (ns && Math.abs(ns.score) >= 2) {
      pts += ns.score > 0 ? 2 : -2;
      const cite = ns.items?.length ? `，如「${typeof ns.items[0] === 'object' ? ns.items[0].h : ns.items[0]}」` : '';
      ev.push(`新聞面：近 7 日 ${ns.n} 則相關新聞偏${ns.score > 0 ? '多' : '空'}${cite}`);
    }
    // ⑤ 基本面佐證（成分股營收）
    const yoys = g.stocks.map(s => s.rev?.yoy).filter(v => v != null);
    if (yoys.length >= 2) {
      const avg = yoys.reduce((a, b) => a + b, 0) / yoys.length;
      const grow = yoys.filter(v => v >= 10).length;
      if (avg >= 10) { pts += 2; ev.push(`基本面：平均營收年增 +${avg.toFixed(0)}%（${grow}/${yoys.length} 檔雙位數成長）— 漲勢有獲利支撐`); }
      else if (avg <= -5) { pts -= 2; ev.push(`基本面：平均營收年減 ${avg.toFixed(0)}% — 缺乏獲利支撐`); }
      else ev.push(`基本面：平均營收年增 ${avg >= 0 ? '+' : ''}${avg.toFixed(0)}% — 支撐普通，漲勢偏資金行情`);
    }
    // ⑥ 內部寬度
    if (g.bull >= 2 && g.bull > g.bear * 2) { pts += 1; ev.push(`寬度：族群內 ${g.bull}/${g.n} 檔偏多 — 是族群行情不是單兵`); }
    const leader = [...g.stocks].sort((a, b) => verdictScore(b) - verdictScore(a))[0];
    out.push({ sector: g.sector, pts, ev, n: g.n,
               leader: leader ? { id: leader.id, name: leader.name, score: verdictScore(leader) } : null });
  });
  out.sort((a, b) => b.pts - a.pts);
  return out;
}

function renderSectorThesis() {
  const el = document.getElementById('sector-thesis-body');
  if (!el) return;
  const all = sectorThesis();
  if (!all.length) { el.innerHTML = '<div class="adv-loading">等待掃描完成...</div>'; return; }
  const good = all.filter(x => x.pts >= 4).slice(0, 3);
  const bad = all.filter(x => x.pts <= -2).slice(-2);
  const card = (x, tone) => `
    <div style="padding:11px 13px;border-radius:9px;background:${tone}0d;border-left:3px solid ${tone};margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.86rem">${x.sector}</strong>
        <span style="font-size:0.66rem;padding:1px 8px;border-radius:9px;background:${tone}22;color:${tone};font-weight:700">論點分 ${x.pts > 0 ? '+' : ''}${x.pts}</span>
        ${x.leader ? `<span style="margin-left:auto;font-size:0.7rem;color:var(--text3)">領頭羊 <span style="cursor:pointer;color:var(--blue)" onclick="openStock('${x.leader.id}')">${x.leader.name}</span>（評分 ${x.leader.score}）</span>` : ''}
      </div>
      <div style="font-size:0.75rem;color:var(--text2);margin-top:5px;line-height:1.8">${x.ev.map(e => `・${e}`).join('<br>')}</div>
    </div>`;
  el.innerHTML =
    (good.length
      ? good.map(x => card(x, 'var(--bull)')).join('')
      : '<div style="font-size:0.78rem;color:var(--text3);margin-bottom:8px">目前沒有族群同時具備「動能＋佐證」的完整論點（論點分 ≥4）— 輪動不明朗時，個股選擇比族群押注重要。</div>') +
    (bad.length ? `<div style="font-size:0.72rem;color:var(--text3);margin:6px 0 4px">看淡（證據偏空）</div>` + bad.map(x => card(x, 'var(--bear)')).join('') : '');
}

function renderSectorRanking() {
  const el = document.getElementById('sector-body');
  if (!el) return;
  const cnt = document.getElementById('sector-count');
  const list = sectorStats();
  if (cnt) cnt.textContent = list.length;
  if (!list.length) { el.innerHTML = '<div class="adv-loading">等待掃描完成...</div>'; return; }
  const maxVal = Math.max(...list.map(g => g.value), 1);
  const fmtVal = v => v >= 1e8 ? `${(v / 1e8).toFixed(1)} 億` : `${Math.round(v / 1e4).toLocaleString()} 萬`;

  // 輪動摘要列：資金正在流入／流出哪些族群（依加速度排序）
  const withRot = list.filter(g => g.rotation);
  const inflow = withRot.filter(g => g.rotation.state === 'in').sort((a, b) => b.rotation.accel - a.rotation.accel).slice(0, 3);
  const outflow = withRot.filter(g => g.rotation.state === 'out').sort((a, b) => a.rotation.accel - b.rotation.accel).slice(0, 3);
  const rotBar = (inflow.length || outflow.length) ? `
    <div style="padding:8px 14px;border-bottom:1px solid var(--border);font-size:0.73rem;line-height:1.9">
      ${inflow.length ? `<span style="color:var(--text3)">🔥 資金流入中：</span>${inflow.map(g => `<span style="color:var(--bull);font-weight:600">${g.sector}（5日+${g.rotation.r5}%）</span>`).join('・')}` : ''}
      ${inflow.length && outflow.length ? '<br>' : ''}
      ${outflow.length ? `<span style="color:var(--text3)">🧊 資金流出中：</span>${outflow.map(g => `<span style="color:var(--bear);font-weight:600">${g.sector}（5日${g.rotation.r5}%）</span>`).join('・')}` : ''}
      <span style="display:block;font-size:0.66rem;color:var(--text3)">輪動＝近 5 日報酬相對自身月線步調的加速度；波段優先選加速中的族群</span>
    </div>` : '';

  el.innerHTML = rotBar + list.map((g, i) => {
    const pct = g.value / maxVal * 100;
    const c = g.avgChg >= 0 ? 'var(--bull)' : 'var(--bear)';
    return `
    <div style="display:flex;align-items:center;gap:12px;padding:9px 14px;border-bottom:1px solid var(--border);cursor:pointer"
         onclick="openSector('${g.sector.replace(/'/g, "\\'")}')">
      <span style="font-family:var(--mono);font-size:0.72rem;color:var(--text3);min-width:22px">${i + 1}</span>
      <div style="min-width:104px">
        <div style="font-size:0.85rem;font-weight:700">${g.sector}${g.rotation?.state === 'in' ? ' <span style="font-size:0.62rem;color:var(--bull)">🔥流入</span>' : g.rotation?.state === 'out' ? ' <span style="font-size:0.62rem;color:var(--bear)">🧊流出</span>' : ''}</div>
        <div style="font-size:0.68rem;color:var(--text3)">${g.n} 檔・多 ${g.bull} / 空 ${g.bear}</div>
      </div>
      <div style="flex:1;min-width:70px">
        <div style="height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--blue)"></div>
        </div>
      </div>
      <span style="font-family:var(--mono);font-size:0.76rem;min-width:74px;text-align:right">${fmtVal(g.value)}</span>
      <span style="font-family:var(--mono);font-size:0.76rem;color:${c};min-width:56px;text-align:right">${g.avgChg >= 0 ? '+' : ''}${g.avgChg.toFixed(2)}%</span>
      <span style="font-size:0.72rem;color:var(--text3);min-width:44px;text-align:right">評分 ${g.score}</span>
    </div>`;
  }).join('');
}

function openSector(sector) {
  sectorOpen = sector;
  const card = document.getElementById('sector-detail');
  const secCard = document.getElementById('sector-card');
  const body = document.getElementById('sector-detail-body');
  const title = document.getElementById('sector-detail-name');
  if (!card || !body) return;
  if (title) title.textContent = `${sector} · 依成交量排名`;
  if (secCard) secCard.style.display = 'none';
  card.style.display = '';

  const inSector = allStocks.filter(s => s.analysis && (s.sector || '其他') === sector);
  const byMkt = { twse: [], tpex: [] };
  inSector.forEach(s => { (byMkt[stockMarket(s)] || byMkt.twse).push(s); });
  const sortVol = arr => arr.sort((a, b) => (b.analysis.lastVol * b.analysis.price) - (a.analysis.lastVol * a.analysis.price));

  const block = (label, arr) => {
    if (!arr.length) return `<div style="padding:10px 14px"><div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:4px">${label}</div>
      <div style="font-size:0.76rem;color:var(--text3)">此族群無${label}標的</div></div>`;
    return `<div style="padding:10px 14px 4px">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:6px">${label}（${arr.length} 檔）</div>
      <div class="tbl-scroll"><table class="data-tbl" style="width:100%">
        <thead><tr><th>#</th><th>股票</th><th>股價</th><th>今日漲跌</th><th>成交量</th><th>成交金額</th><th>研判</th><th>評分</th></tr></thead>
        <tbody>${sortVol(arr).map((s, i) => {
          const a = s.analysis;
          const chg = a.prevClose ? (a.price - a.prevClose) / a.prevClose * 100 : null;
          const val = (a.lastVol || 0) * a.price;
          const sig = verdictSignal(s), sc = verdictScore(s);
          return `<tr onclick="openStock('${s.id}')">
            <td style="color:var(--text3)">${i + 1}</td>
            <td><div class="stock-cell"><div class="stock-cell-info">
              <span class="stock-cell-id">${s.id}</span><span class="stock-cell-name">${s.name}</span></div></div></td>
            <td class="price-mono">${a.price?.toFixed(2) ?? '--'}</td>
            <td>${chg != null ? `<span class="${chg >= 0 ? 'change-up' : 'change-dn'}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>` : '--'}</td>
            <td class="vol-cell">${fmtVol(a.lastVol)}</td>
            <td class="price-mono" style="color:var(--text2)">${val >= 1e8 ? (val / 1e8).toFixed(2) + ' 億' : Math.round(val / 1e4).toLocaleString() + ' 萬'}</td>
            <td><span class="trend-badge trend-${signalClass(sig)}">${sig}</span></td>
            <td><span class="score-val" style="color:${scoreToColor(sc)}">${sc}</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div></div>`;
  };
  body.innerHTML = block('上市', byMkt.twse) + block('上櫃', byMkt.tpex);
}

function closeSectorDetail() {
  sectorOpen = null;
  const card = document.getElementById('sector-detail');
  const secCard = document.getElementById('sector-card');
  if (card) card.style.display = 'none';
  if (secCard) secCard.style.display = '';
}

// ── Ranking ────────────────────────────────────────────────────────────────

// 市場別判定：清單標記優先，其次看掃描過程記住的來源（自選股）
function stockMarket(s) {
  if (s.mkt) return s.mkt;
  try {
    if (localStorage.getItem(`mkt:${s.id}`) === 'tpex' || localStorage.getItem(`sym-suffix:${s.id}`) === 'TWO') return 'tpex';
    if (localStorage.getItem(`mkt:${s.id}`) === 'twse') return 'twse';
  } catch {}
  return 'twse'; // 無標記的自選股預設歸上市（興櫃無官方日 K，不支援）
}

let rankingMarket = 'all';

function renderRanking() {
  const ready = allStocks.filter(s => s.analysis);
  const q = (document.getElementById('dash-search')?.value || '').trim().toLowerCase();

  let filtered;
  if (q) {
    // 搜尋是明確意圖：不受多空/市場篩選限制，且包含尚未取得分析的標的
    filtered = allStocks.filter(s => s.id.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q));
  } else {
    filtered = rankingFilter === 'all' ? ready : ready.filter(s => verdictSignal(s) === rankingFilter);
    if (rankingMarket !== 'all') filtered = filtered.filter(s => stockMarket(s) === rankingMarket);
  }

  // Sort
  filtered.sort((a, b) => {
    // 尚未取得分析的排在後面（搜尋時才會出現）
    if (!a.analysis !== !b.analysis) return a.analysis ? -1 : 1;
    if (!a.analysis) return 0;
    let va, vb;
    if (rankingSort.col === 'score') { va = verdictScore(a); vb = verdictScore(b); }
    else if (rankingSort.col === 'price') { va = a.analysis.price; vb = b.analysis.price; }
    else if (rankingSort.col === 'rsi') { va = a.analysis.rsi || 0; vb = b.analysis.rsi || 0; }
    else if (rankingSort.col === 'adx') { va = a.analysis.adx || 0; vb = b.analysis.adx || 0; }
    else { va = verdictScore(a); vb = verdictScore(b); }
    return rankingSort.dir * (vb - va);
  });

  renderSectorRanking();
  try { renderSectorThesis(); } catch {}
  if (sectorOpen) openSector(sectorOpen);   // 掃描更新時保持已展開的族群

  // 搜尋時把結果表移到族群排名上方 —— 否則結果落在下方看不見，像是「查不到」
  const rankCard = document.getElementById('ranking-results');
  const secCard = document.getElementById('sector-card');
  const detCard = document.getElementById('sector-detail');
  if (rankCard?.parentNode && secCard && rankCard.parentNode === secCard.parentNode) {
    if (q) {
      if (rankCard.nextElementSibling !== secCard) secCard.parentNode.insertBefore(rankCard, secCard);
    } else {
      const anchor = detCard && detCard.parentNode === rankCard.parentNode ? detCard.nextElementSibling : secCard.nextElementSibling;
      if (rankCard !== anchor) rankCard.parentNode.insertBefore(rankCard, anchor);
    }
  }
  document.getElementById('ranking-subtitle').textContent = q
    ? `搜尋「${q}」· 找到 ${filtered.length} 檔（搜尋時不套用多空／市場篩選）`
    : `共 ${filtered.length} 檔 · 依評分排名（研判與交易員視角同源）`;

  let body;
  if (filtered.length) body = filtered.map((s, i) => rankingRow(s, i + 1)).join('');
  else if (q) {
    // 掃描清單內找不到 → 到全市場找，可一鍵加入掃描
    const outside = searchStocks(q, 8).filter(x => !x.inList);
    body = outside.length
      ? `<tr><td colspan="9" style="padding:12px 14px;color:var(--text3);font-size:0.8rem">掃描清單中無符合項目，以下為全市場搜尋結果：</td></tr>` +
        outside.map(x => `<tr>
          <td style="color:var(--text3)">—</td>
          <td><div class="stock-cell"><div class="stock-cell-info">
            <span class="stock-cell-id">${x.id}</span><span class="stock-cell-name">${x.name}</span></div></div></td>
          <td class="price-mono">${x.close != null ? x.close.toFixed(2) : '--'}</td>
          <td colspan="5" style="color:var(--text3);font-size:0.78rem">未在掃描清單 — 加入後下輪即有完整分析</td>
          <td><button class="btn-ghost" style="padding:3px 12px;font-size:0.72rem" onclick="event.stopPropagation();openStockAnywhere('${x.id}','${(x.name || '').replace(/'/g, "\\'")}')">＋ 加入</button></td>
        </tr>`).join('')
      : '<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:24px">查無「' + q + '」— 請確認代號或中文名稱（僅支援上市櫃）</td></tr>';
  } else {
    body = '<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:24px">無符合條件的股票</td></tr>';
  }
  document.getElementById('ranking-tbody').innerHTML = body;
}

function rankingRow(s, rank) {
  const a = s.analysis;
  // 搜尋結果可能包含尚未取得分析的標的 —— 顯示載入中而不是整列崩掉
  if (!a) {
    return `<tr onclick="openStock('${s.id}')">
      <td style="color:var(--text3)">${rank}</td>
      <td><div class="stock-cell"><div class="stock-avatar">${s.id.slice(-2)}</div>
        <div class="stock-cell-info"><span class="stock-cell-id">${s.id}</span>
        <span class="stock-cell-name">${s.name || s.id}</span></div></div></td>
      <td class="price-mono">${s.official?.close != null ? s.official.close.toFixed(2) : '--'}</td>
      <td colspan="6" style="color:var(--text3);font-size:0.78rem">在掃描清單中，本輪尚未取得歷史資料（下輪自動重試）</td>
    </tr>`;
  }
  const price = a.price?.toFixed(2) ?? '--';
  const prev  = a.prevClose;
  const chg   = prev ? ((a.price - prev) / prev * 100) : null;
  const chgHtml = chg !== null
    ? `<span class="${chg >= 0 ? 'change-up' : 'change-dn'}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>`
    : '--';
  const scoreColor = scoreToColor(a.score);

  return `<tr onclick="openStock('${s.id}')">
    <td>${rank}</td>
    <td>
      <div class="stock-cell">
        <div class="stock-avatar">${s.id.slice(-2)}</div>
        <div class="stock-cell-info">
          <span class="stock-cell-id">${s.id}</span>
          <span class="stock-cell-name">${s.name}</span>
        </div>
      </div>
    </td>
    <td class="price-mono">${price}</td>
    <td><span class="trend-badge trend-${signalClass(a.signal)}">${a.signal}</span></td>
    <td>
      <div class="score-inline">
        <div class="score-mini-bar"><div class="score-mini-fill" style="width:${a.score}%;background:${scoreColor}"></div></div>
        <span class="score-val">${a.score}</span>
      </div>
    </td>
    <td class="${rsiClass(a.rsi)}">${a.rsi?.toFixed(1) ?? '--'}</td>
    <td style="color:var(--text3)">${a.adx?.toFixed(1) ?? '--'}</td>
    <td class="vol-cell">${fmtVol(a.lastVol)}</td>
    <td>${chgHtml}</td>
  </tr>`;
}

// ── 集保股權分散：週度快照累積與趨勢 ──────────────────────────────────────
// 官方只提供最新一週，故逐週累積本機歷史（週更 → 一週開一次網頁即可，
// 不像法人買賣超需要每天開）。保留最近 12 週。
function accumulateTDCCHist(map) {
  try {
    const hist = JSON.parse(localStorage.getItem('tdcc-hist') || '{}');
    let changed = false;
    for (const [id, v] of Object.entries(map)) {
      if (!v?.d) continue;
      const arr = hist[id] = hist[id] || [];
      if (arr.some(r => r.d === v.d)) continue;
      arr.push({ d: v.d, big: v.big, mid: v.mid, retail: v.retail, holders: v.holders });
      arr.sort((a, b) => String(a.d).localeCompare(String(b.d)));
      hist[id] = arr.slice(-12);
      changed = true;
    }
    if (changed) localStorage.setItem('tdcc-hist', JSON.stringify(hist));
  } catch {}
}

// 千張大戶持股比率的週變化（需累積 ≥2 週才有結論 — 樣本不足就誠實回 null）
function tdccTrend(stockId) {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem('tdcc-hist') || '{}')[stockId] || []; } catch {}
  if (arr.length < 2) return null;
  const last = arr[arr.length - 1], prev = arr[arr.length - 2];
  const dBig = +(last.big - prev.big).toFixed(2);
  const dHolders = last.holders != null && prev.holders != null
    ? Math.round((last.holders - prev.holders) / prev.holders * 1000) / 10 : null;
  // 連續增加/減少的週數
  let streak = 0;
  const dir = dBig > 0 ? 1 : dBig < 0 ? -1 : 0;
  if (dir) {
    for (let i = arr.length - 1; i > 0; i--) {
      const d = arr[i].big - arr[i - 1].big;
      if (dir > 0 ? d > 0 : d < 0) streak++; else break;
    }
  }
  return { big: last.big, mid: last.mid, retail: last.retail, dBig, dir, streak,
           weeks: arr.length, dHolders, date: last.d };
}

// ── 外資持股比率：逐日累積與趨勢 ────────────────────────────────────────────
// 官方只給當日快照，故逐日累積本機歷史（保留 20 筆），才能看出「水位變化」。
function accumulateForeignHist(map) {
  try {
    const hist = JSON.parse(localStorage.getItem('fgn-hist') || '{}');
    const d = localStorage.getItem('t86-last-date') || twClock().date;
    let changed = false;
    for (const [id, v] of Object.entries(map)) {
      if (v?.pct == null) continue;
      const arr = hist[id] = hist[id] || [];
      if (arr.some(r => r.d === d)) continue;
      arr.push({ d, p: v.pct });
      hist[id] = arr.slice(-20);
      changed = true;
    }
    if (changed) localStorage.setItem('fgn-hist', JSON.stringify(hist));
  } catch {}
}

// 外資持股比率的變化（需 ≥2 筆才有結論；樣本不足誠實回 null）
function foreignTrend(stockId) {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem('fgn-hist') || '{}')[stockId] || []; } catch {}
  if (arr.length < 2) return null;
  const last = arr[arr.length - 1];
  const base = arr[Math.max(0, arr.length - 6)];        // 約一週前
  const d = +(last.p - base.p).toFixed(2);
  return { pct: last.p, delta: d, days: arr.length - 1 - Math.max(0, arr.length - 6), n: arr.length };
}

// 法人連續買/賣超天數（依 inst-hist 逐日累積的真實資料）
function instStreak(stockId) {
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem('inst-hist') || '{}')[stockId] || []; } catch {}
  if (hist.length < 2) return null;
  const net = hist.map(r => (r.f || 0) + (r.i || 0) + (r.dl || 0));
  const last = net[net.length - 1];
  if (!last) return null;
  const dir = last > 0 ? 1 : -1;
  let days = 0, total = 0;
  for (let i = net.length - 1; i >= 0; i--) {
    if (dir > 0 ? net[i] > 0 : net[i] < 0) { days++; total += net[i]; } else break;
  }
  return { dir, days, total };
}

// ── 同業比較：產業內相對強度 ────────────────────────────────────────────────
// 先前 sector 欄位只用來顯示標籤，從未拿來比較 —— 但「同產業中誰最強」
// 才是選股的核心：整個產業都漲時個股上漲不算本事，逆勢抗跌才是。
function sectorComparison(stockId) {
  const meta = getStockList();
  const me = meta.find(m => m.id === stockId);
  if (!me?.sector) return null;
  const peers = allStocks.filter(s => {
    const m = meta.find(x => x.id === s.id);
    return m?.sector === me.sector && s.analysis && s.ohlcv?.length >= 21;
  });
  if (peers.length < 2) return null;

  const ret20 = s => {
    const c = s.ohlcv.map(d => d.close);
    return c.length >= 21 ? (c[c.length-1] - c[c.length-21]) / c[c.length-21] * 100 : 0;
  };
  // 注意：此處必須用原始技術分，不可用 getVerdict —
  // sectorComparison 是 buildManagerAnalysis 的輸入，用 verdict 會造成無限遞迴
  const rows = peers.map(s => ({
    id: s.id, name: s.name, score: s.analysis.score, ret: ret20(s),
    foreign: s.foreign ?? null,
  })).sort((a, b) => b.score - a.score);

  const rank = rows.findIndex(r => r.id === stockId) + 1;
  const avgRet = rows.reduce((n, r) => n + r.ret, 0) / rows.length;
  const avgScore = rows.reduce((n, r) => n + r.score, 0) / rows.length;
  const mine = rows.find(r => r.id === stockId);
  if (!mine) return null;
  const excess = mine.ret - avgRet;

  let txt;
  if (rank === 1) txt = `${me.sector}族群中評分最高（共 ${rows.length} 檔），為族群領頭羊`;
  else if (rank <= Math.ceil(rows.length / 3)) txt = `${me.sector}族群中排名第 ${rank}／${rows.length}，屬前段班`;
  else if (rank > rows.length * 0.66) txt = `${me.sector}族群中排名第 ${rank}／${rows.length}，落後同業`;
  else txt = `${me.sector}族群中排名第 ${rank}／${rows.length}，位居中段`;

  return {
    sector: me.sector, rank, total: rows.length, rows: rows.slice(0, 6),
    excess: +excess.toFixed(1), avgRet: +avgRet.toFixed(1), avgScore: Math.round(avgScore),
    myRet: +mine.ret.toFixed(1), txt,
    // 族群整體是否走強 —— 個股再好，逆族群趨勢也吃力
    sectorTrend: avgRet > 3 ? 'strong' : avgRet < -3 ? 'weak' : 'flat',
  };
}

// ── 法人成本估算 ────────────────────────────────────────────────────────────
// 用逐日累積的法人買賣超 × 當日收盤，估算法人的加權平均成本。
// 現價低於法人成本 = 法人套牢（有解套賣壓）；高於則法人獲利（有支撐動機）。
function institutionalCost(stockId) {
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem('inst-hist') || '{}')[stockId] || []; } catch {}
  const withPrice = hist.filter(r => r.p > 0 && (r.f + r.i + r.dl) > 0);
  if (withPrice.length < 3) return null;
  let qty = 0, cost = 0;
  for (const r of withPrice) {
    const net = r.f + r.i + r.dl;
    qty += net; cost += net * r.p;
  }
  if (qty <= 0) return null;
  const avg = cost / qty;
  const s = allStocks.find(x => x.id === stockId);
  const price = s?.analysis?.price;
  if (!price) return null;
  const diff = (price - avg) / avg * 100;
  return {
    avg: +avg.toFixed(2), days: withPrice.length, qty,
    diff: +diff.toFixed(1),
    txt: diff >= 3 ? `現價高於法人估算成本 ${avg.toFixed(2)} 約 ${diff.toFixed(1)}%，法人處於獲利狀態，回檔時有護盤動機`
       : diff <= -3 ? `現價低於法人估算成本 ${avg.toFixed(2)} 約 ${Math.abs(diff).toFixed(1)}%，法人套牢中，反彈至成本區恐有解套賣壓`
       : `現價貼近法人估算成本 ${avg.toFixed(2)}，此區為多空成本交界，突破與否具指標意義`,
    dir: diff >= 3 ? 1 : diff <= -3 ? -1 : 0,
  };
}

// ── 營收動能加速度：YoY 是在改善還是惡化 ────────────────────────────────────
// 單看本月 YoY 不夠 —— 從 +30% 掉到 +10% 是減速，從 -20% 回到 -5% 是改善。
function revenueMomentum(stockId) {
  let hist = [];
  try { hist = JSON.parse(localStorage.getItem('rev-hist') || '{}')[stockId] || []; } catch {}
  if (hist.length < 2) return null;
  const last = hist[hist.length - 1], prev = hist[hist.length - 2];
  if (last.yoy == null || prev.yoy == null) return null;
  const delta = last.yoy - prev.yoy;
  let dir, txt;
  if (delta >= 10) { dir = 1; txt = `營收年增率由 ${prev.yoy.toFixed(1)}% 加速至 ${last.yoy.toFixed(1)}%，成長動能轉強`; }
  else if (delta <= -10) { dir = -1; txt = `營收年增率由 ${prev.yoy.toFixed(1)}% 減速至 ${last.yoy.toFixed(1)}%，成長動能轉弱`; }
  else { dir = 0; txt = `營收年增率由 ${prev.yoy.toFixed(1)}% 變為 ${last.yoy.toFixed(1)}%，動能大致持平`; }
  return { delta: +delta.toFixed(1), cur: last.yoy, prev: prev.yoy, months: hist.length, dir, txt };
}

// ── 資深股票經理人研判引擎 ───────────────────────────────────────────────────
// 綜合技術、趨勢強度、動能、量能、法人籌碼、融資融券 O.I、多週期、波動、
// 相對位置，輸出一位資深操盤手的完整決策：方向、當沖適配、進出場點位、
// 持有期、長線出場價、關鍵風險。s._inst / s._oi / s._mtf 到齊時自動升級。
function buildManagerAnalysis(s) {
  const a = s.analysis;
  if (!a || !s.ohlcv?.length) return null;
  const ohlcv = s.ohlcv;
  const price = a.price;
  const closes = ohlcv.map(d => d.close);
  const highs = ohlcv.map(d => d.high);
  const lows = ohlcv.map(d => d.low);
  const volR = a.volMA ? a.lastVol / a.volMA : 1;
  const atr = (() => {
    if (ohlcv.length < 15) return price * 0.02;
    let sum = 0;
    for (let i = ohlcv.length - 14; i < ohlcv.length; i++)
      sum += Math.max(highs[i]-lows[i], Math.abs(highs[i]-closes[i-1]), Math.abs(lows[i]-closes[i-1]));
    return sum / 14;
  })();
  const atrPct = atr / price * 100;
  const ret5 = closes.length >= 6 ? (price - closes[closes.length-6]) / closes[closes.length-6] * 100 : 0;
  const ret20 = closes.length >= 21 ? (price - closes[closes.length-21]) / closes[closes.length-21] * 100 : 0;
  const hi20 = Math.max(...highs.slice(-20));
  const lo20 = Math.min(...lows.slice(-20));
  const sr = calcSR(ohlcv);
  const sup = sr.supports[0] ?? lo20;
  const res = sr.resistances[0] ?? hi20;
  const macdBull = a.macd?.macd > a.macd?.signal;
  const mtf = s._mtf, oi = s._oi, foreign = s.foreign;

  // ── 證據加權評估 ──
  // 每項證據記錄權重與方向，最後才彙總。這樣可以同時得到：
  //   dir  = 淨方向（多空相抵後的傾向）
  //   agr  = 一致性（證據是否彼此矛盾）→ 用於信心度，避免「+3 分」
  //          在「三項全多」與「六項互抵」兩種情況被當成同一回事
  const ev = [];            // { w, d, txt, kind }
  const notes = [];
  const add = (w, d, txt, kind = 'tech') => ev.push({ w, d, txt, kind });

  // ⓪ 趨勢判定引擎（多因子：均線斜率/持續性/ADX 方向/Choppiness/ZigZag 段數）
  if (a.trend) {
    const t = a.trend;
    if (t.phase === 'strong-up') add(2.2, 1, `趨勢判定：${t.phaseTxt}`);
    else if (t.phase === 'up') add(1.2, 1, `趨勢判定：${t.phaseTxt}`);
    else if (t.phase === 'strong-down') add(2.2, -1, `趨勢判定：${t.phaseTxt}`);
    else if (t.phase === 'down') add(1.2, -1, `趨勢判定：${t.phaseTxt}`);
    else notes.push(`趨勢判定：${t.phaseTxt}`);
    // 成熟度：末升段的多方證據要打折 — 追價風險最高的階段
    if (t.maturity === 'late' && (t.phase === 'up' || t.phase === 'strong-up'))
      add(0.8, -1, t.maturityTxt);
    else if (t.maturityTxt) notes.push(t.maturityTxt);
  }

  // ① 均線結構（完整排列／位置／糾結，多空對稱）
  if (a.maStruct) {
    const ms = a.maStruct;
    if (ms.bullStack) add(ms.tangled ? 1 : 2.4, 1, `${ms.reason}｜${ms.posReason}`);
    else if (ms.bearStack) add(ms.tangled ? 1 : 2.4, -1, `${ms.reason}｜${ms.posReason}`);
    else if (Math.abs(ms.above) >= 2) add(1.2, ms.above > 0 ? 1 : -1, `${ms.reason}｜${ms.posReason}`);
    else notes.push(`${ms.reason}｜${ms.posReason}`);
    if (ms.tangled) notes.push(`均線糾結（三線間距僅 ${ms.spread}%）— 方向未明，突破前不宜重倉`);
    else if (Math.abs(ms.slope) >= 1)
      add(0.6, ms.slope > 0 ? 1 : -1, `EMA20 斜率 ${ms.slope > 0 ? '+' : ''}${ms.slope}%／10日（均線${ms.slope > 0 ? '上揚' : '下彎'}）`);
  } else if (a.ema20 > a.ema50 && price > a.ema20) add(2, 1, '均線多頭排列且站穩 EMA20');
  else if (price < a.ema20) add(1.5, -1, '跌破 EMA20 短均');

  // ①-b 突破與量能確認（帶量突破 vs 無量假突破 vs 高檔出貨）
  if (a.brk) {
    const w = { 'breakout-vol': 2.2, 'breakdown-vol': 2.2, 'distribution': 2, 'failed-break': 1.6,
                'accumulation': 1.4, 'breakout-novol': 1.2, 'breakdown': 1.2, 'breakout-weak': 0.8, 'churn': 0.5 }[a.brk.type] ?? 1;
    if (a.brk.dir !== 0) add(w, a.brk.dir, a.brk.txt);
    else notes.push(a.brk.txt);
  }
  if (a.ema200 && price > a.ema200) add(1, 1, '股價在年線 EMA200 之上（長多結構）');
  else if (a.ema200 && price < a.ema200) add(1, -1, '股價在年線之下（長空結構）');

  // ② 動能指標
  if (macdBull && a.macd?.hist > 0) add(1, 1, 'MACD 金叉且動能柱擴張');
  else if (!macdBull) add(1, -1, 'MACD 死叉');
  if (a.rsi >= 50 && a.rsi < 68) add(0.5, 1, `RSI ${a.rsi.toFixed(0)} 健康多方`);
  else if (a.rsi >= 72) add(0.5, -1, `RSI ${a.rsi.toFixed(0)} 過熱，追高風險`);
  else if (a.rsi < 32) notes.push(`RSI ${a.rsi.toFixed(0)} 超賣，可能技術反彈`);

  // ③ 波動率調整後的中期動能
  // 同樣漲 10%，低波動股代表穩健趨勢、高波動股可能只是雜訊 → 以 ATR 標準化
  const ret20Z = atrPct > 0 ? ret20 / (atrPct * Math.sqrt(20)) : 0;
  if (ret20Z > 1.2) add(1, 1, `20日動能 +${ret20.toFixed(1)}%（波動調整後仍顯著）`);
  else if (ret20Z > 0.5) add(0.5, 1, `20日動能 +${ret20.toFixed(1)}%`);
  else if (ret20Z < -1.2) add(1, -1, `20日下跌 ${ret20.toFixed(1)}%（波動調整後顯著轉弱）`);
  else if (ret20 !== 0) notes.push(`20日${ret20 >= 0 ? '漲' : '跌'} ${Math.abs(ret20).toFixed(1)}%，未超出正常波動範圍`);

  // ④ 量能與量價確認
  if (volR >= 1.3 && volR <= 3 && ret5 > 0) add(0.5, 1, `量增價漲（量比 ${volR.toFixed(1)}）`);
  else if (volR > 3.5) add(0.3, -1, '爆量，慎防出貨');
  else if (volR < 0.6) notes.push('量能萎縮，追價意願低');
  if (a.diverg?.type === 'bear') add(1.5, -1, a.diverg.txt);
  else if (a.diverg?.type === 'bull') add(1, 1, a.diverg.txt);
  else if (a.diverg?.type === 'confirm') add(0.5, 1, a.diverg.txt);

  // ⑤ 法人籌碼 —— 以「佔該股日均量的比例」衡量，而非絕對張數
  // 2,000 張對小型股是巨量、對台積電只是雜訊，用絕對值會嚴重誤判
  const flowPct = (foreign != null && a.volMA > 0) ? (foreign * 1000) / a.volMA * 100 : null;
  if (flowPct != null) {
    const mag = Math.abs(flowPct);
    const lbl = `外資${flowPct > 0 ? '買' : '賣'}超 ${Math.abs(foreign).toLocaleString()} 張（${mag.toFixed(0)}% 日均量）`;
    if (mag >= 15) add(1.2, flowPct > 0 ? 1 : -1, lbl, 'chip');
    else if (mag >= 5) add(0.6, flowPct > 0 ? 1 : -1, lbl, 'chip');
    else notes.push(`外資買賣超僅 ${mag.toFixed(1)}% 日均量，影響有限`);
  } else if (foreign != null && Math.abs(foreign) > 1000) {
    add(0.6, foreign > 0 ? 1 : -1, `外資${foreign > 0 ? '買' : '賣'}超 ${Math.abs(foreign).toLocaleString()} 張`, 'chip');
  }

  // 投信（台股特性：投信認養常伴隨波段行情，權重次於外資）
  const inv = s.investment;
  if (inv != null && Math.abs(inv) >= 1000) {
    add(1, inv > 0 ? 1 : -1, `投信${inv > 0 ? '買' : '賣'}超 ${Math.abs(inv).toLocaleString()} 張${inv > 0 ? '（投信認養）' : ''}`, 'chip');
  } else if (inv != null && Math.abs(inv) >= 300) {
    add(0.5, inv > 0 ? 1 : -1, `投信${inv > 0 ? '買' : '賣'}超 ${Math.abs(inv).toLocaleString()} 張`, 'chip');
  }
  // 自營商（短線資金，權重最低，僅大額才列）
  const dl = s.dealer;
  if (dl != null && Math.abs(dl) >= 1500) {
    add(0.4, dl > 0 ? 1 : -1, `自營商${dl > 0 ? '買' : '賣'}超 ${Math.abs(dl).toLocaleString()} 張（短線資金）`, 'chip');
  }
  // 外資 + 投信同步同向 → 雙引擎，額外佐證
  if (foreign != null && inv != null && foreign > 500 && inv > 300) {
    add(0.8, 1, '外資與投信同步買超（雙引擎籌碼）', 'chip');
  } else if (foreign != null && inv != null && foreign < -500 && inv < -300) {
    add(0.8, -1, '外資與投信同步賣超（法人一致撤退）', 'chip');
  }

  // 漲跌停距離（MIS 即時欄位）：貼近漲停代表追價空間已極小，貼近跌停則有停損風險
  const ld0 = limitDistance(s);
  if (ld0?.toUp != null && ld0.toUp <= 1) notes.push(`已逼近漲停（距 ${ld0.toUp}%，漲停價 ${ld0.up}）— 追價幾無空間，且隔日開高走低風險高`);
  else if (ld0?.toDown != null && ld0.toDown <= 1) notes.push(`已逼近跌停（距 ${ld0.toDown}%，跌停價 ${ld0.down}）— 流動性可能瞬間消失`);

  // 額外官方資料集：只有 OAPI_SIGNALS 明列的欄位才進評分，
  // 其餘一律只顯示不計分（欄位含義未經驗證，強行加權會產生假精確）
  if (s._oapi) {
    for (const [path, row] of Object.entries(s._oapi)) {
      for (const [k, v] of Object.entries(row)) {
        const sig = oapiFieldSignal(path, k, v, s);
        if (sig && sig.w > 0 && sig.dir !== 0) add(sig.w, sig.dir, sig.txt, 'chip');
      }
    }
  }

  // 外資持股比率（存量）：水位變化比單日買賣超更能反映外資態度
  const fg = s._fgnTrend;
  if (fg && Math.abs(fg.delta) >= 0.3) {
    add(Math.abs(fg.delta) >= 1 ? 1.2 : 0.7, fg.delta > 0 ? 1 : -1,
      `外資持股比率${fg.delta > 0 ? '上升' : '下降'} ${Math.abs(fg.delta)} 個百分點`
      + `（現 ${fg.pct}%、近 ${fg.days} 個交易日）`, 'chip');
  } else if (s._fgn && !fg) {
    notes.push(`外資持股比率 ${s._fgn.pct}% — 尚未累積前期資料，無法比較增減`);
  }

  // 集保千張大戶持股變化（週更、官方完整快照 — 比單日法人買賣超穩定）
  const td = s._tdccTrend;
  if (td && Math.abs(td.dBig) >= 0.1) {
    const w = Math.abs(td.dBig) >= 0.5 ? 1.5 : 0.8;
    add(w, td.dir, `千張大戶持股 ${td.dBig > 0 ? '增加' : '減少'} ${Math.abs(td.dBig)} 個百分點` +
      `（現 ${td.big}%${td.streak >= 2 ? `、連 ${td.streak} 週${td.dir > 0 ? '增' : '減'}` : ''}）`, 'chip');
  } else if (s._tdcc && !td) {
    notes.push(`千張大戶持股 ${s._tdcc.big}%（集保週報 ${s._tdcc.d}）— 尚未累積前週資料，無法比較增減`);
  }
  if (td?.dHolders != null && Math.abs(td.dHolders) >= 1) {
    // 股東人數減少 = 籌碼集中（大戶收集）；增加 = 籌碼分散（散戶接手）
    add(0.6, td.dHolders < 0 ? 1 : -1,
      `股東人數週${td.dHolders < 0 ? '減' : '增'} ${Math.abs(td.dHolders)}% — 籌碼${td.dHolders < 0 ? '趨於集中' : '轉為分散'}`, 'chip');
  }

  const streak = instStreak(s.id);
  if (streak && streak.days >= 3) {
    add(1, streak.dir > 0 ? 1 : -1,
        `法人連續 ${streak.days} 日${streak.dir > 0 ? '買' : '賣'}超（累計 ${Math.abs(streak.total).toLocaleString()} 張）`, 'chip');
  }

  if (oi) {
    if (oi.dFin > 0 && flowPct != null && flowPct < -3) add(0.5, -1, '散戶融資加碼但外資站賣方（籌碼對作）', 'chip');
    // 軋空三條件同時成立才計分：券資比高（空單多）＋融券還在增（空方沒跑）＋
    // 股價站上 EMA20（多方結構）— 空單被迫回補會變成額外買盤
    if (oi.shortFinRatio >= 30 && oi.dShort > 0 && a.ema20 && price > a.ema20)
      add(0.8, 1, `軋空條件成形：券資比 ${oi.shortFinRatio.toFixed(0)}%＋融券增溫＋股價站上 EMA20（空單回補將成追價買盤）`, 'chip');
    else {
      if (oi.shortFinRatio >= 30) notes.push(`券資比 ${oi.shortFinRatio.toFixed(0)}%，具軋空題材`);
      if (oi.dShort > 0) notes.push('融券增溫，若持續走強有軋空助攻');
    }
  }

  // 盤中五檔掛單失衡（MIS 即時資料；掛單可撤、可能是假單 → 只給低權重，並限 3 分鐘內的新鮮資料）
  const bk = s._book;
  if (bk && Date.now() - bk.at <= 3 * 60 * 1000 && inNotifyWindow() && bk.bid + bk.ask >= 200) {
    if (bk.ratio >= 2) add(0.5, 1, `盤中五檔委買 ${bk.bid.toLocaleString()} 張為委賣 ${bk.ratio.toFixed(1)} 倍（掛單可撤，低權重參考）`, 'chip');
    else if (bk.ratio != null && bk.ratio <= 0.5) add(0.5, -1, `盤中五檔委賣 ${bk.ask.toLocaleString()} 張為委買 ${(1 / bk.ratio).toFixed(1)} 倍（上方賣壓掛單沉重）`, 'chip');
    else notes.push(`盤中五檔 委買 ${bk.bid.toLocaleString()}／委賣 ${bk.ask.toLocaleString()} 張，掛單均衡`);
  }

  // 重大事件環境註記：FOMC/結算/央行 2 天內 → 波動放大提醒（不計方向分，
  // 事件是波動放大器不是方向指標 — 但倉位該知道自己正站在事件前）
  try {
    for (const e of imminentEvents(2)) {
      if (/FOMC|結算|央行|CPI/.test(e.name))
        notes.push(`⚡ ${e.days === 0 ? '今日' : `${e.days} 天後`}${e.name} — 事件前後波動放大，新倉宜縮、停損宜緊`);
    }
  } catch {}

  // 期貨籌碼（市場環境證據）：外資期貨部位是現貨買賣超看不到的方向表態
  const dv = derivsSummary();
  if (dv) {
    if (dv.dir <= -1) add(0.4, -1, `期貨籌碼偏空：${dv.parts[0]}`, 'chip');
    else if (dv.dir >= 1) add(0.4, 1, `期貨籌碼偏多：${dv.parts[0]}`, 'chip');
    else if (dv.parts.length) notes.push(`期貨籌碼：${dv.parts[0]}`);
  }

  // 相對大盤強弱：波段選股的核心是「贏過大盤」— 資金只會集中在相對強勢股
  const mret = marketRet20();
  if (mret != null && closes.length >= 21) {
    const rsGap = ret20 - mret;
    if (rsGap >= 8) add(0.7, 1, `20 日跑贏大盤 ${rsGap.toFixed(1)} 個百分點（相對強勢股，資金聚焦）`);
    else if (rsGap >= 4) add(0.4, 1, `20 日領先大盤 ${rsGap.toFixed(1)} 個百分點`);
    else if (rsGap <= -8) add(0.7, -1, `20 日落後大盤 ${Math.abs(rsGap).toFixed(1)} 個百分點（相對弱勢，資金迴避）`);
    else if (rsGap <= -4) add(0.4, -1, `20 日落後大盤 ${Math.abs(rsGap).toFixed(1)} 個百分點`);
  }

  // ⑥ 基本面
  const rev = s.rev, fin = s._fin;
  if (s._revNew) notes.push(`📢 ${s._revNew} 月營收剛公布 — 數字已納入下方評分，公布日常有跳空與放量，短線追價需謹慎`);
  if (rev?.yoy != null) {
    if (rev.yoy >= 30) add(1.5, 1, `月營收年增 +${rev.yoy.toFixed(1)}%（高成長）`, 'fund');
    else if (rev.yoy >= 10) add(0.8, 1, `月營收年增 +${rev.yoy.toFixed(1)}%`, 'fund');
    else if (rev.yoy <= -20) add(1.5, -1, `月營收年減 ${rev.yoy.toFixed(1)}%（衰退）`, 'fund');
    else if (rev.yoy <= -5) add(0.8, -1, `月營收年減 ${rev.yoy.toFixed(1)}%`, 'fund');
    if (rev.cumYoy != null && rev.yoy > 0 && rev.cumYoy < 0)
      notes.push('單月轉正但累計仍負 — 復甦初期，續航待觀察');
  }
  if (fin) {
    if (fin.netMargin != null && fin.netMargin < 0) add(1, -1, `本業虧損（淨利率 ${fin.netMargin.toFixed(1)}%）`, 'fund');
    else if (fin.grossMargin >= 35 && fin.netMargin > 8) add(0.8, 1, `高獲利品質（毛利率 ${fin.grossMargin.toFixed(0)}%、淨利率 ${fin.netMargin.toFixed(0)}%）`, 'fund');
    else if (fin.grossMargin != null && fin.grossMargin < 10) notes.push(`毛利率僅 ${fin.grossMargin.toFixed(1)}%，缺乏定價能力`);
    if (fin.roe >= 15) add(0.5, 1, `ROE ${fin.roe.toFixed(0)}%（資本運用效率佳）`, 'fund');
    if (fin.debtRatio >= 70) add(0.5, -1, `負債比 ${fin.debtRatio.toFixed(0)}% 偏高`, 'fund');
  }

  // ⑦ 趨勢結構、型態與動能背離（專業分析的核心判斷）
  if (a.structure) {
    if (a.structure.type === 'uptrend') add(1.8, 1, a.structure.txt);
    else if (a.structure.type === 'downtrend') add(1.8, -1, a.structure.txt);
    else notes.push(a.structure.txt);
    if (a.structure.broken) add(1.2, a.structure.type === 'uptrend' ? -1 : 1, a.structure.brokenTxt);
  }
  if (a.rsiDiv?.type === 'bear') add(1.5, -1, a.rsiDiv.txt);
  else if (a.rsiDiv?.type === 'bull') add(1.2, 1, a.rsiDiv.txt);
  if (a.pattern) {
    if (a.pattern.dir === 1) add(1, 1, a.pattern.txt);
    else if (a.pattern.dir === -1) add(1, -1, a.pattern.txt);
    else notes.push(a.pattern.txt);
  }
  const cSum = (a.candles || []).reduce((n, c) => n + c.dir, 0);
  // K 棒型態依「位置語境」加權：支撐位的多方型態／壓力位的空方型態可信度加倍，
  // 半空中的型態多為雜訊 → 權重砍半（正統裸 K：型態只在關鍵位置才有意義）
  const paW = (dir) => {
    const at = a.paCtx?.at;
    if (dir > 0) return at === 'support' ? 1.2 : at === 'resistance' ? 0.25 : 0.4;
    return at === 'resistance' ? 1.2 : at === 'support' ? 0.25 : 0.4;
  };
  const paLoc = (dir) => {
    const at = a.paCtx?.at;
    if (dir > 0 && at === 'support') return `（出現在支撐 ${a.paCtx.level} — 位置關鍵，可信度高）`;
    if (dir < 0 && at === 'resistance') return `（出現在壓力 ${a.paCtx.level} — 位置關鍵，可信度高）`;
    if (at === 'mid') return '（出現在半空中，僅供參考）';
    return '';
  };
  if (cSum > 0) { const c = a.candles.find(x => x.dir > 0); add(paW(1), 1, `${c.name}：${c.txt}${paLoc(1)}`); }
  else if (cSum < 0) { const c = a.candles.find(x => x.dir < 0); add(paW(-1), -1, `${c.name}：${c.txt}${paLoc(-1)}`); }

  // 假突破（Spring/Upthrust）— 勝率最高的裸 K 訊號，權重高
  if (a.falseBreak) add(1.5, a.falseBreak.type === 'spring' ? 1 : -1, a.falseBreak.txt);

  // 未回補跳空缺口 = 最乾淨的支撐/壓力
  if (a.gaps?.supportGap && price > 0 && (price - a.gaps.supportGap.top) / price <= 0.05)
    add(0.6, 1, `下方 ${a.gaps.supportGap.bottom}~${a.gaps.supportGap.top} 有未回補上跳缺口（缺口支撐）`);
  if (a.gaps?.resistGap && price > 0 && (a.gaps.resistGap.bottom - price) / price <= 0.05)
    add(0.6, -1, `上方 ${a.gaps.resistGap.bottom}~${a.gaps.resistGap.top} 有未回補下跳缺口（缺口壓力）`);
  if (a.gaps?.recent) {
    if (a.gaps.recent.type === 'up' && volR >= 1.5) add(0.8, 1, `帶量向上跳空缺口（${a.gaps.recent.bottom}~${a.gaps.recent.top}）未回補 — 突破缺口特徵`);
    else if (a.gaps.recent.type === 'down' && volR >= 1.5) add(0.8, -1, `帶量向下跳空缺口未回補 — 逃逸缺口特徵，趨勢轉弱`);
  }
  // Order Block：未被回補的大單建倉痕跡，比均線更貼近「哪個價位真的有掛單」
  // 只有貼近現價（5% 內）才計權重 — 太遠的 OB 這筆交易碰不到
  if (a.ob) {
    const obS = a.ob.support, obR = a.ob.resist;
    if (obS && price > 0) {
      const d = (price - obS.top) / price * 100;
      if (d <= 5) add(d <= 2 ? 1.2 : 0.7, 1,
        `下方 ${obS.bottom}~${obS.top} 為未回補多方訂單塊（距現價 ${d.toFixed(1)}%${obS.volRatio >= 1.5 ? `，成交量 ${obS.volRatio} 倍` : ''}）`);
      else notes.push(`多方訂單塊在 ${obS.bottom}~${obS.top}（距現價 ${d.toFixed(1)}%，暫時無關）`);
    }
    if (obR && price > 0) {
      const d = (obR.bottom - price) / price * 100;
      if (d <= 5) add(d <= 2 ? 1.2 : 0.7, -1,
        `上方 ${obR.bottom}~${obR.top} 為未回補空方訂單塊（距現價 ${d.toFixed(1)}%，反壓區）`);
      else notes.push(`空方訂單塊在 ${obR.bottom}~${obR.top}（距現價 ${d.toFixed(1)}%，暫時無關）`);
    }
    if (a.ob.fresh)
      notes.push(`近 10 日新生成${a.ob.fresh.type === 'bull' ? '多' : '空'}方訂單塊 ${a.ob.fresh.bottom}~${a.ob.fresh.top} — 尚未測試`);
  }

  // 成交量分佈：價值區之上／之下是換手結構的多空分界，POC 具磁吸效果
  if (a.vp) {
    if (a.vp.position === 'above')
      add(0.9, 1, `價格站上 60 日價值區上緣 ${a.vp.vah}（換手結構偏多，VAL ${a.vp.val}）`);
    else if (a.vp.position === 'below')
      add(0.9, -1, `價格跌破 60 日價值區下緣 ${a.vp.val}（換手結構偏空，VAH ${a.vp.vah}）`);
    else
      notes.push(`價格位於價值區 ${a.vp.val}~${a.vp.vah} 內（區間震盪，等突破再表態）`);
    if (Math.abs(a.vp.pocDist) <= 1.5)
      notes.push(`貼近最大量價位 POC ${a.vp.poc} — 多空成本密集區，易來回洗盤`);
    else
      notes.push(`最大量價位 POC ${a.vp.poc}（現價${a.vp.pocDist > 0 ? '高於' : '低於'} ${Math.abs(a.vp.pocDist)}%），回測時具磁吸力`);
  }

  if (a.vpRegime) {
    if (a.vpRegime.dir === 1) add(0.5, 1, `${a.vpRegime.k}：${a.vpRegime.txt}`);
    else if (a.vpRegime.dir === -1) add(0.5, -1, `${a.vpRegime.k}：${a.vpRegime.txt}`);
    else notes.push(`${a.vpRegime.k}：${a.vpRegime.txt}`);
  }
  if (a.risk?.mdd <= -30) notes.push(`近半年最大回撤 ${a.risk.mdd}%，屬高波動標的`);
  if (a.vForce?.dir === 1) add(0.8, 1, a.vForce.txt);
  else if (a.vForce?.dir === -1) add(0.8, -1, a.vForce.txt);
  if (a.pctile?.zone === 'high') add(0.6, -1, a.pctile.txt);
  else if (a.pctile?.zone === 'low') add(0.5, 1, a.pctile.txt);
  else if (a.pctile) notes.push(a.pctile.txt);

  // 同業比較：領先族群才是真強勢，落後族群代表資金不青睞
  const sec = sectorComparison(s.id);
  if (sec) {
    if (sec.rank === 1 && sec.total >= 3) add(1, 1, `${sec.sector}族群評分第一，為領頭羊`);
    else if (sec.rank <= Math.ceil(sec.total / 3)) add(0.6, 1, `${sec.sector}族群前段班（第 ${sec.rank}／${sec.total}）`);
    else if (sec.rank > sec.total * 0.66) add(0.8, -1, `${sec.sector}族群落後（第 ${sec.rank}／${sec.total}）`);
    if (sec.excess > 5) add(0.6, 1, `20日報酬超越同業平均 ${sec.excess.toFixed(1)}%`);
    else if (sec.excess < -5) add(0.6, -1, `20日報酬落後同業平均 ${Math.abs(sec.excess).toFixed(1)}%`);
    if (sec.sectorTrend === 'weak') notes.push(`${sec.sector}族群整體走弱（平均 ${sec.avgRet}%），逆勢做多較吃力`);
    else if (sec.sectorTrend === 'strong') notes.push(`${sec.sector}族群整體走強（平均 +${sec.avgRet}%），資金聚焦此類股`);
  }

  // 市場警示：處置股分盤交易，流動性風險凌駕一切技術訊號
  if (s._alert) {
    if (s._alert.level === 'punish') add(2.5, -1, s._alert.txt, 'risk');
    else add(1, -1, s._alert.txt, 'risk');
  }

  // 法人成本：現價相對法人平均成本的位置
  const icost = institutionalCost(s.id);
  if (icost) {
    if (icost.dir === 1) add(0.7, 1, icost.txt);
    else if (icost.dir === -1) add(0.9, -1, icost.txt);
    else notes.push(icost.txt);
  }

  // 營收動能加速度
  const rmom = revenueMomentum(s.id);
  if (rmom) {
    if (rmom.dir === 1) add(1, 1, rmom.txt);
    else if (rmom.dir === -1) add(1, -1, rmom.txt);
    else notes.push(rmom.txt);
  }

  // ⑦ 多週期一致性
  let mtfAligned = null;
  if (mtf?.length) {
    const dirs = mtf.map(m => m.score == null ? 0 : m.score > 55 ? 1 : m.score < 45 ? -1 : 0);
    const bn = dirs.filter(d => d === 1).length, sn = dirs.filter(d => d === -1).length;
    if (bn === 3) { mtfAligned = 'bull'; add(1, 1, '日線／週線／月線同步偏多'); }
    else if (sn === 3) { mtfAligned = 'bear'; add(1, -1, '三週期同步偏空'); }
    else if (bn >= 2) notes.push('多數週期偏多，短週期待確認');
    else if (sn >= 2) notes.push('多數週期偏空');
    else notes.push('各週期分歧，方向未明');
  }

  // ── 彙總：淨方向、一致性、信心度 ──
  // ⑧ 新聞面（保守小權重）：本週新聞明確點名此股或其產業才注入，
  // 關鍵字判讀非語意理解 — 權重刻意壓低，只作佐證不作主導
  if (_newsSignals) {
    const st = _newsSignals.stocks[s.id];
    if (st && st.score !== 0) {
      add(1.2, st.score > 0 ? 1 : -1,
        `新聞面${st.score > 0 ? '利多' : '利空'}：「${st.items[0]}」${st.items.length > 1 ? `等 ${st.items.length} 則` : ''}`, 'news');
    } else if (s.sector && _newsSignals.sectors[s.sector] && Math.abs(_newsSignals.sectors[s.sector].score) >= 2) {
      const sec = _newsSignals.sectors[s.sector];
      add(0.6, sec.score > 0 ? 1 : -1, `${s.sector}族群本週新聞面${sec.score > 0 ? '偏多' : '偏空'}（${sec.n} 則相關）`, 'news');
    }
  }

  // ⑨ 隔夜訊號（僅台積電與半導體族群，小權重）：ADR 於美股時段已先反映
  // 國際評價，對半導體開盤方向有直接領先性；其他族群不注入以免稀釋個股訊號
  const ovn = outlookData.overnight;
  if (ovn?.adr && (s.id === '2330' || ['半導體', 'IC設計', '記憶體', '封測', '砷化鎵', '半導體檢測'].includes(s.sector))) {
    const c = ovn.adr.chg1;
    if (Math.abs(c) >= 1.5)
      add(s.id === '2330' ? 0.8 : 0.5, c > 0 ? 1 : -1,
        `隔夜台積電 ADR ${c > 0 ? '+' : ''}${c}%${ovn.premium != null ? `（溢價 ${ovn.premium > 0 ? '+' : ''}${ovn.premium}%）` : ''}`, 'macro');
    if (s.id === '2330' && ovn.premium != null && Math.abs(ovn.premium) >= 4)
      notes.push(ovn.premium > 0
        ? `ADR 溢價 +${ovn.premium}% — 外資評價高於台股現價，開盤具補漲拉力`
        : `ADR 折價 ${ovn.premium}% — 外資評價低於台股現價，開盤有補跌壓力`);
  }

  let dir = ev.reduce((acc, e) => acc + e.w * e.d, 0);
  const totalW = ev.reduce((acc, e) => acc + e.w, 0);
  const agr = totalW > 0 ? Math.abs(dir) / totalW : 0;   // 0=完全矛盾, 1=完全一致

  // ADX 於最後才放大方向：它衡量「趨勢強度」而非方向，
  // 必須在所有證據彙總後才知道要放大哪一邊（先前寫在中段會依程式碼順序誤判）
  if (a.adx >= 30 && Math.abs(dir) > 0.5) {
    const amp = Math.sign(dir) * (agr >= 0.5 ? 1 : 0.5);   // 證據矛盾時不宜全力放大
    dir += amp;
    notes.push(`ADX ${a.adx.toFixed(0)} 趨勢強勁，強化既有方向`);
  } else if (a.adx != null && a.adx < 20) {
    dir *= 0.8;    // 無趨勢盤整期，任何方向的訊號都應打折
    notes.push(`ADX ${a.adx.toFixed(0)} 無明確趨勢（盤整），訊號可信度降低`);
  }
  // 趨勢引擎判定為盤整市 → 整體再打折（Choppiness 高時趨勢類證據多為假訊號）
  if (a.trend?.phase === 'range' && Math.abs(dir) > 0.5) {
    dir *= 0.7;
    notes.push('趨勢引擎判定盤整市 — 淨方向已按盤整折價，突破確立前勿重倉');
  }

  // ⑧ 大盤環境：作為調節係數而非單純加減分
  // 空頭market做多本質上勝率較低，應整體壓抑而非扣固定分數
  const mktNorm = outlookData.norm ?? 0;
  if (mktNorm >= 15) { if (dir > 0) dir *= 1.15; notes.push(`大盤偏多（${Math.round(mktNorm)}），順風`); }
  else if (mktNorm <= -15) {
    if (dir > 0) dir *= 0.7;      // 逆風時多方訊號打折
    else dir *= 1.1;              // 空方訊號則被強化
    notes.push(`大盤偏空（${Math.round(mktNorm)}），做多逆風、訊號打折`);
  }

  // 信心度：一致性 × 證據充分度（證據太少也不該有高信心）
  const coverage = Math.min(1, totalW / 8);
  const conf = Math.round(agr * coverage * 100);

  const bull = ev.filter(e => e.d > 0).sort((x, y) => y.w - x.w).map(e => e.txt);
  const bear = ev.filter(e => e.d < 0).sort((x, y) => y.w - x.w).map(e => e.txt);

  // ── 綜合裁決 ──
  const nearHigh = price >= hi20 * 0.985;
  const nearSup = price <= sup * 1.03;
  // 立場需同時看方向與一致性：證據互相矛盾時（agr 低）不給極端結論
  let stance, stanceColor;
  if (dir >= 4 && agr >= 0.5) { stance = '強勢偏多'; stanceColor = 'var(--bull)'; }
  else if (dir >= 2) { stance = agr >= 0.35 ? '偏多' : '偏多（訊號分歧）'; stanceColor = 'var(--bull)'; }
  else if (dir <= -3 && agr >= 0.5) { stance = '明顯偏空'; stanceColor = 'var(--bear)'; }
  else if (dir <= -1) { stance = agr >= 0.35 ? '轉弱' : '轉弱（訊號分歧）'; stanceColor = 'var(--yellow)'; }
  else { stance = '中性觀望'; stanceColor = 'var(--text2)'; }

  // ── 建議持有期 ──
  let horizon, horizonDays;
  if (a.adx >= 30 && a.ema50 && a.ema200 && a.ema50 > a.ema200 && dir >= 2) { horizon = '中長期上升結構'; horizonDays = '均線多頭排列且趨勢強度足夠，結構通常延續數週至數月'; }
  else if (dir >= 2) { horizon = '短期偏多結構'; horizonDays = '動能偏正但趨勢尚未確立，關注是否站穩 EMA20'; }
  else if (dir <= -1) { horizon = '下降結構'; horizonDays = '均線與動能皆偏空，尚無止穩訊號'; }
  else { horizon = '區間震盪'; horizonDays = '方向未明，等待突破或跌破區間表態'; }


  return {
    dir, conf, agr, evidence: ev, stance, stanceColor, bull, bear, notes,
    horizon, horizonDays, atr, atrPct, ret20Z, flowPct,
    sup: +sup.toFixed(2), res: +res.toFixed(2), hi20: +hi20.toFixed(2), lo20: +lo20.toFixed(2),
    ret5, ret20, mtfAligned, oi, price,
  };
}

// 綜合研判卡（純分析：多空傾向、關鍵價位、證據，不含交易指令）
function renderManagerVerdict(s) {
  const el = document.getElementById('setup-body');
  if (!el) return;
  const m = buildManagerAnalysis(s);
  if (!m) { el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">數據不足，無法生成研判</p>'; return; }

  // 研判強度轉換為 0~100 的信心刻度，比原始加權分數直觀
  const conf = Math.max(0, Math.min(100, Math.round(50 + m.dir * 8)));
  const dist = v => ((v - m.price) / m.price * 100);

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <span style="font-size:1.05rem;font-weight:800;color:${m.stanceColor}">${m.stance}</span>
      <span style="font-size:0.7rem;color:var(--text3)">多空傾向 ${conf}/100</span>
      <span style="font-size:0.7rem;color:${m.agr >= 0.6 ? 'var(--bull)' : m.agr >= 0.4 ? 'var(--yellow)' : 'var(--bear)'}">
        訊號一致性 ${(m.agr * 100).toFixed(0)}%${m.agr < 0.4 ? '（證據分歧）' : ''}</span>
    </div>
    <div style="height:8px;border-radius:4px;background:linear-gradient(90deg,var(--bear),var(--yellow),var(--bull));position:relative;margin-bottom:14px">
      <div style="position:absolute;top:-3px;left:${conf}%;width:4px;height:14px;background:var(--text1);border-radius:2px;transform:translateX(-50%)"></div>
    </div>

    <div class="setup-grid">
      <div class="setup-item"><div class="setup-lbl">近期壓力</div><div class="setup-val" style="color:var(--bear)">${m.res}</div><div class="setup-note">距現價 +${dist(m.res).toFixed(1)}%</div></div>
      <div class="setup-item"><div class="setup-lbl">近期支撐</div><div class="setup-val" style="color:var(--bull)">${m.sup}</div><div class="setup-note">距現價 ${dist(m.sup).toFixed(1)}%</div></div>
      <div class="setup-item"><div class="setup-lbl">20 日區間</div><div class="setup-val" style="font-size:0.95rem">${m.lo20} ~ ${m.hi20}</div><div class="setup-note">目前位於 ${(((m.price - m.lo20) / (m.hi20 - m.lo20 || 1)) * 100).toFixed(0)}% 位置</div></div>
      <div class="setup-item"><div class="setup-lbl">日均波動 ATR</div><div class="setup-val">${m.atrPct.toFixed(1)}%</div><div class="setup-note">${m.atrPct >= 3 ? '高波動股' : m.atrPct >= 1.5 ? '波動適中' : '低波動股'}</div></div>
    </div>

    <div style="margin-top:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border-radius:8px">
      <div style="font-size:0.72rem;color:var(--text3);margin-bottom:3px">📅 趨勢時間結構</div>
      <div style="font-size:0.85rem;font-weight:600;color:var(--text1)">${m.horizon}</div>
      <div style="font-size:0.74rem;color:var(--text3);margin-top:2px">${m.horizonDays}</div>
    </div>

    ${(m.bull.length || m.bear.length) ? `<div style="margin-top:12px">
      <div style="font-size:0.72rem;color:var(--text3);margin-bottom:6px">研判依據</div>
      <div style="display:flex;flex-direction:column;gap:5px">
      ${m.bull.map(t => `<div style="font-size:0.78rem;color:var(--bull)">＋ ${t}</div>`).join('')}
      ${m.bear.map(t => `<div style="font-size:0.78rem;color:var(--bear)">－ ${t}</div>`).join('')}
      ${m.notes.map(t => `<div style="font-size:0.76rem;color:var(--text3)">· ${t}</div>`).join('')}
      </div>
    </div>` : ''}
    ${entryPlanHtml(s, m)}
    <p style="font-size:0.75rem;color:var(--text3);margin-top:12px">⚠ 以上為技術面與籌碼面的規則化分析，僅供研究參考，非投資建議。</p>`;
  try { renderTraderView(s); } catch (e) { console.warn('交易員視角渲染失敗:', e); }
}

// ── AI 進場建議（做多）───────────────────────────────────────────────────────
// 在所有分析（技術／基本面／籌碼／量價／多週期）完成後才生成，
// 條件不足時明確說明「不建議進場」而非硬給一組數字。
function buildEntryPlan(s, m) {
  const a = s.analysis;
  if (!a || !m) return null;
  const price = m.price;
  const atr = m.atr || price * 0.02;
  const lows = s.ohlcv.map(d => d.low);

  // 只在偏多結構才給進場建議（先以做多為主）
  if (m.dir < 1.5) {
    return { ok: false, why: m.dir <= -1
      ? '目前為偏空/轉弱結構，不建議做多進場。待站回均線且動能轉正後再評估。'
      : '多空拉鋸、方向未明，勝率不足。建議等待突破區間或回測支撐止穩後再評估。' };
  }
  // 處置股採分盤撮合，進出困難且波動極端 — 不論技術面多強都不給進場建議
  if (s._alert?.level === 'punish') {
    return { ok: false, why: '此股目前為「處置股」，採分盤撮合交易，流動性受限且波動劇烈，不建議進場。待處置期滿恢復正常交易後再評估。' };
  }

  // 證據互相矛盾時，方向分數再高也不宜進場（避免「多空各半但淨值偏多」的假訊號）
  if (m.agr < 0.3) {
    return { ok: false, why: `多空證據高度分歧（一致性僅 ${(m.agr * 100).toFixed(0)}%），` +
      `雖然淨方向偏多，但看多與看空理由勢均力敵，此時進場等同賭方向。建議等訊號收斂後再評估。` };
  }

  // 進場區間：理想為回踩支撐/EMA20，上緣不追過現價太多
  const pullback = Math.max(
    a.ema20 && a.ema20 < price ? a.ema20 : 0,
    m.sup,
    price - atr * 1.2
  );
  const lo = +Math.min(pullback, price).toFixed(2);
  const hi = +Math.min(price * 1.01, Math.max(lo * 1.015, price)).toFixed(2);

  // ── 進場依據：大戶籌碼 / 基本面 / 技術面三個面向的支撐 ──
  const support = { chips: [], fund: [], tech: [] };
  // 大戶偵測結果（已通過陷阱檢查者）直接寫進進場理由 — 不再獨立推播
  const wh = whaleFor(s.id);
  if (wh) support.chips.push(`🐋 大戶動向：${wh.sig.slice(0, 2).join('；')}（已通過誘多/出貨陷阱檢查）`);
  // 大戶籌碼
  const streak = instStreak(s.id);
  if (s.foreign > 1000) support.chips.push(`外資買超 ${s.foreign.toLocaleString()} 張`);
  else if (s.foreign > 200) support.chips.push(`外資小幅買超 ${s.foreign.toLocaleString()} 張`);
  if (streak?.dir > 0 && streak.days >= 2) support.chips.push(`法人連 ${streak.days} 日買超（累計 ${streak.total.toLocaleString()} 張）`);
  if (s.investment > 500) support.chips.push(`投信買超 ${s.investment.toLocaleString()} 張`);
  if (m.oi?.shortFinRatio >= 30) support.chips.push(`券資比 ${m.oi.shortFinRatio.toFixed(0)}%，具軋空動能`);
  if (m.oi?.dFin < 0 && s.foreign > 0) support.chips.push('融資減少但外資買進，籌碼由散戶轉入法人');
  // 基本面
  const rev = s.rev, fin = s._fin, fd = s._fd;
  if (rev?.yoy >= 10) support.fund.push(`月營收年增 +${rev.yoy.toFixed(1)}%`);
  if (rev?.cumYoy >= 10) support.fund.push(`累計營收年增 +${rev.cumYoy.toFixed(1)}%`);
  if (fin?.grossMargin >= 30) support.fund.push(`毛利率 ${fin.grossMargin.toFixed(1)}%`);
  if (fin?.netMargin >= 8) support.fund.push(`淨利率 ${fin.netMargin.toFixed(1)}%`);
  if (fd?.pe > 0 && fd.pe < 20) support.fund.push(`本益比 ${fd.pe.toFixed(1)}x 合理`);
  if (fd?.divYield >= 0.04) support.fund.push(`殖利率 ${(fd.divYield * 100).toFixed(1)}%`);
  // 技術面
  if (a.ema20 && lo <= a.ema20 * 1.02 && lo >= a.ema20 * 0.98) support.tech.push(`進場區貼合 EMA20（${a.ema20.toFixed(2)}）`);
  if (m.sup && lo <= m.sup * 1.03) support.tech.push(`進場區位於支撐 ${m.sup} 之上`);
  if (a.ema50 && price > a.ema50) support.tech.push(`站穩季線 EMA50（${a.ema50.toFixed(2)}）`);
  if (a.ema200 && price > a.ema200) support.tech.push('位於年線之上，長期結構偏多');
  if (a.macd?.macd > a.macd?.signal) support.tech.push('MACD 金叉');
  if (a.adx >= 25) support.tech.push(`ADX ${a.adx.toFixed(0)} 趨勢確立`);
  if (a.diverg?.type === 'confirm') support.tech.push('量價同步，漲勢有量能支撐');
  if (m.mtfAligned === 'bull') support.tech.push('日線／週線／月線同步偏多');

  // ── 離場（停損）：取結構低點與 ATR 緩衝的較低者，並說明依據 ──
  const low5 = Math.min(...lows.slice(-5));
  const struct = Math.min(m.sup, low5);
  let stop = +Math.min(struct * 0.99, lo - atr).toFixed(2);
  if (stop >= lo) stop = +(lo - atr).toFixed(2);
  // 上限保護：突破創新高時結構支撐可能離得很遠，
  // 停損距離超過 8% 或 3×ATR 就改用較近者，避免單筆風險過大
  const maxRisk = Math.min(lo * 0.08, atr * 3);
  let stopCapped = false;
  if (lo - stop > maxRisk) { stop = +(lo - maxRisk).toFixed(2); stopCapped = true; }
  // 實證停損收緊：贏單 MAE90×1.3（＋至少 1.2×ATR 底線）明顯窄於結構停損時，
  // 改用實證距離 — 同樣的資金風險可以放大部位，且被掃出的機率有數據背書
  let stopAdaptive = false;
  const _est = (() => { try { return expectancyStats(); } catch { return null; } })();
  if (_est?.mae90 != null && _est.maeN >= 8) {
    const empDist = Math.max(_est.mae90 * 1.3, atr / lo * 100 * 1.2);   // % 距離
    if (empDist < (lo - stop) / lo * 100 * 0.8) {
      stop = +(lo * (1 - empDist / 100)).toFixed(2);
      stopAdaptive = true; stopCapped = false;
    }
  }
  const riskPct = (lo - stop) / lo * 100;
  const stopBasis = [];
  if (stopAdaptive) {
    stopBasis.push(`依實績收緊：九成贏單最大回撤 ≤${_est.mae90}%（樣本 ${_est.maeN}），停損設 ${riskPct.toFixed(1)}%（MAE90×1.3，含 ATR 底線）— 結構停損偏寬會白扛風險`);
  } else if (stopCapped) {
    stopBasis.push(`結構支撐距離過遠，改以風險上限 ${riskPct.toFixed(1)}%（${(maxRisk / atr).toFixed(1)}×ATR）設定`);
  } else {
    if (m.sup && stop < m.sup) stopBasis.push(`低於支撐位 ${m.sup}（跌破代表支撐失守）`);
    if (stop < low5) stopBasis.push(`低於近 5 日最低 ${low5.toFixed(2)}`);
    stopBasis.push(`保留 ${((lo - stop) / atr).toFixed(1)}×ATR 緩衝，避免日常波動誤觸`);
  }
  if (a.ema50 && stop < a.ema50) stopBasis.push('位於季線之下，跌破即中期轉弱');
  // 訂單塊支撐：停損若已在多方 OB 之下，代表「大單建倉區被吃掉」才認賠，邏輯更乾淨
  if (a.ob?.support) stopBasis.push(stop < a.ob.support.bottom
    ? `低於多方訂單塊 ${a.ob.support.bottom}~${a.ob.support.top}（該區大單被吃光才停損）`
    : `⚠ 停損落在多方訂單塊 ${a.ob.support.bottom}~${a.ob.support.top} 之內，易被該區震盪掃出`);

  // ── 止盈：先找上方是否存在真實壓力，沒有就續抱 ──
  const r = lo - stop;
  // 壓力必須是「先前」形成的價位 —— 排除最近 3 根 K，
  // 否則今天自己的最高價會被當成壓力，突破創新高的股票將永遠判不出「無壓力」
  const highs = s.ohlcv.map(d => d.high);
  const prior = highs.slice(0, -3);
  const priorHi20 = prior.length >= 20 ? Math.max(...prior.slice(-20)) : null;
  const priorHi60 = prior.length >= 60 ? Math.max(...prior.slice(-60)) : null;
  // 直接取真實偵測到的壓力位（m.res 在無壓力時會退回 hi20，含今日高點，不可用）
  const realRes = calcSR(s.ohlcv).resistances || [];
  const resList = [];
  // 門檻設 1.5%：今日自身高點通常僅高於收盤 1% 內，藉此濾掉「假壓力」
  for (const v of realRes) if (v > price * 1.015) resList.push({ v: +v.toFixed(2), why: '前波壓力區' });
  if (priorHi20 > price * 1.015) resList.push({ v: +priorHi20.toFixed(2), why: '前 20 日高點' });
  if (priorHi60 > price * 1.015) resList.push({ v: +priorHi60.toFixed(2), why: '前 3 個月高點' });
  if (a.boll?.upper > price * 1.015) resList.push({ v: +a.boll.upper.toFixed(2), why: '布林上軌' });
  // 訂單塊與成交量分佈：真實有掛單／有換手的價位，比純圖形壓力更貼近實際賣壓
  if (a.ob?.resist && a.ob.resist.bottom > price * 1.015) resList.push({ v: +a.ob.resist.bottom.toFixed(2), why: '空方訂單塊下緣' });
  if (a.vp?.vah > price * 1.015) resList.push({ v: +a.vp.vah.toFixed(2), why: '價值區上緣 VAH' });
  if (a.vp?.poc > price * 1.015) resList.push({ v: +a.vp.poc.toFixed(2), why: '最大量價位 POC' });
  resList.sort((x, y) => x.v - y.v);
  // 合併過近的壓力（相差 <1% 視為同一區，避免目標一與目標二顯示同價位）
  const merged = [];
  for (const r0 of resList) {
    const prev = merged[merged.length - 1];
    if (prev && (r0.v - prev.v) / prev.v < 0.01) { prev.why += `／${r0.why}`; continue; }
    merged.push({ ...r0 });
  }
  resList.length = 0; resList.push(...merged);

  const nearHigh = priorHi60 ? price >= priorHi60 * 0.995 : false; // 已站上前 3 個月高點
  const hasResistance = resList.length > 0;

  let t1 = null, t2 = null, targetNote = '', holdOn = false;
  if (hasResistance) {
    t1 = +resList[0].v.toFixed(2);
    // 目標二必須高於目標一：只有單一壓力時，用 3R 與「突破後延伸 4%」取較高者，
    // 否則遠壓力（如 +16%）搭配較小的 3R 會算出比目標一還低的目標二
    t2 = resList[1] ? +resList[1].v.toFixed(2) : +Math.max(lo + r * 3, t1 * 1.04).toFixed(2);
    if (t2 <= t1) t2 = +(t1 * 1.04).toFixed(2);
    targetNote = resList[1]
      ? `第一目標為${resList[0].why} ${t1}，其上為${resList[1].why} ${t2}`
      : `第一目標為${resList[0].why} ${t1}；上方已無其他壓力，突破後延伸看 ${t2}`;
  } else {
    holdOn = true;
    targetNote = nearHigh
      ? '股價已突破近 3 個月高點，上方無套牢賣壓與明顯壓力區 → 不設固定停利，持續持倉'
      : '上方無明顯壓力區 → 不設固定停利，持續持倉';
  }
  // 續抱時的移動停利基準（隨股價墊高，鎖住獲利）
  const trail = +Math.max(price - atr * 2, a.ema20 || 0).toFixed(2);

  // 部位規模：預設單筆風險 2%；有 ≥30 筆實績時改用半凱利（上限 2%、下限 0.5%）
  // — 凱利對參數誤差極敏感，永遠只用半凱利且封頂，這不是保守是常識
  const capital = parseFloat(localStorage.getItem('capital') || '1000000');
  const riskPerShare = lo - stop;
  const est = (() => { try { return expectancyStats(); } catch { return null; } })();
  const riskFrac = est?.kelly != null ? est.kelly / 100 : 0.02;
  const maxLossAmt = capital * riskFrac;
  const shares = riskPerShare > 0 ? Math.floor(maxLossAmt / riskPerShare / 1000) : 0;
  const posValue = shares * 1000 * lo;
  const sizing = shares > 0 ? {
    shares, capital, posValue,
    posPct: +(posValue / capital * 100).toFixed(1),
    maxLoss: Math.round(shares * 1000 * riskPerShare),
    riskPctUsed: +(riskFrac * 100).toFixed(1),
    kellyBased: est?.kelly != null,
  } : null;

  // 教訓學習回饋：過去重複虧損的進場情境再次出現 → 明確警告
  const lessonWarns = [];
  try {
    for (const pat of journalInsights()) {
      const hit =
        (pat.label === 'RSI 過熱時進場' && a.rsi >= 70) ||
        (pat.label === '訊號分歧仍進場' && m.agr < 0.4) ||
        (pat.label === '高檔位階追價' && a.pctile?.zone === 'high') ||
        (pat.label === '大盤逆風做多' && (outlookData.norm ?? 0) <= -15) ||
        (pat.label.includes('族群連續虧損') && pat.label.startsWith(getStockList().find(x => x.id === s.id)?.sector ?? '∅'));
      if (hit) lessonWarns.push(pat.grade === 'firm'
        ? `過去在「${pat.label}」情境已虧損 ${pat.n} 筆 — ${pat.advice}`
        : `「${pat.label}」情境已虧損 ${pat.n} 筆（樣本少，參考性低）— ${pat.advice}`);
    }
  } catch {}

  // 分批進出場：突破當下半倉、回測不破補半倉；出場 T1 減半（回測驗證的規則）、
  // T2 清倉、剩餘移動停利。單點進出把「試錯成本」全押在一個價位上，分批把它攤開。
  const addLv = Math.max(m.sup || 0, a.ob?.support?.top || 0, a.ema20 || 0);
  const scale = {
    e1: `於進場區 ${lo}~${hi} 先進半倉（試探部位）`,
    e2: addLv > 0 && addLv < lo
      ? `回測 ${+addLv.toFixed(2)}（${addLv === a.ob?.support?.top ? '多方訂單塊上緣' : addLv === m.sup ? '支撐位' : 'EMA20'}）不破、止穩再補半倉`
      : '突破進場區上緣且量增時補半倉（順勢加碼，不向下攤平）',
    x1: t1 ? `觸及目標一 ${t1} 先減半（落袋一半，剩餘零成本追趨勢）` : null,
    x2: t2 ? `觸及目標二 ${t2} 清倉` : (holdOn ? `無壓力區 → 剩餘部位以移動停利 ${trailPre()} 追蹤` : null),
  };
  function trailPre() { return +Math.max(price - atr * 2, a.ema20 || 0).toFixed(2); }

  // 交易成本：牌告來回稅費。獲利要先扣掉它，風報比也是
  const costPct = tradeCostPct('long');

  const rrVal = r > 0 && t1 ? (t1 - lo) / r : null;
  // 風報比低於 1.5 的交易長期期望值差，明確標示而非默默給建議
  const rrWarn = (!holdOn && rrVal != null && rrVal < 1.5)
    ? `風險報酬比僅 1:${rrVal.toFixed(1)}，距離第一壓力太近，勝算需超過 ${(100 / (1 + rrVal)).toFixed(0)}% 才划算 — 建議等回檔擴大空間`
    : null;

  return {
    ok: true, lo, hi, stop, t1, t2, riskPct, holdOn, targetNote, trail, rrWarn, sizing, lessonWarns,
    scale, costPct,
    netReward1: t1 ? +((t1 - lo) / lo * 100 - costPct).toFixed(2) : null,
    conf: m.conf, agr: m.agr,
    rewardPct1: t1 ? (t1 - lo) / lo * 100 : null,
    rewardPct2: t2 ? (t2 - lo) / lo * 100 : null,
    rr: r > 0 && t1 ? (t1 - lo) / r : null,
    horizon: m.horizon, support, stopBasis,
    note: price > hi
      ? '現價已高於理想進場區，建議等回踩，不追高'
      : price < lo
        ? '現價已低於進場區下緣，留意支撐是否失守'
        : '現價位於進場區內，可分批布局',
  };
}

function entryPlanHtml(s, m) {
  const p = buildEntryPlan(s, m);
  if (!p) return '';
  if (!p.ok) {
    return `<div style="margin-top:14px;padding:12px 14px;border-radius:10px;background:rgba(148,163,184,0.06);border:1px solid var(--border)">
      <div style="font-size:0.82rem;font-weight:700;color:var(--text2);margin-bottom:4px">🎯 AI 進場建議（做多）</div>
      <div style="font-size:0.8rem;color:var(--yellow)">目前不建議進場</div>
      <div style="font-size:0.76rem;color:var(--text3);margin-top:4px;line-height:1.6">${p.why}</div>
    </div>`;
  }
  const rrColor = p.rr >= 2 ? 'var(--bull)' : p.rr >= 1.5 ? 'var(--yellow)' : 'var(--bear)';
  return `
    <div style="margin-top:14px;padding:12px 14px;border-radius:10px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.18)">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-size:0.82rem;font-weight:700;color:var(--blue)">🎯 AI 進場建議（做多）</span>
        <span style="font-size:0.68rem;color:var(--text3)">綜合技術・基本面・籌碼・量價分析後生成</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="padding:8px 10px;background:rgba(255,255,255,0.02);border-radius:7px">
          <div style="font-size:0.68rem;color:var(--text3)">進場範圍</div>
          <div style="font-family:var(--mono);font-weight:700;color:var(--blue);font-size:0.95rem">${p.lo} ~ ${p.hi}</div>
        </div>
        <div style="padding:8px 10px;background:rgba(239,68,68,0.06);border-radius:7px">
          <div style="font-size:0.68rem;color:var(--text3)">離場（停損）</div>
          <div style="font-family:var(--mono);font-weight:700;color:var(--bear);font-size:0.95rem">${p.stop}
            <span style="font-size:0.68rem;font-weight:400">（-${p.riskPct.toFixed(1)}%）</span></div>
        </div>
        ${p.holdOn ? `
        <div style="padding:8px 10px;background:rgba(34,197,94,0.06);border-radius:7px;grid-column:1/-1">
          <div style="font-size:0.68rem;color:var(--text3)">出場目標</div>
          <div style="font-weight:700;color:var(--bull);font-size:0.88rem">上方無壓力 — 持續持倉</div>
          <div style="font-size:0.7rem;color:var(--text3);margin-top:2px">移動停利參考 <span style="font-family:var(--mono);color:var(--yellow)">${p.trail}</span>（隨股價墊高）</div>
        </div>` : `
        <div style="padding:8px 10px;background:rgba(34,197,94,0.06);border-radius:7px">
          <div style="font-size:0.68rem;color:var(--text3)">出場目標一</div>
          <div style="font-family:var(--mono);font-weight:700;color:var(--bull);font-size:0.95rem">${p.t1}
            <span style="font-size:0.68rem;font-weight:400">（+${p.rewardPct1.toFixed(1)}%）</span></div>
        </div>
        <div style="padding:8px 10px;background:rgba(34,197,94,0.04);border-radius:7px">
          <div style="font-size:0.68rem;color:var(--text3)">出場目標二</div>
          <div style="font-family:var(--mono);font-weight:700;color:var(--bull);font-size:0.95rem">${p.t2}
            <span style="font-size:0.68rem;font-weight:400">（+${p.rewardPct2.toFixed(1)}%）</span></div>
        </div>`}
      </div>
      <div style="margin-top:9px;display:flex;gap:14px;flex-wrap:wrap;font-size:0.75rem;color:var(--text3)">
        ${p.rr ? `<span>風險報酬比 <strong style="color:${rrColor}">1 : ${p.rr.toFixed(1)}</strong></span>` : ''}
        <span>訊號一致性 <strong style="color:${p.agr >= 0.6 ? 'var(--bull)' : p.agr >= 0.4 ? 'var(--yellow)' : 'var(--bear)'}">${(p.agr * 100).toFixed(0)}%</strong></span>
        <span>參考持有 ${p.horizon}</span>
        ${p.netReward1 != null ? `<span>目標一稅費後淨利 <strong style="color:${p.netReward1 > 0 ? 'var(--bull)' : 'var(--bear)'}">${p.netReward1 >= 0 ? '+' : ''}${p.netReward1}%</strong> <span style="font-size:0.68rem">（來回成本 ${p.costPct}%）</span></span>` : ''}
      </div>
      ${p.scale ? `<div style="margin-top:9px;padding:8px 11px;background:rgba(255,255,255,0.02);border-radius:7px;font-size:0.75rem;color:var(--text2);line-height:1.8">
        🪜 <strong>分批計畫</strong><br>
        進場：① ${p.scale.e1}<br>　　　② ${p.scale.e2}<br>
        出場：${[p.scale.x1, p.scale.x2].filter(Boolean).map((x, i) => `${i ? '<br>　　　' : ''}${['①', '②'][i]} ${x}`).join('')}
        <span style="display:block;margin-top:3px;font-size:0.7rem;color:var(--text3)">單點進出把試錯成本全押一個價位；分批讓假突破只傷半倉、趨勢走出來時又有完整部位</span>
      </div>` : ''}
      ${(() => { const hw = heatWarning(); return hw ? `<div style="margin-top:8px;padding:7px 11px;background:rgba(239,68,68,0.07);border-left:3px solid var(--bear);border-radius:0 6px 6px 0;font-size:0.75rem;color:var(--bear)">${hw}</div>` : ''; })()}
      ${p.rrWarn ? `<div style="margin-top:8px;padding:7px 11px;background:rgba(245,158,11,0.08);border-left:3px solid var(--yellow);border-radius:0 6px 6px 0;font-size:0.75rem;color:var(--yellow)">⚠ ${p.rrWarn}</div>` : ''}
      ${(p.lessonWarns || []).map(w => `<div style="margin-top:8px;padding:7px 11px;background:rgba(239,68,68,0.07);border-left:3px solid var(--bear);border-radius:0 6px 6px 0;font-size:0.75rem;color:var(--bear)">🧠 教訓提醒：${w}</div>`).join('')}
      ${p.sizing ? `<div style="margin-top:9px;padding:8px 11px;background:rgba(255,255,255,0.02);border-radius:7px;font-size:0.76rem;color:var(--text2);line-height:1.7">
        📦 <strong>部位規模建議</strong>：以資金 ${(p.sizing.capital/10000).toFixed(0)} 萬、單筆風險 ${p.sizing.riskPctUsed}%${p.sizing.kellyBased ? '（依 ≥30 筆實績的半凱利，非固定值）' : '（固定上限，累積 30 筆實績後改依半凱利）'} 計算，
        可買 <strong style="color:var(--blue)">${p.sizing.shares} 張</strong>（約 ${(p.sizing.posValue/10000).toFixed(1)} 萬，佔 ${p.sizing.posPct}% 資金）；
        若觸及停損，最大虧損約 <strong style="color:var(--bear)">${p.sizing.maxLoss.toLocaleString()} 元</strong>。
        <span style="color:var(--text3);font-size:0.72rem">（可於設定頁調整資金規模）</span>
      </div>` : ''}

      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
        <div style="font-size:0.72rem;color:var(--text3);margin-bottom:6px">📊 進場依據</div>
        ${[['🏦 大戶籌碼', p.support.chips, 'var(--blue)'],
           ['📈 基本面', p.support.fund, 'var(--bull)'],
           ['📐 技術面', p.support.tech, 'var(--text2)']]
          .filter(([, arr]) => arr.length)
          .map(([lbl, arr, c]) => `<div style="font-size:0.75rem;color:var(--text3);margin-bottom:4px;line-height:1.6">
            <span style="color:${c};font-weight:600">${lbl}</span>：${arr.join('・')}</div>`).join('')
          || '<div style="font-size:0.75rem;color:var(--text3)">目前僅技術面條件成立，籌碼與基本面數據不足</div>'}
      </div>

      <div style="margin-top:8px">
        <div style="font-size:0.72rem;color:var(--text3);margin-bottom:4px">🛑 停損依據</div>
        <div style="font-size:0.75rem;color:var(--text3);line-height:1.6">${p.stopBasis.join('；')}</div>
      </div>

      <div style="margin-top:8px">
        <div style="font-size:0.72rem;color:var(--text3);margin-bottom:4px">🎯 停利依據</div>
        <div style="font-size:0.75rem;color:var(--text3);line-height:1.6">${p.targetNote}</div>
      </div>

      <div style="margin-top:10px;font-size:0.76rem;color:var(--text2);line-height:1.6">📌 ${p.note}。跌破 <strong style="color:var(--bear)">${p.stop}</strong> 代表研判失效，應離場；${p.holdOn
        ? `上方無壓力，續抱並以移動停利 <strong style="color:var(--yellow)">${p.trail}</strong> 保護獲利。`
        : `觸及 <strong style="color:var(--bull)">${p.t1}</strong> 可先減碼，剩餘續抱看 ${p.t2}。`}</div>

      <div style="margin-top:12px">
        <button class="btn-primary" style="padding:7px 16px;font-size:0.8rem" onclick="addHolding('${s.id}')">📌 記錄我的持倉（每日檢查出場訊號）</button>
      </div>
    </div>`;
}


// ── Stock Detail ───────────────────────────────────────────────────────────

async function openStock(stockId) {
  currentStockId = stockId;
  navigateTo('stock');
  document.getElementById('nav-stock-link').style.display = 'flex';

  // Find in cache or create placeholder
  const meta = getStockList().find(s => s.id === stockId) || { id: stockId, name: stockId, sector: '--' };

  document.getElementById('stock-avatar').textContent = stockId.slice(-2);
  document.getElementById('stock-name').textContent = `${meta.name} (${stockId})`;
  document.getElementById('stock-sector-chip').textContent = meta.sector;
  document.getElementById('stock-price').textContent = '--';
  document.getElementById('stock-change').textContent = 'TWD';

  // Reset sections
  ['inst-body','setup-body','mtf-body','fund-body','chip-body','oi-body','pattern-body','peer-body','sr-body','mkt-body','ind-body','ai-anal-body','situation-body','of-body','vp-body'].forEach(id => {
    const e = document.getElementById(id); if (e) e.innerHTML = '<div class="adv-loading">載入中...</div>';
  });
  const frb = document.getElementById('full-risk-body'); if (frb) frb.innerHTML = '';

  // Load TV chart
  initTVChart(stockId);
  renderAlertList();

  // Load data
  let s = allStocks.find(s => s.id === stockId);
  if (!s || !s.ohlcv?.length) {
    const ohlcv = await fetchStockOHLCV(stockId, '1d', '6mo');
    if (!s) { s = { ...meta, ohlcv }; allStocks.push(s); }
    else s.ohlcv = ohlcv;
    if (ohlcv.length >= 20) {
      s.analysis = calculateScore(ohlcv);
      s.reversal = detectReversal(ohlcv, s.analysis);
    }
  }

  if (!s.analysis) {
    // 歷史 K 線抓不到 → 用官方當日行情至少把價格顯示出來
    let q = s.official;
    if (!q) { try { q = (await fetchTWDayAll())?.[stockId]; } catch {} }
    if (q?.close) {
      document.getElementById('stock-price').textContent = q.close.toFixed(2);
      const chgEl = document.getElementById('stock-change');
      if (q.chg != null) {
        const chgPct = q.close - q.chg > 0 ? (q.chg / (q.close - q.chg) * 100) : 0;
        chgEl.style.color = q.chg >= 0 ? 'var(--bull)' : 'var(--bear)';
        chgEl.textContent = `${q.chg >= 0 ? '+' : ''}${q.chg.toFixed(2)} (${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%)`;
      }
    } else {
      document.getElementById('stock-price').textContent = '無法載入';
    }
    const aab = document.getElementById('ai-anal-body');
    const failWhy = (typeof ohlcvFailReason !== 'undefined' && ohlcvFailReason[stockId]) || null;
    if (aab) aab.innerHTML = `<div class="adv-loading">${q?.close
      ? '價格為官方當日行情（TWSE/TPEx）。歷史 K 線暫時無法取得，技術分析與圖表稍後重試。'
      : '個股資料載入失敗（資料來源逾時，或代號不存在/已下市）'}${failWhy ? `<br><span style="color:var(--yellow);font-size:0.78rem">診斷：${failWhy}</span>` : ''}<br>
      <button class="btn-ghost" style="margin-top:10px;padding:6px 16px" onclick="openStock('${stockId}')">🔄 重新載入</button></div>`;
    return;
  }

  s._mtf = null; s._oi = null;
  renderStockDetail(s);
  renderPatterns(s);
  renderPeers(s);
  renderAnalysisPanels(s, null);
  renderSituation(s, null);
  renderOrderFlow(s);
  renderVolumeProfile(s);
  renderFullRisk(s, null);
  renderManagerVerdict(s); // 資深經理人綜合研判（技術面先出，法人/OI/MTF 到齊後自動升級）

  // Async: institutional + MTF + 融資融券 O.I
  fetchInstitutional(stockId).then(inst => {
    if (currentStockId !== stockId) return;
    s._inst = inst;
    if (inst && s.foreign == null) s.foreign = inst.foreign; // 供研判引擎使用真實外資數據
    renderInstitutional(inst);
    renderAnalysisPanels(s, inst);
    renderSituation(s, inst);
    renderFullRisk(s, inst);
    renderManagerVerdict(s);
  });
  fetchMTFSignals(stockId, s.ohlcv).then(mtf => {
    if (currentStockId !== stockId) return;
    s._mtf = mtf;
    renderMTF(mtf);
    renderManagerVerdict(s);
  });
  fetchMargin(stockId).then(oi => {
    if (currentStockId !== stockId) return;
    s._oi = oi;
    renderOI(s, oi);
    renderManagerVerdict(s);
  }).catch(() => renderOI(s, null));
  Promise.all([
    fetchRevenue(stockId).catch(() => null),
    fetchFullFinancials(stockId).catch(() => null),
  ]).then(([rev, fin]) => {
    if (currentStockId !== stockId || (!rev && !fin)) return;
    if (rev) s.rev = rev;
    if (fin) s._fin = fin;
    renderManagerVerdict(s);
    renderAnalysisPanels(s, s._inst || null);
    try { renderExtraData(s); } catch {}
  }).catch(() => {});
}

// ── 未平倉部位 O.I（融資融券餘額）───────────────────────────────────────────
// ── 交易員視角：綜合所有數據的專業判讀（圖表下方方框）───────────────────────
function renderTraderView(s) {
  const el = document.getElementById('trader-view-body');
  if (!el || currentStockId !== s.id) return;
  const a = s.analysis;
  const v = a ? getVerdict(s) : null;      // 與市場排名同一個結論來源
  const m = v?.m ?? null;
  if (!m) { el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">資料不足，無法生成判讀</p>'; return; }
  const p = buildEntryPlan(s, m);
  const sec = sectorComparison(s.id);
  const bias = v.signal;
  const biasColor = v.signal.includes('多') ? 'var(--bull)' : v.signal.includes('空') ? 'var(--bear)' : 'var(--yellow)';

  // 該注意的事項（風險優先排序）
  const watch = [];
  if (s._alert) watch.push(s._alert.txt);
  if (a.structure?.broken) watch.push(a.structure.brokenTxt);
  if (a.rsiDiv?.type === 'bear') watch.push(a.rsiDiv.txt);
  if (a.diverg?.type === 'bear') watch.push(a.diverg.txt);
  if (a.pctile?.zone === 'high') watch.push(a.pctile.txt);
  if (s._oi?.dFin > 0 && (s.foreign ?? 0) < -500) watch.push('散戶融資加碼但外資賣超，籌碼對作中');
  if (a.risk?.mdd <= -30) watch.push(`此股波動大（近半年最大回撤 ${a.risk.mdd}%），部位應比一般標的更保守`);
  if (sec?.sectorTrend === 'weak') watch.push(`${sec.sector}族群整體走弱，個股逆勢上攻的成功率偏低`);
  if ((outlookData.norm ?? 0) <= -15) watch.push('大盤環境偏空，任何多方訊號都應打折看待');
  if (m.agr < 0.4) watch.push(`多空證據高度分歧（一致性 ${(m.agr * 100).toFixed(0)}%），此時最忌重倉押方向`);
  (p?.lessonWarns || []).forEach(w => watch.push(w));

  // 為什麼看多/看空（取權重最高的證據）
  const why = (m.dir >= 0 ? m.bull : m.bear).slice(0, 4);
  const counter = (m.dir >= 0 ? m.bear : m.bull).slice(0, 2);

  // 操作模式建議
  let mode;
  if (s._alert?.level === 'punish') {
    mode = `此股為處置股（分盤撮合），流動性風險凌駕一切技術判斷 — 唯一合理的操作是「不參與」，待處置期滿再評估。`;
  } else if (m.dir >= 2 && p?.ok) {
    mode = p.holdOn
      ? `順勢操作：於 ${p.lo}～${p.hi} 分批布局，停損 ${p.stop}（-${p.riskPct.toFixed(1)}%）。上方無明顯壓力，採移動停利（目前 ${p.trail}）續抱吃趨勢，不預設出場價。${p.sizing ? `部位控制在 ${p.sizing.shares} 張以內（風險 2% 上限）。` : ''}`
      : `回踩布局：於 ${p.lo}～${p.hi} 等回踩分批進場，停損 ${p.stop}。第一目標 ${p.t1}（${p.targetNote.split('，')[0]}），到達先減碼一半，剩餘看 ${p.t2}。不追高於 ${p.hi} 之上的價位。`;
  } else if (m.dir >= 2) {
    mode = `方向偏多但${p?.why?.includes('一致性') ? '訊號過於分歧' : '進場條件不佳'} — 列入觀察名單，等${m.sup ? `回測支撐 ${m.sup} 止穩` : '訊號收斂'}再進場，現在出手是搶跑。`;
  } else if (m.dir <= -1) {
    mode = `空方結構：持有者於反彈至 ${m.res} 附近減碼離場；空手者不接刀，待${a.structure?.type === 'downtrend' ? '出現更高的低點（結構轉強）' : '止穩訊號'}再評估。做多的失效條件已成立，不要與趨勢作對。`;
  } else {
    mode = `區間思維：${m.sup}～${m.res} 間高拋低吸或乾脆觀望，突破 ${m.res} 站穩再追多、跌破 ${m.sup} 則迴避。方向未明時，最好的部位是小部位或空手。`;
  }

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <span style="font-size:1rem;font-weight:800;color:${biasColor}">${bias}｜${m.stance}</span>
      <span style="font-size:0.72rem;color:var(--text3)">研判強度 ${m.dir > 0 ? '+' : ''}${m.dir.toFixed(1)}・一致性 ${(m.agr * 100).toFixed(0)}%</span>
    </div>

    ${watch.length ? `<div style="margin-bottom:10px">
      <div style="font-size:0.74rem;font-weight:700;color:var(--yellow);margin-bottom:5px">⚠ 目前該注意</div>
      ${watch.slice(0, 5).map(w => `<div style="font-size:0.78rem;color:var(--text2);line-height:1.65;padding-left:10px;border-left:2px solid rgba(245,158,11,0.4);margin-bottom:4px">${w}</div>`).join('')}
    </div>` : ''}

    <div style="margin-bottom:10px">
      <div style="font-size:0.74rem;font-weight:700;color:${biasColor};margin-bottom:5px">${m.dir >= 0 ? '📈 看多的理由' : '📉 看空的理由'}</div>
      ${why.map(w => `<div style="font-size:0.78rem;color:var(--text2);line-height:1.65;padding-left:10px;border-left:2px solid ${biasColor}66;margin-bottom:4px">${w}</div>`).join('') || '<div style="font-size:0.78rem;color:var(--text3)">目前缺乏有力證據</div>'}
      ${counter.length ? `<div style="font-size:0.72rem;color:var(--text3);margin-top:5px">反方觀點：${counter.join('；')}</div>` : ''}
    </div>

    <div style="padding:10px 13px;border-radius:9px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.15)">
      <div style="font-size:0.74rem;font-weight:700;color:var(--blue);margin-bottom:4px">🎯 操作模式</div>
      <div style="font-size:0.8rem;color:var(--text1);line-height:1.75">${mode}</div>
    </div>
    <p style="font-size:0.7rem;color:var(--text3);margin-top:9px">⚠ 以上為規則化數據判讀，僅供研究參考，非投資建議。</p>`;
}

// ── 同業比較面板 ───────────────────────────────────────────────────────────
function renderPeers(s) {
  const el = document.getElementById('peer-body');
  if (!el) return;
  const c = sectorComparison(s.id);
  if (!c) { el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">同產業可比較個股不足（需股票池中至少 2 檔同業）</p>'; return; }

  const trendTxt = { strong: { t: '族群走強', c: 'var(--bull)' }, weak: { t: '族群走弱', c: 'var(--bear)' }, flat: { t: '族群持平', c: 'var(--yellow)' } }[c.sectorTrend];
  const rankColor = c.rank === 1 ? 'var(--bull)' : c.rank <= Math.ceil(c.total / 3) ? 'var(--blue)' : c.rank > c.total * 0.66 ? 'var(--bear)' : 'var(--text2)';

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <strong style="font-size:0.9rem">${c.sector}</strong>
      <span style="font-size:0.8rem;color:${rankColor};font-weight:700">族群排名 ${c.rank} / ${c.total}</span>
      <span style="font-size:0.72rem;padding:2px 9px;border-radius:10px;background:${trendTxt.c}22;color:${trendTxt.c}">${trendTxt.t} ${c.avgRet >= 0 ? '+' : ''}${c.avgRet}%</span>
    </div>
    <div style="font-size:0.8rem;color:var(--text2);margin-bottom:10px;line-height:1.6">${c.txt}。
      本股 20 日報酬 <strong style="color:${c.myRet >= 0 ? 'var(--bull)' : 'var(--bear)'}">${c.myRet >= 0 ? '+' : ''}${c.myRet}%</strong>，
      ${c.excess >= 0 ? '超越' : '落後'}同業平均 <strong style="color:${c.excess >= 0 ? 'var(--bull)' : 'var(--bear)'}">${Math.abs(c.excess)}%</strong>。</div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.76rem">
      <thead><tr style="color:var(--text3);font-size:0.68rem;text-align:left">
        <th style="padding:3px 6px">同業</th><th style="padding:3px 6px;text-align:right">評分</th>
        <th style="padding:3px 6px;text-align:right">20日報酬</th><th style="padding:3px 6px;text-align:right">外資</th>
      </tr></thead>
      <tbody>${c.rows.map(r => `<tr style="${r.id === s.id ? 'background:rgba(0,212,255,0.07)' : ''};cursor:pointer" onclick="openStock('${r.id}')">
        <td style="padding:4px 6px">${r.id === s.id ? '▶ ' : ''}${r.name} <span style="color:var(--text3);font-size:0.7rem">${r.id}</span></td>
        <td style="padding:4px 6px;text-align:right;font-weight:700;color:${scoreToColor(r.score)}">${r.score}</td>
        <td style="padding:4px 6px;text-align:right;font-family:var(--mono);color:${r.ret >= 0 ? 'var(--bull)' : 'var(--bear)'}">${r.ret >= 0 ? '+' : ''}${r.ret.toFixed(1)}%</td>
        <td style="padding:4px 6px;text-align:right;font-family:var(--mono);color:${(r.foreign ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)'}">${r.foreign != null ? (r.foreign >= 0 ? '+' : '') + r.foreign.toLocaleString() : '--'}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
}

// ── 技術型態與結構面板 ─────────────────────────────────────────────────────
function renderPatterns(s) {
  const el = document.getElementById('pattern-body');
  if (!el) return;
  const a = s.analysis;
  if (!a) { el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">資料不足</p>'; return; }

  const card = (title, body, tone = 'var(--text2)') => `
    <div style="padding:10px 12px;border-radius:8px;background:${tone}0d;border-left:3px solid ${tone};margin-bottom:8px">
      <div style="font-size:0.72rem;color:var(--text3);margin-bottom:3px">${title}</div>
      <div style="font-size:0.82rem;color:var(--text1);line-height:1.6">${body}</div>
    </div>`;
  const tone = d => d > 0 ? 'var(--bull)' : d < 0 ? 'var(--bear)' : 'var(--yellow)';
  const parts = [];

  if (a.trend) parts.push(card('🧭 趨勢判定引擎',
    `<strong>${a.trend.phaseTxt}</strong>` +
    (a.trend.maturityTxt ? `<br>${a.trend.maturityTxt}` : '') +
    `<br><span style="font-size:0.74rem;color:var(--text3)">EMA20 斜率 ${a.trend.s20 > 0 ? '+' : ''}${a.trend.s20}%/10日｜持續性 ${a.trend.persist}%（近20日收在EMA20上方比例）｜ADX ${a.trend.adx ?? '--'}${a.trend.adxRising ? '↑' : ''}｜Choppiness ${a.trend.chop}｜波段第 ${a.trend.legs || '--'} 段${a.trend.ext200 != null ? `｜乖離年線 ${a.trend.ext200 > 0 ? '+' : ''}${a.trend.ext200}%` : ''}</span>`,
    a.trend.phase.includes('up') ? tone(1) : a.trend.phase.includes('down') ? tone(-1) : tone(0)));

  if (a.structure) parts.push(card('📐 趨勢結構（道氏理論）',
    `${a.structure.txt}<br><span style="font-size:0.75rem;color:var(--text3)">前波高點 ${a.structure.lastSwingHigh}｜前波低點 ${a.structure.lastSwingLow}</span>` +
    (a.structure.brokenTxt ? `<br><span style="color:var(--bear);font-size:0.78rem">⚠ ${a.structure.brokenTxt}</span>` : ''),
    tone(a.structure.dir)));

  if (a.pattern) parts.push(card(`📊 圖表型態：${a.pattern.name}`, a.pattern.txt, tone(a.pattern.dir)));
  if (a.rsiDiv) parts.push(card('🔀 動能背離', a.rsiDiv.txt, tone(a.rsiDiv.type === 'bull' ? 1 : -1)));
  if (a.diverg) parts.push(card('📉 量價背離', a.diverg.txt,
    tone(a.diverg.type === 'bear' ? -1 : a.diverg.type === 'bull' ? 1 : 0)));
  if (a.candles?.length) parts.push(card('🕯 K 棒訊號' + (a.paCtx ? `（位置：${a.paCtx.at === 'support' ? `支撐 ${a.paCtx.level} 附近` : a.paCtx.at === 'resistance' ? `壓力 ${a.paCtx.level} 附近` : '區間中段'}）` : ''),
    a.candles.map(c => `<strong style="color:${tone(c.dir)}">${c.name}</strong> — ${c.txt}`).join('<br>') +
    (a.paCtx?.at === 'mid' ? '<br><span style="font-size:0.72rem;color:var(--text3)">位於半空中的型態雜訊居多，研判已自動降低其權重</span>'
      : a.paCtx ? '<br><span style="font-size:0.72rem;color:var(--bull)">出現在關鍵價位附近 — 研判已提高其權重</span>' : ''),
    tone(a.candles.reduce((n, c) => n + c.dir, 0))));
  if (a.falseBreak) parts.push(card(a.falseBreak.type === 'spring' ? '🪤 假跌破反轉（Spring）' : '🪤 假突破回落（Upthrust）',
    a.falseBreak.txt, tone(a.falseBreak.type === 'spring' ? 1 : -1)));
  if (a.gaps?.list?.length) parts.push(card('🕳 未回補跳空缺口',
    a.gaps.list.slice(-3).map(g => `${g.type === 'up' ? '⬆ 上跳' : '⬇ 下跳'} ${g.bottom} ~ ${g.top}<span style="font-size:0.72rem;color:var(--text3)">（${g.time}${g.type === 'up' ? '，回測此區有支撐' : '，反彈至此區有壓力'}）</span>`).join('<br>'),
    'var(--blue)'));
  // 波動區間預測：以 ATR 推明日/5 日約 68% 機率的價格區間 —
  // 給「目標價合不合理」與「停損距離夠不夠」一個統計基準（√t 縮放）
  if (a.price > 0 && s.ohlcv.length >= 15) {
    const highs2 = s.ohlcv.map(d => d.high), lows2 = s.ohlcv.map(d => d.low), closes2 = s.ohlcv.map(d => d.close);
    let atrSum = 0;
    for (let i = s.ohlcv.length - 14; i < s.ohlcv.length; i++)
      atrSum += Math.max(highs2[i] - lows2[i], Math.abs(highs2[i] - closes2[i - 1]), Math.abs(lows2[i] - closes2[i - 1]));
    const atr14 = atrSum / 14;
    const d1 = { lo: +(a.price - atr14).toFixed(2), hi: +(a.price + atr14).toFixed(2) };
    const d5 = { lo: +(a.price - atr14 * Math.sqrt(5)).toFixed(2), hi: +(a.price + atr14 * Math.sqrt(5)).toFixed(2) };
    parts.push(card('🎲 波動區間預測（ATR 統計）',
      `明日約 68% 機率落在 <span style="font-family:var(--mono)">${d1.lo} ~ ${d1.hi}</span><br>` +
      `5 日約 68% 機率落在 <span style="font-family:var(--mono)">${d5.lo} ~ ${d5.hi}</span>` +
      `<br><span style="font-size:0.72rem;color:var(--text3)">依 14 日 ATR ${atr14.toFixed(2)}（${(atr14 / a.price * 100).toFixed(1)}%）√t 縮放 — 目標價超出 5 日區間代表需要超額行情才到得了；停損窄於 1 日區間易被日常波動掃出</span>`,
      'var(--blue)'));
  }

  // 盤中限定：開盤區間突破（ORB）— 有今日分鐘 K 才顯示
  const orb = orbStatus(s);
  if (orb) parts.push(card('📐 開盤區間（ORB）', orb.txt +
    `<br><span style="font-size:0.74rem;color:var(--text3);font-family:var(--mono)">區間 ${orb.lo} ~ ${orb.hi}（幅 ${orb.rangePct}%）</span>`,
    tone(orb.state === 'break-up' ? 1 : orb.state === 'break-down' ? -1 : 0)));

  if (a.ob?.list?.length) {
    const pr = a.price;
    const row = o => {
      const d = pr > 0 ? (o.type === 'bull' ? (pr - o.top) / pr * 100 : (o.bottom - pr) / pr * 100) : null;
      return `<strong style="color:${tone(o.type === 'bull' ? 1 : -1)}">${o.type === 'bull' ? '多方 OB' : '空方 OB'}</strong> ` +
        `<span style="font-family:var(--mono)">${o.bottom} ~ ${o.top}</span>` +
        `<span style="font-size:0.72rem;color:var(--text3)">（${o.time}${o.volRatio ? `，量 ${o.volRatio} 倍` : ''}` +
        `${d != null && d >= 0 ? `，距現價 ${d.toFixed(1)}%` : '，現價已在區內'}）</span>`;
    };
    const key = [a.ob.support, a.ob.resist].filter(Boolean);
    const rest = a.ob.list.filter(o => !key.includes(o)).slice(-3);
    parts.push(card('🧱 訂單塊（Order Block）',
      [...key, ...rest].map(row).join('<br>') +
      '<br><span style="font-size:0.72rem;color:var(--text3)">急拉／急殺前最後一根反向 K，是大單建倉痕跡；僅列出尚未被回補的區間，回測到此常有反應</span>',
      a.ob.support && !a.ob.resist ? tone(1) : a.ob.resist && !a.ob.support ? tone(-1) : tone(0)));
  }
  if (a.vp) parts.push(card('🧮 成交量分佈（Volume Profile）',
    `<strong>${a.vp.position === 'above' ? '價格在價值區之上（換手結構偏多）' : a.vp.position === 'below' ? '價格在價值區之下（換手結構偏空）' : '價格在價值區內（區間震盪）'}</strong>` +
    `<br><span style="font-family:var(--mono);font-size:0.78rem">VAH ${a.vp.vah}｜POC ${a.vp.poc}｜VAL ${a.vp.val}</span>` +
    `<br><span style="font-size:0.72rem;color:var(--text3)">近 60 日按「價格」而非「時間」統計成交量：POC 為換手最多的價位，具磁吸效果（現價${a.vp.pocDist > 0 ? '高於' : '低於'} ${Math.abs(a.vp.pocDist)}%）；價值區涵蓋 ${a.vp.coverage}% 成交量</span>`,
    tone(a.vp.position === 'above' ? 1 : a.vp.position === 'below' ? -1 : 0)));
  if (a.vpRegime) parts.push(card('📶 量價關係', `<strong>${a.vpRegime.k}</strong> — ${a.vpRegime.txt}`, tone(a.vpRegime.dir)));
  if (a.vForce) parts.push(card('⚔️ 多空力道', a.vForce.txt +
    `<br><span style="font-size:0.75rem;color:var(--text3)">上漲 ${a.vForce.upDays} 日 / 下跌 ${a.vForce.dnDays} 日${a.vForce.ratio ? `｜漲日均量為跌日的 ${a.vForce.ratio} 倍` : ''}</span>`,
    tone(a.vForce.dir)));
  if (a.pctile) parts.push(card('📍 價格位階', a.pctile.txt +
    `<br><span style="font-size:0.75rem;color:var(--text3);font-family:var(--mono)">區間 ${a.pctile.lo} ~ ${a.pctile.hi}</span>`,
    a.pctile.zone === 'high' ? 'var(--bear)' : a.pctile.zone === 'low' ? 'var(--bull)' : 'var(--text2)'));
  const _ic = institutionalCost(s.id);
  if (_ic) parts.push(card('🏦 法人成本估算', _ic.txt +
    `<br><span style="font-size:0.75rem;color:var(--text3)">依 ${_ic.days} 日累積買超加權計算</span>`, tone(_ic.dir)));
  const _rm = revenueMomentum(s.id);
  if (_rm) parts.push(card('🚀 營收動能', _rm.txt, tone(_rm.dir)));
  if (a.squeeze) parts.push(card('🎚 波動狀態', a.squeeze.txt, 'var(--blue)'));

  if (a.fib) {
    const lv = a.fib.levels.map(x =>
      `<span style="display:inline-block;margin:2px 5px 0 0;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-family:var(--mono);${x.v === a.fib.near.v ? 'background:rgba(0,212,255,0.18);color:var(--blue);font-weight:700' : 'background:rgba(255,255,255,0.04);color:var(--text3)'}">${(x.r*100).toFixed(1)}% ${x.v}</span>`).join('');
    parts.push(card('🔢 費波那契回撤', `${a.fib.txt}<div style="margin-top:5px">${lv}</div>`, 'var(--text2)'));
  }

  if (a.risk) {
    const r = a.risk;
    const sharpeTone = r.sharpe >= 1 ? 'var(--bull)' : r.sharpe >= 0 ? 'var(--yellow)' : 'var(--bear)';
    parts.push(`
      <div style="padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.02)">
        <div style="font-size:0.72rem;color:var(--text3);margin-bottom:6px">⚖️ 風險指標（近半年）</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:0.78rem">
          <div><span style="color:var(--text3)">最大回撤</span> <strong style="color:${r.mdd <= -25 ? 'var(--bear)' : 'var(--text1)'};font-family:var(--mono)">${r.mdd}%</strong></div>
          <div><span style="color:var(--text3)">年化波動</span> <strong style="font-family:var(--mono)">${r.annVol}%</strong></div>
          <div><span style="color:var(--text3)">年化報酬</span> <strong style="color:${r.annRet >= 0 ? 'var(--bull)' : 'var(--bear)'};font-family:var(--mono)">${r.annRet >= 0 ? '+' : ''}${r.annRet}%</strong></div>
          <div><span style="color:var(--text3)">報酬波動比</span> <strong style="color:${sharpeTone};font-family:var(--mono)">${r.sharpe ?? '--'}</strong></div>
        </div>
        <div style="font-size:0.72rem;color:var(--text3);margin-top:6px">報酬波動比 ≥1 代表每承擔 1 單位波動可換得 1 單位以上報酬；下檔波動 ${r.downVol}%</div>
      </div>`);
  }

  // 技術數據總表：完整指標值一覽
  const closes = s.ohlcv.map(d => d.close);
  const retN = n => closes.length > n ? ((closes[closes.length-1] - closes[closes.length-1-n]) / closes[closes.length-1-n] * 100) : null;
  const bollB = a.boll && a.boll.upper !== a.boll.lower ? (a.price - a.boll.lower) / (a.boll.upper - a.boll.lower) * 100 : null;
  const volR = a.volMA ? a.lastVol / a.volMA : null;
  const fmtR = v => v == null ? '--' : `<span style="color:${v >= 0 ? 'var(--bull)' : 'var(--bear)'}">${v >= 0 ? '+' : ''}${v.toFixed(1)}%</span>`;
  parts.push(`
    <div style="padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.02);margin-top:2px">
      <div style="font-size:0.72rem;color:var(--text3);margin-bottom:6px">📋 技術數據總表</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;font-size:0.75rem">
        <div><span style="color:var(--text3)">RSI(14)</span> <strong>${a.rsi?.toFixed(1) ?? '--'}</strong></div>
        <div><span style="color:var(--text3)">KD %K</span> <strong>${a.stoch?.toFixed(1) ?? '--'}</strong></div>
        <div><span style="color:var(--text3)">ADX</span> <strong>${a.adx?.toFixed(1) ?? '--'}</strong></div>
        <div><span style="color:var(--text3)">MACD柱</span> <strong style="color:${(a.macd?.hist ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)'}">${a.macd?.hist?.toFixed(2) ?? '--'}</strong></div>
        <div><span style="color:var(--text3)">布林 %b</span> <strong>${bollB != null ? bollB.toFixed(0) + '%' : '--'}</strong></div>
        <div><span style="color:var(--text3)">量比</span> <strong>${volR?.toFixed(2) ?? '--'}</strong></div>
        <div><span style="color:var(--text3)">5日</span> ${fmtR(retN(5))}</div>
        <div><span style="color:var(--text3)">20日</span> ${fmtR(retN(20))}</div>
        <div><span style="color:var(--text3)">60日</span> ${fmtR(retN(60))}</div>
      </div>
    </div>`);

  el.innerHTML = parts.length ? parts.join('')
    : '<p style="color:var(--text3);font-size:0.85rem">目前無明顯型態訊號（趨勢結構需至少 40 根 K 棒）</p>';
}

// ── 未平倉部位 O.I（融資融券）───────────────────────────────────────────────
function renderOI(s, oi) {
  const el = document.getElementById('oi-body');
  if (!el) return;
  if (!oi) {
    el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">融資融券資料暫時無法取得（此代號可能為 ETF / 非交易日 / 不可信用交易）</p>';
    return;
  }
  const a = s.analysis || {};
  const fmtLot = v => `${v > 0 ? '+' : ''}${v.toLocaleString()} 張`;
  const finC = oi.dFin >= 0 ? 'var(--bull)' : 'var(--bear)';
  const shC = oi.dShort >= 0 ? 'var(--bear)' : 'var(--bull)'; // 融券增=偏空壓力

  // 研判：融資增(散戶追多)＋股價漲 = 追價/易套牢；融券增 = 空方進場或潛在軋空；券資比高 = 軋空題材
  const insights = [];
  if (oi.dFin > 0 && oi.dShort < 0) insights.push({ t: '融資增、融券減 — 散戶偏多且空方回補，短線偏多但留意追高', c: 'var(--yellow)' });
  else if (oi.dFin < 0 && oi.dShort > 0) insights.push({ t: '融資減、融券增 — 籌碼轉空，偏弱', c: 'var(--bear)' });
  else if (oi.dFin > 0) insights.push({ t: '融資增加 — 散戶槓桿加碼，若股價不漲易形成套牢賣壓', c: 'var(--text2)' });
  else if (oi.dShort > 0) insights.push({ t: '融券增加 — 空方部位增溫，若基本面轉強有軋空潛力', c: 'var(--text2)' });
  if (oi.shortFinRatio >= 30) insights.push({ t: `券資比 ${oi.shortFinRatio.toFixed(1)}% 偏高 — 軋空行情題材`, c: 'var(--bull)' });
  const foreign = s.foreign;
  if (oi.dFin > 0 && foreign != null && foreign < -500) insights.push({ t: '散戶融資加碼 vs 外資賣超 — 籌碼對作，方向偏空', c: 'var(--bear)' });
  if (!insights.length) insights.push({ t: '融資融券變動平穩，籌碼結構中性', c: 'var(--text3)' });

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="inst-card"><div class="inst-card-lbl">融資餘額（槓桿多單）</div>
        <div class="inst-card-val">${oi.finBal.toLocaleString()} 張</div>
        <div style="font-size:0.72rem;color:${finC};margin-top:2px">今日 ${fmtLot(oi.dFin)}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">融券餘額（空單未平倉）</div>
        <div class="inst-card-val">${oi.shortBal.toLocaleString()} 張</div>
        <div style="font-size:0.72rem;color:${shC};margin-top:2px">今日 ${fmtLot(oi.dShort)}</div></div>
    </div>
    <div style="margin-top:10px;display:flex;align-items:center;gap:10px;font-size:0.8rem">
      <span style="color:var(--text3)">券資比</span>
      <strong style="font-family:var(--mono);color:${oi.shortFinRatio >= 30 ? 'var(--bull)' : 'var(--text2)'}">${oi.shortFinRatio.toFixed(1)}%</strong>
      <span style="color:var(--text3);font-size:0.72rem">（融券÷融資，越高軋空題材越強）</span>
    </div>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">
      ${insights.map(i => `<div style="font-size:0.8rem;color:${i.c};background:${i.c}11;border-left:3px solid ${i.c};padding:6px 10px;border-radius:0 6px 6px 0">${i.t}</div>`).join('')}
    </div>`;
}


// 價格時間戳：即時報價 / 當日收盤 / 前一交易日收盤，一律標明，避免舊價被當現價
function quoteStampHTML(s) {
  const today = twClock().date;
  const barDate = s?.ohlcv?.length ? String(s.ohlcv[s.ohlcv.length - 1].time).slice(0, 10) : null;
  if (s?._quoteTime) return `<span style="color:var(--bull)">● 即時 ${s._quoteTime}</span>`;
  if (barDate === today) return `● 今日 ${isMarketOpenTW() ? '盤中' : '收盤'}價`;
  if (barDate) {
    const md = barDate.slice(5).replace('-', '/');
    const age = dataAgeDays(s);
    if (age >= STALE_LIMIT) {
      return `<span style="color:var(--bear);font-weight:700">⚠ 資料停留在 ${md}（落後 ${age} 個交易日）— 已停止提供評分與建議</span>`
        + ` <button class="btn-ghost" style="padding:0 6px;font-size:0.6rem" onclick="retryStock('${s.id}')">重抓</button>`
        + (_liveFail ? `<br><span style="color:var(--text3);font-size:0.62rem">${_liveFail}</span>` : '');
    }
    const why = _liveFail ? `<br><span style="color:var(--text3);font-size:0.62rem">${_liveFail}</span>` : '';
    const btn = isMarketOpenTW()
      ? ` <button class="btn-ghost" style="padding:0 6px;font-size:0.6rem" onclick="retryLiveQuotes()">重試</button>` : '';
    return `<span style="color:var(--yellow)">⚠ ${md} 收盤價（未取得今日報價）</span>${btn}${why}`;
  }
  return '';
}

function renderStockDetail(s) {
  const a = s.analysis;
  const price = a.price?.toFixed(2) ?? '--';
  const prev  = a.prevClose;
  const chg   = prev ? a.price - prev : null;
  const chgPct = prev ? ((chg / prev) * 100) : null;
  const isUp  = chg >= 0;

  document.getElementById('stock-price').textContent = price;
  document.getElementById('stock-change').style.color = isUp ? 'var(--bull)' : 'var(--bear)';
  document.getElementById('stock-change').textContent = chgPct !== null
    ? `${isUp ? '+' : ''}${chg.toFixed(2)} (${chgPct.toFixed(2)}%)`
    : 'TWD';
  // 價格必須標明是「什麼時候的價格」—— 取不到即時報價時會顯示前一日收盤，
  // 沒有標示就會被誤認成現價（實際發生過：顯示昨收 50.00，當下實際 49.00）
  const qEl = document.getElementById('stock-quote-src');
  if (qEl) qEl.innerHTML = quoteStampHTML(s);

  // Trend chip
  const chip = document.getElementById('stock-trend-chip');
  chip.textContent = a.signal;
  chip.className = `coin-trend-chip trend-badge trend-${signalClass(a.signal)}`;

  // Metrics
  document.getElementById('m-score').textContent = a.score;
  const sf = document.getElementById('score-fill');
  sf.style.width = `${a.score}%`;
  sf.style.background = scoreToColor(a.score);

  document.getElementById('m-rsi').textContent = a.rsi?.toFixed(1) ?? '--';
  const rsiTag = document.getElementById('rsi-tag');
  if (a.rsi !== null) {
    if (a.rsi >= 70) { rsiTag.textContent = '超買'; rsiTag.style.cssText = 'background:rgba(239,68,68,0.15);color:var(--bear)'; }
    else if (a.rsi >= 50) { rsiTag.textContent = '多頭'; rsiTag.style.cssText = 'background:rgba(34,197,94,0.15);color:var(--bull)'; }
    else if (a.rsi <= 30) { rsiTag.textContent = '超賣'; rsiTag.style.cssText = 'background:rgba(245,158,11,0.15);color:var(--yellow)'; }
    else { rsiTag.textContent = '空頭'; rsiTag.style.cssText = 'background:rgba(148,163,184,0.1);color:var(--neutral)'; }
  }

  document.getElementById('m-adx').textContent = a.adx?.toFixed(1) ?? '--';
  const adxTag = document.getElementById('adx-tag');
  if (a.adx !== null) {
    if (a.adx > 40) { adxTag.textContent = '強勢'; adxTag.style.cssText = 'background:rgba(0,212,255,0.15);color:var(--blue)'; }
    else if (a.adx > 25) { adxTag.textContent = '趨勢'; adxTag.style.cssText = 'background:rgba(0,212,255,0.08);color:var(--blue)'; }
    else { adxTag.textContent = '震盪'; adxTag.style.cssText = 'background:rgba(148,163,184,0.1);color:var(--neutral)'; }
  }

  document.getElementById('m-vol').textContent = fmtVol(a.lastVol);
  const volTag = document.getElementById('vol-tag');
  if (a.volMA && a.lastVol) {
    const r = a.lastVol / a.volMA;
    if (r > 1.5) { volTag.textContent = '爆量'; volTag.style.cssText = 'background:rgba(34,197,94,0.15);color:var(--bull)'; }
    else if (r > 1.2) { volTag.textContent = '放量'; volTag.style.cssText = 'background:rgba(0,212,255,0.1);color:var(--blue)'; }
    else if (r < 0.6) { volTag.textContent = '縮量'; volTag.style.cssText = 'background:rgba(148,163,184,0.1);color:var(--neutral)'; }
    else { volTag.textContent = '正常'; volTag.style.cssText = 'background:rgba(148,163,184,0.08);color:var(--neutral)'; }
  }

  // EMA
  const fmt2 = v => v?.toFixed(2) ?? '--';
  document.getElementById('ema20').textContent = fmt2(a.ema20);
  document.getElementById('ema50').textContent = fmt2(a.ema50);
  document.getElementById('ema200').textContent = fmt2(a.ema200);
  function emaSig(el, val) {
    if (!val) return;
    const above = a.price > val;
    el.textContent = above ? '多頭上方' : '空頭下方';
    el.style.color = above ? 'var(--bull)' : 'var(--bear)';
  }
  emaSig(document.getElementById('ema20-sig'), a.ema20);
  emaSig(document.getElementById('ema50-sig'), a.ema50);
  emaSig(document.getElementById('ema200-sig'), a.ema200);

  // Quick analysis grid
  const setQA = (id, txt, color) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = txt; el.style.color = color; }
  };
  setQA('qa-trend', a.signal, signalColor(a.signal));
  setQA('qa-rsi', a.rsi?.toFixed(1) ?? '--', a.rsi > 60 ? 'var(--bull)' : a.rsi < 40 ? 'var(--bear)' : 'var(--text2)');
  setQA('qa-adx', a.adx?.toFixed(1) ?? '--', a.adx > 25 ? 'var(--blue)' : 'var(--text3)');
  setQA('qa-ema', a.ema20 && a.ema50 && a.ema20 > a.ema50 ? '多頭排列' : '空頭排列', a.ema20 && a.ema50 && a.ema20 > a.ema50 ? 'var(--bull)' : 'var(--bear)');
  setQA('qa-mom', a.price > (a.ema20 || 0) ? '強' : '弱', a.price > (a.ema20 || 0) ? 'var(--bull)' : 'var(--bear)');
  setQA('qa-macd', a.macd?.macd > a.macd?.signal ? '金叉' : '死叉', a.macd?.macd > a.macd?.signal ? 'var(--bull)' : 'var(--bear)');
  setQA('qa-vol', a.lastVol > (a.volMA || 0) * 1.2 ? '放量' : '縮量', a.lastVol > (a.volMA || 0) * 1.2 ? 'var(--bull)' : 'var(--text3)');
  setQA('qa-score', a.score, scoreToColor(a.score));

  // Trading setup 由 renderManagerVerdict 統一渲染（資深經理人研判）

  // Risk
  let riskLevel, riskColor, riskClass, riskWidth, riskDesc;
  if (a.score >= 70) {
    riskLevel = '低風險'; riskClass = 'risk-low'; riskWidth = 30; riskColor = 'var(--bull)';
    riskDesc = `趨勢評分 ${a.score}/100，多項技術指標支撐，順勢做多風險相對較低。`;
  } else if (a.score >= 50) {
    riskLevel = '中風險'; riskClass = 'risk-med'; riskWidth = 55; riskColor = 'var(--yellow)';
    riskDesc = `趨勢評分 ${a.score}/100，多空訊號中性，方向尚未明確。`;
  } else {
    riskLevel = '高風險'; riskClass = 'risk-high'; riskWidth = 80; riskColor = 'var(--bear)';
    riskDesc = `趨勢評分 ${a.score}/100，空頭訊號偏強，建議避免逆勢操作。`;
  }
  document.getElementById('risk-badge').textContent = riskLevel;
  document.getElementById('risk-badge').className = `risk-badge ${riskClass}`;
  document.getElementById('risk-bar').style.cssText = `width:${riskWidth}%;background:${riskColor}`;
  document.getElementById('risk-desc').textContent = riskDesc;
}

function renderInstitutional(inst) {
  const el = document.getElementById('inst-body');
  if (!inst) {
    el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">今日三大法人資料暫時無法取得（TWSE API 可能未更新）</p>';
    return;
  }
  const fmtInst = v => {
    const cls = v > 0 ? 'inst-bull' : v < 0 ? 'inst-bear' : 'inst-neutral';
    return `<span class="${cls}">${v > 0 ? '+' : ''}${v?.toLocaleString()} 張</span>`;
  };
  el.innerHTML = `
    <div class="inst-grid">
      <div class="inst-card">
        <div class="inst-card-lbl">外資</div>
        <div class="inst-card-val">${fmtInst(inst.foreign)}</div>
      </div>
      <div class="inst-card">
        <div class="inst-card-lbl">投信</div>
        <div class="inst-card-val">${fmtInst(inst.investment)}</div>
      </div>
      <div class="inst-card">
        <div class="inst-card-lbl">自營商</div>
        <div class="inst-card-val">${fmtInst(inst.dealer)}</div>
      </div>
    </div>
    <div style="padding-top:8px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:0.78rem;color:var(--text3)">三大法人合計</span>
      <span style="font-family:var(--mono);font-weight:700;${inst.total >= 0 ? 'color:var(--bull)' : 'color:var(--bear)'}">${inst.total > 0 ? '+' : ''}${inst.total?.toLocaleString()} 張</span>
    </div>`;
}

function renderMTF(mtf) {
  const el = document.getElementById('mtf-body');
  if (!mtf?.length) { el.innerHTML = '<div class="adv-loading">無法載入多週期數據</div>'; return; }

  // 訊號品質：60分 / 日線 / 週線 三時框同向才是高品質訊號
  const dirs = mtf.map(m => m.score === null ? 0 : m.score > 55 ? 1 : m.score < 45 ? -1 : 0);
  const bullN = dirs.filter(d => d === 1).length;
  const bearN = dirs.filter(d => d === -1).length;
  let quality;
  if (bullN === 3)      quality = { txt: '🟢 高品質做多訊號 — 三時框同步偏多', c: 'var(--bull)', bg: 'rgba(34,197,94,0.08)' };
  else if (bearN === 3) quality = { txt: '🔴 高品質做空訊號 — 三時框同步偏空', c: 'var(--bear)', bg: 'rgba(239,68,68,0.08)' };
  else if (bullN === 2) quality = { txt: '🟡 中等品質 — 2/3 時框偏多，等待第三時框確認', c: 'var(--yellow)', bg: 'rgba(245,158,11,0.07)' };
  else if (bearN === 2) quality = { txt: '🟡 中等品質 — 2/3 時框偏空，等待第三時框確認', c: 'var(--yellow)', bg: 'rgba(245,158,11,0.07)' };
  else                  quality = { txt: '⚪ 低一致性 — 各時間週期方向分歧', c: 'var(--neutral)', bg: 'rgba(148,163,184,0.06)' };

  el.innerHTML = `
    <div class="mtf-grid">${mtf.map(m => `
      <div class="mtf-item">
        <div class="mtf-tf">${m.label}</div>
        <div class="mtf-sig trend-badge trend-${signalClass(m.signal)}" style="display:inline-flex">${m.signal}</div>
        <div class="mtf-score">${m.score !== null ? `評分 ${m.score}` : '--'}</div>
      </div>`).join('')}</div>
    <div style="margin-top:12px;padding:12px 14px;border-radius:8px;background:${quality.bg};border:1px solid ${quality.c}33;font-size:0.84rem;font-weight:600;color:${quality.c}">
      ${quality.txt}
    </div>`;
}

// ── Comprehensive Analysis Panels ────────────────────────────────────────

function calcSR(ohlcv, lookback = 60) {
  const data = ohlcv.slice(-Math.min(lookback, ohlcv.length));
  const h = data.map(d => d.high), l = data.map(d => d.low);
  const price = data[data.length - 1].close;
  const supports = [], resistances = [];
  for (let i = 3; i < data.length - 3; i++) {
    if (l.slice(i-3,i).every(v=>v>l[i]) && l.slice(i+1,i+4).every(v=>v>l[i])) supports.push(l[i]);
    if (h.slice(i-3,i).every(v=>v<h[i]) && h.slice(i+1,i+4).every(v=>v<h[i])) resistances.push(h[i]);
  }
  function cluster(arr, thr = 0.015) {
    const sorted = [...arr].sort((a,b) => b-a), out = [];
    for (const v of sorted) { if (!out.some(u => Math.abs(u-v)/u < thr)) out.push(v); }
    return out;
  }
  return {
    supports: cluster(supports.filter(v => v < price)).sort((a,b) => b-a).slice(0,3),
    resistances: cluster(resistances.filter(v => v > price)).sort((a,b) => a-b).slice(0,3),
  };
}

async function renderAnalysisPanels(s, inst) {
  const a = s.analysis;
  const ohlcv = s.ohlcv;
  const meta = getStockList().find(m => m.id === s.id) || { sector: '其他' };
  const sector = meta.sector || '其他';

  // 基本面：一律使用官方數據（TWSE BWIBBU_ALL / TPEx）。
  // 抓不到就誠實顯示「無資料」— 交易工具不該用亂數捏造財務數字。
  const fundP = (async () => {
  let fd = s._fd;
  if (fd === undefined) {
    fd = await fetchTWFundamentals(s.id).catch(() => null);
    s._fd = fd || null;
    fd = s._fd;
  }
  const isRealFd = !!(fd && (fd.pe != null || fd.pb != null || fd.divYield != null));

  const pe = fd?.pe ?? null;
  const pb = fd?.pb ?? null;
  const divYield = fd?.divYield ?? null;

  // 由官方 P/E、P/B 回推每股數據（官方只給比率，價格已知 → 可還原絕對值）
  const epsTTM   = pe > 0 ? a.price / pe : null; // 近四季 EPS
  const bookVal  = pb > 0 ? a.price / pb : null; // 每股淨值
  const divPerSh = divYield != null ? a.price * divYield : null; // 每股年股利

  // 獲利體質評等：只在有官方數據時計算，否則不顯示
  const moatScore = isRealFd
    ? Math.min(5, Math.max(1, (divYield > 0 ? 2 : 1) + (pb >= 1.5 ? 1 : 0) + (pe != null && pe > 0 && pe < 25 ? 1 : 0) + (divYield > 0.04 ? 1 : 0)))
    : null;
  const yieldPct = divYield != null ? (divYield * 100).toFixed(2) : null;
  const annualIncome = divYield != null ? Math.round(100000 * divYield) : null;
  const peN = pe, pbN = pb;
  const na = '<span style="color:var(--text3)">無資料</span>';
  const peColor  = peN == null ? 'var(--text3)' : peN<12 ? 'var(--bull)' : peN<22 ? 'var(--blue)' : 'var(--bear)';
  const pbColor  = pbN == null ? 'var(--text3)' : pbN<1.5 ? 'var(--bull)' : pbN<3 ? 'var(--blue)' : 'var(--bear)';
  const yldColor = divYield == null ? 'var(--text3)' : divYield>0.05 ? 'var(--bull)' : divYield>0.03 ? 'var(--blue)' : 'var(--text2)';
  const moatDescs = ['護城河薄弱','競爭優勢有限','具一定品牌優勢','強健技術/品牌壁壘','行業主導者'];
  const fdBadge = isRealFd
    ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 官方數據 TWSE/TPEx</span>'
    : '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(148,163,184,0.12);color:var(--text3)">此代號無官方估值資料（ETF／新上市／暫停交易）</span>';

  // 近半年價格位置（用已抓到的真實 K 線計算）
  let rangeHtml = '';
  const hi6 = ohlcv.length ? Math.max(...ohlcv.map(b => b.high)) : null;
  const lo6 = ohlcv.length ? Math.min(...ohlcv.map(b => b.low)) : null;
  if (hi6 != null && lo6 != null && hi6 > lo6) {
    const pos6 = Math.max(0, Math.min(100, (a.price - lo6) / (hi6 - lo6) * 100));
    rangeHtml = `
      <div class="fund-block" style="margin-top:10px">
        <div class="fund-block-ttl">近半年價格區間</div>
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;font-family:var(--mono);margin:6px 0 4px"><span style="color:var(--bull)">${lo6.toFixed(2)}</span><span style="color:var(--text2)">現價 ${a.price.toFixed(2)}（${pos6.toFixed(0)}%）</span><span style="color:var(--bear)">${hi6.toFixed(2)}</span></div>
        <div style="height:6px;border-radius:3px;background:linear-gradient(90deg,var(--bull),var(--yellow),var(--bear));position:relative">
          <div style="position:absolute;top:-3px;left:${pos6}%;width:3px;height:12px;background:var(--text1);border-radius:2px;transform:translateX(-50%)"></div>
        </div>
      </div>`;
  }

  // 月營收（台股最重要的即時基本面指標）
  const rv = s.rev;
  const revHtml = rv?.yoy != null ? (() => {
    const c = rv.yoy >= 20 ? 'var(--bull)' : rv.yoy >= 0 ? 'var(--blue)' : rv.yoy > -15 ? 'var(--yellow)' : 'var(--bear)';
    const ymTxt = rv.ym && rv.ym.length >= 5 ? `${+rv.ym.slice(0, 3) + 1911} 年 ${+rv.ym.slice(3)} 月` : '最新月份';
    return `
      <div class="fund-block" style="margin-top:10px">
        <div class="fund-block-ttl">月營收（${ymTxt}）<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 官方</span></div>
        <table class="qt-table"><tbody>
          <tr><td style="color:var(--text3)">當月營收</td><td>${rv.rev != null ? (rv.rev >= 1e6 ? (rv.rev/1e6).toFixed(2) + ' 兆' : rv.rev >= 1e3 ? (rv.rev/1e3).toFixed(1) + ' 億' : rv.rev.toFixed(0) + ' 萬') : '--'}</td></tr>
          <tr><td style="color:var(--text3)">年增率 YoY</td><td style="color:${c};font-weight:700">${rv.yoy >= 0 ? '+' : ''}${rv.yoy.toFixed(1)}%</td></tr>
          ${rv.mom != null ? `<tr><td style="color:var(--text3)">月增率 MoM</td><td style="color:${rv.mom >= 0 ? 'var(--bull)' : 'var(--bear)'}">${rv.mom >= 0 ? '+' : ''}${rv.mom.toFixed(1)}%</td></tr>` : ''}
          ${rv.cumYoy != null ? `<tr><td style="color:var(--text3)">累計年增率</td><td style="color:${rv.cumYoy >= 0 ? 'var(--bull)' : 'var(--bear)'}">${rv.cumYoy >= 0 ? '+' : ''}${rv.cumYoy.toFixed(1)}%</td></tr>` : ''}
        </tbody></table>
      </div>`;
  })() : '';

  // 公司發布的季度財報：損益表 + 資產負債表 + 逐季歷史比較
  if (s._fin === undefined) { s._fin = await fetchFullFinancials(s.id).catch(() => null); }
  const fin = s._fin;
  const finHtml = fin ? (() => {
    const pct = (v, good, bad) => v == null ? '<span style="color:var(--text3)">--</span>'
      : `<span style="color:${v >= good ? 'var(--bull)' : v <= bad ? 'var(--bear)' : 'var(--text2)'};font-weight:600">${v.toFixed(1)}%</span>`;
    const q = fin.year && fin.quarter ? `${+fin.year + 1911 || fin.year} 年 Q${fin.quarter}` : '最新季度';
    const money = v => v == null ? '--' : Math.abs(v) >= 1e8 ? (v/1e8).toFixed(2) + ' 兆' : Math.abs(v) >= 1e4 ? (v/1e4).toFixed(1) + ' 億' : (v/1e3).toFixed(1) + ' 百萬';

    // 與前一季／去年同季比較（需已累積歷史）
    const h = fin.history || [];
    const cur = h[h.length - 1];
    const prevQ = h.length >= 2 ? h[h.length - 2] : null;
    const yoyQ = cur ? h.find(x => x.period === `${+cur.period.slice(0, -2) - 1}${cur.period.slice(-2)}`) : null;
    const cmp = (now, before, label) => {
      if (now == null || before == null || before === 0) return '';
      const d = (now - before) / Math.abs(before) * 100;
      return `<span style="font-size:0.68rem;color:${d >= 0 ? 'var(--bull)' : 'var(--bear)'};margin-left:6px">${label} ${d >= 0 ? '+' : ''}${d.toFixed(1)}%</span>`;
    };

    return `
      <div class="fund-block" style="margin-top:10px">
        <div class="fund-block-ttl">公司財報（${q}）<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 官方公告</span></div>
        <table class="qt-table"><tbody>
          <tr><td style="color:var(--text3)">營業收入</td><td>${money(fin.revenue)}
            ${prevQ ? cmp(cur?.revenue, prevQ.revenue, 'QoQ') : ''}${yoyQ ? cmp(cur?.revenue, yoyQ.revenue, 'YoY') : ''}</td></tr>
          <tr><td style="color:var(--text3)">毛利率</td><td>${pct(fin.grossMargin, 30, 10)}</td></tr>
          <tr><td style="color:var(--text3)">營益率</td><td>${pct(fin.opMargin, 15, 0)}</td></tr>
          <tr><td style="color:var(--text3)">淨利率</td><td>${pct(fin.netMargin, 10, 0)}</td></tr>
          <tr><td style="color:var(--text3)">稅後淨利</td><td>${money(fin.netInc)}
            ${prevQ ? cmp(cur?.netInc, prevQ.netInc, 'QoQ') : ''}</td></tr>
          <tr><td style="color:var(--text3)">單季 EPS</td><td class="${fin.eps > 0 ? 'qt-pos' : fin.eps < 0 ? 'qt-neg' : ''}">${fin.eps != null ? fin.eps.toFixed(2) + ' 元' : '--'}
            ${prevQ ? cmp(cur?.eps, prevQ.eps, 'QoQ') : ''}</td></tr>
        </tbody></table>
      </div>
      ${(fin.roe != null || fin.debtRatio != null || fin.bps != null) ? `
      <div class="fund-block" style="margin-top:10px">
        <div class="fund-block-ttl">財務體質</div>
        <table class="qt-table"><tbody>
          ${fin.roe != null ? `<tr><td style="color:var(--text3)">ROE（單季年化）</td><td>${pct(fin.roe, 15, 5)}</td></tr>` : ''}
          ${fin.debtRatio != null ? `<tr><td style="color:var(--text3)">負債比率</td><td><span style="color:${fin.debtRatio <= 40 ? 'var(--bull)' : fin.debtRatio >= 70 ? 'var(--bear)' : 'var(--text2)'};font-weight:600">${fin.debtRatio.toFixed(1)}%</span></td></tr>` : ''}
          ${fin.bps != null ? `<tr><td style="color:var(--text3)">每股淨值</td><td>${fin.bps.toFixed(2)} 元</td></tr>` : ''}
          ${fin.equity != null ? `<tr><td style="color:var(--text3)">股東權益</td><td>${money(fin.equity)}</td></tr>` : ''}
        </tbody></table>
      </div>` : ''}
      ${h.length >= 2 ? `
      <div class="fund-block" style="margin-top:10px">
        <div class="fund-block-ttl">逐季趨勢（本站自動累積 ${h.length} 季）</div>
        <div style="overflow-x:auto"><table class="qt-table" style="min-width:100%">
          <thead><tr><th>季別</th><th>EPS</th><th>毛利率</th><th>淨利率</th></tr></thead>
          <tbody>${h.slice(-6).map(x => `<tr>
            <td style="color:var(--text3)">${x.period}</td>
            <td class="${x.eps > 0 ? 'qt-pos' : x.eps < 0 ? 'qt-neg' : ''}">${x.eps != null ? x.eps.toFixed(2) : '--'}</td>
            <td>${x.grossMargin != null ? x.grossMargin.toFixed(1) + '%' : '--'}</td>
            <td>${x.netMargin != null ? x.netMargin.toFixed(1) + '%' : '--'}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>` : ''}`;
  })() : '';

  const keyStatsHtml = `
      <div class="fund-block">
        ${isRealFd ? `
        <div class="fund-block-ttl">關鍵財務數據（由官方比率回推）</div>
        <table class="qt-table">
          <tbody>
            <tr><td style="color:var(--text3)">近四季 EPS</td><td class="${epsTTM > 0 ? 'qt-pos' : ''}">${epsTTM != null ? epsTTM.toFixed(2) + ' 元' : '--（虧損或無盈餘資料）'}</td></tr>
            <tr><td style="color:var(--text3)">每股淨值</td><td>${bookVal != null ? bookVal.toFixed(2) + ' 元' : '--'}</td></tr>
            <tr><td style="color:var(--text3)">每股年股利</td><td class="${divPerSh > 0 ? 'qt-pos' : ''}">${divPerSh != null ? divPerSh.toFixed(2) + ' 元' : '--'}</td></tr>
          </tbody>
        </table>` : ''}
        ${revHtml}
        ${(() => {
          // 近 3 月營收趨勢（逐月累積後才有）
          let rh = [];
          try { rh = (JSON.parse(localStorage.getItem('rev-hist') || '{}')[s.id] || []).slice(-3); } catch {}
          if (rh.length < 2) return '';
          return `<div class="fund-block" style="margin-top:10px">
            <div class="fund-block-ttl">近 ${rh.length} 月營收年增趨勢</div>
            <div style="display:flex;gap:8px;margin-top:6px">${rh.map(x => `
              <div style="flex:1;text-align:center;padding:7px 4px;border-radius:7px;background:rgba(255,255,255,0.02)">
                <div style="font-size:0.64rem;color:var(--text3)">${String(x.ym).slice(-2)}月</div>
                <div style="font-family:var(--mono);font-weight:700;font-size:0.82rem;color:${x.yoy >= 0 ? 'var(--bull)' : 'var(--bear)'}">${x.yoy >= 0 ? '+' : ''}${x.yoy?.toFixed(1) ?? '--'}%</div>
              </div>`).join('')}</div>
          </div>`;
        })()}
        ${(() => {
          // 估值 vs 同業：本益比高低要跟同業比才有意義
          const sc = sectorComparison(s.id);
          if (!sc || peN == null) return '';
          const peers = sc.rows.map(r => allStocks.find(x => x.id === r.id)?._fd?.pe).filter(v => v > 0);
          if (peers.length < 2) return '';
          const avgPE = peers.reduce((a, b) => a + b, 0) / peers.length;
          const diff = (peN - avgPE) / avgPE * 100;
          return `<div class="fund-block" style="margin-top:10px">
            <div class="fund-block-ttl">估值 vs 同業</div>
            <div style="font-size:0.79rem;color:var(--text2);margin-top:5px;line-height:1.6">
              本股 P/E <strong style="font-family:var(--mono)">${peN.toFixed(1)}x</strong>，${sc.sector}同業平均 <strong style="font-family:var(--mono)">${avgPE.toFixed(1)}x</strong>
              → <strong style="color:${diff <= -15 ? 'var(--bull)' : diff >= 20 ? 'var(--bear)' : 'var(--text2)'}">${diff <= -15 ? `折價 ${Math.abs(diff).toFixed(0)}%（相對便宜）` : diff >= 20 ? `溢價 ${diff.toFixed(0)}%（估值偏貴，需高成長支撐）` : '與同業相當'}</strong>
            </div>
          </div>`;
        })()}
        ${finHtml}
        ${rangeHtml}
      </div>`;

  if (currentStockId !== s.id) return { peN, divYield, yieldPct }; // 已切換個股，別蓋掉新頁面
  document.getElementById('fund-body').innerHTML = `
    <div style="margin-bottom:8px">${fdBadge}</div>
    <div class="fund-cols">
      ${keyStatsHtml}
      <div>
        <div class="fund-block" style="margin-bottom:10px">
          <div class="fund-block-ttl">估值指標</div>
          <div class="val-grid">
            <div class="val-item"><div class="val-lbl">本益比 P/E</div><div class="val-num" style="color:${peColor}">${peN != null ? peN.toFixed(1) + 'x' : na}</div></div>
            <div class="val-item"><div class="val-lbl">股價淨值 P/B</div><div class="val-num" style="color:${pbColor}">${pbN != null ? pbN.toFixed(2) + 'x' : na}</div></div>
            <div class="val-item"><div class="val-lbl">殖利率</div><div class="val-num" style="color:${yldColor}">${yieldPct != null ? yieldPct + '%' : na}</div></div>
          </div>
        </div>
        ${moatScore != null ? `<div class="moat-grid">
          <div class="moat-item"><div class="moat-lbl">獲利體質評等</div><div class="moat-stars">${'★'.repeat(moatScore)+'☆'.repeat(5-moatScore)}</div><div class="moat-desc">${moatDescs[moatScore-1]}</div></div>
        </div>` : ''}
      </div>
    </div>
    ${divYield != null && divYield > 0 ? `<div style="margin-top:12px">
      <div class="fund-block-ttl">配息試算（投入 10 萬元，依官方年化殖利率）</div>
      <div class="div-calc">
        <div class="div-calc-row"><span>年殖利率</span><span style="font-family:var(--mono);color:${yldColor}">${yieldPct}%</span></div>
        <div class="div-calc-row"><span>預估年配息</span><div><span class="div-calc-big">+${annualIncome.toLocaleString()}</span><span style="font-size:0.78rem;color:var(--text3)"> 元</span></div></div>
        <div class="div-calc-row" style="margin-bottom:0"><span style="color:var(--text3)">每季估計</span><span style="font-family:var(--mono);color:var(--text3)">+${Math.round(annualIncome/4).toLocaleString()} 元</span></div>
      </div>
    </div>` : ''}`;
  return { peN, divYield, yieldPct };
  })();

  // ── Render 籌碼面 ──────────────────────────────────────────────
  // 只顯示真實累積的法人歷史（inst-hist），沒有的日子就不顯示 — 不再用亂數補假資料
  let instHist = [];
  try { instHist = (JSON.parse(localStorage.getItem('inst-hist') || '{}')[s.id] || []).slice(-5); } catch {}
  const realDays = instHist.length;
  const inst5 = instHist.map(r => ({ label: r.d.slice(5), foreign: r.f, invest: r.i, dealer: r.dl }));
  // 今日資料若尚未進入歷史，先補上（仍是真實數據）
  if (inst && !inst5.some(x => x.foreign === inst.foreign && x.invest === inst.investment)) {
    inst5.push({ label: '今日', foreign: inst.foreign, invest: inst.investment, dealer: inst.dealer });
  }
  const chipBadge = inst5.length >= 5
    ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 真實數據 TWSE</span>'
    : `<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(0,212,255,0.1);color:var(--blue)">真實數據 ${inst5.length}/5 日（每日掃描自動累積）</span>`;

  const maxFlow = Math.max(...inst5.flatMap(d => [Math.abs(d.foreign),Math.abs(d.invest),Math.abs(d.dealer)]), 1);
  function chipBarHtml(val) {
    const pct = Math.min(Math.abs(val)/maxFlow*46, 46);
    const pos = val >= 0;
    return `<div class="chip-bar-track"><div class="chip-bar-fill ${pos?'chip-bar-pos':'chip-bar-neg'}" style="${pos?'right:50%':'left:50%'};width:${pct}%"></div></div><span class="chip-bar-val" style="color:${pos?'var(--bull)':'var(--bear)'}">${pos?'+':''}${(val/1000).toFixed(1)}K</span>`;
  }
  const t5 = { f:inst5.reduce((s,d)=>s+d.foreign,0), i:inst5.reduce((s,d)=>s+d.invest,0), d:inst5.reduce((s,d)=>s+d.dealer,0) };
  const gTotal = t5.f+t5.i+t5.d;

  document.getElementById('chip-body').innerHTML = !inst5.length ? `
    <p style="color:var(--text3);font-size:0.85rem">三大法人資料暫時無法取得（非交易日或資料源未更新）</p>` : `
    <div>
      <div class="fund-block-ttl">三大法人買賣超趨勢 ${chipBadge}</div>
      <div style="display:grid;grid-template-columns:44px 1fr 1fr 1fr;gap:5px;align-items:center;margin-top:8px">
        <div></div>
        <div style="text-align:center;font-size:0.68rem;color:var(--text3)">外資</div>
        <div style="text-align:center;font-size:0.68rem;color:var(--text3)">投信</div>
        <div style="text-align:center;font-size:0.68rem;color:var(--text3)">自營商</div>
        ${inst5.map(d=>`
          <div style="font-size:0.68rem;color:var(--text3);text-align:right">${d.label}</div>
          <div style="display:flex;align-items:center;gap:4px">${chipBarHtml(d.foreign)}</div>
          <div style="display:flex;align-items:center;gap:4px">${chipBarHtml(d.invest)}</div>
          <div style="display:flex;align-items:center;gap:4px">${chipBarHtml(d.dealer)}</div>`).join('')}
      </div>
    </div>
    ${(() => {
      const bits = [];
      const st = instStreak(s.id);
      if (st?.days >= 2) bits.push(`法人連續 <strong style="color:${st.dir > 0 ? 'var(--bull)' : 'var(--bear)'}">${st.days} 日${st.dir > 0 ? '買' : '賣'}超</strong>（累計 ${Math.abs(st.total).toLocaleString()} 張）`);
      if (s.foreign != null && a.volMA > 0) {
        const fp = Math.abs(s.foreign * 1000 / a.volMA * 100);
        bits.push(`今日外資買賣超約佔日均量 <strong>${fp.toFixed(1)}%</strong>${fp >= 15 ? '（力道顯著）' : fp < 3 ? '（影響有限）' : ''}`);
      }
      const ic = institutionalCost(s.id);
      if (ic) bits.push(ic.txt);
      return bits.length ? `<div style="margin-top:10px;padding:9px 12px;border-radius:8px;background:rgba(255,255,255,0.02);font-size:0.78rem;color:var(--text2);line-height:1.7">🧭 籌碼解讀：${bits.join('；')}</div>` : '';
    })()}
    ${(() => {
      const td = s._tdccTrend, tc = s._tdcc;
      if (!tc) return '';
      const c = td ? (td.dir > 0 ? 'var(--bull)' : td.dir < 0 ? 'var(--bear)' : 'var(--text2)') : 'var(--text2)';
      return `<div style="padding-top:12px;border-top:1px solid var(--border);margin-top:12px">
        <div class="fund-block-ttl">🐋 集保股權分散（週報 ${tc.d}）</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">
          <div class="inst-card"><div class="inst-card-lbl">千張大戶持股</div>
            <div class="inst-card-val" style="color:${c}">${tc.big}%${td ? `<span style="font-size:0.7rem"> ${td.dBig > 0 ? '▲' : td.dBig < 0 ? '▼' : ''}${Math.abs(td.dBig)}</span>` : ''}</div></div>
          <div class="inst-card"><div class="inst-card-lbl">400張以上</div>
            <div class="inst-card-val">${tc.mid != null ? tc.mid + '%' : '--'}</div></div>
          <div class="inst-card"><div class="inst-card-lbl">散戶(5張以下)</div>
            <div class="inst-card-val">${tc.retail}%</div></div>
        </div>
        <div style="font-size:0.74rem;color:var(--text2);margin-top:7px;line-height:1.7">
          ${td
            ? `${td.dir > 0 ? '大戶增持中' : td.dir < 0 ? '大戶減碼中' : '大戶持股持平'}${td.streak >= 2 ? `，已連 ${td.streak} 週` : ''}${td.dHolders != null ? `；股東人數週${td.dHolders < 0 ? '減' : '增'} ${Math.abs(td.dHolders)}%（籌碼${td.dHolders < 0 ? '集中' : '分散'}）` : ''}<span style="color:var(--text3)">（已累積 ${td.weeks} 週）</span>`
            : '<span style="color:var(--text3)">尚未累積前週資料，下週再開即可比較增減（集保為週更資料）</span>'}
        </div>
      </div>`;
    })()}
    <div style="padding-top:12px;border-top:1px solid var(--border);margin-top:12px">
      <div class="fund-block-ttl">${inst5.length} 日累計買賣超</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px">
        ${[{l:'外資',v:t5.f},{l:'投信',v:t5.i},{l:'自營商',v:t5.d},{l:'合計',v:gTotal}].map(r=>`
          <div class="inst-card"><div class="inst-card-lbl">${r.l}</div>
          <div class="inst-card-val" style="${r.v>=0?'color:var(--bull)':'color:var(--bear)'}">${r.v>0?'+':''}${r.v.toLocaleString()} 張</div></div>`).join('')}
      </div>
    </div>`;

  // ── Render 支撐壓力位 ──────────────────────────────────────────
  const price = a.price;
  const sr = calcSR(ohlcv);
  const allLvls = [
    ...sr.resistances.map(v=>({v,t:'res'})),
    {v:price,t:'price'},
    ...sr.supports.map(v=>({v,t:'sup'})),
  ].sort((a,b)=>b.v-a.v);

  if (allLvls.length > 1) {
    const minV = allLvls[allLvls.length-1].v * 0.975;
    const maxV = allLvls[0].v * 1.025;
    const rng2 = maxV - minV || 1;
    const topPct  = v => ((maxV - v) / rng2 * 100).toFixed(1);
    const distPct = v => ((v - price) / price * 100).toFixed(1);

    const lvlsHtml = allLvls.map(l => {
      const top = topPct(l.v);
      if (l.t === 'price') return `
        <div class="sr-price-line" style="top:${top}%"></div>
        <div class="sr-price-label" style="top:${top}%">現價 ${price.toFixed(2)}</div>`;
      const d = distPct(l.v);
      const col = l.t==='res' ? 'var(--bear)' : 'var(--bull)';
      return `
        <div class="sr-level sr-level-${l.t}" style="top:${top}%"></div>
        <div style="position:absolute;top:${top}%;right:8px;transform:translateY(-50%);font-size:0.68rem;font-family:var(--mono);color:${col};background:var(--bg);padding:0 4px;z-index:1">${l.v.toFixed(2)}</div>
        <div style="position:absolute;top:${top}%;left:8px;transform:translateY(-50%);font-size:0.65rem;color:var(--text3);z-index:1">${d>0?'+':''}${d}%</div>`;
    }).join('');

    document.getElementById('sr-body').innerHTML = `
      <div class="sr-visual">${lvlsHtml}</div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:7px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:0.72rem;color:var(--bear);width:44px;flex-shrink:0">壓力位</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${sr.resistances.length
            ? sr.resistances.map(v=>`<span class="sr-chip bear">${v.toFixed(2)} (${+distPct(v)>0?'+':''}${distPct(v)}%)</span>`).join('')
            : '<span style="color:var(--text3);font-size:0.78rem">近期無明顯壓力位</span>'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:0.72rem;color:var(--bull);width:44px;flex-shrink:0">支撐位</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${sr.supports.length
            ? sr.supports.map(v=>`<span class="sr-chip bull">${v.toFixed(2)} (${distPct(v)}%)</span>`).join('')
            : '<span style="color:var(--text3);font-size:0.78rem">近期無明顯支撐位</span>'}</div>
        </div>
      </div>`;
  } else {
    document.getElementById('sr-body').innerHTML = '<p style="color:var(--text3);font-size:0.85rem">數據不足，無法計算支撐壓力位</p>';
  }

  // ── Render 市場面 ──────────────────────────────────────────────
  const closes = ohlcv.map(d => d.close);
  const ret20 = ohlcv.length>=21 ? ((closes[closes.length-1]-closes[closes.length-21])/closes[closes.length-21]*100).toFixed(1) : '0.0';

  // 真實 Beta / 相關性 / 大盤報酬：與加權指數近 60 日日報酬計算（TWII 有快取，成本低）
  // 非同步 IIFE：與基本面並行抓取，互不等待，也不擋住產業/AI 面板
  const mktP = (async () => {
  let beta = null, corr = null, mktRet20 = null;
  try {
    // 官方加權指數日線優先（Yahoo 對雲端 IP 常限流 → 過去這裡永遠是「無資料」）
    let twiiBars = await fetchTWIIOHLC(5).catch(() => []);
    if (!twiiBars?.length) twiiBars = await fetchTWIIHistory(5).catch(() => []);
    if (!twiiBars?.length) twiiBars = await fetchYahooOHLCV('^TWII', '1d', '6mo');
    if (twiiBars?.length >= 30 && ohlcv.length >= 30) {
      const idxMap = new Map(twiiBars.map(b => [b.time, b.close]));
      const pairs = [];
      for (let i = 1; i < ohlcv.length; i++) {
        const m0 = idxMap.get(ohlcv[i-1].time), m1 = idxMap.get(ohlcv[i].time);
        if (m0 && m1) pairs.push([ohlcv[i].close / ohlcv[i-1].close - 1, m1 / m0 - 1]);
      }
      const p = pairs.slice(-60);
      if (p.length >= 20) {
        const mean = arr => arr.reduce((x, y) => x + y, 0) / arr.length;
        const sm = mean(p.map(x => x[0])), mm = mean(p.map(x => x[1]));
        let cov = 0, vs = 0, vm = 0;
        for (const [rStk, rMkt] of p) { cov += (rStk-sm)*(rMkt-mm); vs += (rStk-sm)**2; vm += (rMkt-mm)**2; }
        if (vm > 0) beta = +(cov / vm).toFixed(2);
        if (vs > 0 && vm > 0) corr = +(cov / Math.sqrt(vs * vm)).toFixed(2);
      }
      const tc = twiiBars.map(b => b.close);
      if (tc.length >= 21) mktRet20 = +((tc[tc.length-1] - tc[tc.length-21]) / tc[tc.length-21] * 100).toFixed(1);
    }
  } catch {}
  // 抓不到大盤資料就顯示「無資料」，不再用亂數捏造 Beta / 相關性
  const isRealMkt = beta != null && mktRet20 != null;
  const mktRet = mktRet20;
  const rs = isRealMkt ? (+ret20 - +mktRet).toFixed(1) : null;
  const rsN = rs != null ? +rs : 0;
  const rsColor = rs == null ? 'var(--text3)' : rsN>3 ? 'var(--bull)' : rsN<-3 ? 'var(--bear)' : 'var(--text2)';
  const rsLabel = rs == null ? '待大盤資料' : rsN>5?'顯著強於大盤':rsN>1?'優於大盤':rsN<-5?'顯著弱於大盤':rsN<-1?'弱於大盤':'與大盤持平';
  const naM = '<span style="color:var(--text3);font-size:0.9rem">無資料</span>';

  if (currentStockId !== s.id) return { rs, rsN }; // 已切換個股，別蓋掉新頁面
  document.getElementById('mkt-body').innerHTML = `
    <div style="margin-bottom:8px">${isRealMkt
      ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 實測（近60日 vs 加權指數）</span>'
      : '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(148,163,184,0.12);color:var(--text3)">大盤資料暫時無法取得，稍後自動重試</span>'}</div>
    <div class="mkt-grid">
      <div class="mkt-item">
        <div class="mkt-lbl">20日相對強弱</div>
        <div class="mkt-val" style="color:${rsColor}">${rs != null ? (rsN>0?'+':'') + rs + '%' : naM}</div>
        <div class="mkt-note">${rsLabel}</div>
      </div>
      <div class="mkt-item">
        <div class="mkt-lbl">Beta 值</div>
        <div class="mkt-val">${beta != null ? beta : naM}</div>
        <div class="mkt-note">${beta == null ? '' : beta>1.2?'高Beta高波動':beta<0.8?'低Beta防禦型':'與市場同步'}</div>
      </div>
      <div class="mkt-item">
        <div class="mkt-lbl">與大盤相關性</div>
        <div class="mkt-val">${corr != null ? corr : naM}</div>
        <div class="mkt-note">${corr == null ? '' : corr>0.7?'高相關':corr>0.4?'中度相關':'低相關'}</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border-radius:8px;font-size:0.82rem;color:var(--text3);line-height:1.6">
      20日股票漲跌 <span style="font-family:var(--mono);color:${+ret20>=0?'var(--bull)':'var(--bear)'}">${+ret20>=0?'+':''}${ret20}%</span>${isRealMkt ? `，
      超額報酬 <span style="font-family:var(--mono);color:${rsColor}">${rsN>0?'+':''}${rs}%</span>。
      Beta ${beta}，${corr>0.6?'與指數連動性高，受大盤情緒影響明顯':'與指數連動性低，走勢相對獨立'}` : '（大盤比較數據載入中）'}。
    </div>`;
  return { rs, rsN };
  })();

  // ── Render 產業面 ──────────────────────────────────────────────
  const sectorTrend = a.score>=60 ? {l:'上升趨勢',c:'ind-bull'} : a.score>=45 ? {l:'盤整觀望',c:'ind-neutral'} : {l:'下行壓力',c:'ind-bear'};
  const renderIndBody = (news, isLive) => {
    const box = document.getElementById('ind-body');
    if (!box) return;
    box.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="font-size:0.82rem;color:var(--text3)">所屬產業：</span>
      <strong style="color:var(--text1)">${sector}</strong>
      <span class="ind-trend-badge ${sectorTrend.c}">${sectorTrend.l}</span>
      ${news?.length ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 即時新聞</span>' : ''}
    </div>
    <div class="fund-block-ttl">最新產業動態</div>
    ${news == null
      ? '<div class="adv-loading">載入相關新聞...</div>'
      : news.length
        ? `<div class="news-list">${news.map(n=>`
      <div class="news-item" ${n.link ? `style="cursor:pointer" onclick="window.open('${n.link}','_blank')"` : ''}>
        <div class="news-date">${n.date}${n.source ? ' · ' + n.source : ''}</div>
        <div class="news-headline">${n.headline}</div>
        <span class="news-tag ${n.tagClass}">${n.tag}</span>
      </div>`).join('')}</div>`
        : '<p style="font-size:0.8rem;color:var(--text3)">近期查無此檔相關新聞</p>'}`;
  };
  // 只顯示真實新聞（Google News RSS）；抓不到就誠實說明，不再用內建假新聞頂替
  renderIndBody(null, false);
  fetchNewsRSS(`${s.name} ${sector === '其他' ? '台股' : sector}`, 3).then(live => {
    if (currentStockId === s.id) renderIndBody(live?.length ? live : [], true);
  }).catch(() => { if (currentStockId === s.id) renderIndBody([], true); });

  // ── Render AI 綜合分析（等基本面與市場面就緒；其一失敗用中性預設值，不讓面板卡死）──
  const [fundRes, mktRes] = await Promise.all([fundP.catch(() => null), mktP.catch(() => null)]);
  const { peN = 15, divYield = 0.03, yieldPct = '3.00' } = fundRes || {};
  const { rs = '0.0', rsN = 0 } = mktRes || {};
  if (currentStockId !== s.id) return; // 使用者已切換到別檔，不要蓋掉新頁面
  const macdBull = a.macd?.macd > a.macd?.signal;
  const factors = [
    { txt:`RSI ${a.rsi?.toFixed(1)} ${a.rsi>60?'多頭':a.rsi<40?'弱勢':'中性'}`, cls: a.rsi>60?'bull':a.rsi<40?'bear':'neutral' },
    { txt:`MACD ${macdBull?'金叉':'死叉'}`, cls: macdBull?'bull':'bear' },
    { txt:`ADX ${a.adx?.toFixed(0)} ${a.adx>25?'趨勢確立':'震盪'}`, cls: a.adx>25?'bull':'neutral' },
    { txt:`評分 ${a.score}/100`, cls: a.score>=65?'bull':a.score<=40?'bear':'neutral' },
    { txt:`P/E ${peN.toFixed(1)}x ${peN<15?'低估值':peN>25?'偏貴':'合理'}`, cls: peN<15?'bull':peN>25?'bear':'neutral' },
    { txt:`殖利率 ${yieldPct}%`, cls: divYield>0.05?'bull':divYield>0.03?'neutral':'neutral' },
    (() => {
      // 只用真實法人數據判多空：有累積歷史用累積、否則用今日、都沒有標中性
      const realFlow = realDays ? instHist.reduce((sum, r) => sum + r.f + r.i + r.dl, 0) : (inst ? inst.total : null);
      if (realFlow == null) return { txt: '法人動向 資料累積中', cls: 'neutral' };
      return { txt: `法人${realDays > 1 ? realDays + '日' : '今日'} ${realFlow >= 0 ? '淨買超' : '淨賣超'}`, cls: realFlow >= 0 ? 'bull' : 'bear' };
    })(),
    { txt:`相對強弱 ${rsN>0?'+':''}${rs}%`, cls: rsN>2?'bull':rsN<-2?'bear':'neutral' },
  ];
  // 月營收因子
  if (s.rev?.yoy != null) {
    factors.push({ txt: `月營收 YoY ${s.rev.yoy >= 0 ? '+' : ''}${s.rev.yoy.toFixed(0)}%`,
                   cls: s.rev.yoy >= 10 ? 'bull' : s.rev.yoy <= -10 ? 'bear' : 'neutral' });
  }
  // 融資融券 O.I 因子（若已抓到）
  if (s._oi) {
    const oi = s._oi;
    if (oi.shortFinRatio >= 30) factors.push({ txt:`券資比 ${oi.shortFinRatio.toFixed(0)}% 軋空題材`, cls:'bull' });
    if (oi.dFin > 0 && s.foreign != null && s.foreign < -500) factors.push({ txt:'融資增 vs 外資賣（對作）', cls:'bear' });
    else if (oi.dShort > 0) factors.push({ txt:'融券增溫', cls:'neutral' });
  }

  // 以資深經理人研判為核心，AI 綜合分析用敘事方式完整說明
  const m = buildManagerAnalysis(s);
  const s1 = sr.supports[0], r1 = sr.resistances[0];
  const recCls = m.dir >= 2 ? 'bull' : m.dir <= -1 ? 'bear' : 'neutral';
  const verdict = m.stance;

  // 敘事：像經理人口述完整思路
  const parts = [];
  parts.push(`${s.id} ${s.name||''} 目前研判為「${m.stance}」。`);
  parts.push(`技術面評分 ${a.score}/100，RSI ${a.rsi?.toFixed(1)}、MACD ${macdBull?'金叉':'死叉'}、ADX ${a.adx?.toFixed(0)}（${a.adx>=30?'趨勢強':a.adx<20?'盤整':'趨勢成形'}），20 日${m.ret20>=0?'上漲':'下跌'} ${Math.abs(m.ret20).toFixed(1)}%。`);
  if (m.oi) parts.push(`籌碼：融資餘額${m.oi.dFin>=0?'增':'減'} ${Math.abs(m.oi.dFin).toLocaleString()} 張、融券${m.oi.dShort>=0?'增':'減'} ${Math.abs(m.oi.dShort).toLocaleString()} 張，券資比 ${m.oi.shortFinRatio.toFixed(0)}%。`);
  parts.push(`估值 P/E ${peN.toFixed(1)}x、殖利率 ${yieldPct}%，相對大盤${rsN>=0?'強 +':'弱 '}${rs}%。`);
  if (s.rev?.yoy != null) parts.push(`基本面月營收年增 ${s.rev.yoy >= 0 ? '+' : ''}${s.rev.yoy.toFixed(1)}%${s._fin?.netMargin != null ? `、淨利率 ${s._fin.netMargin.toFixed(1)}%` : ''}。`);
  parts.push(`關鍵價位：壓力 ${m.res}、支撐 ${m.sup}，20 日區間 ${m.lo20}~${m.hi20}，日均波動 ${m.atrPct.toFixed(1)}%。`);
  parts.push(`趨勢結構為「${m.horizon}」（${m.horizonDays}）。`);
  const bodyTxt = parts.join('');

  const recTxt = m.dir >= 4 ? '📈 強勢偏多 — 技術、籌碼、基本面多面向共振'
    : m.dir >= 2 ? '📈 偏多 — 多方條件占優，留意能否站穩支撐'
    : m.dir <= -3 ? '📉 明顯偏空 — 多項指標同步轉弱'
    : m.dir <= -1 ? '⚠ 轉弱 — 動能減退，尚未出現止穩訊號'
    : '⚖️ 中性 — 多空拉鋸，方向待突破區間後表態';

  document.getElementById('ai-anal-body').innerHTML = `
    <div class="ai-anal-box">
      <div class="ai-anal-verdict" style="color:${recCls==='bull'?'var(--bull)':recCls==='bear'?'var(--bear)':'var(--text2)'}">${verdict}<span style="font-size:0.7rem;font-weight:400;color:var(--text3);margin-left:8px">研判強度 ${m.dir>0?'+':''}${m.dir.toFixed(1)}</span></div>
      <div class="ai-anal-text">${bodyTxt}</div>
      <div class="ai-anal-factors">${factors.map(f=>`<span class="ai-anal-tag ${f.cls}">${f.txt}</span>`).join('')}</div>
      <div class="ai-rec ${recCls}">${recTxt}</div>
    </div>`;
}

// ── K 線圖表 ───────────────────────────────────────────────────────────────

// 全部週期皆為自繪 Canvas，資料來源：
//   日/週/月 → 掃描已抓好的日線（週月由日線聚合），零額外請求
//   5分/15分 → Yahoo 分鐘資料，取不到時改以證交所即時報價自行累積
// 不使用 TradingView 嵌入：其免費版不含台股，會跳出
// 「此商品僅在 TradingView 上可用」的錯誤對話框。
const CHART_TF = {
  'D': { tf: '1d',  range: '6mo', label: '日線' },
  'W': { tf: '1wk', range: '2y',  label: '週線' },
  'M': { tf: '1mo', range: '5y',  label: '月線' },
  // 分鐘級：Yahoo 優先（有歷史），否則以證交所即時報價盤中累積
  '5':  { mins: 5,  label: '5分',  intraday: true },
  '15': { mins: 15, label: '15分', intraday: true },
};
let _chartToken = 0;
let _intraTimer = null;


// 由 TradingView 在瀏覽器端載入自家資料，完全繞過我方代理與 Yahoo 封鎖。
// 注意：舊版失敗是因為 <script> 被直接塞進容器，缺少官方要求的
// tradingview-widget-container / __widget 巢狀結構，小工具找不到掛載點
// 便以預設商品（AAPL）初始化 —— 此處依官方格式正確建構。

async function initTVChart(stockId, interval = 'D') {
  const container = document.getElementById('tv-chart-container');
  if (!container) return;
  const token = ++_chartToken;
  const cfg = CHART_TF[interval] || CHART_TF.D;
  container.innerHTML = '<div class="adv-loading" style="padding-top:200px;text-align:center">載入 K 線資料...</div>';



  // 日線用掃描已抓好的資料；週/月由日線聚合 → 三者皆零額外請求
  const daily = allStocks.find(x => x.id === stockId)?.ohlcv;
  let bars = null, intraSource = null;
  if (cfg.intraday) {
    const r = await fetchIntradayBars(stockId, cfg.mins);
    bars = r.bars; intraSource = r.source;
  }
  else if (cfg.tf === '1d')       bars = daily?.length ? daily : await fetchStockOHLCV(stockId, '1d', '6mo');
  else if (cfg.tf === '1wk') bars = aggregateWeekly(daily?.length ? daily : await fetchStockOHLCV(stockId, '1d', '6mo'));
  else if (cfg.tf === '1mo') bars = aggregateMonthly(daily?.length ? daily : await fetchStockOHLCV(stockId, '1d', '6mo'));
  else                       bars = await fetchStockOHLCV(stockId, cfg.tf, cfg.range);
  if (token !== _chartToken || currentStockId !== stockId) return; // 已切換股票/週期

  if (!bars?.length || (cfg.intraday && bars.length < 2)) {
    container.innerHTML = `<div class="adv-loading" style="padding-top:170px;text-align:center;line-height:1.9">
      ${cfg.intraday ? `尚未累積足夠的 ${cfg.label} K 棒<br>
        <span style="font-size:0.76rem">台灣官方不提供免費歷史分鐘資料，本站於盤中（09:00–13:30）<br>
        以證交所即時報價逐步累積，開盤後會持續增加</span>`
        : 'K 線資料載入失敗（資料源逾時）'}<br>
      <button class="btn-ghost" style="margin-top:10px;padding:5px 16px" onclick="initTVChart('${stockId}','${interval}')">🔄 重試</button>
      ${cfg.intraday ? `<button class="btn-ghost" style="margin-top:10px;margin-left:6px;padding:5px 16px" onclick="initTVChart('${stockId}','D')">改看日線</button>` : ''}
    </div>`;
    return;
  }
  drawCandleChart(container, bars, cfg.label + (intraSource === 'local' ? '（即時累積）' : ''), stockId);

  // 分鐘圖開啟期間，盤中每 30 秒補抓一次即時報價並重繪
  clearInterval(_intraTimer);
  if (cfg.intraday && intraSource === 'local' && isMarketOpen()) {
    _intraTimer = setInterval(async () => {
      if (token !== _chartToken || currentStockId !== stockId || !isMarketOpen()) { clearInterval(_intraTimer); return; }
      try {
        const q = await fetchRealtimeQuote(stockId);
        if (!q) return;
        const nb = pushIntradayQuote(stockId, cfg.mins, q);
        if (nb.length >= 2 && token === _chartToken) drawCandleChart(container, nb, cfg.label + '（即時累積）', stockId);
      } catch {}
    }, 30000);
  }
}

function drawCandleChart(container, allBars, tfLabel, stockId) {
  const bars = allBars.slice(-120);
  const off = allBars.length - bars.length;
  const closesAll = allBars.map(b => b.close);
  const ema20All = calcEMA(closesAll, 20);
  const ema50All = calcEMA(closesAll, 50);

  container.innerHTML = '';
  container.style.position = 'relative';
  const W = container.clientWidth || 800;
  const H = container.clientHeight || 450;
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.cssText = `width:${W}px;height:${H}px;display:block`;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const BULL = '#22c55e', BEAR = '#ef4444', BLUE = '#00d4ff', YELLOW = '#f59e0b',
        GRID = 'rgba(255,255,255,0.05)', TXT = '#64748b';
  const padL = 8, padR = 58, padT = 26, padB = 20;
  const plotH = H - padT - padB;
  const priceH = plotH * 0.72, volH = plotH * 0.19, volTop = padT + priceH + plotH * 0.09 - volH * 0.35;

  const hi = Math.max(...bars.map(b => b.high));
  const lo = Math.min(...bars.map(b => b.low));
  const range = (hi - lo) || 1;
  const y = v => padT + (hi - v) / range * priceH;
  const n = bars.length;
  const slotW = (W - padL - padR) / n;
  const bw = Math.max(1, Math.min(slotW * 0.66, 13));
  const x = i => padL + i * slotW + slotW / 2;
  const maxVol = Math.max(...bars.map(b => b.volume || 0), 1);

  // 水平網格 + 價格刻度
  ctx.font = '10px monospace';
  for (let g = 0; g <= 4; g++) {
    const v = hi - range * g / 4;
    const gy = y(v);
    ctx.strokeStyle = GRID; ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
    ctx.fillStyle = TXT; ctx.textAlign = 'left';
    ctx.fillText(v >= 1000 ? v.toFixed(0) : v.toFixed(2), W - padR + 6, gy + 3);
  }
  // 日期刻度（約 6 個）
  const step = Math.max(1, Math.floor(n / 6));
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i += step) {
    const t = bars[i].time || '';
    ctx.fillStyle = TXT;
    // 分鐘 K 顯示時間（"2026-08-05 09:05" → "09:05"），日線以上顯示月日
    ctx.fillText(t.includes(' ') ? t.split(' ')[1] : t.slice(5), x(i), H - 6);
  }

  // 成交量
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    ctx.fillStyle = (b.close >= b.open ? BULL : BEAR) + '55';
    const vh = (b.volume || 0) / maxVol * volH;
    ctx.fillRect(x(i) - bw / 2, volTop + volH - vh, bw, vh);
  }

  // K 棒
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    const c = b.close >= b.open ? BULL : BEAR;
    ctx.strokeStyle = c; ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(x(i), y(b.high)); ctx.lineTo(x(i), y(b.low)); ctx.stroke();
    const top = y(Math.max(b.open, b.close));
    const hgt = Math.max(1, Math.abs(y(b.open) - y(b.close)));
    ctx.fillRect(x(i) - bw / 2, top, bw, hgt);
  }

  // EMA20 / EMA50
  const drawEMA = (arr, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.beginPath();
    let started = false;
    for (let i = 0; i < n; i++) {
      const v = arr[off + i];
      if (v == null) continue;
      if (!started) { ctx.moveTo(x(i), y(v)); started = true; } else ctx.lineTo(x(i), y(v));
    }
    ctx.stroke(); ctx.lineWidth = 1;
  };
  drawEMA(ema20All, BLUE);
  drawEMA(ema50All, YELLOW);

  // 最新收盤虛線 + 標籤
  const last = bars[n - 1];
  const lc = last.close, lcy = y(lc);
  ctx.strokeStyle = last.close >= last.open ? BULL : BEAR;
  ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(padL, lcy); ctx.lineTo(W - padR, lcy); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = last.close >= last.open ? BULL : BEAR;
  ctx.fillRect(W - padR + 2, lcy - 8, padR - 4, 16);
  ctx.fillStyle = '#04070d'; ctx.textAlign = 'left'; ctx.font = 'bold 10px monospace';
  ctx.fillText(lc >= 1000 ? lc.toFixed(0) : lc.toFixed(2), W - padR + 6, lcy + 3.5);

  // 圖例
  ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
  ctx.fillStyle = TXT; ctx.fillText(`${stockId} · ${tfLabel} · ${n} 根`, padL + 2, 14);
  ctx.fillStyle = BLUE; ctx.fillText('— EMA20', padL + 150, 14);
  ctx.fillStyle = YELLOW; ctx.fillText('— EMA50', padL + 210, 14);

  // 十字游標 + OHLC 提示框（DOM 覆蓋層，不重繪 canvas）
  const cross = document.createElement('div');
  cross.style.cssText = `position:absolute;top:${padT}px;width:1px;height:${priceH}px;background:rgba(255,255,255,0.25);pointer-events:none;display:none`;
  const tip = document.createElement('div');
  tip.style.cssText = 'position:absolute;top:24px;padding:6px 10px;background:rgba(10,15,26,0.94);border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-size:11px;font-family:monospace;color:#cbd5e1;pointer-events:none;display:none;z-index:5;line-height:1.6;white-space:nowrap';
  container.appendChild(cross); container.appendChild(tip);

  const onMove = clientX => {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const i = Math.round((px - padL - slotW / 2) / slotW);
    if (i < 0 || i >= n) { cross.style.display = tip.style.display = 'none'; return; }
    const b = bars[i];
    const chg = i > 0 ? ((b.close - bars[i - 1].close) / bars[i - 1].close * 100) : 0;
    cross.style.left = x(i) + 'px'; cross.style.display = 'block';
    tip.innerHTML = `<strong style="color:#e2e8f0">${b.time}</strong>　<span style="color:${chg >= 0 ? BULL : BEAR}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span><br>` +
      `開 ${b.open}　高 <span style="color:${BULL}">${b.high}</span>　低 <span style="color:${BEAR}">${b.low}</span>　收 <strong>${b.close}</strong><br>量 ${fmtVol(b.volume)}`;
    tip.style.display = 'block';
    tip.style.left = Math.min(Math.max(4, x(i) + 12), W - 250) + 'px';
  };
  canvas.addEventListener('mousemove', e => onMove(e.clientX));
  canvas.addEventListener('mouseleave', () => { cross.style.display = tip.style.display = 'none'; });
  canvas.addEventListener('touchmove', e => { if (e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });
  canvas.addEventListener('touchend', () => { cross.style.display = tip.style.display = 'none'; });
}

// ── Navigation ─────────────────────────────────────────────────────────────

function navigateTo(page, opts = {}) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  if (page === 'ranking') renderRanking();
  if (page === 'dashboard') renderDashboard();
  if (page === 'holdings') renderHoldings();
  if (page === 'journal') { renderJournal(); renderAiSignals(); renderPredAccuracy(); renderBacktest(); }

  // Apply filter from opts
  if (opts.filter) {
    rankingFilter = opts.filter;
    document.querySelectorAll('#ranking-filter .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === opts.filter || (opts.filter === 'all' && c.dataset.filter === 'all'));
    });
  }

  window.scrollTo(0, 0);
}

// ── Event Listeners ────────────────────────────────────────────────────────

function initEventListeners() {
  // Ranking filter chips
  document.getElementById('ranking-filter')?.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      document.getElementById('ranking-filter').querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      rankingFilter = c.dataset.filter;
      renderRanking();
    });
  });

  // Market filter chips（上市/上櫃/興櫃）
  document.getElementById('market-filter')?.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      document.getElementById('market-filter').querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      rankingMarket = c.dataset.market;
      renderRanking();
    });
  });

  // Ranking search
  document.getElementById('dash-search')?.addEventListener('input', () => renderRanking());

  // Chart TF buttons
  document.getElementById('chart-tf-group')?.querySelectorAll('.tf-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.getElementById('chart-tf-group').querySelectorAll('.tf-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      if (currentStockId) initTVChart(currentStockId, b.dataset.ctf);
    });
  });

  // Global TF buttons (nav)
  document.querySelectorAll('#nav-timeframes .tf-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#nav-timeframes .tf-btn, .mob-tf .tf-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      currentTF = b.dataset.tf;
      if (!scanning) startScan();
    });
  });

  // Table row clicks (delegated)
  ['bull-tbody','bear-tbody'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      const row = e.target.closest('tr');
      if (row?.onclick) row.onclick();
    });
  });
}

// ── Search ─────────────────────────────────────────────────────────────────

// ── 全市場搜尋索引 ─────────────────────────────────────────────────────────
// 過去搜尋只涵蓋掃描清單（100 檔），清單外的台股一律「查無」。
// 這裡把官方全市場行情（含中文名）併入索引 —— 上市櫃任何一檔都搜得到，
// 不在掃描清單的標的可一鍵加入後立即分析。
function marketSearchIndex() {
  const out = [];
  const seen = new Set();
  for (const s of getStockList()) { out.push({ id: s.id, name: s.name, sector: s.sector || '自訂', inList: true }); seen.add(s.id); }
  for (const a of getAutoStocks()) if (!seen.has(a.id)) { out.push({ id: a.id, name: a.name || a.id, sector: '法人動向', inList: true }); seen.add(a.id); }
  const all = typeof _dayAllResolved !== 'undefined' ? _dayAllResolved : null;
  if (all) {
    for (const [id, q] of Object.entries(all)) {
      if (seen.has(id) || !q?.name) continue;
      if (typeof isRealStockId === 'function' && !isRealStockId(id)) continue;
      out.push({ id, name: q.name, sector: '未在掃描清單', inList: false, close: q.close });
    }
  }
  return out;
}

function searchStocks(query, limit = 10) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const idx = marketSearchIndex();
  const hit = idx.filter(s => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  // 已在掃描清單者優先，其次代號開頭吻合者
  hit.sort((a, b) => (b.inList - a.inList)
    || (b.id.toLowerCase().startsWith(q) - a.id.toLowerCase().startsWith(q))
    || a.id.localeCompare(b.id));
  return hit.slice(0, limit);
}

// 開啟任一檔股票：不在掃描清單者先加入自選，下輪掃描即有完整分析
function openStockAnywhere(id, name) {
  if (!getStockList().find(x => x.id === id) && !getAutoStocks().find(x => x.id === id)) {
    addWatchStock(id, name || id);
  }
  openStock(id);
}

function initNavSearch() {
  const input = document.getElementById('nav-search-input');
  const dd    = document.getElementById('search-dropdown');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) { dd.innerHTML = ''; return; }
    const list = searchStocks(q, 8);
    dd.innerHTML = list.length ? list.map(s => `
      <div class="search-item" onclick="openStockAnywhere('${s.id}','${(s.name || '').replace(/'/g, "\\'")}');document.getElementById('nav-search-input').value='';document.getElementById('search-dropdown').innerHTML=''">
        <span class="search-item-id">${s.id}</span>
        <span class="search-item-name">${s.name}</span>
        <span class="search-item-sector">${s.inList ? s.sector : '＋加入掃描'}</span>
      </div>`).join('')
      : '<div class="search-item" style="color:var(--text3)">查無此股票 — 請確認代號或中文名稱（僅支援上市櫃）</div>';
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-search-wrap')) dd.innerHTML = '';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) { openStock(q); input.value = ''; dd.innerHTML = ''; }
    }
  });
}

// ── Mobile Menu ─────────────────────────────────────────────────────────────

function toggleMobileMenu() {
  document.getElementById('mobile-drawer').classList.toggle('open');
  document.getElementById('drawer-overlay').classList.toggle('show');
}

// ── Refresh ─────────────────────────────────────────────────────────────────

function manualRefresh() {
  if (!scanning) startScan();
}

// ── 盤中即時報價：每 15 秒批次更新價格 ─────────────────────────────────────
// 完整掃描（含技術分析）成本高、間隔數分鐘；但價格本身只要更新數字即可。
// 這裡以 MIS 批次報價每 15 秒刷新價格與成交量，技術指標仍隨掃描更新。
let liveTimer = null;
let _liveBusy = false;
let _lastQuoteTime = '';
let _liveStatus = '';          // 供導覽列顯示：報價時間或失敗原因
let _liveFail = '';            // 失敗的具體原因（顯示在價格旁，手機也看得到）
let _liveFailStreak = 0;       // 連續失敗次數，用於自動清熔斷器重連
const _liveQuotes = {};        // 最近一次成功的即時報價（掃描重建 allStocks 後用來復原）

// 把即時報價套進一檔股票（掃描重建物件後也會呼叫，避免價格倒退回快取值）
function applyLiveQuote(s, q, today) {
  if (!q?.price || !s?.analysis) return false;
  if (q.date && `${q.date.slice(0,4)}-${q.date.slice(4,6)}-${q.date.slice(6,8)}` !== today) return false;
  s.analysis.price = q.price;
  if (q.prevClose) s.analysis.prevClose = q.prevClose;
  if (q.cumVol) s.analysis.lastVol = q.cumVol * 1000;      // 張 → 股
  const bars = s.ohlcv;
  if (bars?.length) {
    const last = bars[bars.length - 1];
    const bar = { open: q.open ?? q.price, high: Math.max(q.high ?? q.price, q.price),
                  low: Math.min(q.low ?? q.price, q.price), close: q.price,
                  volume: q.cumVol ? q.cumVol * 1000 : last.volume };
    if (last.time === today) Object.assign(last, bar);
    else bars.push({ time: today, ...bar });
  }
  s._quoteTime = q.time;
  // 五檔掛單：先前抓回來就丟掉了 —— 存起來供研判（掛單失衡）與委託簿顯示使用
  if (q.bidV?.length || q.askV?.length) {
    const bid = (q.bidV || []).reduce((x, y) => x + (y || 0), 0);
    const ask = (q.askV || []).reduce((x, y) => x + (y || 0), 0);
    if (bid || ask) s._book = { bid, ask, ratio: ask > 0 ? bid / ask : null,
                                bidP: q.bidP, bidV: q.bidV, askP: q.askP, askV: q.askV, at: Date.now() };
  }
  // MIS 額外欄位：漲跌停價、當盤量、市場別、全名 —— 一併留下供分析與顯示使用
  if (q.limitUp != null || q.limitDown != null) s._limit = { up: q.limitUp, down: q.limitDown };
  if (q.tickVol != null) s._tickVol = q.tickVol;
  if (q.fullName && !s.fullName) s.fullName = q.fullName;
  if (q.ex === 'tse' || q.ex === 'otc') {
    // 官方回報的市場別最準，用來校正先前靠試探記住的判斷
    const mkt = q.ex === 'otc' ? 'tpex' : 'twse';
    if (s.mkt !== mkt) { s.mkt = mkt; try { localStorage.setItem(`mkt:${s.id}`, mkt); } catch {} }
  }
  return true;
}

// 距離漲停／跌停的百分比 —— 追價與當沖風險的關鍵，先前完全沒用到
function limitDistance(s) {
  const px = s?.analysis?.price, lim = s?._limit;
  if (!px || !lim) return null;
  return {
    toUp: lim.up ? +((lim.up - px) / px * 100).toFixed(2) : null,
    toDown: lim.down ? +((px - lim.down) / px * 100).toFixed(2) : null,
    up: lim.up, down: lim.down,
  };
}

// 掃描完成後復原即時價 —— runScan 會重建 allStocks，
// 若不復原，價格會倒退回日 K 快取（最舊可達 10 分鐘前）直到下一次 tick
function reapplyLiveQuotes() {
  if (!isMarketOpenTW()) return;
  const today = twClock().date;
  for (const s of allStocks) applyLiveQuote(s, _liveQuotes[s.id], today);
}

async function refreshLivePrices() {
  // 過去掃描期間完全封鎖即時報價 —— 100 檔掃描可耗時 1 分鐘以上，
  // 開站後要等第一輪掃描結束才會有即時價（使用者感受到的「很久才連上」）。
  // 改為只擋自身重入：已完成分析的股票即可即時更新，掃描結束再統一復原一次。
  if (_liveBusy) return 0;
  if (!isMarketOpenTW()) { _liveStatus = ''; return 0; }
  const ids = allStocks.filter(s => s.analysis).map(s => s.id);
  if (!ids.length) return 0;
  _liveBusy = true;
  try {
    let map = await fetchRealtimeBatch(ids);
    let src = localStorage.getItem('mis-direct') === 'yes' ? 'MIS 直連' : 'MIS';
    // FinMind（使用者自己的免費 token）：額度不與他人共用，優先於 Yahoo 備援
    if (!Object.keys(map).length && finmindToken()) {
      const prio = [currentStockId, ...getHoldings().map(h => h.id),
        ...[...allStocks].filter(x => x.analysis).sort((a, b) => verdictScore(b) - verdictScore(a)).map(x => x.id)];
      map = await fetchFinMindQuotes([...new Set(prio.filter(Boolean))], 12);
      src = 'FinMind';
    }
    if (!Object.keys(map).length) {
      // MIS 取不到 → 改用 Yahoo 分鐘線備援（每檔一請求，故只取重點標的：
      // 正在檢視的個股、持倉、評分前段），至少讓最在意的價格是即時的
      const prio = [currentStockId, ...getHoldings().map(h => h.id),
        ...[...allStocks].filter(s2 => s2.analysis).sort((a, b) => verdictScore(b) - verdictScore(a)).map(s2 => s2.id)];
      const uniq = [...new Set(prio.filter(Boolean))];
      map = await fetchYahooQuotes(uniq, 15);
      src = 'Yahoo 備援';
    }
    if (!Object.keys(map).length) {               // 靜默失敗是先前查不出問題的原因，改為明示
      _liveFail = `${lastQuoteFail || 'MIS 無回應'}`
        + `${finmindToken() ? '；FinMind 亦無資料' : '；未設定 FinMind token'}`
        + `；Yahoo 分鐘線亦無資料${srcDead('yahoo') ? '（Yahoo 限流中）' : ''}`;
      _liveStatus = '即時報價無回應';
      // 自動恢復：連續失敗到一定次數就自行清熔斷器重試一次，
      // 不必等使用者手動按「重試」（先前必須手動介入才會恢復）
      if (++_liveFailStreak % 4 === 0) {
        try { localStorage.removeItem('src-dead'); localStorage.removeItem('proxy-fail'); } catch {}
        _liveStatus = '即時報價重連中...';
      }
      renderLiveTick();
      return 0;
    }
    const today = twClock().date;
    let n = 0, latest = '';
    const touched = [];
    for (const s of allStocks) {
      const q = map[s.id];
      if (!q) continue;
      if (applyLiveQuote(s, q, today)) {
        _liveQuotes[s.id] = q;
        if (q.time > latest) latest = q.time;
        touched.push(s);
        n++;
      }
    }
    // 即時大盤指數（MIS 同一支端點）—— 盤中大盤原本只有日線收盤值
    try {
      const idx = await fetchRealtimeIndex();
      const t00 = idx?.t00;
      if (t00?.price) {
        const f = outlookData.factors?.find(x => x.sym === '^TWII');
        if (f) { f.price = t00.price; f.chg1 = t00.chgPct ?? f.chg1; }
        outlookData.twiiLive = t00;
      }
    } catch {}

    if (n) {
      _lastQuoteTime = latest; _liveFail = ''; _liveFailStreak = 0;
      _liveStatus = `報價 ${latest}${src === 'MIS' ? '' : `（${src}）`}`;
      // 關鍵：讓即時價真正進入指標與研判，而不只是換掉畫面上的數字
      for (const s of pickRecomputeTargets(touched)) recomputeAnalysis(s);
      checkStopProximity();   // 持倉逼近/跌破停損 → 盤中即時警報（每檔每日一次）
    }
    else _liveStatus = '報價非今日（休市或收盤）';
    renderLiveTick();
    return n;
  } catch (e) {
    console.warn('即時報價更新失敗:', e);
    _liveFail = `更新過程發生錯誤：${e?.message || e}`;   // 例外訊息也要留下，否則又是一次靜默失敗
    _liveStatus = '即時報價連線失敗';
    renderLiveTick();
    return 0;
  } finally { _liveBusy = false; }
}

// 只重繪價格相關區塊（不重跑技術分析，故成本低）
function renderLiveTick() {
  try {
    const el = document.getElementById('quote-time');
    if (el) {
      el.textContent = _liveStatus;
      el.style.color = _liveStatus.includes('無回應') || _liveStatus.includes('失敗')
        ? 'var(--bear)' : 'var(--text3)';
    }
    if (currentPage === 'ranking') renderRanking();
    else if (currentPage === 'dashboard') renderDashboard();
    else if (currentPage === 'stock' && currentStockId) {
      const s = allStocks.find(x => x.id === currentStockId);
      // 決策相關面板（交易員視角、AI 研判與進場計畫、型態）也要跟著即時價更新，
      // 否則價格跳動但「該怎麼做」還停在掃描當下。圖表不重繪以免打斷檢視。
      if (s?.analysis) {
        try { renderTraderView(s); } catch {}
        try { renderPatterns(s); } catch {}
        try { renderAnalysisPanels(s, s._inst || null); } catch {}
        try { renderOrderFlow(s); } catch {}   // 五檔委託簿隨即時 tick 更新
      }
      const pe = document.getElementById('stock-price');
      if (s?.analysis && pe) {
        pe.textContent = s.analysis.price.toFixed(2);
        const ce = document.getElementById('stock-change');
        if (ce && s.analysis.prevClose) {
          const d = s.analysis.price - s.analysis.prevClose;
          ce.style.color = d >= 0 ? 'var(--bull)' : 'var(--bear)';
          ce.textContent = `${d >= 0 ? '+' : ''}${d.toFixed(2)} (${(d / s.analysis.prevClose * 100).toFixed(2)}%)`;
        }
        const qe = document.getElementById('stock-quote-src');
        if (qe) qe.innerHTML = quoteStampHTML(s);
      }
    }
    if (currentPage === 'holdings') renderHoldings();
  } catch (e) { console.warn('即時重繪失敗:', e); }
}

// 單檔重抓歷史資料（資料過期時使用）
async function retryStock(id) {
  const s = allStocks.find(x => x.id === id);
  if (!s) return;
  showToast(`重新抓取 ${s.name} 的歷史資料...`, 'info');
  try {
    clearCurrentMonthCache(id);
    try { localStorage.removeItem('src-dead'); localStorage.removeItem('proxy-fail'); } catch {}
    const ohlcv = await fetchStockOHLCV(id, currentTF, currentTF === '1d' ? '6mo' : '2y');
    if (ohlcv.length >= 20) {
      s.ohlcv = ohlcv;
      s.analysis = calculateScore(ohlcv);
      s.reversal = detectReversal(ohlcv, s.analysis);
      delete s._verdict;
      const age = dataAgeDays(s);
      if (age >= STALE_LIMIT) { s._staleDays = age; showToast(`仍只取得到 ${String(ohlcv[ohlcv.length-1].time).slice(5)} 的資料（落後 ${age} 個交易日）`, 'error'); }
      else { delete s._staleDays; showToast(`已更新至 ${String(ohlcv[ohlcv.length-1].time).slice(5)}`, 'success'); }
      renderStockDetail(s);
    } else showToast('仍無法取得歷史資料，稍後自動重試', 'error');
  } catch (e) { showToast(`重抓失敗：${e?.message || e}`, 'error'); }
}

// 手動重試即時報價：清掉熔斷器與報價快取後強制重抓，並把結果直接顯示出來
let _retryBusy = false;
async function retryLiveQuotes() {
  if (_retryBusy) return;                       // 連按不重複觸發（原本會疊出一整排提示）
  _retryBusy = true;
  try { await _retryLiveQuotesInner(); } finally { _retryBusy = false; }
}
async function _retryLiveQuotesInner() {
  try { localStorage.removeItem('src-dead'); localStorage.removeItem('proxy-fail'); } catch {}
  Object.keys(localStorage).filter(k => k.startsWith('cache:ohlcv:')).forEach(k => localStorage.removeItem(k));
  showToast('重新取得即時報價中...', 'info');
  const n = await refreshLivePrices();
  showToast(n ? `已更新 ${n} 檔即時報價（${_liveStatus}）` : `仍無法取得：${_liveFail || '未知原因'}`, n ? 'success' : 'error');
  const s2 = allStocks.find(x => x.id === currentStockId);
  if (s2) renderStockDetail(s2);
}

function startLiveQuotes() {
  clearInterval(liveTimer);
  liveTimer = setInterval(() => {
    if (document.hidden) return;              // 背景分頁不打 API
    refreshLivePrices();
  }, 15000);
  refreshLivePrices();
  startNewsCycle();
}

// ── 盤中新聞即時分析：每 10 分鐘重抓重判，追蹤標的的新新聞記入流水帳 ──────
// 新聞不是盤後才看的東西 — 盤中一則「調降財測」足以讓技術面全部失效。
let _newsTimer = null;
let _newsSeen = new Set();
function startNewsCycle() {
  clearInterval(_newsTimer);
  _newsTimer = setInterval(() => {
    if (document.hidden || !isMarketOpenTW()) return;
    refreshNewsIntraday();
  }, 10 * 60 * 1000);
}

async function refreshNewsIntraday() {
  try {
    const news = (await fetchNewsRSS('台股 股市', 12).catch(() => null) || [])
      .map(n => ({ impact: n.source || '台股', ...n }));
    if (!news.length) return;
    _newsRaw = news;
    buildNewsSignals(news);          // 讓 buildManagerAnalysis 的新聞證據即刻更新
    // 追蹤標的（持倉/長期名單/AI 訊號）被新新聞點名 → 記入流水帳
    const tracked = new Map();
    for (const h of getHoldings()) tracked.set(h.name, h.id);
    for (const it of getLongTermList()) tracked.set(it.name, it.id);
    for (const t of getAiSignals().filter(x => x.status === 'open')) tracked.set(t.name, t.id);
    const cutoff = Date.now() - 45 * 60 * 1000;
    for (const n of news) {
      if (!n.ts || n.ts < cutoff || _newsSeen.has(n.headline)) continue;
      for (const [name, id] of tracked) {
        if (name.length >= 2 && n.headline.includes(name)) {
          _newsSeen.add(n.headline);
          logSignal('alert', `新聞點名 ${name}（${id}）${n.dir && n.dir !== '中性' ? `・${n.dir}` : ''}`,
            n.headline, { id, dir: n.dir === '偏多' ? 1 : n.dir === '偏空' ? -1 : 0, dedupKey: `news-${id}-${n.headline.slice(0, 12)}` });
          break;
        }
      }
    }
    if (_newsSeen.size > 200) _newsSeen = new Set([..._newsSeen].slice(-100));
  } catch (e) { console.warn('盤中新聞更新失敗:', e); }
}

function startRefreshCycle() {
  const sec = parseInt(localStorage.getItem('refresh-interval') || '300');
  if (sec === 0) return;
  refreshSec = sec;
  let remaining = refreshSec;
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    remaining--;
    document.getElementById('refresh-countdown').textContent = remaining >= 60 ? `${Math.floor(remaining / 60)}分${remaining % 60}秒` : remaining + '秒';
    if (remaining <= 0) {
      remaining = refreshSec;
      // 分頁在背景時不重掃（省流量也避免無人看時把免費資料源的額度打光）
      if (!scanning && !document.hidden) startScan();
    }
  }, 1000);
}

// ── Settings ────────────────────────────────────────────────────────────────

function loadSettings() {
  const fm = document.getElementById('s-finmind');
  if (fm) {
    fm.value = localStorage.getItem('finmind-token') || '';
    fm.addEventListener('change', () => {
      const v = fm.value.trim();
      if (v) { localStorage.setItem('finmind-token', v); showToast('已儲存 FinMind token — 下次即時報價會優先使用', 'success'); }
      else { localStorage.removeItem('finmind-token'); showToast('已清除 FinMind token', 'info'); }
    });
  }
  const tf = localStorage.getItem('timeframe') || '1d';
  currentTF = tf;
  // 一次性遷移：舊版預設 60 秒全池重掃對免費資料源太頻繁（觸發限流 → 大量檢測失敗），下限改 5 分鐘
  let refreshVal = localStorage.getItem('refresh-interval') || '300';
  if (+refreshVal > 0 && +refreshVal < 300 && !localStorage.getItem('refresh-migrated')) {
    refreshVal = '300';
    localStorage.setItem('refresh-interval', '300');
    localStorage.setItem('refresh-migrated', '1');
  }
  const bull = localStorage.getItem('bull-threshold') || '60';
  const bear = localStorage.getItem('bear-threshold') || '40';

  const sCap = document.getElementById('s-capital');
  if (sCap) sCap.value = localStorage.getItem('capital') || '1000000';
  const sTF = document.getElementById('s-timeframe');
  if (sTF) sTF.value = tf;
  const sR  = document.getElementById('s-refresh');
  if (sR) sR.value = refreshVal;
  const sBull = document.getElementById('s-bull-threshold');
  if (sBull) { sBull.value = bull; document.getElementById('bull-thr-val').textContent = bull; }
  const sBear = document.getElementById('s-bear-threshold');
  if (sBear) { sBear.value = bear; document.getElementById('bear-thr-val').textContent = bear; }

  const tgToken  = localStorage.getItem('tg-token') || '';
  const tgChatId = localStorage.getItem('tg-chatid') || '';
  const tgToggle = localStorage.getItem('tg-enabled') === 'true';
  const sTGT = document.getElementById('s-tg-token');
  const sTGC = document.getElementById('s-tg-chatid');
  const sTGE = document.getElementById('s-tg-toggle');
  if (sTGT) sTGT.value = tgToken;
  if (sTGC) sTGC.value = tgChatId;
  if (sTGE) sTGE.checked = tgToggle;
  ['sig','event','focus'].forEach(k => {
    const cb = document.getElementById(`s-tg-${k}`);
    if (cb) cb.checked = localStorage.getItem(`tg-${k}`) !== 'false';
  });
  // 訊號主機（預設 true）
  const sMaster = document.getElementById('s-master-toggle');
  if (sMaster) sMaster.checked = localStorage.getItem('signal-master') !== 'false';
  // 通知門檻
  const nBull = localStorage.getItem('notif-bull-thr') || '70';
  const nBear = localStorage.getItem('notif-bear-thr') || '30';
  const sNB = document.getElementById('s-notif-bull-thr');
  if (sNB) { sNB.value = nBull; const v = document.getElementById('notif-bull-val'); if (v) v.textContent = nBull; }
  const sNBr = document.getElementById('s-notif-bear-thr');
  if (sNBr) { sNBr.value = nBear; const v = document.getElementById('notif-bear-val'); if (v) v.textContent = nBear; }
}

function saveAllSettings() {
  const tf   = document.getElementById('s-timeframe')?.value;
  const ref  = document.getElementById('s-refresh')?.value;
  const bull = document.getElementById('s-bull-threshold')?.value;
  const bear = document.getElementById('s-bear-threshold')?.value;
  const tgT  = document.getElementById('s-tg-token')?.value;
  const tgC  = document.getElementById('s-tg-chatid')?.value;
  const tgE  = document.getElementById('s-tg-toggle')?.checked;

  if (tf)   localStorage.setItem('timeframe', tf);
  if (ref)  localStorage.setItem('refresh-interval', ref);
  if (bull) localStorage.setItem('bull-threshold', bull);
  if (bear) localStorage.setItem('bear-threshold', bear);
  const capEl = document.getElementById('s-capital');
  if (capEl?.value) localStorage.setItem('capital', capEl.value);
  if (tgT)  localStorage.setItem('tg-token', tgT);
  if (tgC)  localStorage.setItem('tg-chatid', tgC);
  if (tgE !== undefined) localStorage.setItem('tg-enabled', tgE);
  ['sig','event','focus'].forEach(k => {
    const cb = document.getElementById(`s-tg-${k}`);
    if (cb) localStorage.setItem(`tg-${k}`, cb.checked);
  });
  const sMaster = document.getElementById('s-master-toggle');
  if (sMaster) localStorage.setItem('signal-master', sMaster.checked);
  const nBull = document.getElementById('s-notif-bull-thr')?.value;
  const nBear = document.getElementById('s-notif-bear-thr')?.value;
  if (nBull) localStorage.setItem('notif-bull-thr', nBull);
  if (nBear) localStorage.setItem('notif-bear-thr', nBear);

  showToast('設定已儲存', 'success');
  startRefreshCycle();
  startLiveQuotes();   // 盤中每 15 秒批次更新即時報價
}

function resetAllSettings() {
  ['timeframe','refresh-interval','bull-threshold','bear-threshold','tg-token','tg-chatid','tg-enabled',
   'tg-sig','tg-event','tg-focus','learn-market-gate','learn-rsi-cap','learn-adx-min','learn-max-risk',
   'signal-master','notif-bull-thr','notif-bear-thr']
    .forEach(k => localStorage.removeItem(k));
  loadSettings();
  showToast('已恢復預設設定', 'info');
}

function getThreshold(type) {
  return parseInt(localStorage.getItem(`${type}-threshold`) || (type === 'bull' ? '60' : '40'));
}

// ── 跨裝置同步：匯出／匯入設定與累積資料 ─────────────────────────────────────
// 同一個網址在手機與電腦都能開，但資料存在各自瀏覽器的 localStorage，
// 不會自動互通。這裡提供打包匯出／匯入，讓兩邊保持一致。
const SYNC_KEYS = [
  'my-holdings', 'price-alerts', 'custom-stocks', 'pred-log',
  'inst-hist', 'fin-hist', 'tdcc-hist',
  'tg-token', 'tg-chatid', 'tg-enabled', 'tg-sig', 'tg-event', 'tg-focus',
  'bull-threshold', 'bear-threshold', 'refresh-interval', 'timeframe',
  'notif-bull-thr', 'notif-bear-thr', 'signal-master',
];

function exportSettings() {
  const data = {};
  for (const k of SYNC_KEYS) {
    const v = localStorage.getItem(k);
    if (v != null) data[k] = v;
  }
  const payload = { app: '台股雷達', version: 1, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `taistock-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast(`已匯出 ${Object.keys(data).length} 項設定與資料`, 'success');
}

function importSettings(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const payload = JSON.parse(e.target.result);
      const data = payload?.data;
      if (!data || typeof data !== 'object') throw new Error('格式不符');
      let n = 0;
      for (const [k, v] of Object.entries(data)) {
        if (!SYNC_KEYS.includes(k)) continue;   // 只還原白名單，避免匯入異常鍵值
        localStorage.setItem(k, v);
        n++;
      }
      showToast(`✅ 已匯入 ${n} 項設定，重新載入中...`, 'success');
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      showToast('匯入失敗：檔案格式不正確', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';   // 允許重複選同一個檔案
}

// ── 資料源診斷：逐一測試各來源，找出資料載入失敗的環節 ──────────────────────
async function runDiagnostics() {
  const el = document.getElementById('diag-body');
  if (!el) return;
  const tests = [
    { name: '自家代理 (/api/proxy)', run: async () => {
        let res;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        try {
          // 以證交所網址測試代理本身是否健康；若用 Yahoo 會測到對方的限流而非代理狀態
          res = await fetch(`/api/proxy?url=${encodeURIComponent('https://www.twse.com.tw/rwd/zh/afterTrading/FMTQIK?date=' + new Date().toISOString().slice(0,7).replace('-','') + '01&response=json')}`,
            { signal: ctrl.signal });
        } catch { return { ok: false, msg: '連線失敗（本機 file:// 開啟時正常，須部署後測試）' }; }
        finally { clearTimeout(timer); }
        const txt = await res.text().catch(() => '');
        if (/^\s*<(!doctype|html)/i.test(txt))
          return { ok: false, msg: '回傳網頁而非資料 — vercel.json 的 rewrites 未排除 /api/' };
        if (!res.ok) return { ok: false, msg: `HTTP ${res.status}｜${txt.slice(0, 80)}` };
        try {
          const j = JSON.parse(txt);
          return j?.data?.length
            ? { ok: true, msg: `正常，代理可取得證交所資料（${j.data.length} 筆）` }
            : { ok: false, msg: `回應格式非預期：${txt.slice(0, 80)}` };
        } catch { return { ok: false, msg: `無法解析：${txt.slice(0, 80)}` }; }
      } },
    { name: '證交所當日行情 (STOCK_DAY_ALL)', run: async () => {
        const m = await fetchTWDayAll();
        return m && Object.keys(m).length ? { ok: true, msg: `${Object.keys(m).length} 檔當日行情` } : { ok: false, msg: '無資料（非交易日或來源異常）' };
      } },
    { name: '證交所估值 (BWIBBU_ALL)', run: async () => {
        const m = await fetchTWFundAll();
        return m && Object.keys(m).length ? { ok: true, msg: `${Object.keys(m).length} 檔本益比/殖利率` } : { ok: false, msg: '無資料' };
      } },
    { name: '三大法人 (T86)', run: async () => {
        const r = await fetchT86All();
        return r?.length ? { ok: true, msg: `${r.length} 檔法人買賣超` } : { ok: false, msg: '無資料（非交易日或來源異常）' };
      } },
    { name: '月營收 (t187ap05)', run: async () => {
        const m = await fetchRevenueAll();
        return m && Object.keys(m).length ? { ok: true, msg: `${Object.keys(m).length} 檔月營收` } : { ok: false, msg: '無資料' };
      } },
    { name: '季度財報 (t187ap06)', run: async () => {
        const m = await fetchFinancialsAll();
        return m && Object.keys(m).length ? { ok: true, msg: `${Object.keys(m).length} 檔綜合損益表` } : { ok: false, msg: '無資料（端點格式可能已變更）' };
      } },
    { name: '資產負債表 (t187ap07)', run: async () => {
        const m = await fetchBalanceSheetAll();
        return m && Object.keys(m).length ? { ok: true, msg: `${Object.keys(m).length} 檔財務體質` } : { ok: false, msg: '無資料' };
      } },
    { name: '大盤量能 (FMTQIK)', run: async () => {
        const r = await fetchMarketTurnover();
        const t = analyzeTurnover(r);
        return t ? { ok: true, msg: `${t.date} 成交 ${(t.amount/1e8).toFixed(0)} 億｜${t.verdict.split(' —')[0]}` } : { ok: false, msg: '無資料' };
      } },
    { name: '美股指數備援 Stooq（非必要）', run: async () => {
        const c = await fetchStooqCloses('^GSPC');
        return c?.length ? { ok: true, msg: `S&P500 ${c.length} 筆，最新 ${c[c.length-1]}` } : { ok: false, msg: '無回應（Yahoo 正常時不影響）' };
      } },
    { name: '注意/處置股警示 (announcement)', run: async () => {
        const m = await fetchMarketAlerts();
        if (m == null) return { ok: false, msg: '無回應' };
        const n = Object.keys(m).length;
        return { ok: true, msg: n ? `目前 ${n} 檔列警示` : '目前無處置/注意股（正常）' };
      } },
    { name: '融資融券 O.I (MI_MARGN)', run: async () => {
        const m = await fetchMarginAll();
        return m && Object.keys(m).length ? { ok: true, msg: `${Object.keys(m).length} 檔融資融券` } : { ok: false, msg: '無資料' };
      } },
    { name: 'Yahoo 個股 K 線（非必要）', run: async () => {
        const b = await fetchYahooOHLCV('2330.TW', '1d', '1mo');
        return b?.length ? { ok: true, msg: `${b.length} 根日 K，最新收盤 ${b[b.length-1].close}` }
                         : { ok: false, msg: 'Yahoo 無回應（將改用證交所備援）' };
      } },
    { name: '加權指數官方日線 (MI_5MINS_HIST)', run: async () => {
        const b = await fetchTWIIOHLC(2);
        return b?.length ? { ok: true, msg: `${b.length} 根，最新收盤 ${b[b.length-1].close}` } : { ok: false, msg: '無資料' };
      } },
    { name: '證交所日線備援 (STOCK_DAY)', run: async () => {
        const b = await fetchTWSEHistory('2330', 2);
        return b?.length ? { ok: true, msg: `${b.length} 根日 K，最新收盤 ${b[b.length-1].close}` }
                         : { ok: false, msg: '無資料' };
      } },
    { name: '集保股權分散 (TDCC 週報)', run: async () => {
        const m = await fetchTDCCAll(new Set(['2330', '2317', '2454'])).catch(() => null);
        if (!m || !Object.keys(m).length) return { ok: false, msg: '無回應或格式無法解析（端點/欄位可能已變更，大戶週度證據將略過）' };
        const t = m['2330'] || Object.values(m)[0];
        return { ok: true, msg: `${Object.keys(m).length} 檔｜資料日 ${t.d}｜千張大戶 ${t.big}%` +
          (t.mid != null ? `、400張以上 ${t.mid}%` : '（級距數非 15，400張級距略過）') +
          `｜級距 ${t.levels} 段` };
      } },
    { name: '除權除息計算結果 (TWT49U)', run: async () => {
        const list = await fetchExDividend();
        if (!list?.length) return { ok: false, msg: '無回應（除息還原將沿用缺口推算，仍可運作但精度較低）' };
        const last = list[list.length - 1];
        return { ok: true, msg: `累積 ${list.length} 筆除權息事件｜最近 ${last.date} ${last.id} 權息值 ${last.amt}` };
      } },
    { name: '外資持股比率 (MI_QFIIS)', run: async () => {
        const m = await fetchForeignHolding();
        if (!m) return { ok: false, msg: '無回應（籌碼分析將只有單日買賣超，無持股水位）' };
        const n = Object.keys(m).length;
        const t = m['2330'] || Object.values(m)[0];
        return { ok: true, msg: `${n} 檔｜範例持股比率 ${t.pct}%` };
      } },
    { name: '公司基本資料/產業別 (t187ap03_L)', run: async () => {
        const m = await fetchCompanyInfo();
        if (!m) return { ok: false, msg: '無回應（清單外標的將無產業別，族群排名僅涵蓋內建清單）' };
        const n = Object.keys(m).length;
        const withSec = Object.values(m).filter(x => x.sector).length;
        const sample = m['2330'] || Object.values(m)[0];
        return { ok: true, msg: `${n} 家公司｜${withSec} 家有產業別｜範例：${sample?.name || '--'} / ${sample?.sector || '--'}` };
      } },
    { name: '當日沖銷成交 (TWTB4U)', run: async () => {
        const m = await fetchDayTradeStats();
        if (!m) return { ok: false, msg: '無回應（當沖推薦將無官方成交佐證）' };
        const n = Object.keys(m).length;
        return { ok: true, msg: `${n} 檔有當沖成交紀錄${m['2330'] ? `｜台積電當沖 ${Math.round(m['2330'].vol / 1000).toLocaleString()} 張` : ''}` };
      } },
    { name: '三大法人備援 (OpenAPI T86)', run: async () => {
        const r = await fetchT86OpenAPI();
        if (!r?.length) return { ok: false, msg: '無回應（rwd 版失效時將無法人資料）' };
        const t = r.find(x => x.id === '2330') || r[0];
        return { ok: true, msg: `${r.length} 檔｜${t.name || t.id} 外資 ${t.foreign.toLocaleString()} 張` };
      } },
    { name: '除權息預告 (TWT48U)', run: async () => {
        const r = await fetchExDivCalendar();
        if (!Array.isArray(r)) return { ok: false, msg: '無回應' };
        return { ok: true, msg: r.length ? `${r.length} 檔未來除權息事件` : '目前無未來除權息預告（可能為淡季，正常）' };
      } },
    { name: '期交所 P/C 比 (PutCallRatio)', run: async () => {
        const r = await fetchTaifexPCR();
        return r?.ratio != null ? { ok: true, msg: `P/C ${r.ratio.toFixed(2)}（${r.date || '日期不明'}）` }
                                : { ok: false, msg: '無資料 — 期交所 OpenAPI 無回應或格式變更' };
      } },
    { name: '期交所外資台指期 (三大法人期貨)', run: async () => {
        const r = await fetchTaifexForeignTX();
        return r?.net != null ? { ok: true, msg: `外資淨${r.net >= 0 ? '多' : '空'} ${Math.abs(r.net).toLocaleString()} 口（${r.date || '日期不明'}）` }
                              : { ok: false, msg: '無資料 — 期交所 OpenAPI 無回應或格式變更' };
      } },
    { name: '財經新聞 (Google News RSS)', run: async () => {
        const r = await fetchNewsRSS('台股 股市', 5).catch(() => null);
        return r?.length ? { ok: true, msg: `${r.length} 則，最新：${r[0].headline.slice(0, 24)}…` } : { ok: false, msg: '無回應' };
      } },
    { name: '即時報價來源總覽', run: async () => {
        const direct = localStorage.getItem('mis-direct');
        const parts = [`MIS 直連：${direct === 'yes' ? '可用（用你自己的 IP，不受共用限流）' : direct === 'no' ? '不支援（改走共用代理）' : '尚未偵測'}`];
        parts.push(`FinMind token：${finmindToken() ? '已設定' : '未設定'}`);
        parts.push(`Yahoo：${srcDead('yahoo') ? '限流中' : '可用'}`);
        return { ok: true, msg: parts.join('｜') };
      } },
    { name: 'FinMind 即時報價（需 token）', run: async () => {
        if (!finmindToken()) return { ok: false, msg: '未設定 token —— 這是唯一額度不與他人共用的來源，建議設定' };
        const m = await fetchFinMindQuotes(['2330'], 1);
        const q = m['2330'];
        return q ? { ok: true, msg: `台積電 ${q.price}｜${q.time || '--'}｜量 ${q.cumVol}` }
                 : { ok: false, msg: 'token 無效、額度用盡或今日尚無成交' };
      } },
    { name: 'MIS 原始回應（除錯用）', run: async () => {
        const url = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp'
          + `?ex_ch=${encodeURIComponent('tse_2330.tw')}&json=1&delay=0&_=${Date.now()}`;
        let via = '直連';
        let j = await misDirectFetch(url, 6000).catch(() => null);
        if (!j) { via = '代理'; j = await proxyFetch(url, 8000).catch(() => null); }
        if (!j) return { ok: false, msg: '直連與代理皆無回應 —— 代理本身或 MIS 端點不可達' };
        const n = j.msgArray?.length ?? 0;
        const m = j.msgArray?.[0];
        return { ok: n > 0, msg: `經${via}｜rtcode=${j.rtcode ?? '--'}｜rtmessage=${j.rtmessage ?? '--'}｜筆數 ${n}`
          + (m ? `｜成交 ${m.z ?? '-'} 開 ${m.o ?? '-'} 昨收 ${m.y ?? '-'} 漲停 ${m.u ?? '-'} 時間 ${m.t ?? '-'} 日期 ${m.d ?? '-'}`
               : '｜msgArray 為空（多半是 session 或來源限制）') };
      } },
    { name: '即時大盤指數 (MIS t00)', run: async () => {
        const idx = await fetchRealtimeIndex();
        const t = idx?.t00;
        return t?.price ? { ok: true, msg: `加權 ${t.price.toLocaleString()}（${t.chgPct >= 0 ? '+' : ''}${t.chgPct}%）｜${t.time || '--'}`
          + (idx.o00 ? `｜櫃買 ${idx.o00.price}` : '') }
          : { ok: false, msg: '無回應（大盤將沿用日線收盤值）' };
      } },
    { name: '即時報價 (MIS 批次)', run: async () => {
        const ids = allStocks.slice(0, 5).map(s => s.id);
        const m = await fetchRealtimeBatch(ids.length ? ids : ['2330', '2317']);
        const n = Object.keys(m).length;
        if (!n) return { ok: false, msg: '無回應 —— 盤中價格將退回日 K 快取（最舊可達 10 分鐘前）' };
        const one = Object.values(m)[0];
        const today = twClock().date;
        const qd = one.date ? `${one.date.slice(0,4)}-${one.date.slice(4,6)}-${one.date.slice(6,8)}` : '--';
        return { ok: true, msg: `${n} 檔｜${one.name || ''} ${one.price}｜報價時間 ${one.time || '--'}｜資料日 ${qd}` +
          (qd !== today ? '（非今日，休市或尚未開盤）' : '') };
      } },
    { name: '隔夜訊號 (台積電ADR/EWT)', run: async () => {
        const day = await fetchTWDayAll().catch(() => null);
        const o = await fetchOvernightSignals(day?.['2330']?.close ?? null);
        if (!o?.adr) return { ok: false, msg: 'ADR 無回應（Yahoo 與 Stooq 皆失敗，隔夜訊號將略過）' };
        return { ok: true, msg: `ADR ${o.adr.price}（${o.adr.chg1 >= 0 ? '+' : ''}${o.adr.chg1}%）` +
          (o.premium != null ? `｜溢價 ${o.premium >= 0 ? '+' : ''}${o.premium}%` : '｜溢價無法計算（缺匯率或 2330 收盤）') +
          (o.ewt ? `｜EWT ${o.ewt.chg1 >= 0 ? '+' : ''}${o.ewt.chg1}%` : '') };
      } },
    { name: '櫃買日線備援 (tradingStock)', run: async () => {
        // 5483 中美晶為上櫃指標股 — 此項失敗代表上櫃自選股在 Yahoo 限流時會掃不出來
        const b = await fetchTPExHistory('5483', 2);
        return b?.length ? { ok: true, msg: `${b.length} 根日 K，最新收盤 ${b[b.length-1].close}` }
                         : { ok: false, msg: '無資料（上櫃股將只剩 Yahoo 來源）' };
      } },
  ];
  // 先清除熔斷與記憶體快取，否則測到的是「先前失敗的紀錄」而非資料源真實狀態
  try {
    localStorage.removeItem('src-dead');
    localStorage.removeItem('proxy-fail');
    Object.keys(localStorage).filter(k => k.startsWith('cache:')).forEach(k => localStorage.removeItem(k));
  } catch {}
  resetSourceState();

  el.innerHTML = '<div style="margin:10px 0;padding:12px;background:rgba(255,255,255,0.02);border-radius:8px;font-size:0.82rem;color:var(--text3)">🩺 診斷中（已清除快取與熔斷狀態，測試真實連線）...</div>';
  const results = [];
  for (const t of tests) {
    let res;
    try { res = await t.run(); } catch (e) { res = { ok: false, msg: '例外：' + (e?.message || e) }; }
    results.push({ name: t.name, ...res });
    el.innerHTML = `<div style="margin:10px 0;padding:12px;background:rgba(255,255,255,0.02);border-radius:8px">
      ${results.map(r => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.82rem">
        <span>${r.ok ? '✅' : '❌'}</span>
        <span style="color:var(--text2);min-width:200px">${r.name}</span>
        <span style="color:${r.ok ? 'var(--bull)' : 'var(--bear)'}">${r.msg}</span>
      </div>`).join('')}
      ${results.length < tests.length ? '<div style="font-size:0.78rem;color:var(--text3);margin-top:6px">測試中...</div>' : ''}
    </div>`;
  }
  const okN = results.filter(r => r.ok).length;
  el.innerHTML += `<div style="font-size:0.82rem;color:${okN === tests.length ? 'var(--bull)' : okN >= 3 ? 'var(--yellow)' : 'var(--bear)'};padding:0 12px 12px">
    ${okN}/${tests.length} 項正常。${okN === tests.length ? '所有資料源運作正常。' : okN >= 3 ? '主要資料源正常，部分來源暫時異常（通常稍後自動恢復）。' : '多數資料源異常 — 請確認網路，或稍後再試（免費資料源偶有維護）。'}
  </div>`;
}


// ── 額外官方資料集：載入、顯示、（有限度地）代入分析 ──────────────────────
// 設計原則：全部抓進來並顯示，但只有意義明確的欄位進評分。
// 未列於 OAPI_SIGNALS 的欄位一律標為「僅供參考，未納入評分」——
// 對不確定含義的數字給權重，只會產生看似精密的錯誤結論。
const OAPI_SIGNALS = [
  { path: /TWT93U/, field: /借券賣出.*餘額|融券.*借券/, label: '借券賣出餘額',
    dir: (v, s) => { const vol = s.analysis?.volMA ? s.analysis.volMA / 1000 : 0;
      if (!vol) return 0; const r = v / 1000 / vol; return r >= 1 ? -1 : r <= 0.2 ? 0 : 0; },
    note: v => `借券賣出餘額 ${Math.round(v / 1000).toLocaleString()} 張（空方潛在賣壓）`, w: 0.6 },
  { path: /t187ap45_L/, field: /現金股利|股利.*合計/, label: '股利分派',
    dir: () => 0, note: v => `現金股利 ${v} 元（僅供參考，殖利率已由估值資料計入）`, w: 0 },
];

function oapiFieldSignal(path, key, val, s) {
  const num = parseFloat(String(val ?? '').replace(/,/g, ''));
  if (!isFinite(num)) return null;
  for (const sig of OAPI_SIGNALS) {
    if (!sig.path.test(path) || !sig.field.test(key)) continue;
    return { label: sig.label, dir: sig.dir(num, s), w: sig.w, txt: sig.note(num) };
  }
  return null;
}

// 掃描時載入所有已啟用的資料集，索引到個股上
async function loadEnabledDatasets() {
  const paths = getEnabledDatasets();
  if (!paths.length) return;
  const results = await Promise.all(paths.map(p =>
    fetchOpenApiDataset(p).then(d => ({ p, d })).catch(() => ({ p, d: null }))));
  for (const s of allStocks) s._oapi = {};
  for (const { p, d } of results) {
    if (!d?.perStock || !d.map) continue;
    for (const s of allStocks) { const row = d.map[s.id]; if (row) s._oapi[p] = row; }
  }
}

// 個股頁：完整呈現所有額外官方資料（每個欄位都列出，不做取捨）
function renderExtraData(s) {
  const el = document.getElementById('extra-data-body');
  if (!el) return;
  const sets = s?._oapi ? Object.entries(s._oapi) : [];
  if (!sets.length) {
    el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">尚未啟用額外資料集。到「設定 → 證交所 OpenAPI 目錄」勾選要納入的端點，下輪掃描即會帶入。</p>';
    return;
  }
  el.innerHTML = sets.map(([path, row]) => {
    const rows = Object.entries(row)
      .filter(([k]) => !/公司代號|證券代號|股票代號|Code$/i.test(k))
      .map(([k, v]) => {
        const sig = oapiFieldSignal(path, k, v, s);
        const scored = sig && sig.w > 0 && sig.dir !== 0;
        return `<div style="display:flex;gap:8px;padding:3px 0;border-bottom:1px solid var(--border);font-size:0.75rem">
          <span style="color:var(--text3);min-width:44%">${k}</span>
          <span style="font-family:var(--mono);color:var(--text1)">${v ?? '--'}</span>
          ${scored ? `<span style="margin-left:auto;font-size:0.64rem;color:${sig.dir > 0 ? 'var(--bull)' : 'var(--bear)'}">已納入評分</span>`
                   : `<span style="margin-left:auto;font-size:0.64rem;color:var(--text3)">僅供參考</span>`}
        </div>`;
      }).join('');
    return `<div style="margin-bottom:12px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:4px">${path}</div>
      ${rows || '<span style="font-size:0.75rem;color:var(--text3)">此資料集無其他欄位</span>'}
    </div>`;
  }).join('') +
  '<div style="font-size:0.66rem;color:var(--text3);margin-top:6px">標示「僅供參考」者未進評分 —— 欄位含義與合理區間未經驗證，強行加權只會產生看似精密的錯誤結論。</div>';
}

// 目錄頁的啟用/停用切換
function toggleDataset(path) {
  const list = getEnabledDatasets();
  const i = list.indexOf(path);
  if (i >= 0) { list.splice(i, 1); showToast(`已移除 ${path}`, 'info'); }
  else {
    if (list.length >= 12) { showToast('最多同時啟用 12 個資料集（避免請求量與儲存空間爆量）', 'error'); return; }
    list.push(path); showToast(`已加入 ${path} — 下輪掃描開始帶入`, 'success');
  }
  setEnabledDatasets(list);
  renderApiCatalog();
}

// ── FinMind 資料目錄：驗證 token、探測每個資料集、選擇納入 ──────────────────
async function renderFinmindCatalog() {
  const el = document.getElementById('finmind-catalog-body');
  if (!el) return;
  if (!finmindToken()) {
    el.innerHTML = '<div style="padding:10px 12px;font-size:0.8rem;color:var(--yellow)">尚未設定 token —— 請先在上方欄位貼上，再按此按鈕。</div>';
    return;
  }
  el.innerHTML = '<div class="adv-loading">檢查 token 與額度中...</div>';
  const info = await finmindUserInfo();
  if (!info.ok) {
    el.innerHTML = `<div style="padding:10px 12px;border-radius:8px;background:rgba(239,68,68,0.08);border-left:3px solid var(--bear);font-size:0.8rem">
      <b>token 檢查未通過：${info.reason}</b><br>
      <span style="color:var(--text3);font-size:0.74rem">常見原因：token 貼錯或含空白、尚未至 finmindtrade.com 完成註冊、或該網域被你的網路環境阻擋。</span></div>`;
    return;
  }

  el.innerHTML = `<div style="padding:10px 12px;border-radius:8px;background:rgba(34,197,94,0.08);border-left:3px solid var(--bull);font-size:0.8rem;margin-bottom:10px">
      ✅ token 有效${info.level != null ? `｜方案 ${info.level}` : ''}${info.limit != null ? `｜額度 ${info.used ?? '?'} / ${info.limit}` : ''}
    </div><div class="adv-loading">逐一探測資料集（共 ${FINMIND_DATASETS.length} 項）...</div>`;

  const enabled = new Set(getFinmindEnabled());
  const results = [];
  for (const d of FINMIND_DATASETS) {
    const r = await finmindProbe(d.id, d.perStock ? '2330' : '');
    results.push({ ...d, ...r });
    const prog = el.querySelector?.('.adv-loading');   // 使用者切換頁面時元素可能已不存在
    if (prog) prog.textContent = `逐一探測資料集... ${results.length}/${FINMIND_DATASETS.length}`;
  }
  const okN = results.filter(r => r.ok).length;

  el.innerHTML = `<div style="padding:10px 12px;border-radius:8px;background:rgba(34,197,94,0.08);border-left:3px solid var(--bull);font-size:0.8rem;margin-bottom:10px">
      ✅ token 有效${info.level != null ? `｜方案 ${info.level}` : ''}${info.limit != null ? `｜額度 ${info.used ?? '?'} / ${info.limit}` : ''}
      ｜可用資料集 <b>${okN}/${results.length}</b>
    </div>
    ${results.map(r => `
      <div style="padding:7px 10px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:flex-start;font-size:0.76rem">
        <span>${r.ok ? '✅' : '❌'}</span>
        <div style="flex:1;min-width:0">
          <span style="font-weight:600">${r.label}</span>
          <span style="font-family:var(--mono);color:var(--text3);font-size:0.7rem"> ${r.id}</span>
          <br><span style="color:${r.ok ? 'var(--text3)' : 'var(--bear)'};font-size:0.72rem">${r.msg}</span>
          ${r.ok && r.fields ? `<br><span style="color:var(--text3);font-size:0.66rem">欄位：${r.fields.slice(0, 8).join('、')}${r.fields.length > 8 ? '…' : ''}</span>` : ''}
        </div>
        ${r.ok && r.perStock ? `<button class="btn-ghost" style="padding:2px 10px;font-size:0.66rem;white-space:nowrap;${enabled.has(r.id) ? 'color:var(--bull);border-color:var(--bull)' : ''}"
          onclick="toggleFinmindDataset('${r.id}')">${enabled.has(r.id) ? '✓ 已納入' : '＋ 納入'}</button>` : ''}
      </div>`).join('')}
    <div style="font-size:0.68rem;color:var(--text3);margin-top:8px">
      納入的資料集會在下輪掃描為重點標的抓取並顯示於個股頁「額外官方資料」。
      每個資料集每檔各一個請求，故最多同時啟用 8 個、每輪取前 10 檔。
    </div>`;
}

function toggleFinmindDataset(id) {
  const list = getFinmindEnabled();
  const i = list.indexOf(id);
  if (i >= 0) { list.splice(i, 1); showToast(`已移除 ${id}`, 'info'); }
  else {
    if (list.length >= 8) { showToast('最多同時啟用 8 個 FinMind 資料集（每檔各一請求，避免額度用盡）', 'error'); return; }
    list.push(id); showToast(`已加入 ${id} — 下輪掃描開始帶入`, 'success');
  }
  setFinmindEnabled(list);
  renderFinmindCatalog();
}

// ── 證交所 OpenAPI 目錄 ─────────────────────────────────────────────────────
// 讀官方 swagger.json：驗證我們用的端點是否還在（官方改版會靜默失效），
// 並列出所有可用但尚未接的資料，讓「還能拿什麼」變成可自助查詢，而非我猜。
async function renderApiCatalog() {
  const el = document.getElementById('api-catalog-body');
  if (!el) return;
  el.innerHTML = '<div class="adv-loading">讀取 openapi.twse.com.tw/v1/swagger.json ...</div>';
  const list = await fetchTWSESwagger().catch(() => null);
  if (!list?.length) {
    el.innerHTML = '<div style="padding:10px 12px;font-size:0.8rem;color:var(--bear)">無法讀取 swagger.json — '
      + '可能是代理無回應或官方端點異動。目前使用中的端點仍會照常運作（各自有備援與舊資料保護）。</div>';
    return;
  }
  const used = new Set(USED_OPENAPI);
  const enabled = new Set(getEnabledDatasets());
  const inSpec = new Set(list.map(x => x.path));
  const missing = USED_OPENAPI.filter(p => !inSpec.has(p));
  const unused = list.filter(x => !used.has(x.path));

  // 依 tag 分組（沒有 tag 就用路徑第二段）
  const groups = {};
  for (const x of unused) {
    const g = x.tags?.[0] || x.path.split('/')[2] || '其他';
    (groups[g] = groups[g] || []).push(x);
  }
  const order = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  el.innerHTML = `
    <div style="padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:10px;font-size:0.82rem">
      官方目錄共 <b>${list.length}</b> 個端點｜內建已使用 <b>${USED_OPENAPI.length}</b> 個｜額外啟用 <b>${enabled.size}</b> 個｜尚未使用 <b>${unused.length}</b> 個
      <br><span style="font-size:0.72rem;color:var(--text3)">按「＋ 納入」即會在下輪掃描抓取並顯示於個股頁；意義明確的欄位會進評分，其餘標為僅供參考</span>
    </div>
    ${missing.length
      ? `<div style="padding:10px 12px;border-radius:8px;background:rgba(239,68,68,0.08);border-left:3px solid var(--bear);margin-bottom:10px;font-size:0.8rem">
          ⚠ 使用中但目錄查無的端點（官方可能已改版，這些資料會靜默失效）：<br>
          <span style="font-family:var(--mono);font-size:0.74rem">${missing.join('<br>')}</span>
        </div>`
      : `<div style="padding:8px 12px;border-radius:8px;background:rgba(34,197,94,0.08);border-left:3px solid var(--bull);margin-bottom:10px;font-size:0.8rem">
          ✅ 使用中的 ${USED_OPENAPI.length} 個端點皆存在於官方目錄</div>`}
    <input type="text" id="api-catalog-filter" placeholder="篩選端點或說明關鍵字…"
      style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;color:var(--text1);font-size:0.82rem;margin-bottom:10px"
      oninput="filterApiCatalog(this.value)" />
    <div id="api-catalog-list">
      ${order.map(([g, items]) => `
        <div class="api-group" style="margin-bottom:10px">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:4px">${g}（${items.length}）</div>
          ${items.map(x => `
            <div class="api-item" data-k="${(x.path + ' ' + (x.summary || '')).toLowerCase()}"
                 style="padding:5px 10px;border-bottom:1px solid var(--border);font-size:0.76rem;display:flex;gap:8px;align-items:flex-start">
              <div style="flex:1;min-width:0">
                <span style="font-family:var(--mono);color:var(--blue)">${x.path}</span>
                ${x.summary ? `<br><span style="color:var(--text3)">${x.summary}</span>` : ''}
              </div>
              <button class="btn-ghost" style="padding:2px 10px;font-size:0.66rem;white-space:nowrap;${enabled.has(x.path) ? 'color:var(--bull);border-color:var(--bull)' : ''}"
                onclick="toggleDataset('${x.path}')">${enabled.has(x.path) ? '✓ 已納入' : '＋ 納入'}</button>
            </div>`).join('')}
        </div>`).join('')}
    </div>
    <div style="font-size:0.7rem;color:var(--text3);margin-top:8px">
      這份目錄全為盤後開放資料 —— 沒有即時報價與五檔掛單（那只有 MIS 有）。
      看到想接的資料，把端點路徑給我即可。
    </div>`;
}

function filterApiCatalog(q) {
  const k = String(q || '').trim().toLowerCase();
  document.querySelectorAll('#api-catalog-list .api-item').forEach(el => {
    el.style.display = !k || el.dataset.k.includes(k) ? '' : 'none';
  });
  document.querySelectorAll('#api-catalog-list .api-group').forEach(g => {
    const any = [...g.querySelectorAll('.api-item')].some(i => i.style.display !== 'none');
    g.style.display = any ? '' : 'none';
  });
}

// ── Custom Stock List ──────────────────────────────────────────────────────

function getStockList() {
  const saved = localStorage.getItem('custom-stocks');
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return DEFAULT_STOCKS;
}

function addCustomStock() {
  const input = document.getElementById('add-stock-input');
  const id = input.value.trim();
  if (!id) return;
  const list = getStockList();
  if (list.find(s => s.id === id)) { showToast('股票已在清單中', 'info'); input.value = ''; return; }
  list.push({ id, name: id, sector: '自訂' });
  localStorage.setItem('custom-stocks', JSON.stringify(list));
  renderCustomStocksList();
  input.value = '';
  showToast(`已新增 ${id}`, 'success');
}

function removeCustomStock(id) {
  const list = getStockList().filter(s => s.id !== id);
  localStorage.setItem('custom-stocks', JSON.stringify(list));
  renderCustomStocksList();
}

function resetCustomStocks() {
  localStorage.removeItem('custom-stocks');
  renderCustomStocksList();
  showToast('已重置為預設清單', 'success');
}

function clearAllStocks() {
  localStorage.setItem('custom-stocks', JSON.stringify([]));
  renderCustomStocksList();
}

function renderCustomStocksList() {
  const list = getStockList();
  const el = document.getElementById('custom-stocks-list');
  const cnt = document.getElementById('stocks-count');
  if (!el) return;
  el.innerHTML = list.map(s => `
    <div class="pair-tag">
      ${s.id} ${s.name !== s.id ? '·'+s.name : ''}
      <button onclick="removeCustomStock('${s.id}')" title="移除">×</button>
    </div>`).join('');
  if (cnt) cnt.textContent = `共 ${list.length} 檔`;
}

// ── AI 訊號自動紙上追蹤 ─────────────────────────────────────────────────────
// 每個推薦交易自動建檔追蹤到停損/停利，不用手動操作 —
// 讓系統累積「自己的訊號實際表現」與止損原因，回饋教訓學習。
// ── 當日訊號流水帳 ─────────────────────────────────────────────────────────
// 目的：系統每天到底叫了什麼、幾點叫的，事後要能一條一條對。
// 沒有這份紀錄，訊號散在 Telegram、推薦頁、大戶偵測各處，回頭檢討時無從還原。
const SIGLOG_KINDS = {
  entry:    { icon: '🎯', label: '進場訊號', color: 'var(--bull)' },
  exit:     { icon: '🚪', label: '出場訊號', color: 'var(--bear)' },
  whale:    { icon: '🐋', label: '大戶動向', color: 'var(--blue)' },
  flip:     { icon: '🔄', label: '研判翻轉', color: 'var(--yellow)' },
  brief:    { icon: '📰', label: '定時簡報', color: 'var(--text2)' },
  alert:    { icon: '⚠️', label: '風險警示', color: 'var(--bear)' },
  telegram: { icon: '✉️', label: 'Telegram', color: 'var(--text2)' },
};

function getSignalLog() {
  try { return JSON.parse(localStorage.getItem('signal-log') || '[]'); } catch { return []; }
}
function saveSignalLog(list) {
  try { localStorage.setItem('signal-log', JSON.stringify(list.slice(-400))); } catch {}
}

// dedupKey 相同者當天只記一次（避免每 15 秒即時刷新重覆寫入同一則訊號）
function logSignal(kind, title, detail = '', opts = {}) {
  const t = twClock();
  const time = `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
  const key = opts.dedupKey ? `${t.date}|${kind}|${opts.dedupKey}` : null;
  const list = getSignalLog();
  if (key && list.some(x => x.key === key)) return false;
  list.push({ date: t.date, time, kind, title, detail, key,
              id: opts.id || null, dir: opts.dir ?? 0 });
  saveSignalLog(list);
  if (document.getElementById('signal-log-body')) renderSignalLog();
  return true;
}

function todaySignalLog() {
  const d = twClock().date;
  return getSignalLog().filter(x => x.date === d);
}

function clearSignalLog() {
  const d = twClock().date;
  saveSignalLog(getSignalLog().filter(x => x.date !== d));
  renderSignalLog();
  showToast('已清空今日訊號流水帳', 'success');
}

function renderSignalLog() {
  const el = document.getElementById('signal-log-body');
  if (!el) return;
  const rows = todaySignalLog();
  if (!rows.length) {
    // 沒有紀錄要說清楚是「今天還沒發訊號」，不是「功能壞了」
    el.innerHTML = '<div style="font-size:0.78rem;color:var(--text3)">今日尚無訊號紀錄 — 系統只在偵測到符合條件的事件時才寫入，空白代表今天還沒有訊號。</div>';
    return;
  }
  const cnt = {};
  for (const r of rows) cnt[r.kind] = (cnt[r.kind] || 0) + 1;
  const chips = Object.entries(cnt).map(([k, n]) => {
    const m = SIGLOG_KINDS[k] || { icon: '•', label: k, color: 'var(--text2)' };
    return `<span style="display:inline-block;margin:0 6px 4px 0;padding:2px 9px;border-radius:9px;font-size:0.7rem;background:${m.color}1a;color:${m.color}">${m.icon} ${m.label} ${n}</span>`;
  }).join('');

  el.innerHTML = `
    <div style="margin-bottom:8px">${chips}</div>
    <div style="max-height:320px;overflow-y:auto">
      ${rows.slice().reverse().map(r => {
        const m = SIGLOG_KINDS[r.kind] || { icon: '•', color: 'var(--text2)' };
        const c = r.dir > 0 ? 'var(--bull)' : r.dir < 0 ? 'var(--bear)' : m.color;
        return `<div style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="font-family:var(--mono);font-size:0.72rem;color:var(--text3);flex:0 0 38px">${r.time}</span>
          <span style="flex:0 0 18px">${m.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:0.79rem;color:${c};font-weight:600">${r.title}</div>
            ${r.detail ? `<div style="font-size:0.72rem;color:var(--text3);line-height:1.55">${r.detail}</div>` : ''}
          </div>
          ${r.id ? `<button class="btn-ghost" style="padding:1px 8px;font-size:0.68rem;align-self:center" onclick="openStock('${r.id}')">查看</button>` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

function getAiSignals() {
  try { return JSON.parse(localStorage.getItem('ai-signals') || '[]'); } catch { return []; }
}
function saveAiSignals(list) { localStorage.setItem('ai-signals', JSON.stringify(list.slice(-300))); }

function recordAiSignals() {
  const picks = computeEntrySignals();
  if (!picks.length) return;
  const list = getAiSignals();
  const today = new Date().toISOString().slice(0, 10);
  let added = 0;
  for (const { s, m, p } of picks) {
    // 同檔已有追蹤中訊號、或今天已建檔 → 不重複
    if (list.some(x => x.id === s.id && (x.status === 'open' || x.date === today))) continue;
    list.push({
      id: s.id, name: s.name, date: today,
      entry: p.lo, hi: p.hi, stop: p.stop, t1: p.t1, holdOn: !!p.holdOn,
      status: 'open',
      ctx: {
        score: s.analysis.score, rsi: s.analysis.rsi != null ? +s.analysis.rsi.toFixed(1) : null,
        agr: +m.agr.toFixed(2), pctile: s.analysis.pctile?.zone ?? null,
        mktNorm: Math.round(outlookData.norm ?? 0),
        sector: getStockList().find(x => x.id === s.id)?.sector ?? null,
        // 進場條件學習用：ADX/乖離/趨勢階段/成熟度 — 讓實績回饋能評估「進場邏輯」本身
        adx: s.analysis.adx != null ? +s.analysis.adx.toFixed(1) : null,
        ext20: s.analysis.ema20 ? +((s.analysis.price / s.analysis.ema20 - 1) * 100).toFixed(1) : null,
        trend: s.analysis.trend?.phase ?? null,
        maturity: s.analysis.trend?.maturity ?? null,
      },
    });
    added++;
    logSignal('entry', `${s.name}（${s.id}）符合進場條件`,
      `建議區 ${p.lo}~${p.hi}｜停損 ${p.stop}｜${p.t1 ? `目標 ${p.t1}` : '無壓力續抱'}｜研判 ${m.stance}`,
      { id: s.id, dir: 1, dedupKey: s.id });
  }
  if (added) saveAiSignals(list);
}

// 用後續 K 棒結算追蹤中的訊號（保守規則：同日觸及停損與停利判停損）
function updateAiSignals() {
  const list = getAiSignals();
  let changed = false;
  for (const t of list) {
    if (t.status !== 'open') continue;
    const s = allStocks.find(x => x.id === t.id);
    if (!s?.ohlcv?.length) continue;
    // 除息還原：缺口累計 cum，停損/目標隨之平移，報酬含息 — 除息跳空不是虧損
    let cum = 0, seen = 0;
    for (let i = 0; i < s.ohlcv.length; i++) {
      const b = s.ohlcv[i];
      if (!(b.time > t.date)) continue;
      seen++;
      if (b.exDiv && i > 0) cum += b.divAmt != null ? b.divAmt : Math.max(0, s.ohlcv[i - 1].close - b.open);
      const stopAdj = t.stop - cum, t1Adj = t.t1 != null ? t.t1 - cum : null;
      // MAE/MFE：持有期間最大不利/有利波動（含息）— 風控學習的原料。
      // 贏單的 MAE 分佈回答「停損到底該設多遠」，比任何理論值都誠實。
      const maeP = +(((b.low + cum) - t.entry) / t.entry * 100).toFixed(2);
      const mfeP = +(((b.high + cum) - t.entry) / t.entry * 100).toFixed(2);
      if (t.maePct == null || maeP < t.maePct) { t.maePct = maeP; changed = true; }
      if (t.mfePct == null || mfeP > t.mfePct) { t.mfePct = mfeP; changed = true; }
      if (b.low <= stopAdj) {
        Object.assign(t, { status: 'loss', exitDate: b.time, exitPrice: +stopAdj.toFixed(2),
          retPct: +((stopAdj + cum - t.entry) / t.entry * 100).toFixed(2), exitReason: '跌破停損' });
        changed = true; break;
      }
      if (!t.holdOn && t1Adj != null && b.high >= t1Adj) {
        Object.assign(t, { status: 'win', exitDate: b.time, exitPrice: +t1Adj.toFixed(2),
          retPct: +((t1Adj + cum - t.entry) / t.entry * 100).toFixed(2), exitReason: '達目標停利' });
        changed = true; break;
      }
      if (seen >= 20) {
        const ret = +((b.close + cum - t.entry) / t.entry * 100).toFixed(2);
        Object.assign(t, { status: ret >= 0 ? 'win' : 'loss', exitDate: b.time,
          exitPrice: b.close, retPct: ret, exitReason: '20 日到期結算' });
        changed = true; break;
      }
    }
  }
  if (changed) saveAiSignals(list);
}

function renderAiSignals() {
  const el = document.getElementById('ai-signals-body');
  if (!el) return;
  const list = getAiSignals();
  const done = list.filter(t => t.status !== 'open');
  const open = list.filter(t => t.status === 'open');
  if (!list.length) {
    el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">尚無訊號記錄。推薦交易出現時會自動建檔追蹤，無需手動操作。</p>';
    return;
  }
  const wins = done.filter(t => t.status === 'win');
  const reasons = {};
  done.filter(t => t.status === 'loss').forEach(t => { reasons[t.exitReason] = (reasons[t.exitReason] || 0) + 1; });
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">
      <div class="inst-card"><div class="inst-card-lbl">追蹤中</div><div class="inst-card-val" style="color:var(--blue)">${open.length}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">已結算</div><div class="inst-card-val">${done.length}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">訊號勝率</div><div class="inst-card-val" style="color:${done.length && wins.length / done.length >= 0.5 ? 'var(--bull)' : done.length ? 'var(--bear)' : 'var(--text3)'}">${done.length ? (wins.length / done.length * 100).toFixed(0) + '%' : '--'}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">平均報酬</div><div class="inst-card-val">${done.length ? (done.reduce((n, t) => n + (t.retPct || 0), 0) / done.length).toFixed(2) + '%' : '--'}</div></div>
    </div>
    ${Object.keys(reasons).length ? `<div style="font-size:0.78rem;color:var(--text2);margin-bottom:8px">
      虧損原因分佈：${Object.entries(reasons).map(([r, n]) => `${r} ×${n}`).join('、')}</div>` : ''}
    ${done.slice(-5).reverse().map(t => `
      <div style="display:flex;align-items:center;gap:8px;font-size:0.76rem;padding:5px 0;border-bottom:1px solid var(--border)">
        <span style="cursor:pointer" onclick="openStock('${t.id}')">${t.name}</span>
        <span style="color:var(--text3);font-size:0.68rem">${t.date} → ${t.exitDate}</span>
        <span style="color:var(--text3);font-size:0.68rem">${t.exitReason}</span>
        <span style="margin-left:auto;font-family:var(--mono);font-weight:700;color:${t.retPct >= 0 ? 'var(--bull)' : 'var(--bear)'}">${t.retPct >= 0 ? '+' : ''}${t.retPct}%</span>
      </div>`).join('')}
    ${(() => {
      const rules = signalPerfStats();
      return rules.length
        ? `<div style="margin-top:9px;padding:8px 11px;border-radius:8px;background:rgba(0,212,255,0.05);border-left:3px solid var(--blue)">
            <div style="font-size:0.72rem;font-weight:700;color:var(--blue)">🔁 實績回饋規則（已自動生效 — 進場邏輯持續學習中）</div>
            <div style="font-size:0.73rem;color:var(--text2);margin-top:3px;line-height:1.7">${rules.map(r => r.kind === 'bad'
              ? `・🔻「${r.label}」實測勝率僅 ${r.winRate}%（n=${r.n}）→ 同情境推薦自動扣分`
              : `・🔺「${r.label}」實測勝率 ${r.winRate}%（n=${r.n}）→ 同情境推薦自動加分`).join('<br>')}</div>
          </div>`
        : done.length
          ? `<div style="font-size:0.68rem;color:var(--text3);margin-top:8px">實績回饋：追蹤 10 種進場情境（RSI/位階/一致性/大盤/ADX/乖離/趨勢階段/成熟度），樣本滿 8 筆後勝率 &lt;40% 自動扣分、≥60% 自動加分（目前樣本累積中）</div>`
          : '';
    })()}`;
}

// ── 技術訊號歷史回測 ────────────────────────────────────────────────────────
// 把進場規則的「技術核心」套回每檔手上的 14 個月日 K，驗證條件過去是否有優勢。
// 誠實限制：法人買賣超/營收等歷史快照拿不到，所以只回測技術面條件 —
// 實際系統還疊了籌碼與基本面過濾，實盤表現應優於（至少不同於）此結果。
// 規則鏡射實盤：收盤>EMA20>EMA50、MACD>訊號、RSI 50~70、ADX≥20，
// 次日開盤進場；停損=5日低*0.99（上限 min(8%,3ATR)）；目標 2R；
// 連兩日收破 EMA20 出場；40 日時間停損；除息缺口全程還原。

function btEMA(vals, n) {
  const k = 2 / (n + 1); const out = []; let e = vals[0];
  for (let i = 0; i < vals.length; i++) { e = i ? vals[i] * k + e * (1 - k) : vals[i]; out.push(e); }
  return out;
}
function btRSI(closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  let ag = 0, al = 0; // Wilder 平滑的平均漲/跌幅
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { ag += up / n; al += dn / n; if (i === n) out[i] = 100 - 100 / (1 + ag / (al || 1e-9)); continue; }
    ag = (ag * (n - 1) + up) / n; al = (al * (n - 1) + dn) / n;
    out[i] = 100 - 100 / (1 + ag / (al || 1e-9));
  }
  return out;
}
function btMACD(closes) {
  const e12 = btEMA(closes, 12), e26 = btEMA(closes, 26);
  const macd = closes.map((_, i) => e12[i] - e26[i]);
  const sig = btEMA(macd, 9);
  return { macd, sig };
}
function btATR(highs, lows, closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  let a = null;
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    a = a == null ? tr : (a * (n - 1) + tr) / n;
    if (i >= n) out[i] = a;
  }
  return out;
}
function btADX(highs, lows, closes, n = 14) {
  const len = closes.length;
  const out = new Array(len).fill(null);
  let trS = 0, pS = 0, mS = 0, adx = null;
  for (let i = 1; i < len; i++) {
    const up = highs[i] - highs[i - 1], dn = lows[i - 1] - lows[i];
    const pDM = up > dn && up > 0 ? up : 0;
    const mDM = dn > up && dn > 0 ? dn : 0;
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    if (i <= n) { trS += tr; pS += pDM; mS += mDM; if (i < n) continue; }
    else { trS = trS - trS / n + tr; pS = pS - pS / n + pDM; mS = mS - mS / n + mDM; }
    const pDI = 100 * pS / (trS || 1e-9), mDI = 100 * mS / (trS || 1e-9);
    const dx = 100 * Math.abs(pDI - mDI) / ((pDI + mDI) || 1e-9);
    adx = adx == null ? dx : (adx * (n - 1) + dx) / n;
    if (i >= n * 2) out[i] = adx;
  }
  return out;
}

// opts：勝率調整參數
//   rsiMax    — RSI 進場上限（預設 70；調低可避開追高段）
//   extMax    — 收盤相對 EMA20 乖離上限（如 1.05 = 超過 +5% 不追）
//   scaleOut  — 觸及 1R 先出一半並把停損上移到成本（大幅減少「賺過又變虧」）
//   regimeFn  — 大盤濾網：date → 是否允許進場（大盤空頭時不做多）
//   resistTarget — 停利改用真實壓力區（前波高點/樞紐），非固定 2R；
//                  無壓力則不設目標、靠移動出場續抱；壓力距離不足 1R 不進場
//   pullback   — 近 3 根曾回踩 EMA20（貼近成本區買，不在半空中追）
//   volConfirm — 進場訊號日量能不低於 20 日均量（有量才有跟隨）
//   frontRun   — 停利掛在壓力前緣（壓力 ×0.995），壓力下常見的「差一點沒到」轉為成交
//   longTerm   — 長期模式：加要求長期結構（EMA100 之上、EMA50>EMA100），
//                無固定停利、移動出場改用 EMA50、時間停損放寬到 120 日
function backtestStock(s, opts = {}) {
  const bars = s.ohlcv;
  if (!bars || bars.length < 80) return [];
  const rsiMax = opts.rsiMax ?? 70;
  const closes = bars.map(b => b.close), highs = bars.map(b => b.high), lows = bars.map(b => b.low);
  const vols = bars.map(b => b.volume);
  const e20 = btEMA(closes, 20), e50 = btEMA(closes, 50);
  const e100 = opts.longTerm ? btEMA(closes, 100) : null;
  const rsi = btRSI(closes), { macd, sig } = btMACD(closes);
  const adx = btADX(highs, lows, closes), atr = btATR(highs, lows, closes);
  const trailEMA = opts.longTerm ? e50 : e20;
  // 長期組連 3 收破才出場（減少均線附近洗刷出場 → 贏單抱得住，獲利因子提升）
  const trailN = opts.longTerm ? 3 : 2;
  const timeStop = opts.longTerm ? 120 : 40;
  const adxMin = opts.adxMin ?? 20;
  const trades = [];
  let pos = null;
  const startI = opts.longTerm ? 100 : 60;
  for (let i = startI; i < bars.length; i++) {
    const b = bars[i];
    if (pos) {
      if (b.exDiv && i > 0) pos.cum += b.divAmt != null ? b.divAmt : Math.max(0, closes[i - 1] - b.open);
      const stopAdj = pos.stop - pos.cum;
      const tgtAdj = pos.t1 != null ? pos.t1 - pos.cum : null;
      // 1R 分批：先判停損（同日先低後高保守處理），未觸停損且過 1R → 減半、停損上移成本
      let exit = null, why = null;
      if (b.low <= stopAdj) { exit = stopAdj; why = pos.scaled ? 'be' : 'stop'; }
      else {
        if (opts.scaleOut && !pos.scaled && b.high >= pos.entry + pos.risk - pos.cum) {
          pos.scaled = true;
          pos.realized = 0.5;            // 半數部位在 +1R 落袋
          pos.stop = pos.entry + pos.cum; // 剩餘部位保本（cum 之後仍會持續平移）
        }
        if (tgtAdj != null && b.high >= tgtAdj) { exit = tgtAdj; why = 'target'; }
        else if (closes[i] < trailEMA[i]) { pos.below++; if (pos.below >= trailN) { exit = closes[i]; why = 'trail'; } }
        else pos.below = 0;
      }
      if (exit == null && i - pos.i >= timeStop) { exit = closes[i]; why = 'time'; }
      if (exit == null && i === bars.length - 1 && opts.longTerm) { exit = closes[i]; why = 'end'; } // 長期模式：期末結算未平倉部位
      if (exit != null) {
        const restR = (exit + pos.cum - pos.entry) / pos.risk;
        const r = pos.scaled ? pos.realized + 0.5 * restR : restR;
        trades.push({
          id: s.id, name: s.name, entryTime: bars[pos.i].time, exitTime: b.time, why,
          r: +r.toFixed(2),
          retPct: +(r * pos.risk / pos.entry * 100).toFixed(2),
          hold: i - pos.i,
        });
        pos = null;
      }
      continue;
    }
    if (i + 1 >= bars.length) break;
    const c = closes[i];
    if (opts.regimeFn && !opts.regimeFn(b.time)) continue;      // 大盤濾網
    if (!(c > e20[i] && e20[i] > e50[i])) continue;
    if (opts.longTerm && !(e100 && c > e100[i] && e50[i] > e100[i])) continue; // 長期結構
    if (opts.extMax && c > e20[i] * opts.extMax) continue;       // 乖離過大不追
    if (opts.pullback && Math.min(lows[i], lows[i - 1], lows[i - 2]) > e20[i] * 1.015) continue; // 近 3 根未回踩 EMA20 → 半空中不追
    if (opts.volConfirm) {
      const n = Math.min(20, i);
      const avgV = vols.slice(i - n, i).reduce((x, y) => x + y, 0) / n;
      // 回踩日常態量縮，只過濾「明顯量縮」（<0.8 倍均量）的無人問津訊號
      if (avgV > 0 && vols[i] < avgV * 0.8) continue;
    }
    if (!(macd[i] > sig[i])) continue;
    if (!(rsi[i] != null && rsi[i] >= 50 && rsi[i] < rsiMax)) continue;
    if (!(adx[i] != null && adx[i] >= adxMin)) continue;
    const entry = bars[i + 1].open;
    const a = atr[i] || entry * 0.02;
    let stop = Math.min(Math.min(...lows.slice(i - 4, i + 1)) * 0.99, entry - a);
    const maxRisk = Math.min(entry * 0.08, a * 3);
    if (entry - stop > maxRisk) stop = entry - maxRisk;
    if (stop >= entry) continue;
    const risk = entry - stop;
    let t1;
    if (opts.longTerm) {
      t1 = null;                                        // 長期：不設固定停利，跟著趨勢走
    } else if (opts.resistTarget) {
      t1 = btFindResistance(highs, i, entry);           // 最近的真實壓力區
      if (t1 != null && opts.frontRun) t1 = +(t1 * 0.995).toFixed(2); // 掛壓力前緣，提高成交率
      if (t1 != null && t1 - entry < risk) continue;    // 壓力太近（不足 1R）→ 風險報酬不划算，不進場
      // t1 == null：上方無壓力 → 不設固定目標，靠移動出場續抱（鏡射實盤「無壓力就續抱」）
    } else {
      t1 = entry + risk * 2;                            // 基準版：固定 2R
    }
    pos = { i: i + 1, entry, stop, risk, t1, cum: 0, below: 0, scaled: false, realized: 0 };
  }
  return trades;
}

// 當沖回測（日內近似）：無免費分鐘資料，以「訊號隔日開盤買進、收盤前出場」近似，
// 停損 -1.5%（同日觸及先保守判停損）。訊號條件鏡射當沖篩選：前日 1.3 倍量收紅、
// 漲幅 0.5~8%、波動夠、量夠大。
function backtestDayTrade(s, regimeFn) {
  const bars = s.ohlcv;
  if (!bars || bars.length < 40) return [];
  const closes = bars.map(b => b.close), highs = bars.map(b => b.high), lows = bars.map(b => b.low);
  const atr = btATR(highs, lows, closes);
  const trades = [];
  for (let i = 21; i < bars.length - 1; i++) {
    const b = bars[i];
    if (regimeFn && !regimeFn(b.time)) continue;
    const n = Math.min(20, i);
    const avgV = bars.slice(i - n, i).reduce((x, y) => x + y.volume, 0) / n;
    if (!(avgV > 0 && b.volume >= avgV * 1.3 && b.close > b.open)) continue;  // 前日放量收紅
    if (b.volume / 1000 < 5000) continue;                                      // 流動性
    const chg = (b.close - closes[i - 1]) / closes[i - 1] * 100;
    if (chg < 0.5 || chg > 8) continue;
    if (!atr[i] || atr[i] / b.close < 0.018) continue;                         // 波動不夠沖不出價差
    // 強收盤確認：收在當日振幅前 30% 才有隔日跟隨力（收上影長的隔日常開高走低）
    const rng = b.high - b.low;
    if (rng > 0 && (b.close - b.low) / rng < 0.7) continue;
    const d = bars[i + 1];
    if (d.exDiv) continue;                                                     // 除息日不當沖
    const entry = d.open;
    // 跳空窗：開低 >0.5% 代表動能已失，開高 >2% 是隔日沖最大虧損源（開高走低）
    const gap = (entry - b.close) / b.close * 100;
    if (gap < -0.5 || gap > 2) continue;
    const stop = entry * 0.985;                                                // 日內硬停損 -1.5%
    const risk = entry - stop;
    let exit, why;
    if (d.low <= stop) { exit = stop; why = 'stop'; }        // 保守：同日觸停損先判輸
    else { exit = d.close; why = 'eod'; }                    // 收盤前出場
    const r = (exit - entry) / risk;
    trades.push({ id: s.id, name: s.name, entryTime: d.time, exitTime: d.time, why,
      r: +r.toFixed(2), retPct: +((exit - entry) / entry * 100).toFixed(2), hold: 1 });
  }
  return trades;
}

// 進場當下往前找最近的真實壓力區（無前視：只用進場前的資料）
// 依據：前波樞紐高點（左右各 2 根的局部極大值）、前 20 日高、前 60 日高，
// 一律排除最近 3 根（避免把自己當天的高點當壓力），只取高於進場價 1.5% 者。
function btFindResistance(highs, i, entry) {
  const prior = highs.slice(Math.max(0, i - 82), Math.max(0, i - 2)); // 近 80 根、排除最近 3 根
  if (prior.length < 10) return null;
  const cand = [];
  for (let k = 2; k < prior.length - 2; k++) {
    const v = prior[k];
    if (v >= prior[k - 1] && v >= prior[k - 2] && v >= prior[k + 1] && v >= prior[k + 2]) cand.push(v);
  }
  if (prior.length >= 20) cand.push(Math.max(...prior.slice(-20)));
  if (prior.length >= 60) cand.push(Math.max(...prior.slice(-60)));
  const above = cand.filter(v => v > entry * 1.015).sort((a, b) => a - b);
  return above.length ? +above[0].toFixed(2) : null; // 最近的壓力；null = 上方無壓力
}

// 大盤濾網：加權指數收盤 > 其 50 日 EMA 的日期才允許進場
function makeRegimeFn(twiiBars) {
  if (!twiiBars || twiiBars.length < 60) return null;
  const closes = twiiBars.map(b => b.close);
  const e50 = btEMA(closes, 50);
  const dates = twiiBars.map(b => b.time);
  return (date) => {
    // 找最後一根 ≤ date 的大盤 K（日期均為 ISO 字串，可直接比較）
    let lo = 0, hi = dates.length - 1, idx = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (dates[mid] <= date) { idx = mid; lo = mid + 1; } else hi = mid - 1; }
    if (idx < 50) return true; // 資料不足時不擋（誠實：無法判斷就不假裝有濾網）
    return closes[idx] > e50[idx];
  };
}

function summarizeBacktest(trades) {
  if (!trades.length) return { trades: 0 };
  const wins = trades.filter(t => t.r > 0);
  const posR = trades.filter(t => t.r > 0).reduce((x, t) => x + t.r, 0);
  const negR = Math.abs(trades.filter(t => t.r <= 0).reduce((x, t) => x + t.r, 0));
  let maxConsec = 0, cur = 0;
  for (const t of trades) { cur = t.r <= 0 ? cur + 1 : 0; maxConsec = Math.max(maxConsec, cur); }
  const byWhy = {};
  trades.forEach(t => { byWhy[t.why] = (byWhy[t.why] || 0) + 1; });
  const byStock = {};
  trades.forEach(t => { (byStock[t.id] = byStock[t.id] || { name: t.name, rs: [] }).rs.push(t.r); });
  const stockRank = Object.entries(byStock)
    .map(([id, v]) => ({ id, name: v.name, n: v.rs.length, avgR: +(v.rs.reduce((x, y) => x + y, 0) / v.rs.length).toFixed(2) }))
    .filter(x => x.n >= 3)
    .sort((x, y) => y.avgR - x.avgR);
  return {
    trades: trades.length,
    winRate: +(wins.length / trades.length * 100).toFixed(1),
    avgR: +(trades.reduce((x, t) => x + t.r, 0) / trades.length).toFixed(2),
    pf: negR > 0 ? +(posR / negR).toFixed(2) : null,
    maxConsec,
    avgHold: +(trades.reduce((x, t) => x + t.hold, 0) / trades.length).toFixed(1),
    byWhy, best: stockRank.slice(0, 3), worst: stockRank.slice(-3).reverse(),
  };
}

async function runBacktest() {
  const el = document.getElementById('backtest-body');
  if (!el) return;
  const ready = allStocks.filter(s => s.ohlcv?.length >= 80);
  if (ready.length < 5) { el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">歷史資料尚未就緒，請等掃描完成後再執行。</p>'; return; }
  el.innerHTML = '<div class="adv-loading">回測中...</div>';

  // 調整版參數：大盤濾網 + RSI 65 + 乖離過濾 + 回踩確認 + 量能確認 +
  // 1R 減半保本 + 壓力區停利（掛前緣）
  let regimeFn = null;
  try { regimeFn = makeRegimeFn(await fetchTWIIOHLC(14)); } catch {}
  const SWING = { rsiMax: 65, extMax: 1.05, scaleOut: true, regimeFn, resistTarget: true,
                  pullback: true, volConfirm: true, frontRun: true, adxMin: 22 };
  const LONG = { rsiMax: 65, extMax: 1.05, scaleOut: true, regimeFn, longTerm: true, pullback: true };

  const base = [], swing = [], long = [], day = [];
  for (let k = 0; k < ready.length; k++) {
    try {
      base.push(...backtestStock(ready[k]));
      swing.push(...backtestStock(ready[k], SWING));
      long.push(...backtestStock(ready[k], LONG));
      day.push(...backtestDayTrade(ready[k], regimeFn));
    } catch (e) { console.warn(`回測 ${ready[k].id} 失敗:`, e); }
    if (k % 8 === 7) {
      el.innerHTML = `<div class="adv-loading">回測中... ${k + 1}/${ready.length}</div>`;
      await new Promise(r => setTimeout(r, 0)); // 讓出主執行緒，不凍結 UI
    }
  }
  const all = [...long, ...swing, ...day];
  const res = summarizeBacktest(all);
  const sum4 = tr => { const x = summarizeBacktest(tr); return { trades: x.trades || 0, winRate: x.winRate ?? null, avgR: x.avgR ?? null, pf: x.pf ?? null }; };
  const baseRes = summarizeBacktest(base);
  try {
    localStorage.setItem('backtest-result', JSON.stringify({
      at: new Date().toISOString().slice(0, 10), universe: ready.length, hasRegime: !!regimeFn,
      ...res,
      cats: { long: sum4(long), swing: sum4(swing), day: sum4(day) },
      base: { trades: baseRes.trades, winRate: baseRes.winRate, avgR: baseRes.avgR, pf: baseRes.pf, maxConsec: baseRes.maxConsec },
    }));
  } catch {}
  renderBacktest();
}

function renderBacktest() {
  const el = document.getElementById('backtest-body');
  if (!el) return;
  let r;
  try { r = JSON.parse(localStorage.getItem('backtest-result') || 'null'); } catch { r = null; }
  const btn = '<button class="btn-ghost" style="padding:5px 14px;font-size:0.74rem;margin-top:8px" onclick="runBacktest()">🔄 重新回測</button>';
  if (!r) { el.innerHTML = '<button class="btn-primary" style="padding:7px 18px;font-size:0.78rem" onclick="runBacktest()">▶ 執行回測（掃描完成後可用）</button>'; return; }
  if (!r.trades) {
    el.innerHTML = `<p style="font-size:0.8rem;color:var(--text3)">調整版（含大盤濾網、RSI ≤65、乖離 ≤5%）近 14 個月無符合全部條件的進場點 — 濾網偏嚴屬正常，代表這段期間多數進場點品質不佳。${r.base?.trades ? `基準版（無濾網）同期有 ${r.base.trades} 筆、勝率 ${r.base.winRate}%，可對照參考。` : ''}</p>${btn}`;
    return;
  }
  const whyName = { stop: '停損', target: '達壓力區停利', trail: '破均線出場', time: '時間停損', be: '1R 減半後保本出場', eod: '當沖收盤出場', end: '期末結算' };
  const verdict = r.pf == null || r.pf >= 1.5
    ? { t: '✅ 此技術條件過去 14 個月具正期望值優勢', c: 'var(--bull)' }
    : r.pf >= 1.0
      ? { t: '🟡 邊際優勢 — 有賺但不厚，須靠籌碼/基本面過濾提升勝率', c: 'var(--yellow)' }
      : { t: '🔴 此期間無優勢 — 純技術進場在近期市況下不賺錢，訊號僅供參考、倚重其他維度過濾', c: 'var(--bear)' };
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:10px;margin-bottom:10px">
      <div class="inst-card"><div class="inst-card-lbl">交易次數</div><div class="inst-card-val">${r.trades}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">勝率</div><div class="inst-card-val" style="color:${r.winRate >= 50 ? 'var(--bull)' : 'var(--text1)'}">${r.winRate}%</div></div>
      <div class="inst-card"><div class="inst-card-lbl">平均 R</div><div class="inst-card-val" style="color:${r.avgR > 0 ? 'var(--bull)' : 'var(--bear)'}">${r.avgR > 0 ? '+' : ''}${r.avgR}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">獲利因子</div><div class="inst-card-val">${r.pf ?? '∞'}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">最大連虧</div><div class="inst-card-val">${r.maxConsec} 筆</div></div>
      <div class="inst-card"><div class="inst-card-lbl">平均持有</div><div class="inst-card-val">${r.avgHold} 日</div></div>
    </div>
    <div style="padding:9px 12px;border-radius:8px;background:${verdict.c}0d;border-left:3px solid ${verdict.c};font-size:0.78rem;color:${verdict.c};font-weight:600;margin-bottom:8px">${verdict.t}</div>
    ${r.cats ? (() => {
      const row = (icon, label, c) => c && c.trades
        ? `<tr><td style="padding:4px 8px">${icon} ${label}</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${c.trades}</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono);font-weight:700;color:${c.winRate >= 50 ? 'var(--bull)' : 'var(--text1)'}">${c.winRate}%</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono);color:${c.avgR > 0 ? 'var(--bull)' : 'var(--bear)'}">${c.avgR > 0 ? '+' : ''}${c.avgR}</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${c.pf ?? '∞'}</td></tr>`
        : `<tr><td style="padding:4px 8px">${icon} ${label}</td><td colspan="4" style="padding:4px 8px;color:var(--text3)">此期間無符合條件的交易</td></tr>`;
      return `<div style="overflow-x:auto;margin-bottom:8px"><table style="width:100%;border-collapse:collapse;font-size:0.74rem;color:var(--text2)">
        <tr style="color:var(--text3);font-size:0.68rem"><td style="padding:4px 8px">類別</td><td style="padding:4px 8px;text-align:right">筆數</td><td style="padding:4px 8px;text-align:right">勝率</td><td style="padding:4px 8px;text-align:right">平均R</td><td style="padding:4px 8px;text-align:right">獲利因子</td></tr>
        ${row('🏛', '長期持有', r.cats.long)}
        ${row('📈', '短期波段', r.cats.swing)}
        ${row('⚡', '當沖（日內近似）', r.cats.day)}
        <tr style="border-top:1px solid var(--border);font-weight:700"><td style="padding:4px 8px">Σ 總計</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${r.trades}</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono);color:${r.winRate >= 50 ? 'var(--bull)' : 'var(--text1)'}">${r.winRate}%</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono);color:${r.avgR > 0 ? 'var(--bull)' : 'var(--bear)'}">${r.avgR > 0 ? '+' : ''}${r.avgR}</td><td style="padding:4px 8px;text-align:right;font-family:var(--mono)">${r.pf ?? '∞'}</td></tr>
      </table></div>
      <div style="font-size:0.66rem;color:var(--text3);margin-bottom:8px">長期組：EMA100 作長期結構代理（資料僅 14 個月）、回踩進場、連 3 收破 EMA50 才出場。當沖組：日內近似（隔日開盤買、收盤前出場、-1.5% 硬停損），僅取強收盤訊號（收在振幅前 30%）且開盤跳空 -0.5%~+2% 內才進場 — 開高逾 2% 不追（開高走低是隔日沖最大虧損源）。無免費分鐘資料。</div>`;
    })() : ''}
    ${r.base ? `<div style="font-size:0.73rem;color:var(--text3);margin-bottom:8px;padding:7px 11px;border-radius:8px;background:rgba(255,255,255,0.03)">
      對照｜基準版（無濾網、固定 2R）：${r.base.trades} 筆・勝率 ${r.base.winRate}%・平均 R ${r.base.avgR > 0 ? '+' : ''}${r.base.avgR}・獲利因子 ${r.base.pf ?? '∞'}・最大連虧 ${r.base.maxConsec} 筆<br>
      調整版加入：大盤站上 50 日均線才進場${r.hasRegime ? '' : '（本輪大盤資料未到位，此濾網未生效）'}・RSI 上限 65・乖離 EMA20 逾 5% 不追・達 1R 先減半並保本・停利改用真實壓力區（前波高點/樞紐；無壓力則續抱移動出場、壓力不足 1R 不進場）<br>
      <span style="font-size:0.66rem">壓力區依據為價格結構 — 歷史新聞與歷史掛單無免費資料可回測；實盤推薦另有新聞面與盤中五檔掛單判斷</span>
    </div>` : ''}
    <div style="font-size:0.74rem;color:var(--text2);line-height:1.7">
      出場分佈：${Object.entries(r.byWhy).map(([w, n]) => `${whyName[w] || w} ${n} 筆`).join('・')}<br>
      ${r.best?.length ? `此規則最適合：${r.best.map(x => `${x.name}（均 ${x.avgR > 0 ? '+' : ''}${x.avgR}R）`).join('、')}<br>` : ''}
      ${r.worst?.length ? `最不適合：${r.worst.map(x => `${x.name}（均 ${x.avgR > 0 ? '+' : ''}${x.avgR}R）`).join('、')}<br>` : ''}
      <span style="color:var(--text3);font-size:0.7rem">${r.at} 回測｜${r.universe} 檔｜僅回測技術核心（次日開盤進場、除息已還原）；實盤另有籌碼/基本面/大盤過濾，結果會不同</span>
    </div>${btn}`;
}

// ── 週一開盤前情勢簡報 ──────────────────────────────────────────────────────
// 每週一 08:00（台北時間）自動生成：上週收在哪、隔夜與國際情勢、本週有什麼
// 事件與數據、持倉怎麼佈局、有哪些交易機會 —— 並推送 Telegram。
// 全部取自系統既有資料，不新增外部相依；沒有的資料就誠實標明「無」。

function twClock() {
  // 取台北時區的年/月/日/時/分/星期
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' })
    .formatToParts(new Date());
  const g = t => p.find(x => x.type === t)?.value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: +g('hour'), minute: +g('minute'), wd: g('weekday') };
}

// 以「本週一的日期」當識別，確保同一週只推一次
function weekKey() {
  const t = twClock();
  const d = new Date(`${t.date}T00:00:00Z`);
  const dow = d.getUTCDay();                        // 0=Sun
  const back = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

// 本週內的既有行事曆事件（資金流動事件表已涵蓋法說會、除權息、結算、作帳等）
function weekEvents() {
  const out = [];
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 86400000);
  for (const e of getCapitalFlowEvents()) if (e.date >= new Date(now.getTime() - 86400000) && e.date <= end) out.push(e);
  // 每月 10 日前為上市櫃月營收公布期
  const t = twClock();
  const dom = +t.date.slice(8, 10);
  if (dom <= 10) out.push({ name: '月營收公布期', desc: '上市櫃公司需於每月 10 日前公布上月營收，個股易因營收數字跳動', dir: 'mix', date: now });
  return out;
}

// 交易日判定：週六日一律不推播。國定假日盤前無法從資料判定，
// 但 09:00 之後可用「今日是否有即時成交」偵測（見 marketTradedToday）。
function isTradingDayTW() {
  const wd = twClock().wd;
  return wd !== 'Sat' && wd !== 'Sun';
}

// 推播時段守門：只在交易日的 08:30–13:35（台北時間）推播。
// 過去只擋假日、沒擋時段 —— 掃描在半夜跑到就會推訊號（實際發生過 00:32 推播）。
// 資料本身（盤後法人、隔夜美股）半夜確實會更新，但那時推播對使用者沒有可行動性，
// 一律留到隔日盤前的排程報告一起呈現。
function inNotifyWindow() {
  if (!isTradingDayTW()) return false;
  const t = twClock();
  const m = t.hour * 60 + t.minute;
  // 08:30 盤前 → 13:30 收盤 → 14:30 盤後定價交易撮合。
  // 盤後定價（14:00–14:30 申報、依收盤價成交）仍可下單，故納入可推播時段。
  return m >= 8 * 60 + 30 && m <= 14 * 60 + 30;
}

// 盤後總結時段：三大法人買賣超約 16:00 公布，這才是規劃「明天怎麼做」的關鍵資料。
// 盤中無法行動的資訊集中在這裡一次送出，一天一則，不洗版。
function inAfterCloseWindow() {
  if (!isTradingDayTW()) return false;
  const t = twClock();
  const m = t.hour * 60 + t.minute;
  return m >= 16 * 60 + 30 && m <= 21 * 60;
}

// 今天市場是否真的有開（僅盤中之後可判定）：任一檔有今日的即時分鐘資料即為有開盤
function marketTradedToday() {
  const today = twClock().date;
  for (const s of allStocks.slice(0, 12)) {
    const bars = getIntradayBars(s.id, 5);
    if (bars.length && String(bars[bars.length - 1].time).slice(0, 10) === today) return true;
  }
  return null;   // 無法判定（尚未累積盤中資料）
}

// 三大法人與量能的白話摘要（多份報告共用）
function instAndVolumeSummary() {
  const out = [];
  const it = outlookData.instTotal;
  if (it) {
    const f = (n) => `${n >= 0 ? '+' : ''}${Math.round(n).toLocaleString()} 張`;
    out.push(`外資 ${f(it.foreign)}／投信 ${f(it.investment)}／自營商 ${f(it.dealer)}`);
  }
  const tv = outlookData.turnover;
  if (tv) out.push(`大盤成交 ${(tv.amount / 1e8).toFixed(0)} 億（20 日均量的 ${tv.ratio.toFixed(2)} 倍）— ${tv.verdict.split(' —')[0]}`);
  // 掃描池的量能變化（今日量 vs 20 日均量的中位數）
  const ratios = allStocks.filter(s => s.analysis?.volMA > 0)
    .map(s => s.analysis.lastVol / s.analysis.volMA).sort((a, b) => a - b);
  if (ratios.length >= 5) {
    const med = ratios[Math.floor(ratios.length / 2)];
    out.push(`個股量能中位數為均量的 ${med.toFixed(2)} 倍（${med >= 1.2 ? '普遍放量' : med <= 0.8 ? '普遍量縮' : '量能持平'}）`);
  }
  return out;
}

// 大戶掛單真假判定摘要（盤中才有五檔資料；盤前誠實說明無資料）
function whaleOrderSummary() {
  if (!_whaleResults?.length) return { has: false, txt: '目前未偵測到大戶大量買超或掛單訊號' };
  const withBook = _whaleResults.filter(r => r.book);
  const fake = _whaleResults.filter(r => r.trap.some(x => x.includes('掛單撐盤假象')));
  const clean = _whaleResults.filter(r => !r.trap.length);
  const lines = [];
  if (clean.length) lines.push(`通過陷阱檢查：${clean.slice(0, 3).map(r => `${r.s.name}(${r.s.id})`).join('、')}`);
  if (fake.length) lines.push(`⚠ 疑似假掛單（大量掛買但股價貼盤中低點）：${fake.map(r => `${r.s.name}(${r.s.id})`).join('、')}`);
  const trapped = _whaleResults.filter(r => r.trap.length && !fake.includes(r));
  if (trapped.length) lines.push(`⚠ 其他陷阱跡象：${trapped.slice(0, 3).map(r => `${r.s.name}(${r.s.id})：${r.trap[0].split(' —')[0]}`).join('；')}`);
  if (!withBook.length) lines.push('（盤前無五檔掛單資料，掛單真假需開盤後才能判定）');
  return { has: true, txt: lines.join('\n'), clean, fake };
}

// AI 推薦（紙上追蹤中）的持倉是否需要平倉
function checkAiSignalExits() {
  const open = getAiSignals().filter(t => t.status === 'open');
  const out = [];
  for (const t of open) {
    const s = allStocks.find(x => x.id === t.id);
    if (!s?.analysis) continue;
    const px = s.analysis.price;
    const div = exDivAdjust(s.ohlcv, t.date);
    const stop = t.stop - div, tgt = t.t1 != null ? t.t1 - div : null;
    const ret = (px + div - t.entry) / t.entry * 100;
    let action = null;
    if (px <= stop) action = `🔴 已跌破停損 ${stop.toFixed(2)} — 訊號失效，若有跟單應平倉`;
    else if (tgt != null && px >= tgt) action = `🟢 已達目標 ${tgt.toFixed(2)} — 可減碼鎖利`;
    else if (px <= stop * 1.02) action = `🟡 逼近停損 ${stop.toFixed(2)} — 留意跌破`;
    if (action) out.push({ t, px, ret, action });
  }
  return out;
}

function buildWeeklyBrief() {
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return null;
  const t = twClock();

  // ① 大盤與國際情勢
  const norm = Math.round(outlookData.norm ?? 0);
  const regime = norm >= 35 ? '偏多' : norm >= 15 ? '中性偏多' : norm <= -35 ? '偏空' : norm <= -15 ? '中性偏空' : '中性盤整';
  const fac = sym => outlookData.factors?.find(f => f.sym === sym);
  const intl = [];
  for (const [sym, label] of [['^SOX', '費半'], ['^GSPC', 'S&P500'], ['^IXIC', '那斯達克']]) {
    const f = fac(sym);
    if (f?.chg5 != null) intl.push(`${label} 週線 ${f.chg5 >= 0 ? '+' : ''}${f.chg5.toFixed(1)}%`);
  }
  const vix = fac('^VIX');
  const ov = outlookData.overnight;

  // ② 上週市場寬度（掃描池）
  const bullN = ready.filter(s => verdictScore(s) >= getThreshold('bull')).length;
  const bearN = ready.filter(s => verdictScore(s) <= getThreshold('bear')).length;

  // ③ 新聞指向（近 7 日，已由新聞解讀模組彙整）
  const newsSec = _newsSignals ? Object.entries(_newsSignals.sectors)
    .filter(([, v]) => Math.abs(v.score) >= 2)
    .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score)).slice(0, 4) : [];
  const newsStk = _newsSignals ? Object.entries(_newsSignals.stocks)
    .filter(([, v]) => v.score !== 0)
    .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score)).slice(0, 4) : [];

  // ④ 本週事件
  const evts = weekEvents();

  // ④-b 假日期間（週五收盤後至今）發布的新聞 —— 週一開盤前最需要消化的部分
  const holidayNews = (() => {
    const news = _newsRaw || [];
    const now = Date.now();
    const cutoff = now - 3.2 * 86400000;          // 約週五盤後至今
    return news.filter(n => n.ts && n.ts >= cutoff)
      .filter(n => { const d = new Date(n.ts).getDay(); return d === 0 || d === 6 || d === 5; })
      .slice(0, 6);
  })();

  // ④-c 美股（夜盤／週五收盤）與法人量能
  const usClose = [];
  for (const [sym, label] of [['^DJI', '道瓊'], ['^GSPC', 'S&P500'], ['^IXIC', '那斯達克'], ['^SOX', '費半']]) {
    const f = fac(sym);
    if (f?.chg1 != null) usClose.push(`${label} ${f.chg1 >= 0 ? '+' : ''}${f.chg1.toFixed(2)}%`);
  }
  const instVol = instAndVolumeSummary();
  const whale = whaleOrderSummary();

  // ⑤ 持倉佈局
  const holdRows = getHoldings().map(h => {
    const r = checkHoldingExit(h);
    const s = allStocks.find(x => x.id === h.id);
    if (!r) return { h, plan: '尚未取得分析資料，等本輪掃描完成後再評估', level: 'hold', pending: true };
    const v = s ? getVerdict(s) : null;
    const sec = s?.sector;
    const newsHit = sec && _newsSignals?.sectors[sec] && Math.abs(_newsSignals.sectors[sec].score) >= 2
      ? `（${sec}族群本週新聞面${_newsSignals.sectors[sec].score > 0 ? '偏多' : '偏空'}）` : '';
    let plan;
    if (r.level === 'exit') plan = `本週優先處理：${r.reasons[0]}。反彈即減碼，不要凹`;
    else if (r.level === 'watch') plan = `留意：${r.reasons[0]}。續抱但停損上移，跌破 ${r.h.stop} 出場`;
    else plan = norm <= -15
      ? `結構仍健康，但大盤偏空 — 續抱不加碼，停損守 ${r.h.stop}`
      : `結構健康，續抱。停損 ${r.h.stop}${r.h.t1 ? `，接近 ${r.h.t1} 可減碼一半` : '，上方無壓力則移動停利'}`;
    return { h, r, v, plan: plan + newsHit, level: r.level, retPct: r.retPct };
  });

  // ⑥ 交易機會（沿用推薦引擎的同一套標準，維持全站一致）
  const picks = computeEntrySignals();
  const longs = [], swings = [];
  for (const pk of picks.slice(0, 6)) (classifyLongTerm(pk.s) ? longs : swings).push(pk);

  // ⑦ 本週操作基調
  let tone;
  if (norm >= 15 && bullN > bearN) tone = '順勢偏多：可依建議區間分批進場，但仍守紀律停損';
  else if (norm <= -15 || bearN > bullN * 1.5) tone = '保守應對：降低部位與進場頻率，優先處理弱勢持股';
  else tone = '中性觀望：等突破表態再加碼，區間內高賣低買為主';
  if (vix?.price >= 25) tone += `；VIX ${vix.price.toFixed(1)} 偏高，波動放大請縮小單筆部位`;

  return { t, norm, regime, intl, vix, ov, bullN, bearN, total: ready.length,
           newsSec, newsStk, evts, holidayNews, usClose, instVol, whale,
           holdRows, longs, swings, tone, at: new Date().toISOString().slice(0, 16).replace('T', ' ') };
}

function renderWeeklyBrief() {
  const el = document.getElementById('weekly-brief-body');
  if (!el) return;
  const b = buildWeeklyBrief();
  if (!b) { el.innerHTML = '<div class="adv-loading">等待掃描完成後生成本週佈局...</div>'; return; }
  const c = b.norm >= 15 ? 'var(--bull)' : b.norm <= -15 ? 'var(--bear)' : 'var(--yellow)';
  const lvIcon = { exit: '🔴', watch: '🟡', hold: '🟢' };

  el.innerHTML = `
    <div style="padding:10px 12px;border-radius:8px;background:${c}0d;border-left:3px solid ${c};margin-bottom:10px">
      <div style="font-size:0.84rem;font-weight:700;color:${c}">本週基調：${b.tone}</div>
      <div style="font-size:0.73rem;color:var(--text3);margin-top:3px">
        大盤研判 ${b.regime}（${b.norm > 0 ? '+' : ''}${b.norm}）｜掃描池 多 ${b.bullN} / 空 ${b.bearN} / 共 ${b.total} 檔
        ${b.intl.length ? `<br>國際：${b.intl.join('・')}` : ''}
        ${b.vix?.price != null ? `｜VIX ${b.vix.price.toFixed(1)}` : ''}
        ${b.ov?.adr ? `<br>隔夜：台積電 ADR ${b.ov.adr.chg1 >= 0 ? '+' : ''}${b.ov.adr.chg1}%${b.ov.premium != null ? `（溢價 ${b.ov.premium >= 0 ? '+' : ''}${b.ov.premium}%）` : ''}` : ''}
      </div>
    </div>

    ${b.usClose?.length ? `<div style="margin-bottom:9px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">🌙 美股最新收盤</div>
      <div style="font-size:0.75rem;color:var(--text2)">${b.usClose.join('・')}</div>
    </div>` : ''}

    ${b.instVol?.length ? `<div style="margin-bottom:9px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">💰 籌碼與量能</div>
      <div style="font-size:0.75rem;color:var(--text2);line-height:1.7">${b.instVol.map(x => '・' + x).join('<br>')}</div>
    </div>` : ''}

    ${b.whale?.txt ? `<div style="margin-bottom:9px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">🐋 大戶動向與掛單判定</div>
      <div style="font-size:0.75rem;color:var(--text2);line-height:1.7">${b.whale.txt.replace(/\n/g, '<br>')}</div>
    </div>` : ''}

    ${b.holidayNews?.length ? `<div style="margin-bottom:9px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">🗞 假日期間發布的新聞</div>
      <div style="font-size:0.75rem;color:var(--text2);line-height:1.7">${b.holidayNews.map(n => `・${n.headline}<span style="color:var(--text3)">（${n.date}${n.source ? '・' + n.source : ''}）</span>`).join('<br>')}</div>
    </div>` : ''}

    ${b.evts.length ? `<div style="margin-bottom:9px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">📅 本週事件</div>
      <div style="font-size:0.75rem;color:var(--text2);line-height:1.7">${b.evts.map(e => `・<b>${e.name}</b> — ${e.desc}`).join('<br>')}</div>
    </div>` : ''}

    ${(b.newsSec.length || b.newsStk.length) ? `<div style="margin-bottom:9px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">📰 近一週新聞指向</div>
      <div style="font-size:0.75rem;color:var(--text2);line-height:1.7">
        ${b.newsSec.length ? `產業：${b.newsSec.map(([s, v]) => `<span style="color:${v.score > 0 ? 'var(--bull)' : 'var(--bear)'}">${s}${v.score > 0 ? '偏多' : '偏空'}</span>`).join('・')}<br>` : ''}
        ${b.newsStk.length ? `個股：${b.newsStk.map(([id, v]) => `<span style="color:${v.score > 0 ? 'var(--bull)' : 'var(--bear)'}">${v.name}(${id})</span>`).join('・')}` : ''}
      </div>
    </div>` : '<div style="font-size:0.73rem;color:var(--text3);margin-bottom:9px">📰 近一週無明確指向特定產業或個股的新聞</div>'}

    <div style="margin-bottom:9px">
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">📌 持倉佈局（${b.holdRows.length} 檔）</div>
      ${b.holdRows.length ? b.holdRows.map(r => `
        <div style="font-size:0.75rem;color:var(--text2);line-height:1.65;padding:4px 0;border-bottom:1px solid var(--border)">
          ${lvIcon[r.level] || '⏳'} <b>${r.h.name}(${r.h.id})</b>
          ${r.retPct != null ? `<span style="font-family:var(--mono);color:${r.retPct >= 0 ? 'var(--bull)' : 'var(--bear)'}">${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%</span>` : ''}
          <br><span style="color:var(--text3)">${r.plan}</span>
        </div>`).join('')
        : '<div style="font-size:0.75rem;color:var(--text3)">目前無持倉 — 可從下方交易機會挑選，或維持空手等待更好的進場點</div>'}
    </div>

    <div>
      <div style="font-size:0.76rem;font-weight:700;color:var(--text2);margin-bottom:3px">🎯 本週交易機會</div>
      ${(b.longs.length || b.swings.length) ? `
        ${b.longs.length ? `<div style="font-size:0.75rem;color:var(--text2);line-height:1.7">🏛 可長期持有：${b.longs.map(p => `${p.s.name}(${p.s.id}) 進場 ${p.p.lo}~${p.p.hi}／停損 ${p.p.stop}`).join('；')}</div>` : ''}
        ${b.swings.length ? `<div style="font-size:0.75rem;color:var(--text2);line-height:1.7">📈 短期波段：${b.swings.map(p => `${p.s.name}(${p.s.id}) 進場 ${p.p.lo}~${p.p.hi}／停損 ${p.p.stop}`).join('；')}</div>` : ''}`
        : '<div style="font-size:0.75rem;color:var(--text3)">本週開盤前無符合條件的標的 — 標準較嚴，寧可空手也不硬給訊號</div>'}
    </div>
    <div style="font-size:0.66rem;color:var(--text3);margin-top:8px">生成於 ${b.at}｜⚠ 規則化分析，僅供參考，非投資建議</div>`;
  return b;
}

// 週一 09:30 起自動推送（同一週只推一次；錯過時間仍會在下次掃描補推）
function notifyWeeklyBrief() {
  const t = twClock();
  if (!inNotifyWindow()) return;                   // 假日與非交易時段不推
  if (t.wd !== 'Mon') return;
  // 09:30 才推：五檔掛單是盤中資料，盤前拿不到 —— 等開盤半小時後
  // 大戶掛單真假、開盤走勢、量能才有實際數據可判斷
  if (t.hour * 60 + t.minute < 9 * 60 + 30) return;
  const wk = weekKey();
  if (localStorage.getItem('tg-weekly') === wk) return;
  const b = buildWeeklyBrief();
  if (!b) return;                                  // 資料未就緒，下輪再試
  logSignal('brief', '本週開盤佈局已推送', '週一盤前：假日新聞/數據＋美股夜盤＋籌碼綜合佈局建議', { dedupKey: 'weekly' });
  localStorage.setItem('tg-weekly', wk);
  if (!tgWants('sig')) return;

  const lvIcon = { exit: '🔴', watch: '🟡', hold: '🟢' };
  const lines = [];
  lines.push(`🗓 本週佈局　${t.date}（週一）09:30`);
  lines.push('');
  lines.push(`【大盤】${b.regime}（${b.norm > 0 ? '+' : ''}${b.norm}）｜掃描池 多 ${b.bullN} / 空 ${b.bearN} / 共 ${b.total} 檔`);
  if (b.intl.length) lines.push(`【國際】${b.intl.join('・')}${b.vix?.price != null ? `｜VIX ${b.vix.price.toFixed(1)}` : ''}`);
  if (b.ov?.adr) lines.push(`【隔夜】台積電 ADR ${b.ov.adr.chg1 >= 0 ? '+' : ''}${b.ov.adr.chg1}%${b.ov.premium != null ? `（溢價 ${b.ov.premium >= 0 ? '+' : ''}${b.ov.premium}%）` : ''}`);
  if (b.evts.length) { lines.push(''); lines.push('【本週事件】'); b.evts.forEach(e => lines.push(`・${e.name} — ${e.desc}`)); }
  if (b.newsSec.length || b.newsStk.length) {
    lines.push(''); lines.push('【近一週新聞指向】');
    if (b.newsSec.length) lines.push(`產業：${b.newsSec.map(([s, v]) => `${s}${v.score > 0 ? '偏多' : '偏空'}`).join('、')}`);
    if (b.newsStk.length) lines.push(`個股：${b.newsStk.map(([id, v]) => `${v.name}(${id})${v.score > 0 ? '利多' : '利空'}`).join('、')}`);
  }
  if (b.usClose?.length) { lines.push(''); lines.push(`【美股收盤】${b.usClose.join('・')}`); }
  if (b.instVol?.length) { lines.push(''); lines.push('【籌碼與量能】'); b.instVol.forEach(x => lines.push(`・${x}`)); }
  if (b.whale?.txt) { lines.push(''); lines.push('【大戶動向與掛單判定】'); lines.push(b.whale.txt); }
  if (b.holidayNews?.length) {
    lines.push(''); lines.push('【假日期間發布的新聞】');
    b.holidayNews.forEach(n => lines.push(`・${n.headline}（${n.date}${n.source ? '・' + n.source : ''}）`));
  }
  lines.push(''); lines.push('【持倉佈局】');
  if (b.holdRows.length) b.holdRows.forEach(r => {
    lines.push(`${lvIcon[r.level] || '⏳'} ${r.h.name}(${r.h.id})${r.retPct != null ? ` ${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%` : ''}`);
    lines.push(`　${r.plan}`);
  });
  else lines.push('目前無持倉');
  lines.push(''); lines.push('【本週交易機會】');
  if (b.longs.length || b.swings.length) {
    b.longs.forEach(p => lines.push(`🏛 ${p.s.name}(${p.s.id})　進場 ${p.p.lo}~${p.p.hi}｜停損 ${p.p.stop}｜${p.p.holdOn ? '無壓力續抱' : `目標 ${p.p.t1}`}`));
    b.swings.forEach(p => lines.push(`📈 ${p.s.name}(${p.s.id})　進場 ${p.p.lo}~${p.p.hi}｜停損 ${p.p.stop}｜${p.p.holdOn ? '無壓力續抱' : `目標 ${p.p.t1}`}`));
  } else lines.push('無符合條件的標的（標準較嚴，寧可空手）');
  lines.push(''); lines.push(`【本週基調】${b.tone}`);
  lines.push(''); lines.push('⚠ 規則化分析，僅供參考，非投資建議');
  tgPush(lines.join('\n'));
}

// ── 每日 09:00 市場簡報 ────────────────────────────────────────────────────
function buildDailyBrief() {
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return null;
  const norm = Math.round(outlookData.norm ?? 0);
  const regime = norm >= 35 ? '偏多' : norm >= 15 ? '中性偏多' : norm <= -35 ? '偏空' : norm <= -15 ? '中性偏空' : '中性盤整';
  const fac = sym => outlookData.factors?.find(f => f.sym === sym);
  const us = [];
  for (const [sym, label] of [['^SOX', '費半'], ['^GSPC', 'S&P500'], ['^IXIC', '那斯達克']]) {
    const f = fac(sym);
    if (f?.chg1 != null) us.push(`${label} ${f.chg1 >= 0 ? '+' : ''}${f.chg1.toFixed(2)}%`);
  }
  const focus = [...ready].sort((a, b) => verdictScore(b) - verdictScore(a)).slice(0, 5)
    .map(s => ({ s, v: getVerdict(s) }));
  const holdings = getHoldings().map(h => checkHoldingExit(h)).filter(Boolean);
  const exits = holdings.filter(r => r.level === 'exit');
  const watches = holdings.filter(r => r.level === 'watch');
  return {
    norm, regime, us, vix: fac('^VIX'), ov: outlookData.overnight,
    instVol: instAndVolumeSummary(), focus, holdings, exits, watches,
    picks: computeEntrySignals().slice(0, 4),
    date: twClock().date,
  };
}

// ── 每日 08:30 盤前簡報 ─────────────────────────────────────────────────────
// 開盤前 30 分鐘：昨收＋美股夜盤＋隔夜新聞＋今日數據事件 → 開盤研判與交易重點。
// 每一節都「有資料才寫」；連基本盤（掃描池／美股）都沒有就整份不發，不硬湊。
function buildPreOpen() {
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return null;
  const fac = sym => outlookData.factors?.find(f => f.sym === sym);

  // ① 昨日收盤與市場寬度
  const twii = fac('^TWII');
  const bullN = ready.filter(s => verdictScore(s) >= getThreshold('bull')).length;
  const bearN = ready.filter(s => verdictScore(s) <= getThreshold('bear')).length;
  const norm = Math.round(outlookData.norm ?? 0);
  const regime = norm >= 35 ? '偏多' : norm >= 15 ? '中性偏多' : norm <= -35 ? '偏空' : norm <= -15 ? '中性偏空' : '中性盤整';

  // ② 美股夜盤收盤
  const us = [];
  for (const [sym, label] of [['^DJI', '道瓊'], ['^GSPC', 'S&P500'], ['^IXIC', '那斯達克'], ['^SOX', '費半']]) {
    const f = fac(sym);
    if (f?.chg1 != null) us.push(`${label} ${f.chg1 >= 0 ? '+' : ''}${f.chg1.toFixed(2)}%`);
  }
  const vix = fac('^VIX');
  const ov = outlookData.overnight;

  // ③ 開盤方向研判（ADR/EWT 隱含跳空 — 與當沖紀律同一套邏輯）
  let openCall = null;
  if (ov?.adr?.chg1 != null) {
    const c = ov.adr.chg1;
    openCall = c > 2.5 ? `台積電 ADR ${c >= 0 ? '+' : ''}${c}% — 預期大幅開高，追價風險極高：開高逾 2% 的標的不追，等回測缺口`
      : c > 1 ? `台積電 ADR +${c}% — 預期開高，開盤價超過建議區上緣就別追，等拉回`
      : c < -2 ? `台積電 ADR ${c}% — 預期大幅開低，昨日動能訊號先視為失效，開盤 30 分不接刀`
      : c < -0.5 ? `台積電 ADR ${c}% — 可能小幅開低，開低逾 0.5% 的當沖標的依紀律放棄`
      : `台積電 ADR ${c >= 0 ? '+' : ''}${c}% 持平 — 無不利跳空，昨日訊號有效性維持`;
    if (ov.premium != null) openCall += `（ADR 溢價 ${ov.premium >= 0 ? '+' : ''}${ov.premium}%）`;
  }

  // ④ 隔夜新聞（昨 16:00 後發布）與新聞面指向
  const cutoff = Date.now() - 18 * 60 * 60 * 1000;
  const nightNews = (_newsRaw || []).filter(n => n.ts && n.ts >= cutoff).slice(0, 5);
  const newsSec = _newsSignals ? Object.entries(_newsSignals.sectors)
    .filter(([, v]) => Math.abs(v.score) >= 2)
    .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score)).slice(0, 3) : [];

  // ⑤ 今日數據事件（weekEvents 的 date 為 Date 物件，取台北當日者）
  const todayIso = twClock().date;
  const todayEvts = (weekEvents() || []).filter(e => {
    try {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(d) === todayIso;
    } catch { return false; }
  });

  // ⑤-b 近日重要數據倒數（3 天內）＋事前方向判讀 — 原獨立推播，併入盤前
  // 只列 1~5「日曆日」後的（今日事件已在【今日數據】段，避免同一事件列兩次）
  const evtsSoon = imminentEvents(5).filter(e => e.days >= 1);

  // ⑥ 持倉與交易重點（昨收資料的評估 — 開盤後 09:30 另有追蹤版）
  const holdings = getHoldings().map(h => checkHoldingExit(h)).filter(Boolean);
  const exits = holdings.filter(r => r.level === 'exit');
  const watches = holdings.filter(r => r.level === 'watch');
  const picks = computeEntrySignals().slice(0, 3);
  const days = computeDayTradePicks().slice(0, 2);

  // ⑦ 重點關注（原獨立推播，併入盤前；與進場訊號重複者不再列）
  let focus = [];
  try {
    const pickIds = new Set(picks.map(p => p.s.id));
    focus = (computeFocusStocks().daily || []).filter(f => !pickIds.has(f.s.id)).slice(0, 3);
  } catch {}

  // ⑧ 族群資金輪動：今天優先看哪個族群
  let rotation = null;
  try {
    const secs = sectorStats().filter(g => g.rotation);
    const inflow = secs.filter(g => g.rotation.state === 'in').sort((a, b) => b.rotation.accel - a.rotation.accel).slice(0, 3);
    const outflow = secs.filter(g => g.rotation.state === 'out').sort((a, b) => a.rotation.accel - b.rotation.accel).slice(0, 2);
    if (inflow.length || outflow.length) rotation = { inflow, outflow };
  } catch {}

  return { date: twClock().date, twii, bullN, bearN, total: ready.length, norm, regime,
           us, vix, ov, openCall, nightNews, newsSec, todayEvts, evtsSoon,
           holdings, exits, watches, picks, days, focus, rotation };
}

function notifyPreOpen() {
  const t = twClock();
  if (!inNotifyWindow()) return;                                  // 假日與非交易時段不推
  const mins = t.hour * 60 + t.minute;
  if (mins < 8 * 60 + 30 || mins >= 9 * 60) return;               // 只在 08:30~08:59
  if (localStorage.getItem('tg-preopen') === t.date) return;
  const b = buildPreOpen();
  if (!b) return;                                                  // 資料不足不發，等下輪掃描再試
  logSignal('brief', '盤前簡報已推送', '08:30：昨收＋美股夜盤＋隔夜新聞＋今日開盤研判與交易重點', { dedupKey: 'preopen' });
  localStorage.setItem('tg-preopen', t.date);
  if (!tgWants('sig')) return;

  const L = [];
  L.push(`🌅 盤前簡報　${b.date} 08:30`);
  L.push('');
  L.push(`【昨日收盤】${b.twii?.price != null ? `加權 ${b.twii.price.toFixed(0)}（${b.twii.chg1 >= 0 ? '+' : ''}${b.twii.chg1?.toFixed(2) ?? '--'}%）｜` : ''}研判${b.regime}（${b.norm > 0 ? '+' : ''}${b.norm}）｜掃描池 多 ${b.bullN} / 空 ${b.bearN} / 共 ${b.total}`);
  if (b.us.length) L.push(`【美股夜盤】${b.us.join('・')}${b.vix?.price != null ? `｜VIX ${b.vix.price.toFixed(1)}` : ''}`);
  (() => { const dv = derivsSummary(); if (dv) L.push(`【期貨籌碼】${dv.parts.join('｜')}`); })();
  if (b.openCall) { L.push(''); L.push(`【開盤研判】${b.openCall}`); }
  if (b.newsSec.length || b.nightNews.length) {
    L.push(''); L.push('【新聞面】');
    if (b.newsSec.length) L.push(`指向：${b.newsSec.map(([s, v]) => `${s}${v.score > 0 ? '偏多' : '偏空'}`).join('、')}`);
    b.nightNews.slice(0, 3).forEach(n => L.push(`・${n.headline}${n.dir && n.dir !== '中性' ? `（${n.dir}）` : ''}`));
  }
  if (b.todayEvts.length) { L.push(''); L.push(`【今日數據】${b.todayEvts.map(e => e.name || e.txt).join('、')}`); }
  if (b.evtsSoon.length) {
    L.push(''); L.push(`【數據倒數】${b.evtsSoon.map(e => `${e.days === 0 ? '今日' : `${e.days} 天後`} ${e.name}`).join('、')}`);
    L.push(b.norm >= 15 ? '事前判讀：偏多（動能強，數據符合預期易噴出）'
         : b.norm <= -15 ? '事前判讀：偏空（市場已弱，數據不佳恐加速下跌）'
         : '事前判讀：中性（數據公布前建議降部位觀望）');
  }
  if (b.holdings.length) {
    L.push(''); L.push('【持倉重點】');
    if (b.exits.length) L.push(`⚠ ${b.exits.length} 檔昨收已觸出場條件：${b.exits.map(r => `${r.h.name}（${r.reasons[0]}）`).join('；')} — 開盤反彈即處理`);
    if (b.watches.length) L.push(`留意 ${b.watches.length} 檔：${b.watches.map(r => r.h.name).join('、')}`);
    if (!b.exits.length && !b.watches.length) L.push(`${b.holdings.length} 檔結構健康，開盤續抱`);
  }
  if (b.picks.length) {
    L.push(''); L.push('【今日交易重點】');
    b.picks.forEach(({ s, p }) => L.push(`・${s.name}(${s.id})　進場 ${p.lo}~${p.hi}｜停損 ${p.stop}${b.openCall && /開高/.test(b.openCall) ? '（開高逾區間上緣不追）' : ''}`));
  }
  if (b.days.length) L.push(`當沖觀察：${b.days.map(d => d.s.name).join('、')}（開盤跳空逾 +2% 不追、開低逾 -0.5% 放棄）`);
  if (b.focus.length) L.push(`重點關注：${b.focus.map(f => `${f.s.name}(${f.s.id})`).join('、')}`);
  if (b.rotation) {
    const rIn = b.rotation.inflow.map(g => `${g.sector}（5日${g.rotation.r5 >= 0 ? '+' : ''}${g.rotation.r5}%）`).join('、');
    const rOut = b.rotation.outflow.map(g => g.sector).join('、');
    L.push(`族群輪動：${rIn ? `🔥流入 ${rIn}` : ''}${rIn && rOut ? '｜' : ''}${rOut ? `🧊流出 ${rOut}` : ''} — 波段優先選加速中的族群`);
  }
  // 最強族群論點（論點分 ≥4 才有資格佔簡報版面）
  try {
    const th = sectorThesis().filter(x => x.pts >= 4)[0];
    if (th) L.push(`族群論點：${th.sector}（+${th.pts}）— ${th.ev.slice(0, 2).join('；')}${th.leader ? `｜領頭羊 ${th.leader.name}` : ''}`);
  } catch {}
  L.push(''); L.push('⚠ 規則化分析，僅供參考，非投資建議｜09:30 開盤後追蹤將另行推送');
  tgPush(L.join('\n'));
  // 登記已推內容：這些股票與持倉狀態今天不必再由其他訊號重推一次
  tgMarkKeys([
    ...b.picks.map(({ s }) => `sig:${s.id}`),
    ...b.days.map(d => `sig:${d.s.id}`),
    ...b.focus.map(f => `sig:${f.s.id}`),
    ...b.holdings.map(r => `hold:${r.h.id}:${r.level}`),
  ]);
  localStorage.setItem('tg-event-sent', twClock().date);   // 數據倒數已併入，獨立版不再發
}

function notifyDailyBrief() {
  const t = twClock();
  if (!inNotifyWindow()) return;
  if (t.hour * 60 + t.minute < 9 * 60) return;             // 09:00 起
  if (localStorage.getItem('tg-daily-brief') === t.date) return;
  // 08:30 盤前簡報已發就不再發 — 兩者內容高度重疊（大盤/美股/持倉/機會），
  // 30 分鐘連發兩份幾乎相同的報告是重複推送的主要來源
  if (localStorage.getItem('tg-preopen') === t.date) {
    localStorage.setItem('tg-daily-brief', t.date);
    return;
  }
  const b = buildDailyBrief();
  if (!b) return;
  logSignal('brief', '每日市場簡報已推送', '09:00 盤前：大盤研判、多空家數、重點事件', { dedupKey: 'daily' });
  localStorage.setItem('tg-daily-brief', t.date);
  if (!tgWants('sig')) return;

  const L = [];
  L.push(`📊 每日市場簡報　${b.date} 09:00`);
  L.push('');
  L.push(`【大盤】${b.regime}（${b.norm > 0 ? '+' : ''}${b.norm}）`);
  if (b.us.length) L.push(`【美股】${b.us.join('・')}${b.vix?.price != null ? `｜VIX ${b.vix.price.toFixed(1)}` : ''}`);
  if (b.ov?.adr) L.push(`【隔夜】台積電 ADR ${b.ov.adr.chg1 >= 0 ? '+' : ''}${b.ov.adr.chg1}%${b.ov.premium != null ? `（溢價 ${b.ov.premium >= 0 ? '+' : ''}${b.ov.premium}%）` : ''}`);
  if (b.instVol.length) { L.push(''); L.push('【籌碼與量能】'); b.instVol.forEach(x => L.push(`・${x}`)); }
  // 重大事件倒數（5 天內每天提醒到事件結束 — 與盤前簡報同一套資料）
  (() => {
    const ev = imminentEvents(5);
    if (!ev.length) return;
    L.push(''); L.push('【重大事件倒數】');
    ev.forEach(e => L.push(`・${e.days === 0 ? '📌 今日' : `⏳ ${e.days} 天後`} ${e.name}（${e.impact}）`));
    L.push('事件前波動放大：新倉縮小、持倉停損收緊');
  })();
  L.push(''); L.push('【今日重點關注】');
  b.focus.forEach(f => L.push(`・${f.s.name}(${f.s.id})　${f.v.signal}　評分 ${f.v.score}`));
  if (b.holdings.length) {
    L.push(''); L.push('【持倉狀態】');
    L.push(b.exits.length ? `⚠ ${b.exits.length} 檔出現出場訊號：${b.exits.map(r => r.h.name).join('、')}`
         : b.watches.length ? `留意 ${b.watches.length} 檔：${b.watches.map(r => r.h.name).join('、')}`
         : `${b.holdings.length} 檔全部續抱，無出場訊號`);
  }
  if (b.picks.length) {
    L.push(''); L.push('【今日進場機會】');
    b.picks.forEach(p => L.push(`・${p.s.name}(${p.s.id})　進場 ${p.p.lo}~${p.p.hi}｜停損 ${p.p.stop}`));
  }
  L.push(''); L.push('⚠ 規則化分析，僅供參考，非投資建議');
  tgPush(L.join('\n'));
  tgMarkKeys([
    ...b.picks.map(p => `sig:${p.s.id}`),
    ...b.focus.map(f => `sig:${f.s.id}`),
    ...b.holdings.map(r => `hold:${r.h.id}:${r.level}`),
  ]);
}

// ── 每日 09:30 開盤後追蹤 ──────────────────────────────────────────────────
// 開盤半小時後才有意義：走勢已表態、五檔掛單可判真假、持倉是否該平倉已有依據。
function buildPostOpen() {
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return null;
  const twii = outlookData.factors?.find(f => f.sym === '^TWII');

  // 開盤後走勢：以盤中分鐘 K 的開盤價與現價比較
  const movers = [];
  for (const s of ready) {
    const bars = getIntradayBars(s.id, 5);
    if (bars.length < 2) continue;
    const open = bars[0].open, now = bars[bars.length - 1].close;
    if (!(open > 0)) continue;
    movers.push({ s, chg: (now - open) / open * 100, now });
  }
  movers.sort((a, b) => b.chg - a.chg);

  const holdings = getHoldings().map(h => checkHoldingExit(h)).filter(Boolean);
  return {
    twii, holdings,
    exits: holdings.filter(r => r.level === 'exit'),
    watches: holdings.filter(r => r.level === 'watch'),
    aiExits: checkAiSignalExits(),
    whale: whaleOrderSummary(),
    instVol: instAndVolumeSummary(),
    up: movers.slice(0, 4), down: movers.slice(-4).reverse(),
    focus: [...ready].sort((a, b) => verdictScore(b) - verdictScore(a)).slice(0, 5).map(s => ({ s, v: getVerdict(s) })),
    newsSec: _newsSignals ? Object.entries(_newsSignals.sectors)
      .filter(([, v]) => Math.abs(v.score) >= 2).sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score)).slice(0, 3) : [],
    date: twClock().date, hasIntraday: movers.length > 0,
  };
}

function notifyPostOpen() {
  const t = twClock();
  if (!inNotifyWindow()) return;
  if (t.hour * 60 + t.minute < 9 * 60 + 30) return;        // 09:30 起
  if (localStorage.getItem('tg-postopen') === t.date) return;
  if (marketTradedToday() === false) return;               // 國定假日（無任何盤中成交）
  const b = buildPostOpen();
  if (!b) return;
  logSignal('brief', '開盤後走勢分析已推送', '09:30：開盤走勢＋新聞數據＋持倉平倉檢查＋今日重點關注', { dedupKey: 'postopen' });
  localStorage.setItem('tg-postopen', t.date);
  if (!tgWants('sig')) return;

  const L = [];
  L.push(`🔔 開盤後追蹤　${b.date} 09:30`);
  L.push('');
  if (b.twii?.chg1 != null) L.push(`【大盤】加權 ${b.twii.price?.toLocaleString(undefined, { maximumFractionDigits: 0 })}（${b.twii.chg1 >= 0 ? '+' : ''}${b.twii.chg1.toFixed(2)}%）`);
  if (!b.hasIntraday) L.push('（盤中分鐘資料累積中，開盤走勢以日線最新價為準）');
  if (b.up.length) L.push(`【開盤走強】${b.up.map(m => `${m.s.name} ${m.chg >= 0 ? '+' : ''}${m.chg.toFixed(1)}%`).join('・')}`);
  if (b.down.length) L.push(`【開盤走弱】${b.down.map(m => `${m.s.name} ${m.chg >= 0 ? '+' : ''}${m.chg.toFixed(1)}%`).join('・')}`);
  if (b.newsSec.length) L.push(`【新聞面】${b.newsSec.map(([s, v]) => `${s}${v.score > 0 ? '偏多' : '偏空'}`).join('、')}`);
  if (b.instVol.length) { L.push(''); L.push('【籌碼與量能】'); b.instVol.forEach(x => L.push(`・${x}`)); }

  L.push(''); L.push('【自行持倉：是否需平倉】');
  if (!b.holdings.length) L.push('目前無持倉');
  else b.holdings.forEach(r => {
    const icon = r.level === 'exit' ? '🔴' : r.level === 'watch' ? '🟡' : '🟢';
    const act = r.level === 'exit' ? '建議平倉' : r.level === 'watch' ? '留意，未破停損先續抱' : '續抱';
    L.push(`${icon} ${r.h.name}(${r.h.id}) ${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%　${act}`);
    L.push(`　${r.reasons[0]}`);
  });

  L.push(''); L.push('【系統推薦持倉：是否需平倉】');
  if (!b.aiExits.length) L.push('追蹤中的推薦訊號均未觸及停損或目標');
  else b.aiExits.forEach(x => L.push(`・${x.t.name}(${x.t.id}) ${x.ret >= 0 ? '+' : ''}${x.ret.toFixed(2)}%　${x.action}`));

  L.push(''); L.push('【大戶掛單判定】');
  L.push(b.whale.txt);

  L.push(''); L.push('【今日重點關注】');
  b.focus.forEach(f => L.push(`・${f.s.name}(${f.s.id})　${f.v.signal}　評分 ${f.v.score}`));
  // 當沖觀察股的開盤區間（ORB）：09:30 正好是開盤區間定型的時刻
  const orbLines = computeDayTradePicks().slice(0, 3).map(dp => {
    const o = orbStatus(dp.s);
    return o ? `・${dp.s.name}(${dp.s.id})　${o.txt}` : null;
  }).filter(Boolean);
  if (orbLines.length) { L.push(''); L.push('【當沖開盤區間 ORB】'); orbLines.forEach(x => L.push(x)); }
  L.push(''); L.push('⚠ 規則化分析，僅供參考，非投資建議');
  tgPush(L.join('\n'));
  tgMarkKeys([
    ...b.focus.map(f => `sig:${f.s.id}`),
    ...b.holdings.map(r => `hold:${r.h.id}:${r.level}`),
  ]);
}

// ── 盤後總結（約 16:30，三大法人買賣超公布後）──────────────────────────────
// 盤中推播只涵蓋「現在能下單」的資訊；真正決定明天怎麼做的是盤後才出爐的
// 法人買賣超與集保資料。這裡一天一則，把當日結果與明日佈局一次講完。
function buildAfterClose() {
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return null;
  const twii = outlookData.factors?.find(f => f.sym === '^TWII');
  const norm = Math.round(outlookData.norm ?? 0);

  // 今日漲跌幅排行（以日 K 收盤 vs 前收）
  const movers = ready.map(s => {
    const a = s.analysis;
    const chg = a.prevClose ? (a.price - a.prevClose) / a.prevClose * 100 : null;
    return chg == null ? null : { s, chg };
  }).filter(Boolean).sort((a, b) => b.chg - a.chg);

  const holdings = getHoldings().map(h => checkHoldingExit(h)).filter(Boolean);
  const picks = computeEntrySignals().slice(0, 5);
  const longs = [], swings = [];
  for (const pk of picks) (classifyLongTerm(pk.s) ? longs : swings).push(pk);

  return {
    date: twClock().date, twii, norm,
    instVol: instAndVolumeSummary(),
    whale: whaleOrderSummary(),
    up: movers.slice(0, 5), down: movers.slice(-5).reverse(),
    holdings,
    exits: holdings.filter(r => r.level === 'exit'),
    watches: holdings.filter(r => r.level === 'watch'),
    aiExits: checkAiSignalExits(),
    longs, swings,
    newsSec: _newsSignals ? Object.entries(_newsSignals.sectors)
      .filter(([, v]) => Math.abs(v.score) >= 2).sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score)).slice(0, 3) : [],
  };
}

function notifyAfterClose() {
  if (!inAfterCloseWindow()) return;
  // 去重鍵必須用「日曆日」而非資料日：16:30~21:00 窗口橫跨法人資料
  // 從昨天翻到今天的時刻，用資料日當鍵會在翻面時重發（實際發生過發兩次）
  const today = twClock().date;
  if (localStorage.getItem('tg-afterclose') === today) return;
  // 今日收盤資料到位才發 — 否則第一輪會拿昨天的資料做「今日」總結
  const s0 = allStocks.find(x => x.ohlcv?.length);
  const lastBar = s0 ? s0.ohlcv[s0.ohlcv.length - 1].time.slice(0, 10) : null;
  if (lastBar !== today) return;                 // 未到位，等下一輪掃描再試
  const b = buildAfterClose();
  if (!b) return;
  logSignal('brief', '盤後總結已推送', '16:30：收盤結果、法人買賣超、明日觀察重點', { dedupKey: 'afterclose' });
  localStorage.setItem('tg-afterclose', today);
  if (!tgWants('sig')) return;

  const L = [];
  L.push(`🌇 盤後總結與明日佈局　${b.date}`);
  L.push('');
  if (b.twii?.chg1 != null)
    L.push(`【收盤】加權 ${b.twii.price?.toLocaleString(undefined, { maximumFractionDigits: 0 })}（${b.twii.chg1 >= 0 ? '+' : ''}${b.twii.chg1.toFixed(2)}%）｜研判分數 ${b.norm > 0 ? '+' : ''}${b.norm}`);
  if (b.instVol.length) { L.push(''); L.push('【今日籌碼與量能】'); b.instVol.forEach(x => L.push(`・${x}`)); }
  (() => { const dv = derivsSummary(); if (dv) L.push(`・${dv.parts.join('；')}`); })();
  if (b.up.length) L.push(`\n【今日強勢】${b.up.map(m => `${m.s.name} ${m.chg >= 0 ? '+' : ''}${m.chg.toFixed(1)}%`).join('・')}`);
  if (b.down.length) L.push(`【今日弱勢】${b.down.map(m => `${m.s.name} ${m.chg >= 0 ? '+' : ''}${m.chg.toFixed(1)}%`).join('・')}`);
  if (b.newsSec.length) L.push(`【新聞面】${b.newsSec.map(([s, v]) => `${s}${v.score > 0 ? '偏多' : '偏空'}`).join('、')}`);

  L.push(''); L.push('【🐋 今日大戶動向】');
  L.push(b.whale.txt);

  L.push(''); L.push('【持倉：明日該怎麼做】');
  if (!b.holdings.length) L.push('目前無持倉');
  else b.holdings.forEach(r => {
    const icon = r.level === 'exit' ? '🔴' : r.level === 'watch' ? '🟡' : '🟢';
    const act = r.level === 'exit' ? '明日開盤優先處理，反彈即減碼'
              : r.level === 'watch' ? `續抱但盯緊，跌破 ${r.h.stop} 出場`
              : `續抱，停損守 ${r.h.stop}`;
    L.push(`${icon} ${r.h.name}(${r.h.id}) ${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%　${act}`);
  });
  if (b.aiExits.length) {
    L.push(''); L.push('【系統推薦訊號狀態】');
    b.aiExits.forEach(x => L.push(`・${x.t.name}(${x.t.id})　${x.action}`));
  }

  L.push(''); L.push('【明日觀察標的】');
  if (b.longs.length || b.swings.length) {
    b.longs.forEach(p => L.push(`🏛 ${p.s.name}(${p.s.id})　進場 ${p.p.lo}~${p.p.hi}｜停損 ${p.p.stop}`));
    b.swings.forEach(p => L.push(`📈 ${p.s.name}(${p.s.id})　進場 ${p.p.lo}~${p.p.hi}｜停損 ${p.p.stop}`));
  } else L.push('無符合條件的標的（標準較嚴，寧可空手）');
  L.push('');
  L.push('※ 盤後定價交易時段為 14:00–14:30（依收盤價撮合），此報告發布時已結束；');
  L.push('　以上為明日盤前的準備依據。');
  L.push('⚠ 規則化分析，僅供參考，非投資建議');
  tgPush(L.join('\n'));
}

// ── 大戶動向偵測：大量買超/大單掛買 → 陷阱判斷 → Telegram ──────────────────
// 「大量買入」以法人籌碼為準（買超量佔均量比、連續買超），盤中再輔以 MIS
// 五檔委買掛單；每一筆偵測都先過陷阱檢查（誘多/出貨跡象），乾淨的才推送。

let _whaleResults = [];

// 通過陷阱檢查的大戶偵測結果（供交易建議的進場理由引用）
function whaleFor(stockId) {
  return _whaleResults.find(r => r.s.id === stockId && !r.trap.length && r.sig?.length) || null;
}

function isMarketOpenTW() {
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Taipei', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t)?.value;
    const hm = +g('hour') * 60 + +g('minute');
    return !['Sat', 'Sun'].includes(g('weekday')) && hm >= 540 && hm <= 810; // 09:00–13:30
  } catch { return false; }
}

async function detectWhales() {
  const ready = allStocks.filter(s => s.analysis && s.ohlcv?.length >= 20);
  if (ready.length < 5) return;
  const marketOpen = isMarketOpenTW();
  const results = [];
  let bookProbes = 0;

  for (const s of ready) {
    if (s._staleDays >= STALE_LIMIT) continue;   // 資料過期不列大戶訊號
    const a = s.analysis;
    const bars = s.ohlcv;
    const last = bars[bars.length - 1];
    const vols = bars.map(b => b.volume);
    const n = Math.min(20, vols.length - 1);
    const avg20 = vols.slice(-n - 1, -1).reduce((x, y) => x + y, 0) / Math.max(1, n); // 股
    const avgZ = avg20 / 1000; // 張
    const net = (s.foreign ?? 0) + (s.investment ?? 0) + (s.dealer ?? 0); // 三大法人合計（張）
    const st = instStreak(s.id);

    // ── 大量買入跡象（必須有法人籌碼證據，單純爆量不算大戶） ──
    const sig = [];
    if (net >= 500 && avgZ > 0 && net / avgZ >= 0.15)
      sig.push(`法人買超 ${net.toLocaleString()} 張，約當近 20 日均量的 ${(net / avgZ * 100).toFixed(0)}%`);
    else if (net >= 3000)
      sig.push(`法人大量買超 ${net.toLocaleString()} 張`);
    if (st?.dir > 0 && st.days >= 3)
      sig.push(`法人連續 ${st.days} 日買超（累計 ${st.total.toLocaleString()} 張）`);
    // 集保千張大戶增持：週度證據，可獨立成立（不需當日法人買超）
    const td = s._tdccTrend;
    if (td?.dir > 0 && td.dBig >= 0.3)
      sig.push(`集保千張大戶持股週增 ${td.dBig} 個百分點至 ${td.big}%${td.streak >= 2 ? `（連 ${td.streak} 週增持）` : ''}`);
    if (!sig.length) continue;
    if (avg20 > 0 && last.volume >= avg20 * 2.2 && last.close > last.open)
      sig.push(`今日量能為均量 ${(last.volume / avg20).toFixed(1)} 倍且收紅`);

    // ── 盤中大單掛買（僅開盤時段；MIS 無五檔資料就跳過，偵測不到就算了） ──
    let book = null;
    // 優先用即時批次報價已存下的五檔（不用另外打 MIS）；沒有才單獨補抓
    const cached = s._book && Date.now() - s._book.at <= 3 * 60 * 1000 ? s._book : null;
    if (marketOpen && cached && cached.bid && cached.ask) {
      book = { bid: cached.bid, ask: cached.ask, ratio: cached.ratio, price: s.analysis?.price, low: null };
      if (cached.bid >= cached.ask * 2 && cached.bid >= 300)
        sig.push(`盤中五檔委買 ${cached.bid.toLocaleString()} 張，為委賣的 ${cached.ratio.toFixed(1)} 倍（大單掛買）`);
    } else if (marketOpen && bookProbes < 12) {
      bookProbes++;
      try {
        const q = await fetchRealtimeQuote(s.id);
        const bid = (q?.bidV || []).reduce((x, y) => x + y, 0);
        const ask = (q?.askV || []).reduce((x, y) => x + y, 0);
        if (bid && ask) {
          book = { bid, ask, ratio: bid / ask, price: q.price, low: q.low };
          if (bid >= ask * 2 && bid >= 300)
            sig.push(`盤中五檔委買 ${bid.toLocaleString()} 張，為委賣的 ${(bid / ask).toFixed(1)} 倍（大單掛買）`);
        }
      } catch {}
    }

    // ── 陷阱判斷（誘多 / 拉高出貨跡象） ──
    const m = buildManagerAnalysis(s);
    const trap = [];
    const range = last.high - last.low;
    if (range > 0 && avg20 > 0 && last.volume >= avg20 * 2 && (last.high - Math.max(last.open, last.close)) / range >= 0.45)
      trap.push('爆量收長上影線 — 高檔邊拉邊出，疑似出貨');
    if (a.pctile?.zone === 'high' && a.rsi >= 75)
      trap.push(`位於長期高位階且 RSI ${a.rsi.toFixed(0)} 過熱 — 此時的買超常是誘多`);
    if (a.ema20 && last.close > a.ema20 * 1.12)
      trap.push('股價乖離 EMA20 逾 12% — 短線過熱，大戶可能藉利多調節');
    if (m && m.dir <= 0)
      trap.push(`技術結構為「${m.stance}」— 買超與結構背離，可能是接刀或對倒`);
    if (m?.oi?.dFin > 0 && avgZ > 0 && m.oi.dFin >= avgZ * 0.1)
      trap.push(`融資單日大增 ${m.oi.dFin.toLocaleString()} 張 — 散戶跟風重，籌碼轉髒`);
    // 最強的陷阱訊號之一：帳面法人買超但集保大戶其實在減碼（單日買超掩護出貨）
    if (td?.dir < 0 && td.dBig <= -0.3)
      trap.push(`集保千張大戶持股週減 ${Math.abs(td.dBig)} 個百分點 — 單日法人買超與大戶減碼背離，慎防買超掩護出貨`);
    if (s._alert?.level === 'punish') trap.push('處置股 — 分盤交易，流動性陷阱');
    else if (s._alert) trap.push('注意股 — 波動異常已被交易所警示');
    if (book && book.ratio >= 2 && book.price != null && book.low != null && book.price <= book.low * 1.005)
      trap.push('大量掛買但股價貼盤中低點 — 掛單撐盤假象，慎防誘多掛單（掛單可隨時抽單）');

    results.push({ s, m, sig, trap, book, net, mktBad: (outlookData.norm ?? 0) <= -15 });
  }

  results.sort((x, y) => y.net - x.net);
  _whaleResults = results.slice(0, 10);
  renderWhales();
  // 不再推播 Telegram — 乾淨的偵測結果改寫進交易建議的進場理由（whaleFor），
  // 儀表板與流水帳仍完整記錄
  for (const r of _whaleResults) {
    if (r.trap.length || !r.sig?.length) continue;
    logSignal('whale', `${r.s.name}（${r.s.id}）大戶動向（已過陷阱檢查）`,
      r.sig.join('；'), { id: r.s.id, dir: 1, dedupKey: r.s.id });
  }
}

function renderWhales() {
  const el = document.getElementById('whale-body');
  if (!el) return;
  if (!_whaleResults.length) {
    el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">今日未偵測到大戶大量買入（法人買超佔均量 15% 以上或連 3 日買超）。掛單偵測僅盤中有效。</p>';
    return;
  }
  el.innerHTML = _whaleResults.map(r => {
    const clean = !r.trap.length;
    const c = clean ? 'var(--bull)' : 'var(--yellow)';
    return `
    <div style="padding:10px 12px;border-radius:9px;background:${c}0a;border-left:3px solid ${c};margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.86rem;cursor:pointer" onclick="openStock('${r.s.id}')">${r.s.name} <span style="color:var(--text3);font-size:0.72rem">${r.s.id}</span></strong>
        <span style="font-size:0.68rem;font-weight:700;color:${c}">${clean ? '✅ 陷阱檢查通過' : '⚠ 疑似陷阱，不推送'}</span>
        ${r.m ? `<span style="margin-left:auto;font-size:0.7rem;color:${r.m.stanceColor}">${r.m.stance}</span>` : ''}
      </div>
      <div style="font-size:0.75rem;color:var(--text2);margin-top:4px;line-height:1.6">${r.sig.map(t => '・' + t).join('<br>')}</div>
      ${r.trap.length ? `<div style="font-size:0.73rem;color:var(--yellow);margin-top:4px;line-height:1.6">${r.trap.map(t => '⚠ ' + t).join('<br>')}</div>` : ''}
    </div>`;
  }).join('');
}

// ── 全市場大戶粗篩：法人買超佔成交比異常高、但不在掃描清單的股票 ─────────
// 深度分析需要 14 個月歷史（重），所以先用兩份「本來就在抓」的全市場快照粗篩：
// T86 全市場法人買賣超 × STOCK_DAY_ALL 全市場行情 → 候選按一鍵加入自選深掃。

let _screenResults = null;

// 法人自動追蹤清單：粗篩合格者自動納入下輪掃描（毋須手動加入），
// 連續 7 天未再入榜自動移除，上限 10 檔避免清單無限膨脹
function getAutoStocks() {
  try { return JSON.parse(localStorage.getItem('auto-stocks') || '[]'); } catch { return []; }
}
function updateAutoStocks(cands) {
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  let autos = getAutoStocks().filter(a => (a.lastHit || '') >= cutoff);
  for (const c of cands) {
    const ex = autos.find(a => a.id === c.id);
    if (ex) { ex.lastHit = today; ex.name = c.name; }
    else autos.push({ id: c.id, name: c.name, sector: '法人動向', lastHit: today, auto: true });
  }
  autos = autos.slice(-10);
  try { localStorage.setItem('auto-stocks', JSON.stringify(autos)); } catch {}
  return autos;
}

async function marketWideWhaleScreen() {
  const [t86, day] = await Promise.all([
    fetchT86Parsed().catch(() => null),
    fetchTWDayAll().catch(() => null),
  ]);
  if (!t86 || !day) { _screenResults = null; renderMarketScreen(); return; }
  const inList = new Set(getStockList().map(x => x.id));
  const cands = [];
  for (const r of t86) {
    const net = r.foreign + r.investment + (r.dealer || 0); // 三大法人合計（張）
    if (net < 1000) continue;                  // 買超規模門檻
    const q = day[r.id];
    if (!q?.close || !q.volume) continue;
    const volZ = q.volume / 1000;              // 股 → 張
    if (volZ < 2000) continue;                 // 流動性門檻（太冷門不碰）
    const ratio = net / volZ;
    if (ratio < 0.10) continue;                // 法人買超 ≥ 當日成交量 10%
    if (q.chg != null && q.chg < 0) continue;  // 收跌不追（避免接刀情境）
    cands.push({ id: r.id, name: q.name || r.name || r.id, net, ratio,
                 close: q.close, chg: q.chg, inList: inList.has(r.id) });
  }
  cands.sort((a, b) => b.ratio - a.ratio);
  _screenResults = cands.filter(c => !c.inList).slice(0, 10);
  // 合格者自動納入下輪掃描 — 不必手動按加入
  updateAutoStocks(_screenResults);
  renderMarketScreen();
}

function renderMarketScreen() {
  const el = document.getElementById('whale-screen-body');
  if (!el) return;
  if (_screenResults == null) {
    el.innerHTML = '<p style="font-size:0.76rem;color:var(--text3)">全市場法人資料暫時無法取得（非交易日或來源異常），下輪掃描自動重試。</p>';
    return;
  }
  if (!_screenResults.length) {
    el.innerHTML = '<p style="font-size:0.76rem;color:var(--text3)">今日清單外沒有「法人買超佔成交比 ≥10%」的標的（門檻：買超 ≥1000 張、成交 ≥2000 張、收紅）。</p>';
    return;
  }
  el.innerHTML = _screenResults.map(c => `
    <div style="display:flex;align-items:center;gap:8px;font-size:0.78rem;padding:6px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
      <strong style="cursor:pointer" onclick="openStock('${c.id}')">${c.name} <span style="color:var(--text3);font-size:0.7rem">${c.id}</span></strong>
      <span style="color:var(--text3);font-size:0.72rem;font-family:var(--mono)">收 ${c.close}${c.chg != null ? `（${c.chg >= 0 ? '+' : ''}${c.chg}）` : ''}</span>
      <span style="color:var(--blue);font-size:0.72rem">法人買超 ${c.net.toLocaleString()} 張・佔成交 ${(c.ratio * 100).toFixed(0)}%</span>
      <span style="margin-left:auto;font-size:0.68rem;color:var(--bull)">✓ 已自動納入掃描</span>
      <button class="btn-ghost" style="padding:3px 10px;font-size:0.68rem" onclick="addWatchStock('${c.id}','${c.name}')">＋轉正式自選</button>
    </div>`).join('') +
    '<div style="font-size:0.68rem;color:var(--text3);margin-top:6px">合格者已自動納入下輪掃描做完整技術/籌碼/陷阱分析（連 7 天未再入榜自動移除）；按「轉正式自選」可永久保留</div>';
}

function addWatchStock(id, name) {
  const list = getStockList();
  if (list.find(x => x.id === id)) { showToast('已在掃描清單中', 'info'); return; }
  const full = list === DEFAULT_STOCKS ? [...DEFAULT_STOCKS] : list;
  full.push({ id, name, sector: '自訂' });
  localStorage.setItem('custom-stocks', JSON.stringify(full));
  const c = (_screenResults || []).find(x => x.id === id);
  if (c) c.inList = true;
  showToast(`已加入 ${name}(${id})，下輪掃描納入完整分析`, 'success');
  _screenResults = (_screenResults || []).filter(x => x.id !== id);
  renderMarketScreen();
  try { renderCustomStocksList(); } catch {}
}

// 通知去重一律用「資料日期」而非日曆日期：法人/日 K 是盤後資料，
// 過午夜日曆換日但資料沒換 — 用日曆去重會在半夜把同一份資料重推一次。
function notifyDataDate() {
  const t86 = localStorage.getItem('t86-last-date');
  if (t86) return t86;
  const s = allStocks.find(x => x.ohlcv?.length);
  return s ? s.ohlcv[s.ohlcv.length - 1].time.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

// 【已退出自動排程】大戶訊號不再獨立推播 — 乾淨的偵測結果由 whaleFor()
// 寫進交易建議的進場理由，流水帳照記。保留函式供手動觸發。
function notifyWhales() {
  if (!tgWants('sig')) return;
  if (!inNotifyWindow()) return;   // 假日與非交易時段不推播
  // 「每檔一天一次」以日曆日界定：資料日翻面時重置清單會把上午發過的重發
  const calDay = twClock().date;
  let sent;
  try { sent = JSON.parse(localStorage.getItem('whale-tg') || '{}'); } catch { sent = {}; }
  if (sent.date !== calDay) sent = { date: calDay, ids: [] };
  const clean = _whaleResults.filter(r => !r.trap.length && !sent.ids.includes(r.s.id));
  if (!clean.length) return;

  for (const r of clean.slice(0, 3)) {
    const p = r.m ? buildEntryPlan(r.s, r.m) : null;
    const anal = [
      `研判：${r.m ? `${r.m.stance}（一致性 ${(r.m.agr * 100).toFixed(0)}%）` : '--'}`,
      p?.ok ? `進場參考 ${p.lo} ~ ${p.hi}｜停損 ${p.stop}（-${p.riskPct.toFixed(1)}%）｜${p.holdOn ? '上方無壓力，續抱看待' : `目標 ${p.t1}`}` : (p?.why ? `暫不建議進場：${p.why}` : ''),
      r.mktBad ? '⚠ 大盤目前偏空，部位宜保守' : '',
    ].filter(Boolean).join('\n');
    tgPush(`🐋 大戶動向：${r.s.name}(${r.s.id})\n\n${r.sig.map(t => '・' + t).join('\n')}\n\n陷阱檢查：未發現誘多/出貨跡象 ✅\n\n📋 交易分析\n${anal}\n\n⚠ 僅供參考，非投資建議`);
    logSignal('whale', `${r.s.name}（${r.s.id}）大戶動向（已過陷阱檢查）`,
      r.sig.join('；'), { id: r.s.id, dir: 1, dedupKey: r.s.id });
    sent.ids.push(r.s.id);
  }
  localStorage.setItem('whale-tg', JSON.stringify(sent));
}

// ── 交易紀錄（結案後的檢討資料庫）───────────────────────────────────────────
function getJournal() {
  try { return JSON.parse(localStorage.getItem('trade-journal') || '[]'); } catch { return []; }
}
function saveJournal(j) { localStorage.setItem('trade-journal', JSON.stringify(j.slice(-500))); }

// 出場原因自動分類（可在紀錄頁補充教訓）
function classifyExit(h, exitPrice, s) {
  const m = s?.analysis ? buildManagerAnalysis(s) : null;
  if (exitPrice <= h.stop * 1.005) return '跌破停損';
  if (h.t1 && exitPrice >= h.t1 * 0.995) return '達目標停利';
  if (m && m.dir <= -1) return '研判轉空出場';
  return exitPrice >= h.entry ? '獲利了結（手動）' : '停損出場（手動）';
}

// 交易評分（1~5 星）：從紀律與品質面向給分，低於 3 星列出可改進重點
function rateTrade(h, exit, retPct, reason, s) {
  const notes = [];
  let stars = 3; // 基準：有進場、有停損、正常出場
  // 評分一律用「原始停損」：移動停損上移後 h.stop 可能等於成本，
  // 若用它算 R 會失真（risk→0），凹單/紀律判定也要對原始計畫衡量
  const risk = h.entry - (h.stop0 ?? h.stop);
  const rMult = risk > 0 ? (exit - h.entry) / risk : null; // R 倍數

  // ── 加分項 ──
  if (rMult != null && rMult >= 2) stars += 1;                      // 抓到 2R 以上的行情
  else if (rMult != null && rMult >= 1) stars += 0.5;
  if (retPct < 0 && exit >= h.stop * 0.99) stars += 1;              // 虧損但紀律停損（在停損價附近出場）
  if (h.t1 && exit >= h.t1 * 0.995) stars += 0.5;                   // 按計畫達目標出場

  // ── 扣分項（每項附改進重點） ──
  if (retPct < 0 && risk > 0 && exit < h.stop * 0.97) {
    stars -= 1.5;
    notes.push(`出場價 ${exit} 已低於停損 ${h.stop} 達 ${((h.stop - exit) / h.stop * 100).toFixed(1)}% — 凹單擴大虧損。改進：跌破停損當日就執行，不等反彈`);
  }
  if (h.planHi && h.entry > h.planHi * 1.01) {
    stars -= 1;
    notes.push(`進場價 ${h.entry} 高於建議區上緣 ${h.planHi} — 追價使停損距離變大。改進：只在建議區間內掛單，錯過就放掉`);
  }
  if (h.kind === 'day') {
    const heldDays = Math.round((new Date(new Date().toISOString().slice(0, 10)) - new Date(h.addedAt)) / 86400000);
    if (heldDays > 5) {
      stars -= 1;
      notes.push(`當沖單持有 ${heldDays} 天 — 當沖失敗轉存股是常見虧損放大來源。改進：當沖單收盤前未達預期就出場，不轉長線`);
    }
  }
  if (retPct < 0 && h.ctx?.rsi >= 70) notes.push(`進場時 RSI ${h.ctx.rsi} 已過熱 — 高檔追多勝率偏低。改進：等 RSI 回落 60 以下再進場`);
  if (retPct < 0 && h.ctx?.agr != null && h.ctx.agr < 0.4) notes.push(`進場時訊號一致性僅 ${(h.ctx.agr * 100).toFixed(0)}% — 多空分歧時進場等同賭方向。改進：等證據收斂`);
  if (retPct < 0 && h.ctx?.mktNorm <= -15) notes.push(`進場時大盤偏空（${h.ctx.mktNorm}）— 逆風做多難度高。改進：空頭市場降低進場頻率與部位`);
  if (retPct < 0 && !notes.length) notes.push('進場情境無明顯違規，屬正常停損 — 檢視是否單筆部位過大，虧損控制在總資金 2% 內即可');

  stars = Math.max(1, Math.min(5, Math.round(stars)));
  return { stars, notes };
}

// 結案：輸入實際出場價 → 評分 → 寫入交易紀錄 → 移出持倉
function closeHolding(stockId) {
  const holdings = getHoldings();
  const h = holdings.find(x => x.id === stockId);
  if (!h) return;
  const s = allStocks.find(x => x.id === stockId);
  const cur = s?.analysis?.price;
  const input = prompt(`結案「${h.name}(${stockId})」\n成本 ${h.entry}｜停損 ${h.stop}${h.t1 ? `｜目標 ${h.t1}` : ''}\n\n請輸入實際出場價：`, cur ? cur.toFixed(2) : '');
  if (input === null) return;
  const exit = parseFloat(input);
  if (!isFinite(exit) || exit <= 0) { showToast('出場價格式不正確', 'error'); return; }

  // 除息還原：報酬含息、停損基準平移，除息缺口不算虧損也不算凹單
  const div = s ? exDivAdjust(s.ohlcv, h.addedAt) : 0;
  const hAdj = div > 0 ? { ...h, stop: +(h.stop - div).toFixed(2), t1: h.t1 ? +(h.t1 - div).toFixed(2) : null } : h;
  const retPct = +((exit + div - h.entry) / h.entry * 100).toFixed(2);
  const reason = classifyExit(hAdj, exit, s);
  const rating = rateTrade(hAdj, exit, retPct, reason, s);
  const journal = getJournal();
  journal.push({
    id: stockId, name: h.name, entry: h.entry, exit: +exit.toFixed(2),
    entryDate: h.addedAt, exitDate: new Date().toISOString().slice(0, 10),
    retPct, reason, ctx: h.ctx ?? null, lesson: '',
    src: h.src ?? 'ai', kind: h.kind ?? 'long',
    stars: rating.stars, review: rating.notes,
    ...(div > 0 ? { divAdj: div } : {}),
  });
  saveJournal(journal);
  saveHoldings(holdings.filter(x => x.id !== stockId));
  const starStr = '★'.repeat(rating.stars) + '☆'.repeat(5 - rating.stars);
  showToast(`已結案 ${h.name}：${retPct >= 0 ? '+' : ''}${retPct}%（${reason}）評分 ${starStr}`, retPct >= 0 ? 'success' : 'error');
  renderHoldings(); renderJournal();
  if (tgWants('sig')) tgPush(`📒 交易結案\n\n${h.name}(${stockId}) ${reason}\n進場 ${h.entry} → 出場 ${exit}\n報酬 ${retPct >= 0 ? '+' : ''}${retPct}%`);
}

function setLesson(idx) {
  const journal = getJournal();
  const t = journal[idx];
  if (!t) return;
  const input = prompt(`「${t.name}」${t.reason}（${t.retPct >= 0 ? '+' : ''}${t.retPct}%）\n\n這筆交易學到什麼？（判斷錯在哪、下次怎麼避免）`, t.lesson || '');
  if (input === null) return;
  t.lesson = input.trim();
  saveJournal(journal);
  renderJournal();
}

// 教訓學習：從虧損交易的進場情境歸納重複犯的錯 → 回饋到進場建議
function journalInsights() {
  const aiLosses = getAiSignals().filter(t => t.status === 'loss' && t.ctx)
    .map(t => ({ ...t, retPct: t.retPct ?? -1 }));
  const losses = [...getJournal().filter(t => t.retPct < 0 && t.ctx), ...aiLosses];
  const pat = [];
  // 樣本分級：2~4 筆僅屬「觀察中」（統計上不足以下結論），滿 5 筆才是正式警告
  const count = (label, fn, advice) => {
    const n = losses.filter(fn).length;
    if (n >= 2) pat.push({ label, n, advice, grade: n >= 5 ? 'firm' : 'weak' });
  };
  count('RSI 過熱時進場', t => t.ctx.rsi >= 70, '進場前 RSI ≥70 的虧損已重複發生，等回檔至 60 以下再進場');
  count('訊號分歧仍進場', t => t.ctx.agr != null && t.ctx.agr < 0.4, '證據一致性 <40% 時進場的虧損偏多，等訊號收斂');
  count('高檔位階追價', t => t.ctx.pctile === 'high', '在 90% 以上高位階進場的虧損偏多，避免追離長期底部太遠的價位');
  count('大盤逆風做多', t => t.ctx.mktNorm <= -15, '大盤偏空時做多的虧損偏多，空頭市場應降低進場頻率');
  // 產業集中虧損
  const bySector = {};
  losses.forEach(t => { if (t.ctx.sector) bySector[t.ctx.sector] = (bySector[t.ctx.sector] || 0) + 1; });
  Object.entries(bySector).filter(([, n]) => n >= 3)
    .forEach(([sec, n]) => pat.push({ label: `${sec}族群連續虧損`, n, advice: `在${sec}族群已虧損 ${n} 筆，該族群的判斷模型可能失準，暫時降低該族群部位`, grade: n >= 5 ? 'firm' : 'weak' }));
  return pat;
}

// ── 我的持倉：每日檢查出場訊號 ──────────────────────────────────────────────
// 不做自動撮合，只記錄你實際買進的部位，每輪掃描重新評估是否該離場。

// ── 交易成本（牌告價，未含券商折扣）──────────────────────────────────────
// 買賣手續費各 0.1425%＋證交稅 0.3%（現股當沖稅減半 0.15%）。
// 當沖若預期價差吃不下來回成本的 2 倍，這筆單期望值是負的，不該給。
function tradeCostPct(kind = 'long') {
  return kind === 'day' ? +(0.1425 * 2 + 0.15).toFixed(3) : +(0.1425 * 2 + 0.3).toFixed(3);
}

// ── 組合風險總量（Portfolio Heat）───────────────────────────────────────────
// 單筆 2% 的限制擋不住「五檔各 2% 同時停損 = -10%」，也看不出
// 三檔同族群其實是同一注押三次。這裡把兩件事都攤開。
function portfolioHeat() {
  const holdings = getHoldings();
  if (!holdings.length) return null;
  const capital = parseFloat(localStorage.getItem('capital') || '1000000');
  let riskAmt = 0, knownN = 0, unknownN = 0;
  const rows = holdings.map(h => {
    // 停損已上移超過成本（鎖利）→ 該筆風險為 0，不是負數
    const perShare = Math.max(0, (h.entry ?? 0) - (h.stop ?? 0));
    const riskPct = h.entry > 0 ? perShare / h.entry * 100 : null;
    let amt = null;
    if (h.qty > 0) { amt = perShare * h.qty * 1000; riskAmt += amt; knownN++; }
    else unknownN++;
    return { h, riskPct, amt };
  });
  const heat = knownN && capital > 0 ? +(riskAmt / capital * 100).toFixed(2) : null;
  // 族群集中度：同族群 ≥2 檔，同漲同跌，等於同一注加倍押
  const list = getStockList();
  const bySec = {};
  for (const h of holdings) {
    const sec = list.find(x => x.id === h.id)?.sector
      || allStocks.find(x => x.id === h.id)?.sector || null;
    if (sec) (bySec[sec] = bySec[sec] || []).push(h.name);
  }
  const conc = Object.entries(bySec).filter(([, v]) => v.length >= 2)
    .map(([sec, names]) => ({ sec, names }));
  return { rows, heat, riskAmt: Math.round(riskAmt), capital, knownN, unknownN, conc,
           over: heat != null && heat >= 6 };
}

// 組合風險已滿時，新倉推薦要附警告（不藏訊號，但把總量狀態講清楚）
function heatWarning() {
  const ph = portfolioHeat();
  if (!ph) return null;
  if (ph.over) return `⚠ 組合風險已達 ${ph.heat}%（全部持倉同時停損的總虧損，上限 6%）— 新倉建議暫緩，或先降既有部位`;
  if (ph.conc.length) return `⚠ 族群集中：${ph.conc.map(c => `${c.sec}（${c.names.join('、')}）`).join('；')} — 同族群同漲同跌，等於同一注加倍押`;
  return null;
}

function setHoldingQty(stockId) {
  const holdings = getHoldings();
  const h = holdings.find(x => x.id === stockId);
  if (!h) return;
  const input = prompt(`「${h.name}」持有幾張？（1 張 = 1000 股，可填小數如 0.5 表示零股 500 股）`, h.qty || '');
  if (input === null) return;
  const qty = parseFloat(input);
  if (!isFinite(qty) || qty <= 0) { showToast('張數格式不正確', 'error'); return; }
  h.qty = qty;
  saveHoldings(holdings);
  renderHoldings();
  showToast(`已記錄 ${h.name} 持有 ${qty} 張`, 'success');
}

// 財報季報截止日（固定法規日期，不需 API）：5/15 Q1、8/14 Q2、11/14 Q3、3/31 年報。
// 截止日前常見「壓底線」公布，前後易暴雷跳空 — 持倉在截止日 5 天內給警示。
function earningsDeadline(withinDays = 5) {
  const today = twClock().date;
  const y = +today.slice(0, 4);
  const dl = [
    { d: `${y}-03-31`, label: '年報' }, { d: `${y}-05-15`, label: '第一季財報' },
    { d: `${y}-08-14`, label: '第二季財報' }, { d: `${y}-11-14`, label: '第三季財報' },
    { d: `${y + 1}-03-31`, label: '年報' },
  ];
  for (const e of dl) {
    const days = Math.round((new Date(e.d + 'T00:00:00Z') - new Date(today + 'T00:00:00Z')) / 86400000);
    if (days >= 0 && days <= withinDays) return { ...e, days };
  }
  return null;
}

// ── 持倉事件風險：未來除權息日警示（TWT48U 預告表）────────────────────────
let _exDivCal = null;   // fetchExDivCalendar 結果，掃描時載入
function upcomingExDiv(stockId, withinDays = 7) {
  if (!_exDivCal?.length) return null;
  const ev = _exDivCal.find(e => e.id === stockId);
  if (!ev) return null;
  const today = twClock().date;
  const days = Math.round((new Date(ev.date + 'T00:00:00Z') - new Date(today + 'T00:00:00Z')) / 86400000);
  if (days < 0 || days > withinDays) return null;
  return { ...ev, days };
}

function getHoldings() {
  try { return JSON.parse(localStorage.getItem('my-holdings') || '[]'); } catch { return []; }
}
function saveHoldings(h) { localStorage.setItem('my-holdings', JSON.stringify(h)); }

function addHolding(stockId, kind = 'long') {
  const s = allStocks.find(x => x.id === stockId);
  if (!s?.analysis) { showToast('資料未就緒，稍後再試', 'error'); return; }
  const holdings = getHoldings();
  if (holdings.some(h => h.id === stockId)) { showToast('此股已在持倉清單中', 'info'); return; }

  const m = buildManagerAnalysis(s);
  const p = buildEntryPlan(s, m);
  const def = s.analysis.price.toFixed(2);
  const input = prompt(`記錄「${s.name}(${stockId})」的持倉\n\n請輸入你的實際買進均價：`, def);
  if (input === null) return;
  const entry = parseFloat(input);
  if (!isFinite(entry) || entry <= 0) { showToast('進場價格式不正確', 'error'); return; }
  // 張數（選填）：有張數才能算組合風險總量；跳過也能記錄
  const qtyIn = prompt('持有幾張？（選填，用於組合風險計算；1 張 = 1000 股，可填 0.5 表示零股）', '');
  const qty = qtyIn !== null && isFinite(parseFloat(qtyIn)) && parseFloat(qtyIn) > 0 ? parseFloat(qtyIn) : null;

  holdings.push({
    id: stockId, name: s.name, entry: +entry.toFixed(2), qty,
    stop: p?.ok ? p.stop : +(entry * 0.93).toFixed(2),
    t1: p?.ok && p.t1 ? p.t1 : null,
    src: 'ai', kind: kind === 'day' ? 'day' : 'long',
    planLo: p?.ok ? p.lo : null, planHi: p?.ok ? p.hi : null,
    addedAt: new Date().toISOString().slice(0, 10),
    // 進場情境快照 — 結案後檢討「當時憑什麼進場」的依據
    ctx: {
      score: s.analysis.score, rsi: s.analysis.rsi != null ? +s.analysis.rsi.toFixed(1) : null,
      adx: s.analysis.adx != null ? +s.analysis.adx.toFixed(1) : null,
      stance: m?.stance ?? null, agr: m ? +m.agr.toFixed(2) : null,
      pctile: s.analysis.pctile?.zone ?? null,
      ext20: s.analysis.ema20 ? +((s.analysis.price / s.analysis.ema20 - 1) * 100).toFixed(1) : null,
      trend: s.analysis.trend?.phase ?? null,
      maturity: s.analysis.trend?.maturity ?? null,
      sector: getStockList().find(x => x.id === stockId)?.sector ?? null,
      mktNorm: Math.round(outlookData.norm ?? 0),
      reasons: (m?.bull ?? []).slice(0, 3),
      warns: [...(m?.bear ?? []).slice(0, 2), ...(p?.ok && p.rrWarn ? [p.rrWarn] : [])],
    },
  });
  saveHoldings(holdings);
  showToast(`📌 已記錄 ${s.name} 持倉（每日自動檢查出場訊號）`, 'success');
  renderHoldings();
}

function removeHolding(stockId) {
  saveHoldings(getHoldings().filter(h => h.id !== stockId));
  renderHoldings();
}

// 輸入「代號或中文名稱」解析成 {id, name}：
// 先查本地清單與已掃描股票，再查官方全市場行情（上市+上櫃皆有名稱）
async function resolveStock(input) {
  const q = String(input || '').trim();
  if (!q) return null;
  if (/^\d{4,6}[A-Z]?$/.test(q)) {
    const local = getStockList().find(x => x.id === q) || allStocks.find(x => x.id === q);
    if (local) return { id: q, name: local.name };
    const all = await fetchTWDayAll().catch(() => null);
    return { id: q, name: all?.[q]?.name || q };
  }
  // 中文名稱：本地精確 → 官方精確 → 官方部分符合（唯一才採用，多筆回列表請使用者選）
  const local = getStockList().find(x => x.name === q) || allStocks.find(x => x.name === q);
  if (local) return { id: local.id, name: local.name };
  const all = await fetchTWDayAll().catch(() => null);
  if (all) {
    const entries = Object.entries(all).filter(([id, v]) => v.name && isRealStockId(id));
    const exact = entries.find(([, v]) => v.name === q);
    if (exact) return { id: exact[0], name: exact[1].name };
    const partial = entries.filter(([, v]) => v.name.includes(q));
    if (partial.length === 1) return { id: partial[0][0], name: partial[0][1].name };
    if (partial.length > 1) return { ambiguous: partial.slice(0, 6).map(([id, v]) => `${v.name}(${id})`) };
  }
  return null;
}

// ── 自行加入持倉（手動輸入：股票代號或中文名稱／進場價／當沖或長線） ──────
async function addManualHolding() {
  const idEl = document.getElementById('mh-id');
  const priceEl = document.getElementById('mh-price');
  const kindEl = document.getElementById('mh-kind');
  const qtyEl = document.getElementById('mh-qty');
  const qtyV = parseFloat(qtyEl?.value || '');
  const qty = isFinite(qtyV) && qtyV > 0 ? qtyV : null;
  const raw = (idEl?.value || '').trim();
  const entry = parseFloat(priceEl?.value || '');
  const kind = kindEl?.value === 'day' ? 'day' : 'long';
  if (!raw) { showToast('請輸入股票代號或中文名稱', 'error'); return; }
  if (!isFinite(entry) || entry <= 0) { showToast('進場價格式不正確', 'error'); return; }
  const r = await resolveStock(raw);
  if (r?.ambiguous) { showToast(`找到多檔符合「${raw}」：${r.ambiguous.join('、')} — 請輸入完整名稱或代號`, 'info'); return; }
  if (!r) { showToast(`找不到「${raw}」— 請確認代號或中文名稱是否正確（需為上市/上櫃股票）`, 'error'); return; }
  const id = r.id, resolvedName = r.name;
  const holdings = getHoldings();
  if (holdings.some(h => h.id === id)) { showToast('此股已在持倉清單中', 'info'); return; }

  // 不在掃描清單的股票 → 自動加入自選股，下輪掃描即可取得分析資料
  let addedToList = false;
  const list = getStockList();
  if (!list.find(x => x.id === id)) {
    const full = list === DEFAULT_STOCKS ? [...DEFAULT_STOCKS] : list;
    full.push({ id, name: resolvedName, sector: '自訂' });
    localStorage.setItem('custom-stocks', JSON.stringify(full));
    addedToList = true;
  }

  const s = allStocks.find(x => x.id === id);
  const m = s?.analysis ? buildManagerAnalysis(s) : null;
  const p = m ? buildEntryPlan(s, m) : null;
  holdings.push({
    id, name: s?.name || resolvedName, entry: +entry.toFixed(2), qty,
    // 停損：有進場計畫且其停損低於你的進場價就沿用；否則當沖 -3%、長線 -7%
    stop: (p?.ok && p.stop < entry) ? p.stop : +(entry * (kind === 'day' ? 0.97 : 0.93)).toFixed(2),
    t1: p?.ok && p.t1 ? p.t1 : null,
    src: 'manual', kind,
    planLo: p?.ok ? p.lo : null, planHi: p?.ok ? p.hi : null,
    addedAt: new Date().toISOString().slice(0, 10),
    ctx: s?.analysis ? {
      score: s.analysis.score, rsi: s.analysis.rsi != null ? +s.analysis.rsi.toFixed(1) : null,
      adx: s.analysis.adx != null ? +s.analysis.adx.toFixed(1) : null,
      stance: m?.stance ?? null, agr: m ? +m.agr.toFixed(2) : null,
      pctile: s.analysis.pctile?.zone ?? null,
      ext20: s.analysis.ema20 ? +((s.analysis.price / s.analysis.ema20 - 1) * 100).toFixed(1) : null,
      trend: s.analysis.trend?.phase ?? null,
      maturity: s.analysis.trend?.maturity ?? null,
      sector: getStockList().find(x => x.id === id)?.sector ?? null,
      mktNorm: Math.round(outlookData.norm ?? 0),
      reasons: (m?.bull ?? []).slice(0, 3),
      warns: (m?.bear ?? []).slice(0, 2),
    } : null,
  });
  saveHoldings(holdings);
  if (idEl) idEl.value = '';
  if (priceEl) priceEl.value = '';
  if (qtyEl) qtyEl.value = '';
  showToast(`已加入持倉：${s?.name || resolvedName}（${id}・${kind === 'day' ? '當沖單' : '長線單'}）${addedToList ? '，並加入自選掃描清單' : ''}`, 'success');
  renderHoldings();
  if (s?.analysis) showHoldingView(id); // 立即顯示 AI 對此價位的看法
  else if (addedToList) showToast('此股尚未掃描，下輪掃描後即可查看 AI 看法', 'info');
}

// ── 持倉檢視小頁面：AI 對此股與你的進場價的看法 ────────────────────────────
function closeHoldingModal() {
  const el = document.getElementById('holding-modal');
  if (el) el.style.display = 'none';
}

function showHoldingView(stockId) {
  const modal = document.getElementById('holding-modal');
  const title = document.getElementById('holding-modal-title');
  const body = document.getElementById('holding-modal-body');
  if (!modal || !body) return;
  const h = getHoldings().find(x => x.id === stockId);
  if (!h) return;
  const s = allStocks.find(x => x.id === stockId);
  if (title) title.textContent = `${h.name}（${stockId}）${h.kind === 'day' ? '・當沖單' : '・長線單'}`;

  if (!s?.analysis) {
    body.innerHTML = `<div style="font-size:0.82rem;color:var(--text3);line-height:1.8">
      此股尚未完成掃描分析。${getStockList().find(x => x.id === stockId) ? '請等待本輪掃描完成後再開啟。' : '已不在掃描清單，請至設定頁加入自選股。'}<br>
      目前記錄：進場 ${h.entry}｜停損 ${h.stop}${h.t1 ? `｜目標 ${h.t1}` : ''}</div>`;
    modal.style.display = 'flex';
    return;
  }

  const a = s.analysis;
  const price = a.price;
  const m = buildManagerAnalysis(s);
  const retPct = (price - h.entry) / h.entry * 100;
  const ck = checkHoldingExit(h);

  // 你的進場價位於什麼位置（相對支撐 / EMA20 / 現價）
  const posNotes = [];
  if (m?.sup) posNotes.push(h.entry >= m.sup ? `進場價高於支撐 ${m.sup}（支撐仍有效）` : `進場價已低於目前支撐 ${m.sup}`);
  if (a.ema20) posNotes.push(h.entry <= a.ema20 * 1.02 ? `進場價貼近/低於 EMA20（${a.ema20.toFixed(2)}），非追高位` : `進場價高於 EMA20（${a.ema20.toFixed(2)}）約 ${((h.entry / a.ema20 - 1) * 100).toFixed(1)}%`);
  if (h.planHi && h.entry > h.planHi) posNotes.push(`⚠ 進場價 ${h.entry} 高於當時建議區上緣 ${h.planHi}，屬追價進場`);

  // 上方壓力位範圍（排除近 3 根 K 的自身高點，合併 <1% 重複區）
  const highs = s.ohlcv.map(d => d.high);
  const prior = highs.slice(0, -3);
  const resSet = [];
  for (const v of (calcSR(s.ohlcv).resistances || [])) if (v > price * 1.01) resSet.push({ v: +v.toFixed(2), why: '前波壓力區' });
  const pHi20 = prior.length >= 20 ? Math.max(...prior.slice(-20)) : null;
  const pHi60 = prior.length >= 60 ? Math.max(...prior.slice(-60)) : null;
  if (pHi20 > price * 1.01) resSet.push({ v: +pHi20.toFixed(2), why: '前 20 日高點' });
  if (pHi60 > price * 1.01) resSet.push({ v: +pHi60.toFixed(2), why: '前 3 個月高點' });
  if (a.boll?.upper > price * 1.01) resSet.push({ v: +a.boll.upper.toFixed(2), why: '布林上軌' });
  if (a.ob?.resist && a.ob.resist.bottom > price * 1.01) resSet.push({ v: +a.ob.resist.bottom.toFixed(2), why: '空方訂單塊下緣' });
  if (a.vp?.vah > price * 1.01) resSet.push({ v: +a.vp.vah.toFixed(2), why: '價值區上緣 VAH' });
  if (a.vp?.poc > price * 1.01) resSet.push({ v: +a.vp.poc.toFixed(2), why: '最大量價位 POC' });
  resSet.sort((x, y) => x.v - y.v);
  const resMerged = [];
  for (const r0 of resSet) {
    const prev = resMerged[resMerged.length - 1];
    if (prev && (r0.v - prev.v) / prev.v < 0.01) { prev.why += `／${r0.why}`; continue; }
    resMerged.push({ ...r0 });
  }

  const stanceColor = m ? m.stanceColor : 'var(--text2)';
  const retColor = retPct >= 0 ? 'var(--bull)' : 'var(--bear)';
  const lvBadge = ck ? { exit: { t: '🔴 建議出場', c: 'var(--bear)' }, watch: { t: '🟡 留意', c: 'var(--yellow)' }, hold: { t: '🟢 續抱', c: 'var(--bull)' } }[ck.level] : null;

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <span style="font-size:0.82rem;font-weight:700;color:${stanceColor}">AI 研判：${m ? m.stance : '--'}</span>
      ${m ? `<span style="font-size:0.72rem;color:var(--text3)">一致性 ${(m.agr * 100).toFixed(0)}%</span>` : ''}
      ${lvBadge ? `<span style="font-size:0.72rem;font-weight:700;color:${lvBadge.c}">${lvBadge.t}</span>` : ''}
      <span style="margin-left:auto;font-family:var(--mono);font-weight:800;color:${retColor}">${retPct >= 0 ? '+' : ''}${retPct.toFixed(2)}%</span>
    </div>
    <div style="font-size:0.74rem;color:var(--text3);font-family:var(--mono);margin-bottom:10px">
      進場 ${h.entry}｜現價 ${price.toFixed(2)}｜停損 ${h.stop}（-${((h.entry - h.stop) / h.entry * 100).toFixed(1)}%）${h.t1 ? `｜目標 ${h.t1}` : ''}
    </div>
    ${posNotes.length ? `<div style="margin-bottom:10px"><div style="font-size:0.72rem;color:var(--text3);margin-bottom:4px">你的進場價位評估</div>
      <div style="font-size:0.78rem;color:var(--text2);line-height:1.7">${posNotes.map(t => `・${t}`).join('<br>')}</div></div>` : ''}
    <div style="margin-bottom:10px"><div style="font-size:0.72rem;color:var(--text3);margin-bottom:4px">🛑 止損價</div>
      <div style="font-size:0.8rem;color:var(--text1);line-height:1.7">
        目前設定 <b style="font-family:var(--mono)">${h.stop}</b>${m?.sup ? `；技術支撐位 ${m.sup}${a.ema20 ? `、EMA20 ${a.ema20.toFixed(2)}` : ''}` : ''}<br>
        <span style="font-size:0.74rem;color:var(--text3)">${price <= h.stop ? '⚠ 現價已低於停損，建議立即處理' : `距現價 -${((price - h.stop) / price * 100).toFixed(1)}%，跌破代表進場邏輯失效`}</span>
      </div></div>
    <div style="margin-bottom:10px"><div style="font-size:0.72rem;color:var(--text3);margin-bottom:4px">⛰ 上方壓力位範圍</div>
      ${resMerged.length ? `<div style="font-size:0.8rem;color:var(--text1);line-height:1.8">${resMerged.slice(0, 4).map(r0 =>
        `<b style="font-family:var(--mono)">${r0.v}</b> <span style="font-size:0.72rem;color:var(--text3)">（${r0.why}，+${((r0.v / price - 1) * 100).toFixed(1)}%）</span>`).join('<br>')}</div>`
        : '<div style="font-size:0.78rem;color:var(--bull)">上方無明顯壓力區 — 突破近期高點，可採移動停利續抱</div>'}</div>
    ${ck ? `<div style="padding:9px 12px;border-radius:8px;background:rgba(255,255,255,0.03)">
      <div style="font-size:0.72rem;color:var(--text3);margin-bottom:3px">AI 目前建議</div>
      <div style="font-size:0.78rem;color:var(--text2);line-height:1.7">${ck.reasons.join('；')}${ck.trail ? `<br><span style="color:var(--text3);font-size:0.72rem">移動停利參考：${ck.trail}</span>` : ''}</div>
    </div>` : ''}
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn-primary" style="padding:6px 16px;font-size:0.76rem" onclick="closeHoldingModal();closeHolding('${stockId}')">💰 已賣出（結案）</button>
      <button class="btn-ghost" style="padding:6px 16px;font-size:0.76rem" onclick="closeHoldingModal();openStock('${stockId}')">查看完整分析</button>
    </div>`;
  modal.style.display = 'flex';
}

// 自 sinceDate（不含）以來的除權息缺口總額（元）。
// 未還原股價在除息日跳空下跌，但那不是虧損 — 停損/目標/報酬判定都要扣掉這段缺口。
function exDivAdjust(ohlcv, sinceDate) {
  let adj = 0;
  for (let i = 1; i < (ohlcv?.length || 0); i++) {
    const b = ohlcv[i];
    if (!b.exDiv) continue;
    if (sinceDate && !(b.time > sinceDate)) continue;
    adj += b.divAmt != null ? b.divAmt : Math.max(0, ohlcv[i - 1].close - b.open);
  }
  return +adj.toFixed(2);
}

// ── 移動停損自動化：把「大賺小賠」變成機制而不是紀律口號 ──────────────────
// 獲利 ≥1R → 停損上移至成本（保本）；≥2R → 跟隨結構（max(現價-2ATR, EMA20)）。
// 停損只上移不下移；原始停損保留在 stop0 供評分（凹單/紀律判定）使用。
function updateTrailingStops() {
  const holdings = getHoldings();
  if (!holdings.length) return;
  let changed = false;
  for (const h of holdings) {
    const s = allStocks.find(x => x.id === h.id);
    if (!s?.analysis) continue;
    if (h.stop0 == null) { h.stop0 = h.stop; changed = true; }  // 首次記錄原始停損
    const a = s.analysis;
    const price = a.price;
    const div = exDivAdjust(s.ohlcv, h.addedAt);
    const risk0 = h.entry - h.stop0;
    if (risk0 <= 0) continue;
    const rNow = (price + div - h.entry) / risk0;
    let target = null, note = null;
    if (rNow >= 2) {
      const m = buildManagerAnalysis(s);
      const atr = m?.atr || price * 0.02;
      const structTrail = Math.max(price - atr * 2, a.ema20 || 0) ;
      target = +Math.max(h.entry - div, structTrail).toFixed(2);
      note = `已達 +${rNow.toFixed(1)}R，停損上移至結構位 ${target}（鎖住獲利跟隨趨勢）`;
    } else if (rNow >= 1) {
      target = +(h.entry - div).toFixed(2);
      note = `已達 +${rNow.toFixed(1)}R，停損上移至成本 ${target}（保本單）`;
    }
    if (target != null && target > h.stop) {
      h.stop = target;
      h.trailNote = note;
      changed = true;
    }
  }
  if (changed) saveHoldings(holdings);
}

// ── 持倉停損逼近警報（盤中即時）───────────────────────────────────────────
// 每日持倉檢查是「盤後等級」的節奏；但價格逼近停損是「現在就要知道」的事。
// 即時報價每輪 tick 檢查：跌破停損立即推、距停損 1% 內預警，各每檔每日一次。
function checkStopProximity() {
  if (!tgWants('sig') || !inNotifyWindow()) return;
  for (const h of getHoldings()) {
    const s = allStocks.find(x => x.id === h.id);
    const px = s?.analysis?.price;
    if (!(px > 0) || !(h.stop > 0)) continue;
    const div = exDivAdjust(s.ohlcv, h.addedAt);
    const stopAdj = h.stop - div;
    if (px <= stopAdj) {
      if (tgKeySent(`stop-hit:${h.id}`)) continue;
      tgPush(`🚨 停損觸發：${h.name}(${h.id})\n現價 ${px.toFixed(2)} 已跌破停損 ${stopAdj.toFixed(2)}\n依紀律出場 — 「等反彈再賣」是虧損擴大的起點\n⚠ 僅供參考，非投資建議`);
      tgMarkKeys([`stop-hit:${h.id}`]);
      logSignal('exit', `${h.name}（${h.id}）盤中觸發停損`, `現價 ${px.toFixed(2)} ≤ 停損 ${stopAdj.toFixed(2)}`, { id: h.id, dir: -1, dedupKey: `stop-hit-${h.id}` });
    } else if ((px - stopAdj) / px <= 0.01) {
      if (tgKeySent(`stop-near:${h.id}`)) continue;
      tgPush(`⚠️ 逼近停損：${h.name}(${h.id})\n現價 ${px.toFixed(2)}，距停損 ${stopAdj.toFixed(2)} 不到 1%\n先想好：跌破就走，不向下攤平、不臨時移停損\n⚠ 僅供參考，非投資建議`);
      tgMarkKeys([`stop-near:${h.id}`]);
      logSignal('alert', `${h.name}（${h.id}）逼近停損`, `現價 ${px.toFixed(2)}，距停損 ${stopAdj.toFixed(2)} <1%`, { id: h.id, dir: -1, dedupKey: `stop-near-${h.id}` });
    }
  }
}

// ── 持倉健康度：進場之後「這筆交易走得怎麼樣」的階段化管理 ────────────────
// 出場檢查答的是「該不該跑」，健康度答的是「這筆交易現在處於哪個階段、
// 下一步該做什麼」。以 R 倍數（相對原始停損的風險單位）分段：
//   試煉期(<0.5R) → 保護期(0.5~1R) → 保本期(≥1R) → 追蹤期(≥2R)
function holdingHealth(h, s, m) {
  const a = s?.analysis;
  if (!a || !h?.entry) return null;
  const div = exDivAdjust(s.ohlcv, h.addedAt);
  const stop0 = h.stop0 ?? h.stop;
  const risk0 = h.entry - stop0;
  if (!(risk0 > 0)) return null;
  const rNow = +(((a.price + div) - h.entry) / risk0).toFixed(2);

  const stage = rNow >= 2 ? { k: 'trail', txt: '追蹤期（≥2R）', icon: '🏃' }
              : rNow >= 1 ? { k: 'be', txt: '保本期（≥1R）', icon: '🛡' }
              : rNow >= 0.5 ? { k: 'protect', txt: '保護期（0.5~1R）', icon: '🌱' }
              : { k: 'test', txt: '試煉期（<0.5R）', icon: '🥚' };

  const actions = [];
  if (stage.k === 'trail') actions.push(`已達 +${rNow}R — 停損只上移不下調，跟隨 EMA20/2×ATR 追蹤，讓利潤奔跑`);
  else if (stage.k === 'be') {
    if (h.stop < h.entry - div) actions.push(`已達 +${rNow}R 但停損仍在成本之下 — 依紀律上移至成本 ${(h.entry - div).toFixed(2)} 變保本單`);
    else actions.push(`保本單成立（停損 ${h.stop} ≥ 成本）— 最壞打平，可安心持有等 2R`);
  }
  else if (stage.k === 'protect') actions.push('獲利尚未覆蓋風險 — 不加碼，跌回成本下代表進場點失效');
  else if (rNow <= -0.5) actions.push(`已回撤 ${rNow}R — 距停損不遠，禁止向下攤平，觸價就走`);

  // 資金效率：持有超過 10 個交易日仍在原地（<0.3R），資金卡在不會動的地方
  const held = tradingDaysBetween(h.addedAt, twClock().date);
  const stagnant = held != null && held >= 10 && Math.abs(rNow) < 0.3;
  if (stagnant) actions.push(`持有 ${held} 個交易日仍在 ±0.3R 內震盪 — 資金效率差，若無催化劑可考慮換股（時間也是成本）`);

  // 上方最近壓力：接近時先減碼再說
  const res = [];
  if (a.ob?.resist && a.ob.resist.bottom > a.price) res.push(a.ob.resist.bottom);
  if (a.vp?.vah > a.price) res.push(a.vp.vah);
  const nearRes = res.length ? Math.min(...res) : null;
  if (nearRes && (nearRes - a.price) / a.price <= 0.02 && rNow > 0)
    actions.push(`距上方壓力 ${nearRes.toFixed(2)} 不到 2% — 可先減碼一部分，突破站穩再接回`);

  // 健康分數（0~100）：方向 40、R 進度 30、量能行為 15、資金效率 15
  let score = 0;
  const dir = m?.dir ?? 0;
  score += dir >= 3 ? 40 : dir >= 1.5 ? 30 : dir >= 0 ? 18 : dir >= -1.5 ? 8 : 0;
  score += rNow >= 2 ? 30 : rNow >= 1 ? 24 : rNow >= 0.3 ? 16 : rNow >= -0.3 ? 10 : rNow >= -0.7 ? 4 : 0;
  const bt = a.brk?.type;
  score += (bt === 'distribution' || bt === 'churn') ? 2 : (bt === 'breakout-vol' || bt === 'accumulation') ? 15 : 9;
  score += stagnant ? 2 : 15;
  score = Math.min(100, score);
  const tone = score >= 70 ? 'good' : score >= 45 ? 'ok' : 'bad';

  return { rNow, stage, actions, score, tone, held, stagnant, nearRes };
}

// 對單一持倉做出場研判
function checkHoldingExit(h) {
  const s = allStocks.find(x => x.id === h.id);
  if (!s?.analysis) return null;
  const a = s.analysis;
  const price = a.price;
  const m = buildManagerAnalysis(s);
  // 除息還原：報酬含息計算，停損/目標往下平移息值，避免除息跳空被誤判成跌破
  const div = exDivAdjust(s.ohlcv, h.addedAt);
  const stopAdj = +(h.stop - div).toFixed(2);
  const t1Adj = h.t1 ? +(h.t1 - div).toFixed(2) : null;
  const retPct = (price + div - h.entry) / h.entry * 100;
  const reasons = [];
  let level = 'hold';  // hold | watch | exit

  if (div > 0) reasons.push(`持有期間除息 ${div} 元已還原（停損調整為 ${stopAdj}）`);
  if (h.trailNote) reasons.push(`🔒 ${h.trailNote}`);
  if (price <= stopAdj) { level = 'exit'; reasons.push(`跌破停損 ${stopAdj}`); }
  if (m && m.dir <= -1) { level = 'exit'; reasons.push(`研判轉為「${m.stance}」，多方結構失效`); }
  if (a.ema20 && price < a.ema20 && a.ema50 && price < a.ema50) {
    if (level !== 'exit') level = 'watch';
    reasons.push('跌破 EMA20 與 EMA50，短中期均線雙破');
  }
  if (a.diverg?.type === 'bear') {
    if (level !== 'exit') level = 'watch';
    reasons.push('出現量價頂背離，追價動能減弱');
  }
  if (s.foreign != null && s.foreign < -2000) {
    if (level !== 'exit') level = 'watch';
    reasons.push(`外資賣超 ${Math.abs(s.foreign).toLocaleString()} 張`);
  }
  if (s.rev?.yoy != null && s.rev.yoy <= -20) {
    if (level !== 'exit') level = 'watch';
    reasons.push(`月營收年減 ${s.rev.yoy.toFixed(0)}%，基本面轉差`);
  }
  if (t1Adj && price >= t1Adj) {
    if (level === 'hold') level = 'watch';
    reasons.push(`已達目標價 ${t1Adj}${div > 0 ? '（除息還原後）' : ''}，可考慮減碼鎖利`);
  }
  // 事件風險：財報截止日將至 → 暴雷跳空風險（全市場性提醒，不改變出場等級）
  const ed = earningsDeadline(5);
  if (ed) reasons.push(`📅 ${ed.days === 0 ? '今日' : `${ed.days} 天後`}為${ed.label}截止日（${ed.d}）— 財報公布前後波動放大，留意跳空風險`);

  // 事件風險：即將除權息 → 跳空與棄息賣壓，事前提醒（不直接改變出場等級）
  const exEv = upcomingExDiv(h.id, 7);
  if (exEv) {
    if (level === 'hold') level = 'watch';
    reasons.push(`📅 ${exEv.days === 0 ? '今日' : `${exEv.days} 天後（${exEv.date}）`}除權息${exEv.amt ? `（${exEv.type || '息值'} ${exEv.amt} 元）` : ''} — 留意棄息賣壓與跳空，可考慮事件前收緊停損或降部位`);
  }
  // 持倉健康度：階段化管理建議（R 倍數/資金效率/壓力減碼），最多取兩條
  const hh = holdingHealth(h, s, m);
  if (hh) {
    for (const act of hh.actions.slice(0, 2)) reasons.push(`📊 ${act}`);
    // 資金效率差且方向轉平 → 至少升為留意（錢卡著不動也是風險）
    if (hh.stagnant && level === 'hold' && (m?.dir ?? 0) < 1.5) level = 'watch';
  }

  if (!reasons.length) reasons.push(m ? `結構維持「${m.stance}」，續抱` : '結構穩定，續抱');

  return { h, s, price, retPct, level, reasons, stance: m?.stance, health: hh,
           trail: m ? +Math.max(price - (m.atr || price * 0.02) * 2, a.ema20 || 0).toFixed(2) : null };
}

// 組合風險總量卡（持倉清單頂部）
function portfolioHeatHTML() {
  const ph = portfolioHeat();
  if (!ph) return '';
  const heatC = ph.heat == null ? 'var(--text3)' : ph.heat >= 6 ? 'var(--bear)' : ph.heat >= 4 ? 'var(--yellow)' : 'var(--bull)';
  const heatTxt = ph.heat == null
    ? `無法計算 — ${ph.unknownN} 檔未填張數`
    : `${ph.heat}%（約 ${(ph.riskAmt / 10000).toFixed(1)} 萬）${ph.unknownN ? `，另有 ${ph.unknownN} 檔未填張數未計入` : ''}`;
  return `
    <div style="padding:11px 13px;border-radius:9px;background:rgba(255,255,255,0.03);border:1px solid var(--border);margin-bottom:10px">
      <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">
        <span style="font-size:0.78rem;font-weight:700;color:var(--text2)">🌡 組合風險總量</span>
        <span style="font-size:0.82rem;font-weight:800;font-family:var(--mono);color:${heatC}">${heatTxt}</span>
        <span style="font-size:0.68rem;color:var(--text3)">＝ 全部持倉同時觸發停損的總虧損 ÷ 資金 ${(ph.capital / 10000).toFixed(0)} 萬｜上限 6%</span>
      </div>
      ${ph.over ? `<div style="margin-top:6px;padding:6px 10px;background:rgba(239,68,68,0.08);border-left:3px solid var(--bear);border-radius:0 6px 6px 0;font-size:0.74rem;color:var(--bear)">⚠ 總風險超標 — 新倉暫緩；優先把獲利中持倉的停損上移（風險歸零後即可騰出額度）</div>` : ''}
      ${ph.conc.length ? `<div style="margin-top:6px;font-size:0.73rem;color:var(--yellow)">⚠ 族群集中：${ph.conc.map(c => `${c.sec}（${c.names.join('、')}）`).join('；')} — 同族群同漲同跌，等於同一注加倍押</div>` : ''}
    </div>`;
}

function holdingsHTML() {
  const holdings = getHoldings();
  if (!holdings.length)
    return '<p style="font-size:0.8rem;color:var(--text3)">尚無記錄。可在上方表單自行輸入持倉，或在個股分析頁按「📌 記錄我的持倉」，系統每輪掃描會自動檢查出場訊號。</p>';
  // 未掃描到的股票（如剛加入的自選股）也要顯示，只是暫無 AI 評估
  const rows = holdings.map(h => checkHoldingExit(h) ||
    ({ h, price: null, retPct: null, level: 'hold', reasons: ['尚未取得分析資料，等待下輪掃描'], pending: true }));

  const badge = { exit: { t: '🔴 建議出場', c: 'var(--bear)' }, watch: { t: '🟡 留意', c: 'var(--yellow)' }, hold: { t: '🟢 續抱', c: 'var(--bull)' } };
  return portfolioHeatHTML() + rows.map(r => `
    <div style="padding:10px 12px;border-radius:9px;background:${badge[r.level].c}0d;border-left:3px solid ${badge[r.level].c};margin-bottom:8px;cursor:pointer" onclick="showHoldingView('${r.h.id}')" title="點擊查看 AI 對此持倉的看法">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.86rem">${r.h.name} <span style="color:var(--text3);font-size:0.74rem">${r.h.id}</span></strong>
        <span style="font-size:0.64rem;padding:1px 7px;border-radius:8px;background:rgba(255,255,255,0.07);color:var(--text2)">${r.h.kind === 'day' ? '當沖單' : '長線單'}</span>
        <span style="font-size:0.64rem;padding:1px 7px;border-radius:8px;background:${r.h.src === 'manual' ? 'rgba(245,158,11,0.14)' : 'rgba(0,212,255,0.12)'};color:${r.h.src === 'manual' ? 'var(--yellow)' : 'var(--blue)'}">${r.h.src === 'manual' ? '自行購入' : 'AI 建議'}</span>
        <span style="font-size:0.7rem;font-weight:700;color:${badge[r.level].c}">${r.pending ? '⏳ 待掃描' : badge[r.level].t}</span>
        ${r.health ? `<span style="font-size:0.64rem;padding:1px 7px;border-radius:8px;background:rgba(255,255,255,0.06);color:${r.health.tone === 'good' ? 'var(--bull)' : r.health.tone === 'ok' ? 'var(--yellow)' : 'var(--bear)'}" title="持倉健康度（方向/R 進度/量能/資金效率）">${r.health.stage.icon} ${r.health.stage.txt}・${r.health.rNow >= 0 ? '+' : ''}${r.health.rNow}R・健康 ${r.health.score}</span>` : ''}
        <span style="margin-left:auto;font-family:var(--mono);font-weight:700;color:${(r.retPct ?? 0) >= 0 ? 'var(--bull)' : 'var(--bear)'}">${r.retPct == null ? '--' : `${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%`}</span>
      </div>
      <div style="font-size:0.72rem;color:var(--text3);margin-top:3px;font-family:var(--mono)">
        成本 ${r.h.entry}｜現價 ${r.price != null ? r.price.toFixed(2) : '--'}｜停損 ${r.h.stop}${r.h.t1 ? `｜目標 ${r.h.t1}` : '｜無壓力續抱'}${r.h.qty > 0 ? `｜${r.h.qty} 張` : ` <button class="btn-ghost" style="padding:0 7px;font-size:0.64rem" onclick="event.stopPropagation();setHoldingQty('${r.h.id}')">填張數</button>`}
      </div>
      <div style="font-size:0.75rem;color:var(--text2);margin-top:4px;line-height:1.6">${r.reasons.join('；')}</div>
      <div style="margin-top:7px;display:flex;gap:8px">
        <button class="btn-ghost" style="padding:4px 12px;font-size:0.72rem" onclick="event.stopPropagation();closeHolding('${r.h.id}')">💰 已賣出</button>
        <button class="btn-ghost" style="padding:4px 12px;font-size:0.72rem" onclick="event.stopPropagation();showHoldingView('${r.h.id}')">🔍 AI 看法</button>
        <button class="btn-ghost" style="padding:4px 12px;font-size:0.72rem;color:var(--text3)" onclick="event.stopPropagation();removeHolding('${r.h.id}')">移除（不記錄）</button>
      </div>
    </div>`).join('');
}

function renderHoldings() {
  const html = holdingsHTML();
  const a = document.getElementById('holdings-body');
  const b = document.getElementById('holdings-page-body');
  if (a) a.innerHTML = html;
  if (b) b.innerHTML = html;
  renderEntrySignals();
}

// ── 推薦交易的持有週期分類 ─────────────────────────────────────────────────
// 長期（3 個月以上）：長期趨勢結構 + 基本面至少兩項過硬，靠營收/獲利撐 3 個月。
// 短期波段（數日~數週）：通過進場門檻但基本面/長期結構不足以撐長抱。
// 當沖：流動性 + 波動 + 當日動能的獨立篩選（處置/注意股一律排除）。

function classifyLongTerm(s) {
  const a = s.analysis;
  // ── 長抱的報酬來源只有三個：獲利成長、估值合理、資金持續流入。
  //    選入精準度 = 三者都要有證據，缺一不可（過去只要基本面湊兩項就過，太鬆）──

  // 結構前提：站上年線且中期均線多頭排列
  if (!(a.ema200 && a.price > a.ema200)) return null;
  if (!(a.ema50 && a.ema50 > a.ema200)) return null;
  // 防追高：乖離年線 >25% 才入選的長抱，起點就輸 — 等回測季線再說
  const extYear = (a.price / a.ema200 - 1) * 100;
  if (extYear > 25) return null;
  // 長期相對強弱：60 日要贏過大盤 — 長抱弱勢股是報酬率的第一殺手
  const closes = s.ohlcv?.map(b => b.close);
  if (closes?.length >= 61 && _twiiSeries?.length >= 61) {
    const r60 = (a.price - closes[closes.length - 61]) / closes[closes.length - 61] * 100;
    const tw = _twiiSeries.map(b => b.close).filter(v => v > 0);
    const m60 = tw.length >= 61 ? (tw[tw.length - 1] - tw[tw.length - 61]) / tw[tw.length - 61] * 100 : null;
    if (m60 != null && r60 - m60 < 0) return null;   // 60 日輸大盤 → 不長抱
  }

  const why = [`站上年線（乖離 +${extYear.toFixed(0)}%）、中期均線多頭排列`];
  let f = 0;
  // 成長證據（含加速度 — 營收「正在變好」比「曾經好」值錢）
  const rm = revenueMomentum(s.id);
  if (rm?.dir === 1) { f++; why.push(rm.txt); }
  if (s.rev?.yoy >= 10) { f++; why.push(`月營收年增 +${s.rev.yoy.toFixed(0)}%`); }
  if (s.rev?.cumYoy >= 5) { f++; why.push(`累計營收年增 +${s.rev.cumYoy.toFixed(0)}%`); }
  if (s._fin?.grossMargin >= 25) { f++; why.push(`毛利率 ${s._fin.grossMargin.toFixed(0)}%`); }
  if (s._fin?.roe >= 10) { f++; why.push(`ROE ${s._fin.roe.toFixed(0)}%`); }
  // 估值：PE 絕對值之外加 PEG 概念 — 高成長可容忍較高 PE，低成長不行
  if (s._fd?.pe > 0 && s._fd.pe < 25) { f++; why.push(`本益比 ${s._fd.pe.toFixed(1)}x 未過熱`); }
  else if (s._fd?.pe > 0 && s.rev?.yoy > 0 && s._fd.pe / s.rev.yoy <= 1.5) { f++; why.push(`PEG ${(s._fd.pe / s.rev.yoy).toFixed(1)}（成長支撐估值）`); }
  if (s._fd?.divYield >= 0.03) { f++; why.push(`殖利率 ${(s._fd.divYield * 100).toFixed(1)}%`); }
  if (f < 3) return null;   // 由 2 項提高到 3 項 — 長抱要更挑剔

  // 資金流入證據（至少一項）：長抱沒人抬轎，時間只會磨掉耐心
  const flow = [];
  const st = instStreak(s.id);
  if (st?.dir > 0 && st.days >= 3) flow.push(`法人連 ${st.days} 日買超`);
  const td = s._tdccTrend;
  if (td?.dir > 0 && td.dBig >= 0.2) flow.push(`千張大戶持股週增 ${td.dBig}pp`);
  const fg = s._fgnTrend;
  if (fg?.delta > 0) flow.push(`外資持股比率上升中（+${fg.delta}pp）`);
  if (!flow.length) return null;
  why.push(...flow.slice(0, 2));
  return why;
}

// 隔夜跳空預判：ADR/EWT 隱含的開盤方向 → 當沖執行紀律的事前提示。
// 半導體族群與 2330 受 ADR 影響最直接，其他股票以 EWT（整體台股）為準。
function overnightGapNote(s) {
  const o = outlookData.overnight;
  if (!o?.adr) return null;
  const semi = s.id === '2330' || ['半導體', 'IC設計', '記憶體', '封測', '砷化鎵', '半導體檢測'].includes(s.sector);
  const chg = semi ? o.adr.chg1 : (o.ewt?.chg1 ?? o.adr.chg1 * 0.6);
  const src = semi ? '台積電 ADR' : 'EWT 台灣 ETF';
  if (chg > 2.5)
    return { pts: -6, txt: `⚠ 隔夜${src} ${chg >= 0 ? '+' : ''}${chg}% — 明日大機率開高逾 2%，依當沖紀律應放棄追進（開高走低風險）` };
  if (chg > 1)
    return { pts: -1, txt: `隔夜${src} +${chg}% — 明日可能開高，開盤價超過建議區上緣就別追` };
  if (chg < -2)
    return { pts: -5, txt: `⚠ 隔夜${src} ${chg}% — 明日大機率開低，動能訊號已失效` };
  if (chg < -0.5)
    return { pts: -2, txt: `隔夜${src} ${chg}% — 明日恐開低，開低逾 0.5% 依紀律放棄` };
  return { pts: 1, txt: `隔夜${src} ${chg >= 0 ? '+' : ''}${chg}% 持平 — 無不利跳空，訊號有效性維持` };
}

// ── 開盤區間突破（ORB）：當沖的盤中執行訊號 ───────────────────────────────
// 開盤前 30 分鐘（09:00~09:29）高低點畫出區間：帶量站上上緣才追多、
// 跌破下緣放棄。昨晚選的股要不要進，開盤半小時後由這個區間決定。
function orbStatus(s) {
  const today = twClock().date;
  const bars = getIntradayBars(s.id, 5).filter(b => b.time.slice(0, 10) === today);
  const or = bars.filter(b => { const hm = b.time.slice(11); return hm >= '09:00' && hm < '09:30'; });
  if (or.length < 3) return null;                     // 桶數不足（開盤資料不完整）不判
  const hi = +Math.max(...or.map(b => b.high)).toFixed(2);
  const lo = +Math.min(...or.map(b => b.low)).toFixed(2);
  const px = s.analysis?.price;
  if (!(px > 0) || !(hi > lo)) return null;
  const rangePct = +((hi - lo) / lo * 100).toFixed(2);
  const state = px > hi ? 'break-up' : px < lo ? 'break-down' : 'inside';
  const txt = state === 'break-up'
    ? `已站上開盤區間上緣 ${hi}（區間 ${lo}~${hi}，幅 ${rangePct}%）— 順勢訊號成立，回測 ${hi} 不破可進`
    : state === 'break-down'
      ? `跌破開盤區間下緣 ${lo} — 依紀律放棄做多，今日不碰`
      : `仍在開盤區間 ${lo}~${hi} 內（幅 ${rangePct}%）— 等帶量突破上緣再進，別在區間裡猜方向`;
  return { hi, lo, rangePct, state, txt };
}

function computeDayTradePicks() {
  const ready = allStocks.filter(s => s.analysis && s.ohlcv?.length >= 21);
  const out = [];
  for (const s of ready) {
    if (s._alert) continue;                      // 注意/處置股不當沖
    if (s._staleDays >= STALE_LIMIT) continue;   // 資料過期不當沖
    const a = s.analysis;
    const bars = s.ohlcv;
    const last = bars[bars.length - 1];
    const vols = bars.map(b => b.volume);
    const n = Math.min(20, vols.length - 1);
    const avg = vols.slice(-n - 1, -1).reduce((x, y) => x + y, 0) / Math.max(1, n);
    const volZ = last.volume / 1000;
    if (volZ < 5000) continue;                   // 流動性：日成交 5000 張以上
    const m = buildManagerAnalysis(s);
    if (!m || m.dir < 1) continue;               // 至少不偏空
    const atrPct = (m.atr / a.price) * 100;
    if (atrPct < 1.8) continue;                  // 波動要夠，否則沖不出價差
    // 稅費門檻：當沖來回成本約 0.44%（費 0.285%＋當沖稅 0.15%），
    // 實際能吃到的價差抓半個 ATR — 吃不到成本 2 倍的單期望值是負的，不推
    const dayCost = tradeCostPct('day');
    if (atrPct / 2 < dayCost * 2) continue;
    if (!(avg > 0 && last.volume >= avg * 1.3 && last.close > last.open)) continue; // 今日放量收紅
    const rng0 = last.high - last.low;
    if (rng0 > 0 && (last.close - last.low) / rng0 < 0.7) continue; // 收上影長，隔日跟隨力差（回測驗證）
    const prev = bars[bars.length - 2];
    const chg = prev ? (last.close - prev.close) / prev.close * 100 : 0;
    if (chg < 0.5 || chg > 8) continue;          // 太弱沒動能、近漲停追不得

    // ── 籌碼支撐檢查（當沖最怕拉高沒人接）──
    // 法人明顯倒貨（賣超逾當日成交 5%）不列；有買超才給籌碼分數並優先排序
    const net = (s.foreign ?? 0) + (s.investment ?? 0) + (s.dealer ?? 0); // 三大法人合計
    if (net < 0 && Math.abs(net) > volZ * 0.05) continue;
    const st = instStreak(s.id);
    const chipRatio = volZ > 0 ? net / volZ : 0;
    const chips = net > 0
      ? `法人買超 ${net.toLocaleString()} 張（佔成交 ${(chipRatio * 100).toFixed(0)}%）${st?.dir > 0 && st.days >= 2 ? `、連 ${st.days} 日買超` : ''}`
      : '⚠ 法人未明顯站隊 — 拉抬缺乏籌碼支撐，只宜小部位';
    const dFin = m.oi?.dFin;
    const finWarn = dFin != null && dFin > 0 && volZ > 0 && dFin >= volZ * 0.08
      ? `⚠ 融資大增 ${dFin.toLocaleString()} 張，散戶追價籌碼偏髒` : null;

    // ── 當沖成交實證：官方當日沖銷成交量（沒有紀錄代表當天沒人沖或不可當沖）──
    const dt = s._dayTrade;
    const dtRatio = dt?.vol && last.volume > 0 ? dt.vol / last.volume : null;

    // ── 隔夜跳空預判：當沖規則是「開高逾 2% 不追」，ADR 大漲時前一晚就能預知 ──
    const gapWarn = overnightGapNote(s);

    // 漲跌停距離：貼近漲停時追價風險極高（買不到、或買在最高點）
    const ld = limitDistance(s);
    if (ld?.toUp != null && ld.toUp <= 1.5) continue;      // 距漲停 <1.5% 不推當沖
    const limNote = ld?.toUp != null
      ? `距漲停 ${ld.toUp}%（漲停 ${ld.up}）／距跌停 ${ld.toDown}%`
      : null;

    const dtNote = dtRatio != null
      ? `官方當沖成交佔今日量 ${(dtRatio * 100).toFixed(0)}%（可現股當沖、有實際參與者）`
      : '⚠ 官方當日無此股當沖成交紀錄 — 可能不可現股當沖或無人參與，下單前請先確認';

    // 結算日警告：台指期結算當天現貨常有異常拉抬/摜壓，當沖假訊號特別多
    const settleWarn = (() => {
      try { return imminentEvents(0).some(e => e.name.includes('結算')) ? '⚠ 今日台指期結算 — 尾盤易有異常波動，當沖假訊號多，部位減半' : null; }
      catch { return null; }
    })();

    out.push({ s, m, hasChips: net > 0 ? 1 : 0, why: [
      `今日量 ${(last.volume / avg).toFixed(1)} 倍均量收紅（+${chg.toFixed(1)}%）`,
      dtNote,
      ...(limNote ? [limNote] : []),
      chips,
      ...(finWarn ? [finWarn] : []),
      ...(gapWarn ? [gapWarn.txt] : []),
      `日均波動 ${atrPct.toFixed(1)}%、成交 ${Math.round(volZ).toLocaleString()} 張`,
      `來回稅費 ${dayCost}% — 獲利未達 ${(dayCost * 2).toFixed(2)}% 前都在幫券商打工，出手要挑波段`,
      ...(settleWarn ? [settleWarn] : []),
    ], score: (net > 0 ? Math.min(chipRatio * 100, 30) : -5) + chg + atrPct + (gapWarn?.pts ?? 0)
              + (dtRatio != null ? Math.min(dtRatio * 20, 8) : -4) });
  }
  // 有法人籌碼支撐者優先
  out.sort((x, y) => (y.hasChips - x.hasChips) || (y.score - x.score));
  return out.slice(0, 4);
}

// 持有中頁：今日推薦交易（分三類呈現）
// ── 長期持有名單（持久化）─────────────────────────────────────────────────
// 問題：長期名單過去每天從「短線進場訊號」重新海選 — 乖離/量能/品質分
// 一晃動就進進出出，說是放 3 個月以上的股票卻天天換臉。
// 原則：慢變數選入、選入後黏住。只有「長期論點壞掉」才剔除：
//   跌破年線（緩衝 3%）／中期死亡交叉（EMA50<EMA200）／
//   營收明顯衰退或本業虧損／列入處置。短線拉回不是剔除理由。
const LT_MAX = 8;
function getLongTermList() {
  try { return JSON.parse(localStorage.getItem('longterm-list') || '[]'); } catch { return []; }
}
function saveLongTermList(l) { try { localStorage.setItem('longterm-list', JSON.stringify(l.slice(0, LT_MAX))); } catch {} }

// 長期論點是否壞掉（只看慢變數；回傳剔除原因或 null）
function longTermThesisBroken(s) {
  const a = s?.analysis;
  if (!a) return null;                             // 無資料不動名單，等資料
  if (s._alert?.level === 'punish') return '列入處置股，流動性風險';
  // 年線改採「二次確認制」，不在此立即剔除（見 updateLongTermList）—
  // 單日插針洗出再噴回去，是長抱報酬被吃掉的典型場景
  if (a.ema50 && a.ema200 && a.ema50 < a.ema200 * 0.995) return '季線跌破年線（中期死亡交叉）';
  if (s.rev?.yoy != null && s.rev.yoy <= -10) return `月營收年減 ${s.rev.yoy.toFixed(0)}% — 成長論點動搖`;
  if (s._fin?.netMargin != null && s._fin.netMargin < 0) return '本業轉虧';
  return null;
}

// 每輪掃描後維護名單：現有成員只用慢變數審核；新合格者補進（不擠掉舊成員）
function updateLongTermList() {
  const list = getLongTermList();
  const out = [];
  let changed = false;
  const today = twClock().date;
  for (const it of list) {
    const s = allStocks.find(x => x.id === it.id);
    if (!s?.analysis) { out.push(it); continue; }        // 沒掃到 → 保留，不亂動
    if (s._staleDays >= STALE_LIMIT) { out.push(it); continue; }
    const broken = longTermThesisBroken(s);
    if (broken) {
      changed = true;
      logSignal('exit', `${it.name}（${it.id}）移出長期持有名單`, broken, { id: it.id, dir: -1, dedupKey: `lt-${it.id}` });
      continue;
    }
    // 年線二次確認制：首次收破年線（含 3% 緩衝）記「保衛戰」，
    // 之後「另一個交易日」仍破才剔除；收復即解除 — 插針洗盤不出局
    const a = s.analysis;
    if (a.ema200 && a.price < a.ema200 * 0.97) {
      if (it.breachDate && it.breachDate !== today) {
        changed = true;
        logSignal('exit', `${it.name}（${it.id}）移出長期持有名單`,
          `連續兩個交易日收破年線 ${a.ema200.toFixed(2)}（首破 ${it.breachDate}）— 二次確認，長多結構失效`,
          { id: it.id, dir: -1, dedupKey: `lt-${it.id}` });
        continue;
      }
      if (!it.breachDate) { it.breachDate = today; changed = true; }
    } else if (it.breachDate) { delete it.breachDate; changed = true; }   // 收復年線，解除警戒
    out.push(it);
  }
  // 新合格者：今日進場訊號中通過長期分類者（名單未滿才補）
  if (out.length < LT_MAX) {
    try {
      for (const pk of computeEntrySignals()) {
        if (out.length >= LT_MAX) break;
        if (out.some(x => x.id === pk.s.id)) continue;
        const why = classifyLongTerm(pk.s);
        if (!why) continue;
        const twNow0 = _twiiSeries?.length ? _twiiSeries[_twiiSeries.length - 1].close : null;
        out.push({ id: pk.s.id, name: pk.s.name, addedAt: twClock().date,
                   basePrice: +pk.s.analysis.price.toFixed(2),
                   twiiBase: twNow0 ? +twNow0.toFixed(0) : null,   // 同日大盤基準 → 之後算 alpha
                   why: why.slice(0, 4) });
        changed = true;
        logSignal('entry', `${pk.s.name}（${pk.s.id}）入選長期持有名單`, why.slice(0, 3).join('・'), { id: pk.s.id, dir: 1, dedupKey: `lt-${pk.s.id}` });
      }
    } catch {}
  }
  if (changed) saveLongTermList(out);
  return out;
}

function renderEntrySignals() {
  const el = document.getElementById('entry-signals-body');
  if (!el) return;
  const ready = allStocks.filter(s => s.analysis).length;
  if (ready < 5) { el.innerHTML = '<div class="adv-loading">等待掃描完成...</div>'; return; }
  const inH = new Set(getHoldings().map(h => h.id));

  // 長期：改用持久化名單（慢變數審核，短線波動不換臉）；波段：當日訊號扣除長期成員
  const ltList = updateLongTermList();
  const ltIds = new Set(ltList.map(x => x.id));
  const all = computeEntrySignals({ includeWatch: true });
  const swings = all.filter(pk => pk.q.grade === 'A' && !ltIds.has(pk.s.id) && !classifyLongTerm(pk.s)).slice(0, 4);
  const watchers = all.filter(pk => pk.q.grade !== 'A' && !ltIds.has(pk.s.id)).slice(0, 4);
  const days = computeDayTradePicks();
  const hwNow = marketHeadwind();

  // 長期成員卡：入選日／期間報酬／目前狀態，短線拉回明講「屬正常波動」
  const ltCard = it => {
    const s = allStocks.find(x => x.id === it.id);
    const px = s?.analysis?.price;
    const ret = px && it.basePrice ? (px / it.basePrice - 1) * 100 : null;
    // Alpha：同期大盤報酬比較 — 長抱輸大盤不如買 0050，這個數字必須攤開
    const twNow0 = _twiiSeries?.length ? _twiiSeries[_twiiSeries.length - 1].close : null;
    const alpha = ret != null && it.twiiBase && twNow0
      ? ret - (twNow0 / it.twiiBase - 1) * 100 : null;
    const held = tradingDaysBetween(it.addedAt, twClock().date);
    const timing = (() => {
      if (!s?.analysis) return null;
      if (it.breachDate) return { t: `⚔️ 年線保衛戰中（${it.breachDate} 首破）— 再一日收破即移出名單，持有者應先減碼`, c: 'var(--bear)' };
      const a2 = s.analysis;
      const ext = a2.ema20 ? (px / a2.ema20 - 1) * 100 : null;
      if (ext == null) return null;
      if (a2.ema50 && px <= a2.ema50 * 1.02 && px >= a2.ema50 * 0.98)
        return { t: `回測季線 ${a2.ema50.toFixed(2)} — 長線分批加碼的標準位置`, c: 'var(--bull)' };
      if (ext <= 2.5) return { t: '目前貼近 EMA20 — 屬可加碼位', c: 'var(--bull)' };
      if (ext >= 6) return { t: `短線乖離 ${ext.toFixed(1)}% — 等拉回再加碼，非賣出訊號`, c: 'var(--yellow)' };
      return { t: '趨勢持有中，短線波動屬正常', c: 'var(--text3)' };
    })();
    return `
    <div style="padding:11px 13px;border-radius:9px;background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.16);margin-bottom:9px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.88rem;cursor:pointer" onclick="openStock('${it.id}')">${it.name} <span style="color:var(--text3);font-size:0.74rem">${it.id}</span></strong>
        <span style="font-size:0.66rem;padding:1px 8px;border-radius:9px;background:rgba(34,197,94,0.14);color:var(--bull);font-weight:700">入選 ${held ?? '--'} 個交易日</span>
        ${ret != null ? `<span style="margin-left:auto;font-family:var(--mono);font-weight:700;color:${ret >= 0 ? 'var(--bull)' : 'var(--bear)'}">${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%${alpha != null ? ` <span style="font-size:0.68rem;color:${alpha >= 0 ? 'var(--bull)' : 'var(--bear)'}" title="相對同期大盤">α${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}</span>` : ''}</span>` : ''}
      </div>
      <div style="font-size:0.72rem;color:var(--text3);margin-top:3px;font-family:var(--mono)">入選日 ${it.addedAt}｜入選價 ${it.basePrice}｜現價 ${px != null ? px.toFixed(2) : '--'}</div>
      <div style="font-size:0.73rem;color:var(--text2);margin-top:4px;line-height:1.6">${(it.why || []).join('・')}</div>
      ${timing ? `<div style="font-size:0.7rem;margin-top:3px;color:${timing.c}">${timing.t}</div>` : ''}
      <div style="margin-top:7px">${inH.has(it.id)
        ? '<span style="font-size:0.74rem;color:var(--bull)">✓ 已在持倉中</span>'
        : `<button class="btn-ghost" style="padding:4px 13px;font-size:0.72rem" onclick="addHolding('${it.id}','long')">📌 記錄持倉</button>`}</div>
    </div>`;
  };

  const card = ({ s, m, p, d, q, ltWhy }, kind) => `
    <div style="padding:11px 13px;border-radius:9px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.15);margin-bottom:9px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.88rem;cursor:pointer" onclick="openStock('${s.id}')">${s.name} <span style="color:var(--text3);font-size:0.74rem">${s.id}</span></strong>
        ${q ? `<span style="font-size:0.66rem;padding:1px 8px;border-radius:9px;font-weight:800;background:${q.grade === 'A' ? 'rgba(34,197,94,0.16)' : 'rgba(245,158,11,0.14)'};color:${q.grade === 'A' ? 'var(--bull)' : 'var(--yellow)'}" title="進場品質：位置/趨勢階段/量能/相對強弱/族群輪動/籌碼/一致性/風報比 八因子匯流">品質 ${q.grade}（${q.score}）</span>` : ''}
        <span style="font-size:0.66rem;padding:1px 8px;border-radius:9px;background:rgba(0,212,255,0.14);color:var(--blue);font-weight:700">綜合 ${d.total}</span>
        <span style="font-size:0.66rem;color:${m.stanceColor}">${m.stance}</span>
        <span style="margin-left:auto;font-size:0.7rem;color:var(--text3)">一致性 ${(m.agr * 100).toFixed(0)}%</span>
      </div>
      <div style="font-size:0.76rem;color:var(--text2);margin-top:5px;font-family:var(--mono)">
        進場 ${p.lo} ~ ${p.hi}｜停損 ${p.stop}（-${p.riskPct.toFixed(1)}%）｜${p.holdOn ? '無壓力續抱' : `目標 ${p.t1}（+${p.rewardPct1.toFixed(1)}%）`}
      </div>
      <div style="font-size:0.7rem;color:var(--blue);margin-top:3px">紀律：觸及 1R（${(p.lo * 2 - p.stop).toFixed(2)}）先減碼一半、停損上移至成本 — 回測驗證可大幅減少「賺過又變虧」</div>
      <div style="font-size:0.73rem;color:var(--text3);margin-top:4px">${(ltWhy || d.reasons).slice(0, 3).join('・')}</div>
      ${q?.top?.length ? `<div style="font-size:0.7rem;color:var(--blue);margin-top:3px">進場點優勢：${q.top.map(x => x.txt).join('・')}</div>` : ''}
      ${q?.weak?.length ? `<div style="font-size:0.7rem;color:var(--yellow);margin-top:2px">弱項：${q.weak.slice(0, 2).join('・')}</div>` : ''}
      <div style="margin-top:7px">${inH.has(s.id)
        ? '<span style="font-size:0.74rem;color:var(--bull)">✓ 已在持倉中</span>'
        : `<button class="btn-primary" style="padding:5px 14px;font-size:0.74rem" onclick="addHolding('${s.id}','${kind}')">📌 買進後記錄持倉</button>`}</div>
    </div>`;

  const dayCard = ({ s, m, why }) => `
    <div style="padding:10px 13px;border-radius:9px;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.18);margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.86rem;cursor:pointer" onclick="openStock('${s.id}')">${s.name} <span style="color:var(--text3);font-size:0.72rem">${s.id}</span></strong>
        <span style="font-size:0.66rem;color:${m.stanceColor}">${m.stance}</span>
        <span style="margin-left:auto;font-size:0.7rem;color:var(--text3)">現價 ${s.analysis.price.toFixed(2)}</span>
      </div>
      <div style="font-size:0.73rem;color:var(--text2);margin-top:4px;line-height:1.6">${why.join('・')}</div>
      ${(() => { const o = orbStatus(s); return o ? `<div style="font-size:0.73rem;margin-top:4px;color:${o.state === 'break-up' ? 'var(--bull)' : o.state === 'break-down' ? 'var(--bear)' : 'var(--yellow)'}">📐 ORB：${o.txt}</div>` : ''; })()}
      <div style="margin-top:6px">${inH.has(s.id)
        ? '<span style="font-size:0.74rem;color:var(--bull)">✓ 已在持倉中</span>'
        : `<button class="btn-ghost" style="padding:4px 13px;font-size:0.72rem" onclick="addHolding('${s.id}','day')">⚡ 記錄當沖單</button>`}</div>
    </div>`;

  const sect = (title, note, html) => html
    ? `<div style="font-size:0.8rem;font-weight:700;color:var(--text2);margin:12px 0 2px">${title}</div>
       <div style="font-size:0.68rem;color:var(--text3);margin-bottom:8px">${note}</div>${html}`
    : '';

  const body =
    sect('🏛 長期持有名單（3 個月～半年以上）', (() => {
      // 記分板：名單平均報酬與平均 alpha — 長抱的成績必須攤開對照大盤
      const twNow0 = _twiiSeries?.length ? _twiiSeries[_twiiSeries.length - 1].close : null;
      const rows = ltList.map(it => {
        const px = allStocks.find(x => x.id === it.id)?.analysis?.price;
        if (!px || !it.basePrice) return null;
        const ret = (px / it.basePrice - 1) * 100;
        const al = it.twiiBase && twNow0 ? ret - (twNow0 / it.twiiBase - 1) * 100 : null;
        return { ret, al };
      }).filter(Boolean);
      const base = '選入更挑剔（成長＋估值＋資金流三證據、60日贏大盤、乖離年線≤25%）；剔除採年線二次確認 — 插針洗盤不出局';
      if (!rows.length) return base;
      const avgRet = rows.reduce((a, b) => a + b.ret, 0) / rows.length;
      const als = rows.filter(r => r.al != null);
      const avgAl = als.length ? als.reduce((a, b) => a + b.al, 0) / als.length : null;
      return `名單平均 <b style="color:${avgRet >= 0 ? 'var(--bull)' : 'var(--bear)'}">${avgRet >= 0 ? '+' : ''}${avgRet.toFixed(1)}%</b>${avgAl != null ? `｜相對大盤 α <b style="color:${avgAl >= 0 ? 'var(--bull)' : 'var(--bear)'}">${avgAl >= 0 ? '+' : ''}${avgAl.toFixed(1)}%</b>` : ''}｜${base}`;
    })(),
      ltList.map(ltCard).join('')) +
    sect('📈 短期波段（數日～數週）', '只列品質 A 級（八因子 ≥75 黃金匯流）— 勝率的第一道防線是出手標準，寧缺勿濫',
      swings.map(pk => card(pk, 'long')).join('')) +
    sect('👀 觀察名單（品質 B — 等更好的位置）', '條件成立但進場點不夠好（多半是位置偏高或量能未確認）。回檔至 EMA20 附近或帶量突破時會升級為進場訊號，現在追進勝率打折',
      watchers.map(pk => card(pk, 'long')).join('')) +
    sect('⚡ 當沖參考（極高風險）', '流動性＋波動＋強收盤動能篩選（處置/注意股已排除）。開盤跳空逾 +2% 不追（開高走低是隔日沖最大虧損源）、開低逾 -0.5% 放棄；收盤前務必出場',
      days.filter(dp => !all.some(pk => pk.s.id === dp.s.id)).map(dayCard).join(''));

  const hw = heatWarning();
  const hwBanner = hwNow ? `<div style="padding:8px 12px;border-radius:8px;background:rgba(245,158,11,0.08);border-left:3px solid var(--yellow);font-size:0.76rem;color:var(--yellow);margin-bottom:10px">🛑 大盤研判 ${hwNow.norm}（偏空）— 新多單訊號暫停，僅保留 20 日跑贏大盤 ≥10pp 的極強勢股。逆風做多是實證上最大的虧損來源，空手也是部位。</div>` : '';
  el.innerHTML = hwBanner + (hw && body ? `<div style="padding:8px 12px;border-radius:8px;background:rgba(239,68,68,0.07);border-left:3px solid var(--bear);font-size:0.76rem;color:var(--bear);margin-bottom:10px">${hw}</div>` : '') + (body ||
    '<p style="font-size:0.8rem;color:var(--text3)">今日皆無符合條件的推薦 — 標準已提高（研判偏多＋綜合 ≥65＋品質 A＋風報比 ≥1.5＋大盤不逆風），寧可空手也不硬給訊號。</p>');
}

// 每日一次：持倉出場訊號 Telegram 推送
function notifyHoldingExits() {
  if (!tgWants('sig')) return;
  const holdings = getHoldings();
  if (!holdings.length) return;
  const today = new Date().toISOString().slice(0, 10);
  // 去重鍵用日曆日：資料日翻面（快取的法人日期更新）會讓資料日鍵重發
  if (localStorage.getItem('tg-holdings-date') === twClock().date) return;

  const rows = holdings.map(checkHoldingExit).filter(Boolean);
  if (rows.length < holdings.length) return; // 資料未齊，等下輪再推

  // 內容去重：持倉狀態若已由盤前/每日簡報以「相同等級」報告過，就不再獨立推一次；
  // 有任一檔出現簡報之後的新變化（等級不同）才值得再發
  if (!rows.some(r => !tgKeySent(`hold:${r.h.id}:${r.level}`))) {
    localStorage.setItem('tg-holdings-date', twClock().date);
    return;
  }

  const icon = { exit: '🔴', watch: '🟡', hold: '🟢' };
  const lines = rows.map(r =>
    `${icon[r.level]} ${r.h.name}(${r.h.id}) ${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%\n` +
    `　成本 ${r.h.entry}｜現價 ${r.price.toFixed(2)}｜停損 ${r.h.stop}\n　${r.reasons.join('；')}`
  ).join('\n\n');
  const exits = rows.filter(r => r.level === 'exit').length;
  const watches = rows.filter(r => r.level === 'watch').length;
  tgPush(`📋 台股雷達 每日持倉檢查\n${today}\n\n` +
    (exits ? `⚠ 有 ${exits} 檔出現出場訊號\n` : watches ? `留意 ${watches} 檔\n` : '全部續抱，無出場訊號\n') +
    `\n${lines}\n\n⚠ 僅供參考，非投資建議`);
  for (const r of rows) {
    if (r.level === 'hold') continue;
    logSignal(r.level === 'exit' ? 'exit' : 'alert',
      `${r.h.name}（${r.h.id}）${r.level === 'exit' ? '出現出場訊號' : '需留意'}`,
      `${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%｜${r.reasons.join('；')}`,
      { id: r.h.id, dir: -1, dedupKey: r.h.id });
  }
  localStorage.setItem('tg-holdings-date', twClock().date);
  tgMarkKeys(rows.map(r => `hold:${r.h.id}:${r.level}`));
}

// ── 實績回饋權重：用「已結算的真實成績」自動修正評分，讓系統越用越準 ──────
// AI 訊號 + 交易紀錄的已結算樣本，按進場情境統計實際勝率；某情境樣本 ≥8 筆
// 且勝率 <40% → 之後同情境的推薦自動扣分。教訓學習只「警告」，這裡真的改行為。
function signalPerfStats() {
  const done = getAiSignals().filter(t => t.status !== 'open' && t.ctx)
    .map(t => ({ win: (t.retPct ?? 0) > 0, ctx: t.ctx }));
  const jt = getJournal().filter(t => t.ctx).map(t => ({ win: t.retPct > 0, ctx: t.ctx }));
  const all = [...done, ...jt];
  // 進場情境條件 — 涵蓋「進場邏輯」本身（ADX/乖離/趨勢階段/成熟度），
  // 每一條都雙向學習：實測勝率 <40% 扣分、≥60% 加分（樣本 ≥8 筆才下結論）
  const conds = [
    { label: 'RSI≥70 進場', fn: c => c.rsi >= 70 },
    { label: '長期高位階進場', fn: c => c.pctile === 'high' },
    { label: '證據一致性<40% 進場', fn: c => c.agr != null && c.agr < 0.4 },
    { label: '大盤偏空時做多', fn: c => c.mktNorm != null && c.mktNorm <= -15 },
    { label: 'ADX<20 無趨勢進場', fn: c => c.adx != null && c.adx < 20 },
    { label: '乖離 EMA20>5% 追高進場', fn: c => c.ext20 != null && c.ext20 > 5 },
    { label: '貼近均線進場（乖離≤2%）', fn: c => c.ext20 != null && c.ext20 >= -2 && c.ext20 <= 2 },
    { label: '盤整市進場', fn: c => c.trend === 'range' },
    { label: '末升段進場', fn: c => c.maturity === 'late' },
    { label: '主升段進場', fn: c => c.maturity === 'main' },
  ];
  const out = [];
  for (const cd of conds) {
    const hit = all.filter(x => { try { return cd.fn(x.ctx); } catch { return false; } });
    if (hit.length < 8) continue;                      // 樣本不足不下結論（與教訓學習同一誠實標準）
    const winRate = hit.filter(x => x.win).length / hit.length;
    if (winRate < 0.40) out.push({ label: cd.label, n: hit.length, winRate: Math.round(winRate * 100), fn: cd.fn, kind: 'bad' });
    else if (winRate >= 0.60) out.push({ label: cd.label, n: hit.length, winRate: Math.round(winRate * 100), fn: cd.fn, kind: 'good' });
  }
  return out;
}

// 今日符合進場條件的推薦交易（持有中頁與 Telegram 推送共用同一套標準）
// sectorStats 會掃全池算研判 — 逐檔評品質時每檔都重算會變 O(n²)，記憶化 60 秒
let _secStatsMemo = null, _secStatsAt = 0;
function sectorStatsCached() {
  if (_secStatsMemo && Date.now() - _secStatsAt < 60 * 1000) return _secStatsMemo;
  _secStatsMemo = sectorStats(); _secStatsAt = Date.now();
  return _secStatsMemo;
}

// ── 進場品質評分：多因子「匯流」才是好進場點 ──────────────────────────────
// 研判分數答的是「這檔強不強」，品質分數答的是「現在進場好不好」—
// 強勢股在乖離 8% 的位置進場，仍是爛進場。八個因子各自命名計分，
// 讓每一分都說得出來源，也讓推薦卡能解釋「為什麼是它」。
function entryQuality(s, m, p) {
  const a = s.analysis;
  const f = [];   // { k, pts, max, txt }
  const push = (k, pts, max, txt) => f.push({ k, pts: Math.max(0, Math.round(pts)), max, txt });

  // ① 進場位置（20）：離 EMA20 越近越好 — 拉回進場優於追突破後的乖離
  const ext = a.ema20 ? (a.price / a.ema20 - 1) * 100 : null;
  if (ext == null) push('位置', 8, 20, '無均線資料，位置中性');
  else if (ext <= 2) push('位置', 20, 20, `貼近 EMA20（乖離 ${ext.toFixed(1)}%）— 拉回進場位`);
  else if (ext <= 4) push('位置', 13, 20, `乖離 EMA20 ${ext.toFixed(1)}%，位置尚可`);
  else if (ext <= 6) push('位置', 6, 20, `乖離 EMA20 ${ext.toFixed(1)}%，稍有追高`);
  else push('位置', 0, 20, `乖離 EMA20 ${ext.toFixed(1)}% — 追高位，回檔空間大`);

  // ② 趨勢階段（15）：初升/主升段給分，末升段大砍 — 追末段是虧損主因
  const ph = a.trend?.phase, mat = a.trend?.maturity;
  if (ph === 'strong-up' || ph === 'up')
    push('趨勢階段', mat === 'early' ? 15 : mat === 'late' ? 4 : 11, 15,
      `${a.trend.phaseTxt}${mat === 'early' ? '（初段，空間大）' : mat === 'late' ? '（末段，追價風險高）' : ''}`);
  else push('趨勢階段', 0, 15, '趨勢未確立');

  // ③ 量能確認（10）
  const bt = a.brk?.type;
  if (bt === 'breakout-vol' || bt === 'accumulation') push('量能', 10, 10, a.brk.txt);
  else if (bt === 'breakout-novol' || bt === 'breakout-weak') push('量能', 4, 10, a.brk.txt);
  else if (bt === 'distribution' || bt === 'churn') push('量能', 0, 10, a.brk.txt);
  else push('量能', 5, 10, '量能中性');

  // ④ 相對大盤強弱（15）
  const mret = marketRet20();
  const closes = s.ohlcv.map(b => b.close);
  const r20 = closes.length >= 21 ? (a.price - closes[closes.length - 21]) / closes[closes.length - 21] * 100 : null;
  if (mret == null || r20 == null) push('相對強弱', 6, 15, '無大盤基準，中性');
  else {
    const gap = r20 - mret;
    if (gap >= 8) push('相對強弱', 15, 15, `20 日跑贏大盤 ${gap.toFixed(1)}pp（強勢股）`);
    else if (gap >= 4) push('相對強弱', 11, 15, `領先大盤 ${gap.toFixed(1)}pp`);
    else if (gap >= 0) push('相對強弱', 6, 15, '與大盤同步');
    else push('相對強弱', 0, 15, `落後大盤 ${Math.abs(gap).toFixed(1)}pp — 資金不在這`);
  }

  // ⑤ 族群輪動（10）：買加速中的族群，不買失寵的
  let rot = null;
  try { rot = sectorStatsCached().find(g => g.sector === (s.sector || '其他'))?.rotation ?? null; } catch {}
  if (rot?.state === 'in') push('族群輪動', 10, 10, `${s.sector}族群資金流入中（5日 ${rot.r5 >= 0 ? '+' : ''}${rot.r5}%）`);
  else if (rot?.state === 'out') push('族群輪動', 0, 10, `${s.sector}族群資金流出中 — 逆風`);
  else push('族群輪動', 5, 10, '族群動能中性');

  // ⑥ 籌碼（15）：法人連買＋大戶訊號
  let chip = 0; const chipTxt = [];
  const st = instStreak(s.id);
  if (st?.dir > 0 && st.days >= 3) { chip += 8; chipTxt.push(`法人連 ${st.days} 日買超`); }
  else if (st?.dir > 0 && st.days >= 2) { chip += 5; chipTxt.push(`法人連 ${st.days} 日買超`); }
  if (whaleFor(s.id)) { chip += 7; chipTxt.push('大戶訊號（已過陷阱檢查）'); }
  else if (s.investment > 500) { chip += 3; chipTxt.push('投信買超'); }
  push('籌碼', Math.min(chip, 15), 15, chipTxt.join('＋') || '無明顯籌碼加持');

  // ⑦ 訊號一致性（10）
  push('一致性', m.agr >= 0.7 ? 10 : m.agr >= 0.55 ? 7 : m.agr >= 0.4 ? 4 : 0, 10,
    `證據一致性 ${(m.agr * 100).toFixed(0)}%`);

  // ⑧ 風報比（5）：續抱型（上方無壓力）是優勢不是缺陷，給 4 分
  push('風報比', p.holdOn ? 4 : p.rr >= 2 ? 5 : p.rr >= 1.5 ? 3 : 0, 5,
    p.holdOn ? '上方無壓力，續抱型（不受固定目標限制）' : p.rr ? `1:${p.rr.toFixed(1)}` : '風報比不明');

  const score = f.reduce((x, y) => x + y.pts, 0);
  const grade = score >= 75 ? 'A' : score >= 60 ? 'B' : 'C';
  return { score, grade, factors: f,
           top: [...f].sort((x, y) => (y.pts / y.max) - (x.pts / x.max)).slice(0, 3),
           weak: f.filter(x => x.pts === 0).map(x => x.txt) };
}

// 大盤逆風濾網狀態（供 UI 誠實說明為何今天沒訊號）
function marketHeadwind() {
  const norm = Math.round(outlookData.norm ?? 0);
  return norm <= -15 ? { norm } : null;
}

function computeEntrySignals(opts = {}) {
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return [];
  // 硬濾網①：大盤逆風（研判 ≤ -15）暫停所有新多單訊號 —
  // 逆風做多是實證上最大的虧損來源，過去只「警告」照樣推，現在直接停。
  // 唯一例外：20 日跑贏大盤 ≥10pp 的極強勢股（資金避風港）仍可入列。
  const hw = marketHeadwind();
  const perfRules = signalPerfStats();
  const mktNow = Math.round(outlookData.norm ?? 0);
  const mret = marketRet20();
  const picks = [];
  for (const s of ready) {
    if (s._staleDays >= STALE_LIMIT) continue;       // 資料過期不推薦
    if (hw) {
      const closes = s.ohlcv?.map(b => b.close);
      const r20 = closes?.length >= 21 ? (s.analysis.price - closes[closes.length - 21]) / closes[closes.length - 21] * 100 : null;
      if (mret == null || r20 == null || r20 - mret < 10) continue;
    }
    const m = buildManagerAnalysis(s);
    if (!m || m.dir < 3) continue;                   // 只推研判強度足夠者
    const p = buildEntryPlan(s, m);
    if (!p?.ok) continue;
    if (s.analysis.price > p.hi * 1.02) continue;    // 已明顯追高不推
    // 硬濾網②：風報比 <1.5 且有固定目標 → 不推。小賺大賠是報酬不理想的
    // 數學根源：1:1.2 的單要 55% 勝率才打平，過去只警告仍照推。
    if (!p.holdOn && p.rr != null && p.rr < 1.5) continue;
    const d = scoreStockDimensions(s, marketRet20() ?? 0);
    if (!d || d.excluded) continue;
    // 實績回饋（雙向）：命中「實證低勝率」情境每項 −6、「實證高勝率」情境每項 +4
    if (perfRules.length) {
      const ctxNow = {
        rsi: s.analysis.rsi != null ? +s.analysis.rsi : null,
        pctile: s.analysis.pctile?.zone ?? null,
        agr: +m.agr.toFixed(2), mktNorm: mktNow,
        adx: s.analysis.adx != null ? +s.analysis.adx : null,
        ext20: s.analysis.ema20 ? +((s.analysis.price / s.analysis.ema20 - 1) * 100).toFixed(1) : null,
        trend: s.analysis.trend?.phase ?? null,
        maturity: s.analysis.trend?.maturity ?? null,
      };
      for (const r of perfRules) {
        let hit = false;
        try { hit = r.fn(ctxNow); } catch {}
        if (!hit) continue;
        if (r.kind === 'bad') {
          d.total -= 6;
          d.reasons.push(`實績回饋：「${r.label}」歷史勝率僅 ${r.winRate}%（n=${r.n}）→ 已扣分`);
        } else {
          d.total += 4;
          d.reasons.push(`實績回饋：「${r.label}」歷史勝率 ${r.winRate}%（n=${r.n}）→ 加分`);
        }
      }
    }
    if (d.total < 65) continue;                      // 扣分後仍需通過五維度綜合門檻
    // 進場品質門檻：研判強（該不該買）之外，還要進場點好（現在買好不好）
    const q = entryQuality(s, m, p);
    if (q.score < 55) continue;                      // C 級進場點寧可放掉
    picks.push({ s, m, p, d, q });
  }
  // 依進場品質排序（品質同分再比五維度）
  picks.sort((a, b) => (b.q.score - a.q.score) || (b.d.total - a.d.total));
  // 族群分散：同族群最多取 2 檔 — 三檔同族群等於同一注押三次
  const secCnt = {};
  const out = picks.filter(pk => {
    const sec = pk.s.sector || '其他';
    secCnt[sec] = (secCnt[sec] || 0) + 1;
    return secCnt[sec] <= 2;
  });
  // 硬濾網③：分級 — 只有品質 A（≥75，黃金匯流）才是「進場訊號」；
  // B 級降為觀察名單（等回檔到更好位置），不推播、不建檔追蹤。
  // 勝率不理想時的正解是提高出手標準，不是換指標。
  return opts.includeWatch ? out : out.filter(pk => pk.q.grade === 'A');
}

// 每日一次：適合進場的個股訊號推送
function notifyEntrySignals() {
  if (!tgWants('sig')) return;
  const today = new Date().toISOString().slice(0, 10);
  // 去重鍵用日曆日，理由同 notifyHoldingExits
  if (localStorage.getItem('tg-entry-date') === twClock().date) return;
  // 內容去重：盤前簡報等已列過的股票不再重推；濾完沒剩就整則不發
  const picks = computeEntrySignals().filter(({ s }) => !tgKeySent(`sig:${s.id}`));
  if (!picks.length) return;

  const lines = picks.slice(0, 5).map(({ s, p, d, q }) => {
    const ltWhy = classifyLongTerm(s);
    const tag = ltWhy ? '🏛 長期持有（3個月以上）' : '📈 短期波段';
    const sup = ltWhy ? ltWhy.slice(0, 2)
      : [...p.support.chips.slice(0, 1), ...p.support.fund.slice(0, 1), ...p.support.tech.slice(0, 1)];
    return `${tag}｜${s.name}(${s.id})　品質 ${q ? `${q.grade}（${q.score}）` : '--'}｜綜合 ${d.total}\n` +
      `　進場 ${p.lo}~${p.hi}｜停損 ${p.stop}（-${p.riskPct.toFixed(1)}%）\n` +
      `　${p.holdOn ? '上方無壓力，續抱為主' : `目標 ${p.t1}（+${p.rewardPct1.toFixed(1)}%）`}\n` +
      `　1R ${(p.lo * 2 - p.stop).toFixed(2)} 先減半、停損上移成本\n` +
      `　依據：${sup.join('・') || '技術面轉強'}`;
  }).join('\n\n');

  // 當沖參考獨立列出（極高風險，僅日線資料篩選）
  const days = computeDayTradePicks().filter(dp => !picks.some(pk => pk.s.id === dp.s.id)).slice(0, 3);
  const dayLines = days.length
    ? `\n\n⚡ 當沖參考（極高風險，開盤後請以即時走勢確認）\n` +
      days.map(({ s, why }) => `・${s.name}(${s.id})：${why.join('；')}`).join('\n')
    : '';

  const hw = heatWarning();
  tgPush(`🎯 台股雷達 進場訊號\n${today}\n\n偵測到 ${picks.length} 檔符合進場條件（做多）：\n\n${lines}${dayLines}${hw ? `\n\n${hw}` : ''}\n\n⚠ 僅供參考，非投資建議`);
  localStorage.setItem('tg-entry-date', twClock().date);
  tgMarkKeys([...picks.map(({ s }) => `sig:${s.id}`), ...days.map(d => `sig:${d.s.id}`)]);
}

// ── 交易總結頁 ─────────────────────────────────────────────────────────────
let journalPeriod = 'month';

function switchJournalTab(tab) {
  document.getElementById('journal-summary').style.display = tab === 'summary' ? '' : 'none';
  document.getElementById('journal-records').style.display = tab === 'records' ? '' : 'none';
  document.getElementById('jtab-summary')?.classList.toggle('active', tab === 'summary');
  document.getElementById('jtab-records')?.classList.toggle('active', tab === 'records');
}

function switchJournalPeriod(p) {
  journalPeriod = p;
  document.getElementById('jp-month')?.classList.toggle('active', p === 'month');
  document.getElementById('jp-year')?.classList.toggle('active', p === 'year');
  renderJournal();
}

// ── 系統期望值與風控學習 ───────────────────────────────────────────────────
// 專業交易只看一個數字：期望值（每承擔 1R 風險平均賺多少 R）。
// 勝率高但期望值負的系統照樣賠錢；這裡把 AI 訊號實績換算成 R 標準化統計，
// 並從「贏單的 MAE 分佈」反推停損距離、從實績勝率/賠率算半凱利部位。
function expectancyStats() {
  const done = getAiSignals().filter(t =>
    t.status !== 'open' && t.retPct != null && t.entry > 0 && t.stop != null && t.entry > t.stop);
  if (done.length < 5) return null;
  const rs = done.map(t => {
    const riskPct = (t.entry - t.stop) / t.entry * 100;
    return { r: riskPct > 0 ? +(t.retPct / riskPct).toFixed(2) : 0, t };
  });
  const wins = rs.filter(x => x.r > 0), losses = rs.filter(x => x.r <= 0);
  const W = wins.length / rs.length;
  const sumWin = wins.reduce((a, b) => a + b.r, 0);
  const sumLoss = Math.abs(losses.reduce((a, b) => a + b.r, 0));
  const avgWinR = wins.length ? sumWin / wins.length : 0;
  const avgLossR = losses.length ? sumLoss / losses.length : 0;
  const expectancy = +(W * avgWinR - (1 - W) * avgLossR).toFixed(2);
  const pf = sumLoss > 0 ? +(sumWin / sumLoss).toFixed(2) : null;
  let cur = 0, maxStreak = 0;
  for (const x of rs) { if (x.r <= 0) { cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 0; }
  // 贏單 MAE 90 分位：九成贏單的最大回撤都沒超過這個值 → 停損的實證下限
  const winMae = wins.map(x => x.t.maePct).filter(v => v != null)
    .map(v => Math.abs(Math.min(0, v))).sort((a, b) => a - b);
  const mae90 = winMae.length >= 8 ? +winMae[Math.min(winMae.length - 1, Math.floor(winMae.length * 0.9))].toFixed(1) : null;
  const avgStopDist = +(done.reduce((a, t) => a + (t.entry - t.stop) / t.entry * 100, 0) / done.length).toFixed(1);
  // 半凱利（樣本 ≥30 才給；上限 2%、下限 0.5% — 凱利對參數誤差極敏感，全凱利必爆）
  let kelly = null;
  if (rs.length >= 30 && avgLossR > 0 && avgWinR > 0) {
    const f = W - (1 - W) / (avgWinR / avgLossR);
    kelly = f > 0 ? +Math.min(2, Math.max(0.5, f * 50)).toFixed(1) : 0.5;
  }
  // 出場效率：贏單平均只拿到 MFE（波段最高點）的幾成 — 停利太早/太晚的實證
  const winMfe = wins.filter(x => x.t.mfePct != null && x.t.mfePct > 0)
    .map(x => ({ got: x.r, max: x.t.mfePct / ((x.t.entry - x.t.stop) / x.t.entry * 100) }));
  let capture = null;
  if (winMfe.length >= 8) {
    const avgMax = winMfe.reduce((a, b) => a + b.max, 0) / winMfe.length;
    const avgGot = winMfe.reduce((a, b) => a + b.got, 0) / winMfe.length;
    if (avgMax > 0) capture = { ratio: +(avgGot / avgMax).toFixed(2), avgMaxR: +avgMax.toFixed(2), n: winMfe.length };
  }
  return { n: rs.length, W: +(W * 100).toFixed(0), avgWinR: +avgWinR.toFixed(2),
           avgLossR: +avgLossR.toFixed(2), expectancy, pf, maxStreak, mae90, avgStopDist, kelly,
           maeN: winMae.length, capture };
}

// 情境分組期望值：同一套系統在不同情境下的優勢差很多 —
// 「初升段賺、末升段賠」這種結論只有分組統計看得到。
function expectancyBySituation() {
  const done = getAiSignals().filter(t =>
    t.status !== 'open' && t.retPct != null && t.entry > 0 && t.stop != null && t.entry > t.stop && t.ctx);
  const groups = {};
  const add = (k, r) => { (groups[k] = groups[k] || []).push(r); };
  for (const t of done) {
    const r = t.retPct / ((t.entry - t.stop) / t.entry * 100);
    if (t.ctx.trend) add(`趨勢：${{ 'strong-up': '強勢上升', up: '上升', range: '盤整', down: '下降', 'strong-down': '強勢下降' }[t.ctx.trend] || t.ctx.trend}`, r);
    if (t.ctx.maturity) add(`階段：${{ early: '初段', mid: '主升段', late: '末段' }[t.ctx.maturity] || t.ctx.maturity}`, r);
    if (t.ctx.pctile) add(`位階：${{ high: '高檔', mid: '中檔', low: '低檔' }[t.ctx.pctile] || t.ctx.pctile}`, r);
    if (t.ctx.mktNorm != null) add(`大盤：${t.ctx.mktNorm >= 15 ? '偏多' : t.ctx.mktNorm <= -15 ? '偏空' : '中性'}`, r);
  }
  return Object.entries(groups)
    .filter(([, rs]) => rs.length >= 5)
    .map(([k, rs]) => ({ k, n: rs.length, exp: +(rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(2) }))
    .sort((a, b) => b.exp - a.exp);
}

// 風控學習建議（實證導向；樣本不足的建議誠實標示不給）
function riskLearnings(st) {
  if (!st) return [];
  const out = [];
  if (st.expectancy > 0.3) out.push(`✅ R 期望值 +${st.expectancy}：每承擔 1R 風險平均賺 ${st.expectancy}R — 系統有正優勢，重點是紀律執行而非挑訊號`);
  else if (st.expectancy > 0) out.push(`R 期望值 +${st.expectancy} 為正但偏薄 — 稅費滑價會吃掉一部分，只做品質 A 級進場點可拉高`);
  else out.push(`⚠ R 期望值 ${st.expectancy} 為負 — 系統目前無優勢，應降低頻率/部位，等實績回饋修正後再放大`);
  if (st.mae90 != null && st.avgStopDist > 0 && st.mae90 * 1.3 < st.avgStopDist)
    out.push(`📏 停損可收緊：九成贏單的最大回撤 ≤${st.mae90}%（樣本 ${st.maeN}），現行平均停損 ${st.avgStopDist}% 偏寬 — 收至 ~${(st.mae90 * 1.3).toFixed(1)}%（MAE90×1.3 緩衝）同風險可放大部位`);
  else if (st.mae90 != null)
    out.push(`📏 贏單 MAE90 ${st.mae90}% vs 平均停損 ${st.avgStopDist}% — 停損距離與實際波動相稱，不建議再收緊`);
  if (st.maxStreak >= 3)
    out.push(`🧊 歷史最大連虧 ${st.maxStreak} 筆 — 以單筆 2% 計連續回撤約 ${(st.maxStreak * 2).toFixed(0)}%，部位規模要以「連虧發生時扛得住」為準`);
  if (st.capture) {
    if (st.capture.ratio < 0.5)
      out.push(`⏳ 停利偏早：贏單平均衝到 +${st.capture.avgMaxR}R 只拿到 ${(st.capture.ratio * 100).toFixed(0)}%（樣本 ${st.capture.n}）— 建議 T1 只減半、剩餘改移動停利讓利潤跑`);
    else if (st.capture.ratio > 0.8)
      out.push(`✅ 出場效率 ${(st.capture.ratio * 100).toFixed(0)}% — 贏單大部分行情有拿到，停利設定與行情相稱`);
    else
      out.push(`出場效率 ${(st.capture.ratio * 100).toFixed(0)}%（贏單平均最高 +${st.capture.avgMaxR}R）— 中規中矩，維持現行分批出場`);
  }
  if (st.kelly != null)
    out.push(`📦 依實績半凱利：單筆風險 ${st.kelly}%（勝率 ${st.W}%、賠率 ${st.avgWinR}/${st.avgLossR}，樣本 ${st.n}）— 期望值為正時逐步靠近，為負時退回最小`);
  else out.push(`📦 半凱利部位建議需 ≥30 筆結算樣本（現有 ${st.n} 筆）— 樣本不足前維持固定 2% 風險`);
  return out;
}

function renderExpectancy() {
  const el = document.getElementById('expectancy-body');
  if (!el) return;
  const st = expectancyStats();
  if (!st) {
    el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">已結算訊號不足 5 筆 — 系統會隨 AI 訊號自動結算累積，無需手動操作。</p>';
    return;
  }
  const eC = st.expectancy > 0.2 ? 'var(--bull)' : st.expectancy > 0 ? 'var(--yellow)' : 'var(--bear)';
  const cell = (lbl, val, c) => `<div style="padding:9px 10px;background:rgba(255,255,255,0.02);border-radius:8px">
    <div style="font-size:0.68rem;color:var(--text3)">${lbl}</div>
    <div style="font-family:var(--mono);font-weight:800;font-size:1rem;color:${c || 'var(--text1)'}">${val}</div></div>`;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px">
      ${cell('R 期望值', `${st.expectancy > 0 ? '+' : ''}${st.expectancy}R`, eC)}
      ${cell('獲利因子 PF', st.pf ?? '--', st.pf >= 1.5 ? 'var(--bull)' : st.pf >= 1 ? 'var(--yellow)' : 'var(--bear)')}
      ${cell('勝率', `${st.W}%`)}
      ${cell('平均賺/賠 (R)', `${st.avgWinR} / ${st.avgLossR}`)}
      ${cell('最大連虧', `${st.maxStreak} 筆`, st.maxStreak >= 4 ? 'var(--bear)' : 'var(--text1)')}
      ${cell('樣本數', `${st.n} 筆`)}
    </div>
    <div style="margin-top:10px;font-size:0.76rem;color:var(--text2);line-height:1.8">
      ${riskLearnings(st).map(x => `・${x}`).join('<br>')}
    </div>
    ${(() => {
      const sit = expectancyBySituation();
      if (!sit.length) return '';
      const row = x => `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.74rem">
        <span style="color:var(--text2)">${x.k}</span>
        <span style="font-family:var(--mono);color:${x.exp > 0.2 ? 'var(--bull)' : x.exp < 0 ? 'var(--bear)' : 'var(--yellow)'}">${x.exp > 0 ? '+' : ''}${x.exp}R <span style="color:var(--text3)">（n=${x.n}）</span></span></div>`;
      return `<div style="margin-top:12px">
        <div style="font-size:0.72rem;color:var(--text3);margin-bottom:5px">📂 情境分組期望值 — 系統在哪種環境有優勢、哪種環境該收手</div>
        ${sit.slice(0, 8).map(row).join('')}
      </div>`;
    })()}`;
}

function renderJournal() {
  renderExpectancy();
  renderJournalStats();
  renderEquityChart();
  renderJournalLessons();
  renderJournalRecords();
}

function renderJournalStats() {
  const el = document.getElementById('journal-stats-body');
  const title = document.getElementById('journal-period-title');
  if (!el) return;
  if (title) title.textContent = journalPeriod === 'month' ? '📊 每月報告' : '📊 年度報告';
  const trades = getJournal();
  if (!trades.length) { el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">尚無已結案交易。持倉結案後（持有中頁的「📒 結案」）就會產生報告。</p>'; return; }

  const keyLen = journalPeriod === 'month' ? 7 : 4;
  const groups = {};
  trades.forEach(t => {
    const k = (t.exitDate || '').slice(0, keyLen);
    if (k) (groups[k] = groups[k] || []).push(t);
  });
  const keys = Object.keys(groups).sort().reverse();

  const wins = trades.filter(t => t.retPct > 0);
  const totalGrowth = trades.reduce((g, t) => g * (1 + t.retPct / 100), 1);
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
      <div class="inst-card"><div class="inst-card-lbl">總交易次數</div><div class="inst-card-val">${trades.length}</div></div>
      <div class="inst-card"><div class="inst-card-lbl">總勝率</div><div class="inst-card-val" style="color:${wins.length / trades.length >= 0.5 ? 'var(--bull)' : 'var(--bear)'}">${(wins.length / trades.length * 100).toFixed(0)}%</div></div>
      <div class="inst-card"><div class="inst-card-lbl">累積報酬</div><div class="inst-card-val" style="color:${totalGrowth >= 1 ? 'var(--bull)' : 'var(--bear)'}">${totalGrowth >= 1 ? '+' : ''}${((totalGrowth - 1) * 100).toFixed(1)}%</div></div>
      <div class="inst-card"><div class="inst-card-lbl">平均每筆</div><div class="inst-card-val">${(trades.reduce((n, t) => n + t.retPct, 0) / trades.length).toFixed(2)}%</div></div>
    </div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.78rem">
      <thead><tr style="color:var(--text3);font-size:0.68rem;text-align:left">
        <th style="padding:4px 6px">${journalPeriod === 'month' ? '月份' : '年度'}</th>
        <th style="padding:4px 6px;text-align:right">交易次數</th>
        <th style="padding:4px 6px;text-align:right">勝率</th>
        <th style="padding:4px 6px;text-align:right">期間報酬</th>
        <th style="padding:4px 6px;text-align:right">最佳 / 最差</th>
      </tr></thead>
      <tbody>${keys.map(k => {
        const g = groups[k];
        const w = g.filter(t => t.retPct > 0).length;
        const growth = (g.reduce((x, t) => x * (1 + t.retPct / 100), 1) - 1) * 100;
        const best = Math.max(...g.map(t => t.retPct)), worst = Math.min(...g.map(t => t.retPct));
        return `<tr>
          <td style="padding:5px 6px;font-family:var(--mono)">${k}</td>
          <td style="padding:5px 6px;text-align:right">${g.length}</td>
          <td style="padding:5px 6px;text-align:right;font-weight:700;color:${w / g.length >= 0.5 ? 'var(--bull)' : 'var(--bear)'}">${(w / g.length * 100).toFixed(0)}%</td>
          <td style="padding:5px 6px;text-align:right;font-family:var(--mono);color:${growth >= 0 ? 'var(--bull)' : 'var(--bear)'}">${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%</td>
          <td style="padding:5px 6px;text-align:right;font-family:var(--mono);font-size:0.72rem"><span style="color:var(--bull)">+${best.toFixed(1)}%</span> / <span style="color:var(--bear)">${worst.toFixed(1)}%</span></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
}

// 帳戶成長曲線（以逐筆複利計算，起點 100）
function renderEquityChart() {
  const box = document.getElementById('equity-chart');
  if (!box) return;
  const trades = [...getJournal()].sort((a, b) => (a.exitDate || '').localeCompare(b.exitDate || ''));
  if (trades.length < 2) {
    box.innerHTML = '<div class="adv-loading" style="padding-top:90px;text-align:center">至少需 2 筆已結案交易才能繪製成長曲線</div>';
    return;
  }
  const pts = [{ d: trades[0].entryDate || trades[0].exitDate, v: 100 }];
  let eq = 100;
  trades.forEach(t => { eq *= 1 + t.retPct / 100; pts.push({ d: t.exitDate, v: eq }); });

  box.innerHTML = '';
  const W = box.clientWidth || 600, H = box.clientHeight || 220;
  const dpr = window.devicePixelRatio || 1;
  const cv = document.createElement('canvas');
  cv.width = W * dpr; cv.height = H * dpr;
  cv.style.cssText = `width:${W}px;height:${H}px;display:block`;
  box.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL = 8, padR = 52, padT = 14, padB = 22;
  const vs = pts.map(p => p.v);
  const hi = Math.max(...vs) * 1.02, lo = Math.min(...vs) * 0.98;
  const x = i => padL + i / (pts.length - 1) * (W - padL - padR);
  const y = v => padT + (hi - v) / (hi - lo || 1) * (H - padT - padB);

  ctx.font = '10px monospace';
  for (let g = 0; g <= 3; g++) {
    const v = hi - (hi - lo) * g / 3, gy = y(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.fillText(v.toFixed(0), W - padR + 6, gy + 3);
  }
  // 基準線 100
  const by = y(100);
  ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(padL, by); ctx.lineTo(W - padR, by); ctx.stroke(); ctx.setLineDash([]);

  const up = eq >= 100;
  const line = up ? '#22c55e' : '#ef4444';
  const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
  grad.addColorStop(0, up ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(x(i), y(p.v)) : ctx.moveTo(x(i), y(p.v)));
  ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke();
  ctx.lineTo(x(pts.length - 1), H - padB); ctx.lineTo(x(0), H - padB); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.fillStyle = line; ctx.font = 'bold 12px monospace';
  ctx.fillText(`${eq >= 100 ? '+' : ''}${(eq - 100).toFixed(1)}%`, padL + 4, padT + 12);
  ctx.fillStyle = '#64748b'; ctx.font = '10px monospace';
  ctx.fillText(pts[0].d ?? '', padL, H - 6);
  const lastLbl = pts[pts.length - 1].d ?? '';
  ctx.fillText(lastLbl, W - padR - ctx.measureText(lastLbl).width, H - 6);
}

function renderJournalLessons() {
  const el = document.getElementById('journal-lessons-body');
  if (!el) return;
  const pat = journalInsights();
  const manual = getJournal().filter(t => t.lesson).slice(-5).reverse();
  if (!pat.length && !manual.length) {
    el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">尚無可歸納的教訓。結案的虧損交易累積後，系統會自動找出重複犯的錯；你也可以在交易紀錄頁為每筆寫下心得。</p>';
    return;
  }
  el.innerHTML = `
    ${pat.map(p => `<div style="padding:9px 12px;border-radius:8px;background:${p.grade === 'firm' ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)'};border-left:3px solid ${p.grade === 'firm' ? 'var(--yellow)' : 'var(--text3)'};margin-bottom:7px">
      <div style="font-size:0.8rem;font-weight:700;color:${p.grade === 'firm' ? 'var(--yellow)' : 'var(--text3)'}">${p.grade === 'firm' ? '⚠' : '👁'} ${p.label}（虧損 ${p.n} 筆${p.grade === 'firm' ? '' : '・觀察中'}）</div>
      <div style="font-size:0.76rem;color:var(--text2);margin-top:3px;line-height:1.6">${p.advice}<br>
        <span style="color:var(--text3);font-size:0.7rem">${p.grade === 'firm' ? '樣本已滿 5 筆 — 正式警告，相同情境再出現時進場建議會直接提醒' : `樣本僅 ${p.n} 筆，統計上不足以下結論 — 滿 5 筆升級為正式警告`}</span></div>
    </div>`).join('')}
    ${manual.map(t => `<div style="padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:6px">
      <div style="font-size:0.74rem;color:var(--text3)">${t.name}（${t.retPct >= 0 ? '+' : ''}${t.retPct}%・${t.reason}）</div>
      <div style="font-size:0.79rem;color:var(--text1);margin-top:2px">✍️ ${t.lesson}</div>
    </div>`).join('')}`;
}

function renderJournalRecords() {
  const el = document.getElementById('journal-records-body');
  if (!el) return;
  const trades = getJournal();
  if (!trades.length) { el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">尚無已結案交易。</p>'; return; }
  el.innerHTML = [...trades].reverse().map((t, ri) => {
    const idx = trades.length - 1 - ri;
    const win = t.retPct >= 0;
    const c = win ? 'var(--bull)' : 'var(--bear)';
    return `
    <div style="padding:11px 13px;border-radius:9px;background:${c}0a;border-left:3px solid ${c};margin-bottom:9px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.86rem;cursor:pointer" onclick="openStock('${t.id}')">${t.name} <span style="color:var(--text3);font-size:0.72rem">${t.id}</span></strong>
        <span style="font-size:0.7rem;padding:1px 8px;border-radius:9px;background:${c}22;color:${c};font-weight:700">${t.reason}</span>
        ${t.src ? `<span style="font-size:0.62rem;padding:1px 7px;border-radius:8px;background:${t.src === 'manual' ? 'rgba(245,158,11,0.14)' : 'rgba(0,212,255,0.12)'};color:${t.src === 'manual' ? 'var(--yellow)' : 'var(--blue)'}">${t.src === 'manual' ? '自行購入' : 'AI 建議'}</span>` : ''}
        ${t.kind ? `<span style="font-size:0.62rem;padding:1px 7px;border-radius:8px;background:rgba(255,255,255,0.07);color:var(--text2)">${t.kind === 'day' ? '當沖單' : '長線單'}</span>` : ''}
        <span style="margin-left:auto;font-family:var(--mono);font-weight:800;color:${c}">${win ? '+' : ''}${t.retPct}%</span>
      </div>
      <div style="font-size:0.72rem;color:var(--text3);margin-top:4px;font-family:var(--mono)">
        ${t.entryDate} 進場 ${t.entry} → ${t.exitDate} 出場 ${t.exit}
        ${t.divAdj ? `　<span style="color:var(--blue)">含息 ${t.divAdj} 元還原</span>` : ''}
        ${t.stars ? `　<span style="color:var(--yellow);letter-spacing:1px">${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}</span>` : ''}
      </div>
      ${t.stars && t.stars < 3 && t.review?.length ? `<div style="margin-top:6px;padding:8px 11px;border-radius:8px;background:rgba(245,158,11,0.07);border-left:3px solid var(--yellow)">
        <div style="font-size:0.7rem;font-weight:700;color:var(--yellow)">⚠ 評分低於 3 星 — 可改進重點</div>
        <div style="font-size:0.74rem;color:var(--text2);margin-top:3px;line-height:1.7">${t.review.map(n => `・${n}`).join('<br>')}</div>
      </div>` : ''}
      ${t.ctx ? `<div style="font-size:0.73rem;color:var(--text3);margin-top:5px;line-height:1.6">
        <span style="color:var(--text2)">進場時情境：</span>${t.ctx.stance ?? '--'}｜評分 ${t.ctx.score ?? '--'}｜RSI ${t.ctx.rsi ?? '--'}｜一致性 ${t.ctx.agr != null ? (t.ctx.agr * 100).toFixed(0) + '%' : '--'}｜大盤 ${t.ctx.mktNorm ?? '--'}
        ${t.ctx.reasons?.length ? `<br><span style="color:var(--bull)">當時看多：</span>${t.ctx.reasons.join('・')}` : ''}
        ${!win && t.ctx.warns?.length ? `<br><span style="color:var(--bear)">當時已有的警告：</span>${t.ctx.warns.join('・')} ← 檢討起點</span>` : ''}
      </div>` : ''}
      <div style="margin-top:7px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn-ghost" style="padding:3px 12px;font-size:0.72rem" onclick="setLesson(${idx})">✎ 教訓</button>
        ${t.lesson ? `<span style="font-size:0.76rem;color:var(--text1)">✍️ ${t.lesson}</span>` : '<span style="font-size:0.72rem;color:var(--text3)">（尚未寫下這筆學到什麼）</span>'}
      </div>
    </div>`;
  }).join('');
}

// ── AI 預測準確度追蹤 ───────────────────────────────────────────────────────
// 系統每天做多空預測與挑重點股，但過去從不記錄、也不驗證對錯。
// 這裡把每日預測存檔，7 天後自動比對實際結果並計分 → 準確度可被衡量。

const PRED_KEY = 'pred-log';
const PRED_HOLD_DAYS = 7; // 預測驗證期（日曆日，約 5 個交易日）

function getPredLog() {
  try { return JSON.parse(localStorage.getItem(PRED_KEY) || '[]'); } catch { return []; }
}
function savePredLog(log) {
  try { localStorage.setItem(PRED_KEY, JSON.stringify(log.slice(-400))); } catch {}
}

// 大盤近 20 日報酬（供相對強弱計算）
let _twiiSeries = null; // 由 fetchTWIIHistory 填入，供同步計算使用
function marketRet20() {
  const from = arr => arr.length >= 21
    ? (arr[arr.length-1] - arr[arr.length-21]) / arr[arr.length-21] * 100 : null;
  if (_twiiSeries?.length) {
    const r = from(_twiiSeries.map(b => b.close).filter(v => v > 0));
    if (r != null) return r;
  }
  try {
    const rows = cacheGet('cache:turnover', 24 * 60 * 60 * 1000);
    const r = from((rows || []).map(r => r.index).filter(v => v > 0));
    if (r != null) return r;
  } catch {}
  const t = outlookData.factors?.find(f => f.sym === '^TWII');
  return t?.chg5 != null ? t.chg5 * 2 : null; // 退而求其次：5 日報酬概估
}

function twiiLevel() {
  const f = outlookData.factors?.find(x => x.sym === '^TWII');
  return f?.price ?? null;
}

// 每日記錄一次預測快照（掃描完成後呼叫）
function recordPredictions() {
  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return;                 // 資料不足不記錄，避免污染統計
  const twii = twiiLevel();
  const today = new Date().toISOString().slice(0, 10);
  const log = getPredLog();
  if (log.some(p => p.date === today)) return;  // 每日只記一次

  const norm = outlookData.norm ?? 0;
  const focus = computeFocusStocks().daily.slice(0, 5)
    .map(f => ({ id: f.s.id, name: f.s.name, price: f.s.analysis.price }))
    .filter(f => f.price > 0);

  log.push({
    date: today,
    market: twii ? { norm, dir: norm >= 15 ? 1 : norm <= -15 ? -1 : 0, twii } : null,
    focus: focus.length ? focus : null,
    resolved: false,
  });
  savePredLog(log);
}

// 結算已到期的預測（每次掃描檢查）
function resolvePredictions() {
  const log = getPredLog();
  const now = Date.now();
  const twiiNow = twiiLevel();
  let changed = false;

  for (const p of log) {
    if (p.resolved) continue;
    const age = (now - new Date(p.date + 'T00:00:00').getTime()) / 86400000;
    if (age < PRED_HOLD_DAYS) continue;

    // 市場方向：預測偏多/偏空 vs 大盤實際漲跌（中性預測不計分）
    if (p.market && twiiNow) {
      const chg = (twiiNow - p.market.twii) / p.market.twii * 100;
      p.market.actualChg = +chg.toFixed(2);
      if (p.market.dir !== 0) {
        // 漲跌幅小於 0.5% 視為持平，不算命中也不算失誤
        p.market.hit = Math.abs(chg) < 0.5 ? null : (chg > 0) === (p.market.dir > 0);
      } else {
        p.market.hit = null;
      }
    }

    // 重點股：平均報酬是否跑贏大盤（這才是選股能力的真正檢驗）
    if (p.focus && twiiNow && p.market?.twii) {
      const rets = p.focus.map(f => {
        const s = allStocks.find(x => x.id === f.id);
        const now2 = s?.analysis?.price;
        return now2 > 0 ? (now2 - f.price) / f.price * 100 : null;
      }).filter(v => v != null);
      if (rets.length) {
        const avg = rets.reduce((a, b) => a + b, 0) / rets.length;
        const mkt = (twiiNow - p.market.twii) / p.market.twii * 100;
        p.focusAvgRet = +avg.toFixed(2);
        p.focusExcess = +(avg - mkt).toFixed(2);
        p.focusBeat = avg > mkt;
        p.focusN = rets.length;
      }
    }

    p.resolved = true;
    changed = true;
  }
  if (changed) savePredLog(log);
}

function computePredAccuracy() {
  const done = getPredLog().filter(p => p.resolved);

  const mkt = done.filter(p => p.market?.hit === true || p.market?.hit === false);
  const mktHit = mkt.filter(p => p.market.hit).length;

  const foc = done.filter(p => p.focusBeat != null);
  const focBeat = foc.filter(p => p.focusBeat).length;
  const focExcess = foc.length ? foc.reduce((s, p) => s + p.focusExcess, 0) / foc.length : 0;
  const focRet = foc.length ? foc.reduce((s, p) => s + p.focusAvgRet, 0) / foc.length : 0;

  return {
    market: { n: mkt.length, hit: mktHit, pct: mkt.length ? mktHit / mkt.length * 100 : null },
    focus:  { n: foc.length, beat: focBeat, pct: foc.length ? focBeat / foc.length * 100 : null,
              avgExcess: focExcess, avgRet: focRet },
    pending: getPredLog().filter(p => !p.resolved).length,
  };
}

function renderPredAccuracy() {
  const el = document.getElementById('pred-acc-body');
  if (!el) return;
  const a = computePredAccuracy();
  const col = pct => pct == null ? 'var(--text3)' : pct >= 60 ? 'var(--bull)' : pct >= 45 ? 'var(--yellow)' : 'var(--bear)';
  const card = (title, sub, pct, n, extra) => `
    <div class="inst-card" style="text-align:left">
      <div class="inst-card-lbl">${title}</div>
      <div style="font-size:1.5rem;font-weight:800;color:${col(pct)};font-family:var(--mono)">${pct != null ? pct.toFixed(0) + '%' : '--'}</div>
      <div style="font-size:0.7rem;color:var(--text3);margin-top:2px">${n > 0 ? `${n} 次已驗證` : '尚無樣本'}${extra || ''}</div>
      <div style="font-size:0.68rem;color:var(--text3);margin-top:3px">${sub}</div>
    </div>`;

  const enough = a.market.n >= 10 || a.focus.n >= 10;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${card('大盤多空預測命中率', '預測偏多/偏空後 7 日，大盤實際方向是否相符（中性與 ±0.5% 內不計分）',
             a.market.pct, a.market.n)}
      ${card('重點股跑贏大盤比率', '每日 5 檔重點股 7 日平均報酬是否勝過加權指數',
             a.focus.pct, a.focus.n,
             a.focus.n ? `　平均超額 ${a.focus.avgExcess >= 0 ? '+' : ''}${a.focus.avgExcess.toFixed(2)}%` : '')}
    </div>
    <div style="margin-top:10px;font-size:0.78rem;color:var(--text3);line-height:1.7">
      ${a.pending > 0 ? `目前有 <strong style="color:var(--blue)">${a.pending}</strong> 筆預測驗證中（滿 ${PRED_HOLD_DAYS} 天自動結算）。` : ''}
      ${enough
        ? `樣本已具參考性。${a.focus.n >= 10 ? `重點股 7 日平均報酬 <strong style="color:${a.focus.avgRet >= 0 ? 'var(--bull)' : 'var(--bear)'}">${a.focus.avgRet >= 0 ? '+' : ''}${a.focus.avgRet.toFixed(2)}%</strong>。` : ''}`
        : '樣本數不足 10 次，準確度僅供初步參考 — 系統每日自動累積，請持續觀察。'}
      <br><span style="color:var(--text3);font-size:0.72rem">此為系統對自身預測的誠實記分：每日預測存檔後 ${PRED_HOLD_DAYS} 天回頭比對實際結果，無法事後修改。</span>
    </div>`;
}

// ── 每日 / 每週重點關注股 ──────────────────────────────────────────────────

// ── 推薦 AI：五維度綜合評分 ────────────────────────────────────────────────
// 過去只用「評分＋量能＋漲幅」的單一熱度公式，等於純技術面追強勢股，
// 完全忽略基本面、籌碼與量價背離 → 容易在財報轉差或主力出貨時追高。
// 改為五個獨立維度各自 0~100 分後加權，並套用排除條件與扣分項。
const REC_WEIGHTS = { tech: 0.30, momentum: 0.20, chips: 0.20, fundamental: 0.20, volume: 0.10 };

function scoreStockDimensions(s, mktRet20 = 0) {
  const a = s.analysis;
  if (!a || !s.ohlcv?.length) return null;
  const closes = s.ohlcv.map(d => d.close);
  const volR = a.volMA ? a.lastVol / a.volMA : 1;
  const clamp = v => Math.max(0, Math.min(100, v));
  const reasons = [], warnings = [];

  // ① 技術面：趨勢結構與指標一致性
  let tech = a.score;
  if (a.ema20 > a.ema50 && a.price > a.ema20) { tech += 8; reasons.push('均線多頭排列'); }
  if (a.ema200 && a.price > a.ema200) tech += 5;
  if (a.macd?.macd > a.macd?.signal && a.macd?.hist > 0) { tech += 5; reasons.push('MACD 金叉擴張'); }
  if (a.adx >= 30) { tech += 6; reasons.push(`ADX ${a.adx.toFixed(0)} 強趨勢`); }
  else if (a.adx != null && a.adx < 18) { tech -= 8; warnings.push('無明確趨勢'); }
  if (a.rsi >= 80) { tech -= 12; warnings.push(`RSI ${a.rsi.toFixed(0)} 嚴重超買`); }
  tech = clamp(tech);

  // ② 動能：中期報酬 + 相對大盤強弱（選股的核心是「贏過大盤」）
  const ret20 = closes.length >= 21 ? (a.price - closes[closes.length-21]) / closes[closes.length-21] * 100 : 0;
  const ret5  = closes.length >= 6  ? (a.price - closes[closes.length-6])  / closes[closes.length-6]  * 100 : 0;
  const rs = ret20 - mktRet20;
  let momentum = 50 + Math.max(-20, Math.min(ret20, 25)) * 1.2 + Math.max(-15, Math.min(rs, 20)) * 1.0;
  if (rs > 5) reasons.push(`20日超越大盤 +${rs.toFixed(1)}%`);
  else if (rs < -8) warnings.push(`落後大盤 ${rs.toFixed(1)}%`);
  momentum = clamp(momentum);

  // ③ 籌碼面：法人動向（連續性比單日更重要）
  let chips = 50;
  const streak = instStreak(s.id);
  if (streak?.days >= 3) {
    if (streak.dir > 0) { chips += 20; reasons.push(`法人連 ${streak.days} 日買超`); }
    else { chips -= 20; warnings.push(`法人連 ${streak.days} 日賣超`); }
  }
  if (s.foreign != null) {
    if (s.foreign > 2000) { chips += 18; reasons.push(`外資買超 ${s.foreign.toLocaleString()} 張`); }
    else if (s.foreign > 300) chips += 8;
    else if (s.foreign < -2000) { chips -= 18; warnings.push('外資大幅賣超'); }
    else if (s.foreign < -300) chips -= 8;
  }
  const oi = s._oi;
  if (oi) {
    if (oi.shortFinRatio >= 30) { chips += 6; reasons.push(`券資比 ${oi.shortFinRatio.toFixed(0)}% 具軋空題材`); }
    if (oi.dFin > 0 && s.foreign != null && s.foreign < -500) { chips -= 10; warnings.push('散戶融資加碼但外資賣超'); }
  }
  chips = clamp(chips);

  // ④ 基本面：營收成長與獲利品質（沒有官方資料時給中性 50，不臆測）
  let fundamental = 50, hasFund = false;
  const rev = s.rev, fin = s._fin;
  if (rev?.yoy != null) {
    hasFund = true;
    if (rev.yoy >= 30) { fundamental += 25; reasons.push(`月營收年增 +${rev.yoy.toFixed(0)}%`); }
    else if (rev.yoy >= 10) { fundamental += 14; reasons.push(`月營收年增 +${rev.yoy.toFixed(0)}%`); }
    else if (rev.yoy <= -20) { fundamental -= 28; warnings.push(`月營收年減 ${rev.yoy.toFixed(0)}%`); }
    else if (rev.yoy <= -5) { fundamental -= 12; warnings.push(`月營收衰退 ${rev.yoy.toFixed(0)}%`); }
  }
  if (fin) {
    hasFund = true;
    if (fin.netMargin != null && fin.netMargin < 0) { fundamental -= 25; warnings.push('本業虧損'); }
    else if (fin.grossMargin >= 35 && fin.netMargin >= 10) { fundamental += 15; reasons.push(`高獲利品質（毛利 ${fin.grossMargin.toFixed(0)}%）`); }
    else if (fin.grossMargin != null && fin.grossMargin < 10) fundamental -= 8;
  }
  const pe = s._fd?.pe;
  if (pe != null && pe > 0) {
    if (pe < 12) fundamental += 6;
    else if (pe > 40) { fundamental -= 10; warnings.push(`本益比 ${pe.toFixed(0)}x 偏高`); }
  }
  fundamental = clamp(fundamental);

  // ⑤ 量價：量能配合度與背離（識破無量假突破）
  let volume = 50;
  if (volR >= 1.3 && volR <= 3 && ret5 > 0) { volume += 22; reasons.push(`量增價漲 ${volR.toFixed(1)}倍`); }
  else if (volR > 3.5) { volume -= 12; warnings.push('爆量，慎防出貨'); }
  else if (volR < 0.6) { volume -= 15; warnings.push('量能萎縮'); }
  if (a.diverg?.type === 'bear') { volume -= 30; warnings.push('量價頂背離'); }
  else if (a.diverg?.type === 'confirm') { volume += 15; reasons.push('量價同步確認'); }
  else if (a.diverg?.type === 'bull') { volume += 10; reasons.push('量價底背離'); }
  volume = clamp(volume);

  const total = tech * REC_WEIGHTS.tech + momentum * REC_WEIGHTS.momentum
              + chips * REC_WEIGHTS.chips + fundamental * REC_WEIGHTS.fundamental
              + volume * REC_WEIGHTS.volume;

  // 排除條件：任一觸發即不推薦（風險明顯大於機會）
  const excluded = s._alert?.level === 'punish' ? '處置股（分盤交易）'
    : (a.diverg?.type === 'bear' && ret20 > 10) ? '量價頂背離且已大漲'
    : (rev?.yoy != null && rev.yoy <= -25) ? '營收嚴重衰退'
    : (fin?.netMargin != null && fin.netMargin < -5) ? '本業明顯虧損'
    : (a.rsi >= 85) ? 'RSI 極度超買'
    : null;

  return {
    tech: Math.round(tech), momentum: Math.round(momentum), chips: Math.round(chips),
    fundamental: Math.round(fundamental), volume: Math.round(volume),
    total: Math.round(total), hasFund, excluded,
    reasons: reasons.slice(0, 4), warnings: warnings.slice(0, 3),
    ret20, ret5, rs,
  };
}

function computeFocusStocks() {
  const valid = allStocks.filter(s => s.analysis && s.ohlcv?.length >= 21);
  if (!valid.length) return { daily: [], weekly: [] };

  const mktRet20 = marketRet20() ?? 0;
  const all = valid.map(s => ({ s, d: scoreStockDimensions(s, mktRet20) })).filter(x => x.d);
  let scored = all.filter(x => !x.d.excluded);
  // 全市場過熱或普遍轉弱時可能全被排除 → 改列排除項中相對最佳者並標明風險，
  // 不讓面板空白（空白無法區分「沒機會」與「系統故障」）
  if (scored.length < 3) {
    const fallback = all.filter(x => x.d.excluded)
      .sort((p, q) => q.d.total - p.d.total)
      .slice(0, 5 - scored.length)
      .map(x => ({ ...x, d: { ...x.d, warnings: [x.d.excluded, ...x.d.warnings].slice(0, 3) } }));
    scored = [...scored, ...fallback];
  }

  // 短線推薦：綜合分數為主，額外看重當日動能與量價
  const daily = scored.map(x => {
    const a = x.s.analysis;
    const chg1 = a.prevClose ? (a.price - a.prevClose) / a.prevClose * 100 : 0;
    const heat = x.d.total + Math.max(-5, Math.min(chg1, 5)) * 1.5 + (x.d.volume - 50) * 0.15;
    return { s: x.s, d: x.d, heat, reasons: x.d.reasons, warnings: x.d.warnings, chg1 };
  }).sort((p, q) => q.heat - p.heat).slice(0, 5);

  // 中線推薦：綜合分數為主，額外看重趨勢延續與基本面
  const weekly = scored.map(x => {
    const a = x.s.analysis;
    const longAligned = a.ema50 && a.ema200 && a.ema50 > a.ema200 && a.price > a.ema50;
    const heat = x.d.total + (longAligned ? 8 : 0) + (x.d.fundamental - 50) * 0.2 + Math.min(x.d.ret20, 20) * 0.3;
    return { s: x.s, d: x.d, heat, reasons: x.d.reasons, warnings: x.d.warnings, ret20: x.d.ret20 };
  }).sort((p, q) => q.heat - p.heat).slice(0, 5);

  return { daily, weekly };
}

function renderFocusStocks() {
  const el = document.getElementById('focus-body');
  if (!el) return;
  const { daily, weekly } = computeFocusStocks();
  if (!daily.length) {
    const ready = allStocks.filter(s => s.analysis).length;
    el.innerHTML = `<div class="adv-loading">${scanning
      ? `掃描中... 已分析 ${ready}/${allStocks.length} 檔，重點股即時產生中`
      : ready === 0
        ? '尚無可用資料 — 請至設定頁執行「🩺 資料源診斷」查看資料源狀態'
        : '資料不足，等待下輪掃描補齊'}</div>`;
    return;
  }

  const dimBar = (lbl, v) => {
    const c = v >= 70 ? 'var(--bull)' : v >= 50 ? 'var(--blue)' : v >= 35 ? 'var(--yellow)' : 'var(--bear)';
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.6rem;color:var(--text3)" title="${lbl} ${v}/100">
      ${lbl}<span style="display:inline-block;width:22px;height:3px;border-radius:2px;background:var(--border)"><span style="display:block;width:${v}%;height:100%;border-radius:2px;background:${c}"></span></span></span>`;
  };
  const item = (f, chgTxt) => `
    <div class="event-row" style="cursor:pointer;align-items:flex-start" onclick="openStock('${f.s.id}')">
      <div class="event-countdown" style="min-width:56px">${f.s.id}</div>
      <div style="flex:1;min-width:0">
        <div class="event-name">${f.s.name}
          <span class="trend-badge trend-${signalClass(verdictSignal(f.s))}" style="font-size:0.62rem;padding:1px 7px;margin-left:4px">${verdictSignal(f.s)}</span>
          ${f.d ? `<span style="font-size:0.62rem;padding:1px 7px;border-radius:8px;background:rgba(0,212,255,0.12);color:var(--blue);font-weight:700;margin-left:3px">綜合 ${f.d.total}</span>` : ''}
        </div>
        <div class="event-date">${f.reasons.join('・') || '綜合動能領先'}</div>
        ${f.d ? `<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:3px">
          ${dimBar('技', f.d.tech)}${dimBar('動', f.d.momentum)}${dimBar('籌', f.d.chips)}${dimBar('基', f.d.fundamental)}${dimBar('量', f.d.volume)}
        </div>` : ''}
        ${f.warnings?.length ? `<div style="font-size:0.66rem;color:var(--yellow);margin-top:3px">⚠ ${f.warnings.join('・')}</div>` : ''}
      </div>
      <span style="font-family:var(--mono);font-size:0.8rem;font-weight:700;color:${chgTxt.v >= 0 ? 'var(--bull)' : 'var(--bear)'}">${chgTxt.v >= 0 ? '+' : ''}${chgTxt.v.toFixed(1)}%<span style="font-size:0.62rem;color:var(--text3);font-weight:400"> ${chgTxt.l}</span></span>
    </div>`;

  el.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">⭐ 重點關注股</h3>
    <span style="font-size:0.7rem;color:var(--text3)">AI 五維度綜合篩選：技術面・動能・籌碼・基本面・量價，並排除背離與衰退股</span>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:10px" class="focus-2col">
      <div>
        <div style="font-size:0.72rem;font-weight:700;color:var(--blue);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">📅 今日必看（短線動能）</div>
        ${daily.map(f => item(f, { v: f.chg1, l: '今日' })).join('')}
      </div>
      <div>
        <div style="font-size:0.72rem;font-weight:700;color:var(--bull);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">🗓 本週追蹤（中期趨勢）</div>
        ${weekly.map(f => item(f, { v: f.ret20, l: '20日' })).join('')}
      </div>
    </div>`;
}

// ── 本週重點財經新聞 ────────────────────────────────────────────────────────


// ── 新聞指向解析：辨識每則新聞針對的產業/公司，彙整多空傾向 ────────────────
let _newsSignals = null;
let _newsRaw = null;

const SECTOR_NEWS_KW = {
  '半導體': /半導體|晶圓|晶片|先進製程|晶圓代工/,
  'IC設計': /IC設計|晶片設計/,
  '記憶體': /記憶體|DRAM|NAND|快閃/,
  '封測': /封測|封裝測試|CoWoS/,
  '伺服器': /伺服器|資料中心|輝達|NVIDIA|GPU|AI ?算力/,
  '面板': /面板|LCD|OLED/,
  'PCB': /PCB|載板|銅箔基板/,
  '被動元件': /被動元件|MLCC/,
  '網通': /網通|交換器/,
  '電腦': /筆電|PC市場/,
  '光學': /光學鏡頭|鏡頭廠/,
  '航運': /航運|貨櫃|運價|海運|散裝/,
  '航空': /航空|客運需求/,
  '金融': /金控|銀行股|壽險|升息|降息|利差|聯準會|Fed/,
  '電信': /電信/,
  '塑化': /塑化|油價|乙烯/,
  '鋼鐵': /鋼鐵|鋼價|不鏽鋼/,
  '水泥': /水泥/,
  '汽車': /車市|電動車/,
  '生技': /生技|新藥|藥證|臨床/,
  '遊戲': /遊戲股|手遊/,
  '電子紙': /電子紙/,
  '紡織': /紡織|成衣/,
  '製鞋': /製鞋|運動鞋代工/,
};

function buildNewsSignals(news) {
  if (!news?.length) { _newsSignals = null; return; }
  const sig = { stocks: {}, sectors: {} };
  const list = getStockList();
  for (const n of news) {
    const d = n.cls === 'bull' ? 1 : n.cls === 'bear' ? -1 : 0;
    // 個股指向：標題直接點名股票名稱
    for (const st of list) {
      if (st.name.length >= 2 && n.headline.includes(st.name)) {
        const o = sig.stocks[st.id] = sig.stocks[st.id] || { name: st.name, score: 0, items: [] };
        o.score += d;
        o.items.push(n.headline.slice(0, 32));
      }
    }
    // 產業指向：關鍵字對應到掃描清單的族群
    for (const [sec, re] of Object.entries(SECTOR_NEWS_KW)) {
      if (re.test(n.headline)) {
        const o = sig.sectors[sec] = sig.sectors[sec] || { score: 0, n: 0, items: [] };
        o.score += d;
        o.n++;
        if (o.items.length < 3) o.items.push({ h: n.headline.slice(0, 40), d });  // 留標題供論點佐證
      }
    }
  }
  _newsSignals = sig;
}

async function renderWeeklyNews() {
  const el = document.getElementById('weekly-news-body');
  if (!el) return;

  // 只用真實新聞（Google News RSS 台股 近 7 日）；多抓幾則提高產業覆蓋
  const news = (await fetchNewsRSS('台股 股市', 12).catch(() => null) || [])
    .map(n => ({ impact: n.source || '台股', ...n }));
  _newsRaw = news;                 // 供盤前簡報篩「假日期間發布」的新聞
  buildNewsSignals(news);
  if (!news.length) {
    el.innerHTML = `<h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">📰 本週重點財經新聞</h3>
      <p style="font-size:0.8rem;color:var(--text3);margin-top:8px">新聞來源暫時無法取得，稍後自動重試</p>`;
    return;
  }
  const isLive = true;

  const bullCount = news.filter(n => n.cls === 'bull').length;
  const bearCount = news.filter(n => n.cls === 'bear').length;
  const overall = bullCount > bearCount + 1 ? { t: '本週新聞面整體偏多', c: 'var(--bull)' }
                : bearCount > bullCount ? { t: '本週新聞面整體偏空', c: 'var(--bear)' }
                : { t: '本週新聞面多空拉鋸', c: 'var(--yellow)' };

  el.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">📰 本週重點財經新聞 ${isLive ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull);vertical-align:2px">● 即時</span>' : ''}</h3>
    <span style="font-size:0.7rem;color:var(--text3)">近 7 日影響台股的關鍵訊息 + AI 多空判讀${isLive ? '（Google News 即時來源）' : ''}</span>
    <div style="margin-top:10px">
      ${news.map(n => `
        <div class="event-row" ${n.link ? `style="cursor:pointer" onclick="window.open('${n.link}','_blank')"` : ''}>
          <div class="event-countdown" style="min-width:44px">${n.date}</div>
          <div style="flex:1">
            <div class="event-name">${n.headline}</div>
            <div class="event-date">來源：${n.impact}</div>
          </div>
          <span class="news-tag ${n.cls}" style="flex-shrink:0">${n.dir}</span>
        </div>`).join('')}
    </div>
    <div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.02);font-size:0.82rem;font-weight:600;color:${overall.c}">
      AI 週判讀：${overall.t}（利多 ${bullCount} 則 / 利空 ${bearCount} 則）
    </div>
    ${(() => {
      // 🧭 新聞解讀大綱：這週新聞點名了哪些產業/公司、各自偏多偏空
      if (!_newsSignals) return '';
      const secs = Object.entries(_newsSignals.sectors)
        .filter(([, v]) => v.score !== 0)
        .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score))
        .slice(0, 6);
      const stks = Object.entries(_newsSignals.stocks)
        .filter(([, v]) => v.score !== 0)
        .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score))
        .slice(0, 6);
      if (!secs.length && !stks.length) return '';
      const chip = (label, sc) => `<span style="font-size:0.72rem;padding:2px 9px;border-radius:10px;background:${sc > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'};color:${sc > 0 ? 'var(--bull)' : 'var(--bear)'};margin:0 6px 6px 0;display:inline-block">${label} ${sc > 0 ? '偏多' : '偏空'}</span>`;
      return `<div style="margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.12)">
        <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:6px">🧭 新聞指向解讀（已納入個股研判）</div>
        ${secs.length ? `<div style="margin-bottom:2px"><span style="font-size:0.7rem;color:var(--text3)">產業：</span>${secs.map(([sec, v]) => chip(`${sec}（${v.n} 則）`, v.score)).join('')}</div>` : ''}
        ${stks.length ? `<div><span style="font-size:0.7rem;color:var(--text3)">個股：</span>${stks.map(([id, v]) => chip(`${v.name}(${id})`, v.score)).join('')}</div>` : ''}
        <div style="font-size:0.66rem;color:var(--text3);margin-top:4px">被點名的個股以小權重（±1.2）注入研判、族群偏向需 ≥2 則同向才注入（±0.6）— 關鍵字判讀非語意理解，僅作佐證不主導方向</div>
      </div>`;
    })()}`;
}

// ── Telegram Notification ──────────────────────────────────────────────────

// 本裝置是否為訊號主機（多裝置時只有主機發通知/建單，避免重複）
function isSignalMaster() {
  return localStorage.getItem('signal-master') !== 'false';
}

// Telegram 憑證單一來源：優先讀輸入框（使用者剛填但還沒儲存也能用），
// 其次讀已儲存值。先前測試功能讀輸入框、其他功能只讀 localStorage，
// 導致「測試成功但每日簡報說未設置 Bot」。
function tgCreds() {
  const el = id => document.getElementById(id)?.value?.trim() || '';
  return {
    token: el('s-tg-token') || localStorage.getItem('tg-token') || '',
    chatId: el('s-tg-chatid') || localStorage.getItem('tg-chatid') || '',
    enabled: document.getElementById('s-tg-toggle')?.checked ?? (localStorage.getItem('tg-enabled') === 'true'),
  };
}

// 說明目前缺什麼，而不是籠統的「未設置」
function tgMissingReason() {
  const c = tgCreds();
  if (!c.token && !c.chatId) return '尚未填寫 Bot Token 與 Chat ID';
  if (!c.token) return '尚未填寫 Bot Token';
  if (!c.chatId) return '尚未填寫 Chat ID';
  if (!c.enabled) return 'Telegram 通知開關未啟用（請在設定頁開啟）';
  return null;
}

// 檢查某類推送是否開啟（主機 + Telegram 開關 + 分類開關 + 憑證齊全）
function tgWants(kind) {
  if (!isSignalMaster()) return false;
  const c = tgCreds();
  if (!c.enabled || !c.token || !c.chatId) return false;
  return localStorage.getItem(`tg-${kind}`) !== 'false';
}

function tgPush(text) {
  const { token, chatId } = tgCreds();
  if (token && chatId) return sendTelegram(token, chatId, text);
}

// ── 當日已推內容登記表：跨訊息類型的內容去重 ────────────────────────────────
// 問題：同一檔股票一天會被「強勢多頭」「進場訊號」「重點關注」「簡報推薦」
// 各推一次 — 每則訊息各自有每日一次的限制，但彼此不知道對方推過什麼。
// 這裡登記「今天已推過哪些內容鍵」（如 sig:2330、hold:2330:watch），
// 各推播先濾掉已推過的，濾完沒剩就整則不發。
function tgSentKeys() {
  const d = twClock().date;
  try {
    const o = JSON.parse(localStorage.getItem('tg-sent-keys') || '{}');
    return o.date === d && Array.isArray(o.keys) ? o : { date: d, keys: [] };
  } catch { return { date: d, keys: [] }; }
}
function tgKeySent(k) { return tgSentKeys().keys.includes(k); }
function tgMarkKeys(keys) {
  const o = tgSentKeys();
  for (const k of keys) if (k && !o.keys.includes(k)) o.keys.push(k);
  try { localStorage.setItem('tg-sent-keys', JSON.stringify(o)); } catch {}
}

// 【已退出自動排程】內容併入 08:30 盤前簡報的【數據倒數】段。
// 保留函式供手動觸發；tg-event-sent 由盤前簡報標記，避免與併入版重複。
function notifyEventPredictions() {
  if (!tgWants('event')) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('tg-event-sent') === today) return;

  const now = new Date();
  const soon = getUpcomingEvents().filter(e => (e.date - now) / 86400000 <= 3);
  if (!soon.length) return;

  const norm = outlookData.norm ?? 0;
  const dir = norm >= 15 ? '📈 預測偏多（市場動能強，數據符合預期時易噴出）'
            : norm <= -15 ? '📉 預測偏空（市場已弱，數據不佳恐加速下跌）'
            : '➡️ 預測中性（建議數據公布前降低部位觀望）';
  const lines = soon.map(e => {
    const days = Math.ceil((e.date - now) / 86400000);
    return `${days <= 0 ? '📌 今日' : `⏳ ${days} 天後`} ${e.name}（影響：${e.impact}）`;
  }).join('\n');
  tgPush(`🗓 重要數據公布倒數\n\n${lines}\n\nAI 事前方向判讀：\n${dir}\n（依市場多空總覽 ${norm} 分）`);
  localStorage.setItem('tg-event-sent', today);
}

// 【已退出自動排程】內容併入 08:30 盤前簡報的「重點關注」列與 09:30 開盤後追蹤。
function notifyDailyFocus() {
  if (!tgWants('focus')) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('tg-focus-sent') === today) return;

  const all = computeFocusStocks();
  // 內容去重：今天已被其他訊號推過的股票不再入列；今日必看濾完沒剩就不發
  const daily = all.daily.filter(f => !tgKeySent(`sig:${f.s.id}`));
  const weekly = all.weekly.filter(f => !tgKeySent(`sig:${f.s.id}`));
  if (!daily.length) { localStorage.setItem('tg-focus-sent', today); return; }

  const dLines = daily.map((f, i) => `${i+1}. ${f.s.name}(${f.s.id}) ${f.chg1 >= 0 ? '+' : ''}${f.chg1.toFixed(1)}%｜${f.reasons.join('・')}`).join('\n');
  const wLines = weekly.map((f, i) => `${i+1}. ${f.s.name}(${f.s.id}) 20日${f.ret20 >= 0 ? '+' : ''}${f.ret20.toFixed(1)}%｜${f.reasons.join('・')}`).join('\n');
  tgPush(`⭐ 台股雷達 每日重點關注 ${today}\n\n📅 今日必看（短線動能）\n${dLines}${weekly.length ? `\n\n🗓 本週追蹤（中期趨勢）\n${wLines}` : ''}`);
  localStorage.setItem('tg-focus-sent', today);
  tgMarkKeys([...daily, ...weekly].map(f => `sig:${f.s.id}`));
}

async function testTelegramNotif() {
  const { token, chatId } = tgCreds();
  if (!token || !chatId) { showToast('請先填寫 Bot Token 和 Chat ID', 'error'); return; }
  const ok = await sendTelegram(token, chatId, '✅ 台股雷達測試訊息\n掃描器運作正常！');
  if (!ok) return;
  // 測試成功即自動儲存並啟用，否則使用者會遇到「測試成功但其他推送說未設置」
  localStorage.setItem('tg-token', token);
  localStorage.setItem('tg-chatid', chatId);
  localStorage.setItem('tg-enabled', 'true');
  const tgl = document.getElementById('s-tg-toggle');
  if (tgl) tgl.checked = true;
  showToast('✅ 測試成功，Telegram 設定已自動儲存並啟用', 'success');
}

async function sendTelegram(token, chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (data.ok) { showToast('Telegram 傳送成功！', 'success'); return true; }
    else { showToast('Telegram 錯誤: ' + (data.description || 'unknown'), 'error'); return false; }
  } catch (e) {
    showToast('Telegram 連線失敗', 'error'); return false;
  }
}

// 【已退出自動排程】強勢多頭清單與簡報的推薦/關注高度重疊 — 相似訊息
// 太多則比重複更擾人。保留函式供手動觸發。
function autoNotifyTelegram() {
  if (!tgWants('sig')) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('tg-strong-sent') === today) return; // 每日一次，避免刷屏

  const bullThresh = getThreshold('bull') + 15;
  // 內容去重：今天已被進場訊號／簡報／重點關注推過的股票不再重推
  const strong = allStocks.filter(s => s.analysis && verdictScore(s) >= bullThresh)
    .filter(s => !tgKeySent(`sig:${s.id}`));
  if (!strong.length) { localStorage.setItem('tg-strong-sent', today); return; }

  const lines = strong.map(s => `${s.name}(${s.id}) 評分 ${verdictScore(s)}｜${verdictSignal(s)}`).join('\n');
  tgPush(`📡 台股雷達 強勢多頭訊號\n${new Date().toLocaleString('zh-TW')}\n\n${lines}`);
  localStorage.setItem('tg-strong-sent', today);
  tgMarkKeys(strong.map(s => `sig:${s.id}`));
}

// ── 大盤 頂/底反轉可能性（儀表板）───────────────────────────────────────────

function calcReversalProb(ohlcv) {
  if (!ohlcv || ohlcv.length < 40) return null;
  const closes = ohlcv.map(d => d.close);
  const vols = ohlcv.map(d => d.volume);
  const price = closes[closes.length - 1];
  const rsi = calcRSI(closes);
  const boll = calcBollinger(closes);
  const hi20 = Math.max(...ohlcv.slice(-20).map(d => d.high));
  const lo20 = Math.min(...ohlcv.slice(-20).map(d => d.low));
  const volMA = calcVolumeMA(vols, 20);
  const volR = volMA ? vols[vols.length - 1] / volMA : 1;

  // 連續漲/跌天數
  let upStreak = 0, dnStreak = 0;
  for (let i = closes.length - 1; i > 0; i--) {
    if (closes[i] > closes[i - 1]) { if (dnStreak) break; upStreak++; }
    else if (closes[i] < closes[i - 1]) { if (upStreak) break; dnStreak++; }
    else break;
  }

  let top = 0, bottom = 0;
  const topWhy = [], botWhy = [];
  if (rsi >= 75) { top += 30; topWhy.push(`RSI ${rsi.toFixed(0)} 嚴重超買`); }
  else if (rsi >= 68) { top += 18; topWhy.push(`RSI ${rsi.toFixed(0)} 偏高`); }
  if (price >= hi20 * 0.995) { top += 20; topWhy.push('貼近 20 日高點'); }
  if (upStreak >= 5) { top += 20; topWhy.push(`連漲 ${upStreak} 天`); }
  else if (upStreak >= 3) { top += 10; topWhy.push(`連漲 ${upStreak} 天`); }
  if (boll && price > boll.upper) { top += 18; topWhy.push('突破布林上軌'); }
  if (volR > 2 && upStreak >= 2) { top += 12; topWhy.push('高檔爆量'); }

  if (rsi <= 25) { bottom += 30; botWhy.push(`RSI ${rsi.toFixed(0)} 嚴重超賣`); }
  else if (rsi <= 33) { bottom += 18; botWhy.push(`RSI ${rsi.toFixed(0)} 偏低`); }
  if (price <= lo20 * 1.005) { bottom += 20; botWhy.push('貼近 20 日低點'); }
  if (dnStreak >= 5) { bottom += 20; botWhy.push(`連跌 ${dnStreak} 天`); }
  else if (dnStreak >= 3) { bottom += 10; botWhy.push(`連跌 ${dnStreak} 天`); }
  if (boll && price < boll.lower) { bottom += 18; botWhy.push('跌破布林下軌'); }
  if (volR > 2 && dnStreak >= 2) { bottom += 12; botWhy.push('低檔爆量（可能止跌換手）'); }

  return { price, top: Math.min(top, 95), bottom: Math.min(bottom, 95), topWhy, botWhy };
}

async function renderTopBottomReversal() {
  const el = document.getElementById('er-dashboard-body');
  if (!el) return;
  // 改用官方來源：Yahoo 對雲端 IP 限流，走 Yahoo 會讓整個面板開天窗
  const results = await Promise.all([
    fetchTWIIOHLC(6).then(b => ({ label: '加權指數 TWII', r: calcReversalProb(b) })).catch(() => ({ label: '加權指數 TWII', r: null })),
    fetchStockOHLCV('0050', '1d', '6mo').then(b => ({ label: '元大台灣50 (0050)', r: calcReversalProb(b) })).catch(() => ({ label: '元大台灣50 (0050)', r: null })),
  ]);
  const valid = results.filter(x => x.r);
  if (!valid.length) { el.innerHTML = '<div class="adv-loading">大盤數據暫時無法取得</div>'; return; }

  el.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">🔄 大盤 頂/底反轉可能性</h3>
    <span style="font-size:0.7rem;color:var(--text3)">依 RSI 極值・連漲跌天數・布林通道・量能綜合評估</span>
    <div class="er-grid" style="margin-top:12px">
      ${valid.map(({ label, r }) => {
        const main = r.top >= r.bottom
          ? { t: '見頂風險', p: r.top, c: 'var(--bear)', why: r.topWhy }
          : { t: '見底機會', p: r.bottom, c: 'var(--bull)', why: r.botWhy };
        const verdict = main.p >= 60 ? '高' : main.p >= 35 ? '中' : '低';
        return `
        <div class="er-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong style="font-size:0.85rem">${label}</strong>
            <span style="font-family:var(--mono);font-size:0.8rem;color:var(--text2)">${r.price.toLocaleString()}</span>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:8px">
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:3px"><span style="color:var(--bear)">見頂 ${r.top}%</span></div>
              <div class="er-bar-track"><div class="er-bar-fill" style="width:${r.top}%;background:var(--bear)"></div></div>
            </div>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:3px"><span style="color:var(--bull)">見底 ${r.bottom}%</span></div>
              <div class="er-bar-track"><div class="er-bar-fill" style="width:${r.bottom}%;background:var(--bull)"></div></div>
            </div>
          </div>
          <div style="font-size:0.74rem;color:${main.c};font-weight:600">${main.t}：${verdict}${main.why.length ? '｜' + main.why.join('・') : '（無明顯極端訊號）'}</div>
        </div>`;
      }).join('')}
    </div>`;
}

// ── AI 機會實驗室 ───────────────────────────────────────────────────────────













// ── 局勢重點（個股頁）───────────────────────────────────────────────────────

function renderSituation(s, inst) {
  const el = document.getElementById('situation-body');
  if (!el || !s.analysis) return;
  const a = s.analysis;
  const sr = calcSR(s.ohlcv);
  const norm = outlookData.norm ?? 0;
  const volR = a.volMA ? a.lastVol / a.volMA : 1;

  const rows = [
    { icon: '📈', name: '趨勢', txt: a.ema20 > a.ema50 && a.price > a.ema20 ? '多頭排列，價格站上均線，順勢偏多' : a.ema20 < a.ema50 && a.price < a.ema20 ? '空頭排列，價格壓在均線下，避免逆勢' : '均線糾結，方向未明，等待表態',
      c: a.ema20 > a.ema50 && a.price > a.ema20 ? 'var(--bull)' : a.ema20 < a.ema50 && a.price < a.ema20 ? 'var(--bear)' : 'var(--yellow)' },
    { icon: '⚡', name: '動能', txt: `RSI ${a.rsi?.toFixed(0)}・MACD ${a.macd?.macd > a.macd?.signal ? '金叉' : '死叉'}・量比 ${volR.toFixed(1)}x — ${a.rsi > 60 && a.macd?.macd > a.macd?.signal ? '動能強勁' : a.rsi < 40 ? '動能疲弱' : '動能中性'}`,
      c: a.rsi > 60 && a.macd?.macd > a.macd?.signal ? 'var(--bull)' : a.rsi < 40 ? 'var(--bear)' : 'var(--text2)' },
    { icon: '🏦', name: '籌碼', txt: inst ? `外資 ${inst.foreign >= 0 ? '+' : ''}${inst.foreign} 張・投信 ${inst.investment >= 0 ? '+' : ''}${inst.investment} 張 — ${inst.total >= 0 ? '法人站買方' : '法人站賣方'}` : '法人資料載入中（TWSE 收盤後更新）',
      c: inst ? (inst.total >= 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--text3)' },
    { icon: '🌡', name: '情緒', txt: `大盤多空總覽 ${norm >= 0 ? '+' : ''}${Math.round(norm)} 分 — ${norm >= 15 ? '市場偏多，順風環境' : norm <= -15 ? '市場偏空，做多逆風' : '市場中性，個股表現分化'}`,
      c: norm >= 15 ? 'var(--bull)' : norm <= -15 ? 'var(--bear)' : 'var(--yellow)' },
    { icon: '🎯', name: '關鍵位', txt: `支撐 ${sr.supports[0]?.toFixed(2) ?? '--'}｜壓力 ${sr.resistances[0]?.toFixed(2) ?? '--'}｜${sr.resistances[0] ? '突破壓力看多、' : ''}${sr.supports[0] ? '跌破支撐立即避險' : ''}`,
      c: 'var(--blue)' },
  ];
  el.innerHTML = rows.map(r => `
    <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <span style="font-size:1rem">${r.icon}</span>
      <div style="flex:1">
        <span style="font-size:0.72rem;font-weight:700;color:var(--text3);margin-right:8px">${r.name}</span>
        <span style="font-size:0.82rem;color:${r.c};line-height:1.6">${r.txt}</span>
      </div>
    </div>`).join('');
}

// ── 買賣壓力分析（訂單流台股版）─────────────────────────────────────────────

function renderOrderFlow(s) {
  const el = document.getElementById('of-body');
  if (!el || !s.ohlcv?.length) return;
  const bars = s.ohlcv.slice(-20);

  // 每日買賣壓：收盤在當日區間的位置 × 成交量（收在高檔=買方主導）
  let buyVol = 0, sellVol = 0;
  const daily = bars.slice(-5).map(b => {
    const range = b.high - b.low || 1;
    const buyRatio = (b.close - b.low) / range;
    return { time: b.time.slice(5), delta: Math.round(b.volume * (buyRatio * 2 - 1)), vol: b.volume };
  });
  for (const b of bars) {
    const range = b.high - b.low || 1;
    const br = (b.close - b.low) / range;
    buyVol += b.volume * br;
    sellVol += b.volume * (1 - br);
  }
  const buyPct = Math.round(buyVol / (buyVol + sellVol) * 100);
  const cumDelta = daily.reduce((s2, d) => s2 + d.delta, 0);
  const maxD = Math.max(...daily.map(d => Math.abs(d.delta)), 1);

  const verdict = buyPct >= 58 ? { t: '🟢 買方明顯主導 — 20 日內買壓持續強於賣壓，籌碼趨於安定', c: 'var(--bull)' }
                : buyPct <= 42 ? { t: '🔴 賣方明顯主導 — 賣壓沉重，反彈易遭調節，不宜接刀', c: 'var(--bear)' }
                : { t: '🟡 買賣力道均衡 — 多空拉鋸，跟隨關鍵位操作', c: 'var(--yellow)' };

  // 盤中真實五檔委託簿（MIS）— 有就顯示；掛單可撤，僅供參考不當成交
  const bk = s._book;
  const bookFresh = bk && Date.now() - bk.at <= 3 * 60 * 1000;
  const bookHtml = bookFresh && bk.bidP?.length ? (() => {
    const maxV = Math.max(...(bk.bidV || [0]), ...(bk.askV || [0]), 1);
    const row = (p, v, side) => p > 0 ? `
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:0.7rem;font-family:var(--mono);width:52px;color:${side === 'bid' ? 'var(--bull)' : 'var(--bear)'}">${p}</span>
        <div style="flex:1;height:7px;background:rgba(255,255,255,0.04);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100, (v || 0) / maxV * 100)}%;background:${side === 'bid' ? 'var(--bull)' : 'var(--bear)'};opacity:0.7"></div>
        </div>
        <span style="font-size:0.68rem;font-family:var(--mono);width:44px;text-align:right;color:var(--text3)">${(v || 0).toLocaleString()}</span>
      </div>` : '';
    const asks = (bk.askP || []).map((p, i) => row(p, bk.askV?.[i], 'ask')).reverse().join('');
    const bids = (bk.bidP || []).map((p, i) => row(p, bk.bidV?.[i], 'bid')).join('');
    const rc = bk.ratio >= 2 ? 'var(--bull)' : bk.ratio != null && bk.ratio <= 0.5 ? 'var(--bear)' : 'var(--text2)';
    return `
    <div style="margin-bottom:12px">
      <div class="fund-block-ttl">盤中五檔委託簿（MIS 即時）</div>
      <div style="display:flex;flex-direction:column;gap:3px;margin-top:6px">${asks}
        <div style="border-top:1px dashed rgba(255,255,255,0.15);margin:2px 0"></div>${bids}</div>
      <div style="font-size:0.7rem;margin-top:5px;color:${rc}">委買 ${bk.bid.toLocaleString()}／委賣 ${bk.ask.toLocaleString()} 張${bk.ratio != null ? `（買賣比 ${bk.ratio.toFixed(2)}）` : ''}
        <span style="color:var(--text3)">— 掛單可隨時撤，僅供參考</span></div>
    </div>`;
  })() : '';

  el.innerHTML = `
    ${bookHtml}
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:5px">
        <span style="color:var(--bull);font-weight:700">買方 ${buyPct}%</span>
        <span style="color:var(--bear);font-weight:700">賣方 ${100 - buyPct}%</span>
      </div>
      <div style="height:12px;border-radius:6px;overflow:hidden;display:flex">
        <div style="width:${buyPct}%;background:var(--bull);opacity:0.85"></div>
        <div style="flex:1;background:var(--bear);opacity:0.85"></div>
      </div>
      <div style="font-size:0.68rem;color:var(--text3);margin-top:4px">依近 20 日收盤位置 × 成交量估算內外盤力道</div>
    </div>
    <div class="fund-block-ttl">近 5 日 Delta（買賣壓差）</div>
    <div style="display:flex;flex-direction:column;gap:5px;margin-top:6px;margin-bottom:12px">
      ${daily.map(d => `
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:0.68rem;color:var(--text3);width:38px;font-family:var(--mono)">${d.time}</span>
          <div style="flex:1;height:8px;background:rgba(255,255,255,0.05);border-radius:4px;position:relative;overflow:hidden">
            <div style="position:absolute;top:0;height:100%;${d.delta >= 0 ? 'left:50%' : 'right:50%'};width:${Math.abs(d.delta) / maxD * 48}%;background:${d.delta >= 0 ? 'var(--bull)' : 'var(--bear)'};border-radius:4px"></div>
          </div>
          <span style="font-size:0.68rem;font-family:var(--mono);width:64px;text-align:right;color:${d.delta >= 0 ? 'var(--bull)' : 'var(--bear)'}">${d.delta >= 0 ? '+' : ''}${fmtVol(Math.abs(d.delta))}</span>
        </div>`).join('')}
    </div>
    <div style="padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.02);font-size:0.83rem;font-weight:600;color:${verdict.c}">
      ${verdict.t}｜5 日累計 Delta ${cumDelta >= 0 ? '+' : ''}${fmtVol(Math.abs(cumDelta))}
    </div>`;
}

// ── 籌碼分佈 Volume Profile（個股頁）────────────────────────────────────────

function renderVolumeProfile(s) {
  const el = document.getElementById('vp-body');
  if (!el || !s.ohlcv?.length) return;
  const ohlcv = s.ohlcv;
  const price = s.analysis?.price ?? ohlcv[ohlcv.length - 1].close;
  const lo = Math.min(...ohlcv.map(d => d.low));
  const hi = Math.max(...ohlcv.map(d => d.high));
  const N = 12;
  const step = (hi - lo) / N || 1;
  const bins = Array.from({ length: N }, (_, i) => ({ lo: lo + i * step, hi: lo + (i + 1) * step, vol: 0 }));
  for (const b of ohlcv) {
    const mid = (b.high + b.low) / 2;
    bins[Math.min(N - 1, Math.max(0, Math.floor((mid - lo) / step)))].vol += b.volume;
  }
  const maxVol = Math.max(...bins.map(b => b.vol), 1);
  const poc = bins.reduce((best, b) => b.vol > best.vol ? b : best, bins[0]);
  const pocMid = (poc.lo + poc.hi) / 2;
  const analysis = price > poc.hi
    ? { t: `股價位於 POC（${pocMid.toFixed(1)}）之上 — 下方密集成交帶轉為支撐，回踩 ${poc.hi.toFixed(1)} 附近有承接力`, c: 'var(--bull)' }
    : price < poc.lo
    ? { t: `股價位於 POC（${pocMid.toFixed(1)}）之下 — 上方密集帶是大量套牢區，反彈至 ${poc.lo.toFixed(1)} 附近賣壓沉重`, c: 'var(--bear)' }
    : { t: `股價正處於 POC 密集帶內（${poc.lo.toFixed(1)}~${poc.hi.toFixed(1)}）— 多空換手激烈，突破方向將決定下一段行情`, c: 'var(--yellow)' };

  el.innerHTML = `
    <div style="display:flex;flex-direction:column-reverse;gap:3px;margin-bottom:12px">
      ${bins.map(b => {
        const isPoc = b === poc;
        const inBar = price >= b.lo && price < b.hi;
        return `
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:0.65rem;font-family:var(--mono);color:${inBar ? 'var(--blue)' : 'var(--text3)'};width:56px;text-align:right;${inBar ? 'font-weight:700' : ''}">${b.lo.toFixed(1)}${inBar ? ' ◀' : ''}</span>
          <div style="flex:1;height:12px;background:rgba(255,255,255,0.03);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${(b.vol / maxVol * 100).toFixed(0)}%;background:${isPoc ? 'var(--blue)' : 'rgba(0,212,255,0.3)'};border-radius:3px"></div>
          </div>
          <span style="font-size:0.62rem;color:var(--text3);width:52px">${isPoc ? 'POC ★' : fmtVol(b.vol)}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.02);font-size:0.82rem;font-weight:600;color:${analysis.c};line-height:1.6">${analysis.t}</div>`;
}

// ── 10 因子 AI 風險評估（個股頁）────────────────────────────────────────────

function renderFullRisk(s, inst) {
  const el = document.getElementById('full-risk-body');
  if (!el || !s.analysis) return;
  const a = s.analysis;
  const closes = s.ohlcv.map(d => d.close);
  const volR = a.volMA ? a.lastVol / a.volMA : 1;
  const norm = outlookData.norm ?? 0;
  // ATR%（14日平均振幅）
  const tr14 = s.ohlcv.slice(-14).map(d => (d.high - d.low) / d.close * 100);
  const atrPct = tr14.reduce((x, y) => x + y, 0) / tr14.length;
  const dev20 = a.ema20 ? Math.abs(a.price - a.ema20) / a.ema20 * 100 : 0;
  const hi60 = Math.max(...s.ohlcv.slice(-60).map(d => d.high));
  const lo60 = Math.min(...s.ohlcv.slice(-60).map(d => d.low));
  const posIn60 = (a.price - lo60) / (hi60 - lo60 || 1);
  const turnover = a.price * a.lastVol;

  const factors = [
    { n: '趨勢方向', r: a.ema20 > a.ema50 && a.price > a.ema20 ? 2 : a.ema20 < a.ema50 && a.price < a.ema20 ? 8 : 5, note: a.ema20 > a.ema50 ? '多頭排列' : '均線壓制' },
    { n: 'RSI 位置', r: a.rsi >= 50 && a.rsi < 68 ? 2 : a.rsi >= 78 || a.rsi < 25 ? 9 : a.rsi >= 68 || a.rsi < 35 ? 6 : 4, note: `RSI ${a.rsi?.toFixed(0)}` },
    { n: '波動率', r: atrPct < 2 ? 2 : atrPct < 3.5 ? 5 : 8, note: `日均振幅 ${atrPct.toFixed(1)}%` },
    { n: '量能異常', r: volR > 3 ? 8 : volR > 1.5 ? 4 : volR < 0.5 ? 6 : 3, note: `量比 ${volR.toFixed(1)}x` },
    { n: '均線乖離', r: dev20 < 3 ? 2 : dev20 < 6 ? 5 : 8, note: `距 EMA20 ${dev20.toFixed(1)}%` },
    { n: '大盤環境', r: norm >= 15 ? 2 : norm >= -15 ? 5 : 9, note: `多空總覽 ${Math.round(norm)}` },
    { n: '法人動向', r: inst ? (inst.total > 0 ? 3 : 7) : 5, note: inst ? (inst.total > 0 ? '法人買超' : '法人賣超') : '待更新' },
    { n: '流動性', r: turnover > 1e9 ? 2 : turnover > 2e8 ? 4 : 7, note: `日成交值 ${fmtVol(turnover)}` },
    { n: '位置風險', r: posIn60 > 0.9 ? 7 : posIn60 < 0.15 ? 6 : posIn60 > 0.6 ? 4 : 3, note: `60日區間 ${(posIn60 * 100).toFixed(0)}% 位置` },
    { n: '訊號一致性', r: a.score >= 70 || a.score <= 30 ? 3 : 6, note: a.score >= 70 || a.score <= 30 ? '指標方向一致' : '指標分歧' },
  ];
  const avg = factors.reduce((x, f) => x + f.r, 0) / factors.length;
  const overall = avg <= 3.5 ? { t: '整體風險：低', c: 'var(--bull)' } : avg <= 5.5 ? { t: '整體風險：中', c: 'var(--yellow)' } : { t: '整體風險：高', c: 'var(--bear)' };

  el.innerHTML = `
    <div class="adv-section">
      <div class="adv-section-hdr">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        10 因子 AI 風險評估
        <span style="margin-left:auto;font-size:0.78rem;font-weight:700;color:${overall.c}">${overall.t}（${avg.toFixed(1)}/10）</span>
      </div>
      <div class="adv-section-body">
        <div class="risk10-grid">
          ${factors.map(f => {
            const c = f.r <= 3 ? 'var(--bull)' : f.r <= 5 ? 'var(--yellow)' : 'var(--bear)';
            return `
            <div class="risk10-item">
              <div style="display:flex;justify-content:space-between;font-size:0.73rem;margin-bottom:4px">
                <span style="color:var(--text2)">${f.n}</span>
                <span style="color:${c};font-family:var(--mono);font-weight:700">${f.r}/10</span>
              </div>
              <div style="height:5px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${f.r * 10}%;background:${c};border-radius:3px"></div>
              </div>
              <div style="font-size:0.66rem;color:var(--text3);margin-top:3px">${f.note}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

// ── 每日市場簡報（手動觸發 Telegram）────────────────────────────────────────

function manualSendDailyBriefing(silent = false) {
  const miss = tgMissingReason();
  if (miss) {
    if (!silent) showToast(`無法發送：${miss}`, 'error');
    return false;
  }
  if (!allStocks.some(s => s.analysis)) {
    if (!silent) showToast('請先等掃描完成', 'error');
    return false;
  }

  const norm = outlookData.norm ?? 0;
  const mkt = norm >= 15 ? '📈 偏多' : norm <= -15 ? '📉 偏空' : '➡️ 中性';
  const { daily } = computeFocusStocks();
  const dLines = daily.slice(0, 5).map((f, i) => `${i + 1}. ${f.s.name}(${f.s.id}) ${f.chg1 >= 0 ? '+' : ''}${f.chg1.toFixed(1)}%｜${f.reasons.join('・')}`).join('\n');
  const now = new Date();
  const events = getUpcomingEvents().slice(0, 3).map(e => {
    const days = Math.ceil((e.date - now) / 86400000);
    return `・${e.name}（${days <= 0 ? '今日' : days + '天後'}）`;
  }).join('\n');
  const bulls = allStocks.filter(s => s.analysis?.score >= getThreshold('bull')).length;
  const bears = allStocks.filter(s => s.analysis && verdictScore(s) <= getThreshold('bear')).length;

  tgPush(`📊 台股雷達 每日市場簡報\n${now.toLocaleDateString('zh-TW')}\n\n🌡 大盤環境：${mkt}（多空總覽 ${Math.round(norm)} 分）\n市場寬度：多頭 ${bulls} 檔 / 空頭 ${bears} 檔\n\n⭐ 今日重點關注\n${dLines}\n\n🗓 即將公布\n${events}\n\n⚠ 僅供參考，非投資建議`);
  return true;
}

// ── 每日簡報自動發送（每天 9:00，開啟網頁時若已過 9 點且未發送則補發）──
function startDailyBriefingCheck() {
  const tryDailyBrief = () => {
    if (!inNotifyWindow()) return;          // 非交易時段不發
    const now = new Date();
    if (now.getHours() < 9) return;
    const today = now.toDateString();
    if (localStorage.getItem('daily-brief-sent') === today) return;
    if (manualSendDailyBriefing(true)) {
      localStorage.setItem('daily-brief-sent', today);
    }
  };
  // 掃描完成後補發一次 + 之後每分鐘檢查（準時 9 點觸發）
  setTimeout(tryDailyBrief, 60 * 1000);
  setInterval(tryDailyBrief, 60 * 1000);
}

// ── 策略歷史回測 ────────────────────────────────────────────────────────────



// ── 價格警報系統 ────────────────────────────────────────────────────────────

function getAlerts() {
  try { return JSON.parse(localStorage.getItem('price-alerts') || '[]'); } catch { return []; }
}
function saveAlerts(a) { localStorage.setItem('price-alerts', JSON.stringify(a)); }

function addAlert() {
  if (!currentStockId) return;
  const above = parseFloat(document.getElementById('alert-above').value);
  const below = parseFloat(document.getElementById('alert-below').value);
  if (!above && !below) { showToast('請輸入至少一個提醒價', 'error'); return; }

  const meta = getStockList().find(s => s.id === currentStockId) || { name: currentStockId };
  const alerts = getAlerts();
  if (above) alerts.push({ uid: Date.now() + '-a', id: currentStockId, name: meta.name, type: 'above', price: above });
  if (below) alerts.push({ uid: Date.now() + '-b', id: currentStockId, name: meta.name, type: 'below', price: below });
  saveAlerts(alerts);
  document.getElementById('alert-above').value = '';
  document.getElementById('alert-below').value = '';
  renderAlertList();
  showToast('警報已設定，觸價時將通知', 'success');

  // 申請瀏覽器通知權限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function removeAlert(uid) {
  saveAlerts(getAlerts().filter(a => a.uid !== uid));
  renderAlertList();
}

function renderAlertList() {
  const el = document.getElementById('alert-list');
  if (!el) return;
  const alerts = getAlerts();
  if (!alerts.length) { el.innerHTML = '<p style="font-size:0.78rem;color:var(--text3)">尚未設定任何警報</p>'; return; }
  el.innerHTML = alerts.map(a => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:rgba(255,255,255,0.02);border-radius:8px;margin-bottom:6px">
      <span style="font-size:0.8rem;cursor:pointer" onclick="openStock('${a.id}')">
        ${a.name}(${a.id})
        <span style="color:${a.type === 'above' ? 'var(--bull)' : 'var(--bear)'};font-family:var(--mono);margin-left:6px">${a.type === 'above' ? '漲破' : '跌破'} ${a.price}</span>
      </span>
      <button class="del-trade-btn" onclick="removeAlert('${a.uid}')" title="刪除">×</button>
    </div>`).join('');
}

// 掃描後檢查觸價（觸發即推送並移除，一次性警報）
function checkAlerts() {
  const alerts = getAlerts();
  if (!alerts.length) return;
  const remaining = [];
  for (const a of alerts) {
    const s = allStocks.find(x => x.id === a.id);
    const price = s?.analysis?.price;
    if (price == null) { remaining.push(a); continue; }
    const hit = (a.type === 'above' && price >= a.price) || (a.type === 'below' && price <= a.price);
    if (!hit) { remaining.push(a); continue; }

    const msg = `🔔 價格警報觸發\n${a.name}(${a.id}) 現價 ${price}\n已${a.type === 'above' ? '漲破' : '跌破'}警報價 ${a.price}`;
    showToast(msg.replace(/\n/g, ' '), a.type === 'above' ? 'success' : 'error');
    if (localStorage.getItem('tg-enabled') === 'true') tgPush(msg);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('台股雷達 價格警報', { body: `${a.name}(${a.id}) 現價 ${price}，已${a.type === 'above' ? '漲破' : '跌破'} ${a.price}` });
    }
  }
  saveAlerts(remaining);
  renderAlertList();
}

// ── UI Helpers ─────────────────────────────────────────────────────────────

function showScanBar(show) {
  document.getElementById('scan-bar').style.display = show ? '' : 'none';
}

function setScanProgress(pct, text) {
  document.getElementById('scan-bar-fill').style.width = pct + '%';
  document.getElementById('scan-bar-txt').textContent = text;
}

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 3500);
}

function hideLoader() {
  const overlay = document.getElementById('loading-overlay');
  const bar     = document.getElementById('loading-bar');
  bar.style.width = '100%';
  setTimeout(() => overlay.classList.add('hidden'), 500);
}

function updateLoadingText(txt) {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = txt;
}

function animateBar() {
  const bar = document.getElementById('loading-bar');
  let w = 0;
  const iv = setInterval(() => {
    w += 2;
    bar.style.width = Math.min(w, 85) + '%';
    if (w >= 85) clearInterval(iv);
  }, 80);
}

// ── Color / Class Helpers ──────────────────────────────────────────────────

function signalClass(sig) {
  if (sig === '強勢多頭') return 'sbull';
  if (sig === '多頭') return 'bull';
  if (sig === '強勢空頭') return 'sbear';
  if (sig === '空頭') return 'bear';
  return 'neutral';
}

function signalColor(sig) {
  if (sig === '強勢多頭' || sig === '多頭') return 'var(--bull)';
  if (sig === '強勢空頭' || sig === '空頭') return 'var(--bear)';
  return 'var(--neutral)';
}

function scoreToColor(score) {
  if (score >= 70) return 'var(--bull)';
  if (score >= 55) return '#86efac';
  if (score >= 45) return 'var(--neutral)';
  if (score >= 30) return '#fca5a5';
  return 'var(--bear)';
}

function rsiClass(rsi) {
  if (!rsi) return '';
  if (rsi >= 70) return 'change-dn';
  if (rsi >= 50) return 'change-up';
  if (rsi <= 30) return '';
  return '';
}

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  animateBar();
  renderSignalLog();   // 流水帳存在 localStorage，掃描完成前就能看到今天已發過的訊號
  setTimeout(initApp, 600);
});
