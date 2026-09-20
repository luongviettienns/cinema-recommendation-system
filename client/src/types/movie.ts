export interface ICast {
  id: string;
  name: string;
  character: string;
  avatar: string;
}

export interface IMovie {
  id: string;
  title: string;
  originalTitle?: string;
  description: string;
  duration: number; // in minutes
  releaseDate: string;
  genre: string[];
  poster: string;
  backdrop: string;
  rating: number; // 0 - 10
  ageRating: 'P' | 'K' | 'T13' | 'T16' | 'T18';
  formats: ('2D' | '3D' | 'IMAX')[];
  trailerUrl: string;
  director: string;
  cast: ICast[];
  isHot?: boolean;
  isNowShowing: boolean;
}

export interface IReview {
  id: string;
  movieId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 - 10
  comment: string;
  createdAt: string;
}
