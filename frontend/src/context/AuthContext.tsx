import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'retailer' | 'admin';
  phone?: string;
  profilePhoto?: string;
}

export interface RetailerProfile {
  _id: string;
  storeName: string;
  storeAddress: string;
  category: string[];
  description?: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  openingHours?: string;
  closingHours?: string;
  storeLogo?: string;
  storeBanner?: string;
  contactPhone?: string;
  contactEmail?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
}

interface AuthContextType {
  user: UserProfile | null;
  retailer: RetailerProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [retailer, setRetailer] = useState<RetailerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUser = async () => {
    const token = localStorage.getItem('brightstore_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setRetailer(response.data.retailer);
    } catch (error) {
      console.error('Failed to load user profile', error);
      localStorage.removeItem('brightstore_token');
      setUser(null);
      setRetailer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData, retailer: retailerData } = response.data;
      localStorage.setItem('brightstore_token', token);
      setUser(userData);
      setRetailer(retailerData);
    } catch (error: any) {
      localStorage.removeItem('brightstore_token');
      setUser(null);
      setRetailer(null);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      const { token, user: userData, retailer: retailerData } = response.data;
      localStorage.setItem('brightstore_token', token);
      setUser(userData);
      setRetailer(retailerData);
    } catch (error: any) {
      localStorage.removeItem('brightstore_token');
      setUser(null);
      setRetailer(null);
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('brightstore_token');
    setUser(null);
    setRetailer(null);
    window.location.href = '/';
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setRetailer(response.data.retailer);
    } catch (error) {
      console.error('Refresh profile failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, retailer, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
