// Paleta de colores premium para la app móvil
// Consistente con el frontend web de AlojamientoMR

const tintColorLight = '#c9a96e';
const tintColorDark = '#d4b87a';

export default {
  light: {
    text: '#1a1a2e',
    textSecondary: '#64748b',
    background: '#f8fafc',
    surface: '#ffffff',
    tint: tintColorLight,
    primary: '#c9a96e',
    primaryDark: '#b8943f',
    accent: '#e8d5b5',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    skeleton: '#e2e8f0',
    cardShadow: 'rgba(0,0,0,0.06)',
  },
  dark: {
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
    tint: tintColorDark,
    primary: '#d4b87a',
    primaryDark: '#c9a96e',
    accent: '#3b3520',
    border: '#334155',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
    skeleton: '#334155',
    cardShadow: 'rgba(0,0,0,0.3)',
  },
};
