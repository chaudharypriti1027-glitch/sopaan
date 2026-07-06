import { useEffect, useMemo, useRef } from 'react';
import { Animated, ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../Text';
import { NumText } from '../NumText';
import { useTheme } from '../../theme';
import { LIVE } from './liveTheme';
import { liveInitials } from './liveUtils';

type LiveClassEducatorPlaceholderProps = {
  name: string;
  subtitle?: string;
  hint?: string;
  loading?: boolean;
  compact?: boolean;
};

/** Centered educator avatar used while video is connecting or unavailable. */
export function LiveClassEducatorPlaceholder({
  name,
  subtitle,
  hint,
  loading = false,
  compact = false,
}: LiveClassEducatorPlaceholderProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const camSize = compact ? 108 : 138;
  const haloSize = compact ? 118 : 150;

  return (
    <View style={styles.wrap}>
      <View style={[styles.camWrap, { width: camSize, height: camSize }]}>
        <Animated.View
          style={[
            styles.halo,
            {
              width: haloSize,
              height: haloSize,
              borderRadius: compact ? 38 : 46,
              opacity: pulse,
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 0.6],
                    outputRange: [1.1, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <LinearGradient
          colors={['#D8B368', '#B9822F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cam, { width: camSize, height: camSize, borderRadius: compact ? 32 : 40 }]}
        >
          <NumText style={[styles.initials, compact && styles.initialsCompact]}>
            {liveInitials(name)}
          </NumText>
        </LinearGradient>
      </View>
      <Text style={styles.name}>{name}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {loading ? (
        <ActivityIndicator size={20} color={LIVE.goldLt} style={styles.spinner} />
      ) : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], compact: boolean) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: compact ? 10 : 15,
      paddingHorizontal: 24,
    },
    camWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    halo: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: 'rgba(226,201,127,0.5)',
    },
    cam: {
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.6,
      shadowRadius: 50,
      elevation: 12,
    },
    initials: {
      fontSize: 42,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    initialsCompact: {
      fontSize: 34,
    },
    name: {
      fontSize: compact ? 16 : 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    subtitle: {
      marginTop: -9,
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: LIVE.textMuted,
      textAlign: 'center',
    },
    spinner: {
      marginTop: 4,
    },
    hint: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: LIVE.textFaint,
      textAlign: 'center',
      maxWidth: 280,
      lineHeight: 15,
    },
  });
}
