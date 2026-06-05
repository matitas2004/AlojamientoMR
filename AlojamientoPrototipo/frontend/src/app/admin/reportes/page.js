'use client';
import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import useApi from '@/lib/useApi';
import { TrendingUp, DollarSign, CalendarDays, BarChart2 } from 'lucide-react';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORS = ['#c9a96e', '#1e293b', '#64748b', '#cbd5e1'];

export default function ReportesPage() {
  const { data: reservasRaw, isLoading: loadingReservas } = useApi('/reservas');
  const reservas = Array.isArray(reservasRaw) ? reservasRaw : [];

  // Métrica 1: Ingresos por Mes
  const ingresosData = useMemo(() => {
    const ingresos = new Array(12).fill(0);
    reservas.forEach(r => {
      if (r.fechaCheckIn && r.estado?.toLowerCase() !== 'cancelada') {
        const m = new Date(r.fechaCheckIn).getMonth();
        ingresos[m] += (r.total || 0);
      }
    });
    return MESES.map((mes, i) => ({ mes, ingresos: ingresos[i] }));
  }, [reservas]);

  // Métrica 2: Estado de Reservas
  const estadoData = useMemo(() => {
    const conteo = { Confirmada: 0, Pendiente: 0, Cancelada: 0, Completada: 0 };
    reservas.forEach(r => {
      const state = r.estado || 'Pendiente';
      const key = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
      if (conteo[key] !== undefined) conteo[key]++;
      else conteo['Pendiente']++; // fallback
    });
    return Object.entries(conteo).map(([name, value]) => ({ name, value })).filter(e => e.value > 0);
  }, [reservas]);

  // Métrica 3: KPIs Generales
  const kpis = useMemo(() => {
    const ingresosTotales = ingresosData.reduce((acc, curr) => acc + curr.ingresos, 0);
    const reservasValidas = reservas.filter(r => r.estado?.toLowerCase() !== 'cancelada').length;
    const ticketPromedio = reservasValidas > 0 ? (ingresosTotales / reservasValidas) : 0;
    
    return {
      ingresos: ingresosTotales,
      reservas: reservasValidas,
      ticketPromedio: ticketPromedio
    };
  }, [ingresosData, reservas]);

  if (loadingReservas) {
    return (
      <div className="animate-fadeInUp">
        <div className="page-header">
          <h1>Reportes y Analíticas</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
           {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <div>
          <h1>Reportes y Analíticas</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            Rendimiento general de los alojamientos y reservas
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-value">${kpis.ingresos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-label">Ingresos Totales (No Cancelados)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <CalendarDays size={24} />
          </div>
          <div>
            <div className="stat-value">{kpis.reservas}</div>
            <div className="stat-label">Reservas Efectivas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">${kpis.ticketPromedio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-label">Ticket Promedio por Reserva</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Gráfico de Ingresos (Area) */}
        <div className="card card-static" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BarChart2 size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Evolución de Ingresos</h3>
          </div>
          <div style={{ width: '100%', minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" aspect={1.8} minWidth={0} minHeight={0}>
              <AreaChart data={ingresosData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#c9a96e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ background: '#1a202c', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  formatter={(value) => [`$${value}`, 'Ingresos']}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#c9a96e" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Estado de Reservas (Pie) */}
        <div className="card card-static" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <PieChart size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Distribución por Estado</h3>
          </div>
          <div style={{ width: '100%', minWidth: 0, minHeight: 0, display: 'flex', justifyContent: 'center' }}>
            {estadoData.length === 0 ? (
              <div className="text-muted text-sm" style={{ padding: '2rem' }}>No hay datos suficientes</div>
            ) : (
              <ResponsiveContainer width="100%" aspect={1.8} minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1a202c', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
