
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Instance } from '../../types';
import { InstanceManager } from '../../components/user/InstanceManager';
import { listenForEvent, stopListeningForEvent } from '../../services/socket';

const WhatsAppConnectionPage = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // This is the same logic that was previously in UserDashboardPage
  const fetchInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // We still use the sync endpoint to get the latest data
      const response = await apiClient.get<Instance[]>('/instances/sync');
      setInstances(response.data);
    } catch (err) {
      setError('Failed to fetch WhatsApp connections.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // This is the same socket logic that was previously in UserDashboardPage
  useEffect(() => {
    const handleStatusUpdate = (data: { instanceName: string; status: string }) => {
      console.log('[socket]: Received status update on connections page:', data);
      setInstances(currentInstances =>
        currentInstances.map(inst =>
          inst.system_name === data.instanceName ? { ...inst, status: data.status } : inst
        )
      );
    };

    listenForEvent('instance_status_update', handleStatusUpdate);

    return () => {
      stopListeningForEvent('instance_status_update');
    };
  }, []);


  if (loading) {
    return <div>Loading your WhatsApp connections...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/dashboard">{'< Back to Dashboard'}</Link>
      </div>
      <h2>Tool: WhatsApp Connections</h2>
      <p>Manage your connected WhatsApp accounts here.</p>
      <InstanceManager instances={instances} onInstanceUpdate={fetchInstances} />
    </div>
  );
};

export default WhatsAppConnectionPage;