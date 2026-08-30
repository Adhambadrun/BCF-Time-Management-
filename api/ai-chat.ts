import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, context } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on Vercel deployment.',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the BCF Breaks Virtual Shift Supervisor and Sales Floor Coach for Business Class Flights (https://bcflights.vercel.app).
Current Context: ${JSON.stringify(context || {})}
User Query: ${prompt}

Give a concise, encouraging, and actionable response suitable for high-performing flight sales agents.`,
    });

    return res.status(200).json({ text: response.text });
  } catch (err: any) {
    console.error('Vercel serverless AI chat error:', err);
    return res.status(500).json({ error: err.message || 'AI generation failed' });
  }
}
