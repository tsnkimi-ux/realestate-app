export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'promptが必要です' });
  }

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
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `あなたは不動産検索の専門家です。
ユーザーの条件でWeb検索を複数回行い、実際に掲載されている物件情報を収集してください。
必ず有効なJSONのみを返してください。前置き・説明・マークダウン記号は一切不要です。
lat/lngは物件住所から算出した実際の座標（日本国内）を必ず含めてください。
match_scoreは0〜100の整数で、条件への合致度を正直に評価してください。`,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
