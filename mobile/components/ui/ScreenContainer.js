import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, COMPONENT, SPACE } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function ScreenContainer({
  children,
  header,
  scroll = false,
  keyboardAvoiding = false,
  edges = ["top", "left", "right"],
  style,
  contentStyle,
  keyboardShouldPersistTaps = "handled",
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor: colors.background }, style]}>
      {header}
      <KeyboardAvoidingView
        enabled={keyboardAvoiding}
        behavior={keyboardAvoiding && Platform.OS === "ios" ? "padding" : undefined}
        style={styles.body}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: COMPONENT.screenHorizontalPadding,
    paddingVertical: COMPONENT.screenVerticalPadding,
    gap: SPACE.md,
  },
});
