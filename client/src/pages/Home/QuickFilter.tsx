import React from 'react';
import { motion } from 'motion/react';
import { Film, Sparkles } from 'lucide-react';

interface QuickFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  showingType: 'now_showing' | 'upcoming';
  onSelectShowingType: (type: 'now_showing' | 'upcoming') => void;
}

export const QuickFilter: React.FC<QuickFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  showingType,
  onSelectShowingType,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80">
      {/* Showing / Upcoming Switcher with mechanical sliding pill */}
      <div className="relative flex items-center p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/60 shadow-inner">
        <button
          onClick={() => onSelectShowingType('now_showing')}
          className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
            showingType === 'now_showing' ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {showingType === 'now_showing' && (
            <motion.div
              layoutId="activeShowingPill"
              className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/80"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Film className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Đang Chiếu</span>
        </button>

        <button
          onClick={() => onSelectShowingType('upcoming')}
          className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
            showingType === 'upcoming' ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {showingType === 'upcoming' && (
            <motion.div
              layoutId="activeShowingPill"
              className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/80"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Sparkles className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Sắp Khởi Chiếu</span>
        </button>
      </div>

      {/* Genre Pills with Mechanical Sliding Indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectCategory(cat)}
              className={`relative px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'text-white shadow-md shadow-rose-600/30'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-rose-600 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
