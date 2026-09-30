// Ensure global.__dirname does not break ESM createRequire in Node 22
if (typeof (globalThis as any).__dirname === 'string' && (globalThis as any).__dirname === '.') {
  delete (globalThis as any).__dirname;
}

import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';

// Parse command line arguments
const args = process.argv.slice(2);
let port = 3000;
const portIdx = args.findIndex((a) => a === '--port' || a === '-p');
if (portIdx !== -1 && args[portIdx + 1]) {
  port = parseInt(args[portIdx + 1], 10);
} else if (process.env.PORT) {
  port = parseInt(process.env.PORT, 10);
}

let host = '0.0.0.0';
const hostIdx = args.findIndex((a) => a === '--host');
if (hostIdx !== -1) {
  if (args[hostIdx + 1] && !args[hostIdx + 1].startsWith('-')) {
    host = args[hostIdx + 1];
  } else {
    host = '0.0.0.0';
  }
}

import { sectionalRouter, setupSectionalMiddleware } from './src/server/sectionalRouter';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS for cross-origin requests from preview iframe, mobile, and desktop
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ---------------------------------------------------------------------------
  // SECTIONAL TESTS API ROUTES
  // Mounted directly from sectionalRouter for unified logic
  // ---------------------------------------------------------------------------
  app.use('/api/sectional-tests', sectionalRouter);
  app.use('/sectional-tests', sectionalRouter);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'education-concept-api' }));

  // ---------------------------------------------------------------------------
  // VITE / STATIC FRONTEND SERVING
  // ---------------------------------------------------------------------------

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });

    app.use(express.static(path.resolve(process.cwd(), 'public')));
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);

        // Ensure the error shield executes before any injected Vite client scripts
        const scriptMatch = template.match(/<!-- Suppress benign Vite HMR logs and errors in preview sandbox iframe -->[\s\S]*?<\/script>/);
        if (scriptMatch) {
          const shieldScript = scriptMatch[0];
          template = template.replace(shieldScript, '');
          template = template.replace('<head>', '<head>\n    ' + shieldScript);
        }

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(port, host, () => {
    console.log(`[Education Concept Server] Running on http://${host}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
  process.exit(1);
});
