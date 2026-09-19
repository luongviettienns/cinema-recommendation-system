import { IUser, IAuthResponse } from '../types/user';
import { mockStorage } from './mockStorage';
import { delay } from './api';

export const authService = {
  async login(email: string, _password: string): Promise<IAuthResponse> {
    await delay(250);
    // In mock mode, allow login with any valid formatted email or use default
    const existingUser = mockStorage.getUser();
    const isAdmin = email.toLowerCase().includes('admin') || email === 'admin@cinema.vn';
    const isStaff = email.toLowerCase().includes('staff') || email === 'staff@cinema.vn';

    const user: IUser = existingUser && existingUser.email === email 
      ? existingUser 
      : {
          id: `user-${Date.now()}`,
          name: isAdmin ? 'Quản Trị Viên (Admin)' : (isStaff ? 'Nhân Viên Soát Vé (Staff)' : email.split('@')[0]),
          email,
          role: isAdmin ? 'admin' : isStaff ? 'staff' : 'customer',
          avatar: isAdmin 
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : isStaff
            ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        };

    const token = `mock-token-${Date.now()}`;
    mockStorage.setUser(user, token);
    return { user, token };
  },

  async register(name: string, email: string, _password: string): Promise<IAuthResponse> {
    await delay(300);
    const user: IUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    const token = `mock-token-${Date.now()}`;
    mockStorage.setUser(user, token);
    return { user, token };
  },

  getCurrentUser(): IUser | null {
    return mockStorage.getUser();
  },

  getToken(): string | null {
    return mockStorage.getToken();
  },

  logout(): void {
    mockStorage.clearUser();
  }
};
