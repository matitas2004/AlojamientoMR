'use client';
import { useMemo } from 'react';
import { Building2, BedDouble, CalendarDays, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useApi from '@/lib/useApi';
import useAuthStore from '@/store/useAuthStore';

const chartData = [
  { mes: 'Ene', reservas: 12 }, { mes: 'Feb', reservas: 19 }, { mes: 'Mar', reservas: 8 },
  { mes: 'Abr', reservas: 25 }, { mes: 'May', reservas: 32 }, { mes: 'Jun', reservas: 18 },
];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { data: alojamientos, isLoading: loadingAloj } = useApi('/alojamientos', { fallbackData: [] });
  const { data: habitaciones } = useApi('/habitaciones', { fallbackData: [] });

  const stats = useMemo(() => {
    const alojArr = Array.isArray(alojamientos) ? alojamientos : [];
    const habArr = Array.isArray(habitaciones) ? habitaciones : [];
    return {
      alojamientos: alojArr.length,
      habitaciones: habArr.length,
      reservas: 0,
      ocupacion: 72,
    };
  }, [alojamientos, habitaciones]);

  const loading = loadingAloj && stats.alojamientos === 0;

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
          <div style={{ height: 280, minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
            {[
              { text: 'Nuevo alojamiento registrado', time: 'Hace 2 horas', type: 'success' },
              { text: 'Habitación actualizada', time: 'Hace 5 horas', type: 'primary' },
              { text: 'Reserva confirmada #1025', time: 'Ayer', type: 'warning' },
              { text: 'Nuevo colaborador asignado', time: 'Hace 2 días', type: 'primary' },
            ].map((item, i) => (
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
