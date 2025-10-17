import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { cookies } from 'next/headers';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookie = await cookies();

  const userId = cookie.get('userId')?.value;

  if (userId) {
    const user = await fetchQuery(api.user.getUserDetails, { userId: userId as Id<'users'> });

    if (user) {
      return redirect('/dashboard');
    }
  }

  return children;
}
