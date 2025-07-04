import React, { useState, useEffect } from 'react';

// --- MUI IMPORTS ---
import {
  Box, Button, Typography, Paper, TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, FormGroup, FormControlLabel, Checkbox, Alert
} from '@mui/material';

// --- LOCAL IMPORTS ---
import apiClient from '../../api/apiClient';
import { Tool } from '../../types';

// --- Type Definitions for this component ---
interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  instance_limit: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the Permissions Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch initial data for users and tools
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersResponse, toolsResponse] = await Promise.all([
          apiClient.get<AdminUser[]>('/admin/users'),
          apiClient.get<Tool[]>('/tools'),
        ]);
        setUsers(usersResponse.data);
        setTools(toolsResponse.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenDialog = async (user: AdminUser) => {
    setSelectedUser(user);
    try {
      const response = await apiClient.get<number[]>(`/admin/users/${user.id}/permissions`);
      setUserPermissions(response.data);
      setIsDialogOpen(true);
    } catch (err) {
      alert('Failed to fetch user permissions.');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setUserPermissions([]);
  };

  const handlePermissionChange = (toolId: number, checked: boolean) => {
    if (checked) {
      setUserPermissions(prev => [...prev, toolId]);
    } else {
      setUserPermissions(prev => prev.filter(id => id !== toolId));
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await apiClient.post(`/admin/users/${selectedUser.id}/permissions`, {
        toolIds: userPermissions,
      });
      // We will replace this alert later
      alert('Permissions saved successfully!');
      handleCloseDialog();
    } catch (err) {
      alert('Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Users</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
                <TableCell align="right">
                  <Button variant="outlined" size="small" onClick={() => handleOpenDialog(user)}>
                    Manage Permissions
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- Permissions Management Dialog --- */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="xs">
        <DialogTitle>Manage Permissions for {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Grant access to tools:</Typography>
          <FormGroup>
            {tools.map(tool => (
              <FormControlLabel
                key={tool.id}
                control={
                  <Checkbox
                    checked={userPermissions.includes(tool.id)}
                    onChange={(e) => handlePermissionChange(tool.id, e.target.checked)}
                  />
                }
                label={tool.name}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;