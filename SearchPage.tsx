import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Post } from '../types';
import { INITIAL_POSTS } from '../data/initialContent';
import { PostCard } from '../components/PostCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useLanguage } from '../context/LanguageContext';
import { Search, X, BookOpen, Sparkles, Filter } from 'lucide-react';

// Urdu diacritics / Aerab normalization regex for robust bilingual search
const URDU_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(URDU_DIACRITICS_REGEX, '')
    // Normalize variant Arabic/Urdu letters
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ہ')
    .replace(/ۀ/g, 'ہ')
    .trim();
}

export const SearchPage: React.FC = () => {
  const { isUrdu, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(queryParam);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  useEffect(() => {
    setInputValue(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const fetchAllPublished = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, 'posts');
        const snap = await getDocs(postsRef);
        const published = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Post))
          .filter(p => p.status === 'published');
        setPosts(published.length > 0 ? published : INITIAL_POSTS);
      } catch (err) {
        console.warn('Using initial literature for search fallback:', err);
        setPosts(INITIAL_POSTS);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPublished();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchParams({});
  };

  // Perform bilingual query matching
  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(queryParam);

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

      // If no query string, display all matching category/language
      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        normalizeSearchText(post.titleEn),
        normalizeSearchText(post.titleUr),
        normalizeSearchText(post.excerptEn),
        normalizeSearchText(post.excerptUr),
        normalizeSearchText(post.contentEn),
        normalizeSearchText(post.contentUr),
        normalizeSearchText(post.category),
      ].join(' ');

      // Split query terms for multi-word fuzzy matching
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      return terms.every(term => searchableText.includes(term));
    });
  }, [posts, queryParam, selectedCategory, selectedLanguage]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      
      {/* Header */}
      <div className="border-b border-[#E8E2D9] dark:border-[#2A3138] pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
          {isUrdu ? 'تلاش — انک برج لائبریری' : 'Search InkBridge'}
        </h1>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1.5 max-w-2xl">
          {isUrdu
            ? 'انگریزی اور اردو تحریروں میں عنوان، متن، مصنف یا موضوع کے ذریعے فوری تلاش کریں۔'
            : 'Explore literature across English and Urdu by title, excerpt, narrative content, or category.'}
        </p>
      </div>

      {/* Primary Search Form */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-3xl">
        <div className="relative flex items-center">
          <Search className="absolute left-4 rtl:left-auto rtl:right-4 w-5 h-5 text-[#6B7280]" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isUrdu ? 'اردو یا انگریزی میں عنوان یا الفاظ درج کریں...' : 'Search in English or اردو (e.g., bridge, پل, chenab, novel)...'}
            className="w-full pl-12 rtl:pl-12 rtl:pr-12 pr-28 py-3.5 rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-base text-[#14213D] dark:text-[#FAF7F2] placeholder-[#6B7280] shadow-soft focus:border-[#D98E04]"
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-20 rtl:right-auto rtl:left-20 p-1 text-[#6B7280] hover:text-[#14213D] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2.5 rtl:right-auto rtl:left-2.5 px-4 py-2 rounded-lg bg-[#14213D] dark:bg-[#D98E04] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {isUrdu ? 'تلاش' : 'Search'}
          </button>
        </div>
      </form>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Blog', 'Article', 'Novel Episode'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                selectedCategory === cat
                  ? 'bg-[#14213D] dark:bg-[#D98E04] text-white shadow-xs'
                  : 'bg-white dark:bg-[#1A2027] text-[#6B7280] dark:text-[#9CA3AF] border border-[#E8E2D9] dark:border-[#2A3138] hover:text-[#14213D]'
              }`}
            >
              {cat === 'All' ? t('cat.all') : cat === 'Blog' ? t('cat.blog') : cat === 'Article' ? t('cat.article') : t('cat.novel')}
            </button>
          ))}
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#6B7280] dark:text-[#9CA3AF]">Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] bg-white dark:bg-[#1A2027] text-xs text-[#14213D] dark:text-[#FAF7F2]"
          >
            <option value="all">All Languages</option>
            <option value="en">English Only</option>
            <option value="ur">اردو Only</option>
            <option value="both">Bilingual</option>
          </select>
        </div>
      </div>

      {/* Status Bar */}
      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
        {queryParam ? (
          <span>
            Found <strong className="text-[#14213D] dark:text-[#FAF7F2]">{searchResults.length}</strong> result{searchResults.length === 1 ? '' : 's'} matching "{queryParam}"
          </span>
        ) : (
          <span>Showing all {searchResults.length} published stories</span>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] p-8 space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-[#D98E04]/60" />
          <h3 className="text-lg font-medium text-[#14213D] dark:text-[#FAF7F2]">
            {isUrdu ? 'کوئی نتیجہ نہیں ملا' : `No matches found for "${queryParam}"`}
          </h3>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto">
            {isUrdu
              ? 'مختلف الفاظ یا املا کے ساتھ دوبارہ تلاش کریں، یا تمام تحریریں دیکھیں۔'
              : 'Try searching with different keywords, check for typos, or reset your filters.'}
          </p>
          <button
            onClick={() => {
              setInputValue('');
              setSearchParams({});
              setSelectedCategory('All');
              setSelectedLanguage('all');
            }}
            className="px-4 py-2 rounded-lg bg-[#14213D] text-white text-xs font-semibold hover:bg-[#2D4A73]"
          >
            Clear Search
          </button>
        </div>
      )}

    </div>
  );
};
