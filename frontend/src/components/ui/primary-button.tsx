import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'ghost';

interface PrimaryButtonProps extends Omit<React.ComponentProps<typeof Pressable>, 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BG: Record<Variant, ThemeColor> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  ghost: 'backgroundSelected',
};

const FG: Record<Variant, ThemeColor> = {
  primary: 'onPrimary',
  success: 'onSuccess',
  warning: 'onWarning',
  danger: 'onDanger',
  ghost: 'text',
};

export function PrimaryButton({
  title,
  variant = 'primary',
  loading = false,
  large = false,
  disabled,
  style,
  ...rest
}: PrimaryButtonProps) {
  const theme = useTheme();
  const bg = theme[BG[variant]];
  const fg = theme[FG[variant]];

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        large && styles.large,
        {
          backgroundColor: bg,
          opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <ThemedText type="smallBold" style={[styles.label, { color: fg }]}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    minHeight: 48,
  },
  large: {
    minHeight: 68,
    borderRadius: Spacing.four,
  },
  label: {
    fontSize: 17,
  },
});