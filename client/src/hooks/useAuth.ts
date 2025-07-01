import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * A custom hook to easily access the AuthContext.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  // This is a good practice: if a component tries to use this hook outside
  // of an AuthProvider, we throw a helpful error.
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};