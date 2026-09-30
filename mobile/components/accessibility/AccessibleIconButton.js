import { Pressable, StyleSheet, View } from "react-native";
import { COLORS, CONTROL, RADIUS, SPACE } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function AccessibleIconButton({
  label,
  hint,
  onPress,
  children,
  disabled = false,
  style,
  testID,
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      hitSlop={SPACE.xs}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.mutedTint },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View accessible={false}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: CONTROL.minTouchTarget,
    minHeight: CONTROL.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.mutedTint,
  },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
});
