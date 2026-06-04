'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Para el prototipo: login simulado basado en email
      // En producción se conectaría a la API de Usuarios
      const defaultUsers = [
        { id: 1, nombreCompleto: 'Mathias Rivera', email: 'admin@alojamiento.com', rol: 'Administrador' },
        { id: 2, nombreCompleto: 'Carlos López', email: 'colaborador@alojamiento.com', rol: 'Colaborador', socioId: 1 }
      ];

      const localUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      const allUsers = [...defaultUsers, ...localUsers];

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800));

      const user = allUsers.find(u => u.email === form.email.toLowerCase());
      if (user && form.password.length >= 3) {
        const fakeToken = btoa(JSON.stringify({ sub: user.id, email: user.email, rol: user.rol, exp: Date.now() + 86400000 }));
        login(fakeToken, user);
        toast.success(`¡Bienvenido, ${user.nombreCompleto}!`);
        router.push('/admin');
      } else {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandSection}>
          <span className={styles.brandIcon}>✦</span>
          <h1 className={styles.brandTitle}>Homiya</h1>
          <p className={styles.brandSubtitle}>Panel de Gestión</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Correo electrónico</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                name="email"
                className={styles.input}
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={styles.input}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <div className="spinner" /> : null}
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" className={styles.footerLink}>Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
}
