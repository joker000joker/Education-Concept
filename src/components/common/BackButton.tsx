import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  fallbackTo?: string;
  className?: string;
  forceFallback?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  fallbackTo = '/',
  className = '',
  forceFallback = false,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (forceFallback) {
      navigate(fallbackTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <button
      id="back-navigation-btn"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 active:scale-95 ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-700" />
      <span>{label}</span>
    </button>
  );
};
