import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpen, Brain, PenLine, TrendingUp } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '../../components';
import {
  AI_UI,
  AiAssistantCard,
  AiComposer,
  AiHeader,
  AiHomeHero,
  AiPromptCard,
  AiSegmentTabs,
  type AiTab,
  AiTypingIndicator,
  AiUserBubble,
} from '../../components/ai';
import { historyToChatMessages, type AiChatMessage } from '../../components/ai/historyToChatMessages';
import { useAiDoubtHistory, useAskDoubt, useReportAiFeedback, useSaveNote } from '../../hooks';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { pickImageBase64 } from '../../utils/imagePicker';
import { Text } from '../../components/Text';

const PROMPT_CONFIG = [
  { key: 'prompt1', tagKey: 'promptTag1', Icon: TrendingUp },
  { key: 'prompt2', tagKey: 'promptTag2', Icon: Brain },
  { key: 'prompt3', tagKey: 'promptTag3', Icon: BookOpen },
  { key: 'prompt4', tagKey: 'promptTag4', Icon: PenLine },
] as const;

export function AskAIScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'AskAI'>>();
  const { theme } = useTheme();
  const { t } = useTranslation(['app', 'common']);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scrollRef = useRef<ScrollView>(null);

  const [tab, setTab] = useState<AiTab>('ask');
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [lastQuestion, setLastQuestion] = useState('');
  const [savedAnswerIds, setSavedAnswerIds] = useState<Set<string>>(new Set());
  const [historyHydrated, setHistoryHydrated] = useState(false);

  useEffect(() => {
    const initialPrompt = route.params?.initialPrompt?.trim();
    if (initialPrompt) {
      setInput(initialPrompt);
      setTab('ask');
    }
  }, [route.params?.initialPrompt]);

  const askMutation = useAskDoubt();
  const historyQuery = useAiDoubtHistory();
  const reportMutation = useReportAiFeedback();
  const saveNoteMutation = useSaveNote();

  const prompts = useMemo(
    () =>
      PROMPT_CONFIG.map(({ key, tagKey, Icon }) => ({
        Icon,
        text: t(`app:askAi.${key}`),
        tag: t(`app:askAi.${tagKey}`),
      })),
    [t],
  );

  useEffect(() => {
    if (historyQuery.isLoading) {
      return;
    }

    const items = historyQuery.data?.items ?? [];
    if (items.length > 0) {
      setMessages(historyToChatMessages(items));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 80);
    }

    setHistoryHydrated(true);
  }, [historyQuery.isLoading, historyQuery.data?.items]);

  const handleTabChange = (next: AiTab) => {
    if (next === 'evaluate') {
      navigation.navigate('AnswerEvaluation');
      return;
    }
    setTab(next);
  };

  const handleScan = async (source: 'camera' | 'library') => {
    const base64 = await pickImageBase64(source);
    if (!base64) return;
    setImageBase64(base64);
    setImagePreview(`data:image/jpeg;base64,${base64}`);
    if (!input.trim()) {
      setInput(t('app:askAi.scanPrompt'));
    }
  };

  const sendMessage = useCallback(async (text: string, options?: { skipCache?: boolean }) => {
    const question = text.trim();
    if (!question && !imageBase64) return;

    const userMsg: AiChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: question || t('app:askAi.scannedQuestion'),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLastQuestion(question || t('app:askAi.solveScanned'));
    setInput('');
    const scanned = imageBase64;
    setImageBase64(null);
    setImagePreview(null);

    try {
      const result = await askMutation.mutateAsync({
        question: question || t('app:askAi.solveScanned'),
        imageBase64: scanned ?? undefined,
        skipCache: options?.skipCache,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: result.answerId ? `a_${result.answerId}` : `a_${Date.now()}`,
          role: 'assistant',
          text: result.explanation,
          fromCache: result.fromCache,
          answerId: result.answerId,
          responseMs: result.responseMs,
          inputSummary: question || t('app:askAi.scannedQuestion'),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1));
      Alert.alert(t('app:askAi.answerFailedTitle'), getUserFacingMessage(error));
    }
  }, [askMutation, imageBase64, t]);

  const handleReportAnswer = (msg: AiChatMessage) => {
    Alert.alert(t('app:askAi.reportTitle'), t('app:askAi.reportBody'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('app:askAi.reportInaccurate'),
        onPress: () => submitReport(msg, 'inaccurate'),
      },
      {
        text: t('app:askAi.reportOffTopic'),
        onPress: () => submitReport(msg, 'off_topic'),
      },
      {
        text: t('app:askAi.reportUnsafe'),
        style: 'destructive',
        onPress: () => submitReport(msg, 'unsafe'),
      },
    ]);
  };

  const submitReport = async (
    msg: AiChatMessage,
    reason: 'inaccurate' | 'off_topic' | 'unsafe',
  ) => {
    try {
      await reportMutation.mutateAsync({
        feature: 'doubt_solver',
        reason,
        inputSummary: msg.inputSummary,
        outputSnapshot: {
          explanation: msg.text,
          fromCache: msg.fromCache ?? false,
          answerId: msg.answerId,
        },
      });
      Alert.alert(t('app:askAi.reportedTitle'), t('app:askAi.reportedBody'));
    } catch {
      Alert.alert(t('app:askAi.reportFailedTitle'), t('app:askAi.reportFailedBody'));
    }
  };

  const handleSaveAnswer = async (msg: AiChatMessage) => {
    if (!msg.answerId || savedAnswerIds.has(msg.answerId)) {
      return;
    }

    try {
      await saveNoteMutation.mutateAsync({
        title: (msg.inputSummary ?? msg.text).slice(0, 60),
        content: msg.text,
      });
      setSavedAnswerIds((prev) => new Set(prev).add(msg.answerId!));
      Alert.alert(t('app:askAi.savedTitle'), t('app:askAi.savedBody'));
    } catch {
      Alert.alert(t('app:askAi.saveFailedTitle'), t('app:askAi.saveFailedBody'));
    }
  };

  const showHome = messages.length === 0 && !askMutation.isPending && historyHydrated;

  return (
    <View style={styles.screen}>
      <AiHeader
        title={t('app:askAi.title')}
        badgeLabel={t('app:askAi.subtitle')}
        onBack={() => navigation.goBack()}
        onBadgePress={() => navigation.navigate('AnswerEvaluation')}
      />

      <View style={styles.tabs}>
        <AiSegmentTabs
          value={tab}
          onChange={handleTabChange}
          askLabel={t('app:askAi.tabAsk')}
          evaluateLabel={t('app:askAi.tabEvaluate')}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showHome ? (
            <View>
              <AiHomeHero
                title={t('app:askAi.emptyTitle')}
                subtitle={t('app:askAi.emptySubtitle')}
              />
              <View style={styles.promptList}>
                {prompts.map((prompt, index) => (
                  <AiPromptCard
                    key={PROMPT_CONFIG[index].key}
                    Icon={prompt.Icon}
                    text={prompt.text}
                    tag={prompt.tag}
                    onPress={() => void sendMessage(prompt.text)}
                  />
                ))}
              </View>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('app:askAi.orTypeBelow')}</Text>
                <View style={styles.dividerLine} />
              </View>
            </View>
          ) : (
            <View style={styles.chat}>
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <AiUserBubble key={msg.id} text={msg.text} />
                ) : (
                  <AiAssistantCard
                    key={msg.id}
                    text={msg.text}
                    fromCache={msg.fromCache}
                    cacheLabel={t('app:askAi.similarFound')}
                    instantLabel={t('app:askAi.instantAnswer')}
                    formulaLabel={t('app:askAi.formula')}
                    copyLabel={t('app:askAi.copy')}
                    copiedLabel={t('app:askAi.copied')}
                    helpfulLabel={t('app:askAi.helpful')}
                    notHelpfulLabel={t('app:askAi.notHelpful')}
                    retryLabel={t('app:askAi.retry')}
                    saveLabel={t('app:askAi.saveNote')}
                    savedLabel={t('app:askAi.savedShort')}
                    saving={saveNoteMutation.isPending}
                    saved={msg.answerId ? savedAnswerIds.has(msg.answerId) : false}
                    responseMs={msg.responseMs}
                    onRetry={() => void sendMessage(lastQuestion, { skipCache: true })}
                    onNotHelpful={() => handleReportAnswer(msg)}
                    onSave={() => void handleSaveAnswer(msg)}
                  />
                ),
              )}
              {askMutation.isPending ? <AiTypingIndicator /> : null}
            </View>
          )}
        </ScrollView>

        {imagePreview ? (
          <View style={styles.previewRow}>
            <OptimizedImage uri={imagePreview} style={styles.previewThumb} />
            <Text
              style={styles.removePreview}
              onPress={() => {
                setImageBase64(null);
                setImagePreview(null);
              }}
            >
              {t('app:askAi.removePreview')}
            </Text>
          </View>
        ) : null}

        <View style={styles.composerWrap}>
        <AiComposer
          value={input}
          onChangeText={setInput}
          onSend={() => void sendMessage(input)}
          onCamera={() => void handleScan('camera')}
          onGallery={() => void handleScan('library')}
          placeholder={t('app:askAi.placeholder')}
          disabled={askMutation.isPending}
          cameraA11y={t('app:askAi.cameraA11y')}
          galleryA11y={t('app:askAi.galleryA11y')}
          sendA11y={t('app:askAi.sendA11y')}
        />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: AI_UI.bg,
    },
    flex: {
      flex: 1,
    },
    tabs: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    promptList: {
      gap: theme.spacing.md,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(79,53,210,0.1)',
    },
    dividerText: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: AI_UI.primaryMuted,
    },
    chat: {
      gap: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    composerWrap: {
      backgroundColor: AI_UI.bg,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    previewThumb: {
      width: 48,
      height: 48,
      borderRadius: 10,
    },
    removePreview: {
      fontSize: 12,
      color: theme.colors.semantic.error,
      fontFamily: theme.typography.fonts.ui.semibold,
    },
  });
}
