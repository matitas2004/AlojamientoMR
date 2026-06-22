import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AuthContext = createContext(null);

const STORAGE_KEY = 'amr_session';

async function saveSession(data) {
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } else {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
  }
}

async function loadSession() {
  if (Platform.OS === 'web') {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function clearSession() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then(data => { if (data) setUser(data); })
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (token, userData) => {
    const session = { ...userData, token };
    await saveSession(session);
    setUser(session);
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
