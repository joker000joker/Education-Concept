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

// Persistent database path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'sectional_tests.json');

interface SectionalTestRecord {
  id: number;
  title: string;
  subject: string;
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  negative_marking: number;
  published: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

interface SectionalQuestionRecord {
  id: number;
  test_id: number;
  question_order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string | null;
}

interface DatabaseStructure {
  tests: SectionalTestRecord[];
  questions: Record<string, SectionalQuestionRecord[]>;
}

function ensureDataFile(): DatabaseStructure {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tests) && parsed.questions) {
        return parsed;
      }
    } catch (err) {
      console.error('[Server DB] Error reading sectional_tests.json, initializing fresh', err);
    }
  }

  const initialDb: DatabaseStructure = {
    tests: [],
    questions: {}
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  return initialDb;
}

function saveDb(data: DatabaseStructure): void {
  try {
    const tmpFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('[Server DB] Error saving sectional_tests.json atomically, trying direct write', err);
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (directErr) {
      console.error('[Server DB] Direct write also failed', directErr);
    }
  }
}

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

  // Initialize DB
  let db = ensureDataFile();

  // ---------------------------------------------------------------------------
  // SECTIONAL TESTS API ROUTES
  // Shared single source of truth for both Mobile and Desktop
  // Prevent any browser/proxy/CDN caching across devices
  // ---------------------------------------------------------------------------
  app.use('/api/sectional-tests', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // GET /api/sectional-tests
  app.get('/api/sectional-tests', (req: Request, res: Response) => {
    db = ensureDataFile();
    const { subject, publishedOnly } = req.query;
    let list = [...db.tests];

    if (publishedOnly === 'true') {
      list = list.filter((t) => t.published !== false);
    }

    if (subject && subject !== 'All') {
      const target = String(subject).trim().toLowerCase();
      list = list.filter(
        (t) => (t.subject || '').trim().toLowerCase() === target
      );
    }

    // Sort by sort_order ascending (if defined), then created_at descending (newest first)
    list.sort((a, b) => {
      const orderA = (a.sort_order !== undefined && a.sort_order !== null) ? Number(a.sort_order) : Infinity;
      const orderB = (b.sort_order !== undefined && b.sort_order !== null) ? Number(b.sort_order) : Infinity;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    res.json(list);
  });

  // GET /api/sectional-tests/:id
  app.get('/api/sectional-tests/:id', (req: Request, res: Response) => {
    db = ensureDataFile();
    const targetId = Number(req.params.id);
    const test = db.tests.find((t) => Number(t.id) === targetId);
    if (!test) {
      return res.status(404).json({ error: 'Sectional test not found' });
    }
    res.json(test);
  });

  // GET /api/sectional-tests/:id/questions
  app.get('/api/sectional-tests/:id/questions', (req: Request, res: Response) => {
    db = ensureDataFile();
    const targetId = String(req.params.id);
    const qList = db.questions[targetId] || [];
    // Sort by question_order ascending
    const sorted = [...qList].sort((a, b) => (a.question_order || 0) - (b.question_order || 0));
    res.json(sorted);
  });

  // POST /api/sectional-tests (Create or Update Test)
  app.post('/api/sectional-tests', (req: Request, res: Response) => {
    db = ensureDataFile();
    const { test, questions } = req.body;

    if (!test || !test.title) {
      return res.status(400).json({ error: 'Test title is required' });
    }

    const testId = test.id ? Number(test.id) : Date.now();
    const totalQ = Array.isArray(questions) ? questions.length : Number(test.total_questions || 0);

    const existingIdx = db.tests.findIndex((t) => Number(t.id) === testId);
    const existingSortOrder = existingIdx >= 0 ? db.tests[existingIdx].sort_order : undefined;

    const testRecord: SectionalTestRecord = {
      id: testId,
      title: String(test.title || '').trim(),
      subject: String(test.subject || 'Mathematics'),
      total_questions: totalQ,
      total_marks: Number(test.total_marks) || 50,
      duration_minutes: Number(test.duration_minutes) || 20,
      negative_marking: Number(test.negative_marking ?? 0.25),
      published: test.published !== undefined ? Boolean(test.published) : true,
      sort_order: test.sort_order !== undefined ? Number(test.sort_order) : existingSortOrder,
      created_at: test.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      // Preserve original created_at if already exists
      testRecord.created_at = db.tests[existingIdx].created_at || testRecord.created_at;
      db.tests[existingIdx] = testRecord;
    } else {
      db.tests.unshift(testRecord);
    }

    // Save questions
    if (Array.isArray(questions)) {
      const qRecords: SectionalQuestionRecord[] = questions.map((q: any, idx: number) => ({
        id: q.id ? Number(q.id) : Number(`${testId}${idx + 1}`),
        test_id: testId,
        question_order: Number(q.question_order) || idx + 1,
        question_text: String(q.question_text || ''),
        option_a: String(q.option_a || ''),
        option_b: String(q.option_b || ''),
        option_c: String(q.option_c || ''),
        option_d: String(q.option_d || ''),
        correct_option: String(q.correct_option || 'A').toUpperCase(),
        explanation: q.explanation || null
      }));
      db.questions[String(testId)] = qRecords;
    }

    saveDb(db);

    res.json({
      success: true,
      test: testRecord,
      questions: db.questions[String(testId)] || []
    });
  });

  // POST /api/sectional-tests/sync
  // Merges any tests from a client device (e.g. tests created on mobile)
  app.post('/api/sectional-tests/sync', (req: Request, res: Response) => {
    db = ensureDataFile();
    const { tests: incomingTests, questionsMap } = req.body;
    let modified = false;

    if (Array.isArray(incomingTests)) {
      for (const item of incomingTests) {
        if (!item || !item.title) continue;
        const incomingId = Number(item.id);
        const incomingTitle = String(item.title).toLowerCase().trim();

        // Check if exists by ID or exact title
        const existingIdx = db.tests.findIndex(
          (t) => Number(t.id) === incomingId || t.title.toLowerCase().trim() === incomingTitle
        );

        if (existingIdx >= 0) {
          // If incoming has total_questions or is valid, update non-destructive fields
          const existing = db.tests[existingIdx];
          db.tests[existingIdx] = {
            ...existing,
            title: item.title || existing.title,
            subject: item.subject || existing.subject,
            total_questions: item.total_questions || existing.total_questions,
            total_marks: item.total_marks || existing.total_marks,
            duration_minutes: item.duration_minutes || existing.duration_minutes,
            negative_marking: item.negative_marking !== undefined ? item.negative_marking : existing.negative_marking,
            published: item.published !== undefined ? item.published : existing.published,
            sort_order: item.sort_order !== undefined ? item.sort_order : existing.sort_order,
            updated_at: item.updated_at || new Date().toISOString()
          };
          modified = true;
        } else {
          // New test from mobile! Add it to the shared database
          const newRecord: SectionalTestRecord = {
            id: incomingId || Date.now(),
            title: String(item.title).trim(),
            subject: String(item.subject || 'Mathematics'),
            total_questions: Number(item.total_questions) || 0,
            total_marks: Number(item.total_marks) || 50,
            duration_minutes: Number(item.duration_minutes) || 20,
            negative_marking: Number(item.negative_marking ?? 0.25),
            published: item.published !== undefined ? Boolean(item.published) : true,
            sort_order: item.sort_order !== undefined ? Number(item.sort_order) : undefined,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString()
          };
          db.tests.unshift(newRecord);
          modified = true;
        }
      }
    }

    if (questionsMap && typeof questionsMap === 'object') {
      for (const [tId, qList] of Object.entries(questionsMap)) {
        if (Array.isArray(qList) && qList.length > 0) {
          db.questions[String(tId)] = qList.map((q: any, idx: number) => ({
            id: q.id ? Number(q.id) : Number(`${tId}${idx + 1}`),
            test_id: Number(tId),
            question_order: Number(q.question_order) || idx + 1,
            question_text: String(q.question_text || ''),
            option_a: String(q.option_a || ''),
            option_b: String(q.option_b || ''),
            option_c: String(q.option_c || ''),
            option_d: String(q.option_d || ''),
            correct_option: String(q.correct_option || 'A').toUpperCase(),
            explanation: q.explanation || null
          }));
          modified = true;
        }
      }
    }

    if (modified) {
      saveDb(db);
    }

    res.json({
      success: true,
      tests: db.tests,
      questions: db.questions
    });
  });

  // PATCH /api/sectional-tests/:id/publish (Toggle Published)
  app.patch('/api/sectional-tests/:id/publish', (req: Request, res: Response) => {
    db = ensureDataFile();
    const targetId = Number(req.params.id);
    const { published } = req.body;
    const test = db.tests.find((t) => Number(t.id) === targetId);

    if (!test) {
      return res.status(404).json({ error: 'Sectional test not found' });
    }

    test.published = Boolean(published);
    test.updated_at = new Date().toISOString();
    saveDb(db);

    res.json({ success: true, test });
  });

  // DELETE /api/sectional-tests/:id
  app.delete('/api/sectional-tests/:id', (req: Request, res: Response) => {
    db = ensureDataFile();
    const targetId = Number(req.params.id);
    db.tests = db.tests.filter((t) => Number(t.id) !== targetId);
    delete db.questions[String(targetId)];
    saveDb(db);
    res.json({ success: true });
  });

  // POST & PUT /api/sectional-tests/reorder (Drag-and-Drop Reordering)
  const handleReorderTests = (req: Request, res: Response) => {
    db = ensureDataFile();
    const { testIds, orders } = req.body;

    if (Array.isArray(testIds)) {
      const idMap = new Map(testIds.map((id: any, idx: number) => [Number(id), idx + 1]));
      for (const t of db.tests) {
        if (idMap.has(Number(t.id))) {
          t.sort_order = idMap.get(Number(t.id));
          t.updated_at = new Date().toISOString();
        }
      }
      // Re-sort db.tests in place
      db.tests.sort((a, b) => {
        const orderA = (a.sort_order !== undefined && a.sort_order !== null) ? Number(a.sort_order) : Infinity;
        const orderB = (b.sort_order !== undefined && b.sort_order !== null) ? Number(b.sort_order) : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      saveDb(db);
      return res.json({ success: true, tests: db.tests });
    } else if (Array.isArray(orders)) {
      for (const item of orders) {
        const target = db.tests.find((t) => Number(t.id) === Number(item.id));
        if (target) {
          target.sort_order = Number(item.sort_order);
          target.updated_at = new Date().toISOString();
        }
      }
      db.tests.sort((a, b) => {
        const orderA = (a.sort_order !== undefined && a.sort_order !== null) ? Number(a.sort_order) : Infinity;
        const orderB = (b.sort_order !== undefined && b.sort_order !== null) ? Number(b.sort_order) : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      saveDb(db);
      return res.json({ success: true, tests: db.tests });
    }

    return res.status(400).json({ error: 'Invalid reorder payload, expected testIds array or orders array' });
  };

  app.post('/api/sectional-tests/reorder', handleReorderTests);
  app.put('/api/sectional-tests/reorder', handleReorderTests);

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
