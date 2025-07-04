import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Instance } from '../../types';
import { InstanceManager } from '../../components/user/InstanceManager';
import { listenForEvent, stopListeningForEvent } from '../../services/socket';

const WhatsAppConnectionPage = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false); // <-- NEW state for sync button
  const [error, setError] = useState<string | null>(null);

  // We change the name to reflect its purpose better
  const syncAllInstances = useCallback(async () => {
    // Use the 'syncing' state for the button, not the main page loader
    setSyncing(true); 
    setError(null);
    try {
      const response = await apiClient.get<Instance[]>('/instances/sync');
      setInstances(response.data);
    } catch (err) {
      setError('Failed to sync WhatsApp connections.');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Initial fetch on page load
  useEffect(() => {
    setLoading(true);
    syncAllInstances().finally(() => setLoading(false));
  }, [syncAllInstances]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link to="/dashboard">{'< Back to Dashboard'}</Link>
        {/* --- THIS IS THE NEW BUTTON --- */}
        <button onClick={syncAllInstances} disabled={syncing} style={{padding: '8px 12px'}}>
          {syncing ? 'Syncing...' : 'Sync All Statuses'}
        </button>
      </div>
      <h2>Tool: WhatsApp Connections</h2>
      <p>Manage your connected WhatsApp accounts here. Use the Sync button to fetch the latest statuses.</p>
      <InstanceManager instances={instances} onInstanceUpdate={syncAllInstances} />
    </div>
  );
};

export default WhatsAppConnectionPage;