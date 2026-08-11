import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/auth/session';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import UserProvider from '@/components/providers/UserProvider';

export const metadata = {
  title: 'Dashboard — Cold Outreach Tracker',
};

export default async function UserAppLayout({ children }) {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'user') {
    redirect('/login');
  }

  const initialUser = { name: session.userName || session.email || 'User' };

  return (
    <UserProvider user={initialUser}>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Topbar userName={session.userName || session.email} role="user" />
          <main className="page-content">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
