import React, { useEffect, useState } from 'react';
import { supabase, uploadPdfFile, deletePdfFile, formatBytes } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Loader2, Plus, Trash2, Edit2, Search, X, UploadCloud, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from '../../components/common/BackButton';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'file_pdf' | 'file_image';
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface Props {
  tableName: string;
  title: string;
  fields: FieldDef[];
  primaryKey?: string;
}

export const DynamicTableManager: React.FC<Props> = ({ tableName, title, fields, primaryKey = 'id' }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (item: any) => {
    if (tableName === 'free_ebooks') {
      setDeletingItem(item);
    } else {
      if (!window.confirm('Are you sure you want to delete this item?')) return;
      executeDelete(item);
    }
  };

  const executeDelete = async (item: any) => {
    setIsDeleting(true);
    try {
      // If it has files, try to delete them
      for (const field of fields) {
        if (field.type === 'file_pdf' || field.type === 'file_image') {
          if (item[field.name]) {
            await deletePdfFile(item[field.name]).catch(() => {});
          }
        }
      }
      
      const { error } = await supabase.from(tableName).delete().eq(primaryKey, item[primaryKey]);
      if (error) throw error;
      toast.success('Item deleted successfully');
      loadData();
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const openAdd = () => {
    const initial: Record<string, any> = {};
    fields.forEach(f => {
      if (f.type === 'boolean') initial[f.name] = true; // default published
      else initial[f.name] = '';
    });
    setFormData(initial);
    setFiles({});
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setFormData({ ...item });
    setFiles({});
    setEditingId(item[primaryKey]);
    setIsModalOpen(true);
  };

  const handleFileChange = (fieldName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [fieldName]: file }));
    
    // Auto-fill title logic
    if (file && fieldName === 'file_path') {
      if (!formData['title'] || formData['title'].trim() === '') {
        const titleFromFilename = file.name
          .replace(/\.pdf$/i, '')
          .replace(/[_-]/g, ' ');
        setFormData(prev => ({ ...prev, title: titleFromFilename }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const toSave = { ...formData };
      
      // Handle file uploads
      for (const field of fields) {
        if ((field.type === 'file_pdf' || field.type === 'file_image') && files[field.name]) {
          toast.info(`Uploading ${field.label}...`);
          const file = files[field.name]!;
          // We can reuse the pdf upload bucket or a separate one, here we reuse pdf-notes for simplicity
          const uploadRes = await uploadPdfFile(file); 
          toSave[field.name] = uploadRes.filePath;
          
          if (field.type === 'file_pdf') {
            toSave['file_name'] = uploadRes.fileName;
            toSave['file_size'] = uploadRes.fileSize;
            
            // Auto-fill logic fallback for save
            if (!toSave['title'] || toSave['title'].trim() === '') {
              const titleFromFilename = uploadRes.fileName
                .replace(/\.pdf$/i, '')
                .replace(/[_-]/g, ' ');
              toSave['title'] = titleFromFilename;
            }
          }
        }
      }

      if (editingId) {
        const { error } = await supabase.from(tableName).update(toSave).eq(primaryKey, editingId);
        if (error) throw error;
        toast.success('Updated successfully');
      } else {
        const { error } = await supabase.from(tableName).insert([toSave]);
        if (error) throw error;
        toast.success('Created successfully');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredData = data.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.question_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [dbError, setDbError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data: records, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn(`Table error or missing: ${error.message}`);
        setDbError(error.message);
        setData([]);
      } else {
        setData(records || []);
      }
    } catch (e: any) {
      console.error(e);
      setDbError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tableName]);

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <BackButton fallbackTo="/admin" label="Back to Dashboard" forceFallback={true} />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <button 
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {dbError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6">
          <p className="font-semibold mb-1">Database Error</p>
          <p className="text-sm">{dbError}</p>
          {dbError.includes('schema cache') && (
            <p className="text-sm mt-2 font-medium">
              ACTION REQUIRED: You must execute the <code>schema.sql</code> script in your Supabase SQL Editor. The required table <code>{tableName}</code> does not exist.
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Title/Identifier</th>
                {fields.filter(f => f.type === 'select' || f.type === 'number').slice(0,2).map(f => (
                  <th key={f.name} className="px-6 py-3 font-medium">{f.label}</th>
                ))}
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No records found. Note: Ensure you have executed schema.sql in Supabase.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item[primaryKey] || Math.random()} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 max-w-xs truncate">{item.title || item.question_text || item.exam_name || item.key || item[primaryKey]}</p>
                    </td>
                    {fields.filter(f => f.type === 'select' || f.type === 'number').slice(0,2).map(f => (
                      <td key={f.name} className="px-6 py-4 text-slate-600">{item[f.name]}</td>
                    ))}
                    <td className="px-6 py-4">
                      {item.published !== undefined && (
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.published ? 'Published' : 'Draft'}
                        </span>
                      )}
                      {item.is_active !== undefined && (
                         <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(item)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading records...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No records found.
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item[primaryKey] || Math.random()}
                className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm break-words">
                      {item.title || item.question_text || item.exam_name || item.key || item[primaryKey]}
                    </p>
                  </div>
                  {item.published !== undefined && (
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                  )}
                  {item.is_active !== undefined && (
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>

                {fields.filter(f => f.type === 'select' || f.type === 'number').slice(0, 3).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 pt-1 border-t border-slate-100">
                    {fields.filter(f => f.type === 'select' || f.type === 'number').slice(0, 3).map(f => (
                      <span key={f.name} className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-[11px]">
                        <span className="text-slate-400 font-medium">{f.label}:</span>
                        <strong className="text-slate-700">{item[f.name] ?? '-'}</strong>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 min-h-[44px]"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="flex items-center justify-center p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 min-w-[44px] min-h-[44px]"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit' : 'Add'} {title}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="crud-form" onSubmit={handleSave} className="space-y-4">
                {fields.map(f => (
                  <div key={f.name} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">{f.label} {f.required && '*'}</label>
                    
                    {f.type === 'text' && (
                      <input type="text" required={f.required} value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                    )}
                    
                    {f.type === 'textarea' && (
                      <textarea required={f.required} rows={3} value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                    )}
                    
                    {f.type === 'number' && (
                      <input type="number" required={f.required} value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: Number(e.target.value)})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm" />
                    )}
                    
                    {f.type === 'select' && f.options && (
                      <select required={f.required} value={formData[f.name] || ''} onChange={e => setFormData({...formData, [f.name]: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    )}
                    
                    {f.type === 'boolean' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData[f.name] || false} onChange={e => setFormData({...formData, [f.name]: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                        <span className="text-sm text-slate-600">{f.label}</span>
                      </label>
                    )}
                    
                    {(f.type === 'file_pdf' || f.type === 'file_image') && (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                        <input type="file" accept={f.type === 'file_pdf' ? '.pdf' : 'image/*'} onChange={e => handleFileChange(f.name, e.target.files?.[0] || null)} className="text-sm" />
                        {formData[f.name] && !files[f.name] && <p className="text-xs text-emerald-600 mt-2">Current file stored securely.</p>}
                      </div>
                    )}
                  </div>
                ))}
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
              <button type="submit" form="crud-form" disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={Boolean(deletingItem)}
        title={`Delete ${title}`}
        message={`Are you sure you want to permanently delete "${deletingItem?.title || 'this item'}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={() => executeDelete(deletingItem)}
        onClose={() => setDeletingItem(null)}
      />
    </div>
  );
};
