import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '../Skeleton';
import { HOME_V2 } from './homeStyles';
import { CONTINUE_CARD_WIDTH } from './homeUtils';

/** Shimmer placeholder mirroring premium v2 home layout. */
export function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']} testID="home-skeleton">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...HOME_V2.headerGradient]} style={styles.header}>
          <View style={styles.greetingRow}>
            <Skeleton width={51} height={51} borderRadius={17} />
            <View style={styles.greetingText}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="65%" height={22} />
            </View>
            <Skeleton width={43} height={43} borderRadius={14} />
          </View>
          <View style={styles.chipRow}>
            <Skeleton width={120} height={34} borderRadius={99} />
            <Skeleton width={140} height={34} borderRadius={99} />
          </View>
        </LinearGradient>

        <View style={styles.heroOverlap}>
          <Skeleton height={160} borderRadius={HOME_V2.cardRadius} />
        </View>

        <Skeleton height={88} borderRadius={20} />
        <View style={styles.quickGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.quickTile}>
              <Skeleton width="100%" height={72} borderRadius={19} />
              <Skeleton width={56} height={12} />
            </View>
          ))}
        </View>
        <Skeleton width={CONTINUE_CARD_WIDTH} height={120} borderRadius={HOME_V2.cardRadius} />
        <Skeleton height={82} borderRadius={HOME_V2.cardRadius} />
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
      paddingBottom: 120,
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
    chipRow: {
      flexDirection: 'row',
      gap: 9,
    },
    heroOverlap: {
      marginTop: HOME_V2.bodyLift,
      marginBottom: 16,
    },
    quickGrid: {
      flexDirection: 'row',
      gap: 11,
      marginBottom: 16,
    },
    quickTile: {
      flex: 1,
      alignItems: 'center',
      gap: 9,
    },
  });
}
