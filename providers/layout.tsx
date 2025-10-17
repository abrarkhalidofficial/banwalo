import { AuthProvider } from './auth-provider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { cookies } from 'next/headers';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookie = await cookies();

  const userId = cookie.get('userId')?.value;

  if (!userId) {
    return redirect('/sign-in');
  }

  const user = await fetchQuery(api.user.getUserDetails, { userId: userId as Id<'users'> });

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <AuthProvider user={user}>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthProvider>
  );
}
