import { analyze, finnhubKey, finnhubGet, batchProcess } from "./_indicators.js";

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

async function fetchTicker(ticker, apiKey) {
  const to   = Math.floor(Date.now() / 1000);
  const from = to - 100 * 24 * 60 * 60; // 100 days back for indicator warmup

  try {
    const [candle, quote] = await Promise.all([
      finnhubGet("/stock/candle", { symbol: ticker, resolution: "D", from, to }, apiKey),
      finnhubGet("/quote",        { symbol: ticker }, apiKey),
    ]);

    if (candle.s !== "ok" || !candle.c?.length) {
      return { ticker, trend: "unknown", error: "無歷史資料" };
    }

    const result = analyze(ticker, candle.c, quote.c, quote.dp);
    result.name = ticker;
    return result;
  } catch (e) {
    return { ticker, trend: "unknown", error: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=60");

  const apiKey = finnhubKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: "未設定 FINNHUB_API_KEY 環境變數" });
  }

  try {
    // Batch 8 tickers at a time with 150ms gap → ~20 batches × 150ms ≈ 3s
    const stocks = await batchProcess(
      TICKERS,
      t => fetchTicker(t, apiKey),
      8,
      150
    );

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
}
