import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, BookOpen, Layers } from 'lucide-react';
import { Post } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, featured = false }) => {
  const { lang, isUrdu, t } = useLanguage();

  // Determine display language for this card
  // If post has urdu and user preferred urdu, or if post is urdu only
  const displayTitle = (isUrdu && post.titleUr) || !post.titleEn ? (post.titleUr || post.titleEn) : post.titleEn;
  const displayExcerpt = (isUrdu && post.excerptUr) || !post.excerptEn ? (post.excerptUr || post.excerptEn) : post.excerptEn;
  const isPostUrdu = (isUrdu && !!post.titleUr) || post.language === 'ur';

  // Format date safely
  const formattedDate = (() => {
    try {
      if (post.createdAt?.toDate) {
        return format(post.createdAt.toDate(), 'MMMM d, yyyy');
      }
      if (post.createdAt) {
        return format(new Date(post.createdAt), 'MMMM d, yyyy');
      }
      return 'Recently';
    } catch {
      return 'Recently';
    }
  })();

  const languageLabel = {
    en: 'EN',
    ur: 'اردو',
    both: 'EN + اردو',
  }[post.language] || 'EN';

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft shadow-soft-hover transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Cover image (16:9 on mobile, side on desktop) */}
          <div className="lg:col-span-7 relative aspect-[16/9] lg:aspect-auto overflow-hidden bg-[#FAF7F2] dark:bg-[#0F1419]">
            <img
              src={post.coverImageUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'}
              alt={displayTitle}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D98E04] text-white shadow-sm">
                {t('post.featured')}
              </span>
            </div>
          </div>

          {/* Content side */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Badges: Category & Language */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5D88F]/50 dark:bg-[#4A3510] text-[#14213D] dark:text-[#F5D88F]">
                  {post.category}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border border-[#E8E2D9] dark:border-[#2A3138] text-[#6B7280] dark:text-[#9CA3AF]">
                  {languageLabel}
                </span>
                {post.category === 'Novel Episode' && post.episodeNumber && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#14213D] text-white">
                    Ep {post.episodeNumber}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-2xl sm:text-3xl font-semibold text-[#14213D] dark:text-[#FAF7F2] group-hover:text-[#D98E04] transition-colors leading-snug line-clamp-2 ${
                isPostUrdu ? 'font-urdu leading-relaxed' : 'font-serif-literary'
              }`}>
                <Link to={`/post/${post.slug}`}>
                  {displayTitle}
                </Link>
              </h3>

              {/* Excerpt */}
              <p className={`text-[#6B7280] dark:text-[#9CA3AF] text-sm sm:text-base line-clamp-3 leading-relaxed ${
                isPostUrdu ? 'font-urdu leading-loose text-base' : 'font-sans'
              }`}>
                {displayExcerpt}
              </p>
            </div>

            {/* Meta Row & Action */}
            <div className="pt-6 mt-6 border-t border-[#E8E2D9]/60 dark:border-[#2A3138] flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              <div className="flex items-center gap-4">
                <span>{formattedDate}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readingTimeMinutes || 3} {t('post.minRead')}
                </span>
              </div>
              <Link
                to={`/post/${post.slug}`}
                className="font-semibold text-[#14213D] dark:text-[#FAF7F2] group-hover:text-[#D98E04] flex items-center gap-1 transition-colors"
              >
                <span>{t('post.readMore')}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

          </div>
        </div>
      </article>
    );
  }

  // Standard Grid Card (3 col desktop, 2 col tablet, 1 col mobile)
  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft shadow-soft-hover transition-all duration-300">
      <div>
        {/* 16:9 Cover Image */}
        <Link to={`/post/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-[#FAF7F2] dark:bg-[#0F1419]">
          <img
            src={post.coverImageUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80'}
            alt={displayTitle}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Category & Language overlay pills */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FAF7F2]/95 dark:bg-[#1A2027]/95 text-[#14213D] dark:text-[#FAF7F2] shadow-sm">
              {post.category}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D98E04] text-white shadow-sm">
              {languageLabel}
            </span>
          </div>
        </Link>

        {/* Card Body */}
        <div className="p-5 space-y-2.5">
          {post.category === 'Novel Episode' && post.episodeNumber && (
            <div className="text-[11px] font-semibold tracking-wider text-[#D98E04] uppercase flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Episode {post.episodeNumber}</span>
            </div>
          )}

          <h3 className={`text-lg font-semibold text-[#14213D] dark:text-[#FAF7F2] group-hover:text-[#D98E04] transition-colors line-clamp-2 leading-snug ${
            isPostUrdu ? 'font-urdu leading-relaxed text-xl' : 'font-serif-literary'
          }`}>
            <Link to={`/post/${post.slug}`}>
              {displayTitle}
            </Link>
          </h3>

          <p className={`text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] line-clamp-3 leading-relaxed ${
            isPostUrdu ? 'font-urdu leading-loose' : 'font-sans'
          }`}>
            {displayExcerpt}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-[#E8E2D9]/40 dark:border-[#2A3138] flex items-center justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF]">
        <span>{formattedDate}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {post.readingTimeMinutes || 3} {t('post.minRead')}
        </span>
      </div>
    </article>
  );
};
