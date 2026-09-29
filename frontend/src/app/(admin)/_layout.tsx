import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AdminTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.primary}
      iconColor={colors.textSecondary}
      tintColor={colors.textSecondary}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.primary },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="empleados">
        <NativeTabs.Trigger.Label>Empleados</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="organizacion">
        <NativeTabs.Trigger.Label>Organización</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.circle" md="manage_accounts" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reportes">
        <NativeTabs.Trigger.Label>Reportes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.and.pencil" md="assessment" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}