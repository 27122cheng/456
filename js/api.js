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

// 3-layer proxy fallback with adaptive ordering:
// 上次成功的 proxy 記在 localStorage 優先使用 → 不必每個請求都先等失敗的 proxy 超時
const PROXIES = [
  { name: 'ao-raw',    wrap: e => `https://api.allorigins.win/raw?url=${e}`,  json: r => r.json(), text: r => r.text() },
  { name: 'corsproxy', wrap: e => `https://corsproxy.io/?url=${e}`,           json: r => r.json(), text: r => r.text() },
  { name: 'ao-get',    wrap: e => `https://api.allorigins.win/get?url=${e}`,
    json: async r => { const j = await r.json(); return j?.contents ? JSON.parse(j.contents) : null; },
    text: async r => (await r.json())?.contents ?? null },
];

function proxyOrder() {
  const pref = localStorage.getItem('proxy-pref');
  const idx = PROXIES.findIndex(p => p.name === pref);
  if (idx > 0) { const arr = [...PROXIES]; arr.unshift(arr.splice(idx, 1)[0]); return arr; }
  return PROXIES;
}

async function proxyFetch(url, timeout = 8000) {
  const enc = encodeURIComponent(url);
  for (const p of proxyOrder()) {
    const res = await fetchWithTimeout(p.wrap(enc), timeout);
    if (!res) continue;
    try {
      const data = await p.json(res);
      if (data) { localStorage.setItem('proxy-pref', p.name); return data; }
    } catch {}
  }
  return null;
}

// 取回純文字（RSS / XML 用）
async function proxyFetchText(url, timeout = 8000) {
  const enc = encodeURIComponent(url);
  for (const p of proxyOrder()) {
    const res = await fetchWithTimeout(p.wrap(enc), timeout);
    if (!res) continue;
    try {
      const txt = await p.text(res);
      if (txt && txt.length > 50) { localStorage.setItem('proxy-pref', p.name); return txt; }
    } catch {}
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
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const data = await proxyFetch(url);
  const result = data?.chart?.result?.[0];
  if (!result) return [];
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

// Taiwan stock — append ".TW" (TWSE listed) or ".TWO" (TPEx/OTC)
function yahooSymbol(stockId) {
  return `${stockId}.TW`;
}

async function fetchStockOHLCV(stockId, interval = '1d', range = '6mo') {
  // 記住哪些股票是上櫃（.TWO），下次直接抓對的，不用先等 .TW 失敗
  const suffixKey = `sym-suffix:${stockId}`;
  const knownSuffix = localStorage.getItem(suffixKey);
  if (knownSuffix === 'TWO') {
    const two = await fetchYahooOHLCV(`${stockId}.TWO`, interval, range);
    if (two.length) return two;
  }
  const ohlcv = await fetchYahooOHLCV(yahooSymbol(stockId), interval, range);
  if (ohlcv.length > 0) return ohlcv;
  const two = await fetchYahooOHLCV(`${stockId}.TWO`, interval, range);
  if (two.length) localStorage.setItem(suffixKey, 'TWO');
  return two;
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

// ── Yahoo 即時報價基本面（v7 quote 不需 crumb，比 quoteSummary 穩定）────────

async function fetchQuoteInfo(stockId) {
  const key = `cache:quote:${stockId}`;
  const cached = cacheGet(key, 60 * 60 * 1000); // 基本面變動慢，快取 1 小時
  if (cached) return cached;
  const suffix = localStorage.getItem(`sym-suffix:${stockId}`) === 'TWO' ? 'TWO' : 'TW';
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${stockId}.${suffix}`;
  const data = await proxyFetch(url, 8000);
  const q = data?.quoteResponse?.result?.[0];
  if (!q) return null;
  const info = {
    pe: q.trailingPE ?? q.forwardPE ?? null,
    pb: q.priceToBook ?? null,
    divYield: q.trailingAnnualDividendYield ?? null, // 小數，如 0.045
    eps: q.epsTrailingTwelveMonths ?? null,
    marketCap: q.marketCap ?? null,
    high52: q.fiftyTwoWeekHigh ?? null,
    low52: q.fiftyTwoWeekLow ?? null,
  };
  cacheSet(key, info);
  return info;
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
