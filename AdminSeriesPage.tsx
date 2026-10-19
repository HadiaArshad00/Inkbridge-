import React, { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { db, storage, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Series, ContentLanguage } from '../../types';
import { 
  Layers, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Upload, 
  BookOpen, 
  CheckCircle,
  X
} from 'lucide-react';

export const AdminSeriesPage: React.FC = () => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionUr, setDescriptionUr] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [language, setLanguage] = useState<ContentLanguage>('both');

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'series'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Series));
      setSeriesList(list);
    } catch (err) {
      console.error('Error fetching series:', err);
      handleFirestoreError(err, OperationType.GET, 'series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const openCreateModal = () => {
    setEditingSeries(null);
    setNameEn('');
    setNameUr('');
    setDescriptionEn('');
    setDescriptionUr('');
    setCoverImageUrl('');
    setLanguage('both');
    setModalOpen(true);
  };

  const openEditModal = (s: Series) => {
    setEditingSeries(s);
    setNameEn(s.nameEn || '');
    setNameUr(s.nameUr || '');
    setDescriptionEn(s.descriptionEn || '');
    setDescriptionUr(s.descriptionUr || '');
    setCoverImageUrl(s.coverImageUrl || '');
    setLanguage(s.language || 'both');
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image exceeds 2MB limit.');
      return;
    }

    setUploadingImage(true);
    try {
      const fileRef = ref(storage, `series_covers/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snap.ref);
      setCoverImageUrl(url);
      toast.success('Series cover image uploaded');
    } catch (err) {
      console.warn('Storage upload error, direct URL is supported:', err);
      toast.error('Storage upload failed; you can enter an image URL directly.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) {
      toast.error('Please provide an English name for the novel series.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nameEn: nameEn.trim(),
        nameUr: nameUr.trim(),
        descriptionEn: descriptionEn.trim(),
        descriptionUr: descriptionUr.trim(),
        coverImageUrl: coverImageUrl.trim() || 'https://images.unsplash.com/photo-1545659328-941c42f06797?auto=format&fit=crop&w=800&q=80',
        language,
      };

      if (editingSeries) {
        await setDoc(doc(db, 'series', editingSeries.id), payload, { merge: true });
        toast.success(`Series "${nameEn}" updated`);
      } else {
        await addDoc(collection(db, 'series'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success(`Series "${nameEn}" created!`);
      }

      setModalOpen(false);
      await fetchSeries();
    } catch (err) {
      console.error('Error saving series:', err);
      toast.error('Failed to save novel series');
      handleFirestoreError(err, OperationType.WRITE, 'series');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeries = async (s: Series) => {
    if (!window.confirm(`Are you sure you want to delete the series "${s.nameEn}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'series', s.id));
      toast.success(`Series "${s.nameEn}" removed`);
      setSeriesList(prev => prev.filter(item => item.id !== s.id));
    } catch (err) {
      console.error('Error deleting series:', err);
      toast.error('Failed to delete series');
      handleFirestoreError(err, OperationType.DELETE, `series/${s.id}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#2A3138] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
            Novel Series & Anthologies
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            Organize serialized stories into chapters and episodic releases
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Novel Series</span>
        </button>
      </div>

      {/* Series Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">
          Loading serialized fiction collections...
        </div>
      ) : seriesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seriesList.map((s) => (
            <div
              key={s.id}
              className="rounded-[12px] overflow-hidden bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#FAF7F2] overflow-hidden">
                  <img
                    src={s.coverImageUrl || 'https://images.unsplash.com/photo-1545659328-941c42f06797?auto=format&fit=crop&w=600&q=80'}
                    alt={s.nameEn}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14213D]/90 text-white uppercase tracking-wider">
                      {s.language}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-semibold text-lg text-[#14213D] dark:text-[#FAF7F2] font-serif-literary">
                    {s.nameEn}
                  </h3>
                  {s.nameUr && (
                    <h4 className="font-urdu text-sm text-[#D98E04] text-right font-medium">
                      {s.nameUr}
                    </h4>
                  )}
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-3 leading-relaxed">
                    {s.descriptionEn}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-[#E8E2D9]/60 dark:border-[#2A3138] flex items-center justify-between">
                <span className="text-[11px] text-[#6B7280]">
                  ID: <code className="font-mono text-[10px]">{s.id.slice(0, 8)}...</code>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1.5 rounded-lg text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#FAF7F2] dark:hover:bg-[#2A3138]"
                    title="Edit series"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSeries(s)}
                    className="p-1.5 rounded-lg text-[#C53030] hover:bg-[#C53030]/10"
                    title="Delete series"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] p-8 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-[#D98E04]/60" />
          <h3 className="text-base font-semibold text-[#14213D] dark:text-[#FAF7F2]">
            No Novel Series Found
          </h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
            Create your first serialized novel series to attach chapters and episodes to it.
          </p>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#1A2027] rounded-[16px] p-6 border border-[#E8E2D9] dark:border-[#2A3138] shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#E8E2D9] dark:border-[#2A3138] pb-3">
              <h2 className="font-semibold text-lg font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
                {editingSeries ? 'Edit Novel Series' : 'Create Novel Series'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#14213D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2]">
                  Series Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. The Bridge"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] font-urdu">
                  سلسلے کا نام (Urdu Name)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={nameUr}
                  onChange={(e) => setNameUr(e.target.value)}
                  placeholder="مثلاً: پل"
                  className="w-full px-3 py-2 text-sm font-urdu rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] text-right focus:border-[#D98E04]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2]">
                  Description / Synopsis (English)
                </label>
                <textarea
                  rows={3}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Synopsis of the serialized journey..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] font-urdu">
                  اردو تعارف (Urdu Synopsis)
                </label>
                <textarea
                  dir="rtl"
                  rows={3}
                  value={descriptionUr}
                  onChange={(e) => setDescriptionUr(e.target.value)}
                  placeholder="کہانی کا خلاصہ اور پس منظر..."
                  className="w-full px-3 py-2 text-sm font-urdu rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] text-right focus:border-[#D98E04]"
                />
              </div>

              {/* Cover Image Upload / URL */}
              <div className="space-y-2 pt-2 border-t border-[#E8E2D9]/60 dark:border-[#2A3138]">
                <label className="text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] block">
                  Cover Image URL / Upload
                </label>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[#D98E04] bg-[#F5D88F]/10 hover:bg-[#F5D88F]/20 text-xs font-medium text-[#14213D] dark:text-[#F5D88F] flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#D98E04]" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E2D9] dark:border-[#2A3138]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8E2D9] text-xs font-semibold text-[#6B7280] hover:text-[#14213D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSeries ? 'Update Series' : 'Create Series'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
