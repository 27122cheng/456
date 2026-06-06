// ── Technical Indicators ──────────────────────────────────────────────────

function calcEMA(closes, period) {
  if (!closes || closes.length < period) return [];
  const k = 2 / (period + 1);
  const result = new Array(closes.length).fill(null);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = ema;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

function calcRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  if (al === 0) return 100;
  return 100 - (100 / (1 + ag / al));
}

function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = closes.map((_, i) => {
    if (ema12[i] === null || ema26[i] === null) return null;
    return ema12[i] - ema26[i];
  });
  const validMacd = macdLine.filter(v => v !== null);
  if (validMacd.length < 9) return { macd: null, signal: null, hist: null };
  const sigLine = calcEMA(validMacd, 9);
  const lastM = validMacd[validMacd.length - 1];
  const lastS = sigLine[sigLine.length - 1];
  return { macd: lastM, signal: lastS, hist: lastM - lastS };
}

function calcADX(highs, lows, closes, period = 14) {
  if (!highs || highs.length < period * 2 + 1) return null;
  const tr = [], dmp = [], dmm = [];
  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hpc, lpc));
    const up = highs[i] - highs[i - 1];
    const dn = lows[i - 1] - lows[i];
    dmp.push(up > dn && up > 0 ? up : 0);
    dmm.push(dn > up && dn > 0 ? dn : 0);
  }
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let ap = dmp.slice(0, period).reduce((a, b) => a + b, 0);
  let am = dmm.slice(0, period).reduce((a, b) => a + b, 0);
  const dx = [];
  for (let i = period; i < tr.length; i++) {
    atr = atr - atr / period + tr[i];
    ap = ap - ap / period + dmp[i];
    am = am - am / period + dmm[i];
    const dip = (ap / atr) * 100;
    const dim = (am / atr) * 100;
    const sum = dip + dim;
    dx.push(sum === 0 ? 0 : Math.abs(dip - dim) / sum * 100);
  }
  if (dx.length < period) return null;
  return dx.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calcBollinger(closes, period = 20) {
  if (!closes || closes.length < period) return null;
  const s = closes.slice(-period);
  const mean = s.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(s.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period);
  return { upper: mean + 2 * std, middle: mean, lower: mean - 2 * std };
}

function calcVolumeMA(volumes, period = 20) {
  if (!volumes || volumes.length < period) return null;
  return volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calcStoch(highs, lows, closes, k = 14, d = 3) {
  if (closes.length < k) return null;
  const recentH = Math.max(...highs.slice(-k));
  const recentL = Math.min(...lows.slice(-k));
  if (recentH === recentL) return null;
  return ((closes[closes.length - 1] - recentL) / (recentH - recentL)) * 100;
}

// ── Master Score & Signal ─────────────────────────────────────────────────

function calculateScore(ohlcv) {
  if (!ohlcv || ohlcv.length < 60) return { score: 50, signal: '中性', reasons: [] };

  const closes  = ohlcv.map(d => d.close);
  const highs   = ohlcv.map(d => d.high);
  const lows    = ohlcv.map(d => d.low);
  const volumes = ohlcv.map(d => d.volume);

  const ema20arr = calcEMA(closes, 20);
  const ema50arr = calcEMA(closes, 50);
  const ema200arr = calcEMA(closes, 200);
  const ema20  = ema20arr[ema20arr.length - 1];
  const ema50  = ema50arr[ema50arr.length - 1];
  const ema200 = ema200arr.find(v => v !== null) ? ema200arr[ema200arr.length - 1] : null;

  const rsi   = calcRSI(closes);
  const macd  = calcMACD(closes);
  const adx   = calcADX(highs, lows, closes);
  const volMA = calcVolumeMA(volumes, 20);
  const boll  = calcBollinger(closes);

  const price   = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const lastVol = volumes[volumes.length - 1];

  let score = 50;
  const reasons = [];

  // Trend: EMA alignment
  if (ema20 && ema50 && ema20 > ema50) { score += 8; reasons.push('EMA20 > EMA50 多頭排列'); }
  if (ema50 && ema200 && ema50 > ema200) { score += 7; reasons.push('EMA50 > EMA200 長線多頭'); }
  if (price > (ema20 || 0)) { score += 5; reasons.push('股價站上 EMA20'); }
  if (price > (ema50 || 0)) { score += 5; reasons.push('股價站上 EMA50'); }
  if (ema200 && price > ema200) { score += 5; reasons.push('股價站上 EMA200'); }

  // Downtrend
  if (ema20 && ema50 && ema20 < ema50) { score -= 8; }
  if (price < (ema20 || Infinity)) { score -= 5; }

  // RSI
  if (rsi !== null) {
    if (rsi >= 50 && rsi < 70) { score += 8; reasons.push(`RSI ${rsi.toFixed(1)} 多頭區間`); }
    else if (rsi >= 70 && rsi < 80) { score += 3; reasons.push(`RSI ${rsi.toFixed(1)} 強勢偏高`); }
    else if (rsi >= 80) { score -= 8; reasons.push(`RSI ${rsi.toFixed(1)} 超買注意`); }
    else if (rsi < 30) { score -= 12; reasons.push(`RSI ${rsi.toFixed(1)} 超賣`); }
    else if (rsi < 40) { score -= 5; }
  }

  // MACD
  if (macd.macd !== null && macd.signal !== null) {
    if (macd.macd > macd.signal) { score += 7; reasons.push('MACD 金叉'); }
    else { score -= 5; }
    if (macd.hist > 0) { score += 3; }
  }

  // ADX
  if (adx !== null) {
    if (adx > 40) { score += 8; reasons.push(`ADX ${adx.toFixed(1)} 強勢趨勢`); }
    else if (adx > 25) { score += 4; reasons.push(`ADX ${adx.toFixed(1)} 趨勢確立`); }
    else { score -= 3; }
  }

  // Volume
  if (volMA && lastVol > volMA * 1.5) { score += 7; reasons.push('成交量大幅放大 (1.5x)'); }
  else if (volMA && lastVol > volMA * 1.2) { score += 4; reasons.push('成交量溫和放大'); }
  else if (volMA && lastVol < volMA * 0.6) { score -= 4; }

  // Bollinger
  if (boll) {
    if (price > boll.upper) { score -= 5; }
    else if (price < boll.lower) { score -= 8; }
    else if (price > boll.middle) { score += 3; }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let signal;
  const bull = parseInt(localStorage.getItem('bull-threshold') || '60');
  const bear = parseInt(localStorage.getItem('bear-threshold') || '40');
  if (score >= bull + 15) signal = '強勢多頭';
  else if (score >= bull) signal = '多頭';
  else if (score <= bear - 10) signal = '強勢空頭';
  else if (score <= bear) signal = '空頭';
  else signal = '中性';

  return { score, signal, reasons, ema20, ema50, ema200, rsi, macd, adx, volMA, boll, price, prevClose, lastVol };
}

// ── Trading Setup ─────────────────────────────────────────────────────────

function generateSetup(ohlcv, analysis) {
  if (!ohlcv || ohlcv.length < 20) return null;
  const lows  = ohlcv.map(d => d.low);
  const highs = ohlcv.map(d => d.high);
  const price = analysis.price;

  const stopLoss = Math.min(...lows.slice(-5)) * 0.99;
  const risk = price - stopLoss;
  if (risk <= 0) return null;

  const rr = 2.0;
  const tp1 = price + risk * rr;
  const tp2 = price + risk * (rr + 1);
  const resistance = Math.max(...highs.slice(-20));

  return {
    entry: price,
    stopLoss,
    tp1: Math.min(tp1, resistance * 1.02),
    tp2,
    risk,
    rr,
    resistance,
  };
}

// ── Reversal Detection ────────────────────────────────────────────────────

function detectReversal(ohlcv, analysis) {
  if (!ohlcv || ohlcv.length < 20) return null;
  const closes = ohlcv.map(d => d.close);
  const { rsi, macd } = analysis;

  // RSI divergence or extreme levels
  const isOversold  = rsi !== null && rsi < 35;
  const isOverbought = rsi !== null && rsi > 72;

  // Price near lower/upper BB
  const boll = analysis.boll;
  const nearLower = boll && closes[closes.length - 1] < boll.lower * 1.01;
  const nearUpper = boll && closes[closes.length - 1] > boll.upper * 0.99;

  // MACD cross hint
  const macdCrossUp = macd?.macd !== null && macd?.signal !== null && macd.macd > macd.signal && macd.hist < 1;

  if ((isOversold || nearLower) && analysis.score < 45) {
    return { type: '超賣反彈', desc: `RSI ${rsi?.toFixed(1) || '--'} 進入超賣`, dir: 'bull' };
  }
  if ((isOverbought || nearUpper) && analysis.score > 65) {
    return { type: '超買回落', desc: `RSI ${rsi?.toFixed(1) || '--'} 進入超買`, dir: 'bear' };
  }
  if (macdCrossUp && analysis.score > 52) {
    return { type: 'MACD 金叉', desc: 'MACD 剛完成金叉', dir: 'bull' };
  }
  return null;
}
