import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  if (session.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={session.name} userRole={session.role} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
