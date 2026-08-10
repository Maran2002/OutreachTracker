import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/auth/session';
import dbConnect from '@/lib/db/mongodb';
import Admin from '@/models/Admin';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Topbar from '@/components/layout/Topbar';
import AdminProvider from '@/components/providers/AdminProvider';

export const metadata = {
  title: 'Admin Console — Cold Outreach Tracker',
};

export default async function AdminAppLayout({ children }) {
  const session = await getSessionFromCookies();

  if (!session || session.role !== 'admin') {
    redirect('/admin/login');
  }

  await dbConnect();
  const adminDoc = await Admin.findById(session.userId).lean();
  if (!adminDoc || adminDoc.status !== 'active') {
    redirect('/admin/login');
  }

  // Serialize Mongoose document fields
  const admin = {
    _id: adminDoc._id.toString(),
    name: adminDoc.name,
    email: adminDoc.email,
    permissions: adminDoc.permissions || [],
    avatar: adminDoc.avatar || '',
  };

  return (
    <AdminProvider admin={admin}>
      <div className="app-layout">
        <AdminSidebar />
        <div className="main-content">
          <Topbar userName={admin.name} role="admin" />
          <main className="page-content">{children}</main>
        </div>
      </div>
    </AdminProvider>
  );
}
