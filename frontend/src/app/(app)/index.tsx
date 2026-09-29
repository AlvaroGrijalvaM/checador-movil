import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { CheckResult, EstadoChecadaInfo } from '@/api/contract';
import { createApi } from '@/api/client';
import { getBiometricCapabilities } from '@/biometrics/provider';
import type { BiometricMethod, BiometricVerification } from '@/biometrics/types';
import { BiometricVerifier } from '@/components/biometric-verifier';
import { EmployeeCard } from '@/components/employee-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RefreshableScroll } from '@/components/ui/refreshable-scroll';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing, TopInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, formatTime, toDate } from '@/lib/format';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

export default function CheckinScreen() {
  const theme = useTheme();
  const { config, updateConfig } = useConfig();
  const { session, signOut } = useSession();

  const [estado, setEstado] = useState<EstadoChecadaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [metodo, setMetodo] = useState<BiometricMethod>('fingerprint');
  const [verifierOpen, setVerifierOpen] = useState(false);

  const api = useMemo(() => createApi(config, () => session?.token ?? null), [config, session?.token]);

  const cargar = useCallback(async () => {
    if (!session?.empleado) return;
    setLoading(true);
    setError(null);
    try {
      const e = await api.estadoChecada(session.empleado.numero_empleado);
      setEstado(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar el estado.');
    } finally {
      setLoading(false);
    }
  }, [api, session]);

  useFocusEffect(
    useCallback(() => {
      cargar();
      // se ignora: no limpiar al desenfocar
    }, [cargar]),
  );

  useEffect(() => {
    getBiometricCapabilities().then((c) => {
      if (config.biometricPreference === 'fingerprint') setMetodo('fingerprint');
      else if (config.biometricPreference === 'face') setMetodo('face');
      else setMetodo(c.fingerprintAvailable || !c.faceAvailable ? 'fingerprint' : 'face');
    }).catch(() => {});
  }, [config.biometricPreference]);

  const empleado = session?.empleado;
  if (!empleado) return null;

  const accionPendiente = estado?.estado_checada === 'ENTRADA_ABIERTA';
  const jornadaCompleta = estado?.estado_checada === 'JORNADA_COMPLETA';

  const elegirMetodo = (m: BiometricMethod) => {
    setMetodo(m);
    updateConfig({ biometricPreference: m });
  };

  const onVerificacion = async (v: BiometricVerification) => {
    setVerifierOpen(false);
    if (!v.success) return;
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      let fotoUrl: string | null = null;
      if (v.capturedBase64) {
        fotoUrl = await api.uploadFoto(v.capturedBase64, v.filename ?? `checada-${Date.now()}.jpg`);
      }
      const res = accionPendiente
        ? await api.registrarSalida(empleado.numero_empleado, fotoUrl)
        : await api.registrarEntrada(empleado.numero_empleado, fotoUrl);
      setResult(res);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la checada.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const horaEntrada = estado?.fecha_entrada ? toDate(estado.fecha_entrada) : null;
  const horaSalida = estado?.fecha_salida ? toDate(estado.fecha_salida) : null;

  return (
    <RefreshableScroll contentContainerStyle={styles.scroll} onRefresh={cargar}>
      <ThemedView style={styles.container}>
        
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Bienvenido
            </ThemedText>
            <ThemedText type="h1" style={styles.greeting}>
              {empleado.nombre_completo.split(' ')[0]}
            </ThemedText>
          </View>
          <Pressable onPress={() => signOut()} hitSlop={8} accessibilityRole="button">
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Cerrar sesión
            </ThemedText>
          </Pressable>
        </View>

        <EmployeeCard empleado={empleado} />

        <ThemedView type="backgroundElement" style={styles.stateCard}>
          <View style={styles.stateRow}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Estado de hoy
            </ThemedText>
            <StatusBadge state={estado?.estado_checada ?? 'SIN_CHECADA'} />
          </View>

          <View style={styles.times}>
            <View style={[styles.timeBox, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Entrada
              </ThemedText>
              <ThemedText type="subtitle" style={styles.timeValue}>
                {horaEntrada ? formatTime(horaEntrada) : '--:--'}
              </ThemedText>
            </View>
            <View style={[styles.timeBox, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Salida
              </ThemedText>
              <ThemedText type="subtitle" style={styles.timeValue}>
                {horaSalida ? formatTime(horaSalida) : '--:--'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {result ? (
          <Pressable onPress={() => setResult(null)} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.resultCard}>
              <ThemedText type="smallBold">{result.mensaje}</ThemedText>
              {result.estado ? <StatusBadge state={result.estado} /> : null}
              {result.fecha_entrada ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Hora oficial (servidor): {formatDateTime(result.fecha_entrada)}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textSecondary">
                Toca para descartar
              </ThemedText>
            </ThemedView>
          </Pressable>
        ) : null}

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            large
            variant={accionPendiente ? 'warning' : 'primary'}
            title={
              busy
                ? 'Registrando…'
                : accionPendiente
                  ? 'Registrar salida'
                  : jornadaCompleta
                    ? 'Jornada completada'
                    : 'Registrar entrada'
            }
            disabled={busy || loading || jornadaCompleta}
            loading={busy}
            onPress={() => setVerifierOpen(true)}
          />
          <View style={styles.methodRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Biometría:
            </ThemedText>
            <PrimaryButton
              variant={metodo === 'fingerprint' ? 'primary' : 'ghost'}
              title="Huella"
              onPress={() => elegirMetodo('fingerprint')}
              style={styles.smallBtn}
            />
            <PrimaryButton
              variant={metodo === 'face' ? 'primary' : 'ghost'}
              title="Rostro"
              onPress={() => elegirMetodo('face')}
              style={styles.smallBtn}
            />
          </View>
          <PrimaryButton variant="ghost" title={loading ? 'Actualizando…' : 'Actualizar'} onPress={cargar} disabled={loading} />
        </View>

        {jornadaCompleta ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Ya registraste entrada y salida hoy. El historial incluye todos tus registros.
          </ThemedText>
        ) : null}
      </ThemedView>

      <BiometricVerifier
        visible={verifierOpen}
        method={metodo}
        context={accionPendiente ? 'Para registrar tu salida' : 'Para registrar tu entrada'}
        onCancel={() => setVerifierOpen(false)}
        onSuccess={onVerificacion}
      />
    </RefreshableScroll>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: TopInset,
    paddingBottom: Spacing.six + 40,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 560,
    gap: Spacing.three,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  greeting: {
    marginTop: Spacing.half,
  },
  pressed: {
    opacity: 0.8,
  },
  stateCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  times: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  timeBox: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.half,
  },
  timeValue: {
    fontSize: 24,
    lineHeight: 30,
  },
  resultCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.three,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  smallBtn: {
    minHeight: 44,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  hint: {
    textAlign: 'center',
  },
});