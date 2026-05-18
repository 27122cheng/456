// Analyze a single ticker in real-time via Finnhub
import { analyze, finnhubKey, finnhubGet } from "./_indicators.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const symbol = (req.query.symbol || "").trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: "缺少 symbol 參數" });

  const apiKey = finnhubKey(req);
  if (!apiKey) return res.status(500).json({ error: "未設定 FINNHUB_API_KEY 環境變數" });

  const to   = Math.floor(Date.now() / 1000);
  const from = to - 100 * 24 * 60 * 60;

  try {
    const [candle, quote, profile] = await Promise.all([
      finnhubGet("/stock/candle",   { symbol, resolution: "D", from, to }, apiKey),
      finnhubGet("/quote",           { symbol }, apiKey),
      finnhubGet("/stock/profile2",  { symbol }, apiKey),
    ]);

    if (candle.s !== "ok" || !candle.c?.length) {
      return res.status(404).json({ ticker: symbol, trend: "unknown", error: "找不到此股票資料，請確認代碼是否正確" });
    }

    const result = analyze(symbol, candle.c, quote.c, quote.dp);
    result.name     = profile.name || symbol;
    result.currency = profile.currency || "USD";
    result.exchange = profile.exchange || "";
    result.logo     = profile.logo || "";

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
