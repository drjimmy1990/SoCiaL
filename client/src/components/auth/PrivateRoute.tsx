import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth(); // <-- Get the new isLoading state

  // If we are still checking for a session, show a loading message.
  if (isLoading) {
    return <div>Loading session...</div>;
  }

  // If we are done loading and the user is authenticated, show the page.
  // Otherwise, redirect to login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;