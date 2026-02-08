import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  if (session.role === 'admin') {
    redirect('/admin');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={session.name} userRole={session.role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
