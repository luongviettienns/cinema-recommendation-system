import { Request, Response, NextFunction } from 'express';
import { movieService } from '../services/movieService';

export const movieController = {
  async getGenres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const genres = await movieService.getAllGenres();
      res.status(200).json({
        success: true,
        data: genres,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isNowShowing, isHot, search, genreId } = req.query;

      const filters: any = {};
      if (isNowShowing !== undefined) filters.isNowShowing = isNowShowing === 'true';
      if (isHot !== undefined) filters.isHot = isHot === 'true';
      if (typeof search === 'string') filters.search = search;
      if (typeof genreId === 'string') filters.genreId = genreId;

      const movies = await movieService.getAllMovies(filters);
      res.status(200).json({
        success: true,
        data: movies,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const movie = await movieService.getMovieById(id);
      res.status(200).json({
        success: true,
        data: movie,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const movie = await movieService.createMovie(req.body);
      res.status(201).json({
        success: true,
        data: movie,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const movie = await movieService.updateMovie(id, req.body);
      res.status(200).json({
        success: true,
        data: movie,
        message: 'Cập nhật phim thành công',
      });
    } catch (error) {
      next(error);
    }
  },

  async quickStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isNowShowing, isHot } = req.body;
      const movie = await movieService.quickUpdateStatus(id, isNowShowing, isHot);
      res.status(200).json({
        success: true,
        data: movie,
        message: 'Cập nhật trạng thái phim thành công',
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await movieService.deleteMovie(id);
      res.status(200).json({
        success: true,
        message: 'Xóa phim thành công',
      });
    } catch (error) {
      next(error);
    }
  },

  async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviews = await movieService.getMovieReviews(id);
      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },

  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { rating, comment } = req.body;

      if (!rating || !comment) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Vui lòng cung cấp số sao đánh giá và nội dung nhận xét',
          },
        });
        return;
      }

      const review = await movieService.createMovieReview(id, userId, Number(rating), comment);
      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  },
};
