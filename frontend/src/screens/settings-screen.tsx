/** Pantalla compartida de Ajustes (la usan el rol empleado y el rol admin). */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';


import { getBiometricCapabilities } from '@/biometrics/provider';
import type { BiometricCapabilities } from '@/biometrics/types';
import { EmployeeCard } from '@/components/employee-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Pill } from '@/components/ui/pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RefreshableScroll } from '@/components/ui/refreshable-scroll';
import type { AppConfig, BiometricPreference } from '@/config';
import { Spacing, TopInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

const PREF_LABEL: Record<BiometricPreference, string> = {
  auto: 'Automático',
  fingerprint: 'Huella',
  face: 'Rostro',
};

export default function SettingsScreen() {
  const theme = useTheme();
  const { config, updateConfig } = useConfig();
  const { session, signOut } = useSession();
  const [caps, setCaps] = useState<BiometricCapabilities>({
    hardwareSupported: false,
    fingerprintAvailable: false,
    faceAvailable: false,
  });

  useEffect(() => {
    getBiometricCapabilities().then(setCaps).catch(() => {});
  }, []);

  const cambiar = (patch: Partial<AppConfig>) => {
    updateConfig(patch);
  };

  return (
    <RefreshableScroll contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        <ThemedText type="h1" style={styles.title}>
          Ajustes
        </ThemedText>

        {session ? (
          <>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Sesión
            </ThemedText>
            {session.rol === 'admin' && session.admin ? (
              <ThemedView type="backgroundElement" style={styles.sessionCard}>
                <View style={[styles.adminInitials, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold" style={styles.adminInitialsText}>
                    {session.admin.nombre.slice(0, 2).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.sessionInfo}>
                  <ThemedText type="smallBold">{session.admin.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    @{session.admin.usuario} · rol: administrador
                  </ThemedText>
                </View>
              </ThemedView>
            ) : session.empleado ? (
              <EmployeeCard empleado={session.empleado} />
            ) : null}
            <PrimaryButton variant="danger" title="Cerrar sesión" onPress={() => signOut()} />
          </>
        ) : null}

        <ThemedText type="smallBold" themeColor="textSecondary">
          Biometría ({caps.hardwareSupported ? 'hardware del dispositivo' : 'simulada'})
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.box}>
          <View style={styles.pillRow}>
            {(Object.keys(PREF_LABEL) as BiometricPreference[]).map((k) => (
              <Pill key={k} label={PREF_LABEL[k]} selected={config.biometricPreference === k} onPress={() => cambiar({ biometricPreference: k })} />
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {caps.fingerprintAvailable ? '· Huella disponible en el dispositivo' : '· Huella no disponible (se usará simulación)'}
            {'\n'}
            {caps.faceAvailable ? '· Rostro disponible en el dispositivo' : '· Rostro no disponible (se usará la cámara/simulación)'}
          </ThemedText>

        </ThemedView>


        <ThemedText type="small" themeColor="textSecondary" style={styles.about}>
          checador-movil · Smart Display / TV · checador móvil con biometría y nube (MySQL).
        </ThemedText>
      </ThemedView>
    </RefreshableScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: TopInset, paddingBottom: Spacing.six + 40, alignItems: 'center' },
  container: { width: '100%', maxWidth: 560, gap: Spacing.three, position: 'relative' },
  title: { marginTop: Spacing.half },
  box: { borderRadius: Spacing.four, padding: Spacing.three, gap: Spacing.three },
  pillRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: Spacing.four, padding: Spacing.three },
  adminInitials: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  adminInitialsText: { fontSize: 18 },
  sessionInfo: { flex: 1, gap: Spacing.half },
  about: { textAlign: 'center', marginTop: Spacing.three },
});