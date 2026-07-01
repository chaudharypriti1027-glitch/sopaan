import { ErrorBoundary } from '@sentry/react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

function ErrorFallback({
  resetError,
}: {
  resetError: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <View style={styles.root} accessibilityRole="alert">
      <AlertTriangle size={40} color="#DC2626" />
      <Text style={styles.title}>{t('somethingWentWrong')}</Text>
      <Text style={styles.body}>{t('appCrashBody')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('retry')}
        onPress={resetError}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonLabel}>{t('retry')}</Text>
      </Pressable>
    </View>
  );
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}>
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#F4F1E9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    minHeight: 44,
    minWidth: 160,
    borderRadius: 12,
    backgroundColor: '#232A4D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
