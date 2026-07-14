import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckSquare, GraduationCap, Mail, MapPin, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/auth';
import { PROFILE, profileCard } from './profileTheme';
import { MENU_TONE_STYLES } from '../premium/premiumIconTokens';
import { maskPhoneForProfile } from './profileUtils';

type DetailRow = {
  id: string;
  label: string;
  value: string;
  tone: 'indigo' | 'teal' | 'gold' | 'coral';
  icon: typeof Mail;
  testID?: string;
};

function buildRows(
  profile: Profile,
  t: (key: string) => string,
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string,
): DetailRow[] {
  const notSet = t('profile.notSet');
  const examSuffix = profile.examDate
    ? formatDate(profile.examDate, { month: 'short', year: 'numeric' })
    : '';
  const targetExam = profile.targetExam
    ? examSuffix
      ? `${profile.targetExam} · ${examSuffix}`
      : profile.targetExam
    : notSet;

  return [
    {
      id: 'email',
      label: t('profile.emailLabel'),
      value: profile.email?.trim() || notSet,
      tone: 'indigo',
      icon: Mail,
      testID: 'profile-detail-email',
    },
    {
      id: 'phone',
      label: t('profile.phoneLabel'),
      value: profile.phone ? maskPhoneForProfile(profile.phone) : notSet,
      tone: 'teal',
      icon: Phone,
      testID: 'profile-detail-phone',
    },
    {
      id: 'target-exam',
      label: t('profile.targetExam'),
      value: targetExam,
      tone: 'gold',
      icon: CheckSquare,
      testID: 'profile-detail-target-exam',
    },
    {
      id: 'state',
      label: t('profile.stateLabel'),
      value: profile.state || notSet,
      tone: 'indigo',
      icon: MapPin,
      testID: 'profile-detail-state',
    },
    {
      id: 'education',
      label: t('profile.educationLabel'),
      value: profile.educationLevel || notSet,
      tone: 'teal',
      icon: GraduationCap,
      testID: 'profile-detail-education',
    },
  ];
}

type ProfileAccountDetailsProps = {
  profile: Profile;
};

export function ProfileAccountDetails({ profile }: ProfileAccountDetailsProps) {
  const { t } = useTranslation('app');
  const { formatDate } = useFormat();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rows = useMemo(() => buildRows(profile, t, formatDate), [profile, t, formatDate]);

  return (
    <View style={styles.card}>
      {rows.map((row, index) => {
        const tone = MENU_TONE_STYLES[row.tone];
        const Icon = row.icon;
        return (
          <View
            key={row.id}
            testID={row.testID}
            style={[styles.row, index > 0 && styles.rowBorder]}
          >
            <View style={[styles.icon, { backgroundColor: tone.bg }]}>
              <Icon size={18} color={tone.fg} strokeWidth={1.75} />
            </View>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    card: {
      paddingHorizontal: 16,
      paddingVertical: 4,
      ...profileCard(theme),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingVertical: 13,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: PROFILE.hair,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PROFILE.muted,
    },
    value: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: PROFILE.ink2,
      maxWidth: '46%',
      textAlign: 'right',
    },
  });
}
