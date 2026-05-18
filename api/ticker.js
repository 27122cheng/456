// Analyze a single ticker in real-time
import { analyze, FETCH_OPTS } from "./_indicators.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const symbol = (req.query.symbol || "").trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: "缺少 symbol 參數" });

  try {
    const [sparkRes, quoteRes] = await Promise.all([
      fetch(
        `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbol}&range=3mo&interval=1d`,
        FETCH_OPTS
      ),
      fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketVolume,longName,shortName,currency`,
        FETCH_OPTS
      ),
    ]);

    if (!sparkRes.ok) throw new Error(`Spark HTTP ${sparkRes.status}`);
    if (!quoteRes.ok) throw new Error(`Quote HTTP ${quoteRes.status}`);

    const [sparkData, quoteData] = await Promise.all([sparkRes.json(), quoteRes.json()]);

    const sparkItem = (sparkData?.spark?.result ?? [])[0];
    const closes = sparkItem?.response?.[0]?.indicators?.quote?.[0]?.close ?? [];

    const quoteItem = (quoteData?.quoteResponse?.result ?? [])[0] ?? {};
    const price     = quoteItem.regularMarketPrice;
    const changePct = quoteItem.regularMarketChangePercent;
    const name      = quoteItem.longName || quoteItem.shortName || symbol;
    const currency  = quoteItem.currency || "USD";

    const result = analyze(symbol, closes, price, changePct);
    result.name     = name;
    result.currency = currency;

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
