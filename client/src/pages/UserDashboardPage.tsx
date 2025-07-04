import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Tool } from '../types';
import ToolCard from '../components/dashboard/ToolCard';

// --- MUI IMPORTS ---
import { Box, Container, Typography, CircularProgress, Paper } from '@mui/material';
const UserDashboardPage = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermittedTools = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<Tool[]>('/permissions/my-permissions');
        setTools(response.data);
      } catch (err) {
        setError('Failed to fetch your available tools. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermittedTools();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        User Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Select a tool from the list below to get started.
      </Typography>
      
      {tools.length > 0 ? (
        // --- THIS IS THE FIX ---
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center', // Center the cards horizontally
          gap: 2,
          alignItems: 'stretch', // This is the key property for equal height
        }}>
          {tools.map((tool) => (
            // We wrap the ToolCard in a Box to ensure the flex properties apply correctly
            <Box key={tool.id} sx={{ display: 'flex' }}>
                <ToolCard tool={tool} />
            </Box>
          ))}
        </Box>
        // --- END OF FIX ---
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">No Tools Available</Typography>
          <Typography color="text.secondary">
            You do not have permission to use any tools yet. Please contact an administrator to get access.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default UserDashboardPage;