import { StyleSheet, Text, View } from "react-native";
import { CONTROL, SPACE, TEXT } from "../../src/theme";
import { AccessibleIconButton } from "../accessibility/AccessibleIconButton";
import { AppIcon } from "../icons";
import { useTheme } from "../../src/ThemeContext";

export function AppHeader({ title, onBack, backLabel, backHint, rightAction, rightActions = [], style }) {
  const { colors } = useTheme();
  const actions = rightActions.length ? rightActions : rightAction ? [rightAction] : [];
  return (
    <View style={[styles.header, style, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {onBack ? (
        <AccessibleIconButton
          label={backLabel || (title ? `Back to ${title}` : "Go back")}
          hint={backHint || "Returns to the previous screen"}
          onPress={onBack}
        >
          <AppIcon name="back" color={colors.text} />
        </AccessibleIconButton>
      ) : null}
      <Text accessibilityRole="header" accessibilityLabel={title} style={[styles.title, title === "Goals" && styles.goalsTitle, { color: colors.text }]}>
        {title === "BudgetFlow" ? <><Text>Budget</Text><Text style={{ color: colors.accentText }}>Flow</Text></> : title}
      </Text>
      {actions.length ? <View style={styles.actions}>{actions.map((action) => (
        <AccessibleIconButton key={action.label} label={action.label} hint={action.hint} onPress={action.onPress} disabled={action.disabled}>
          {action.icon}
        </AccessibleIconButton>
      ))}</View> : null}
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
  goalsTitle: { fontSize: 30, lineHeight: 36 },
  actions: { flexDirection: "row", alignItems: "center", gap: SPACE.xs },
});
