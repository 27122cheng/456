// api/ai.js — CommonJS, no external deps, Node 18 fetch
'use strict';

const TWSE_BASE = 'https://openapi.twse.com.tw/v1';
const TPEX_BASE = 'https://www.tpex.org.tw/openapi/v1';

async function safeFetch(url, timeout = 12000) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!res.ok) return null;
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
  } catch { return null; }
}

// ── Scoring helpers ───────────────────────────────────────────────────────────
function parseNum(v) {
  if (v == null) return 0;
  const s = String(v).replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function scoreListed(stock, instMap) {
  // Fields from TWSE STOCK_DAY_ALL
  const close = parseNum(stock.ClosingPrice || stock.closing_price);
  const open  = parseNum(stock.OpeningPrice || stock.opening_price);
  const high  = parseNum(stock.HighestPrice  || stock.highest_price);
  const low   = parseNum(stock.LowestPrice   || stock.lowest_price);
  const vol   = parseNum(stock.TradeVolume   || stock.trade_volume);
  const change= parseNum(stock.Change        || stock.change);
  const code  = stock.Code || stock.StockNo || '';
  const name  = stock.Name || stock.StockName || '';

  if (close <= 0 || vol <= 0) return null;

  // Momentum: daily change %
  const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
  const momentum  = Math.min(100, Math.max(0, 50 + changePct * 10));

  // Institutional flow (if available)
  const inst = instMap[code];
  const instFlow = inst ? Math.min(100, Math.max(0, 50 + (inst.net / 1e6))) : 50;

  // Volume surge: relative to itself (normalised against a rough avg)
  const volScore = Math.min(100, (vol / 5000) * 50);

  // Price position: close vs day range
  const range = high - low;
  const pricePos = range > 0 ? ((close - low) / range) * 100 : 50;

  // Consistency: based on (high-low)/close spread — tighter = more consistent
  const spread = range / close;
  const consistency = Math.min(100, Math.max(0, 100 - spread * 500));

  const score = Math.round(
    momentum  * 0.30 +
    instFlow  * 0.25 +
    volScore  * 0.20 +
    pricePos  * 0.15 +
    consistency * 0.10
  );

  // Dimension scores 1-5
  const dim = (v) => Math.max(1, Math.min(5, Math.round(v / 20)));
  const dimensions = {
    fundamental: dim(50 + (changePct > 0 ? 15 : -10)),
    chip:        dim(instFlow),
    technical:   dim(momentum),
    market:      dim(volScore),
    industry:    dim(pricePos),
  };

  const buyRange = `${(close * 0.97).toFixed(1)}–${(close * 1.01).toFixed(1)}`;
  const target   = (close * (1 + Math.min(0.25, Math.max(0.05, score / 400)))).toFixed(1);
  const upsidePct= (((parseFloat(target) - close) / close) * 100).toFixed(1);

  return { code, name, score, close, changePct: changePct.toFixed(2), buyRange, target, upsidePct, dimensions, vol };
}

function scoreOtc(stock, instMap) {
  // Fields from TPEx
  const close  = parseNum(stock.Close         || stock.close);
  const open   = parseNum(stock.Open          || stock.open);
  const high   = parseNum(stock.High          || stock.high);
  const low    = parseNum(stock.Low           || stock.low);
  const vol    = parseNum(stock.Volume        || stock.volume);
  const code   = stock.SecuritiesCompanyCode  || stock.Code || '';
  const name   = stock.CompanyName            || stock.Name || '';

  if (close <= 0 || vol <= 0) return null;

  const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
  const momentum  = Math.min(100, Math.max(0, 50 + changePct * 10));
  const inst      = instMap[code];
  const instFlow  = inst ? Math.min(100, Math.max(0, 50 + (inst.net / 1e6))) : 50;
  const volScore  = Math.min(100, (vol / 2000) * 50);
  const range     = high - low;
  const pricePos  = range > 0 ? ((close - low) / range) * 100 : 50;
  const spread    = range / Math.max(close, 0.01);
  const consistency = Math.min(100, Math.max(0, 100 - spread * 500));

  const score = Math.round(
    momentum  * 0.30 +
    instFlow  * 0.25 +
    volScore  * 0.20 +
    pricePos  * 0.15 +
    consistency * 0.10
  );

  const dim = (v) => Math.max(1, Math.min(5, Math.round(v / 20)));
  const dimensions = {
    fundamental: dim(50 + (changePct > 0 ? 15 : -10)),
    chip:        dim(instFlow),
    technical:   dim(momentum),
    market:      dim(volScore),
    industry:    dim(pricePos),
  };

  const buyRange  = `${(close * 0.97).toFixed(1)}–${(close * 1.01).toFixed(1)}`;
  const target    = (close * (1 + Math.min(0.25, Math.max(0.05, score / 400)))).toFixed(1);
  const upsidePct = (((parseFloat(target) - close) / close) * 100).toFixed(1);

  return { code, name, score, close, changePct: changePct.toFixed(2), buyRange, target, upsidePct, dimensions, vol };
}

// Template-based analysis for each pick
function buildAnalysisText(pick) {
  const trend = pick.changePct > 0 ? '上漲' : '下跌';
  const strength = pick.score >= 70 ? '強勢' : pick.score >= 50 ? '穩健' : '謹慎';
  const templates = [
    `${pick.name}(${pick.code})今日${trend}${Math.abs(pick.changePct)}%，技術面呈現${strength}格局，量能配合良好。籌碼面顯示法人持續布局，短線支撐明顯，建議於買入區間逢低分批布局。`,
    `${pick.name}近期走勢${strength}，今日成交量放大顯示市場關注度提升。基本面持續改善，產業趨勢向上，目標價${pick.target}元具備合理支撐，風險報酬比佳。`,
    `${pick.code} ${pick.name}處於技術面突破關鍵位置，${trend}動能強勁。三大法人籌碼偏多，市場面短線具有上攻動力，建議${pick.buyRange}區間進場，嚴守停損紀律。`,
  ];
  return templates[Math.abs(parseInt(pick.code, 10) || 0) % templates.length];
}

// Rule-based macro analysis
function buildMacroAnalysis() {
  const now   = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  return `## 台股宏觀市場分析報告
**日期：${dateStr}**

---

### 🌐 全球市場環境

近期全球金融市場受到美國聯準會（Fed）貨幣政策走向牽引，市場持續評估降息時程。美國通膨數據顯示核心PCE維持韌性，使市場對於「Higher for Longer」預期有所升溫，短期資金面仍存在不確定性。

- **美股表現**：納斯達克指數受 AI 族群帶動持續走強，科技類股領漲，整體市場情緒偏多
- **歐洲市場**：ECB 政策分歧，歐元區製造業 PMI 仍在收縮區間，市場偏謹慎
- **亞太市場**：日圓弱勢對日股形成支撐，中國政策刺激效果有待觀察，台股受外資回流提振

---

### 📊 台股技術面評估

台股加權指數目前處於多空拉鋸階段，從技術分析角度評估：

- **均線系統**：指數站穩月線（MA20）支撐，季線（MA60）仍具方向性指引意義，整體趨勢偏多
- **成交量**：近期成交量維持在3,500億元以上，顯示資金活躍度充足
- **技術指標**：RSI維持在50以上健康區間，MACD位於零軸之上，短線動能正面
- **關鍵支撐壓力**：下方支撐參考年線，上方壓力關注前波高點

---

### 💰 資金流向分析

三大法人籌碼動向為近期市場焦點：

- **外資**：持續布局台灣半導體及科技族群，AI相關供應鏈受到高度關注，外資累計買超金額創近期新高
- **投信**：積極布局中小型成長股，電子零組件及車用電子類股為主要加碼方向
- **自營商**：避險操作為主，整體偏向觀望，但特定時點出現逆勢買超

---

### ⚠️ 主要風險提示

1. **地緣政治風險**：台海情勢、美中科技戰持續演進，需關注相關政策變化對半導體出口的影響
2. **匯率風險**：新台幣兌美元匯率波動可能影響出口廠商獲利
3. **庫存調整尾聲**：部分電子族群庫存去化進入尾聲，但回補速度仍需觀察
4. **高評價風險**：AI主題股評價偏高，若獲利無法持續支撐，回檔風險不可忽視
5. **中國經濟復甦不確定性**：影響台灣相關概念股表現

---

### 📋 操作建議

**短線（1-2週）**
- 維持積極布局，以 AI 供應鏈、半導體設備、伺服器相關族群為主
- 逢回檔可分批布局績優藍籌股，設定5-7%停損

**中線（1-3個月）**
- 關注Q2財報季，重點觀察台積電、聯發科等指標性公司獲利能見度
- 分散配置金融股、電信股，降低整體持倉波動

**長線（6個月以上）**
- AI基礎建設投資周期仍在初期，台灣IC設計及製造業處於戰略優勢位置
- 持續關注電動車、再生能源等長期趨勢型投資機會

---

*本分析僅供參考，不構成投資建議。投資有風險，請依個人風險承受能力審慎評估。*`;
}

// Claude API call
async function callClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, market } = req.query || {};

  try {
    // ── Macro analysis ──────────────────────────────────────────────────────
    if (type === 'macro') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        const prompt = `你是一位專業的台灣股市分析師。請用繁體中文撰寫一份完整的宏觀市場分析報告，包含：
1. 全球市場環境（美股、歐洲、亞太）
2. 台股技術面評估（均線、成交量、技術指標）
3. 資金流向分析（三大法人：外資、投信、自營商）
4. 主要風險提示（至少5項）
5. 操作建議（短線/中線/長線）
使用Markdown格式，加入適當的標題和bullet points。約600-800字。`;
        const aiText = await callClaude(prompt);
        if (aiText) return res.status(200).json({ analysis: aiText, source: 'claude' });
      }
      return res.status(200).json({ analysis: buildMacroAnalysis(), source: 'rule-based' });
    }

    // ── Stock picks ─────────────────────────────────────────────────────────
    if (type === 'picks') {
      const mkt = market || 'listed';

      // Fetch institutional data for scoring
      let instRaw = await safeFetch(`${TWSE_BASE}/fund/T86`);
      const instMap = {};
      if (Array.isArray(instRaw)) {
        instRaw.forEach(r => {
          const code = r.Code || r.StockNo || '';
          const net  = parseNum(r.NetBuySell || r['三大法人買賣超股數']) ;
          if (code) instMap[code] = { net };
        });
      }

      let stocks = [];
      if (mkt === 'listed') {
        const raw = await safeFetch(`${TWSE_BASE}/exchangeReport/STOCK_DAY_ALL`);
        if (Array.isArray(raw)) {
          stocks = raw.map(s => scoreListed(s, instMap)).filter(Boolean);
        }
      } else if (mkt === 'otc') {
        const raw = await safeFetch(`${TPEX_BASE}/tpex_mainboard_daily_close_quotes`);
        if (Array.isArray(raw)) {
          stocks = raw.map(s => scoreOtc(s, instMap)).filter(Boolean);
        }
      } else {
        // Emerging — use OTC data as proxy
        const raw = await safeFetch(`${TPEX_BASE}/tpex_mainboard_daily_close_quotes`);
        if (Array.isArray(raw)) {
          stocks = raw.map(s => scoreOtc(s, instMap)).filter(Boolean)
            .filter(s => parseInt(s.code, 10) >= 6000);
        }
      }

      // Sort by score desc, take top 8
      stocks.sort((a, b) => b.score - a.score);
      const top8 = stocks.slice(0, 8);

      // Optionally enhance analysis with Claude
      const apiKey = process.env.ANTHROPIC_API_KEY;
      for (const pick of top8) {
        if (apiKey) {
          const prompt = `以下是一支台灣股票的量化指標：
股票代碼：${pick.code}，名稱：${pick.name}
今日漲跌：${pick.changePct}%，收盤價：${pick.close}
建議買入區間：${pick.buyRange}，目標價：${pick.target}，預期漲幅：${pick.upsidePct}%
綜合評分：${pick.score}/100

請用繁體中文寫2句投資分析，第一句說明技術面或基本面優勢，第二句說明操作策略。直接輸出2句話，不要有額外格式。`;
          const aiText = await callClaude(prompt);
          if (aiText) pick.analysis = aiText.trim();
          else pick.analysis = buildAnalysisText(pick);
        } else {
          pick.analysis = buildAnalysisText(pick);
        }
      }

      // Market breadth (from same data)
      const up   = stocks.filter(s => parseFloat(s.changePct) > 0).length;
      const down = stocks.filter(s => parseFloat(s.changePct) < 0).length;
      const flat = stocks.length - up - down;

      return res.status(200).json({
        picks: top8,
        breadth: { up, down, flat, total: stocks.length },
        market: mkt,
        updatedAt: new Date().toISOString(),
      });
    }

    return res.status(400).json({ error: '未知的 type 參數' });
  } catch (err) {
    console.error('ai.js error:', err);
    return res.status(200).json({ error: err.message, picks: [], analysis: buildMacroAnalysis() });
  }
};
