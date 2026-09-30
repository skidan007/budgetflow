import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACE, TEXT } from "../../src/theme";
import { Button } from "./Button";
import { useTheme } from "../../src/ThemeContext";

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={[styles.icon, { backgroundColor: colors.purpleTint }]} accessible={false}>{icon}</View> : null}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.secondaryText }]}>{description}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: SPACE.sm, padding: SPACE.xl },
  icon: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.purpleTint, marginBottom: SPACE.xs },
  title: { ...TEXT.cardTitle, textAlign: "center" },
  description: { ...TEXT.secondary, textAlign: "center" },
});
