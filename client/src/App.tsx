import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './components/auth/PrivateRoute';
import WhatsAppConnectionPage from './pages/tools/WhatsAppConnectionPage'; // <-- Import the new tool page

// A placeholder for the 404 page
const NotFoundPage = () => (
  <div>
    <h2>404 - Page Not Found</h2>
    <Link to="/">Go to Home</Link>
  </div>
);

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Router>
      <div className="App">
        <header style={{ padding: '1rem', backgroundColor: '#282c34', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>WhatsApp Tools</h1>
          <nav>
            {isAuthenticated ? (
              <>
                <span style={{ marginRight: '1rem' }}>Welcome, {user?.username}!</span>
                {user?.role === 'admin' && (
                  <Link to="/admin" style={{ color: 'white', marginRight: '1rem' }}>Admin Dashboard</Link>
                )}
                <Link to="/dashboard" style={{ color: 'white', marginRight: '1rem' }}>My Dashboard</Link>
                <button onClick={logout}>Logout</button>
              </>
            ) : (
              <Link to="/login" style={{ color: 'white' }}>Login</Link>
            )}
          </nav>
        </header>
        <main style={{ padding: '1rem' }}>
          <Routes>
            {/* If logged in, '/' redirects to dashboard, otherwise to login */}
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            
            {/* Login page is always public */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* --- Protected Routes --- */}
            {/* All routes nested inside PrivateRoute will require authentication */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              {/* Add the new route for our first tool */}
              <Route path="/tools/whatsapp-connections" element={<WhatsAppConnectionPage />} />
            </Route>

            {/* Catch-all for unknown paths */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;