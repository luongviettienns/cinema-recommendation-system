export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff';
  avatar?: string;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
}
