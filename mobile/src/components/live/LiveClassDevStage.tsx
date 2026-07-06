import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LiveClassEducatorPlaceholder } from './LiveClassEducatorPlaceholder';

type LiveClassDevStageProps = {
  title?: string;
  instructor?: string;
  instructorSubtitle?: string;
  role: 'host' | 'viewer';
};

/** Placeholder stage when the API uses the local dev streaming provider (no LiveKit). */
export function LiveClassDevStage({
  title,
  instructor,
  instructorSubtitle,
  role,
}: LiveClassDevStageProps) {
  const { t } = useTranslation('app', { keyPrefix: 'liveClassViewer' });
  const styles = useMemo(() => createStyles(), []);
  const displayName = instructor ?? title ?? t('defaultTitle');
  const subtitle = instructorSubtitle ?? (role === 'host' ? t('host') : t('educator'));

  return (
    <View style={styles.stage}>
      <LiveClassEducatorPlaceholder
        name={displayName}
        subtitle={subtitle}
        hint={role === 'host' ? t('devStreamHint') : t('waitingEducator')}
      />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    stage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
