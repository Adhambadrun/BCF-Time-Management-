import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import dotenv from 'dotenv';
import {
  initNeonTables,
  seedNeonInitialData,
  getNeonState,
  saveNeonRecord,
  deleteNeonRecord,
  executeNeonBatchAction,
  executeNeonTeamBreakLock,
  neonHeartbeat,
} from './server/neon';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // Initialize Neon PostgreSQL tables & seed initial floor roster if empty
  initNeonTables()
    .then(() => seedNeonInitialData())
    .catch((err) => {
      console.warn('Neon database startup warning:', err);
    });

  // Lazy Gemini client helper
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  };

  // 1. Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1.1 Neon PostgreSQL Database API Endpoints
  app.get('/api/db', async (req, res) => {
    try {
      const state = await getNeonState();
      res.json(state);
    } catch (err: any) {
      console.error('Neon GET /api/db error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/db/state', async (req, res) => {
    try {
      const state = await getNeonState();
      res.json(state);
    } catch (err: any) {
      console.error('Neon GET /api/db/state error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/db', async (req, res) => {
    try {
      const body = req.body || {};
      const { action } = req.query || {};
      const subAction = (action as string) || body.action;

      if (subAction === 'save') {
        await saveNeonRecord(body.type, body.data);
        return res.json({ success: true });
      }

      if (subAction === 'delete') {
        await deleteNeonRecord(body.type, body.id);
        return res.json({ success: true });
      }

      if (subAction === 'batch') {
        await executeNeonBatchAction(body.batchAction, body.selectedAgentEmails, body.options);
        return res.json({ success: true });
      }

      if (subAction === 'team-lock') {
        await executeNeonTeamBreakLock(body.teamId, body.block, body.options);
        return res.json({ success: true });
      }

      if (subAction === 'heartbeat') {
        if (body.email) {
          await neonHeartbeat(body.email);
        }
        return res.json({ success: true });
      }

      if (body.type && body.data) {
        await saveNeonRecord(body.type, body.data);
        return res.json({ success: true });
      }

      return res.status(400).json({ error: 'Unknown database action' });
    } catch (err: any) {
      console.error('Neon POST /api/db error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Google Search Grounding Endpoint (gemini-3.5-flash with googleSearch tool)
  app.post('/api/search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are a real-time sales floor intelligence assistant for BCF Breaks (Business Class Flights floor). Answer the following query accurately with current real-world data: "${query}"`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const candidate = response.candidates?.[0];
      const text = response.text || 'No response generated.';
      const groundingMetadata = candidate?.groundingMetadata || null;

      // Extract search queries and source links
      const searchQueries = groundingMetadata?.webSearchQueries || [];
      const sources = (groundingMetadata?.groundingChunks || [])
        .map((chunk: any) => chunk.web)
        .filter(Boolean);

      return res.json({
        text,
        searchQueries,
        sources,
        groundingMetadata,
      });
    } catch (err: any) {
      console.error('Google Search Grounding Error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to perform grounded search',
      });
    }
  });

  // 3. AI Floor Assistant & Break Intelligence
  app.post('/api/ai-chat', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are the BCF Breaks Virtual Shift Supervisor and Sales Floor Coach for Business Class Flights.
Current Context: ${JSON.stringify(context || {})}
User Query: ${prompt}

Give concise, encouraging, and actionable response suitable for high-performing flight sales agents.`,
      });

      return res.json({ text: response.text });
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      return res.status(500).json({ error: err.message || 'AI generation failed' });
    }
  });

  // 4. Google GenAI Identity Router (gemini-2.5-flash)
  app.post('/api/auth/resolve-identity', async (req, res) => {
    try {
      const { query, roster } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query string is required' });
      }

      const ai = getAI();
      const prompt = `You are the BCF Time Management Identity Router and Role Dispatcher.
Match the user input "${query}" against the following roster of authorized personnel:
${JSON.stringify(roster || [])}

Rules:
1. Handle phonetic spellings, nicknames, first-name only, full names, or email variations (e.g., "Meredith" -> "meredith@bcflights.com", "Dom" / "Dominick" -> "dominick@bcflights.com", "Adham" -> "adhambadraan@gmail.com", "Watkins" -> "watkins@bcflights.com", "Amir" -> "amir@bcflights.com", "Jay" -> "jay@bcflights.com", "Albert" -> "albert@bcflights.com").
2. Determine the matched user's email, name, role (developer, admin, supervisor, agent), and target view routing:
   - "developer" -> route: "god-mode"
   - "admin" -> route: "admin"
   - "supervisor" -> route: "supervisor"
   - "agent" -> route: "floor"
3. Return ONLY valid JSON with keys: "matchedEmail", "matchedName", "role", "route", "confidence" (number 0 to 1), "reasoning".`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      let parsed = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error('GenAI Identity Router Error:', err);
      return res.status(500).json({ error: err.message || 'Identity resolution failed' });
    }
  });

  // 4. Gemini Live API WebSocket Server (/live) using gemini-3.1-flash-live-preview
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('Client connected to Live Voice WebSocket');

    let session: any = null;

    try {
      const ai = getAI();

      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are the BCF Breaks Voice Floor Assistant and Shift Dispatcher. You provide real-time voice assistance for flight sales agents, shift supervisors, and management during their shift. Keep your verbal responses natural, crisp, encouraging, and concise (under 2-3 sentences).',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Audio output chunk (24kHz PCM)
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }

            // Interrupted by user speaking
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }

            // Output transcription
            const outTranscript = (message.serverContent as any)?.outputAudioTranscription?.text;
            if (outTranscript) {
              clientWs.send(JSON.stringify({ text: outTranscript, isModel: true }));
            }

            // Input transcription
            const inTranscript = (message.serverContent as any)?.inputAudioTranscription?.text;
            if (inTranscript) {
              clientWs.send(JSON.stringify({ text: inTranscript, isUser: true }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ status: 'session_closed' }));
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live API Callback Error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: err.message || 'Live session error' }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ status: 'connected', model: 'gemini-3.1-flash-live-preview' }));
      }

      clientWs.on('message', (raw) => {
        try {
          const payload = JSON.parse(raw.toString());
          if (payload.audio && session) {
            // Realtime 16kHz PCM audio stream
            session.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } else if (payload.text && session) {
            session.sendRealtimeInput({
              text: payload.text,
            });
          }
        } catch (e: any) {
          console.error('Error handling client WS message:', e);
        }
      });

      clientWs.on('close', () => {
        console.log('Client disconnected from Live Voice');
        if (session) {
          try {
            session.close();
          } catch (e) {}
        }
      });

    } catch (err: any) {
      console.error('Failed to initiate Gemini Live API connection:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          error: err.message || 'Unable to establish Gemini Live API connection. Please ensure GEMINI_API_KEY is configured.',
        }));
        clientWs.close();
      }
    }
  });

  // 5. Vite Middleware or Static Production Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`BCFBreaks Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
