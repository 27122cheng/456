// api/telegram.js — CommonJS, no external deps, Node 18 fetch
'use strict';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let body = {};
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      body = raw ? JSON.parse(raw) : {};
    }
  } catch {
    return res.status(400).json({ error: '無效的 JSON 格式' });
  }

  const { message, token, chatId } = body;

  if (!message || !token || !chatId) {
    return res.status(400).json({ error: '缺少必要欄位：message, token, chatId' });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(8000),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return res.status(200).json({
        success: false,
        error: data.description || `Telegram API 錯誤 ${response.status}`,
      });
    }

    return res.status(200).json({ success: true, messageId: data.result?.message_id });
  } catch (err) {
    console.error('telegram.js error:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
};
