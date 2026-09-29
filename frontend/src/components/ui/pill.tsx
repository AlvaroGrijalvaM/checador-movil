import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';

interface PillProps extends Omit<React.ComponentProps<typeof Pressable>, 'style'> {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, selected = false, style, ...rest }: PillProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // Altura minima >= 44px para cumplir targets tactiles accesibles.
    paddingVertical: Spacing.three,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
    justifyContent: 'center',
  },
});