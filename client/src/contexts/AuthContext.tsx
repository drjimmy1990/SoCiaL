import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // <-- NEW: Add loading state
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>(null!);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <-- NEW: Initialize as true

  useEffect(() => {
    try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            connectSocket(storedToken);
        }
    } catch (error) {
        console.error("Failed to parse auth data from localStorage", error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    } finally {
        setIsLoading(false); // <-- NEW: Set loading to false after checking
    }
  }, []);

  const login = (loggedInUser: User, receivedToken: string) => {
    setUser(loggedInUser);
    setToken(receivedToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('token', receivedToken);
    connectSocket(receivedToken);
  };

  const logout = () => {
    disconnectSocket();
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };
  
  const isAuthenticated = !!token;

  const value = { user, token, isAuthenticated, isLoading, login, logout }; // <-- NEW: Pass isLoading

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};