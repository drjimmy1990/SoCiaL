import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth(); // Use our hook to check auth status

  // If the user is authenticated, render the child route content using <Outlet />.
  // Otherwise, redirect them to the /login page.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;