import React, { useState, useEffect, useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Ticket, ChevronLeft, ChevronRight, Star, Sparkles, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMovie } from '../../types/movie';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const HeroBanner: React.FC<{ movies: IMovie[] }> = ({ movies }) => {
  const hotMovies = movies.filter((m) => m.isHot);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [trailerMovie, setTrailerMovie] = useState<IMovie | null>(null);
  const [progressKey, setProgressKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Tilt state for 3D poster effect
  const [posterTilt, setPosterTilt] = useState({ x: 0, y: 0 });

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [autoplayPlugin.current]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIdx = emblaApi.selectedScrollSnap();
    setSelectedIndex(newIdx);
    setProgressKey((prev) => prev + 1);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Handle poster 3D mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    setPosterTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setPosterTilt({ x: 0, y: 0 });
  };

  if (hotMovies.length === 0) return null;

  const currentMovie = hotMovies[selectedIndex] || hotMovies[0];

  // Helper to convert youtube watch to embed
  const getEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : url;
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl mb-10 group bg-slate-950 select-none ambient-cinema-glow border border-slate-200/40"
      onMouseEnter={() => {
        setIsHovered(true);
        autoplayPlugin.current.stop();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        autoplayPlugin.current.play();
      }}
    >
      {/* Embla Carousel Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {hotMovies.map((movie, idx) => (
            <div
              key={movie.id}
              className="relative flex-[0_0_100%] min-w-0 min-h-[500px] sm:min-h-[560px] lg:h-[600px] flex items-center"
            >
              {/* Backdrop Background with cinematic vignette */}
              <div className="absolute inset-0 z-0">
                <img
                  src={movie.backdrop}
                  alt={movie.title}
                  className="w-full h-full object-cover object-center transform transition-transform duration-1000 scale-100 group-hover:scale-105 opacity-60"
                  draggable={false}
                />
                {/* Cinema Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent sm:w-4/5" />
              </div>

              {/* Split Content Grid */}
              <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Movie Info & CTAs */}
                <div className="lg:col-span-8 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {idx === selectedIndex && (
                      <motion.div
                        key={`content-${movie.id}`}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {/* Eyebrow Tag */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-md shadow-rose-600/30 tracking-wide uppercase">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            Phim Bom Tấn Đang Chiếu
                          </span>
                          <span className="text-xs font-medium text-slate-300 hidden sm:inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                            {movie.duration} phút
                          </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3 line-clamp-2 drop-shadow-md">
                          {movie.title}
                        </h1>

                        {/* Badges & Meta */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-md shadow-xs">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{movie.rating}</span>
                          </span>

                          <Badge variant="primary" size="sm" className="font-bold">
                            {movie.ageRating}
                          </Badge>

                          {movie.formats.map((fmt) => (
                            <Badge
                              key={fmt}
                              variant="secondary"
                              size="sm"
                              className="bg-white/15 text-white border-white/20 backdrop-blur-md"
                            >
                              {fmt}
                            </Badge>
                          ))}

                          <span className="text-xs text-slate-300 font-medium ml-1">
                            Thể loại: <strong className="text-white">{movie.genre.join(', ')}</strong>
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm sm:text-base text-slate-300 line-clamp-2 sm:line-clamp-3 mb-6 max-w-2xl leading-relaxed">
                          {movie.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3.5">
                          <Link to={`/movie/${movie.id}`}>
                            <Button
                              variant="primary"
                              size="lg"
                              className="animate-shimmer shadow-lg shadow-rose-600/40 text-sm font-extrabold px-6 py-3 rounded-2xl"
                              leftIcon={<Ticket className="w-5 h-5" />}
                            >
                              Đặt Vé Ngay
                            </Button>
                          </Link>

                          <Button
                            variant="outline"
                            size="lg"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/25 backdrop-blur-md text-sm font-bold px-5 py-3 rounded-2xl transition-all"
                            leftIcon={<Play className="w-4 h-4 fill-current text-rose-400" />}
                            onClick={() => setTrailerMovie(movie)}
                          >
                            Xem Trailer
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Column: Floating 3D Poster Showcase */}
                <div className="hidden lg:flex lg:col-span-4 justify-end items-center perspective-container">
                  <AnimatePresence mode="wait">
                    {idx === selectedIndex && (
                      <motion.div
                        key={`poster-${movie.id}`}
                        initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          rotateX: posterTilt.x,
                          rotateY: posterTilt.y,
                        }}
                        exit={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className="relative w-52 xl:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-2 border-white/20 cursor-pointer group/poster preserve-3d"
                        onClick={() => setTrailerMovie(movie)}
                      >
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover/poster:scale-105"
                        />
                        {/* Play Pulse Overlay */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <div className="w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg transform group-hover/poster:scale-110 transition-transform">
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                          <span className="text-white text-xs font-bold tracking-wide drop-shadow">
                            Xem Trailer
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Laser Progress Line + Film Strip Navigation */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent pt-6 pb-4 px-6 sm:px-10 flex flex-col gap-3">
        {/* Laser Progress Line */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            key={progressKey}
            className={`h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all ${
              isHovered ? 'opacity-50' : ''
            }`}
            style={{
              width: '100%',
              animation: isHovered ? 'none' : 'progressAnimation 5s linear forwards',
            }}
          />
        </div>

        {/* Bottom Strip Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Slide Counter & Label */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="text-rose-400 font-extrabold text-sm">
              {String(selectedIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{String(hotMovies.length).padStart(2, '0')}</span>
            <span className="hidden sm:inline-block text-slate-400 ml-2 border-l border-slate-700 pl-2">
              {currentMovie.title}
            </span>
          </div>

          {/* Interactive Film Strip Thumbnails */}
          <div className="flex items-center gap-2.5">
            {hotMovies.map((movie, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <button
                  key={movie.id}
                  onClick={() => scrollTo(idx)}
                  className={`group/thumb relative rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'w-14 sm:w-16 h-9 sm:h-10 ring-2 ring-rose-500 scale-105 shadow-md'
                      : 'w-10 sm:w-12 h-7 sm:h-8 opacity-50 hover:opacity-100'
                  }`}
                  aria-label={`Slide ${idx + 1}: ${movie.title}`}
                >
                  <img
                    src={movie.backdrop || movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-rose-500/20 pointer-events-none" />
                  )}
                </button>
              );
            })}

            {/* Prev / Next Arrows */}
            <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
              <button
                onClick={scrollPrev}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollNext}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Keyframes for Laser Progress */}
      <style>{`
        @keyframes progressAnimation {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Trailer Modal */}
      {trailerMovie && (
        <Modal
          isOpen={!!trailerMovie}
          onClose={() => setTrailerMovie(null)}
          title={`Trailer: ${trailerMovie.title}`}
          maxWidth="4xl"
        >
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl border border-slate-800">
            <iframe
              src={getEmbedUrl(trailerMovie.trailerUrl)}
              title={trailerMovie.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
