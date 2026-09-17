import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Briefcase, Download, Eye, Loader2, AlertCircle } from 'lucide-react';
import { supabase, getSecurePdfUrl, downloadNotePdf } from '../lib/supabase';
import { ExamPattern } from '../types';
import { useToast } from '../context/ToastContext';

export const SyllabusContentPage: React.FC = () => {
  const navigate = useNavigate();
  const { category, exam, type } = useParams<{ category: string; exam: string; type: string }>();
  const decodedExam = decodeURIComponent(exam || '');
  const toast = useToast();

  const isPattern = type === 'pattern';
  const pageTitle = isPattern ? 'Exam Pattern' : 'Syllabus';
  const emptyTitle = isPattern ? 'No Exam Pattern Available' : 'No Syllabus Available';
  const emptySubtitle = isPattern
    ? 'Official Exam Pattern has not been uploaded yet for this exam.'
    : 'Detailed Syllabus document has not been uploaded yet for this exam.';
  const Icon = isPattern ? Briefcase : FileText;

  const [examData, setExamData] = useState<ExamPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadExamData();
  }, [decodedExam]);

  const loadExamData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_patterns')
        .select('*')
        .eq('exam_name', decodedExam)
        .eq('published', true)
        .maybeSingle();

      if (error) throw error;
      setExamData(data as ExamPattern | null);
    } catch (err) {
      console.error('Error fetching exam record:', err);
      setExamData(null);
    } finally {
      setLoading(false);
    }
  };

  const filePath = isPattern ? examData?.pattern_file_path : examData?.syllabus_file_path;

  const handleRead = async () => {
    if (!filePath) return;
    setOpening(true);
    try {
      const secureUrl = await getSecurePdfUrl(filePath);
      if (!secureUrl) {
        toast.error('Unable to generate secure link. Please try again.');
        return;
      }
      window.open(secureUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error('Failed to open document: ' + (err.message || 'Unknown error'));
    } finally {
      setOpening(false);
    }
  };

  const handleDownload = async () => {
    if (!filePath) return;
    setDownloading(true);
    try {
      const fileName = `${decodedExam}_${isPattern ? 'Pattern' : 'Syllabus'}.pdf`;
      await downloadNotePdf(filePath, fileName);
      toast.success('Document downloaded successfully');
    } catch (err) {
      try {
        const secureUrl = await getSecurePdfUrl(filePath);
        if (secureUrl) {
          window.open(secureUrl, '_blank');
        } else {
          toast.error('Download failed. Please try again.');
        }
      } catch {
        toast.error('Download failed. Please check your connection.');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(`/syllabus/${category}/${encodeURIComponent(exam || '')}`)} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight line-clamp-1">{pageTitle}</h1>
          <p className="text-xs text-slate-500">{decodedExam}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Checking document availability...</p>
        </div>
      ) : filePath ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs mt-8 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">{pageTitle} Document Ready</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Official guidelines and document file for {decodedExam}.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRead}
              disabled={opening}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              <span>View Document</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold border border-slate-200 transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs mt-8 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">{emptyTitle}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {emptySubtitle}
          </p>
        </div>
      )}
    </div>
  );
};
