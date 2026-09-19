import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds = 420, // 7 phút (chuẩn ngành rạp chiếu CGV/Lotte/BHD)
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isCritical = secondsLeft < 60; // Dưới 1 phút
  const isUrgent = secondsLeft < 120; // Dưới 2 phút

  return (
    <motion.div
      animate={
        isCritical
          ? {
              x: [-2, 2, -2, 2, 0],
              transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 },
            }
          : {}
      }
      className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-300 shadow-xs select-none ${
        isCritical
          ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-rose-200/50'
          : isUrgent
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      {isCritical || isUrgent ? (
        <AlertTriangle
          className={`w-5 h-5 shrink-0 ${isCritical ? 'text-rose-600 animate-bounce' : 'text-amber-600'}`}
        />
      ) : (
        <Clock className="w-5 h-5 text-slate-500 shrink-0" />
      )}
      <div className="text-xs">
        <span className="font-semibold">Thời gian giữ ghế còn lại: </span>
        <span
          className={`font-black text-sm tracking-wider tabular-nums ${
            isCritical ? 'text-rose-700' : isUrgent ? 'text-amber-700' : 'text-slate-900'
          }`}
        >
          {formattedTime}
        </span>
      </div>
    </motion.div>
  );
};
