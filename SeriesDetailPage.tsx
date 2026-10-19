import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Series, Post } from '../types';
import { INITIAL_SERIES, INITIAL_POSTS } from '../data/initialContent';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Clock, BookOpen, Layers, ArrowRight } from 'lucide-react';

export const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isUrdu, t } = useLanguage();

  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchSeriesAndEpisodes = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const seriesDoc = await getDoc(doc(db, 'series', id));
        if (seriesDoc.exists()) {
          setSeries({ id: seriesDoc.id, ...seriesDoc.data() } as Series);

          // Fetch episodes belonging to this series
          const postsRef = collection(db, 'posts');
          const postsSnap = await getDocs(postsRef);
          
          const seriesPosts: Post[] = postsSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Post))
            .filter(p => p.seriesId === id && p.status === 'published')
            .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));

          setEpisodes(seriesPosts);
        } else if (id === INITIAL_SERIES.id || id === 'the-bridge') {
          setSeries(INITIAL_SERIES);
          setEpisodes(INITIAL_POSTS.filter(p => p.seriesId === INITIAL_SERIES.id || p.category === 'Novel Episode'));
        } else {
          setSeries(null);
        }
      } catch (err) {
        console.warn('Error fetching series detail from Firestore, using fallback:', err);
        if (id === INITIAL_SERIES.id || id === 'the-bridge' || id?.includes('bridge')) {
          setSeries(INITIAL_SERIES);
          setEpisodes(INITIAL_POSTS.filter(p => p.seriesId === INITIAL_SERIES.id || p.category === 'Novel Episode'));
        } else {
          setSeries(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSeriesAndEpisodes();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-12 space-y-6">
        <div className="h-4 w-32 bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
        <div className="h-10 w-3/4 bg-[#E8E2D9] dark:bg-[#2A3138] rounded animate-pulse" />
        <div className="h-48 w-full bg-[#E8E2D9] dark:bg-[#2A3138] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-20 text-center space-y-4">
        <Layers className="w-12 h-12 mx-auto text-[#D98E04]" />
        <h2 className="text-2xl font-serif-literary font-semibold text-[#14213D] dark:text-[#FAF7F2]">
          Series Not Found
        </h2>
        <Link
          to="/series"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14213D] text-white text-xs font-semibold hover:bg-[#2D4A73]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('series.backToSeries')}</span>
        </Link>
      </div>
    );
  }

  const sName = isUrdu && series.nameUr ? series.nameUr : series.nameEn;
  const sDesc = isUrdu && series.descriptionUr ? series.descriptionUr : series.descriptionEn;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10">
      
      {/* Back button */}
      <div>
        <Link
          to="/series"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14213D] dark:hover:text-[#FAF7F2] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{t('series.backToSeries')}</span>
        </Link>
      </div>

      {/* Series Hero Header */}
      <div className="space-y-6">
        <div className="aspect-[16/9] rounded-[12px] overflow-hidden bg-[#FAF7F2] dark:bg-[#0F1419] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft">
          <img
            src={series.coverImageUrl}
            alt={sName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#14213D] text-white">
              Serialized Novel
            </span>
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              {episodes.length} {t('series.episodes')} available
            </span>
          </div>

          <h1 className={`text-3xl sm:text-4xl font-semibold text-[#14213D] dark:text-[#FAF7F2] ${
            isUrdu && series.nameUr ? 'font-urdu' : 'font-serif-literary'
          }`}>
            {sName}
          </h1>

          <p className={`text-base text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed ${
            isUrdu && series.descriptionUr ? 'font-urdu leading-loose' : 'font-sans'
          }`}>
            {sDesc}
          </p>
        </div>
      </div>

      {/* Episode List (Episode 1, Episode 2, Episode 3...) */}
      <div className="space-y-4 pt-6 border-t border-[#E8E2D9] dark:border-[#2A3138]">
        <h2 className="text-xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
          Chronological Episodes
        </h2>

        {episodes.length > 0 ? (
          <div className="divide-y divide-[#E8E2D9] dark:divide-[#2A3138] border border-[#E8E2D9] dark:border-[#2A3138] rounded-[12px] bg-white dark:bg-[#1A2027] overflow-hidden shadow-soft">
            {episodes.map((ep, idx) => {
              const epTitle = isUrdu && ep.titleUr ? ep.titleUr : ep.titleEn;
              const epExcerpt = isUrdu && ep.excerptUr ? ep.excerptUr : ep.excerptEn;
              const epDate = ep.createdAt?.toDate ? format(ep.createdAt.toDate(), 'MMM d, yyyy') : 'Recent';

              return (
                <Link
                  key={ep.id}
                  to={`/post/${ep.slug}`}
                  className="group p-5 flex items-start justify-between gap-4 hover:bg-[#FAF7F2] dark:hover:bg-[#0F1419] transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#D98E04]/20 text-[#D98E04]">
                        Episode {ep.episodeNumber || idx + 1}
                      </span>
                      <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                        {epDate}
                      </span>
                      <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ep.readingTimeMinutes || 3} min
                      </span>
                    </div>

                    <h3 className={`text-lg font-semibold text-[#14213D] dark:text-[#FAF7F2] group-hover:text-[#D98E04] transition-colors ${
                      isUrdu && ep.titleUr ? 'font-urdu' : 'font-serif-literary'
                    }`}>
                      {epTitle}
                    </h3>

                    {epExcerpt && (
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-2">
                        {epExcerpt}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 text-[#D98E04] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white dark:bg-[#1A2027] rounded-[12px] border border-[#E8E2D9] dark:border-[#2A3138]">
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              Episodes are being prepared and will be released shortly.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
