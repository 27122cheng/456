const TICKERS = [
  // Tech (25)
  "AAPL","MSFT","GOOGL","META","NVDA","AMD","INTC","TSLA","AMZN","CRM",
  "ORCL","ADBE","QCOM","TXN","MU","AMAT","LRCX","KLAC","MRVL","AVGO",
  "NFLX","SNOW","PLTR","UBER","LYFT",
  // Finance (15)
  "JPM","BAC","GS","WFC","MS","C","BLK","AXP","V","MA",
  "PYPL","SQ","SCHW","USB","TFC",
  // Healthcare (10)
  "JNJ","PFE","UNH","ABBV","MRK","LLY","TMO","ABT","DHR","BMY",
  // Consumer Disc. (10)
  "MCD","NKE","SBUX","TGT","HD","LOW","BKNG","CMG","F","GM",
  // Consumer Staples (8)
  "KO","PEP","PG","WMT","COST","PM","CL","KHC",
  // Energy (8)
  "XOM","CVX","COP","SLB","EOG","MPC","VLO","HAL",
  // Communication (6)
  "DIS","CMCSA","T","VZ","TMUS","SNAP",
  // Industrials (8)
  "BA","CAT","GE","HON","UPS","FDX","DE","LMT",
  // Materials / Utilities / REIT (10)
  "LIN","APD","NEM","FCX","NEE","DUK","SO","AMT","PLD","SPG",
];

const FETCH_OPTS = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
  },
  signal: AbortSignal.timeout(8000),
};

// ── Technical indicators ─────────────────────────────────────────────────────
function sma(arr, n) {
  return arr.map((_, i) =>
    i < n - 1 ? NaN : arr.slice(i - n + 1, i + 1).reduce((a, b) => a + b) / n
  );
}

function ema(arr, n) {
  const k = 2 / (n + 1);
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) out.push(arr[i] * k + out[i - 1] * (1 - k));
  return out;
}

function calcRSI(prices, n = 14) {
  if (prices.length < n + 1) return NaN;
  const gains = [], losses = [];
  for (let i = 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    gains.push(Math.max(0, d));
    losses.push(Math.max(0, -d));
  }
  let ag = gains.slice(0, n).reduce((a, b) => a + b) / n;
  let al = losses.slice(0, n).reduce((a, b) => a + b) / n;
  for (let i = n; i < gains.length; i++) {
    ag = (ag * (n - 1) + gains[i]) / n;
    al = (al * (n - 1) + losses[i]) / n;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function calcMACD(prices) {
  if (prices.length < 26) return { hist: NaN };
  const e12 = ema(prices, 12);
  const e26 = ema(prices, 26);
  const macdLine = e12.map((v, i) => v - e26[i]);
  const sigLine = ema(macdLine, 9);
  const hist = macdLine[macdLine.length - 1] - sigLine[sigLine.length - 1];
  return { hist };
}

function calcBB(prices, n = 20) {
  if (prices.length < n) return { pct: NaN };
  const slice = prices.slice(-n);
  const mean = slice.reduce((a, b) => a + b) / n;
  const std = Math.sqrt(slice.reduce((s, x) => s + (x - mean) ** 2, 0) / n);
  const upper = mean + 2 * std;
  const lower = mean - 2 * std;
  const last = prices[prices.length - 1];
  return { pct: upper === lower ? 0.5 : (last - lower) / (upper - lower) };
}

function analyze(ticker, closePrices, currentPrice, changePct) {
  const prices = closePrices.filter(v => v != null && !isNaN(v));
  if (prices.length < 20) return { ticker, trend: "unknown", error: "資料不足" };

  const n = prices.length;
  const ma20arr = sma(prices, 20);
  const ma50arr = sma(prices, Math.min(50, n));
  const ma20 = ma20arr[n - 1];
  const ma50 = ma50arr[n - 1];
  const rsiVal = calcRSI(prices);
  const { hist: macdHist } = calcMACD(prices);
  const { pct: bbPct } = calcBB(prices);

  const last = currentPrice ?? prices[n - 1];
  const mom5d = n >= 6 ? ((last - prices[n - 6]) / prices[n - 6]) * 100 : 0;
  const mom20d = n >= 21 ? ((last - prices[n - 21]) / prices[n - 21]) * 100 : 0;

  let score = 0;
  const signals = {};

  if (!isNaN(ma20)) {
    if (last > ma20) { score += 1; signals["價格>MA20"] = "bullish"; }
    else             { score -= 1; signals["價格>MA20"] = "bearish"; }
  }
  if (!isNaN(ma50) && !isNaN(ma20)) {
    if (ma20 > ma50) { score += 1; signals["MA20>MA50"] = "bullish"; }
    else             { score -= 1; signals["MA20>MA50"] = "bearish"; }
  }
  if (!isNaN(rsiVal)) {
    if      (rsiVal > 55) { score += 1; signals[`RSI ${rsiVal.toFixed(0)}`] = "bullish"; }
    else if (rsiVal < 45) { score -= 1; signals[`RSI ${rsiVal.toFixed(0)}`] = "bearish"; }
    else                  {             signals[`RSI ${rsiVal.toFixed(0)}`] = "neutral"; }
  }
  if (!isNaN(macdHist)) {
    if (macdHist > 0) { score += 1; signals["MACD柱狀"] = "bullish"; }
    else              { score -= 1; signals["MACD柱狀"] = "bearish"; }
  }
  if (!isNaN(bbPct)) {
    if      (bbPct > 0.6) { score += 1; signals["布林帶"] = "bullish"; }
    else if (bbPct < 0.4) { score -= 1; signals["布林帶"] = "bearish"; }
    else                  {             signals["布林帶"] = "neutral"; }
  }

  const trend = score >= 3 ? "bullish" : score <= -3 ? "bearish" : "neutral";

  return {
    ticker, trend, score, signals,
    price: parseFloat(last.toFixed(2)),
    changePct: parseFloat((changePct ?? 0).toFixed(2)),
    rsi: parseFloat(rsiVal.toFixed(1)),
    ma20: parseFloat(ma20.toFixed(2)),
    ma50: parseFloat(ma50.toFixed(2)),
    mom5d: parseFloat(mom5d.toFixed(2)),
    mom20d: parseFloat(mom20d.toFixed(2)),
    macdHist: parseFloat(macdHist.toFixed(4)),
  };
}

// ── Fetch Yahoo Finance data ─────────────────────────────────────────────────
async function fetchSpark(symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbols.join(",")}&range=3mo&interval=1d`;
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`Spark HTTP ${res.status}`);
  return res.json();
}

async function fetchQuotes(symbols) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketVolume`;
  const res = await fetch(url, FETCH_OPTS);
  if (!res.ok) throw new Error(`Quote HTTP ${res.status}`);
  return res.json();
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60");

  const BATCH = 50;
  const batches = [];
  for (let i = 0; i < TICKERS.length; i += BATCH) batches.push(TICKERS.slice(i, i + BATCH));

  try {
    // Fetch spark + quote in parallel for all batches
    const [sparkResults, quoteResults] = await Promise.all([
      Promise.all(batches.map(b => fetchSpark(b))),
      Promise.all(batches.map(b => fetchQuotes(b))),
    ]);

    // Build lookup maps
    const closeMap = {};
    for (const sparkData of sparkResults) {
      for (const item of (sparkData?.spark?.result ?? [])) {
        if (!item) continue;
        const resp = item.response?.[0];
        const closes = resp?.indicators?.quote?.[0]?.close ?? [];
        if (closes.length) closeMap[item.symbol] = closes;
      }
    }

    const quoteMap = {};
    for (const quoteData of quoteResults) {
      for (const q of (quoteData?.quoteResponse?.result ?? [])) {
        quoteMap[q.symbol] = {
          price: q.regularMarketPrice,
          changePct: q.regularMarketChangePercent,
        };
      }
    }

    // Analyze each ticker
    const stocks = TICKERS.map(t => {
      const closes = closeMap[t];
      if (!closes || closes.length < 20) return { ticker: t, trend: "unknown", error: "資料不足" };
      const q = quoteMap[t];
      return analyze(t, closes, q?.price, q?.changePct);
    });

    stocks.sort((a, b) => {
      const rank = { bullish: 0, neutral: 1, bearish: 2, unknown: 3 };
      return (rank[a.trend] - rank[b.trend]) || ((b.score ?? 0) - (a.score ?? 0));
    });

    const summary = {
      bullish: stocks.filter(s => s.trend === "bullish").length,
      neutral: stocks.filter(s => s.trend === "neutral").length,
      bearish: stocks.filter(s => s.trend === "bearish").length,
      unknown: stocks.filter(s => s.trend === "unknown").length,
    };

    res.status(200).json({ stocks, summary, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
