import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';

// --- NEW MUI IMPORTS ---
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
// --- END OF MUI IMPORTS ---

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ token: string, user: User }>('/auth/login', {
        username,
        password,
      });
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err.response?.data?.message || 'An unknown error occurred.');
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <TextField
        id="username"
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        margin="normal"
        fullWidth
        autoFocus
      />
      
      <TextField
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        margin="normal"
        fullWidth
      />
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1, mb: 1 }}>
          {error}
        </Typography>
      )}

      <Button 
        type="submit" 
        disabled={loading} 
        variant="contained" 
        size="large"
        sx={{ mt: 3, mb: 2, width: '100%' }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
      </Button>
    </Box>
  );
};

export default LoginForm;