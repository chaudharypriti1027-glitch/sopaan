import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileSectionLabel } from './ProfileSectionLabel';

type ProfileSectionProps = {
  title?: string;
  children: ReactNode;
  /** Use inside the stacked body (tighter top spacing). */
  stacked?: boolean;
};

export function ProfileSection({ title, children, stacked = true }: ProfileSectionProps) {
  return (
    <View style={styles.wrap}>
      {title ? <ProfileSectionLabel title={title} stacked={stacked} /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  content: {
    gap: 0,
  },
});
