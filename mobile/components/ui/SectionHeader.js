import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, CONTROL, SPACE, TEXT } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function SectionHeader({ title, actionLabel, onAction, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={SPACE.xs}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: CONTROL.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.sm,
  },
  title: { ...TEXT.sectionTitle, flexShrink: 1 },
  action: {
    minHeight: CONTROL.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: SPACE.sm,
  },
  actionText: { ...TEXT.body, color: COLORS.primary, fontWeight: "700" },
  pressed: { opacity: 0.75 },
});
