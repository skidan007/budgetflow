import { useRouter } from 'expo-router';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { AppHeader, Button, ScreenContainer } from '../components/ui';
import { SPACE, TEXT } from '../src/theme';
import { ThemeScope } from '../src/ThemeContext';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <ScreenContainer
      style={undefined}
      header={<AppHeader title="Page not found" onBack={undefined} backLabel={undefined} backHint={undefined} rightAction={undefined} style={undefined} />}
      edges={['top', 'bottom', 'left', 'right']}
      contentStyle={styles.container}
    >
      <ThemeScope><Text style={styles.title as TextStyle}>This screen does not exist.</Text></ThemeScope>
      <Button
        title="Go to Home"
        variant="secondary"
        onPress={() => router.replace('/')}
        accessibilityHint={undefined}
        accessibilityState={undefined}
        icon={undefined}
        style={undefined}
        textStyle={undefined}
        testID={undefined}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.lg,
  },
  title: TEXT.screenTitle as TextStyle,
});
