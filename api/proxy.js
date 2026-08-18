// Vercel Serverless Function：自家資料代理
// 行情來源（Yahoo / TWSE / TPEx / Google News）不允許瀏覽器跨域直接存取，
// 過去依賴第三方免費 CORS proxy（不穩定、常被限流 → 大量資料載入失敗）。
// 改由自家函式代抓：穩定、快速、無第三方依賴，並用 CDN 快取降低回源次數。

const ALLOW = [
  /^https:\/\/query[12]\.finance\.yahoo\.com\//,
  /^https:\/\/www\.twse\.com\.tw\//,
  /^https:\/\/openapi\.twse\.com\.tw\//,
  /^https:\/\/www\.tpex\.org\.tw\//,
  /^https:\/\/news\.google\.com\//,
  /^https:\/\/stooq\.com\/q\//,
  /^https:\/\/mis\.twse\.com\.tw\//,
  /^https:\/\/opendata\.tdcc\.com\.tw\//,
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = req.query.url;
  if (!url || !ALLOW.some(re => re.test(url))) {
    res.status(400).json({ error: 'url not allowed' });
    return;
  }
  // 證交所 MIS 即時報價：未帶 Referer 時常回空的 msgArray（形同「查無報價」）。
  // 這是即時價長期沒更新的主因之一 —— 補上來源頁 Referer 與 Origin。
  const isMIS = /^https:\/\/mis\.twse\.com\.tw\//.test(url);
  const extra = isMIS
    ? { 'Referer': 'https://mis.twse.com.tw/stock/fibest.jsp', 'Origin': 'https://mis.twse.com.tw',
        'X-Requested-With': 'XMLHttpRequest' }
    : {};

  try {
    const doFetch = () => fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/xml, text/html, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        ...extra,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    });
    let upstream = await doFetch();
    // 上游限流/暫時錯誤 → 等 400ms 重試一次（Yahoo 對雲端 IP 偶發 429）
    if (upstream.status === 429 || upstream.status >= 500) {
      await new Promise(r => setTimeout(r, 400));
      upstream = await doFetch();
    }
    const body = Buffer.from(await upstream.arrayBuffer());
    // 即時報價絕不可快取：CDN 快取 2 分鐘會讓「每 15 秒更新」實際變成 2 分鐘一次。
    // 其餘來源維持 CDN 快取 2 分鐘 + 過期後 10 分鐘內先回舊值背景更新。
    res.setHeader('Cache-Control', isMIS ? 'no-store, max-age=0' : 's-maxage=120, stale-while-revalidate=600');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/plain; charset=utf-8');
    res.status(upstream.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'upstream failed', detail: String((e && e.message) || e) });
  }
}
