import express from 'express';
import { sectionalRouter, setupSectionalMiddleware } from '../src/server/sectionalRouter';

const app = express();

// Apply JSON parser, CORS, and limits
setupSectionalMiddleware(app);

// Mount sectionalRouter at both paths to ensure proper routing whether Vercel preserves or strips /api
app.use('/api/sectional-tests', sectionalRouter);
app.use('/sectional-tests', sectionalRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'education-concept-api' }));

// Vercel serverless function entrypoint with URL normalization
export default function handler(req: any, res: any) {
  // If Vercel rewrote the path or passed it through a sub-route without prefix
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/sectional-tests')) {
    const cleanUrl = req.url.startsWith('/') ? req.url : '/' + req.url;
    req.url = '/api/sectional-tests' + (cleanUrl === '/' ? '' : cleanUrl);
  }
  return app(req, res);
}
