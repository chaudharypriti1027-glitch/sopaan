import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '../Skeleton';
import { HOME_UI } from './homeTheme';

/** Shimmer placeholder mirroring premium home layout. */
export function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']} testID="home-skeleton">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...HOME_UI.heroGradient]} style={styles.header}>
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
              <Skeleton key={i} width="12%" height={56} borderRadius={HOME_UI.innerRadius} />
            ))}
          </View>
        </LinearGradient>

        <View style={styles.heroOverlap}>
          <Skeleton height={164} borderRadius={HOME_UI.cardRadiusLg} />
        </View>

        <Skeleton height={88} borderRadius={HOME_UI.cardRadiusLg} style={styles.block} />
        <Skeleton height={268} borderRadius={HOME_UI.cardRadiusLg} style={styles.block} />
        <Skeleton height={172} borderRadius={HOME_UI.cardRadiusLg} style={styles.block} />
        <Skeleton height={132} borderRadius={HOME_UI.cardRadiusLg} style={styles.block} />
        <Skeleton height={112} borderRadius={HOME_UI.cardRadiusLg} style={styles.block} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: HOME_UI.bg,
    },
    content: {
      paddingHorizontal: HOME_UI.horizontalPad,
      paddingBottom: HOME_UI.tabBottomPad,
    },
    header: {
      marginHorizontal: -HOME_UI.horizontalPad,
      paddingTop: topInset + 12,
      paddingHorizontal: 20,
      paddingBottom: 52,
      gap: 16,
      borderBottomLeftRadius: HOME_UI.heroRadius,
      borderBottomRightRadius: HOME_UI.heroRadius,
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
      marginTop: -38,
      marginBottom: 14,
    },
    block: {
      marginBottom: 14,
    },
  });
}
