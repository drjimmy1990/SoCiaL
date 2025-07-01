import React, { useState, useEffect } from 'react';
import { Instance } from '../../types';
import apiClient from '../../api/apiClient';
import { listenForEvent, stopListeningForEvent } from '../../services/socket';

interface InstanceManagerProps {
  instances: Instance[];
  onInstanceUpdate: () => void;
}

export const InstanceManager: React.FC<InstanceManagerProps> = ({ instances, onInstanceUpdate }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceForQr, setInstanceForQr] = useState<Instance | null>(null);


  useEffect(() => {
    const handleStatusUpdate = (data: { instanceName: string; status: string }) => {
      if (instanceForQr && instanceForQr.system_name === data.instanceName && (data.status === 'open' || data.status === 'connected')) {
        setQrCode(null);
        setInstanceForQr(null);
        alert(`Instance "${data.instanceName}" connected successfully!`);
      }
    };

    listenForEvent('instance_status_update', handleStatusUpdate);

    return () => {
      stopListeningForEvent('instance_status_update');
    };
  }, [instanceForQr]);


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
      setShowCreateForm(false);
      setNewInstanceName('');
      setNewPhoneNumber('');
      onInstanceUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create instance.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (window.confirm(`Are you sure you want to delete this instance?`)) {
      try {
        await apiClient.delete(`/instances/${instanceId}`);
        alert('Instance deleted successfully.');
        onInstanceUpdate();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete instance.');
      }
    }
  };

  const handleConnect = async (instance: Instance) => {
    try {
      const response = await apiClient.get(`/instances/${instance.id}/connect`);
      setInstanceForQr(instance);
      setQrCode(response.data.qrCodeBase64);
    } catch (err: any) {
       alert(err.response?.data?.message || 'Failed to get QR Code.');
    }
  };

  const handleGetStatus = async (instanceId: string) => {
    try {
      const response = await apiClient.get(`/instances/${instanceId}/status`);
      const status = response.data.instance?.state || 'unknown';
      alert(`Instance status: ${status}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to get status.');
    }
  };
  
  const cardStyle: React.CSSProperties = { border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '5px' };
  const buttonStyle: React.CSSProperties = { cursor: 'pointer', marginRight: '0.5rem' };
  const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000};
  const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', padding: '2rem', textAlign: 'center', borderRadius: '5px'};

  return (
    <div>
      {qrCode && (
        <div style={modalOverlayStyle} onClick={() => setQrCode(null)}>
          <div style={modalContentStyle}>
            <h3>Scan with WhatsApp</h3>
            <img src={qrCode} alt="WhatsApp QR Code" />
            {/* FIX: Changed 'display_name' to 'instanceDisplayName' */}
            <p>Connecting instance: <strong>{instanceForQr?.instanceDisplayName}</strong></p>
            <p>Click anywhere to close.</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create New Instance'}
        </button>
        {showCreateForm && (
          <form onSubmit={handleCreateInstance} style={{ marginTop: '1rem', ...cardStyle }}>
            <h3>New Instance Details</h3>
            <input
              type="text"
              placeholder="Instance Name (e.g., My Shop)"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              required
              style={{ width: '95%', padding: '8px', marginBottom: '10px' }}
            />
            <input
              type="text"
              placeholder="WhatsApp Number (e.g., 15551234567)"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              required
              style={{ width: '95%', padding: '8px', marginBottom: '10px' }}
            />
            <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create & Get QR Code'}</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </form>
        )}
      </div>

      <h3>My Instances</h3>
      {instances.length === 0 ? (
        <p>You have no instances yet.</p>
      ) : (
        instances.map((inst) => (
          <div key={inst.id} style={cardStyle}>
            <h4>{inst.instanceDisplayName}</h4>
            <p>Status: <strong>{inst.status}</strong></p>
            <p>Phone: <strong>{inst.owner_jid ? inst.owner_jid.split('@')[0] : 'N/A'}</strong></p>
            <p>ID: {inst.system_name}</p>
            <button onClick={() => handleGetStatus(inst.id)} style={buttonStyle}>Get Status</button>
            <button onClick={() => handleConnect(inst)} style={buttonStyle}>Connect (QR)</button>
            <button onClick={() => handleDeleteInstance(inst.id)} style={{...buttonStyle, backgroundColor: '#ffdddd' }}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
};