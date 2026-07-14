import { ChevronDown, ChevronRight, Sparkles, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { Button } from '../Button';
import { ChipSelect } from '../ChipSelect';
import { TextField } from '../TextField';
import { Text } from '../Text';
import { PRACTICE_UI } from './practiceTheme';
import { PracticeChip } from './PracticeChip';
import { PracticeAiOptionList } from './PracticeAiOptionList';
import { platformShadow } from '../../utils/platformShadow';
import type { PracticeSuggestion } from '../../api/ai';
import { practiceFadeInDown } from './practiceMotion';

export type PracticeTestMode = 'standard' | 'adaptive';

type PracticeAiCardProps = {
  badgeLabel: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  modeSummary: string;
  countLabel: string;
  durationHint: string;
  tapConfigure: string;
  configureHint: string;
  subjectPlaceholder: string;
  topicPlaceholder: string;
  examTagLabel: string;
  examTag?: string;
  modeLabel: string;
  modeStandardLabel: string;
  modeAdaptiveLabel: string;
  selectedMode: PracticeTestMode;
  onModeChange: (mode: PracticeTestMode) => void;
  modeHint: string;
  adaptiveHint: string;
  languageLabel: string;
  languages: readonly { key: 'en' | 'hi'; label: string }[];
  selectedLanguage: 'en' | 'hi';
  onLanguageChange: (value: 'en' | 'hi') => void;
  subjectSuggestionsLabel: string;
  subjectSuggestions: readonly string[];
  topicSuggestionsLabel: string;
  topicSuggestions: readonly string[];
  expanded: boolean;
  onToggle: () => void;
  onSubjectChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onSubjectSuggestion?: (value: string) => void;
  onTopicSuggestion?: (value: string) => void;
  difficulties: readonly string[];
  difficultyLabels: Record<string, string>;
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
  counts: readonly number[];
  selectedCount: number;
  onCountChange: (value: number) => void;
  subjectLabel: string;
  topicLabel: string;
  difficultyLabel: string;
  questionsLabel: string;
  generateLabel: string;
  generating: boolean;
  generateDisabled?: boolean;
  onGenerate: () => void;
  aiOptionsTitle: string;
  aiOptionsFetchLabel: string;
  aiOptionsLoadingLabel: string;
  aiOptionsUseLabel: string;
  aiOptionsEmptyHint: string;
  aiSuggestions: PracticeSuggestion[];
  aiSuggestionsLoading: boolean;
  onFetchAiSuggestions: () => void;
  onApplyAiSuggestion: (suggestion: PracticeSuggestion) => void;
  countLabelFor: (count: number) => string;
};

function SuggestionChips({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: readonly string[];
  onSelect: (value: string) => void;
}) {
  const styles = useMemo(() => suggestionStyles(), []);

  if (!items.length) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            onPress={() => onSelect(item)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Text style={styles.chipText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function PracticeAiCard({
  badgeLabel,
  title,
  subject,
  topic,
  difficulty,
  modeSummary,
  countLabel,
  durationHint,
  tapConfigure,
  configureHint,
  subjectPlaceholder,
  topicPlaceholder,
  examTagLabel,
  examTag,
  modeLabel,
  modeStandardLabel,
  modeAdaptiveLabel,
  selectedMode,
  onModeChange,
  modeHint,
  adaptiveHint,
  languageLabel,
  languages,
  selectedLanguage,
  onLanguageChange,
  subjectSuggestionsLabel,
  subjectSuggestions,
  topicSuggestionsLabel,
  topicSuggestions,
  expanded,
  onToggle,
  onSubjectChange,
  onTopicChange,
  onSubjectSuggestion,
  onTopicSuggestion,
  difficulties,
  difficultyLabels,
  selectedDifficulty,
  onDifficultyChange,
  counts,
  selectedCount,
  onCountChange,
  subjectLabel,
  topicLabel,
  difficultyLabel,
  questionsLabel,
  generateLabel,
  generating,
  generateDisabled,
  onGenerate,
  aiOptionsTitle,
  aiOptionsFetchLabel,
  aiOptionsLoadingLabel,
  aiOptionsUseLabel,
  aiOptionsEmptyHint,
  aiSuggestions,
  aiSuggestionsLoading,
  onFetchAiSuggestions,
  onApplyAiSuggestion,
  countLabelFor,
}: PracticeAiCardProps) {
  const styles = useMemo(() => createStyles(), []);
  const hasConfig = Boolean(subject.trim() && topic.trim());
  const isAdaptive = selectedMode === 'adaptive';

  return (
    <View style={styles.shell}>
      <Pressable
        accessibilityRole="button"
        onPress={() => !expanded && onToggle()}
        style={({ pressed }) => [styles.heroCard, pressed && !expanded && styles.pressed]}
        testID="practice-ai-generate-card"
      >
        <View style={styles.badge}>
          <Sparkles size={12} color={PRACTICE_UI.goldBadge} strokeWidth={2.4} />
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {!expanded ? (
          <>
            {hasConfig ? (
              <View style={styles.chips}>
                {examTag ? <PracticeChip label={examTag} variant="purple" /> : null}
                <PracticeChip label={subject} variant="purple" />
                <PracticeChip label={topic} variant="amber" />
                <PracticeChip label={modeSummary} variant="green" />
                {!isAdaptive ? <PracticeChip label={difficulty} variant="green" /> : null}
                <PracticeChip label={countLabel} variant="white" />
              </View>
            ) : (
              <Text style={styles.configureHint}>{configureHint}</Text>
            )}
            <Pressable onPress={onToggle} style={styles.configureRow} hitSlop={8}>
              <Text style={styles.configure}>{tapConfigure}</Text>
              <ChevronRight size={14} color={PRACTICE_UI.gold} strokeWidth={2.5} />
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tapConfigure}
            onPress={onToggle}
            style={styles.collapseBtn}
            hitSlop={8}
          >
            <ChevronDown size={16} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
          </Pressable>
        )}
      </Pressable>

      {expanded ? (
        <Animated.View entering={practiceFadeInDown(0, 0, 340)} style={styles.formPanel}>
          <View style={styles.formAccent} />
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{tapConfigure}</Text>
            <Pressable onPress={onToggle} hitSlop={8} accessibilityRole="button">
              <X size={16} color={PRACTICE_UI.meta} strokeWidth={2.5} />
            </Pressable>
          </View>

          {examTag ? (
            <LinearGradient
              colors={['#F4F6FC', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.examRow}
            >
              <Text style={styles.fieldLabel}>{examTagLabel}</Text>
              <Text style={styles.examValue}>{examTag}</Text>
            </LinearGradient>
          ) : null}

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{modeLabel}</Text>
            <View style={styles.chipRow}>
              <ChipSelect
                label={modeStandardLabel}
                selected={selectedMode === 'standard'}
                onPress={() => onModeChange('standard')}
                testID="practice-mode-standard"
              />
              <ChipSelect
                label={modeAdaptiveLabel}
                selected={selectedMode === 'adaptive'}
                onPress={() => onModeChange('adaptive')}
                testID="practice-mode-adaptive"
              />
            </View>
            <Text style={styles.fieldHint}>{isAdaptive ? adaptiveHint : modeHint}</Text>
          </View>

          <TextField
            label={subjectLabel}
            value={subject}
            onChangeText={onSubjectChange}
            placeholder={subjectPlaceholder}
          />
          <SuggestionChips
            label={subjectSuggestionsLabel}
            items={subjectSuggestions}
            onSelect={onSubjectSuggestion ?? onSubjectChange}
          />

          <TextField
            label={topicLabel}
            value={topic}
            onChangeText={onTopicChange}
            placeholder={topicPlaceholder}
          />
          <SuggestionChips
            label={topicSuggestionsLabel}
            items={topicSuggestions}
            onSelect={onTopicSuggestion ?? onTopicChange}
          />

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{languageLabel}</Text>
            <View style={styles.chipRow}>
              {languages.map((entry) => (
                <ChipSelect
                  key={entry.key}
                  label={entry.label}
                  selected={selectedLanguage === entry.key}
                  onPress={() => onLanguageChange(entry.key)}
                />
              ))}
            </View>
          </View>

          {!isAdaptive ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{difficultyLabel}</Text>
              <View style={styles.chipRow}>
                {difficulties.map((level) => (
                  <ChipSelect
                    key={level}
                    label={difficultyLabels[level] ?? level}
                    selected={selectedDifficulty === level}
                    onPress={() => onDifficultyChange(level)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>{questionsLabel}</Text>
              <Text style={styles.durationHint}>{durationHint}</Text>
            </View>
            <View style={styles.chipRow}>
              {counts.map((n) => (
                <ChipSelect
                  key={n}
                  label={String(n)}
                  selected={selectedCount === n}
                  onPress={() => onCountChange(n)}
                />
              ))}
            </View>
          </View>

          <PracticeAiOptionList
            title={aiOptionsTitle}
            fetchLabel={aiOptionsFetchLabel}
            loadingLabel={aiOptionsLoadingLabel}
            useLabel={aiOptionsUseLabel}
            emptyHint={aiOptionsEmptyHint}
            difficultyLabels={difficultyLabels}
            modeStandardLabel={modeStandardLabel}
            modeAdaptiveLabel={modeAdaptiveLabel}
            countLabel={countLabelFor}
            suggestions={aiSuggestions}
            loading={aiSuggestionsLoading}
            onFetch={onFetchAiSuggestions}
            onSelect={onApplyAiSuggestion}
          />

          <Button
            label={generateLabel}
            testID="practice-generate-start"
            fullWidth
            variant="gold"
            loading={generating}
            disabled={generateDisabled}
            onPress={onGenerate}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const suggestionStyles = () =>
  StyleSheet.create({
    wrap: {
      gap: 6,
      marginTop: -4,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: PRACTICE_UI.meta,
    },
    row: {
      gap: 8,
      paddingRight: 4,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: PRACTICE_UI.statIndigoBg,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.08)',
    },
    chipPressed: {
      backgroundColor: '#E8EBF8',
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      color: PRACTICE_UI.ink,
    },
  });

function createStyles() {
  return StyleSheet.create({
    shell: {
      gap: 0,
      marginBottom: -4,
    },
    heroCard: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      borderRadius: 22,
      padding: 16,
      ...platformShadow({
        color: '#000000',
        offsetY: 10,
        opacity: 0.12,
        radius: 20,
        elevation: 4,
      }),
    },
    pressed: {
      opacity: 0.94,
    },
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(245,158,11,0.2)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.45)',
      marginBottom: 12,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: PRACTICE_UI.gold,
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 10,
      lineHeight: 23,
      letterSpacing: -0.2,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    configureHint: {
      fontSize: 13,
      lineHeight: 19,
      color: 'rgba(255,255,255,0.82)',
      marginBottom: 10,
    },
    configureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    configure: {
      fontSize: 13,
      fontWeight: '700',
      color: PRACTICE_UI.gold,
    },
    collapseBtn: {
      alignSelf: 'flex-end',
      marginTop: -4,
    },
    formPanel: {
      marginTop: -8,
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: 'rgba(194,154,78,0.2)',
      overflow: 'hidden',
      zIndex: 2,
      ...platformShadow({
        color: PRACTICE_UI.startEnd,
        offsetY: 16,
        opacity: 0.14,
        radius: 28,
        elevation: 6,
      }),
    },
    formAccent: {
      position: 'absolute',
      top: 0,
      left: '24%',
      right: '24%',
      height: 2,
      borderRadius: 1,
      backgroundColor: PRACTICE_UI.goldBadge,
      opacity: 0.75,
    },
    formHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    formTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: PRACTICE_UI.ink,
      letterSpacing: -0.2,
    },
    examRow: {
      gap: 4,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(35,42,77,0.08)',
    },
    examValue: {
      fontSize: 14,
      fontWeight: '800',
      color: PRACTICE_UI.ink,
    },
    fieldBlock: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: PRACTICE_UI.ink,
    },
    fieldHint: {
      fontSize: 11,
      lineHeight: 16,
      color: PRACTICE_UI.meta,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    durationHint: {
      fontSize: 11,
      fontWeight: '600',
      color: PRACTICE_UI.statGreen,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
}
