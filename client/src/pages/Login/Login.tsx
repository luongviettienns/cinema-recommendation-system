import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Film, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Địa chỉ email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Intended path before login redirection
  const from = (location.state as any)?.from?.pathname || '/';

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const loggedUser = await login(data.email, data.password);
      toast.success('Đăng nhập thành công!', {
        description: 'Chào mừng bạn quay trở lại với CineLight.',
      });
      if (loggedUser?.role === 'staff') {
        navigate('/staff', { replace: true });
      } else if (loggedUser?.role === 'admin' && from === '/') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại thông tin';
      setError('root', { message: msg });
      toast.error(msg);
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      await login('demo@cinema.vn', '123456');
      toast.success('Đăng nhập nhanh 1-Click thành công!', {
        description: 'Đã đăng nhập bằng tài khoản Demo (Nguyễn Văn A).',
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Đăng nhập demo thất bại');
    }
  };

  const handleStaffDemoLogin = async () => {
    try {
      await login('staff@cinema.vn', '123456');
      toast.success('Đăng nhập Nhân Viên (Staff Console) thành công!', {
        description: 'Chuyển hướng đến màn hình tác nghiệp rạp.',
      });
      navigate('/staff', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Đăng nhập staff thất bại');
    }
  };

  const handleAdminDemoLogin = async () => {
    try {
      await login('admin@cinema.vn', '123456');
      toast.success('Đăng nhập Quản Trị Viên (Admin) thành công!', {
        description: 'Đã đăng nhập bằng tài khoản Quản Trị Hệ Thống.',
      });
      navigate('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Đăng nhập admin thất bại');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md shadow-rose-200">
            <Film className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Đăng Nhập CineLight
          </h2>
          <p className="text-xs text-slate-500">
            Chào mừng bạn quay trở lại! Đăng nhập để tích điểm và xem vé đã mua.
          </p>
        </div>

        {/* Quick Demo Login Hint */}
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 text-xs flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Tài khoản Demo 1-Click</span>
            </div>
            <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-md font-mono text-slate-600">Pass: 123456</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdminDemoLogin}
              className="w-full justify-center bg-white text-purple-700 border-purple-300 hover:bg-purple-50 font-bold shadow-xs cursor-pointer text-[11px] px-1"
            >
              👑 Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStaffDemoLogin}
              className="w-full justify-center bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold shadow-xs cursor-pointer text-[11px] px-1"
            >
              🎟️ Staff
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickDemoLogin}
              className="w-full justify-center bg-white text-rose-600 border-rose-300 hover:bg-rose-50 font-bold shadow-xs cursor-pointer text-[11px] px-1"
            >
              👤 Khách
            </Button>
          </div>

          <div className="text-[10px] text-slate-500 flex flex-wrap justify-between gap-1 px-1 pt-0.5 border-t border-slate-200/60 font-mono">
            <span>admin@cinema.vn</span>
            <span>staff@cinema.vn</span>
            <span>demo@cinema.vn</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {errors.root && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errors.root.message}</span>
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="example@gmail.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input type="checkbox" className="rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
              <span>Ghi nhớ tôi</span>
            </label>
            <a href="#forgot" className="text-rose-600 hover:underline font-semibold">
              Quên mật khẩu?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center mt-2 shadow-md shadow-rose-200 font-bold"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Đăng Nhập
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-bold text-rose-600 hover:underline">
            Đăng ký thành viên mới
          </Link>
        </div>
      </div>
    </div>
  );
};
