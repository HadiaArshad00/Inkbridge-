import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { ArrowLeft, BookX } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-[#1A2027] p-8 rounded-[16px] border border-[#E8E2D9] dark:border-[#2A3138] shadow-soft">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <div className="inline-flex p-4 rounded-full bg-[#D98E04]/10 text-[#D98E04]">
          <BookX className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-serif-literary font-semibold text-[#14213D] dark:text-[#FAF7F2]">
            404
          </h1>
          <h2 className="text-lg font-serif-literary font-medium text-[#14213D] dark:text-[#FAF7F2]">
            Lost Chapter
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
            The literary page you are seeking does not exist or has been shifted in the archives.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#14213D] text-white text-xs font-semibold hover:bg-[#2D4A73] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>Return to InkBridge Library</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
