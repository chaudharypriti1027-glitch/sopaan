import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  BookOpen,
  ChevronDown,
  Eye,
  Pin,
  Smartphone,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { NumText } from '../NumText';
import { useTheme } from '../../theme';
import type { LiveChatMessage, LiveReaction } from '../../realtime/events';
import { LiveClassFloatingReactions } from './LiveClassFloatingReactions';
import { LiveClassOverlayComments } from './LiveClassOverlayComments';
import { LiveClassOverlayControls } from './LiveClassOverlayControls';
import { LIVE } from './liveTheme';
import { formatLiveElapsed } from './liveUtils';
import { LiveClassStageProvider, useLiveClassStage } from './liveClassStageContext';
import { useIsLandscape } from '../../hooks/useIsLandscape';

type LiveClassImmersiveShellProps = {
  title: string;
  instructor?: string;
  instructorSubtitle?: string;
  topic?: string | null;
  startedAt?: string | null;
  viewerCount: number;
  recording?: boolean;
  pinnedMessage?: string | null;
  pinnedAuthor?: string;
  messages: LiveChatMessage[];
  reactions: LiveReaction[];
  currentUserId?: string;
  hostUserId?: string;
  handRaised: boolean;
  connected: boolean;
  onBack: () => void;
  onLeave: () => void;
  onRaiseHand: () => void;
  onLowerHand: () => void;
  onReaction: (emoji: string) => void;
  onSend: (text: string) => boolean;
  children: ReactNode;
};

export function LiveClassImmersiveShell(props: LiveClassImmersiveShellProps) {
  return (
    <LiveClassStageProvider>
      <LiveClassImmersiveShellInner {...props} />
    </LiveClassStageProvider>
  );
}

function LiveClassImmersiveShellInner({
  title,
  instructor,
  instructorSubtitle,
  topic,
  startedAt,
  viewerCount,
  recording = true,
  pinnedMessage,
  pinnedAuthor,
  messages,
  reactions,
  currentUserId,
  hostUserId,
  handRaised,
  connected,
  onBack,
  onLeave,
  onRaiseHand,
  onLowerHand,
  onReaction,
  onSend,
  children,
}: LiveClassImmersiveShellProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isLandscape = useIsLandscape();
  const { videoActive } = useLiveClassStage();
  const isFullscreen = isLandscape;
  /** Chat, reactions, and comment bar — portrait only. */
  const showInteractionPanel = !isLandscape;
  const hideDetailChrome = isLandscape || videoActive;
  const styles = useMemo(
    () => createStyles(theme, insets.top, insets.bottom, isFullscreen, isLandscape, videoActive, hideDetailChrome),
    [theme, insets.top, insets.bottom, isFullscreen, isLandscape, videoActive, hideDetailChrome],
  );
  const [timer, setTimer] = useState(() => formatLiveElapsed(startedAt));

  useEffect(() => {
    setTimer(formatLiveElapsed(startedAt));
    const interval = setInterval(() => {
      setTimer(formatLiveElapsed(startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <View style={styles.root}>
      <StatusBar hidden={isFullscreen} style="light" />
      {!isFullscreen ? (
        <LinearGradient
          colors={[LIVE.stageMid, LIVE.navy, LIVE.stageDeep]}
          locations={[0, 0.46, 1]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {!videoActive ? <View style={styles.glowOrb} pointerEvents="none" /> : null}

      <View style={styles.stage}>
        <View style={styles.streamArea}>{children}</View>

        {!isFullscreen ? (
          <LinearGradient
            colors={['rgba(10,12,25,0.85)', 'transparent']}
            style={styles.topFade}
            pointerEvents="none"
          />
        ) : null}

        <View style={styles.topbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            onPress={onBack}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <ChevronDown size={19} color="#FFFFFF" strokeWidth={1.75} />
          </Pressable>

          {!isFullscreen ? (
            <View style={styles.titleWrap}>
              <View style={styles.badgeRow}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>{t('live')}</Text>
                </View>
                {recording ? (
                  <View style={styles.recPill}>
                    <View style={styles.recDot} />
                    <Text style={styles.recPillText}>{t('rec')}</Text>
                  </View>
                ) : null}
              </View>
              {!hideDetailChrome ? (
                <Text style={styles.classTitle} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
            </View>
          ) : (
            <>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>{t('live')}</Text>
              </View>
              <View style={styles.topbarSpacer} />
            </>
          )}

          {!isFullscreen ? (
            <View style={styles.viewers}>
              <Eye size={14} color="#FFFFFF" strokeWidth={1.75} />
              <NumText style={styles.viewerCount}>{viewerCount}</NumText>
            </View>
          ) : (
            <View style={styles.topbarSpacer} />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('leave')}
            onPress={onLeave}
            style={({ pressed }) => [styles.leaveBtn, pressed && styles.pressed]}
          >
            <Text style={styles.leaveText}>{t('leave')}</Text>
          </Pressable>
        </View>

        {!isLandscape && !hideDetailChrome && topic ? (
          <View style={styles.topicChip}>
            <BookOpen size={15} color={LIVE.goldLt} strokeWidth={1.75} />
            <Text style={styles.topicText} numberOfLines={1}>
              {t('nowTopic', { topic })}
            </Text>
          </View>
        ) : null}

        {!isLandscape && !hideDetailChrome ? (
          <View style={styles.timerChip}>
            <NumText style={styles.timerText}>{timer}</NumText>
          </View>
        ) : null}

        {!isFullscreen && pinnedMessage ? (
          <View style={styles.pinned}>
            <LinearGradient
              colors={['rgba(194,154,78,0.95)', 'rgba(166,124,51,0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.pinnedIcon}>
              <Pin size={15} color="#FFFFFF" strokeWidth={1.75} />
            </View>
            <View style={styles.pinnedText}>
              <Text style={styles.pinnedLabel}>
                {t('pinnedBy', { name: (pinnedAuthor ?? instructor ?? t('host')).toUpperCase() })}
              </Text>
              <Text style={styles.pinnedBody}>{pinnedMessage}</Text>
            </View>
          </View>
        ) : null}

        {videoActive && !isLandscape ? (
          <View style={styles.rotateHint} pointerEvents="none">
            <Smartphone size={15} color={LIVE.goldLt} strokeWidth={1.75} />
            <Text style={styles.rotateText}>{t('rotateHint')}</Text>
          </View>
        ) : null}

        {showInteractionPanel ? <LiveClassFloatingReactions reactions={reactions} /> : null}
      </View>

      {showInteractionPanel ? (
        <LinearGradient
          colors={['transparent', 'rgba(10,12,25,0.94)']}
          locations={[0, 0.42]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      ) : null}

      {showInteractionPanel ? (
        <View style={styles.bottom}>
          <LiveClassOverlayComments
            messages={messages}
            currentUserId={currentUserId}
            hostUserId={hostUserId}
            hostName={videoActive ? undefined : instructor}
          />
          <LiveClassOverlayControls
            handRaised={handRaised}
            connected={connected}
            onRaiseHand={onRaiseHand}
            onLowerHand={onLowerHand}
            onReaction={onReaction}
            onSend={onSend}
          />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useTheme>['theme'],
  topInset: number,
  bottomInset: number,
  isFullscreen: boolean,
  isLandscape: boolean,
  videoActive: boolean,
  hideDetailChrome: boolean,
) {
  const topbarTop = isFullscreen ? Math.max(8, topInset) : topInset + 8;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isFullscreen ? '#000000' : LIVE.stageDeep,
    },
    glowOrb: {
      position: 'absolute',
      top: '16%',
      alignSelf: 'center',
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: 'rgba(194,154,78,0.2)',
    },
    stage: {
      flex: 1,
      position: 'relative',
      backgroundColor: isFullscreen || videoActive ? '#000000' : undefined,
    },
    streamArea: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
      backgroundColor: videoActive || isFullscreen ? '#000000' : undefined,
    },
    topFade: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 120,
      zIndex: 4,
    },
    topbar: {
      position: 'absolute',
      top: topbarTop,
      left: isLandscape ? Math.max(12, topInset) : 16,
      right: isLandscape ? Math.max(12, topInset) : 16,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    topbarSpacer: {
      flex: 1,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: LIVE.glass,
      borderWidth: 1,
      borderColor: LIVE.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleWrap: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-start',
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      flexShrink: 0,
      backgroundColor: LIVE.red,
      borderRadius: 99,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFFFFF',
    },
    livePillText: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      letterSpacing: 0.5,
      color: '#FFFFFF',
    },
    recPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    recDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: LIVE.red,
    },
    recPillText: {
      fontSize: 10,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: LIVE.textMuted,
    },
    classTitle: {
      marginTop: 4,
      fontSize: 12.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    viewers: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: LIVE.glassDark,
      borderRadius: 99,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    viewerCount: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    leaveBtn: {
      backgroundColor: 'rgba(232,80,58,0.92)',
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },
    leaveText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    topicChip: {
      position: 'absolute',
      top: topInset + 76,
      left: 16,
      zIndex: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: '62%',
      backgroundColor: LIVE.glassDark,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 99,
      paddingHorizontal: 13,
      paddingVertical: 8,
    },
    topicText: {
      flex: 1,
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    timerChip: {
      position: 'absolute',
      top: topInset + 76,
      right: 16,
      zIndex: 8,
      backgroundColor: LIVE.glassDark,
      borderRadius: 99,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    timerText: {
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.stat.bold,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    pinned: {
      position: 'absolute',
      top: topInset + 124,
      left: 16,
      right: 16,
      zIndex: 7,
      borderRadius: 14,
      padding: 11,
      paddingLeft: 13,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 26,
      elevation: 8,
    },
    pinnedIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinnedText: {
      flex: 1,
    },
    pinnedLabel: {
      fontSize: 11,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '800',
      color: LIVE.inkPin,
    },
    pinnedBody: {
      marginTop: 1,
      fontSize: 12,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: '#FFFFFF',
      lineHeight: 16,
    },
    rotateHint: {
      position: 'absolute',
      top: '50%',
      alignSelf: 'center',
      marginTop: 60,
      zIndex: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(0,0,0,0.35)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 99,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    rotateText: {
      fontSize: 11.5,
      fontFamily: theme.typography.fonts.ui.bold,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.85)',
    },
    bottomFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 280,
      zIndex: 4,
    },
    bottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 12,
      paddingHorizontal: 16,
      paddingTop: 40,
      paddingBottom: Math.max(20, bottomInset + 8),
      gap: 12,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
  });
}
