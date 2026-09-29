import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { setUnauthorizedHandler } from '@/api/client';
import { BiometricLock } from '@/components/biometric-lock';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ConfigProvider } from '@/state/config';
import { SessionProvider, useSession } from '@/state/session';

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ConfigProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, status, signOut } = useSession();
  const rol = session?.rol ?? (session ? 'empleado' : null);

  // Si la API responde 401 (token expirado), se cierra la sesion automaticamente.
  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={rol === 'admin'}>
          <Stack.Screen name="(admin)" />
        </Stack.Protected>
        <Stack.Protected guard={rol === 'empleado'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      {status === 'loading' ? <LoadingOverlay /> : null}
      <BiometricLock />
    </>
  );
}
