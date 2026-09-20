import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DailyQuizIcon,
  ChapterTestIcon,
  SectionalTestIcon,
  TestPassIcon,
  LiveTestIcon,
  CreateTestIcon
} from '../components/icons/PremiumServiceIcons';
import { Sparkles, ArrowRight, X, Clock, CheckCircle, ShieldCheck } from 'lucide-react';

interface TestModuleCard {
  id: string;
  title: string;
  hindiTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  isActive: boolean;
  link: string;
  description: string;
  badge: string;
}

export const TestsLandingPage: React.FC = () => {
  const [comingSoonModal, setComingSoonModal] = useState<string | null>(null);

  const testCards: TestModuleCard[] = [
    {
      id: 'sectional',
      title: 'Sectional Tests',
      hindiTitle: 'सेक्शनल टेस्ट',
      icon: SectionalTestIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      isActive: true,
      link: '/tests/sectional',
      description: 'Subject-wise complete tests for all 12 core competitive subjects with timed analysis.',
      badge: 'Active'
    },
    {
      id: 'daily-quiz',
      title: 'Daily Quiz',
      hindiTitle: 'दैनिक क्विज़',
      icon: DailyQuizIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      isActive: false,
      link: '/tests/daily-quiz',
      description: 'Daily quick mock questions with instant timer and explanation for daily speed practice.',
      badge: 'Coming Soon'
    },
    {
      id: 'chapter-wise',
      title: 'Chapter Wise Test',
      hindiTitle: 'अध्याय-वार टेस्ट',
      icon: ChapterTestIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      isActive: false,
      link: '/tests/chapter-wise',
      description: 'Topic & chapter specific assessment tests for targeted practice and conceptual mastery.',
      badge: 'Coming Soon'
    },
    {
      id: 'test-pass',
      title: 'Test Pass',
      hindiTitle: 'टेस्ट पास',
      icon: TestPassIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      isActive: false,
      link: '/tests/test-pass',
      description: 'All-access pass unlocking unlimited test series and previous papers across examinations.',
      badge: 'Coming Soon'
    }
  ];

  return (
    <div className="min-h-screen pb-16 bg-[#F4F8FF] md:bg-slate-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-blue-700 to-blue-900 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            Education Concept Test Series
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            EC Test Portal
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl mx-auto">
            Comprehensive exam-simulation mock tests designed with accurate timing, negative marking, and real-time review.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Test Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select a module to practice and prepare
            </p>
          </div>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testCards.map((card) => {
            const Icon = card.icon;
            if (card.isActive) {
              return (
                <Link
                  key={card.id}
                  to={card.link}
                  className={`group block bg-white rounded-2xl border-2 ${card.border} p-6 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1 relative overflow-hidden`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {card.hindiTitle}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600 group-hover:text-purple-700">
                    <span>Enter Sectional Tests</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            }

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setComingSoonModal(card.title)}
                className="text-left bg-white/70 hover:bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all duration-200 relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} opacity-80 flex items-center justify-center`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {card.hindiTitle}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {card.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Under Development</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 rounded text-slate-500">Preview</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Modal */}
      {comingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setComingSoonModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {comingSoonModal}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This module is currently in development and will be activated in an upcoming update. Currently, <strong>Sectional Test</strong> is live with all 12 core subjects!
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                to="/tests/sectional"
                onClick={() => setComingSoonModal(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
              >
                Go to Sectional Test
              </Link>
              <button
                onClick={() => setComingSoonModal(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
