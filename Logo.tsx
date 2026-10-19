import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showTagline = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* Quill stroke curving into a bridge arch */}
      <svg
        className={`${iconSizes[size]} text-[#14213D] dark:text-[#F5D88F] transition-transform duration-300 group-hover:scale-105`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Bridge river reflection */}
        <path
          d="M6 34C14 34 16 35 24 35C32 35 34 34 38 34"
          stroke="#D98E04"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 4"
          opacity="0.7"
        />
        {/* Main bridge arch transitioning from quill feather */}
        <path
          d="M5 29C8 29 11 20 20 18C29 16 33 24 37 29"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Quill nib curving down from the arch apex */}
        <path
          d="M20 6C20 6 25 10 24 18C23.5 22 20 28 20 28"
          stroke="#D98E04"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Fine quill split */}
        <path
          d="M20 28L20 31"
          stroke="#D98E04"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Small ink droplet */}
        <circle cx="20" cy="33.5" r="1.2" fill="#D98E04" />
      </svg>

      <div className="flex flex-col">
        <span className={`font-serif-literary font-medium tracking-tight text-[#14213D] dark:text-[#E5E7EB] ${textSizes[size]}`}>
          Ink<span className="font-serif-literary italic font-semibold text-[#D98E04]">Bridge</span>
        </span>
        {showTagline && (
          <span className="text-[10px] tracking-widest uppercase text-[#6B7280] dark:text-[#9CA3AF] -mt-1 font-sans">
            Two languages. One story.
          </span>
        )}
      </div>
    </div>
  );
};
