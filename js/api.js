// ── API — Taiwan Stocks via allorigins + Yahoo Finance + TWSE ─────────────

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok ? res : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// Multi-proxy fallback with adaptive ordering:
// 第一優先 = 自家 Vercel Serverless 代理（/api/proxy，穩定無限流）；
// 第三方免費 proxy 只作為備援。上次成功的 proxy 記在 localStorage 優先使用。
const PROXIES = [
  { name: 'self',      wrap: e => `/api/proxy?url=${e}`,                      json: r => r.json(), text: r => r.text() },
  { name: 'ao-raw',    wrap: e => `https://api.allorigins.win/raw?url=${e}`,  json: r => r.json(), text: r => r.text() },
  { name: 'corsproxy', wrap: e => `https://corsproxy.io/?url=${e}`,           json: r => r.json(), text: r => r.text() },
  { name: 'codetabs',  wrap: e => `https://api.codetabs.com/v1/proxy?quest=${e}`, json: r => r.json(), text: r => r.text() },
  { name: 'ao-get',    wrap: e => `https://api.allorigins.win/get?url=${e}`,
    json: async r => { const j = await r.json(); return j?.contents ? JSON.parse(j.contents) : null; },
    text: async r => (await r.json())?.contents ?? null },
];

// 熔斷器：連續失敗 3 次的 proxy（被限流/掛掉）冷卻 90 秒，
// 避免之後每個請求都先白等它逾時，也讓負載自動轉移到其他家
const _proxyFail = {};
function _proxyUsable(p) {
  const f = _proxyFail[p.name];
  return !f || f.n < 3 || Date.now() > f.until;
}
function _proxyMark(p, ok) {
  if (ok) { delete _proxyFail[p.name]; return; }
  const f = _proxyFail[p.name] || { n: 0, until: 0 };
  f.n++;
  if (f.n >= 3) { f.until = Date.now() + 90 * 1000; }
  _proxyFail[p.name] = f;
}

function proxyOrder() {
  const usable = PROXIES.filter(_proxyUsable);
  const arr = usable.length ? [...usable] : [...PROXIES]; // 全部熔斷時仍然全試
  // 自家代理永遠最優先（熔斷時自動退位，例如本機 file:// 開發沒有 /api）
  const selfIdx = arr.findIndex(p => p.name === 'self');
  if (selfIdx > 0) arr.unshift(arr.splice(selfIdx, 1)[0]);
  // 其餘按上次成功者排序
  const pref = localStorage.getItem('proxy-pref');
  const idx = arr.findIndex(p => p.name === pref);
  if (idx > 0 && arr[idx].name !== 'self' && arr[0].name === 'self') {
    const [p] = arr.splice(idx, 1); arr.splice(1, 0, p);
  } else if (idx > 0 && arr[0].name !== 'self') {
    arr.unshift(arr.splice(idx, 1)[0]);
  }
  return arr;
}

async function proxyFetch(url, timeout = 8000) {
  const enc = encodeURIComponent(url);
  for (const p of proxyOrder()) {
    const res = await fetchWithTimeout(p.wrap(enc), timeout);
    if (!res) { _proxyMark(p, false); continue; }
    try {
      const data = await p.json(res);
      if (data) { _proxyMark(p, true); localStorage.setItem('proxy-pref', p.name); return data; }
    } catch {}
    _proxyMark(p, false);
  }
  return null;
}

// 取回純文字（RSS / XML 用）
async function proxyFetchText(url, timeout = 8000) {
  const enc = encodeURIComponent(url);
  for (const p of proxyOrder()) {
    const res = await fetchWithTimeout(p.wrap(enc), timeout);
    if (!res) { _proxyMark(p, false); continue; }
    try {
      const txt = await p.text(res);
      if (txt && txt.length > 50) { _proxyMark(p, true); localStorage.setItem('proxy-pref', p.name); return txt; }
    } catch {}
    _proxyMark(p, false);
  }
  return null;
}

// ── localStorage 快取（大幅減少重複請求）───────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 行情快取 5 分鐘

function cacheGet(key, ttl = CACHE_TTL) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > ttl) return null;
    return data;
  } catch { return null; }
}

// 陳舊備援：正常 TTL 已過期，但資料還在 24 小時內 → 拿舊資料頂著（總比整頁空白好）
function cacheGetStale(key, maxAge = 24 * 60 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > maxAge) return null;
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
  } catch {
    // 空間滿了 → 清掉舊行情快取再試一次
    try {
      Object.keys(localStorage).filter(k => k.startsWith('cache:')).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }));
    } catch {}
  }
}

// ── Yahoo Finance ─────────────────────────────────────────────────────────

function tsToDate(ts) {
  const d = new Date(ts * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

async function fetchYahooOHLCV(symbol, interval = '1d', range = '6mo') {
  const key = `cache:ohlcv:${symbol}:${interval}:${range}`;
  // 日線盤中只有最後一根 K 會變，10 分鐘快取即可 — 大幅減少 proxy 請求量（避免被限流）
  const cached = cacheGet(key, interval === '1d' || interval === '1wk' ? 10 * 60 * 1000 : CACHE_TTL);
  if (cached) return cached;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const data = await proxyFetch(url);
  const result = data?.chart?.result?.[0];
  if (!result) return cacheGetStale(key, 72 * 60 * 60 * 1000) || []; // 全 proxy 失敗 → 72h 內舊資料頂著（官方源會補最新一根）
  const { timestamp, indicators } = result;
  const q = indicators.quote[0];
  const ohlcv = timestamp.map((ts, i) => ({
    time: tsToDate(ts),
    open:   q.open[i]   ? +q.open[i].toFixed(2)   : null,
    high:   q.high[i]   ? +q.high[i].toFixed(2)   : null,
    low:    q.low[i]    ? +q.low[i].toFixed(2)     : null,
    close:  q.close[i]  ? +q.close[i].toFixed(2)   : null,
    volume: q.volume[i] || 0,
  })).filter(d => d.open && d.close);
  if (ohlcv.length) cacheSet(key, ohlcv);
  return ohlcv;
}

// ── TWSE / TPEx 官方全市場當日行情 ─────────────────────────────────────────
// 官方 Open API 支援 CORS（不需要 proxy！），一個請求涵蓋整個市場的當日 OHLCV。
// 這是最可靠的價格來源 — Yahoo/proxy 全掛時，價格顯示仍然正常。

let _dayAllPromise = null;

async function fetchTWDayAll() {
  if (_dayAllPromise) return _dayAllPromise; // in-flight 去重：掃描 worker 並行時只抓一次
  _dayAllPromise = (async () => {
    const key = 'cache:dayall';
    const cached = cacheGet(key, 10 * 60 * 1000);
    if (cached) return cached;

    const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
    const map = {};

    // 直接抓（有 CORS）→ 失敗才退回 proxy
    const getJSON = async url => {
      const res = await fetchWithTimeout(url, 10000);
      if (res) { try { return await res.json(); } catch {} }
      return proxyFetch(url, 10000);
    };

    // 上市（TWSE）
    try {
      const rows = await getJSON('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL');
      for (const r of rows || []) {
        const close = num(r.ClosingPrice);
        if (!r.Code || close == null) continue;
        map[r.Code] = {
          open: num(r.OpeningPrice) ?? close, high: num(r.HighestPrice) ?? close,
          low: num(r.LowestPrice) ?? close, close,
          volume: num(r.TradeVolume) ?? 0, chg: num(r.Change),
        };
      }
    } catch {}

    // 上櫃（TPEx）
    try {
      const rows = await getJSON('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes');
      for (const r of rows || []) {
        const close = num(r.Close);
        if (!r.SecuritiesCompanyCode || close == null) continue;
        map[r.SecuritiesCompanyCode] = {
          open: num(r.Open) ?? close, high: num(r.High) ?? close,
          low: num(r.Low) ?? close, close,
          volume: num(r.TradingShares) ?? 0, chg: num(r.Change),
        };
      }
    } catch {}

    if (Object.keys(map).length) { cacheSet(key, map); return map; }
    return cacheGetStale(key, 72 * 60 * 60 * 1000); // 全失敗 → 舊資料頂著
  })();
  const result = await _dayAllPromise;
  if (!result) _dayAllPromise = null; // 失敗不要黏住，下次重試
  return result;
}

// 台北時間（使用者可能在其他時區開網頁）
function twNow() {
  try { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })); }
  catch { return new Date(); }
}

// 把官方當日行情合併進 Yahoo 歷史：更新今日 bar 或補上缺的今日 bar
// → 就算 Yahoo 快取是 10 分鐘前甚至昨天的，最後一根 K 棒仍是最新官方數據
function mergeOfficialBar(ohlcv, q) {
  if (!q?.close || !ohlcv?.length) return ohlcv;
  const tw = twNow();
  const dow = tw.getDay();
  if (dow === 0 || dow === 6 || tw.getHours() < 9) return ohlcv; // 週末/開盤前不合併
  const todayStr = `${tw.getFullYear()}-${String(tw.getMonth()+1).padStart(2,'0')}-${String(tw.getDate()).padStart(2,'0')}`;
  const last = ohlcv[ohlcv.length - 1];
  if (last.time === todayStr) {
    Object.assign(last, { open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume });
  } else if (last.time < todayStr && !(q.close === last.close && q.volume === last.volume)) {
    // close+volume 與前一根完全相同 = 官方資料還是昨天的（今日休市），不要重複補
    ohlcv.push({ time: todayStr, open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume });
  }
  return ohlcv;
}

// Taiwan stock — append ".TW" (TWSE listed) or ".TWO" (TPEx/OTC)
function yahooSymbol(stockId) {
  return `${stockId}.TW`;
}

async function fetchStockOHLCV(stockId, interval = '1d', range = '6mo') {
  // 記住哪些股票是上櫃（.TWO），下次直接抓對的，不用先等 .TW 失敗
  const suffixKey = `sym-suffix:${stockId}`;
  const knownSuffix = localStorage.getItem(suffixKey);
  let ohlcv = [];
  if (knownSuffix === 'TWO') {
    ohlcv = await fetchYahooOHLCV(`${stockId}.TWO`, interval, range);
  }
  if (!ohlcv.length) {
    ohlcv = await fetchYahooOHLCV(yahooSymbol(stockId), interval, range);
    if (!ohlcv.length) {
      const two = await fetchYahooOHLCV(`${stockId}.TWO`, interval, range);
      if (two.length) localStorage.setItem(suffixKey, 'TWO');
      ohlcv = two;
    }
  }
  // 日線：用官方當日行情刷新最後一根 K 棒（官方源不走 proxy，最可靠）
  if (interval === '1d' && ohlcv.length) {
    try {
      const dayAll = await fetchTWDayAll();
      mergeOfficialBar(ohlcv, dayAll?.[stockId]);
    } catch {}
  }
  return ohlcv;
}

// Fetch TWII (加權指數) for market overview
async function fetchTWII() {
  return fetchYahooOHLCV('^TWII', '1d', '5d');
}

// Fetch a single index quote: latest price + 1d / 5d change %
async function fetchIndexQuote(sym) {
  const data = await fetchYahooOHLCV(sym, '1d', '1mo');
  if (data.length < 2) return null;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const w    = data.length >= 6 ? data[data.length - 6] : data[0];
  return {
    price: last.close,
    chg1: (last.close - prev.close) / prev.close * 100,
    chg5: (last.close - w.close) / w.close * 100,
  };
}

// ── TWSE Institutional T86（全表快取：每日只抓一次）─────────────────────────

function parseK(s) {
  return Math.round((parseInt(String(s).replace(/,/g, ''), 10) || 0) / 1000);
}

let _t86Memo = null; // in-memory：同一個頁面生命週期共用

async function fetchT86All() {
  if (_t86Memo) return _t86Memo;
  // 週末只是最常見情況 — 國定假日、颱風假 TWSE 也沒資料，往回最多找 6 天抓最近交易日
  const base = new Date();
  for (let back = 0; back <= 6; back++) {
    const d = new Date(base);
    d.setDate(d.getDate() - back);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const key = `cache:t86:${ymd}`;
    const cached = cacheGet(key, 60 * 60 * 1000); // T86 每日更新一次，快取 1 小時
    if (cached) { _t86Memo = cached; localStorage.setItem('t86-last-date', iso); return cached; }
    try {
      const url = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${ymd}&selectType=ALL&response=json`;
      const data = await proxyFetch(url, 12000);
      if (data?.data?.length) {
        _t86Memo = data.data;
        cacheSet(key, data.data);
        localStorage.setItem('t86-last-date', iso);
        return data.data;
      }
    } catch {}
  }
  return null;
}

// 單檔法人：直接查快取的全表，不再重複下載整份 T86
async function fetchInstitutional(stockId) {
  const table = await fetchT86All();
  if (!table) return null;
  const row = table.find(r => r[0]?.trim() === stockId);
  if (!row) return null;
  return {
    foreign:    parseK(row[4]),
    investment: parseK(row[7]),
    dealer:     parseK(row[10]),
    total:      parseK(row[11]),
  };
}

// ── TWSE / TPEx 官方估值資料（本益比 / 殖利率 / 股價淨值比）─────────────────
// Yahoo v7/v10 報價 API 已改為需要 crumb 憑證（匿名請求一律 401，走任何 proxy 都一樣），
// 改用證交所 BWIBBU_ALL + 櫃買中心 peratio_analysis：全市場一次抓、官方數據、支援 CORS。

let _fundAllPromise = null;

async function fetchTWFundAll() {
  if (_fundAllPromise) return _fundAllPromise;
  _fundAllPromise = (async () => {
    const key = 'cache:fundall';
    const cached = cacheGet(key, 60 * 60 * 1000); // 每日更新一次，快取 1 小時
    if (cached) return cached;

    const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
    const getJSON = async url => {
      const res = await fetchWithTimeout(url, 10000);
      if (res) { try { return await res.json(); } catch {} }
      return proxyFetch(url, 10000);
    };
    const map = {};

    // 上市（TWSE BWIBBU_ALL：Code / PEratio / DividendYield(%) / PBratio）
    try {
      const rows = await getJSON('https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL');
      for (const r of rows || []) {
        if (!r.Code) continue;
        const dy = num(r.DividendYield);
        map[r.Code] = { pe: num(r.PEratio), pb: num(r.PBratio), divYield: dy != null ? dy / 100 : null };
      }
    } catch {}

    // 上櫃（TPEx peratio_analysis：SecuritiesCompanyCode / PriceEarningRatio / YieldRatio(%) / PriceBookRatio）
    try {
      const rows = await getJSON('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis');
      for (const r of rows || []) {
        const id = r.SecuritiesCompanyCode;
        if (!id) continue;
        const dy = num(r.YieldRatio);
        map[id] = { pe: num(r.PriceEarningRatio), pb: num(r.PriceBookRatio), divYield: dy != null ? dy / 100 : null };
      }
    } catch {}

    if (Object.keys(map).length) { cacheSet(key, map); return map; }
    return cacheGetStale(key, 72 * 60 * 60 * 1000);
  })();
  const result = await _fundAllPromise;
  if (!result) _fundAllPromise = null; // 失敗不要黏住，下次重試
  return result;
}

async function fetchTWFundamentals(stockId) {
  const all = await fetchTWFundAll();
  return all?.[stockId] || null;
}

// ── Multi-timeframe snapshot（三時框並行抓取）─────────────────────────────

async function fetchMTFSignals(stockId) {
  const intervals = [
    { label: '60分', tf: '60m', range: '1mo' },
    { label: '日線', tf: '1d',  range: '6mo' },
    { label: '週線', tf: '1wk', range: '2y' },
  ];
  return Promise.all(intervals.map(async ({ label, tf, range }) => {
    const ohlcv = await fetchStockOHLCV(stockId, tf, range);
    if (ohlcv.length >= 20) {
      const a = calculateScore(ohlcv);
      return { label, score: a.score, signal: a.signal };
    }
    return { label, score: null, signal: '--' };
  }));
}

// ── 財經新聞（Google News RSS，繁中台股）───────────────────────────────────

const _newsMemo = {};

async function fetchNewsRSS(query, limit = 7) {
  if (_newsMemo[query]) return _newsMemo[query];
  const key = `cache:news:${query}`;
  const cached = cacheGet(key, 30 * 60 * 1000); // 新聞快取 30 分鐘
  if (cached) { _newsMemo[query] = cached; return cached; }

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:7d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
  const xml = await proxyFetchText(url, 8000);
  if (!xml) return null;

  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, limit).map(it => {
      const rawTitle = it.querySelector('title')?.textContent || '';
      const source = it.querySelector('source')?.textContent || '';
      // Google News 標題尾端會帶 " - 媒體名"，去掉
      const headline = rawTitle.replace(new RegExp(`\\s*-\\s*${source}\\s*$`), '').trim();
      const pub = new Date(it.querySelector('pubDate')?.textContent || Date.now());
      const link = it.querySelector('link')?.textContent || '';
      return {
        headline, source, link,
        date: `${String(pub.getMonth()+1).padStart(2,'0')}-${String(pub.getDate()).padStart(2,'0')}`,
        ...classifyNewsDirection(headline),
      };
    }).filter(n => n.headline);
    if (items.length) { _newsMemo[query] = items; cacheSet(key, items); return items; }
    return null;
  } catch { return null; }
}

// 關鍵字判讀新聞多空方向
const NEWS_BULL_KW = /創新高|大漲|漲停|買超|看好|看漲|上調|調升|成長|利多|突破|強勁|飆|攻頂|回升|反彈|轉盈|優於預期|報喜|新訂單|擴產|完銷/;
const NEWS_BEAR_KW = /下跌|跌停|賣超|重挫|利空|下修|調降|衰退|跌破|崩|疑慮|警訊|縮水|降評|轉虧|裁員|砍單|低於預期|停工|罰款|違約/;

function classifyNewsDirection(headline) {
  const bull = (headline.match(NEWS_BULL_KW) || []).length;
  const bear = (headline.match(NEWS_BEAR_KW) || []).length;
  if (bull > bear) return { dir: '偏多', cls: 'bull', tag: '利多', tagClass: 'bull' };
  if (bear > bull) return { dir: '偏空', cls: 'bear', tag: '利空', tagClass: 'bear' };
  return { dir: '中性', cls: 'neutral', tag: '中性', tagClass: 'neutral' };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function fmtVol(v) {
  if (!v) return '--';
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '億';
  if (v >= 1e4) return (v / 1e4).toFixed(1) + '萬';
  return v.toLocaleString();
}

function fmtK(v) {
  if (v == null) return '--';
  const s = v > 0 ? '+' : '';
  return `${s}${v.toLocaleString()} 張`;
}
