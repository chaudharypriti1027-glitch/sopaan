import { Check } from 'lucide-react-native';
import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
        <Text style={styles.title}>{title}</Text>
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
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Text style={[styles.rowText, selected && styles.rowTextSelected]}>{opt.label}</Text>
                {selected ? <Check size={16} color={CA_UI.accent} strokeWidth={2.5} /> : null}
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
      backgroundColor: 'rgba(15,23,42,0.35)',
    },
    sheet: {
      backgroundColor: CA_UI.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: bottomInset + 16,
      maxHeight: '70%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#E2E8F0',
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: CA_UI.text,
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    list: {
      paddingHorizontal: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    rowText: {
      fontSize: 14,
      fontWeight: '500',
      color: CA_UI.text2,
    },
    rowTextSelected: {
      color: CA_UI.accent,
      fontWeight: '700',
    },
    pressed: { backgroundColor: '#F8FAFC' },
  });
}
