import { analyze, FETCH_OPTS } from "./_indicators.js";

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

async function fetchSpark(symbols) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbols.join(",")}&range=3mo&interval=1d`,
    FETCH_OPTS
  );
  if (!r.ok) throw new Error(`Spark HTTP ${r.status}`);
  return r.json();
}

async function fetchQuotes(symbols) {
  const r = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}&fields=regularMarketPrice,regularMarketChangePercent`,
    FETCH_OPTS
  );
  if (!r.ok) throw new Error(`Quote HTTP ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60");

  const BATCH = 50;
  const batches = [];
  for (let i = 0; i < TICKERS.length; i += BATCH) batches.push(TICKERS.slice(i, i + BATCH));

  try {
    const [sparkAll, quoteAll] = await Promise.all([
      Promise.all(batches.map(fetchSpark)),
      Promise.all(batches.map(fetchQuotes)),
    ]);

    const closeMap = {}, quoteMap = {};

    for (const d of sparkAll)
      for (const item of (d?.spark?.result ?? []))
        if (item) {
          const closes = item.response?.[0]?.indicators?.quote?.[0]?.close ?? [];
          if (closes.length) closeMap[item.symbol] = closes;
        }

    for (const d of quoteAll)
      for (const q of (d?.quoteResponse?.result ?? []))
        quoteMap[q.symbol] = { price: q.regularMarketPrice, changePct: q.regularMarketChangePercent };

    const stocks = TICKERS.map(t => {
      const closes = closeMap[t];
      if (!closes || closes.length < 20) return { ticker: t, trend: "unknown", error: "資料不足" };
      const q = quoteMap[t];
      return analyze(t, closes, q?.price, q?.changePct);
    });

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
