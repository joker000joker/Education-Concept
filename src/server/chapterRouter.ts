import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export const chapterRouter = Router();

// Enforce strict no-cache headers across all routes
chapterRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// -----------------------------------------------------------------------------
// CHAPTERS ENDPOINTS
// -----------------------------------------------------------------------------

chapterRouter.get('/chapters', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { subject } = req.query;
    let query = supabase.from('chapters').select('*').order('sort_order', { ascending: true });
    if (subject && typeof subject === 'string') {
      query = query.ilike('subject', subject.trim());
    }
    const { data, error } = await query;
    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.post('/chapters', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { id, subject, name, hindi_name, description, sort_order } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ success: false, error: 'Name and subject are required.' });
    }

    if (id) {
      const { data, error } = await supabase
        .from('chapters')
        .update({
          subject,
          name,
          hindi_name,
          description,
          sort_order: sort_order ?? 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    } else {
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          subject,
          name,
          hindi_name,
          description,
          sort_order: sort_order ?? 0
        })
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.delete('/chapters/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const chapterId = Number(req.params.id);
    const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.post('/chapters/reorder', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { orderedIds } = req.body;
    if (Array.isArray(orderedIds)) {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('chapters').update({ sort_order: index + 1 }).eq('id', id)
        )
      );
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// TESTS ENDPOINTS
// -----------------------------------------------------------------------------

chapterRouter.get('/tests', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { chapterId, subject, publishedOnly } = req.query;
    let query = supabase.from('chapter_tests').select('*').order('sort_order', { ascending: true });
    if (chapterId) {
      query = query.eq('chapter_id', Number(chapterId));
    }
    if (subject && typeof subject === 'string') {
      query = query.ilike('subject', subject.trim());
    }
    if (publishedOnly === 'true') {
      query = query.eq('published', true);
    }
    const { data, error } = await query;
    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.get('/tests/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const testId = Number(req.params.id);
    const { data, error } = await supabase.from('chapter_tests').select('*').eq('id', testId).single();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message });
  }
});

chapterRouter.post('/tests', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const { id, chapter_id, title, subject, total_questions, total_marks, duration_minutes, negative_marking, published, sort_order } = req.body;
    if (!title || !chapter_id) {
      return res.status(400).json({ success: false, error: 'Title and chapter_id are required.' });
    }

    if (id) {
      const { data, error } = await supabase
        .from('chapter_tests')
        .update({
          chapter_id,
          title,
          subject,
          total_questions: total_questions || 0,
          total_marks: total_marks ?? 50,
          duration_minutes: duration_minutes ?? 20,
          negative_marking: negative_marking ?? 0.25,
          published: published !== undefined ? Boolean(published) : true,
          sort_order: sort_order ?? 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    } else {
      const { data, error } = await supabase
        .from('chapter_tests')
        .insert({
          chapter_id,
          title,
          subject,
          total_questions: total_questions || 0,
          total_marks: total_marks ?? 50,
          duration_minutes: duration_minutes ?? 20,
          negative_marking: negative_marking ?? 0.25,
          published: published !== undefined ? Boolean(published) : true,
          sort_order: sort_order ?? 0
        })
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.delete('/tests/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const testId = Number(req.params.id);
    const { error } = await supabase.from('chapter_tests').delete().eq('id', testId);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.patch('/tests/:id/publish', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const testId = Number(req.params.id);
    const { published } = req.body;
    const { data, error } = await supabase
      .from('chapter_tests')
      .update({ published: Boolean(published), updated_at: new Date().toISOString() })
      .eq('id', testId)
      .select()
      .single();
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.get('/tests/:id/questions', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const testId = Number(req.params.id);
    const { data, error } = await supabase
      .from('chapter_questions')
      .select('*')
      .eq('test_id', testId)
      .order('question_order', { ascending: true });
    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

chapterRouter.post('/tests/:id/questions', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseClient(req);
    const testId = Number(req.params.id);
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'Questions array is required.' });
    }

    // Delete existing questions
    await supabase.from('chapter_questions').delete().eq('test_id', testId);

    // Insert new questions
    const formatted = questions.map((q: any, idx: number) => ({
      test_id: testId,
      question_order: q.question_order || idx + 1,
      question_text: q.question_text.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim(),
      option_d: q.option_d.trim(),
      correct_option: q.correct_option.trim().toUpperCase(),
      explanation: q.explanation ? q.explanation.trim() : null
    }));

    const { data, error } = await supabase.from('chapter_questions').insert(formatted).select();
    if (error) throw error;

    // Update total_questions in chapter_tests
    await supabase
      .from('chapter_tests')
      .update({ total_questions: formatted.length, updated_at: new Date().toISOString() })
      .eq('id', testId);

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
