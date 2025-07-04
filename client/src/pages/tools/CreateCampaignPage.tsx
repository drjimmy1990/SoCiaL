import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Instance } from '../../types'; // We can reuse the Instance type

// Define the structure for a single message part in our form state
interface MessagePart {
  type: 'text' | 'image' | 'audio';
  content?: string; // For text
  url?: string;     // For media
  caption?: string; // For images
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

  // Fetch available instances on component mount
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await apiClient.get<Instance[]>('/instances');
        setInstances(response.data);
        if (response.data.length > 0) {
          setInstanceId(response.data[0].id); // Default to the first instance
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
    const newMessages = messages.filter((_, i) => i !== index);
    setMessages(newMessages);
  };

  const handleMessageChange = (index: number, field: keyof MessagePart, value: string) => {
    const newMessages = [...messages];
    const messageToUpdate = { ...newMessages[index], [field]: value };
    // When changing type, reset other fields
    if (field === 'type') {
      messageToUpdate.content = '';
      messageToUpdate.url = '';
      messageToUpdate.caption = '';
    }
    newMessages[index] = messageToUpdate;
    setMessages(newMessages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
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
      name,
      instanceId,
      messages: messages.map(({ type, content, url, caption }) => ({ type, content, url, caption })),
      numbers: processedNumbers,
      usePlaceholders,
      delaySpeed,
      delayFromSeconds: parseInt(delayFrom, 10),
      delayToSeconds: parseInt(delayTo, 10),
      sendingMode,
    };

    try {
      await apiClient.post('/campaigns', campaignData);
      alert('Campaign created successfully as a draft!');
      navigate('/tools/campaigns');
    } catch (err: any) {
      console.error('Failed to create campaign', err);
      const errorMsg = err.response?.data?.errors?.formErrors?.[0] || err.response?.data?.message || 'An unknown error occurred.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- STYLING (for readability) ---
  const sectionStyle: React.CSSProperties = { border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '1rem' };
  const labelStyle: React.CSSProperties = { fontWeight: 500, marginBottom: '0.5rem', display: 'block' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tools/campaigns">{'< Back to Campaigns'}</Link>
        <h2 style={{ marginTop: '0.5rem' }}>Create New Campaign</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* --- SECTION 1: SETUP (Unchanged) --- */}
        <div style={sectionStyle}>
          <h3>1. Campaign Setup</h3>
          <label style={labelStyle}>Campaign Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g., Q4 Holiday Promotion" required />
          
          <label style={labelStyle}>Sending Instance</label>
          <select value={instanceId} onChange={e => setInstanceId(e.target.value)} style={inputStyle} required>
            {instances.length === 0 && <option>Loading instances...</option>}
            {instances.map(inst => <option key={inst.id} value={inst.id}>{inst.instanceDisplayName} ({inst.status})</option>)}
          </select>
        </div>

        {/* --- SECTION 2: AUDIENCE (Unchanged) --- */}
        <div style={sectionStyle}>
          <h3>2. Audience</h3>
          <label style={labelStyle}>Phone Numbers (one per line)</label>
          <textarea value={numbers} onChange={e => setNumbers(e.target.value)} style={{...inputStyle, height: '150px', fontFamily: 'monospace'}} placeholder="201099238811
15551234567" required />
        </div>

        {/* --- SECTION 3: MESSAGES (Unchanged) --- */}
        <div style={sectionStyle}>
          <h3>3. Message Content</h3>
          {messages.map((part, index) => (
            <div key={index} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', position: 'relative' }}>
              <button type="button" onClick={() => handleRemoveMessagePart(index)} style={{ position: 'absolute', top: 5, right: 5, cursor: 'pointer' }}>X</button>
              <label style={labelStyle}>Message Part #{index + 1}</label>
              <select value={part.type} onChange={e => handleMessageChange(index, 'type', e.target.value)} style={inputStyle}>
                <option value="text">Text Message</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
              </select>
              {part.type === 'text' && <textarea value={part.content} onChange={e => handleMessageChange(index, 'content', e.target.value)} style={{...inputStyle, height: '100px'}} placeholder="Enter your text message here. You can use {{name}} as a placeholder." />}
              {part.type === 'image' && (
                <>
                  <input type="text" value={part.url} onChange={e => handleMessageChange(index, 'url', e.target.value)} style={inputStyle} placeholder="Image URL (e.g., https://.../image.png)" />
                  <input type="text" value={part.caption} onChange={e => handleMessageChange(index, 'caption', e.target.value)} style={inputStyle} placeholder="Optional: Image Caption" />
                </>
              )}
              {part.type === 'audio' && <input type="text" value={part.url} onChange={e => handleMessageChange(index, 'url', e.target.value)} style={inputStyle} placeholder="Audio URL (e.g., https://.../sound.mp3)" />}
            </div>
          ))}
          <button type="button" onClick={handleAddMessagePart}>+ Add Another Message Part</button>
        </div>
        
        {/* --- SECTION 4: DELIVERY SETTINGS (Updated) --- */}
        <div style={sectionStyle}>
          <h3>4. Delivery Settings</h3>
          <div style={{ marginBottom: '1rem' }}><label><input type="checkbox" checked={usePlaceholders} onChange={e => setUsePlaceholders(e.target.checked)} /> Personalize with {'{{name}}'} (slower)</label></div>
          
          <label style={labelStyle}>Typing Speed (Humanization)</label>
          <select value={delaySpeed} onChange={e => setDelaySpeed(e.target.value)} style={inputStyle}>
            <option value="fast">Fast</option><option value="medium">Medium</option><option value="slow">Slow</option><option value="safe">Safe (Most Human-like)</option>
          </select>

          <label style={labelStyle}>Delay Between Messages (in seconds)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <input type="number" value={delayFrom} onChange={e => setDelayFrom(e.target.value)} style={{...inputStyle, marginBottom: 0 }} placeholder="From" />
            <span>to</span>
            <input type="number" value={delayTo} onChange={e => setDelayTo(e.target.value)} style={{...inputStyle, marginBottom: 0 }} placeholder="To" />
          </div>

          {/* --- THIS IS THE FIX --- */}
          <label style={labelStyle}>Sending Method</label>
          <div>
            <label style={{ marginRight: '1rem' }}><input type="radio" name="sendingMode" value="internal" checked={sendingMode === 'internal'} onChange={e => setSendingMode(e.target.value)} /> Internal Service</label>
            <label><input type="radio" name="sendingMode" value="n8n" checked={sendingMode === 'n8n'} onChange={e => setSendingMode(e.target.value)} /> n8n Workflow</label>
          </div>
          {/* --- END OF FIX --- */}

        </div>

        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', fontSize: '1.2rem', cursor: 'pointer' }}>
          {loading ? 'Saving...' : 'Save Campaign as Draft'}
        </button>
      </form>
    </div>
  );
};
export default CreateCampaignPage;