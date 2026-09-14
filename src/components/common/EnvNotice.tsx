import React from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Database, AlertCircle, ExternalLink } from 'lucide-react';

export const EnvNotice: React.FC = () => {
  if (isSupabaseConfigured) return null;

  return (
    <aside
      aria-label="Configuration status"
      className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-xs sm:text-sm"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Supabase Setup:</strong> Connect your Supabase project by configuring{' '}
            <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-800 font-mono text-xs">
              VITE_SUPABASE_URL
            </code>{' '}
            and{' '}
            <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-800 font-mono text-xs">
              VITE_SUPABASE_PUBLISHABLE_KEY
            </code>{' '}
            in project environment secrets.
          </span>
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 shrink-0"
        >
          <span>Supabase Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
};
