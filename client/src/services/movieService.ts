import { IMovie } from '../types/movie';
import { IShowtime } from '../types/showtime';
import { mockStorage } from './mockStorage';
import { delay } from './api';

export const movieService = {
  async getAllMovies(): Promise<IMovie[]> {
    await delay(150);
    return mockStorage.getMovies();
  },

  async getMovieById(id: string): Promise<IMovie | undefined> {
    await delay(150);
    return mockStorage.getMovieById(id);
  },

  async getShowtimesByMovieId(movieId: string): Promise<IShowtime[]> {
    await delay(150);
    return mockStorage.getShowtimesByMovieId(movieId);
  },

  async getShowtimeById(id: string): Promise<IShowtime | undefined> {
    await delay(150);
    return mockStorage.getShowtimeById(id);
  }
};
