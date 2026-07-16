export function calcEMA(closes, period) {
  if (!closes || closes.length < period) return []
  const k = 2 / (period + 1)
  const result = []
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = 0; i < period - 1; i++) result.push(null)
  result.push(ema)
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k)
    result.push(ema)
  }
  return result
}

export function calcRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

export function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12)
  const ema26 = calcEMA(closes, 26)
  const macdLine = ema12.map((v, i) => {
    if (v === null || ema26[i] === null) return null
    return v - ema26[i]
  })
  const validMacd = macdLine.filter(v => v !== null)
  if (validMacd.length < 9) return { macd: null, signal: null, histogram: null }
  const signalLine = calcEMA(validMacd, 9)
  const lastMacd = validMacd[validMacd.length - 1]
  const lastSignal = signalLine[signalLine.length - 1]
  return {
    macd: lastMacd ?? null,
    signal: lastSignal ?? null,
    histogram: lastMacd != null && lastSignal != null ? lastMacd - lastSignal : null,
  }
}

export function calcBollinger(closes, period = 20) {
  if (!closes || closes.length < period) return null
  const slice = closes.slice(-period)
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period
  const std = Math.sqrt(variance)
  return { upper: mean + 2 * std, middle: mean, lower: mean - 2 * std }
}

export function calcVolumeMA(volumes, period = 20) {
  if (!volumes || volumes.length < period) return null
  const slice = volumes.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}
