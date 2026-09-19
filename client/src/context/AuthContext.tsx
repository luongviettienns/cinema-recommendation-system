import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<IUser>;
  register: (name: string, email: string, password?: string) => Promise<IUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial user from storage
    const storedUser = authService.getCurrentUser();
    const storedToken = authService.getToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password = 'password123'): Promise<IUser> => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const register = async (name: string, email: string, password = 'password123'): Promise<IUser> => {
    const res = await authService.register(name, email, password);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
