import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Moon, Sun, Shield, Menu, X, Globe, Feather } from 'lucide-react';
import { Logo } from './Logo';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { lang, toggleLang, isUrdu, t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.blogs'), path: '/posts?category=Blog' },
    { label: t('nav.articles'), path: '/posts?category=Article' },
    { label: t('nav.novels'), path: '/series' },
    { label: t('nav.about'), path: '/about' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname + location.search === path || (path.startsWith('/series') && location.pathname.startsWith('/series'));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF7F2]/90 dark:bg-[#0F1419]/90 border-b border-[#E8E2D9] dark:border-[#2A3138] transition-colors duration-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="flex items-center gap-2" aria-label="InkBridge Home">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? 'text-[#14213D] dark:text-[#FAF7F2] bg-[#E8E2D9]/60 dark:bg-[#1A2027] font-semibold'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14213D] dark:hover:text-[#FAF7F2] hover:bg-[#E8E2D9]/30 dark:hover:bg-[#1A2027]/50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Tools: Search, EN/UR pill, Dark toggle, Admin button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14213D] dark:hover:text-[#FAF7F2] hover:bg-[#E8E2D9]/40 dark:hover:bg-[#1A2027] transition-colors"
              aria-label="Search articles"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Language Toggle Pill */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border border-[#D98E04]/40 bg-[#F5D88F]/20 dark:bg-[#D98E04]/20 text-[#14213D] dark:text-[#FAF7F2] hover:bg-[#F5D88F]/40 dark:hover:bg-[#D98E04]/40 transition-all shadow-sm"
              title={isUrdu ? 'Switch to English' : 'اردو میں دیکھیں'}
            >
              <Globe className="w-3.5 h-3.5 text-[#D98E04]" />
              <span className={isUrdu ? 'font-urdu text-sm' : 'font-sans'}>
                {lang === 'en' ? 'اردو' : 'English'}
              </span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14213D] dark:hover:text-[#FAF7F2] hover:bg-[#E8E2D9]/40 dark:hover:bg-[#1A2027] transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-[#D98E04]" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin CMS Button */}
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#14213D] hover:bg-[#2D4A73] dark:bg-[#1A2027] dark:hover:bg-[#2A3138] text-white dark:text-[#FAF7F2] border border-transparent dark:border-[#2A3138] text-xs font-medium transition-all shadow-sm"
              title="Admin CMS"
            >
              <Shield className="w-3.5 h-3.5 text-[#D98E04]" />
              <span className="hidden sm:inline">{t('nav.admin')}</span>
              <span className="sm:hidden">Admin</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#14213D] dark:text-[#E5E7EB] hover:bg-[#E8E2D9]/40 dark:hover:bg-[#1A2027]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Quick Search Slideout Bar */}
        {searchOpen && (
          <div className="border-t border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2] dark:bg-[#0F1419] px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="max-w-[720px] mx-auto flex items-center gap-2">
              <Search className="w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('post.searchPlaceholder')}
                autoFocus
                className="w-full bg-transparent border-none text-sm text-[#1A1A1A] dark:text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-[#14213D] dark:bg-[#D98E04] text-white text-xs rounded font-medium hover:opacity-90"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8E2D9] dark:border-[#2A3138] bg-[#FAF7F2] dark:bg-[#1A2027] px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A1A1A] dark:text-[#E5E7EB] hover:bg-[#E8E2D9]/40 dark:hover:bg-[#2A3138]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
};
