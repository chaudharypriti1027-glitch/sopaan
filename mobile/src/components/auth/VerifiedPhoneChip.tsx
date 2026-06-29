import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { Text } from '../Text';
import { formatIndianPhoneDisplay } from '../../lib/phone';
import { AUTH_UI } from './authTheme';

type VerifiedPhoneChipProps = {
  phone: string;
};

/** Locked phone chip with verified tick — shown after OTP verify. */
export function VerifiedPhoneChip({ phone }: VerifiedPhoneChipProps) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root} accessibilityLabel={`Verified phone ${formatIndianPhoneDisplay(phone)}`}>
      <View style={styles.leading}>
        <Lock size={16} color={AUTH_UI.muted} />
        <Text style={styles.leadingLabel}>Phone</Text>
      </View>
      <View style={styles.trailing}>
        <Text style={styles.phone}>{formatIndianPhoneDisplay(phone)}</Text>
        <View style={styles.badge}>
          <Check size={14} color="#10B981" strokeWidth={2.5} />
          <Text style={styles.verified}>Verified</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: {
      borderRadius: AUTH_UI.inputRadius,
      borderWidth: 1.5,
      borderColor: '#A7F3D0',
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
    },
    leading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    leadingLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: AUTH_UI.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    phone: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 15,
      color: AUTH_UI.ink,
      flex: 1,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    verified: {
      fontSize: 12,
      fontWeight: '700',
      color: '#10B981',
    },
  });
}
