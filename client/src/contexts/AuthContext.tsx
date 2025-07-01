import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { connectSocket, disconnectSocket } from '../services/socket'; // <-- Import socket functions

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
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

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      connectSocket(storedToken); // <-- Connect on initial load if logged in
    }
  }, []);

  const login = (loggedInUser: User, receivedToken: string) => {
    setUser(loggedInUser);
    setToken(receivedToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('token', receivedToken);
    connectSocket(receivedToken); // <-- Connect on login
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    disconnectSocket(); // <-- Disconnect on logout
  };

  const isAuthenticated = !!token;

  const value = { user, token, isAuthenticated, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};