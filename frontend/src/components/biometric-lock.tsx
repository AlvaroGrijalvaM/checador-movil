/**
 * Bloqueo biometrico (F9): al volver de segundo plano, pide verificar la identidad
 * con biometria antes de mostrar los datos de nuevo.
 */
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { getBiometricCapabilities } from '@/biometrics/provider';
import type { BiometricMethod } from '@/biometrics/types';
import { BiometricVerifier } from '@/components/biometric-verifier';
import { ThemedText } from '@/components/themed-text';
import { Pill } from '@/components/ui/pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

export function BiometricLock() {
  const theme = useTheme();
  const { config } = useConfig();
  const { session, signOut } = useSession();
  const [locked, setLocked] = useState(false);
  const [verifierOpen, setVerifierOpen] = useState(false);
  const [method, setMethod] = useState<BiometricMethod>('fingerprint');


  useEffect(() => {
    let wentToBackground = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        wentToBackground = true;
        return;
      }
      if (state === 'active' && wentToBackground) {
        wentToBackground = false;
        setLocked(true);
        getBiometricCapabilities().then((c) => {
          if (config.biometricPreference === 'face') setMethod('face');
          else if (config.biometricPreference === 'fingerprint') setMethod('fingerprint');
          else setMethod(c.faceAvailable && !c.fingerprintAvailable ? 'face' : 'fingerprint');
        }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [config.biometricPreference]);

  if (!session || !locked) return null;

  const onVerified = (v: { success: boolean }) => {
    setVerifierOpen(false);
    if (v.success) setLocked(false);
  };

  return (
    <>
      <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.background }]}>
        <ThemedText type="h1">Sesión bloqueada</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Verifica tu identidad de nuevo para continuar.
        </ThemedText>
        <View style={styles.pillRow}>
          <Pill label="Huella" selected={method === 'fingerprint'} onPress={() => setMethod('fingerprint')} />
          <Pill label="Rostro" selected={method === 'face'} onPress={() => setMethod('face')} />
        </View>
        <PrimaryButton large title="Desbloquear" onPress={() => setVerifierOpen(true)} />
        <PrimaryButton
          variant="ghost"
          title="Cerrar sesión"
          onPress={() => {
            setLocked(false);
            signOut();
          }}
        />
      </View>
      <BiometricVerifier
        visible={verifierOpen}
        method={method}
        context="Para desbloquear la app"
        onCancel={() => setVerifierOpen(false)}
        onSuccess={onVerified}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    zIndex: 20,
  },
  center: { textAlign: 'center' },
  pillRow: { flexDirection: 'row', gap: Spacing.two },
});