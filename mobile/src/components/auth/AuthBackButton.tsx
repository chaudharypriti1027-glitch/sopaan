import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AUTH_UI } from './authTheme';

type AuthBackButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

/** Circular gold-outline back button on the navy canvas (Sign-in Flow reference). */
export function AuthBackButton({ onPress, disabled, testID }: AuthBackButtonProps) {
  const navigation = useNavigation();
  const { t } = useTranslation('auth');
  const styles = useMemo(() => createStyles(), []);

  const handlePress = onPress ?? (() => navigation.goBack());

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('layout.goBackA11y', { defaultValue: 'Go back' })}
      disabled={disabled}
      testID={testID ?? 'auth-back-button'}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <ChevronLeft size={22} color={AUTH_UI.onCanvas} strokeWidth={1.9} />
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    button: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(240,212,136,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(240,212,136,0.2)',
      alignSelf: 'flex-start',
    },
    pressed: {
      backgroundColor: 'rgba(240,212,136,0.12)',
      transform: [{ scale: 0.94 }],
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
