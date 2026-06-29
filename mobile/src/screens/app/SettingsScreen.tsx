import {
  Bell,
  BookOpen,
  ChevronRight,
  Download,
  Headphones,
  HelpCircle,
  Languages,
  LogOut,
  MessageCircle,
  Moon,
  Shield,
  Target,
  Trash2,
  User,
  Volume2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import { Button, Card, ChipSelect, Screen, SectionTitle } from '../../components';
import { parseApiError, privacyApi } from '../../api';
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
import {
  HELP_CENTER_URL,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  WHATSAPP_COMMUNITY_URL,
} from '../../config/externalLinks';

type SettingsNav = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
};

function SettingsRow({ icon, label, description, value, onPress, trailing }: SettingsRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createRowStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress && !trailing}
      style={styles.row}
    >
      <View style={styles.iconWrap}>{icon}</View>
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
      Alert.alert(t('settings:devBuildRequired'), pushUnavailableReason() ?? t('settings:pushDevBuild'));
      return;
    }

    if (enabled) {
      const ok = await enablePushNotifications();
      if (!ok) {
        Alert.alert(t('settings:notificationsBlocked'), t('settings:notificationsBlockedBody'));
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
      Alert.alert(t('settings:notificationPrefFailed'), String(err));
    }
  };

  const handleQuietHoursToggle = async (enabled: boolean) => {
    try {
      await patchNotificationPrefs({ quietHours: { enabled } });
    } catch (err) {
      Alert.alert(t('settings:quietHoursFailed'), String(err));
    }
  };

  const handleMarketingToggle = async (enabled: boolean) => {
    try {
      await privacyApi.updateMarketingConsent(enabled);
      setMarketingConsent(enabled);
    } catch (err) {
      Alert.alert(t('settings:marketingFailed'), parseApiError(err).message);
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
      Alert.alert(t('settings:exportFailed'), parseApiError(err).message);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('settings:logoutTitle'), t('settings:logoutBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('settings:logout'),
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  const handleSaveGoal = () => {
    updateGoal.mutate(
      { examTrack: selectedTrack, targetYear },
      {
        onSuccess: () => {
          setShowGoalPicker(false);
          Alert.alert(t('settings:goalUpdated'), t('settings:goalUpdatedBody', { track: selectedTrack }));
        },
        onError: (err) => Alert.alert(t('settings:goalSaveFailed'), String(err)),
      },
    );
  };

  const goalOptions = CAREER_GOALS.map((g) => ({ value: g.examTrack, label: g.title }));
  const pushEnabled = notificationPrefs?.pushNotificationsEnabled ?? localSettings?.pushNotifications ?? true;
  const quietHours = notificationPrefs?.quietHours;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <SectionTitle title={t('settings:title')} subtitle={t('settings:subtitle')} />

      <Text style={styles.groupLabel}>{t('settings:account')}</Text>
      <Card style={styles.group}>
        <SettingsRow
          icon={<User size={18} color={theme.colors.brand.primary} />}
          label={t('settings:name')}
          value={user?.name}
        />
        <SettingsRow
          icon={<User size={18} color={theme.colors.brand.primary} />}
          label={t('settings:emailPhone')}
          value={user?.email ?? user?.phone ?? '—'}
        />
        <SettingsRow
          icon={<Target size={18} color={theme.colors.brand.primary} />}
          label={t('settings:goal')}
          value={profileQuery.data?.profile.goal?.examTrack ?? t('settings:notSet')}
          onPress={() => setShowGoalPicker((v) => !v)}
        />
      </Card>

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

      <Text style={styles.groupLabel}>{t('settings:study')}</Text>
      <Card style={styles.group}>
        <SettingsRow
          icon={<Languages size={18} color={theme.colors.brand.primary} />}
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
          icon={<Volume2 size={18} color={theme.colors.brand.primary} />}
          label={t('settings:focusSounds')}
          trailing={
            <Switch
              value={localSettings?.focusSounds ?? true}
              onValueChange={(v) => void patchLocalSetting({ focusSounds: v })}
              trackColor={{ true: theme.colors.brand.primary }}
            />
          }
        />
      </Card>

      <Text style={styles.groupLabel}>{t('settings:notifications')}</Text>
      <Card style={styles.group}>
        <SettingsRow
          icon={<Bell size={18} color={theme.colors.brand.primary} />}
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
          icon={<Moon size={18} color={theme.colors.brand.primary} />}
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
      </Card>

      <Card style={styles.group}>
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
      </Card>

      <Text style={styles.groupLabel}>{t('settings:privacyData')}</Text>
      <Card style={styles.group}>
        <SettingsRow
          icon={<Shield size={18} color={theme.colors.brand.primary} />}
          label={t('settings:privacyPolicy')}
          description={t('settings:privacyPolicyDesc')}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        />
        <SettingsRow
          icon={<Download size={18} color={theme.colors.brand.primary} />}
          label={t('settings:downloadData')}
          description={t('settings:downloadDataDesc')}
          onPress={() => void handleExportData()}
          trailing={exporting ? <Text style={styles.exportingLabel}>…</Text> : undefined}
        />
        <SettingsRow
          icon={<Bell size={18} color={theme.colors.brand.primary} />}
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
          icon={<Trash2 size={18} color={theme.colors.semantic.error} />}
          label={t('settings:deleteAccount')}
          description={t('settings:deleteAccountDesc')}
          onPress={() => navigation.navigate('DeleteAccount')}
        />
      </Card>

      <Text style={styles.groupLabel}>{t('settings:support')}</Text>
      <Card style={styles.group}>
        <SettingsRow
          icon={<MessageCircle size={18} color={theme.colors.brand.primary} />}
          label={t('settings:whatsappCommunity')}
          description={t('settings:whatsappCommunityDesc')}
          onPress={() => void Linking.openURL(WHATSAPP_COMMUNITY_URL)}
        />
        <SettingsRow
          icon={<HelpCircle size={18} color={theme.colors.brand.primary} />}
          label={t('settings:helpCentre')}
          onPress={() => void Linking.openURL(HELP_CENTER_URL)}
        />
        <SettingsRow
          icon={<Headphones size={18} color={theme.colors.brand.primary} />}
          label={t('settings:contactSupport')}
          onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
        />
        <SettingsRow
          icon={<BookOpen size={18} color={theme.colors.brand.primary} />}
          label={t('settings:privacyPolicyWeb')}
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        />
      </Card>

      {__DEV__ && process.env.EXPO_PUBLIC_SENTRY_DSN ? (
        <Card style={styles.group}>
          <SettingsRow
            icon={<HelpCircle size={18} color={theme.colors.brand.primary} />}
            label="Send Sentry test error"
            description="Throws a test error to verify release tags and source maps."
            onPress={() => {
              try {
                captureSentryTestError();
              } catch {
                Alert.alert('Sentry test error sent', 'Check your Sentry project for the event.');
              }
            }}
          />
        </Card>
      ) : null}

      <Button
        label={t('settings:logout')}
        variant="ghost"
        icon={<LogOut size={18} color={theme.colors.semantic.error} />}
        onPress={handleLogout}
        fullWidth
      />
    </Screen>
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
      backgroundColor: theme.colors.brand.primaryMuted,
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
    groupLabel: {
      ...theme.typography.presets.eyebrow,
      color: theme.colors.text.tertiary,
      marginBottom: -theme.spacing.sm,
    },
    group: { paddingVertical: theme.spacing.xs },
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
