import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { setAuthToken } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  // Sincronizar token en el cliente axios cuando cambia el usuario
  useEffect(() => {
    setAuthToken(user?.token ?? null);
  }, [user]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="alojamiento/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="checkout/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="factura/[id]" options={{ animation: 'fade' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
