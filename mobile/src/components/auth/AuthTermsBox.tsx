import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type AuthTermsBoxProps = {
  checked: boolean;
  onToggle: () => void;
  policyVersion: string;
  testID?: string;
};

const PRIVACY_URL = 'https://sopaan.app/privacy';
const TERMS_URL = 'https://sopaan.app/terms';

export function AuthTermsBox({ checked, onToggle, policyVersion, testID }: AuthTermsBoxProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      testID={testID}
      onPress={onToggle}
      style={styles.box}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Check size={10} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <View style={styles.copy}>
        <Text style={styles.text}>
          I agree to the{' '}
          <Text style={styles.link} onPress={() => void Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>{' '}
          and{' '}
          <Text style={styles.link} onPress={() => void Linking.openURL(TERMS_URL)}>
            Terms
          </Text>{' '}
          (v{policyVersion}).
        </Text>
        <Text style={styles.note}>
          I consent to AI processing of my study data via Claude (Anthropic). Name, email, and phone
          are not sent to AI.
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles() {
  return StyleSheet.create({
    box: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      backgroundColor: '#F8FAFC',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#F1F5F9',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: '#CBD5E1',
      backgroundColor: AUTH_UI.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: AUTH_UI.accent,
      borderColor: AUTH_UI.accent,
    },
    copy: { flex: 1 },
    text: {
      fontSize: 12,
      color: AUTH_UI.muted,
      lineHeight: 19,
    },
    link: {
      color: AUTH_UI.accent,
      fontWeight: '600',
    },
    note: {
      fontSize: 11,
      color: AUTH_UI.faint,
      marginTop: 4,
      lineHeight: 16,
    },
  });
}
