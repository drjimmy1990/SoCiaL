import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// --- MUI IMPORTS ---
import {
  Box, Button, Typography, Paper, TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, FormGroup, FormControlLabel, Checkbox, Alert, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import EditIcon from '@mui/icons-material/Edit';

// --- LOCAL IMPORTS ---
import apiClient from '../../api/apiClient';
import { Tool } from '../../types';

// --- Type Definitions ---
interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  instance_limit: number;
}

const initialCreateState = {
    username: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    instanceLimit: '1',
};

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Consolidated dialog state
  const [dialogs, setDialogs] = useState({
    permissions: false,
    create: false,
    delete: false,
    password: false,
    limit: false
  });
  
  // State for forms & selections
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);
  const [createUserForm, setCreateUserForm] = useState(initialCreateState);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newInstanceLimit, setNewInstanceLimit] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const usersResponse = await apiClient.get<AdminUser[]>('/admin/users');
      setUsers(usersResponse.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to refresh users.');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchUsers(),
          apiClient.get<Tool[]>('/tools').then(res => setTools(res.data))
        ]);
      } catch (err: any) {
        setError('Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchUsers]);

  const handleOpenDialog = (dialog: keyof typeof dialogs, user: AdminUser | null = null) => {
    if (user) setSelectedUser(user);
    
    if (dialog === 'permissions' && user) {
      apiClient.get<number[]>(`/admin/users/${user.id}/permissions`)
        .then(res => setUserPermissions(res.data))
        .catch(() => toast.error('Failed to fetch user permissions.'));
    }
    if (dialog === 'limit' && user) {
      setNewInstanceLimit(String(user.instance_limit));
    }
    
    setDialogs(prev => ({ ...prev, [dialog]: true }));
  };

  const handleCloseDialogs = () => {
    setDialogs({ permissions: false, create: false, delete: false, password: false, limit: false });
    setSelectedUser(null);
    setNewPassword('');
    setCreateError(null);
    setNewInstanceLimit('');
  };

  const handleCreateFormChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    setCreateUserForm({
        ...createUserForm,
        [event.target.name as string]: event.target.value,
    });
  };

  const handlePermissionChange = (toolId: number, checked: boolean) => {
    if (checked) {
      setUserPermissions(prev => [...prev, toolId]);
    } else {
      setUserPermissions(prev => prev.filter(id => id !== toolId));
    }
  };

  const handleCreateUser = async () => {
    setSaving(true);
    setCreateError(null);
    try {
        await apiClient.post('/admin/users', {
            ...createUserForm,
            instanceLimit: parseInt(createUserForm.instanceLimit, 10),
        });
        toast.success(`User '${createUserForm.username}' created successfully!`);
        handleCloseDialogs();
        setCreateUserForm(initialCreateState);
        fetchUsers();
    } catch (err: any) {
        setCreateError(err.response?.data?.message || 'Failed to create user.');
    } finally {
        setSaving(false);
    }
  };
  
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await apiClient.post(`/admin/users/${selectedUser.id}/permissions`, {
        toolIds: userPermissions,
      });
      toast.success('Permissions saved successfully!');
      handleCloseDialogs();
    } catch (err: any) {
      toast.error('Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
        await apiClient.delete(`/admin/users/${selectedUser.id}`);
        toast.success(`User '${selectedUser.username}' deleted.`);
        handleCloseDialogs();
        fetchUsers();
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
        setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) return;
    setSaving(true);
    try {
        await apiClient.put(`/admin/users/${selectedUser.id}/password`, { password: newPassword });
        toast.success(`Password for '${selectedUser.username}' updated.`);
        handleCloseDialogs();
    } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
        setSaving(false);
    }
  };

  const handleUpdateInstanceLimit = async () => {
    if (!selectedUser || newInstanceLimit === '') return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/users/${selectedUser.id}/instance-limit`, { 
        instanceLimit: parseInt(newInstanceLimit, 10) 
      });
      toast.success(`Instance limit for '${selectedUser.username}' updated.`);
      handleCloseDialogs();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update limit.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>Users</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog('create')}>+ Create New User</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Instance Limit</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
                <TableCell>{user.instance_limit}</TableCell>
                <TableCell align="right">
                  <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={() => handleOpenDialog('permissions', user)}>Permissions</Button>
                  <Tooltip title="Edit Instance Limit"><IconButton size="small" onClick={() => handleOpenDialog('limit', user)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                  <Tooltip title="Change Password"><IconButton size="small" color="primary" onClick={() => handleOpenDialog('password', user)}><LockResetIcon fontSize="inherit" /></IconButton></Tooltip>
                  <Tooltip title="Delete User"><IconButton size="small" color="error" onClick={() => handleOpenDialog('delete', user)}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Permissions Management Dialog */}
      <Dialog open={dialogs.permissions} onClose={handleCloseDialogs} fullWidth maxWidth="xs">
        <DialogTitle>Manage Permissions for {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Grant access to tools:</Typography>
          <FormGroup>
            {tools.map(tool => (
              <FormControlLabel
                key={tool.id}
                control={<Checkbox checked={userPermissions.includes(tool.id)} onChange={(e) => handlePermissionChange(tool.id, e.target.checked)} />}
                label={tool.name}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant="contained" disabled={saving}>{saving ? <CircularProgress size={24} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={dialogs.create} onClose={handleCloseDialogs} fullWidth maxWidth="xs">
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
            <TextField autoFocus margin="dense" name="username" label="Username" type="text" fullWidth value={createUserForm.username} onChange={handleCreateFormChange} required />
            <TextField margin="dense" name="password" label="Password" type="password" fullWidth value={createUserForm.password} onChange={handleCreateFormChange} required />
            <FormControl fullWidth margin="normal" required>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select labelId="role-select-label" name="role" value={createUserForm.role} label="Role" onChange={handleCreateFormChange as any}>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                </Select>
            </FormControl>
            <TextField margin="dense" name="instanceLimit" label="Instance Limit" type="number" fullWidth value={createUserForm.instanceLimit} onChange={handleCreateFormChange} required />
            {createError && <Alert severity="error" sx={{mt: 2}}>{createError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={saving}>{saving ? <CircularProgress size={24} /> : 'Create User'}</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <Dialog open={dialogs.delete} onClose={handleCloseDialogs}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent><Typography>Are you sure you want to permanently delete the user <strong>{selectedUser?.username}</strong>? All of their data will be removed.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={saving}>{saving ? <CircularProgress size={24} /> : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={dialogs.password} onClose={handleCloseDialogs}>
        <DialogTitle>Change Password for {selectedUser?.username}</DialogTitle>
        <DialogContent>
            <TextField autoFocus margin="dense" name="newPassword" label="New Password" type="password" fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleUpdatePassword} variant="contained" disabled={saving || newPassword.length < 6}>{saving ? <CircularProgress size={24} /> : 'Update Password'}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Instance Limit Dialog */}
      <Dialog open={dialogs.limit} onClose={handleCloseDialogs}>
        <DialogTitle>Edit Instance Limit for {selectedUser?.username}</DialogTitle>
        <DialogContent>
            <TextField autoFocus margin="dense" name="newInstanceLimit" label="New Instance Limit" type="number" fullWidth
              value={newInstanceLimit} onChange={(e) => setNewInstanceLimit(e.target.value)} required
              InputProps={{ inputProps: { min: 0 } }}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleUpdateInstanceLimit} variant="contained" disabled={saving}>{saving ? <CircularProgress size={24} /> : 'Save Limit'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;