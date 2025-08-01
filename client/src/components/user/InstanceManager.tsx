import React, { useState } from 'react';
import { Instance } from '../../types';
import apiClient from '../../api/apiClient';

import {
  Box, Button, Card, CardContent, CardActions, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';

import toast from 'react-hot-toast';

interface InstanceManagerProps {
  instances: Instance[];
  onInstanceUpdate: () => void;
}

export const InstanceManager: React.FC<InstanceManagerProps> = ({ instances, onInstanceUpdate }) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceForQr, setInstanceForQr] = useState<Instance | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/instances', {
        instanceDisplayName: newInstanceName,
        phoneNumber: newPhoneNumber,
      });
      setInstanceForQr(response.data.instance);
      setQrCode(response.data.qrCodeBase64);
      setOpenQrDialog(true);
      setOpenCreateDialog(false);
      setNewInstanceName('');
      setNewPhoneNumber('');
      onInstanceUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create instance.');
      toast.error(err.response?.data?.message || 'Failed to create instance.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (window.confirm('Are you sure you want to delete this instance?')) {
      try {
        await apiClient.delete(`/instances/${instanceId}`);
        toast.success('Instance deleted successfully.');
        onInstanceUpdate();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete instance.');
      }
    }
  };

  const handleConnect = async (instance: Instance) => {
    try {
      const response = await apiClient.get(`/instances/${instance.id}/connect`);
      setInstanceForQr(instance);
      setQrCode(response.data.qrCodeBase64);
      setOpenQrDialog(true);
    } catch (err: any) {
       toast.error(err.response?.data?.message || 'Failed to get QR Code.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-start' }}>
        <Button variant="contained" onClick={() => setOpenCreateDialog(true)}>
          + Create New Instance
        </Button>
      </Box>
      
      {instances.length === 0 ? (
        <Typography>You have no instances yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {instances.map((inst) => (
            <Card key={inst.id} sx={{ minWidth: 275, mb: 2 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {inst.instanceDisplayName}
                </Typography>
                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                  Status: <strong>{inst.status}</strong>
                </Typography>
                <Typography variant="body2">
                  Phone: {inst.owner_jid ? inst.owner_jid.split('@')[0] : 'N/A'}
                  <br />
                  ID: {inst.system_name}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" variant="outlined" onClick={() => handleConnect(inst)}>Connect (QR)</Button>
                <Button size="small" color="error" onClick={() => handleDeleteInstance(inst.id)}>Delete</Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* --- Create Instance Dialog (Modal) --- */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Instance</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateInstance} sx={{ mt: 1 }}>
            <TextField
              autoFocus margin="dense" id="name" label="Instance Name (e.g., My Shop)" type="text" fullWidth
              value={newInstanceName} onChange={(e) => setNewInstanceName(e.target.value)} required
            />
            <TextField
              margin="dense" id="phone" label="WhatsApp Number (e.g., 15551234567)" type="text" fullWidth
              value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)} required
            />
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateInstance} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create & Get QR'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- QR Code Dialog (Modal) --- */}
      <Dialog open={openQrDialog} onClose={() => setOpenQrDialog(false)}>
        <DialogTitle>Scan with WhatsApp</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          
          {/* --- THIS IS THE FIX --- */}
          {qrCode && <img src={qrCode} alt="WhatsApp QR Code" />}
          {/* --- END OF FIX --- */}

          <Typography sx={{ mt: 2 }}>
            Connecting instance: <strong>{instanceForQr?.instanceDisplayName}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQrDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};