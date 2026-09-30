import { AccessibilityInfo, Platform } from "react-native";

/** Announces a completed action without stealing accessibility focus. */
export async function announceAccessibility(message) {
  if (Platform.OS !== "ios") {
    return;
  }

  try {
    const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    if (screenReaderEnabled) {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: true,
      });
    }
  } catch {
    // Status text remains visible if a device cannot provide screen-reader state.
  }
}
