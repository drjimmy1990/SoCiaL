export type UserRole = 'admin' | 'user';

export interface User {
  id: string; // Will be a UUID
  username: string;
  passwordHash: string; // We will never store plain text passwords
  role: UserRole;
  instanceLimit: number;
  createdAt: Date;
}