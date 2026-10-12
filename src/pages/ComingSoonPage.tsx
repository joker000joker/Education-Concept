import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const ComingSoonPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-[#F4F8FF] md:bg-slate-50 dark:bg-[#0B0F19]">
      <div className="max-w-md w-full bg-white dark:bg-[#141C2E] rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none p-10 text-center border border-slate-100 dark:border-slate-800">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-[#F8FAFC] mb-4 font-display">
          Coming Soon
        </h1>
        
        <p className="text-slate-600 dark:text-[#CBD5E1] mb-8 leading-relaxed">
          EC Test is currently under development. 
          We’re preparing a powerful premium testing experience for you.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center space-x-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-4 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};
