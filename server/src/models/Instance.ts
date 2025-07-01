export type InstanceStatus = 'pending' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface Instance {
  id: string; // The unique instance name used by the Evolution API (e.g., user-abc-123)
  ownerId: string; // The ID of the user who owns this instance
  apiKey: string; // The specific API key for this instance
  status: InstanceStatus;
  createdAt: Date;

  // --- New Fields ---
  instanceDisplayName: string; // The custom, user-friendly name (e.g., "My Business Account")
  phoneNumber: string; // The WhatsApp number associated with this instance
}