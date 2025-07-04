import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

// Define the type for a campaign object returned by our API
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
    const baseStyle: React.CSSProperties = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontWeight: 500,
      fontSize: '0.8rem',
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

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <Link to="/dashboard">{'< Back to Dashboard'}</Link>
          <h2 style={{ marginTop: '0.5rem' }}>Campaign Manager</h2>
        </div>
        <button onClick={() => navigate('/tools/campaigns/new')} style={{ padding: '10px 15px', fontSize: '1rem' }}>
          + Create New Campaign
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Campaign Name</th>
              <th style={{ padding: '12px' }}>Instance</th>
              <th style={{ padding: '12px' }}>Progress</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  onClick={() => navigate(`/tools/campaigns/${campaign.id}`)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px', fontWeight: 500 }}>{campaign.name}</td>
                  <td style={{ padding: '12px' }}>{campaign.instance_name}</td>
                  <td style={{ padding: '12px' }}>{campaign.sent_recipients} / {campaign.total_recipients}</td>
                  <td style={{ padding: '12px' }}>{getStatusChip(campaign.status)}</td>
                  <td style={{ padding: '12px' }}>{new Date(campaign.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  You haven't created any campaigns yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignsDashboardPage;