import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { Instance } from '../types';
import { InstanceManager } from '../components/user/InstanceManager';
import { listenForEvent, stopListeningForEvent } from '../services/socket';

const UserDashboardPage = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Instance[]>('/instances/sync');
      setInstances(response.data);
    } catch (err) {
      setError('Failed to fetch instances.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    const handleStatusUpdate = (data: { instanceName: string; status: string }) => {
      console.log('[socket]: Received status update on dashboard page:', data);
      
      // --- FIX: Use a functional update to avoid stale state ---
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
    return <div>Loading instances...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h2>User Dashboard</h2>
      <InstanceManager instances={instances} onInstanceUpdate={fetchInstances} />
    </div>
  );
};

export default UserDashboardPage;