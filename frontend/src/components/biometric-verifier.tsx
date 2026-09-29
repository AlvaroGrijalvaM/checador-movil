import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import type { BiometricCapabilities, BiometricMethod, BiometricVerification } from '@/biometrics/types';
import { getBiometricCapabilities, verifyWithSystem } from '@/biometrics/provider';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PrimaryButton } from './ui/primary-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface BiometricVerifierProps {
  visible: boolean;
  method: BiometricMethod;
  /** Contexto mostrado al usuario: 'Para iniciar sesion' | 'Para registrar tu entrada' */
  context: string;
  onCancel: () => void;
  onSuccess: (verification: BiometricVerification) => void;
  onError?: (message: string) => void;
}

interface Photo {
  base64: string;
  uri: string;
  filename: string;
}

function toDataUri(photo: Photo): string {
  return photo.uri.startsWith('data:') ? photo.uri : `data:image/jpeg;base64,${photo.base64}`;
}

/** Sensor de huella simulado: mantener presionado ~2 segundos. */
function SimulatedSensor({ label, onCompleted }: { label: string; onCompleted: () => void }) {
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const theme = useTheme();

  const clear = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => clear, []);

  const start = () => {
    if (timer.current) return;
    setProgress(0);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.05;
        if (next >= 1) {
          clear();
          onCompleted();
          return 1;
        }
        return next;
      });
    }, 100);
  };

  return (
    <View style={styles.sensorArea}>
      <Pressable
        onPressIn={start}
        onPressOut={clear}
        style={({ pressed }) => [
          styles.sensor,
          {
            borderColor: theme.primary,
            backgroundColor: pressed ? theme.primary : 'transparent',
          },
        ]}>
        <View style={[styles.sensorFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
        <ThemedText type="smallBold" style={[styles.sensorLabel, { color: progress > 0 ? theme.onPrimary : theme.text }]}>
          {progress > 0 ? 'Leyendo huella…' : label}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export function BiometricVerifier({
  visible,
  method,
  context,
  onCancel,
  onSuccess,
  onError,
}: BiometricVerifierProps) {
  const theme = useTheme();
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    hardwareSupported: false,
    fingerprintAvailable: false,
    faceAvailable: false,
  });
  const [phase, setPhase] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const faceHardware = method === 'face' && capabilities.faceAvailable;
  const fingerHardware = method === 'fingerprint' && capabilities.fingerprintAvailable;
  const useHardware = method === 'face' ? faceHardware : fingerHardware;
  const cameraGranted = cameraPermission?.granted === true;

  const reset = () => {
    setPhase('idle');
    setError(null);
    setPhoto(null);
    getBiometricCapabilities().then(setCapabilities).catch(() => {});
  };

  const verify = useMemo(
    () => async (withPhoto: Photo | null) => {
      setPhase('busy');
      setError(null);
      try {
        const verification = useHardware
          ? await verifyWithSystem(method, context, 'Se utilizara la biometria registrada en tu dispositivo')
          : {
              success: true,
              method,
              hardware: false,
              capturedUri: withPhoto ? toDataUri(withPhoto) : null,
              capturedBase64: withPhoto?.base64 ?? null,
              filename: withPhoto?.filename ?? null,
            } as BiometricVerification;
        if (verification.success) {
          verification.capturedUri = withPhoto ? toDataUri(withPhoto) : verification.capturedUri ?? null;
          verification.capturedBase64 = withPhoto?.base64 ?? verification.capturedBase64 ?? null;
          verification.filename = withPhoto?.filename ?? verification.filename ?? null;
          onSuccess(verification);
        } else {
          if (verification.error === 'user_cancel') {
            onCancel();
            return;
          }
          const msg =
            verification.error === 'not_enrolled'
              ? 'No hay biometria registrada en el dispositivo. Registra una huella o rostro en los ajustes del sistema.'
              : verification.error === 'lockout'
                ? 'Demasiados intentos. Intenta de nuevo en unos minutos.'
                : 'No se pudo verificar tu identidad. Intenta de nuevo.';
          setError(msg);
          setPhase('error');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado.');
        setPhase('error');
      }
    },
    [method, context, useHardware, onCancel, onSuccess],
  );

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    setPhase('busy');
    try {
      const pic = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      setPhoto({
        base64: pic.base64 ?? '',
        uri: pic.uri,
        filename: `selfie-${Date.now()}.jpg`,
      });
    } catch {
      setError('No se pudo capturar la foto.');
      setPhase('error');
      return;
    }
    setPhase('idle');
  };

  const methodLabel = method === 'fingerprint' ? 'Huella' : 'Rostro';

  return (
    <Modal visible={visible} transparent animationType="fade" onShow={reset} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Verificación biométrica
            </ThemedText>
            <Pressable onPress={onCancel} hitSlop={12}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Cerrar
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            {context} · método: {methodLabel}
          </ThemedText>

          <View style={styles.body}>
            {method === 'face' && cameraGranted && !photo ? (
              <View style={styles.cameraWrap}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                  active
                  mirror={false}
                />
                <PrimaryButton title="Tomar selfie" onPress={takePhoto} loading={phase === 'busy'} disabled={phase === 'busy'} style={styles.cta} />
              </View>
            ) : (
              photo && (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: toDataUri(photo) }} style={styles.preview} contentFit="cover" />
                  <Pressable onPress={() => setPhoto(null)}>
                    <ThemedText type="link" themeColor="textSecondary">
                      Volver a tomar
                    </ThemedText>
                  </Pressable>
                </View>
              )
            )}

            {method === 'face' && !cameraGranted && !photo ? (
              <ThemedText type="small" themeColor="textSecondary">
                {cameraPermission?.status === 'undetermined'
                  ? 'Se solicitará la cámara para capturar tu rostro como evidencia de la checada.'
                  : 'Sin permiso de cámara: podrás verificar el rostro sin adjuntar foto.'}
              </ThemedText>
            ) : null}

            {method === 'fingerprint' && (
              <ThemedText type="small" themeColor="textSecondary">
                {useHardware
                  ? 'El sistema del dispositivo te pedirá tu huella.'
                  : 'Modo simulado (sin sensor disponible): mantén presionado el sensor para simular la huella.'}
              </ThemedText>
            )}

            {method === 'face' && (
              <ThemedText type="small" themeColor="textSecondary">
                {useHardware
                  ? 'El sistema del dispositivo validará tu rostro.'
                  : 'Modo simulado: captura tu rostro y confirma.'}
              </ThemedText>
            )}

            {error ? (
              <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
                {error}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.footer}>
            {!useHardware && method === 'fingerprint' ? (
              <SimulatedSensor label="Mantén presionado aquí" onCompleted={() => verify(null)} />
            ) : (
              <PrimaryButton
                large
                title={phase === 'busy' ? 'Verificando…' : `Verificar ${methodLabel}`}
                onPress={() => verify(photo)}
                loading={phase === 'busy' && !cameraGranted}
                disabled={phase === 'busy'}
              />
            )}
            {method === 'face' && !cameraGranted && (
              <PrimaryButton
                variant="ghost"
                title="Conceder acceso a la cámara"
                onPress={() => requestCameraPermission()}
              />
            )}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    flex: 1,
  },
  body: {
    gap: Spacing.three,
  },
  cameraWrap: {
    gap: Spacing.three,
  },
  camera: {
    height: 240,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  cta: {
    marginTop: Spacing.two,
  },
  previewWrap: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  preview: {
    width: 160,
    height: 200,
    borderRadius: Spacing.three,
  },
  sensorArea: {
    alignItems: 'center',
  },
  sensor: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sensorFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
  },
  sensorLabel: {
    fontSize: 15,
  },
  error: {
    textAlign: 'center',
  },
  footer: {
    gap: Spacing.two,
  },
});