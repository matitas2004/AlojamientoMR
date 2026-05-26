import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('alojamiento_token', token);
      localStorage.setItem('alojamiento_user', JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('alojamiento_token');
      localStorage.removeItem('alojamiento_user');
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('alojamiento_token');
    const userStr = localStorage.getItem('alojamiento_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch {
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },

  get isAdmin() {
    const user = get().user;
    return user?.rol?.toLowerCase() === 'administrador' || user?.rol?.toLowerCase() === 'admin';
  },

  get isColaborador() {
    const user = get().user;
    return user?.rol?.toLowerCase() === 'colaborador';
  },
}));

export default useAuthStore;
