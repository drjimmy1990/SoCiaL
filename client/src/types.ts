// This file will contain shared type definitions used across the frontend.

/**
 * Represents the structure of a User object as returned by our backend API.
 */
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

/**
 * Represents a single WhatsApp instance record.
 * This matches the structure we defined in the backend model.
 */
// In client/src/types.ts
export interface Instance {
  id: string; 
  ownerId: string;
  apiKey: string;
  status: string; // Changed to string to accept any status from backend
  createdAt: Date;
  instanceDisplayName: string;
  phoneNumber: string;
  system_name: string; // <-- FIX: Added the missing property
  owner_jid?: string;
  profile_name?: string;
}