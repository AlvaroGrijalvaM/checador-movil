import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Empleado } from '@/api/contract';
import { createApi } from '@/api/client';
import { getBiometricCapabilities } from '@/biometrics/provider';
import type { BiometricCapabilities, BiometricMethod, BiometricVerification } from '@/biometrics/types';
import { BiometricVerifier } from '@/components/biometric-verifier';
import { EmployeeCard } from '@/components/employee-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

type Acceso = 'empleado' | 'admin';

export default function SignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { config } = useConfig();
  const { signIn } = useSession();

  const [acceso, setAcceso] = useState<Acceso>('empleado');
  const [numero, setNumero] = useState('');
  const [password, setPassword] = useState('');
  const [usuarioAdmin, setUsuarioAdmin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [manualMethod, setManualMethod] = useState<BiometricMethod | null>(null);
  const [verifierOpen, setVerifierOpen] = useState(false);
  const [caps, setCaps] = useState<BiometricCapabilities>({
    hardwareSupported: false,
    fingerprintAvailable: false,
    faceAvailable: false,
  });

  const api = useMemo(() => createApi(config, () => null), [config]);

  useEffect(() => {
    getBiometricCapabilities().then(setCaps).catch(() => {});
  }, []);

  const defaultMethod: BiometricMethod = useMemo(() => {
    if (config.biometricPreference === 'fingerprint') return 'fingerprint';
    if (config.biometricPreference === 'face') return 'face';
    return caps.fingerprintAvailable || !caps.faceAvailable ? 'fingerprint' : 'face';
  }, [config.biometricPreference, caps]);
  const method = manualMethod ?? defaultMethod;

  const identificar = async () => {
    setBusy(true);
    setError(null);
    try {
      if (acceso === 'admin') {
        const res = await api.loginAdmin(usuarioAdmin.trim(), password);
        await signIn({ token: res.token, rol: 'admin', admin: res.admin });
        router.replace('/');
        return;
      }
      if (!numero.trim()) {
        setError('Escribe tu número de empleado (ej. EMP001).');
        return;
      }
      const res = await api.loginEmpleado(numero.trim(), password);
      setEmpleado(res.empleado);
      setToken(res.token);
    } catch (e) {
      setEmpleado(null);
      setToken(null);
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  const onBiometricSuccess = async (verification: BiometricVerification) => {
    setVerifierOpen(false);
    if (!verification.success) return;
    if (token && empleado) {
      await signIn({ token, rol: 'empleado', empleado });
      router.replace('/');
    }
  };



  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.container}>
            <View style={styles.brand}>
              <View style={[styles.brandDot, { backgroundColor: theme.primary }]} />
              <ThemedText type="subtitle">checador-movil</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              Smart Display / TV · asistencia con biometría y nube
            </ThemedText>

            {!empleado ? (
              <View style={styles.form}>
                <View style={styles.pillRow}>
                  <Pill label="Empleado" selected={acceso === 'empleado'} onPress={() => setAcceso('empleado')} />
                  <Pill label="Administrador" selected={acceso === 'admin'} onPress={() => setAcceso('admin')} />
                </View>
                {acceso === 'admin' ? (
                  <Field
                    label="Usuario de administrador"
                    placeholder="Tu usuario"
                    value={usuarioAdmin}
                    onChangeText={setUsuarioAdmin}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                ) : (
                  <Field
                    label="Número de empleado"
                    placeholder="Ingresa tu número de empleado"
                    value={numero}
                    onChangeText={(t) => setNumero(t.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                )}
                <Field
                  label="Contraseña"
                  placeholder={acceso === 'admin' ? 'Contraseña del administrador' : 'Ingresa tu contraseña'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  secureTextToggle
                  autoCapitalize="none"
                />
                {error ? (
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {error}
                  </ThemedText>
                ) : null}
                <PrimaryButton
                  large
                  title={busy ? 'Ingresando…' : acceso === 'admin' ? 'Iniciar sesión de administrador' : 'Identificarme y continuar'}
                  onPress={identificar}
                  loading={busy}
                />


              </View>
            ) : (
              <View style={styles.identified}>
                <EmployeeCard empleado={empleado} />
                <ThemedView type="backgroundElement" style={styles.bioBox}>
                  <ThemedText type="smallBold">Verificación biométrica</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {caps.hardwareSupported
                      ? 'Se usará la biometría del dispositivo.'
                      : 'Sin sensor biométrico: se usará el modo simulado.'}
                  </ThemedText>
                  <View style={styles.pillRow}>
                    <Pill label="Huella" selected={method === 'fingerprint'} onPress={() => setManualMethod('fingerprint')} />
                    <Pill label="Rostro" selected={method === 'face'} onPress={() => setManualMethod('face')} />
                  </View>
                  <PrimaryButton large title="Verificar identidad" onPress={() => setVerifierOpen(true)} />
                  <Pressable onPress={() => { setEmpleado(null); setToken(null); setError(null); }} hitSlop={8}>
                    <ThemedText type="link" style={styles.linkCentered}>
                      Usar otro número de empleado
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              </View>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>

      <BiometricVerifier
        visible={verifierOpen}
        method={method}
        context="Para iniciar sesión"
        onCancel={() => setVerifierOpen(false)}
        onSuccess={onBiometricSuccess}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    gap: Spacing.four,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  brandDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  subtitle: {
    marginTop: -Spacing.three,
  },
  form: {
    gap: Spacing.three,
  },
  identified: {
    gap: Spacing.three,
  },
  bioBox: {
    gap: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  linkCentered: {
    textAlign: 'center',
  },
});