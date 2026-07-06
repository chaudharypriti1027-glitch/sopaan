import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumAvatar } from './PremiumAvatar';
import {
  AVATAR_BADGE_PRESETS,
  AVATAR_PERSON_PRESETS,
  getAvatarPreset,
  type AvatarPreset,
  type AvatarPresetId,
} from './avatarPresets';
import { PROFILE } from './profileTheme';
import { Text } from '../Text';
import { useTheme } from '../../theme';
import { platformShadow } from '../../utils/platformShadow';
import type { Profile } from '../../types/auth';
import type { ProfileAvatarDisplay } from './useProfileAvatar';

type ProfileAvatarPickerSheetProps = {
  visible: boolean;
  profile: Profile;
  display: ProfileAvatarDisplay;
  presetId: AvatarPresetId | null;
  loading?: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: AvatarPresetId) => void;
  onPickLibrary: () => void;
  onPickCamera: () => void;
};

function PresetGrid({
  presets,
  selected,
  onSelect,
  styles,
  t,
}: {
  presets: AvatarPreset[];
  selected: AvatarPresetId | null;
  onSelect: (id: AvatarPresetId) => void;
  styles: ReturnType<typeof createStyles>;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.grid}>
      {presets.map((preset) => {
        const active = selected === preset.id;
        return (
          <Pressable
            key={preset.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(preset.id)}
            style={({ pressed }) => [
              styles.presetTile,
              active && styles.presetTileActive,
              pressed && styles.pressed,
            ]}
            testID={`avatar-preset-${preset.id}`}
          >
            <PremiumAvatar preset={preset} size="lg" live={preset.kind === 'person'} />
            <Text style={[styles.presetLabel, active && styles.presetLabelActive]} numberOfLines={1}>
              {t(`profile.${preset.labelKey}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProfileAvatarPickerSheet({
  visible,
  profile,
  display,
  presetId,
  loading = false,
  onClose,
  onSelectPreset,
  onPickLibrary,
  onPickCamera,
}: ProfileAvatarPickerSheetProps) {
  const { t } = useTranslation('app');
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
  const [selected, setSelected] = useState<AvatarPresetId | null>(presetId);

  useEffect(() => {
    if (visible) {
      setSelected(presetId);
    }
  }, [visible, presetId]);

  const previewPreset = selected ? getAvatarPreset(selected) : display.kind === 'preset' ? display.preset : undefined;
  const previewPhoto = !selected && display.kind === 'photo' ? display.uri : undefined;

  const handleApply = () => {
    if (!selected) return;
    onSelectPreset(selected);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID="profile-avatar-picker"
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.avatarPickerTitle')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common:close')}
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <X size={18} color={PROFILE.ink} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.previewRow}>
            <PremiumAvatar
              name={profile.name}
              photoUri={previewPhoto}
              preset={previewPreset}
              size="xl"
              variant="profile"
              loading={loading}
            />
            <View style={styles.previewCopy}>
              <Text style={styles.previewName}>{profile.name}</Text>
              <Text style={styles.previewHint}>{t('profile.avatarPickerHint')}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.gridScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>{t('profile.avatarPersonSection')}</Text>
            <PresetGrid
              presets={AVATAR_PERSON_PRESETS}
              selected={selected}
              onSelect={setSelected}
              styles={styles}
              t={t}
            />

            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
              {t('profile.avatarBadgeSection')}
            </Text>
            <PresetGrid
              presets={AVATAR_BADGE_PRESETS}
              selected={selected}
              onSelect={setSelected}
              styles={styles}
              t={t}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onPickLibrary}
              disabled={loading}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              testID="avatar-pick-library"
            >
              <ImageIcon size={18} color={PROFILE.navy} strokeWidth={1.75} />
              <Text style={styles.actionText}>{t('profile.avatarFromGallery')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onPickCamera}
              disabled={loading}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              testID="avatar-pick-camera"
            >
              <Camera size={18} color={PROFILE.navy} strokeWidth={1.75} />
              <Text style={styles.actionText}>{t('profile.avatarTakePhoto')}</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!selected || loading}
            onPress={handleApply}
            style={({ pressed }) => [
              styles.saveBtn,
              (!selected || loading) && styles.saveBtnDisabled,
              pressed && selected && !loading && styles.pressed,
            ]}
            testID="avatar-preset-save"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>{t('profile.avatarSetPreset')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme'], bottomInset: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(26,31,59,0.45)',
    },
    dismiss: {
      flex: 1,
    },
    sheet: {
      maxHeight: '92%',
      backgroundColor: PROFILE.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 18,
      paddingBottom: Math.max(bottomInset, 16) + 8,
      borderWidth: 1,
      borderColor: PROFILE.line,
      borderBottomWidth: 0,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: PROFILE.hair,
      marginTop: 10,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.ink,
      letterSpacing: -0.3,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: PROFILE.hair,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      borderRadius: 18,
      backgroundColor: PROFILE.bg,
      borderWidth: 1,
      borderColor: PROFILE.line,
      marginBottom: 14,
    },
    previewCopy: {
      flex: 1,
      gap: 4,
    },
    previewName: {
      fontSize: 16,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: PROFILE.ink,
    },
    previewHint: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '600',
      color: PROFILE.muted,
      lineHeight: 16,
    },
    gridScroll: {
      maxHeight: 340,
      marginBottom: 14,
    },
    gridScrollContent: {
      paddingBottom: 4,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: PROFILE.muted,
      marginBottom: 10,
    },
    sectionLabelSpaced: {
      marginTop: 14,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    presetTile: {
      width: '23%',
      minWidth: 74,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: PROFILE.hair,
    },
    presetTileActive: {
      borderColor: PROFILE.gold,
      backgroundColor: '#FBF6EC',
      ...platformShadow({
        color: PROFILE.goldDeep,
        offsetY: 4,
        opacity: 0.15,
        radius: 8,
        elevation: 2,
      }),
    },
    presetLabel: {
      fontSize: 8.5,
      fontFamily: theme.typography.fonts.ui.semibold,
      fontWeight: '700',
      color: PROFILE.muted,
      textAlign: 'center',
    },
    presetLabelActive: {
      color: PROFILE.goldDeep,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: PROFILE.hair,
      borderWidth: 1,
      borderColor: PROFILE.line,
    },
    actionText: {
      fontSize: 12.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: PROFILE.navy,
    },
    saveBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: PROFILE.navy,
    },
    saveBtnDisabled: {
      opacity: 0.45,
    },
    saveText: {
      fontSize: 14,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
  });
}
