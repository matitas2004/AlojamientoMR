import './globals.css';
import { Toaster } from 'react-hot-toast';
import WakeupPing from '@/components/WakeupPing';

export const metadata = {
  title: 'Homiya - Panel de Gestión',
  description: 'Panel administrativo para gestión de alojamientos, habitaciones y reservas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a202c',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
        <WakeupPing />
        {children}
      </body>
    </html>
  );
}
