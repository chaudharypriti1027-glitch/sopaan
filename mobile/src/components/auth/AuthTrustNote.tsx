import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Text } from '../Text';
import { AUTH_FONTS, AUTH_UI } from './authTheme';

type AuthTrustNoteProps = {
  message: string;
  testID?: string;
};

export function AuthTrustNote({ message, testID }: AuthTrustNoteProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row} testID={testID}>
      <ShieldCheck size={13} color="rgba(212,175,55,0.75)" strokeWidth={2.1} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 20,
      paddingHorizontal: 8,
    },
    text: {
      fontFamily: AUTH_FONTS.regular,
      fontSize: 12.5,
      fontWeight: '400',
      color: AUTH_UI.onCanvasFaint,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
  });
}
