export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'APIキーが設定されていません' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'promptが必要です' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: `あなたは日本の不動産専門家です。ユーザーの条件に合う実在する可能性の高い物件を提案してください。
必ず以下のJSON形式のみで返してください。説明・前置き・マークダウン記号は一切不要です。
lat/lngは東京都内の実際の座標を入れてください（緯度35.6〜35.8、経度139.6〜139.9の範囲）。

{"properties":[{"title":"物件名","address":"住所","price":"価格","area":面積数値,"type":"種別","rooms":"間取り","station":"最寄り駅 徒歩XX分","tags":["特徴1","特徴2"],"match_score":マッチ度0から100,"match_reasons":["理由1","理由2"],"url":"","lat":緯度,"lng":経度,"source":"提案"}]}`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    return res.status(200).json({ text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
