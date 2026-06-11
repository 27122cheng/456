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

// Primary: allorigins (JSON wrapper). Fallback: corsproxy.io (raw body).
async function proxyFetch(url, timeout = 12000) {
  // 1. allorigins
  let res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, timeout);
  if (res) {
    try {
      const json = await res.json();
      if (json?.contents) return JSON.parse(json.contents);
    } catch {}
  }
  // 2. corsproxy.io
  res = await fetchWithTimeout(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, timeout);
  if (res) {
    try { return await res.json(); } catch {}
  }
  return null;
}

// ── Yahoo Finance ─────────────────────────────────────────────────────────

function tsToDate(ts) {
  const d = new Date(ts * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

async function fetchYahooOHLCV(symbol, interval = '1d', range = '6mo') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const data = await proxyFetch(url);
  const result = data?.chart?.result?.[0];
  if (!result) return [];
  const { timestamp, indicators } = result;
  const q = indicators.quote[0];
  return timestamp.map((ts, i) => ({
    time: tsToDate(ts),
    open:   q.open[i]   ? +q.open[i].toFixed(2)   : null,
    high:   q.high[i]   ? +q.high[i].toFixed(2)   : null,
    low:    q.low[i]    ? +q.low[i].toFixed(2)     : null,
    close:  q.close[i]  ? +q.close[i].toFixed(2)   : null,
    volume: q.volume[i] || 0,
  })).filter(d => d.open && d.close);
}

// Taiwan stock — append ".TW" (TWSE listed) or ".TWO" (TPEx/OTC)
function yahooSymbol(stockId) {
  const n = parseInt(stockId);
  // codes >= 4000 tend to be OTC (上櫃), but rough heuristic — Yahoo accepts both
  return `${stockId}.TW`;
}

async function fetchStockOHLCV(stockId, interval = '1d', range = '6mo') {
  const sym = yahooSymbol(stockId);
  const ohlcv = await fetchYahooOHLCV(sym, interval, range);
  if (ohlcv.length > 0) return ohlcv;
  // try OTC suffix
  return fetchYahooOHLCV(`${stockId}.TWO`, interval, range);
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

// Fetch full T86 table (every listed stock's institutional net buy/sell)
async function fetchT86All() {
  try {
    const dateStr = getLastTradingDateStr();
    const url = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${dateStr}&selectType=ALL&response=json`;
    const data = await proxyFetch(url, 12000);
    return data?.data || null;
  } catch { return null; }
}

// ── TWSE Institutional T86 ────────────────────────────────────────────────

function getLastTradingDateStr(from = new Date()) {
  const d = new Date(from);
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() - 2);
  else if (dow === 6) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function parseK(s) {
  return Math.round((parseInt(String(s).replace(/,/g, ''), 10) || 0) / 1000);
}

async function fetchInstitutional(stockId) {
  try {
    const dateStr = getLastTradingDateStr();
    const url = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${dateStr}&selectType=ALL&response=json`;
    const data = await proxyFetch(url, 10000);
    if (!data?.data) return null;
    const row = data.data.find(r => r[0]?.trim() === stockId);
    if (!row) return null;
    return {
      foreign:    parseK(row[4]),
      investment: parseK(row[7]),
      dealer:     parseK(row[10]),
      total:      parseK(row[11]),
    };
  } catch { return null; }
}

// ── Multi-timeframe snapshot ──────────────────────────────────────────────

async function fetchMTFSignals(stockId) {
  const intervals = [
    { label: '60分', tf: '60m', range: '1mo' },
    { label: '日線', tf: '1d',  range: '6mo' },
    { label: '週線', tf: '1wk', range: '2y' },
  ];
  const results = [];
  for (const { label, tf, range } of intervals) {
    const ohlcv = await fetchStockOHLCV(stockId, tf, range);
    if (ohlcv.length >= 20) {
      const a = calculateScore(ohlcv);
      results.push({ label, score: a.score, signal: a.signal });
    } else {
      results.push({ label, score: null, signal: '--' });
    }
    await delay(100);
  }
  return results;
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
