import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Post, PostCategory, ContentLanguage } from '../types';
import { INITIAL_POSTS } from '../data/initialContent';
import { PostCard } from '../components/PostCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useLanguage } from '../context/LanguageContext';
import { Search, Filter, SlidersHorizontal, RefreshCw, BookOpen } from 'lucide-react';

export const PostsPage: React.FC = () => {
  const { lang, isUrdu, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(9);

  // Filters from query params
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('q') || '';
  const initialLanguage = searchParams.get('lang') || 'all';
  const initialSort = searchParams.get('sort') || 'newest';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest'>(initialSort as 'newest' | 'oldest');

  // Sync state when URL params change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, 'posts');
        const snap = await getDocs(postsRef);
        const allPosts: Post[] = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Post))
          .filter(p => p.status === 'published');
        
        setPosts(allPosts.length > 0 ? allPosts : INITIAL_POSTS);
      } catch (err) {
        console.warn('Using initial posts fallback:', err);
        setPosts(INITIAL_POSTS);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter and sort posts in memory for instant high-speed responsive UX
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Category filter
      if (selectedCategory !== 'All' && post.category !== selectedCategory) {
        return false;
      }

      // Language filter
      if (selectedLanguage !== 'all') {
        if (selectedLanguage === 'en' && post.language === 'ur') return false;
        if (selectedLanguage === 'ur' && post.language === 'en') return false;
        if (selectedLanguage === 'both' && post.language !== 'both') return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim();
        const inTitleEn = (post.titleEn || '').toLowerCase().includes(term);
        const inTitleUr = (post.titleUr || '').toLowerCase().includes(term);
        const inContentEn = (post.contentEn || '').toLowerCase().includes(term);
        const inContentUr = (post.contentUr || '').toLowerCase().includes(term);
        const inExcerptEn = (post.excerptEn || '').toLowerCase().includes(term);
        const inExcerptUr = (post.excerptUr || '').toLowerCase().includes(term);

        if (!inTitleEn && !inTitleUr && !inContentEn && !inContentUr && !inExcerptEn && !inExcerptUr) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return selectedSort === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [posts, selectedCategory, selectedLanguage, searchQuery, selectedSort]);

  const displayedPosts = filteredPosts.slice(0, visibleCount);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLanguage('all');
    setSelectedSort('newest');
    setSearchParams({});
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      
      {/* Header */}
      <div className="border-b border-[#E8E2D9] dark:border-[#2A3138] pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
          {t('post.allPosts')}
        </h1>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1.5 max-w-2xl">
          {isUrdu 
            ? 'ہماری تمام ادبی تحریروں، ناول کی اقساط اور فکری مضامین کا مکمل ذخیرہ تلاش کریں۔'
            : 'Explore our complete catalogue of literary fiction, serialized chapters, and essays.'}
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-[#1A2027] rounded-[12px] p-4 sm:p-5 border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-4">
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('post.searchPlaceholder')}
            className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2]/60 dark:bg-[#0F1419]/60 text-sm text-[#1A1A1A] dark:text-[#FAF7F2] placeholder-[#6B7280] focus:border-[#D98E04]"
          />
        </div>

        {/* Filter row: Categories, Language, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Blog', 'Article', 'Novel Episode'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#14213D] dark:bg-[#D98E04] text-white shadow-xs'
                    : 'bg-[#FAF7F2] dark:bg-[#0F1419] text-[#6B7280] dark:text-[#9CA3AF] border border-[#E8E2D9] dark:border-[#2A3138] hover:text-[#14213D] dark:hover:text-white'
                }`}
              >
                {cat === 'All' ? t('cat.all') : cat === 'Blog' ? t('cat.blog') : cat === 'Article' ? t('cat.article') : t('cat.novel')}
              </button>
            ))}
          </div>

          {/* Right side: Language selector & Sort dropdown */}
          <div className="flex items-center gap-3">
            {/* Language filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2] dark:bg-[#0F1419] text-[#14213D] dark:text-[#FAF7F2]"
            >
              <option value="all">Language: All</option>
              <option value="en">English Only</option>
              <option value="ur">اردو Only</option>
              <option value="both">Bilingual</option>
            </select>

            {/* Sort selector */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2] dark:bg-[#0F1419] text-[#14213D] dark:text-[#FAF7F2]"
            >
              <option value="newest">{t('post.newest')}</option>
              <option value="oldest">{t('post.oldest')}</option>
            </select>
          </div>

        </div>
      </div>

      {/* Results Count & Active Filters Indicator */}
      <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
        <span>
          Showing {displayedPosts.length} of {filteredPosts.length} published stories
        </span>
        {(searchQuery || selectedCategory !== 'All' || selectedLanguage !== 'all') && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[#D98E04] hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Posts Grid: 3 col desktop, 2 col tablet, 1 col mobile */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : displayedPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] p-8 space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-[#D98E04]/60" />
          <h3 className="text-lg font-medium text-[#14213D] dark:text-[#FAF7F2]">
            {t('post.empty')}
          </h3>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto">
            No stories match your current search query or filter criteria. Try adjusting your filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg bg-[#14213D] text-white text-xs font-semibold hover:bg-[#2D4A73]"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Load More Button */}
      {displayedPosts.length < filteredPosts.length && (
        <div className="text-center pt-8">
          <button
            onClick={() => setVisibleCount(prev => prev + 6)}
            className="px-6 py-2.5 rounded-full border border-[#14213D]/20 dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#FAF7F2] shadow-sm transition-all"
          >
            Load More Stories
          </button>
        </div>
      )}

    </div>
  );
};
