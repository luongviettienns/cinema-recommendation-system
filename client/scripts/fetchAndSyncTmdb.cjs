const fs = require('fs');
const path = require('path');

const API_KEY = 'd57f98353cd138d04009d9b056243e9e';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNTdmOTgzNTNjZDEzOGQwNDAwOWQ5YjA1NjI0M2U5ZSIsIm5iZiI6MTc4OTc1NTgxOS4xODksInN1YiI6IjZhYWQ4MWFiN2I3NDZhN2U1ZTAyNjZmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zD2dsYqSu39FpmGI9lf2w7RYkPTzNFV0BqTg-MYpCrc';

async function fetchFromTmdb(endpoint, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function determineAgeRating(genres, voteAverage) {
  const genreLower = genres.map(g => g.toLowerCase());
  if (genreLower.some(g => g.includes('kinh dị') || g.includes('horror') || g.includes('tội phạm'))) {
    return 'T18';
  }
  if (genreLower.some(g => g.includes('hành động') || g.includes('action') || g.includes('giật gân'))) {
    return 'T16';
  }
  if (genreLower.some(g => g.includes('hoạt hình') || g.includes('animation') || g.includes('gia đình'))) {
    return 'P';
  }
  return 'T13';
}

async function main() {
  console.log('Fetching genres from TMDb...');
  const genresData = await fetchFromTmdb('genre/movie/list', { language: 'vi-VN' });
  const genreMap = Object.fromEntries(genresData.genres.map(g => [g.id, g.name]));

  console.log('Fetching now playing movies from TMDb...');
  const nowPlayingData = await fetchFromTmdb('movie/now_playing', { language: 'vi-VN', page: '1' });
  
  console.log('Fetching upcoming movies from TMDb...');
  const upcomingData = await fetchFromTmdb('movie/upcoming', { language: 'vi-VN', page: '1' });

  // Select top 10 now playing and 6 upcoming
  const nowPlayingList = nowPlayingData.results.filter(m => m.poster_path && m.backdrop_path).slice(0, 10);
  const upcomingList = upcomingData.results.filter(m => m.poster_path && m.backdrop_path && !nowPlayingList.some(np => np.id === m.id)).slice(0, 6);

  const allMoviesRaw = [
    ...nowPlayingList.map(m => ({ ...m, isNowShowing: true })),
    ...upcomingList.map(m => ({ ...m, isNowShowing: false })),
  ];

  console.log(`Processing ${allMoviesRaw.length} movies with details, credits, and trailers...`);
  const movies = [];

  for (let i = 0; i < allMoviesRaw.length; i++) {
    const raw = allMoviesRaw[i];
    console.log(`[${i + 1}/${allMoviesRaw.length}] Fetching details for: ${raw.title} (ID: ${raw.id})`);

    // Fetch Vietnamese details with credits
    let details = await fetchFromTmdb(`movie/${raw.id}`, { language: 'vi-VN', append_to_response: 'credits' });
    
    // If overview is empty, fallback to English overview
    let description = details.overview || raw.overview;
    if (!description || description.trim() === '') {
      const enDetails = await fetchFromTmdb(`movie/${raw.id}`, { language: 'en-US' });
      description = enDetails.overview || 'Bộ phim điện ảnh hấp dẫn với cốt truyện kịch tính và kỹ xảo mãn nhãn được công chiếu tại các cụm rạp trên toàn quốc.';
    }

    // Fetch video trailers (try vi-VN first, then en-US)
    let videos = await fetchFromTmdb(`movie/${raw.id}/videos`, { language: 'vi-VN' });
    let trailer = videos.results?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    if (!trailer) {
      videos = await fetchFromTmdb(`movie/${raw.id}/videos`, { language: 'en-US' });
      trailer = videos.results?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || videos.results?.[0];
    }
    const trailerUrl = trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : 'https://www.youtube.com/watch?v=Way9Dexny3w';

    // Director and Cast
    const director = details.credits?.crew?.find(c => c.job === 'Director')?.name || 'Đạo diễn danh tiếng';
    const cast = (details.credits?.cast || []).slice(0, 4).map((c, idx) => ({
      id: `cast-${c.id || idx}`,
      name: c.name,
      character: c.character || 'Diễn viên chính',
      avatar: c.profile_path
        ? `https://image.tmdb.org/t/p/w200${c.profile_path}`
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    }));

    const movieGenres = (details.genres && details.genres.length > 0)
      ? details.genres.map(g => g.name)
      : (raw.genre_ids || []).map(id => genreMap[id] || 'Điện ảnh').filter(Boolean);

    const rating = Math.min(10, Math.max(1, Number((details.vote_average || 7.5).toFixed(1))));
    const duration = details.runtime && details.runtime > 40 ? details.runtime : 115;
    const ageRating = determineAgeRating(movieGenres, rating);

    // Formats
    const formats = rating >= 7.8 ? ['IMAX', '2D'] : (duration > 120 ? ['3D', '2D'] : ['2D']);

    movies.push({
      id: `tmdb-${raw.id}`,
      title: details.title || raw.title,
      originalTitle: details.original_title || raw.original_title,
      description,
      duration,
      releaseDate: details.release_date || raw.release_date || '2026-09-01',
      genre: movieGenres.length > 0 ? movieGenres : ['Hành động'],
      poster: `https://image.tmdb.org/t/p/w780${raw.poster_path}`,
      backdrop: `https://image.tmdb.org/t/p/original${raw.backdrop_path}`,
      rating,
      ageRating,
      formats,
      trailerUrl,
      director,
      cast: cast.length > 0 ? cast : [
        { id: 'c1', name: 'Diễn viên điện ảnh', character: 'Nhân vật chính', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' }
      ],
      isHot: raw.isNowShowing && i < 4, // Top 4 now-showing are hot
      isNowShowing: raw.isNowShowing,
    });
  }

  // Write to mockMovies.ts
  const mockMoviesContent = `import { IMovie } from '../types/movie';

// TMDb Real Cinema Data Synchronized (Language: vi-VN)
export const INITIAL_MOVIES: IMovie[] = ${JSON.stringify(movies, null, 2)};
`;

  const mockMoviesPath = path.resolve(__dirname, '../src/data/mockMovies.ts');
  fs.writeFileSync(mockMoviesPath, mockMoviesContent, 'utf-8');
  console.log(`Successfully wrote ${movies.length} real TMDb movies to ${mockMoviesPath}`);

  // Generate showtimes for all now-showing movies
  const nowShowing = movies.filter(m => m.isNowShowing);
  const showtimesContent = `import { IShowtime } from '../types/showtime';
import { INITIAL_MOVIES } from './mockMovies';

// Helper to generate dates YYYY-MM-DD
function getDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return \`\${year}-\${month}-\${day}\`;
}

export function generateInitialShowtimes(): IShowtime[] {
  const showtimes: IShowtime[] = [];
  const nowShowingMovies = INITIAL_MOVIES.filter((m) => m.isNowShowing);

  const schedules = [
    { time: '10:30', room: 'Phòng 01 - IMAX Laser', format: 'IMAX' as const, lang: 'Phụ đề' as const, price: 130000 },
    { time: '13:45', room: 'Phòng 02 - Dolby Atmos', format: '2D' as const, lang: 'Phụ đề' as const, price: 95000 },
    { time: '16:20', room: 'Phòng 04 - 3D RealD', format: '3D' as const, lang: 'Lồng tiếng' as const, price: 110000 },
    { time: '19:30', room: 'Phòng 01 - IMAX Laser', format: 'IMAX' as const, lang: 'Phụ đề' as const, price: 140000 },
    { time: '21:45', room: 'Phòng 03 - Premium 2D', format: '2D' as const, lang: 'Phụ đề' as const, price: 90000 },
  ];

  const cinemas = [
    'CineLight Landmark 81',
    'CineLight Thủ Đức',
    'CineLight Quận 1'
  ];

  // For next 5 days
  for (let day = 0; day < 5; day++) {
    const dateStr = getDateOffset(day);

    nowShowingMovies.forEach((movie, mIdx) => {
      // Pick 2-3 showtimes per movie per day across cinemas
      const cinema = cinemas[mIdx % cinemas.length];
      const selectedSchedules = mIdx % 2 === 0
        ? [schedules[0], schedules[2], schedules[3]]
        : [schedules[1], schedules[3], schedules[4]];

      selectedSchedules.forEach((sch, sIdx) => {
        showtimes.push({
          id: \`st-\${movie.id}-d\${day}-\${sIdx + 1}\`,
          movieId: movie.id,
          cinemaName: cinema,
          roomName: sch.room,
          date: dateStr,
          time: sch.time,
          format: movie.formats.includes(sch.format) ? sch.format : '2D',
          language: sch.lang,
          basePrice: sch.price,
        });
      });
    });
  }

  return showtimes;
}
`;

  const mockShowtimesPath = path.resolve(__dirname, '../src/data/mockShowtimes.ts');
  fs.writeFileSync(mockShowtimesPath, showtimesContent, 'utf-8');
  console.log(`Successfully generated showtimes in ${mockShowtimesPath}`);
}

main().catch(err => {
  console.error('Error fetching TMDb data:', err);
  process.exit(1);
});
