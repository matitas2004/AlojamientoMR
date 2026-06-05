'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, BedDouble, Users, CalendarDays, LogOut, Menu, X, ExternalLink, BarChart3 } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/alojamientos', label: 'Alojamientos', icon: Building2 },
  { href: '/admin/habitaciones', label: 'Habitaciones', icon: BedDouble },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users, adminOnly: true },
  { href: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
  { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.rol?.toLowerCase() === 'administrador' || user?.rol?.toLowerCase() === 'admin';
  const initials = user?.nombreCompleto?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      <button className={styles.mobileToggle} onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <Link href="/admin" className={styles.brandLink}>
            <span className={styles.brandIcon}>✦</span>
            <div>
              <span className={styles.brandName}>Homiya</span>
              <span className={styles.brandSub}>Panel de Gestión</span>
            </div>
          </Link>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Menú Principal</div>
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className={styles.navLinkIcon} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={styles.userSection}>
          <Link href="/" className={styles.navLink} style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>
            <ExternalLink size={18} />
            Ver Web Pública
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.nombreCompleto || 'Usuario'}</div>
              <div className={styles.userRole}>{user?.rol || 'Sin rol'}</div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
