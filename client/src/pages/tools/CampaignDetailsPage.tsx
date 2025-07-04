import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { listenForEvent, stopListeningForEvent } from '../../services/socket';

// We no longer need Grid, so it has been removed from the import.
import {
  Box, Button, Container, Typography, Paper, Link, CircularProgress,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import toast from 'react-hot-toast';

interface Recipient {
  id: number;
  phone_number: string;
  status: 'pending' | 'sent' | 'failed';
  log_message?: string;
  sent_at?: string;
}

interface CampaignDetails {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped' | 'failed';
  instance_name: string;
  use_placeholders: boolean;
  delay_speed: string;
  delay_from_seconds: number;
  delay_to_seconds: number;
}

const CampaignDetailsPage = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data fetching and WebSocket logic remains the same
  useEffect(() => {
    if (!campaignId) return;
    const fetchDetails = async () => {
      try { setLoading(true); setError(null);
        const response = await apiClient.get(`/campaigns/${campaignId}`);
        setCampaign(response.data.campaign);
        setRecipients(response.data.recipients);
      } catch (err: any) { setError(err.response?.data?.message || 'Failed to fetch campaign details.');
      } finally { setLoading(false); }
    };
    fetchDetails();
  }, [campaignId]);

  const handleCampaignUpdate = useCallback((data: { campaignId: string; status: CampaignDetails['status'] }) => {
    if (data.campaignId === campaignId) {
      setCampaign(prev => prev ? { ...prev, status: data.status } : null);
    }
  }, [campaignId]);

  const handleProgressUpdate = useCallback((data: { campaignId: string; updatedRecipients: Recipient[] }) => {
    if (data.campaignId === campaignId) {
        setRecipients(currentRecipients => {
            const updatedRecipientsMap = new Map(data.updatedRecipients.map(ur => [ur.id, ur]));
            return currentRecipients.map(r => updatedRecipientsMap.has(r.id) ? { ...r, ...updatedRecipientsMap.get(r.id) } : r);
        });
    }
  }, [campaignId]);

  useEffect(() => {
    listenForEvent('campaign_update', handleCampaignUpdate);
    listenForEvent('campaign_progress', handleProgressUpdate);
    return () => {
      stopListeningForEvent('campaign_update');
      stopListeningForEvent('campaign_progress');
    };
  }, [handleCampaignUpdate, handleProgressUpdate]);

  const handleControlClick = async (action: 'start' | 'pause' | 'stop') => {
    if (!campaignId) return;
    try {
      const response = await apiClient.post(`/campaigns/${campaignId}/control`, { action });
      toast.success(response.data.message || `Campaign action '${action}' successful.`);
      setCampaign(prev => {
        if (!prev) return null; let newStatus: CampaignDetails['status'] = prev.status;
        if (action === 'start') newStatus = 'running';
        else if (action === 'pause') newStatus = 'paused';
        else if (action === 'stop') newStatus = 'stopped';
        return { ...prev, status: newStatus };
      });
    } catch (err: any) {toast.error(err.response?.data?.message || `Failed to ${action} campaign.`); }
  };

  const progressStats = useMemo(() => {
    const total = recipients.length;
    const sent = recipients.filter(r => r.status === 'sent').length;
    const failed = recipients.filter(r => r.status === 'failed').length;
    const percentage = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;
    return { total, sent, failed, percentage };
  }, [recipients]);

  const getStatusChip = (status: string) => {
    const colorMap: { [key: string]: "primary" | "secondary" | "success" | "error" | "warning" | "info" | "default" } = {
      draft: 'default', running: 'info', paused: 'warning', completed: 'success', stopped: 'error', failed: 'error',
    };
    return <Chip label={status} color={colorMap[status] || 'default'} sx={{textTransform: 'capitalize', fontWeight: 'bold'}} />;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">Error: {error}</Typography>;
  if (!campaign) return <Typography align="center">Campaign not found.</Typography>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/tools/campaigns">{'< Back to Campaigns'}</Link>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 1 }}>{campaign.name}</Typography>
      </Box>

      {/* --- THIS IS THE FIX: Replaced Grid with Box and flexbox --- */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(66.66% - 12px)' } }}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" gutterBottom>Campaign Controls</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" color="success" onClick={() => handleControlClick('start')} disabled={!['draft', 'paused', 'stopped'].includes(campaign.status)}>Start</Button>
                    <Button variant="contained" color="warning" onClick={() => handleControlClick('pause')} disabled={campaign.status !== 'running'}>Pause</Button>
                    <Button variant="contained" color="error" onClick={() => handleControlClick('stop')} disabled={!['running', 'paused'].includes(campaign.status)}>Stop</Button>
                </Box>
            </Paper>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 12px)' } }}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                <Typography variant="h6">Status</Typography>
                <Box sx={{ my: 1 }}>{getStatusChip(campaign.status)}</Box>
            </Paper>
        </Box>
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6">Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}><LinearProgress variant="determinate" value={progressStats.percentage} /></Box>
                    <Box sx={{ minWidth: 35 }}><Typography variant="body2" color="text.secondary">{`${progressStats.percentage}%`}</Typography></Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                    <Typography>Sent: {progressStats.sent}</Typography>
                    <Typography color="error">Failed: {progressStats.failed}</Typography>
                    <Typography variant="body2" color="text.secondary">Total: {progressStats.total}</Typography>
                </Box>
            </Paper>
        </Box>
        <Box sx={{ width: '100%' }}>
            <TableContainer component={Paper}>
                <Typography variant="h6" sx={{ p: 2 }}>Recipients</Typography>
                <Table sx={{ minWidth: 650 }} aria-label="recipients table">
                    <TableHead>
                        <TableRow><TableCell>Phone Number</TableCell><TableCell>Status</TableCell><TableCell>Log</TableCell></TableRow>
                    </TableHead>
                    <TableBody>
                        {recipients.map(r => (
                            <TableRow key={r.id}>
                                <TableCell>{r.phone_number}</TableCell>
                                <TableCell>{getStatusChip(r.status)}</TableCell>
                                <TableCell sx={{color: r.status === 'failed' ? 'error.main' : 'text.secondary'}}>{r.log_message}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
      </Box>
      {/* --- END OF FIX --- */}
    </Container>
  );
};

export default CampaignDetailsPage;