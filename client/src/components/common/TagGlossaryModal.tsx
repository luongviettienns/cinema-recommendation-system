import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { TAG_DEFINITIONS } from '../../data/tagDefinitions';

interface TagGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'all' | 'age' | 'format' | 'language' | 'seat';
}

export const TagGlossaryModal: React.FC<TagGlossaryModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'age' | 'format' | 'language' | 'seat'>(initialCategory);

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'age', label: 'Độ tuổi' },
    { id: 'format', label: 'Công nghệ' },
    { id: 'language', label: 'Ngôn ngữ' },
    { id: 'seat', label: 'Hạng ghế' },
  ];

  const filteredTags = activeTab === 'all'
    ? TAG_DEFINITIONS
    : TAG_DEFINITIONS.filter((t) => t.category === activeTab);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ký Hiệu & Quy Định Rạp" maxWidth="lg">
      <div className="-mt-1">
        {/* Compact Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2.5 scrollbar-none border-b border-slate-100">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'all' 
              ? TAG_DEFINITIONS.length 
              : TAG_DEFINITIONS.filter((t) => t.category === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-rose-700/80 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact List Items */}
        <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
          {filteredTags.map((tag) => (
            <div
              key={tag.code}
              className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/90 rounded-xl transition-colors"
            >
              {/* Left: Badge + Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-9 h-7 flex items-center justify-center rounded-lg text-xs font-black shrink-0 shadow-2xs ${tag.badgeBg} ${tag.badgeText} ${
                  tag.borderColor ? `border ${tag.borderColor}` : ''
                }`}>
                  {tag.code}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900">{tag.label}</span>
                    <span className="text-[11px] font-bold text-rose-600 truncate">• {tag.summary}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate sm:whitespace-normal leading-tight mt-0.5">
                    {tag.description}
                  </p>
                </div>
              </div>

              {/* Right: Recommendation Tag */}
              {tag.recommendation && (
                <span className="shrink-0 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md hidden sm:inline-block">
                  {tag.recommendation}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Compact Footer */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 gap-2">
          <span className="truncate">* Xuất trình CCCD khi vào rạp đối với suất chiếu T13, T16, T18.</span>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};

