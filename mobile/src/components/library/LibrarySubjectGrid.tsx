import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../Text';
import { resolveTestSubjectIcon } from '../home/homeUtils';
import { platformShadow } from '../../utils/platformShadow';
import type { SubjectGroup } from './libraryUtils';
import { SUBJECT_TONE, LIBRARY_UI } from './libraryTheme';

type LibrarySubjectGridProps = {
  groups: SubjectGroup[];
  activeSubject?: string | null;
  onSubjectPress: (subject: string) => void;
};

export function LibrarySubjectGrid({
  groups,
  activeSubject,
  onSubjectPress,
}: LibrarySubjectGridProps) {
  return (
    <View style={styles.grid}>
      {groups.map((group) => (
        <SubjectTile
          key={group.subject}
          labelKey={group.labelKey}
          subject={group.subject}
          count={group.count}
          tone={group.tone}
          active={activeSubject === group.subject}
          onPress={() => onSubjectPress(group.subject)}
        />
      ))}
    </View>
  );
}

function SubjectTile({
  labelKey,
  subject,
  count,
  tone,
  active,
  onPress,
}: {
  labelKey: string;
  subject: string;
  count: number;
  tone: SubjectGroup['tone'];
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation('app');
  const Icon = resolveTestSubjectIcon(subject);
  const colors = SUBJECT_TONE[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        active && styles.tileActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.bg }]}>
        <Icon size={21} color={colors.fg} strokeWidth={2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {t(labelKey)}
        </Text>
        <Text style={styles.count}>{t('books.subjectCount', { count })}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: LIBRARY_UI.surface,
    borderWidth: 1,
    borderColor: LIBRARY_UI.line,
    borderRadius: 17,
    padding: 14,
    ...platformShadow({ color: LIBRARY_UI.navy, offsetY: 10, opacity: 0.08, radius: 16, elevation: 2 }),
  },
  tileActive: {
    borderColor: LIBRARY_UI.gold,
    backgroundColor: LIBRARY_UI.goldSoft,
  },
  pressed: { opacity: 0.92 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: LIBRARY_UI.ink,
  },
  count: {
    fontSize: 10.5,
    fontWeight: '600',
    color: LIBRARY_UI.muted,
    marginTop: 2,
  },
});
