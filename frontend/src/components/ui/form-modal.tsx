import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { PrimaryButton } from './primary-button';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

interface FormModalProps {
  visible: boolean;
  title: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

export function FormModal({
  visible,
  title,
  submitLabel = 'Guardar',
  submitDisabled,
  loading = false,
  destructive = false,
  onCancel,
  onSubmit,
  children,
}: FormModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton variant="ghost" title="Cancelar" onPress={onCancel} />
            <PrimaryButton
              variant={destructive ? 'danger' : 'primary'}
              title={loading ? 'Espera…' : submitLabel}
              onPress={onSubmit}
              loading={loading}
              disabled={submitDisabled || loading}
            />
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
    maxHeight: '92%',
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  bodyScroll: {
    flexGrow: 1,
    maxHeight: '70%',
  },
  body: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
});