import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'en' | 'ur';

interface LanguageContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  isUrdu: boolean;
  t: (key: string) => string;
}

const translations: Record<string, { en: string; ur: string }> = {
  // Navigation
  'nav.home': { en: 'Home', ur: 'صفحۂ اول' },
  'nav.blogs': { en: 'Blogs', ur: 'بلاگز' },
  'nav.articles': { en: 'Articles', ur: 'مضامین' },
  'nav.novels': { en: 'Novels', ur: 'ناولز' },
  'nav.about': { en: 'About', ur: 'تعارف' },
  'nav.admin': { en: 'Admin CMS', ur: 'ایڈمن' },

  // Hero & General
  'hero.tagline': { en: 'Two languages. One story.', ur: 'دو زبانیں — ایک کہانی' },
  'hero.subheadline': {
    en: 'A sanctuary for serialized novels, essays, and stories in English and authentic Urdu Nastaliq.',
    ur: 'انگریزی اور نستعلیق اردو میں سلسلہ وار ناولز، مضامین اور شاہکار کہانیوں کا پروقار مسکن۔'
  },
  'hero.startReading': { en: 'Start Reading', ur: 'مطالعہ شروع کریں' },
  'hero.exploreNovels': { en: 'Explore Novels', ur: 'ناولز دریافت کریں' },

  // Categories
  'cat.all': { en: 'All Posts', ur: 'تمام تحریریں' },
  'cat.blog': { en: 'Blogs', ur: 'بلاگز' },
  'cat.article': { en: 'Articles', ur: 'مضامین' },
  'cat.novel': { en: 'Novel Episodes', ur: 'ناول اقساط' },

  // Post Card & Listing
  'post.minRead': { en: 'min read', ur: 'منٹ مطالعہ' },
  'post.readMore': { en: 'Read Story', ur: 'مکمل پڑھیں' },
  'post.latest': { en: 'Latest Literary Works', ur: 'تازہ ترین تخلیقات' },
  'post.featured': { en: 'Featured Story', ur: 'خاص پیشکش' },
  'post.empty': { en: 'No posts yet. Check back soon.', ur: 'ابھی کوئی تحریر موجود نہیں۔ جلد تشریف لائیں۔' },
  'post.searchPlaceholder': { en: 'Search by title, topic, or keyword...', ur: 'عنوان یا موضوع سے تلاش کریں...' },
  'post.filterCategory': { en: 'Category', ur: 'زمرہ' },
  'post.sort': { en: 'Sort', ur: 'ترتیب' },
  'post.newest': { en: 'Newest First', ur: 'تازہ ترین' },
  'post.oldest': { en: 'Oldest First', ur: 'قدیم ترین' },
  'post.share': { en: 'Share', ur: 'شیئر کریں' },
  'post.copied': { en: 'Link copied to clipboard!', ur: 'لنک کاپی ہو گیا!' },
  'post.related': { en: 'Related Stories', ur: 'اسی سلسلے کی کہانیاں' },
  'post.backToTop': { en: 'Back to top', ur: 'اوپر جائیں' },
  'post.allPosts': { en: 'All Literature & Stories', ur: 'تمام کہانیاں اور مضامین' },

  // Series
  'series.title': { en: 'Serialized Novels', ur: 'سلسلہ وار ناولز' },
  'series.subtitle': { en: 'Follow serialized journeys chapter by chapter.', ur: 'قسط وار کہانیاں جو سحر طاری کر دیں۔' },
  'series.episodes': { en: 'Episodes', ur: 'اقساط' },
  'series.readEpisode': { en: 'Read Episode', ur: 'قسط پڑھیں' },
  'series.backToSeries': { en: 'Back to all series', ur: 'تمام ناولز کی طرف' },

  // Footer
  'footer.desc': {
    en: 'InkBridge is an independent bilingual publishing imprint bridging English and Urdu literature.',
    ur: 'انک برج انگریزی اور اردو ادبی دنیاؤں کو جوڑنے والا ایک پروقار اور آزاد اشاعتی پلیٹ فارم ہے۔'
  },
  'footer.rights': { en: 'All rights reserved.', ur: 'جملہ حقوق محفوظ ہیں۔' },

  // About
  'about.title': { en: 'About InkBridge', ur: 'انک برج کا تعارف' },
  'about.mission': { en: 'Our Vision & Craft', ur: 'ہمارا مشن اور ادارتی منشور' }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  isUrdu: false,
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('inkbridge_lang');
    return saved === 'ur' ? 'ur' : 'en';
  });

  const setLang = (newLang: AppLanguage) => {
    setLangState(newLang);
    localStorage.setItem('inkbridge_lang', newLang);
  };

  const toggleLang = () => {
    const next = lang === 'en' ? 'ur' : 'en';
    setLang(next);
  };

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return lang === 'ur' ? item.ur : item.en;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isUrdu: lang === 'ur', t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
