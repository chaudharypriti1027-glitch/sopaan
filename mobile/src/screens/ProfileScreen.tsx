import { useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LogOut, UserRound } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Text } from '../components/Text';
import { ProfileAnimatedSection } from '../components/profile/ProfileAnimatedSection';
import { useProfileReplay } from '../components/profile/useProfileReplay';
import { ProfileAccountDetails } from '../components/profile/ProfileAccountDetails';
import { ProfileAchievementsStrip } from '../components/profile/ProfileAchievementsStrip';
import { ProfileCompletionCard } from '../components/profile/ProfileCompletionCard';
import { ProfileEditSheet } from '../components/profile/ProfileEditSheet';
import { ProfileAvatarPickerSheet } from '../components/profile/ProfileAvatarPickerSheet';
import { ProfileGoalStrip } from '../components/profile/ProfileGoalStrip';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileQuickHub } from '../components/profile/ProfileQuickHub';
import { useProfileAvatar } from '../components/profile/useProfileAvatar';
import { ProfileMenuSectionCard } from '../components/profile/ProfileMenuSectionCard';
import { ProfileProCard } from '../components/profile/ProfileProCard';
import { ProfileSection } from '../components/profile/ProfileSection';
import { ProfileStatsCard } from '../components/profile/ProfileStatsCard';
import { ProfileXpCard } from '../components/profile/ProfileXpCard';
import { buildProfileMenuSections } from '../components/profile/profileMenu';
import { PROFILE, profileCard } from '../components/profile/profileTheme';
import { usePremiumDialog } from '../components/premium/PremiumDialogProvider';
import { PremiumEmptyState } from '../components/premium/PremiumEmptyState';
import { useAuth } from '../auth';
import { useBadges, useMe, useProfileSummary, useUpdateMe } from '../hooks';
import { queryKeys } from '../hooks/queryKeys';
import type { AppTabParamList, MainStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { parseApiError } from '../api';
import { uploadAvatar } from '../api/me';
import { HELP_CENTER_URL } from '../config/externalLinks';
import { pickImageAsset } from '../utils/imagePicker';
import { useAuthStore } from '../store/auth';
import type { AvatarPresetId } from '../components/profile/avatarPresets';
import { useLanguage } from '../language/LanguageContext';

type ProfileNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Profile'>,
  NativeStackNavigationProp<MainStackParamList>
>;

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
  const badgesQuery = useBadges();
  const updateMeMutation = useUpdateMe();
  const { setLanguage: setAppLanguage } = useLanguage();
  const profile = meQuery.data;
  const summary = summaryQuery.data;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const replayKey = useProfileReplay();

  const [editOpen, setEditOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const { display: avatarDisplay, presetId, applyPreset, clearPreset } = useProfileAvatar(profile);

  const menuSections = useMemo(
    () => (profile ? buildProfileMenuSections(profile) : []),
    [profile],
  );

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        void summaryQuery.refetch();
        void badgesQuery.refetch();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile, summaryQuery.refetch, badgesQuery.refetch]),
  );

  const mainNav = () => navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  const { confirm } = usePremiumDialog();

  const handleLogout = () => {
    confirm({
      title: t('settings:logoutConfirm'),
      message: t('app:profile.logoutBody'),
      confirmLabel: t('settings:logout'),
      icon: 'logout',
      tone: 'danger',
      onConfirm: () => {
        void logout();
      },
    });
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

    if (item.route) {
      mainNav()?.navigate(item.route as never);
    }
  };

  const handleUploadAvatar = async (source: 'library' | 'camera') => {
    if (avatarLoading || !profile) {
      return;
    }

    const asset = await pickImageAsset(source);
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
      await clearPreset();
      await setProfile(updated);
      queryClient.setQueryData(queryKeys.account.me(), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.summary() });
      setAvatarPickerOpen(false);
    } catch (err) {
      Alert.alert(t('app:profile.couldNotUpload'), parseApiError(err).message);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSelectPreset = async (id: AvatarPresetId) => {
    if (avatarLoading || !profile) {
      return;
    }

    setAvatarLoading(true);
    try {
      await applyPreset(id);
      if (profile.avatarUrl) {
        const updated = await updateMeMutation.mutateAsync({ avatarUrl: '' });
        await setProfile(updated);
        queryClient.setQueryData(queryKeys.account.me(), updated);
      }
      setAvatarPickerOpen(false);
    } catch (err) {
      Alert.alert(t('app:profile.couldNotSave'), parseApiError(err).message);
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.centered}>
          <PremiumEmptyState
            title={t('app:profile.signInPrompt')}
            hint={t('app:profile.signInHint')}
            Icon={UserRound}
            tone="lavender"
          />
        </View>
      </SafeAreaView>
    );
  }

  const xp = summary?.xp ?? profile.xp ?? 0;
  const level = summary?.level ?? profile.level ?? 1;
  const isPremium = Boolean(profile.isPremium);

  const handleMembershipPress = () => {
    mainNav()?.navigate(isPremium ? 'ManageSubscription' : 'Premium');
  };

  const handleHubNavigate = (route: string) => {
    mainNav()?.navigate(route as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={[PROFILE.bgTop, PROFILE.bg, PROFILE.bgMid]}
        locations={[0, 0.42, 1]}
        style={styles.bgGradient}
        pointerEvents="none"
      />
      <View style={styles.bgGlow} pointerEvents="none" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          profile={profile}
          xp={xp}
          replayKey={replayKey}
          avatarDisplay={avatarDisplay}
          avatarLoading={avatarLoading}
          onEditPress={() => setEditOpen(true)}
          onSettingsPress={() => mainNav()?.navigate('Settings')}
          onAvatarPress={() => setAvatarPickerOpen(true)}
        />

        <View style={styles.body}>
          <View style={styles.lift}>
            <ProfileAnimatedSection index={0} replayKey={replayKey}>
              <ProfileStatsCard profile={profile} summary={summary} replayKey={replayKey} />
            </ProfileAnimatedSection>
          </View>

          <View style={styles.stack}>
            <ProfileAnimatedSection index={1} replayKey={replayKey}>
              <ProfileGoalStrip profile={profile} onEditPress={() => setEditOpen(true)} />
            </ProfileAnimatedSection>

            <ProfileAnimatedSection index={2} replayKey={replayKey}>
              <ProfileXpCard level={level} xp={xp} replayKey={replayKey} />
            </ProfileAnimatedSection>

            <ProfileAnimatedSection index={3} replayKey={replayKey}>
              <ProfileQuickHub summary={summary} onNavigate={handleHubNavigate} />
            </ProfileAnimatedSection>

            <ProfileAnimatedSection index={4} replayKey={replayKey}>
              <ProfileSection title={t('app:profile.membership')}>
                <ProfileProCard isPremium={isPremium} onPress={handleMembershipPress} />
              </ProfileSection>
            </ProfileAnimatedSection>

            <ProfileAnimatedSection index={5} replayKey={replayKey}>
              <ProfileSection title={t('app:profile.achievementsSection')}>
                <ProfileAchievementsStrip
                  badges={badgesQuery.data ?? []}
                  loading={badgesQuery.isLoading}
                  replayKey={replayKey}
                  onPress={() => mainNav()?.navigate('Rewards')}
                />
              </ProfileSection>
            </ProfileAnimatedSection>

            <ProfileAnimatedSection index={6} replayKey={replayKey}>
              <ProfileCompletionCard profile={profile} replayKey={replayKey} />
            </ProfileAnimatedSection>

            <ProfileAnimatedSection index={7} replayKey={replayKey}>
              <ProfileSection title={t('app:profile.accountDetailsSection')}>
                <ProfileAccountDetails profile={profile} />
              </ProfileSection>
            </ProfileAnimatedSection>

            {menuSections.map((section, sectionOffset) => (
              <ProfileAnimatedSection
                key={section.id}
                index={8 + sectionOffset}
                replayKey={replayKey}
              >
                <ProfileSection title={t(`app:profile.menu.${section.titleKey}`)}>
                  <ProfileMenuSectionCard
                    section={section}
                    summary={summary}
                    summaryLoading={summaryQuery.isLoading}
                    onItemPress={(itemId) => handleMenuItemPress(section.id, itemId)}
                  />
                </ProfileSection>
              </ProfileAnimatedSection>
            ))}

            <ProfileAnimatedSection index={10} replayKey={replayKey}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('settings:logout')}
                testID="profile-logout"
                onPress={handleLogout}
                style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
              >
                <LogOut size={19} color={PROFILE.navy} strokeWidth={1.75} />
                <Text style={styles.logoutText}>{t('settings:logout')}</Text>
              </Pressable>

              <Text style={styles.version}>
                {t('app:profile.versionFooter', { version: appVersion })}
              </Text>
            </ProfileAnimatedSection>
          </View>

          {meQuery.isFetching && !meQuery.isLoading ? (
            <Text variant="caption" color="secondary" style={styles.syncHint}>
              {t('app:profile.syncing')}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <ProfileAvatarPickerSheet
        visible={avatarPickerOpen}
        profile={profile}
        display={avatarDisplay}
        presetId={presetId}
        loading={avatarLoading}
        onClose={() => setAvatarPickerOpen(false)}
        onSelectPreset={(id) => void handleSelectPreset(id)}
        onPickLibrary={() => void handleUploadAvatar('library')}
        onPickCamera={() => void handleUploadAvatar('camera')}
      />

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
      backgroundColor: PROFILE.bg,
    },
    bgGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    bgGlow: {
      position: 'absolute',
      top: 280,
      alignSelf: 'center',
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: 'rgba(194,154,78,0.08)',
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: PROFILE.tabBottomPad,
    },
    body: {
      paddingHorizontal: PROFILE.horizontalPad,
    },
    lift: {
      marginTop: PROFILE.bodyLift,
      zIndex: 5,
    },
    stack: {
      gap: 14,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    logout: {
      marginTop: 6,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      paddingVertical: 15,
      ...profileCard(theme),
    },
    logoutPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    logoutText: {
      fontSize: 13.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.navy,
    },
    version: {
      textAlign: 'center',
      fontSize: 10.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PROFILE.faint,
      marginTop: 10,
      marginBottom: 4,
    },
    syncHint: {
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
  });
}
