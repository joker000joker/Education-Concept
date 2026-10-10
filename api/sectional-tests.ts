import { Router, Request, Response, Express } from 'express';
import express from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { chapterRouter } from '../src/server/chapterRouter';

// Resolve Supabase configuration from environment variables
const SUPABASE_URL = (
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ''
).trim();

const SUPABASE_KEY = (
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  ''
).trim();

export interface SectionalTestRecord {
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

export interface SectionalQuestionRecord {
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

/**
 * Returns a Supabase client scoped to the incoming request.
 * If the caller provided an Authorization Bearer token (admin or authenticated user),
 * it forwards it to Supabase so PostgreSQL Row Level Security (RLS) and public.is_admin()
 * evaluate authoritatively.
 */
export function getSupabaseClient(req?: Request): SupabaseClient {
  const authHeader = req?.headers?.authorization;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export function setupSectionalMiddleware(app: Express): void {
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
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
}

export const sectionalRouter = Router();

// Enforce strict no-cache headers across all sectional test routes
sectionalRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// -----------------------------------------------------------------------------
// GET /: Fetch list of tests from Supabase
// -----------------------------------------------------------------------------
sectionalRouter.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { subject, publishedOnly } = req.query;

    let query = supabase.from('sectional_tests').select('*');

    if (publishedOnly === 'true') {
      query = query.eq('published', true);
    }

    if (subject && subject !== 'All') {
      const target = String(subject).trim();
      query = query.ilike('subject', target);
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SectionalRouter] Supabase GET / error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (err: any) {
    console.error('[SectionalRouter] GET / exception:', err);
    return res.status(500).json({ error: err?.message || 'Failed to fetch sectional tests from Supabase' });
  }
});

// -----------------------------------------------------------------------------
// GET /:id: Fetch single test from Supabase
// -----------------------------------------------------------------------------
sectionalRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const targetId = Number(req.params.id);

    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid test id' });
    }

    const { data, error } = await supabase
      .from('sectional_tests')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (error) {
      console.error('[SectionalRouter] Supabase GET /:id error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Sectional test not found' });
    }

    return res.json(data);
  } catch (err: any) {
    console.error('[SectionalRouter] GET /:id exception:', err);
    return res.status(500).json({ error: err?.message || 'Failed to fetch test from Supabase' });
  }
});

// -----------------------------------------------------------------------------
// GET /:id/questions: Fetch questions from Supabase
// -----------------------------------------------------------------------------
sectionalRouter.get('/:id/questions', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const targetId = Number(req.params.id);

    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid test id' });
    }

    const { data, error } = await supabase
      .from('sectional_questions')
      .select('*')
      .eq('test_id', targetId)
      .order('question_order', { ascending: true });

    if (error) {
      console.error('[SectionalRouter] Supabase GET /:id/questions error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (err: any) {
    console.error('[SectionalRouter] GET /:id/questions exception:', err);
    return res.status(500).json({ error: err?.message || 'Failed to fetch questions from Supabase' });
  }
});

// -----------------------------------------------------------------------------
// POST /: Create or update test and its questions in Supabase
// -----------------------------------------------------------------------------
sectionalRouter.post('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { test, questions } = req.body;

    if (!test || !test.title) {
      return res.status(400).json({ error: 'Test title is required' });
    }

    const testId = test.id ? Number(test.id) : undefined;
    const totalQ = Array.isArray(questions) ? questions.length : Number(test.total_questions || 0);

    let savedTestRecord: any = null;

    if (testId) {
      const { data: existing } = await supabase
        .from('sectional_tests')
        .select('id, sort_order, created_at')
        .eq('id', testId)
        .maybeSingle();

      if (existing) {
        const { data: updated, error: updateErr } = await supabase
          .from('sectional_tests')
          .update({
            title: String(test.title || '').trim(),
            subject: String(test.subject || 'Mathematics'),
            total_questions: totalQ,
            total_marks: Number(test.total_marks) || 50,
            duration_minutes: Number(test.duration_minutes) || 20,
            negative_marking: Number(test.negative_marking ?? 0.25),
            published: test.published !== undefined ? Boolean(test.published) : true,
            sort_order: test.sort_order !== undefined ? Number(test.sort_order) : existing.sort_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', testId)
          .select()
          .single();

        if (updateErr) {
          console.error('[SectionalRouter] Supabase test UPDATE error:', updateErr.message);
          return res.status(500).json({ error: updateErr.message });
        }
        savedTestRecord = updated;
      }
    }

    if (!savedTestRecord) {
      const insertPayload: any = {
        title: String(test.title || '').trim(),
        subject: String(test.subject || 'Mathematics'),
        total_questions: totalQ,
        total_marks: Number(test.total_marks) || 50,
        duration_minutes: Number(test.duration_minutes) || 20,
        negative_marking: Number(test.negative_marking ?? 0.25),
        published: test.published !== undefined ? Boolean(test.published) : true,
        sort_order: test.sort_order !== undefined ? Number(test.sort_order) : 0,
        created_at: test.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (testId) {
        insertPayload.id = testId;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('sectional_tests')
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) {
        console.error('[SectionalRouter] Supabase test INSERT error:', insertErr.message);
        return res.status(500).json({ error: insertErr.message });
      }
      savedTestRecord = inserted;
    }

    const finalTestId = savedTestRecord.id;

    let savedQuestionsList: any[] = [];
    if (Array.isArray(questions)) {
      await supabase.from('sectional_questions').delete().eq('test_id', finalTestId);

      if (questions.length > 0) {
        const qPayload = questions.map((q: any, idx: number) => ({
          test_id: finalTestId,
          question_order: Number(q.question_order) || idx + 1,
          question_text: String(q.question_text || ''),
          option_a: String(q.option_a || ''),
          option_b: String(q.option_b || ''),
          option_c: String(q.option_c || ''),
          option_d: String(q.option_d || ''),
          correct_option: String(q.correct_option || 'A').toUpperCase(),
          explanation: q.explanation || null
        }));

        const { data: qInserted, error: qErr } = await supabase
          .from('sectional_questions')
          .insert(qPayload)
          .select()
          .order('question_order', { ascending: true });

        if (qErr) {
          console.error('[SectionalRouter] Supabase questions INSERT error:', qErr.message);
          return res.status(500).json({ error: qErr.message });
        }
        savedQuestionsList = qInserted || [];
      }
    }

    return res.json({
      success: true,
      test: savedTestRecord,
      questions: savedQuestionsList
    });
  } catch (err: any) {
    console.error('[SectionalRouter] POST / exception:', err);
    return res.status(500).json({ error: err?.message || 'Failed to save sectional test to Supabase' });
  }
});

// -----------------------------------------------------------------------------
// PATCH /:id/publish: Toggle publish status in Supabase
// -----------------------------------------------------------------------------
sectionalRouter.patch('/:id/publish', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const targetId = Number(req.params.id);
    const { published } = req.body;

    const { data, error } = await supabase
      .from('sectional_tests')
      .update({
        published: Boolean(published),
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();

    if (error) {
      console.error('[SectionalRouter] Supabase PATCH /:id/publish error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, test: data });
  } catch (err: any) {
    console.error('[SectionalRouter] PATCH /:id/publish exception:', err);
    return res.status(500).json({ error: err?.message || 'Failed to update publish state in Supabase' });
  }
});

// -----------------------------------------------------------------------------
// DELETE /:id: Delete test from Supabase (cascades to questions)
// -----------------------------------------------------------------------------
sectionalRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const targetId = Number(req.params.id);

    const { error } = await supabase
      .from('sectional_tests')
      .delete()
      .eq('id', targetId);

    if (error) {
      console.error('[SectionalRouter] Supabase DELETE /:id error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[SectionalRouter] DELETE /:id exception:', err);
    return res.status(500).json({ error: err?.message || 'Failed to delete test from Supabase' });
  }
});

// -----------------------------------------------------------------------------
// POST /reorder and PUT /reorder: Update sort order in Supabase
// -----------------------------------------------------------------------------
const handleReorder = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { testIds, orders } = req.body;

    if (Array.isArray(testIds)) {
      for (let idx = 0; idx < testIds.length; idx++) {
        await supabase
          .from('sectional_tests')
          .update({ sort_order: idx + 1, updated_at: new Date().toISOString() })
          .eq('id', Number(testIds[idx]));
      }
    } else if (Array.isArray(orders)) {
      for (const item of orders) {
        await supabase
          .from('sectional_tests')
          .update({ sort_order: Number(item.sort_order), updated_at: new Date().toISOString() })
          .eq('id', Number(item.id));
      }
    } else {
      return res.status(400).json({ error: 'Invalid reorder payload, expected testIds array or orders array' });
    }

    const { data: updatedList } = await supabase
      .from('sectional_tests')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    return res.json({ success: true, tests: updatedList || [] });
  } catch (err: any) {
    console.error('[SectionalRouter] reorder exception:', err);
    return res.status(500).json({ error: err?.message || 'Failed to reorder tests in Supabase' });
  }
};

sectionalRouter.post('/reorder', handleReorder);
sectionalRouter.put('/reorder', handleReorder);

// -----------------------------------------------------------------------------
// Vercel Serverless Function Application & Handler
// -----------------------------------------------------------------------------
export function createSectionalApiApp(): Express {
  const app = express();
  setupSectionalMiddleware(app);

  app.use('/api/sectional-tests', sectionalRouter);
  app.use('/sectional-tests', sectionalRouter);
  app.use('/api/chapter-tests', chapterRouter);
  app.use('/chapter-tests', chapterRouter);
  app.use('/', sectionalRouter);

  app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'education-concept-api' }));
  app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'education-concept-api' }));

  return app;
}

const defaultSectionalApiApp = createSectionalApiApp();

export function sectionalApiHandler(req: any, res: any) {
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/sectional-tests') && !req.url.startsWith('/chapter-tests')) {
    const cleanUrl = req.url.startsWith('/') ? req.url : '/' + req.url;
    req.url = '/api/sectional-tests' + (cleanUrl === '/' ? '' : cleanUrl);
  } else if (!req.url) {
    req.url = '/api/sectional-tests';
  }
  return defaultSectionalApiApp(req, res);
}

export default sectionalApiHandler;
