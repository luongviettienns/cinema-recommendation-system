import React from 'react';
import { Volume2 } from 'lucide-react';

interface CurvedScreenProps {
  roomName?: string;
  format?: '2D' | '3D' | 'IMAX';
  selectedSeatsCount?: number;
  selectedSeatNames?: string[];
}

export const CurvedScreen: React.FC<CurvedScreenProps> = ({
  roomName = 'Phòng Chiếu 01',
  format = '2D',
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto my-6 select-none">
      {/* 3D Curved Screen Stage Container */}
      <div className="relative flex flex-col items-center">
        {/* Top Ceiling & Lighting Ambient Glow */}
        <div className="w-full max-w-xl h-2 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent blur-md rounded-full mb-1" />

        {/* 3D Curved Cinema Screen SVG */}
        <div className="relative w-full max-w-2xl px-4 filter drop-shadow-md">
          <svg
            viewBox="0 0 800 130"
            className="w-full h-auto overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Screen Surface Gradient */}
              <linearGradient id="screenSurface" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>

              {/* Neon Laser Glow on Screen Edge */}
              <linearGradient id="neonLaser" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                <stop offset="25%" stopColor="#e11d48" stopOpacity="1" />
                <stop offset="50%" stopColor="#fb7185" stopOpacity="1" />
                <stop offset="75%" stopColor="#e11d48" stopOpacity="1" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
              </linearGradient>

              {/* Laser Underlight glow */}
              <filter id="neonFilter" x="-10%" y="-40%" width="120%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Projector Ambient Beam Gradient */}
              <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.14" />
                <stop offset="35%" stopColor="#e11d48" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Trapezoidal Volumetric Projector Beam (Tia sáng chiếu hình nón 3D) */}
            <polygon
              points="140,55 660,55 760,130 40,130"
              fill="url(#beamGradient)"
              className="pointer-events-none"
            />

            {/* Left & Right Perspective Sightline Rays */}
            <line x1="140" y1="55" x2="40" y2="130" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            <line x1="660" y1="55" x2="760" y2="130" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

            {/* Screen 3D Arch Body (Màn hình cong vòm quang học) */}
            <path
              d="M 40 60 Q 400 12 760 60 L 760 76 Q 400 28 40 76 Z"
              fill="url(#screenSurface)"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {/* Neon Glowing Edge along the top curve */}
            <path
              d="M 40 60 Q 400 12 760 60"
              fill="none"
              stroke="url(#neonLaser)"
              strokeWidth="4"
              filter="url(#neonFilter)"
              strokeLinecap="round"
            />

            {/* Bottom screen reflective lip */}
            <path
              d="M 40 76 Q 400 28 760 76"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Center Crosshair Point (Tâm nhìn chính diện màn hình) */}
            <circle cx="400" cy="44" r="3.5" fill="#e11d48" />
            <line x1="400" y1="36" x2="400" y2="52" stroke="#e11d48" strokeWidth="1" opacity="0.6" />
            <line x1="392" y1="44" x2="408" y2="44" stroke="#e11d48" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>

        {/* Sound & Orientation Guideline Bar */}
        <div className="w-full max-w-2xl px-6 mt-1 flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-slate-200/60 pb-3">
          <span className="flex items-center gap-1 text-slate-500">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Loa Vòm Trái (L)</span>
          </span>

          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
            {roomName} • {format}
          </span>

          <span className="flex items-center gap-1 text-slate-500">
            <span>Loa Vòm Phải (R)</span>
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          </span>
        </div>
      </div>
    </div>
  );
};
