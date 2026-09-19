import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Ticket, Sparkles } from 'lucide-react';
import { IMovie } from '../../types/movie';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// Helper for Vietnamese age rating color coding
const getAgeRatingBadge = (rating: string) => {
  switch (rating) {
    case 'P':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-500 text-white shadow-xs">P</span>;
    case 'K':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-teal-500 text-white shadow-xs">K</span>;
    case 'C13':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-500 text-slate-950 shadow-xs">C13</span>;
    case 'C16':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-orange-500 text-white shadow-xs">C16</span>;
    case 'C18':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-600 text-white shadow-xs">C18</span>;
    default:
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-slate-700 text-white shadow-xs">{rating}</span>;
  }
};

export const MovieCard: React.FC<{ movie: IMovie }> = ({ movie }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
      }}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-2xl ambient-cinema-glow-hover flex flex-col h-full preserve-3d"
    >
      {/* Poster Image Container */}
      <Link to={`/movie/${movie.id}`} className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100 block">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Cinematic gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <span className="text-white text-xs font-bold flex items-center gap-1.5 mb-1 text-rose-300">
              <Sparkles className="w-3.5 h-3.5" />
              Chi Tiết & Suất Chiếu
            </span>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {movie.description}
            </p>
          </div>
        </div>

        {/* Badges on Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {getAgeRatingBadge(movie.ageRating)}
          {movie.formats.slice(0, 1).map((fmt) => (
            <Badge key={fmt} variant="secondary" size="sm" className="shadow-xs font-bold bg-white/90 text-slate-800 backdrop-blur-md">
              {fmt}
            </Badge>
          ))}
        </div>

        {/* Rating on Top Right */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 px-2 py-1 rounded-xl shadow-sm flex items-center gap-1 text-xs font-black z-10 border border-slate-100">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{movie.rating}</span>
        </div>
      </Link>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Genre */}
          <p className="text-xs font-semibold text-rose-600 mb-1.5 line-clamp-1 tracking-wide">
            {movie.genre.map((g) => g.replace(/^Phim\s+/i, '')).join(' • ')}
          </p>

          {/* Title */}
          <Link to={`/movie/${movie.id}`}>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight line-clamp-1 group-hover:text-rose-600 transition-colors mb-2">
              {movie.title}
            </h3>
          </Link>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{movie.duration} phút</span>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/movie/${movie.id}`} className="w-full">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center text-xs font-extrabold py-2.5 rounded-xl transition-all group-hover:shadow-md group-hover:shadow-rose-600/30"
            leftIcon={<Ticket className="w-4 h-4" />}
          >
            {movie.isNowShowing ? 'Đặt Vé Ngay' : 'Xem Chi Tiết'}
          </Button>
        </Link>
      </div>
    </div>
  );
};
