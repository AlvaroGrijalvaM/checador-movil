/** ScrollView con pull-to-refresh opcional (RefreshControl nativo; no se monta en web). */
import { useState } from 'react';
import { Platform, RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';

interface RefreshableScrollProps extends ScrollViewProps {
  onRefresh?: () => Promise<void> | void;
}

export function RefreshableScroll({ onRefresh, ...rest }: RefreshableScrollProps) {
  const [refreshing, setRefreshing] = useState(false);
  const handle = () => {
    if (refreshing) return;
    setRefreshing(true);
    Promise.resolve(onRefresh?.()).finally(() => setRefreshing(false));
  };
  return (
    <ScrollView
      {...rest}
      refreshControl={
        Platform.OS !== 'web' && onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handle} />
        ) : undefined
      }
    />
  );
}