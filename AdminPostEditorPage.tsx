import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { 
  db, 
  storage, 
  handleFirestoreError, 
  OperationType 
} from '../../lib/firebase';
import { Post, Series, PostCategory, ContentLanguage, PostStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  Sparkles, 
  Layers, 
  Globe, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Image as ImageIcon
} from 'lucide-react';

export const AdminPostEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [titleEn, setTitleEn] = useState('');
  const [titleUr, setTitleUr] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<PostCategory>('Blog');
  const [seriesId, setSeriesId] = useState<string>('');
  const [episodeNumber, setEpisodeNumber] = useState<number | ''>('');
  const [language, setLanguage] = useState<ContentLanguage>('both');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptUr, setExcerptUr] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [contentUr, setContentUr] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');

  // Series options
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  // UI state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewScript, setPreviewScript] = useState<'en' | 'ur'>('en');

  // Load existing series for dropdown
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const snap = await getDocs(collection(db, 'series'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Series));
        setSeriesList(list);
      } catch (err) {
        console.error('Error loading series list:', err);
      }
    };
    fetchSeries();
  }, []);

  // Load post if editing
  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      setLoading(true);
      try {
        const postDoc = await getDoc(doc(db, 'posts', id));
        if (postDoc.exists()) {
          const data = postDoc.data() as Post;
          setTitleEn(data.titleEn || '');
          setTitleUr(data.titleUr || '');
          setSlug(data.slug || '');
          setCategory(data.category || 'Blog');
          setSeriesId(data.seriesId || '');
          setEpisodeNumber(data.episodeNumber ?? '');
          setLanguage(data.language || 'both');
          setExcerptEn(data.excerptEn || '');
          setExcerptUr(data.excerptUr || '');
          setCoverImageUrl(data.coverImageUrl || '');
          setContentEn(data.contentEn || '');
          setContentUr(data.contentUr || '');
          setStatus(data.status || 'draft');
          setIsDirty(false);
        } else {
          toast.error('Post not found');
          navigate('/admin/posts');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        handleFirestoreError(err, OperationType.GET, `posts/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  // Auto slug generation from English title
  const handleTitleEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleEn(val);
    setIsDirty(true);
    if (!isEditing || !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  // Compute reading time in minutes: (total words / 200, rounded up)
  const computedReadingTime = useMemo(() => {
    const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
    const enWords = countWords(contentEn);
    const urWords = countWords(contentUr);
    const totalWords = Math.max(enWords, urWords);
    return Math.max(1, Math.ceil(totalWords / 200));
  }, [contentEn, contentUr]);

  // Handle Cover Image upload to Firebase Storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image exceeds 2MB limit. Please choose a smaller file.');
      return;
    }

    // Validate file type (jpg/png/webp)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid image format. Allowed formats: JPG, PNG, WEBP.');
      return;
    }

    setUploadingImage(true);
    try {
      const filename = `covers/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setCoverImageUrl(downloadUrl);
      setIsDirty(true);
      toast.success('Cover image uploaded to Firebase Storage');
    } catch (err: any) {
      console.warn('Storage upload error, allowing direct URL entry:', err);
      toast.error('Storage upload failed. You may enter an image URL directly.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Check slug uniqueness before save
  const checkSlugAvailable = async (targetSlug: string): Promise<boolean> => {
    const q = query(collection(db, 'posts'), where('slug', '==', targetSlug));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (isEditing && snap.docs.length === 1 && snap.docs[0].id === id) return true;
    return false;
  };

  const handleSave = async (targetStatus: PostStatus) => {
    // Validation
    if (!titleEn.trim() && !titleUr.trim()) {
      toast.error('Please provide at least an English or Urdu title.');
      return;
    }

    const cleanSlug = (slug || titleEn || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    if (!cleanSlug) {
      toast.error('Please provide a valid URL slug.');
      return;
    }

    setSaving(true);
    try {
      const isUnique = await checkSlugAvailable(cleanSlug);
      if (!isUnique) {
        toast.error(`The slug "${cleanSlug}" is already in use by another story.`);
        setSaving(false);
        return;
      }

      const payload = {
        titleEn: titleEn.trim(),
        titleUr: titleUr.trim(),
        slug: cleanSlug,
        category,
        seriesId: category === 'Novel Episode' && seriesId ? seriesId : null,
        episodeNumber: category === 'Novel Episode' && episodeNumber !== '' ? Number(episodeNumber) : null,
        language,
        excerptEn: excerptEn.trim(),
        excerptUr: excerptUr.trim(),
        contentEn: contentEn.trim(),
        contentUr: contentUr.trim(),
        coverImageUrl: coverImageUrl.trim(),
        status: targetStatus,
        readingTimeMinutes: computedReadingTime,
        authorId: user?.uid || 'admin_uid',
        authorName: user?.displayName || user?.email?.split('@')[0] || 'InkBridge Author',
        updatedAt: serverTimestamp(),
      };

      if (isEditing && id) {
        await setDoc(doc(db, 'posts', id), payload, { merge: true });
        toast.success(targetStatus === 'published' ? 'Manuscript published!' : 'Draft saved.');
      } else {
        const docRef = await addDoc(collection(db, 'posts'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success(targetStatus === 'published' ? 'Manuscript published!' : 'Draft saved.');
        navigate(`/admin/posts/${docRef.id}/edit`, { replace: true });
      }

      setIsDirty(false);
      setStatus(targetStatus);
    } catch (err) {
      console.error('Error saving post:', err);
      toast.error('Failed to save manuscript. Check your permissions.');
      handleFirestoreError(err, OperationType.WRITE, 'posts');
    } finally {
      setSaving(false);
    }
  };

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (loading) {
    return (
      <div className="py-20 text-center text-[#6B7280]">
        Loading manuscript editor...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Top Bar: Navigation, Status Badge, Save & Preview Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#2A3138] pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/posts"
            className="p-2 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] hover:bg-[#FAF7F2] text-[#6B7280]"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
              {isEditing ? 'Edit Manuscript' : 'Author New Manuscript'}
            </h1>
            <p className="text-xs text-[#6B7280] flex items-center gap-2 mt-0.5">
              <span>Status:</span>
              <span className={`font-semibold ${status === 'published' ? 'text-[#2F855A]' : 'text-[#D98E04]'}`}>
                {status.toUpperCase()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {computedReadingTime} min read
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Live Preview, Save Draft, Publish */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] hover:bg-[#FAF7F2] text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#D98E04]" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#14213D]/30 dark:border-[#2A3138] bg-white dark:bg-[#1A2027] hover:bg-[#FAF7F2] text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#D98E04] text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Publish Story</span>
          </button>
        </div>
      </div>

      {/* Editor Grid: Left Meta & Settings, Right Content Markdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Metadata & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="p-6 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#14213D] dark:text-[#FAF7F2] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D98E04]" />
              <span>Story Identity & Attributes</span>
            </h2>

            {/* Title EN */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
                English Title
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={handleTitleEnChange}
                placeholder="e.g. The Bridge — Episode 1"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
              />
            </div>

            {/* Title UR */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB] font-urdu">
                اردو عنوان (Title in Nastaliq)
              </label>
              <input
                type="text"
                dir="rtl"
                value={titleUr}
                onChange={(e) => { setTitleUr(e.target.value); setIsDirty(true); }}
                placeholder="مثلاً: پل — قسط ۱"
                className="w-full px-3 py-2 text-sm font-urdu rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] text-right focus:border-[#D98E04]"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
                URL Slug
              </label>
              <div className="flex items-center">
                <span className="px-2 py-2 text-xs rounded-l-lg border border-r-0 border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2] dark:bg-[#0F1419] text-[#6B7280]">
                  /post/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setIsDirty(true); }}
                  placeholder="the-bridge-episode-1"
                  className="w-full px-3 py-2 text-xs rounded-r-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] font-mono focus:border-[#D98E04]"
                />
              </div>
            </div>

            {/* Category & Language Selection */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value as PostCategory); setIsDirty(true); }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#0F1419] text-[#14213D] dark:text-[#FAF7F2]"
                >
                  <option value="Blog">Blog</option>
                  <option value="Article">Article</option>
                  <option value="Novel Episode">Novel Episode</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => { setLanguage(e.target.value as ContentLanguage); setIsDirty(true); }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#0F1419] text-[#14213D] dark:text-[#FAF7F2]"
                >
                  <option value="both">Both (Bilingual)</option>
                  <option value="en">English Only</option>
                  <option value="ur">Urdu Only</option>
                </select>
              </div>
            </div>

            {/* Novel Episode Specific Fields */}
            {category === 'Novel Episode' && (
              <div className="p-3.5 rounded-lg bg-[#FAF7F2] dark:bg-[#0F1419] border border-[#E8E2D9] dark:border-[#2A3138] space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#14213D] dark:text-[#FAF7F2]">
                    Belongs to Series
                  </label>
                  <select
                    value={seriesId}
                    onChange={(e) => { setSeriesId(e.target.value); setIsDirty(true); }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-[#14213D] dark:text-[#FAF7F2]"
                  >
                    <option value="">Select a novel series...</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} {s.nameUr ? `(${s.nameUr})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#14213D] dark:text-[#FAF7F2]">
                    Episode Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={episodeNumber}
                    onChange={(e) => { setEpisodeNumber(e.target.value ? Number(e.target.value) : ''); setIsDirty(true); }}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-[#14213D] dark:text-[#FAF7F2]"
                  />
                </div>
              </div>
            )}

            {/* Excerpt EN */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB]">
                English Excerpt (summary for cards)
              </label>
              <textarea
                rows={2}
                value={excerptEn}
                onChange={(e) => { setExcerptEn(e.target.value); setIsDirty(true); }}
                placeholder="Short 2-3 line preview..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
              />
            </div>

            {/* Excerpt UR */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#1A1A1A] dark:text-[#E5E7EB] font-urdu">
                اردو خلاصہ (Urdu Excerpt)
              </label>
              <textarea
                dir="rtl"
                rows={2}
                value={excerptUr}
                onChange={(e) => { setExcerptUr(e.target.value); setIsDirty(true); }}
                placeholder="مختصر خلاصہ..."
                className="w-full px-3 py-2 text-sm font-urdu rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] text-right focus:border-[#D98E04]"
              />
            </div>

            {/* Cover Image Upload & URL */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2D9]/60 dark:border-[#2A3138]">
              <label className="text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] flex items-center justify-between">
                <span>Cover Image</span>
                <span className="text-[10px] text-[#6B7280]">Max 2MB (JPG, PNG, WEBP)</span>
              </label>

              {/* File upload input */}
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#D98E04] bg-[#F5D88F]/10 hover:bg-[#F5D88F]/20 text-xs font-medium text-[#14213D] dark:text-[#F5D88F] transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#D98E04]" />
                  <span>{uploadingImage ? 'Uploading to Storage...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Direct URL input */}
              <div className="space-y-1">
                <span className="text-[10px] text-[#6B7280]">Or enter direct image URL:</span>
                <input
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => { setCoverImageUrl(e.target.value); setIsDirty(true); }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04]"
                />
              </div>

              {/* Image Preview Thumbnail */}
              {coverImageUrl && (
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]">
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Markdown Content Editors (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* English Content Box */}
          <div className="p-6 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#14213D] dark:text-[#FAF7F2] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#D98E04]" />
                <span>English Manuscript (Markdown)</span>
              </label>
              <span className="text-[11px] text-[#6B7280]">
                {contentEn.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              rows={12}
              value={contentEn}
              onChange={(e) => { setContentEn(e.target.value); setIsDirty(true); }}
              placeholder="# Heading 1&#10;&#10;Write your English manuscript in Markdown here...&#10;&#10;> Blockquotes and dialogue&#10;&#10;* Bullet points"
              className="w-full p-4 font-mono text-xs sm:text-sm rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/40 dark:bg-[#0F1419]/40 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04] leading-relaxed resize-y"
            />
          </div>

          {/* Urdu Content Box (RTL, Nastaliq) */}
          <div className="p-6 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#14213D] dark:text-[#FAF7F2] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#D98E04]" />
                <span>اردو متن (Urdu Markdown — RTL)</span>
              </label>
              <span className="text-[11px] text-[#6B7280]">
                {contentUr.split(/\s+/).filter(Boolean).length} الفاظ
              </span>
            </div>

            <textarea
              dir="rtl"
              rows={12}
              value={contentUr}
              onChange={(e) => { setContentUr(e.target.value); setIsDirty(true); }}
              placeholder="## پہلا باب&#10;&#10;یہاں اردو میں مارک ڈاؤن کے ساتھ تحریر درج کریں...&#10;&#10;> خوبصورت جملے اور اقتباسات"
              className="w-full p-4 font-urdu text-base text-right rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/40 dark:bg-[#0F1419]/40 text-[#14213D] dark:text-[#FAF7F2] focus:border-[#D98E04] leading-[2.2] resize-y"
            />
          </div>

        </div>

      </div>

      {/* Live Preview Modal (as readers will see it) */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-[800px] max-h-[90vh] bg-white dark:bg-[#1A2027] rounded-[16px] border border-[#E8E2D9] dark:border-[#2A3138] shadow-2xl overflow-y-auto p-6 sm:p-10 space-y-6">
            
            {/* Modal header with close & EN/UR toggle */}
            <div className="sticky top-0 bg-white/95 dark:bg-[#1A2027]/95 backdrop-blur-md pb-4 border-b border-[#E8E2D9] dark:border-[#2A3138] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D98E04]">
                  Reader Preview Mode
                </span>
                {/* Toggle EN / UR preview */}
                <div className="inline-flex rounded-full border border-[#E8E2D9] p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewScript('en')}
                    className={`px-3 py-0.5 text-xs font-semibold rounded-full ${previewScript === 'en' ? 'bg-[#14213D] text-white' : 'text-[#6B7280]'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewScript('ur')}
                    className={`px-3 py-0.5 text-xs font-semibold rounded-full font-urdu ${previewScript === 'ur' ? 'bg-[#D98E04] text-white' : 'text-[#6B7280]'}`}
                  >
                    اردو
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-3 py-1 rounded-lg border border-[#E8E2D9] text-xs font-semibold text-[#6B7280] hover:text-[#14213D]"
              >
                Close Preview
              </button>
            </div>

            {/* Rendered post preview */}
            <div className="max-w-[720px] mx-auto space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5D88F]/50 text-[#14213D]">
                  {category}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {computedReadingTime} min read
                </span>
              </div>

              <h1 className={`text-3xl sm:text-4xl font-semibold text-[#14213D] dark:text-[#FAF7F2] ${
                previewScript === 'ur' ? 'font-urdu text-right leading-loose' : 'font-serif-literary'
              }`}>
                {previewScript === 'ur' && titleUr ? titleUr : (titleEn || titleUr || 'Untitled Manuscript')}
              </h1>

              {coverImageUrl && (
                <div className="aspect-[16/9] rounded-xl overflow-hidden border border-[#E8E2D9]">
                  <img src={coverImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className={previewScript === 'ur' ? 'urdu-reading-pane font-urdu' : 'prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed'}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {previewScript === 'ur' ? (contentUr || '_No Urdu content provided._') : (contentEn || '_No English content provided._')}
                </ReactMarkdown>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
