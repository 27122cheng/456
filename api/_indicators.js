// Shared technical indicator functions (prefixed _ so Vercel ignores as route)

export function sma(arr, n) {
  return arr.map((_, i) =>
    i < n - 1 ? NaN : arr.slice(i - n + 1, i + 1).reduce((a, b) => a + b) / n
  );
}

export function ema(arr, n) {
  const k = 2 / (n + 1);
  const out = [arr[0]];
  for (let i = 1; i < arr.length; i++) out.push(arr[i] * k + out[i - 1] * (1 - k));
  return out;
}

export function calcRSI(prices, n = 14) {
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

export function calcMACD(prices) {
  if (prices.length < 26) return { hist: NaN };
  const e12 = ema(prices, 12);
  const e26 = ema(prices, 26);
  const macdLine = e12.map((v, i) => v - e26[i]);
  const sigLine = ema(macdLine, 9);
  return { hist: macdLine[macdLine.length - 1] - sigLine[sigLine.length - 1] };
}

export function calcBB(prices, n = 20) {
  if (prices.length < n) return { pct: NaN };
  const slice = prices.slice(-n);
  const mean = slice.reduce((a, b) => a + b) / n;
  const std = Math.sqrt(slice.reduce((s, x) => s + (x - mean) ** 2, 0) / n);
  const upper = mean + 2 * std, lower = mean - 2 * std;
  const last = prices[prices.length - 1];
  return { pct: upper === lower ? 0.5 : (last - lower) / (upper - lower) };
}

export function analyze(ticker, closePrices, currentPrice, changePct) {
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
  const mom5d  = n >= 6  ? ((last - prices[n - 6])  / prices[n - 6])  * 100 : 0;
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
    price:     parseFloat(last.toFixed(2)),
    changePct: parseFloat((changePct ?? 0).toFixed(2)),
    rsi:       parseFloat(rsiVal.toFixed(1)),
    ma20:      parseFloat(ma20.toFixed(2)),
    ma50:      parseFloat(ma50.toFixed(2)),
    mom5d:     parseFloat(mom5d.toFixed(2)),
    mom20d:    parseFloat(mom20d.toFixed(2)),
    macdHist:  parseFloat(macdHist.toFixed(4)),
  };
}

export const FETCH_OPTS = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Accept": "application/json, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
  },
  signal: AbortSignal.timeout(9000),
};
