import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS, SPACE, TEXT } from "../../src/theme";

export function LoadingState({ label = "Loading your finances...", style }) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator color={COLORS.primary} accessible={false} />
      <Text accessibilityRole="text" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: SPACE.md, padding: SPACE.xl },
  label: TEXT.body,
});
