import { calcEMA, calcRSI, calcMACD, calcVolumeMA } from './indicators.js'

export function generateSignal(history, institutional) {
  if (!history || history.length < 60) return null

  const closes = history.map(h => h.close)
  const volumes = history.map(h => h.volume)
  const lows = history.map(h => h.low)

  const ema20 = calcEMA(closes, 20)
  const ema60 = calcEMA(closes, 60)
  const rsi = calcRSI(closes)
  const macd = calcMACD(closes)
  const volMA = calcVolumeMA(volumes)

  const latestEMA20 = ema20[ema20.length - 1]
  const latestEMA60 = ema60[ema60.length - 1]
  const latestClose = closes[closes.length - 1]
  const latestVol = volumes[volumes.length - 1]
  const recent20High = Math.max(...closes.slice(-21, -1))
  const recent5Low = Math.min(...lows.slice(-5))

  let confidence = 10
  const reasons = []

  if (latestEMA20 && latestEMA60 && latestEMA20 > latestEMA60) {
    confidence += 15
    reasons.push('EMA20 > EMA60（多頭排列）')
  }
  if (rsi && rsi > 50 && rsi < 70) {
    confidence += 15
    reasons.push(`RSI ${rsi.toFixed(1)} 位於多頭區間 (50–70)`)
  }
  if (macd?.macd != null && macd?.signal != null && macd.macd > macd.signal) {
    confidence += 15
    reasons.push('MACD 金叉（MACD > Signal）')
  }
  if (volMA && latestVol > volMA * 1.2) {
    confidence += 15
    reasons.push(`成交量放大（高於均量 ${((latestVol / volMA - 1) * 100).toFixed(0)}%）`)
  }
  if (institutional && institutional.foreign > 0) {
    confidence += 15
    reasons.push(`外資買超 ${institutional.foreign.toLocaleString()} 張`)
  }
  if (latestClose > recent20High) {
    confidence += 15
    reasons.push('突破近 20 日最高收盤（向上突破）')
  }

  const entry = latestClose
  const stopLoss = recent5Low > 0 ? recent5Low : entry * 0.93
  const risk = entry - stopLoss
  const target1 = entry + risk * 2
  const target2 = entry + risk * 3
  const rrRatio = risk > 0 ? (target1 - entry) / risk : 0

  const action = rrRatio >= 2 && confidence >= 55 ? 'BUY' : 'HOLD'

  return { action, entry, stopLoss, target1, target2, rrRatio, confidence, reasons }
}
