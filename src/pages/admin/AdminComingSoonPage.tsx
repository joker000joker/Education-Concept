import React from 'react';
import { BackButton } from '../../components/common/BackButton';

interface Props {
  moduleName: string;
}

export const AdminComingSoonPage: React.FC<Props> = ({ moduleName }) => {
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{moduleName}</h2>
        <p className="text-slate-500">This module is coming soon in Phase B.</p>
      </div>
    </div>
  );
};
