import { StyleSheet, Text, View } from "react-native";
import { COLORS, CONTROL, SPACE, TEXT } from "../../src/theme";
import { AccessibleIconButton } from "../accessibility/AccessibleIconButton";
import { AppIcon } from "../icons";

export function AppHeader({ title, onBack, rightAction, style }) {
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <AccessibleIconButton
          label="Go back"
          hint="Returns to the previous screen"
          onPress={onBack}
        >
          <AppIcon name="back" color={COLORS.text} />
        </AccessibleIconButton>
      ) : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {rightAction ? (
        <AccessibleIconButton
          label={rightAction.label}
          hint={rightAction.hint}
          onPress={rightAction.onPress}
          disabled={rightAction.disabled}
        >
          {rightAction.icon}
        </AccessibleIconButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: CONTROL.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    paddingHorizontal: SPACE.page,
  },
  title: { ...TEXT.screenTitle, flex: 1, flexWrap: "wrap" },
});
