export interface User {
  id: string;
  phone: string;
  name: string;
  type: 'vendor' | 'driver';
  isVerified: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (phone: string, mpin: string, userType: 'vendor' | 'driver') => Promise<boolean>;
  signup: (phone: string, name: string, mpin: string, userType: 'vendor' | 'driver') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}