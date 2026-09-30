import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SPACE, TEXT } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function LoadingState({ label = "Loading your finances...", style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator color={colors.primary} accessible={false} />
      <Text accessibilityRole="text" style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: SPACE.md, padding: SPACE.xl },
  label: TEXT.body,
});
