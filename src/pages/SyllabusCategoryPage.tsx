import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, GraduationCap } from 'lucide-react';

const EXAM_DATA: Record<string, string[]> = {
  'ssc': [
    'SSC CGL', 'SSC CHSL', 'SSC MTS', 'SSC GD', 'SSC CPO', 'SSC Stenographer', 'SSC Selection Post'
  ],
  'railway': [
    'RRB NTPC', 'RRB Group D', 'RRB ALP', 'RRB Technician Grade I Signal', 'RRB Technician Grade III', 'RPF'
  ],
  'state-exams': [
    'Bihar Daroga', 'Bihar Police', 'UP Daroga', 'UP Police'
  ]
};

export const SyllabusCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  
  const exams = EXAM_DATA[category || ''] || [];
  
  let title = 'Exams';
  if (category === 'ssc') title = 'SSC Exams';
  if (category === 'railway') title = 'Railway Exams';
  if (category === 'state-exams') title = 'State Exams';

  return (
    <div className="px-4 py-6 pb-24 min-h-screen bg-[#F4F8FF]">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate('/syllabus')} 
          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      {exams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {exams.map((exam) => (
            <Link
              key={exam}
              to={`/syllabus/${category}/${encodeURIComponent(exam)}`}
              className="flex items-center gap-4 p-4 bg-[#0C122A] rounded-2xl border border-[#1E2756] shadow-lg shadow-[#0C122A]/20 active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white tracking-wide">{exam}</h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          No exams found for this category.
        </div>
      )}
    </div>
  );
};
