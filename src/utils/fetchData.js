const PROXY = 'https://api.allorigins.win/get?url='

async function proxyFetch(url) {
  const res = await fetch(`${PROXY}${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`proxy ${res.status}`)
  const json = await res.json()
  return JSON.parse(json.contents)
}

function toDateStr(ts) {
  const d = new Date(ts * 1000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function fetchStockHistory(stockId) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${stockId}.TW?interval=1d&range=6mo`
    const data = await proxyFetch(url)
    const result = data?.chart?.result?.[0]
    if (!result) return []
    const { timestamp, indicators } = result
    const q = indicators.quote[0]
    return timestamp
      .map((ts, i) => ({
        time: toDateStr(ts),
        open: q.open[i] ? parseFloat(q.open[i].toFixed(2)) : null,
        high: q.high[i] ? parseFloat(q.high[i].toFixed(2)) : null,
        low: q.low[i] ? parseFloat(q.low[i].toFixed(2)) : null,
        close: q.close[i] ? parseFloat(q.close[i].toFixed(2)) : null,
        volume: q.volume[i] || 0,
      }))
      .filter(d => d.open && d.high && d.low && d.close)
  } catch {
    return []
  }
}

export async function fetchMarketIndex() {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5ETWII?interval=1d&range=1mo`
    const data = await proxyFetch(url)
    const result = data?.chart?.result?.[0]
    if (!result) return []
    const { timestamp, indicators } = result
    const q = indicators.quote[0]
    return timestamp
      .map((ts, i) => ({
        time: toDateStr(ts),
        open: q.open[i] ? parseFloat(q.open[i].toFixed(2)) : null,
        high: q.high[i] ? parseFloat(q.high[i].toFixed(2)) : null,
        low: q.low[i] ? parseFloat(q.low[i].toFixed(2)) : null,
        close: q.close[i] ? parseFloat(q.close[i].toFixed(2)) : null,
        volume: q.volume[i] || 0,
      }))
      .filter(d => d.close)
  } catch {
    return []
  }
}

function getLastTradingDate(from = new Date()) {
  const d = new Date(from)
  const dow = d.getDay()
  if (dow === 0) d.setDate(d.getDate() - 2)
  else if (dow === 6) d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function parseNum(s) {
  if (!s) return 0
  return Math.round(parseInt(String(s).replace(/,/g, ''), 10) / 1000) || 0
}

export async function fetchInstitutional(stockId) {
  try {
    const dateStr = getLastTradingDate()
    const url = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${dateStr}&selectType=ALL&response=json`
    const data = await proxyFetch(url)
    if (!data?.data) return null
    const row = data.data.find(r => r[0]?.trim() === stockId)
    if (!row) return null
    return {
      foreign: parseNum(row[4]),
      investment: parseNum(row[7]),
      dealer: parseNum(row[10]),
      total: parseNum(row[11]),
    }
  } catch {
    return null
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export async function fetchRecentInstitutional(stockId) {
  const dates = []
  const d = new Date()
  let count = 0
  while (count < 20) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      dates.push(`${y}${m}${day}`)
      count++
    }
    d.setDate(d.getDate() - 1)
  }

  const results = []
  for (const dateStr of dates) {
    try {
      const url = `https://www.twse.com.tw/rwd/zh/fund/T86?date=${dateStr}&selectType=ALL&response=json`
      const data = await proxyFetch(url)
      if (data?.data) {
        const row = data.data.find(r => r[0]?.trim() === stockId)
        if (row) {
          results.push({
            date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
            foreign: parseNum(row[4]),
            investment: parseNum(row[7]),
            dealer: parseNum(row[10]),
            total: parseNum(row[11]),
          })
        }
      }
      await delay(200)
    } catch {
      // skip this date
    }
  }

  return results.reverse()
}
