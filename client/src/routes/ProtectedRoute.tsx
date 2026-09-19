import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'admin' | 'staff';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Đang xác thực phiên đăng nhập...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const isPermitted = 
      (requiredRole === 'admin' && user?.role === 'admin') ||
      (requiredRole === 'staff' && user?.role === 'staff') ||
      (requiredRole === 'customer');

    if (!isPermitted) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto font-bold text-xl">
            🚫
          </div>
          <h2 className="text-xl font-bold text-slate-900">Từ Chối Truy Cập</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Khu vực này yêu cầu quyền <strong>{requiredRole.toUpperCase()}</strong>. Tài khoản hiện tại của bạn không có đủ thẩm quyền truy cập.
          </p>
          <Navigate to="/" replace />
        </div>
      );
    }
  }

  return <>{children}</>;
};
