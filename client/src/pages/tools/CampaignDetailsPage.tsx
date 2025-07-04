import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { listenForEvent, stopListeningForEvent } from '../../services/socket';

// --- TYPE DEFINITIONS ---
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
  
  // --- STATE MANAGEMENT ---
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATA FETCHING & REAL-TIME LISTENERS ---
  useEffect(() => {
    if (!campaignId) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/campaigns/${campaignId}`);
        setCampaign(response.data.campaign);
        setRecipients(response.data.recipients);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch campaign details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [campaignId]);

  const handleCampaignUpdate = useCallback((data: { campaignId: string; status: CampaignDetails['status'] }) => {
    console.log('[WebSocket] Received campaign_update:', data);
    if (data.campaignId === campaignId) {
      setCampaign(prev => prev ? { ...prev, status: data.status } : null);
    }
  }, [campaignId]);

  const handleProgressUpdate = useCallback((data: { campaignId: string; updatedRecipients: Recipient[] }) => {
    console.log('[WebSocket] Received campaign_progress:', data);
    if (data.campaignId === campaignId) {
        setRecipients(currentRecipients => {
            const updatedRecipientsMap = new Map(data.updatedRecipients.map(ur => [ur.id, ur]));
            return currentRecipients.map(r => {
                if (updatedRecipientsMap.has(r.id)) {
                    return { ...r, ...updatedRecipientsMap.get(r.id) };
                }
                return r;
            });
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

  // --- EVENT HANDLERS ---
  const handleControlClick = async (action: 'start' | 'pause' | 'stop') => {
    if (!campaignId) return;
    try {
      await apiClient.post(`/campaigns/${campaignId}/control`, { action });
      setCampaign(prev => {
        if (!prev) return null;
        let newStatus: CampaignDetails['status'] = prev.status;
        if (action === 'start') newStatus = 'running';
        else if (action === 'pause') newStatus = 'paused';
        else if (action === 'stop') newStatus = 'stopped';
        return { ...prev, status: newStatus };
      });
    } catch (err: any) {
        alert(err.response?.data?.message || `Failed to ${action} campaign.`);
    }
  };

  // --- HELPER CONSTANTS & FUNCTIONS (Must be before the return statement) ---
  const progressStats = useMemo(() => {
    const total = recipients.length;
    const sent = recipients.filter(r => r.status === 'sent').length;
    const failed = recipients.filter(r => r.status === 'failed').length;
    const pending = total - sent - failed;
    const percentage = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;
    return { total, sent, failed, pending, percentage };
  }, [recipients]);

  const statBoxStyle: React.CSSProperties = { flex: 1, border: '1px solid #eee', padding: '1rem', borderRadius: '8px', textAlign: 'center' };
  
  const getStatusChip = (status: string) => {
    const baseStyle: React.CSSProperties = {
      padding: '4px 12px',
      borderRadius: '16px',
      fontWeight: 500,
      fontSize: '1rem',
      textTransform: 'capitalize',
    };
    const statusStyles: { [key: string]: React.CSSProperties } = {
      draft: { backgroundColor: '#e0e0e0', color: '#333' },
      running: { backgroundColor: '#e3f2fd', color: '#1e88e5' },
      paused: { backgroundColor: '#fff8e1', color: '#fbc02d' },
      completed: { backgroundColor: '#e8f5e9', color: '#388e3c' },
      stopped: { backgroundColor: '#fbe9e7', color: '#d84315' },
      failed: { backgroundColor: '#ffcdd2', color: '#c62828' },
    };
    return <span style={{ ...baseStyle, ...statusStyles[status] }}>{status}</span>;
  };

  // --- RENDER LOGIC ---
  if (loading) return <div>Loading campaign details...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!campaign) return <div>Campaign not found.</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tools/campaigns">{'< Back to Campaigns'}</Link>
        <h2 style={{ marginTop: '0.5rem' }}>{campaign.name}</h2>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>
        <div style={{ flex: 2, border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
          <h4>Campaign Controls</h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => handleControlClick('start')} disabled={!['draft', 'paused', 'stopped'].includes(campaign.status)}>Start</button>
            <button onClick={() => handleControlClick('pause')} disabled={campaign.status !== 'running'}>Pause</button>
            <button onClick={() => handleControlClick('stop')} disabled={!['running', 'paused'].includes(campaign.status)}>Stop</button>
          </div>
        </div>
        <div style={{...statBoxStyle, backgroundColor: '#f9f9f9'}}>
            <h4 style={{margin:0}}>Status</h4>
            <div style={{fontSize: '1.5rem', margin: '0.5rem 0'}}>
              {getStatusChip(campaign.status)}
            </div>
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <h4>Progress ({progressStats.percentage}%)</h4>
        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', height: '20px' }}>
          <div style={{ width: `${progressStats.percentage}%`, backgroundColor: '#4caf50', height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
          <span>Sent: {progressStats.sent}</span>
          <span>Failed: {progressStats.failed}</span>
          <span>Pending: {progressStats.pending}</span>
          <strong>Total: {progressStats.total}</strong>
        </div>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
        <h4 style={{padding: '1rem', margin: 0, borderBottom: '1px solid #ccc'}}>Recipients</h4>
        <div style={{maxHeight: '500px', overflowY: 'auto'}}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', position: 'sticky', top: 0, backgroundColor: 'white' }}>
                <th style={{ padding: '12px' }}>Phone Number</th><th style={{ padding: '12px' }}>Status</th><th style={{ padding: '12px' }}>Log</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{r.phone_number}</td>
                  <td style={{ padding: '12px', textTransform: 'capitalize' }}>{r.status}</td>
                  <td style={{ padding: '12px', color: '#666', fontSize: '0.9rem' }}>{r.log_message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsPage;