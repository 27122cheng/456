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
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = req.query.url;
  if (!url || !ALLOW.some(re => re.test(url))) {
    res.status(400).json({ error: 'url not allowed' });
    return;
  }
  try {
    const doFetch = () => fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/xml, text/html, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
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
    // CDN 快取 2 分鐘 + 過期後 10 分鐘內先回舊值背景更新：多人同時使用也只回源一次
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/plain; charset=utf-8');
    res.status(upstream.status).send(body);
  } catch (e) {
    res.status(502).json({ error: 'upstream failed', detail: String((e && e.message) || e) });
  }
}
