import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import {
  AI_UI,
  AiAssistantCard,
  AiChatShell,
  AiComposer,
  AiErrorBubble,
  AiHeader,
  AiHomeHero,
  AiImagePreview,
  AiPromptCard,
  AiSegmentTabs,
  type AiTab,
  AiTypingIndicator,
  AiUserBubble,
} from '../../components/ai';
import { historyToChatMessages, type AiChatMessage } from '../../components/ai/historyToChatMessages';
import { QueryStateSkeleton } from '../../components/premium';
import { ASK_AI_PROMPTS } from '../../content/askAiContent';
import { useAiDoubtHistory, useAskDoubt, useReportAiFeedback, useSaveNote } from '../../hooks';
import { useProGate } from '../../hooks/useProGate';
import { getUserFacingMessage } from '../../errors/getUserFacingMessage';
import type { MainStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { pickImageBase64 } from '../../utils/imagePicker';
import { Text } from '../../components/Text';

function cacheSourceLabel(
  source: string | null | undefined,
  t: (key: string) => string,
): string | undefined {
  switch (source) {
    case 'user_history':
      return t('app:askAi.fromHistory');
    case 'forum_doubt':
      return t('app:askAi.fromForum');
    case 'ai_cache':
    case 'exact_cache':
      return t('app:askAi.similarFound');
    default:
      return undefined;
  }
}

export function AskAIScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'AskAI'>>();
  const { theme } = useTheme();
  const { t } = useTranslation(['app', 'common']);
  const { canUseFeature, openPaywall, handleProError } = useProGate();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scrollRef = useRef<ScrollView>(null);

  const [tab, setTab] = useState<AiTab>('ask');
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [lastRetry, setLastRetry] = useState<AiChatMessage['retryPayload'] | null>(null);
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
      ASK_AI_PROMPTS.map(({ key, tagKey, Icon, tone }) => ({
        Icon,
        tone,
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

  const sendMessage = useCallback(
    async (
      text: string,
      options?: { skipCache?: boolean; imageBase64?: string | null; imageUri?: string | null },
    ) => {
      const question = text.trim();
      const scanned = options?.imageBase64 ?? imageBase64;
      const preview = options?.imageUri ?? imagePreview;

      if (!question && !scanned) return;

      if (!canUseFeature('ai_doubt')) {
        openPaywall({ feature: 'ai_doubt' });
        return;
      }

      const userMsg: AiChatMessage = {
        id: `u_${Date.now()}`,
        role: 'user',
        text: question || t('app:askAi.scannedQuestion'),
        imageUri: preview ?? undefined,
        imageBase64: scanned,
        retryPayload: {
          question: question || t('app:askAi.solveScanned'),
          imageBase64: scanned,
        },
      };

      setMessages((prev) => [...prev.filter((msg) => msg.role !== 'error'), userMsg]);
      setLastRetry(userMsg.retryPayload ?? null);
      setInput('');
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
            cacheSource: result.cacheSource,
            answerId: result.answerId,
            responseMs: result.responseMs,
            inputSummary: question || t('app:askAi.scannedQuestion'),
          },
        ]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
      } catch (error) {
        if (handleProError(error)) {
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `e_${Date.now()}`,
            role: 'error',
            text: getUserFacingMessage(error) || t('app:askAi.answerFailedBody'),
          },
        ]);
      }
    },
    [askMutation, canUseFeature, handleProError, imageBase64, imagePreview, openPaywall, t],
  );

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
    reason: 'inaccurate' | 'off_topic' | 'unsafe' | 'other',
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

  const handleHelpful = (msg: AiChatMessage) => {
    void reportMutation.mutateAsync({
      feature: 'doubt_solver',
      reason: 'other',
      inputSummary: `[helpful] ${msg.inputSummary ?? ''}`.trim(),
      outputSnapshot: {
        explanation: msg.text,
        fromCache: msg.fromCache ?? false,
        answerId: msg.answerId,
      },
    });
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

  const handleRetry = useCallback(() => {
    if (!lastRetry) {
      return;
    }

    void sendMessage(lastRetry.question, {
      skipCache: true,
      imageBase64: lastRetry.imageBase64,
      imageUri: lastRetry.imageBase64 ? `data:image/jpeg;base64,${lastRetry.imageBase64}` : null,
    });
  }, [lastRetry, sendMessage]);

  const showHome = messages.length === 0 && !askMutation.isPending && historyHydrated;
  const showHistorySkeleton = historyQuery.isLoading && !historyHydrated;

  return (
    <View style={styles.screen}>
      <AiHeader
        title={t('app:askAi.title')}
        subtitle={t('app:askAi.subtitle')}
        eyebrow={t('app:askAi.heroEyebrow')}
        backA11y={t('app:askAi.backA11y')}
        evaluateLabel={t('app:askAi.tabEvaluate')}
        onBack={() => navigation.goBack()}
        onEvaluatePress={() => navigation.navigate('AnswerEvaluation')}
      />

      <AiChatShell>
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showHistorySkeleton ? (
              <View style={styles.skeletonWrap}>
                <QueryStateSkeleton rows={4} />
              </View>
            ) : null}

            {showHome ? (
              <View>
                <AiHomeHero
                  eyebrow={t('app:askAi.heroEyebrow')}
                  title={t('app:askAi.emptyTitle')}
                  subtitle={t('app:askAi.emptySubtitle')}
                />
                <Text style={styles.suggestedTitle}>{t('app:askAi.suggestedTitle')}</Text>
                <View style={styles.promptList}>
                  {prompts.map((prompt, index) => (
                    <AiPromptCard
                      key={ASK_AI_PROMPTS[index].key}
                      Icon={prompt.Icon}
                      tone={prompt.tone}
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
            ) : null}

            {!showHome && !showHistorySkeleton ? (
              <View style={styles.chat}>
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return <AiUserBubble key={msg.id} text={msg.text} imageUri={msg.imageUri} />;
                  }

                  if (msg.role === 'error') {
                    return (
                      <AiErrorBubble
                        key={msg.id}
                        message={msg.text}
                        retryLabel={t('app:askAi.retry')}
                        onRetry={handleRetry}
                      />
                    );
                  }

                  return (
                    <AiAssistantCard
                      key={msg.id}
                      coachName={t('app:askAi.coachName')}
                      text={msg.text}
                      fromCache={msg.fromCache}
                      cacheLabel={t('app:askAi.similarFound')}
                      cacheSourceLabel={cacheSourceLabel(msg.cacheSource, t)}
                      instantLabel={t('app:askAi.instantAnswer')}
                      formulaLabel={t('app:askAi.formula')}
                      answerLabel={t('app:askAi.answerLabel')}
                      explanationLabel={t('app:askAi.explanationLabel')}
                      tipLabel={t('app:askAi.tipLabel')}
                      copyLabel={t('app:askAi.copy')}
                      copiedLabel={t('app:askAi.copied')}
                      helpfulLabel={t('app:askAi.helpful')}
                      notHelpfulLabel={t('app:askAi.notHelpful')}
                      retryLabel={t('app:askAi.retryFresh')}
                      saveLabel={t('app:askAi.saveNote')}
                      savedLabel={t('app:askAi.savedShort')}
                      saving={saveNoteMutation.isPending}
                      saved={msg.answerId ? savedAnswerIds.has(msg.answerId) : false}
                      responseMs={msg.responseMs}
                      onRetry={handleRetry}
                      onHelpful={() => handleHelpful(msg)}
                      onNotHelpful={() => handleReportAnswer(msg)}
                      onSave={() => void handleSaveAnswer(msg)}
                    />
                  );
                })}
                {askMutation.isPending ? (
                  <AiTypingIndicator label={t('app:askAi.thinking')} />
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          {imagePreview ? (
            <AiImagePreview
              uri={imagePreview}
              label={t('app:askAi.imageAttached')}
              removeLabel={t('app:askAi.removePreview')}
              onRemove={() => {
                setImageBase64(null);
                setImagePreview(null);
              }}
            />
          ) : null}

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
        </KeyboardAvoidingView>
      </AiChatShell>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: AI_UI.primaryDark,
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
    skeletonWrap: {
      paddingTop: theme.spacing.xl,
    },
    suggestedTitle: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: AI_UI.goldDeep,
      marginBottom: theme.spacing.sm,
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
      backgroundColor: AI_UI.goldBorder,
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
      paddingTop: theme.spacing.md,
    },
  });
}
