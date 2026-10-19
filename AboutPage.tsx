import React from 'react';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { Feather, BookOpen, Compass, Heart, Globe, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { isUrdu, t } = useLanguage();

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
      
      {/* Brand Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#D98E04]/10 mb-2">
          <Feather className="w-8 h-8 text-[#D98E04]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
          {t('about.title')}
        </h1>
        <p className="text-base sm:text-lg text-[#6B7280] dark:text-[#9CA3AF] max-w-xl mx-auto italic font-serif-literary">
          “Two languages. One story.”
        </p>
      </div>

      {/* Literary Manifesto */}
      <div className="bg-white dark:bg-[#1A2027] rounded-[12px] p-6 sm:p-10 border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-6 text-sm sm:text-base text-[#1A1A1A] dark:text-[#E5E7EB] leading-relaxed">
        <h2 className="text-2xl font-semibold font-serif-literary text-[#14213D] dark:text-[#FAF7F2]">
          {isUrdu ? 'ہمارا منشور اور مقصد' : 'The InkBridge Manifesto'}
        </h2>
        
        <p>
          {isUrdu ? (
            <span className="font-urdu leading-loose text-lg">
              انک برج کا قیام ادب اور کہانی کی دنیا میں ایک خوبصورت پل تعمیر کرنے کے لیے عمل میں آیا ہے۔ صدیوں سے انگریزی اور اردو زبانوں نے انسانی شعور کو بیدار کیا ہے، مگر انٹرنیٹ کی تیز رفتار دنیا میں سنجیدہ ادب، سلسلہ وار ناولز اور خوبصورت نستعلیق رسم الخط کا ایک باوقار سنگم کم ہی دکھائی دیتا تھا۔
            </span>
          ) : (
            'InkBridge is conceived not merely as a blogging engine, but as an independent digital publishing imprint. In an era dominated by transient snippets, we seek to restore the slow, deliberate pleasure of longform literature, serialized chapters, and philosophical essays.'
          )}
        </p>

        <p>
          {isUrdu ? (
            <span className="font-urdu leading-loose text-lg">
              ہمارا مقصد مصنفین اور قارئین کو ایک ایسا پرسکون ماحول فراہم کرنا ہے جہاں اردو نستعلیق رسم الخط اپنی پوری دلکشی اور وقار کے ساتھ چمک اٹھے، اور انگریزی کی جدید اصناف کے ساتھ ہم آہنگ ہو سکے۔
            </span>
          ) : (
            'By offering equal reverence to English typography and Urdu Nastaliq script, InkBridge enables cross-cultural narratives to flourish. A reader may begin an episode in English, appreciate its Urdu resonance, or engage with both scripts in unified harmony.'
          )}
        </p>

        <div className="border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#D98E04] pl-4 rtl:pl-0 rtl:pr-4 py-2 italic text-[#14213D] dark:text-[#F5D88F] font-serif-literary">
          {isUrdu 
            ? 'الفاظ محض سیاہی کے قطرے نہیں ہوتے؛ یہ وہ محرابیں ہیں جو ایک روح کو دوسری روح سے جوڑتی ہیں۔'
            : 'Words are not mere marks on parchment; they are the arches by which minds commune across distances and generations.'}
        </div>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-2">
          <BookOpen className="w-5 h-5 text-[#D98E04]" />
          <h3 className="font-semibold text-base text-[#14213D] dark:text-[#FAF7F2] font-serif-literary">
            Serialized Novels
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            Chapter-by-chapter episodic fiction published with dedicated reading progress tracking and chronological order.
          </p>
        </div>

        <div className="p-6 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-2">
          <Globe className="w-5 h-5 text-[#D98E04]" />
          <h3 className="font-semibold text-base text-[#14213D] dark:text-[#FAF7F2] font-serif-literary">
            Authentic Nastaliq
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            Engineered with generous line heights and Noto Nastaliq Urdu to guarantee ascenders and descenders never clip.
          </p>
        </div>

        <div className="p-6 rounded-[12px] bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft space-y-2">
          <Sparkles className="w-5 h-5 text-[#D98E04]" />
          <h3 className="font-semibold text-base text-[#14213D] dark:text-[#FAF7F2] font-serif-literary">
            Curated Editorial
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            A quiet sanctuary free from intrusive trackers or ad clutter, centered entirely on the written word.
          </p>
        </div>
      </div>

    </div>
  );
};
