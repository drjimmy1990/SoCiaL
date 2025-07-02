
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Tool } from '../types';
import ToolCard from '../components/dashboard/ToolCard';

const UserDashboardPage = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermittedTools = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch the user's permitted tools from our new backend endpoint
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
  }, []); // The empty dependency array ensures this effect runs only once on mount

  if (loading) {
    return <div>Loading your tools...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  const dashboardStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: '1rem',
  };

  return (
    <div>
      <h2>User Dashboard</h2>
      <p>Select a tool from the list below to get started.</p>
      
      {tools.length > 0 ? (
        <div style={dashboardStyle}>
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5' }}>
          <p>You do not have permission to use any tools yet.</p>
          <p>Please contact an administrator to get access.</p>
        </div>
      )}
    </div>
  );
};

export default UserDashboardPage;