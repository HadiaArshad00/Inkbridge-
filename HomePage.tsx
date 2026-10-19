import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Post, Series, PostCategory } from '../types';
import { INITIAL_POSTS, INITIAL_SERIES } from '../data/initialContent';
import { PostCard } from '../components/PostCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Sparkles, Feather, ArrowRight, Layers, Bookmark } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { lang, isUrdu, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { id: 'All', label: t('cat.all') },
    { id: 'Blog', label: t('cat.blog') },
    { id: 'Article', label: t('cat.article') },
    { id: 'Novel Episode', label: t('cat.novel') },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch published posts
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(12)
      );
      
      let fetchedPosts: Post[] = [];
      try {
        const snap = await getDocs(q);
        fetchedPosts = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Post));
      } catch (qErr) {
        // Fallback without compound index / orderby if index is pending
        const fallbackSnap = await getDocs(postsRef);
        fetchedPosts = fallbackSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Post))
          .filter(p => p.status === 'published');
      }

      // If database has published posts, use them; otherwise fallback to curated sample literature
      const activePosts = fetchedPosts.length > 0 ? fetchedPosts : INITIAL_POSTS;
      setFeaturedPost(activePosts[0]);
      setPosts(activePosts.slice(1));

      // Fetch series for spotlight
      try {
        const seriesRef = collection(db, 'series');
        const seriesSnap = await getDocs(query(seriesRef, limit(3)));
        const fetchedSeries: Series[] = seriesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Series));
        setSeriesList(fetchedSeries.length > 0 ? fetchedSeries : [INITIAL_SERIES]);
      } catch {
        setSeriesList([INITIAL_SERIES]);
      }

    } catch (error) {
      console.error('Error fetching homepage data, using initial literature:', error);
      setFeaturedPost(INITIAL_POSTS[0]);
      setPosts(INITIAL_POSTS.slice(1));
      setSeriesList([INITIAL_SERIES]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Filter posts based on category pill
  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'All') return true;
    return post.category === selectedCategory;
  });

  return (
    <div className="space-y-16 md:space-y-24">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-18 border-b border-[#E8E2D9] dark:border-[#2A3138] bg-gradient-to-b from-[#FAF7F2] via-[#F5EFE6] to-[#FAF7F2] dark:from-[#0F1419] dark:via-[#151C24] dark:to-[#0F1419] transition-colors">
        
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#D98E04]/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          
          {/* Subtle top pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D98E04]/30 bg-[#FAF7F2]/80 dark:bg-[#1A2027]/80 text-[#D98E04] text-xs font-medium tracking-wide shadow-xs">
            <Feather className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'اردو اور انگریزی کا ادبی سنگم' : 'A Bilingual Literary Journal & Series'}</span>
          </div>

          {/* Main Headline */}
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#14213D] dark:text-[#FAF7F2] max-w-4xl mx-auto leading-[1.15] ${
            isUrdu ? 'font-urdu leading-tight text-5xl sm:text-6xl md:text-7xl' : 'font-serif-literary'
          }`}>
            {t('hero.tagline')}
          </h1>

          {/* Subheadline */}
          <p className={`text-base sm:text-lg md:text-xl text-[#6B7280] dark:text-[#9CA3AF] max-w-2xl mx-auto leading-relaxed ${
            isUrdu ? 'font-urdu text-lg sm:text-xl leading-relaxed' : 'font-sans'
          }`}>
            {t('hero.subheadline')}
          </p>

          {/* Two Primary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/posts"
              className="px-6 py-3 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] text-white font-medium text-sm transition-all shadow-sm flex items-center gap-2 group"
            >
              <span>{t('hero.startReading')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>

            <Link
              to="/series"
              className="px-6 py-3 rounded-lg border border-[#14213D]/20 dark:border-[#FAF7F2]/20 hover:border-[#D98E04] bg-white dark:bg-[#1A2027] text-[#14213D] dark:text-[#FAF7F2] font-medium text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#D98E04]" />
              <span>{t('hero.exploreNovels')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-16">

        {/* Featured Post (Latest published side-image card) */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-36 bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
            <div className="rounded-[12px] h-80 bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] animate-pulse" />
          </div>
        ) : featuredPost ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D98E04]">
              <Sparkles className="w-4 h-4" />
              <span>{t('post.featured')}</span>
            </div>
            <PostCard post={featuredPost} featured={true} />
          </section>
        ) : null}

        {/* Series Spotlight (Serialized novels) */}
        {seriesList.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
                  {t('series.title')}
                </h2>
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                  {t('series.subtitle')}
                </p>
              </div>
              <Link
                to="/series"
                className="text-xs sm:text-sm font-semibold text-[#D98E04] hover:underline flex items-center gap-1"
              >
                <span>{isUrdu ? 'تمام سلسلے' : 'View all'}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {seriesList.map((series) => {
                const sName = (isUrdu && series.nameUr) ? series.nameUr : series.nameEn;
                const sDesc = (isUrdu && series.descriptionUr) ? series.descriptionUr : series.descriptionEn;
                return (
                  <Link
                    key={series.id}
                    to={`/series/${series.id}`}
                    className="group relative overflow-hidden rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft shadow-soft-hover transition-all duration-300 p-5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-[#FAF7F2] dark:bg-[#0F1419]">
                        <img
                          src={series.coverImageUrl}
                          alt={sName}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#14213D]/90 text-white">
                            Serialized Novel
                          </span>
                        </div>
                      </div>

                      <h3 className={`text-xl font-semibold text-[#14213D] dark:text-[#FAF7F2] group-hover:text-[#D98E04] transition-colors ${
                        isUrdu && series.nameUr ? 'font-urdu' : 'font-serif-literary'
                      }`}>
                        {sName}
                      </h3>

                      <p className={`text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-2 leading-relaxed ${
                        isUrdu && series.descriptionUr ? 'font-urdu' : 'font-sans'
                      }`}>
                        {sDesc}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E8E2D9]/40 dark:border-[#2A3138] flex items-center justify-between text-xs font-medium text-[#D98E04]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{t('series.readEpisode')}</span>
                      </span>
                      <span>&rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Filter Pills & Latest Posts Grid */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#2A3138] pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
                {t('post.latest')}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                {isUrdu ? 'تازہ ترین مضامین، بلاگز اور ادبی سلسلہ وار کہانیاں' : 'Fresh perspectives, literary essays, and episodic chapters'}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#14213D] dark:bg-[#D98E04] text-white shadow-xs'
                      : 'bg-[#FAF7F2] dark:bg-[#1A2027] text-[#6B7280] dark:text-[#9CA3AF] border border-[#E8E2D9] dark:border-[#2A3138] hover:text-[#14213D] dark:hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid: 3 col desktop, 2 col tablet, 1 col mobile */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] p-8 space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-[#D98E04]/60" />
              <h3 className="text-lg font-medium text-[#14213D] dark:text-[#FAF7F2]">
                {t('post.empty')}
              </h3>
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto">
                {isUrdu ? 'جلد ہی اس زمرے میں نئی تحریریں شائع کی جائیں گی۔' : 'New literary works will be published soon in this category.'}
              </p>
            </div>
          )}

          {/* View all posts link */}
          <div className="text-center pt-4">
            <Link
              to="/posts"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#14213D]/20 dark:border-[#2A3138] text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#14213D] hover:text-white dark:hover:bg-[#D98E04] transition-all"
            >
              <span>{t('post.allPosts')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};
