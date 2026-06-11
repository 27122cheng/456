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
  startRefreshCycle();
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

  for (let i = 0; i < allStocks.length; i++) {
    const s = allStocks[i];
    setScanProgress((i / allStocks.length) * 100, `分析 ${s.name} (${s.id})...`);

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

    // Render incrementally every 5 stocks
    if ((i + 1) % 5 === 0 || i === allStocks.length - 1) {
      renderDashboard();
      if (currentPage === 'ranking') renderRanking();
    }

    await delay(300); // rate limit
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
  if (currentPage === 'positions') renderPositions();

  // Auto Telegram notification for strong signals
  autoNotifyTelegram();
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
  if (stopOuts.length >= 2) {
    const stopStocks = [...new Set(stopOuts.map(t => t.id))];
    insights.push({ icon: '🧠', txt: `止損出場 ${stopOuts.length} 次（${stopStocks.join('、')}）→ 檢查這些是否都在<strong>大盤偏空時逆勢做多</strong>，市場多空總覽偏空時應降低部位。` });
  }
  if (winRate >= 0.55 && parseFloat(avgWinPct) > Math.abs(avgLossPct) * 1.5) {
    insights.push({ icon: '🏆', txt: `系統表現優異（勝率 ${(winRate*100).toFixed(0)}%、盈虧比 ${(avgWinPct/Math.abs(avgLossPct||1)).toFixed(1)}）→ 可考慮小幅放大部位。` });
  }

  el.innerHTML = `
    ${insights.map(i => `<div class="learn-item"><span class="learn-icon">${i.icon}</span><span>${i.txt}</span></div>`).join('')}
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:0.75rem;color:var(--text3)">
      目前自動止損參數：5日低點 × ${stopAdj}（個股「交易建議」的止損價已套用此規則）
    </div>`;
}

// ── AI 自動交易系統（待進場 → 回踩成交 → 持倉 → 自動止損/停利） ─────────────

function getPositions() {
  try { return JSON.parse(localStorage.getItem('positions') || '[]'); } catch { return []; }
}
function savePositions(p) { localStorage.setItem('positions', JSON.stringify(p)); }

// AI 訊號 → 建立待進場單（進場價 = 回踩 EMA20）
function generatePendingSuggestions() {
  const positions = getPositions();
  const today = new Date().toISOString().slice(0, 10);
  const threshold = getThreshold('bull') + 10;
  const stopAdj = parseFloat(localStorage.getItem('stop-adj') || '0.99');
  const newOnes = [];

  for (const s of allStocks) {
    const a = s.analysis;
    if (!a || a.score < threshold) continue;
    // 已有同檔 pending / open 就跳過
    if (positions.find(p => p.id === s.id && (p.status === 'pending' || p.status === 'open'))) continue;

    const lows = s.ohlcv.map(d => d.low);
    // 回踩進場價：EMA20（若 EMA20 已高於現價則用現價 -1.5%）
    let entry = a.ema20 && a.ema20 < a.price ? a.ema20 : a.price * 0.985;
    entry = +entry.toFixed(2);
    const stop = +(Math.min(...lows.slice(-5)) * stopAdj).toFixed(2);
    if (stop >= entry) continue;
    const r = entry - stop;
    const pos = {
      uid: Date.now() + '-' + s.id,
      id: s.id, name: s.name, dir: 'long',
      score: a.score, suggestedAt: today,
      entry, stopLoss: stop,
      tp1: +(entry + r * 2).toFixed(2),
      tp2: +(entry + r * 3).toFixed(2),
      qty: 1000, status: 'pending', lastPrice: a.price,
    };
    positions.push(pos);
    newOnes.push(pos);
  }

  if (newOnes.length) {
    savePositions(positions);
    showToast(`AI 新增 ${newOnes.length} 筆待進場建議`, 'info');
    // Telegram 推送
    const enabled = localStorage.getItem('tg-enabled') === 'true';
    const token = localStorage.getItem('tg-token');
    const chatId = localStorage.getItem('tg-chatid');
    if (enabled && token && chatId) {
      const lines = newOnes.map(p => `${p.name}(${p.id}) 評分${p.score}\n回踩進場 ${p.entry}｜止損 ${p.stopLoss}｜目標 ${p.tp1}/${p.tp2}`).join('\n\n');
      sendTelegram(token, chatId, `📡 台股雷達 AI 交易建議（待回踩進場）\n\n${lines}`);
    }
  }
}

// 每次掃描後：檢查回踩成交、止損、停利
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
      // 7 天未成交 → 過期
      if ((now - new Date(p.suggestedAt)) / 86400000 > 7) {
        p.status = 'expired'; changed = true; continue;
      }
      // 回踩成交：建議日之後任一根 K 棒低點觸及進場價
      const fill = bars.find(b => b.time > p.suggestedAt && b.low <= p.entry);
      if (fill) { p.status = 'open'; p.entryDate = fill.time; changed = true; }
    } else if (p.status === 'open') {
      const after = bars.filter(b => b.time > p.entryDate);
      for (const b of after) {
        if (b.low <= p.stopLoss) { settlePosition(p, p.stopLoss, b.time, '跌破止損'); changed = true; break; }
        if (b.high >= p.tp1)     { settlePosition(p, p.tp1, b.time, '達標停利');  changed = true; break; }
      }
    }
  }

  savePositions(positions.filter(p => p.status === 'pending' || p.status === 'open'));
  if (changed && currentPage === 'positions') renderPositions();
}

// 平倉結算 → 寫入交易日誌（含止損原因 + 風控扣分）
function settlePosition(p, exitPrice, exitDate, reason) {
  p.status = 'closed';
  const pnl = Math.round((exitPrice - p.entry) * p.qty);
  const retPct = +((exitPrice - p.entry) / p.entry * 100).toFixed(2);

  // 風控扣分規則
  let penalty = 0;
  const penaltyNotes = [];
  if (reason === '跌破止損') {
    penalty -= 5; penaltyNotes.push('止損出場 -5');
    if (retPct < -8) { penalty -= 5; penaltyNotes.push('單筆大虧>8% -5'); }
    if ((outlookData.norm ?? 0) <= -15) { penalty -= 5; penaltyNotes.push('大盤偏空逆勢做多 -5'); }
  }

  const trades = getTrades();
  trades.push({
    id: p.id, name: p.name, dir: p.dir,
    entry: p.entry, exit: exitPrice, qty: p.qty,
    date: exitDate, note: reason + (penaltyNotes.length ? `（${penaltyNotes.join('、')}）` : ''),
    pnl, retPct, penalty,
  });
  saveTrades(trades);
  showToast(`${p.name}(${p.id}) ${reason}：${pnl > 0 ? '+' : ''}${pnl.toLocaleString()} 元`, pnl >= 0 ? 'success' : 'error');
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
      <td onclick="openStock('${p.id}')" style="cursor:pointer"><span class="stock-cell-id">${p.id}</span> <span style="font-size:0.72rem;color:var(--text3)">${p.name}</span></td>
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
      <td onclick="openStock('${p.id}')" style="cursor:pointer"><span class="stock-cell-id">${p.id}</span> <span style="font-size:0.72rem;color:var(--text3)">${p.name}</span></td>
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
  ['inst-body','setup-body','mtf-body'].forEach(id => {
    document.getElementById(id).innerHTML = '<div class="adv-loading">載入中...</div>';
  });

  // Load TV chart
  initTVChart(stockId);

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
    return;
  }

  renderStockDetail(s);

  // Async: institutional + MTF
  fetchInstitutional(stockId).then(inst => renderInstitutional(inst));
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
          <div class="setup-note">近5日低點 -1%</div>
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

// ── TradingView Chart ─────────────────────────────────────────────────────

function initTVChart(stockId, interval = 'D') {
  const container = document.getElementById('tv-chart-container');
  container.innerHTML = '';
  if (typeof TradingView === 'undefined') {
    // Fallback: use embed script approach
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: `TWSE:${stockId}`, interval, theme: 'dark', style: '1',
      locale: 'zh_TW', width: '100%', height: '450',
      hide_side_toolbar: true, save_image: false,
    });
    container.appendChild(script);
    return;
  }
  tvChart = new TradingView.widget({
    container_id: 'tv-chart-container',
    symbol: `TWSE:${stockId}`,
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
  const sec = parseInt(localStorage.getItem('refresh-interval') || '60');
  if (sec === 0) return;
  refreshSec = sec;
  let remaining = refreshSec;
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    remaining--;
    document.getElementById('refresh-countdown').textContent = remaining + '秒';
    if (remaining <= 0) {
      remaining = refreshSec;
      if (!scanning) startScan();
    }
  }, 1000);
}

// ── Settings ────────────────────────────────────────────────────────────────

function loadSettings() {
  const tf = localStorage.getItem('timeframe') || '1d';
  currentTF = tf;
  const refreshVal = localStorage.getItem('refresh-interval') || '60';
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

  showToast('設定已儲存', 'success');
  startRefreshCycle();
}

function resetAllSettings() {
  ['timeframe','refresh-interval','bull-threshold','bear-threshold','tg-token','tg-chatid','tg-enabled']
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

// ── Telegram Notification ──────────────────────────────────────────────────

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
  const enabled = localStorage.getItem('tg-enabled') === 'true';
  const token   = localStorage.getItem('tg-token');
  const chatId  = localStorage.getItem('tg-chatid');
  if (!enabled || !token || !chatId) return;

  const bullThresh = getThreshold('bull') + 15;
  const strong = allStocks.filter(s => s.analysis?.score >= bullThresh);
  if (!strong.length) return;

  const lines = strong.map(s => `${s.name}(${s.id}) 評分:${s.analysis.score}`).join('\n');
  const msg = `📡 台股雷達 強勢多頭訊號\n${new Date().toLocaleString('zh-TW')}\n\n${lines}`;
  sendTelegram(token, chatId, msg);
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
