import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = 'fingerprint' | 'history' | 'settings';

const TABS = [
  { name: 'index', href: '/', label: 'Checar', icon: 'fingerprint' },
  { name: 'history', href: '/history', label: 'Historial', icon: 'history' },
  { name: 'settings', href: '/settings', label: 'Ajustes', icon: 'settings' },
] as const;

const IOS_ICONS: Record<IconName, SFSymbol> = {
  fingerprint: 'touchid',
  history: 'clock.arrow.circlepath',
  settings: 'gearshape',
};

const ANDROID_ICONS: Record<IconName, AndroidSymbol> = {
  fingerprint: 'fingerprint',
  history: 'history',
  settings: 'settings',
};

export default function AppTabsWeb() {
  return (
    <Tabs style={{ height: '100%' }}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton label={tab.label} icon={tab.icon} />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

function TabButton({ label, icon, isFocused, ...props }: TabTriggerSlotProps & { label: string; icon: IconName }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      {...props}
      style={({ pressed, hovered }) => [
        styles.tabButtonView,
        { backgroundColor: pressed ? theme.primary : isFocused || hovered ? theme.backgroundSelected : theme.backgroundElement },
        { opacity: pressed ? 0.85 : 1 },
      ]}>
      <SymbolView
        tintColor={isFocused ? theme.primary : theme.textSecondary}
        name={{ ios: IOS_ICONS[icon], android: ANDROID_ICONS[icon], web: ANDROID_ICONS[icon] }}
        size={16}
      />
      <ThemedText type="small" style={{ color: isFocused ? theme.primary : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { height: '100%' },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 44,
    justifyContent: 'center',
  },
});