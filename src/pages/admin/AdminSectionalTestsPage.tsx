import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  fetchSectionalTests,
  fetchSectionalQuestions,
  saveSectionalTest,
  deleteSectionalTest,
  togglePublishSectionalTest,
  reorderSectionalTests,
  syncLocalTestsWithServer,
  SECTIONAL_SUBJECTS
} from '../../services/sectionalTestService';
import { SectionalTest, SectionalQuestion, SectionalSubject } from '../../types';
import { parseBulkQuestions, SAMPLE_QUESTIONS_TEMPLATE, ParsedQuestion } from '../../lib/questionParser';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FileQuestion,
  Loader2,
  X,
  Layers,
  Sparkles,
  Eye,
  AlertTriangle,
  Clock,
  Award,
  HelpCircle,
  Copy,
  BookOpen,
  ArrowRight,
  Database,
  Filter,
  RefreshCw,
  GripVertical
} from 'lucide-react';

export const AdminSectionalTestsPage: React.FC = () => {
  const toast = useToast();

  const [tests, setTests] = useState<SectionalTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag-and-drop reordering state
  const [draggedTestId, setDraggedTestId] = useState<number | null>(null);
  const [dragOverTestId, setDragOverTestId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SectionalSubject>('Mathematics');
  const [totalMarks, setTotalMarks] = useState<number>(50);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);
  const [published, setPublished] = useState<boolean>(true);

  // Bulk Questions Parser State
  const [bulkInputText, setBulkInputText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parsedQuestions, setParsedQuestions] = useState<SectionalQuestion[]>([]);

  // Preview Drawer State (View test questions)
  const [previewTest, setPreviewTest] = useState<SectionalTest | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<SectionalQuestion[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Delete State
  const [deletingTest, setDeletingTest] = useState<SectionalTest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // SQL snippet dialog
  const [showSqlNotice, setShowSqlNotice] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadTests();
    const onFocus = () => {
      loadTests();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const handleRefreshSync = async () => {
    setRefreshing(true);
    try {
      await syncLocalTestsWithServer();
      const data = await fetchSectionalTests();
      setTests(data);
      toast.showToast('Sectional tests synchronized successfully!', 'success');
    } catch {
      toast.showToast('Failed to sync sectional tests', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Listen to navigation with ?action=new or ?create=true
  useEffect(() => {
    const action = searchParams.get('action');
    const isNew = searchParams.get('new') === 'true' || searchParams.get('create') === 'true';
    if (action === 'new' || action === 'create' || isNew || location.hash === '#create' || location.hash === '#new') {
      handleOpenCreateModal();
      // Clean up URL query parameters without full page reload
      setSearchParams((prev) => {
        prev.delete('action');
        prev.delete('new');
        prev.delete('create');
        return prev;
      }, { replace: true });
    }
  }, [searchParams, location.hash]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await fetchSectionalTests();
      setTests(data);
    } catch (err) {
      toast.showToast('Failed to load sectional tests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTestId(null);
    setTitle('');
    setSubject('Mathematics');
    setTotalMarks(50);
    setDurationMinutes(20);
    setNegativeMarking(0.25);
    setPublished(true);
    setBulkInputText('');
    setParseErrors([]);
    setParseWarnings([]);
    setParsedQuestions([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (testItem: SectionalTest) => {
    setEditingTestId(testItem.id);
    setTitle(testItem.title);
    setSubject((testItem.subject as SectionalSubject) || 'Mathematics');
    setTotalMarks(testItem.total_marks || 50);
    setDurationMinutes(testItem.duration_minutes || 20);
    setNegativeMarking(testItem.negative_marking || 0.25);
    setPublished(testItem.published);
    setBulkInputText('');
    setParseErrors([]);
    setParseWarnings([]);

    // Fetch questions for this test
    setSaving(true);
    try {
      const qList = await fetchSectionalQuestions(testItem.id);
      setParsedQuestions(qList);
    } catch (err) {
      console.warn('Failed to load test questions for edit', err);
    } finally {
      setSaving(false);
    }

    setIsModalOpen(true);
  };

  const handleParseQuestions = () => {
    const result = parseBulkQuestions(bulkInputText);
    setParseErrors(result.errors);
    setParseWarnings(result.warnings);

    if (result.questions.length > 0) {
      // Append or replace parsed questions
      setParsedQuestions(result.questions);
      toast.showToast(`Successfully parsed ${result.questions.length} questions!`, 'success');
    } else if (result.errors.length > 0) {
      toast.showToast('Parsing errors found. Please check syntax.', 'error');
    }
  };

  const handleLoadSample = () => {
    setBulkInputText(SAMPLE_QUESTIONS_TEMPLATE);
    setParseErrors([]);
    setParseWarnings([]);
    toast.showToast('Sample questions loaded into textarea. Click "Generate Questions" to parse.', 'info');
  };

  const handleUpdateQuestion = (index: number, updated: Partial<SectionalQuestion>) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setParsedQuestions((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-index question orders
      return filtered.map((q, idx) => ({ ...q, question_order: idx + 1 }));
    });
  };

  const handleAddBlankQuestion = () => {
    setParsedQuestions((prev) => [
      ...prev,
      {
        question_order: prev.length + 1,
        question_text: 'New Question',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        explanation: null
      }
    ]);
  };

  const handleSaveTest = async (e?: React.FormEvent, explicitPublish?: boolean) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      toast.showToast('Please enter a test title / name.', 'error');
      return;
    }

    if (parsedQuestions.length === 0) {
      toast.showToast('Please add or parse at least 1 question for this test.', 'error');
      return;
    }

    // Validate that all questions have options and text
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      if (!q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        toast.showToast(`Question ${i + 1} has empty fields. Please complete all options.`, 'error');
        return;
      }
    }

    const isPublishedFinal = typeof explicitPublish === 'boolean' ? explicitPublish : published;

    setSaving(true);
    try {
      const result = await saveSectionalTest(
        {
          id: editingTestId || undefined,
          title: title.trim(),
          subject,
          total_questions: parsedQuestions.length,
          total_marks: Number(totalMarks) || 50,
          duration_minutes: Number(durationMinutes) || 20,
          negative_marking: Number(negativeMarking) || 0.25,
          published: isPublishedFinal
        },
        parsedQuestions
      );

      if (result.success) {
        toast.showToast(
          editingTestId
            ? (isPublishedFinal ? 'Test updated and published!' : 'Test draft updated successfully!')
            : (isPublishedFinal ? 'Test created and published successfully!' : 'Test saved as draft successfully!'),
          'success'
        );
        setIsModalOpen(false);
        loadTests();
      } else {
        toast.showToast(result.error || 'Failed to save test', 'error');
      }
    } catch (err: any) {
      toast.showToast(err?.message || 'Error saving test', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (testItem: SectionalTest) => {
    const nextStatus = !testItem.published;
    try {
      await togglePublishSectionalTest(testItem.id, nextStatus);
      setTests((prev) =>
        prev.map((t) => (t.id === testItem.id ? { ...t, published: nextStatus } : t))
      );
      toast.showToast(
        `Test ${nextStatus ? 'published' : 'unpublished'} successfully`,
        'success'
      );
    } catch {
      toast.showToast('Failed to update status', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTest) return;
    setIsDeleting(true);
    try {
      await deleteSectionalTest(deletingTest.id);
      toast.showToast('Sectional test deleted successfully', 'success');
      setDeletingTest(null);
      loadTests();
    } catch (err) {
      toast.showToast('Failed to delete test', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPreview = async (testItem: SectionalTest) => {
    setPreviewTest(testItem);
    setLoadingPreview(true);
    try {
      const qList = await fetchSectionalQuestions(testItem.id);
      setPreviewQuestions(qList);
    } catch {
      toast.showToast('Failed to load preview questions', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Drag and drop reordering handlers
  const executeReorder = async (sourceId: number, targetId: number, position: 'above' | 'below') => {
    if (sourceId === targetId) {
      setDraggedTestId(null);
      setDragOverTestId(null);
      setDropPosition(null);
      return;
    }

    const sourceIdx = tests.findIndex((t) => t.id === sourceId);
    const targetIdx = tests.findIndex((t) => t.id === targetId);

    if (sourceIdx === -1 || targetIdx === -1) {
      setDraggedTestId(null);
      setDragOverTestId(null);
      setDropPosition(null);
      return;
    }

    // Clone array and move item
    const updated = [...tests];
    const [movedItem] = updated.splice(sourceIdx, 1);
    let insertIdx = updated.findIndex((t) => t.id === targetId);
    if (position === 'below') {
      insertIdx += 1;
    }
    updated.splice(insertIdx, 0, movedItem);

    // Immediate optimistic state update
    setTests(updated);
    setDraggedTestId(null);
    setDragOverTestId(null);
    setDropPosition(null);
    setIsSavingOrder(true);

    try {
      const orderedIds = updated.map((t) => t.id);
      const res = await reorderSectionalTests(orderedIds);
      if (res.success) {
        if (res.tests && Array.isArray(res.tests)) {
          setTests(res.tests);
        }
        toast.showToast('Test order updated successfully!', 'success');
      } else {
        toast.showToast(res.error || 'Failed to save test order', 'error');
        loadTests();
      }
    } catch {
      toast.showToast('Failed to save test order', 'error');
      loadTests();
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTestId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTestId === null || draggedTestId === id) {
      if (dragOverTestId === id) {
        setDragOverTestId(null);
        setDropPosition(null);
      }
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const isBelow = relY > rect.height / 2;
    setDragOverTestId(id);
    setDropPosition(isBelow ? 'below' : 'above');
  };

  const handleDragLeave = (e: React.DragEvent, id: number) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverTestId === id) {
        setDragOverTestId(null);
        setDropPosition(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedTestId !== null && draggedTestId !== targetId && dropPosition) {
      executeReorder(draggedTestId, targetId, dropPosition);
    } else {
      setDraggedTestId(null);
      setDragOverTestId(null);
      setDropPosition(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTestId(null);
    setDragOverTestId(null);
    setDropPosition(null);
  };

  // Touch event handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent, id: number) => {
    setDraggedTestId(id);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedTestId === null) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const rowEl = el?.closest('tr[data-test-id]');
    if (rowEl) {
      const targetId = Number(rowEl.getAttribute('data-test-id'));
      if (targetId && targetId !== draggedTestId) {
        const rect = rowEl.getBoundingClientRect();
        const isBelow = touch.clientY > rect.top + rect.height / 2;
        setDragOverTestId(targetId);
        setDropPosition(isBelow ? 'below' : 'above');
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggedTestId !== null && dragOverTestId !== null && dropPosition !== null) {
      executeReorder(draggedTestId, dragOverTestId, dropPosition);
    } else {
      setDraggedTestId(null);
      setDragOverTestId(null);
      setDropPosition(null);
    }
  };

  const handleTouchCancel = () => {
    setDraggedTestId(null);
    setDragOverTestId(null);
    setDropPosition(null);
  };

  // Filtered tests list
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const title = (t.title || '').toLowerCase().trim();
      const subject = (t.subject || '').toLowerCase().trim();
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || title.includes(query);
      const matchesSubject =
        selectedSubject === 'All' ||
        subject === selectedSubject.toLowerCase().trim();
      const isPublished = Boolean(t.published);
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'published'
          ? isPublished
          : !isPublished;
      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [tests, searchTerm, selectedSubject, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider mb-1">
            <Layers className="w-3 h-3 text-purple-600" />
            EC Test Administration
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sectional Tests Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, edit, bulk parse questions, and publish subject-wise mock tests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshSync}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-60"
            title="Sync & refresh sectional tests across devices"
          >
            <RefreshCw className={`w-4 h-4 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync & Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlNotice(!showSqlNotice)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="View Supabase SQL schema"
          >
            <Database className="w-4 h-4 text-purple-600" />
            <span>Supabase SQL</span>
          </button>

          <button
            type="button"
            id="admin-add-new-test-btn"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Test</span>
          </button>
        </div>
      </div>

      {/* SQL Notice Accordion (if admin wants to copy SQL for Supabase) */}
      {showSqlNotice && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 text-xs text-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-purple-900 flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-purple-700" />
              Supabase SQL Instructions for Sectional Tests
            </h4>
            <button
              type="button"
              onClick={() => setShowSqlNotice(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="leading-relaxed">
            The schema script is saved in <code>schema_sectional_tests.sql</code>. If you have not executed it yet in your Supabase SQL Editor, run it to ensure permanent cloud persistence and RLS security for student tests.
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 w-full flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search test by title..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
            {tests.length} Tests Total
          </span>
          {isSavingOrder && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse whitespace-nowrap">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>Saving order...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Subject Filter Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Subjects (12)</option>
            {SECTIONAL_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Sectional Tests Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading Sectional Tests...</p>
          </div>
        ) : filteredTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-3 w-10 text-center" title="Drag to reorder tests">
                    <span className="sr-only">Reorder</span>
                    <GripVertical className="w-4 h-4 text-slate-300 mx-auto" />
                  </th>
                  <th className="py-3.5 px-4">Test Title</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4 text-center">Questions</th>
                  <th className="py-3.5 px-4 text-center">Marks</th>
                  <th className="py-3.5 px-4 text-center">Duration</th>
                  <th className="py-3.5 px-4 text-center">Negative</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map((t) => {
                  const isBeingDragged = draggedTestId === t.id;
                  const isTarget = dragOverTestId === t.id && !isBeingDragged;

                  let dragClasses = '';
                  if (isBeingDragged) {
                    dragClasses = 'opacity-35 bg-purple-50/80 border-2 border-dashed border-purple-400 select-none scale-[0.99]';
                  } else if (isTarget && dropPosition === 'above') {
                    dragClasses = 'border-t-2 border-t-purple-600 bg-purple-50/40 shadow-xs';
                  } else if (isTarget && dropPosition === 'below') {
                    dragClasses = 'border-b-2 border-b-purple-600 bg-purple-50/40 shadow-xs';
                  }

                  return (
                    <tr
                      key={t.id}
                      data-test-id={t.id}
                      draggable={!isSavingOrder}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragOver={(e) => handleDragOver(e, t.id)}
                      onDragLeave={(e) => handleDragLeave(e, t.id)}
                      onDrop={(e) => handleDrop(e, t.id)}
                      onDragEnd={handleDragEnd}
                      className={`hover:bg-purple-50/30 transition-all ${dragClasses}`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <div
                          onTouchStart={(e) => handleTouchStart(e, t.id)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          onTouchCancel={handleTouchCancel}
                          className="p-1.5 rounded-md text-slate-400 hover:text-purple-600 active:text-purple-700 cursor-grab active:cursor-grabbing hover:bg-purple-100/60 inline-flex items-center justify-center touch-none select-none transition-colors"
                          title="Click and drag to reorder test"
                          aria-label={`Drag to reorder ${t.title}`}
                        >
                          <GripVertical className="w-4 h-4 pointer-events-none" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate cursor-grab active:cursor-grabbing">
                        {t.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {t.subject}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {t.total_questions}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-700 font-semibold">
                        {t.total_marks}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {t.duration_minutes}m
                      </td>
                      <td className="py-3.5 px-4 text-center text-rose-600 font-semibold">
                        -{t.negative_marking}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => handleTogglePublish(t)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                            t.published
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${t.published ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                          {t.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => handleOpenPreview(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Preview Questions"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => handleOpenEditModal(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Test"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => setDeletingTest(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Test"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">No Sectional Tests Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No sectional tests match the current filter or search criteria.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Manual Test</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          CREATE / EDIT MODAL WITH BULK PARSER
         ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTestId ? 'Edit Sectional Test' : 'Create Sectional Test'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure test settings and bulk paste questions in English or Hindi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="test-form" onSubmit={(e) => handleSaveTest(e)} className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
              {/* Basic Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mathematics Sectional Test 02 - Speed, Time & Distance"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject (12 Core Subjects Only) *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as SectionalSubject)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SECTIONAL_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Negative Marking (Per Wrong Answer)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="published-toggle"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="published-toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Publish this test immediately for students
                  </label>
                </div>
              </div>

              {/* Bulk Question Parsing Section */}
              <div className="bg-purple-50/50 rounded-3xl p-5 border border-purple-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      Bulk Question Input & Parser
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Paste multiple questions at once. System automatically parses questions, options A/B/C/D, answers, and explanations.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors"
                  >
                    Load Sample Format
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  placeholder={`Q1. Question text in English or Hindi...\nA. Option A\nB. Option B\nC. Option C\nD. Option D\nAnswer: B\nExplanation: (Optional solution note)`}
                  className="w-full p-3.5 text-xs font-mono bg-white border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                ></textarea>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Supports formats: Q1., 1., (A), A), a., Answer: B, Ans: B, उत्तर: B
                  </span>
                  <button
                    type="button"
                    onClick={handleParseQuestions}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Questions</span>
                  </button>
                </div>

                {/* Parse Errors List */}
                {parseErrors.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Parsing Inconsistencies Detected:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                      {parseErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Parsed Questions List & Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Question Preview ({parsedQuestions.length} Questions)</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddBlankQuestion}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Single Question</span>
                  </button>
                </div>

                {parsedQuestions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">
                      No questions loaded yet. Paste questions in the bulk box above and click "Generate Questions".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {parsedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Question #{idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete this question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Question Text */}
                        <textarea
                          rows={2}
                          value={q.question_text}
                          onChange={(e) => handleUpdateQuestion(idx, { question_text: e.target.value })}
                          className="w-full p-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Question statement..."
                        ></textarea>

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                            const fieldKey = `option_${optKey.toLowerCase()}` as keyof SectionalQuestion;
                            const isCorrect = q.correct_option === optKey;
                            return (
                              <div key={optKey} className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {optKey}
                                </span>
                                <input
                                  type="text"
                                  value={(q[fieldKey] as string) || ''}
                                  onChange={(e) => handleUpdateQuestion(idx, { [fieldKey]: e.target.value })}
                                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  placeholder={`Option ${optKey}`}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Correct Answer & Explanation */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600">Correct Option:</span>
                            {(['A', 'B', 'C', 'D'] as const).map((ans) => (
                              <button
                                key={ans}
                                type="button"
                                onClick={() => handleUpdateQuestion(idx, { correct_option: ans })}
                                className={`w-6 h-6 rounded-md text-xs font-bold transition-colors ${
                                  q.correct_option === ans
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {ans}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateQuestion(idx, { explanation: e.target.value })}
                            placeholder="Explanation (Optional)"
                            className="w-full sm:w-1/2 px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveTest(undefined, false)}
                className="px-5 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving && !published && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveTest(undefined, true)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving && published && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          PREVIEW QUESTIONS DRAWER
         ========================================== */}
      {previewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {previewTest.subject}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {previewTest.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {loadingPreview ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading questions...</p>
                </div>
              ) : previewQuestions.length > 0 ? (
                previewQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <p className="font-bold text-slate-900">
                      Q{idx + 1}. {q.question_text}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-700">
                      <div>A. {q.option_a}</div>
                      <div>B. {q.option_b}</div>
                      <div>C. {q.option_c}</div>
                      <div>D. {q.option_d}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Answer: {q.correct_option}
                      </span>
                      {q.explanation && (
                        <span className="text-slate-500 italic max-w-xs truncate">
                          {q.explanation}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">
                  No questions found for this test.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setPreviewTest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingTest)}
        title="Delete Sectional Test"
        message={`Are you sure you want to delete "${deletingTest?.title}"? All associated questions will be permanently deleted.`}
        confirmLabel="Delete Test"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingTest(null)}
      />
    </div>
  );
};
