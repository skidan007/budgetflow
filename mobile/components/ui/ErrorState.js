import { Platform, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACE, TEXT } from "../../src/theme";
import { Button } from "./Button";
import { useTheme } from "../../src/ThemeContext";

/** Keep the supplied copy user-safe; never pass raw service errors here. */
export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this information. Please try again.",
  onRetry,
  retryLabel = "Try again",
  style,
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.redTint }, style]}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.danger }]}>{title}</Text>
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}
        style={[styles.description, { color: colors.text }]}
      >
        {description}
      </Text>
      {onRetry ? <Button title={retryLabel} onPress={onRetry} variant="outline" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start", gap: SPACE.sm, padding: SPACE.lg, borderWidth: 1, borderColor: COLORS.redTint, borderRadius: RADIUS.md, backgroundColor: COLORS.white },
  title: { ...TEXT.cardTitle, color: COLORS.danger },
  description: TEXT.body,
});
