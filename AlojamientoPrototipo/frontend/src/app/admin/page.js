'use client';
import { useMemo, useEffect, useState } from 'react';
import { Building2, BedDouble, CalendarDays, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useApi from '@/lib/useApi';
import useAuthStore from '@/store/useAuthStore';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { data: alojamientos, isLoading: loadingAloj } = useApi('/alojamientos', { fallbackData: [] });
  const { data: habitaciones } = useApi('/habitaciones', { fallbackData: [] });
  const [reservas, setReservas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(true);

  // Client-Side Aggregation para evitar el timeout de 10s de Vercel
  useEffect(() => {
    const fetchAllReservas = async () => {
      setLoadingReservas(true);
      try {
        const res = await fetch('/api/reservas');
        if (res.ok) {
          const todas = await res.json();
          setReservas(Array.isArray(todas) ? todas : []);
        } else {
          setReservas([]);
        }
      } catch (err) {
        console.error("Fetch API falló", err);
        setReservas([]);
      } finally {
        setLoadingReservas(false);
      }
    };
    fetchAllReservas();
  }, []);

  const stats = useMemo(() => {
    const alojArr = Array.isArray(alojamientos) ? alojamientos : [];
    const habArr = Array.isArray(habitaciones) ? habitaciones : [];
    const activas = reservas.filter(r => (r.estado || '').toLowerCase() !== 'cancelada');
    const ocupacion = habArr.length > 0 ? Math.round((activas.length / habArr.length) * 100) : 0;
    return {
      alojamientos: alojArr.length,
      habitaciones: habArr.length,
      reservas: reservas.length,
      ocupacion: Math.min(ocupacion, 100),
    };
  }, [alojamientos, habitaciones, reservas]);

  // Gráfico de reservas por mes (datos reales)
  const chartData = useMemo(() => {
    const counts = new Array(12).fill(0);
    reservas.forEach(r => {
      if (r.fechaCheckIn) {
        const m = new Date(r.fechaCheckIn).getMonth();
        counts[m]++;
      }
    });
    return MESES.map((mes, i) => ({ mes, reservas: counts[i] }));
  }, [reservas]);

  // Actividad reciente (últimas 4 reservas reales)
  const actividadReciente = useMemo(() => {
    return [...reservas]
      .sort((a, b) => new Date(b.fechaCreacion || b.fechaCheckIn || 0) - new Date(a.fechaCreacion || a.fechaCheckIn || 0))
      .slice(0, 4)
      .map(r => ({
        text: `Reserva ${r.codigo || '#' + r.reservaId} — ${r.nombreCliente || 'Cliente'}`,
        time: r.estado || '',
        type: (r.estado || '').toLowerCase() === 'confirmada' ? 'success' 
            : (r.estado || '').toLowerCase() === 'pendiente' ? 'warning' 
            : (r.estado || '').toLowerCase() === 'cancelada' ? 'danger' : 'primary',
      }));
  }, [reservas]);

  const loading = loadingAloj || loadingReservas;

  const statCards = [
    { label: 'Alojamientos', value: stats.alojamientos, icon: Building2, colorClass: 'blue' },
    { label: 'Habitaciones', value: stats.habitaciones, icon: BedDouble, colorClass: 'green' },
    { label: 'Reservas', value: stats.reservas, icon: CalendarDays, colorClass: 'amber' },
    { label: 'Ocupación', value: `${stats.ocupacion}%`, icon: TrendingUp, colorClass: 'purple' },
  ];

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            Bienvenido, {user?.nombreCompleto || 'Usuario'}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className={`stat-icon ${card.colorClass}`}>
                <Icon size={24} />
              </div>
              <div>
                {loading ? (
                  <div className="skeleton" style={{ width: 60, height: 32, marginBottom: 4 }} />
                ) : (
                  <div className="stat-value">{card.value}</div>
                )}
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card card-static" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Reservas por Mes</h3>
          <div style={{ width: '100%', minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" aspect={1.8} minWidth={0} minHeight={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1a202c', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  cursor={{ fill: 'rgba(201,169,110,0.1)' }}
                />
                <Bar dataKey="reservas" fill="#c9a96e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-static" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Actividad Reciente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(actividadReciente.length === 0
            ? [{ text: 'Sin actividad reciente', time: '—', type: 'primary' }]
            : actividadReciente
            ).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span className={`badge badge-${item.type}`} style={{ width: 8, height: 8, padding: 0, borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.8125rem' }}>{item.text}</span>
                <span className="text-muted text-sm">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
