import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Instance } from '../../types';

// --- NEW MUI IMPORTS ---
import {
  Box, Button, Container, Typography, Paper, TextField, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, RadioGroup, Radio, IconButton, Link, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
// --- END OF MUI IMPORTS ---
import toast from 'react-hot-toast';


interface MessagePart {
  type: 'text' | 'image' | 'audio';
  content?: string;
  url?: string;
  caption?: string;
}

const CreateCampaignPage = () => {
  const navigate = useNavigate();

  // Form State
  const [instances, setInstances] = useState<Instance[]>([]);
  const [name, setName] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [messages, setMessages] = useState<MessagePart[]>([{ type: 'text', content: '' }]);
  const [numbers, setNumbers] = useState('');
  const [usePlaceholders, setUsePlaceholders] = useState(false);
  const [delaySpeed, setDelaySpeed] = useState('medium');
  const [delayFrom, setDelayFrom] = useState('5');
  const [delayTo, setDelayTo] = useState('10');
  const [sendingMode, setSendingMode] = useState('internal');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await apiClient.get<Instance[]>('/instances');
        setInstances(response.data);
        if (response.data.length > 0) {
          setInstanceId(response.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch instances', err);
        setError('Could not load your instances. Please try again later.');
      }
    };
    fetchInstances();
  }, []);

  const handleAddMessagePart = () => {
    setMessages([...messages, { type: 'text', content: '' }]);
  };

  const handleRemoveMessagePart = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleMessageChange = (index: number, field: keyof MessagePart | 'type', value: string) => {
    const newMessages = [...messages];
    const messageToUpdate = { ...newMessages[index] };
    
    if (field === 'type') {
      messageToUpdate.type = value as MessagePart['type'];
      messageToUpdate.content = '';
      messageToUpdate.url = '';
      messageToUpdate.caption = '';
    } else {
      (messageToUpdate as any)[field] = value;
    }
    
    newMessages[index] = messageToUpdate;
    setMessages(newMessages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !instanceId || messages.length === 0 || !numbers) {
      setError('Please fill out all required fields.');
      setLoading(false);
      return;
    }

    const processedNumbers = numbers.split('\n').map(n => n.trim()).filter(n => n);
    if (processedNumbers.length === 0) {
        setError('Please provide at least one valid phone number.');
        setLoading(false);
        return;
    }

    const campaignData = {
      name, instanceId, messages, numbers: processedNumbers, usePlaceholders, delaySpeed,
      delayFromSeconds: parseInt(delayFrom, 10),
      delayToSeconds: parseInt(delayTo, 10),
      sendingMode,
    };

    try {
      await apiClient.post('/campaigns', campaignData);
      // We'll replace this alert later with a toast notification
      toast.success('Campaign created successfully as a draft!');
      navigate('/tools/campaigns');
    } catch (err: any) {
      console.error('Failed to create campaign', err);
      const errorMsg = err.response?.data?.errors?.formErrors?.[0] || err.response?.data?.message || 'An unknown error occurred.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/tools/campaigns">{'< Back to Campaigns'}</Link>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 1 }}>
          Create New Campaign
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>1. Campaign Setup</Typography>
          <TextField label="Campaign Name" value={name} onChange={e => setName(e.target.value)} fullWidth required margin="normal" />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="instance-select-label">Sending Instance</InputLabel>
            <Select labelId="instance-select-label" value={instanceId} label="Sending Instance" onChange={e => setInstanceId(e.target.value)}>
              {instances.map(inst => <MenuItem key={inst.id} value={inst.id}>{inst.instanceDisplayName} ({inst.status})</MenuItem>)}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>2. Audience</Typography>
          <TextField label="Phone Numbers (one per line)" multiline rows={6} value={numbers} onChange={e => setNumbers(e.target.value)} fullWidth required margin="normal" />
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>3. Message Content</Typography>
          {messages.map((part, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, position: 'relative' }}>
              <IconButton onClick={() => handleRemoveMessagePart(index)} size="small" sx={{ position: 'absolute', top: 8, right: 8 }}><DeleteIcon /></IconButton>
              <Typography variant="subtitle1" gutterBottom>Message Part #{index + 1}</Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select value={part.type} label="Type" onChange={e => handleMessageChange(index, 'type', e.target.value)}>
                  <MenuItem value="text">Text</MenuItem><MenuItem value="image">Image</MenuItem><MenuItem value="audio">Audio</MenuItem>
                </Select>
              </FormControl>
              {part.type === 'text' && <TextField label="Text Message" multiline rows={3} value={part.content} onChange={e => handleMessageChange(index, 'content', e.target.value)} fullWidth margin="normal" placeholder="You can use {{name}} as a placeholder." />}
              {part.type === 'image' && <>
                <TextField label="Image URL" value={part.url} onChange={e => handleMessageChange(index, 'url', e.target.value)} fullWidth margin="normal" />
                <TextField label="Optional Caption" value={part.caption} onChange={e => handleMessageChange(index, 'caption', e.target.value)} fullWidth margin="normal" />
              </>}
              {part.type === 'audio' && <TextField label="Audio URL" value={part.url} onChange={e => handleMessageChange(index, 'url', e.target.value)} fullWidth margin="normal" />}
            </Paper>
          ))}
          <Button onClick={handleAddMessagePart} variant="outlined">Add Message Part</Button>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>4. Delivery Settings</Typography>
          <FormControlLabel control={<Checkbox checked={usePlaceholders} onChange={e => setUsePlaceholders(e.target.checked)} />} label="Personalize with {{name}} (slower)" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Typing Speed</InputLabel>
            <Select value={delaySpeed} label="Typing Speed" onChange={e => setDelaySpeed(e.target.value)}><MenuItem value="fast">Fast</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="slow">Slow</MenuItem><MenuItem value="safe">Safe</MenuItem></Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
            <TextField label="Delay From (sec)" type="number" value={delayFrom} onChange={e => setDelayFrom(e.target.value)} />
            <Typography>to</Typography>
            <TextField label="Delay To (sec)" type="number" value={delayTo} onChange={e => setDelayTo(e.target.value)} />
          </Box>
          <FormControl>
            <Typography variant="subtitle2">Sending Method</Typography>
            <RadioGroup row value={sendingMode} onChange={e => setSendingMode(e.target.value)}>
              <FormControlLabel value="internal" control={<Radio />} label="Internal Service" />
              <FormControlLabel value="n8n" control={<Radio />} label="n8n Workflow" />
            </RadioGroup>
          </FormControl>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Campaign as Draft'}
        </Button>
      </Box>
    </Container>
  );
};

export default CreateCampaignPage;