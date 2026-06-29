import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../Avatar';
import { Text } from '../Text';
import { maskIndianPhone } from '../../lib/phone';
import type { Profile } from '../../types/auth';
import { HOME_V2 } from '../home/homeStyles';

type ProfileHeaderProps = {
  profile: Profile;
  onSettingsPress?: () => void;
  onAvatarPress?: () => void;
};

export function ProfileHeader({ profile, onSettingsPress, onAvatarPress }: ProfileHeaderProps) {
  const { t } = useTranslation(['app', 'navigation']);
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top), [insets.top]);
  const avatarSource = profile.avatarUrl ? { uri: profile.avatarUrl } : undefined;

  return (
    <LinearGradient
      colors={[...HOME_V2.headerGradient]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.decorA} />
      <View style={styles.decorB} />

      <View style={styles.topbar}>
        <View style={styles.topbarSpacer} />
        <Text style={styles.title}>{t('navigation:profile')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('app:profile.settingsA11y')}
          testID="profile-settings"
          onPress={onSettingsPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Settings size={19} color="#FFFFFF" strokeWidth={1.75} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('app:profile.changePhotoA11y')}
        onPress={onAvatarPress}
        style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={['#FFD98A', '#F2A516']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarBorder}
        >
          <Avatar name={profile.name} source={avatarSource} size="lg" style={styles.avatar} />
        </LinearGradient>
        <View style={styles.cameraBadge}>
          <Camera size={14} color="#3A36CC" strokeWidth={1.75} />
        </View>
      </Pressable>

      <Text style={styles.name}>{profile.name}</Text>
      <View style={styles.phoneRow}>
        <Text style={styles.phone}>{maskIndianPhone(profile.phone)}</Text>
        <View style={styles.verifiedBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.verifiedText}>{t('app:profile.verified')}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function createStyles(topInset: number) {
  return StyleSheet.create({
    gradient: {
      marginHorizontal: -16,
      paddingTop: topInset + 8,
      paddingHorizontal: 20,
      paddingBottom: 64,
      alignItems: 'center',
      overflow: 'hidden',
    },
    decorA: {
      position: 'absolute',
      top: -50,
      right: -40,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorB: {
      position: 'absolute',
      bottom: -40,
      left: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: 'rgba(124,118,240,0.35)',
    },
    topbar: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 2,
    },
    topbarSpacer: {
      width: 40,
      height: 40,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.92,
    },
    avatarPressable: {
      marginTop: 16,
      position: 'relative',
      zIndex: 2,
    },
    avatarBorder: {
      width: 92,
      height: 92,
      borderRadius: 30,
      padding: 3,
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 27,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: -3,
      right: -3,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#322EA8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      marginTop: 13,
      fontSize: 21,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: '#FFFFFF',
      zIndex: 2,
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 3,
      zIndex: 2,
    },
    phone: {
      fontSize: 12.5,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.8)',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'rgba(16,165,147,0.9)',
      borderRadius: 99,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    verifiedText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#FFFFFF',
    },
  });
}
