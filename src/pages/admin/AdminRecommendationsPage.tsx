import React, { useEffect, useState, useMemo } from 'react';
import { BackButton } from '../../components/common/BackButton';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import {
  TopRecommendation,
  RecommendationContentType,
} from '../../types';
import {
  SUPPORTED_CONTENT_TYPES,
  fetchAdminRecommendations,
  fetchExistingContentItems,
  fetchNoteCategories,
  addRecommendation,
  updateRecommendation,
  toggleRecommendationStatus,
  deleteRecommendation,
} from '../../services/recommendationService';
import {
  Star, Plus, Search, Filter, ArrowUp, ArrowDown,
  Trash2, Edit2, CheckCircle2, AlertCircle, Loader2,
  FileText, Book, BookOpen, Newspaper, GraduationCap,
  Library, X, ExternalLink, RefreshCw, Layers, Check
} from 'lucide-react';

export const AdminRecommendationsPage: React.FC = () => {
  const toast = useToast();

  // Recommendations state
  const [recommendations, setRecommendations] = useState<TopRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'order_asc' | 'order_desc' | 'newest'>('order_asc');

  // Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<RecommendationContentType>('notes');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [itemSearch, setItemSearch] = useState('');
  const [availableItems, setAvailableItems] = useState<{
    id: number;
    title: string;
    subtitle?: string;
    category?: string;
    published?: boolean;
  }[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [newDisplayOrder, setNewDisplayOrder] = useState<number>(1);
  const [newIsActive, setNewIsActive] = useState<boolean>(true);
  const [savingAdd, setSavingAdd] = useState(false);

  // Dynamic note categories from database
  const [noteCategories, setNoteCategories] = useState<{ id: number; name: string }[]>([]);

  // Edit Modal state
  const [editingRec, setEditingRec] = useState<TopRecommendation | null>(null);
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deletingRec, setDeletingRec] = useState<TopRecommendation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action busy states for individual rows
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
    loadNoteCategories();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminRecommendations();
      setRecommendations(data);
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      toast.error('Failed to load top recommendations: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNoteCategories = async () => {
    try {
      const cats = await fetchNoteCategories();
      setNoteCategories(cats);
    } catch (err) {
      console.error('Failed to load note categories:', err);
    }
  };

  // Load items for the selected content type in Add Modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    loadAvailableContentItems();
  }, [isAddModalOpen, selectedType, categoryFilter, itemSearch]);

  const loadAvailableContentItems = async () => {
    try {
      setLoadingItems(true);
      const items = await fetchExistingContentItems(selectedType, {
        categoryFilter,
        searchTerm: itemSearch,
      });
      setAvailableItems(items);
    } catch (err: any) {
      console.error('Error loading content items:', err);
      toast.error('Could not load existing content: ' + (err.message || 'Unknown error'));
      setAvailableItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // Set default display order when opening add modal
  const handleOpenAddModal = () => {
    const maxOrder = recommendations.reduce(
      (max, r) => Math.max(max, r.display_order || 0),
      0
    );
    setNewDisplayOrder(maxOrder + 1);
    setSelectedType('notes');
    setCategoryFilter('all');
    setItemSearch('');
    setSelectedItemId(null);
    setNewIsActive(true);
    setIsAddModalOpen(true);
  };

  // Handle adding recommendation
  const handleSaveAdd = async () => {
    if (!selectedItemId) {
      toast.error('Please select an existing content item.');
      return;
    }

    // Check duplicate
    const isDuplicate = recommendations.some(
      (r) => r.content_type === selectedType && r.content_id === selectedItemId
    );
    if (isDuplicate) {
      toast.error('This item is already in Top Recommendations.');
      return;
    }

    try {
      setSavingAdd(true);
      await addRecommendation({
        content_type: selectedType,
        content_id: selectedItemId,
        display_order: Number(newDisplayOrder) || 0,
        is_active: newIsActive,
      });

      toast.success('Recommendation added successfully!');
      setIsAddModalOpen(false);
      await loadRecommendations();
    } catch (err: any) {
      console.error('Error adding recommendation:', err);
      toast.error('Failed to save recommendation: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingAdd(false);
    }
  };

  // Quick toggle publish/unpublish
  const handleToggleStatus = async (rec: TopRecommendation) => {
    try {
      setTogglingId(rec.id);
      const nextStatus = !rec.is_active;

      // Optimistic update
      setRecommendations((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, is_active: nextStatus } : r))
      );

      await toggleRecommendationStatus(rec.id, nextStatus);
      toast.success(
        nextStatus ? 'Recommendation published to homepage' : 'Recommendation unpublished'
      );
    } catch (err: any) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update status: ' + (err.message || 'Unknown error'));
      await loadRecommendations();
    } finally {
      setTogglingId(null);
    }
  };

  // Reorder up / down
  const handleMoveOrder = async (rec: TopRecommendation, direction: 'up' | 'down') => {
    // Work with currently sorted array
    const sorted = [...filteredRecommendations];
    const currentIndex = sorted.findIndex((r) => r.id === rec.id);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const targetRec = sorted[targetIndex];

    try {
      setReorderingId(rec.id);

      let newOrderRec = targetRec.display_order;
      let newOrderTarget = rec.display_order;

      // Ensure distinct values if they had the same display order
      if (newOrderRec === newOrderTarget) {
        newOrderRec = direction === 'up' ? targetRec.display_order - 1 : targetRec.display_order + 1;
      }

      await Promise.all([
        updateRecommendation(rec.id, { display_order: newOrderRec }),
        updateRecommendation(targetRec.id, { display_order: newOrderTarget }),
      ]);

      toast.success('Recommendation order updated');
      await loadRecommendations();
    } catch (err: any) {
      console.error('Error reordering:', err);
      toast.error('Failed to reorder: ' + (err.message || 'Unknown error'));
    } finally {
      setReorderingId(null);
    }
  };

  // Open edit modal
  const handleOpenEdit = (rec: TopRecommendation) => {
    setEditingRec(rec);
    setEditDisplayOrder(rec.display_order || 0);
    setEditIsActive(rec.is_active);
  };

  // Save edit modal
  const handleSaveEdit = async () => {
    if (!editingRec) return;

    try {
      setSavingEdit(true);
      await updateRecommendation(editingRec.id, {
        display_order: Number(editDisplayOrder) || 0,
        is_active: editIsActive,
      });

      toast.success('Recommendation updated');
      setEditingRec(null);
      await loadRecommendations();
    } catch (err: any) {
      console.error('Error updating recommendation:', err);
      toast.error('Failed to update recommendation: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingEdit(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingRec) return;

    try {
      setIsDeleting(true);
      await deleteRecommendation(deletingRec.id);
      toast.success('Recommendation removed. Original content was NOT deleted.');
      setDeletingRec(null);
      await loadRecommendations();
    } catch (err: any) {
      console.error('Error deleting recommendation:', err);
      toast.error('Failed to delete recommendation: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Type metadata helper
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'notes':
        return {
          label: 'Notes',
          badgeBg: 'bg-red-50 text-red-700 border-red-200',
          iconBg: 'bg-red-100 text-red-600',
          Icon: FileText,
        };
      case 'paid_ebooks':
        return {
          label: 'Paid E-Books',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-purple-100 text-purple-600',
          Icon: Book,
        };
      case 'free_ebooks':
        return {
          label: 'Free E-Books',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-emerald-100 text-emerald-600',
          Icon: BookOpen,
        };
      case 'current_affairs':
        return {
          label: 'Current Affairs',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-blue-100 text-blue-600',
          Icon: Newspaper,
        };
      case 'exam_patterns':
        return {
          label: 'Pattern & Syllabus',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-100 text-amber-700',
          Icon: GraduationCap,
        };
      case 'study_resources':
        return {
          label: 'Study Resources',
          badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
          iconBg: 'bg-teal-100 text-teal-700',
          Icon: Library,
        };
      default:
        return {
          label: type,
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-100 text-slate-700',
          Icon: Star,
        };
    }
  };

  // Filtered recommendations for display
  const filteredRecommendations = useMemo(() => {
    return recommendations
      .filter((rec) => {
        // Content Type filter
        if (typeFilter !== 'all' && rec.content_type !== typeFilter) {
          return false;
        }

        // Status filter
        if (statusFilter === 'published' && !rec.is_active) return false;
        if (statusFilter === 'draft' && rec.is_active) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const title = rec.resolved_item?.title?.toLowerCase() || '';
          const category = rec.resolved_item?.category?.toLowerCase() || '';
          const typeName = rec.content_type.toLowerCase();
          return title.includes(q) || category.includes(q) || typeName.includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'order_asc') return (a.display_order || 0) - (b.display_order || 0);
        if (sortBy === 'order_desc') return (b.display_order || 0) - (a.display_order || 0);
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
      });
  }, [recommendations, typeFilter, statusFilter, searchQuery, sortBy]);

  // Set of already recommended IDs for current type (to disable in Add modal)
  const alreadyRecommendedIds = useMemo(() => {
    const ids = new Set<number>();
    recommendations.forEach((r) => {
      if (r.content_type === selectedType) {
        ids.add(r.content_id);
      }
    });
    return ids;
  }, [recommendations, selectedType]);

  // Categories list for selected type in Add Modal
  const currentTypeCategoryOptions = useMemo(() => {
    const conf = SUPPORTED_CONTENT_TYPES.find((t) => t.id === selectedType);
    if (!conf || !conf.hasCategories) return [];

    if (selectedType === 'notes') {
      return noteCategories.map((c) => ({ value: String(c.id), label: c.name }));
    }

    return conf.defaultCategories || [];
  }, [selectedType, noteCategories]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BackButton fallbackTo="/admin" label="Back to Dashboard" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
              Top Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select existing uploaded content from modules to feature on the homepage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-recommendations-btn"
            onClick={() => {
              setRefreshing(true);
              loadRecommendations();
            }}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            id="add-recommendation-btn"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C122A] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recommendation</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Total Recommendations</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{recommendations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Published (Active)</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {recommendations.filter((r) => r.is_active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Draft (Unpublished)</p>
          <p className="text-xl sm:text-2xl font-black text-slate-500 mt-1">
            {recommendations.filter((r) => !r.is_active).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Supported Modules</p>
          <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">6 Types</p>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Title / Category Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-recommendations-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recommendations..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Content Type Filter */}
          <div>
            <select
              id="filter-content-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="all">All Content Types</option>
              {SUPPORTED_CONTENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published (Active)</option>
              <option value="draft">Draft (Hidden)</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              id="sort-order-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="order_asc">Display Order (Ascending)</option>
              <option value="order_desc">Display Order (Descending)</option>
              <option value="newest">Newest Added First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading recommendations...</p>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            {recommendations.length === 0 ? 'No Recommendations Yet' : 'No Matching Recommendations'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            {recommendations.length === 0
              ? 'Click "Add Recommendation" to select an existing item from Notes, E-Books, Syllabus, or Resources to feature on the homepage.'
              : 'Try clearing your search query or filters to find what you are looking for.'}
          </p>
          {recommendations.length === 0 && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0C122A] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Recommendation</span>
            </button>
          )}
        </div>
      ) : (
        /* Recommendations List */
        <div className="space-y-3">
          {filteredRecommendations.map((rec, index) => {
            const meta = getTypeMeta(rec.content_type);
            const IconComponent = meta.Icon;
            const item = rec.resolved_item;
            const isMissing = rec.is_missing || !item;

            return (
              <div
                key={rec.id}
                id={`admin-rec-item-${rec.id}`}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                  !rec.is_active ? 'border-slate-200 opacity-75 bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left block: Order & Content Details */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* Reorder Buttons & Order Badge */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveOrder(rec, 'up')}
                        disabled={index === 0 || reorderingId === rec.id}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Move Up in order"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <span
                        className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
                        title={`Order position: #${rec.display_order}`}
                      >
                        #{rec.display_order}
                      </span>

                      <button
                        onClick={() => handleMoveOrder(rec, 'down')}
                        disabled={index === filteredRecommendations.length - 1 || reorderingId === rec.id}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Move Down in order"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Content Type Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.badgeBg}`}>
                          {meta.label}
                        </span>

                        {item?.category && (
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        )}

                        {rec.is_active ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Published
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            Draft / Hidden
                          </span>
                        )}

                        {isMissing && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Referenced content missing or deleted (ID #{rec.content_id})
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                        {item ? item.title : `Missing item reference (ID: ${rec.content_id})`}
                      </h3>

                      {item && (
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="text-[11px] text-slate-400">
                            Destination: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{item.destination_url}</code>
                          </span>
                          {item.price !== undefined && item.price > 0 && (
                            <span className="font-semibold text-slate-700">₹{item.price}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right block: Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                    {/* Toggle publish button */}
                    <button
                      id={`toggle-status-rec-${rec.id}`}
                      onClick={() => handleToggleStatus(rec)}
                      disabled={togglingId === rec.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        rec.is_active
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {togglingId === rec.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : rec.is_active ? (
                        'Unpublish'
                      ) : (
                        'Publish'
                      )}
                    </button>

                    {/* Edit Order / Status */}
                    <button
                      id={`edit-rec-${rec.id}`}
                      onClick={() => handleOpenEdit(rec)}
                      className="p-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                      title="Edit display order and status"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Recommendation */}
                    <button
                      id={`delete-rec-${rec.id}`}
                      onClick={() => setDeletingRec(rec)}
                      className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                      title="Delete recommendation (keeps original content safe)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD RECOMMENDATION MODAL                                                  */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Add Top Recommendation</h2>
                  <p className="text-xs text-slate-500">Step 1: Select Type • Step 2: Select Uploaded Item</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-5">
              {/* STEP 1: SELECT CONTENT TYPE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  1. Select Content Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUPPORTED_CONTENT_TYPES.map((type) => {
                    const isSelected = selectedType === type.id;
                    const meta = getTypeMeta(type.id);
                    const Icon = meta.Icon;

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedType(type.id);
                          setCategoryFilter('all');
                          setItemSearch('');
                          setSelectedItemId(null);
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {type.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: SELECT EXISTING UPLOADED ITEM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    2. Select Existing Uploaded Item
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {availableItems.length} item(s) found
                  </span>
                </div>

                {/* Filters Row: Category (if supported) & Search */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {currentTypeCategoryOptions.length > 0 && (
                    <div>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                      >
                        <option value="all">All Categories</option>
                        {currentTypeCategoryOptions.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={currentTypeCategoryOptions.length === 0 ? 'sm:col-span-2' : ''}>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder={`Search existing ${SUPPORTED_CONTENT_TYPES.find((t) => t.id === selectedType)?.label || 'content'}...`}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Item List Container */}
                <div className="border border-slate-200 rounded-2xl max-h-56 overflow-y-auto p-2 bg-slate-50/50 space-y-1.5">
                  {loadingItems ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Loading existing items from database...</p>
                    </div>
                  ) : availableItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700">No items available in this category</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload content in the corresponding module first.
                      </p>
                    </div>
                  ) : (
                    availableItems.map((item) => {
                      const isSelected = selectedItemId === item.id;
                      const isAlreadyAdded = alreadyRecommendedIds.has(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (!isAlreadyAdded) {
                              setSelectedItemId(item.id);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isAlreadyAdded
                              ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-50 border-blue-500 shadow-xs cursor-pointer'
                              : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.category && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {item.category}
                                </span>
                              )}
                              {item.published === false && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 mt-0.5">
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className="text-[10px] text-slate-400 line-clamp-1">
                                {item.subtitle}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isAlreadyAdded ? (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                                Already Added
                              </span>
                            ) : isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-slate-300" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* STEP 3: ORDER & PUBLISH SETTINGS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order Position
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newDisplayOrder}
                    onChange={(e) => setNewDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Lower numbers appear earlier on the homepage.
                  </p>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsActive}
                      onChange={(e) => setNewIsActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Publish Immediately</p>
                      <p className="text-[10px] text-slate-500">Make visible on the student homepage</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={savingAdd}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdd}
                disabled={!selectedItemId || savingAdd}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0C122A] hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingAdd ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Recommendation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT RECOMMENDATION MODAL                                                 */}
      {/* ========================================================================= */}
      {editingRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Edit Recommendation Settings</h2>
              <button
                onClick={() => setEditingRec(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400">Referenced Content</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {editingRec.resolved_item?.title || `ID #${editingRec.content_id}`}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Type: {getTypeMeta(editingRec.content_type).label}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Order Position
                </label>
                <input
                  type="number"
                  min="0"
                  value={editDisplayOrder}
                  onChange={(e) => setEditDisplayOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Published to Homepage</p>
                    <p className="text-[10px] text-slate-500">
                      When checked, students can view this recommendation on the homepage.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRec(null)}
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0C122A] hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL FOR DELETION                                           */}
      {/* ========================================================================= */}
      <ConfirmationModal
        isOpen={Boolean(deletingRec)}
        title="Delete Top Recommendation?"
        message={`Are you sure you want to remove "${deletingRec?.resolved_item?.title || 'this recommendation'}" from the homepage recommendations? The original uploaded content in the ${getTypeMeta(deletingRec?.content_type || '').label} module will NOT be deleted.`}
        confirmLabel="Yes, Delete Recommendation"
        cancelLabel="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingRec(null)}
      />
    </div>
  );
};
