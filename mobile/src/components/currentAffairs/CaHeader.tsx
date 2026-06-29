import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { CA_UI } from './caTheme';

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
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>{t('currentAffairs.title')}</Text>
          <Text style={styles.subtitle}>{t('currentAffairs.subtitle')}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('currentAffairs.aiAsk')}
            onPress={onAskAi}
            style={({ pressed }) => [styles.aiBtn, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[...CA_UI.aiGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiGradient}
            >
              <Sparkles size={12} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.aiLabel}>{t('currentAffairs.aiAsk')}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('currentAffairs.notifications')}
            onPress={onNotifications}
            style={({ pressed }) => [styles.notifBtn, pressed && styles.pressed]}
          >
            <Bell size={15} color={CA_UI.muted} strokeWidth={2} />
            {hasUnread ? <View style={styles.notifDot} /> : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: CA_UI.surface,
      borderBottomWidth: 1,
      borderBottomColor: CA_UI.border,
      paddingTop: topInset + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: CA_UI.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 11,
      color: CA_UI.faint,
      fontWeight: '500',
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    aiBtn: {
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    aiGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    aiLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    notifBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#6366F1',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
    pressed: { opacity: 0.9 },
  });
}
