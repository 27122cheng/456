// ── API — Taiwan Stocks via allorigins + Yahoo Finance + TWSE ─────────────

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok ? res : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// Multi-proxy fallback with adaptive ordering:
// 第一優先 = 自家 Vercel Serverless 代理（/api/proxy，穩定無限流）；
// 第三方免費 proxy 只作為備援。上次成功的 proxy 記在 localStorage 優先使用。
const PROXIES = [
  { name: 'self',      wrap: e => `/api/proxy?url=${e}`,                      json: r => r.json(), text: r => r.text() },
  { name: 'ao-raw',    wrap: e => `https://api.allorigins.win/raw?url=${e}`,  json: r => r.json(), text: r => r.text() },
  { name: 'corsproxy', wrap: e => `https://corsproxy.io/?url=${e}`,           json: r => r.json(), text: r => r.text() },
  { name: 'codetabs',  wrap: e => `https://api.codetabs.com/v1/proxy?quest=${e}`, json: r => r.json(), text: r => r.text() },
  { name: 'ao-get',    wrap: e => `https://api.allorigins.win/get?url=${e}`,
    json: async r => { const j = await r.json(); return j?.contents ? JSON.parse(j.contents) : null; },
    text: async r => (await r.json())?.contents ?? null },
];

// 熔斷器：連續失敗 2 次的 proxy（被限流/掛掉）冷卻 5 分鐘，
// 並持久化到 localStorage — 重新整理頁面不會又去試已知掛掉的來源。
const _proxyFail = (() => {
  try { return JSON.parse(localStorage.getItem('proxy-fail') || '{}'); } catch { return {}; }
})();
function _proxySave() {
  try { localStorage.setItem('proxy-fail', JSON.stringify(_proxyFail)); } catch {}
}
function _proxyUsable(p) {
  const f = _proxyFail[p.name];
  return !f || f.n < 2 || Date.now() > f.until;
}
function _proxyMark(p, ok) {
  if (ok) { if (_proxyFail[p.name]) { delete _proxyFail[p.name]; _proxySave(); } return; }
  const f = _proxyFail[p.name] || { n: 0, until: 0 };
  f.n++;
  if (f.n >= 2) f.until = Date.now() + 5 * 60 * 1000;
  _proxyFail[p.name] = f;
  _proxySave();
}

// 整體資料源熔斷：某個上游（如 TWSE 全市場行情）失敗後，
// N 分鐘內所有頁面都直接跳過，不再重複空等 → 這是「跑不動」的主因
function srcDead(name) {
  try { return Date.now() < (JSON.parse(localStorage.getItem('src-dead') || '{}')[name] || 0); } catch { return false; }
}
function srcMarkDead(name, minutes = 10) {
  try {
    const m = JSON.parse(localStorage.getItem('src-dead') || '{}');
    m[name] = Date.now() + minutes * 60 * 1000;
    localStorage.setItem('src-dead', JSON.stringify(m));
  } catch {}
}
// 診斷用：清空所有 in-flight/記憶體快取，讓下一輪請求真正重打
function resetSourceState() {
  _dayAllPromise = null; _dayAllResolved = null;
  _t86Memo = null; _t86Promise = null; _t86Fields = null;
  _marginMemo = null; _marginPromise = null;
  _fundAllPromise = null; _revPromise = null; _finPromise = null;
  _turnoverPromise = null; _bsPromise = null; _alertPromise = null;
  Object.keys(_proxyFail).forEach(k => delete _proxyFail[k]);
  _ohlcvInflight.clear();
}

function srcMarkAlive(name) {
  try {
    const m = JSON.parse(localStorage.getItem('src-dead') || '{}');
    if (m[name]) { delete m[name]; localStorage.setItem('src-dead', JSON.stringify(m)); }
  } catch {}
}

function proxyOrder() {
  const usable = PROXIES.filter(_proxyUsable);
  const arr = usable.length ? [...usable] : [...PROXIES]; // 全部熔斷時仍然全試
  // 自家代理永遠最優先（熔斷時自動退位，例如本機 file:// 開發沒有 /api）
  const selfIdx = arr.findIndex(p => p.name === 'self');
  if (selfIdx > 0) arr.unshift(arr.splice(selfIdx, 1)[0]);
  // 其餘按上次成功者排序
  const pref = localStorage.getItem('proxy-pref');
  const idx = arr.findIndex(p => p.name === pref);
  if (idx > 0 && arr[idx].name !== 'self' && arr[0].name === 'self') {
    const [p] = arr.splice(idx, 1); arr.splice(1, 0, p);
  } else if (idx > 0 && arr[0].name !== 'self') {
    arr.unshift(arr.splice(idx, 1)[0]);
  }
  return arr;
}

// 取回原始 Response（含非 2xx），以便分辨「代理故障」與「上游拒絕」
async function rawFetch(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { const res = await fetch(url, { signal: controller.signal }); clearTimeout(timer); return res; }
  catch { clearTimeout(timer); return null; }
}

async function proxyFetch(url, timeout = 5000) {
  const enc = encodeURIComponent(url);
  for (const p of proxyOrder()) {
    const res = await rawFetch(p.wrap(enc), timeout);
    if (!res) { _proxyMark(p, false); continue; }   // 連不上 = 代理本身有問題
    // 上游拒絕（Yahoo 對雲端 IP 常回 429/403）不能算在代理頭上，
    // 否則自家代理會被熔斷，連帶讓證交所等正常來源也被跳過
    if (!res.ok) {
      if (res.status !== 429 && res.status !== 403 && res.status !== 404) _proxyMark(p, false);
      continue;
    }
    try {
      const data = await p.json(res);
      if (data) { _proxyMark(p, true); localStorage.setItem('proxy-pref', p.name); return data; }
    } catch {}
    _proxyMark(p, false);
  }
  return null;
}

// 取回純文字（RSS / XML 用）
async function proxyFetchText(url, timeout = 8000) {
  const enc = encodeURIComponent(url);
  for (const p of proxyOrder()) {
    const res = await rawFetch(p.wrap(enc), timeout);
    if (!res) { _proxyMark(p, false); continue; }
    // 同 proxyFetch：上游拒絕不算代理故障
    if (!res.ok) {
      if (res.status !== 429 && res.status !== 403 && res.status !== 404) _proxyMark(p, false);
      continue;
    }
    try {
      const txt = await p.text(res);
      if (txt && txt.length > 50) { _proxyMark(p, true); localStorage.setItem('proxy-pref', p.name); return txt; }
    } catch {}
    _proxyMark(p, false);
  }
  return null;
}

// ── localStorage 快取（大幅減少重複請求）───────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000; // 行情快取 5 分鐘

function cacheGet(key, ttl = CACHE_TTL) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > ttl) return null;
    return data;
  } catch { return null; }
}

// 陳舊備援：正常 TTL 已過期，但資料還在 24 小時內 → 拿舊資料頂著（總比整頁空白好）
function cacheGetStale(key, maxAge = 24 * 60 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > maxAge) return null;
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  const val = JSON.stringify({ t: Date.now(), data });
  try {
    localStorage.setItem(key, val);
  } catch {
    // 空間滿了 → 從最舊的快取開始淘汰（100 檔的月 K 快取量大，
    // 全清會讓每輪掃描都重抓 → 改成汰舊留新，命中率高很多）
    try {
      const ks = Object.keys(localStorage).filter(k => k.startsWith('cache:'))
        .map(k => { let t = 0; try { t = JSON.parse(localStorage.getItem(k))?.t || 0; } catch {} return { k, t }; })
        .sort((a, b) => a.t - b.t);
      for (let i = 0; i < ks.length; i++) {
        localStorage.removeItem(ks[i].k);
        if (i % 20 === 19 || i === ks.length - 1) {
          try { localStorage.setItem(key, val); return; } catch {}
        }
      }
    } catch {}
  }
}

// ── Yahoo Finance ─────────────────────────────────────────────────────────

function tsToDate(ts) {
  const d = new Date(ts * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

// 分鐘級需要保留時分，否則同一天的每根 K 都會是相同字串 → 座標與去重全錯
const isIntradayTF = tf => /^\d+m$|^\d+h$|^60m$/.test(tf);
function tsToLabel(ts, interval) {
  if (!isIntradayTF(interval)) return tsToDate(ts);
  const d = new Date(ts * 1000);
  // 以台北時間顯示（使用者所在市場時區）
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

async function fetchYahooOHLCV(symbol, interval = '1d', range = '6mo') {
  const key = `cache:ohlcv:${symbol}:${interval}:${range}`;
  // Yahoo 整體被限流時直接跳過，不必每檔股票都重試（省下大量等待）
  if (srcDead('yahoo')) return cacheGetStale(key, 72 * 60 * 60 * 1000) || [];
  // 日線盤中只有最後一根 K 會變 → 10 分鐘快取；分鐘級變動快 → 2 分鐘
  const ttl = isIntradayTF(interval) ? 2 * 60 * 1000
            : (interval === '1d' || interval === '1wk') ? 10 * 60 * 1000 : CACHE_TTL;
  const cached = cacheGet(key, ttl);
  if (cached) return cached;

  // events=div：取得除息事件（日期+金額），標記在對應 K 棒上 —
  // 未還原股價在除息日會出現假跳空，停損判定與訊號結算需要跳過該缺口
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&events=div`;
  const data = await proxyFetch(url);
  const result = data?.chart?.result?.[0];
  if (!result) {
    srcMarkDead('yahoo', 10);   // 10 分鐘內不再嘗試 Yahoo
    return cacheGetStale(key, 72 * 60 * 60 * 1000) || [];
  }
  srcMarkAlive('yahoo');
  const { timestamp, indicators } = result;
  const q = indicators.quote[0];
  const divDates = new Map(); // 'YYYY-MM-DD' → 息值
  if (interval === '1d' && result.events?.dividends) {
    for (const d of Object.values(result.events.dividends)) {
      const ts = d.date || d.timestamp;
      if (ts) divDates.set(tsToLabel(ts, '1d'), d.amount ?? null);
    }
  }
  const ohlcv = timestamp.map((ts, i) => {
    const time = tsToLabel(ts, interval);
    const bar = {
      time,
      open:   q.open[i]   ? +q.open[i].toFixed(2)   : null,
      high:   q.high[i]   ? +q.high[i].toFixed(2)   : null,
      low:    q.low[i]    ? +q.low[i].toFixed(2)     : null,
      close:  q.close[i]  ? +q.close[i].toFixed(2)   : null,
      volume: q.volume[i] || 0,
    };
    if (divDates.has(time)) { bar.exDiv = true; bar.divAmt = divDates.get(time); }
    return bar;
  }).filter(d => d.open && d.close);
  if (ohlcv.length) cacheSet(key, ohlcv);
  return ohlcv;
}

// ── TWSE / TPEx 官方全市場當日行情 ─────────────────────────────────────────
// 官方 Open API 支援 CORS（不需要 proxy！），一個請求涵蓋整個市場的當日 OHLCV。
// 這是最可靠的價格來源 — Yahoo/proxy 全掛時，價格顯示仍然正常。

let _dayAllPromise = null;

// 官方來源直抓（支援 CORS）→ 失敗才退 proxy；並對整體來源做熔斷
async function officialJSON(url, srcName, timeout = 6000) {
  if (srcDead(srcName)) return null;
  const res = await fetchWithTimeout(url, timeout);
  if (res) { try { const j = await res.json(); if (j) { srcMarkAlive(srcName); return j; } } catch {} }
  const viaProxy = await proxyFetch(url, timeout);
  if (viaProxy) { srcMarkAlive(srcName); return viaProxy; }
  srcMarkDead(srcName, 10);
  return null;
}

async function fetchTWDayAll() {
  if (_dayAllPromise) return _dayAllPromise; // in-flight 去重：掃描 worker 並行時只抓一次
  _dayAllPromise = (async () => {
    const key = 'cache:dayall';
    const cached = cacheGet(key, 10 * 60 * 1000);
    if (cached) { _dayAllResolved = cached; return cached; }

    const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
    const map = {};

    // 上市與上櫃並行抓，互不等待（過去是序列 → 時間加倍）
    const [twse, tpex] = await Promise.all([
      officialJSON('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL', 'twse-day').catch(() => null),
      officialJSON('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes', 'tpex-day').catch(() => null),
    ]);

    for (const r of twse || []) {
      const close = num(r.ClosingPrice);
      if (!r.Code || close == null) continue;
      map[r.Code] = {
        open: num(r.OpeningPrice) ?? close, high: num(r.HighestPrice) ?? close,
        low: num(r.LowestPrice) ?? close, close,
        volume: num(r.TradeVolume) ?? 0, chg: num(r.Change),
        name: r.Name || null, // 供「輸入中文名稱找代號」使用
      };
    }
    for (const r of tpex || []) {
      const close = num(r.Close);
      if (!r.SecuritiesCompanyCode || close == null) continue;
      map[r.SecuritiesCompanyCode] = {
        open: num(r.Open) ?? close, high: num(r.High) ?? close,
        low: num(r.Low) ?? close, close,
        volume: num(r.TradingShares) ?? 0, chg: num(r.Change),
        name: r.CompanyName || null,
      };
    }

    if (Object.keys(map).length) { cacheSet(key, map); _dayAllResolved = map; return map; }
    const stale = cacheGetStale(key, 72 * 60 * 60 * 1000); // 全失敗 → 舊資料頂著
    if (stale) _dayAllResolved = stale;
    return stale;
  })();
  const result = await _dayAllPromise;
  if (!result) _dayAllPromise = null; // 失敗不要黏住，下次重試
  return result;
}

// 台北時間（使用者可能在其他時區開網頁）
function twNow() {
  try { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })); }
  catch { return new Date(); }
}

// 把官方當日行情合併進 Yahoo 歷史：更新今日 bar 或補上缺的今日 bar
// → 就算 Yahoo 快取是 10 分鐘前甚至昨天的，最後一根 K 棒仍是最新官方數據
function mergeOfficialBar(ohlcv, q) {
  if (!q?.close || !ohlcv?.length) return ohlcv;
  const tw = twNow();
  const dow = tw.getDay();
  // STOCK_DAY_ALL 是「盤後收盤行情」，盤中取得的其實是前一交易日資料 ——
  // 14:00 前合併等於把昨日收盤當成今日價格（即時性失真的主因）。
  // 盤中價格改由 MIS 批次即時報價提供（見 fetchRealtimeBatch）。
  if (dow === 0 || dow === 6 || tw.getHours() < 14) return ohlcv;
  const todayStr = `${tw.getFullYear()}-${String(tw.getMonth()+1).padStart(2,'0')}-${String(tw.getDate()).padStart(2,'0')}`;
  const last = ohlcv[ohlcv.length - 1];
  if (last.time === todayStr) {
    Object.assign(last, { open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume });
  } else if (last.time < todayStr && !(q.close === last.close && q.volume === last.volume)) {
    // close+volume 與前一根完全相同 = 官方資料還是昨天的（今日休市），不要重複補
    ohlcv.push({ time: todayStr, open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume });
  }
  return ohlcv;
}

// ── 證交所官方日線歷史（Yahoo 全掛時的備援）─────────────────────────────────
// STOCK_DAY 每次回傳一個月。過去月份的資料永不變動 → 快取 7 天，
// 只有當月需要重抓，因此第二次之後的掃描成本極低。
function rocToISO(d) {
  const m = String(d).trim().match(/^(\d{2,3})\/(\d{2})\/(\d{2})$/);
  if (!m) return null;
  return `${+m[1] + 1911}-${m[2]}-${m[3]}`;
}

async function fetchTWSEMonth(stockId, year, month) {
  const ym = `${year}${String(month).padStart(2, '0')}`;
  const key = `cache:sd:${stockId}:${ym}`;
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const cached = cacheGet(key, isCurrent ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const url = `https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY?date=${ym}01&stockNo=${stockId}&response=json`;
  const j = await proxyFetch(url, 7000).catch(() => null);
  if (!j?.data?.length) return null;
  const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
  // 欄位：日期,成交股數,成交金額,開盤價,最高價,最低價,收盤價,漲跌價差,成交筆數
  // 除權息日的「漲跌價差」帶 X 記號（官方標記）→ 標記該 K 棒，供缺口還原使用
  const bars = j.data.map(r => {
    const time = rocToISO(r[0]);
    const close = num(r[6]);
    if (!time || close == null) return null;
    const bar = { time, open: num(r[3]) ?? close, high: num(r[4]) ?? close,
                  low: num(r[5]) ?? close, close, volume: num(r[1]) ?? 0 };
    if (/X/i.test(String(r[7] ?? ''))) bar.exDiv = true;
    return bar;
  }).filter(Boolean);
  if (!bars.length) return null;
  cacheSet(key, bars);
  return bars;
}

// 抓最近 N 個月併成連續日線（預設 7 個月 ≈ 140 根，足夠 EMA50/RSI/MACD/ADX）
async function fetchTWSEHistory(stockId, months = 14) {
  const now = new Date();
  const reqs = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    reqs.push(fetchTWSEMonth(stockId, d.getFullYear(), d.getMonth() + 1));
  }
  const parts = await Promise.all(reqs.map(p => p.catch(() => null)));
  const seen = new Set();
  const bars = [];
  for (const part of parts) {
    for (const b of part || []) {
      if (seen.has(b.time)) continue;
      seen.add(b.time);
      bars.push(b);
    }
  }
  bars.sort((a, b) => a.time.localeCompare(b.time));
  return bars;
}

// 上櫃個股官方日線（櫃買中心 tradingStock 按月版）— 上櫃股在 Yahoo 限流時的唯一備援
// 欄位：日期,成交仟股,成交仟元,開盤,最高,最低,收盤,漲跌,筆數（成交量單位為仟股 → ×1000 換算成股）
async function fetchTPExMonth(stockId, year, month) {
  const ym = `${year}${String(month).padStart(2, '0')}`;
  const key = `cache:td:${stockId}:${ym}`;
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const cached = cacheGet(key, isCurrent ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const url = `https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock?code=${stockId}&date=${year}/${String(month).padStart(2, '0')}/01&response=json`;
  const j = await proxyFetch(url, 7000).catch(() => null);
  // 新版 RWD 回 tables[0].data；舊版回 aaData — 兩種都接
  const rows = j?.tables?.[0]?.data || j?.aaData || j?.data || null;
  if (!rows?.length) return null;
  const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
  const bars = rows.map(r => {
    const time = rocToISO(r[0]);
    const close = num(r[6]);
    if (!time || close == null) return null;
    const bar = { time, open: num(r[3]) ?? close, high: num(r[4]) ?? close,
                  low: num(r[5]) ?? close, close, volume: (num(r[1]) ?? 0) * 1000 };
    // 櫃買的漲跌欄在除權息日顯示「除息/除權/X」字樣
    if (/[X除]/i.test(String(r[7] ?? ''))) bar.exDiv = true;
    return bar;
  }).filter(Boolean);
  if (!bars.length) return null;
  cacheSet(key, bars);
  return bars;
}

async function fetchTPExHistory(stockId, months = 14) {
  const now = new Date();
  const reqs = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    reqs.push(fetchTPExMonth(stockId, d.getFullYear(), d.getMonth() + 1));
  }
  const parts = await Promise.all(reqs.map(p => p.catch(() => null)));
  const seen = new Set();
  const bars = [];
  for (const part of parts) {
    for (const b of part || []) {
      if (seen.has(b.time)) continue;
      seen.add(b.time);
      bars.push(b);
    }
  }
  bars.sort((a, b) => a.time.localeCompare(b.time));
  return bars;
}

// 加權指數官方日線歷史（FMTQIK 按月版）— 供 Beta／相關性／相對強弱計算
// 欄位：日期,成交股數,成交金額,成交筆數,發行量加權股價指數,漲跌點數
async function fetchTWIIMonth(year, month) {
  const ym = `${year}${String(month).padStart(2, '0')}`;
  const key = `cache:twii:${ym}`;
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const cached = cacheGet(key, isCurrent ? 30 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const j = await proxyFetch(`https://www.twse.com.tw/rwd/zh/afterTrading/FMTQIK?date=${ym}01&response=json`, 7000).catch(() => null);
  if (!j?.data?.length) return null;
  const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
  const bars = j.data.map(r => {
    const time = rocToISO(r[0]);
    const close = num(r[4]);
    return time && close != null ? { time, close, amount: num(r[2]) ?? 0, chg: num(r[5]) } : null;
  }).filter(Boolean);
  if (!bars.length) return null;
  cacheSet(key, bars);
  return bars;
}

// 加權指數官方日線「開高低收」（MI_5MINS_HIST 每日彙總，比 FMTQIK 多了開高低）
async function fetchTWIIOHLCMonth(year, month) {
  const ym = `${year}${String(month).padStart(2, '0')}`;
  const key = `cache:twiix:${ym}`;
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const cached = cacheGet(key, isCurrent ? 20 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
  if (cached) return cached;

  const j = await proxyFetch(`https://www.twse.com.tw/rwd/zh/TAIEX/MI_5MINS_HIST?date=${ym}01&response=json`, 7000).catch(() => null);
  if (!j?.data?.length) return null;
  const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
  const bars = j.data.map(r => {
    const time = rocToISO(r[0]);
    const close = num(r[4]);
    if (!time || close == null) return null;
    return { time, open: num(r[1]) ?? close, high: num(r[2]) ?? close, low: num(r[3]) ?? close, close, volume: 0 };
  }).filter(Boolean);
  if (!bars.length) return null;
  cacheSet(key, bars);
  return bars;
}

// 大盤指數日線（含開高低收）— 官方優先，Yahoo 僅作備援
async function fetchTWIIOHLC(months = 2) {
  const now = new Date();
  const parts = await Promise.all(
    Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return fetchTWIIOHLCMonth(d.getFullYear(), d.getMonth() + 1).catch(() => null);
    })
  );
  const seen = new Set(), bars = [];
  for (const p of parts) for (const b of p || []) {
    if (!seen.has(b.time)) { seen.add(b.time); bars.push(b); }
  }
  bars.sort((a, b) => a.time.localeCompare(b.time));
  return bars;
}

async function fetchTWIIHistory(months = 5) {
  const now = new Date();
  const parts = await Promise.all(
    Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return fetchTWIIMonth(d.getFullYear(), d.getMonth() + 1).catch(() => null);
    })
  );
  const seen = new Set(), bars = [];
  for (const p of parts) for (const b of p || []) {
    if (!seen.has(b.time)) { seen.add(b.time); bars.push(b); }
  }
  bars.sort((a, b) => a.time.localeCompare(b.time));
  return bars;
}

// 由日線聚合月線（台灣官方無免費分鐘 K，改用可靠的月線取代 60 分）
function aggregateMonthly(daily) {
  const out = [];
  let cur = null;
  for (const b of daily) {
    const ym = b.time.slice(0, 7);
    if (!cur || cur.time !== ym) {
      cur = { time: ym, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume || 0 };
      out.push(cur);
    } else {
      cur.high = Math.max(cur.high, b.high);
      cur.low = Math.min(cur.low, b.low);
      cur.close = b.close;
      cur.volume += b.volume || 0;
    }
  }
  return out;
}

// Taiwan stock — append ".TW" (TWSE listed) or ".TWO" (TPEx/OTC)
function yahooSymbol(stockId) {
  return `${stockId}.TW`;
}

// 官方當日行情：只有「已經抓好」時才拿來合併，永不阻塞個股 K 線
let _dayAllResolved = null;

const _ohlcvInflight = new Map(); // 同一檔同時被多處請求時只發一次
const ohlcvFailReason = {};       // 掃描失敗原因（stockId → 說明文字），供 UI 呈現

async function fetchStockOHLCV(stockId, interval = '1d', range = '6mo') {
  const ikey = `${stockId}:${interval}:${range}`;
  if (_ohlcvInflight.has(ikey)) return _ohlcvInflight.get(ikey);
  const task = (async () => {
    // 記住哪些股票是上櫃（.TWO），下次直接抓對的，不用先等 .TW 失敗
    const suffixKey = `sym-suffix:${stockId}`;
    const knownSuffix = localStorage.getItem(suffixKey);
    let ohlcv = [];
    if (knownSuffix === 'TWO') {
      ohlcv = await fetchYahooOHLCV(`${stockId}.TWO`, interval, range);
    }
    if (!ohlcv.length) {
      ohlcv = await fetchYahooOHLCV(yahooSymbol(stockId), interval, range);
      if (!ohlcv.length) {
        const two = await fetchYahooOHLCV(`${stockId}.TWO`, interval, range);
        if (two.length) localStorage.setItem(suffixKey, 'TWO');
        ohlcv = two;
      }
    }
    // Yahoo 全掛時改用官方日線，確保技術分析不中斷：
    // 上市走證交所 STOCK_DAY、上櫃走櫃買中心 tradingStock（先前只有上市備援 →
    // Yahoo 被限流時上櫃自選股整檔掃不出來）。市場別確認一次後記住，下次直接走對的來源。
    if (!ohlcv.length && interval === '1d') {
      const mkt = localStorage.getItem(`mkt:${stockId}`);
      const tpexFirst = mkt === 'tpex' || knownSuffix === 'TWO';
      const trySrc = tpexFirst
        ? [['tpex', fetchTPExHistory], ['twse', fetchTWSEHistory]]
        : [['twse', fetchTWSEHistory], ['tpex', fetchTPExHistory]];
      for (const [name, fn] of trySrc) {
        ohlcv = await fn(stockId).catch(() => []);
        if (ohlcv.length) {
          localStorage.setItem(`mkt:${stockId}`, name);
          if (name === 'tpex') localStorage.setItem(suffixKey, 'TWO');
          break;
        }
      }
    }
    // 記錄失敗原因，供掃描結果與個股頁說明「為什麼掃不出來」
    if (!ohlcv.length && interval === '1d') {
      ohlcvFailReason[stockId] = srcDead('yahoo')
        ? 'Yahoo 行情被限流，且上市（證交所）與上櫃（櫃買中心）官方歷史日 K 均查無此代號 — 可能是興櫃、新上市未滿月或已下市股票，暫無日 K 可分析'
        : 'Yahoo 與上市/上櫃官方歷史日 K 均查無此代號 — 請確認代號是否正確（興櫃與已下市股票無官方日 K）';
    } else if (ohlcv.length) {
      delete ohlcvFailReason[stockId];
    }
    // 日線：若官方當日行情「已就緒」才刷新最後一根 K 棒；尚未就緒就直接回傳，
    // 絕不等待（過去每檔都 await 全市場行情 → 整站卡死的主因）
    if (interval === '1d' && ohlcv.length && _dayAllResolved) {
      try { mergeOfficialBar(ohlcv, _dayAllResolved[stockId]); } catch {}
    }
    return ohlcv;
  })();
  _ohlcvInflight.set(ikey, task);
  try { return await task; } finally { _ohlcvInflight.delete(ikey); }
}

// Fetch TWII (加權指數) for market overview — 官方優先，Yahoo 備援
async function fetchTWII() {
  const official = await fetchTWIIOHLC(2).catch(() => []);
  if (official?.length >= 2) return official;
  return fetchYahooOHLCV('^TWII', '1d', '5d');
}

// 由收盤價序列算出 {price, chg1, chg5}
function quoteFromCloses(closes) {
  if (!closes || closes.length < 2) return null;
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const w = closes.length >= 6 ? closes[closes.length - 6] : closes[0];
  if (!last || !prev || !w) return null;
  return { price: last, chg1: (last - prev) / prev * 100, chg5: (last - w) / w * 100 };
}

// Stooq 備援（Yahoo 對雲端 IP 常限流；Stooq 提供免費 CSV，經自家代理取回）
const STOOQ_SYM = {
  '^TWII': '^twse', '^SOX': '^sox', '^GSPC': '^spx',
  '^IXIC': '^ndq', '^DJI': '^dji', '^VIX': '^vix', 'TWD=X': 'usdtwd',
  // 隔夜訊號：台積電 ADR 與台灣 ETF（美股時段交易，反映台股開盤預期）
  'TSM': 'tsm.us', 'EWT': 'ewt.us',
};

async function fetchStooqCloses(sym) {
  const s = STOOQ_SYM[sym];
  if (!s) return null;
  const key = `cache:stooq:${s}`;
  const cached = cacheGet(key, 30 * 60 * 1000);
  if (cached) return cached;
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`;
  const csv = await proxyFetchText(url, 7000).catch(() => null);
  if (!csv || !/^Date/i.test(csv.trim())) return null;
  const closes = csv.trim().split('\n').slice(1)
    .map(line => parseFloat(line.split(',')[4]))
    .filter(v => isFinite(v) && v > 0)
    .slice(-30);
  if (closes.length < 2) return null;
  cacheSet(key, closes);
  return closes;
}

// 加權指數優先用證交所官方資料（FMTQIK 本就含每日指數，無須依賴 Yahoo）
async function fetchTWIIQuoteOfficial() {
  const rows = await fetchMarketTurnover().catch(() => null);
  if (!rows?.length) return null;
  const closes = rows.map(r => r.index).filter(v => isFinite(v) && v > 0);
  return quoteFromCloses(closes);
}

// Fetch a single index quote: 官方(僅台股) → Yahoo → Stooq 三層備援
// ── TDCC 集保戶股權分散表（每週公布）───────────────────────────────────────
// 官方每週公布各股「持股分級」的人數與股數占比。千張大戶持股比率的變化，
// 比單日法人買賣超更穩定的大戶進出證據 —— 且官方一次給完整快照，
// 不像 T86 需要本機逐日累積。
// 防禦式解析：欄位名模糊比對；級距邊界不寫死 —— 以「排序後最高級距
// （排除合計列）」認定千張大戶，避免官方調整級距數量時整段解析錯誤。
let _tdccPromise = null;

async function fetchTDCCAll(ids) {
  if (_tdccPromise) return _tdccPromise;
  _tdccPromise = (async () => {
    const key = 'cache:tdcc';
    const cached = cacheGet(key, 3 * 24 * 60 * 60 * 1000);   // 週更資料 → 快取 3 天
    if (cached) return cached;
    const stale = () => cacheGetStale(key, 21 * 24 * 60 * 60 * 1000); // 最多用 3 週前的舊資料
    if (srcDead('tdcc')) return stale();

    const rows = await officialJSON('https://opendata.tdcc.com.tw/getOD.ashx?id=1-5', 'tdcc', 15000)
      .catch(() => null);
    if (!Array.isArray(rows) || !rows.length) return stale();

    // 欄位名模糊比對（官方欄位名曾變動，且有全形/英文版本）
    const sample = rows[0];
    const findKey = (re) => Object.keys(sample).find(k => re.test(k)) || null;
    const kId = findKey(/證券代號|股票代號|Code|證券代碼/i);
    const kLvl = findKey(/分級|Level|級距/i);
    const kPct = findKey(/比例|占集保|Percent|Ratio/i);
    const kPpl = findKey(/人數|People|Holder/i);
    const kDate = findKey(/日期|Date/i);
    if (!kId || !kLvl || !kPct) { srcMarkDead('tdcc', 60); return stale(); }

    const want = ids instanceof Set ? ids : new Set(ids || []);
    const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
    const byId = {};
    let dataDate = null;
    for (const r of rows) {
      const id = String(r[kId] ?? '').trim();
      if (!/^\d{4,6}$/.test(id)) continue;
      if (want.size && !want.has(id)) continue;           // 只留掃描清單，避免佔滿儲存空間
      const lvl = num(r[kLvl]);
      const pct = num(r[kPct]);
      if (lvl == null || pct == null) continue;
      (byId[id] = byId[id] || []).push({ lvl, pct, ppl: num(r[kPpl]) ?? null });
      if (!dataDate && kDate) dataDate = String(r[kDate] ?? '').trim();
    }
    if (!Object.keys(byId).length) { srcMarkDead('tdcc', 60); return stale(); }

    const iso = /^\d{8}$/.test(dataDate || '')
      ? `${dataDate.slice(0,4)}-${dataDate.slice(4,6)}-${dataDate.slice(6,8)}`
      : (dataDate || new Date().toISOString().slice(0, 10));

    const out = {};
    for (const [id, lv] of Object.entries(byId)) {
      lv.sort((a, b) => a.lvl - b.lvl);
      // 合計列：占比接近 100 者（官方通常放在最後一級）
      const totalRow = lv.find(x => x.pct >= 99.5) || null;
      const data = lv.filter(x => x !== totalRow);
      if (!data.length) continue;
      const big = +data[data.length - 1].pct.toFixed(2);        // 最高級距 = 千張(1,000,001股)以上
      // 400 張以上需要級距邊界對得上：官方為 15 級時，最高 4 級即 400 張以上
      const mid = data.length === 15
        ? +data.slice(-4).reduce((n, x) => n + x.pct, 0).toFixed(2) : null;
      const retail = +data.slice(0, 2).reduce((n, x) => n + x.pct, 0).toFixed(2); // 最低兩級 ≈ 散戶
      out[id] = { d: iso, big, mid, retail, holders: totalRow?.ppl ?? null, levels: data.length };
    }
    if (!Object.keys(out).length) return stale();
    srcMarkAlive('tdcc');
    cacheSet(key, out);
    return out;
  })();
  try { return await _tdccPromise; } finally { _tdccPromise = null; }
}

// ── 隔夜訊號：台積電 ADR + 台灣 ETF（EWT）─────────────────────────────────
// 台積電佔加權指數約三成，其 ADR 於美股時段交易，是台股開盤方向最直接的
// 領先指標。另計 ADR 溢價率：1 ADR = 5 股普通股，換算成台幣後與 2330
// 收盤比較 — 溢價擴大代表外資對台積電評價高於台股現價（開盤有補漲壓力）。
async function fetchOvernightSignals(tsmcClose) {
  const key = 'cache:overnight';
  const cached = cacheGet(key, 20 * 60 * 1000);
  if (cached) return cached;

  const [adr, ewt, fx] = await Promise.all([
    fetchIndexQuote('TSM').catch(() => null),
    fetchIndexQuote('EWT').catch(() => null),
    fetchIndexQuote('TWD=X').catch(() => null),
  ]);
  if (!adr && !ewt) return null;

  const out = { adr: null, ewt: null, premium: null };
  if (adr?.price) out.adr = { price: +adr.price.toFixed(2), chg1: +adr.chg1.toFixed(2), chg5: +adr.chg5.toFixed(2) };
  if (ewt?.price) out.ewt = { price: +ewt.price.toFixed(2), chg1: +ewt.chg1.toFixed(2), chg5: +ewt.chg5.toFixed(2) };
  // 溢價率需要匯率與 2330 收盤；缺任一項就不給（不猜）
  if (adr?.price && fx?.price > 0 && tsmcClose > 0) {
    const impliedTWD = adr.price * fx.price / 5;   // 1 ADR = 5 股
    out.premium = +((impliedTWD / tsmcClose - 1) * 100).toFixed(2);
    out.impliedTWD = +impliedTWD.toFixed(1);
    out.fxRate = +fx.price.toFixed(3);
  }
  cacheSet(key, out);
  return out;
}

async function fetchIndexQuote(sym) {
  if (sym === '^TWII') {
    const official = await fetchTWIIQuoteOfficial().catch(() => null);
    if (official) return official;
  }
  const data = await fetchYahooOHLCV(sym, '1d', '1mo');
  const q = quoteFromCloses(data.map(d => d.close));
  if (q) return q;
  const stooq = await fetchStooqCloses(sym).catch(() => null);
  return stooq ? quoteFromCloses(stooq) : null;
}

// ── TWSE Institutional T86（全表快取：每日只抓一次）─────────────────────────

function parseK(s) {
  return Math.round((parseInt(String(s).replace(/,/g, ''), 10) || 0) / 1000);
}

let _t86Memo = null; // in-memory：同一個頁面生命週期共用

// 最近 N 個「可能的交易日」（跳過週末），供官方逐日 API 回溯用
function recentTradingDays(n = 3) {
  const out = [];
  const base = new Date();
  for (let back = 0; back <= 9 && out.length < n; back++) {
    const d = new Date(base);
    d.setDate(d.getDate() - back);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    out.push({
      ymd: `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`,
      iso: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
    });
  }
  return out;
}

let _t86Promise = null;
let _t86Fields = null;

// 用 TWSE 回應的欄位名稱定位（寫死索引極易出錯：欄位 7 是「外資自營商」不是投信、
// 欄位 11 是自營商不是三大法人合計）。找不到 fields 時退回官方文件的正確索引。
function t86ColIdx() {
  const f = _t86Fields;
  const find = (...keys) => {
    if (!Array.isArray(f)) return -1;
    for (const k of keys) {
      const i = f.findIndex(name => typeof name === 'string' && name.replace(/\s/g, '').includes(k));
      if (i >= 0) return i;
    }
    return -1;
  };
  const foreign = find('外陸資買賣超股數(不含外資自營商)', '外資買賣超股數');
  const investment = find('投信買賣超股數');
  // 「自營商買賣超股數」總計欄（避免抓到「自行買賣」或「避險」子欄）
  const dealer = (() => {
    if (!Array.isArray(f)) return -1;
    const i = f.findIndex(n => typeof n === 'string' && n.replace(/\s/g, '') === '自營商買賣超股數');
    return i >= 0 ? i : find('自營商買賣超股數');
  })();
  const total = find('三大法人買賣超股數');
  return {
    foreign:    foreign    >= 0 ? foreign    : 4,
    investment: investment >= 0 ? investment : 10,
    dealer:     dealer     >= 0 ? dealer     : 11,
    total:      total      >= 0 ? total      : 18,
  };
}

// 解析成 {id, name, foreign, investment, dealer, total}（單位：張）
function parseT86Row(r, idx) {
  const id = String(r[0] ?? '').trim();
  const foreign = parseK(r[idx.foreign]);
  const investment = parseK(r[idx.investment]);
  const dealer = parseK(r[idx.dealer]);
  // 合計欄若缺，用三者相加（比抓錯欄位可靠）
  const rawTotal = r[idx.total];
  const total = rawTotal != null && rawTotal !== '' ? parseK(rawTotal) : foreign + investment + dealer;
  return { id, name: String(r[1] ?? '').trim(), foreign, investment, dealer, total };
}

// 全市場法人資料（已正確解析）
// 只保留真正的股票／ETF：4 位數個股、或 00 開頭的 ETF。
// 純數字 6 位代號多為權證，若計入會讓全市場買賣超加總嚴重灌水。
function isRealStockId(id) {
  return /^\d{4}$/.test(id) || /^00\d{2,4}$/.test(id);
}

async function fetchT86Parsed() {
  const rows = await fetchT86All();
  if (!rows?.length) return null;
  const idx = t86ColIdx();
  return rows.map(r => parseT86Row(r, idx)).filter(p => isRealStockId(p.id));
}

async function fetchT86All() {
  if (_t86Memo) return _t86Memo;
  if (_t86Promise) return _t86Promise;
  _t86Promise = (async () => {
    const days = recentTradingDays(3);
    // 先看快取（零成本）
    for (const { ymd, iso } of days) {
      const cached = cacheGet(`cache:t86:${ymd}`, 60 * 60 * 1000);
      if (cached) {
        _t86Memo = cached;
        _t86Fields = cacheGet(`cache:t86f:${ymd}`, 24 * 60 * 60 * 1000) || null;
        localStorage.setItem('t86-last-date', iso);
        return cached;
      }
    }
    if (srcDead('t86')) return null;
    // 三天並行探測，誰先有資料就用誰（過去是序列 × 12 秒逾時 → 最壞數分鐘）
    const results = await Promise.all(days.map(async ({ ymd, iso }) => {
      try {
        const data = await proxyFetch(`https://www.twse.com.tw/rwd/zh/fund/T86?date=${ymd}&selectType=ALLBUT0999&response=json`, 6000);
        return data?.data?.length ? { rows: data.data, fields: data.fields, ymd, iso } : null;
      } catch { return null; }
    }));
    const hit = results.find(Boolean); // days 已由新到舊排序
    if (hit) {
      _t86Memo = hit.rows;
      _t86Fields = hit.fields || null;
      cacheSet(`cache:t86:${hit.ymd}`, hit.rows);
      if (hit.fields) cacheSet(`cache:t86f:${hit.ymd}`, hit.fields);
      localStorage.setItem('t86-last-date', hit.iso);
      srcMarkAlive('t86');
      return hit.rows;
    }
    srcMarkDead('t86', 10);
    // 探測失敗 → 用 72 小時內的舊快取頂著（週末/來源暫時異常時面板不再開天窗）
    for (const { ymd } of recentTradingDays(5)) {
      const stale = cacheGetStale(`cache:t86:${ymd}`, 72 * 60 * 60 * 1000);
      if (stale) {
        _t86Memo = stale;
        _t86Fields = cacheGetStale(`cache:t86f:${ymd}`, 72 * 60 * 60 * 1000) || null;
        return stale;
      }
    }
    return null;
  })();
  const r = await _t86Promise;
  if (!r) _t86Promise = null;
  return r;
}

// 單檔法人：直接查快取的全表，不再重複下載整份 T86
async function fetchInstitutional(stockId) {
  const table = await fetchT86All();
  if (!table) return null;
  const row = table.find(r => r[0]?.trim() === stockId);
  if (!row) return null;
  const { id, name, ...vals } = parseT86Row(row, t86ColIdx());
  return vals;
}

// ── TWSE / TPEx 官方估值資料（本益比 / 殖利率 / 股價淨值比）─────────────────
// Yahoo v7/v10 報價 API 已改為需要 crumb 憑證（匿名請求一律 401，走任何 proxy 都一樣），
// 改用證交所 BWIBBU_ALL + 櫃買中心 peratio_analysis：全市場一次抓、官方數據、支援 CORS。

let _fundAllPromise = null;

async function fetchTWFundAll() {
  if (_fundAllPromise) return _fundAllPromise;
  _fundAllPromise = (async () => {
    const key = 'cache:fundall';
    const cached = cacheGet(key, 60 * 60 * 1000); // 每日更新一次，快取 1 小時
    if (cached) return cached;

    const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
    const map = {};

    // 上市 BWIBBU_ALL 與上櫃 peratio_analysis 並行抓
    const [twse, tpex] = await Promise.all([
      officialJSON('https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_ALL', 'twse-fund').catch(() => null),
      officialJSON('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_peratio_analysis', 'tpex-fund').catch(() => null),
    ]);
    for (const r of twse || []) {
      if (!r.Code) continue;
      const dy = num(r.DividendYield);
      map[r.Code] = { pe: num(r.PEratio), pb: num(r.PBratio), divYield: dy != null ? dy / 100 : null };
    }
    for (const r of tpex || []) {
      const id = r.SecuritiesCompanyCode;
      if (!id) continue;
      const dy = num(r.YieldRatio);
      map[id] = { pe: num(r.PriceEarningRatio), pb: num(r.PriceBookRatio), divYield: dy != null ? dy / 100 : null };
    }

    if (Object.keys(map).length) { cacheSet(key, map); return map; }
    return cacheGetStale(key, 72 * 60 * 60 * 1000);
  })();
  const result = await _fundAllPromise;
  if (!result) _fundAllPromise = null; // 失敗不要黏住，下次重試
  return result;
}

async function fetchTWFundamentals(stockId) {
  const all = await fetchTWFundAll();
  return all?.[stockId] || null;
}

// ── 大盤成交量能（分辨「無量下跌」與「爆量止跌」）─────────────────────────
// TWSE FMTQIK：近一個月每日成交股數/金額/加權指數/漲跌點數
let _turnoverPromise = null;

async function fetchMarketTurnover() {
  if (_turnoverPromise) return _turnoverPromise;
  _turnoverPromise = (async () => {
    const key = 'cache:turnover';
    const cached = cacheGet(key, 30 * 60 * 1000);
    if (cached) return cached;
    // openapi 無此端點（診斷實測「無資料」）→ 改用 rwd 按月版，
    // 欄位：日期,成交股數,成交金額,成交筆數,發行量加權股價指數,漲跌點數
    const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
    const now = new Date();
    const months = await Promise.all([1, 0].map(back => {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
      return proxyFetch(`https://www.twse.com.tw/rwd/zh/afterTrading/FMTQIK?date=${ym}01&response=json`, 7000).catch(() => null);
    }));
    const rows = months.filter(Boolean).flatMap(j => j?.data || []);
    if (!rows.length) return cacheGetStale(key, 72 * 60 * 60 * 1000);
    const parsed = rows.map(r => ({
      date: rocToISO(r[0]) || String(r[0] ?? '').trim(),
      amount: num(r[2]),
      index: num(r[4]),
      chg: num(r[5]),
    })).filter(r => r.amount != null && r.index != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!parsed.length) return cacheGetStale(key, 72 * 60 * 60 * 1000);
    cacheSet(key, parsed);
    return parsed;
  })();
  const r = await _turnoverPromise;
  if (!r) _turnoverPromise = null;
  return r;
}

// 量價研判：今日量能 vs 20 日均量，配合指數漲跌，判斷這根 K 的性質
function analyzeTurnover(rows) {
  if (!rows?.length) return null;
  const recent = rows.slice(-20);
  if (recent.length < 5) return null;
  const last = recent[recent.length - 1];
  const avg = recent.reduce((s, r) => s + r.amount, 0) / recent.length;
  const ratio = avg ? last.amount / avg : 1;
  const up = (last.chg ?? 0) >= 0;
  let verdict, tone;
  if (!up && ratio < 0.8) { verdict = '無量下跌 — 賣壓不重但買盤觀望，易緩跌打底'; tone = 'neutral'; }
  else if (!up && ratio > 1.3) { verdict = '爆量下跌 — 恐慌賣壓宣洩，留意是否落底'; tone = 'bear'; }
  else if (up && ratio > 1.3) { verdict = '帶量上攻 — 買盤積極，漲勢有量能支撐'; tone = 'bull'; }
  else if (up && ratio < 0.8) { verdict = '無量上漲 — 追價意願不足，反彈力道存疑'; tone = 'neutral'; }
  else { verdict = '量能持平，多空拉鋸'; tone = 'neutral'; }
  return { amount: last.amount, avg, ratio, up, chg: last.chg, index: last.index, date: last.date, verdict, tone };
}

// ── 月營收（台股最重要的即時基本面指標）──────────────────────────────────
// 證交所 t187ap05_L（上市）+ 櫃買 mopsfin_t187ap05_O（上櫃），全市場一次抓。
// 欄位名稱以關鍵字比對，避免官方調整欄位名時整組失效。
let _revPromise = null;

function pickNum(obj, ...keys) {
  for (const k of keys) {
    const hit = Object.keys(obj).find(n => n.replace(/\s/g, '').includes(k));
    if (hit != null) {
      const v = parseFloat(String(obj[hit]).replace(/,/g, ''));
      if (isFinite(v)) return v;
    }
  }
  return null;
}

async function fetchRevenueAll() {
  if (_revPromise) return _revPromise;
  _revPromise = (async () => {
    const key = 'cache:revall';
    const cached = cacheGet(key, 6 * 60 * 60 * 1000); // 月營收每月更新，快取 6 小時
    if (cached) return cached;

    const [twse, tpex] = await Promise.all([
      officialJSON('https://openapi.twse.com.tw/v1/opendata/t187ap05_L', 'twse-rev', 8000).catch(() => null),
      officialJSON('https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap05_O', 'tpex-rev', 8000).catch(() => null),
    ]);

    const map = {};
    for (const r of [...(twse || []), ...(tpex || [])]) {
      const id = String(r['公司代號'] ?? r['SecuritiesCompanyCode'] ?? '').trim();
      if (!/^\d{4,6}$/.test(id)) continue;
      const yoy = pickNum(r, '去年同月增減', '營收成長率');
      const mom = pickNum(r, '上月比較增減');
      const cumYoy = pickNum(r, '前期比較增減', '累計營業收入-去年同期增減');
      const rev = pickNum(r, '當月營收');
      const ym = String(r['資料年月'] ?? '').trim();
      if (yoy == null && rev == null) continue;
      map[id] = { yoy, mom, cumYoy, rev, ym };
    }
    if (Object.keys(map).length) { cacheSet(key, map); return map; }
    return cacheGetStale(key, 30 * 24 * 60 * 60 * 1000); // 月資料，舊一點也有價值
  })();
  const r = await _revPromise;
  if (!r) _revPromise = null;
  return r;
}

async function fetchRevenue(stockId) {
  const all = await fetchRevenueAll();
  return all?.[stockId] || null;
}

// ── 季度財報（綜合損益表：營收、毛利、淨利、EPS）──────────────────────────
// TWSE t187ap06_L_ci（上市一般業）+ TPEx mopsfin_t187ap06_O_ci（上櫃）
let _finPromise = null;

async function fetchFinancialsAll() {
  if (_finPromise) return _finPromise;
  _finPromise = (async () => {
    const key = 'cache:finall';
    const cached = cacheGet(key, 12 * 60 * 60 * 1000); // 季報更新頻率低，快取 12 小時
    if (cached) return cached;

    // 綜合損益表依產業別分為多支端點，僅抓「一般業」會漏掉金融/保險/證券等
    // （先前只有 89 檔即為此故）。逐一嘗試，不存在的端點靜默略過。
    const IND = ['ci', 'basi', 'bd', 'fh', 'ins', 'mim'];
    const reqs = [];
    for (const g of IND) {
      reqs.push(officialJSON(`https://openapi.twse.com.tw/v1/opendata/t187ap06_L_${g}`, `twse-fin-${g}`, 9000).catch(() => null));
      reqs.push(officialJSON(`https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap06_O_${g}`, `tpex-fin-${g}`, 9000).catch(() => null));
    }
    const parts = await Promise.all(reqs);
    const rows = parts.filter(Array.isArray).flat();

    const map = {};
    for (const r of rows) {
      const id = String(r['公司代號'] ?? r['SecuritiesCompanyCode'] ?? '').trim();
      if (!/^\d{4,6}$/.test(id)) continue;
      const revenue = pickNum(r, '營業收入');
      const gross   = pickNum(r, '營業毛利');
      const opInc   = pickNum(r, '營業利益');
      const netInc  = pickNum(r, '本期淨利', '稅後淨利');
      const eps     = pickNum(r, '基本每股盈餘', '每股盈餘');
      if (revenue == null && eps == null) continue;
      map[id] = {
        year: String(r['年度'] ?? '').trim(),
        quarter: String(r['季別'] ?? '').trim(),
        revenue, gross, opInc, netInc, eps,
        grossMargin: revenue > 0 && gross != null ? gross / revenue * 100 : null,
        opMargin:    revenue > 0 && opInc != null ? opInc / revenue * 100 : null,
        netMargin:   revenue > 0 && netInc != null ? netInc / revenue * 100 : null,
      };
    }
    if (Object.keys(map).length) { cacheSet(key, map); return map; }
    return cacheGetStale(key, 30 * 24 * 60 * 60 * 1000);
  })();
  const r = await _finPromise;
  if (!r) _finPromise = null;
  return r;
}

async function fetchFinancials(stockId) {
  const all = await fetchFinancialsAll();
  return all?.[stockId] || null;
}

// ── 資產負債表（ROE、負債比、每股淨值等財務體質指標）────────────────────────
let _bsPromise = null;

async function fetchBalanceSheetAll() {
  if (_bsPromise) return _bsPromise;
  _bsPromise = (async () => {
    const key = 'cache:bsall';
    const cached = cacheGet(key, 12 * 60 * 60 * 1000);
    if (cached) return cached;

    const IND = ['ci', 'basi', 'bd', 'fh', 'ins', 'mim'];
    const reqs = [];
    for (const g of IND) {
      reqs.push(officialJSON(`https://openapi.twse.com.tw/v1/opendata/t187ap07_L_${g}`, `twse-bs-${g}`, 9000).catch(() => null));
      reqs.push(officialJSON(`https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap07_O_${g}`, `tpex-bs-${g}`, 9000).catch(() => null));
    }
    const rows = (await Promise.all(reqs)).filter(Array.isArray).flat();

    const map = {};
    for (const r of rows) {
      const id = String(r['公司代號'] ?? r['SecuritiesCompanyCode'] ?? '').trim();
      if (!/^\d{4,6}$/.test(id)) continue;
      const assets = pickNum(r, '資產總額', '資產總計');
      const liab   = pickNum(r, '負債總額', '負債總計');
      const equity = pickNum(r, '權益總額', '權益總計', '股東權益總額');
      const bps    = pickNum(r, '每股參考淨值', '每股淨值');
      if (assets == null && equity == null) continue;
      map[id] = {
        year: String(r['年度'] ?? '').trim(),
        quarter: String(r['季別'] ?? '').trim(),
        assets, liab, equity, bps,
        debtRatio: assets > 0 && liab != null ? liab / assets * 100 : null,
      };
    }
    if (Object.keys(map).length) { cacheSet(key, map); return map; }
    return cacheGetStale(key, 30 * 24 * 60 * 60 * 1000);
  })();
  const r = await _bsPromise;
  if (!r) _bsPromise = null;
  return r;
}

// 合併損益表 + 資產負債表，並累積季度歷史（官方每次僅提供最新一季）
async function fetchFullFinancials(stockId) {
  const [fin, bs] = await Promise.all([
    fetchFinancials(stockId).catch(() => null),
    fetchBalanceSheetAll().then(m => m?.[stockId] || null).catch(() => null),
  ]);
  if (!fin && !bs) return null;

  const out = { ...(fin || {}), ...(bs ? { assets: bs.assets, liab: bs.liab, equity: bs.equity, bps: bs.bps, debtRatio: bs.debtRatio } : {}) };
  // 單季 ROE 年化（×4）—— 反映當前獲利效率
  if (out.netInc != null && out.equity > 0) out.roe = out.netInc / out.equity * 100 * 4;

  // 逐季累積歷史，供 QoQ / YoY 比較（官方端點只給最新一季）
  const period = out.year && out.quarter ? `${out.year}Q${out.quarter}` : null;
  if (period) {
    try {
      const hist = JSON.parse(localStorage.getItem('fin-hist') || '{}');
      const arr = hist[stockId] = hist[stockId] || [];
      const i = arr.findIndex(x => x.period === period);
      const rec = { period, revenue: out.revenue, netInc: out.netInc, eps: out.eps,
                    grossMargin: out.grossMargin, opMargin: out.opMargin, netMargin: out.netMargin, roe: out.roe };
      if (i >= 0) arr[i] = rec; else arr.push(rec);
      arr.sort((a, b) => a.period.localeCompare(b.period));
      hist[stockId] = arr.slice(-12); // 最多 3 年
      localStorage.setItem('fin-hist', JSON.stringify(hist));
      out.history = hist[stockId];
    } catch {}
  }
  return out;
}

// ── 盤中分鐘 K：以證交所即時報價自行累積 ───────────────────────────────────
// 台灣官方不提供免費的「歷史」分鐘 K，Yahoo 對雲端限流，TradingView 免費版
// 亦不含台股（會跳「此商品僅在 TradingView 上可用」）。
// 唯一可行路徑：輪詢證交所 MIS 即時報價，自行分桶累積成分鐘 K 並存本機。
// 特性：盤中逐步建立，開盤初期根數少；收盤後保留當日完整分鐘 K。

async function fetchRealtimeQuote(stockId) {
  const isOTC = localStorage.getItem(`sym-suffix:${stockId}`) === 'TWO';
  const ch = `${isOTC ? 'otc' : 'tse'}_${stockId}.tw`;
  const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(ch)}&json=1&delay=0&_=${Date.now()}`;
  const j = await proxyFetch(url, 6000).catch(() => null);
  const m = j?.msgArray?.[0];
  if (!m) return null;
  const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
  const price = num(m.z) ?? num(m.b?.split('_')[0]) ?? num(m.a?.split('_')[0]);
  if (price == null) return null;
  const nums = v => String(v || '').split('_').map(num).filter(x => x != null);
  return {
    price, open: num(m.o), high: num(m.h), low: num(m.l),
    cumVol: num(m.v) ?? 0,       // 當日累積成交量（張）
    time: String(m.t || ''),      // HH:MM:SS
    date: String(m.d || ''),      // YYYYMMDD
    name: m.n,
    // 五檔掛單（張）— 供大戶掛單偵測；收盤後 MIS 可能回空
    bidP: nums(m.b), bidV: nums(m.g), askP: nums(m.a), askV: nums(m.f),
  };
}

// ── 批次即時報價（盤中價格的唯一即時來源）─────────────────────────────────
// 為什麼需要：STOCK_DAY_ALL 是「盤後收盤行情」，盤中取得的是昨日收盤；
// Yahoo 日線快取 10 分鐘且對雲端 IP 常限流 —— 兩者都無法即時。
// MIS 支援一次查多檔（ex_ch 以 | 分隔），因此 100 檔只需 3 個請求。
async function fetchRealtimeBatch(ids) {
  const list = [...new Set(ids)].filter(id => /^\d{4,6}[A-Z]?$/.test(id));
  if (!list.length) return {};
  const chunks = [];
  for (let i = 0; i < list.length; i += 40) chunks.push(list.slice(i, i + 40));
  const num = v => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return isFinite(f) ? f : null; };
  const nums = v => String(v || '').split('_').map(num).filter(x => x != null);
  const out = {};

  await Promise.all(chunks.map(async chunk => {
    const ch = chunk.map(id => {
      const otc = localStorage.getItem(`sym-suffix:${id}`) === 'TWO' || localStorage.getItem(`mkt:${id}`) === 'tpex';
      return `${otc ? 'otc' : 'tse'}_${id}.tw`;
    }).join('|');
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(ch)}&json=1&delay=0&_=${Date.now()}`;
    const j = await proxyFetch(url, 8000).catch(() => null);
    for (const m of j?.msgArray || []) {
      const id = String(m.c || '').trim();
      if (!id) continue;
      // z 為成交價；尚未成交時退用最佳買/賣價（開盤前試撮階段常見）
      const price = num(m.z) ?? num(String(m.b || '').split('_')[0]) ?? num(String(m.a || '').split('_')[0]);
      if (price == null) continue;
      out[id] = {
        price, open: num(m.o), high: num(m.h), low: num(m.l),
        prevClose: num(m.y),
        cumVol: num(m.v) ?? 0,        // 當日累積成交量（張）
        time: String(m.t || ''), date: String(m.d || ''), name: m.n,
        bidP: nums(m.b), bidV: nums(m.g), askP: nums(m.a), askV: nums(m.f),
      };
    }
  }));
  return out;
}

function intradayKey(stockId, mins) { return `intra:${stockId}:${mins}`; }

function getIntradayBars(stockId, mins) {
  try {
    const o = JSON.parse(localStorage.getItem(intradayKey(stockId, mins)) || '{}');
    return Array.isArray(o.bars) ? o.bars : [];
  } catch { return []; }
}

// 把一筆即時報價併入對應的分鐘桶
function pushIntradayQuote(stockId, mins, q) {
  if (!q?.time || !q.date) return getIntradayBars(stockId, mins);
  const [hh, mm] = q.time.split(':').map(Number);
  if (!isFinite(hh) || !isFinite(mm)) return getIntradayBars(stockId, mins);
  const slot = Math.floor((hh * 60 + mm) / mins) * mins;
  const label = `${q.date.slice(0,4)}-${q.date.slice(4,6)}-${q.date.slice(6,8)} ` +
                `${String(Math.floor(slot/60)).padStart(2,'0')}:${String(slot%60).padStart(2,'0')}`;

  let bars = getIntradayBars(stockId, mins);
  const last = bars[bars.length - 1];
  if (last && last.time === label) {
    last.high = Math.max(last.high, q.price);
    last.low = Math.min(last.low, q.price);
    last.close = q.price;
    last.volume = Math.max(0, q.cumVol - (last._vBase ?? q.cumVol));
  } else {
    bars.push({ time: label, open: q.price, high: q.price, low: q.price, close: q.price,
                volume: 0, _vBase: q.cumVol });
  }
  // 只保留最近 3 個交易日，避免 localStorage 膨脹
  const days = [...new Set(bars.map(b => b.time.slice(0, 10)))].slice(-3);
  bars = bars.filter(b => days.includes(b.time.slice(0, 10)));
  try { localStorage.setItem(intradayKey(stockId, mins), JSON.stringify({ bars })); } catch {}
  return bars;
}

// 台北時間是否在交易時段（09:00–13:30 平日）
function isMarketOpen() {
  const t = twNow();
  const dow = t.getDay();
  if (dow === 0 || dow === 6) return false;
  const m = t.getHours() * 60 + t.getMinutes();
  return m >= 9 * 60 && m <= 13 * 60 + 35;
}

// 取分鐘 K：優先 Yahoo（有完整歷史），失敗則用自行累積的資料
async function fetchIntradayBars(stockId, mins) {
  const yahoo = await fetchStockOHLCV(stockId, `${mins}m`, '1mo').catch(() => []);
  if (yahoo?.length >= 20) return { bars: yahoo, source: 'yahoo' };

  let bars = getIntradayBars(stockId, mins);
  if (isMarketOpen()) {
    const q = await fetchRealtimeQuote(stockId).catch(() => null);
    if (q) bars = pushIntradayQuote(stockId, mins, q);
  }
  return { bars, source: 'local' };
}

// ── TWSE 融資融券餘額（台股版未平倉 O.I：融資=槓桿多單、融券=空單未平倉）────

let _marginMemo = null;
let _marginPromise = null;

async function fetchMarginAll() {
  if (_marginMemo) return _marginMemo;
  if (_marginPromise) return _marginPromise;
  _marginPromise = (async () => {
    const days = recentTradingDays(3);
    for (const { ymd } of days) {
      const cached = cacheGet(`cache:margin:${ymd}`, 60 * 60 * 1000);
      if (cached) { _marginMemo = cached; return cached; }
    }
    if (srcDead('margin')) return null;
    const parse = json => {
      // rwd 回應可能是 {data} 或 {tables:[...]}：取欄位數最多的那張明細表
      let rows = json?.data;
      if (!rows && Array.isArray(json?.tables)) {
        const t = json.tables.filter(t => Array.isArray(t.data) && t.data.length)
          .sort((a, b) => (b.fields?.length || 0) - (a.fields?.length || 0))[0];
        rows = t?.data;
      }
      if (!rows?.length) return null;
      const num = v => parseInt(String(v ?? '').replace(/,/g, ''), 10) || 0;
      const map = {};
      for (const r of rows) {
        const id = String(r[0] ?? '').trim();
        if (!isRealStockId(id)) continue;
        // 欄位：[2..7]融資(買進,賣出,現金償還,前日餘額,今日餘額,限額) [8..13]融券(同序)
        map[id] = { finPrev: num(r[5]), finBal: num(r[6]), shortPrev: num(r[11]), shortBal: num(r[12]) };
      }
      return Object.keys(map).length ? map : null;
    };
    const results = await Promise.all(days.map(async ({ ymd }) => {
      try {
        const json = await proxyFetch(`https://www.twse.com.tw/rwd/zh/marginTrading/MI_MARGN?date=${ymd}&selectType=ALL&response=json`, 6000);
        const map = parse(json);
        return map ? { map, ymd } : null;
      } catch { return null; }
    }));
    const hit = results.find(Boolean);
    if (hit) { _marginMemo = hit.map; cacheSet(`cache:margin:${hit.ymd}`, hit.map); srcMarkAlive('margin'); return hit.map; }
    srcMarkDead('margin', 10);
    return null;
  })();
  const result = await _marginPromise;
  if (!result) _marginPromise = null;
  return result;
}

async function fetchMargin(stockId) {
  const all = await fetchMarginAll();
  const m = all?.[stockId];
  if (!m) return null;
  return {
    ...m,
    dFin: m.finBal - m.finPrev,     // 融資日增減（張）
    dShort: m.shortBal - m.shortPrev, // 融券日增減（張）
    shortFinRatio: m.finBal > 0 ? m.shortBal / m.finBal * 100 : 0, // 券資比 %
  };
}

// ── 注意股／處置股警示（TWSE 公告）─────────────────────────────────────────
// 處置股採分盤撮合（5～20 分鐘一盤），流動性受限且波動劇烈，
// 進場前必查；注意股則是異常交易的前置警告。
let _alertPromise = null;

async function fetchMarketAlerts() {
  if (_alertPromise) return _alertPromise;
  _alertPromise = (async () => {
    const key = 'cache:mktalerts';
    const cached = cacheGet(key, 60 * 60 * 1000);
    if (cached) return cached;

    const pickId = r => {
      for (const k of Object.keys(r)) {
        if (/代號|Code/i.test(k)) {
          const v = String(r[k] ?? '').trim();
          if (/^\d{4,6}$/.test(v)) return v;
        }
      }
      return null;
    };
    const [punish, notice] = await Promise.all([
      officialJSON('https://openapi.twse.com.tw/v1/announcement/punish', 'twse-punish', 7000).catch(() => null),
      officialJSON('https://openapi.twse.com.tw/v1/announcement/notice', 'twse-notice', 7000).catch(() => null),
    ]);

    const map = {};
    for (const r of Array.isArray(punish) ? punish : []) {
      const id = pickId(r);
      if (id) map[id] = { level: 'punish', txt: '處置股：分盤撮合中，流動性受限且進出困難' };
    }
    for (const r of Array.isArray(notice) ? notice : []) {
      const id = pickId(r);
      if (id && !map[id]) map[id] = { level: 'notice', txt: '注意股：交易異常遭列注意，波動與監管風險升高' };
    }
    // 空結果也快取（多數日子沒有處置股，避免每輪重抓）
    cacheSet(key, map);
    return map;
  })();
  const r = await _alertPromise;
  if (!r) _alertPromise = null;
  return r;
}

// ── Multi-timeframe snapshot（三時框並行抓取）─────────────────────────────

// 日線用已抓好的資料直接計算（零請求）；週線由日線聚合（零請求）；
// 只有 60 分需要額外抓 → 3 個請求縮成 1 個
function aggregateWeekly(daily) {
  const out = [];
  let cur = null;
  for (const b of daily) {
    const d = new Date(b.time + 'T00:00:00');
    // 以「週一」為每週起點分組
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const wk = monday.toISOString().slice(0, 10);
    if (!cur || cur.time !== wk) {
      cur = { time: wk, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume || 0 };
      out.push(cur);
    } else {
      cur.high = Math.max(cur.high, b.high);
      cur.low = Math.min(cur.low, b.low);
      cur.close = b.close;
      cur.volume += b.volume || 0;
    }
  }
  return out;
}

// 日／週／月三週期：全部由已抓好的日線聚合，零額外請求且永遠有資料。
// （原本的 60 分 K 只有 Yahoo 提供，Yahoo 一掛就永遠顯示「--」）
async function fetchMTFSignals(stockId, dailyBars = null) {
  const daily = dailyBars?.length ? dailyBars : await fetchStockOHLCV(stockId, '1d', '6mo');
  // calculateScore 需 60 根才完整；根數較少時改用精簡版趨勢評分，
  // 否則週線／月線會永遠顯示「--」（月線要 60 根 = 5 年資料，不切實際）
  const score = (bars, min = 20) => {
    if (!bars?.length || bars.length < min) return { score: null, signal: '--' };
    if (bars.length >= 60) { const b = calculateScore(bars); return { score: b.score, signal: b.signal }; }
    return lightScore(bars);
  };
  return [
    { label: '日線', ...score(daily, 20) },
    { label: '週線', ...score(aggregateWeekly(daily), 12) },
    { label: '月線', ...score(aggregateMonthly(daily), 6) },
  ];
}

// ── 財經新聞（Google News RSS，繁中台股）───────────────────────────────────

const _newsMemo = {};

async function fetchNewsRSS(query, limit = 7) {
  if (_newsMemo[query]) return _newsMemo[query];
  const key = `cache:news:${query}`;
  const cached = cacheGet(key, 30 * 60 * 1000); // 新聞快取 30 分鐘
  if (cached) { _newsMemo[query] = cached; return cached; }

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+when:7d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
  const xml = await proxyFetchText(url, 8000);
  if (!xml) return null;

  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, limit).map(it => {
      const rawTitle = it.querySelector('title')?.textContent || '';
      const source = it.querySelector('source')?.textContent || '';
      // Google News 標題尾端會帶 " - 媒體名"，去掉
      const headline = rawTitle.replace(new RegExp(`\\s*-\\s*${source}\\s*$`), '').trim();
      const pub = new Date(it.querySelector('pubDate')?.textContent || Date.now());
      const link = it.querySelector('link')?.textContent || '';
      return {
        headline, source, link,
        date: `${String(pub.getMonth()+1).padStart(2,'0')}-${String(pub.getDate()).padStart(2,'0')}`,
        ts: pub.getTime(),   // 供「假日期間發布」等時間篩選使用
        ...classifyNewsDirection(headline),
      };
    }).filter(n => n.headline);
    if (items.length) { _newsMemo[query] = items; cacheSet(key, items); return items; }
    return null;
  } catch { return null; }
}

// 關鍵字判讀新聞多空方向
const NEWS_BULL_KW = /創新高|大漲|漲停|買超|看好|看漲|上調|調升|成長|利多|突破|強勁|飆|攻頂|回升|反彈|轉盈|優於預期|報喜|新訂單|擴產|完銷/;
const NEWS_BEAR_KW = /下跌|跌停|賣超|重挫|利空|下修|調降|衰退|跌破|崩|疑慮|警訊|縮水|降評|轉虧|裁員|砍單|低於預期|停工|罰款|違約/;

function classifyNewsDirection(headline) {
  const bull = (headline.match(NEWS_BULL_KW) || []).length;
  const bear = (headline.match(NEWS_BEAR_KW) || []).length;
  if (bull > bear) return { dir: '偏多', cls: 'bull', tag: '利多', tagClass: 'bull' };
  if (bear > bull) return { dir: '偏空', cls: 'bear', tag: '利空', tagClass: 'bear' };
  return { dir: '中性', cls: 'neutral', tag: '中性', tagClass: 'neutral' };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function fmtVol(v) {
  if (!v) return '--';
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '億';
  if (v >= 1e4) return (v / 1e4).toFixed(1) + '萬';
  return v.toLocaleString();
}

function fmtK(v) {
  if (v == null) return '--';
  const s = v > 0 ? '+' : '';
  return `${s}${v.toLocaleString()} 張`;
}
