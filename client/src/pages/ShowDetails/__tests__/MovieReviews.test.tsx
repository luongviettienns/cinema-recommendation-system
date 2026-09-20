import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MovieReviews } from '../MovieReviews';
import { movieService } from '../../../services/movieService';
import { useAuth } from '../../../context/AuthContext';

// Mock movieService
vi.mock('../../../services/movieService', () => ({
  movieService: {
    getMovieReviews: vi.fn(),
    createMovieReview: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MovieReviews Component', () => {
  const mockMovieId = 'tmdb-1204680';
  const mockMovieTitle = 'Coyote vs. Acme';

  const sampleReviews = [
    {
      id: 'rev-1',
      movieId: mockMovieId,
      userId: 'user-1',
      userName: 'Nguyễn Văn A',
      userAvatar: 'https://example.com/avatar1.jpg',
      rating: 9,
      comment: 'Phim hoạt họa kết hợp người đóng vô cùng duyên dáng và hài hước!',
      createdAt: '2026-09-18T14:30:00.000Z',
    },
    {
      id: 'rev-2',
      movieId: mockMovieId,
      userId: 'user-2',
      userName: 'Trần Thị Mai Phương',
      rating: 8,
      comment: 'Cốt truyện kiện tụng pháp đình rất sáng tạo và lôi cuốn.',
      createdAt: '2026-09-17T09:15:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(movieService.getMovieReviews).mockResolvedValue(sampleReviews);
  });

  it('renders rating overview, breakdown, and list of reviews', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <MovieReviews movieId={mockMovieId} movieTitle={mockMovieTitle} initialRating={8.5} />
      </MemoryRouter>
    );

    // Check loading or initial content
    expect(await screen.findByText(/đánh giá từ khán giả/i)).toBeInTheDocument();

    // Check average rating & count
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText(/Nhận Xét Từ Khán Giả \(2\)/i)).toBeInTheDocument();

    // Check reviewer names and comments
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Mai Phương')).toBeInTheDocument();
    expect(screen.getByText(/Phim hoạt họa kết hợp người đóng/i)).toBeInTheDocument();
  });

  it('shows login CTA banner when user is not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <MovieReviews movieId={mockMovieId} movieTitle={mockMovieTitle} initialRating={8.5} />
      </MemoryRouter>
    );

    await screen.findByText('Nguyễn Văn A');

    expect(screen.getByText(/đăng nhập để chia sẻ cảm nhận/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /đăng nhập ngay/i })).toBeInTheDocument();
  });

  it('shows review submission form when user is authenticated and submits review', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-demo-1',
        name: 'Đặng Minh Quân',
        email: 'quan@gmail.com',
        role: 'customer',
      },
      token: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const newReview = {
      id: 'rev-3',
      movieId: mockMovieId,
      userId: 'user-demo-1',
      userName: 'Đặng Minh Quân',
      rating: 10,
      comment: 'Kỹ xảo siêu đỉnh, âm thanh chân thực từng giây!',
      createdAt: new Date().toISOString(),
    };
    vi.mocked(movieService.createMovieReview).mockResolvedValue(newReview);

    render(
      <MemoryRouter>
        <MovieReviews movieId={mockMovieId} movieTitle={mockMovieTitle} initialRating={8.5} />
      </MemoryRouter>
    );

    await screen.findByText('Nguyễn Văn A');

    // Check greeting user
    expect(screen.getByText(/chia sẻ cảm nhận của bạn, đặng minh quân/i)).toBeInTheDocument();

    // Select star 10
    const starBtn10 = screen.getByRole('button', { name: /chọn 10 sao/i });
    fireEvent.click(starBtn10);

    // Type comment
    const textarea = screen.getByPlaceholderText(/chia sẻ cảm nhận/i);
    fireEvent.change(textarea, { target: { value: 'Kỹ xảo siêu đỉnh, âm thanh chân thực từng giây!' } });

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /gửi đánh giá/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(movieService.createMovieReview).toHaveBeenCalledWith(
        mockMovieId,
        10,
        'Kỹ xảo siêu đỉnh, âm thanh chân thực từng giây!'
      );
    });

    // New review appears on list
    expect(await screen.findByText('Kỹ xảo siêu đỉnh, âm thanh chân thực từng giây!')).toBeInTheDocument();
  });

  it('validates comment minimum length before submission', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-demo-1',
        name: 'Đặng Minh Quân',
        email: 'quan@gmail.com',
        role: 'customer',
      },
      token: 'valid-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <MovieReviews movieId={mockMovieId} movieTitle={mockMovieTitle} initialRating={8.5} />
      </MemoryRouter>
    );

    await screen.findByText('Nguyễn Văn A');

    // Type short comment (< 10 chars)
    const textarea = screen.getByPlaceholderText(/chia sẻ cảm nhận/i);
    fireEvent.change(textarea, { target: { value: 'Phim hay' } });

    const submitBtn = screen.getByRole('button', { name: /gửi đánh giá/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/nội dung nhận xét tối thiểu 10 ký tự/i)).toBeInTheDocument();
    expect(movieService.createMovieReview).not.toHaveBeenCalled();
  });

  it('renders empty state when there are no reviews', async () => {
    vi.mocked(movieService.getMovieReviews).mockResolvedValue([]);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <MovieReviews movieId="empty-movie" movieTitle="Phim Mới" initialRating={0} />
      </MemoryRouter>
    );

    expect(await screen.findByText(/chưa có đánh giá nào cho phim này/i)).toBeInTheDocument();
  });
});
