// CommonJS — no external dependencies, uses Node 18 built-in fetch

// ── Technical indicators ─────────────────────────────────────────────────────
function sma(arr, n) {
  return arr.map((_, i) =>
    i < n - 1 ? NaN : arr.slice(i - n + 1, i + 1).reduce((a, b) => a + b) / n
  );
}
function ema(arr, n) {
  const k = 2 / (n + 1), out = [arr[0]];
  for (let i = 1; i < arr.length; i++) out.push(arr[i] * k + out[i - 1] * (1 - k));
  return out;
}
function calcRSI(prices, n = 14) {
  if (prices.length < n + 1) return NaN;
  const g = [], l = [];
  for (let i = 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    g.push(Math.max(0, d)); l.push(Math.max(0, -d));
  }
  let ag = g.slice(0, n).reduce((a, b) => a + b) / n;
  let al = l.slice(0, n).reduce((a, b) => a + b) / n;
  for (let i = n; i < g.length; i++) {
    ag = (ag * (n - 1) + g[i]) / n;
    al = (al * (n - 1) + l[i]) / n;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}
function calcMACD(prices) {
  if (prices.length < 26) return NaN;
  const e12 = ema(prices, 12), e26 = ema(prices, 26);
  const macd = e12.map((v, i) => v - e26[i]);
  const sig  = ema(macd, 9);
  return macd[macd.length - 1] - sig[sig.length - 1];
}
function calcBBpct(prices, n = 20) {
  if (prices.length < n) return NaN;
  const sl = prices.slice(-n);
  const m  = sl.reduce((a, b) => a + b) / n;
  const sd = Math.sqrt(sl.reduce((s, x) => s + (x - m) ** 2, 0) / n);
  const up = m + 2 * sd, lo = m - 2 * sd;
  const last = prices[prices.length - 1];
  return up === lo ? 0.5 : (last - lo) / (up - lo);
}
function analyze(ticker, closes, price, changePct) {
  const prices = closes.filter(v => v != null && !isNaN(v));
  if (prices.length < 20) return { ticker, trend: "unknown", error: "歷史資料不足" };
  const n = prices.length;
  const ma20 = sma(prices, 20)[n - 1];
  const ma50 = sma(prices, Math.min(50, n))[n - 1];
  const rsi  = calcRSI(prices);
  const macd = calcMACD(prices);
  const bbp  = calcBBpct(prices);
  const last = price ?? prices[n - 1];
  const m5d  = n >= 6  ? ((last - prices[n - 6])  / prices[n - 6])  * 100 : 0;
  const m20d = n >= 21 ? ((last - prices[n - 21]) / prices[n - 21]) * 100 : 0;
  let score = 0; const signals = {};
  if (!isNaN(ma20)) {
    if (last > ma20) { score++; signals["價格>MA20"] = "bullish"; }
    else             { score--; signals["價格>MA20"] = "bearish"; }
  }
  if (!isNaN(ma50) && !isNaN(ma20)) {
    if (ma20 > ma50) { score++; signals["MA20>MA50"] = "bullish"; }
    else             { score--; signals["MA20>MA50"] = "bearish"; }
  }
  if (!isNaN(rsi)) {
    if      (rsi > 55) { score++; signals[`RSI ${rsi.toFixed(0)}`] = "bullish"; }
    else if (rsi < 45) { score--; signals[`RSI ${rsi.toFixed(0)}`] = "bearish"; }
    else               {          signals[`RSI ${rsi.toFixed(0)}`] = "neutral"; }
  }
  if (!isNaN(macd)) {
    if (macd > 0) { score++; signals["MACD"] = "bullish"; }
    else          { score--; signals["MACD"] = "bearish"; }
  }
  if (!isNaN(bbp)) {
    if      (bbp > 0.6) { score++; signals["布林帶"] = "bullish"; }
    else if (bbp < 0.4) { score--; signals["布林帶"] = "bearish"; }
    else                {          signals["布林帶"] = "neutral"; }
  }
  const trend = score >= 3 ? "bullish" : score <= -3 ? "bearish" : "neutral";
  return {
    ticker, trend, score, signals,
    price:     +((last  ?? 0).toFixed(2)),
    changePct: +((changePct ?? 0).toFixed(2)),
    rsi:       +((rsi  ?? 0).toFixed(1)),
    ma20:      +((ma20 ?? 0).toFixed(2)),
    ma50:      +((ma50 ?? 0).toFixed(2)),
    mom5d:     +((m5d  ?? 0).toFixed(2)),
    mom20d:    +((m20d ?? 0).toFixed(2)),
  };
}

// ── Finnhub helpers ──────────────────────────────────────────────────────────
async function fhGet(path, params, apiKey) {
  const qs = new URLSearchParams({ ...params, token: apiKey }).toString();
  const res = await fetch(`https://finnhub.io/api/v1${path}?${qs}`,
    { signal: AbortSignal.timeout(8000) });
  if (res.status === 429) throw new Error("rate_limit");
  if (!res.ok) throw new Error(`Finnhub ${path} ${res.status}`);
  return res.json();
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchTicker(ticker, apiKey, retries = 2) {
  const to   = Math.floor(Date.now() / 1000);
  const from = to - 100 * 86400;
  for (let i = 0; i <= retries; i++) {
    try {
      const [candle, quote] = await Promise.all([
        fhGet("/stock/candle", { symbol: ticker, resolution: "D", from, to }, apiKey),
        fhGet("/quote",        { symbol: ticker }, apiKey),
      ]);
      if (candle.s !== "ok" || !candle.c?.length)
        return { ticker, trend: "unknown", error: "無資料" };
      const result = analyze(ticker, candle.c, quote.c ?? null, quote.dp ?? null);
      return result;
    } catch (e) {
      if (e.message === "rate_limit" && i < retries) { await sleep(1200); continue; }
      return { ticker, trend: "unknown", error: e.message };
    }
  }
}

// ── Stock universe ───────────────────────────────────────────────────────────
const TICKERS = [
  "AAPL","MSFT","GOOGL","META","NVDA","AMD","INTC","TSLA","AMZN","CRM",
  "ORCL","ADBE","QCOM","TXN","MU","AMAT","LRCX","KLAC","MRVL","AVGO",
  "NFLX","SNOW","PLTR","UBER","LYFT",
  "JPM","BAC","GS","WFC","MS","C","BLK","AXP","V","MA",
  "PYPL","SQ","SCHW","USB","TFC",
  "JNJ","PFE","UNH","ABBV","MRK","LLY","TMO","ABT","DHR","BMY",
  "MCD","NKE","SBUX","TGT","HD","LOW","BKNG","CMG","F","GM",
  "KO","PEP","PG","WMT","COST","PM","CL","KHC",
  "XOM","CVX","COP","SLB","EOG","MPC","VLO","HAL",
  "DIS","CMCSA","T","VZ","TMUS","SNAP",
  "BA","CAT","GE","HON","UPS","FDX","DE","LMT",
  "LIN","APD","NEM","FCX","NEE","DUK","SO","AMT","PLD","SPG",
];

// ── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=60");

  const apiKey = process.env.FINNHUB_API_KEY || "";
  if (!apiKey) {
    return res.status(500).json({
      error: "請在 Vercel 專案的 Environment Variables 中加入 FINNHUB_API_KEY（免費申請：finnhub.io）",
    });
  }

  try {
    // Fetch 10 tickers in parallel per batch, 1 s gap → stays under 60 req/min
    const BATCH = 10, DELAY = 1100;
    const stocks = [];
    for (let i = 0; i < TICKERS.length; i += BATCH) {
      const batch = TICKERS.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(t => fetchTicker(t, apiKey)));
      stocks.push(...results);
      if (i + BATCH < TICKERS.length) await sleep(DELAY);
    }

    stocks.sort((a, b) => {
      const r = { bullish: 0, neutral: 1, bearish: 2, unknown: 3 };
      return (r[a.trend] - r[b.trend]) || ((b.score ?? 0) - (a.score ?? 0));
    });

    res.status(200).json({
      stocks,
      summary: {
        bullish: stocks.filter(s => s.trend === "bullish").length,
        neutral: stocks.filter(s => s.trend === "neutral").length,
        bearish: stocks.filter(s => s.trend === "bearish").length,
        unknown: stocks.filter(s => s.trend === "unknown").length,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
