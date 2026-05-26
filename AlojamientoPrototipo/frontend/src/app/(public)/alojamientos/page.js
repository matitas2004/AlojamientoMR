'use client';
import { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Waves, Car, PawPrint, Star } from 'lucide-react';
import useApi from '@/lib/useApi';
import styles from './alojamientos.module.css';

function AlojamientosContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: alojamientosRaw, isLoading: loadingAloj } = useApi('/alojamientos', { fallbackData: [] });
  const { data: habitaciones } = useApi('/habitaciones', { fallbackData: [] });

  // Calcular precios mínimos con useMemo para rendimiento
  const data = useMemo(() => {
    const arr = Array.isArray(alojamientosRaw) ? alojamientosRaw : [];
    const habs = Array.isArray(habitaciones) ? habitaciones : [];
    const preciosMap = {};
    habs.forEach(h => {
      if (!preciosMap[h.alojamientoId] || h.precioNoche < preciosMap[h.alojamientoId]) {
        preciosMap[h.alojamientoId] = h.precioNoche;
      }
    });
    return arr.map(a => ({ ...a, precioMinimo: preciosMap[a.alojamientoId] || (45 + (a.alojamientoId % 5) * 10) }));
  }, [alojamientosRaw, habitaciones]);

  const loading = loadingAloj && data.length === 0;

  const filtered = data.filter(a => {
    if (!query) return true;
    const term = query.toLowerCase();
    return (a.nombre?.toLowerCase().includes(term) || a.ciudad?.toLowerCase().includes(term));
  });

  // Imágenes placeholder aleatorias
  const placeholderImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c0d5bf8f?q=80&w=800&auto=format&fit=crop'
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Encuentra tu alojamiento ideal</h1>
        <p className="text-secondary">
          {query ? `Resultados para "${query}"` : 'Explora nuestras mejores propiedades seleccionadas para ti.'}
        </p>
      </div>

      <div className={styles.filters}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="input-label" style={{ display: 'block', marginBottom: 4 }}>Ubicación o Nombre</label>
          <input className="input-field" defaultValue={query} placeholder="Ej: Quito, Hotel..." readOnly />
        </div>
        <div style={{ width: 150 }}>
          <label className="input-label" style={{ display: 'block', marginBottom: 4 }}>Tipo</label>
          <select className="input-field">
            <option>Todos</option>
            <option>Hotel</option>
            <option>Departamento</option>
            <option>Cabaña</option>
          </select>
        </div>
        <div style={{ width: 120 }}>
          <label className="input-label" style={{ display: 'block', marginBottom: 4 }}>Precio Max.</label>
          <select className="input-field">
            <option>Sin límite</option>
            <option>$50</option>
            <option>$100</option>
            <option>$200</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={styles.card}>
              <div className="skeleton" style={{ height: 220 }} />
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="skeleton" style={{ height: 24, width: '80%' }} />
                <div className="skeleton" style={{ height: 16, width: '40%' }} />
                <div className="skeleton" style={{ height: 40, marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '6rem 0' }}>
          <h3>No encontramos alojamientos</h3>
          <p>Intenta buscando con otros términos</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item, idx) => (
            <div key={item.alojamientoId} className={styles.card}>
              <div className={styles.imageBox}>
                <img src={placeholderImages[idx % 4]} alt={item.nombre} className={styles.image} loading="lazy" />
                <div className={styles.badge}><Star size={12} style={{ display: 'inline', marginRight: 4, color: '#d97706', fill: '#d97706' }} />4.8</div>
              </div>
              <div className={styles.content}>
                <div className={styles.location}>
                  <MapPin size={14} /> {item.ciudad || 'Ubicación Múltiple'}
                </div>
                <h3 className={styles.name}>{item.nombre}</h3>
                
                <div className={styles.amenities}>
                  {item.tienePiscina && <span className={styles.amenityIcon}><Waves size={14} /> Piscina</span>}
                  {item.tieneParqueadero && <span className={styles.amenityIcon}><Car size={14} /> Parking</span>}
                  {item.admiteMascotas && <span className={styles.amenityIcon}><PawPrint size={14} /> Mascotas</span>}
                </div>

                <div className={styles.footer}>
                  <div>
                    <div className={styles.priceLabel}>Desde</div>
                    <div className={styles.price}>${item.precioMinimo?.toFixed(2)}<span className={styles.priceLabel}>/noche</span></div>
                  </div>
                  <Link href={`/alojamientos/${item.alojamientoId}`} className="btn btn-primary">
                    Ver Detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AlojamientosPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem' }}><div className="spinner spinner-dark" /></div>}>
      <AlojamientosContent />
    </Suspense>
  );
}
