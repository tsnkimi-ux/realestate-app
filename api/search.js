export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'APIキー未設定' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(200).json({ error: 'promptなし' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: '不動産の専門家です。条件に合う物件をJSON形式のみで返してください。説明不要。\n{"properties":[{"title":"物件名","address":"住所","price":"価格","area":面積数値,"type":"種別","rooms":"間取り","station":"最寄り駅","tags":["特徴"],"match_score":80,"match_reasons":["理由"],"url":"","lat":35.69,"lng":139.70,"source":"提案"}]}',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.type === 'error') {
      return res.status(200).json({ error: `APIエラー: ${data.error?.message}` });
    }

    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
    if (!text) return res.status(200).json({ error: `応答なし: ${JSON.stringify(data).slice(0, 300)}` });

    return res.status(200).json({ text });

  } catch (err) {
    return res.status(200).json({ error: `例外: ${err.message}` });
  }
}
