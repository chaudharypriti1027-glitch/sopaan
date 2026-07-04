import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '../Skeleton';
import { HOME_V2 } from './homeStyles';
import { HOME_UI } from './homeTheme';

/** Shimmer placeholder mirroring premium home layout. */
export function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']} testID="home-skeleton">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...HOME_V2.headerGradient]} style={styles.header}>
          <View style={styles.greetingRow}>
            <Skeleton width={54} height={54} borderRadius={18} />
            <View style={styles.greetingText}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="65%" height={21} />
            </View>
            <Skeleton width={44} height={44} borderRadius={15} />
          </View>
          <View style={styles.weekRow}>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} width="12%" height={58} borderRadius={15} />
            ))}
          </View>
        </LinearGradient>

        <View style={styles.heroOverlap}>
          <Skeleton height={168} borderRadius={22} />
        </View>

        <Skeleton height={92} borderRadius={20} style={styles.block} />
        <Skeleton height={280} borderRadius={22} style={styles.block} />
        <Skeleton height={180} borderRadius={22} style={styles.block} />
        <Skeleton height={140} borderRadius={22} style={styles.block} />
        <Skeleton height={120} borderRadius={22} style={styles.block} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: HOME_V2.bg,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: HOME_UI.tabBottomPad,
    },
    header: {
      marginHorizontal: -16,
      paddingTop: topInset + 12,
      paddingHorizontal: 20,
      paddingBottom: 56,
      gap: 18,
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    greetingText: {
      flex: 1,
      gap: 8,
    },
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    heroOverlap: {
      marginTop: HOME_V2.bodyLift,
      marginBottom: 16,
    },
    block: {
      marginBottom: 16,
    },
  });
}
