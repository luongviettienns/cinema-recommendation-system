import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Ticket } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

interface FloatingSummaryBarProps {
  selectedSeatNumbers: string[];
  totalPrice: number;
  onProceed: () => void;
  isLoading?: boolean;
}

export const FloatingSummaryBar: React.FC<FloatingSummaryBarProps> = ({
  selectedSeatNumbers,
  totalPrice,
  onProceed,
  isLoading = false,
}) => {
  const hasSelectedSeats = selectedSeatNumbers.length > 0;

  return (
    <AnimatePresence>
      {hasSelectedSeats && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl py-3.5 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Seats Selected Info */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ghế Đang Chọn ({selectedSeatNumbers.length})
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 tracking-tight">
                    {selectedSeatNumbers.join(', ')}
                  </p>
                </div>
              </div>

              <div className="sm:hidden text-right">
                <p className="text-xs text-slate-400 font-medium">Tạm tính</p>
                <p className="text-base font-extrabold text-rose-600">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
            </div>

            {/* Total Price & CTA Button */}
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tổng tiền tạm tính
                </p>
                <p className="text-xl font-extrabold text-rose-600 tracking-tight">
                  {formatCurrency(totalPrice)}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                isLoading={isLoading}
                onClick={onProceed}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Tiếp Tục Thanh Toán
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
