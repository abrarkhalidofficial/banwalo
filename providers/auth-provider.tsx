'use client';

import { Id } from '@/convex/_generated/dataModel';
import { createContext } from 'react';

export const AuthContext = createContext<{
  id: Id<'users'>;
  name: string;
} | null>(null);

export function AuthProvider({ children, user }: { children: React.ReactNode; user: { id: Id<'users'>; name: string } }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}
