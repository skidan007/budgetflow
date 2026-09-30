import { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS, CONTROL, RADIUS, SPACE, TEXT } from "../../src/theme";
import { useTheme } from "../../src/ThemeContext";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  disabled = false,
  keyboardType = "default",
  secureTextEntry = false,
  accessibilityLabel = label,
  accessibilityHint,
  leading,
  controlStyle,
  labelStyle,
  style,
  inputStyle,
  ...textInputProps
}) {
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();
  const errorID = error ? `${textInputProps.nativeID || label}-error` : undefined;

  return (
    <View style={[styles.field, style]}>
      <Text accessible={false} nativeID={`${textInputProps.nativeID || label}-label`} style={[styles.label, labelStyle, { color: colors.secondaryText }]}>
        {label}
      </Text>
      <View style={[leading && styles.leadingControl, controlStyle, { backgroundColor: colors.inputBackground, borderColor: focused ? colors.primary : colors.border }]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <TextInput
          {...textInputProps}
          onFocus={(event) => {
            setFocused(true);
            textInputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            textInputProps.onBlur?.(event);
          }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={error ? `${accessibilityHint ? `${accessibilityHint}. ` : ""}${error}` : accessibilityHint}
          accessibilityState={{ disabled }}
          style={[styles.input, leading && styles.inputWithLeading, focused && !leading && styles.focusedInput, disabled && styles.disabled, inputStyle, { color: colors.text, backgroundColor: leading ? 'transparent' : colors.inputBackground, borderColor: focused ? colors.primary : colors.border }]}
          placeholderTextColor={colors.placeholder}
        />
      </View>
      {error ? (
        <Text
          nativeID={errorID}
          accessibilityRole="alert"
          accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}
          style={[styles.error, { color: colors.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: SPACE.xs },
  label: TEXT.label,
  input: {
    minHeight: CONTROL.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontSize: TEXT.body.fontSize,
    lineHeight: TEXT.body.lineHeight,
  },
  leadingControl: { flexDirection: "row", alignItems: "stretch" },
  leading: { justifyContent: "center" },
  focusedControl: { borderColor: COLORS.primary },
  inputWithLeading: {
    flex: 1,
    minHeight: CONTROL.inputHeight,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  focusedInput: { borderColor: COLORS.primary, borderWidth: 1.5 },
  disabled: { backgroundColor: COLORS.mutedTint, color: COLORS.secondaryText },
  error: TEXT.error,
});
