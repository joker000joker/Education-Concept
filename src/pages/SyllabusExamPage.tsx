import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, FileText, Briefcase } from 'lucide-react';

export const SyllabusExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { category, exam } = useParams<{ category: string, exam: string }>();
  const decodedExam = decodeURIComponent(exam || '');

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate(`/syllabus/${category}`)} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight line-clamp-1">{decodedExam}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Link 
          to={`/syllabus/${category}/${encodeURIComponent(exam || '')}/pattern`}
          className="flex items-center gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white tracking-wide">Exam Pattern</h3>
            <p className="text-xs text-slate-400 mt-0.5">View marking scheme and structure</p>
          </div>
        </Link>

        <Link 
          to={`/syllabus/${category}/${encodeURIComponent(exam || '')}/content`}
          className="flex items-center gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
            <FileText className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white tracking-wide">Syllabus</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detailed topic-wise syllabus</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
