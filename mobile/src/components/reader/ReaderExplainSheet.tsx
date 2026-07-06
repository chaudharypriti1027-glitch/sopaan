import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Volume2, X } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AI_UI } from '../ai/aiTheme';
import { Text } from '../Text';
import { useBookExplain } from '../../hooks/useBookExplain';
import { useSimpleSpeech } from '../../hooks/useSimpleSpeech';
import type { ReaderThemeTokens } from './readerTheme';

type ReaderExplainSheetProps = {
  visible: boolean;
  bookId: string;
  page: number;
  passage: string;
  theme: ReaderThemeTokens;
  onClose: () => void;
};

export function ReaderExplainSheet({
  visible,
  bookId,
  page,
  passage,
  theme,
  onClose,
}: ReaderExplainSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['app', 'common']);
  const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
  const { text, isStreaming, cached, error, explain, reset } = useBookExplain(bookId);
  const { speak, isSpeaking } = useSimpleSpeech();

  useEffect(() => {
    if (!visible || !passage.trim()) {
      return;
    }

    void explain({ page, text: passage });
  }, [explain, page, passage, visible]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const displayText = error ?? text;
  const canReadAloud = Boolean(displayText && !error && !isStreaming);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <LinearGradient
            colors={[AI_UI.goldSoft, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerWash}
          />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiTag}>
                <Sparkles size={12} color={AI_UI.gold} strokeWidth={2.4} />
                <Text style={styles.aiTagText}>✦ AI</Text>
              </View>
              <Text style={styles.title}>{t('reader.explainSheetTitle')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common:close')}
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <X size={20} color={theme.text} strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {isStreaming && !displayText ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={AI_UI.gold} />
                <Text style={styles.loadingText}>{t('reader.explainLoading')}</Text>
              </View>
            ) : (
              <Text style={[styles.explanation, error && styles.errorText]}>{displayText}</Text>
            )}
            {isStreaming && displayText ? (
              <Text style={styles.cursor}>▍</Text>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {cached && !error ? (
              <Text style={styles.cacheHint}>{t('reader.explainCached')}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={!canReadAloud}
              onPress={() => speak(displayText)}
              style={({ pressed }) => [
                styles.readAloudButton,
                !canReadAloud && styles.readAloudDisabled,
                pressed && canReadAloud && styles.pressed,
              ]}
            >
              <Volume2 size={18} color={canReadAloud ? AI_UI.primary : theme.textMuted} />
              <Text style={[styles.readAloudLabel, !canReadAloud && styles.readAloudLabelMuted]}>
                {isSpeaking ? t('reader.stopReadingAloud') : t('reader.readExplanationAloud')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: ReaderThemeTokens, bottomInset: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.32)',
    },
    sheet: {
      maxHeight: '78%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: theme.background,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.toolbarBorder,
      overflow: 'hidden',
      paddingBottom: bottomInset + 12,
    },
    headerWash: {
      ...StyleSheet.absoluteFillObject,
      height: 120,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 12,
      gap: 12,
    },
    headerLeft: {
      flex: 1,
      gap: 6,
    },
    aiTag: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(194,154,78,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.35)',
    },
    aiTagText: {
      fontSize: 12,
      fontWeight: '800',
      color: AI_UI.goldDeep,
      letterSpacing: 0.4,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.3,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
    },
    pressed: {
      opacity: 0.75,
    },
    bodyScroll: {
      maxHeight: 360,
    },
    bodyContent: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textMuted,
    },
    explanation: {
      fontSize: 16,
      lineHeight: 26,
      color: theme.text,
    },
    errorText: {
      color: theme.textMuted,
    },
    cursor: {
      fontSize: 16,
      color: AI_UI.gold,
      marginTop: 2,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 8,
      gap: 8,
    },
    cacheHint: {
      fontSize: 12,
      color: theme.textMuted,
    },
    readAloudButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 16,
      paddingVertical: 14,
      backgroundColor: theme.accentSoft,
      borderWidth: 1,
      borderColor: theme.toolbarBorder,
    },
    readAloudDisabled: {
      opacity: 0.55,
    },
    readAloudLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    readAloudLabelMuted: {
      color: theme.textMuted,
    },
  });
}
