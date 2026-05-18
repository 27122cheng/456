// CommonJS — no external dependencies

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
  return up === lo ? 0.5 : (prices[prices.length - 1] - lo) / (up - lo);
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
    price:     +((last ?? 0).toFixed(2)),
    changePct: +((changePct ?? 0).toFixed(2)),
    rsi:       +((rsi  ?? 0).toFixed(1)),
    ma20:      +((ma20 ?? 0).toFixed(2)),
    ma50:      +((ma50 ?? 0).toFixed(2)),
    mom5d:     +((m5d  ?? 0).toFixed(2)),
    mom20d:    +((m20d ?? 0).toFixed(2)),
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const symbol = (req.query.symbol || "").trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: "缺少 symbol 參數" });

  const apiKey = process.env.FINNHUB_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "未設定 FINNHUB_API_KEY" });

  const to   = Math.floor(Date.now() / 1000);
  const from = to - 100 * 86400;

  try {
    const [candleRes, quoteRes, profileRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }),
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }),
      fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }),
    ]);

    const [candle, quote, profile] = await Promise.all([
      candleRes.json(), quoteRes.json(), profileRes.json(),
    ]);

    if (candle.s !== "ok" || !candle.c?.length) {
      return res.status(404).json({
        ticker: symbol, trend: "unknown",
        error: "找不到此股票，請確認代碼正確（例：AAPL、2330.TW）",
      });
    }

    const result = analyze(symbol, candle.c, quote.c ?? null, quote.dp ?? null);
    result.name     = profile.name || symbol;
    result.currency = profile.currency || "USD";
    result.exchange = profile.exchange || "";

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `分析 ${symbol} 失敗：${err.message}` });
  }
};
