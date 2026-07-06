import { Volume2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NumText } from '../NumText';
import { Text } from '../Text';
import {
  READER_LINE_SPACING_OPTIONS,
  READER_THEMES,
  type ReaderThemeId,
  type ReaderThemeTokens,
} from './readerTheme';

type ReaderMenuSheetProps = {
  visible: boolean;
  theme: ReaderThemeTokens;
  readerTheme: ReaderThemeId;
  fontScale: number;
  lineSpacing: number;
  onClose: () => void;
  onThemeChange: (theme: ReaderThemeId) => void;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
  onCycleLineSpacing: () => void;
  onListen: () => void;
  isListening?: boolean;
};

const THEME_ORDER: ReaderThemeId[] = ['paper', 'sepia', 'dark'];

export function ReaderMenuSheet({
  visible,
  theme,
  readerTheme,
  fontScale,
  lineSpacing,
  onClose,
  onThemeChange,
  onIncreaseFont,
  onDecreaseFont,
  onCycleLineSpacing,
  onListen,
  isListening,
}: ReaderMenuSheetProps) {
  const { t } = useTranslation('app');
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fontPercent = Math.round(fontScale * 100);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.heading}>{t('reader.menuTitle')}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onListen();
              onClose();
            }}
            style={({ pressed }) => [styles.listenButton, pressed && styles.chipPressed]}
          >
            <Volume2 size={18} color={theme.text} strokeWidth={2.2} />
            <View style={styles.listenCopy}>
              <Text style={styles.listenTitle}>
                {isListening ? t('reader.listenResume') : t('reader.listen')}
              </Text>
              <Text style={styles.listenHint}>{t('reader.listenHint')}</Text>
            </View>
          </Pressable>

          <View style={styles.section}>
            <Text style={styles.label}>{t('reader.fontSize')}</Text>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={onDecreaseFont}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Text style={styles.chipText}>A−</Text>
              </Pressable>
              <NumText style={styles.value}>{fontPercent}%</NumText>
              <Pressable
                accessibilityRole="button"
                onPress={onIncreaseFont}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Text style={styles.chipText}>A+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('reader.theme')}</Text>
            <View style={styles.themeRow}>
              {THEME_ORDER.map((id) => {
                const swatch = READER_THEMES[id];
                const active = readerTheme === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    onPress={() => onThemeChange(id)}
                    style={({ pressed }) => [
                      styles.themeChip,
                      { backgroundColor: swatch.background, borderColor: swatch.text },
                      active && styles.themeChipActive,
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text style={[styles.themeChipText, { color: swatch.text }]}>
                      {t(`reader.themes.${id}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('reader.lineSpacing')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onCycleLineSpacing}
              style={({ pressed }) => [styles.spacingChip, pressed && styles.chipPressed]}
            >
              <NumText style={styles.spacingValue}>
                {lineSpacing.toFixed(1)}×
              </NumText>
              <Text style={styles.spacingHint}>
                {READER_LINE_SPACING_OPTIONS.join(' · ')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: ReaderThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.28)',
      justifyContent: 'flex-end',
    },
    sheet: {
      marginHorizontal: 16,
      marginBottom: 24,
      borderRadius: 22,
      paddingHorizontal: 20,
      paddingVertical: 18,
      backgroundColor: theme.toolbarBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.toolbarBorder,
      gap: 16,
    },
    heading: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    listenButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.toolbarBorder,
    },
    listenCopy: {
      flex: 1,
      gap: 2,
    },
    listenTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    listenHint: {
      fontSize: 12,
      color: theme.textMuted,
    },
    section: {
      gap: 8,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: theme.textMuted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    chip: {
      minWidth: 48,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
    },
    chipPressed: {
      opacity: 0.75,
    },
    chipText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    value: {
      minWidth: 56,
      textAlign: 'center',
      fontSize: 15,
      color: theme.text,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    themeChip: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1.5,
      paddingVertical: 12,
      alignItems: 'center',
    },
    themeChipActive: {
      borderWidth: 2.5,
    },
    themeChipText: {
      fontSize: 12,
      fontWeight: '700',
    },
    spacingChip: {
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.accentSoft,
      gap: 2,
    },
    spacingValue: {
      fontSize: 16,
      color: theme.text,
    },
    spacingHint: {
      fontSize: 12,
      color: theme.textMuted,
    },
  });
}
