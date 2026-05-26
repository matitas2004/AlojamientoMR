'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

export default function AuthGuard({ children, requiredRole }) {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    hydrate();
    setChecking(false);
  }, []);

  useEffect(() => {
    if (checking) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (requiredRole) {
      const rol = user?.rol?.toLowerCase();
      const allowed = Array.isArray(requiredRole)
        ? requiredRole.some((r) => r.toLowerCase() === rol)
        : requiredRole.toLowerCase() === rol;
      if (!allowed) {
        router.replace('/login');
      }
    }
  }, [checking, isAuthenticated, user]);

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner spinner-dark" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return children;
}
