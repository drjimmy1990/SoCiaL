import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

// --- NEW MUI IMPORTS ---
import {
  Box, Button, Container, Typography, Paper, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, CircularProgress, Link
} from '@mui/material';
// --- END OF MUI IMPORTS ---

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  instance_name: string;
  total_recipients: number;
  sent_recipients: number;
}

const CampaignsDashboardPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<Campaign[]>('/campaigns');
        setCampaigns(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch campaigns.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const getStatusChip = (status: string) => {
    const colorMap: { [key: string]: "primary" | "secondary" | "success" | "error" | "warning" | "info" | "default" } = {
      draft: 'default',
      running: 'info',
      paused: 'warning',
      completed: 'success',
      stopped: 'error',
      failed: 'error',
    };
    return <Chip label={status} color={colorMap[status] || 'default'} size="small" sx={{textTransform: 'capitalize'}} />;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">Error: {error}</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Link component={RouterLink} to="/dashboard">{'< Back to Dashboard'}</Link>
          <Typography variant="h4" component="h1" gutterBottom sx={{mt: 1}}>
            Campaign Manager
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/tools/campaigns/new')}>
          + Create New Campaign
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="campaigns table">
          <TableHead>
            <TableRow>
              <TableCell>Campaign Name</TableCell>
              <TableCell>Instance</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  onClick={() => navigate(`/tools/campaigns/${campaign.id}`)}
                  hover
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle1" fontWeight="bold">{campaign.name}</Typography>
                  </TableCell>
                  <TableCell>{campaign.instance_name}</TableCell>
                  <TableCell>{campaign.sent_recipients} / {campaign.total_recipients}</TableCell>
                  <TableCell>{getStatusChip(campaign.status)}</TableCell>
                  <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="subtitle1">You haven't created any campaigns yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default CampaignsDashboardPage;