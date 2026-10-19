import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useLanguage } from '../context/LanguageContext';
import { Feather, BookOpen, Heart, Globe, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { isUrdu, t } = useLanguage();

  return (
    <footer className="w-full bg-[#FAF7F2] dark:bg-[#0F1419] border-t border-[#E8E2D9] dark:border-[#2A3138] mt-20 transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" showTagline={true} />
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-sm leading-relaxed">
              {t('footer.desc')}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D98E04] font-medium pt-2">
              <Sparkles className="w-4 h-4" />
              <span>English & Urdu Nastaliq Editorial Platform</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14213D] dark:text-[#FAF7F2] mb-3">
              {isUrdu ? 'براہ راست روابط' : 'Explore'}
            </h4>
            <ul className="space-y-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              <li>
                <Link to="/" className="hover:text-[#14213D] dark:hover:text-white transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/posts?category=Blog" className="hover:text-[#14213D] dark:hover:text-white transition-colors">
                  {t('nav.blogs')}
                </Link>
              </li>
              <li>
                <Link to="/posts?category=Article" className="hover:text-[#14213D] dark:hover:text-white transition-colors">
                  {t('nav.articles')}
                </Link>
              </li>
              <li>
                <Link to="/series" className="hover:text-[#14213D] dark:hover:text-white transition-colors">
                  {t('nav.novels')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#14213D] dark:hover:text-white transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Literary Publishing Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14213D] dark:text-[#FAF7F2] mb-3">
              {isUrdu ? 'انتظامیہ' : 'Editorial & Admin'}
            </h4>
            <ul className="space-y-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              <li>
                <Link to="/admin" className="hover:text-[#D98E04] transition-colors flex items-center gap-1.5">
                  <Feather className="w-3.5 h-3.5 text-[#D98E04]" />
                  <span>Admin CMS</span>
                </Link>
              </li>
              <li>
                <a href="#feed" onClick={(e) => { e.preventDefault(); alert("InkBridge RSS & Atom feeds will be syndicated on next release."); }} className="hover:text-[#14213D] dark:hover:text-white transition-colors">
                  RSS Feed
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#14213D] dark:hover:text-white transition-colors">
                  Typography Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 pt-6 border-t border-[#E8E2D9] dark:border-[#2A3138] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          <p>© 2026 InkBridge. {t('footer.rights')}</p>
          <div className="flex items-center gap-1">
            <span>Crafted for lovers of literature in both scripts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
