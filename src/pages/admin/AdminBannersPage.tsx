import React, { useEffect, useState, useMemo } from 'react';
import { supabase, uploadBannerImage, deletePdfFile, getSecurePdfUrl, formatBytes } from '../../lib/supabase';
import { Banner } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { BackButton } from '../../components/common/BackButton';
import {
  Search, Plus, Edit2, Trash2, CheckCircle2,
  Loader2, X, UploadCloud, ArrowUpDown, Calendar,
  Hash, ExternalLink, Image as ImageIcon, AlertTriangle, Check, Eye
} from 'lucide-react';

interface ImageValidationInfo {
  width: number;
  height: number;
  aspectRatio: number;
  is16by9: boolean;
  variancePct: number;
  previewUrl: string;
}

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Signed URLs cache for admin preview
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'EC Notes' | 'EC Test'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'order' | 'newest'>('order');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [section, setSection] = useState<'EC Notes' | 'EC Test'>('EC Notes');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number | ''>(0);
  const [isActive, setIsActive] = useState(true);
  const [title, setTitle] = useState('');
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [validationInfo, setValidationInfo] = useState<ImageValidationInfo | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Deletion State
  const [deletingItem, setDeletingItem] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if title column exists in database schema
  const [hasDbTitleColumn, setHasDbTitleColumn] = useState(false);

  useEffect(() => {
    checkDbSchema();
    loadBanners();
  }, []);

  const checkDbSchema = async () => {
    try {
      const { error } = await supabase.from('banners').select('title').limit(1);
      setHasDbTitleColumn(!error);
    } catch {
      setHasDbTitleColumn(false);
    }
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = (data || []) as Banner[];
      setBanners(rows);

      // Preload secure signed URLs for thumbnails
      resolvePreviewUrls(rows);
    } catch (err: any) {
      console.error('Error loading banners:', err);
      toast.error('Failed to load Banners: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const resolvePreviewUrls = async (rows: Banner[]) => {
    const urlMap: Record<number, string> = {};
    await Promise.all(
      rows.map(async (item) => {
        if (!item.image_path) return;
        if (item.image_path.startsWith('http')) {
          urlMap[item.id] = item.image_path;
        } else {
          const url = await getSecurePdfUrl(item.image_path, 3600);
          if (url) urlMap[item.id] = url;
        }
      })
    );
    setPreviewUrls((prev) => ({ ...prev, ...urlMap }));
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setSection('EC Notes');
    setLinkUrl('');
    setDisplayOrder(banners.length > 0 ? Math.max(...banners.map((b) => b.display_order || 0)) + 1 : 0);
    setIsActive(true);
    setTitle('');
    setIsTitleManuallyEdited(false);
    setImageFile(null);
    setValidationInfo(null);
    setExistingImageUrl(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: Banner) => {
    setEditingItem(item);
    // Normalize section to 'EC Notes' or 'EC Test'
    setSection(item.section === 'EC Test' ? 'EC Test' : 'EC Notes');
    setLinkUrl(item.link_url || '');
    setDisplayOrder(item.display_order ?? 0);
    setIsActive(item.is_active);
    setTitle(item.title || '');
    setIsTitleManuallyEdited(true); // Don't wipe existing title on image replacement
    setImageFile(null);
    setValidationInfo(null);

    // Existing preview URL
    const existingUrl = previewUrls[item.id] || (await getSecurePdfUrl(item.image_path, 3600));
    setExistingImageUrl(existingUrl);

    setIsModalOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsTitleManuallyEdited(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate MIME type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        toast.error('Unsupported file format. Please upload JPG, PNG, or WEBP.');
        e.target.value = '';
        return;
      }

      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size exceeds 10MB limit.');
        e.target.value = '';
        return;
      }

      // Validate aspect ratio via Image loader before accepting
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const ratio = width / height;
        const targetRatio = 16 / 9; // ~1.7778
        const diff = Math.abs(ratio - targetRatio);
        const tolerance = 0.12; // Allow small pixel rounding tolerance

        if (diff > tolerance) {
          toast.error('Banner image must use a 16:9 aspect ratio.');
          e.target.value = '';
          setImageFile(null);
          setValidationInfo(null);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setImageFile(file);
        setValidationInfo({
          width,
          height,
          aspectRatio: Number(ratio.toFixed(2)),
          is16by9: true,
          variancePct: Math.round((diff / targetRatio) * 100),
          previewUrl: objectUrl,
        });

        // Title Auto-fill from filename if admin has not manually edited the title
        if (!isTitleManuallyEdited) {
          const autoName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          setTitle(autoName);
        }
      };
      img.onerror = () => {
        toast.error('Failed to parse image file. Please try another image.');
        e.target.value = '';
        setImageFile(null);
        setValidationInfo(null);
      };
      img.src = objectUrl;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem && !imageFile) {
      toast.error('Please select a 16:9 banner image.');
      return;
    }

    if (imageFile && validationInfo && !validationInfo.is16by9) {
      toast.error('Banner image must use a 16:9 aspect ratio.');
      return;
    }

    if (!section) {
      toast.error('Please select a banner section.');
      return;
    }

    setSaving(true);
    let newlyUploadedPath: string | null = null;

    try {
      let finalImagePath = editingItem?.image_path || '';

      // 1. Safe upload: Upload new image first if selected
      if (imageFile) {
        toast.info('Uploading banner image...');
        const uploadRes = await uploadBannerImage(imageFile);
        newlyUploadedPath = uploadRes.filePath;
        finalImagePath = uploadRes.filePath;
      }

      const orderVal = typeof displayOrder === 'number' ? displayOrder : 0;
      const cleanLink = linkUrl.trim() || null;

      // 2. Prepare payload matching existing schema
      const payload: Record<string, any> = {
        section,
        image_path: finalImagePath,
        link_url: cleanLink,
        display_order: orderVal,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (hasDbTitleColumn && title.trim()) {
        payload.title = title.trim();
      }

      if (editingItem) {
        // UPDATE record
        const { data, error } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', editingItem.id)
          .select()
          .single();

        if (error) throw error;

        // 3. Safe image cleanup: Only after DB update succeeds, delete old image file
        if (imageFile && editingItem.image_path && editingItem.image_path !== finalImagePath) {
          try {
            await deletePdfFile(editingItem.image_path);
          } catch (storageCleanupErr) {
            console.warn('Storage cleanup note:', storageCleanupErr);
          }
        }

        toast.success('Banner updated successfully.');
      } else {
        // INSERT record
        const { data, error } = await supabase
          .from('banners')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        toast.success('Banner created successfully.');
      }

      setIsModalOpen(false);
      loadBanners();
    } catch (err: any) {
      console.error('Error saving banner:', err);
      // Rollback: If database update failed and we uploaded a new file, remove it safely
      if (newlyUploadedPath) {
        try {
          await deletePdfFile(newlyUploadedPath);
        } catch (cleanupErr) {
          console.warn('Failed to clean up newly uploaded banner file on rollback:', cleanupErr);
        }
      }
      toast.error('Failed to save banner: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: Banner) => {
    const nextStatus = !item.is_active;

    // Optimistic update
    setBanners((prev) =>
      prev.map((b) => (b.id === item.id ? { ...b, is_active: nextStatus } : b))
    );

    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(`Banner ${nextStatus ? 'published' : 'moved to draft'}.`);
    } catch (err: any) {
      console.error('Error toggling status:', err);
      // Rollback on failure
      setBanners((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, is_active: item.is_active } : b))
      );
      toast.error('Failed to update banner status: ' + (err.message || 'Unknown error'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      // 1. Delete image file from storage safely
      if (deletingItem.image_path && !deletingItem.image_path.startsWith('http')) {
        try {
          await deletePdfFile(deletingItem.image_path);
        } catch (storageErr) {
          console.warn('Storage file deletion note:', storageErr);
        }
      }

      // 2. Delete database record
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', deletingItem.id);

      if (error) throw error;

      toast.success('Banner deleted successfully.');
      setBanners((prev) => prev.filter((b) => b.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      toast.error('Failed to delete banner: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered and Sorted Banners
  const filteredBanners = useMemo(() => {
    return banners
      .filter((item) => {
        // Section filter
        if (sectionFilter !== 'all') {
          const itemSec = item.section === 'EC Test' ? 'EC Test' : 'EC Notes';
          if (itemSec !== sectionFilter) return false;
        }

        // Status filter
        if (statusFilter === 'active' && !item.is_active) return false;
        if (statusFilter === 'inactive' && item.is_active) return false;

        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = (item.title || '').toLowerCase().includes(q);
          const matchPath = item.image_path.toLowerCase().includes(q);
          const matchLink = (item.link_url || '').toLowerCase().includes(q);
          const matchSection = (item.section || '').toLowerCase().includes(q);
          return matchTitle || matchPath || matchLink || matchSection;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'order') {
          const orderA = a.display_order ?? 0;
          const orderB = b.display_order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [banners, sectionFilter, statusFilter, searchTerm, sortBy]);

  const getFileNameFromPath = (path: string) => {
    const raw = path.split('/').pop() || path;
    return raw.replace(/^\d+-[a-z0-9]+-/, '');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="mb-3">
            <BackButton fallbackTo="/admin" label="Back to Admin Dashboard" forceFallback={true} />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Home Banners
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage promotional 16:9 carousel banners for EC Notes and EC Test.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs shadow-blue-600/20 active:scale-95 transition-all cursor-pointer self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </button>
      </div>

      {/* 16:9 Standard Format Notice Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-100 p-4 sm:p-5 text-xs text-blue-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
            16:9
          </div>
          <div className="space-y-1">
            <div className="font-bold text-sm text-blue-950">
              Standard Banner Aspect Ratio: 16:9
            </div>
            <p className="text-blue-800 leading-relaxed">
              Recommended upload size is <span className="font-bold text-blue-900">1920 × 1080 px</span>. Supported formats: <span className="font-semibold">JPG, JPEG, PNG, WEBP</span> (up to 10MB). All student-facing banners maintain their 16:9 ratio without stretching or distortion.
            </p>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search banners by title, link, section, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value as any)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Sections ({banners.length})</option>
            <option value="EC Notes">EC Notes ({banners.filter((b) => b.section !== 'EC Test').length})</option>
            <option value="EC Test">EC Test ({banners.filter((b) => b.section === 'EC Test').length})</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="all">All Status ({banners.length})</option>
            <option value="active">Active Only ({banners.filter((b) => b.is_active).length})</option>
            <option value="inactive">Draft Only ({banners.filter((b) => !b.is_active).length})</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 cursor-pointer"
          >
            <option value="order">Sort: Display Order</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading home banners...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {searchTerm || sectionFilter !== 'all' || statusFilter !== 'all'
              ? 'No Matching Banners Found'
              : 'No banners added yet.'}
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {searchTerm || sectionFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search query, section, or status filters.'
              : 'Add 16:9 promotional banners for EC Notes or EC Test series directly from the admin panel.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-40">Preview</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4 w-32">Section</th>
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                    <th className="py-3 px-4 w-24 text-center">Display Order</th>
                    <th className="py-3 px-4 w-32">Created Date</th>
                    <th className="py-3 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBanners.map((item) => {
                    const preview = previewUrls[item.id];
                    const fileName = getFileNameFromPath(item.image_path);
                    const isTest = item.section === 'EC Test';
                    const formattedDate = item.created_at
                      ? new Date(item.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* 1. Preview */}
                        <td className="py-3.5 px-4">
                          <div className="w-36 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 relative group">
                            {preview ? (
                              <img
                                src={preview}
                                alt={item.title || fileName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              </div>
                            )}
                            {preview && (
                              <a
                                href={preview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                title="View full image in new tab"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 2. Title & Links */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm mb-0.5 line-clamp-1">
                            {item.title || fileName}
                          </div>
                          <div className="flex flex-col gap-0.5 text-[11px] text-slate-500">
                            <span className="font-mono text-slate-600 truncate max-w-[220px]">
                              {fileName}
                            </span>
                            {item.link_url && (
                              <a
                                href={item.link_url}
                                target={item.link_url.startsWith('http') ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs truncate max-w-[220px]"
                                title={item.link_url}
                              >
                                <span className="truncate">{item.link_url}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 3. Section */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isTest
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isTest ? 'bg-purple-500' : 'bg-blue-500'
                              }`}
                            />
                            {isTest ? 'EC Test' : 'EC Notes'}
                          </span>
                        </td>

                        {/* 4. Status Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              item.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle publish status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{item.is_active ? 'Active' : 'Draft'}</span>
                          </button>
                        </td>

                        {/* 5. Display Order */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                            #{item.display_order ?? 0}
                          </span>
                        </td>

                        {/* 6. Created Date */}
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formattedDate}
                          </span>
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Banner"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Banner"
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
          </div>

          {/* Mobile Stacked Card View (md:hidden) — strictly NO horizontal overflow */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredBanners.map((item) => {
              const preview = previewUrls[item.id];
              const fileName = getFileNameFromPath(item.image_path);
              const isTest = item.section === 'EC Test';
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  {/* 16:9 Image Preview */}
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                    {preview ? (
                      <img
                        src={preview}
                        alt={item.title || fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </div>
                    )}
                    {/* Top badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                        Order #{item.display_order ?? 0}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-xs ${
                          isTest
                            ? 'bg-purple-900/80 text-purple-200 border-purple-400/30'
                            : 'bg-blue-900/80 text-blue-200 border-blue-400/30'
                        }`}
                      >
                        {isTest ? 'EC Test' : 'EC Notes'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Details */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm break-words">
                      {item.title || fileName}
                    </h3>
                    <div className="text-[11px] text-slate-500 truncate">
                      File: <span className="font-mono text-slate-700">{fileName}</span>
                    </div>
                    {item.link_url && (
                      <div className="text-[11px] text-blue-600 truncate flex items-center gap-1 pt-0.5">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.link_url}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 pt-0.5">
                      Created: {formattedDate}
                    </div>
                  </div>

                  {/* Actions & Status Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                        item.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{item.is_active ? 'Active' : 'Draft'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 min-h-[44px]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="inline-flex items-center justify-center p-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 min-w-[44px] min-h-[44px]"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Banner' : 'Add Banner'}
                </h2>
                <p className="text-xs text-slate-500">
                  16:9 ratio banner (1920 × 1080 recommended)
                </p>
              </div>
              <button
                onClick={() => !saving && setIsModalOpen(false)}
                disabled={saving}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* 1. Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Banner Image {editingItem ? '(Leave blank to keep existing)' : <span className="text-rose-500">*</span>}
                </label>

                {/* Upload Input Box */}
                <label
                  htmlFor="banner-image-input"
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 sm:p-5 cursor-pointer transition-all ${
                    imageFile
                      ? 'border-blue-300 bg-blue-50/40'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <UploadCloud className={`w-8 h-8 mb-2 ${imageFile ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-800">
                    {imageFile ? 'Change Selected Image' : 'Select Banner Image'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    16:9 Aspect Ratio (1920 × 1080 px) • JPG, PNG, WEBP up to 10MB
                  </span>
                  <input
                    id="banner-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                {/* Validation Status & Live 16:9 Preview */}
                {validationInfo && (
                  <div className="mt-3 space-y-2">
                    {/* Dimension & Aspect Ratio Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {validationInfo.width} × {validationInfo.height} px
                      </span>
                      {imageFile && (
                        <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {formatBytes(imageFile.size)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Valid 16:9 Ratio
                      </span>
                    </div>

                    {/* Preview Box */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        16:9 Preview
                      </span>
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                        <img
                          src={validationInfo.previewUrl}
                          alt="Selected banner preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Image Preview (if editing and no new file selected) */}
                {!imageFile && existingImageUrl && (
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Current Banner Image
                    </span>
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      <img
                        src={existingImageUrl}
                        alt="Current banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Section Selector (REQUIRED) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Section <span className="text-rose-500">*</span>
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as 'EC Notes' | 'EC Test')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800"
                  required
                >
                  <option value="EC Notes">EC Notes</option>
                  <option value="EC Test">EC Test</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Every banner belongs to exactly one section and will show only in that designated area.
                </p>
              </div>

              {/* 3. Title / Label (with auto-fill support) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Welcome to Education Concept"
                  value={title}
                  onChange={handleTitleChange}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Auto-filled from filename on selection. You can manually customize it.
                </p>
              </div>

              {/* 4. Link URL / Action (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Destination Link URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /notes, /paid-ebooks, or https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  When students click the banner, they will navigate to this route or URL.
                </p>
              </div>

              {/* 5. Row: Display Order & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Display Order <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="0"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Lower numbers appear first in the banner carousel.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Publish Status
                  </label>
                  <div className="pt-1.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        {isActive ? 'Active (Visible to Students)' : 'Draft (Hidden from Students)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-95 transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Create Banner'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!deletingItem}
        title="Delete Home Banner"
        message={`Are you sure you want to permanently delete this banner? The image file will be removed from storage and this banner will immediately stop appearing on the website.`}
        confirmText="Delete Banner"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeletingItem(null)}
      />
    </div>
  );
};
