/** Modal de confirmacion para acciones destructivas (reemplaza al Alert del sistema, cross-platform). */
import { FormModal } from './form-modal';
import { ThemedText } from '../themed-text';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!visible) return null;
  return (
    <FormModal
      visible
      title={title}
      submitLabel={confirmLabel}
      destructive={destructive}
      onCancel={onCancel}
      onSubmit={onConfirm}>
      <ThemedText type="small">{message}</ThemedText>
    </FormModal>
  );
}