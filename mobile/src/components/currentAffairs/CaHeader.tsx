import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { platformShadow } from '../../utils/platformShadow';
import { CA_UI, caPressFeedback } from './caTheme';

type CaHeaderProps = {
  onAskAi: () => void;
  onNotifications: () => void;
  hasUnread?: boolean;
};

export function CaHeader({ onAskAi, onNotifications, hasUnread }: CaHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);

  return (
    <LinearGradient
      colors={[...CA_UI.heroGradient]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.decorGold} />
      <View style={styles.top}>
        <View>
          <Text style={styles.eyebrow}>{t('currentAffairs.subtitle')}</Text>
          <Text style={styles.title}>{t('currentAffairs.title')}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('currentAffairs.aiAsk')}
            onPress={onAskAi}
            style={({ pressed }) => [styles.aiBtn, pressed && caPressFeedback]}
          >
            <LinearGradient
              colors={[CA_UI.goldLt, CA_UI.gold, CA_UI.goldDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiGradient}
            >
              <Sparkles size={12} color="#2A2110" strokeWidth={2.5} />
              <Text style={styles.aiLabel}>{t('currentAffairs.aiAsk')}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('currentAffairs.notifications')}
            onPress={onNotifications}
            style={({ pressed }) => [styles.notifBtn, pressed && caPressFeedback]}
          >
            <Bell size={15} color="#FFFFFF" strokeWidth={2} />
            {hasUnread ? <View style={styles.notifDot} /> : null}
          </Pressable>
        </View>
      </View>
      <LinearGradient
        colors={[CA_UI.goldLt, CA_UI.gold]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.goldRule}
      />
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    wrap: {
      paddingTop: topInset + 10,
      paddingHorizontal: 16,
      paddingBottom: 14,
      overflow: 'hidden',
    },
    decorGold: {
      position: 'absolute',
      top: -40,
      right: -30,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(194,154,78,0.18)',
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1,
    },
    eyebrow: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.62)',
      fontWeight: '600',
      letterSpacing: 0.3,
      marginBottom: 2,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    aiBtn: {
      borderRadius: 20,
      overflow: 'hidden',
      ...platformShadow({ color: '#000000', offsetY: 4, opacity: 0.28, radius: 8, elevation: 4 }),
    },
    aiGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    aiLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#2A2110',
    },
    notifBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: CA_UI.goldLt,
      borderWidth: 1.5,
      borderColor: CA_UI.accent,
    },
    goldRule: {
      height: 2,
      marginTop: 14,
      borderRadius: 1,
      opacity: 0.85,
    },
  });
}
