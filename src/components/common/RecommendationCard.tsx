import React from 'react';
import { Link } from 'react-router-dom';
import { TopRecommendation } from '../../types';
import {
  FileText, Book, BookOpen, Newspaper, GraduationCap,
  Library, ArrowRight, ExternalLink
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: TopRecommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const item = recommendation.resolved_item;
  if (!item) return null;

  // Metadata styling and icons based on content type
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'notes':
        return {
          label: 'Notes',
          badgeBg: 'bg-red-50',
          badgeText: 'text-red-700',
          badgeBorder: 'border-red-200',
          iconBg: 'bg-red-100 text-red-600',
          Icon: FileText,
          actionText: 'Read Note',
        };
      case 'paid_ebooks':
        return {
          label: 'Paid E-Book',
          badgeBg: 'bg-purple-50',
          badgeText: 'text-purple-700',
          badgeBorder: 'border-purple-200',
          iconBg: 'bg-purple-100 text-purple-600',
          Icon: Book,
          actionText: 'View E-Book',
        };
      case 'free_ebooks':
        return {
          label: 'Free E-Book',
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          badgeBorder: 'border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-600',
          Icon: BookOpen,
          actionText: 'Read Free',
        };
      case 'current_affairs':
        return {
          label: 'Current Affairs',
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-700',
          badgeBorder: 'border-blue-200',
          iconBg: 'bg-blue-100 text-blue-600',
          Icon: Newspaper,
          actionText: 'Read Document',
        };
      case 'exam_patterns':
        return {
          label: 'Pattern & Syllabus',
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-800',
          badgeBorder: 'border-amber-200',
          iconBg: 'bg-amber-100 text-amber-700',
          Icon: GraduationCap,
          actionText: 'View Pattern',
        };
      case 'study_resources':
        return {
          label: 'Study Resource',
          badgeBg: 'bg-teal-50',
          badgeText: 'text-teal-800',
          badgeBorder: 'border-teal-200',
          iconBg: 'bg-teal-100 text-teal-700',
          Icon: Library,
          actionText: 'Explore',
        };
      default:
        return {
          label: 'Recommended',
          badgeBg: 'bg-slate-50',
          badgeText: 'text-slate-700',
          badgeBorder: 'border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700',
          Icon: FileText,
          actionText: 'View Content',
        };
    }
  };

  const meta = getTypeMeta(recommendation.content_type);
  const IconComponent = meta.Icon;

  return (
    <>
      {/* MOBILE VIEW (< lg) */}
      <div
        id={`rec-card-mobile-${recommendation.id}`}
        className="block lg:hidden group relative bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${meta.iconBg} shadow-xs`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                {meta.label}
              </span>
              {item.category && (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                  {item.category}
                </span>
              )}
            </div>

            <Link to={item.destination_url} className="block">
              <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
            </Link>

            {item.price !== undefined && item.price > 0 && (
              <p className="text-xs font-bold text-slate-900 mt-1">₹{item.price}</p>
            )}

            <div className="mt-3">
              <Link
                to={item.destination_url}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#0C122A] hover:bg-blue-600 active:bg-blue-700 shadow-sm transition-colors"
              >
                <span>{meta.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW (>= lg) */}
      <div
        id={`rec-card-desktop-${recommendation.id}`}
        className="hidden lg:flex group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex-col justify-between"
      >
        <div>
          {/* Header Row: Content Type Badge & Category */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg} group-hover:scale-105 transition-transform`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                {meta.label}
              </span>
            </div>

            {item.category && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[150px]">
                {item.category}
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={item.destination_url} className="block group-hover:text-blue-700 transition-colors">
            <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
              {item.title}
            </h3>
          </Link>

          {/* Description / Subtitle */}
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {item.description || (
              recommendation.content_type === 'exam_patterns'
                ? `Official syllabus and detailed pattern guide for ${item.title}.`
                : recommendation.content_type === 'current_affairs'
                ? 'Curated exam-oriented current affairs compilation.'
                : 'Top selected resource recommended by experts for comprehensive preparation.'
            )}
          </p>
        </div>

        {/* Footer info & action */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            {item.price !== undefined && item.price > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Price:</span>
                <span className="text-sm font-black text-slate-900">₹{item.price}</span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-400">Recommended Resource</span>
            )}

            <span className="text-xs text-blue-600 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Explore <ExternalLink className="w-3 h-3" />
            </span>
          </div>

          <Link
            id={`rec-btn-${recommendation.id}-desktop`}
            to={item.destination_url}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0C122A] hover:bg-blue-600 active:bg-blue-700 shadow-xs transition-colors"
          >
            <span>{meta.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
};
