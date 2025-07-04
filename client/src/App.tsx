import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './components/auth/PrivateRoute';
import WhatsAppConnectionPage from './pages/tools/WhatsAppConnectionPage';
import CampaignsDashboardPage from './pages/tools/CampaignsDashboardPage';
import CreateCampaignPage from './pages/tools/CreateCampaignPage';
import CampaignDetailsPage from './pages/tools/CampaignDetailsPage';

// --- THIS IS THE FIX: Removed 'Link' from this import statement ---
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';

const NotFoundPage = () => (
  <Container>
    <Typography variant="h4" component="h1" gutterBottom>
      404 - Page Not Found
    </Typography>
    <Button component={RouterLink} to="/" variant="contained">
      Go to Home
    </Button>
  </Container>
);

function App() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              WhatsApp Tools
            </Typography>
            <nav>
              {isAuthenticated ? (
                <>
                  <Typography component="span" sx={{ mr: 2 }}>
                    Welcome, {user?.username}!
                  </Typography>
                  {user?.role === 'admin' && (
                    <Button component={RouterLink} to="/admin" color="inherit">
                      Admin Dashboard
                    </Button>
                  )}
                  <Button component={RouterLink} to="/dashboard" color="inherit">
                    My Dashboard
                  </Button>
                  <Button onClick={logout} color="inherit">
                    Logout
                  </Button>
                </>
              ) : (
                <Button component={RouterLink} to="/login" color="inherit">
                  Login
                </Button>
              )}
            </nav>
          </Toolbar>
        </AppBar>

        <Container component="main" sx={{ py: 4, flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/tools/whatsapp-connections" element={<WhatsAppConnectionPage />} />
              <Route path="/tools/campaigns" element={<CampaignsDashboardPage />} />
              <Route path="/tools/campaigns/new" element={<CreateCampaignPage />} />
              <Route path="/tools/campaigns/:id" element={<CampaignDetailsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;