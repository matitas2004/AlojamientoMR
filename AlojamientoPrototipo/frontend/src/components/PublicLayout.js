'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import styles from './PublicLayout.module.css';

export default function PublicLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const pathname = usePathname();

  return (
    <>
      <header className={styles.navbar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon}>✦</span>
          <span className={styles.brandName}>Homiya</span>
        </Link>

        <nav className={styles.navLinks}>
          <Link href="/" className={styles.navLink} style={{ color: pathname === '/' ? 'var(--color-primary)' : '' }}>Inicio</Link>
          <Link href="/alojamientos" className={styles.navLink} style={{ color: pathname === '/alojamientos' ? 'var(--color-primary)' : '' }}>Alojamientos</Link>
          <Link href="/mis-reservas" className={styles.navLink}>Mis Reservas</Link>
        </nav>

        <div className={styles.authButtons}>
          {isAuthenticated ? (
            <>
              {user?.rol?.toLowerCase() !== 'cliente' && (
                <Link href="/admin" className="btn btn-outline btn-sm">Panel Admin</Link>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                <span className="text-sm text-secondary" style={{ display: 'none' }}>{user?.nombreCompleto}</span>
                <button onClick={logout} className="btn btn-ghost btn-sm text-danger">Salir</button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Iniciar Sesión</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Registrarse</Link>
            </>
          )}
        </div>
      </header>

      <main className={styles.mainContent}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.brand} style={{ color: '#fff', marginBottom: '1rem' }}>
              <span className={styles.brandIcon}>✦</span>
              <span className={styles.brandName}>Homiya</span>
            </div>
            <p className="text-sm text-muted">
              Encuentra el alojamiento perfecto para tu próxima aventura. Lujo, confort y las mejores experiencias.
            </p>
          </div>
          <div>
            <h4 className={styles.footerTitle}>Explorar</h4>
            <ul className={styles.footerList}>
              <li><Link href="/alojamientos">Hoteles</Link></li>
              <li><Link href="/alojamientos">Departamentos</Link></li>
              <li><Link href="/alojamientos">Cabañas</Link></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.footerTitle}>Soporte</h4>
            <ul className={styles.footerList}>
              <li><Link href="#">Preguntas Frecuentes</Link></li>
              <li><Link href="#">Términos de Servicio</Link></li>
              <li><Link href="#">Política de Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} Homiya. Todos los derechos reservados.
        </div>
      </footer>
    </>
  );
}
