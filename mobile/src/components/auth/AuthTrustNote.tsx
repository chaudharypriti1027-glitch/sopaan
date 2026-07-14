import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import { Text } from '../Text';
import { AUTH_UI } from './authTheme';

type AuthTrustNoteProps = {
  message: string;
  testID?: string;
};

export function AuthTrustNote({ message, testID }: AuthTrustNoteProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.row} testID={testID}>
      <Shield size={13} color={AUTH_UI.sageDeep} strokeWidth={2.2} />
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
      gap: 6,
      marginTop: 14,
      paddingHorizontal: 8,
    },
    text: {
      fontSize: 11,
      fontWeight: '600',
      color: AUTH_UI.muted,
      textAlign: 'center',
    },
  });
}
