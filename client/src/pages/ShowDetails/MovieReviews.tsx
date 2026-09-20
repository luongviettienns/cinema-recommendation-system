import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Send, Sparkles, LogIn, CheckCircle2, User } from 'lucide-react';
import { IReview } from '../../types/movie';
import { movieService } from '../../services/movieService';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

interface MovieReviewsProps {
  movieId: string;
  movieTitle: string;
  initialRating?: number;
  onRatingUpdated?: (newRating: number) => void;
}

const RATING_EMOTIONS: Record<number, string> = {
  1: 'Rất thất vọng',
  2: 'Tệ',
  3: 'Dưới trung bình',
  4: 'Hơi chán',
  5: 'Bình thường',
  6: 'Xem tạm được',
  7: 'Khá hay',
  8: 'Hay & lôi cuốn',
  9: 'Rất hay, đáng xem',
  10: 'Tuyệt phẩm điện ảnh',
};

export const MovieReviews: React.FC<MovieReviewsProps> = ({
  movieId,
  movieTitle,
  initialRating = 0,
  onRatingUpdated,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<IReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedRating, setSelectedRating] = useState<number>(10);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch reviews on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    movieService
      .getMovieReviews(movieId)
      .then((data) => {
        if (isMounted) {
          setReviews(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải đánh giá phim:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  // Derived statistics
  const currentRating = hoveredRating !== null ? hoveredRating : selectedRating;

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return initialRating || 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews, initialRating]);

  // Breakdown percentages
  const ratingDistribution = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        masterpiece: 0, // 9-10
        good: 0, // 7-8
        average: 0, // 5-6
        low: 0, // 1-4
      };
    }
    const masterpieceCount = reviews.filter((r) => r.rating >= 9).length;
    const goodCount = reviews.filter((r) => r.rating >= 7 && r.rating <= 8).length;
    const averageCount = reviews.filter((r) => r.rating >= 5 && r.rating <= 6).length;
    const lowCount = reviews.filter((r) => r.rating < 5).length;

    return {
      masterpiece: Math.round((masterpieceCount / total) * 100),
      good: Math.round((goodCount / total) * 100),
      average: Math.round((averageCount / total) * 100),
      low: Math.round((lowCount / total) * 100),
    };
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setFormError('Vui lòng nhập nội dung nhận xét trước khi gửi.');
      return;
    }
    if (commentText.trim().length < 10) {
      setFormError('Nội dung nhận xét tối thiểu 10 ký tự.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const created = await movieService.createMovieReview(
        movieId,
        selectedRating,
        commentText.trim()
      );

      setReviews((prev) => [created, ...prev]);
      setCommentText('');
      setSelectedRating(10);
      toast.success('Đánh giá của bạn đã được đăng thành công!');

      // Recalculate and trigger callback
      const newReviews = [created, ...reviews];
      const newAvg = Number(
        (newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length).toFixed(1)
      );
      if (onRatingUpdated) {
        onRatingUpdated(newAvg);
      }
    } catch (err: any) {
      console.error('Không thể gửi đánh giá:', err);
      toast.error(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2
            id="reviews-heading"
            className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5"
          >
            <MessageSquare className="w-6 h-6 text-rose-600" />
            <span>Đánh Giá Từ Khán Giả</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng hợp nhận xét và chấm điểm thực tế từ khán giả đã xem phim {movieTitle}
          </p>
        </div>
      </div>

      {/* Main Review Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-8">
        {/* Rating Overview & Breakdown Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pb-8 border-b border-slate-100">
          {/* Big Score Card */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-rose-50/40 rounded-2xl border border-rose-100/80 text-center">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">
              Điểm Đánh Giá Trung Bình
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                {averageRating > 0 ? averageRating.toFixed(1) : 'Chưa có'}
              </span>
              <span className="text-slate-400 font-bold text-xl">/ 10</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => {
                const fillValue = (averageRating / 2) - i;
                return (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      fillValue >= 1
                        ? 'text-amber-400 fill-amber-400'
                        : fillValue >= 0.5
                        ? 'text-amber-400 fill-amber-200'
                        : 'text-slate-200'
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-2">
              Dựa trên <strong className="text-slate-800">{reviews.length}</strong> lượt đánh giá
            </p>
          </div>

          {/* Breakdown Distribution Bars */}
          <div className="md:col-span-8 space-y-3 px-0 md:px-4">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Phân bố cảm xúc người xem:</h3>

            {/* 9-10 Masterpiece */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-24 font-bold text-slate-700">9 - 10★ Tuyệt phẩm</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${ratingDistribution.masterpiece}%` }}
                />
              </div>
              <span className="w-10 text-right font-extrabold text-slate-600">
                {ratingDistribution.masterpiece}%
              </span>
            </div>

            {/* 7-8 Good */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-24 font-bold text-slate-700">7 - 8★ Phim hay</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${ratingDistribution.good}%` }}
                />
              </div>
              <span className="w-10 text-right font-extrabold text-slate-600">
                {ratingDistribution.good}%
              </span>
            </div>

            {/* 5-6 Average */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-24 font-bold text-slate-700">5 - 6★ Tạm ổn</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all duration-500"
                  style={{ width: `${ratingDistribution.average}%` }}
                />
              </div>
              <span className="w-10 text-right font-extrabold text-slate-600">
                {ratingDistribution.average}%
              </span>
            </div>

            {/* < 5 Low */}
            <div className="flex items-center gap-3 text-xs">
              <span className="w-24 font-bold text-slate-700">&lt; 5★ Cần cải thiện</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-300 rounded-full transition-all duration-500"
                  style={{ width: `${ratingDistribution.low}%` }}
                />
              </div>
              <span className="w-10 text-right font-extrabold text-slate-600">
                {ratingDistribution.low}%
              </span>
            </div>
          </div>
        </div>

        {/* Review Form or Auth CTA Banner */}
        {isAuthenticated && user ? (
          <form
            onSubmit={handleSubmitReview}
            className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-rose-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Chia sẻ cảm nhận của bạn, {user.name}
                </h4>
                <p className="text-xs text-slate-500">Đóng góp đánh giá khách quan giúp cộng đồng chọn phim ưng ý</p>
              </div>
            </div>

            {/* Interactive Star Rating Selector */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn điểm số (1 - 10 sao):
                </label>
                <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                  {currentRating}/10 — {RATING_EMOTIONS[currentRating] || ''}
                </span>
              </div>

              <div
                className="flex items-center gap-1.5 sm:gap-2 flex-wrap"
                role="radiogroup"
                aria-label="Đánh giá số sao"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                  const isFilled = star <= currentRating;
                  const isSelected = star === selectedRating;

                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Chọn ${star} sao`}
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className={`flex flex-col items-center justify-center w-8 h-9 sm:w-10 sm:h-11 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs scale-105'
                          : isFilled
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isSelected
                            ? 'fill-white text-white'
                            : isFilled
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                      <span className="text-[10px] font-bold mt-0.5">{star}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="review-comment" className="font-bold text-slate-700">
                  Nội dung nhận xét:
                </label>
                <span
                  className={`font-semibold ${
                    commentText.length >= 10 ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {commentText.length}/500 ký tự (tối thiểu 10)
                </span>
              </div>

              <textarea
                id="review-comment"
                rows={3}
                maxLength={500}
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Chia sẻ cảm nhận chân thật của bạn về kịch bản, kỹ xảo, diễn xuất, âm thanh hoặc trải nghiệm tại rạp..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              />

              {formError && (
                <p className="text-xs font-semibold text-rose-600 mt-1">{formError}</p>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Gửi Đánh Giá
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-rose-50/60 border border-rose-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-white text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Bạn đã thưởng thức bộ phim này?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đăng nhập để chia sẻ cảm nhận và chấm điểm cùng cộng đồng khán giả CineLight.
                </p>
              </div>
            </div>

            <Link to="/login" className="shrink-0 w-full sm:w-auto">
              <Button
                variant="primary"
                leftIcon={<LogIn className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Đăng Nhập Ngay
              </Button>
            </Link>
          </div>
        )}

        {/* Reviews Feed List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Nhận Xét Từ Khán Giả ({reviews.length})
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              Sắp xếp theo: Mới nhất
            </span>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-3.5">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-200/70 rounded-2xl p-4 sm:p-5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.userAvatar ? (
                        <img
                          src={rev.userAvatar}
                          alt={rev.userName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {rev.userName ? rev.userName[0].toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {rev.userName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                            <CheckCircle2 className="w-3 h-3" /> Đã xem rạp
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Rating Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-extrabold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{rev.rating}/10</span>
                    </div>
                  </div>

                  {/* Comment text */}
                  <p className="text-sm text-slate-700 leading-relaxed pl-12 whitespace-pre-line">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Chưa có đánh giá nào cho phim này</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy là người đầu tiên chia sẻ cảm nhận chân thật sau khi xem phim để giúp đỡ cộng đồng khán giả CineLight!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
