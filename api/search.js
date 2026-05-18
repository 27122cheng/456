// Stock autocomplete search via Yahoo Finance
import { FETCH_OPTS } from "./_indicators.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "缺少搜尋關鍵字" });

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=en-US&region=US&quotesCount=10&newsCount=0&listsCount=0`;
    const r = await fetch(url, FETCH_OPTS);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();

    const results = (data.quotes || [])
      .filter(item => ["EQUITY", "ETF", "MUTUALFUND"].includes(item.quoteType))
      .slice(0, 8)
      .map(item => ({
        ticker:   item.symbol,
        name:     item.longname || item.shortname || item.symbol,
        exchange: item.exchDisp || item.exchange || "",
        type:     item.quoteType,
      }));

    res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
