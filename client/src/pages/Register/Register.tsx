import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Film, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập địa chỉ email').email('Email không đúng định dạng'),
    phone: z
      .string()
      .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại Việt Nam không hợp lệ (10 chữ số)'),
    password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerAuth(data.name, data.email, data.password);
      toast.success('Đăng ký tài khoản thành công!', {
        description: `Chào mừng ${data.name} gia nhập cộng đồng CineLight Cinema.`,
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'Đăng ký không thành công, vui lòng thử lại';
      setError('root', { message: msg });
      toast.error(msg);
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
            Đăng Ký Thành Viên
          </h2>
          <p className="text-xs text-slate-500">
            Tạo tài khoản để nhận ngay ưu đãi vé xem phim và tích điểm đổi quà.
          </p>
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
            label="Họ và Tên"
            type="text"
            placeholder="Nguyễn Văn A"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Địa chỉ Email"
            type="email"
            placeholder="example@gmail.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Số Điện Thoại"
            type="tel"
            placeholder="0912345678"
            leftIcon={<Phone className="w-4 h-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="Nhập lại mật khẩu"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="text-xs text-slate-500 pt-1 leading-relaxed">
            Bằng việc đăng ký, bạn đồng ý với{' '}
            <a href="#terms" className="text-rose-600 underline font-semibold">
              Điều khoản dịch vụ
            </a>{' '}
            của CineLight.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center mt-2 shadow-md shadow-rose-200 font-bold"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Đăng Ký Ngay
          </Button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-rose-600 hover:underline">
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
};
