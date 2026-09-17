import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, GraduationCap, Loader2, FileText, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ExamPattern } from '../types';

export const SyllabusCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [exams, setExams] = useState<ExamPattern[]>([]);
  const [loading, setLoading] = useState(true);

  let title = 'Exams';
  if (category === 'ssc') title = 'SSC Exams';
  if (category === 'railway') title = 'Railway Exams';
  if (category === 'state-exams') title = 'State Exams';
  if (category === 'bihar') title = 'Bihar Exams';
  if (category === 'up') title = 'UP Exams';

  useEffect(() => {
    loadCategoryExams();
  }, [category]);

  const loadCategoryExams = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('exam_patterns')
        .select('*')
        .eq('published', true);

      if (category === 'ssc') {
        query = query.eq('exam_category', 'SSC');
      } else if (category === 'railway') {
        query = query.eq('exam_category', 'Railway');
      } else if (category === 'state-exams') {
        query = query.in('exam_category', ['Bihar', 'UP']);
      } else if (category === 'bihar') {
        query = query.eq('exam_category', 'Bihar');
      } else if (category === 'up') {
        query = query.eq('exam_category', 'UP');
      }

      const { data, error } = await query.order('exam_name', { ascending: true });

      if (error) throw error;
      setExams((data || []) as ExamPattern[]);
    } catch (err) {
      console.error('Error loading syllabus exams:', err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate('/syllabus')} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading exams...</p>
        </div>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              to={`/syllabus/${category}/${encodeURIComponent(exam.exam_name)}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white tracking-wide break-words">{exam.exam_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                      {exam.exam_category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
                  exam.pattern_file_path
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {exam.pattern_file_path ? <Check className="w-3 h-3" /> : null}
                  Pattern {exam.pattern_file_path ? 'Ready' : 'Pending'}
                </span>

                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
                  exam.syllabus_file_path
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {exam.syllabus_file_path ? <Check className="w-3 h-3" /> : null}
                  Syllabus {exam.syllabus_file_path ? 'Ready' : 'Pending'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs mt-8 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Published Exams Yet</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Exam pattern and syllabus documents for this category are being prepared and will appear here as soon as published.
          </p>
        </div>
      )}
    </div>
  );
};
