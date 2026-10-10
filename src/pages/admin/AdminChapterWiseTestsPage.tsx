import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  fetchChapters,
  saveChapter,
  deleteChapter,
  reorderChapters,
  fetchChapterTests,
  fetchChapterQuestions,
  saveChapterTest,
  deleteChapterTest,
  togglePublishChapterTest,
  reorderChapterTests,
  syncLocalChapterDataWithServer,
  SUBJECT_SUB_CATEGORIES,
  getSubCategoriesForSubject,
  CHAPTER_DATA_CHANGED_EVENT
} from '../../services/chapterTestService';
import { SECTIONAL_SUBJECTS } from '../../services/sectionalTestService';
import { Chapter, ChapterTest, ChapterQuestion, SectionalSubject } from '../../types';
import { parseBulkQuestions, SAMPLE_QUESTIONS_TEMPLATE, ParsedQuestion } from '../../lib/questionParser';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BackButton } from '../../components/common/BackButton';
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
  GripVertical,
  ChevronRight,
  ChevronDown,
  ListPlus,
  FolderPlus
} from 'lucide-react';

export const AdminChapterWiseTestsPage: React.FC = () => {
  const toast = useToast();

  const [selectedSubject, setSelectedSubject] = useState<SectionalSubject>('Biology');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [tests, setTests] = useState<ChapterTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sub-category filter for divided subjects (e.g. Mathematics, History, Geography, Reasoning, Chemistry)
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState<string>('all');

  // Search & Filter for Tests
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Chapter Modal State (Create / Edit)
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [chapterSubCategory, setChapterSubCategory] = useState<string>('');
  const [chapterName, setChapterName] = useState('');
  const [chapterHindiName, setChapterHindiName] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [savingChapter, setSavingChapter] = useState(false);
  const [chapterAddMode, setChapterAddMode] = useState<'single' | 'bulk'>('single');
  const [isNewChapterDropdownOpen, setIsNewChapterDropdownOpen] = useState(false);
  const [bulkChapterText, setBulkChapterText] = useState('');
  const newChapterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newChapterDropdownRef.current && !newChapterDropdownRef.current.contains(event.target as Node)) {
        setIsNewChapterDropdownOpen(false);
      }
    };
    if (isNewChapterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNewChapterDropdownOpen]);

  // Check if active subject has sub-categories
  const subCategoriesForSelectedSubject = useMemo(() => {
    return getSubCategoriesForSubject(selectedSubject);
  }, [selectedSubject]);

  // Chapter Test Modal State (Create / Edit)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState<number>(50);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);
  const [published, setPublished] = useState<boolean>(true);
  const [savingTest, setSavingTest] = useState(false);

  // Bulk Questions Parser State
  const [bulkInputText, setBulkInputText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parsedQuestions, setParsedQuestions] = useState<ChapterQuestion[]>([]);

  // Preview Drawer State (View test questions)
  const [previewTest, setPreviewTest] = useState<ChapterTest | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<ChapterQuestion[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Deletion modals
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);
  const [deletingTest, setDeletingTest] = useState<ChapterTest | null>(null);
  const [isDeletingTest, setIsDeletingTest] = useState(false);

  useEffect(() => {
    setSelectedSubCategoryFilter('all');
    loadData({ silent: false, subCategoryOverride: 'all' });
  }, [selectedSubject]);

  useEffect(() => {
    let lastFocus = Date.now();
    const onFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFocus > 1000) {
        lastFocus = Date.now();
        loadData({ silent: true });
      }
    };
    const onDataChanged = () => {
      if (!savingChapter && !savingTest && !isDeletingChapter && !isDeletingTest) {
        loadData({ silent: true });
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener(CHAPTER_DATA_CHANGED_EVENT, onDataChanged);
    window.addEventListener('storage', onDataChanged);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener(CHAPTER_DATA_CHANGED_EVENT, onDataChanged);
      window.removeEventListener('storage', onDataChanged);
    };
  }, [selectedSubject, selectedSubCategoryFilter, selectedChapterId, savingChapter, savingTest, isDeletingChapter, isDeletingTest]);

  const loadData = async (options?: {
    silent?: boolean;
    preferredChapterId?: number | null;
    subCategoryOverride?: string;
  }) => {
    if (!options?.silent && chapters.length === 0) {
      setLoading(true);
    }
    try {
      const chapList = await fetchChapters(selectedSubject);
      setChapters(chapList);

      const filterSub = options?.subCategoryOverride !== undefined
        ? options.subCategoryOverride
        : selectedSubCategoryFilter;

      const filtered = filterSub === 'all'
        ? chapList
        : chapList.filter((c) => (c.sub_category || '').toLowerCase().trim() === filterSub.toLowerCase().trim());

      const chosenPrefId = options?.preferredChapterId !== undefined ? options.preferredChapterId : selectedChapterId;

      if (filtered.length > 0) {
        const targetId = (chosenPrefId && filtered.some((c) => c.id === chosenPrefId))
          ? (chosenPrefId as number)
          : filtered[0].id;
        setSelectedChapterId(targetId);
        const testList = await fetchChapterTests({ chapterId: targetId });
        setTests(testList);
      } else if (chapList.length > 0) {
        const targetId = (chosenPrefId && chapList.some((c) => c.id === chosenPrefId))
          ? (chosenPrefId as number)
          : chapList[0].id;
        setSelectedChapterId(targetId);
        const testList = await fetchChapterTests({ chapterId: targetId });
        setTests(testList);
      } else {
        setSelectedChapterId(null);
        setTests([]);
      }
    } catch (err) {
      console.warn('Failed to load chapter tests admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubCategory = async (sc: string) => {
    setSelectedSubCategoryFilter(sc);
    await loadData({ silent: true, subCategoryOverride: sc });
  };

  const handleSelectChapter = async (chapId: number) => {
    setSelectedChapterId(chapId);
    try {
      const testList = await fetchChapterTests({ chapterId: chapId });
      setTests(testList);
    } catch (err) {
      console.warn('Failed to fetch tests for chapter', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncLocalChapterDataWithServer();
      await loadData({ silent: true });
      toast.showToast('Chapter data synchronized successfully!', 'success');
    } catch {
      toast.showToast('Failed to sync chapter data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CHAPTER CRUD
  // ---------------------------------------------------------------------------

  const openCreateChapterModal = (mode: 'single' | 'bulk' = 'single') => {
    setIsNewChapterDropdownOpen(false);
    setEditingChapterId(null);
    setChapterAddMode(mode);
    if (subCategoriesForSelectedSubject && subCategoriesForSelectedSubject.length > 0) {
      const defaultSub =
        selectedSubCategoryFilter !== 'all' && subCategoriesForSelectedSubject.includes(selectedSubCategoryFilter)
          ? selectedSubCategoryFilter
          : subCategoriesForSelectedSubject[0];
      setChapterSubCategory(defaultSub);
    } else {
      setChapterSubCategory('');
    }
    setChapterName('');
    setChapterHindiName('');
    setChapterDescription('');
    setBulkChapterText('');
    setIsChapterModalOpen(true);
  };

  const openEditChapterModal = (chap: Chapter) => {
    setIsNewChapterDropdownOpen(false);
    setChapterAddMode('single');
    setEditingChapterId(chap.id);
    setChapterSubCategory(
      chap.sub_category ||
        (subCategoriesForSelectedSubject && subCategoriesForSelectedSubject.length > 0
          ? subCategoriesForSelectedSubject[0]
          : '')
    );
    setChapterName(chap.name);
    setChapterHindiName(chap.hindi_name || '');
    setChapterDescription(chap.description || '');
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = chapterName.trim();
    if (!trimmedName) {
      toast.showToast('Please enter chapter name', 'error');
      return;
    }

    const subCatValue =
      subCategoriesForSelectedSubject && subCategoriesForSelectedSubject.length > 0
        ? chapterSubCategory.trim()
        : undefined;

    if (subCategoriesForSelectedSubject && !subCatValue) {
      toast.showToast('Please select a sub-category', 'error');
      return;
    }

    // Duplicate check under the currently selected subject (and sub-category if divided)
    const normalizedName = trimmedName.toLowerCase();
    const isDuplicate = chapters.some((c) => {
      if (c.id === editingChapterId) return false;
      const sameName = c.name.trim().toLowerCase() === normalizedName;
      if (subCatValue) {
        return sameName && (c.sub_category || '').toLowerCase().trim() === subCatValue.toLowerCase().trim();
      }
      return sameName;
    });

    if (isDuplicate) {
      toast.showToast(
        subCatValue
          ? `Chapter "${trimmedName}" already exists in ${subCatValue} (${selectedSubject}).`
          : `Chapter "${trimmedName}" has already been added to ${selectedSubject}.`,
        'error'
      );
      return;
    }

    setSavingChapter(true);
    try {
      const saved = await saveChapter({
        id: editingChapterId || undefined,
        subject: selectedSubject,
        sub_category: subCatValue,
        name: trimmedName,
        hindi_name: chapterHindiName.trim() || undefined,
        description: chapterDescription.trim() || undefined
      });
      toast.showToast(editingChapterId ? 'Chapter updated!' : 'Chapter added successfully!', 'success');
      setIsChapterModalOpen(false);

      const targetSubCat = subCatValue || selectedSubCategoryFilter;
      if (subCatValue && selectedSubCategoryFilter !== 'all' && selectedSubCategoryFilter !== subCatValue) {
        setSelectedSubCategoryFilter(subCatValue);
      }

      await loadData({ silent: true, preferredChapterId: saved.id, subCategoryOverride: targetSubCat });
    } catch (err: any) {
      toast.showToast(err?.message || 'Failed to save chapter', 'error');
    } finally {
      setSavingChapter(false);
    }
  };

  const handleBulkSaveChapters = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkChapterText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.showToast('Please enter at least one chapter name', 'error');
      return;
    }

    const subCatValue =
      subCategoriesForSelectedSubject && subCategoriesForSelectedSubject.length > 0
        ? chapterSubCategory.trim()
        : undefined;

    if (subCategoriesForSelectedSubject && !subCatValue) {
      toast.showToast('Please select a sub-category', 'error');
      return;
    }

    setSavingChapter(true);
    try {
      let createdCount = 0;
      let firstSavedChapterId: number | null = null;

      // Duplicate check under same subject and sub_category
      const existingNames = new Set(
        chapters
          .filter((c) => {
            if (subCatValue) {
              return (c.sub_category || '').toLowerCase().trim() === subCatValue.toLowerCase().trim();
            }
            return true;
          })
          .map((c) => c.name.toLowerCase().trim())
      );

      const uniqueNewLines = lines.filter((name) => {
        const lower = name.toLowerCase().trim();
        if (existingNames.has(lower)) return false;
        existingNames.add(lower);
        return true;
      });

      if (uniqueNewLines.length === 0) {
        toast.showToast('All entered chapters already exist under this subject.', 'info');
        setSavingChapter(false);
        return;
      }

      for (let i = 0; i < uniqueNewLines.length; i++) {
        const name = uniqueNewLines[i];
        const saved = await saveChapter({
          subject: selectedSubject,
          sub_category: subCatValue,
          name,
          sort_order: chapters.length + i + 1
        });
        if (saved) {
          createdCount++;
          if (!firstSavedChapterId) {
            firstSavedChapterId = saved.id;
          }
        }
      }

      toast.showToast(`Successfully added ${createdCount} chapter${createdCount === 1 ? '' : 's'}!`, 'success');
      setIsChapterModalOpen(false);
      setBulkChapterText('');

      const targetSubCat = subCatValue || selectedSubCategoryFilter;
      if (subCatValue && selectedSubCategoryFilter !== 'all' && selectedSubCategoryFilter !== subCatValue) {
        setSelectedSubCategoryFilter(subCatValue);
      }

      await loadData({ silent: true, preferredChapterId: firstSavedChapterId, subCategoryOverride: targetSubCat });
    } catch (err: any) {
      toast.showToast(err?.message || 'Failed to save chapters', 'error');
    } finally {
      setSavingChapter(false);
    }
  };

  const handleDeleteChapterConfirm = async () => {
    if (!deletingChapter) return;
    setIsDeletingChapter(true);
    try {
      const deletedId = deletingChapter.id;
      await deleteChapter(deletedId);
      setChapters(prev =>
        prev.filter(chapter => Number(chapter.id) !== Number(deletedId))
      );
      toast.showToast(`Chapter "${deletingChapter.name}" deleted!`, 'success');
      setDeletingChapter(null);
      await loadData({ silent: true, preferredChapterId: null });
    } catch {
      toast.showToast('Failed to delete chapter', 'error');
    } finally {
      setIsDeletingChapter(false);
    }
  };

  // ---------------------------------------------------------------------------
  // TEST CRUD
  // ---------------------------------------------------------------------------

  const openCreateTestModal = () => {
    if (!selectedChapterId) {
      toast.showToast('Please create or select a chapter first', 'error');
      return;
    }
    setEditingTestId(null);
    setTestTitle('');
    setTotalMarks(50);
    setDurationMinutes(20);
    setNegativeMarking(0.25);
    setPublished(true);
    setBulkInputText('');
    setParseErrors([]);
    setParseWarnings([]);
    setParsedQuestions([]);
    setIsTestModalOpen(true);
  };

  const openEditTestModal = async (test: ChapterTest) => {
    setEditingTestId(test.id);
    setTestTitle(test.title);
    setTotalMarks(test.total_marks || 50);
    setDurationMinutes(test.duration_minutes || 20);
    setNegativeMarking(test.negative_marking || 0.25);
    setPublished(test.published);
    setBulkInputText('');
    setParseErrors([]);
    setParseWarnings([]);

    // Fetch existing questions to display in preview
    setSavingTest(true);
    try {
      const qList = await fetchChapterQuestions(test.id);
      setParsedQuestions(qList);
    } catch (err) {
      console.warn('Failed to load chapter questions for edit', err);
      setParsedQuestions([]);
    } finally {
      setSavingTest(false);
    }

    setIsTestModalOpen(true);
  };

  const handleParseQuestions = () => {
    const result = parseBulkQuestions(bulkInputText);
    setParseErrors(result.errors);
    setParseWarnings(result.warnings);

    if (result.questions.length > 0) {
      setParsedQuestions(result.questions as ChapterQuestion[]);
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

  const handleUpdateQuestion = (index: number, updated: Partial<ChapterQuestion>) => {
    setParsedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setParsedQuestions((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
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

    if (!testTitle.trim()) {
      toast.showToast('Please enter a test title / name.', 'error');
      return;
    }

    if (!selectedChapterId) {
      toast.showToast('Please select a chapter', 'error');
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

    setSavingTest(true);
    try {
      const curChap = chapters.find((c) => c.id === selectedChapterId);
      const saved = await saveChapterTest(
        {
          id: editingTestId || undefined,
          chapter_id: selectedChapterId,
          title: testTitle.trim(),
          subject: selectedSubject,
          chapter_name: curChap?.name,
          total_questions: parsedQuestions.length,
          total_marks: Number(totalMarks) || 50,
          duration_minutes: Number(durationMinutes) || 20,
          negative_marking: Number(negativeMarking) || 0.25,
          published: isPublishedFinal
        },
        parsedQuestions
      );

      if (saved) {
        toast.showToast(
          editingTestId
            ? (isPublishedFinal ? 'Test updated and published!' : 'Test draft updated successfully!')
            : (isPublishedFinal ? 'Test created and published successfully!' : 'Test saved as draft successfully!'),
          'success'
        );
        setIsTestModalOpen(false);

        const updatedTests = await fetchChapterTests({ chapterId: selectedChapterId });
        setTests(updatedTests);

        // Refresh chapter test counts
        const updatedChapters = await fetchChapters(selectedSubject);
        setChapters(updatedChapters);
      }
    } catch (err: any) {
      toast.showToast(err?.message || 'Failed to save test', 'error');
    } finally {
      setSavingTest(false);
    }
  };

  const handleTogglePublish = async (test: ChapterTest) => {
    try {
      const newStatus = !test.published;
      await togglePublishChapterTest(test.id, newStatus);
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, published: newStatus } : t)));
      const updatedChapters = await fetchChapters(selectedSubject);
      setChapters(updatedChapters);
      toast.showToast(`Test ${newStatus ? 'Published' : 'set to Draft'}!`, 'success');
    } catch {
      toast.showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteTestConfirm = async () => {
    if (!deletingTest) return;
    setIsDeletingTest(true);
    try {
      await deleteChapterTest(deletingTest.id);
      toast.showToast(`Test "${deletingTest.title}" deleted!`, 'success');
      setDeletingTest(null);
      if (selectedChapterId) {
        const updatedTests = await fetchChapterTests({ chapterId: selectedChapterId });
        setTests(updatedTests);
      }
      const updatedChapters = await fetchChapters(selectedSubject);
      setChapters(updatedChapters);
    } catch {
      toast.showToast('Failed to delete test', 'error');
    } finally {
      setIsDeletingTest(false);
    }
  };

  const handleOpenPreview = async (test: ChapterTest) => {
    setPreviewTest(test);
    setLoadingPreview(true);
    try {
      const qList = await fetchChapterQuestions(test.id);
      setPreviewQuestions(qList);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Drag-and-drop reordering state
  const [draggedTestId, setDraggedTestId] = useState<number | null>(null);
  const [dragOverTestId, setDragOverTestId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

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
      const res = await reorderChapterTests(orderedIds);
      if (res) {
        toast.showToast('Test order updated successfully!', 'success');
      } else {
        toast.showToast('Failed to save test order', 'error');
        if (selectedChapterId) {
          const reloaded = await fetchChapterTests({ chapterId: selectedChapterId });
          setTests(reloaded);
        }
      }
    } catch {
      toast.showToast('Failed to save test order', 'error');
      if (selectedChapterId) {
        const reloaded = await fetchChapterTests({ chapterId: selectedChapterId });
        setTests(reloaded);
      }
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

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && t.published) ||
        (statusFilter === 'draft' && !t.published);
      return matchesSearch && matchesStatus;
    });
  }, [tests, searchTerm, statusFilter]);

  const displayedChapters = useMemo(() => {
    if (!subCategoriesForSelectedSubject || selectedSubCategoryFilter === 'all') {
      return chapters;
    }
    return chapters.filter(
      (c) => (c.sub_category || '').toLowerCase().trim() === selectedSubCategoryFilter.toLowerCase().trim()
    );
  }, [chapters, subCategoriesForSelectedSubject, selectedSubCategoryFilter]);

  const activeChapter = chapters.find((c) => c.id === selectedChapterId);

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Chapter Wise Tests
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage subject chapters, topic question banks, and chapter assessment tests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Subject Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {SECTIONAL_SUBJECTS.map((sub) => {
          const isSelected = selectedSubject === sub;
          return (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sub}
            </button>
          );
        })}
      </div>

      {/* Two Column Layout: Chapters (Left) | Tests (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
        {/* LEFT COLUMN: Chapters List */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Chapters ({displayedChapters.length})
              </h2>
              <span className="text-[10px] text-slate-400 font-medium">in {selectedSubject}</span>
            </div>
            <div className="relative" ref={newChapterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNewChapterDropdownOpen((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                title="Add Chapters"
                aria-expanded={isNewChapterDropdownOpen}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isNewChapterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isNewChapterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => openCreateChapterModal('single')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Add Single Chapter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateChapterModal('bulk')}
                    className="w-full px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Bulk Add Chapters</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sub-category selector pills for divided subjects */}
          {subCategoriesForSelectedSubject && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin">
              <button
                type="button"
                onClick={() => handleSelectSubCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                  selectedSubCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({chapters.length})
              </button>
              {subCategoriesForSelectedSubject.map((sc) => {
                const count = chapters.filter(
                  (c) => (c.sub_category || '').toLowerCase().trim() === sc.toLowerCase().trim()
                ).length;
                const isSel = selectedSubCategoryFilter === sc;
                return (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => handleSelectSubCategory(sc)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                      isSel
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sc} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Loading chapters...</p>
            </div>
          ) : displayedChapters.length > 0 ? (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {displayedChapters.map((chap, idx) => {
                const isSelected = selectedChapterId === chap.id;

                return (
                  <div
                    key={chap.id}
                    onClick={() => handleSelectChapter(chap.id)}
                    className={`group p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                        {chap.sub_category && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate">
                            {chap.sub_category}
                          </span>
                        )}
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-800'
                          }`}
                        >
                          {chap.name}
                        </h4>
                      </div>
                      {chap.hindi_name && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{chap.hindi_name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                        {chap.test_count || 0} {chap.test_count === 1 ? 'test' : 'tests'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditChapterModal(chap);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white"
                        title="Edit Chapter"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingChapter(chap);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 p-4">
              <FolderPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {selectedSubCategoryFilter !== 'all'
                  ? `No chapters in ${selectedSubCategoryFilter}`
                  : 'No chapters yet'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "+ New" above to add one</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Tests List for Selected Chapter */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 xl:p-5">
          {/* Header of Tests Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">
                  {selectedSubject} {activeChapter?.sub_category ? `> ${activeChapter.sub_category}` : ''} &gt;
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  {activeChapter ? activeChapter.name : 'Select a Chapter'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'} configured
              </p>
            </div>

            {/* Filter Bar & Create Test Action */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter tests..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-600 font-medium"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              {activeChapter && (
                <button
                  onClick={openCreateTestModal}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Test</span>
                </button>
              )}
            </div>
          </div>

          {/* Test Cards List */}
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading chapter tests...</p>
            </div>
          ) : !activeChapter ? (
            <div className="py-16 text-center text-slate-400">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Chapter Selected</p>
              <p className="text-xs text-slate-400 mt-1">Select or add a chapter on the left to manage its tests.</p>
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] xl:text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-2 w-8 text-center" title="Drag to reorder tests">
                      <span className="sr-only">Reorder</span>
                      <GripVertical className="w-4 h-4 text-slate-300 mx-auto" />
                    </th>
                    <th className="py-3 px-2.5 xl:px-3">Test Title</th>
                    <th className="py-3 px-2 xl:px-2.5 text-center">Subject</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Questions</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Marks</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Duration</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">Negative</th>
                    <th className="py-3 px-2 xl:px-2.5 text-center whitespace-nowrap">Status</th>
                    <th className="py-3 px-2.5 xl:px-3 text-right whitespace-nowrap">Actions</th>
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
                        <td className="py-3 px-2 text-center">
                          <div
                            onTouchStart={(e) => handleTouchStart(e, t.id)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchCancel}
                            className="p-1 rounded-md text-slate-400 hover:text-purple-600 active:text-purple-700 cursor-grab active:cursor-grabbing hover:bg-purple-100/60 inline-flex items-center justify-center touch-none select-none transition-colors"
                            title="Click and drag to reorder test"
                            aria-label={`Drag to reorder ${t.title}`}
                          >
                            <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
                          </div>
                        </td>
                        <td className="py-3 px-2.5 xl:px-3 font-bold text-slate-900 cursor-grab active:cursor-grabbing">
                          <div className="max-w-[150px] sm:max-w-[180px] xl:max-w-xs truncate" title={t.title}>
                            {t.title}
                          </div>
                        </td>
                        <td className="py-3 px-2 xl:px-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                            {t.subject}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-700 whitespace-nowrap">
                          {t.total_questions}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-700 font-semibold whitespace-nowrap">
                          {t.total_marks}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-600 whitespace-nowrap">
                          {t.duration_minutes}m
                        </td>
                        <td className="py-3 px-2 text-center text-rose-600 font-semibold whitespace-nowrap">
                          -{t.negative_marking}
                        </td>
                        <td className="py-3 px-2 xl:px-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => handleTogglePublish(t)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors whitespace-nowrap ${
                              t.published
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {t.published ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Published
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                Draft
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-2.5 xl:px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onMouseDown={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(t)}
                              className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Preview Questions"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditTestModal(t)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Test"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTest(t)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Test"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
            <div className="py-16 text-center text-slate-400">
              <FileQuestion className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No tests in this chapter</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "+ Create Test" to add your first chapter test with questions.
              </p>
              <button
                onClick={openCreateTestModal}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Test Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* CHAPTER MODAL (ADD / EDIT) */}
      {/* ---------------------------------------------------------------------- */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingChapterId
                    ? 'Edit Chapter'
                    : chapterAddMode === 'bulk'
                    ? 'Bulk Add Chapters'
                    : 'Add Single Chapter'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subject: <strong className="text-emerald-700">{selectedSubject}</strong>
                </p>
              </div>
              <button onClick={() => setIsChapterModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher for Creating Chapters */}
            {!editingChapterId && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mt-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setChapterAddMode('single')}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    chapterAddMode === 'single'
                      ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Single Chapter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChapterAddMode('bulk')}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    chapterAddMode === 'bulk'
                      ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Bulk Add Chapters</span>
                </button>
              </div>
            )}

            {/* Read-only Context Badge for Target Subject */}
            <div className="mt-3.5 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Target Subject (Active Tab)
                </span>
                <p className="text-sm font-extrabold text-emerald-950 mt-0.5">{selectedSubject}</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                Locked
              </span>
            </div>

            {chapterAddMode === 'single' || editingChapterId ? (
              /* SINGLE CHAPTER FORM */
              <form onSubmit={handleSaveChapter} className="space-y-4 mt-4">
                {subCategoriesForSelectedSubject && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sub-category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={chapterSubCategory}
                      onChange={(e) => setChapterSubCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold text-slate-800 cursor-pointer"
                    >
                      {subCategoriesForSelectedSubject.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chapter Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter chapter name"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hindi Title <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. हिन्दी शीर्षक"
                    value={chapterHindiName}
                    onChange={(e) => setChapterHindiName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Topic Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short note on topics covered..."
                    value={chapterDescription}
                    onChange={(e) => setChapterDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsChapterModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingChapter}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    {savingChapter && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingChapterId ? 'Update Chapter' : 'Add Chapter'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* BULK ADD CHAPTERS FORM */
              <form onSubmit={handleBulkSaveChapters} className="space-y-4 mt-4">
                {subCategoriesForSelectedSubject && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sub-category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={chapterSubCategory}
                      onChange={(e) => setChapterSubCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold text-slate-800 cursor-pointer"
                    >
                      {subCategoriesForSelectedSubject.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      All bulk-entered chapters will be added under this sub-category.
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Chapter Names (One per line) <span className="text-rose-500">*</span>
                    </label>
                    {bulkChapterText.trim() && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {bulkChapterText.split('\n').filter((l) => l.trim().length > 0).length} chapter{bulkChapterText.split('\n').filter((l) => l.trim().length > 0).length === 1 ? '' : 's'} detected
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={7}
                    required
                    placeholder={`Indus Valley Civilization\nVedic Period\nMauryan Empire\nGupta Empire`}
                    value={bulkChapterText}
                    onChange={(e) => setBulkChapterText(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400 placeholder:font-sans leading-relaxed"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter one chapter per line. Blank lines are automatically ignored.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsChapterModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingChapter || !bulkChapterText.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    {savingChapter && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {savingChapter
                        ? 'Adding Chapters...'
                        : `Add Chapters`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* CREATE / EDIT CHAPTER TEST MODAL WITH BULK PARSER & QUESTION PREVIEW   */}
      {/* ---------------------------------------------------------------------- */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTestId ? 'Edit Chapter Test' : 'Create Chapter Wise Test'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Under chapter: <strong>{activeChapter?.name}</strong> ({selectedSubject}{activeChapter?.sub_category ? ` • ${activeChapter.sub_category}` : ''})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="chapter-test-form" onSubmit={(e) => handleSaveTest(e)} className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
              {/* Basic Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder={`e.g. ${activeChapter?.name || 'Chapter'} Test 01`}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="chapter-published-toggle"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="chapter-published-toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Publish this test immediately for students
                  </label>
                </div>
              </div>

              {/* Bulk Question Parsing Section */}
              <div className="bg-emerald-50/50 rounded-3xl p-5 border border-emerald-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      Bulk Question Input & Parser
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Paste multiple questions at once. System automatically parses questions, options A/B/C/D, answers, and explanations.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                  >
                    Load Sample Format
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  placeholder={`Q1. Question text in English or Hindi...\nA. Option A\nB. Option B\nC. Option C\nD. Option D\nAnswer: B\nExplanation: (Optional solution note)`}
                  className="w-full p-3.5 text-xs font-mono bg-white border border-emerald-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Supports formats: Q1., 1., (A), A), a., Answer: B, Ans: B, उत्तर: B
                  </span>
                  <button
                    type="button"
                    onClick={handleParseQuestions}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
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
                    <Layers className="w-4 h-4 text-emerald-600" />
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
                          <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                          className="w-full p-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          placeholder="Question statement..."
                        ></textarea>

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                            const fieldKey = `option_${optKey.toLowerCase()}` as keyof ChapterQuestion;
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
                                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                onClick={() => setIsTestModalOpen(false)}
                disabled={savingTest}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={savingTest}
                onClick={() => handleSaveTest(undefined, false)}
                className="px-5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingTest && !published && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={savingTest}
                onClick={() => handleSaveTest(undefined, true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {savingTest && published && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* PREVIEW QUESTIONS DRAWER */}
      {/* ---------------------------------------------------------------------- */}
      {previewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {previewTest.title} — Questions Preview
                </h3>
                <p className="text-xs text-slate-500">
                  {previewQuestions.length} Questions • {previewTest.duration_minutes} Mins • {previewTest.total_marks} Marks
                </p>
              </div>
              <button onClick={() => setPreviewTest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {loadingPreview ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading questions...</p>
                </div>
              ) : previewQuestions.length > 0 ? (
                previewQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">Q{idx + 1}.</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Correct: Option {q.correct_option}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 leading-relaxed mb-3 whitespace-pre-line">
                      {q.question_text}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((k) => {
                        const isCorrect = q.correct_option === k;
                        const optText = q[`option_${k.toLowerCase()}` as keyof ChapterQuestion] as string;

                        return (
                          <div
                            key={k}
                            className={`p-2 rounded-lg border text-xs flex items-start gap-1.5 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-bold shrink-0">({k})</span>
                            <span className="flex-1">{optText}</span>
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 leading-relaxed">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">No questions found for this test.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewTest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* DELETE CHAPTER CONFIRMATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      <ConfirmationModal
        isOpen={Boolean(deletingChapter)}
        title="Delete Chapter?"
        message={`Are you sure you want to delete chapter "${deletingChapter?.name}"? All tests under this chapter will also be removed.`}
        confirmLabel="Yes, Delete Chapter"
        confirmVariant="danger"
        isLoading={isDeletingChapter}
        onConfirm={handleDeleteChapterConfirm}
        onCancel={() => setDeletingChapter(null)}
      />

      {/* ---------------------------------------------------------------------- */}
      {/* DELETE TEST CONFIRMATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      <ConfirmationModal
        isOpen={Boolean(deletingTest)}
        title="Delete Chapter Test?"
        message={`Are you sure you want to delete "${deletingTest?.title}"? All test questions and user attempts will be removed permanently.`}
        confirmLabel="Yes, Delete Test"
        confirmVariant="danger"
        isLoading={isDeletingTest}
        onConfirm={handleDeleteTestConfirm}
        onCancel={() => setDeletingTest(null)}
      />
    </div>
  );
};
