import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is not configured on Vercel deployment.',
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
      contents: `You are a real-time sales floor intelligence assistant for BCF Breaks (Business Class Flights floor at https://bcflights.vercel.app). Answer the following query accurately with current real-world data: "${query}"`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const text = response.text || 'No response generated.';
    const groundingMetadata = candidate?.groundingMetadata || null;
    const searchQueries = groundingMetadata?.webSearchQueries || [];
    const sources = (groundingMetadata?.groundingChunks || [])
      .map((chunk: any) => chunk.web)
      .filter(Boolean);

    return res.status(200).json({
      text,
      searchQueries,
      sources,
      groundingMetadata,
    });
  } catch (err: any) {
    console.error('Vercel serverless search error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to perform search grounding',
    });
  }
}
