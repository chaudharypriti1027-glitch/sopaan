import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CheckSquare, Globe, GraduationCap, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { useFormat } from '../../i18n/useFormat';
import { useTheme } from '../../theme';
import type { Profile } from '../../types/auth';
import { homePremiumCard } from '../home/homeStyles';
import { MENU_TONE_STYLES } from '../premium/premiumIconTokens';
import { PREMIUM } from '../premium/premiumStyles';

type DetailRow = {
  id: string;
  label: string;
  value: string;
  tone: 'indigo' | 'teal' | 'gold' | 'coral';
  icon: typeof CheckSquare;
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

  const languageValue =
    profile.language === 'hi'
      ? t('common:languageHindi')
      : profile.language === 'gu'
        ? t('app:profile.languageGu')
        : t('common:languageEnglish');

  return [
    {
      id: 'target-exam',
      label: t('profile.targetExam'),
      value: targetExam,
      tone: 'indigo',
      icon: CheckSquare,
      testID: 'profile-detail-target-exam',
    },
    {
      id: 'state',
      label: t('profile.stateLabel'),
      value: profile.state || notSet,
      tone: 'teal',
      icon: MapPin,
      testID: 'profile-detail-state',
    },
    {
      id: 'education',
      label: t('profile.educationLabel'),
      value: profile.educationLevel || notSet,
      tone: 'gold',
      icon: GraduationCap,
      testID: 'profile-detail-education',
    },
    {
      id: 'language',
      label: t('profile.languageLabel'),
      value: languageValue,
      tone: 'coral',
      icon: Globe,
      testID: 'profile-detail-language',
    },
  ];
}

type ProfileAccountDetailsProps = {
  profile: Profile;
};

export function ProfileAccountDetails({ profile }: ProfileAccountDetailsProps) {
  const { t } = useTranslation(['app', 'common']);
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
      ...homePremiumCard(theme),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingVertical: 13,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: PREMIUM.hairline,
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
      color: theme.colors.text.secondary,
    },
    value: {
      fontSize: 13,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: theme.colors.text.primary,
      maxWidth: '46%',
      textAlign: 'right',
    },
  });
}
