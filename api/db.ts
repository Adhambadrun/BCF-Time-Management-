import type { IncomingMessage, ServerResponse } from 'http';
import {
  getNeonState,
  saveNeonRecord,
  deleteNeonRecord,
  executeNeonBatchAction,
  executeNeonTeamBreakLock,
  neonHeartbeat,
  initNeonTables,
  seedNeonInitialData,
} from '../server/neon';

// Helper to parse JSON body for Vercel Serverless Function
async function parseBody(req: any) {
  if (req.body) return req.body;
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query || {};

  try {
    if (req.method === 'GET') {
      const state = await getNeonState();
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const subAction = action || body.action;

      if (subAction === 'save') {
        const { type, data } = body;
        await saveNeonRecord(type, data);
        return res.status(200).json({ success: true });
      }

      if (subAction === 'delete') {
        const { type, id } = body;
        await deleteNeonRecord(type, id);
        return res.status(200).json({ success: true });
      }

      if (subAction === 'batch') {
        const { batchAction, selectedAgentEmails, options } = body;
        await executeNeonBatchAction(batchAction, selectedAgentEmails, options);
        return res.status(200).json({ success: true });
      }

      if (subAction === 'team-lock') {
        const { teamId, block, options } = body;
        await executeNeonTeamBreakLock(teamId, block, options);
        return res.status(200).json({ success: true });
      }

      if (subAction === 'heartbeat') {
        const { email } = body;
        if (email) {
          await neonHeartbeat(email);
        }
        return res.status(200).json({ success: true });
      }

      if (subAction === 'init-seed') {
        await initNeonTables();
        await seedNeonInitialData();
        return res.status(200).json({ success: true });
      }

      // Default POST fallback: save record
      if (body.type && body.data) {
        await saveNeonRecord(body.type, body.data);
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Unknown action or payload' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('API /api/db error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
