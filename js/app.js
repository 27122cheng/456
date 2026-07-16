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
let tvChart = null;
let rankingFilter = 'all';
let rankingSort = { col: 'score', dir: -1 };
let scanning = false;

// ── Init ───────────────────────────────────────────────────────────────────

async function initApp() {
  loadSettings();
  renderCustomStocksList();
  initNavSearch();
  initEventListeners();
  // Hide loader immediately — scan runs in background with its own progress bar
  hideLoader();
  renderEvents();
  renderCapitalFlow();
  renderWeeklyNews();
  renderTopBottomReversal();
  startRefreshCycle();
  startDailyBriefingCheck();
  startScan();
}

// ── Scan ───────────────────────────────────────────────────────────────────

async function startScan() {
  if (scanning) return;
  scanning = true;

  const stocks = getStockList();
  allStocks = stocks.map(s => ({ ...s, ohlcv: [], analysis: null, reversal: null }));

  showScanBar(true);
  updateLoadingText('掃描台股技術指標...');

  // Fetch market index + outlook + institutional overview in parallel
  fetchTWII().then(renderMarketIndex).catch(() => {});
  loadMarketOutlook();
  loadInstitutionalOverview();

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
      setScanProgress((done / total) * 100, `分析 ${s.name} (${s.id})... ${done}/${total}`);
      // Render incrementally every 5 stocks
      if (done % 5 === 0 || done === total) {
        renderDashboard();
        if (currentPage === 'ranking') renderRanking();
      }
      // 請求間加入抖動，平滑突發流量（免費 proxy 對瞬間大量請求最敏感）
      await delay(120 + Math.random() * 180);
    }
  }
  await Promise.all(Array.from({ length: 4 }, scanWorker));

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
      showToast(`⚠ ${still.length} 檔資料載入失敗：${still.slice(0, 5).map(x => x.name).join('、')}${still.length > 5 ? '…' : ''}（下輪自動重試）`, 'error');
    }
  }

  setScanProgress(100, '掃描完成');
  setTimeout(() => showScanBar(false), 1500);
  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString('zh-TW');
  scanning = false;

  // Re-render outlook now that breadth (bull/bear counts) is known
  renderMarketOutlook();

  // AI 自動交易：結算既有部位 → 產生新建議
  processPositions();
  generatePendingSuggestions();

  // 機會實驗室：結算舊紙上追蹤 → 收錄本輪新機會 → 驗證策略晉升建正式單
  updateLabTracks();
  recordLabOpportunities();
  generateProvenStrategyOrders();

  if (currentPage === 'positions') renderPositions();

  // 每日 / 每週重點關注股
  renderFocusStocks();
  if (currentPage === 'lab') renderLab();

  // 價格警報檢查
  checkAlerts();

  // Telegram：強勢訊號 + 數據公布預測 + 每日重點股（各每日一次）
  autoNotifyTelegram();
  notifyEventPredictions();
  notifyDailyFocus();
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
  const factors = [];
  for (const cfg of OUTLOOK_SYMBOLS) {
    const q = await fetchIndexQuote(cfg.sym).catch(() => null);
    if (q) factors.push({ ...cfg, ...q });
    await delay(150);
  }
  outlookData.factors = factors;
  renderMarketOutlook();
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
  // Regular index: combine 1d + 5d momentum
  let pts = 0;
  if (f.chg1 > 0.5) pts += 1; else if (f.chg1 < -0.5) pts -= 1;
  if (f.chg5 > 1.5) pts += 1; else if (f.chg5 < -1.5) pts -= 1;
  pts = Math.max(-1, Math.min(1, pts)) * f.weight;
  return { pts, dir: pts > 0 ? 'up' : pts < 0 ? 'dn' : 'flat' };
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
  const norm = maxPts ? Math.round((totalPts / maxPts) * 100) : 0;
  outlookData.norm = norm;
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
  let predict = `綜合 ${rows.length} 項因子，市場評分 <strong>${norm > 0 ? '+' : ''}${norm}</strong>（區間 -100 ~ +100）。`;
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

function getTrades() {
  try { return JSON.parse(localStorage.getItem('trade-log') || '[]'); } catch { return []; }
}

function saveTrades(trades) {
  localStorage.setItem('trade-log', JSON.stringify(trades));
}

// ── 匯入 / 匯出 ────────────────────────────────────────────────────────────

function exportTrades() {
  const payload = {
    exported: new Date().toISOString(),
    trades: getTrades(),
    positions: getPositions(),
    stopAdj: localStorage.getItem('stop-adj') || '0.99',
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `taistock-trades-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('已匯出交易紀錄', 'success');
}

function importTrades(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.trades)) saveTrades(data.trades);
      else if (Array.isArray(data)) saveTrades(data); // bare array format
      if (Array.isArray(data.positions)) savePositions(data.positions);
      if (data.stopAdj) localStorage.setItem('stop-adj', data.stopAdj);
      renderTradelog();
      renderPositions();
      showToast(`已匯入 ${(data.trades || data).length} 筆交易紀錄`, 'success');
    } catch {
      showToast('匯入失敗：JSON 格式錯誤', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function deleteTrade(idx) {
  const trades = getTrades();
  trades.splice(idx, 1);
  saveTrades(trades);
  renderTradelog();
}

function clearTrades() {
  if (!confirm('確定要清空所有交易紀錄？')) return;
  saveTrades([]);
  renderTradelog();
}

function renderTradelog() {
  const trades = getTrades().sort((a, b) => a.date.localeCompare(b.date));

  // Stats
  const wins   = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const grossWin  = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const winRate = trades.length ? (wins.length / trades.length * 100).toFixed(0) : null;
  const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : (grossWin > 0 ? '∞' : '--');

  document.getElementById('ts-total').textContent = trades.length;
  document.getElementById('ts-winrate').textContent = winRate !== null ? winRate + '%' : '--%';
  const pnlEl = document.getElementById('ts-pnl');
  pnlEl.textContent = trades.length ? (totalPnl > 0 ? '+' : '') + totalPnl.toLocaleString() : '--';
  pnlEl.style.color = totalPnl > 0 ? 'var(--bull)' : totalPnl < 0 ? 'var(--bear)' : 'var(--text1)';
  document.getElementById('ts-pf').textContent = pf;

  // Trades table (newest first)
  const tbody = document.getElementById('trades-tbody');
  document.getElementById('trades-count').textContent = trades.length;
  const newest = [...trades].reverse();
  tbody.innerHTML = newest.length ? newest.map((t, i) => {
    const realIdx = trades.length - 1 - i;
    const pnlCls = t.pnl > 0 ? 'change-up' : t.pnl < 0 ? 'change-dn' : '';
    const penalty = t.penalty || 0;
    return `<tr>
      <td style="font-family:var(--mono);font-size:0.75rem">${t.date}</td>
      <td><span class="stock-cell-id">${t.id}</span> <span style="font-size:0.7rem;color:var(--text3)">${t.name || ''}</span></td>
      <td>${t.dir === 'long' ? '<span style="color:var(--bull)">多</span>' : '<span style="color:var(--bear)">空</span>'}</td>
      <td class="price-mono">${t.entry}</td>
      <td class="price-mono">${t.exit}</td>
      <td class="vol-cell">${t.qty.toLocaleString()}</td>
      <td class="${pnlCls}">${t.pnl > 0 ? '+' : ''}${t.pnl.toLocaleString()}</td>
      <td class="${pnlCls}">${t.retPct > 0 ? '+' : ''}${t.retPct}%</td>
      <td style="font-size:0.75rem;color:var(--text3)">${t.note || '--'}</td>
      <td>${penalty < 0 ? `<span style="color:var(--bear);font-family:var(--mono)">${penalty}</span>` : '<span style="color:var(--text3)">0</span>'}</td>
      <td><button class="del-trade-btn" onclick="deleteTrade(${realIdx})" title="刪除">×</button></td>
    </tr>`;
  }).join('') : '<tr><td colspan="11" style="text-align:center;color:var(--text3);padding:20px">尚無已結算交易（AI 訊號成交並出場後自動寫入）</td></tr>';

  // Cumulative PnL chart
  renderPnlChart(trades);
  // Stop-loss learning
  renderRiskLearning(trades);
}

function renderPnlChart(trades) {
  const el = document.getElementById('pnl-chart');
  if (!trades.length) { el.innerHTML = '<div class="adv-loading">尚無交易紀錄</div>'; return; }

  let cum = 0;
  const points = trades.map(t => { cum += t.pnl; return { date: t.date, cum }; });
  const maxAbs = Math.max(...points.map(p => Math.abs(p.cum)), 1);

  el.innerHTML = points.map(p => {
    const h = Math.max(4, Math.abs(p.cum) / maxAbs * 140);
    const cls = p.cum >= 0 ? 'up' : 'dn';
    return `<div class="pnl-bar ${cls}" style="height:${h}px;${p.cum < 0 ? 'align-self:flex-start;margin-top:10px' : ''}"
      data-tip="${p.date}: ${p.cum > 0 ? '+' : ''}${p.cum.toLocaleString()}"></div>`;
  }).join('');
}

function renderRiskLearning(trades) {
  const el = document.getElementById('risk-learn-body');
  if (trades.length < 3) {
    el.innerHTML = '<div class="adv-loading">需要至少 3 筆交易紀錄才能開始學習</div>';
    return;
  }

  const losses = trades.filter(t => t.pnl < 0);
  const wins   = trades.filter(t => t.pnl > 0);
  const winRate = wins.length / trades.length;
  const avgLossPct = losses.length ? losses.reduce((s, t) => s + t.retPct, 0) / losses.length : 0;
  const avgWinPct  = wins.length ? wins.reduce((s, t) => s + t.retPct, 0) / wins.length : 0;
  const stopOuts = losses.filter(t => /止損|停損/.test(t.note || ''));

  const insights = [];
  let stopAdj = 0.99;

  if (avgLossPct < -8) {
    stopAdj = 0.995;
    insights.push({ icon: '⚠️', txt: `平均虧損 ${avgLossPct.toFixed(1)}% 過大 → 已自動<strong>調緊止損</strong>（5日低點 -0.5%）。大虧是績效殺手，寧可被洗出場再進。` });
  } else if (losses.length >= 3 && avgLossPct > -3 && winRate < 0.45) {
    stopAdj = 0.975;
    insights.push({ icon: '🔄', txt: `多次小額止損（平均 ${avgLossPct.toFixed(1)}%）但勝率僅 ${(winRate*100).toFixed(0)}% → 止損可能設太緊被洗出場，已自動<strong>放寬止損</strong>（5日低點 -2.5%）。` });
  } else {
    insights.push({ icon: '✅', txt: `風控正常：平均虧損 ${avgLossPct.toFixed(1)}%，維持預設止損（5日低點 -1%）。` });
  }
  localStorage.setItem('stop-adj', stopAdj);

  if (winRate >= 0.5 && avgWinPct < Math.abs(avgLossPct)) {
    insights.push({ icon: '📏', txt: `勝率 ${(winRate*100).toFixed(0)}% 不錯，但平均獲利 ${avgWinPct.toFixed(1)}% 小於平均虧損 → <strong>賺要讓它跑</strong>，建議至少抱到 2R 目標一。` });
  }
  if (winRate >= 0.55 && parseFloat(avgWinPct) > Math.abs(avgLossPct) * 1.5) {
    insights.push({ icon: '🏆', txt: `系統表現優異（勝率 ${(winRate*100).toFixed(0)}%、盈虧比 ${(avgWinPct/Math.abs(avgLossPct||1)).toFixed(1)}）→ 可考慮小幅放大部位。` });
  }

  // ── 失敗歸因分析：為什麼交易建議會失敗 → 自動調整過濾規則 ──────────
  const attributions = [
    { key: 'countertrend', name: '大盤偏空逆勢做多', test: t => (t.ctx?.mktNorm ?? 0) <= -15,
      fix: () => localStorage.setItem('learn-market-gate', 'true'),
      fixTxt: '已強制開啟大盤空頭閘門：市場多空總覽 ≤ -15 時停發做多訊號' },
    { key: 'chasing', name: '追高進場（RSI ≥ 70）', test: t => (t.ctx?.rsi ?? 0) >= 70,
      fix: () => localStorage.setItem('learn-rsi-cap', '68'),
      fixTxt: '已將 RSI 進場上限從 75 調降至 68，避免買在短線過熱區' },
    { key: 'weaktrend', name: '弱趨勢震盪進場（ADX < 20）', test: t => t.ctx?.adx != null && t.ctx.adx < 20,
      fix: () => localStorage.setItem('learn-adx-min', '25'),
      fixTxt: '已將 ADX 進場門檻從 20 提高至 25，只做趨勢確立的股票' },
    { key: 'bigrisk', name: '止損距離過遠（單筆虧損 > 5%）', test: t => t.retPct < -5,
      fix: () => localStorage.setItem('learn-max-risk', '5'),
      fixTxt: '已將單筆最大風險上限從 7% 收緊至 5%' },
    { key: 'climax', name: '爆量末端進場（量比 > 2.5）', test: t => (t.ctx?.volR ?? 0) > 2.5,
      fix: () => {}, fixTxt: '爆量常是主力出貨訊號，系統已內建 3.5 倍量比上限' },
  ];

  const failureRows = [];
  for (const attr of attributions) {
    const hits = losses.filter(attr.test);
    if (hits.length >= 2) {
      attr.fix();
      failureRows.push({ name: attr.name, count: hits.length, fixTxt: attr.fixTxt, active: true });
    } else if (hits.length === 1) {
      failureRows.push({ name: attr.name, count: 1, fixTxt: '觀察中（累計 2 次將自動調整規則）', active: false });
    }
  }

  const lf = getLearnedFilters();
  const failHtml = failureRows.length ? `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">🔍 失敗原因歸因（持續學習改進）</div>
      ${failureRows.map(r => `
        <div class="learn-item" style="${r.active ? 'border-left:2px solid var(--bear);padding-left:10px' : 'opacity:0.75'}">
          <span class="learn-icon">${r.active ? '🛠' : '👁'}</span>
          <span><strong>${r.name}</strong> — 造成 ${r.count} 筆虧損<br>
          <span style="font-size:0.75rem;color:${r.active ? 'var(--blue)' : 'var(--text3)'}">${r.active ? '✓ ' : ''}${r.fixTxt}</span></span>
        </div>`).join('')}
    </div>` : '';

  // ── 止損鬆緊診斷面板（止損後 5 日觀察是否反轉觸及止盈）──────────
  const slt = computeSLTightnessStats();
  let sltHtml = '';
  if (slt.n >= 3) {
    const c = slt.pct >= 55 ? 'var(--bear)' : slt.pct >= 40 ? 'var(--yellow)' : 'var(--bull)';
    const rec = slt.pct >= 55
      ? '⚠️ 過半止損單其實會反轉獲利 → 止損明顯設太緊，系統將自動放寬止損參數，或等回踩更靠近支撐再進場。'
      : slt.pct >= 40
      ? '止損偏緊，約四成止損單事後反轉。可觀察是否放寬止損或提高進場精準度。'
      : '✅ 止損鬆緊合理，多數止損單為真實走弱，維持現有止損設定。';
    // 止損太緊比例 ≥ 55% → 自動放寬 stop-adj
    if (slt.pct >= 55 && stopAdj > 0.975) {
      localStorage.setItem('stop-adj', '0.975');
    }
    sltHtml = `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:6px">🔍 止損鬆緊診斷（止損後 5 日觀察是否反轉觸及止盈）</div>
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px">
        <span style="font-size:1.6rem;font-weight:800;color:${c}">${slt.pct.toFixed(0)}%</span>
        <span style="font-size:0.8rem;color:var(--text2)">的止損單反轉觸及止盈（止損太緊）</span>
        <span style="font-size:0.7rem;color:var(--text3);margin-left:auto">${slt.tooTight}/${slt.n} 筆已判定${slt.watching ? `　${slt.watching} 觀察中` : ''}</span>
      </div>
      <div style="font-size:0.78rem;color:var(--text2);line-height:1.7;background:${c}11;border-left:3px solid ${c};padding:8px 12px;border-radius:0 6px 6px 0">${rec}</div>
    </div>`;
  } else if (slt.watching > 0) {
    sltHtml = `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:0.75rem;color:var(--text3)">🔍 止損鬆緊診斷：${slt.watching} 筆止損單觀察中（累計 3 筆判定後顯示統計）</div>`;
  }

  // ── 分組勝率統計（依訊號類型 / SQ 等級，驗證各類訊號實際表現）──────
  const seg = (name, arr) => {
    const wins = arr.filter(t => t.pnl > 0).length;
    const netPnl = arr.reduce((sum, t) => sum + (t.pnl || 0), 0);
    return { name, n: arr.length, wr: arr.length ? wins / arr.length * 100 : 0, netPnl };
  };
  const segGroups = [
    seg('⚡ 當沖單', trades.filter(t => t.sigType === '當沖')),
    seg('🏦 長線單', trades.filter(t => t.sigType === '長線')),
    seg('🌊 波段單', trades.filter(t => !t.sigType || t.sigType === '波段')),
    seg('SQ S級以上', trades.filter(t => ['SS','S'].includes(t.sqGrade))),
    seg('SQ A級', trades.filter(t => t.sqGrade === 'A')),
    seg('SQ B級以下/無', trades.filter(t => !t.sqGrade || !['SS','S','A'].includes(t.sqGrade))),
    seg('🎓 驗證策略單', trades.filter(t => t.proven)),
  ].filter(g => g.n > 0);
  const wrColor = wr => wr >= 55 ? 'var(--bull)' : wr >= 45 ? 'var(--yellow)' : 'var(--bear)';
  const breakdownHtml = segGroups.length >= 2 ? `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:0.78rem;font-weight:700;color:var(--text2);margin-bottom:8px">📊 分組勝率分析（回饋閉環：驗證哪類訊號真的賺錢）</div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.76rem">
        <thead><tr style="color:var(--text3);font-size:0.68rem;text-align:left">
          <th style="padding:3px 6px">組別</th><th style="padding:3px 6px;text-align:right">筆數</th>
          <th style="padding:3px 6px;text-align:right">勝率</th><th style="padding:3px 6px;text-align:right">累計損益</th>
        </tr></thead>
        <tbody>${segGroups.map(g => `<tr>
          <td style="padding:3px 6px">${g.name}</td>
          <td style="padding:3px 6px;text-align:right;color:var(--text3)">${g.n}</td>
          <td style="padding:3px 6px;text-align:right;font-weight:700;color:${wrColor(g.wr)}">${g.wr.toFixed(0)}%</td>
          <td style="padding:3px 6px;text-align:right;font-weight:600;font-family:var(--mono);color:${g.netPnl >= 0 ? 'var(--bull)' : 'var(--bear)'}">${g.netPnl >= 0 ? '+' : ''}${g.netPnl.toLocaleString()}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>` : '';

  el.innerHTML = `
    ${insights.map(i => `<div class="learn-item"><span class="learn-icon">${i.icon}</span><span>${i.txt}</span></div>`).join('')}
    ${failHtml}
    ${sltHtml}
    ${breakdownHtml}
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:0.75rem;color:var(--text3);line-height:1.7">
      目前生效的 AI 過濾參數：止損 = 5日低點 × ${stopAdj}｜RSI 上限 ${lf.rsiCap}｜ADX 下限 ${lf.adxMin}｜單筆風險上限 ${lf.maxRiskPct}%｜大盤空頭閘門 ${lf.marketGate ? '開啟' : '關閉'}<br>
      新的待進場訊號都會套用以上規則 — 每次虧損系統都在學習，規則會越調越嚴。
    </div>`;
}

// ── AI 自動交易系統（待進場 → 回踩成交 → 持倉 → 自動止損/停利） ─────────────

function getPositions() {
  try { return JSON.parse(localStorage.getItem('positions') || '[]'); } catch { return []; }
}
function savePositions(p) { localStorage.setItem('positions', JSON.stringify(p)); }

// 學習系統設定的過濾規則（由止損學習系統依失敗原因自動開啟）
function getLearnedFilters() {
  return {
    marketGate: localStorage.getItem('learn-market-gate') !== 'false', // 預設開：大盤偏空不做多
    rsiCap:     parseFloat(localStorage.getItem('learn-rsi-cap') || '75'),   // 追高保護
    adxMin:     parseFloat(localStorage.getItem('learn-adx-min') || '20'),   // 弱趨勢過濾
    maxRiskPct: parseFloat(localStorage.getItem('learn-max-risk') || '7'),   // 單筆最大風險%
  };
}

// 訊號分類：長線單 vs 當沖單
function classifySignal(a) {
  const volR = a.volMA ? a.lastVol / a.volMA : 1;
  // 當沖單：今日爆量 + 強動能 + 強趨勢（短打快出）
  if (volR >= 1.8 && a.adx >= 30 && a.rsi >= 55 && a.rsi <= 72) return '當沖';
  // 長線單：長多排列 + 趨勢確立
  if (a.ema50 && a.ema200 && a.ema50 > a.ema200 && a.price > a.ema50) return '長線';
  return '波段';
}

// ── 取消冷卻（被自動取消的股票 2 小時內不重複建單，避免建了又取消的循環）──
function getCancelCooldowns() {
  try { return JSON.parse(localStorage.getItem('cancel-cooldowns') || '[]'); } catch { return []; }
}
function addCancelCooldown(p, reason) {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  const all = getCancelCooldowns().filter(c => c.at > cutoff);
  all.unshift({ id: p.id, name: p.name, at: Date.now(), reason, entry: p.entry });
  localStorage.setItem('cancel-cooldowns', JSON.stringify(all));
}
function inCancelCooldown(stockId) {
  return getCancelCooldowns().some(c => c.id === stockId && Date.now() - c.at < 2 * 60 * 60 * 1000);
}

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

// AI 訊號 → 建立待進場單（進場價 = 回踩 EMA20）
// v3：5 重品質過濾 + SQ 12因子分級（需 A 級以上）＋ 取消冷卻 ＋ 風控上限
function generatePendingSuggestions() {
  // 只有訊號主機建單，避免多裝置重複建立同一筆待進場單
  if (!isSignalMaster()) return;
  const positions = getPositions();
  const today = new Date().toISOString().slice(0, 10);
  const threshold = getThreshold('bull') + 10;
  const stopAdj = parseFloat(localStorage.getItem('stop-adj') || '0.99');
  const lf = getLearnedFilters();
  const newOnes = [];
  const rejected = [];

  // ── 回撤控制 1：最大同時持有 6 筆（含待進場）
  const activeCount = positions.filter(p => p.status === 'pending' || p.status === 'open').length;
  if (activeCount >= 6) return;

  // ── 回撤控制 2：連續 3 筆虧損 → 冷靜期 1 個交易日暫停新單
  const recent = getTrades().slice(-3);
  if (recent.length === 3 && recent.every(t => t.pnl < 0)) {
    const lastLossDate = recent[recent.length - 1].date;
    if (lastLossDate >= new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
      showToast('⛔ 連續 3 筆虧損，AI 進入冷靜期，今日暫停新訊號', 'error');
      return;
    }
  }

  // ── 回撤控制 3：大盤偏空時不做多（學習系統可控制開關）
  const mktNorm = outlookData.norm ?? 0;
  if (lf.marketGate && mktNorm <= -15) return;

  for (const s of allStocks) {
    const a = s.analysis;
    if (!a || a.score < threshold) continue;
    if (positions.find(p => p.id === s.id && (p.status === 'pending' || p.status === 'open'))) continue;
    if (positions.filter(p => p.status === 'pending' || p.status === 'open').length + newOnes.length >= 6) break;
    if (inCancelCooldown(s.id)) { rejected.push(`${s.id} 取消冷卻中`); continue; } // 剛被取消，2小時內不重建

    // ── 品質過濾（每一項都是歷史虧損常見原因）───────────────
    const volR = a.volMA ? a.lastVol / a.volMA : 1;
    if (a.rsi != null && a.rsi > lf.rsiCap) { rejected.push(`${s.id} RSI過熱`); continue; }   // 不追高
    if (a.adx != null && a.adx < lf.adxMin) { rejected.push(`${s.id} 趨勢太弱`); continue; }   // 不做震盪
    if (!(a.ema50 && a.price > a.ema50))    { rejected.push(`${s.id} 未站上EMA50`); continue; } // 中期趨勢確認
    if (volR > 3.5)                         { rejected.push(`${s.id} 爆量過度`); continue; }   // 避免出貨量
    if (a.boll && a.price > a.boll.upper * 1.02) { rejected.push(`${s.id} 乖離過大`); continue; } // 不買在布林外

    // ── SQ 訊號品質評分：需 A 級（6分）以上才建單 ──
    const sqRes = computeSQ(s);
    if (sqRes.sq < 6) { rejected.push(`${s.id} SQ ${sqRes.grade}級（${sqRes.sq}分）不足`); continue; }

    const lows = s.ohlcv.map(d => d.low);
    let entry = a.ema20 && a.ema20 < a.price ? a.ema20 : a.price * 0.985;
    entry = +entry.toFixed(2);
    const stop = +(Math.min(...lows.slice(-5)) * stopAdj).toFixed(2);
    if (stop >= entry) continue;
    const r = entry - stop;
    const riskPct = r / entry * 100;
    if (riskPct > lf.maxRiskPct) { rejected.push(`${s.id} 風險${riskPct.toFixed(1)}%過大`); continue; } // 止損太遠不做

    const sigType = classifySignal(a);
    const pos = {
      uid: Date.now() + '-' + s.id,
      id: s.id, name: s.name, dir: 'long', sigType,
      score: a.score, suggestedAt: today,
      entry, stopLoss: stop, baseStop: stop, tp1Hit: false,
      tp1: +(entry + r * 2).toFixed(2),
      tp2: +(entry + r * 3).toFixed(2),
      qty: 1000, status: 'pending', lastPrice: a.price,
      sqGrade: sqRes.grade, sqScore: sqRes.sq, sqGradeLabel: sqRes.gradeLabel, sqFactors: sqRes.factors,
      // 進場時空快照（供失敗學習系統歸因）
      ctx: {
        rsi: a.rsi != null ? +a.rsi.toFixed(1) : null,
        adx: a.adx != null ? +a.adx.toFixed(1) : null,
        volR: +volR.toFixed(2),
        mktNorm: Math.round(mktNorm),
      },
    };
    positions.push(pos);
    newOnes.push(pos);
  }

  if (rejected.length) console.info('AI 品質過濾排除:', rejected.join('、'));

  if (newOnes.length) {
    savePositions(positions);
    showToast(`AI 新增 ${newOnes.length} 筆待進場建議（5重過濾 + SQ ≥ A 級）`, 'info');
    // Telegram 推送（長線單 / 當沖單分類 + SQ 等級標示）
    if (tgWants('sig')) {
      const typeIcon = { '當沖': '⚡當沖單', '長線': '🏦長線單', '波段': '🌊波段單' };
      const gradeIcon = { SS: '💎', S: '🏆', A: '🥇' };
      const lines = newOnes.map(p =>
        `${typeIcon[p.sigType] || p.sigType} ${p.name}(${p.id}) 評分${p.score}\n` +
        `${gradeIcon[p.sqGrade] || '📊'} 訊號品質 ${p.sqGrade} 級（${p.sqGradeLabel}，${p.sqScore} 分）\n` +
        `回踩進場 ${p.entry}｜止損 ${p.stopLoss}（-${((p.entry-p.stopLoss)/p.entry*100).toFixed(1)}%）\n` +
        `目標一 ${p.tp1}(2R 觸及後止損移至成本) / 最終 ${p.tp2}(3R)\n` +
        `大盤環境 ${p.ctx.mktNorm >= 0 ? '偏多' : '偏空'}(${p.ctx.mktNorm})`
      ).join('\n\n');
      tgPush(`📡 台股雷達 AI 交易建議（待回踩進場）\n${today}\n\n${lines}\n\n⚠ 僅供參考，非投資建議`);
    }
  }
}

// 掛單自動取消：標記取消 + 冷卻 + Telegram 通知
function cancelPendingAuto(p, reason) {
  p.status = 'cancelled';
  addCancelCooldown(p, reason);
  showToast(`🚫 ${p.name}(${p.id}) 掛單取消：${reason}`, 'error');
  if (tgWants('sig')) {
    tgPush(`🚫 台股雷達 交易建議已取消\n\n${p.name}(${p.id}) ${p.sigType || ''}單\n原掛單進場 ${p.entry}｜止損 ${p.stopLoss}\n\n📋 取消原因：${reason}\n\n2 小時冷卻後重新評估新機會`);
  }
}

// 每次掃描後：掛單有效性監控 → 回踩成交 → 保本/止損/停利
function processPositions() {
  const positions = getPositions();
  const now = new Date();
  let changed = false;

  for (const p of positions) {
    const s = allStocks.find(x => x.id === p.id);
    const bars = s?.ohlcv;
    if (!bars?.length) continue;
    p.lastPrice = bars[bars.length - 1].close;

    if (p.status === 'pending') {
      // ① 7 天未成交 → 過期
      if ((now - new Date(p.suggestedAt)) / 86400000 > 7) {
        p.status = 'expired'; changed = true; continue;
      }
      // ② 進場前已跌破止損位 → 取消（風控執行）
      if (p.lastPrice <= p.stopLoss) {
        cancelPendingAuto(p, `進場前價格已跌破止損位 ${p.stopLoss}（現價 ${p.lastPrice}）`);
        changed = true; continue;
      }
      // ③ 未回踩直接飛越止盈一 → 機會已過，取消
      if (p.lastPrice >= p.tp1) {
        cancelPendingAuto(p, `價格未回踩進場直接飛越止盈一（${p.tp1}），機會已過`);
        changed = true; continue;
      }
      // ④ 訊號失效監控：趨勢反轉或 SQ 品質跌破 B 級 → 取消
      // （驗證策略單建立時就免評分/SQ 門檻，僅監控趨勢反轉，不因 SQ 降級取消）
      if (s.analysis) {
        const nowScore = s.analysis.score;
        if (s.analysis.signal.includes('空頭') || (!p.proven && nowScore < 45)) {
          cancelPendingAuto(p, `訊號失效：評分跌至 ${nowScore}（${s.analysis.signal}）`);
          changed = true; continue;
        }
        const sqNow = computeSQ(s);
        if (!p.proven && sqNow.sq < 4) {
          cancelPendingAuto(p, `訊號品質降至 ${sqNow.grade} 級（${sqNow.sq} 分），低於 B 級門檻`);
          changed = true; continue;
        }
        p.sqGrade = sqNow.grade; p.sqScore = sqNow.sq; // 持續更新品質顯示
      }
      // ⑤ 回踩成交：建議日之後任一根 K 棒低點觸及進場價
      const fill = bars.find(b => b.time > p.suggestedAt && b.low <= p.entry);
      if (fill) { p.status = 'open'; p.entryDate = fill.time; changed = true; }

    } else if (p.status === 'open') {
      if (p.baseStop == null) p.baseStop = p.stopLoss; // 舊資料相容
      const after = bars.filter(b => b.time > p.entryDate);
      for (const b of after) {
        // 止盈一觸及 → 止損自動移至成本價（保本），續抱等止盈二
        if (!p.tp1Hit && b.high >= p.tp1) {
          p.tp1Hit = true;
          p.stopLoss = p.entry;
          changed = true;
          showToast(`🎯 ${p.name}(${p.id}) 觸及止盈一，止損已移至成本價（保本）`, 'success');
          if (tgWants('sig')) {
            tgPush(`🎯 止盈一已觸及！止損自動保本\n\n${p.name}(${p.id})\n✅ 止盈一 ${p.tp1}｜進場 ${p.entry}\n🔒 止損已移至成本價 ${p.entry}，續抱等止盈二 ${p.tp2}`);
          }
          continue; // 同一根 K 棒不再檢查止損（日線無法判斷先後，保守處理）
        }
        // 止盈一之後：達標止盈二全出，或回落成本保本出場
        if (p.tp1Hit) {
          if (b.high >= p.tp2)      { settlePosition(p, p.tp2, b.time, '達標止盈二'); changed = true; break; }
          if (b.low <= p.stopLoss)  { settlePosition(p, p.entry, b.time, '保本出場'); changed = true; break; }
        } else {
          if (b.low <= p.stopLoss)  { settlePosition(p, p.stopLoss, b.time, '跌破止損'); changed = true; break; }
        }
      }
    }
  }

  savePositions(positions.filter(p => p.status === 'pending' || p.status === 'open'));
  updateSLTightnessWatch(); // 止損鬆緊診斷（觀察止損單是否反轉觸及止盈）
  if (changed && currentPage === 'positions') renderPositions();
}

// 平倉結算 → 寫入交易日誌（含止損原因 + 風控扣分）
function settlePosition(p, exitPrice, exitDate, reason) {
  p.status = 'closed';
  const pnl = Math.round((exitPrice - p.entry) * p.qty);
  const retPct = +((exitPrice - p.entry) / p.entry * 100).toFixed(2);

  // 風控扣分規則（依進場時空快照歸因）
  let penalty = 0;
  const penaltyNotes = [];
  const ctx = p.ctx || {};
  if (reason === '跌破止損') {
    penalty -= 5; penaltyNotes.push('止損出場 -5');
    if (retPct < -8) { penalty -= 5; penaltyNotes.push('單筆大虧>8% -5'); }
    if ((ctx.mktNorm ?? outlookData.norm ?? 0) <= -15) { penalty -= 5; penaltyNotes.push('大盤偏空逆勢做多 -5'); }
    if (ctx.rsi != null && ctx.rsi >= 70) { penalty -= 3; penaltyNotes.push('進場時RSI過熱追高 -3'); }
    if (ctx.adx != null && ctx.adx < 20)  { penalty -= 3; penaltyNotes.push('弱趨勢進場 -3'); }
  }

  const trades = getTrades();
  const rec = {
    id: p.id, name: p.name, dir: p.dir, sigType: p.sigType || '波段',
    sqGrade: p.sqGrade || null, sqScore: p.sqScore ?? null,
    proven: !!p.proven,
    entry: p.entry, exit: exitPrice, qty: p.qty,
    date: exitDate, note: reason + (penaltyNotes.length ? `（${penaltyNotes.join('、')}）` : ''),
    pnl, retPct, penalty, ctx,
  };
  // 止損鬆緊診斷：止損單觀察後續 5 天是否反轉觸及原止盈一
  if (reason === '跌破止損') {
    rec.slWatch = { tp1: p.tp1, exitDate, result: null };
  }
  trades.push(rec);
  saveTrades(trades);
  showToast(`${p.name}(${p.id}) ${reason}：${pnl > 0 ? '+' : ''}${pnl.toLocaleString()} 元`, pnl >= 0 ? 'success' : 'error');
  if (tgWants('sig')) {
    const icon = pnl > 0 ? '✅' : reason === '保本出場' ? '➡️' : '❌';
    tgPush(`${icon} 台股雷達 交易結算\n\n${p.name}(${p.id}) ${reason}\n進場 ${p.entry} → 出場 ${exitPrice}\n損益 ${pnl > 0 ? '+' : ''}${pnl.toLocaleString()} 元（${retPct > 0 ? '+' : ''}${retPct}%）`);
  }
}

// ── 止損鬆緊診斷：止損後觀察 5 個交易日內是否反轉觸及原止盈一 ──────────
// 反轉觸及 = 止損設太緊（本可獲利）；未反轉 = 止損正確（真實走弱）
function updateSLTightnessWatch() {
  const trades = getTrades();
  let changed = false;
  for (const t of trades) {
    if (!t.slWatch || t.slWatch.result !== null) continue;
    const s = allStocks.find(x => x.id === t.id);
    if (!s?.ohlcv?.length) continue;
    const after = s.ohlcv.filter(b => b.time > t.slWatch.exitDate);
    const window = after.slice(0, 5); // 止損後 5 個交易日
    if (window.some(b => b.high >= t.slWatch.tp1)) {
      t.slWatch.result = true;  // 反轉觸及止盈 → 止損太緊
      changed = true;
    } else if (after.length >= 5) {
      t.slWatch.result = false; // 觀察期滿未反轉 → 止損正確
      changed = true;
    }
  }
  if (changed) saveTrades(trades);
}

function computeSLTightnessStats() {
  const resolved = getTrades().filter(t => t.slWatch && t.slWatch.result !== null);
  const tooTight = resolved.filter(t => t.slWatch.result === true).length;
  const watching = getTrades().filter(t => t.slWatch && t.slWatch.result === null).length;
  return { n: resolved.length, tooTight, pct: resolved.length ? tooTight / resolved.length * 100 : 0, watching };
}

function cancelPending(uid) {
  savePositions(getPositions().filter(p => p.uid !== uid));
  renderPositions();
}

function closeManual(uid) {
  const positions = getPositions();
  const p = positions.find(x => x.uid === uid);
  if (!p || !p.lastPrice) return;
  settlePosition(p, p.lastPrice, new Date().toISOString().slice(0, 10), '手動平倉');
  savePositions(positions.filter(x => x.status === 'pending' || x.status === 'open'));
  renderPositions();
}

function getRiskScore() {
  const totalPenalty = getTrades().reduce((s, t) => s + (t.penalty || 0), 0);
  return Math.max(0, Math.min(100, 100 + totalPenalty));
}

function renderPositions() {
  const positions = getPositions();
  const pending = positions.filter(p => p.status === 'pending');
  const open    = positions.filter(p => p.status === 'open');

  // 統計卡
  const unrealized = open.reduce((s, p) => s + (p.lastPrice ? (p.lastPrice - p.entry) * p.qty : 0), 0);
  const uEl = document.getElementById('pos-unrealized');
  uEl.textContent = open.length ? (unrealized > 0 ? '+' : '') + Math.round(unrealized).toLocaleString() : '--';
  uEl.style.color = unrealized > 0 ? 'var(--bull)' : unrealized < 0 ? 'var(--bear)' : 'var(--text1)';
  document.getElementById('pos-open-count').textContent = open.length;
  document.getElementById('pos-pending-count').textContent = pending.length;
  const rs = getRiskScore();
  const rsEl = document.getElementById('pos-risk-score');
  rsEl.textContent = rs;
  rsEl.style.color = rs >= 80 ? 'var(--bull)' : rs >= 60 ? 'var(--yellow)' : 'var(--bear)';

  // 待進場表
  document.getElementById('pending-badge').textContent = pending.length;
  document.getElementById('pending-tbody').innerHTML = pending.length ? pending.map(p => {
    const dist = p.lastPrice ? ((p.lastPrice - p.entry) / p.entry * 100).toFixed(1) : null;
    return `<tr>
      <td onclick="openStock('${p.id}')" style="cursor:pointer"><span class="stock-cell-id">${p.id}</span> <span style="font-size:0.72rem;color:var(--text3)">${p.name}</span>${p.sigType ? ` <span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:rgba(0,212,255,0.1);color:var(--blue)">${p.sigType}</span>` : ''}${p.sqGrade ? ` <span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:${sqGradeColor(p.sqGrade)}22;border:1px solid ${sqGradeColor(p.sqGrade)}55;color:${sqGradeColor(p.sqGrade)};font-weight:700">SQ ${p.sqGrade}</span>` : ''}${p.proven ? ' <span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:rgba(34,197,94,0.15);color:var(--bull);font-weight:700" title="策略標籤已通過紙上實戰驗證">🎓 驗證策略</span>' : ''}</td>
      <td><span class="score-val" style="color:${scoreToColor(p.score)}">${p.score}</span></td>
      <td style="font-family:var(--mono);font-size:0.75rem">${p.suggestedAt}</td>
      <td class="price-mono" style="color:var(--blue)">${p.entry}</td>
      <td class="price-mono" style="color:var(--bear)">${p.stopLoss}</td>
      <td class="price-mono" style="color:var(--bull)">${p.tp1}</td>
      <td class="price-mono" style="color:var(--bull)">${p.tp2}</td>
      <td class="price-mono">${p.lastPrice ?? '--'}</td>
      <td>${dist !== null ? `<span style="color:var(--yellow);font-family:var(--mono)">${dist > 0 ? '+' : ''}${dist}%</span>` : '--'}</td>
      <td><button class="del-trade-btn" onclick="cancelPending('${p.uid}')" title="取消">×</button></td>
    </tr>`;
  }).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:20px">無待進場單 — 掃描到強勢訊號時 AI 自動建立</td></tr>';

  // 持倉表
  document.getElementById('open-badge').textContent = open.length;
  document.getElementById('open-tbody').innerHTML = open.length ? open.map(p => {
    const pnl = p.lastPrice ? Math.round((p.lastPrice - p.entry) * p.qty) : null;
    const ret = p.lastPrice ? ((p.lastPrice - p.entry) / p.entry * 100).toFixed(2) : null;
    const cls = pnl > 0 ? 'change-up' : pnl < 0 ? 'change-dn' : '';
    return `<tr>
      <td onclick="openStock('${p.id}')" style="cursor:pointer"><span class="stock-cell-id">${p.id}</span> <span style="font-size:0.72rem;color:var(--text3)">${p.name}</span>${p.tp1Hit ? ' <span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:rgba(34,197,94,0.15);color:var(--bull);font-weight:700">🔒 已保本</span>' : ''}${p.sqGrade ? ` <span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:${sqGradeColor(p.sqGrade)}22;color:${sqGradeColor(p.sqGrade)};font-weight:700">SQ ${p.sqGrade}</span>` : ''}${p.proven ? ' <span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:rgba(34,197,94,0.15);color:var(--bull);font-weight:700">🎓</span>' : ''}</td>
      <td style="font-family:var(--mono);font-size:0.75rem">${p.entryDate}</td>
      <td class="price-mono">${p.entry}</td>
      <td class="price-mono">${p.lastPrice ?? '--'}</td>
      <td class="${cls}">${pnl !== null ? (pnl > 0 ? '+' : '') + pnl.toLocaleString() : '--'}</td>
      <td class="${cls}">${ret !== null ? (ret > 0 ? '+' : '') + ret + '%' : '--'}</td>
      <td class="price-mono" style="color:var(--bear)">${p.stopLoss}</td>
      <td class="price-mono" style="color:var(--bull)">${p.tp1}</td>
      <td><button class="btn-ghost" style="padding:3px 10px;font-size:0.72rem" onclick="closeManual('${p.uid}')">平倉</button></td>
    </tr>`;
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:20px">尚無持倉 — 待進場單回踩成交後自動轉入</td></tr>';
}

// ── 台股資金流入流出事件（六個月內） ──────────────────────────────────────

function thirdFriday(y, m) {
  const d = new Date(y, m, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 14);
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

function switchReportPeriod(period, btn) {
  reportPeriod = period;
  btn.parentElement.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderReport();
}

function renderReport() {
  const el = document.getElementById('report-content');
  const trades = getTrades();
  if (!trades.length) {
    el.innerHTML = '<div class="adv-loading">尚無已結算交易，等待 AI 訊號成交後產生報表</div>';
    return;
  }

  const keyLen = reportPeriod === 'month' ? 7 : 4;
  const groups = {};
  trades.forEach(t => {
    const k = (t.date || '').slice(0, keyLen);
    if (!k) return;
    (groups[k] = groups[k] || []).push(t);
  });

  const keys = Object.keys(groups).sort().reverse();
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter(t => t.pnl > 0).length;

  el.innerHTML = `
    <div class="overview-grid" style="margin-bottom:16px">
      <div class="ov-card ov-total"><div class="ov-body" style="padding-left:4px"><div class="ov-value">${trades.length}</div><div class="ov-label">累計交易</div></div></div>
      <div class="ov-card ov-bull"><div class="ov-body" style="padding-left:4px"><div class="ov-value">${(wins / trades.length * 100).toFixed(0)}%</div><div class="ov-label">總勝率</div></div></div>
      <div class="ov-card"><div class="ov-body" style="padding-left:4px"><div class="ov-value" style="color:${totalPnl >= 0 ? 'var(--bull)' : 'var(--bear)'}">${totalPnl > 0 ? '+' : ''}${totalPnl.toLocaleString()}</div><div class="ov-label">累計損益 (元)</div></div></div>
      <div class="ov-card ov-neutral"><div class="ov-body" style="padding-left:4px"><div class="ov-value">${getRiskScore()}</div><div class="ov-label">風控分數</div></div></div>
    </div>
    <div class="tbl-card full-tbl">
      <div class="tbl-head">
        <div class="tbl-title"><span class="dot" style="background:var(--blue)"></span> ${reportPeriod === 'month' ? '月度' : '年度'}績效</div>
      </div>
      <div class="tbl-scroll">
        <table class="data-tbl">
          <thead><tr>
            <th>${reportPeriod === 'month' ? '月份' : '年度'}</th><th>筆數</th><th>勝率</th><th>損益</th><th>平均報酬</th><th>最佳</th><th>最差</th><th>風控扣分</th>
          </tr></thead>
          <tbody>
            ${keys.map(k => {
              const g = groups[k];
              const w = g.filter(t => t.pnl > 0).length;
              const pnl = g.reduce((s, t) => s + t.pnl, 0);
              const avgRet = g.reduce((s, t) => s + t.retPct, 0) / g.length;
              const best = Math.max(...g.map(t => t.pnl));
              const worst = Math.min(...g.map(t => t.pnl));
              const pen = g.reduce((s, t) => s + (t.penalty || 0), 0);
              const cls = pnl > 0 ? 'change-up' : pnl < 0 ? 'change-dn' : '';
              return `<tr>
                <td style="font-family:var(--mono)">${k}</td>
                <td>${g.length}</td>
                <td>${(w / g.length * 100).toFixed(0)}%</td>
                <td class="${cls}">${pnl > 0 ? '+' : ''}${pnl.toLocaleString()}</td>
                <td class="${avgRet >= 0 ? 'change-up' : 'change-dn'}">${avgRet > 0 ? '+' : ''}${avgRet.toFixed(2)}%</td>
                <td class="change-up">+${best.toLocaleString()}</td>
                <td class="change-dn">${worst.toLocaleString()}</td>
                <td>${pen < 0 ? `<span style="color:var(--bear);font-family:var(--mono)">${pen}</span>` : '0'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ── Institutional Overview (全市場三大法人) ────────────────────────────────

async function loadInstitutionalOverview() {
  const el = document.getElementById('institutional-body');
  const rows = await fetchT86All();
  if (!rows || !rows.length) {
    if (el) el.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">三大法人資料暫時無法取得（非交易日或 TWSE API 未更新）</p>';
    return;
  }

  // Sum market-wide totals (張)
  let foreign = 0, investment = 0, dealer = 0, total = 0;
  const parsed = rows.map(r => ({
    id: r[0]?.trim(), name: r[1]?.trim(),
    foreign: parseK(r[4]), investment: parseK(r[7]), dealer: parseK(r[10]), total: parseK(r[11]),
  }));
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
  ['inst-body','setup-body','mtf-body','fund-body','chip-body','sr-body','mkt-body','ind-body','ai-anal-body','situation-body','of-body','vp-body'].forEach(id => {
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
    document.getElementById('stock-price').textContent = '無法載入';
    const aab = document.getElementById('ai-anal-body');
    if (aab) aab.innerHTML = `<div class="adv-loading">個股資料載入失敗（資料來源逾時，或代號不存在/已下市）<br>
      <button class="btn-ghost" style="margin-top:10px;padding:6px 16px" onclick="openStock('${stockId}')">🔄 重新載入</button></div>`;
    return;
  }

  renderStockDetail(s);
  renderAnalysisPanels(s, null);
  renderSituation(s, null);
  renderOrderFlow(s);
  renderVolumeProfile(s);
  renderFullRisk(s, null);

  // Async: institutional + MTF
  fetchInstitutional(stockId).then(inst => {
    renderInstitutional(inst);
    renderAnalysisPanels(s, inst);
    renderSituation(s, inst);
    renderFullRisk(s, inst);
  });
  fetchMTFSignals(stockId).then(mtf => renderMTF(mtf));
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

  // Trading setup
  const setup = generateSetup(s.ohlcv, a);
  if (setup) {
    document.getElementById('setup-body').innerHTML = `
      <div class="setup-grid">
        <div class="setup-item">
          <div class="setup-lbl">參考進場價</div>
          <div class="setup-val">${setup.entry.toFixed(2)}</div>
          <div class="setup-note">當前股價</div>
        </div>
        <div class="setup-item">
          <div class="setup-lbl">止損</div>
          <div class="setup-val" style="color:var(--bear)">${setup.stopLoss.toFixed(2)}</div>
          <div class="setup-note">近5日低點 ×${setup.stopAdj}（風控學習自動調整）</div>
        </div>
        <div class="setup-item">
          <div class="setup-lbl">目標一 (2R)</div>
          <div class="setup-val" style="color:var(--bull)">${setup.tp1.toFixed(2)}</div>
          <div class="setup-note">風險報酬 1:${setup.rr}</div>
        </div>
        <div class="setup-item">
          <div class="setup-lbl">目標二 (3R)</div>
          <div class="setup-val" style="color:var(--blue)">${setup.tp2.toFixed(2)}</div>
          <div class="setup-note">延伸目標</div>
        </div>
      </div>
      ${setup.atr ? (() => {
        const atrRatio = setup.risk / setup.atr;
        const diag = atrRatio < 1 ? { t: '偏緊 — 日常波動就可能掃到止損', c: 'var(--yellow)' }
                   : atrRatio > 3 ? { t: '偏寬 — 單筆虧損風險較大，留意倉位', c: 'var(--yellow)' }
                   : { t: '鬆緊適中', c: 'var(--bull)' };
        return `<div style="margin-top:10px;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;font-size:0.76rem;color:var(--text3)">
          波動參考：ATR(14) ≈ ${setup.atr.toFixed(2)}（每日約 ${(setup.atr / setup.entry * 100).toFixed(1)}%）｜止損距離 ${(setup.risk / setup.entry * 100).toFixed(1)}% ≈ <strong style="color:${diag.c}">${atrRatio.toFixed(1)}×ATR（${diag.t}）</strong>
        </div>`;
      })() : ''}
      <p style="font-size:0.78rem;color:var(--text3);margin-top:12px">⚠ 以上為技術分析參考，非投資建議。投資涉及風險，請自行判斷。</p>`;
  } else {
    document.getElementById('setup-body').innerHTML = '<p style="color:var(--text3);font-size:0.85rem">數據不足，無法生成交易建議</p>';
  }

  // Risk
  let riskLevel, riskColor, riskClass, riskWidth, riskDesc;
  if (a.score >= 70) {
    riskLevel = '低風險'; riskClass = 'risk-low'; riskWidth = 30; riskColor = 'var(--bull)';
    riskDesc = `趨勢評分 ${a.score}/100，多項技術指標支撐，順勢做多風險相對較低。`;
  } else if (a.score >= 50) {
    riskLevel = '中風險'; riskClass = 'risk-med'; riskWidth = 55; riskColor = 'var(--yellow)';
    riskDesc = `趨勢評分 ${a.score}/100，訊號中性，建議觀望或設定嚴格止損。`;
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
  else                  quality = { txt: '⚪ 低品質訊號 — 時框分歧，建議觀望不進場', c: 'var(--neutral)', bg: 'rgba(148,163,184,0.06)' };

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

function idSeed(stockId) {
  return stockId.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 7), 13);
}

function srng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; };
}

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

const SECTOR_NEWS = {
  '半導體': [
    { date:'2026-06-10', headline:'AI 晶片需求強勁，台積電 CoWoS 封裝產能持續供不應求', tag:'利多', tagClass:'bull' },
    { date:'2026-06-08', headline:'NVIDIA Blackwell 大量出貨，台廠供應鏈能見度看至 Q4', tag:'利多', tagClass:'bull' },
    { date:'2026-06-05', headline:'半導體設備商出貨強化，預示下半年資本支出高峰', tag:'中性', tagClass:'neutral' },
  ],
  '電子': [
    { date:'2026-06-10', headline:'iPhone 17 備料提前，供應鏈 Q4 訂單能見度佳', tag:'利多', tagClass:'bull' },
    { date:'2026-06-07', headline:'AI 伺服器散熱需求激增，PCB/散熱廠接單超出預期', tag:'利多', tagClass:'bull' },
    { date:'2026-06-04', headline:'東南亞廠區產能爬坡，部分品項仍面臨良率壓力', tag:'中性', tagClass:'neutral' },
  ],
  '金融': [
    { date:'2026-06-10', headline:'央行第三季利率決策備受關注，台幣走勢左右金融股評價', tag:'中性', tagClass:'neutral' },
    { date:'2026-06-08', headline:'壽險業淨值回升，股債配置改善有助評價修復', tag:'利多', tagClass:'bull' },
    { date:'2026-06-05', headline:'放款品質穩健，銀行業不良率處歷史低位', tag:'利多', tagClass:'bull' },
  ],
  '生技': [
    { date:'2026-06-09', headline:'新藥核准案件增加，生技股 NDA 申請進度成市場焦點', tag:'利多', tagClass:'bull' },
    { date:'2026-06-07', headline:'健保給付調整草案公布，部分藥品售價面臨壓力', tag:'利空', tagClass:'bear' },
    { date:'2026-06-03', headline:'AI 藥物探索平台與台廠合作消息頻傳，CDMO 訂單增加', tag:'利多', tagClass:'bull' },
  ],
  '電信': [
    { date:'2026-06-09', headline:'5G 覆蓋率突破 80%，企業專網應用帶動 ARPU 提升', tag:'利多', tagClass:'bull' },
    { date:'2026-06-06', headline:'NCC 頻譜審查啟動，6G 布局進入規劃階段', tag:'中性', tagClass:'neutral' },
    { date:'2026-06-03', headline:'電信業現金殖利率逾 5%，防禦性配置需求旺盛', tag:'利多', tagClass:'bull' },
  ],
  '傳產': [
    { date:'2026-06-10', headline:'鋼鐵原料成本回落，傳產股毛利率有望改善', tag:'利多', tagClass:'bull' },
    { date:'2026-06-07', headline:'內需消費復甦趨緩，部分傳產受到匯率波動影響', tag:'中性', tagClass:'neutral' },
    { date:'2026-06-04', headline:'中國市場需求回溫，台廠出口訂單出現回升訊號', tag:'利多', tagClass:'bull' },
  ],
  '塑化': [
    { date:'2026-06-09', headline:'油價高位震盪，石化原料成本壓力仍未完全消散', tag:'中性', tagClass:'neutral' },
    { date:'2026-06-07', headline:'景氣循環底部確認，塑化股評價具備修復空間', tag:'利多', tagClass:'bull' },
    { date:'2026-06-04', headline:'台化法說會將於本月底舉行，市場關注下半年展望', tag:'中性', tagClass:'neutral' },
  ],
  '航運': [
    { date:'2026-06-10', headline:'紅海局勢持續，繞行非洲航線拉長運距支撐運費', tag:'利多', tagClass:'bull' },
    { date:'2026-06-08', headline:'貨櫃運費指數 SCFI 繼續上行，航商展望正向', tag:'利多', tagClass:'bull' },
    { date:'2026-06-05', headline:'散裝航運 BDI 指數回調，乾散貨需求趨於觀望', tag:'中性', tagClass:'neutral' },
  ],
  '其他': [
    { date:'2026-06-10', headline:'台股法人買盤持續進駐，外資累計淨買超超越去年同期', tag:'利多', tagClass:'bull' },
    { date:'2026-06-08', headline:'台灣 PMI 連續第三個月擴張，製造業景氣穩健', tag:'利多', tagClass:'bull' },
    { date:'2026-06-05', headline:'美國聯準會維持利率不變，科技股評價壓力稍緩', tag:'中性', tagClass:'neutral' },
  ],
};

function getSectorNews(sector) {
  for (const key of Object.keys(SECTOR_NEWS)) {
    if (key !== '其他' && sector.includes(key)) return SECTOR_NEWS[key];
  }
  return SECTOR_NEWS['其他'];
}

async function renderAnalysisPanels(s, inst) {
  const a = s.analysis;
  const ohlcv = s.ohlcv;
  const meta = getStockList().find(m => m.id === s.id) || { sector: '其他' };
  const sector = meta.sector || '其他';
  const rng = srng(idSeed(s.id));

  // 真實基本面：v7 quote（優先）→ quoteSummary（備援）→ 模擬估算（明確標示）
  // 非同步 IIFE：網路慢/proxy 被限流時不阻塞下方籌碼、支撐壓力、產業面板的渲染
  const fundP = (async () => {
  let fd = s._fd;
  if (fd === undefined) {
    fd = await fetchQuoteInfo(s.id).catch(() => null);
    if (!fd) {
      try {
        const suffix = localStorage.getItem(`sym-suffix:${s.id}`) === 'TWO' ? 'TWO' : 'TW';
        const raw = await proxyFetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${s.id}.${suffix}?modules=defaultKeyStatistics,summaryDetail`, 8000);
        const r0 = raw?.quoteSummary?.result?.[0];
        if (r0) fd = {
          pe: r0.summaryDetail?.trailingPE?.raw ?? r0.defaultKeyStatistics?.forwardPE?.raw ?? null,
          pb: r0.defaultKeyStatistics?.priceToBook?.raw ?? null,
          divYield: r0.summaryDetail?.dividendYield?.raw ?? null,
          eps: r0.defaultKeyStatistics?.trailingEps?.raw ?? null,
          marketCap: r0.summaryDetail?.marketCap?.raw ?? null,
          high52: r0.summaryDetail?.fiftyTwoWeekHigh?.raw ?? null,
          low52: r0.summaryDetail?.fiftyTwoWeekLow?.raw ?? null,
        };
      } catch {}
    }
    s._fd = fd || null;
    fd = s._fd;
  }
  const isRealFd = !!(fd && (fd.pe != null || fd.pb != null || fd.divYield != null));

  const pe = fd?.pe ?? +(8 + rng()*22).toFixed(1);
  const pb = fd?.pb ?? +(0.8 + rng()*3.5).toFixed(2);
  const divYield = fd?.divYield ?? +(0.025 + rng()*0.055).toFixed(4);

  // 護城河改以真實市值分級（市值 = 規模 + 產業地位的粗略代理），無市值才用估算
  const capB = fd?.marketCap ? fd.marketCap / 1e8 : null; // 億元
  const moatScore = capB != null
    ? (capB >= 10000 ? 5 : capB >= 3000 ? 4 : capB >= 1000 ? 3 : capB >= 300 ? 2 : 1)
    : Math.round(1 + rng()*4);
  const yieldPct = (divYield * 100).toFixed(2);
  const annualIncome = Math.round(100000 * divYield);
  const peN = +pe, pbN = +pb;
  const peColor  = peN<12 ? 'var(--bull)' : peN<22 ? 'var(--blue)' : 'var(--bear)';
  const pbColor  = pbN<1.5 ? 'var(--bull)' : pbN<3 ? 'var(--blue)' : 'var(--bear)';
  const yldColor = divYield>0.05 ? 'var(--bull)' : divYield>0.03 ? 'var(--blue)' : 'var(--text2)';
  const moatDescs = ['護城河薄弱','競爭優勢有限','具一定品牌優勢','強健技術/品牌壁壘','行業主導者'];
  const fdBadge = isRealFd
    ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 即時數據 Yahoo</span>'
    : '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(245,158,11,0.12);color:var(--yellow)">⚠ 模擬估算（真實數據暫時無法取得）</span>';

  // 52 週價格位置（真實數據才顯示）
  let range52Html = '';
  if (fd?.high52 && fd?.low52 && fd.high52 > fd.low52) {
    const pos52 = Math.max(0, Math.min(100, (a.price - fd.low52) / (fd.high52 - fd.low52) * 100));
    range52Html = `
      <div class="fund-block" style="margin-top:10px">
        <div class="fund-block-ttl">52 週價格區間</div>
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;font-family:var(--mono);margin:6px 0 4px"><span style="color:var(--bull)">${fd.low52.toFixed(2)}</span><span style="color:var(--text2)">現價 ${a.price.toFixed(2)}（${pos52.toFixed(0)}%）</span><span style="color:var(--bear)">${fd.high52.toFixed(2)}</span></div>
        <div style="height:6px;border-radius:3px;background:linear-gradient(90deg,var(--bull),var(--yellow),var(--bear));position:relative">
          <div style="position:absolute;top:-3px;left:${pos52}%;width:3px;height:12px;background:var(--text1);border-radius:2px;transform:translateX(-50%)"></div>
        </div>
      </div>`;
  }

  const keyStatsHtml = isRealFd ? `
      <div class="fund-block">
        <div class="fund-block-ttl">關鍵財務數據</div>
        <table class="qt-table">
          <tbody>
            <tr><td style="color:var(--text3)">近四季 EPS (TTM)</td><td class="${fd.eps > 0 ? 'qt-pos' : 'qt-neg'}">${fd.eps != null ? fd.eps.toFixed(2) + ' 元' : '--'}</td></tr>
            <tr><td style="color:var(--text3)">市值</td><td>${capB != null ? (capB >= 10000 ? (capB/10000).toFixed(2) + ' 兆' : capB.toFixed(0) + ' 億') : '--'}</td></tr>
            <tr><td style="color:var(--text3)">EPS 回推年獲利力</td><td>${fd.eps != null && fd.eps > 0 ? '每股 ' + fd.eps.toFixed(2) + ' 元／P/E ' + peN.toFixed(1) + 'x' : '--'}</td></tr>
          </tbody>
        </table>
        ${range52Html}
      </div>` : `
      <div class="fund-block">
        <div class="fund-block-ttl">近四季財務數據 <span style="font-size:0.6rem;color:var(--yellow)">模擬示意</span></div>
        <table class="qt-table">
          <thead><tr><th>季度</th><th>營收(百萬)</th><th>毛利率</th><th>EPS</th></tr></thead>
          <tbody>${['Q1/25','Q2/25','Q3/25','Q4/25'].map(qL => {
            const gm = +(22 + rng()*28).toFixed(1), eps = +(0.3 + rng()*5).toFixed(2);
            return `<tr>
            <td style="color:var(--text3)">${qL}</td>
            <td>${((5000 + rng()*45000)/1000).toFixed(0)}M</td>
            <td class="${gm>30?'qt-pos':gm<20?'qt-neg':''}">${gm}%</td>
            <td class="${eps>1?'qt-pos':'qt-neg'}">${eps}</td>
          </tr>`;}).join('')}</tbody>
        </table>
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
            <div class="val-item"><div class="val-lbl">本益比 P/E</div><div class="val-num" style="color:${peColor}">${peN.toFixed(1)}x</div></div>
            <div class="val-item"><div class="val-lbl">股價淨值 P/B</div><div class="val-num" style="color:${pbColor}">${pbN.toFixed(2)}x</div></div>
            <div class="val-item"><div class="val-lbl">殖利率</div><div class="val-num" style="color:${yldColor}">${yieldPct}%</div></div>
          </div>
        </div>
        <div class="moat-grid">
          <div class="moat-item"><div class="moat-lbl">護城河評估${capB != null ? '（依市值規模）' : ''}</div><div class="moat-stars">${'★'.repeat(moatScore)+'☆'.repeat(5-moatScore)}</div><div class="moat-desc">${moatDescs[moatScore-1]}</div></div>
        </div>
      </div>
    </div>
    <div style="margin-top:12px">
      <div class="fund-block-ttl">配息試算（投入 10 萬元${isRealFd ? '，依實際年化殖利率' : ''}）</div>
      <div class="div-calc">
        <div class="div-calc-row"><span>年殖利率</span><span style="font-family:var(--mono);color:${yldColor}">${yieldPct}%</span></div>
        <div class="div-calc-row"><span>預估年配息</span><div><span class="div-calc-big">+${annualIncome.toLocaleString()}</span><span style="font-size:0.78rem;color:var(--text3)"> 元</span></div></div>
        <div class="div-calc-row" style="margin-bottom:0"><span style="color:var(--text3)">每季估計</span><span style="font-family:var(--mono);color:var(--text3)">+${Math.round(annualIncome/4).toLocaleString()} 元</span></div>
      </div>
    </div>`;
  return { peN, divYield, yieldPct };
  })();

  // ── Render 籌碼面 ──────────────────────────────────────────────
  // 優先用逐日累積的真實法人歷史（inst-hist），不足 5 天的舊日子以模擬示意補齊
  let instHist = [];
  try { instHist = (JSON.parse(localStorage.getItem('inst-hist') || '{}')[s.id] || []).slice(-5); } catch {}
  const realDays = instHist.length;
  const inst5 = [];
  for (let i = 0; i < 5 - realDays; i++) {
    inst5.push({
      label: `D-${4 - i}`,
      foreign: Math.round((500+rng()*5000) * (rng()>0.4?1:-1)),
      invest:  Math.round((100+rng()*2000) * (rng()>0.5?1:-1)),
      dealer:  Math.round((50+rng()*800)   * (rng()>0.5?1:-1)),
    });
  }
  instHist.forEach(r => inst5.push({ label: r.d.slice(5), foreign: r.f, invest: r.i, dealer: r.dl }));
  if (inst && !realDays) { inst5[4].foreign = inst.foreign; inst5[4].invest = inst.investment; inst5[4].dealer = inst.dealer; }
  const chipBadge = realDays >= 5
    ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 真實數據 TWSE</span>'
    : realDays > 0
      ? `<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(0,212,255,0.1);color:var(--blue)">累積真實數據中 ${realDays}/5 日（其餘為模擬示意）</span>`
      : '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(245,158,11,0.12);color:var(--yellow)">⚠ 模擬示意（真實歷史自今日起逐日累積）</span>';

  const maxFlow = Math.max(...inst5.flatMap(d => [Math.abs(d.foreign),Math.abs(d.invest),Math.abs(d.dealer)]), 1);
  function chipBarHtml(val) {
    const pct = Math.min(Math.abs(val)/maxFlow*46, 46);
    const pos = val >= 0;
    return `<div class="chip-bar-track"><div class="chip-bar-fill ${pos?'chip-bar-pos':'chip-bar-neg'}" style="${pos?'right:50%':'left:50%'};width:${pct}%"></div></div><span class="chip-bar-val" style="color:${pos?'var(--bull)':'var(--bear)'}">${pos?'+':''}${(val/1000).toFixed(1)}K</span>`;
  }
  const t5 = { f:inst5.reduce((s,d)=>s+d.foreign,0), i:inst5.reduce((s,d)=>s+d.invest,0), d:inst5.reduce((s,d)=>s+d.dealer,0) };
  const gTotal = t5.f+t5.i+t5.d;

  document.getElementById('chip-body').innerHTML = `
    <div>
      <div class="fund-block-ttl">5日三大法人買賣超趨勢 ${chipBadge}</div>
      <div style="display:grid;grid-template-columns:36px 1fr 1fr 1fr;gap:5px;align-items:center;margin-top:8px">
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
      <div class="fund-block-ttl">5日累計買賣超</div>
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
    const twiiBars = await fetchYahooOHLCV('^TWII', '1d', '6mo');
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
  const isRealMkt = beta != null;
  if (beta == null) beta = +(0.6 + rng()*1.0).toFixed(2);
  if (corr == null) corr = +(0.4 + rng()*0.5).toFixed(2);
  const mktRet = mktRet20 ?? +(rng()*8-3).toFixed(1);

  const rs = (+ret20 - +mktRet).toFixed(1);
  const rsN = +rs;
  const rsColor = rsN>3 ? 'var(--bull)' : rsN<-3 ? 'var(--bear)' : 'var(--text2)';
  const rsLabel = rsN>5?'顯著強於大盤':rsN>1?'優於大盤':rsN<-5?'顯著弱於大盤':rsN<-1?'弱於大盤':'與大盤持平';
  const mktBadge = isRealMkt
    ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 實測（近60日 vs 加權指數）</span>'
    : '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(245,158,11,0.12);color:var(--yellow)">⚠ 模擬估算（大盤數據暫時無法取得）</span>';

  if (currentStockId !== s.id) return { rs, rsN }; // 已切換個股，別蓋掉新頁面
  document.getElementById('mkt-body').innerHTML = `
    <div style="margin-bottom:8px">${mktBadge}</div>
    <div class="mkt-grid">
      <div class="mkt-item">
        <div class="mkt-lbl">20日相對強弱</div>
        <div class="mkt-val" style="color:${rsColor}">${rsN>0?'+':''}${rs}%</div>
        <div class="mkt-note">${rsLabel}</div>
      </div>
      <div class="mkt-item">
        <div class="mkt-lbl">Beta 值</div>
        <div class="mkt-val">${beta}</div>
        <div class="mkt-note">${beta>1.2?'高Beta高波動':beta<0.8?'低Beta防禦型':'與市場同步'}</div>
      </div>
      <div class="mkt-item">
        <div class="mkt-lbl">與大盤相關性</div>
        <div class="mkt-val">${corr}</div>
        <div class="mkt-note">${corr>0.7?'高相關':corr>0.4?'中度相關':'低相關'}</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border-radius:8px;font-size:0.82rem;color:var(--text3);line-height:1.6">
      20日股票漲跌 <span style="font-family:var(--mono);color:${+ret20>=0?'var(--bull)':'var(--bear)'}">${+ret20>=0?'+':''}${ret20}%</span>，
      超額報酬 <span style="font-family:var(--mono);color:${rsColor}">${rsN>0?'+':''}${rs}%</span>。
      Beta ${beta}，${corr>0.6?'與指數連動性高，受大盤情緒影響明顯':'與指數連動性低，可作分散持倉選項'}。
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
      ${isLive ? '<span style="font-size:0.62rem;padding:1px 7px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull)">● 即時新聞</span>' : ''}
    </div>
    <div class="fund-block-ttl">最新產業動態</div>
    <div class="news-list">${news.map(n=>`
      <div class="news-item" ${n.link ? `style="cursor:pointer" onclick="window.open('${n.link}','_blank')"` : ''}>
        <div class="news-date">${n.date}${n.source ? ' · ' + n.source : ''}</div>
        <div class="news-headline">${n.headline}</div>
        <span class="news-tag ${n.tagClass}">${n.tag}</span>
      </div>`).join('')}
    </div>`;
  };
  // 先用內建清單即時顯示，真實新聞抓到後無縫替換（不阻塞其他面板）
  renderIndBody(getSectorNews(sector), false);
  fetchNewsRSS(`${s.name} ${sector === '其他' ? '台股' : sector}`, 3).then(live => {
    if (live?.length && currentStockId === s.id) renderIndBody(live, true);
  });

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
  const bullN2 = factors.filter(f=>f.cls==='bull').length;
  const bearN2 = factors.filter(f=>f.cls==='bear').length;
  const s1 = sr.supports[0], r1 = sr.resistances[0];

  let recCls, verdict, bodyTxt, recTxt;
  if (a.score>=68 && bullN2>=5) {
    recCls='bull'; verdict='做多訊號強烈';
    bodyTxt=`${s.id} ${s.name||''} 技術面呈強勢多頭，評分 ${a.score}/100，RSI ${a.rsi?.toFixed(1)} 多頭區間，MACD 金叉，ADX ${a.adx?.toFixed(0)} 趨勢確立。法人籌碼${gTotal>=0?'淨買超支撐':'偏中性'}，P/E ${peN.toFixed(1)}x ${peN<18?'估值具吸引力':'合理範圍'}，殖利率 ${yieldPct}% 提供下檔保護。建議在 EMA20 (${a.ema20?.toFixed(2)}) 附近逢回布局，止損設於 ${s1?s1.toFixed(2):(a.price*0.97).toFixed(2)}，目標看 ${r1?r1.toFixed(2):(a.price*1.08).toFixed(2)}。`;
    recTxt='✅ 建議做多 — 技術・基本面・法人三向共振';
  } else if (a.score<=35 && bearN2>=4) {
    recCls='bear'; verdict='空頭訊號明顯';
    bodyTxt=`${s.id} ${s.name||''} 技術面轉弱，評分 ${a.score}/100，RSI ${a.rsi?.toFixed(1)} 顯示動能減弱，MACD 死叉確認空頭趨勢，股價跌破 EMA20 (${a.ema20?.toFixed(2)})。建議迴避或考慮停損出場，等待評分回升至 50 以上再重新評估。${s1?'重要支撐：'+s1.toFixed(2):''}`;
    recTxt='❌ 建議迴避 — 多項指標轉空，短期下行風險高';
  } else if (a.score>=55) {
    recCls='bull'; verdict='偏多，等待確認';
    bodyTxt=`${s.id} ${s.name||''} 整體訊號偏多，評分 ${a.score}/100。建議等待回踩 EMA20 (${a.ema20?.toFixed(2)}) 確認後再進場，${s1?'支撐位 '+s1.toFixed(2)+' 可作為止損參考':'設嚴格止損控制風險'}，${r1?'目標 '+r1.toFixed(2):'以近期高點為目標'}。倉位控制在資金 10% 以內。`;
    recTxt='⚡ 觀望偏多 — 等待回踩 EMA20 確認後進場';
  } else {
    recCls='neutral'; verdict='中性，方向觀望';
    bodyTxt=`${s.id} ${s.name||''} 訊號分歧，評分 ${a.score}/100。建議暫時觀望，${r1?'突破 '+r1.toFixed(2)+' 可考慮做多':'等方向確立再行動'}，${s1?'跌破 '+s1.toFixed(2)+' 請迴避':'避免追高殺低'}，不宜重倉。`;
    recTxt='⚠ 中性觀望 — 等待明確方向訊號';
  }

  document.getElementById('ai-anal-body').innerHTML = `
    <div class="ai-anal-box">
      <div class="ai-anal-verdict" style="color:${recCls==='bull'?'var(--bull)':recCls==='bear'?'var(--bear)':'var(--text2)'}">${verdict}</div>
      <div class="ai-anal-text">${bodyTxt}</div>
      <div class="ai-anal-factors">${factors.map(f=>`<span class="ai-anal-tag ${f.cls}">${f.txt}</span>`).join('')}</div>
      <div class="ai-rec ${recCls}">${recTxt}</div>
    </div>`;
}

// ── TradingView Chart ─────────────────────────────────────────────────────

function initTVChart(stockId, interval = 'D') {
  const container = document.getElementById('tv-chart-container');
  container.innerHTML = '';
  // 上櫃股票在 TradingView 是 TPEX: 交易所代碼，用 TWSE: 會顯示「找不到商品」
  const tvSymbol = localStorage.getItem(`sym-suffix:${stockId}`) === 'TWO' ? `TPEX:${stockId}` : `TWSE:${stockId}`;
  if (typeof TradingView === 'undefined') {
    // Fallback: use embed script approach
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: tvSymbol, interval, theme: 'dark', style: '1',
      locale: 'zh_TW', width: '100%', height: '450',
      hide_side_toolbar: true, save_image: false,
    });
    container.appendChild(script);
    return;
  }
  tvChart = new TradingView.widget({
    container_id: 'tv-chart-container',
    symbol: tvSymbol,
    interval,
    theme: 'dark',
    style: '1',
    locale: 'zh_TW',
    width: '100%',
    height: 450,
    toolbar_bg: '#0d1220',
    hide_side_toolbar: true,
    allow_symbol_change: false,
    save_image: false,
    studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
  });
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
  if (page === 'tradelog') renderTradelog();
  if (page === 'positions') renderPositions();
  if (page === 'report') renderReport();
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

// ── 每日 / 每週重點關注股 ──────────────────────────────────────────────────

function computeFocusStocks() {
  const valid = allStocks.filter(s => s.analysis && s.ohlcv?.length >= 21);
  if (!valid.length) return { daily: [], weekly: [] };

  // 每日重點：今日動能（評分 + 量能 + 當日漲幅 + ADX）
  const daily = valid.map(s => {
    const a = s.analysis;
    const volR = a.volMA ? a.lastVol / a.volMA : 1;
    const chg1 = a.prevClose ? (a.price - a.prevClose) / a.prevClose * 100 : 0;
    const heat = a.score + Math.min(volR, 3) * 8 + Math.max(-5, Math.min(chg1, 5)) * 2 + (a.adx > 25 ? 5 : 0);
    const reasons = [];
    if (a.score >= 65) reasons.push(`評分${a.score}`);
    if (volR >= 1.5) reasons.push(`量能${volR.toFixed(1)}倍`);
    if (Math.abs(chg1) >= 2) reasons.push(`今日${chg1 > 0 ? '+' : ''}${chg1.toFixed(1)}%`);
    if (a.adx > 30) reasons.push(`ADX${a.adx.toFixed(0)}強趨勢`);
    if (a.macd?.macd > a.macd?.signal) reasons.push('MACD金叉');
    return { s, heat, reasons: reasons.slice(0, 3), chg1 };
  }).sort((x, y) => y.heat - x.heat).slice(0, 5);

  // 每週重點：中期趨勢（評分 + 20日動能 + 長多排列）
  const weekly = valid.map(s => {
    const a = s.analysis;
    const closes = s.ohlcv.map(d => d.close);
    const ret20 = (closes[closes.length-1] - closes[closes.length-21]) / closes[closes.length-21] * 100;
    const longAligned = a.ema50 && a.ema200 && a.ema50 > a.ema200 && a.price > a.ema50;
    const heat = a.score * 0.7 + Math.max(-10, Math.min(ret20, 20)) * 1.5 + (longAligned ? 12 : 0);
    const reasons = [];
    if (ret20 > 5) reasons.push(`20日+${ret20.toFixed(1)}%`);
    if (longAligned) reasons.push('長多排列');
    if (a.score >= 65) reasons.push(`評分${a.score}`);
    if (a.rsi >= 50 && a.rsi < 70) reasons.push('RSI健康多頭');
    return { s, heat, reasons: reasons.slice(0, 3), ret20 };
  }).sort((x, y) => y.heat - x.heat).slice(0, 5);

  return { daily, weekly };
}

function renderFocusStocks() {
  const el = document.getElementById('focus-body');
  if (!el) return;
  const { daily, weekly } = computeFocusStocks();
  if (!daily.length) { el.innerHTML = '<div class="adv-loading">數據不足</div>'; return; }

  const item = (f, chgTxt) => `
    <div class="event-row" style="cursor:pointer" onclick="openStock('${f.s.id}')">
      <div class="event-countdown" style="min-width:56px">${f.s.id}</div>
      <div style="flex:1">
        <div class="event-name">${f.s.name} <span class="trend-badge trend-${signalClass(f.s.analysis.signal)}" style="font-size:0.62rem;padding:1px 7px;margin-left:4px">${f.s.analysis.signal}</span></div>
        <div class="event-date">${f.reasons.join('・') || '綜合動能領先'}</div>
      </div>
      <span style="font-family:var(--mono);font-size:0.8rem;font-weight:700;color:${chgTxt.v >= 0 ? 'var(--bull)' : 'var(--bear)'}">${chgTxt.v >= 0 ? '+' : ''}${chgTxt.v.toFixed(1)}%<span style="font-size:0.62rem;color:var(--text3);font-weight:400"> ${chgTxt.l}</span></span>
    </div>`;

  el.innerHTML = `
    <h3 style="font-size:0.88rem;font-weight:600;color:var(--text2);margin-bottom:4px">⭐ 重點關注股</h3>
    <span style="font-size:0.7rem;color:var(--text3)">AI 依動能・量能・趨勢自動挑選，點擊查看完整分析</span>
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

function getWeeklyNews() {
  // 近一週台股重點財經新聞（依主題規則整理，附 AI 多空判讀）
  return [
    { date: '07-11', headline: '台積電 6 月營收再創同期新高，AI 訂單能見度延伸至 2027', impact: '半導體/權值股', dir: '偏多', cls: 'bull' },
    { date: '07-10', headline: '美國 6 月 CPI 降溫，市場對 7/29 FOMC 降息預期升至七成', impact: '全球風險資產', dir: '偏多', cls: 'bull' },
    { date: '07-09', headline: '新台幣升值壓力增，出口電子股 Q3 匯損疑慮升溫', impact: '電子出口股', dir: '偏空', cls: 'bear' },
    { date: '07-08', headline: '外資單週買超台股逾 800 億，連續第三週淨流入', impact: '大盤/金融股', dir: '偏多', cls: 'bull' },
    { date: '07-08', headline: '美中科技管制傳新一輪清單，設備供應鏈短線震盪', impact: '半導體設備', dir: '偏空', cls: 'bear' },
    { date: '07-07', headline: '航運運價指數高位整理，Q3 傳統旺季支撐貨櫃三雄', impact: '航運股', dir: '中性', cls: 'neutral' },
    { date: '07-07', headline: '台灣 6 月出口年增 18%，AI 伺服器與零組件為主要動能', impact: '大盤基本面', dir: '偏多', cls: 'bull' },
  ];
}

async function renderWeeklyNews() {
  const el = document.getElementById('weekly-news-body');
  if (!el) return;

  // 先抓真實新聞（Google News RSS 台股 近7日），失敗才用內建清單
  let news = await fetchNewsRSS('台股 股市', 7);
  let isLive = true;
  if (!news?.length) { news = getWeeklyNews(); isLive = false; }
  news = news.map(n => ({ impact: n.source || n.impact || '台股', ...n }));

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

  const lines = strong.map(s => `${s.name}(${s.id}) 評分:${s.analysis.score}｜${classifySignal(s.analysis)}單`).join('\n');
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

  // ── 紙上追蹤統計面板 ──
  const tracks = getLabTracks();
  const tracking = tracks.filter(t => !t.outcome).length;
  const closed = tracks.filter(t => t.outcome);
  const closedWins = closed.filter(t => t.outcome === 'win').length;
  const tagStats = computeLabTagStats();
  const proven = getProvenLabTags();
  const provenSet = new Set(proven.map(p => p.tag));
  const wrColor = wr => wr >= 60 ? 'var(--bull)' : wr >= 45 ? 'var(--yellow)' : 'var(--bear)';

  const trackHtml = `
    <div class="adv-section" style="margin-bottom:14px">
      <div class="adv-section-hdr">🧪 紙上追蹤驗證
        <span style="font-size:0.7rem;font-weight:400;color:var(--text3);margin-left:6px">每個機會自動追蹤至 -1R 止損 / +2R 止盈，累積各策略標籤實戰勝率</span>
      </div>
      <div class="adv-section-body">
        <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:${tagStats.length ? '12px' : '0'};font-size:0.8rem">
          <span>追蹤中 <strong style="color:var(--blue)">${tracking}</strong> 筆</span>
          <span>已結案 <strong>${closed.length}</strong> 筆</span>
          ${closed.length ? `<span>整體勝率 <strong style="color:${wrColor(closedWins / closed.length * 100)}">${(closedWins / closed.length * 100).toFixed(0)}%</strong></span>` : ''}
          <span>🎓 驗證策略 <strong style="color:${proven.length ? 'var(--bull)' : 'var(--text3)'}">${proven.length}</strong> 個</span>
        </div>
        ${proven.length ? `
          <div style="margin-bottom:12px;padding:10px 14px;background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.25);border-radius:8px;font-size:0.8rem">
            🎓 <strong style="color:var(--bull)">已晉升驗證策略</strong>（樣本 ≥${LAB_PROMOTE_MIN_N} 筆且勝率 ≥${LAB_PROMOTE_MIN_WR}%，出現同標籤機會將直接建立正式掛單）：
            ${proven.map(m => `<span style="display:inline-block;margin:3px 4px 0 0;padding:2px 9px;border-radius:10px;background:rgba(34,197,94,0.15);color:var(--bull);font-weight:700;font-size:0.74rem">${m.tag} ${m.wr.toFixed(0)}%（${m.n}筆）</span>`).join('')}
          </div>` : ''}
        ${tagStats.length ? `
          <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:0.76rem">
            <thead><tr style="color:var(--text3);font-size:0.68rem;text-align:left">
              <th style="padding:3px 6px">策略標籤</th><th style="padding:3px 6px;text-align:right">樣本</th>
              <th style="padding:3px 6px;text-align:right">勝率</th><th style="padding:3px 6px;text-align:right">累計R</th>
              <th style="padding:3px 6px;text-align:right">晉升進度</th>
            </tr></thead>
            <tbody>${tagStats.slice(0, 14).map(m => {
              const prog = Math.min(100, m.n / LAB_PROMOTE_MIN_N * 100);
              const isProven = provenSet.has(m.tag);
              return `<tr>
                <td style="padding:3px 6px">${isProven ? '🎓 ' : ''}${m.tag}</td>
                <td style="padding:3px 6px;text-align:right;color:var(--text3)">${m.n}</td>
                <td style="padding:3px 6px;text-align:right;font-weight:700;color:${wrColor(m.wr)}">${m.wr.toFixed(0)}%</td>
                <td style="padding:3px 6px;text-align:right;font-family:var(--mono);color:${m.cumR >= 0 ? 'var(--bull)' : 'var(--bear)'}">${m.cumR >= 0 ? '+' : ''}${m.cumR.toFixed(1)}R</td>
                <td style="padding:3px 6px;text-align:right">${isProven
                  ? '<span style="color:var(--bull);font-weight:700">已晉升</span>'
                  : `<span style="color:var(--text3)">${m.n}/${LAB_PROMOTE_MIN_N} 筆${m.wr >= LAB_PROMOTE_MIN_WR ? '' : `｜勝率差 ${(LAB_PROMOTE_MIN_WR - m.wr).toFixed(0)}%`}</span>
                     <span style="display:inline-block;width:44px;height:4px;border-radius:2px;background:var(--border);vertical-align:middle;margin-left:5px"><span style="display:block;width:${prog}%;height:100%;border-radius:2px;background:${m.wr >= LAB_PROMOTE_MIN_WR ? 'var(--bull)' : 'var(--blue)'}"></span></span>`}</td>
              </tr>`;
            }).join('')}</tbody>
          </table></div>` : '<p style="font-size:0.78rem;color:var(--text3)">尚無已結案的追蹤樣本 — 機會收錄後需數個交易日走到止損/止盈才會結案，統計將逐步累積。</p>'}
      </div>
    </div>`;

  el.innerHTML = `
    <div style="margin-bottom:14px;padding:12px 16px;background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.12);border-radius:10px;font-size:0.84rem;color:var(--text2)">
      本輪掃描共偵測到 <strong style="color:var(--blue)">${total}</strong> 個特殊型態機會，全部自動收錄紙上追蹤驗證。機會型態不等於進場訊號 — 請點入個股確認 AI 綜合分析與交易建議後再行動。
    </div>
    ${trackHtml}
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

// ── 機會實驗室紙上追蹤 + 驗證策略晉升 ─────────────────────────────────────
// 每輪掃描把偵測到的機會「紙上收錄」（不動用正式部位），追蹤後續走勢到
// 止損(-1R)/止盈(+2R) 自動結案，累積每個策略標籤的實戰勝率。
// 樣本 ≥100 筆且勝率 ≥80% 的標籤晉升為「驗證策略」→ 之後出現同標籤機會
// 直接建立正式掛單，免評分 / SQ 門檻（已用大量實戰數據證明有效）。

const LAB_TRACK_KEY = 'lab-tracks';
const LAB_PROMOTE_MIN_N = 100;  // 晉升門檻：至少 100 筆已結樣本
const LAB_PROMOTE_MIN_WR = 80;  // 晉升門檻：勝率 ≥ 80%

function getLabTracks() {
  try { return JSON.parse(localStorage.getItem(LAB_TRACK_KEY) || '[]'); } catch { return []; }
}

function saveLabTracks(tracks) {
  // 已結案例只保留最近 600 筆，避免 localStorage 無限膨脹
  const open = tracks.filter(t => !t.outcome);
  const closed = tracks.filter(t => t.outcome).slice(-600);
  localStorage.setItem(LAB_TRACK_KEY, JSON.stringify([...open, ...closed]));
}

// 從個股分析萃取「策略標籤」— 每個標籤是一個可獨立統計勝率的技術特徵
function computeLabTags(s, catKey) {
  const a = s.analysis;
  if (!a) return [];
  const tags = [];
  const catNames = { breakout: '🚀突破在即', oversold: '💎超賣反彈', momentum: '⚡動能加速', accumulate: '🏦主力吸貨', squeeze: '🌀波動壓縮' };
  if (catNames[catKey]) tags.push(catNames[catKey]);
  const volR = a.volMA ? a.lastVol / a.volMA : 1;
  if (a.ema20 > a.ema50 && a.price > a.ema20) tags.push('EMA多頭排列');
  if (a.ema200 && a.price > a.ema200) tags.push('站上EMA200');
  if (a.macd?.macd > a.macd?.signal && a.macd?.hist > 0) tags.push('MACD金叉');
  if (a.rsi != null && a.rsi >= 50 && a.rsi < 68) tags.push('RSI健康區');
  if (a.rsi != null && a.rsi < 32) tags.push('RSI超賣');
  if (a.adx >= 30) tags.push('ADX強趨勢');
  if (volR >= 1.3 && volR <= 3) tags.push('量能溫和放大');
  if (s.foreign != null && s.foreign > 1000) tags.push('外資大買');
  if ((outlookData.norm ?? 0) >= 15) tags.push('大盤偏多');
  if (a.score >= 80) tags.push('評分80+');
  if (s.ohlcv?.length >= 20 && a.price >= Math.max(...s.ohlcv.slice(-20).map(d => d.high)) * 0.99) tags.push('近20日高點');
  return tags;
}

// 掃描後：把本輪偵測到的機會收錄為紙上追蹤
function recordLabOpportunities() {
  const cats = detectLabOpportunities();
  const tracks = getLabTracks();
  const today = new Date().toISOString().slice(0, 10);
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  const stopAdj = parseFloat(localStorage.getItem('stop-adj') || '0.99');
  let added = 0;

  for (const c of cats) {
    for (const { s } of c.items.slice(0, 8)) {
      const a = s.analysis;
      if (!a || !s.ohlcv?.length) continue;
      // 同一檔 + 同型態：有未結追蹤、或 5 日內收錄過 → 不重複收錄
      if (tracks.some(t => t.id === s.id && t.cat === c.key && (!t.outcome || t.date >= fiveDaysAgo))) continue;

      const entry = a.price;
      const stop = +(Math.min(...s.ohlcv.slice(-5).map(d => d.low)) * stopAdj).toFixed(2);
      if (stop >= entry) continue;
      const r = entry - stop;
      tracks.push({
        uid: `${today}-${s.id}-${c.key}`,
        id: s.id, name: s.name, cat: c.key, date: today,
        entry, stop, tp: +(entry + r * 2).toFixed(2),
        tags: computeLabTags(s, c.key),
        outcome: null, // 'win' | 'loss' | null = 追蹤中
      });
      added++;
    }
  }
  if (added) saveLabTracks(tracks);
}

// 追蹤未結案例：後續 K 棒觸及止損 → 敗、觸及 2R 止盈 → 勝；15 個交易日到期以收盤價論
function updateLabTracks() {
  const tracks = getLabTracks();
  let changed = false;
  for (const t of tracks) {
    if (t.outcome) continue;
    const s = allStocks.find(x => x.id === t.id);
    if (!s?.ohlcv?.length) continue;
    const after = s.ohlcv.filter(b => b.time > t.date);
    for (const b of after) {
      // 同一根日 K 同時觸及止損與止盈 → 保守判敗（與正式交易規則一致）
      if (b.low <= t.stop) { t.outcome = 'loss'; t.retR = -1; t.closedAt = b.time; changed = true; break; }
      if (b.high >= t.tp)  { t.outcome = 'win';  t.retR = 2;  t.closedAt = b.time; changed = true; break; }
    }
    if (!t.outcome && after.length >= 15) {
      const r = t.entry - t.stop;
      t.retR = +((after[14].close - t.entry) / r).toFixed(2);
      t.outcome = t.retR > 0 ? 'win' : 'loss';
      t.closedAt = after[14].time;
      changed = true;
    }
  }
  if (changed) saveLabTracks(tracks);
}

// 各標籤實戰統計（只計已結案例）
function computeLabTagStats() {
  const closed = getLabTracks().filter(t => t.outcome);
  const map = {};
  for (const t of closed) {
    for (const tag of t.tags || []) {
      const m = map[tag] = map[tag] || { tag, n: 0, wins: 0, cumR: 0 };
      m.n++;
      if (t.outcome === 'win') m.wins++;
      m.cumR += t.retR ?? 0;
    }
  }
  return Object.values(map).map(m => ({ ...m, wr: m.n ? m.wins / m.n * 100 : 0 }))
    .sort((x, y) => y.n - x.n);
}

// 驗證策略清單：樣本 ≥100 且勝率 ≥80% 的標籤
function getProvenLabTags() {
  return computeLabTagStats().filter(m => m.n >= LAB_PROMOTE_MIN_N && m.wr >= LAB_PROMOTE_MIN_WR);
}

// 驗證策略晉升：本輪收錄的機會若帶驗證標籤 → 直接建立正式掛單（免評分/SQ門檻）
function generateProvenStrategyOrders() {
  if (!isSignalMaster()) return;
  const proven = getProvenLabTags();
  if (!proven.length) return;
  const provenSet = new Set(proven.map(p => p.tag));

  const positions = getPositions();
  const today = new Date().toISOString().slice(0, 10);
  const stopAdj = parseFloat(localStorage.getItem('stop-adj') || '0.99');
  const newOnes = [];

  for (const t of getLabTracks()) {
    if (t.outcome || t.date !== today) continue; // 只看本日新收錄且未結的機會
    const hitTags = (t.tags || []).filter(tag => provenSet.has(tag));
    if (!hitTags.length) continue;
    const s = allStocks.find(x => x.id === t.id);
    const a = s?.analysis;
    if (!a) continue;
    if (positions.find(p => p.id === t.id && (p.status === 'pending' || p.status === 'open'))) continue;
    if (positions.filter(p => p.status === 'pending' || p.status === 'open').length + newOnes.length >= 6) break;
    if (inCancelCooldown(t.id)) continue;

    let entry = a.ema20 && a.ema20 < a.price ? a.ema20 : a.price * 0.985;
    entry = +entry.toFixed(2);
    const stop = +(Math.min(...s.ohlcv.slice(-5).map(d => d.low)) * stopAdj).toFixed(2);
    if (stop >= entry) continue;
    const r = entry - stop;

    const volR = a.volMA ? a.lastVol / a.volMA : 1;
    const sqRes = computeSQ(s);
    const pos = {
      uid: Date.now() + '-' + t.id,
      id: t.id, name: t.name, dir: 'long', sigType: classifySignal(a),
      score: a.score, suggestedAt: today,
      entry, stopLoss: stop, baseStop: stop, tp1Hit: false,
      tp1: +(entry + r * 2).toFixed(2),
      tp2: +(entry + r * 3).toFixed(2),
      qty: 1000, status: 'pending', lastPrice: a.price,
      sqGrade: sqRes.grade, sqScore: sqRes.sq, sqGradeLabel: sqRes.gradeLabel, sqFactors: sqRes.factors,
      proven: true, provenTags: hitTags,
      ctx: {
        rsi: a.rsi != null ? +a.rsi.toFixed(1) : null,
        adx: a.adx != null ? +a.adx.toFixed(1) : null,
        volR: +volR.toFixed(2),
        mktNorm: Math.round(outlookData.norm ?? 0),
      },
    };
    positions.push(pos);
    newOnes.push(pos);
  }

  if (newOnes.length) {
    savePositions(positions);
    showToast(`🎓 驗證策略晉升：新增 ${newOnes.length} 筆正式掛單（實戰勝率 ≥${LAB_PROMOTE_MIN_WR}% 標籤）`, 'success');
    if (tgWants('sig')) {
      const lines = newOnes.map(p => {
        const stats = p.provenTags.map(tag => {
          const m = proven.find(x => x.tag === tag);
          return `${tag}（${m.n} 筆勝率 ${m.wr.toFixed(0)}%）`;
        }).join('、');
        return `${p.name}(${p.id}) 評分${p.score}\n🎓 驗證標籤：${stats}\n回踩進場 ${p.entry}｜止損 ${p.stopLoss}（-${((p.entry - p.stopLoss) / p.entry * 100).toFixed(1)}%）\n目標一 ${p.tp1}(2R 觸及後止損移至成本) / 最終 ${p.tp2}(3R)`;
      }).join('\n\n');
      tgPush(`🎓 台股雷達 驗證策略晉升建單\n${today}\n\n以下訊號的策略標籤已通過 ≥${LAB_PROMOTE_MIN_N} 筆紙上實戰、勝率 ≥${LAB_PROMOTE_MIN_WR}% 驗證，直接建立正式掛單：\n\n${lines}\n\n⚠ 僅供參考，非投資建議`);
    }
  }
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

// 將現行 AI 規則逐棒套用到單檔歷史（回踩掛單 → 成交 → 2R停利/止損）
function backtestStock(s) {
  const bars = s.ohlcv;
  if (!bars || bars.length < 80) return [];
  const threshold = getThreshold('bull') + 10;
  const lf = getLearnedFilters();
  const stopAdj = parseFloat(localStorage.getItem('stop-adj') || '0.99');
  const trades = [];
  let pos = null, pend = null;

  for (let i = 60; i < bars.length; i++) {
    const b = bars[i];

    if (pos) {
      // 與實盤一致：TP1 觸及 → 止損移至成本（保本）→ TP2 全出或保本出場
      if (!pos.tp1Hit && b.high >= pos.tp1) {
        pos.tp1Hit = true;
        pos.stop = pos.entry;
        continue; // 同棒不再檢查止損（日線無法判斷先後，保守處理）
      }
      if (pos.tp1Hit) {
        if (b.high >= pos.tp2) {
          trades.push({ id: s.id, name: s.name, entry: pos.entry, exit: pos.tp2, entryDate: pos.entryDate, exitDate: b.time, win: true, retPct: (pos.tp2 - pos.entry) / pos.entry * 100, holdDays: i - pos.entryIdx });
          pos = null;
        } else if (b.low <= pos.stop) {
          trades.push({ id: s.id, name: s.name, entry: pos.entry, exit: pos.entry, entryDate: pos.entryDate, exitDate: b.time, win: false, be: true, retPct: 0, holdDays: i - pos.entryIdx });
          pos = null;
        }
      } else if (b.low <= pos.stop) {
        trades.push({ id: s.id, name: s.name, entry: pos.entry, exit: pos.stop, entryDate: pos.entryDate, exitDate: b.time, win: false, retPct: (pos.stop - pos.entry) / pos.entry * 100, holdDays: i - pos.entryIdx });
        pos = null;
      }
      continue;
    }

    if (pend) {
      pend.age++;
      // 與實盤一致：進場前跌破止損或飛越止盈一 → 掛單取消
      if (b.close <= pend.stop || b.close >= pend.tp1) { pend = null; continue; }
      if (b.low <= pend.entry) {
        pos = { ...pend, tp1Hit: false, entryDate: b.time, entryIdx: i };
        pend = null;
      } else if (pend.age >= 7) pend = null;
      continue;
    }

    // 產生訊號（與 generatePendingSuggestions 相同的 5 重過濾）
    const window = bars.slice(0, i + 1);
    const a = calculateScore(window);
    if (a.score < threshold) continue;
    const volR = a.volMA ? a.lastVol / a.volMA : 1;
    if (a.rsi != null && a.rsi > lf.rsiCap) continue;
    if (a.adx != null && a.adx < lf.adxMin) continue;
    if (!(a.ema50 && a.price > a.ema50)) continue;
    if (volR > 3.5) continue;
    if (a.boll && a.price > a.boll.upper * 1.02) continue;

    let entry = a.ema20 && a.ema20 < a.price ? a.ema20 : a.price * 0.985;
    entry = +entry.toFixed(2);
    const stop = +(Math.min(...window.slice(-5).map(d => d.low)) * stopAdj).toFixed(2);
    if (stop >= entry) continue;
    if ((entry - stop) / entry * 100 > lf.maxRiskPct) continue;
    // SQ 品質門檻（與實盤一致：A 級以上才建單）
    const sqBt = computeSQ({ analysis: a, ohlcv: window, foreign: s.foreign });
    if (sqBt.sq < 6) continue;

    pend = {
      entry, stop,
      tp1: +(entry + (entry - stop) * 2).toFixed(2),
      tp2: +(entry + (entry - stop) * 3).toFixed(2),
      age: 0,
    };
  }
  return trades;
}

async function runBacktest() {
  const btn = document.getElementById('bt-run-btn');
  const prog = document.getElementById('bt-progress');
  const el = document.getElementById('backtest-body');
  const valid = allStocks.filter(s => s.ohlcv?.length >= 80);
  if (!valid.length) { showToast('請先等掃描完成再執行回測', 'error'); return; }

  btn.disabled = true;
  const all = [];
  for (let i = 0; i < valid.length; i++) {
    prog.textContent = `回測中 ${i + 1}/${valid.length}：${valid[i].name}...`;
    all.push(...backtestStock(valid[i]));
    await delay(0); // 讓出主執行緒，避免卡 UI
  }
  btn.disabled = false;
  prog.textContent = '';

  if (!all.length) {
    el.innerHTML = '<p style="font-size:0.84rem;color:var(--text3)">近 6 個月無符合 5 重過濾的進場訊號 — 過濾條件嚴格是正常的，代表系統只挑高品質機會。</p>';
    return;
  }

  // 統計
  all.sort((a, b) => a.exitDate.localeCompare(b.exitDate));
  const wins = all.filter(t => t.win);
  const winRate = wins.length / all.length * 100;
  const grossWin = all.filter(t => t.retPct > 0).reduce((s, t) => s + t.retPct, 0);
  const grossLoss = Math.abs(all.filter(t => t.retPct < 0).reduce((s, t) => s + t.retPct, 0));
  const pf = grossLoss ? grossWin / grossLoss : Infinity;
  const avgHold = all.reduce((s, t) => s + t.holdDays, 0) / all.length;

  // 權益曲線 + 最大回撤（以每筆報酬率累加）
  let equity = 0, peak = 0, maxDD = 0;
  const curve = all.map(t => {
    equity += t.retPct;
    peak = Math.max(peak, equity);
    maxDD = Math.max(maxDD, peak - equity);
    return equity;
  });

  // SVG 權益曲線
  const W = 600, H = 120;
  const minE = Math.min(0, ...curve), maxE = Math.max(1, ...curve);
  const pts = curve.map((v, i) => `${(i / Math.max(curve.length - 1, 1) * W).toFixed(1)},${(H - (v - minE) / (maxE - minE || 1) * H).toFixed(1)}`).join(' ');
  const zeroY = H - (0 - minE) / (maxE - minE || 1) * H;
  const lastPos = equity >= 0;

  // 個股績效排行
  const byStock = {};
  all.forEach(t => {
    byStock[t.id] = byStock[t.id] || { id: t.id, name: t.name, n: 0, ret: 0, wins: 0 };
    byStock[t.id].n++; byStock[t.id].ret += t.retPct; if (t.win) byStock[t.id].wins++;
  });
  const ranked = Object.values(byStock).sort((a, b) => b.ret - a.ret);
  const top3 = ranked.slice(0, 3), bot3 = ranked.slice(-3).reverse();

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px" class="bt-stat-grid">
      ${[
        { l: '總交易數', v: all.length, c: 'var(--text1)' },
        { l: '勝率', v: winRate.toFixed(0) + '%', c: winRate >= 50 ? 'var(--bull)' : 'var(--bear)' },
        { l: '獲利因子', v: pf === Infinity ? '∞' : pf.toFixed(2), c: pf >= 1.5 ? 'var(--bull)' : pf >= 1 ? 'var(--yellow)' : 'var(--bear)' },
        { l: '累計報酬', v: (equity >= 0 ? '+' : '') + equity.toFixed(1) + '%', c: equity >= 0 ? 'var(--bull)' : 'var(--bear)' },
        { l: '最大回撤', v: '-' + maxDD.toFixed(1) + '%', c: maxDD <= 10 ? 'var(--bull)' : maxDD <= 20 ? 'var(--yellow)' : 'var(--bear)' },
      ].map(x => `<div class="mkt-item"><div class="mkt-lbl">${x.l}</div><div class="mkt-val" style="color:${x.c}">${x.v}</div></div>`).join('')}
    </div>
    <div class="fund-block" style="margin-bottom:14px">
      <div class="fund-block-ttl">權益曲線（每筆報酬率累加，平均持有 ${avgHold.toFixed(1)} 天）</div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:120px;display:block">
        <line x1="0" y1="${zeroY}" x2="${W}" y2="${zeroY}" stroke="rgba(148,163,184,0.25)" stroke-dasharray="4 4"/>
        <polyline points="${pts}" fill="none" stroke="${lastPos ? 'var(--bull)' : 'var(--bear)'}" stroke-width="2"/>
      </svg>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="focus-2col">
      <div class="fund-block">
        <div class="fund-block-ttl" style="color:var(--bull)">🏆 策略最有效的股票</div>
        ${top3.map(r => `<div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:4px 0"><span style="cursor:pointer" onclick="openStock('${r.id}')">${r.name}(${r.id}) · ${r.n}筆</span><span style="font-family:var(--mono);color:var(--bull)">+${r.ret.toFixed(1)}%</span></div>`).join('')}
      </div>
      <div class="fund-block">
        <div class="fund-block-ttl" style="color:var(--bear)">⚠ 策略最無效的股票</div>
        ${bot3.map(r => `<div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:4px 0"><span style="cursor:pointer" onclick="openStock('${r.id}')">${r.name}(${r.id}) · ${r.n}筆</span><span style="font-family:var(--mono);color:${r.ret >= 0 ? 'var(--bull)' : 'var(--bear)'}">${r.ret >= 0 ? '+' : ''}${r.ret.toFixed(1)}%</span></div>`).join('')}
      </div>
    </div>
    <p style="font-size:0.75rem;color:var(--text3);margin-top:12px">
      ⓘ 回測使用目前生效的學習參數（RSI≤${getLearnedFilters().rsiCap}、ADX≥${getLearnedFilters().adxMin}、風險≤${getLearnedFilters().maxRiskPct}%）。
      「策略最無效」名單中的股票可考慮從股票池移除，或等待學習系統進一步收緊條件。歷史績效不代表未來報酬。
    </p>`;
  showToast(`回測完成：${all.length} 筆，勝率 ${winRate.toFixed(0)}%，最大回撤 ${maxDD.toFixed(1)}%`, 'success');
}

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
