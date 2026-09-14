import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';
import { getCategoryMeta } from '../../data/categories';
import { DynamicIcon } from './DynamicIcon';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  noteCount?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, noteCount }) => {
  const meta = getCategoryMeta(category.name || category.id);
  const slug = encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'));

  return (
    <Link
      id={`category-card-${category.id}`}
      to={`/subjects/${slug}`}
      className={`group relative p-5 rounded-2xl border ${meta.borderColor} ${meta.bgColor} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`p-3 rounded-xl bg-white shadow-xs border ${meta.borderColor} ${meta.color} group-hover:scale-105 transition-transform`}>
          <DynamicIcon name={meta.iconName} className="w-6 h-6" />
        </div>
        
        {typeof noteCount === 'number' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/80 border border-slate-200/80 text-slate-700 shadow-2xs">
            {noteCount} {noteCount === 1 ? 'Note' : 'Notes'}
          </span>
        ) : (
          <span className="p-1 rounded-full text-slate-400 group-hover:text-slate-700 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
          {category.name}
        </h3>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {meta.description}
        </p>
      </div>
    </Link>
  );
};
