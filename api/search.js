// CommonJS — no external dependencies

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60");

  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "缺少搜尋關鍵字" });

  const apiKey = process.env.FINNHUB_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "未設定 FINNHUB_API_KEY" });

  try {
    const res2 = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res2.ok) throw new Error(`Finnhub search ${res2.status}`);
    const data = await res2.json();

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
};
