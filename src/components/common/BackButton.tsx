import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  to?: string;
  fallbackTo?: string;
  className?: string;
  forceFallback?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  to,
  fallbackTo = '/',
  className = '',
  forceFallback = false,
}) => {
  const navigate = useNavigate();
  const target = to || fallbackTo;

  const handleBack = () => {
    if (forceFallback || to) {
      navigate(target);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(target);
    }
  };

  return (
    <button
      id="back-navigation-btn"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#1B263B] hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 active:scale-95 ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
      <span>{label}</span>
    </button>
  );
};
