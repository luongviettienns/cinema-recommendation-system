import { prisma } from '../prisma';
import { AgeRating } from '@prisma/client';

export interface CreateMovieDTO {
  title: string;
  originalTitle?: string;
  description: string;
  duration: number;
  releaseDate: string | Date;
  poster: string;
  backdrop: string;
  rating?: number;
  ageRating?: AgeRating;
  trailerUrl?: string;
  director?: string;
  isHot?: boolean;
  isNowShowing?: boolean;
  genreIds?: string[];
}

export const movieService = {
  async getAllGenres() {
    return prisma.genre.findMany({
      include: {
        _count: {
          select: { movieGenres: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getAllMovies(filters: { isNowShowing?: boolean; isHot?: boolean; search?: string; genreId?: string } = {}) {
    const where: any = {};

    if (typeof filters.isNowShowing === 'boolean') {
      where.isNowShowing = filters.isNowShowing;
    }

    if (typeof filters.isHot === 'boolean') {
      where.isHot = filters.isHot;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { originalTitle: { contains: filters.search } },
        { director: { contains: filters.search } },
      ];
    }

    if (filters.genreId) {
      where.movieGenres = {
        some: { genreId: filters.genreId },
      };
    }

    return prisma.movie.findMany({
      where,
      include: {
        movieGenres: {
          include: { genre: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getMovieById(id: string) {
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        movieGenres: {
          include: { genre: true },
        },
        showtimes: {
          where: {
            startTime: { gte: new Date() },
          },
          include: {
            room: {
              include: { cinema: true },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!movie) {
      const error: any = new Error('Không tìm thấy phim');
      error.statusCode = 404;
      error.code = 'MOVIE_NOT_FOUND';
      throw error;
    }

    return movie;
  },

  async createMovie(data: CreateMovieDTO) {
    const { genreIds, ...movieData } = data;

    const movie = await prisma.movie.create({
      data: {
        ...movieData,
        releaseDate: new Date(movieData.releaseDate),
        movieGenres: genreIds && genreIds.length > 0
          ? {
              create: genreIds.map((genreId) => ({ genreId })),
            }
          : undefined,
      },
      include: {
        movieGenres: {
          include: { genre: true },
        },
      },
    });

    return movie;
  },

  async updateMovie(id: string, data: Partial<CreateMovieDTO>) {
    const existing = await prisma.movie.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error('Không tìm thấy phim');
      error.statusCode = 404;
      error.code = 'MOVIE_NOT_FOUND';
      throw error;
    }

    const { genreIds, ...movieData } = data;
    const updatePayload: any = { ...movieData };
    if (movieData.releaseDate) {
      updatePayload.releaseDate = new Date(movieData.releaseDate);
    }

    if (genreIds) {
      // Re-link genres
      await prisma.movieGenre.deleteMany({ where: { movieId: id } });
      if (genreIds.length > 0) {
        updatePayload.movieGenres = {
          create: genreIds.map((genreId) => ({ genreId })),
        };
      }
    }

    return prisma.movie.update({
      where: { id },
      data: updatePayload,
      include: {
        movieGenres: {
          include: { genre: true },
        },
      },
    });
  },

  async quickUpdateStatus(id: string, isNowShowing?: boolean, isHot?: boolean) {
    const data: any = {};
    if (typeof isNowShowing === 'boolean') data.isNowShowing = isNowShowing;
    if (typeof isHot === 'boolean') data.isHot = isHot;

    return prisma.movie.update({
      where: { id },
      data,
    });
  },

  async deleteMovie(id: string) {
    // Check if movie has future active showtimes
    const activeShowtimes = await prisma.showtime.count({
      where: {
        movieId: id,
        startTime: { gte: new Date() },
      },
    });

    if (activeShowtimes > 0) {
      const error: any = new Error(`Không thể xóa phim vì đang có ${activeShowtimes} suất chiếu chưa diễn ra trong tương lai.`);
      error.statusCode = 400;
      error.code = 'MOVIE_HAS_ACTIVE_SHOWTIMES';
      error.activeShowtimes = activeShowtimes;
      throw error;
    }

    return prisma.movie.delete({ where: { id } });
  },

  async getMovieReviews(movieId: string) {
    return prisma.review.findMany({
      where: { movieId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createMovieReview(movieId: string, userId: string, rating: number, comment: string) {
    const numericRating = Number(rating);
    if (isNaN(numericRating) || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 10) {
      const err: any = new Error('Điểm đánh giá phải là số nguyên từ 1 đến 10');
      err.statusCode = 400;
      err.code = 'INVALID_RATING';
      throw err;
    }

    const trimmedComment = (comment || '').trim();
    if (trimmedComment.length < 10 || trimmedComment.length > 1000) {
      const err: any = new Error('Nội dung nhận xét phải từ 10 đến 1000 ký tự');
      err.statusCode = 400;
      err.code = 'INVALID_COMMENT_LENGTH';
      throw err;
    }

    // Upsert review: each user has at most one review per movie
    const existingReview = await prisma.review.findFirst({
      where: { movieId, userId },
    });

    let review;
    if (existingReview) {
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: numericRating,
          comment: trimmedComment,
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });
    } else {
      review = await prisma.review.create({
        data: {
          movieId,
          userId,
          rating: numericRating,
          comment: trimmedComment,
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });
    }

    // Recalculate average rating of movie
    const aggregations = await prisma.review.aggregate({
      where: { movieId },
      _avg: { rating: true },
    });

    if (aggregations._avg.rating) {
      await prisma.movie.update({
        where: { id: movieId },
        data: { rating: Number(aggregations._avg.rating.toFixed(1)) },
      });
    }

    return review;
  },
};
