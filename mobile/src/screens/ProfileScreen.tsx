import { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { ProfileAccountDetails } from '../components/profile/ProfileAccountDetails';
import { ProfileCompletionCard } from '../components/profile/ProfileCompletionCard';
import { ProfileEditSheet } from '../components/profile/ProfileEditSheet';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileMenuSectionCard } from '../components/profile/ProfileMenuSectionCard';
import { ProfileProCard } from '../components/profile/ProfileProCard';
import { ProfileSectionLabel } from '../components/profile/ProfileSectionLabel';
import { ProfileStatsCard } from '../components/profile/ProfileStatsCard';
import { buildProfileMenuSections } from '../components/profile/profileMenu';
import { HOME_V2 } from '../components/home/homeStyles';
import { useAuth } from '../auth';
import { resetToLogin } from '../auth/routeAfterSession';
import { useMe, useProfileSummary, useUpdateMe } from '../hooks';
import { queryKeys } from '../hooks/queryKeys';
import type { AppTabParamList, MainStackParamList, RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { parseApiError } from '../api';
import { uploadAvatar } from '../api/me';
import { HELP_CENTER_URL, WHATSAPP_COMMUNITY_URL } from '../config/externalLinks';
import { pickImageAsset } from '../utils/imagePicker';
import { useAuthStore } from '../store/auth';
import { useLanguage } from '../language/LanguageContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Profile'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { t } = useTranslation(['app', 'common', 'settings']);
  const navigation = useNavigation<ProfileNav>();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((state) => state.setProfile);

  const meQuery = useMe();
  const summaryQuery = useProfileSummary();
  const updateMeMutation = useUpdateMe();
  const { setLanguage: setAppLanguage } = useLanguage();
  const profile = meQuery.data;

  const [editOpen, setEditOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const menuSections = useMemo(
    () => (profile ? buildProfileMenuSections(profile) : []),
    [profile],
  );

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        void summaryQuery.refetch();
      }
    }, [profile, summaryQuery.refetch]),
  );

  const mainNav = () => navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  const rootNav = () => navigation.getParent()?.getParent<RootNav>();

  const handleLogout = () => {
    Alert.alert(t('settings:logoutTitle'), t('app:profile.logoutBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('settings:logout'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            const root = rootNav();
            if (root) {
              resetToLogin(root);
            }
          })();
        },
      },
    ]);
  };

  const handleMenuItemPress = (sectionId: string, itemId: string) => {
    const section = menuSections.find((entry) => entry.id === sectionId);
    const item = section?.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    if (item.action === 'edit') {
      setEditOpen(true);
      return;
    }

    if (item.action === 'help') {
      void Linking.openURL(HELP_CENTER_URL);
      return;
    }

    if (item.action === 'whatsapp') {
      void Linking.openURL(WHATSAPP_COMMUNITY_URL);
      return;
    }

    if (item.route) {
      mainNav()?.navigate(item.route as never);
    }
  };

  const handleAvatarPress = async () => {
    if (avatarLoading || !profile) {
      return;
    }

    const asset = await pickImageAsset('library');
    if (!asset) {
      return;
    }

    setAvatarLoading(true);
    try {
      const updated = await uploadAvatar({
        uri: asset.uri,
        name: asset.fileName,
        type: asset.mimeType,
      });
      await setProfile(updated);
      queryClient.setQueryData(queryKeys.account.me(), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
    } catch (err) {
      Alert.alert(t('app:profile.couldNotUpload'), parseApiError(err).message);
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.centered}>
          <Text variant="body" color="secondary">
            {t('app:profile.signInPrompt')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          profile={profile}
          onSettingsPress={() => mainNav()?.navigate('Settings')}
          onAvatarPress={() => void handleAvatarPress()}
        />

        <View style={styles.body}>
          <View style={styles.lift}>
            <ProfileStatsCard profile={profile} />
          </View>

          <ProfileCompletionCard profile={profile} />

          <ProfileSectionLabel title={t('app:profile.membership')} />
          <ProfileProCard onPress={() => mainNav()?.navigate('Premium')} />

          <ProfileSectionLabel title={t('app:profile.accountDetailsSection')} />
          <ProfileAccountDetails profile={profile} />

          {menuSections.map((section) => (
            <View key={section.id}>
              <ProfileSectionLabel title={t(`app:profile.menu.${section.titleKey}`)} />
              <ProfileMenuSectionCard
                section={section}
                summary={summaryQuery.data}
                summaryLoading={summaryQuery.isLoading}
                onItemPress={(itemId) => handleMenuItemPress(section.id, itemId)}
              />
            </View>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings:logout')}
            testID="profile-logout"
            onPress={handleLogout}
            style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
          >
            <LogOut size={19} color={theme.colors.accent.coral} strokeWidth={1.75} />
            <Text style={styles.logoutText}>{t('settings:logout')}</Text>
          </Pressable>

          <Text style={styles.version}>{t('app:profile.versionFooter', { version: '1.0.0' })}</Text>

          {meQuery.isFetching && !meQuery.isLoading ? (
            <Text variant="caption" color="secondary" style={styles.syncHint}>
              {t('app:profile.syncing')}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <ProfileEditSheet
        visible={editOpen}
        profile={profile}
        loading={updateMeMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSave={async (input) => {
          try {
            const { language: nextLanguage, ...rest } = input;
            await updateMeMutation.mutateAsync({ ...rest, language: nextLanguage });
            if (nextLanguage !== profile?.language) {
              await setAppLanguage(nextLanguage);
            }
            setEditOpen(false);
          } catch (err) {
            Alert.alert(t('app:profile.couldNotSave'), parseApiError(err).message);
          }
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: HOME_V2.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: 120,
    },
    body: {
      paddingHorizontal: theme.spacing.lg,
    },
    lift: {
      marginTop: HOME_V2.bodyLift,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    logout: {
      marginTop: 18,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      paddingVertical: 15,
      borderRadius: 18,
      backgroundColor: '#FDE6E4',
      borderWidth: 1,
      borderColor: '#FAD5D2',
    },
    logoutPressed: {
      opacity: 0.92,
    },
    logoutText: {
      fontSize: 13.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: theme.colors.accent.coral,
    },
    version: {
      textAlign: 'center',
      fontSize: 10.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: '#A2A5BC',
      marginTop: 10,
      marginBottom: 4,
    },
    syncHint: {
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });
}
