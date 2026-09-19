import { ICinema } from '../types/cinema';
import { INITIAL_CINEMAS } from '../data/mockCinemas';
import { delay } from './api';

export const cinemaService = {
  async getAllCinemas(): Promise<ICinema[]> {
    await delay(100);
    return INITIAL_CINEMAS;
  },

  async getCinemaById(id: string): Promise<ICinema | undefined> {
    await delay(100);
    return INITIAL_CINEMAS.find((c) => c.id === id || c.slug === id);
  },

  async getCinemasByRegion(region: string): Promise<ICinema[]> {
    await delay(100);
    if (!region || region === 'Tất cả') return INITIAL_CINEMAS;
    return INITIAL_CINEMAS.filter((c) => c.region === region);
  }
};
