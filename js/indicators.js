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

// ── OBV 能量潮：量能是否確認價格（識破無量假突破 / 隱性吸籌）─────────────
function calcOBV(closes, volumes) {
  const obv = [0];
  for (let i = 1; i < closes.length; i++) {
    const v = volumes[i] || 0;
    obv.push(obv[i-1] + (closes[i] > closes[i-1] ? v : closes[i] < closes[i-1] ? -v : 0));
  }
  return obv;
}

// 線性回歸原始斜率（每根 K 的絕對變化量）
function rawSlope(arr) {
  const n = arr.length;
  if (n < 5) return 0;
  const mx = (n - 1) / 2;
  const my = arr.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - mx) * (arr[i] - my); den += (i - mx) ** 2; }
  return den ? num / den : 0;
}

// 價格斜率：正規化為「每根 K 的漲跌百分比」
function slopePct(arr) {
  const my = arr.reduce((a, b) => a + b, 0) / arr.length;
  return my ? rawSlope(arr) / Math.abs(my) * 100 : 0;
}

// 量價背離：價格與 OBV 走勢相反 = 趨勢缺乏量能支撐（頂背離）或暗中吸貨（底背離）
// OBV 斜率以「平均成交量」正規化（OBV 會跨零，用均值正規化會失真），
// 結果可解讀為：每根 K 淨流入/流出相當於幾倍的日均量。
function detectDivergence(closes, volumes, lookback = 20) {
  if (closes.length < lookback + 5) return null;
  const obv = calcOBV(closes, volumes);
  const pSlope = slopePct(closes.slice(-lookback));
  const vAvg = volumes.slice(-lookback).reduce((a, b) => a + (b || 0), 0) / lookback;
  if (!vAvg) return null;
  const oSlope = rawSlope(obv.slice(-lookback)) / vAvg;

  const P = 0.25, O = 0.15; // 價格 0.25%/根、OBV 0.15 倍日均量/根 為顯著門檻
  if (pSlope > P && oSlope < -O) return { type: 'bear', txt: '量價頂背離：價漲但資金淨流出，追價力道轉弱' };
  if (pSlope < -P && oSlope > O) return { type: 'bull', txt: '量價底背離：價跌但資金默默流入，具止跌訊號' };
  if (pSlope > P && oSlope > O * 2) return { type: 'confirm', txt: '量價同步走揚，上漲有量能確認' };
  return null;
}

// 布林壓縮：通道寬度處於近期極低區間 → 變盤前夕，突破方向常為後續主趨勢
function detectSqueeze(closes, period = 20, lookback = 60) {
  if (closes.length < period + lookback) return null;
  const widths = [];
  for (let i = closes.length - lookback; i < closes.length; i++) {
    const seg = closes.slice(i - period + 1, i + 1);
    const mean = seg.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(seg.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
    widths.push(mean ? (4 * std) / mean * 100 : 0);
  }
  const cur = widths[widths.length - 1];
  const sorted = [...widths].sort((a, b) => a - b);
  const pctRank = sorted.findIndex(w => w >= cur) / widths.length * 100;
  if (pctRank <= 15) return { state: 'squeeze', pctRank, txt: `布林帶寬處近${lookback}日最低 ${pctRank.toFixed(0)}% 區間 — 變盤前夕，等突破表態` };
  if (pctRank >= 85) return { state: 'expansion', pctRank, txt: `波動大幅擴張（帶寬前 ${(100-pctRank).toFixed(0)}%）— 趨勢加速中，勿逆勢` };
  return null;
}

// ── 擺盪點與趨勢結構（道氏理論）─────────────────────────────────────────────
// 專業分析的起點不是指標，而是「高低點結構」：
// 高點越墊越高 + 低點越墊越高 = 上升趨勢；反之為下降趨勢。
function findSwings(ohlcv, span = 3) {
  const hi = [], lo = [];
  for (let i = span; i < ohlcv.length - span; i++) {
    const h = ohlcv[i].high, l = ohlcv[i].low;
    let isH = true, isL = true;
    for (let k = 1; k <= span; k++) {
      if (ohlcv[i-k].high >= h || ohlcv[i+k].high >= h) isH = false;
      if (ohlcv[i-k].low  <= l || ohlcv[i+k].low  <= l) isL = false;
    }
    if (isH) hi.push({ i, v: h, t: ohlcv[i].time });
    if (isL) lo.push({ i, v: l, t: ohlcv[i].time });
  }
  return { hi, lo };
}

// ── 均線結構：排列、位置、糾結、發散、斜率 ────────────────────────────────
// 舊版只做零散加分且多空不對稱（多頭 5 項加分、空頭僅 2 項扣分），
// 導致空頭股票的分數被系統性高估。這裡改為完全對稱，並補上三件事：
//   1. 「完整排列」單獨認定（價 > EMA20 > EMA50 > EMA200 才算真多頭排列）
//   2. K 棒站在幾條均線之上／之下（位置本身就是訊號強度）
//   3. 均線糾結（三線收斂）→ 排列無意義，分數收斂回中性
function maStructure(price, ema20, ema50, ema200, e20Series) {
  if (!ema20 || !ema50) return null;
  const has200 = !!ema200;
  const lines = has200 ? [ema20, ema50, ema200] : [ema20, ema50];

  // 糾結度：均線最大間距佔價格比例，<1.5% 視為黏合（盤整，排列不具意義）
  const spread = (Math.max(...lines) - Math.min(...lines)) / price * 100;
  const tangled = spread < 1.5;

  // K 棒位置：站上幾條均線（-3 ~ +3）
  let above = 0;
  for (const lv of lines) above += price > lv ? 1 : -1;

  const bullStack = has200 ? (price > ema20 && ema20 > ema50 && ema50 > ema200)
                           : (price > ema20 && ema20 > ema50);
  const bearStack = has200 ? (price < ema20 && ema20 < ema50 && ema50 < ema200)
                           : (price < ema20 && ema20 < ema50);

  // EMA20 斜率（10 根）：排列要搭配斜率才是「活的」趨勢
  let slope = 0;
  if (e20Series && e20Series.length > 11) {
    const a = e20Series[e20Series.length - 1], b = e20Series[e20Series.length - 11];
    if (a && b) slope = (a - b) / b * 100;
  }

  let pts = 0, reason = null;
  if (bullStack) { pts += 14; reason = `完整多頭排列（價 > EMA20 > EMA50${has200 ? ' > EMA200' : ''}）`; }
  else if (bearStack) { pts -= 14; reason = `完整空頭排列（價 < EMA20 < EMA50${has200 ? ' < EMA200' : ''}）`; }
  else {
    // 非完整排列：逐條對稱計分
    if (ema20 > ema50) pts += 5; else pts -= 5;
    if (has200) { if (ema50 > ema200) pts += 4; else pts -= 4; }
    reason = ema20 > ema50 ? '短中均線偏多但排列未完整' : '短中均線偏空但排列未完整';
  }

  // 位置分（對稱）
  pts += above * 3;
  const posReason = above === lines.length ? `股價站上全部 ${lines.length} 條均線`
                  : above === -lines.length ? `股價跌破全部 ${lines.length} 條均線`
                  : `股價位於 ${lines.filter(l => price > l).length}/${lines.length} 條均線之上`;

  // 斜率加成（對稱）
  if (slope >= 1) pts += 3; else if (slope <= -1) pts -= 3;

  // 糾結時排列不具意義 → 分數收斂回中性（保留 40%）
  if (tangled) pts = Math.round(pts * 0.4);

  return {
    pts, reason: tangled ? `${reason} — 但三線糾結（間距 ${spread.toFixed(1)}%），排列意義有限` : reason,
    posReason, bullStack, bearStack, tangled, spread: +spread.toFixed(2),
    above, slope: +slope.toFixed(2),
  };
}

// ── 突破與量能確認：帶量進場 vs 無量假突破 vs 高檔出貨 ──────────────────────
// 「突破有沒有量」是多空研判最關鍵的一問，舊版完全沒做。
// 量能倍數 × 收盤在當日振幅的位置 → 區分四種情境。
function detectBreakout(bars) {
  if (!bars || bars.length < 25) return null;
  const n = bars.length, b = bars[n - 1];
  const prior = bars.slice(0, -1);
  const hi20 = Math.max(...prior.slice(-20).map(x => x.high));
  const lo20 = Math.min(...prior.slice(-20).map(x => x.low));
  const hi60 = prior.length >= 60 ? Math.max(...prior.slice(-60).map(x => x.high)) : null;
  const vols = prior.slice(-20).map(x => x.volume || 0);
  const avgV = vols.reduce((a, c) => a + c, 0) / Math.max(1, vols.length);
  if (!(avgV > 0)) return null;
  const volRatio = (b.volume || 0) / avgV;
  const range = b.high - b.low;
  const closePos = range > 0 ? (b.close - b.low) / range : 0.5;   // 收在振幅的哪個位置

  const upBreak = b.close > hi20;
  const dnBreak = b.close < lo20;
  const nearHi = b.high > hi20 && b.close <= hi20;                 // 盤中觸及但收不上去

  if (upBreak) {
    if (volRatio >= 1.5 && closePos >= 0.6)
      return { type: 'breakout-vol', dir: 1, pts: 12, volRatio: +volRatio.toFixed(2),
        txt: `帶量突破${hi60 && b.close > hi60 ? '三個月' : '20日'}高點（量能 ${volRatio.toFixed(1)} 倍、收於高檔）— 多頭進場訊號` };
    if (volRatio < 1.0)
      return { type: 'breakout-novol', dir: 0, pts: -4, volRatio: +volRatio.toFixed(2),
        txt: `突破 20 日高點但量能僅 ${volRatio.toFixed(1)} 倍（量縮）— 無量突破，慎防假突破` };
    return { type: 'breakout-weak', dir: 1, pts: 4, volRatio: +volRatio.toFixed(2),
      txt: `突破 20 日高點（量能 ${volRatio.toFixed(1)} 倍）— 突破成立但量能未明顯放大` };
  }
  if (dnBreak) {
    if (volRatio >= 1.5)
      return { type: 'breakdown-vol', dir: -1, pts: -12, volRatio: +volRatio.toFixed(2),
        txt: `帶量跌破 20 日低點（量能 ${volRatio.toFixed(1)} 倍）— 賣壓宣洩，空方主導` };
    return { type: 'breakdown', dir: -1, pts: -6, volRatio: +volRatio.toFixed(2),
      txt: `跌破 20 日低點（量能 ${volRatio.toFixed(1)} 倍）` };
  }
  // 未突破但爆量 → 判斷是承接還是出貨
  if (volRatio >= 2) {
    if (closePos <= 0.35)
      return { type: 'distribution', dir: -1, pts: -10, volRatio: +volRatio.toFixed(2),
        txt: `爆量 ${volRatio.toFixed(1)} 倍但收在振幅低檔（長上影）— 高檔出貨跡象` };
    if (closePos >= 0.7 && b.close > b.open)
      return { type: 'accumulation', dir: 1, pts: 6, volRatio: +volRatio.toFixed(2),
        txt: `爆量 ${volRatio.toFixed(1)} 倍且收在高檔紅K — 買盤積極承接` };
    return { type: 'churn', dir: 0, pts: -2, volRatio: +volRatio.toFixed(2),
      txt: `爆量 ${volRatio.toFixed(1)} 倍但收盤位置中性 — 多空換手激烈，方向未明` };
  }
  if (nearHi && volRatio >= 1.3)
    return { type: 'failed-break', dir: -1, pts: -8, volRatio: +volRatio.toFixed(2),
      txt: `盤中觸及 20 日高點但收盤未站上（量能 ${volRatio.toFixed(1)} 倍）— 突破失敗，賣壓沉重` };
  return null;
}

// ── ZigZag 擺動點（ATR 自適應門檻）────────────────────────────────────────
// 固定視窗的分形擺動會把雜訊小波動當轉折 → HH/HL 判定被污染。
// 改用「反轉幅度須超過 max(2×ATR, 3%)」的 ZigZag：只留真正的波段轉折。
function zigzagSwings(ohlcv) {
  if (!ohlcv || ohlcv.length < 30) return [];
  const n = ohlcv.length;
  let atr = 0;
  for (let i = Math.max(1, n - 14); i < n; i++)
    atr += Math.max(ohlcv[i].high - ohlcv[i].low,
      Math.abs(ohlcv[i].high - ohlcv[i-1].close), Math.abs(ohlcv[i].low - ohlcv[i-1].close));
  atr /= Math.min(14, n - 1);
  const pivots = [];
  let dir = 0;                       // 1=找高點中 -1=找低點中
  let extI = 0, extV = ohlcv[0].close;
  for (let i = 1; i < n; i++) {
    const b = ohlcv[i];
    const th = Math.max(atr * 2, extV * 0.03);
    if (dir >= 0) {
      if (b.high > extV || dir === 0) { if (b.high > extV) { extV = b.high; extI = i; } }
      if (dir === 0 && b.close < extV - th) { dir = -1; pivots.push({ i: extI, v: extV, type: 'H' }); extV = b.low; extI = i; continue; }
      if (dir === 1 && b.close < extV - th) { pivots.push({ i: extI, v: extV, type: 'H' }); dir = -1; extV = b.low; extI = i; continue; }
      if (dir === 0 && b.close > extV) dir = 1;
    }
    if (dir === -1) {
      if (b.low < extV) { extV = b.low; extI = i; }
      if (b.close > extV + Math.max(atr * 2, extV * 0.03)) { pivots.push({ i: extI, v: extV, type: 'L' }); dir = 1; extV = b.high; extI = i; }
    }
  }
  pivots.push({ i: extI, v: extV, type: dir === -1 ? 'L' : 'H' }); // 進行中的極值
  return pivots;
}

// ── 趨勢判定引擎：市況分類 + 品質 + 成熟度 ─────────────────────────────────
// 五個維度綜合：均線排列與斜率、趨勢持續性、ADX 水平與方向、
// Choppiness（盤整度）、ZigZag 段數 — 輸出可解釋的趨勢判定。
function classifyTrend(ohlcv) {
  if (!ohlcv || ohlcv.length < 60) return null;
  const closes = ohlcv.map(b => b.close), highs = ohlcv.map(b => b.high), lows = ohlcv.map(b => b.low);
  const n = closes.length;
  const e20a = calcEMA(closes, 20), e50a = calcEMA(closes, 50), e200a = calcEMA(closes, 200);
  const price = closes[n-1], e20 = e20a[n-1], e50 = e50a[n-1];
  const e200 = e200a[n-1] || null;
  const slope = (arr, k) => { const a = arr[arr.length-1], b = arr[arr.length-1-k]; return a && b ? (a - b) / b * 100 : 0; };
  const s20 = slope(e20a, 10);                       // EMA20 十日斜率 %
  const s50 = slope(e50a, 15);
  // 趨勢持續性：近 20 根收在 EMA20 上方的比例
  let above = 0;
  for (let i = n - 20; i < n; i++) if (closes[i] > e20a[i]) above++;
  const persist = above / 20;
  // ADX 水平與方向（現在 vs 5 根前）
  const adxNow = calcADX(highs, lows, closes);
  const adxPrev = calcADX(highs.slice(0, -5), lows.slice(0, -5), closes.slice(0, -5));
  const adxRising = adxNow != null && adxPrev != null && adxNow > adxPrev + 1;
  // Choppiness Index（近 20 根）：>61.8 盤整、<38.2 順暢趨勢
  let sumTR = 0;
  for (let i = n - 20; i < n; i++)
    sumTR += Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1]));
  const rng = Math.max(...highs.slice(-20)) - Math.min(...lows.slice(-20));
  const chop = rng > 0 ? 100 * Math.log10(sumTR / rng) / Math.log10(20) : 50;

  // ZigZag 段數：從最近一次結構翻轉起，連續 HH+HL（或 LH+LL）的波段數
  const piv = zigzagSwings(ohlcv);
  let legs = 0, legDir = 0;
  if (piv.length >= 4) {
    const hi = piv.filter(p => p.type === 'H'), lo = piv.filter(p => p.type === 'L');
    for (let k = 1; k < Math.min(hi.length, lo.length); k++) {
      const up = hi[hi.length-k].v > hi[hi.length-k-1]?.v && lo[lo.length-k]?.v > lo[lo.length-k-1]?.v;
      const dn = hi[hi.length-k].v < hi[hi.length-k-1]?.v && lo[lo.length-k]?.v < lo[lo.length-k-1]?.v;
      if (k === 1) { legDir = up ? 1 : dn ? -1 : 0; if (!legDir) break; legs = 1; }
      else if ((legDir > 0 && up) || (legDir < 0 && dn)) legs++;
      else break;
    }
  }

  // 綜合計分
  let pts = 0;
  if (price > e20 && e20 > e50) pts += 2; else if (price < e20 && e20 < e50) pts -= 2;
  if (e200) pts += price > e200 ? 1 : -1;
  pts += s20 >= 0.8 ? 1 : s20 <= -0.8 ? -1 : 0;
  pts += s50 >= 1 ? 0.5 : s50 <= -1 ? -0.5 : 0;
  pts += persist >= 0.75 ? 1 : persist <= 0.25 ? -1 : 0;
  if (adxNow >= 25 && adxRising) pts += price > e20 ? 1 : -1;
  pts += legDir > 0 ? Math.min(legs, 2) * 0.5 : legDir < 0 ? -Math.min(legs, 2) * 0.5 : 0;

  const isChoppy = chop >= 61.8 || (adxNow != null && adxNow < 18 && Math.abs(s20) < 0.5);
  let phase;
  if (isChoppy && Math.abs(pts) < 3.5) phase = 'range';
  else if (pts >= 4.5) phase = 'strong-up';
  else if (pts >= 2) phase = 'up';
  else if (pts <= -4.5) phase = 'strong-down';
  else if (pts <= -2) phase = 'down';
  else phase = 'range';

  const quality = Math.max(0, Math.min(100, Math.round(50 + pts * 8 - Math.max(0, chop - 50))));
  const ext200 = e200 ? +((price - e200) / e200 * 100).toFixed(1) : null;

  // 成熟度：段數 + 乖離年線（末段 = 追價風險最高的階段）
  let maturity = null, maturityTxt = null;
  if (phase === 'up' || phase === 'strong-up') {
    if (legs >= 5 || (ext200 != null && ext200 >= 40)) { maturity = 'late'; maturityTxt = `已走第 ${legs} 段上升${ext200 != null ? `、乖離年線 +${ext200}%` : ''} — 屬末升段，追價風險高、宜守緊停損`; }
    else if (legs >= 3) { maturity = 'main'; maturityTxt = `第 ${legs} 段上升 — 主升段，順勢持有為主`; }
    else { maturity = 'early'; maturityTxt = '趨勢初段 — 若結構確立，上方空間相對較大'; }
  } else if (phase === 'down' || phase === 'strong-down') {
    if (legs >= 5) { maturity = 'late'; maturityTxt = `已走第 ${legs} 段下跌 — 跌勢末段，留意止跌訊號但勿提前接刀`; }
    else if (legs >= 3) { maturity = 'main'; maturityTxt = `第 ${legs} 段下跌 — 主跌段，反彈皆屬逃命波`; }
    else { maturity = 'early'; maturityTxt = '跌勢初段 — 結構剛轉壞，勿急於低接'; }
  }

  const phaseTxt = {
    'strong-up': `強勢上升趨勢（品質 ${quality}/100${adxRising ? '、ADX 走升趨勢增強' : ''}）`,
    'up': `上升趨勢（品質 ${quality}/100）`,
    'range': `盤整市（Choppiness ${chop.toFixed(0)}、ADX ${adxNow?.toFixed(0) ?? '--'}）— 趨勢類訊號此時參考價值低，區間高賣低買為主`,
    'down': `下降趨勢（品質 ${quality}/100）`,
    'strong-down': `強勢下降趨勢（品質 ${quality}/100${adxRising ? '、ADX 走升跌勢增強' : ''}）`,
  }[phase];

  return { phase, phaseTxt, quality, pts: +pts.toFixed(1), legs, legDir, maturity, maturityTxt,
           adx: adxNow != null ? +adxNow.toFixed(1) : null, adxRising, chop: +chop.toFixed(1),
           s20: +s20.toFixed(2), s50: +s50.toFixed(2), persist: Math.round(persist * 100), ext200 };
}

function analyzeStructure(ohlcv) {
  if (!ohlcv || ohlcv.length < 40) return null;
  // 優先用 ATR 自適應 ZigZag（濾掉雜訊擺動）；轉折不足再退回固定視窗分形
  const zz = zigzagSwings(ohlcv.slice(-120));
  let hi = zz.filter(p => p.type === 'H').map(p => ({ i: p.i, v: p.v }));
  let lo = zz.filter(p => p.type === 'L').map(p => ({ i: p.i, v: p.v }));
  if (hi.length < 2 || lo.length < 2) {
    ({ hi, lo } = findSwings(ohlcv.slice(-90)));
  }
  if (hi.length < 2 || lo.length < 2) return null;
  const h2 = hi.slice(-2), l2 = lo.slice(-2);
  const hh = h2[1].v > h2[0].v;   // higher high
  const hl = l2[1].v > l2[0].v;   // higher low

  let type, txt, dir;
  if (hh && hl)        { type = 'uptrend';   dir = 1;  txt = '高點與低點同步墊高 — 標準上升趨勢結構'; }
  else if (!hh && !hl) { type = 'downtrend'; dir = -1; txt = '高點與低點同步下移 — 標準下降趨勢結構'; }
  else if (hh && !hl)  { type = 'expanding'; dir = 0;  txt = '高點墊高但低點下移 — 擴散喇叭型，波動放大且方向未定'; }
  else                 { type = 'contract';  dir = 0;  txt = '高點下移但低點墊高 — 收斂三角，隨時可能選擇方向'; }

  // 結構是否被破壞：跌破前一個擺盪低點 = 上升結構失效
  const last = ohlcv[ohlcv.length - 1].close;
  const brokeUp = type === 'uptrend' && last < l2[1].v;
  const brokeDn = type === 'downtrend' && last > h2[1].v;

  return {
    type, dir, txt,
    lastSwingHigh: +h2[1].v.toFixed(2), lastSwingLow: +l2[1].v.toFixed(2),
    broken: brokeUp || brokeDn,
    brokenTxt: brokeUp ? `已跌破前低 ${l2[1].v.toFixed(2)}，上升結構遭破壞`
             : brokeDn ? `已突破前高 ${h2[1].v.toFixed(2)}，下降結構出現轉機` : null,
  };
}

// ── K 棒型態（單根與雙根，只看最近 3 根以確保時效性）────────────────────────
function detectCandlePatterns(ohlcv) {
  if (!ohlcv || ohlcv.length < 3) return [];
  const out = [];
  const n = ohlcv.length;
  const b = ohlcv[n-1], p = ohlcv[n-2];
  const body = Math.abs(b.close - b.open);
  const range = b.high - b.low;
  if (range <= 0) return out;
  const upperWick = b.high - Math.max(b.open, b.close);
  const lowerWick = Math.min(b.open, b.close) - b.low;
  const bodyPct = body / range;

  // 影線與實體一律以「整根區間」為基準判定。
  // 若用 body 當基準，實體極小（開收同價）時 body×2 = 0，
  // 會讓錘子/流星的條件失效並被誤判為十字星。
  const lowPct = lowerWick / range, upPct = upperWick / range;

  // 錘子：下影至少佔整根 55%、上影極短 → 低檔有買盤強力承接
  if (lowPct >= 0.55 && upPct <= 0.15)
    out.push({ name: '錘子線', dir: 1, txt: '長下影線，低檔遭遇買盤強力承接' });
  // 流星：上影至少佔整根 55%、下影極短 → 高檔賣壓沉重
  else if (upPct >= 0.55 && lowPct <= 0.15)
    out.push({ name: '流星線', dir: -1, txt: '長上影線，高檔賣壓沉重' });
  // 十字星：實體極小且上下影相當（否則屬錘子/流星）
  else if (bodyPct < 0.1 && Math.abs(lowPct - upPct) < 0.3)
    out.push({ name: '十字星', dir: 0, txt: '開收盤幾乎相同，多空陷入平衡，留意變盤' });
  // 吞噬型態：當根實體完全包住前一根且方向相反
  const pBody = Math.abs(p.close - p.open);
  if (body > pBody * 1.1 && pBody > 0) {
    if (b.close > b.open && p.close < p.open && b.close >= p.open && b.open <= p.close)
      out.push({ name: '多頭吞噬', dir: 1, txt: '陽線完全吞噬前一根陰線，買方奪回主導' });
    if (b.close < b.open && p.close > p.open && b.open >= p.close && b.close <= p.open)
      out.push({ name: '空頭吞噬', dir: -1, txt: '陰線完全吞噬前一根陽線，賣方轉強' });
  }
  // 長紅/長黑：實體佔比高且波動大
  const atrApprox = ohlcv.slice(-14).reduce((s, x) => s + (x.high - x.low), 0) / 14;
  if (bodyPct > 0.7 && range > atrApprox * 1.3) {
    out.push(b.close > b.open
      ? { name: '長紅棒', dir: 1, txt: '大實體陽線，買盤一路推升無明顯抵抗' }
      : { name: '長黑棒', dir: -1, txt: '大實體陰線，賣壓一路傾洩' });
  }

  // ── 雙根補充：母子線（內包）、貫穿線／烏雲蓋頂 ──
  if (pBody > 0 && body < pBody * 0.6 && Math.max(b.open, b.close) <= Math.max(p.open, p.close) && Math.min(b.open, b.close) >= Math.min(p.open, p.close)) {
    out.push(p.close < p.open
      ? { name: '多頭母子線', dir: 1, txt: '大陰線後的內包小 K，賣壓竭盡的初步訊號' }
      : { name: '空頭母子線', dir: -1, txt: '大陽線後的內包小 K，攻勢暫歇留意轉弱' });
  }
  if (pBody > 0 && body > pBody * 0.6) {
    const pMid = (p.open + p.close) / 2;
    if (p.close < p.open && b.close > b.open && b.open <= p.close && b.close > pMid && b.close < p.open)
      out.push({ name: '貫穿線', dir: 1, txt: '陽線深入前陰線一半以上，買方展開反攻' });
    if (p.close > p.open && b.close < b.open && b.open >= p.close && b.close < pMid && b.close > p.open)
      out.push({ name: '烏雲蓋頂', dir: -1, txt: '陰線吃掉前陽線一半以上，賣壓明顯轉強' });
  }

  // ── 三根組合：晨星／夜星、紅三兵／三烏鴉 ──
  if (n >= 4) {
    const p2 = ohlcv[n-3];
    const p2Body = Math.abs(p2.close - p2.open);
    const pRange = p.high - p.low;
    const pSmall = pRange > 0 && Math.abs(p.close - p.open) / pRange < 0.35; // 中間星形小實體
    if (p2Body > 0 && pSmall) {
      // 晨星：大陰 → 小實體 → 大陽收復前陰一半以上
      if (p2.close < p2.open && b.close > b.open && body > p2Body * 0.6 && b.close > (p2.open + p2.close) / 2)
        out.push({ name: '晨星', dir: 1, txt: '三根組合止跌反轉：陰線 → 變盤星 → 陽線收復失土' });
      // 夜星：大陽 → 小實體 → 大陰吃掉前陽一半以上
      if (p2.close > p2.open && b.close < b.open && body > p2Body * 0.6 && b.close < (p2.open + p2.close) / 2)
        out.push({ name: '夜星', dir: -1, txt: '三根組合見頂轉弱：陽線 → 變盤星 → 陰線吞回漲幅' });
    }
    // 紅三兵／三烏鴉：連三根同向中大實體、逐步推進
    const trio = [p2, p, b];
    const allUp = trio.every(x => x.close > x.open && (x.high - x.low) > 0 && (x.close - x.open) / (x.high - x.low) >= 0.5)
      && b.close > p.close && p.close > p2.close;
    const allDn = trio.every(x => x.close < x.open && (x.high - x.low) > 0 && (x.open - x.close) / (x.high - x.low) >= 0.5)
      && b.close < p.close && p.close < p2.close;
    if (allUp) out.push({ name: '紅三兵', dir: 1, txt: '連三根中大陽線步步推升，買方接力明確' });
    if (allDn) out.push({ name: '三烏鴉', dir: -1, txt: '連三根中大陰線持續下殺，賣方全面掌控' });
  }
  return out.slice(0, 4);
}

// ── 裸 K 位置語境：最後一根 K 站在什麼位置（支撐/壓力/半空中）────────────────
// 正統價格行為的核心：同一個型態出現在關鍵位置才有意義，半空中的雜訊居多。
function priceActionContext(ohlcv, ema20) {
  if (!ohlcv || ohlcv.length < 20) return null;
  const b = ohlcv[ohlcv.length - 1];
  const price = b.close;
  const sr = calcSR(ohlcv);
  const near = (level) => level > 0 && Math.abs(price - level) / level <= 0.02;
  // 支撐：樞紐支撐、EMA20、前 20 日低
  const lows = ohlcv.slice(-21, -1).map(x => x.low);
  const supCands = [...(sr.supports || []), ema20 || 0, Math.min(...lows)].filter(v => v > 0 && v <= price * 1.02);
  const resCands = [...(sr.resistances || []), Math.max(...ohlcv.slice(-21, -1).map(x => x.high))].filter(v => v >= price * 0.98);
  const sup = supCands.filter(near).sort((a, b2) => b2 - a)[0] ?? null;
  const res = resCands.filter(near).sort((a, b2) => a - b2)[0] ?? null;
  if (sup != null && (res == null || price - sup < res - price)) return { at: 'support', level: +sup.toFixed(2) };
  if (res != null) return { at: 'resistance', level: +res.toFixed(2) };
  return { at: 'mid', level: null };
}

// ── 跳空缺口：未回補缺口 = 最乾淨的支撐壓力（排除除權息缺口）─────────────────
function detectGaps(ohlcv, lookback = 60) {
  if (!ohlcv || ohlcv.length < 10) return { list: [], recent: null };
  const start = Math.max(1, ohlcv.length - lookback);
  const gaps = [];
  for (let i = start; i < ohlcv.length; i++) {
    const b = ohlcv[i], p = ohlcv[i - 1];
    if (b.exDiv) continue; // 除息缺口不是市場行為
    if (b.low > p.high * 1.003) gaps.push({ type: 'up', top: +b.low.toFixed(2), bottom: +p.high.toFixed(2), i, time: b.time });
    else if (b.high < p.low * 0.997) gaps.push({ type: 'down', top: +p.low.toFixed(2), bottom: +b.high.toFixed(2), i, time: b.time });
  }
  // 回補判定：之後任何一根觸及缺口另一端即視為回補
  const unfilled = gaps.filter(g => {
    for (let j = g.i + 1; j < ohlcv.length; j++) {
      if (g.type === 'up' && ohlcv[j].low <= g.bottom) return false;
      if (g.type === 'down' && ohlcv[j].high >= g.top) return false;
    }
    return true;
  });
  const last = ohlcv[ohlcv.length - 1];
  const recent = unfilled.find(g => g.i >= ohlcv.length - 3) || null; // 最近 3 根內的新缺口（突破/竭盡訊號）
  const price = last.close;
  return {
    list: unfilled.map(({ type, top, bottom, time }) => ({ type, top, bottom, time })),
    recent: recent ? { type: recent.type, top: recent.top, bottom: recent.bottom } : null,
    supportGap: unfilled.filter(g => g.type === 'up' && g.top <= price).sort((a, b2) => b2.top - a.top)[0] || null,
    resistGap: unfilled.filter(g => g.type === 'down' && g.bottom >= price).sort((a, b2) => a.bottom - b2.bottom)[0] || null,
  };
}

// ── 假突破偵測（Spring / Upthrust）：勝率最高的裸 K 訊號之一 ─────────────────
// Spring：影線刺破支撐（>0.3%）但收盤收回支撐之上 → 掃完停損單的洗盤，偏多
// Upthrust：影線刺穿壓力但收盤跌回壓力之下 → 誘多出貨，偏空
function detectFalseBreak(ohlcv) {
  if (!ohlcv || ohlcv.length < 25) return null;
  const sr = calcSR(ohlcv);
  const prior = ohlcv.slice(0, -3);
  const lo20 = Math.min(...prior.slice(-20).map(x => x.low));
  const hi20 = Math.max(...prior.slice(-20).map(x => x.high));
  const sups = [...(sr.supports || []), lo20].filter(v => v > 0);
  const ress = [...(sr.resistances || []), hi20].filter(v => v > 0);
  // 只看最近 3 根，訊號要新鮮
  for (let k = ohlcv.length - 1; k >= ohlcv.length - 3; k--) {
    const b = ohlcv[k];
    for (const s0 of sups) {
      if (b.low < s0 * 0.997 && b.close > s0 && ohlcv[ohlcv.length - 1].close > s0)
        return { type: 'spring', level: +s0.toFixed(2), time: b.time,
                 txt: `假跌破反轉（Spring）：影線刺破支撐 ${s0.toFixed(2)} 後收回其上 — 掃停損洗盤特徵，偏多` };
    }
    for (const r0 of ress) {
      if (b.high > r0 * 1.003 && b.close < r0 && ohlcv[ohlcv.length - 1].close < r0)
        return { type: 'upthrust', level: +r0.toFixed(2), time: b.time,
                 txt: `假突破回落（Upthrust）：刺穿壓力 ${r0.toFixed(2)} 後收回其下 — 誘多出貨特徵，偏空` };
    }
  }
  return null;
}

// ── RSI 背離（價格創新高/低但動能未跟上）────────────────────────────────────
function calcRSISeries(closes, period = 14) {
  if (closes.length < period + 2) return [];
  const out = new Array(closes.length).fill(null);
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i-1];
    if (d > 0) g += d; else l -= d;
  }
  let ag = g / period, al = l / period;
  out[period] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i-1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

function detectRSIDivergence(ohlcv, lookback = 60) {
  if (!ohlcv || ohlcv.length < lookback) return null;
  // RSI 必須用「完整序列」計算後再取視窗 —— 若先切片再算，
  // 前 14 根暖身期會是 null，導致視窗內較早的波峰被濾除而漏判背離
  const rsiFull = calcRSISeries(ohlcv.map(d => d.close));
  const start = ohlcv.length - lookback;
  const seg = ohlcv.slice(start);
  const rsi = rsiFull.slice(start);
  const { hi, lo } = findSwings(seg, 3);
  const valid = s => s.filter(x => rsi[x.i] != null).slice(-2);
  const H = valid(hi), L = valid(lo);

  // 價格須「明顯」創高/破低（≥0.8%）才算背離，避免微幅新高就誤判
  const SIG = 0.008;
  if (H.length === 2 && H[1].v > H[0].v * (1 + SIG) && rsi[H[1].i] < rsi[H[0].i] - 3)
    return { type: 'bear', txt: `RSI 頂背離：股價創新高（${H[0].v.toFixed(2)}→${H[1].v.toFixed(2)}）但 RSI 反而走弱（${rsi[H[0].i].toFixed(0)}→${rsi[H[1].i].toFixed(0)}），上漲動能衰竭` };
  if (L.length === 2 && L[1].v < L[0].v * (1 - SIG) && rsi[L[1].i] > rsi[L[0].i] + 3)
    return { type: 'bull', txt: `RSI 底背離：股價破新低（${L[0].v.toFixed(2)}→${L[1].v.toFixed(2)}）但 RSI 已轉強（${rsi[L[0].i].toFixed(0)}→${rsi[L[1].i].toFixed(0)}），下跌動能衰竭` };
  return null;
}

// ── 圖表型態：雙底/雙頂、收斂突破 ────────────────────────────────────────────
function detectChartPattern(ohlcv) {
  if (!ohlcv || ohlcv.length < 50) return null;
  const seg = ohlcv.slice(-90);
  const { hi, lo } = findSwings(seg, 3);
  const price = seg[seg.length - 1].close;

  // 雙底（W）：兩個相近低點且已回升
  if (lo.length >= 2) {
    const [a, b] = lo.slice(-2);
    const diff = Math.abs(a.v - b.v) / a.v;
    if (diff < 0.04 && b.i - a.i >= 8) {
      const neck = Math.max(...seg.slice(a.i, b.i + 1).map(x => x.high));
      if (price > b.v * 1.02)
        return { name: '雙底 W 型', dir: 1, neck: +neck.toFixed(2),
          txt: `兩次於 ${a.v.toFixed(2)} 附近測試不破形成雙底，頸線 ${neck.toFixed(2)}，突破頸線為型態完成訊號` };
    }
  }
  // 雙頂（M）：兩個相近高點且已回落
  if (hi.length >= 2) {
    const [a, b] = hi.slice(-2);
    const diff = Math.abs(a.v - b.v) / a.v;
    if (diff < 0.04 && b.i - a.i >= 8) {
      const neck = Math.min(...seg.slice(a.i, b.i + 1).map(x => x.low));
      if (price < b.v * 0.98)
        return { name: '雙頂 M 型', dir: -1, neck: +neck.toFixed(2),
          txt: `兩次於 ${a.v.toFixed(2)} 附近受阻形成雙頂，頸線 ${neck.toFixed(2)}，跌破頸線確認轉弱` };
    }
  }
  // 收斂三角：高點下移、低點墊高
  if (hi.length >= 2 && lo.length >= 2) {
    const h2 = hi.slice(-2), l2 = lo.slice(-2);
    if (h2[1].v < h2[0].v && l2[1].v > l2[0].v) {
      const rangePct = (h2[1].v - l2[1].v) / price * 100;
      return { name: '收斂三角', dir: 0, upper: +h2[1].v.toFixed(2), lower: +l2[1].v.toFixed(2),
        txt: `高點下移、低點墊高形成收斂（區間 ${l2[1].v.toFixed(2)}~${h2[1].v.toFixed(2)}，寬度 ${rangePct.toFixed(1)}%），突破方向常決定下一波` };
    }
  }
  return null;
}

// ── 費波那契回撤（由最近一段主要波段計算）────────────────────────────────────
function fibLevels(ohlcv) {
  if (!ohlcv || ohlcv.length < 30) return null;
  const seg = ohlcv.slice(-90);
  const highs = seg.map(d => d.high), lows = seg.map(d => d.low);
  const hiIdx = highs.indexOf(Math.max(...highs));
  const loIdx = lows.indexOf(Math.min(...lows));
  const hi = highs[hiIdx], lo = lows[loIdx];
  if (hi <= lo) return null;
  const up = hiIdx > loIdx;   // 低點在前 = 上漲波段，回撤由上往下量
  const price = seg[seg.length - 1].close;
  const lv = r => +(up ? hi - (hi - lo) * r : lo + (hi - lo) * r).toFixed(2);
  const levels = [
    { r: 0.236, v: lv(0.236) }, { r: 0.382, v: lv(0.382) },
    { r: 0.5,   v: lv(0.5)   }, { r: 0.618, v: lv(0.618) },
  ];
  // 目前價格落在哪一段
  const near = levels.reduce((best, x) =>
    Math.abs(price - x.v) < Math.abs(price - best.v) ? x : best, levels[0]);
  return { up, hi: +hi.toFixed(2), lo: +lo.toFixed(2), levels, near,
    txt: up ? `本波自 ${lo.toFixed(2)} 漲至 ${hi.toFixed(2)}，回撤 ${(near.r*100).toFixed(1)}% 位於 ${near.v}`
            : `本波自 ${hi.toFixed(2)} 跌至 ${lo.toFixed(2)}，反彈 ${(near.r*100).toFixed(1)}% 位於 ${near.v}` };
}

// ── 風險指標：最大回撤、報酬波動比、下檔風險 ────────────────────────────────
function riskMetrics(ohlcv) {
  if (!ohlcv || ohlcv.length < 30) return null;
  const closes = ohlcv.slice(-120).map(d => d.close);
  let peak = closes[0], mdd = 0;
  for (const c of closes) { if (c > peak) peak = c; mdd = Math.min(mdd, (c - peak) / peak); }
  const rets = [];
  for (let i = 1; i < closes.length; i++) rets.push(closes[i] / closes[i-1] - 1);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length);
  const down = rets.filter(r => r < 0);
  const dsd = down.length ? Math.sqrt(down.reduce((s, r) => s + r * r, 0) / down.length) : 0;
  const annRet = mean * 252 * 100;
  const annVol = sd * Math.sqrt(252) * 100;
  return {
    mdd: +(mdd * 100).toFixed(1),                 // 最大回撤 %
    annRet: +annRet.toFixed(1),                    // 年化報酬 %
    annVol: +annVol.toFixed(1),                    // 年化波動 %
    sharpe: annVol > 0 ? +(annRet / annVol).toFixed(2) : null,   // 報酬波動比
    downVol: +(dsd * Math.sqrt(252) * 100).toFixed(1),           // 下檔波動 %
  };
}

// ── 量價關係矩陣（四象限）─────────────────────────────────────────────────────
function volumePriceRegime(ohlcv) {
  if (!ohlcv || ohlcv.length < 25) return null;
  const recent = ohlcv.slice(-5);
  const prev = ohlcv.slice(-25, -5);
  const vNow = recent.reduce((s, b) => s + (b.volume || 0), 0) / recent.length;
  const vPrev = prev.reduce((s, b) => s + (b.volume || 0), 0) / prev.length;
  if (!vPrev) return null;
  const volUp = vNow > vPrev * 1.15, volDn = vNow < vPrev * 0.85;
  const pChg = (recent[recent.length-1].close - prev[prev.length-1].close) / prev[prev.length-1].close * 100;
  const priceUp = pChg > 1, priceDn = pChg < -1;

  if (volUp && priceUp)  return { k: '量增價漲', dir: 1,  txt: '價漲量增，買盤積極承接，趨勢健康' };
  if (volUp && priceDn)  return { k: '量增價跌', dir: -1, txt: '價跌量增，賣壓宣洩中，需留意是否為出貨' };
  if (volDn && priceUp)  return { k: '量縮價漲', dir: 0,  txt: '價漲量縮，追價意願不足，漲勢基礎薄弱' };
  if (volDn && priceDn)  return { k: '量縮價跌', dir: 0,  txt: '價跌量縮，賣壓減輕，可能接近打底階段' };
  return { k: '量價持平', dir: 0, txt: '量能與價格皆無明顯變化，觀望氣氛濃厚' };
}

// 精簡趨勢評分：資料根數不足 60 時使用（週線／月線常見）。
// 只用不需長期暖身的指標：均線位置、動能、連續性。
function lightScore(bars) {
  const closes = bars.map(d => d.close);
  const n = closes.length;
  const price = closes[n - 1];
  let score = 50;
  const ma = (p) => n >= p ? closes.slice(-p).reduce((a, b) => a + b, 0) / p : null;
  const ma5 = ma(5), ma10 = ma(10);
  if (ma5 && price > ma5) score += 10;
  else if (ma5) score -= 10;
  if (ma5 && ma10) score += ma5 > ma10 ? 10 : -10;
  // 期間報酬
  const back = Math.min(n - 1, 6);
  const ret = (price - closes[n - 1 - back]) / closes[n - 1 - back] * 100;
  score += Math.max(-15, Math.min(15, ret * 1.2));
  // 連續同向根數（趨勢延續性）
  let streak = 0;
  for (let i = n - 1; i > 0 && i > n - 6; i--) {
    const up = closes[i] > closes[i - 1];
    if (streak === 0) streak = up ? 1 : -1;
    else if ((streak > 0) === up) streak += up ? 1 : -1;
    else break;
  }
  score += Math.max(-8, Math.min(8, streak * 2.5));
  score = Math.max(0, Math.min(100, Math.round(score)));
  const bull = parseInt(localStorage.getItem('bull-threshold') || '60');
  const bear = parseInt(localStorage.getItem('bear-threshold') || '40');
  const signal = score >= bull + 15 ? '強勢多頭' : score >= bull ? '多頭'
               : score <= bear - 10 ? '強勢空頭' : score <= bear ? '空頭' : '中性';
  return { score, signal };
}

// ── 多空力道對比：上漲日與下跌日的量能結構 ─────────────────────────────────
// 同樣的均量，若集中在上漲日代表買方主導；集中在下跌日則是賣壓宣洩。
function volumeForce(ohlcv, lookback = 20) {
  if (!ohlcv || ohlcv.length < lookback + 1) return null;
  const seg = ohlcv.slice(-lookback);
  let upVol = 0, dnVol = 0, upDays = 0, dnDays = 0;
  for (let i = 1; i < seg.length; i++) {
    const v = seg[i].volume || 0;
    if (seg[i].close > seg[i-1].close) { upVol += v; upDays++; }
    else if (seg[i].close < seg[i-1].close) { dnVol += v; dnDays++; }
  }
  const total = upVol + dnVol;
  if (!total) return null;
  const buyPct = upVol / total * 100;
  const avgUp = upDays ? upVol / upDays : 0;
  const avgDn = dnDays ? dnVol / dnDays : 0;
  const ratio = avgDn > 0 ? avgUp / avgDn : null;
  let txt, dir;
  if (buyPct >= 60) { dir = 1; txt = `近${lookback}日成交量有 ${buyPct.toFixed(0)}% 集中在上漲日，買方主導明顯`; }
  else if (buyPct <= 40) { dir = -1; txt = `近${lookback}日成交量有 ${(100-buyPct).toFixed(0)}% 集中在下跌日，賣壓主導`; }
  else { dir = 0; txt = `上漲日與下跌日量能相當（買方 ${buyPct.toFixed(0)}%），多空拉鋸`; }
  return { buyPct: +buyPct.toFixed(1), ratio: ratio ? +ratio.toFixed(2) : null, upDays, dnDays, dir, txt };
}

// ── 價格位階：現價位於歷史區間的百分位 ───────────────────────────────────────
function pricePercentile(ohlcv, lookback = 250) {
  if (!ohlcv || ohlcv.length < 40) return null;
  const seg = ohlcv.slice(-lookback).map(d => d.close);
  const price = seg[seg.length - 1];
  const below = seg.filter(c => c < price).length;
  const pct = below / seg.length * 100;
  const days = seg.length;
  let zone, txt;
  if (pct >= 90) { zone = 'high'; txt = `位於近${days}日區間的高檔 ${pct.toFixed(0)}% 位階，追高需留意回檔風險`; }
  else if (pct >= 70) { zone = 'upper'; txt = `位於近${days}日區間偏高的 ${pct.toFixed(0)}% 位階`; }
  else if (pct <= 10) { zone = 'low'; txt = `位於近${days}日區間的低檔 ${pct.toFixed(0)}% 位階，接近長期底部區`; }
  else if (pct <= 30) { zone = 'lower'; txt = `位於近${days}日區間偏低的 ${pct.toFixed(0)}% 位階`; }
  else { zone = 'mid'; txt = `位於近${days}日區間中段 ${pct.toFixed(0)}% 位階`; }
  return { pct: +pct.toFixed(0), zone, days, txt,
           hi: +Math.max(...seg).toFixed(2), lo: +Math.min(...seg).toFixed(2) };
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
  const stoch = calcStoch(highs, lows, closes);
  const diverg = detectDivergence(closes, volumes);
  const squeeze = detectSqueeze(closes);
  const structure = analyzeStructure(ohlcv);
  const candles = detectCandlePatterns(ohlcv);
  const rsiDiv = detectRSIDivergence(ohlcv);
  const pattern = detectChartPattern(ohlcv);
  const fib = fibLevels(ohlcv);
  const risk = riskMetrics(ohlcv);
  const vpRegime = volumePriceRegime(ohlcv);
  const vForce = volumeForce(ohlcv);
  const pctile = pricePercentile(ohlcv);
  const paCtx = priceActionContext(ohlcv, ema20arr[ema20arr.length - 1]);
  const gaps = detectGaps(ohlcv);
  const falseBreak = detectFalseBreak(ohlcv);
  const trend = classifyTrend(ohlcv);
  const maStruct = maStructure(closes[closes.length - 1], ema20, ema50, ema200, ema20arr);
  const brk = detectBreakout(ohlcv);

  const price   = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const lastVol = volumes[volumes.length - 1];

  let score = 50;
  const reasons = [];

  // Trend: 均線結構（多空對稱計分 —— 舊版空頭只扣兩項，形成嚴重多頭偏誤）
  if (maStruct) {
    score += maStruct.pts;
    if (maStruct.reason) reasons.push(maStruct.reason);
    if (maStruct.posReason) reasons.push(maStruct.posReason);
  }
  // 突破與量能確認：帶量突破加分、無量假突破與高檔出貨扣分
  if (brk) {
    score += brk.pts;
    reasons.push(brk.txt);
  }

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

  // Stochastic %K：多方動能確認 / 高低檔警示
  if (stoch !== null) {
    if (stoch > 85) { score -= 4; reasons.push(`KD %K ${stoch.toFixed(0)} 高檔鈍化`); }
    else if (stoch >= 50) { score += 3; reasons.push(`KD %K ${stoch.toFixed(0)} 多方`); }
    else if (stoch < 20) { score -= 3; }
  }

  // 20 日動能：中期趨勢延續性
  if (closes.length >= 21) {
    const ret20 = (price - closes[closes.length - 21]) / closes[closes.length - 21] * 100;
    if (ret20 > 8) { score += 4; reasons.push(`20日漲幅 +${ret20.toFixed(1)}% 動能強勁`); }
    else if (ret20 > 3) { score += 2; }
    else if (ret20 < -8) { score -= 4; }
  }

  // 量價背離：頂背離是最常見的假突破前兆，權重給高一些
  if (diverg) {
    if (diverg.type === 'bear') { score -= 7; reasons.push('⚠ 量價頂背離'); }
    else if (diverg.type === 'bull') { score += 5; reasons.push('量價底背離（暗中吸籌）'); }
    else if (diverg.type === 'confirm') { score += 4; reasons.push('量價同步確認'); }
  }
  // 波動擴張且順勢 → 趨勢加速；壓縮則不加減分（方向未定）
  if (squeeze?.state === 'expansion' && price > (ema20 || 0)) { score += 3; reasons.push('波動擴張且站上均線'); }

  // 趨勢結構（道氏理論）—— 高低點結構比任何指標都根本
  if (structure) {
    if (structure.type === 'uptrend') { score += 6; reasons.push('高低點同步墊高（上升結構）'); }
    else if (structure.type === 'downtrend') { score -= 6; reasons.push('高低點同步下移（下降結構）'); }
    if (structure.broken) { score -= 4; reasons.push('趨勢結構遭破壞'); }
  }
  // RSI 背離：動能衰竭的領先訊號，權重高於一般指標
  if (rsiDiv?.type === 'bear') { score -= 8; reasons.push('RSI 頂背離，上漲動能衰竭'); }
  else if (rsiDiv?.type === 'bull') { score += 6; reasons.push('RSI 底背離，下跌動能衰竭'); }
  // 圖表型態
  if (pattern?.dir === 1) { score += 4; reasons.push(pattern.name); }
  else if (pattern?.dir === -1) { score -= 4; reasons.push(pattern.name); }
  // K 棒型態（取方向一致的最強一項，避免多根型態重複加分）
  const cDir = candles.reduce((acc, c) => acc + c.dir, 0);
  if (cDir > 0) { score += 2; reasons.push(candles.find(c => c.dir > 0).name); }
  else if (cDir < 0) { score -= 2; reasons.push(candles.find(c => c.dir < 0).name); }
  // 量價關係
  if (vpRegime?.dir === 1) score += 2;
  else if (vpRegime?.dir === -1) score -= 2;
  // 多空力道：量能集中在上漲日或下跌日
  if (vForce?.dir === 1) { score += 3; reasons.push(`量能 ${vForce.buyPct}% 集中在上漲日`); }
  else if (vForce?.dir === -1) { score -= 3; reasons.push('量能集中在下跌日'); }
  // 價格位階：極端高檔追價風險、極端低檔具反彈空間
  if (pctile?.zone === 'high') score -= 3;
  else if (pctile?.zone === 'low') score += 2;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let signal;
  const bull = parseInt(localStorage.getItem('bull-threshold') || '60');
  const bear = parseInt(localStorage.getItem('bear-threshold') || '40');
  if (score >= bull + 15) signal = '強勢多頭';
  else if (score >= bull) signal = '多頭';
  else if (score <= bear - 10) signal = '強勢空頭';
  else if (score <= bear) signal = '空頭';
  else signal = '中性';

  return { score, signal, reasons, ema20, ema50, ema200, rsi, macd, adx, volMA, boll, stoch,
           diverg, squeeze, structure, candles, rsiDiv, pattern, fib, risk, vpRegime,
           vForce, pctile, paCtx, gaps, falseBreak, trend, maStruct, brk, price, prevClose, lastVol };
}

// ── Trading Setup ─────────────────────────────────────────────────────────

function generateSetup(ohlcv, analysis) {
  if (!ohlcv || ohlcv.length < 20) return null;
  const lows  = ohlcv.map(d => d.low);
  const highs = ohlcv.map(d => d.high);
  const price = analysis.price;

  // Stop multiplier auto-tuned by the trade-log learning system (default 0.99 = 1% below 5d low)
  const stopAdj = parseFloat(localStorage.getItem('stop-adj') || '0.99');
  const stopLoss = Math.min(...lows.slice(-5)) * stopAdj;
  const risk = price - stopLoss;
  if (risk <= 0) return null;

  const rr = 2.0;
  const tp1 = price + risk * rr;
  const tp2 = price + risk * (rr + 1);
  const resistance = Math.max(...highs.slice(-20));

  // ATR(14)：衡量止損距離是否符合正常波動（太緊易被洗、太鬆虧損放大）
  let atr = null;
  if (ohlcv.length >= 15) {
    const trs = [];
    for (let i = ohlcv.length - 14; i < ohlcv.length; i++) {
      trs.push(Math.max(
        ohlcv[i].high - ohlcv[i].low,
        Math.abs(ohlcv[i].high - ohlcv[i - 1].close),
        Math.abs(ohlcv[i].low - ohlcv[i - 1].close),
      ));
    }
    atr = trs.reduce((a, b) => a + b, 0) / trs.length;
  }

  return {
    entry: price,
    stopLoss,
    tp1: Math.min(tp1, resistance * 1.02),
    tp2,
    risk,
    rr,
    resistance,
    atr,
    stopAdj,
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
