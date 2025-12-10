import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Doctor } from '@/types/referral';
import { mockDoctors } from '@/data/mockData';

interface AuthContextType {
  currentUser: Doctor | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Doctor | null>(null);

  const login = (email: string, password: string): boolean => {
    // Mock authentication - in production, this would verify against backend
    const user = mockDoctors.find(d => d.email.toLowerCase() === email.toLowerCase());
    if (user && password === 'demo123') {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated: !!currentUser }}>
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
