import { IMovie, ICast } from '../types/movie';

export const TMDB_CONFIG = {
  API_KEY: 'd57f98353cd138d04009d9b056243e9e',
  ACCESS_TOKEN:
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNTdmOTgzNTNjZDEzOGQwNDAwOWQ5YjA1NjI0M2U5ZSIsIm5iZiI6MTc4OTc1NTgxOS4xODksInN1YiI6IjZhYWQ4MWFiN2I3NDZhN2U1ZTAyNjZmMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zD2dsYqSu39FpmGI9lf2w7RYkPTzNFV0BqTg-MYpCrc',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_W780: 'https://image.tmdb.org/t/p/w780',
  IMAGE_ORIGINAL: 'https://image.tmdb.org/t/p/original',
  IMAGE_W200: 'https://image.tmdb.org/t/p/w200',
  DEFAULT_LANGUAGE: 'vi-VN',
};

async function fetchTmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_CONFIG.BASE_URL}/${endpoint}`);
  url.searchParams.set('api_key', TMDB_CONFIG.API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_CONFIG.ACCESS_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`TMDb API Error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const tmdbService = {
  fetchTmdb,

  async getNowPlaying(page = 1) {
    return fetchTmdb<{ results: any[] }>('movie/now_playing', {
      language: TMDB_CONFIG.DEFAULT_LANGUAGE,
      page: String(page),
    });
  },

  async getUpcoming(page = 1) {
    return fetchTmdb<{ results: any[] }>('movie/upcoming', {
      language: TMDB_CONFIG.DEFAULT_LANGUAGE,
      page: String(page),
    });
  },

  async getMovieDetails(movieId: number | string) {
    return fetchTmdb<any>(`movie/${movieId}`, {
      language: TMDB_CONFIG.DEFAULT_LANGUAGE,
      append_to_response: 'credits,videos',
    });
  },

  async searchMovies(query: string, page = 1) {
    return fetchTmdb<{ results: any[] }>('search/movie', {
      language: TMDB_CONFIG.DEFAULT_LANGUAGE,
      query,
      page: String(page),
    });
  },
};
