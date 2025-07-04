import React, { useState, useEffect, useCallback } from 'react'; // <-- Import useCallback
import apiClient from '../../api/apiClient';
import toast from 'react-hot-toast';

import {
  Box, Button, Typography, Paper, TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, CircularProgress, TextField, Alert
} from '@mui/material';

interface SystemInstance {
  id: string;
  display_name: string;
  status: string;
  webhook_url: string | null;
  owner_username: string;
}

const InstanceSettings = () => {
  const [instances, setInstances] = useState<SystemInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editState, setEditState] = useState<{ [key: string]: { webhookUrl: string } }>({});

  // --- THIS IS THE FIX: Wrap fetchInstances in useCallback ---
  const fetchInstances = useCallback(async () => {
    try {
      // We don't need to set loading to true here on re-fetches
      setError(null);
      const response = await apiClient.get<SystemInstance[]>('/admin/instances');
      setInstances(response.data);
      
      const initialEditState = response.data.reduce((acc, inst) => {
        acc[inst.id] = { webhookUrl: inst.webhook_url || '' };
        return acc;
      }, {} as typeof editState);
      setEditState(initialEditState);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load instance data.');
    }
  }, []); // useCallback has an empty dependency array because it doesn't depend on any props or state

  useEffect(() => {
    setLoading(true);
    fetchInstances().finally(() => setLoading(false));
    // --- THIS IS THE FIX: Add the stable fetchInstances function to the dependency array ---
  }, [fetchInstances]);

  const handleInputChange = (instanceId: string, value: string) => {
    setEditState(prev => ({
      ...prev,
      [instanceId]: { ...prev[instanceId], webhookUrl: value },
    }));
  };

  const handleSaveChanges = async (instanceId: string) => {
    const configToSave = editState[instanceId];
    if (!configToSave) return;

    const toastId = toast.loading('Saving changes...');
    try {
      await apiClient.post(`/admin/instances/${instanceId}/config`, {
        webhookUrl: configToSave.webhookUrl,
      });
      toast.success('Changes saved successfully!', { id: toastId });
      // You could re-fetch here if needed, but it's often not necessary
      // await fetchInstances();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save changes.', { id: toastId });
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Instance Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
        Here you can configure settings for any instance in the system.
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Instance Name</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Webhook URL</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instances.map((instance) => (
              <TableRow key={instance.id}>
                <TableCell>{instance.display_name}</TableCell>
                <TableCell>{instance.owner_username}</TableCell>
                <TableCell>{instance.status}</TableCell>
                <TableCell sx={{ width: '40%' }}>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={editState[instance.id]?.webhookUrl || ''}
                    onChange={(e) => handleInputChange(instance.id, e.target.value)}
                    placeholder="e.g., http://example.com/webhook"
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleSaveChanges(instance.id)}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InstanceSettings;