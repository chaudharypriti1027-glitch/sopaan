import { Share2 } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReferralDashboard } from '../hooks';
import { captureAndShareCard } from '../share/captureAndShareCard';
import { ShareMilestoneCard } from '../share/ShareMilestoneCard';
import type { ShareCardData } from '../share/types';
import { shareCardTokens } from '../share/cardTokens';
import { useTheme } from '../theme';
import { Button, type ButtonSize, type ButtonVariant } from './Button';

type Props = {
  data: ShareCardData;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function ShareMilestoneButton({
  data,
  label = 'Share',
  variant = 'ghost',
  size = 'md',
  fullWidth = false,
}: Props) {
  const { t } = useTranslation('app');
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(), []);
  const referralQuery = useReferralDashboard();

  const iconColor =
    variant === 'gold' ? theme.colors.text.primary : theme.colors.brand.primary;

  const handleShare = async () => {
    try {
      setSharing(true);
      await captureAndShareCard(cardRef, data, {
        webLink: referralQuery.data?.webLink,
        code: referralQuery.data?.code,
      });
    } catch (err) {
      Alert.alert(
        t('result.shareErrorTitle'),
        err instanceof Error ? err.message : t('result.shareErrorMessage'),
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Button
        label={label}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        loading={sharing}
        icon={<Share2 size={18} color={iconColor} />}
        onPress={() => void handleShare()}
      />

      <View style={styles.offscreen} pointerEvents="none">
        <View ref={cardRef} collapsable={false}>
          <ShareMilestoneCard
            {...data}
            referralLink={referralQuery.data?.webLink}
            referralCode={referralQuery.data?.code}
          />
        </View>
      </View>
    </>
  );
}

function createStyles() {
  return StyleSheet.create({
    offscreen: {
      position: 'absolute',
      top: -shareCardTokens.height - 100,
      left: -shareCardTokens.width - 100,
      opacity: 0,
    },
  });
}
