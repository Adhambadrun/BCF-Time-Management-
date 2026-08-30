export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    domain: 'https://bcflights.vercel.app',
    platform: 'vercel',
    timestamp: new Date().toISOString(),
  });
}
