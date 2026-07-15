import {
  Bell,
  BookOpen,
  ChevronRight,
  Download,
  Headphones,
  HelpCircle,
  KeyRound,
  Languages,
  LogOut,
  MessageCircle,
  Moon,
  Shield,
  Target,
  Trash2,
  User,
  Volume2,
  type LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import { Button, Card, ChipSelect, FeatureScreenLayout, PremiumSectionLabel } from '../../components';
import { premiumCard } from '../../components/premium/premiumStyles';
import { usePremiumDialog } from '../../components/premium/PremiumDialogProvider';
import { MENU_TONE_STYLES } from '../../components/premium/premiumIconTokens';
import { privacyApi } from '../../api';
import { useAuth } from '../../auth';
import { CAREER_GOALS, getTargetYearOptions } from '../../auth/onboardingData';
import { useProfile, useUpdateGoal } from '../../hooks';
import { loadSettings, saveSettings, type AppSettings } from '../../settings/settingsStorage';
import {
  disablePushNotifications,
  enablePushNotifications,
  isPushNotificationsSupported,
  pushUnavailableReason,
} from '../../hooks/usePushNotifications';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
  type NotificationTypePreferences,
} from '../../api/notifications';
import { LANGUAGE_LABELS } from '../../language/types';
import { useLanguage } from '../../language/LanguageContext';
import { useTheme } from '../../theme';
import type { MainStackParamList } from '../../navigation/types';
import { captureSentryTestError } from '../../observability/sentryTest';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import {
  HELP_CENTER_URL,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  TERMS_OF_SERVICE_URL,
  WHATSAPP_COMMUNITY_URL,
} from '../../config/externalLinks';

type SettingsNav = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

type MenuTone = keyof typeof MENU_TONE_STYLES;

type SettingsRowProps = {
  icon: LucideIcon;
  tone?: MenuTone;
  danger?: boolean;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  trailing?: ReactNode;
};

function SettingsRow({
  icon: Icon,
  tone = 'indigo',
  danger = false,
  label,
  description,
  value,
  onPress,
  trailing,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createRowStyles(theme), [theme]);
  const palette = MENU_TONE_STYLES[tone];
  const iconBg = danger ? theme.colors.semantic.errorMuted : palette.bg;
  const iconFg = danger ? theme.colors.semantic.error : palette.fg;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress && !trailing}
      style={styles.row}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconFg} strokeWidth={1.9} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      {trailing ?? (onPress ? <ChevronRight size={18} color={theme.colors.text.tertiary} /> : null)}
    </Pressable>
  );
}

type TypeToggleProps = {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

function TypeToggle({ label, description, value, disabled, onChange }: TypeToggleProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createRowStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.brand.primary }}
      />
    </View>
  );
}

const NOTIFICATION_TYPE_KEYS: (keyof NotificationTypePreferences)[] = [
  'plan_ready',
  'streak_reminder',
  'rank_up',
  'mock_live',
  'new_current_affairs',
  'progress_recap',
  'badge',
  'reward',
  'mentor',
  'premium_activated',
];

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(['settings', 'common']);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { confirm, alert, show } = usePremiumDialog();

  const profileQuery = useProfile();
  const updateGoal = useUpdateGoal();

  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(
    profileQuery.data?.profile.goal?.examTrack ?? CAREER_GOALS[0].examTrack,
  );
  const yearOptions = getTargetYearOptions();
  const [targetYear, setTargetYear] = useState(
    profileQuery.data?.profile.goal?.targetYear ?? yearOptions[1],
  );

  useEffect(() => {
    void (async () => {
      const local = await loadSettings();
      setLocalSettings(local);

      try {
        const prefs = await getNotificationPreferences();
        setNotificationPrefs(prefs);
        await saveSettings({ pushNotifications: prefs.pushNotificationsEnabled });
      } catch {
        // keep local defaults when offline
      }

      try {
        const consent = await privacyApi.getConsentStatus();
        setMarketingConsent(Boolean(consent.consent?.marketing));
      } catch {
        // offline
      }
    })();
  }, []);

  useEffect(() => {
    const goal = profileQuery.data?.profile.goal;
    if (goal?.examTrack) setSelectedTrack(goal.examTrack);
    if (goal?.targetYear) setTargetYear(goal.targetYear);
  }, [profileQuery.data]);

  const patchLocalSetting = useCallback(async (patch: Partial<AppSettings>) => {
    const next = await saveSettings(patch);
    setLocalSettings(next);
  }, []);

  const patchNotificationPrefs = useCallback(
    async (patch: Parameters<typeof updateNotificationPreferences>[0]) => {
      const next = await updateNotificationPreferences(patch);
      setNotificationPrefs(next);
      return next;
    },
    [],
  );

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && !isPushNotificationsSupported()) {
      alert({
        title: t('settings:devBuildRequired'),
        message: pushUnavailableReason() ?? t('settings:pushDevBuild'),
        icon: 'bell',
        iconTone: 'navy',
        confirmLabel: t('common:premiumDialog.gotIt'),
      });
      return;
    }

    if (enabled) {
      const ok = await enablePushNotifications();
      if (!ok) {
        show({
          title: t('common:premiumDialog.notificationsPermissionTitle'),
          message: t('settings:notificationsBlockedBody'),
          icon: 'bell',
          iconTone: 'sage',
          testID: 'premium-notifications-permission-dialog',
          actions: [
            {
              label: t('common:premiumDialog.notNow'),
              variant: 'ghost',
            },
            ...(Platform.OS !== 'web'
              ? [
                  {
                    label: t('common:premiumDialog.openSettings'),
                    variant: 'gold' as const,
                    onPress: () => {
                      void Linking.openSettings();
                    },
                  },
                ]
              : [
                  {
                    label: t('common:premiumDialog.gotIt'),
                    variant: 'gold' as const,
                  },
                ]),
          ],
        });
        return;
      }
    } else {
      await disablePushNotifications();
    }

    await patchLocalSetting({ pushNotifications: enabled });
    setNotificationPrefs((current) =>
      current ? { ...current, pushNotificationsEnabled: enabled } : current,
    );
  };

  const handleTypeToggle = async (key: keyof NotificationTypePreferences, enabled: boolean) => {
    try {
      await patchNotificationPrefs({ types: { [key]: enabled } });
    } catch (err) {
      alert({
        title: t('settings:notificationPrefFailed'),
        message: getUserFacingMessage(err),
        icon: 'info',
        iconTone: 'coral',
      });
    }
  };

  const handleQuietHoursToggle = async (enabled: boolean) => {
    try {
      await patchNotificationPrefs({ quietHours: { enabled } });
    } catch (err) {
      alert({
        title: t('settings:quietHoursFailed'),
        message: getUserFacingMessage(err),
        icon: 'info',
        iconTone: 'coral',
      });
    }
  };

  const handleMarketingToggle = async (enabled: boolean) => {
    try {
      await privacyApi.updateMarketingConsent(enabled);
      setMarketingConsent(enabled);
    } catch (err) {
      alert({
        title: t('settings:marketingFailed'),
        message: getUserFacingMessage(err),
        icon: 'shield',
        iconTone: 'navy',
      });
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await privacyApi.exportUserData();
      const path = `${FileSystem.documentDirectory}sopaan-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
      await Share.share({
        title: t('settings:exportTitle'),
        message: t('settings:exportMessage'),
        url: path,
      });
    } catch (err) {
      alert({
        title: t('settings:exportFailed'),
        message: getUserFacingMessage(err),
        icon: 'info',
        iconTone: 'coral',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: t('settings:logoutConfirm'),
      message: t('settings:logoutBody'),
      confirmLabel: t('settings:logout'),
      icon: 'logout',
      tone: 'danger',
      onConfirm: () => {
        void logout();
      },
    });
  };

  const handleSaveGoal = () => {
    updateGoal.mutate(
      { examTrack: selectedTrack, targetYear },
      {
        onSuccess: () => {
          setShowGoalPicker(false);
          alert({
            title: t('settings:goalUpdated'),
            message: t('settings:goalUpdatedBody', { track: selectedTrack }),
            icon: 'sparkles',
            iconTone: 'gold',
          });
        },
        onError: (err) =>
          alert({
            title: t('settings:goalSaveFailed'),
            message: getUserFacingMessage(err),
            icon: 'info',
            iconTone: 'coral',
          }),
      },
    );
  };

  const goalOptions = CAREER_GOALS.filter((g) => g.examTrack !== 'Other').map((g) => ({
    value: g.examTrack,
    label: g.title,
  }));
  const pushEnabled = notificationPrefs?.pushNotificationsEnabled ?? localSettings?.pushNotifications ?? true;
  const quietHours = notificationPrefs?.quietHours;

  return (
    <FeatureScreenLayout
      title={t('settings:title')}
      subtitle={t('settings:subtitle')}
      contentStyle={styles.content}
    >
      <PremiumSectionLabel title={t('settings:account')} compact />
      <View style={[styles.group, premiumCard(theme)]}>
        <SettingsRow
          icon={User}
          tone="indigo"
          label={t('settings:name')}
          value={user?.name}
        />
        <SettingsRow
          icon={User}
          tone="indigo"
          label={t('settings:emailPhone')}
          value={user?.email ?? user?.phone ?? '—'}
        />
        <SettingsRow
          icon={KeyRound}
          tone="coral"
          label={t('settings:changePassword')}
          description={t('settings:changePasswordDesc')}
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <SettingsRow
          icon={Target}
          tone="gold"
          label={t('settings:goal')}
          value={profileQuery.data?.profile.goal?.examTrack ?? t('settings:notSet')}
          onPress={() => setShowGoalPicker((v) => !v)}
        />
      </View>

      {showGoalPicker ? (
        <Card style={styles.goalCard}>
          <Text style={styles.fieldLabel}>{t('settings:careerGoal')}</Text>
          <View style={styles.chipRow}>
            {goalOptions.map((option) => (
              <ChipSelect
                key={option.value}
                label={option.label}
                selected={selectedTrack === option.value}
                onPress={() => setSelectedTrack(option.value)}
              />
            ))}
          </View>
          <Text style={styles.fieldLabel}>{t('settings:targetYear')}</Text>
          <View style={styles.chipRow}>
            {yearOptions.map((year) => (
              <ChipSelect
                key={year}
                label={String(year)}
                selected={targetYear === year}
                onPress={() => setTargetYear(year)}
              />
            ))}
          </View>
          <Button label={t('settings:saveGoal')} onPress={handleSaveGoal} loading={updateGoal.isPending} fullWidth />
        </Card>
      ) : null}

      <PremiumSectionLabel title={t('settings:study')} />
      <View style={[styles.group, premiumCard(theme)]}>
        <SettingsRow
          icon={Languages}
          tone="teal"
          label={t('settings:language')}
          value={LANGUAGE_LABELS[language]}
        />
        <View style={styles.languageRow}>
          <ChipSelect
            label={t('common:languageEnglish')}
            selected={language === 'en'}
            onPress={() => void setLanguage('en')}
          />
          <ChipSelect
            label={t('common:languageHindi')}
            selected={language === 'hi'}
            onPress={() => void setLanguage('hi')}
          />
          <ChipSelect
            label={t('common:languageGu')}
            selected={language === 'gu'}
            onPress={() => void setLanguage('gu')}
          />
        </View>
        <SettingsRow
          icon={Volume2}
          tone="coral"
          label={t('settings:focusSounds')}
          trailing={
            <Switch
              value={localSettings?.focusSounds ?? true}
              onValueChange={(v) => void patchLocalSetting({ focusSounds: v })}
              trackColor={{ true: theme.colors.brand.primary }}
            />
          }
        />
      </View>

      <PremiumSectionLabel title={t('settings:notifications')} />
      <View style={[styles.group, premiumCard(theme)]}>
        <SettingsRow
          icon={Bell}
          tone="gold"
          label={t('settings:pushNotifications')}
          description={
            isPushNotificationsSupported()
              ? t('settings:pushCap', { count: notificationPrefs?.dailyPushCap ?? 8 })
              : t('settings:pushDevBuild')
          }
          trailing={
            <Switch
              value={pushEnabled}
              onValueChange={(v) => void handlePushToggle(v)}
              disabled={!isPushNotificationsSupported()}
              trackColor={{ true: theme.colors.brand.primary }}
            />
          }
        />
        <SettingsRow
          icon={Moon}
          tone="indigo"
          label={t('settings:quietHours')}
          description={
            quietHours
              ? `${quietHours.start}–${quietHours.end} (${quietHours.timezone})`
              : t('settings:quietHoursDefault')
          }
          trailing={
            <Switch
              value={quietHours?.enabled ?? true}
              onValueChange={(v) => void handleQuietHoursToggle(v)}
              disabled={!pushEnabled}
              trackColor={{ true: theme.colors.brand.primary }}
            />
          }
        />
      </View>

      <View style={[styles.group, premiumCard(theme)]}>
        {NOTIFICATION_TYPE_KEYS.map((key) => (
          <TypeToggle
            key={key}
            label={t(`settings:notificationTypes.${key}.label`)}
            description={t(`settings:notificationTypes.${key}.description`)}
            value={
              notificationPrefs?.types?.[key] ??
              (key === 'new_current_affairs' ? false : true)
            }
            disabled={!pushEnabled}
            onChange={(v) => void handleTypeToggle(key, v)}
          />
        ))}
      </View>

      <PremiumSectionLabel title={t('settings:privacyData')} />
      <View style={[styles.group, premiumCard(theme)]}>
        <SettingsRow
          icon={Shield}
          tone="teal"
          label={t('settings:privacyPolicy')}
          description={t('settings:privacyPolicyDesc')}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <SettingsRow
          icon={BookOpen}
          tone="coral"
          label={t('settings:termsOfService')}
          description={t('settings:termsOfServiceDesc')}
          onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)}
        />
        <SettingsRow
          icon={Download}
          tone="indigo"
          label={t('settings:downloadData')}
          description={t('settings:downloadDataDesc')}
          onPress={() => void handleExportData()}
          trailing={exporting ? <Text style={styles.exportingLabel}>…</Text> : undefined}
        />
        <SettingsRow
          icon={Bell}
          tone="gold"
          label={t('settings:marketingEmails')}
          description={t('settings:marketingDesc')}
          trailing={
            <Switch
              value={marketingConsent}
              onValueChange={(v) => void handleMarketingToggle(v)}
              trackColor={{ true: theme.colors.brand.primary }}
            />
          }
        />
        <SettingsRow
          icon={Trash2}
          danger
          label={t('settings:deleteAccount')}
          description={t('settings:deleteAccountDesc')}
          onPress={() => navigation.navigate('DeleteAccount')}
        />
      </View>

      <PremiumSectionLabel title={t('settings:support')} />
      <View style={[styles.group, premiumCard(theme)]}>
        <SettingsRow
          icon={MessageCircle}
          tone="teal"
          label={t('settings:whatsappCommunity')}
          description={t('settings:whatsappCommunityDesc')}
          onPress={() => void Linking.openURL(WHATSAPP_COMMUNITY_URL)}
        />
        <SettingsRow
          icon={HelpCircle}
          tone="indigo"
          label={t('settings:helpCentre')}
          onPress={() => void Linking.openURL(HELP_CENTER_URL)}
        />
        <SettingsRow
          icon={Headphones}
          tone="gold"
          label={t('settings:contactSupport')}
          onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
        />
        <SettingsRow
          icon={BookOpen}
          tone="coral"
          label={t('settings:privacyPolicyWeb')}
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        />
      </View>

      {__DEV__ && process.env.EXPO_PUBLIC_SENTRY_DSN ? (
        <View style={[styles.group, premiumCard(theme)]}>
          <SettingsRow
            icon={HelpCircle}
            tone="indigo"
            label="Send Sentry test error"
            description="Throws a test error to verify release tags and source maps."
            onPress={() => {
              try {
                captureSentryTestError();
              } catch {
                alert({
                  title: 'Sentry test error sent',
                  message: 'Check your Sentry project for the event.',
                  icon: 'info',
                });
              }
            }}
          />
        </View>
      ) : null}

      <Button
        label={t('settings:logout')}
        variant="ghost"
        icon={<LogOut size={18} color={theme.colors.semantic.error} />}
        onPress={handleLogout}
        fullWidth
      />
    </FeatureScreenLayout>
  );
}

function createRowStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.subtle,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { flex: 1, gap: theme.spacing.xs / 2 },
    label: {
      ...theme.typography.presets.bodyMedium,
      color: theme.colors.text.primary,
    },
    description: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
    value: { ...theme.typography.presets.caption, color: theme.colors.text.secondary },
  });
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: { gap: theme.spacing.lg, paddingBottom: theme.spacing['3xl'] },
    group: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
    },
    goalCard: { gap: theme.spacing.md },
    fieldLabel: {
      ...theme.typography.presets.label,
      color: theme.colors.text.secondary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    exportingLabel: {
      ...theme.typography.presets.caption,
      color: theme.colors.text.secondary,
    },
  });
}
