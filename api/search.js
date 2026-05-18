// Stock autocomplete search via Finnhub symbol search
import { finnhubKey, finnhubGet } from "./_indicators.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "缺少搜尋關鍵字" });

  const apiKey = finnhubKey(req);
  if (!apiKey) return res.status(500).json({ error: "未設定 FINNHUB_API_KEY 環境變數" });

  try {
    const data = await finnhubGet("/search", { q }, apiKey);

    const results = (data.result || [])
      .filter(item => item.type === "Common Stock" || item.type === "ETP")
      .slice(0, 8)
      .map(item => ({
        ticker:   item.symbol,
        name:     item.description || item.symbol,
        exchange: item.displaySymbol || "",
        type:     item.type,
      }));

    res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
