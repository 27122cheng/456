// api/market.js — CommonJS, no external deps, Node 18 fetch
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

// Fundamental data for top stocks (hardcoded sample)
const FUNDAMENTAL_DATA = {
  '2330': { name: '台積電', eps: 32.34, pe: 22.5, pb: 6.8, yield: 1.8, marketCap: 18500, industry: '半導體' },
  '2317': { name: '鴻海', eps: 10.2, pe: 12.1, pb: 1.4, yield: 4.2, marketCap: 1680, industry: '電子製造' },
  '2454': { name: '聯發科', eps: 68.5, pe: 18.3, pb: 3.9, yield: 3.1, marketCap: 1120, industry: '半導體' },
  '2308': { name: '台達電', eps: 18.9, pe: 26.4, pb: 5.1, yield: 2.8, marketCap: 580, industry: '電子零組件' },
  '2382': { name: '廣達', eps: 14.6, pe: 16.8, pb: 3.2, yield: 4.5, marketCap: 480, industry: '電腦及週邊' },
  '2881': { name: '富邦金', eps: 8.4, pe: 11.2, pb: 1.2, yield: 5.1, marketCap: 720, industry: '金融' },
  '2882': { name: '國泰金', eps: 6.8, pe: 13.5, pb: 1.3, yield: 4.8, marketCap: 680, industry: '金融' },
  '1301': { name: '台塑', eps: 3.2, pe: 18.6, pb: 1.8, yield: 5.2, marketCap: 320, industry: '塑膠' },
  '2412': { name: '中華電', eps: 5.4, pe: 23.1, pb: 2.8, yield: 4.9, marketCap: 440, industry: '電信' },
  '3008': { name: '大立光', eps: 148.2, pe: 28.4, pb: 7.2, yield: 1.4, marketCap: 620, industry: '光學' },
  '2891': { name: '中信金', eps: 3.8, pe: 12.8, pb: 1.1, yield: 5.4, marketCap: 590, industry: '金融' },
  '5880': { name: '合庫金', eps: 2.1, pe: 14.2, pb: 1.0, yield: 5.8, marketCap: 380, industry: '金融' },
  '2886': { name: '兆豐金', eps: 2.9, pe: 13.6, pb: 1.2, yield: 5.6, marketCap: 410, industry: '金融' },
  '2892': { name: '第一金', eps: 2.4, pe: 13.1, pb: 1.1, yield: 5.7, marketCap: 370, industry: '金融' },
  '2303': { name: '聯電', eps: 4.8, pe: 14.2, pb: 2.1, yield: 5.3, marketCap: 420, industry: '半導體' },
  '2002': { name: '中鋼', eps: 1.2, pe: 16.8, pb: 0.9, yield: 4.1, marketCap: 190, industry: '鋼鐵' },
  '4904': { name: '遠傳', eps: 3.6, pe: 20.4, pb: 2.4, yield: 5.0, marketCap: 210, industry: '電信' },
  '9910': { name: '豐泰', eps: 12.4, pe: 19.2, pb: 4.1, yield: 3.8, marketCap: 160, industry: '橡膠' },
  '2379': { name: '瑞昱', eps: 22.8, pe: 22.6, pb: 4.4, yield: 3.2, marketCap: 210, industry: '半導體' },
  '6505': { name: '台塑化', eps: 2.8, pe: 15.4, pb: 1.6, yield: 5.6, marketCap: 290, industry: '石化' },
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, code } = req.query || {};

  try {
    if (type === 'listed') {
      const data = await safeFetch(`${TWSE_BASE}/exchangeReport/STOCK_DAY_ALL`);
      return res.status(200).json(data || []);
    }

    if (type === 'otc') {
      const data = await safeFetch(`${TPEX_BASE}/tpex_mainboard_daily_close_quotes`);
      return res.status(200).json(data || []);
    }

    if (type === 'institutional') {
      const data = await safeFetch(`${TWSE_BASE}/fund/T86`);
      return res.status(200).json(data || []);
    }

    if (type === 'index') {
      const data = await safeFetch(`${TWSE_BASE}/indicesReport/MI_INDEX`);
      return res.status(200).json(data || []);
    }

    if (type === 'quote') {
      if (!code) return res.status(200).json({ error: '缺少 code 參數' });
      // Try TWSE daily quote
      const data = await safeFetch(`${TWSE_BASE}/exchangeReport/STOCK_DAY_ALL`);
      if (data && Array.isArray(data)) {
        const stock = data.find(s => s.Code === code || s.StockNo === code);
        if (stock) return res.status(200).json(stock);
      }
      return res.status(200).json({ Code: code, error: '查無資料' });
    }

    if (type === 'news') {
      // Try TWSE announcements
      const data = await safeFetch(`${TWSE_BASE}/openData/t187ap03_L`);
      if (data && Array.isArray(data) && data.length > 0) {
        return res.status(200).json(data.slice(0, 10));
      }
      // Fallback: static news placeholders
      const fallback = [
        { title: '台積電法說會：AI需求強勁，2025年CoWoS產能大幅擴充', source: 'TWSE', time: new Date().toISOString(), url: 'https://www.twse.com.tw' },
        { title: '聯準會暗示可能暫停升息，亞股普遍上揚', source: 'MoneyDJ', time: new Date().toISOString(), url: 'https://www.moneydj.com' },
        { title: '台灣5月出口訂單年增18%，超越市場預期', source: '財政部', time: new Date().toISOString(), url: 'https://www.mof.gov.tw' },
        { title: 'NVIDIA H100供不應求，台灣供應鏈受惠', source: 'CNBC', time: new Date().toISOString(), url: 'https://www.cnbc.com' },
        { title: '台股三大法人今日買超逾百億，外資持續回流', source: 'TWSE', time: new Date().toISOString(), url: 'https://www.twse.com.tw' },
        { title: '電動車需求放緩，相關零件廠商調整庫存', source: '工商時報', time: new Date().toISOString(), url: 'https://www.ctee.com.tw' },
        { title: '中央銀行季報：台灣經濟成長預測維持3.1%', source: '央行', time: new Date().toISOString(), url: 'https://www.cbc.gov.tw' },
        { title: '半導體設備訂單回升，AMAT、LRCX看好台灣市場', source: 'Reuters', time: new Date().toISOString(), url: 'https://www.reuters.com' },
        { title: '台灣ETF規模突破4兆新台幣，00940申購踴躍', source: '投信投顧公會', time: new Date().toISOString(), url: 'https://www.sitca.org.tw' },
        { title: '鴻海MIH電動車平台獲國際車廠青睞，股價創波段高', source: '鉅亨網', time: new Date().toISOString(), url: 'https://www.cnyes.com' },
      ];
      return res.status(200).json(fallback);
    }

    if (type === 'fundamental') {
      if (!code) return res.status(200).json({});
      const fd = FUNDAMENTAL_DATA[code];
      if (fd) return res.status(200).json({ code, ...fd });
      return res.status(200).json({ code, name: `股票${code}`, eps: null, pe: null, pb: null, yield: null, marketCap: null, industry: '其他' });
    }

    return res.status(400).json({ error: '未知的 type 參數' });
  } catch (err) {
    console.error('market.js error:', err);
    return res.status(200).json([]);
  }
};
