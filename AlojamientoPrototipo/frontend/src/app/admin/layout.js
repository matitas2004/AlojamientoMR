'use client';
import AdminLayout from '@/components/AdminLayout';
import AuthGuard from '@/components/AuthGuard';

export default function AdminRootLayout({ children }) {
  return (
    <AuthGuard requiredRole={['administrador', 'admin', 'colaborador']}>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  );
}
