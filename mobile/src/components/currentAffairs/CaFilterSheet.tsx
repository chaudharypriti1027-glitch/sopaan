import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Text';
import { CA_UI } from './caTheme';

export type CaFilterOption = {
  value: string;
  label: string;
};

type CaFilterSheetProps = {
  visible: boolean;
  title: string;
  options: CaFilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export function CaFilterSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: CaFilterSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <LinearGradient
          colors={[...CA_UI.heroGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.titleBar}
        >
          <Text style={styles.title}>{title}</Text>
        </LinearGradient>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {options.map((opt) => {
            const selected = opt.value === selectedValue;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  selected && styles.rowSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{opt.label}</Text>
                {selected ? <Check size={16} color={CA_UI.goldDeep} strokeWidth={2.5} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(bottomInset: number) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(26,31,59,0.45)',
    },
    sheet: {
      backgroundColor: CA_UI.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingBottom: bottomInset + 16,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: CA_UI.border,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 0,
    },
    titleBar: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginTop: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    list: {
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 4,
    },
    rowSelected: {
      backgroundColor: CA_UI.goldSoft,
      borderWidth: 1,
      borderColor: CA_UI.goldBorder,
    },
    rowText: {
      fontSize: 14,
      fontWeight: '600',
      color: CA_UI.text2,
    },
    rowTextSelected: {
      color: CA_UI.accent,
      fontWeight: '800',
    },
    pressed: { opacity: 0.9 },
  });
}
