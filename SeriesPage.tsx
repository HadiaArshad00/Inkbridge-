import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Series, Post } from '../types';
import { INITIAL_SERIES } from '../data/initialContent';
import { useLanguage } from '../context/LanguageContext';
import { Layers, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonCard';

export const SeriesPage: React.FC = () => {
  const { isUrdu, t } = useLanguage();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [episodeCounts, setEpisodeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeriesAndEpisodes = async () => {
      setLoading(true);
      try {
        const seriesSnap = await getDocs(collection(db, 'series'));
        const list: Series[] = seriesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Series));

        // Get count of episodes per series
        const postsSnap = await getDocs(query(collection(db, 'posts'), where('category', '==', 'Novel Episode')));
        const counts: Record<string, number> = {};
        postsSnap.docs.forEach(d => {
          const sId = d.data()?.seriesId;
          if (sId) {
            counts[sId] = (counts[sId] || 0) + 1;
          }
        });

        if (list.length > 0) {
          setSeriesList(list);
          setEpisodeCounts(counts);
        } else {
          setSeriesList([INITIAL_SERIES]);
          setEpisodeCounts({ [INITIAL_SERIES.id]: 1 });
        }
      } catch (err) {
        console.warn('Using initial series fallback:', err);
        setSeriesList([INITIAL_SERIES]);
        setEpisodeCounts({ [INITIAL_SERIES.id]: 1 });
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesAndEpisodes();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      
      {/* Header */}
      <div className="border-b border-[#E8E2D9] dark:border-[#2A3138] pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5D88F]/40 dark:bg-[#4A3510] text-[#14213D] dark:text-[#F5D88F] mb-3">
          <Layers className="w-3.5 h-3.5 text-[#D98E04]" />
          <span>Anthologies & Serialized Fiction</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
          {t('series.title')}
        </h1>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1.5 max-w-2xl">
          {t('series.subtitle')}
        </p>
      </div>

      {/* Series Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : seriesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {seriesList.map((series) => {
            const count = episodeCounts[series.id] || 0;
            const displayName = isUrdu && series.nameUr ? series.nameUr : series.nameEn;
            const displayDesc = isUrdu && series.descriptionUr ? series.descriptionUr : series.descriptionEn;
            const isUrduTitle = isUrdu && !!series.nameUr;

            return (
              <article
                key={series.id}
                className="group flex flex-col justify-between overflow-hidden rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft shadow-soft-hover transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF7F2] dark:bg-[#0F1419]">
                    <img
                      src={series.coverImageUrl || 'https://images.unsplash.com/photo-1545659328-941c42f06797?auto=format&fit=crop&w=800&q=80'}
                      alt={displayName}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#14213D]/90 text-white shadow-sm flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#D98E04]" />
                        <span>{count} {t('series.episodes')}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h2 className={`text-2xl font-semibold text-[#14213D] dark:text-[#FAF7F2] group-hover:text-[#D98E04] transition-colors leading-snug ${
                      isUrduTitle ? 'font-urdu' : 'font-serif-literary'
                    }`}>
                      <Link to={`/series/${series.id}`}>
                        {displayName}
                      </Link>
                    </h2>

                    <p className={`text-sm text-[#6B7280] dark:text-[#9CA3AF] line-clamp-3 leading-relaxed ${
                      isUrdu && series.descriptionUr ? 'font-urdu leading-loose' : 'font-sans'
                    }`}>
                      {displayDesc}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    to={`/series/${series.id}`}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#FAF7F2] dark:bg-[#0F1419] hover:bg-[#14213D] hover:text-white dark:hover:bg-[#D98E04] border border-[#E8E2D9] dark:border-[#2A3138] text-xs font-semibold text-[#14213D] dark:text-[#FAF7F2] flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Read Episodes</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138] p-8 space-y-4">
          <Layers className="w-12 h-12 mx-auto text-[#D98E04]/60" />
          <h3 className="text-lg font-medium text-[#14213D] dark:text-[#FAF7F2]">
            No serialized novels created yet
          </h3>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto">
            Novel series will appear here once published from the Admin CMS.
          </p>
        </div>
      )}

    </div>
  );
};
