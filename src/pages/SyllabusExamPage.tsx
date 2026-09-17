import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, FileText, Briefcase, Download, Eye, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, getSecurePdfUrl, downloadNotePdf } from '../lib/supabase';
import { ExamPattern } from '../types';
import { useToast } from '../context/ToastContext';

export const SyllabusExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { category, exam } = useParams<{ category: string; exam: string }>();
  const decodedExam = decodeURIComponent(exam || '');
  const toast = useToast();

  const [examData, setExamData] = useState<ExamPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingPattern, setOpeningPattern] = useState(false);
  const [openingSyllabus, setOpeningSyllabus] = useState(false);
  const [downloadingPattern, setDownloadingPattern] = useState(false);
  const [downloadingSyllabus, setDownloadingSyllabus] = useState(false);

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
      console.error('Error loading exam data:', err);
      setExamData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReadDocument = async (filePath: string, type: 'pattern' | 'syllabus') => {
    if (type === 'pattern') setOpeningPattern(true);
    else setOpeningSyllabus(true);

    try {
      const secureUrl = await getSecurePdfUrl(filePath);
      if (!secureUrl) {
        toast.error('Unable to generate secure document URL. Please try again.');
        return;
      }
      window.open(secureUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error opening document:', err);
      toast.error('Failed to open document: ' + (err.message || 'Unknown error'));
    } finally {
      if (type === 'pattern') setOpeningPattern(false);
      else setOpeningSyllabus(false);
    }
  };

  const handleDownloadDocument = async (filePath: string, type: 'pattern' | 'syllabus') => {
    if (type === 'pattern') setDownloadingPattern(true);
    else setDownloadingSyllabus(true);

    try {
      const fileName = `${decodedExam}_${type === 'pattern' ? 'Exam_Pattern' : 'Syllabus'}.pdf`;
      await downloadNotePdf(filePath, fileName);
      toast.success('Document downloaded successfully');
    } catch (err: any) {
      console.error('Error downloading document:', err);
      // Fallback: try opening signed URL
      try {
        const secureUrl = await getSecurePdfUrl(filePath);
        if (secureUrl) {
          window.open(secureUrl, '_blank');
        } else {
          toast.error('Download failed. Please try again.');
        }
      } catch {
        toast.error('Download failed. Please check network connection.');
      }
    } finally {
      if (type === 'pattern') setDownloadingPattern(false);
      else setDownloadingSyllabus(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(`/syllabus/${category}`)} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight line-clamp-1">{decodedExam}</h1>
          <p className="text-xs text-slate-500">Official Exam Pattern & Syllabus Guidelines</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading exam details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* SECTION 1: EXAM PATTERN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Briefcase className="w-6 h-6" />
                </div>
                {examData?.pattern_file_path ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    Not Available Yet
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-900 tracking-tight">1. Exam Pattern</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Official marking scheme, section weightage, exam duration, and structure.
              </p>

              {!examData?.pattern_file_path && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    The exam pattern document for {decodedExam} has not been uploaded yet.
                  </p>
                </div>
              )}
            </div>

            {examData?.pattern_file_path ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => handleReadDocument(examData.pattern_file_path!, 'pattern')}
                  disabled={openingPattern}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                  {openingPattern ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  <span>View Pattern</span>
                </button>
                <button
                  onClick={() => handleDownloadDocument(examData.pattern_file_path!, 'pattern')}
                  disabled={downloadingPattern}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                  {downloadingPattern ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Download</span>
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed min-h-[44px]"
              >
                Document Not Available Yet
              </button>
            )}
          </div>

          {/* SECTION 2: SYLLABUS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="w-6 h-6" />
                </div>
                {examData?.syllabus_file_path ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    Not Available Yet
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-900 tracking-tight">2. Syllabus</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Detailed topic-wise syllabus, subject breakdowns, and preparation references.
              </p>

              {!examData?.syllabus_file_path && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    The syllabus document for {decodedExam} has not been uploaded yet.
                  </p>
                </div>
              )}
            </div>

            {examData?.syllabus_file_path ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => handleReadDocument(examData.syllabus_file_path!, 'syllabus')}
                  disabled={openingSyllabus}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                  {openingSyllabus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  <span>View Syllabus</span>
                </button>
                <button
                  onClick={() => handleDownloadDocument(examData.syllabus_file_path!, 'syllabus')}
                  disabled={downloadingSyllabus}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                  {downloadingSyllabus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Download</span>
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed min-h-[44px]"
              >
                Document Not Available Yet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
