'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './landing.module.css';

export default function LandingPage() {
  const router = useRouter();
  const [search, setSearch] = useState({ ubicacion: '', huespedes: 2 });

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/alojamientos?q=${search.ubicacion}&huespedes=${search.huespedes}`);
  };

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Descubre tu próximo <span>Hogar</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Explora la colección más exclusiva de hoteles, cabañas y departamentos diseñados para experiencias inolvidables.
          </p>

          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.searchGroup}>
              <label className={styles.searchLabel}>¿A dónde vas?</label>
              <input 
                type="text" 
                className={styles.searchInput} 
                placeholder="Ciudad, destino o hotel..." 
                value={search.ubicacion}
                onChange={(e) => setSearch({...search, ubicacion: e.target.value})}
              />
            </div>
            <div className={styles.searchGroup}>
              <label className={styles.searchLabel}>Huéspedes</label>
              <input 
                type="number" 
                min="1"
                className={styles.searchInput} 
                value={search.huespedes}
                onChange={(e) => setSearch({...search, huespedes: e.target.value})}
              />
            </div>
            <button type="submit" className={styles.searchBtn}>Buscar</button>
          </form>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Experiencias Únicas</h2>
          <p className={styles.sectionSubtitle}>
            Seleccionamos cuidadosamente cada propiedad para garantizar los más altos estándares de calidad y confort.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {/* Item 1: Large */}
          <div className={`${styles.bentoItem} ${styles.large}`}>
            <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop" alt="Resort de lujo" className={styles.bentoImage} />
            <div className={styles.bentoContent}>
              <h3>Resorts de Lujo</h3>
              <p>Desconecta del mundo en resorts con spa, piscinas infinitas y atención de primera clase.</p>
            </div>
          </div>
          
          {/* Item 2 */}
          <div className={styles.bentoItem}>
            <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop" alt="Apartamentos modernos" className={styles.bentoImage} />
            <div className={styles.bentoContent}>
              <h3>Apartamentos Urbanos</h3>
              <p>Ubicaciones céntricas con estilo y confort.</p>
            </div>
          </div>

          {/* Item 3 */}
          <div className={styles.bentoItem}>
            <img src="https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop" alt="Cabañas" className={styles.bentoImage} />
            <div className={styles.bentoContent}>
              <h3>Escapes Naturales</h3>
              <p>Cabañas rodeadas de naturaleza y paz.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
