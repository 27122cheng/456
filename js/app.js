// ── State ──────────────────────────────────────────────────────────────────

const DEFAULT_STOCKS = [
  { id:'2330', name:'台積電',    sector:'半導體' },
  { id:'2303', name:'聯電',      sector:'半導體' },
  { id:'2454', name:'聯發科',    sector:'半導體' },
  { id:'3711', name:'日月光投控',sector:'半導體' },
  { id:'2379', name:'瑞昱',      sector:'半導體' },
  { id:'3034', name:'聯詠',      sector:'IC設計' },
  { id:'6770', name:'力積電',    sector:'半導體' },
  { id:'2317', name:'鴻海',      sector:'電子製造' },
  { id:'2382', name:'廣達',      sector:'伺服器' },
  { id:'6669', name:'緯穎',      sector:'伺服器' },
  { id:'2308', name:'台達電',    sector:'電子零組件' },
  { id:'2357', name:'華碩',      sector:'電腦' },
  { id:'2353', name:'宏碁',      sector:'電腦' },
  { id:'2376', name:'技嘉',      sector:'電腦' },
  { id:'3008', name:'大立光',    sector:'光學' },
  { id:'2409', name:'友達',      sector:'面板' },
  { id:'3481', name:'群創',      sector:'面板' },
  { id:'4938', name:'和碩',      sector:'電子製造' },
  { id:'2395', name:'研華',      sector:'工業電腦' },
  { id:'2881', name:'富邦金',    sector:'金融' },
  { id:'2882', name:'國泰金',    sector:'金融' },
  { id:'2886', name:'兆豐金',    sector:'金融' },
  { id:'2891', name:'中信金',    sector:'金融' },
  { id:'2892', name:'第一金',    sector:'金融' },
  { id:'5880', name:'合庫金',    sector:'金融' },
  { id:'2884', name:'玉山金',    sector:'金融' },
  { id:'2885', name:'元大金',    sector:'金融' },
  { id:'2412', name:'中華電',    sector:'電信' },
  { id:'4904', name:'遠傳',      sector:'電信' },
  { id:'3045', name:'台灣大',    sector:'電信' },
  { id:'1301', name:'台塑',      sector:'塑化' },
  { id:'1303', name:'南亞',      sector:'塑化' },
  { id:'6505', name:'台塑化',    sector:'石化' },
  { id:'2002', name:'中鋼',      sector:'鋼鐵' },
  { id:'2912', name:'統一超',    sector:'零售' },
  { id:'1216', name:'統一',      sector:'食品' },
  { id:'2474', name:'可成',      sector:'機殼' },
  { id:'3019', name:'亞光',      sector:'光學' },
  { id:'9910', name:'豐泰',      sector:'橡膠' },
  { id:'0050', name:'元大台灣50',sector:'ETF' },
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

  const stocks = getStockList();
  allStocks = stocks.map(s => ({ ...s, ohlcv: [], analysis: null, reversal: null }));

  showScanBar(true);
  updateLoadingText('掃描台股技術指標...');

  // Fetch market index + outlook + institutional overview in parallel
  fetchTWII().then(renderMarketIndex).catch(() => {});
  loadMarketOutlook();
  loadInstitutionalOverview();
  fetchTWDayAll().catch(() => {});   // 預熱官方全市場行情（不走 proxy，供全部個股合併最新價）
  // 預熱月營收與季報，掛到 allStocks 供推薦 AI 的基本面維度使用
  fetchRevenueAll().then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s.rev = m[s.id]; });
    renderFocusStocks();
  }).catch(() => {});
  fetchFinancialsAll().then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s._fin = m[s.id]; });
    renderFocusStocks();
  }).catch(() => {});
  fetchTWFundAll().then(m => {
    if (!m) return;
    allStocks.forEach(s => { if (m[s.id]) s._fd = m[s.id]; });
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
      showToast(`⚠ ${still.length} 檔歷史資料載入失敗：${still.slice(0, 5).map(x => x.name).join('、')}${still.length > 5 ? '…' : ''}（價格改用官方行情，下輪自動重試）`, 'error');
    }
  }

  setScanProgress(100, '掃描完成');
  setTimeout(() => showScanBar(false), 1500);
  const lu = document.getElementById('last-updated');
  if (lu) lu.textContent = new Date().toLocaleTimeString('zh-TW');

  // 掃描後的收尾工作各自獨立，任一失敗都不影響其他項目
  const after = (label, fn) => { try { fn(); } catch (e) { console.warn(`${label} 失敗:`, e); } };
  after('市場多空總覽', renderMarketOutlook);   // 需等 breadth（多空家數）算完
  after('重點關注股', renderFocusStocks);
  // AI 預測準確度：先結算到期預測，再記錄今日預測（順序不可調換）
  after('結算預測', resolvePredictions);
  after('記錄預測', recordPredictions);
  after('預測準確度', renderPredAccuracy);
  after('機會實驗室', () => { if (currentPage === 'lab') renderLab(); });
  after('我的持倉', renderHoldings);
  after('價格警報', checkAlerts);
  after('Telegram 推送', () => {
    autoNotifyTelegram(); notifyEventPredictions(); notifyDailyFocus();
    notifyEntrySignals();   // 適合進場的訊號
    notifyHoldingExits();   // 持倉出場檢查
  });
}

// ── Dashboard Rendering ────────────────────────────────────────────────────

function renderDashboard() {
  const ready = allStocks.filter(s => s.analysis);

  const bull   = ready.filter(s => s.analysis.score >= getThreshold('bull'));
  const bear   = ready.filter(s => s.analysis.score <= getThreshold('bear'));
  const neutral = ready.filter(s => s.analysis.score > getThreshold('bear') && s.analysis.score < getThreshold('bull'));

  // Counters
  document.getElementById('ov-total').textContent   = ready.length;
  document.getElementById('ov-bull').textContent    = bull.length;
  document.getElementById('ov-bear').textContent    = bear.length;
  document.getElementById('ov-neutral').textContent = neutral.length;

  // Bull table
  const bullSorted = [...bull].sort((a, b) => b.analysis.score - a.analysis.score).slice(0, 10);
  document.getElementById('bull-count').textContent = bull.length;
  document.getElementById('bull-tbody').innerHTML = bullSorted.length
    ? bullSorted.map(s => stockTableRow(s)).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:16px">目前無多頭訊號</td></tr>';

  // Bear table
  const bearSorted = [...bear].sort((a, b) => a.analysis.score - b.analysis.score).slice(0, 10);
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
  const scoreColor = scoreToColor(a.score);

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
    <td><span class="trend-badge trend-${signalClass(a.signal)}">${a.signal}</span></td>
    <td>
      <div class="score-inline">
        <div class="score-mini-bar"><div class="score-mini-fill" style="width:${a.score}%;background:${scoreColor}"></div></div>
        <span class="score-val">${a.score}</span>
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
  // 大盤量能（無量下跌／爆量止跌）— 另外抓，回來再刷新一次
  fetchMarketTurnover().then(rows => {
    const t = analyzeTurnover(rows);
    if (t) { outlookData.turnover = t; renderMarketOutlook(); }
  }).catch(() => {});
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
    const bullN = ready.filter(s => s.analysis.score >= getThreshold('bull')).length;
    const bearN = ready.filter(s => s.analysis.score <= getThreshold('bear')).length;
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
  const fullMax = OUTLOOK_SYMBOLS.reduce((n, c) => n + Math.abs(c.weight) * (c.type === 'vix' ? 2 : 1), 0) + 2 + 2;
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
  if (twii) predict += ` 加權指數 5 日${twii.chg5 >= 0 ? '上漲' : '下跌'} ${Math.abs(twii.chg5).toFixed(1)}%`;
  if (sox)  predict += `，費半 5 日${sox.chg5 >= 0 ? '+' : ''}${sox.chg5.toFixed(1)}%（台股電子權值高度連動）`;
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
    const bullPct = ready.filter(s => s.analysis.score >= getThreshold('bull')).length / ready.length;
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
      if (!arr.some(r => r.d === dataDate)) arr.push({ d: dataDate, f: m.foreign, i: m.investment, dl: m.dealer });
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

// ── Ranking ────────────────────────────────────────────────────────────────

function renderRanking() {
  const ready = allStocks.filter(s => s.analysis);
  let filtered = rankingFilter === 'all' ? ready : ready.filter(s => s.analysis.signal === rankingFilter);

  // Search filter
  const q = document.getElementById('dash-search')?.value?.toLowerCase() || '';
  if (q) filtered = filtered.filter(s => s.id.includes(q) || s.name.includes(q));

  // Sort
  filtered.sort((a, b) => {
    let va, vb;
    if (rankingSort.col === 'score') { va = a.analysis.score; vb = b.analysis.score; }
    else if (rankingSort.col === 'price') { va = a.analysis.price; vb = b.analysis.price; }
    else if (rankingSort.col === 'rsi') { va = a.analysis.rsi || 0; vb = b.analysis.rsi || 0; }
    else if (rankingSort.col === 'adx') { va = a.analysis.adx || 0; vb = b.analysis.adx || 0; }
    else { va = a.analysis.score; vb = b.analysis.score; }
    return rankingSort.dir * (vb - va);
  });

  document.getElementById('ranking-subtitle').textContent = `共 ${filtered.length} 檔 · 依評分排名`;
  document.getElementById('ranking-tbody').innerHTML = filtered.length
    ? filtered.map((s, i) => rankingRow(s, i + 1)).join('')
    : '<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:24px">無符合條件的股票</td></tr>';
}

function rankingRow(s, rank) {
  const a = s.analysis;
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

  // ── 多空證據加權（模擬經理人的權衡過程）──
  const bull = [], bear = [], notes = [];
  let dir = 0; // 正=偏多、負=偏空
  if (a.ema20 > a.ema50 && price > a.ema20) { dir += 2; bull.push('均線多頭排列且站穩 EMA20'); }
  else if (price < a.ema20) { dir -= 1.5; bear.push('跌破 EMA20 短均'); }
  if (a.ema200 && price > a.ema200) { dir += 1; bull.push('股價在年線 EMA200 之上（長多結構）'); }
  else if (a.ema200 && price < a.ema200) { dir -= 1; bear.push('股價在年線之下（長空結構）'); }
  if (macdBull && a.macd?.hist > 0) { dir += 1; bull.push('MACD 金叉且動能柱擴張'); }
  else if (!macdBull) { dir -= 1; bear.push('MACD 死叉'); }
  if (a.adx >= 30) { dir += (dir >= 0 ? 1 : -1); notes.push(`ADX ${a.adx.toFixed(0)} 趨勢強勁`); }
  else if (a.adx < 20) { notes.push(`ADX ${a.adx.toFixed(0)} 無明確趨勢（盤整）`); }
  if (a.rsi >= 50 && a.rsi < 68) { dir += 0.5; bull.push(`RSI ${a.rsi.toFixed(0)} 健康多方`); }
  else if (a.rsi >= 72) { dir -= 0.5; bear.push(`RSI ${a.rsi.toFixed(0)} 過熱，追高風險`); }
  else if (a.rsi < 32) { notes.push(`RSI ${a.rsi.toFixed(0)} 超賣，可能技術反彈`); }
  if (volR >= 1.3 && volR <= 3 && ret5 > 0) { dir += 0.5; bull.push(`量增價漲（量比 ${volR.toFixed(1)}）`); }
  else if (volR > 3.5) { dir -= 0.3; bear.push('爆量，慎防出貨'); }
  else if (volR < 0.6) { notes.push('量能萎縮，追價意願低'); }
  if (foreign != null && foreign > 1000) { dir += 1; bull.push(`外資買超 ${foreign.toLocaleString()} 張`); }
  else if (foreign != null && foreign < -1000) { dir -= 1; bear.push(`外資賣超 ${Math.abs(foreign).toLocaleString()} 張`); }

  // 量價背離：最能識破假突破的訊號，權重高
  if (a.diverg?.type === 'bear') { dir -= 1.5; bear.push(a.diverg.txt); }
  else if (a.diverg?.type === 'bull') { dir += 1; bull.push(a.diverg.txt); }
  else if (a.diverg?.type === 'confirm') { dir += 0.5; bull.push(a.diverg.txt); }
  // 波動狀態
  if (a.squeeze?.state === 'squeeze') notes.push(a.squeeze.txt);
  else if (a.squeeze?.state === 'expansion') notes.push(a.squeeze.txt);

  // 月營收年增率（台股最重要的即時基本面指標：營收翻揚常領先股價）
  const rev = s.rev;
  if (rev?.yoy != null) {
    if (rev.yoy >= 30) { dir += 1.5; bull.push(`月營收年增 +${rev.yoy.toFixed(1)}%（高成長）`); }
    else if (rev.yoy >= 10) { dir += 0.8; bull.push(`月營收年增 +${rev.yoy.toFixed(1)}%`); }
    else if (rev.yoy <= -20) { dir -= 1.5; bear.push(`月營收年減 ${rev.yoy.toFixed(1)}%（衰退）`); }
    else if (rev.yoy <= -5) { dir -= 0.8; bear.push(`月營收年減 ${rev.yoy.toFixed(1)}%`); }
    if (rev.cumYoy != null && rev.yoy > 0 && rev.cumYoy < 0)
      notes.push('單月轉正但累計仍負 — 復甦初期，續航待觀察');
  }

  // 獲利品質（官方季報）：高毛利＋正淨利 = 有本質支撐，虧損股追高風險高
  const fin = s._fin;
  if (fin) {
    if (fin.netMargin != null && fin.netMargin < 0) { dir -= 1; bear.push(`本業虧損（淨利率 ${fin.netMargin.toFixed(1)}%）`); }
    else if (fin.grossMargin != null && fin.grossMargin >= 35 && fin.netMargin > 8) { dir += 0.8; bull.push(`高獲利品質（毛利率 ${fin.grossMargin.toFixed(0)}%、淨利率 ${fin.netMargin.toFixed(0)}%）`); }
    else if (fin.grossMargin != null && fin.grossMargin < 10) notes.push(`毛利率僅 ${fin.grossMargin.toFixed(1)}%，缺乏定價能力`);
  }

  // 法人連續買/賣超天數（用逐日累積的真實歷史，連續性比單日更有意義）
  const streak = instStreak(s.id);
  if (streak) {
    if (streak.dir > 0 && streak.days >= 3) { dir += 1; bull.push(`法人連續 ${streak.days} 日買超（累計 ${streak.total.toLocaleString()} 張）`); }
    else if (streak.dir < 0 && streak.days >= 3) { dir -= 1; bear.push(`法人連續 ${streak.days} 日賣超（累計 ${Math.abs(streak.total).toLocaleString()} 張）`); }
  }
  if (oi) {
    if (oi.dFin > 0 && foreign != null && foreign < -500) { dir -= 0.5; bear.push('散戶融資加碼但外資站賣方（籌碼對作）'); }
    if (oi.shortFinRatio >= 30) { notes.push(`券資比 ${oi.shortFinRatio.toFixed(0)}%，具軋空題材`); }
    if (oi.dShort > 0 && dir > 0) notes.push('融券增溫，若持續走強有軋空助攻');
  }
  const mktNorm = outlookData.norm ?? 0;
  if (mktNorm >= 15) { dir += 0.5; notes.push('大盤環境偏多'); }
  else if (mktNorm <= -15) { dir -= 1; bear.push('大盤環境偏空，做多逆風'); }
  let mtfAligned = null;
  if (mtf?.length) {
    const dirs = mtf.map(m => m.score == null ? 0 : m.score > 55 ? 1 : m.score < 45 ? -1 : 0);
    const bn = dirs.filter(d => d === 1).length, sn = dirs.filter(d => d === -1).length;
    if (bn === 3) { dir += 1; mtfAligned = 'bull'; bull.push('60分/日/週三週期同步偏多'); }
    else if (sn === 3) { dir -= 1; mtfAligned = 'bear'; bear.push('三週期同步偏空'); }
    else if (bn >= 2) notes.push('多數週期偏多，短週期待確認');
    else if (sn >= 2) notes.push('多數週期偏空');
    else notes.push('各週期分歧，方向未明');
  }

  // ── 綜合裁決 ──
  const nearHigh = price >= hi20 * 0.985;
  const nearSup = price <= sup * 1.03;
  let stance, stanceColor, headline;
  if (dir >= 4) { stance = '強勢偏多'; stanceColor = 'var(--bull)'; }
  else if (dir >= 2) { stance = '偏多'; stanceColor = 'var(--bull)'; }
  else if (dir <= -3) { stance = '明顯偏空'; stanceColor = 'var(--bear)'; }
  else if (dir <= -1) { stance = '轉弱'; stanceColor = 'var(--yellow)'; }
  else { stance = '中性觀望'; stanceColor = 'var(--text2)'; }

  // ── 建議持有期 ──
  let horizon, horizonDays;
  if (a.adx >= 30 && a.ema50 && a.ema200 && a.ema50 > a.ema200 && dir >= 2) { horizon = '中長期上升結構'; horizonDays = '均線多頭排列且趨勢強度足夠，結構通常延續數週至數月'; }
  else if (dir >= 2) { horizon = '短期偏多結構'; horizonDays = '動能偏正但趨勢尚未確立，關注是否站穩 EMA20'; }
  else if (dir <= -1) { horizon = '下降結構'; horizonDays = '均線與動能皆偏空，尚無止穩訊號'; }
  else { horizon = '區間震盪'; horizonDays = '方向未明，等待突破或跌破區間表態'; }


  return {
    dir, stance, stanceColor, bull, bear, notes,
    horizon, horizonDays, atr, atrPct,
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
      <span style="font-size:0.7rem;color:var(--text3)">多空傾向指數 ${conf}/100</span>
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
  const riskPct = (lo - stop) / lo * 100;
  const stopBasis = [];
  if (stopCapped) {
    stopBasis.push(`結構支撐距離過遠，改以風險上限 ${riskPct.toFixed(1)}%（${(maxRisk / atr).toFixed(1)}×ATR）設定`);
  } else {
    if (m.sup && stop < m.sup) stopBasis.push(`低於支撐位 ${m.sup}（跌破代表支撐失守）`);
    if (stop < low5) stopBasis.push(`低於近 5 日最低 ${low5.toFixed(2)}`);
    stopBasis.push(`保留 ${((lo - stop) / atr).toFixed(1)}×ATR 緩衝，避免日常波動誤觸`);
  }
  if (a.ema50 && stop < a.ema50) stopBasis.push('位於季線之下，跌破即中期轉弱');

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

  return {
    ok: true, lo, hi, stop, t1, t2, riskPct, holdOn, targetNote, trail,
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
        <span>參考持有 ${p.horizon}</span>
      </div>

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
  ['inst-body','setup-body','mtf-body','fund-body','chip-body','oi-body','sr-body','mkt-body','ind-body','ai-anal-body','situation-body','of-body','vp-body'].forEach(id => {
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
    if (aab) aab.innerHTML = `<div class="adv-loading">${q?.close
      ? '價格為官方當日行情（TWSE/TPEx）。歷史 K 線暫時無法取得，技術分析與圖表稍後重試。'
      : '個股資料載入失敗（資料來源逾時，或代號不存在/已下市）'}<br>
      <button class="btn-ghost" style="margin-top:10px;padding:6px 16px" onclick="openStock('${stockId}')">🔄 重新載入</button></div>`;
    return;
  }

  s._mtf = null; s._oi = null;
  renderStockDetail(s);
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
    fetchFinancials(stockId).catch(() => null),
  ]).then(([rev, fin]) => {
    if (currentStockId !== stockId || (!rev && !fin)) return;
    if (rev) s.rev = rev;
    if (fin) s._fin = fin;
    renderManagerVerdict(s);
    renderAnalysisPanels(s, s._inst || null);
  }).catch(() => {});
}

// ── 未平倉部位 O.I（融資融券餘額）───────────────────────────────────────────
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

  // 季度財報（官方綜合損益表）：毛利率/營益率/淨利率是判斷獲利品質的核心
  if (s._fin === undefined) { s._fin = await fetchFinancials(s.id).catch(() => null); }
  const fin = s._fin;
  const finHtml = fin ? (() => {
    const pct = (v, good, bad) => v == null ? '<span style="color:var(--text3)">--</span>'
      : `<span style="color:${v >= good ? 'var(--bull)' : v <= bad ? 'var(--bear)' : 'var(--text2)'};font-weight:600">${v.toFixed(1)}%</span>`;
    const q = fin.year && fin.quarter ? `${+fin.year + 1911 || fin.year} 年 Q${fin.quarter}` : '最新季度';
    const money = v => v == null ? '--' : Math.abs(v) >= 1e8 ? (v/1e8).toFixed(2) + ' 兆' : Math.abs(v) >= 1e4 ? (v/1e4).toFixed(1) + ' 億' : (v/1e3).toFixed(1) + ' 百萬';
    return `
      <div class="fund-block" style="margin-top:10px">
        <div class="fund-block-ttl">季度財報（${q}）<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 官方</span></div>
        <table class="qt-table"><tbody>
          <tr><td style="color:var(--text3)">營業收入</td><td>${money(fin.revenue)}</td></tr>
          <tr><td style="color:var(--text3)">毛利率</td><td>${pct(fin.grossMargin, 30, 10)}</td></tr>
          <tr><td style="color:var(--text3)">營益率</td><td>${pct(fin.opMargin, 15, 0)}</td></tr>
          <tr><td style="color:var(--text3)">淨利率</td><td>${pct(fin.netMargin, 10, 0)}</td></tr>
          <tr><td style="color:var(--text3)">單季 EPS</td><td class="${fin.eps > 0 ? 'qt-pos' : fin.eps < 0 ? 'qt-neg' : ''}">${fin.eps != null ? fin.eps.toFixed(2) + ' 元' : '--'}</td></tr>
        </tbody></table>
      </div>`;
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
  if (page === 'report') renderPredAccuracy();
  if (page === 'lab') renderLab();

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

function initNavSearch() {
  const input = document.getElementById('nav-search-input');
  const dd    = document.getElementById('search-dropdown');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) { dd.innerHTML = ''; return; }
    const list = getStockList().filter(s => s.id.includes(q) || s.name.includes(q)).slice(0, 8);
    dd.innerHTML = list.map(s => `
      <div class="search-item" onclick="openStock('${s.id}');document.getElementById('nav-search-input').value='';document.getElementById('search-dropdown').innerHTML=''">
        <span class="search-item-id">${s.id}</span>
        <span class="search-item-name">${s.name}</span>
        <span class="search-item-sector">${s.sector}</span>
      </div>`).join('');
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
          res = await fetch(`/api/proxy?url=${encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/2330.TW?range=5d&interval=1d')}`,
            { signal: ctrl.signal });
        } catch { return { ok: false, msg: '連線失敗（本機 file:// 開啟時正常，須部署後測試）' }; }
        finally { clearTimeout(timer); }
        const txt = await res.text().catch(() => '');
        if (/^\s*<(!doctype|html)/i.test(txt))
          return { ok: false, msg: '回傳網頁而非資料 — vercel.json 的 rewrites 未排除 /api/' };
        if (!res.ok) return { ok: false, msg: `HTTP ${res.status}｜${txt.slice(0, 80)}` };
        try {
          const j = JSON.parse(txt);
          return j?.chart?.result?.[0]
            ? { ok: true, msg: '正常，台積電 K 線可取得' }
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
    { name: '大盤量能 (FMTQIK)', run: async () => {
        const r = await fetchMarketTurnover();
        const t = analyzeTurnover(r);
        return t ? { ok: true, msg: `${t.date} 成交 ${(t.amount/1e8).toFixed(0)} 億｜${t.verdict.split(' —')[0]}` } : { ok: false, msg: '無資料' };
      } },
    { name: '美股指數備援 (Stooq)', run: async () => {
        const c = await fetchStooqCloses('^GSPC');
        return c?.length ? { ok: true, msg: `S&P500 ${c.length} 筆，最新 ${c[c.length-1]}` } : { ok: false, msg: '無回應（Yahoo 正常時不影響）' };
      } },
    { name: '融資融券 O.I (MI_MARGN)', run: async () => {
        const m = await fetchMarginAll();
        return m && Object.keys(m).length ? { ok: true, msg: `${Object.keys(m).length} 檔融資融券` } : { ok: false, msg: '無資料' };
      } },
    { name: 'Yahoo 個股 K 線 (2330)', run: async () => {
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

// ── 我的持倉：每日檢查出場訊號 ──────────────────────────────────────────────
// 不做自動撮合，只記錄你實際買進的部位，每輪掃描重新評估是否該離場。

function getHoldings() {
  try { return JSON.parse(localStorage.getItem('my-holdings') || '[]'); } catch { return []; }
}
function saveHoldings(h) { localStorage.setItem('my-holdings', JSON.stringify(h)); }

function addHolding(stockId) {
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

  holdings.push({
    id: stockId, name: s.name, entry: +entry.toFixed(2),
    stop: p?.ok ? p.stop : +(entry * 0.93).toFixed(2),
    t1: p?.ok && p.t1 ? p.t1 : null,
    addedAt: new Date().toISOString().slice(0, 10),
  });
  saveHoldings(holdings);
  showToast(`📌 已記錄 ${s.name} 持倉（每日自動檢查出場訊號）`, 'success');
  renderHoldings();
}

function removeHolding(stockId) {
  saveHoldings(getHoldings().filter(h => h.id !== stockId));
  renderHoldings();
}

// 對單一持倉做出場研判
function checkHoldingExit(h) {
  const s = allStocks.find(x => x.id === h.id);
  if (!s?.analysis) return null;
  const a = s.analysis;
  const price = a.price;
  const m = buildManagerAnalysis(s);
  const retPct = (price - h.entry) / h.entry * 100;
  const reasons = [];
  let level = 'hold';  // hold | watch | exit

  if (price <= h.stop) { level = 'exit'; reasons.push(`跌破停損 ${h.stop}`); }
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
  if (h.t1 && price >= h.t1) {
    if (level === 'hold') level = 'watch';
    reasons.push(`已達目標價 ${h.t1}，可考慮減碼鎖利`);
  }
  if (!reasons.length) reasons.push(m ? `結構維持「${m.stance}」，續抱` : '結構穩定，續抱');

  return { h, s, price, retPct, level, reasons, stance: m?.stance, trail: m ? +Math.max(price - (m.atr || price * 0.02) * 2, a.ema20 || 0).toFixed(2) : null };
}

function renderHoldings() {
  const el = document.getElementById('holdings-body');
  if (!el) return;
  const holdings = getHoldings();
  if (!holdings.length) {
    el.innerHTML = '<p style="font-size:0.8rem;color:var(--text3)">尚無記錄。在個股分析頁按「📌 記錄我的持倉」即可加入，系統每輪掃描會自動檢查是否出現出場訊號。</p>';
    return;
  }
  const rows = holdings.map(checkHoldingExit).filter(Boolean);
  if (!rows.length) { el.innerHTML = '<div class="adv-loading">等待掃描完成後評估持倉...</div>'; return; }

  const badge = { exit: { t: '🔴 建議出場', c: 'var(--bear)' }, watch: { t: '🟡 留意', c: 'var(--yellow)' }, hold: { t: '🟢 續抱', c: 'var(--bull)' } };
  el.innerHTML = rows.map(r => `
    <div style="padding:10px 12px;border-radius:9px;background:${badge[r.level].c}0d;border-left:3px solid ${badge[r.level].c};margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <strong style="font-size:0.86rem;cursor:pointer" onclick="openStock('${r.h.id}')">${r.h.name} <span style="color:var(--text3);font-size:0.74rem">${r.h.id}</span></strong>
        <span style="font-size:0.7rem;font-weight:700;color:${badge[r.level].c}">${badge[r.level].t}</span>
        <span style="margin-left:auto;font-family:var(--mono);font-weight:700;color:${r.retPct >= 0 ? 'var(--bull)' : 'var(--bear)'}">${r.retPct >= 0 ? '+' : ''}${r.retPct.toFixed(2)}%</span>
        <button class="del-trade-btn" onclick="removeHolding('${r.h.id}')" title="移除">×</button>
      </div>
      <div style="font-size:0.72rem;color:var(--text3);margin-top:3px;font-family:var(--mono)">
        成本 ${r.h.entry}｜現價 ${r.price.toFixed(2)}｜停損 ${r.h.stop}${r.h.t1 ? `｜目標 ${r.h.t1}` : '｜無壓力續抱'}
      </div>
      <div style="font-size:0.75rem;color:var(--text2);margin-top:4px;line-height:1.6">${r.reasons.join('；')}</div>
    </div>`).join('');
}

// 每日一次：持倉出場訊號 Telegram 推送
function notifyHoldingExits() {
  if (!tgWants('sig')) return;
  const holdings = getHoldings();
  if (!holdings.length) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('tg-holdings-date') === today) return;

  const rows = holdings.map(checkHoldingExit).filter(Boolean);
  if (rows.length < holdings.length) return; // 資料未齊，等下輪再推

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
  localStorage.setItem('tg-holdings-date', today);
}

// 每日一次：適合進場的個股訊號推送
function notifyEntrySignals() {
  if (!tgWants('sig')) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('tg-entry-date') === today) return;

  const ready = allStocks.filter(s => s.analysis);
  if (ready.length < 5) return;

  const picks = [];
  for (const s of ready) {
    const m = buildManagerAnalysis(s);
    if (!m || m.dir < 3) continue;                   // 只推研判強度足夠者
    const p = buildEntryPlan(s, m);
    if (!p?.ok) continue;
    if (s.analysis.price > p.hi * 1.02) continue;    // 已明顯追高不推
    const d = scoreStockDimensions(s, marketRet20() ?? 0);
    if (!d || d.excluded || d.total < 65) continue;  // 需通過五維度綜合門檻
    picks.push({ s, m, p, d });
  }
  if (!picks.length) return;
  picks.sort((a, b) => b.d.total - a.d.total);

  const lines = picks.slice(0, 5).map(({ s, p, d }) => {
    const sup = [...p.support.chips.slice(0, 1), ...p.support.fund.slice(0, 1), ...p.support.tech.slice(0, 1)];
    return `📈 ${s.name}(${s.id})　綜合 ${d.total}／100\n` +
      `　進場 ${p.lo}~${p.hi}｜停損 ${p.stop}（-${p.riskPct.toFixed(1)}%）\n` +
      `　${p.holdOn ? '上方無壓力，續抱為主' : `目標 ${p.t1}（+${p.rewardPct1.toFixed(1)}%）`}\n` +
      `　依據：${sup.join('・') || '技術面轉強'}`;
  }).join('\n\n');

  tgPush(`🎯 台股雷達 進場訊號\n${today}\n\n偵測到 ${picks.length} 檔符合進場條件（做多）：\n\n${lines}\n\n⚠ 僅供參考，非投資建議`);
  localStorage.setItem('tg-entry-date', today);
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
  const excluded = (a.diverg?.type === 'bear' && ret20 > 10) ? '量價頂背離且已大漲'
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
          <span class="trend-badge trend-${signalClass(f.s.analysis.signal)}" style="font-size:0.62rem;padding:1px 7px;margin-left:4px">${f.s.analysis.signal}</span>
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


async function renderWeeklyNews() {
  const el = document.getElementById('weekly-news-body');
  if (!el) return;

  // 只用真實新聞（Google News RSS 台股 近 7 日）
  const news = (await fetchNewsRSS('台股 股市', 7).catch(() => null) || [])
    .map(n => ({ impact: n.source || '台股', ...n }));
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
    </div>`;
}

// ── Telegram Notification ──────────────────────────────────────────────────

// 本裝置是否為訊號主機（多裝置時只有主機發通知/建單，避免重複）
function isSignalMaster() {
  return localStorage.getItem('signal-master') !== 'false';
}

// 檢查某類推送是否開啟（主機 + Telegram 開關 + 分類開關 + 憑證齊全）
function tgWants(kind) {
  if (!isSignalMaster()) return false;
  if (localStorage.getItem('tg-enabled') !== 'true') return false;
  if (!localStorage.getItem('tg-token') || !localStorage.getItem('tg-chatid')) return false;
  return localStorage.getItem(`tg-${kind}`) !== 'false';
}

function tgPush(text) {
  const token  = localStorage.getItem('tg-token');
  const chatId = localStorage.getItem('tg-chatid');
  if (token && chatId) return sendTelegram(token, chatId, text);
}

// 每日一次：重要數據公布倒數 + AI 方向預測
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

// 每日一次：重點關注股清單
function notifyDailyFocus() {
  if (!tgWants('focus')) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('tg-focus-sent') === today) return;

  const { daily, weekly } = computeFocusStocks();
  if (!daily.length) return;

  const dLines = daily.map((f, i) => `${i+1}. ${f.s.name}(${f.s.id}) ${f.chg1 >= 0 ? '+' : ''}${f.chg1.toFixed(1)}%｜${f.reasons.join('・')}`).join('\n');
  const wLines = weekly.map((f, i) => `${i+1}. ${f.s.name}(${f.s.id}) 20日${f.ret20 >= 0 ? '+' : ''}${f.ret20.toFixed(1)}%｜${f.reasons.join('・')}`).join('\n');
  tgPush(`⭐ 台股雷達 每日重點關注 ${today}\n\n📅 今日必看（短線動能）\n${dLines}\n\n🗓 本週追蹤（中期趨勢）\n${wLines}`);
  localStorage.setItem('tg-focus-sent', today);
}

async function testTelegramNotif() {
  const token  = document.getElementById('s-tg-token')?.value || localStorage.getItem('tg-token');
  const chatId = document.getElementById('s-tg-chatid')?.value || localStorage.getItem('tg-chatid');
  if (!token || !chatId) { showToast('請先填寫 Bot Token 和 Chat ID', 'error'); return; }
  const msg = '✅ 台股雷達測試訊息\n掃描器運作正常！';
  await sendTelegram(token, chatId, msg);
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

function autoNotifyTelegram() {
  if (!tgWants('sig')) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('tg-strong-sent') === today) return; // 每日一次，避免刷屏

  const bullThresh = getThreshold('bull') + 15;
  const strong = allStocks.filter(s => s.analysis?.score >= bullThresh);
  if (!strong.length) return;

  const lines = strong.map(s => `${s.name}(${s.id}) 評分 ${s.analysis.score}｜${s.analysis.signal}`).join('\n');
  tgPush(`📡 台股雷達 強勢多頭訊號\n${new Date().toLocaleString('zh-TW')}\n\n${lines}`);
  localStorage.setItem('tg-strong-sent', today);
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
  const targets = [
    { sym: '^TWII', label: '加權指數 TWII' },
    { sym: '0050.TW', label: '元大台灣50 (0050)' },
  ];
  const results = await Promise.all(targets.map(async t => ({ ...t, r: calcReversalProb(await fetchYahooOHLCV(t.sym, '1d', '6mo')) })));
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

function detectLabOpportunities() {
  const cats = [
    { key: 'breakout', name: '🚀 突破在即', desc: '股價貼近 20 日高點、量能增溫，突破一觸即發', items: [] },
    { key: 'oversold', name: '💎 超賣反彈', desc: 'RSI 進入超賣區或觸及布林下軌，短線反彈機會', items: [] },
    { key: 'momentum', name: '⚡ 動能加速', desc: 'MACD 柱狀圖擴張 + 放量，趨勢正在加速', items: [] },
    { key: 'accumulate', name: '🏦 主力吸貨', desc: '法人買超但股價尚未大漲，籌碼默默集中', items: [] },
    { key: 'squeeze', name: '🌀 波動壓縮', desc: '布林通道極度收窄，即將選擇方向（變盤前夕）', items: [] },
  ];

  for (const s of allStocks) {
    const a = s.analysis;
    if (!a || !s.ohlcv?.length) continue;
    const closes = s.ohlcv.map(d => d.close);
    const volR = a.volMA ? a.lastVol / a.volMA : 1;
    const hi20 = Math.max(...s.ohlcv.slice(-20).map(d => d.high));
    const chg5 = closes.length >= 6 ? (a.price - closes[closes.length - 6]) / closes[closes.length - 6] * 100 : 0;

    if (a.price >= hi20 * 0.98 && a.price < hi20 && volR > 1.1 && a.score >= 55)
      cats[0].items.push({ s, note: `距 20 日高點 ${((hi20 - a.price) / a.price * 100).toFixed(1)}%｜量比 ${volR.toFixed(1)}` });

    if ((a.rsi != null && a.rsi < 32) || (a.boll && a.price < a.boll.lower * 1.01 && a.rsi < 42))
      cats[1].items.push({ s, note: `RSI ${a.rsi?.toFixed(0)}${a.boll && a.price < a.boll.lower * 1.01 ? '｜觸及布林下軌' : ''}` });

    if (a.macd?.hist > 0 && volR > 1.5 && a.score >= 60)
      cats[2].items.push({ s, note: `MACD 柱 +${a.macd.hist.toFixed(2)}｜量比 ${volR.toFixed(1)}` });

    if (s.foreign != null && s.foreign > 500 && Math.abs(chg5) < 2.5)
      cats[3].items.push({ s, note: `外資 +${s.foreign.toLocaleString()} 張｜5日僅 ${chg5 >= 0 ? '+' : ''}${chg5.toFixed(1)}%` });

    if (a.boll && a.boll.middle && (a.boll.upper - a.boll.lower) / a.boll.middle < 0.055)
      cats[4].items.push({ s, note: `通道寬 ${((a.boll.upper - a.boll.lower) / a.boll.middle * 100).toFixed(1)}%（極度壓縮）` });
  }
  cats.forEach(c => c.items.sort((x, y) => (y.s.analysis?.score || 0) - (x.s.analysis?.score || 0)));
  return cats;
}

function renderLab() {
  const el = document.getElementById('lab-content');
  if (!el) return;
  if (!allStocks.some(s => s.analysis)) {
    el.innerHTML = '<div class="adv-loading">等待掃描完成後分析機會型態...</div>';
    return;
  }
  const cats = detectLabOpportunities();
  const total = cats.reduce((n, c) => n + c.items.length, 0);

  el.innerHTML = `
    <div style="margin-bottom:14px;padding:12px 16px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.12);border-radius:10px;font-size:0.84rem;color:var(--text2)">
      本輪掃描共偵測到 <strong style="color:var(--blue)">${total}</strong> 個特殊型態機會。機會型態僅為技術特徵偵測，請點入個股查看完整分析。
    </div>
    ${cats.map(c => `
      <div class="adv-section" style="margin-bottom:14px">
        <div class="adv-section-hdr">
          ${c.name}
          <span style="font-size:0.7rem;font-weight:400;color:var(--text3);margin-left:6px">${c.desc}</span>
          <span class="tbl-badge" style="margin-left:auto;background:rgba(0,212,255,0.1);color:var(--blue)">${c.items.length}</span>
        </div>
        <div class="adv-section-body">
          ${c.items.length ? `<div class="lab-grid">${c.items.slice(0, 8).map(({ s, note }) => `
            <div class="lab-card" onclick="openStock('${s.id}')">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                <strong style="font-size:0.85rem">${s.name} <span style="color:var(--text3);font-size:0.72rem">${s.id}</span></strong>
                <span class="trend-badge trend-${signalClass(s.analysis.signal)}" style="font-size:0.62rem;padding:1px 7px">${s.analysis.signal}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:0.73rem;color:var(--text3)">${note}</span>
                <span style="font-family:var(--mono);font-weight:700;color:${scoreToColor(s.analysis.score)}">${s.analysis.score}</span>
              </div>
            </div>`).join('')}</div>`
          : '<p style="font-size:0.8rem;color:var(--text3)">本輪未偵測到此型態</p>'}
        </div>
      </div>`).join('')}`;
}











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

  el.innerHTML = `
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
  if (localStorage.getItem('tg-enabled') !== 'true' || !localStorage.getItem('tg-token') || !localStorage.getItem('tg-chatid')) {
    if (!silent) showToast('請先啟用並設定 Telegram Bot', 'error');
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
  const bears = allStocks.filter(s => s.analysis && s.analysis.score <= getThreshold('bear')).length;

  tgPush(`📊 台股雷達 每日市場簡報\n${now.toLocaleDateString('zh-TW')}\n\n🌡 大盤環境：${mkt}（多空總覽 ${Math.round(norm)} 分）\n市場寬度：多頭 ${bulls} 檔 / 空頭 ${bears} 檔\n\n⭐ 今日重點關注\n${dLines}\n\n🗓 即將公布\n${events}\n\n⚠ 僅供參考，非投資建議`);
  return true;
}

// ── 每日簡報自動發送（每天 9:00，開啟網頁時若已過 9 點且未發送則補發）──
function startDailyBriefingCheck() {
  const tryDailyBrief = () => {
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
  setTimeout(initApp, 600);
});
