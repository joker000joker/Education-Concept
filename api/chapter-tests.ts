import express, { Express, Request, Response } from 'express';
import { chapterRouter } from '../src/server/chapterRouter';
import { setupSectionalMiddleware } from './index';

export function createChapterApiApp(): Express {
  const app = express();
  setupSectionalMiddleware(app);

  app.use('/api/chapter-tests', chapterRouter);
  app.use('/chapter-tests', chapterRouter);
  app.use('/', chapterRouter);

  app.get('/api/health', (_req: Request, res: Response) =>
    res.json({ status: 'ok', service: 'education-concept-chapter-api' })
  );
  app.get('/health', (_req: Request, res: Response) =>
    res.json({ status: 'ok', service: 'education-concept-chapter-api' })
  );

  return app;
}

const defaultChapterApiApp = createChapterApiApp();

export function chapterApiHandler(req: any, res: any) {
  let targetUrl = req.url || '';

  // 1. Recover path from Vercel query slug if present
  if (req.query?.slug) {
    const slugParts = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug];
    const slugPath = '/' + slugParts.join('/').replace(/^\/+/, '');
    const queryString = targetUrl.includes('?') ? targetUrl.slice(targetUrl.indexOf('?')) : '';
    if (slugPath.startsWith('/chapter-tests')) {
      targetUrl = '/api' + slugPath + queryString;
    } else if (slugPath.startsWith('/api/chapter-tests')) {
      targetUrl = slugPath + queryString;
    } else {
      targetUrl = '/api/chapter-tests' + slugPath + queryString;
    }
  }
  // 2. Check proxy forwarded URI headers
  else if (req.headers && typeof req.headers['x-forwarded-uri'] === 'string' && req.headers['x-forwarded-uri'].startsWith('/api/')) {
    targetUrl = req.headers['x-forwarded-uri'];
  } else if (
    req.headers &&
    typeof req.headers['x-matched-path'] === 'string' &&
    req.headers['x-matched-path'].startsWith('/api/')
  ) {
    const queryString = targetUrl.includes('?') ? targetUrl.slice(targetUrl.indexOf('?')) : '';
    targetUrl = req.headers['x-matched-path'] + queryString;
  }

  // 3. Normalize url to ensure it reaches chapterRouter
  if (
    targetUrl &&
    !targetUrl.startsWith('/api/chapter-tests') &&
    !targetUrl.startsWith('/chapter-tests')
  ) {
    const cleanUrl = targetUrl.startsWith('/') ? targetUrl : '/' + targetUrl;
    if (cleanUrl.startsWith('/api/')) {
      targetUrl = '/api/chapter-tests' + cleanUrl.slice('/api'.length);
    } else {
      targetUrl = '/api/chapter-tests' + (cleanUrl === '/' ? '' : cleanUrl);
    }
  } else if (!targetUrl || targetUrl === '/' || targetUrl === '/api') {
    targetUrl = '/api/chapter-tests';
  }

  req.url = targetUrl;
  return defaultChapterApiApp(req, res);
}

export default chapterApiHandler;
