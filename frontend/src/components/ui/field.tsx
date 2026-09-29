import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';

interface FieldProps extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
  /** Muestra un boton para alternar la visibilidad del texto (campos de contrasena). */
  secureTextToggle?: boolean;
}

export function Field({ label, containerStyle, style, secureTextToggle = false, secureTextEntry, ...rest }: FieldProps) {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={containerStyle}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <TextInput
          allowFontScaling
          secureTextEntry={secureTextToggle ? !show : secureTextEntry}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />
        {secureTextToggle ? (
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setShow((v) => !v)}>
            <SymbolView
              size={20}
              tintColor={theme.textSecondary}
              name={{
                ios: show ? 'eye.slash' : 'eye',
                android: show ? 'visibility_off' : 'visibility',
                web: show ? 'visibility_off' : 'visibility',
              }}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    marginTop: Spacing.one,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.two + Spacing.half,
    fontSize: 16,
  },
});