import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, CONTROL, RADIUS, SHADOW, SPACE, TEXT } from "../../src/theme";

const labelColors = {
  primary: COLORS.white,
  secondary: COLORS.primary,
  danger: COLORS.white,
  outline: COLORS.primary,
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityLabel = title,
  accessibilityHint,
  accessibilityState,
  icon,
  style,
  textStyle,
  testID,
}) {
  const unavailable = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ ...accessibilityState, disabled: unavailable, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variants[variant] || variants.primary,
        unavailable && styles.disabled,
        pressed && !unavailable && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator accessible={false} color={labelColors[variant] || COLORS.white} />
      ) : (
        <View style={styles.content}>
          {icon ? <View accessible={false}>{icon}</View> : null}
          <Text style={[styles.label, { color: labelColors[variant] || COLORS.white }, unavailable && styles.disabledLabel, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: CONTROL.buttonHeight,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.action,
  },
  primary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.purpleTint, borderColor: COLORS.purpleTint, shadowOpacity: 0, elevation: 0 },
  danger: { backgroundColor: COLORS.danger, borderColor: COLORS.danger, shadowColor: COLORS.danger },
  outline: { backgroundColor: COLORS.white, borderColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.sm },
  label: { ...TEXT.button, color: COLORS.white, textAlign: "center", flexShrink: 1 },
  disabled: { backgroundColor: COLORS.mutedTint, borderColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
  disabledLabel: { color: COLORS.secondaryText },
  pressed: { opacity: 0.82 },
});

const variants = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  outline: styles.outline,
};
