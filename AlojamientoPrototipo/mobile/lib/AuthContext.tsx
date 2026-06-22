import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
  token: string;
  rol: string;
  nombreCompleto: string;
  email?: string;
  usuarioId?: number;
  clienteId?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: Omit<User, 'token'>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hidratar sesión al iniciar la app
  useEffect(() => {
    (async () => {
      try {
        let stored = null;
        if (Platform.OS === 'web') {
          stored = localStorage.getItem('alojamiento_session');
        } else {
          stored = await SecureStore.getItemAsync('alojamiento_session');
        }
        
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // Sesión corrupta, limpiar
        if (Platform.OS === 'web') {
          localStorage.removeItem('alojamiento_session');
        } else {
          await SecureStore.deleteItemAsync('alojamiento_session');
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (token: string, userData: Omit<User, 'token'>) => {
    const fullUser: User = { ...userData, token };
    if (Platform.OS === 'web') {
      localStorage.setItem('alojamiento_session', JSON.stringify(fullUser));
    } else {
      await SecureStore.setItemAsync('alojamiento_session', JSON.stringify(fullUser));
    }
    setUser(fullUser);
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('alojamiento_session');
    } else {
      await SecureStore.deleteItemAsync('alojamiento_session');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
