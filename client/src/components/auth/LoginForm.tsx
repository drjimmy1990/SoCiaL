import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import for redirection
import apiClient from '../../api/apiClient';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth'; // <-- IMPORT our custom hook

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // Hook for programmatic navigation
  const { login } = useAuth(); // <-- USE our custom hook to get the login function

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ token: string, user: User }>('/auth/login', {
        username,
        password,
      });

      // --- This is the major change ---
      // Instead of an alert, we call our global login function...
      login(response.data.user, response.data.token);
      // ...and then redirect the user to their dashboard.
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Login failed:', err.response?.data?.message || 'An unknown error occurred.');
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '300px',
    margin: '0 auto',
  };

  const inputStyle: React.CSSProperties = {
    marginBottom: '10px',
    padding: '8px',
    fontSize: '1rem',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px',
    fontSize: '1rem',
    cursor: 'pointer',
  };

  const errorStyle: React.CSSProperties = {
    color: 'red',
    marginTop: '10px',
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <label htmlFor="username">Username</label>
      <input
        id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        style={inputStyle}
      />
      
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={inputStyle}
      />
      
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {error && <p style={errorStyle}>{error}</p>}
    </form>
  );
};

export default LoginForm;