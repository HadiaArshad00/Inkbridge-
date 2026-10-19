import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Clock, 
  Share2, 
  Copy, 
  ArrowLeft, 
  ArrowUp, 
  Layers, 
  Sparkles,
  BookOpen, 
  Globe
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Post } from '../types';
import { INITIAL_POSTS } from '../data/initialContent';
import { PostCard } from '../components/PostCard';
import { ReadingProgressBar } from '../components/ReadingProgressBar';
import { useLanguage } from '../context/LanguageContext';

export const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, isUrdu, t } = useLanguage();

  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingScript, setReadingScript] = useState<'en' | 'ur'>('en');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchPostAndRelated = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docData = snap.docs[0];
          const postData = { id: docData.id, ...docData.data() } as Post;
          setPost(postData);

          // Default script preference
          if (postData.language === 'ur' || (!postData.contentEn && !!postData.contentUr)) {
            setReadingScript('ur');
          } else if (isUrdu && postData.contentUr) {
            setReadingScript('ur');
          } else {
            setReadingScript('en');
          }

          // Fetch related posts (same category, excluding current)
          try {
            const relatedQ = query(
              postsRef,
              where('category', '==', postData.category),
              where('status', '==', 'published'),
              limit(4)
            );
            const relatedSnap = await getDocs(relatedQ);
            const related = relatedSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Post))
              .filter(p => p.id !== postData.id)
              .slice(0, 3);
            setRelatedPosts(related);
          } catch (rErr) {
            console.warn('Could not load related posts:', rErr);
          }

        } else {
          // Check initial posts fallback
          const fallbackPost = INITIAL_POSTS.find(p => p.slug === slug);
          if (fallbackPost) {
            setPost(fallbackPost);
            setReadingScript(fallbackPost.language === 'ur' ? 'ur' : (isUrdu && fallbackPost.contentUr ? 'ur' : 'en'));
            setRelatedPosts(INITIAL_POSTS.filter(p => p.id !== fallbackPost.id));
          } else {
            setPost(null);
          }
        }
      } catch (err) {
        console.warn('Error fetching post detail from Firestore, checking fallback:', err);
        const fallbackPost = INITIAL_POSTS.find(p => p.slug === slug);
        if (fallbackPost) {
          setPost(fallbackPost);
          setReadingScript(fallbackPost.language === 'ur' ? 'ur' : (isUrdu && fallbackPost.contentUr ? 'ur' : 'en'));
          setRelatedPosts(INITIAL_POSTS.filter(p => p.id !== fallbackPost.id));
        } else {
          setPost(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostAndRelated();
    }
  }, [slug, isUrdu]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(t('post.copied'));
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`"${post?.titleEn || post?.titleUr}" on InkBridge`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Read "${post?.titleEn || post?.titleUr}" on InkBridge: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-12 space-y-6">
        <div className="h-4 w-32 bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
        <div className="h-10 w-4/5 bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
        <div className="aspect-[16/9] w-full bg-[#E8E2D9] dark:bg-[#2A3138] rounded-xl animate-pulse" />
        <div className="space-y-3 pt-6">
          <div className="h-4 w-full bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-20 text-center space-y-4">
        <BookOpen className="w-12 h-12 mx-auto text-[#D98E04]" />
        <h2 className="text-2xl font-serif-literary font-semibold text-[#14213D] dark:text-[#FAF7F2]">
          Story Not Found
        </h2>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
          The publication you are seeking might have been moved or unpublished.
        </p>
        <Link
          to="/posts"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14213D] text-white text-xs font-semibold hover:bg-[#2D4A73]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse all stories</span>
        </Link>
      </div>
    );
  }

  const formattedDate = (() => {
    try {
      if (post.createdAt?.toDate) {
        return format(post.createdAt.toDate(), 'MMMM d, yyyy');
      }
      if (post.createdAt) {
        return format(new Date(post.createdAt), 'MMMM d, yyyy');
      }
      return 'Published recently';
    } catch {
      return 'Published recently';
    }
  })();

  const activeTitle = readingScript === 'ur' && post.titleUr ? post.titleUr : (post.titleEn || post.titleUr);
  const activeContent = readingScript === 'ur' && post.contentUr ? post.contentUr : (post.contentEn || post.contentUr);
  const isCurrentlyUrdu = readingScript === 'ur';

  return (
    <>
      {/* Reading Progress Indicator */}
      <ReadingProgressBar />

      <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <Link to="/" className="hover:text-[#14213D] dark:hover:text-[#FAF7F2]">
            {t('nav.home')}
          </Link>
          <span>/</span>
          <Link to={`/posts?category=${encodeURIComponent(post.category)}`} className="hover:text-[#14213D] dark:hover:text-[#FAF7F2]">
            {post.category}
          </Link>
          <span>/</span>
          <span className="truncate max-w-[200px] text-[#14213D] dark:text-[#FAF7F2] font-medium">
            {activeTitle}
          </span>
        </nav>

        {/* Header Meta: Category badge, Language badge, Series notice */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F5D88F]/50 dark:bg-[#4A3510] text-[#14213D] dark:text-[#F5D88F]">
                {post.category}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-[#E8E2D9] dark:border-[#2A3138] text-[#6B7280] dark:text-[#9CA3AF]">
                {post.language === 'both' ? 'Bilingual Edition' : post.language === 'ur' ? 'اردو متن' : 'English Edition'}
              </span>
              {post.category === 'Novel Episode' && post.episodeNumber && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#14213D] text-white">
                  Episode {post.episodeNumber}
                </span>
              )}
            </div>

            {/* Language Switcher if Bilingual */}
            {(post.contentEn && post.contentUr) && (
              <div className="inline-flex rounded-full border border-[#E8E2D9] dark:border-[#2A3138] p-0.5 bg-white dark:bg-[#1A2027]">
                <button
                  onClick={() => setReadingScript('en')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    readingScript === 'en'
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#14213D]'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setReadingScript('ur')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full font-urdu transition-all ${
                    readingScript === 'ur'
                      ? 'bg-[#D98E04] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#14213D]'
                  }`}
                >
                  اردو
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-semibold text-[#14213D] dark:text-[#FAF7F2] tracking-tight leading-[1.2] ${
            isCurrentlyUrdu ? 'font-urdu text-4xl sm:text-5xl leading-[1.8] text-right' : 'font-serif-literary'
          }`}>
            {activeTitle}
          </h1>

          {/* Meta row: Author, Date, Reading time */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 pb-6 border-b border-[#E8E2D9] dark:border-[#2A3138] text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#14213D] dark:bg-[#D98E04] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {(post.authorName || 'I')[0]}
              </div>
              <div>
                <span className="font-semibold text-[#14213D] dark:text-[#FAF7F2] block">
                  {post.authorName || 'InkBridge Editorial'}
                </span>
                <span>{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readingTimeMinutes || 3} {t('post.minRead')}
              </span>
            </div>
          </div>
        </div>

        {/* Cover Image full width within 720px */}
        {post.coverImageUrl && (
          <div className="rounded-[12px] overflow-hidden bg-[#FAF7F2] dark:bg-[#0F1419] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft">
            <img
              src={post.coverImageUrl}
              alt={activeTitle}
              loading="lazy"
              className="w-full aspect-[16/9] object-cover"
            />
          </div>
        )}

        {/* Markdown Rendered Content */}
        <article className={`pt-4 pb-8 ${
          isCurrentlyUrdu 
            ? 'urdu-reading-pane font-urdu' 
            : 'prose prose-neutral dark:prose-invert max-w-none text-[#1A1A1A] dark:text-[#E5E7EB] font-sans text-base leading-relaxed'
        }`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {activeContent}
          </ReactMarkdown>
        </article>

        {/* Social Share Row */}
        <div className="py-6 border-y border-[#E8E2D9] dark:border-[#2A3138] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2]">
            <Share2 className="w-4 h-4 text-[#D98E04]" />
            <span>{t('post.share')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-xs font-medium text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#FAF7F2] dark:hover:bg-[#2A3138] transition-all shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>

            <button
              onClick={shareOnTwitter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-xs font-medium text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#FAF7F2] dark:hover:bg-[#2A3138] transition-all shadow-xs"
            >
              <span>X (Twitter)</span>
            </button>

            <button
              onClick={shareOnWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-xs font-medium text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#FAF7F2] dark:hover:bg-[#2A3138] transition-all shadow-xs"
            >
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Related Posts Section (3 same-category posts) */}
        {relatedPosts.length > 0 && (
          <section className="pt-8 space-y-6">
            <h3 className="text-xl sm:text-2xl font-serif-literary font-semibold text-[#14213D] dark:text-[#FAF7F2]">
              {t('post.related')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((rPost) => (
                <PostCard key={rPost.id} post={rPost} />
              ))}
            </div>
          </section>
        )}

        {/* Floating / Sticky Back-to-Top Button */}
        <div className="pt-8 text-center">
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14213D] dark:hover:text-white shadow-soft transition-all"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#D98E04]" />
            <span>{t('post.backToTop')}</span>
          </button>
        </div>

      </main>
    </>
  );
};
