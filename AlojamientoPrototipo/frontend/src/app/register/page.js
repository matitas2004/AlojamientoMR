'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreCompleto: '', email: '', password: '', confirmPassword: '', telefono: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombreCompleto || !form.email || !form.password) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      if (existingUsers.some(u => u.email === form.email.toLowerCase())) {
        setError('El correo electrónico ya está en uso');
        return;
      }
      
      const newUser = {
        id: Date.now(),
        nombreCompleto: form.nombreCompleto,
        email: form.email.toLowerCase(),
        rol: 'Administrador'
      };
      
      localStorage.setItem('mockUsers', JSON.stringify([...existingUsers, newUser]));
      
      toast.success('¡Cuenta creada exitosamente! Inicia sesión');
      router.push('/login');
    } catch (err) {
      setError('Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandSection}>
          <span className={styles.brandIcon}>✦</span>
          <h1 className={styles.brandTitle}>Crear Cuenta</h1>
          <p className={styles.brandSubtitle}>Únete a Homiya</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre completo *</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input type="text" name="nombreCompleto" className={styles.input} placeholder="Tu nombre" value={form.nombreCompleto} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Correo electrónico *</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input type="email" name="email" className={styles.input} placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña *</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input type={showPassword ? 'text' : 'password'} name="password" className={styles.input} placeholder="••••••" value={form.password} onChange={handleChange} />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirmar *</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" className={styles.input} placeholder="••••••" value={form.confirmPassword} onChange={handleChange} />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Teléfono (opcional)</label>
            <div className={styles.inputWrapper}>
              <Phone size={18} className={styles.inputIcon} />
              <input type="tel" name="telefono" className={styles.input} placeholder="0999999999" value={form.telefono} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <div className="spinner" /> : null}
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className={styles.footerLink}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
