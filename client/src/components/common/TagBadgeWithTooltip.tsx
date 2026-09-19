import React, { useState } from 'react';
import { getTagByCode } from '../../data/tagDefinitions';
import { Info } from 'lucide-react';

interface TagBadgeWithTooltipProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onOpenGlossary?: () => void;
}

export const TagBadgeWithTooltip: React.FC<TagBadgeWithTooltipProps> = ({
  code,
  size = 'md',
  showIcon = false,
  className = '',
  onOpenGlossary,
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tag = getTagByCode(code);

  if (!tag) {
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 ${className}`}>
        {code}
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded',
    md: 'text-xs px-2 py-0.5 rounded-md font-bold',
    lg: 'text-sm px-3 py-1 rounded-lg font-extrabold',
  };

  return (
    <div
      className="relative inline-flex items-center group cursor-help select-none"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onClick={onOpenGlossary}
    >
      <span
        className={`inline-flex items-center gap-1 shadow-xs transition-transform group-hover:scale-105 ${sizeClasses[size]} ${tag.badgeBg} ${tag.badgeText} ${
          tag.borderColor ? `border ${tag.borderColor}` : ''
        } ${className}`}
      >
        <span>{tag.code}</span>
        {showIcon && <Info className="w-3 h-3 opacity-80" />}
      </span>

      {/* Tooltip Card on Hover */}
      {isTooltipVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-3 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 text-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-100">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${tag.badgeBg} ${tag.badgeText}`}>
              {tag.code}
            </span>
            <span className="font-extrabold text-slate-900 truncate">{tag.label}</span>
          </div>
          <p className="font-semibold text-rose-600 mb-1">{tag.summary}</p>
          <p className="text-slate-500 text-[11px] leading-relaxed mb-1.5">{tag.description}</p>
          {tag.recommendation && (
            <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg font-medium border border-amber-200/60">
              💡 {tag.recommendation}
            </p>
          )}
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  );
};
