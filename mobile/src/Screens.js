import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, useFocusEffect, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import Svg, { Circle, Path } from "react-native-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  ArrowDownLeft,
  ArrowDown,
  ArrowUpRight,
  ArrowUp,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  BriefcaseBusiness,
  CircleEllipsis,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  Eye,
  EyeOff,
  Landmark,
  Minus,
  ReceiptText,
  Sparkles,
  Trash2,
  Wallet,
  WalletCards,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { announceAccessibility } from "../components/accessibility/announce";
import { BudgetFlowLogo } from "../components/ui/BudgetFlowLogo";
import { analyzeMonthlyChange, monthlyChangeTone } from "./monthlyChange.mjs";
import { budgetPerformance, expenseCategoryTotals, totalForType, transactionMonth, transactionsForMonth } from "./reports.mjs";
import { calculateCompoundInterest, validateCompoundInputs } from "./compoundInterest.mjs";
import { validateFinancialProfileAmounts } from "./financialProfile.mjs";
import { AMOUNT_DECIMAL_SEPARATOR, amountCursorForEdit, editedTextRange, formatEditableAmount, parseEditableAmount, validateEditableAmount } from "./amountInput.mjs";
import { allocatePlannerAmounts, fromMinorUnits, toMinorUnits, totalMinorUnits } from "./planner.mjs";
import { getAvailableExpenseCategoriesFromBudgets, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "./categoryCatalog.mjs";
import { GOAL_CATEGORIES, normalizeGoal } from "./goalCategories.mjs";
import { firstName } from "./identity.mjs";
import { weeklyBudgetSummary } from "./weeklyBudget.mjs";
import { ThemeScope, useTheme } from "./ThemeContext";
import { FunctionalIcon, GoalCategoryIcon, functionalToneForName } from "../components/ui/FunctionalIcon";
import { FeatureRow } from "../components/ui/FeatureRow";
import { AppIcon, CATEGORY_ICON_NAMES } from "../components/icons";
import {
  AppHeader,
  Button as SharedButton,
  EmptyState,
  ErrorState,
  FinanceCard,
  Input,
  ListRow,
  LoadingState,
  ProgressBar,
  ScreenContainer,
  SectionHeader,
} from "../components/ui";
import { supabase, supabaseConfigured } from "./supabase";
import {
  currencySymbols,
  daysInMonth,
  prevMonth,
  useFinance,
} from "./FinanceContext";
import { COLORS, FUNCTIONAL_ICON_TONES, SPACE, RADIUS, TYPE, TEXT, CONTROL, COMPONENT } from "./theme";

WebBrowser.maybeCompleteAuthSession();

const SHOW_GOAL_SYNC_DIAGNOSTICS = __DEV__
  && process.env.EXPO_PUBLIC_BUDGETFLOW_GOAL_DIAGNOSTICS === "true";

const C = {
  navy: COLORS.navy,
  purple: COLORS.primary,
  green: COLORS.positive,
  red: COLORS.danger,
  muted: COLORS.secondaryText,
  ink: COLORS.text,
  bg: COLORS.background,
  line: COLORS.border,
  white: COLORS.white,
  warning: COLORS.warning,
};
const money = (v, s, options) => {
  if (options?.editing) {
    return formatEditableAmount(v);
  }
  return `${s}${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};
function plannerInputFromMinor(value) {
  const amount = fromMinorUnits(value);
  return amount === null
    ? ""
    : new Intl.NumberFormat(undefined, { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
function dateFromKey(key) {
  const [year, month, day] = String(key || "").split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
}
function dateToKey(value) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
function formatDateLabel(value) {
  const parsed = dateFromKey(value);
  return parsed.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" });
}
const currencyNames = {
  NGN: "Nigerian naira",
  USD: "US dollars",
  GBP: "British pounds",
  EUR: "euros",
  JPY: "Japanese yen",
  CNY: "Chinese yuan",
  CAD: "Canadian dollars",
  AUD: "Australian dollars",
  CHF: "Swiss francs",
};
const accessibleMoney = (value, currency) =>
  `${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currencyNames[currency] || currency}`;
function backTo(router, fallbackRoute) {
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallbackRoute);
  };
}
function Page({
  title,
  children,
  scroll = true,
  back,
  backLabel,
  backHint,
  rightAction,
  rightActions,
  headerStyle,
  contentStyle,
  keyboardAvoiding = false,
}) {
  const f = useFinance();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const metadata = f.user?.user_metadata || {};
  const avatarUrl = metadata.avatar_url || metadata.picture;
  const avatarName = String(metadata.full_name || metadata.name || "").trim();
  const avatarInitials = (avatarName || f.user?.email?.split("@")[0] || "U")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const globalActions = [
    {
      label: "Notifications",
      hint: "Shows whether mobile notifications are available",
      icon: <AppIcon name="notifications" size={19} color={theme.colors.text} />,
      onPress: () => Alert.alert("Notifications", "Notifications are not available in the mobile app yet."),
      style: S.headerIconAction,
    },
    {
      label: "Open account",
      hint: "Opens your account and settings",
      icon: avatarUrl
        ? <Image source={{ uri: avatarUrl }} style={S.dashboardAvatarImage} />
        : <View style={[S.dashboardAvatarFallback, { backgroundColor: theme.colors.primary }]}><Text style={[S.dashboardAvatarInitials, { color: theme.colors.onPrimary }]}>{avatarInitials || "U"}</Text></View>,
      onPress: () => { if (!pathname?.endsWith("/account")) router.push("/account"); },
      style: S.headerAvatarAction,
    },
  ];
  const headerActions = rightActions?.length ? rightActions : rightAction ? [rightAction] : f.user ? globalActions : [];
  return (
    <ScreenContainer
      header={<AppHeader title={title} onBack={back} backLabel={backLabel} backHint={backHint} rightActions={headerActions} style={[S.header, headerStyle]} />}
      scroll={scroll}
      keyboardAvoiding={keyboardAvoiding}
      edges={back ? ["top", "bottom", "left", "right"] : ["top", "left", "right"]}
      contentStyle={scroll ? [S.content, contentStyle] : S.listContainer}
    >
      <ThemeScope>{children}</ThemeScope>
    </ScreenContainer>
  );
}
function Card({ children, style, accessibilityLabel }) {
  return (
    <FinanceCard style={style} accessibilityLabel={accessibilityLabel}>
      {children}
    </FinanceCard>
  );
}
function Label({ children }) {
  return <Text style={[TEXT.label, S.label]}>{children}</Text>;
}
function Field({ style, ...props }) {
  return (
    <Input
      {...props}
      style={[S.field, style]}
    />
  );
}
function SelectField({ label, value, options, onChange, accessibilityLabel = label, leadingIcon, tone, selectedIcon }) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  return (
    <View style={S.field}>
      <Label>{label}</Label>
      <Pressable accessibilityRole="button" accessibilityLabel={`${accessibilityLabel || label}${value ? `, ${value}` : ", not selected"}`} accessibilityHint="Opens available options" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={[S.dateSelector, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        {selectedIcon ? React.createElement(selectedIcon, { size: 20, color: colors.accentText }) : leadingIcon ? <FunctionalIcon name={leadingIcon} tone={tone} containerSize={36} size={17} /> : null}
        <Text style={[S.dateSelectorText, leadingIcon && S.selectValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
        <ChevronDown size={18} color={colors.accentText} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} accessibilityViewIsModal>
        <Pressable style={[S.selectBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <View style={[S.selectSheet, { backgroundColor: colors.card }]} accessibilityRole="radiogroup" accessibilityLabel={label}>
            <Text accessibilityRole="header" style={[S.cardTitle, { color: colors.text }]}>{label}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option.value === value;
              return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ selected }} onPress={() => { onChange(option.value); setOpen(false); }} style={[S.selectOption, selected && S.selectOptionSelected, { backgroundColor: selected ? colors.purpleTint : "transparent" }]}>
                {option.icon ? React.createElement(option.icon, { size: 19, color: selected ? colors.accentText : colors.secondaryText }) : null}<Text style={[S.bodyText, { color: colors.text, flex: 1 }]}>{option.label}</Text>{selected ? <Check size={18} color={colors.accentText} /> : null}
              </Pressable>;
            })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
function Button({
  title,
  onPress,
  secondary = false,
  accessibilityLabel = title,
  accessibilityHint,
  disabled,
  loading,
  variant,
  icon,
  style,
}) {
  return (
    <SharedButton
      onPress={onPress}
      title={title}
      variant={variant || (secondary ? "secondary" : "primary")}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      loading={loading}
      icon={icon}
      style={style ? [S.buttonSpacing, style] : S.buttonSpacing}
    />
  );
}
function Empty({ text, description, icon: Icon = Wallet, actionLabel, onAction }) {
  return (
    <Card style={S.emptyCard}>
      <EmptyState
        title={text}
        description={description}
        icon={<Icon size={22} color={C.purple} />}
        actionLabel={actionLabel}
        onAction={onAction}
        style={S.emptyState}
      />
    </Card>
  );
}
function CategoryIcon({ name, size = 20, tint = C.purple }) {
  const normalized = String(name || "").trim().toLowerCase();
  const iconName = CATEGORY_ICON_NAMES[normalized] || "balance";
  const tone = functionalToneForName(normalized);
  if (tint === C.green) return <FunctionalIcon name={iconName} tone="green" size={size} containerSize={size <= 18 ? 40 : 48} />;
  if (tint === C.red) return <FunctionalIcon name={iconName} tone="red" size={size} containerSize={size <= 18 ? 40 : 48} />;
  if (tint === COLORS.white) return <FunctionalIcon name={iconName} tone="gray" size={size} containerSize={size <= 18 ? 40 : 48} />;
  return <FunctionalIcon name={iconName} tone={tone} size={size} containerSize={size <= 18 ? 40 : 48} />;
}
function progressAccent(category, theme, danger = false) {
  if (danger) return theme.colors.danger;
  const normalizedCategory = String(category || "").toLowerCase();
  const tone = /transport/.test(normalizedCategory) ? "purple" : functionalToneForName(normalizedCategory);
  return FUNCTIONAL_ICON_TONES[tone]?.[theme.themeName]?.foreground || theme.colors.primary;
}
function budgetUsageState(percent) {
  if (percent > 100) return "Over budget";
  if (percent >= 80) return "Approaching limit";
  return "Within budget";
}
function goalVisual(goal) {
  const normalized = normalizeGoal(goal);
  return { category: normalized.category, tone: functionalToneForName(normalized.category) };
}
function CurrencyField({ label, value, onChangeText, symbol, currency, accessibilityLabel, inputStyle, ...inputProps }) {
  return (
    <Input
      {...inputProps}
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder="0.00"
      keyboardType="decimal-pad"
      style={S.field}
      controlStyle={S.currencyInput}
      leading={
        <Text style={S.currencySymbol} accessible={false}>
          {symbol}
        </Text>
      }
      inputStyle={[S.currencyTextInput, inputStyle]}
      accessibilityLabel={accessibilityLabel || `${label}, amount in ${currencyNames[currency] || symbol}`}
    />
  );
}
function PlannerAmountField({ value, onChangeText, onValidationError, symbol, ...fieldProps }) {
  const [selection, setSelection] = useState();
  const [validationError, setValidationError] = useState("");
  const selectionRef = useRef({ start: 0, end: 0 });
  const displayValue = formatEditableAmount(value);
  function handleChange(nextText) {
    const edit = editedTextRange(displayValue, nextText);
    const insertedIsNumeric = [...edit.inserted].every((character) =>
      /\d/.test(character) || character === AMOUNT_DECIMAL_SEPARATOR,
    );
    const incrementalEdit = edit.inserted.length <= 2 && insertedIsNumeric;
    const parsed = parseEditableAmount(nextText, symbol, incrementalEdit);
    if (parsed.error) {
      setValidationError(parsed.error);
      onValidationError?.(parsed.error);
      return;
    }
    setValidationError("");
    onValidationError?.("");
    onChangeText(parsed.value);

    const priorSelection = selectionRef.current;
    let cursorPosition = edit.prefix + edit.inserted.length;
    if (!edit.inserted.length && edit.removed.length) {
      if (priorSelection.start !== priorSelection.end) cursorPosition = priorSelection.start;
      else if (edit.prefix >= priorSelection.start && displayValue.length > nextText.length) cursorPosition = Math.max(priorSelection.start - 1, 0);
      else cursorPosition = edit.prefix;
    }
    const nextCursor = amountCursorForEdit(nextText, symbol, cursorPosition, parsed.value);
    const nextSelection = { start: nextCursor, end: nextCursor };
    selectionRef.current = nextSelection;
    setSelection(nextSelection);
  }
  return (
    <CurrencyField
      {...fieldProps}
      value={displayValue}
      onChangeText={handleChange}
      symbol={symbol}
      error={fieldProps.error || validationError}
      selection={selection}
      onSelectionChange={(event) => {
        const nextSelection = event.nativeEvent.selection;
        selectionRef.current = nextSelection;
        setSelection(nextSelection);
      }}
    />
  );
}
function DatePickerField({ label, value, onChange, error }) {
  const [showPicker, setShowPicker] = useState(false);
  if (Platform.OS === "web")
    return (
      <Input
        label={label}
        value={value}
        onChangeText={onChange}
        type="date"
        error={error}
        accessibilityLabel={`${label}${value ? `, ${formatDateLabel(value)}` : ", not selected"}`}
      />
    );
  return (
    <View style={S.field}>
      <Label>{label}</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${formatDateLabel(value)}` : ", not selected"}`}
        accessibilityHint="Opens the date picker"
        onPress={() => setShowPicker(true)}
        style={S.dateSelector}
      >
        <Text style={S.dateSelectorText}>{value ? formatDateLabel(value) : "Select date"}</Text>
        <AppIcon name="calendar" color={C.purple} />
      </Pressable>
      {error ? <Text accessibilityRole="alert" style={S.inlineError}>{error}</Text> : null}
      {showPicker && (
        <View style={S.datePicker}>
          <DateTimePicker
            value={dateFromKey(value)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onValueChange={(_event, selectedDate) => {
              onChange(dateToKey(selectedDate));
              if (Platform.OS !== "ios") setShowPicker(false);
            }}
            onDismiss={() => setShowPicker(false)}
          />
          {Platform.OS === "ios" && <Button title="Done" secondary onPress={() => setShowPicker(false)} />}
        </View>
      )}
    </View>
  );
}
function useData() {
  const f = useFinance();
  if (f.loading) return { f, waiting: true };
  if (!f.user) return { f, auth: true };
  return { f };
}
function startupLabel(stage) {
  if (stage === "AUTHENTICATING") return "Checking your session...";
  if (stage === "LOADING ACCOUNT") return "Loading your account...";
  if (stage === "LOADING FINANCIAL DATA") return "Loading your financial data...";
  return "Preparing BudgetFlow...";
}

function ResourceWarning({ onRetry }) {
  const theme = useTheme();
  return (
    <View accessibilityRole="alert" style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, backgroundColor: theme.colors.card, borderBottomWidth: 1, borderColor: theme.colors.border }}>
      <Text style={{ flex: 1, color: theme.colors.secondaryText, fontSize: TYPE.caption, lineHeight: TYPE.lineHeight.caption }}>Some financial information could not be loaded. This screen may be incomplete.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Retry loading financial information" onPress={onRetry} hitSlop={8}>
        <Text style={{ color: theme.colors.accentText, fontSize: TYPE.caption, fontWeight: TYPE.weight.bold }}>Retry</Text>
      </Pressable>
    </View>
  );
}

function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.43 38.08 46.98 31.92 46.98 24.55z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.15 15.91-5.8l-7.73-6c-2.15 1.44-4.9 2.3-8.18 2.3-6.28 0-11.6-4.24-13.5-9.94l-7.98 6.16C6.47 42.09 14.58 48 24 48z" />
      <Path fill="#FBBC05" d="M10.5 28.56a14.4 14.4 0 0 1 0-9.12l-7.98-6.16a23.98 23.98 0 0 0 0 21.44l7.98-6.16z" />
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.9-6.9C35.92 2.38 30.47 0 24 0 14.58 0 6.47 5.91 2.52 13.28l7.98 6.16C12.4 13.74 17.72 9.5 24 9.5z" />
    </Svg>
  );
}

function googleAuthErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();
  if (/provider.*(disabled|not enabled|not configured)|unsupported provider/.test(message)) {
    return "Google sign-in isn’t enabled for BudgetFlow yet. Please contact support.";
  }
  if (/network|fetch|timeout|connection/.test(message)) {
    return "Couldn’t connect to Google sign-in. Check your connection and try again.";
  }
  if (/expired|invalid.*(code|token|grant)|grant.*expired|code verifier/.test(message)) {
    return "That Google sign-in link has expired. Please try again.";
  }
  return "We couldn’t complete Google sign-in. Please try again.";
}

export function AuthScreen() {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [googleLoading, setGoogleLoading] = useState(false);
  const submittingRef = useRef(false);
  const googleSubmittingRef = useRef(false);
  const lastGoogleAlert = useRef({ message: "", at: 0 });
  const oauthCallbacks = useRef({ inFlight: new Map(), handled: new Set() });
  const router = useRouter();
  const theme = useTheme();
  const redirectTo = useMemo(() => makeRedirectUri({ scheme: "budgetflow" }), []);
  const showGoogleError = useCallback((error) => {
    const message = googleAuthErrorMessage(error);
    const previous = lastGoogleAlert.current;
    if (previous.message === message && Date.now() - previous.at < 1500) return;
    lastGoogleAlert.current = { message, at: Date.now() };
    Alert.alert("Google sign-in failed", message);
  }, []);

  const processGoogleOAuthCallback = useCallback((url) => {
    if (!url) return Promise.resolve({ handled: false });
    const { params, errorCode } = QueryParams.getQueryParams(url);
    const hasOAuthResponse = Boolean(errorCode || params.code || params.access_token || params.error || params.error_description || params.error_code);
    if (!hasOAuthResponse) return Promise.resolve({ handled: false });
    let fingerprint = 2166136261;
    for (let index = 0; index < url.length; index += 1) fingerprint = Math.imul(fingerprint ^ url.charCodeAt(index), 16777619);
    const callbackKey = String(fingerprint >>> 0);
    if (oauthCallbacks.current.handled.has(callbackKey)) return Promise.resolve({ handled: true });
    const existing = oauthCallbacks.current.inFlight.get(callbackKey);
    if (existing) return existing;

    const task = (async () => {
      if (params.error === "access_denied" || errorCode === "access_denied") {
        oauthCallbacks.current.handled.add(callbackKey);
        return { handled: true, cancelled: true };
      }
      try {
        if (errorCode || params.error || params.error_code) {
          throw new Error(errorCode || params.error_description || params.error || "Google authentication was rejected.");
        }
        let result;
        if (params.code) {
          result = await supabase.auth.exchangeCodeForSession(String(params.code));
        } else if (params.access_token && params.refresh_token) {
          result = await supabase.auth.setSession({ access_token: String(params.access_token), refresh_token: String(params.refresh_token) });
        } else {
          throw new Error("Google returned an invalid or incomplete sign-in response.");
        }
        if (result.error) throw result.error;
        if (!result.data?.session) throw new Error("Google sign-in did not establish a session.");
        oauthCallbacks.current.handled.add(callbackKey);
        return { handled: true, session: result.data.session };
      } catch (error) {
        if (/access_denied|user cancelled|user canceled/i.test(error?.message || "")) {
          oauthCallbacks.current.handled.add(callbackKey);
          return { handled: true, cancelled: true };
        }
        console.warn("[BudgetFlow Auth] Google callback failed", { code: error?.code || null, status: error?.status || null });
        showGoogleError(error);
        throw error;
      }
    })();
    oauthCallbacks.current.inFlight.set(callbackKey, task);
    void task.finally(() => oauthCallbacks.current.inFlight.delete(callbackKey)).catch(() => {});
    return task;
  }, [showGoogleError]);

  useEffect(() => {
    let active = true;
    const handleIncomingUrl = (url) => {
      if (!url) return;
      const callback = processGoogleOAuthCallback(url);
      void callback.then((result) => {
        if (active && result.handled && !result.cancelled) setGoogleLoading(false);
      }).catch((error) => {
        if (active) showGoogleError(error);
      }).finally(() => {
        if (active && callback) setGoogleLoading(false);
      });
    };
    const subscription = Linking.addEventListener("url", ({ url }) => handleIncomingUrl(url));
    Linking.getInitialURL().then(handleIncomingUrl).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, [processGoogleOAuthCallback, showGoogleError]);

  async function signInWithGoogle() {
    if (googleSubmittingRef.current || submittingRef.current || busy || googleLoading) return;
    if (!supabaseConfigured) {
      Alert.alert("Setup required", "Google sign-in is unavailable until BudgetFlow is connected to Supabase.");
      return;
    }
    googleSubmittingRef.current = true;
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Google didn’t return a sign-in page.");
      const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (browserResult.type === "cancel" || browserResult.type === "dismiss") return;
      if (browserResult.type !== "success" || !browserResult.url) throw new Error("Google did not return a valid callback.");
      const callbackResult = await processGoogleOAuthCallback(browserResult.url);
      if (!callbackResult.handled) throw new Error("Google returned an invalid or incomplete sign-in response.");
    } catch (error) {
      console.warn("[BudgetFlow Auth] Google sign-in failed", { code: error?.code || null, status: error?.status || null });
      showGoogleError(error);
    } finally {
      googleSubmittingRef.current = false;
      setGoogleLoading(false);
    }
  }

  async function submit() {
    if (submittingRef.current || googleSubmittingRef.current) return;
    if (!supabaseConfigured)
      return Alert.alert(
        "Setup required",
        "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to mobile/.env.",
      );
    submittingRef.current = true;
    setBusy(true);
    try {
      const res = signup
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
      if (res.error) Alert.alert(signup ? "Sign up failed" : "Sign in failed", res.error.message);
      else if (signup && !res.data.session)
        Alert.alert("Check your email", "Confirm your account, then sign in.");
      else router.replace("/");
    } catch (error) {
      Alert.alert(signup ? "Sign up failed" : "Sign in failed", error.message || "Could not reach the authentication service.");
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }
  return (
    <ThemeScope>
    <SafeAreaView style={S.auth} edges={["top", "bottom"]}>
    <KeyboardAvoidingView
      style={S.authKeyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={S.authContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <BudgetFlowLogo size={108} />
      <Text style={S.authTitle}>BudgetFlow</Text>
      <Text style={S.authSub}>
        {signup ? "Create your account" : "Welcome back"}
      </Text>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
      />
      <View style={S.authSubmit}>
        <Button
          title={
            busy ? "Please wait..." : signup ? "Create account" : "Sign in"
          }
          onPress={submit}
          disabled={busy || googleLoading}
          loading={busy}
        />
      </View>
      <View style={S.googleAuthDivider}>
        <View style={[S.googleAuthRule, { backgroundColor: theme.colors.border }]} />
        <Text style={[S.googleAuthOr, { color: theme.colors.secondaryText }]}>OR</Text>
        <View style={[S.googleAuthRule, { backgroundColor: theme.colors.border }]} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={googleLoading ? "Connecting to Google" : "Continue with Google"}
        accessibilityHint="Signs in or creates your BudgetFlow account with Google"
        accessibilityState={{ disabled: busy || googleLoading, busy: googleLoading }}
        disabled={busy || googleLoading}
        onPress={signInWithGoogle}
        style={({ pressed }) => [S.googleAuthButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, pressed && !googleLoading && { opacity: 0.8 }]}
      >
        <GoogleMark />
        <Text style={[S.googleAuthText, { color: theme.colors.text }]}>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</Text>
        {googleLoading ? <ActivityIndicator size="small" color={theme.colors.accentText} /> : <View style={S.googleAuthTrailingSpace} />}
      </Pressable>
      <Pressable
        onPress={() => setSignup(!signup)}
        accessibilityRole="button"
        accessibilityLabel={signup ? "Switch to sign in" : "Create a BudgetFlow account"}
        accessibilityState={{ disabled: busy || googleLoading }}
        disabled={busy || googleLoading}
        style={S.authSwitch}
      >
        <Text style={S.authSwitchText}>
          {signup
            ? "Already have an account? Sign in"
            : "New to BudgetFlow? Create account"}
        </Text>
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
    </ThemeScope>
  );
}
function Guard({ children, errorTitle = "Unable to load your finances", errorDescription = "Your financial information is unavailable right now. Please try again." }) {
  const { f, waiting, auth } = useData();
  if (waiting)
    return (
      <ScreenContainer
        edges={["top", "bottom", "left", "right"]}
        contentStyle={S.loadingContainer}
      >
        <LoadingState label={startupLabel(f.startupStage)} />
      </ScreenContainer>
    );
  if (auth) return <AuthScreen />;
  if (f.error)
    return (
      <Page title={f.errorKind === "network" ? "Connection issue" : f.errorKind === "authentication" ? "Sign-in required" : "Account data issue"}>
        <ErrorState title={f.errorKind === "authentication" ? "Your session needs attention" : errorTitle} description={__DEV__ ? `${errorDescription} (${f.error})` : f.errorKind === "network" ? errorDescription : "Your account data could not be loaded. Please try again."} onRetry={f.refresh} />
      </Page>
    );
  if (Object.keys(f.resourceErrors || {}).length || f.refreshError) {
    return <View style={{ flex: 1 }}><ResourceWarning onRetry={f.refresh} />{children}</View>;
  }
  return children;
}
export function HomeScreen() {
  return (
    <Guard>
      <Home />
    </Guard>
  );
}
function ChangeIndicator({ metric, analysis, highContrast = false }) {
  const { colors } = useTheme();
  const tone = monthlyChangeTone(metric, analysis.direction);
  const color = highContrast
    ? tone === "positive" ? "#86EFAC" : tone === "danger" ? "#FCA5A5" : "#E8E4FF"
    : tone === "positive" ? colors.positive : tone === "danger" ? colors.danger : colors.secondaryText;
  const DirectionIcon = analysis.direction === "up" ? ArrowUp : analysis.direction === "down" ? ArrowDown : analysis.direction === "same" ? Minus : null;
  return (
    <View accessibilityRole="text" accessibilityLabel={analysis.spoken} style={S.changeIndicator}>
      {DirectionIcon ? <DirectionIcon size={15} color={color} strokeWidth={2.6} accessible={false} /> : null}
      <Text style={[S.changeText, { color }]} numberOfLines={2}>{analysis.label}</Text>
    </View>
  );
}
function SmartPlanIcon({ theme }) {
  const colors = FUNCTIONAL_ICON_TONES.purple[theme.themeName];
  return (
    <View accessible={false} style={[S.smartPlanIcon, { backgroundColor: colors.background }]}>
      <ChartNoAxesColumnIncreasing size={22} color={colors.foreground} strokeWidth={2.4} />
      <Sparkles size={13} color={colors.foreground} strokeWidth={2.5} style={S.smartPlanSparkle} />
    </View>
  );
}
function SmartPlanAction({ onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Smart Plan"
      accessibilityHint="Opens the existing Smart Plan review"
      onPress={onPress}
      style={({ pressed }) => [S.dashboardSmartPlanAction, { backgroundColor: theme.colors.purpleTint, borderColor: theme.colors.borderPurple }, pressed && { opacity: 0.78 }]}
    >
      <SmartPlanIcon theme={theme} />
      <Text style={[S.dashboardSmartPlanText, { color: theme.colors.accentText }]}>Smart Plan</Text>
      <ChevronRight size={16} color={theme.colors.accentText} accessible={false} />
    </Pressable>
  );
}
function Home() {
  const f = useFinance(),
    router = useRouter(),
    theme = useTheme();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { tx, previousTx, inc, spent, previousIncome, previousExpenses, previousBalance, hasPreviousBalance } = useMemo(() => {
    const priorMonth = prevMonth(f.currentMonth);
    const currentRows = [];
    const previousRows = [];
    for (const transaction of f.transactions) {
      if ((transaction.currency || "NGN") !== f.currency) continue;
      const month = transaction.month || transaction.date?.slice(0, 7);
      if (month === f.currentMonth) currentRows.push(transaction);
      else if (month === priorMonth) previousRows.push(transaction);
    }
    const currentIncome = sum(currentRows, "Income");
    const currentExpenses = sum(currentRows, "Expense");
    const priorIncome = sum(previousRows, "Income");
    const priorExpenses = sum(previousRows, "Expense");
    const cycleMatchesPriorMonth = f.cycle?.cycle_month === priorMonth;
    const savedCycleBalance = cycleMatchesPriorMonth && f.cycle?.previous_balance != null
      ? Number(f.cycle.previous_balance)
      : NaN;
    return {
      tx: currentRows,
      previousTx: previousRows,
      inc: currentIncome,
      spent: currentExpenses,
      previousIncome: priorIncome,
      previousExpenses: priorExpenses,
      previousBalance: Number.isFinite(savedCycleBalance) ? savedCycleBalance : priorIncome - priorExpenses,
      hasPreviousBalance: previousRows.length > 0 || cycleMatchesPriorMonth,
    };
  }, [f.transactions, f.currency, f.currentMonth, f.cycle]);
  const incomeChange = analyzeMonthlyChange(inc, previousIncome, previousTx.length > 0);
  const expensesChange = analyzeMonthlyChange(spent, previousExpenses, previousTx.length > 0);
  const balanceChange = analyzeMonthlyChange(inc - spent, previousBalance, hasPreviousBalance);
  const recentTransactions = useMemo(() => f.transactions
    .filter((transaction) => (transaction.currency || "NGN") === f.currency)
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 5), [f.transactions, f.currency]);
  const bud = f.budgets.filter(
      (b) => b.currency === f.currency && b.month === f.currentMonth,
    ),
    days = daysInMonth(f.currentMonth),
    today = new Date().toISOString().slice(0, 10),
    spentToday = tx
      .filter((t) => t.type === "Expense" && t.date === today)
      .reduce((a, t) => a + Number(t.amount || 0), 0),
    previous = cycleBalance(
      f.transactions,
      prevMonth(f.currentMonth),
      f.currency,
    ),
    alerts = bud
      .map((b) => ({
        b,
        spent: categorySpent(f.transactions, b, f.currentMonth, f.currency),
      }))
      .filter((x) => x.spent > x.b.amount);
  const monthlyBudget = bud.reduce(
      (total, b) => total + Number(b.amount || 0),
      0,
    ),
    dailyTarget = days ? monthlyBudget / days : 0,
    monthlyRemaining = bud.reduce(
      (total, b) =>
        total +
        Number(b.amount || 0) -
        categorySpent(f.transactions, b, f.currentMonth, f.currency),
      0,
    ),
    dailyRemaining = dailyTarget - spentToday,
    currentDayNumber = Number(today.slice(-2)),
    todayDate = new Date(`${today}T12:00:00`),
    mondayOffset = (todayDate.getDay() + 6) % 7,
    weekStartDay = Math.max(currentDayNumber - mondayOffset, 1),
    weekDays = Math.min(currentDayNumber, days) - weekStartDay + 1,
    weeklyTarget = dailyTarget * Math.max(weekDays, 0),
    weeklySpent = tx.filter((transaction) => transaction.type === "Expense" && transaction.date >= `${f.currentMonth}-${String(weekStartDay).padStart(2, "0")}` && transaction.date <= today).reduce((total, transaction) => total + Number(transaction.amount || 0), 0),
    weeklyRemaining = weeklyTarget - weeklySpent,
    dayOfMonth = Number(today.slice(-2)),
    futureDays = Math.max(days - dayOfMonth, 1),
    tomorrowTarget =
      Math.max(monthlyRemaining - Math.max(dailyRemaining, 0), 0) / futureDays;
  const currentGoals = f.goals.filter((goal) => goal.currency === f.currency);
  const netSavings = inc - spent;
  const metadata = f.user?.user_metadata || {};
  const displayName = firstName(metadata.full_name || metadata.name || f.user?.email?.split("@")[0]) || "there";
  return (
    <Page
      title="BudgetFlow"
      headerStyle={S.dashboardHeader}
      contentStyle={S.dashboardContent}
    >
      <View style={[S.monthPill, { backgroundColor: theme.colors.purpleTint }]}>
        <CalendarDays size={16} color={theme.colors.accentText} accessible={false} />
          <Text style={[S.monthPillText, { color: theme.colors.accentText }]}>
          {monthLabel(f.currentMonth)}
        </Text>
      </View>
      <View style={S.dashboardGreeting}>
        <Text accessibilityRole="header" style={S.greetingTitle}>{`${new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, ${displayName} 👋`}</Text>
        <Text style={S.sub}>Here&apos;s your financial overview.</Text>
        <Text style={S.caption}>Currency: {f.currency}</Text>
      </View>
      <Card style={[S.hero, { backgroundColor: theme.isDark ? "#352DA0" : "#5143C7", borderColor: theme.isDark ? "#5145D5" : "#5143C7" }]}>
        <View pointerEvents="none" style={S.heroGlow} />
        <View style={S.heroTop}>
          <View>
            <Text style={[S.heroLabel, { color: "#F8FAFC" }]} accessible={false}>TOTAL BALANCE</Text>
            <View style={S.balanceAmountRow}>
              <Text style={[S.heroAmount, { color: theme.colors.onPrimary }]} accessibilityLabel={balanceVisible ? `Total balance, ${accessibleMoney(inc - spent, f.currency)}` : "Total balance hidden"}>{balanceVisible ? money(inc - spent, f.symbol) : "••••••"}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={balanceVisible ? "Hide total balance" : "Show total balance"} accessibilityHint="Toggles whether your total balance is visible" onPress={() => setBalanceVisible((visible) => !visible)} style={S.balanceVisibility}>
                {balanceVisible ? <Eye size={19} color="#FFFFFF" /> : <EyeOff size={19} color="#FFFFFF" />}
              </Pressable>
            </View>
          </View>
          <View style={S.balanceIcon}>
            <Wallet size={21} color="#FFFFFF" accessible={false} />
          </View>
        </View>
        <ChangeIndicator metric="balance" analysis={balanceChange} highContrast />
      </Card>
      <View style={S.dashboardOverviewHeader}>
        <Text accessibilityRole="header" style={[S.dashboardOverviewTitle, { color: theme.colors.text }]}>Monthly Overview</Text>
        <SmartPlanAction onPress={() => router.push("/planner")} />
      </View>
      <View style={S.summaryGrid}>
        <Card style={S.summaryCard} accessibilityLabel={`Income, ${accessibleMoney(inc, f.currency)}. ${incomeChange.spoken}${inc === 0 ? ". No income recorded this month." : ""}`}>
          <View style={S.summaryHeading}>
            <View style={S.summaryIdentity}>
              <FunctionalIcon name="income" containerSize={34} size={16} />
              <Text style={S.summaryLabel}>Income</Text>
            </View>
            {/* <ChevronRight size={21} color={theme.colors.accentText} accessible={false} /> */}
          </View>
          <Text style={S.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(inc, f.symbol)}</Text>
          <ChangeIndicator metric="income" analysis={incomeChange} />
          {inc === 0 && <Text style={S.caption}>No income recorded this month.</Text>}
        </Card>
        <Card style={S.summaryCard} accessibilityLabel={`Expenses, ${accessibleMoney(spent, f.currency)}. ${expensesChange.spoken}`}>
          <View style={S.summaryHeading}>
            <View style={S.summaryIdentity}>
              <FunctionalIcon name="expenses" tone="red" containerSize={34} size={16} />
              <Text style={S.summaryLabel}>Expenses</Text>
            </View>
            {/* <ChevronRight size={21} color={theme.colors.accentText} accessible={false} /> */}
          </View>
          <Text style={S.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(spent, f.symbol)}</Text>
          <ChangeIndicator metric="expenses" analysis={expensesChange} />
        </Card>
      </View>
      <Card
        style={S.monthlySavingsCard}
        accessibilityLabel={`${netSavings < 0 ? "Net deficit" : "Net savings"} this month, ${accessibleMoney(Math.abs(netSavings), f.currency)}, calculated from this month's income and expenses`}
      >
        <FunctionalIcon name="savings" tone={netSavings < 0 ? "red" : "teal"} containerSize={42} size={20} />
        <View style={S.monthlySavingsCopy}>
          <Text style={S.summaryLabel}>{netSavings < 0 ? "Net deficit this month" : "Net savings this month"}</Text>
          <Text style={[S.monthlySavingsAmount, netSavings < 0 && { color: theme.colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
            {netSavings < 0 ? `-${money(Math.abs(netSavings), f.symbol)}` : money(netSavings, f.symbol)}
          </Text>
        </View>
      </Card>
      <Section title="Today's Spending" />
      <Card accessibilityLabel={dailyRemaining < 0
        ? `Spent today ${accessibleMoney(spentToday, f.currency)}; target ${accessibleMoney(dailyTarget, f.currency)}; overspent by ${accessibleMoney(Math.abs(dailyRemaining), f.currency)}`
        : `Spent today ${accessibleMoney(spentToday, f.currency)}; target ${accessibleMoney(dailyTarget, f.currency)}; ${accessibleMoney(dailyRemaining, f.currency)} remaining`}>
        <View style={S.dailyHeading}>
          <View>
            <Text style={S.cardTitle}>Today&apos;s spending</Text>
            <Text style={S.caption}>Based on your {days}-day budget month</Text>
          </View>
          <View style={S.dailyIcon}>
            <CircleDollarSign size={20} color={C.purple} accessible={false} />
          </View>
        </View>
        <View style={S.dailyStats}>
          <View style={[S.dailyStat, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border, borderWidth: 1, shadowColor: theme.colors.text, shadowOpacity: theme.isDark ? 0 : 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: theme.isDark ? 0 : 2 }]}>
            <FunctionalIcon name="goals" tone="purple" containerSize={34} size={17} />
            <Text style={[S.dailyLabel, { color: theme.colors.secondaryText }]}>TODAY&apos;S TARGET</Text>
            <Text style={[S.dailyValue, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(dailyTarget, f.symbol)}</Text>
          </View>
          <View style={[S.dailyStat, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border, borderWidth: 1, shadowColor: theme.colors.text, shadowOpacity: theme.isDark ? 0 : 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: theme.isDark ? 0 : 2 }]}>
            <FunctionalIcon name="expenses" tone="red" containerSize={34} size={17} />
            <Text style={[S.dailyLabel, { color: theme.colors.secondaryText }]}>SPENT TODAY</Text>
            <Text style={[S.dailyValue, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(spentToday, f.symbol)}</Text>
          </View>
          <View style={[S.dailyStatWide, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border, borderWidth: 1, shadowColor: theme.colors.text, shadowOpacity: theme.isDark ? 0 : 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: theme.isDark ? 0 : 2 }]}>
            <FunctionalIcon name={dailyRemaining < 0 ? "expenses" : "history"} tone={dailyRemaining < 0 ? "red" : "orange"} containerSize={34} size={17} />
            <Text style={[S.dailyLabel, { color: theme.colors.secondaryText }]}>{dailyRemaining < 0 ? "OVERSPENT TODAY" : "REMAINING TODAY"}</Text>
            <Text style={[S.dailyValue, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(Math.abs(dailyRemaining), f.symbol)}</Text>
          </View>
        </View>
        <View
          accessible
          accessibilityLabel={dailyRemaining < 0
            ? `You overspent today by ${accessibleMoney(Math.abs(dailyRemaining), f.currency)}. New daily target from tomorrow: ${accessibleMoney(tomorrowTarget, f.currency)}`
            : dailyRemaining === 0
              ? "Today's target reached"
              : "You're on track"}
          style={[S.dailyNotice, { backgroundColor: dailyRemaining < 0 ? theme.colors.redTint : dailyRemaining === 0 ? theme.colors.purpleTint : theme.colors.greenTint, borderColor: dailyRemaining < 0 ? theme.colors.borderDanger : dailyRemaining === 0 ? theme.colors.borderPurple : theme.colors.border, borderWidth: 1 }]}
        >
          <Text style={[S.dailyNoticeTitle, { color: dailyRemaining < 0 ? theme.colors.danger : dailyRemaining === 0 ? theme.colors.accentText : theme.colors.positive }]}>
            {dailyRemaining < 0
              ? `You overspent today by ${money(Math.abs(dailyRemaining), f.symbol)}`
              : dailyRemaining === 0
                ? "Today's target reached"
                : "You're on track"}
          </Text>
          {dailyRemaining < 0 && (
            <Text style={[S.caption, { color: theme.colors.secondaryText }]}>New daily target from tomorrow: {money(tomorrowTarget, f.symbol)}</Text>
          )}
        </View>
      </Card>
      <Section title="Weekly Spending" />
      <Card accessibilityLabel={weeklyRemaining < 0
        ? `Spent this week ${accessibleMoney(weeklySpent, f.currency)}; target ${accessibleMoney(weeklyTarget, f.currency)}; overspent by ${accessibleMoney(Math.abs(weeklyRemaining), f.currency)}`
        : `Spent this week ${accessibleMoney(weeklySpent, f.currency)}; target ${accessibleMoney(weeklyTarget, f.currency)}; ${accessibleMoney(weeklyRemaining, f.currency)} remaining`}>
        <View style={S.dailyHeading}>
          <View><Text style={S.cardTitle}>This week&apos;s spending</Text><Text style={S.caption}>Monday to today · {weekDays} {weekDays === 1 ? "day" : "days"} in this budget month</Text></View>
          <View style={S.dailyIcon}><CalendarDays size={20} color={theme.colors.accentText} accessible={false} /></View>
        </View>
        <View style={S.dailyStats}>
          <View style={[S.dailyStat, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border, borderWidth: 1, shadowColor: theme.colors.text, shadowOpacity: theme.isDark ? 0 : 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: theme.isDark ? 0 : 2 }]}><FunctionalIcon name="goals" tone="purple" containerSize={34} size={17} /><Text style={[S.dailyLabel, { color: theme.colors.secondaryText }]}>WEEKLY TARGET</Text><Text style={[S.dailyValue, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(weeklyTarget, f.symbol)}</Text></View>
          <View style={[S.dailyStat, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border, borderWidth: 1, shadowColor: theme.colors.text, shadowOpacity: theme.isDark ? 0 : 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: theme.isDark ? 0 : 2 }]}><FunctionalIcon name="expenses" tone="red" containerSize={34} size={17} /><Text style={[S.dailyLabel, { color: theme.colors.secondaryText }]}>SPENT THIS WEEK</Text><Text style={[S.dailyValue, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(weeklySpent, f.symbol)}</Text></View>
          <View style={[S.dailyStatWide, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border, borderWidth: 1, shadowColor: theme.colors.text, shadowOpacity: theme.isDark ? 0 : 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: theme.isDark ? 0 : 2 }]}><FunctionalIcon name={weeklyRemaining < 0 ? "expenses" : "history"} tone={weeklyRemaining < 0 ? "red" : "orange"} containerSize={34} size={17} /><Text style={[S.dailyLabel, { color: theme.colors.secondaryText }]}>{weeklyRemaining < 0 ? "OVER WEEKLY TARGET" : "REMAINING THIS WEEK"}</Text><Text style={[S.dailyValue, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(Math.abs(weeklyRemaining), f.symbol)}</Text></View>
        </View>
        <View accessible accessibilityLabel={!monthlyBudget ? "Create a budget to set a weekly spending target" : weeklyRemaining < 0 ? `You are over this week's target by ${accessibleMoney(Math.abs(weeklyRemaining), f.currency)}` : weeklyRemaining === 0 ? "This week's target reached" : "You are within this week's target"} style={[S.dailyNotice, { backgroundColor: !monthlyBudget ? theme.colors.mutedTint : weeklyRemaining < 0 ? theme.colors.redTint : weeklyRemaining === 0 ? theme.colors.purpleTint : theme.colors.greenTint, borderColor: weeklyRemaining < 0 ? theme.colors.borderDanger : weeklyRemaining === 0 ? theme.colors.borderPurple : theme.colors.border, borderWidth: 1 }]}>
          <Text style={[S.dailyNoticeTitle, { color: !monthlyBudget ? theme.colors.secondaryText : weeklyRemaining < 0 ? theme.colors.danger : weeklyRemaining === 0 ? theme.colors.accentText : theme.colors.positive }]}>{!monthlyBudget ? "Create a budget to set a weekly target" : weeklyRemaining < 0 ? `Over this week&apos;s target by ${money(Math.abs(weeklyRemaining), f.symbol)}` : weeklyRemaining === 0 ? "This week&apos;s target reached" : "Within this week&apos;s target"}</Text>
        </View>
      </Card>
      <Section title="Quick Actions" />
      <View style={S.quickActions}>
        <QuickAction label="Add Expense" icon="expenses" tone="red" hint="Opens a new expense form" onPress={() => router.push({ pathname: "/add", params: { type: "Expense" } })} />
        <QuickAction label="Add Income" icon="income" tone="green" hint="Opens a new income form" onPress={() => router.push({ pathname: "/add", params: { type: "Income" } })} />
        <QuickAction label="Budgets" icon="budgets" tone="blue" hint="Opens your budgets" onPress={() => router.push("/budgets")} />
        <QuickAction label="Goals" icon="goals" tone="purple" hint="Opens your financial goals" onPress={() => router.push("/goals")} />
      </View>
      <Section
        title="Budget Overview"
        action="View all budgets"
        onPress={() => router.push("/budgets")}
      />
      {bud.length ? (
        bud.slice(0, 3).map((b) => <BudgetCard key={b.id} budget={b} compact />)
      ) : (
        <Empty
          text="No budgets yet"
          description="Create a budget to start tracking your spending."
          icon={WalletCards}
          actionLabel="Create a budget"
          onAction={() => router.push("/budgets")}
        />
      )}
      {alerts.length > 0 && (
        <Card style={S.alertCard}>
          <Text style={S.alertTitle}>Budget alerts</Text>
          {alerts.map((x) => (
            <Text key={x.b.id} style={S.alertText}>
              {x.b.category} is over by {money(x.spent - x.b.amount, f.symbol)}
            </Text>
          ))}
        </Card>
      )}
      <Section title="Goals" action="View all goals" onPress={() => router.push("/goals")} />
      {currentGoals.length ? (
        currentGoals.slice(0, 3).map((goal) => <HomeGoalPreview key={goal.id} goal={goal} />)
      ) : (
        <Empty
          text="No financial goals yet"
          description="Create a goal and start building toward it."
          icon={Landmark}
          actionLabel="Create a goal"
          onAction={() => router.push("/goals")}
        />
      )}
      <Section
        title="Recent Transactions"
        action="View all transactions"
        onPress={() => router.push("/transactions")}
      />
      {recentTransactions.map((transaction) => (
        <Transaction key={transaction.id} t={transaction} symbol={f.symbol} currency={f.currency} />
      ))}
      {!recentTransactions.length && (
        <Empty
          text="No transactions yet"
          description="Add your first income or expense."
          icon={ArrowUpRight}
          actionLabel="Add transaction"
          onAction={() => router.push("/add")}
        />
      )}
      <Section title="Monthly cycle" />
      <Card>
        <View style={S.row}>
          <View style={S.rowStart}>
            <FunctionalIcon name="history" tone="purple" containerSize={48} size={22} />
            <View style={S.cycleCopy}>
              <Text style={S.cardTitle}>{monthLabel(prevMonth(f.currentMonth))}</Text>
              <Text style={S.caption}>Previous month balance</Text>
              <Text style={S.caption}>Cycle status: {f.cycle?.status || "No rollover recorded"}</Text>
            </View>
          </View>
          <View style={S.cycleValue}>
            <Text style={S.metric} numberOfLines={1} adjustsFontSizeToFit>{money(previous, f.symbol)}</Text>
            {/* <ChevronRight size={20} color={theme.colors.tabInactive} accessible={false} /> */}
          </View>
        </View>
        {previousIncome > 0 && previous > 0 && !f.resourceErrors?.financial_cycles && f.cycle?.status !== "completed" && (
          <View style={S.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start fresh"
              accessibilityHint="Complete the previous month without carrying over its balance"
              onPress={() =>
                Alert.alert(
                  "Start fresh?",
                  "Mark the prior month complete without carrying its balance.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Start fresh",
                      onPress: () =>
                        f
                          .completeFinancialCycle({
                            action: "start_fresh",
                            previousBalance: previous,
                            cycleMonth: prevMonth(f.currentMonth),
                            nextMonth: f.currentMonth,
                          })
                          .catch((e) =>
                            Alert.alert("Rollover failed", e.message),
                          ),
                    },
                  ],
                )
              }
            >
              <Text style={S.link}>Start fresh</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Carry balance forward"
              accessibilityHint="Move the previous balance into this month"
              onPress={() =>
                Alert.alert(
                  "Carry balance forward?",
                  "Record the prior balance as income in this month.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Carry forward",
                      onPress: () =>
                        f
                          .completeFinancialCycle({
                            action: "carry_forward",
                            previousBalance: previous,
                            carriedForwardAmount: previous,
                            cycleMonth: prevMonth(f.currentMonth),
                            nextMonth: f.currentMonth,
                            carryForwardDescription: `Remaining balance carried forward from ${monthLabel(prevMonth(f.currentMonth))}`,
                          })
                          .catch((e) =>
                            Alert.alert("Rollover failed", e.message),
                          ),
                    },
                  ],
                )
              }
            >
              <Text style={S.link}>Carry forward</Text>
            </Pressable>
          </View>
        )}
      </Card>
    </Page>
  );
}
function Section({ title, action, onPress }) {
  return <SectionHeader title={title} actionLabel={action} onAction={onPress} style={S.sectionSpacing} />;
}
function QuickAction({ label, icon, tone, hint, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        S.quickAction,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
      ]}
    >
      <FunctionalIcon name={icon} tone={tone} containerSize={40} size={19} />
      <Text style={[S.quickActionText, { color: theme.colors.text }]}>{label}</Text>
      <ChevronRight size={18} color={theme.colors.secondaryText} accessible={false} />
    </Pressable>
  );
}
function HomeGoalPreview({ goal }) {
  const f = useFinance(),
    router = useRouter(),
    theme = useTheme(),
    goalIcon = goalVisual(goal),
    progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const accessibleGoal = `${goal.name}, ${accessibleMoney(goal.currentAmount, goal.currency)} saved of ${accessibleMoney(goal.targetAmount, goal.currency)}, ${Math.round(progress)} percent complete`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibleGoal}
      accessibilityHint="Opens this goal's details"
      onPress={() => router.push(`/goal/${goal.id}`)}
      style={({ pressed }) => [
        S.homeGoalPreview,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
      ]}
    >
      <View style={S.homeGoalHeading}>
        <GoalCategoryIcon category={goalIcon.category} containerSize={40} size={19} />
        <View style={S.homeGoalCopy}>
          <Text style={[S.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>{goal.name}</Text>
          <Text style={[S.caption, { color: theme.colors.secondaryText }]} numberOfLines={1}>
            {money(goal.currentAmount, f.symbol)} / {money(goal.targetAmount, f.symbol)}
          </Text>
        </View>
        <ChevronRight size={19} color={theme.colors.secondaryText} accessible={false} />
      </View>
      <Progress
        value={progress}
        label={`${goal.name} progress`}
        accessibilityValueText={`${Math.round(progress)} percent complete`}
        color={FUNCTIONAL_ICON_TONES[goalIcon.tone]?.[theme.themeName]?.foreground || theme.colors.primary}
      />
    </Pressable>
  );
}
function Progress({ value, label = "Progress", accessibilityValueText, color, compact = false }) {
  const progress = Math.max(0, Math.min(value, 100));
  return <ProgressBar value={progress} label={label} accessibilityValueText={accessibilityValueText || `${Math.round(progress)} percent`} color={color} style={compact ? S.homeBudgetProgress : S.progressSpacing} />;
}
function BudgetCard({ budget, detail = true, compact = false }) {
  const f = useFinance(),
    router = useRouter(),
    theme = useTheme(),
    spent = categorySpent(f.transactions, budget, budget.month, f.currency),
    remain = Number(budget.amount) - spent,
    pct = Number(budget.amount) ? (spent / Number(budget.amount)) * 100 : 0,
    days = daysInMonth(budget.month),
    daily = Number(budget.amount) / Math.max(days, 1),
    weekly = weeklyBudgetSummary({ budget, transactions: f.transactions, today: new Date().toISOString().slice(0, 10) }),
    usageState = budgetUsageState(pct),
    progressColor = remain < 0
      ? theme.colors.danger
      : pct >= 80
        ? theme.colors.warning
        : progressAccent(budget.category, theme);
  return (
    <Pressable
      onPress={detail ? () => router.push(`/budget/${budget.id}`) : undefined}
      accessibilityRole={detail ? "button" : undefined}
      accessibilityLabel={
        detail
          ? `${budget.category} budget, ${usageState}, ${Math.round(pct)} percent used, ${accessibleMoney(spent, f.currency)} spent of ${accessibleMoney(budget.amount, f.currency)}, ${remain < 0 ? `${accessibleMoney(Math.abs(remain), f.currency)} over budget` : `${accessibleMoney(remain, f.currency)} remaining`}${weekly ? `. This week: ${accessibleMoney(weekly.spent, f.currency)} spent of ${accessibleMoney(weekly.target, f.currency)} target; ${weekly.remaining < 0 ? `over weekly target by ${accessibleMoney(Math.abs(weekly.remaining), f.currency)}` : weekly.remaining === 0 ? "at weekly target" : `${accessibleMoney(weekly.remaining, f.currency)} remaining, within weekly target`}` : ""}`
          : undefined
      }
      accessibilityHint={
        detail ? "Opens budget details and spending history" : undefined
      }
      style={({ pressed }) => (pressed && detail ? { opacity: 0.9, transform: [{ scale: 0.985 }] } : null)}
    >
      <Card style={compact ? S.homeBudgetCard : undefined}>
        <View style={S.row}>
          <View style={S.rowStart}>
            <CategoryIcon name={budget.category} size={compact ? 18 : 20} />
            <View style={S.budgetCategoryCopy}>
              <Text style={[S.cardTitle, { color: theme.colors.text }]}>{budget.category}</Text>
              <Text style={[S.caption, { color: theme.colors.secondaryText }]}>
                {money(budget.amount, f.symbol)} monthly budget
              </Text>
            </View>
          </View>
          <View style={S.budgetUsageCopy}>
            <Text accessibilityLabel={`${Math.round(pct)} percent used`} style={[S.pct, { color: progressColor }]}>{Math.round(pct)}%</Text>
            <Text style={[S.budgetUsageState, { color: progressColor }]}>{usageState}</Text>
          </View>
        </View>
        <Progress value={pct} label={`${budget.category} budget used`} accessibilityValueText={`${Math.round(pct)} percent used. ${money(spent, f.symbol)} spent of ${money(budget.amount, f.symbol)} budget. ${usageState}.`} color={progressColor} compact={compact} />
        <View style={compact ? S.homeBudgetBottomRow : S.row}>
          <View>
            <Text style={[S.value, { color: theme.colors.text }]}>{money(spent, f.symbol)} spent</Text>
            <Text style={[S.caption, { color: theme.colors.secondaryText }]}>
              {money(daily, f.symbol)} / day
            </Text>
          </View>
          <Text style={[compact ? S.homeBudgetRemaining : S.dailyTarget, { color: remain < 0 ? theme.colors.danger : theme.colors.secondaryText }]}>
            {remain < 0
              ? `${money(Math.abs(remain), f.symbol)} over budget`
              : `${money(remain, f.symbol)} left`}
          </Text>
        </View>
        {weekly ? (
          <View style={[S.budgetWeeklySummary, { backgroundColor: theme.colors.mutedTint, borderColor: theme.colors.border }]}>
            <View style={S.row}>
              <Text style={[S.budgetWeeklyHeading, { color: theme.colors.text }]}>This week</Text>
              <Text style={[S.budgetWeeklyStatus, { color: weekly.remaining < 0 ? theme.colors.danger : weekly.remaining === 0 ? theme.colors.accentText : theme.colors.positive }]}>{weekly.status}</Text>
            </View>
            <View style={S.row}>
              <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Spent {money(weekly.spent, f.symbol)}</Text>
              <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Target {money(weekly.target, f.symbol)}</Text>
            </View>
            <Text style={[S.caption, { color: weekly.remaining < 0 ? theme.colors.danger : theme.colors.positive }]}>
              {weekly.remaining < 0 ? `Over weekly target by ${money(Math.abs(weekly.remaining), f.symbol)}` : weekly.remaining === 0 ? "At weekly target" : `${money(weekly.remaining, f.symbol)} remaining this week`}
            </Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
export function BudgetsScreen() {
  return (
    <Guard errorTitle="Unable to load budgets" errorDescription="Your budgets are unavailable right now. Please try again.">
      <Budgets />
    </Guard>
  );
}
function Budgets() {
  const params = useLocalSearchParams();
  const requestedMonth = Array.isArray(params.month) ? params.month[0] : params.month;
  const f = useFinance(),
    router = useRouter(),
    bs = f.budgets.filter(
      (b) => b.currency === f.currency && b.month === f.currentMonth,
    ),
    [show, setShow] = useState(false),
    [category, setCategory] = useState("Food"),
    [amount, setAmount] = useState(""),
    [view, setView] = useState("ongoing"),
    [selectedMonthState, setSelectedMonth] = useState(null);
  const selectedMonth = requestedMonth || selectedMonthState;
  const theme = useTheme();
  const activeView = requestedMonth ? "history" : view;
  const totalBudget = bs.reduce((total, b) => total + Number(b.amount || 0), 0),
    totalSpent = bs.reduce(
      (total, b) =>
        total + categorySpent(f.transactions, b, f.currentMonth, f.currency),
      0,
    ),
    totalRemaining = totalBudget - totalSpent,
    totalPercent = totalBudget ? (totalSpent / totalBudget) * 100 : 0;
  const totalUsageState = budgetUsageState(totalPercent);
  const totalUsageColor = totalRemaining < 0
    ? theme.colors.danger
    : totalPercent >= 80
      ? theme.colors.warning
      : theme.colors.primary;
  const months = [...new Set(f.budgets.filter((b) => b.currency === f.currency && b.month < f.currentMonth).map((b) => b.month).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const historicalBudgets = f.budgets.filter((b) => b.currency === f.currency && b.month === selectedMonth);
  const historicalTotal = historicalBudgets.reduce((total, b) => total + Number(b.amount || 0), 0);
  const historicalSpent = historicalBudgets.reduce((total, b) => total + categorySpent(f.transactions, b, selectedMonth, f.currency), 0);
  async function save() {
    try {
      await f.saveBudget({ category, amount });
      setShow(false);
      setAmount("");
    } catch (e) {
      Alert.alert("Could not save budget", e.message);
    }
  }
  return (
    <Page title={selectedMonth ? monthLabel(selectedMonth) : "Budgets"} keyboardAvoiding>
      {selectedMonth ? <Button title="Back to budget history" secondary onPress={() => { setSelectedMonth(null); if (requestedMonth) router.setParams({ month: undefined }); }} /> : null}
      <View style={S.pageIntro}>
        <Text style={[S.sub, { color: theme.colors.secondaryText }]}>{monthLabel(selectedMonth || f.currentMonth)}</Text>
        <Text style={[S.caption, { color: theme.colors.secondaryText }]}>{selectedMonth ? "Historical budget overview" : "Current month budget overview"}</Text>
      </View>
      {!selectedMonth ? <Card style={S.budgetSummaryCard}>
        <Text style={[S.budgetSummaryLabel, { color: theme.colors.secondaryText }]}>Total budget · {monthLabel(f.currentMonth)}</Text>
        <Text style={[S.budgetSummaryAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(totalBudget, f.symbol)}</Text>
        <View style={S.budgetSummaryMetrics}>
          <Metric label="Amount spent" value={money(totalSpent, f.symbol)} />
          <Metric
            label={totalRemaining < 0 ? "Over budget" : "Amount remaining"}
            value={totalRemaining < 0 ? money(Math.abs(totalRemaining), f.symbol) : money(totalRemaining, f.symbol)}
            color={totalRemaining < 0 ? theme.colors.danger : theme.colors.text}
          />
        </View>
        <View style={S.row}>
          <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Overall spending · {totalUsageState}</Text>
          <Text style={[S.pct, { color: totalUsageColor }]}>{Math.round(totalPercent)}%</Text>
        </View>
        <Progress value={totalPercent} label={`${monthLabel(f.currentMonth)} overall budget usage`} accessibilityValueText={`${Math.round(totalPercent)} percent used. ${money(totalSpent, f.symbol)} spent of ${money(totalBudget, f.symbol)} total budget. ${totalUsageState}${totalRemaining < 0 ? ` by ${money(Math.abs(totalRemaining), f.symbol)}` : ""}.`} color={totalUsageColor} />
        <Button title={show ? "Close budget form" : "Create Budget"} accessibilityLabel="Create Budget" accessibilityHint="Opens the form to add a monthly category budget" onPress={() => setShow(!show)} />
      </Card> : null}
      <View style={[S.segmentedToggle, { backgroundColor: theme.colors.mutedTint, borderColor: theme.colors.border }]} accessibilityRole="radiogroup" accessibilityLabel="Budget period view">
        {["ongoing", "history"].map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityLabel={item === "ongoing" ? "Ongoing budgets" : "Budget history"} accessibilityState={{ selected: view === item }} style={[S.segmentedOption, { backgroundColor: view === item ? theme.colors.primary : "transparent" }]} onPress={() => { setView(item); setSelectedMonth(null); }}><Text style={[S.segmentedOptionText, { color: view === item ? theme.colors.onPrimary : theme.colors.secondaryText }]}>{item.toUpperCase()}</Text></Pressable>)}
      </View>
      {activeView === "ongoing" ? <Section title="Ongoing budgets" /> : <Section title="Budget History" />}
      {activeView === "history" && !requestedMonth && months.length > 0 ? <SelectField label="History month" value={selectedMonth ? monthLabel(selectedMonth) : "Choose a month"} options={months.map((month) => ({ value: month, label: monthLabel(month) }))} onChange={setSelectedMonth} accessibilityLabel="Budget history month" leadingIcon="calendar" tone="purple" /> : null}
      {show && (
        <Card>
          <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text }]}>New monthly budget</Text>
          <Field
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="Food"
          />
          <CurrencyField
            label="Budget amount"
            value={amount}
            onChangeText={setAmount}
            symbol={f.symbol}
          />
          <Button title="Save budget" accessibilityLabel="Save budget" onPress={save} />
          <Button title="Cancel" secondary onPress={() => setShow(false)} />
        </Card>
      )}
      {activeView === "ongoing" && !selectedMonth && bs.map((b) => <BudgetCard key={b.id} budget={b} />)}
      {activeView === "ongoing" && !selectedMonth && !bs.length && (
          <Empty
            text="No budgets yet"
          description="Create your first budget to start tracking your spending."
          icon={WalletCards}
          actionLabel="Create Budget"
          onAction={() => setShow(true)}
        />
      )}
      {activeView === "history" && !selectedMonth && (months.length ? months.map((month) => {
        const monthBudgets = f.budgets.filter((b) => b.currency === f.currency && b.month === month);
        const budgetSum = monthBudgets.reduce((sumValue, b) => sumValue + Number(b.amount || 0), 0);
        const spentSum = monthBudgets.reduce((sumValue, b) => sumValue + categorySpent(f.transactions, b, month, f.currency), 0);
        return <Pressable key={month} accessibilityRole="button" accessibilityLabel={`${monthLabel(month)}, ${month === f.currentMonth ? "current" : "completed"}, total budget ${accessibleMoney(budgetSum, f.currency)}, expenses ${accessibleMoney(spentSum, f.currency)}`} onPress={() => setSelectedMonth(month)} style={[S.historyMonthCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}><View style={S.row}><Text style={[S.cardTitle, { color: theme.colors.text }]}>{monthLabel(month)}</Text><Text style={[S.label, { color: theme.colors.secondaryText }]}>{month === f.currentMonth ? "Current" : "Completed"}</Text></View><View style={S.row}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Budget {money(budgetSum, f.symbol)}</Text><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Spent {money(spentSum, f.symbol)}</Text></View><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Remaining {money(budgetSum - spentSum, f.symbol)}</Text></Pressable>;
      }) : <Empty text="No budget history" description="Completed monthly budgets will appear here when available." />)}
      {activeView === "history" && selectedMonth && <><Card><Text style={[S.cardTitle, { color: theme.colors.text }]}>{monthLabel(selectedMonth)} · {selectedMonth === f.currentMonth ? "Current" : "Completed"}</Text><View style={S.row}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Total budget</Text><Text style={[S.value, { color: theme.colors.text }]}>{money(historicalTotal, f.symbol)}</Text></View><View style={S.row}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Total expenses</Text><Text style={[S.value, { color: theme.colors.text }]}>{money(historicalSpent, f.symbol)}</Text></View><View style={S.row}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Remaining</Text><Text style={[S.value, { color: historicalTotal < historicalSpent ? theme.colors.danger : theme.colors.text }]}>{money(historicalTotal - historicalSpent, f.symbol)}</Text></View></Card>{historicalBudgets.length ? historicalBudgets.map((b) => <BudgetCard key={b.id} budget={b} />) : <Empty text="No budgets for this month" />}</>}
    </Page>
  );
}
export function BudgetDetailScreen() {
  return (
    <Guard>
      <BudgetDetail />
    </Guard>
  );
}
function BudgetDetail() {
  const { id } = useLocalSearchParams(),
    f = useFinance(),
    router = useRouter(),
    theme = useTheme(),
    budget = f.budgets.find((b) => String(b.id) === String(id)),
    [editing, setEditing] = useState(false),
    [editAmount, setEditAmount] = useState("");
  if (!budget)
    return (
      <Page title="Budget details" back={backTo(router, "/(tabs)/budgets")} backLabel="Back to Budgets" backHint="Returns to the budget overview">
        <Empty text="This budget could not be found." />
      </Page>
    );
  const expenses = f.transactions.filter(
      (t) =>
        t.type === "Expense" &&
        t.category === budget.category &&
        t.currency === budget.currency &&
        (t.month || t.date?.slice(0, 7)) === budget.month,
    ),
    spent = sum(expenses, "Expense"),
    days = daysInMonth(budget.month),
    today = new Date().toISOString().slice(0, 10),
    todaySpent = expenses
      .filter((t) => t.date === today)
      .reduce((a, t) => a + Number(t.amount), 0),
    weekly = weeklyBudgetSummary({ budget, transactions: expenses, today }),
    original = Number(budget.amount) / Math.max(days, 1),
    remaining = Number(budget.amount) - spent,
    remainingDays = Math.max(days - new Date().getDate(), 0),
    budgetPercent = Number(budget.amount)
      ? (spent / Number(budget.amount)) * 100
      : 0,
    canEdit = budget.month === f.currentMonth && budget.currency === f.currency;
  const progressColor = progressAccent(budget.category, theme, remaining < 0);
  const usageState = budgetUsageState(budgetPercent);
  const usageColor = remaining < 0
    ? theme.colors.danger
    : budgetPercent >= 80
      ? theme.colors.warning
      : progressColor;
  async function saveEdit() {
    try {
      await f.saveBudget({
        category: budget.category,
        amount: editAmount,
        currency: budget.currency,
        month: budget.month,
      });
      setEditing(false);
    } catch (e) {
      Alert.alert("Could not update budget", e.message);
    }
  }
  return (
    <Page
      title={budget.category}
      back={backTo(router, "/(tabs)/budgets")}
      scroll={false}
      keyboardAvoiding={editing}
    >
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={S.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={S.pageIntro}>
              <Text style={[S.sub, { color: theme.colors.secondaryText }]}>
                {monthLabel(budget.month)} · {budget.month === f.currentMonth ? "Current" : "History"}
              </Text>
            </View>
            {editing && (
              <Card style={S.editBudgetCard}>
                  <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text }]}>Edit Budget</Text>
                <View style={S.editCategory}>
                  <Text style={S.label}>CATEGORY</Text>
                  <Text style={S.cardTitle}>{budget.category}</Text>
                </View>
                <CurrencyField
                  label="Budget amount"
                  value={editAmount}
                  onChangeText={setEditAmount}
                  symbol={currencySymbols[budget.currency] || f.symbol}
                />
                <Button title="Save changes" accessibilityLabel="Save budget changes" onPress={saveEdit} />
                <Button title="Cancel" secondary onPress={() => setEditing(false)} />
              </Card>
            )}
            <Card style={S.budgetDetailCard}>
              <View style={S.rowStart}>
                <CategoryIcon name={budget.category} />
                <View style={S.budgetDetailHeading}>
                  <Text style={[S.cardTitle, { color: theme.colors.text }]}>{budget.category}</Text>
                  <Text style={[S.caption, { color: theme.colors.secondaryText }]}>{monthLabel(budget.month)} budget</Text>
                </View>
              </View>
              <Text style={[S.budgetDetailAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(budget.amount, f.symbol)}</Text>
              <View style={S.budgetDetailStats}>
                <Metric label="Spent" value={money(spent, f.symbol)} />
                <Metric
                  label={remaining < 0 ? "Over budget" : "Remaining"}
                  value={remaining < 0 ? money(Math.abs(remaining), f.symbol) : money(remaining, f.symbol)}
                  color={remaining < 0 ? C.red : undefined}
                />
              </View>
              <View style={S.row}>
                <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Percentage used · {usageState}</Text>
                <View style={S.budgetUsageCopy}>
                  <Text style={[S.pct, { color: usageColor }]}>{Math.round(budgetPercent)}%</Text>
                  <Text style={[S.budgetUsageState, { color: usageColor }]}>{usageState}</Text>
                </View>
              </View>
              <Progress
                value={budgetPercent}
                label={`${budget.category} budget used`}
                accessibilityValueText={`${Math.round(budgetPercent)} percent used. ${money(spent, f.symbol)} spent of ${money(budget.amount, f.symbol)} budget. ${usageState}${remaining < 0 ? ` by ${money(Math.abs(remaining), f.symbol)}` : ""}.`}
                color={usageColor}
              />
            </Card>
            {canEdit && <Button title="Edit Budget" secondary accessibilityLabel="Edit budget" onPress={() => { setEditAmount(String(budget.amount)); setEditing(true); }} />}
            <Button title="Delete Budget" variant="danger" accessibilityLabel={`Delete ${budget.category} budget`} accessibilityHint="Asks for confirmation before deleting this budget. Transactions are not deleted." onPress={() => Alert.alert(
                "Delete budget?",
                `Delete the ${budget.category} budget for ${monthLabel(budget.month)}? This will not delete any expenses or transactions.`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: async () => {
                    try {
                      await f.deleteBudget(budget.id);
                      router.replace("/(tabs)/budgets");
                    } catch (error) {
                      Alert.alert("Could not delete budget", error.message);
                    }
                  } },
                ],
                { cancelable: true },
              )} />
            <Section title="Daily spending" />
            <Card>
              <Metric
                label="Today's target"
                value={`${money(original, f.symbol)} / day`}
              />
              <Metric
                label="Spent today"
                value={money(todaySpent, f.symbol)}
              />
              <Metric
                label={
                  todaySpent > original
                    ? "Overspent today by"
                    : "Remaining today"
                }
                value={money(
                  Math.abs(
                    todaySpent > original
                      ? todaySpent - original
                      : original - todaySpent,
                  ),
                  f.symbol,
                )}
                color={todaySpent > original ? C.red : C.green}
              />
              <Metric
                label={remaining < 0 ? "Monthly budget over by" : "Monthly budget remaining"}
                value={money(Math.abs(remaining), f.symbol)}
                color={remaining < 0 ? theme.colors.danger : theme.colors.text}
              />
              <Metric
                label={todaySpent > original ? "New daily target from tomorrow" : "Daily target for remaining days"}
                value={money(
                  remainingDays
                    ? Math.max(remaining, 0) / remainingDays
                    : Math.max(remaining, 0),
                  f.symbol,
                )}
              />
              <Text
                style={{
                  color:
                    spent <= original * new Date().getDate() ? C.green : C.red,
                  fontWeight: "800",
                  marginTop: 8,
                }}
              >
                {spent <= original * new Date().getDate()
                  ? "On track"
                  : "Above expected pace"}
              </Text>
            </Card>
            {weekly ? <>
              <Section title="Weekly spending" />
              <Card style={S.budgetWeeklyDetail}>
                <Metric label="Weekly target" value={`${money(weekly.target, f.symbol)} / week`} />
                <Metric label="Spent this week" value={money(weekly.spent, f.symbol)} />
                <Metric label={weekly.remaining < 0 ? "Over weekly target by" : weekly.remaining === 0 ? "Status" : "Remaining this week"} value={weekly.remaining < 0 ? money(Math.abs(weekly.remaining), f.symbol) : weekly.remaining === 0 ? "At weekly target" : money(weekly.remaining, f.symbol)} color={weekly.remaining < 0 ? theme.colors.danger : weekly.remaining === 0 ? theme.colors.accentText : theme.colors.positive} />
                {weekly.remaining > 0 ? <Text style={[S.budgetWeeklyStatus, { color: theme.colors.positive }]}>Within weekly target</Text> : null}
              </Card>
            </> : null}
            <Section title="Spending history" />
          </>
        }
        renderItem={({ item }) => <Transaction t={item} symbol={f.symbol} currency={budget.currency} />}
        ListEmptyComponent={
          <Empty
            text="No spending yet"
            description="Expenses assigned to this budget will appear here."
            icon={ReceiptText}
          />
        }
      />
    </Page>
  );
}
function Metric({ label, value, color, accessibilityLabel }) {
  const theme = useTheme();
  return (
    <View
      style={S.metricRow}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `${label}: ${value}`}
    >
      <Text style={[S.caption, { color: theme.colors.secondaryText }]} accessible={false}>
        {label}
      </Text>
      <Text style={[S.value, { color: color || theme.colors.text }]} accessible={false}>
        {value}
      </Text>
    </View>
  );
}
export function AddScreen() {
  return (
    <Guard>
      <Add />
    </Guard>
  );
}
function Add() {
  const f = useFinance(),
    router = useRouter(),
    { type: requestedType } = useLocalSearchParams(),
    theme = useTheme(),
    [type, setType] = useState(requestedType === "Income" ? "Income" : "Expense"),
    [amount, setAmount] = useState(""),
    [amountSelection, setAmountSelection] = useState({ start: 0, end: 0 }),
    [category, setCategory] = useState(requestedType === "Income" ? "Salary" : ""),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [desc, setDesc] = useState(""),
    [notice, setNotice] = useState(""),
    [errors, setErrors] = useState({}),
    [submitting, setSubmitting] = useState(false),
    [showDatePicker, setShowDatePicker] = useState(false),
    [amountFocused, setAmountFocused] = useState(false),
    [categoryPickerOpen, setCategoryPickerOpen] = useState(false),
    [categorySearch, setCategorySearch] = useState("");
  const submittingRef = useRef(false);
  const amountSelectionRef = useRef({ start: 0, end: 0 });
  const amountDisplay = money(amount, "", { editing: true });
  useFocusEffect(useCallback(() => {
    if (requestedType === "Income" || requestedType === "Expense") {
      setType(requestedType);
      setCategory(requestedType === "Income" ? "Salary" : "");
    }
  }, [requestedType]));
  const categories = useMemo(
    () => type === "Expense"
      ? getAvailableExpenseCategoriesFromBudgets(f.budgets, f.currentMonth, f.currency)
      : INCOME_CATEGORIES,
    [type, f.budgets, f.currentMonth, f.currency],
  );
  const resolvedCategory = categories.length
    ? (categories.includes(category) ? category : categories[0])
    : category;
  const filteredCategories = categories.filter((item) => item.toLocaleLowerCase().includes(categorySearch.trim().toLocaleLowerCase()));
  const matchingBudget = type === "Expense"
    ? f.budgets.find((budget) => budget.category === resolvedCategory && budget.currency === f.currency && budget.month === date.slice(0, 7))
    : null;
  async function save() {
    if (submittingRef.current) return;
    const nextErrors = {};
    const amountError = errors.amount || validateEditableAmount(amount);
    if (amountError) nextErrors.amount = amountError;
    if (!resolvedCategory.trim()) nextErrors.category = "Select a category.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || dateToKey(dateFromKey(date)) !== date)
      nextErrors.date = "Select a valid date.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      announceAccessibility(Object.values(nextErrors).join(" "));
      return;
    }
    submittingRef.current = true;
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await f.addTransaction({
        type,
        amount: Number(amount),
        category: resolvedCategory,
        date,
        description: desc,
      });
      setAmount("");
      setAmountSelection({ start: 0, end: 0 });
      amountSelectionRef.current = { start: 0, end: 0 };
      setDesc("");
      setErrors({});
      const successMessage = `${type} added successfully.`;
      setNotice(successMessage);
      announceAccessibility(successMessage);
    } catch (e) {
      Alert.alert("Could not save transaction", e.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  return (
      <Page title="Add Transaction" keyboardAvoiding>
        <View style={S.formIntro}>
          <Text style={S.sub}>Record income or spending</Text>
        </View>
        <View style={[S.typeSwitcher, { backgroundColor: theme.colors.controlBackground, borderColor: theme.colors.border }]} accessibilityRole="radiogroup" accessibilityLabel="Transaction type">
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={`Expense${type === "Expense" ? ", selected" : ""}`}
            accessibilityState={{ selected: type === "Expense" }}
            style={[S.typeOption, type === "Expense" && { backgroundColor: theme.colors.purpleTint, borderColor: theme.colors.borderPurple }]}
            onPress={() => { Keyboard.dismiss(); setType("Expense"); setCategory(""); setErrors((current) => ({ ...current, category: undefined })); }}
          >
            <View accessible={false}>
              <ArrowUpRight
                size={18}
                color={type === "Expense" ? theme.colors.accentText : theme.colors.secondaryText}
              />
            </View>
            <Text
              style={[S.typeOptionText, { color: type === "Expense" ? theme.colors.accentText : theme.colors.secondaryText }]}
            >
              Expense
            </Text>
            {type === "Expense" ? <Check size={15} color={theme.colors.accentText} accessible={false} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={`Income${type === "Income" ? ", selected" : ""}`}
            accessibilityState={{ selected: type === "Income" }}
            style={[S.typeOption, type === "Income" && { backgroundColor: theme.colors.purpleTint, borderColor: theme.colors.borderPurple }]}
            onPress={() => {
              Keyboard.dismiss();
              setType("Income");
              setCategory("Salary");
              setErrors((current) => ({ ...current, category: undefined }));
            }}
          >
            <View accessible={false}>
              <ArrowDownLeft
                size={18}
                color={type === "Income" ? theme.colors.accentText : theme.colors.secondaryText}
              />
            </View>
            <Text
              style={[S.typeOptionText, { color: type === "Income" ? theme.colors.accentText : theme.colors.secondaryText }]}
            >
              Income
            </Text>
            {type === "Income" ? <Check size={15} color={theme.colors.accentText} accessible={false} /> : null}
          </Pressable>
        </View>
        <Card style={S.transactionAmountCard}>
          <CurrencyField
            label="Amount"
            value={amountDisplay}
            selection={amountSelection}
            onSelectionChange={(event) => {
              const selection = event.nativeEvent.selection;
              amountSelectionRef.current = selection;
              setAmountSelection(selection);
            }}
            onChangeText={(value) => {
              const previousDisplay = money(amount, "", { editing: true });
              const edit = editedTextRange(previousDisplay, value);
              const insertedIsNumeric = [...edit.inserted].every((character) => /\d/.test(character) || character === AMOUNT_DECIMAL_SEPARATOR);
              const incrementalEdit = edit.inserted.length <= 2 && insertedIsNumeric;
              const parsed = parseEditableAmount(value, f.symbol, incrementalEdit);
              if (parsed.error) {
                setErrors((current) => ({ ...current, amount: parsed.error }));
                return;
              }
              const nextAmount = parsed.value;
              setAmount(nextAmount);
              if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }));
              const priorSelection = amountSelectionRef.current;
              let cursorPosition = edit.prefix + edit.inserted.length;
              if (!edit.inserted.length && edit.removed.length) {
                if (priorSelection.start !== priorSelection.end) cursorPosition = priorSelection.start;
                else if (edit.prefix >= priorSelection.start && previousDisplay.length > value.length) cursorPosition = Math.max(priorSelection.start - 1, 0);
                else cursorPosition = edit.prefix;
              }
              const nextSelection = amountCursorForEdit(value, f.symbol, cursorPosition, nextAmount);
              const selection = { start: nextSelection, end: nextSelection };
              amountSelectionRef.current = selection;
              setAmountSelection(selection);
            }}
            symbol={f.symbol}
            currency={f.currency}
            accessibilityLabel={`Transaction amount, ${currencyNames[f.currency] || f.currency}`}
            accessibilityValue={{ text: amount ? accessibleMoney(Number(amount), f.currency) : "No amount entered" }}
            inputStyle={S.transactionAmountInput}
            error={errors.amount}
            accessibilityHint="Enter the transaction amount"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
          />
          {amountFocused && (
            <Button title="Done" secondary accessibilityLabel="Dismiss numeric keyboard" onPress={Keyboard.dismiss} />
          )}
        </Card>
        <Card style={S.transactionFieldsCard}>
          <View style={S.field}>
            <Label>Category</Label>
            {type === "Expense" && categories.length === 0 ? (
              <View style={[S.budgetNoMatch, { backgroundColor: theme.colors.mutedTint }]}>
                <Text style={[S.cardTitle, { color: theme.colors.text }]}>No budget categories available</Text>
                <Text accessibilityLabel="No budget categories available. Create a budget first to choose a category for your expense." style={[S.caption, { color: theme.colors.secondaryText }]}>Create a budget first to choose a category for your expense. You can also enter a category to record an expense without a budget.</Text>
                <Field label="Expense category" value={category} onChangeText={(value) => { setCategory(value); if (errors.category) setErrors((current) => ({ ...current, category: undefined })); }} placeholder="Enter category" accessibilityLabel="Expense category" />
                <Button title="Create budget" secondary accessibilityHint="Opens Budgets to create a current month budget" onPress={() => router.push("/(tabs)/budgets")} />
              </View>
            ) : (
              <Pressable accessibilityRole="button" accessibilityLabel={`${type === "Expense" ? "Expense category" : "Income category"}, ${resolvedCategory}`} accessibilityHint="Opens the category selector" accessibilityState={{ expanded: categoryPickerOpen }} onPress={() => { setCategorySearch(""); setCategoryPickerOpen(true); }} style={[S.dateSelector, { backgroundColor: theme.colors.inputBackground, borderColor: errors.category ? theme.colors.danger : theme.colors.border }]}>
                {resolvedCategory ? <CategoryIcon name={resolvedCategory} size={18} /> : null}
                <Text style={[S.dateSelectorText, { color: theme.colors.text, flex: 1 }]} numberOfLines={1}>{resolvedCategory || "Select a category"}</Text>
                <ChevronRight size={18} color={theme.colors.accentText} accessible={false} />
              </Pressable>
            )}
          </View>
          {errors.category ? <Text accessibilityRole="alert" style={S.inlineError}>{errors.category}</Text> : null}
          {type === "Expense" && (
            <View style={S.field}>
              <Label>Budget</Label>
              {matchingBudget ? (
                <View accessible accessibilityLabel={`${resolvedCategory} budget, ${money(matchingBudget.amount, f.symbol)}, expenses for ${monthLabel(date.slice(0, 7))} are counted in this budget`} style={S.budgetMatch}>
                  <CategoryIcon name={matchingBudget.category} size={18} />
                  <View style={S.budgetMatchCopy}>
                    <Text style={[S.cardTitle, { color: theme.colors.text }]}>{matchingBudget.category}</Text>
                    <Text style={[S.caption, { color: theme.colors.secondaryText }]}>{money(matchingBudget.amount, f.symbol)} monthly budget · {monthLabel(matchingBudget.month)}</Text>
                  </View>
                  <Text style={[S.budgetMatchState, { color: theme.colors.accentText }]}>Matched automatically</Text>
                </View>
              ) : (
                <View style={S.budgetNoMatch}>
                  <Text style={[S.cardTitle, { color: theme.colors.text }]}>No budget available</Text>
                  <Text style={[S.caption, { color: theme.colors.secondaryText }]}>This expense can still be added. Budgets match automatically by category, currency, and month.</Text>
                  <Button title="View budgets" secondary onPress={() => router.push("/(tabs)/budgets")} />
                </View>
              )}
            </View>
          )}
          <Field
            label="Description"
            value={desc}
            onChangeText={setDesc}
            placeholder="e.g. Lunch, transport to work, salary, electricity bill"
            accessibilityHint="Optional transaction description"
            multiline
            numberOfLines={3}
            inputStyle={S.transactionDescriptionInput}
          />
          <View style={S.field}>
            {Platform.OS === "web" ? (
              <Field
                label="Date"
                accessibilityLabel={`Transaction date, ${formatDateLabel(date)}`}
                value={date}
                onChangeText={(value) => { setDate(value); if (errors.date) setErrors((current) => ({ ...current, date: undefined })); }}
                error={errors.date}
                type="date"
              />
            ) : (
              <>
                <Label>Date</Label>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Transaction date, ${formatDateLabel(date)}`}
                  accessibilityHint="Opens the date picker"
                  onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                  style={[S.dateSelector, { backgroundColor: theme.colors.inputBackground, borderColor: errors.date ? theme.colors.danger : theme.colors.border }]}
                >
                  <Text style={[S.dateSelectorText, { color: theme.colors.text }]}>{formatDateLabel(date)}</Text>
                  <AppIcon name="calendar" color={theme.colors.accentText} />
                </Pressable>
                {errors.date ? <Text accessibilityRole="alert" style={[S.inlineError, { color: theme.colors.danger }]}>{errors.date}</Text> : null}
                {showDatePicker && (
                  <View style={S.datePicker}>
                    <DateTimePicker
                      value={dateFromKey(date)}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onValueChange={(_event, selectedDate) => {
                        if (!selectedDate) return;
                        setDate(dateToKey(selectedDate));
                        if (errors.date) setErrors((current) => ({ ...current, date: undefined }));
                        if (Platform.OS !== "ios") setShowDatePicker(false);
                      }}
                      onDismiss={() => setShowDatePicker(false)}
                    />
                    {Platform.OS === "ios" && (
                      <Button title="Done" secondary onPress={() => setShowDatePicker(false)} />
                    )}
                  </View>
                )}
              </>
            )}
          </View>
          {amount && Number.isFinite(Number(amount)) && Number(amount) > 0 ? (
            <Card style={S.transactionReviewCard} accessibilityLabel={`${type}, ${money(amount, f.symbol)}, ${resolvedCategory}, ${formatDateLabel(date)}${matchingBudget ? `, ${matchingBudget.category} budget` : type === "Expense" ? ", no budget available" : ""}`}>
              <View style={S.row}>
                <Text style={[S.caption, { color: theme.colors.secondaryText, marginTop: 0 }]}>Review transaction</Text>
                <Text style={[S.transactionReviewType, { color: theme.colors.accentText }]}>{type}</Text>
              </View>
              <Text style={[S.transactionReviewAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(amount, f.symbol)}</Text>
              <Text style={[S.caption, { color: theme.colors.secondaryText }]}>{resolvedCategory} · {formatDateLabel(date)}{matchingBudget ? ` · ${matchingBudget.category} budget` : type === "Expense" ? " · No budget available" : ""}</Text>
            </Card>
          ) : null}
          <Button
            title={`Add ${type}`}
            accessibilityLabel={`Add ${type.toLowerCase()}`}
            accessibilityHint="Saves this transaction to your BudgetFlow account"
            onPress={save}
            disabled={submitting}
            loading={submitting}
          />
        </Card>
        <Modal visible={categoryPickerOpen} transparent animationType="slide" onRequestClose={() => setCategoryPickerOpen(false)} accessibilityViewIsModal>
          <Pressable style={[S.selectBackdrop, { backgroundColor: theme.colors.overlay }]} onPress={() => setCategoryPickerOpen(false)}>
            <View style={[S.selectSheet, { backgroundColor: theme.colors.card }]} accessibilityRole="radiogroup" accessibilityLabel={`${type} category`}>
              <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text, paddingVertical: SPACE.sm }]}>Select Category</Text>
              <TextInput value={categorySearch} onChangeText={setCategorySearch} placeholder="Search categories" placeholderTextColor={theme.colors.placeholder} accessibilityLabel="Search categories" style={[S.categorySearch, { color: theme.colors.text, backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]} returnKeyType="search" />
              <FlatList data={filteredCategories} keyExtractor={(item) => item} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }} renderItem={({ item }) => {
                const selected = item === resolvedCategory;
                return <Pressable accessibilityRole="radio" accessibilityLabel={`${item}, ${selected ? "selected" : "not selected"}`} accessibilityHint={selected ? undefined : "Double tap to select"} accessibilityState={{ selected }} onPress={() => { setCategory(item); setCategoryPickerOpen(false); Keyboard.dismiss(); if (errors.category) setErrors((current) => ({ ...current, category: undefined })); }} style={[S.selectOption, selected && { backgroundColor: theme.colors.purpleTint }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md, flex: 1 }}><CategoryIcon name={item} size={18} /><Text style={[S.cardTitle, { color: theme.colors.text }]}>{item}</Text></View>
                  {selected ? <Check size={19} color={theme.colors.accentText} accessible={false} /> : null}
                </Pressable>;
              }} ListEmptyComponent={<Text style={[S.caption, { color: theme.colors.secondaryText, padding: SPACE.md }]}>No categories found.</Text>} />
            </View>
          </Pressable>
        </Modal>
        {notice ? (
          <Text
            style={S.successMessage}
            accessibilityRole="alert"
            accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}
          >
            {notice}
          </Text>
        ) : null}
      </Page>
  );
}
export function TransactionsScreen() {
  return (
    <Guard>
      <Transactions />
    </Guard>
  );
}
function Transactions() {
  const f = useFinance(),
    router = useRouter(),
    [filter, setFilter] = useState("All"),
    rows = f.transactions
      .filter(
        (t) =>
          t.currency === f.currency && (filter === "All" || t.type === filter),
      )
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return (
    <Page title="Transactions" scroll={false} back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen">
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={S.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={S.pageIntro}>
              <Text style={S.sub}>Your recent income and spending</Text>
            </View>
            <View style={S.filterRow} accessibilityRole="radiogroup" accessibilityLabel="Filter transactions">
              {["All", "Expense", "Income"].map((x) => (
                <Pressable
                  key={x}
                  accessibilityRole="radio"
                  accessibilityLabel={`${x} transaction filter`}
                  accessibilityState={{ selected: filter === x }}
                  onPress={() => setFilter(x)}
                  style={[S.chip, filter === x && S.chipOn]}
                >
                  <Text
                    style={[S.filterText, filter === x && { color: C.purple }]}
                  >
                    {x}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => <Transaction t={item} symbol={f.symbol} currency={f.currency} />}
        ListEmptyComponent={
          <Empty
            text="No transactions yet"
            description="Add your first income or expense to start tracking your finances."
            icon={WalletCards}
            actionLabel="Add Transaction"
            onAction={() => router.push("/add")}
          />
        }
      />
    </Page>
  );
}
function Transaction({ t, symbol, currency }) {
  const income = t.type === "Income";
  const theme = useTheme();
  const description = String(t.description || "").trim();
  return (
    <ListRow
      style={S.tx}
      leading={(
        <View style={[S.txDot, { backgroundColor: income ? COLORS.greenTint : COLORS.redTint }]}>
          <AppIcon name={income ? "income" : "expenses"} size={20} color={income ? C.green : C.red} />
        </View>
      )}
      title={t.description || t.category}
      titleNumberOfLines={2}
      subtitle={`${t.category} / ${formatDateLabel(t.date)}`}
      accessibilityLabel={`${t.category} ${income ? "income" : "expense"}${description && description.toLowerCase() !== String(t.category || "").toLowerCase() ? `, ${description}` : ""}, ${formatDateLabel(t.date)}, ${accessibleMoney(t.amount, currency || t.currency || "NGN")}`}
      trailing={(
        <Text style={[S.transactionAmount, { color: income ? theme.colors.positive : theme.colors.danger }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {income ? "+" : "-"}{money(t.amount, symbol)}
        </Text>
      )}
    />
  );
}
export function GoalsScreen() {
  return (
    <Guard errorTitle="Unable to load your goals" errorDescription="Your goals are unavailable right now. Please try again.">
      <Goals />
    </Guard>
  );
}
function Goals() {
  const f = useFinance(),
    [show, setShow] = useState(false),
    [name, setName] = useState(GOAL_CATEGORIES.find((category) => category.name === "Savings")?.goalName || "Personal Savings"),
    [target, setTarget] = useState(""),
    [type, setType] = useState("Savings"),
    [targetDate, setTargetDate] = useState(""),
    [errors, setErrors] = useState({}),
    [submitting, setSubmitting] = useState(false),
    [notice, setNotice] = useState(""),
    [showGoalSyncDiagnostics, setShowGoalSyncDiagnostics] = useState(false);
  const submittingRef = useRef(false);
  const goals = f.goals.filter((g) => g.currency === f.currency);
  const theme = useTheme();
  async function save() {
    if (submittingRef.current) return;
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Please enter a goal name.";
    if (!Number.isFinite(Number(target)) || Number(target) <= 0)
      nextErrors.target = "Please enter a valid target amount.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      announceAccessibility(Object.values(nextErrors).join(" "));
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await f.saveGoal({ name: name.trim(), targetAmount: Number(target), type, targetDate });
      setShow(false);
      setName(GOAL_CATEGORIES.find((category) => category.name === "Savings")?.goalName || "Personal Savings");
      setType("Savings");
      setTarget("");
      setTargetDate("");
      setErrors({});
      setNotice("Goal created successfully.");
      announceAccessibility("Goal created successfully.");
    } catch (e) {
      Alert.alert("Could not create goal", e.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  return (
    <Page title="Goals" scroll={false} keyboardAvoiding>
      <FlatList
        data={goals}
        keyExtractor={(goal) => String(goal.id)}
        contentContainerStyle={S.goalsListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={S.goalListHeader}>
            <View style={S.pageIntro}>
              <Text style={[S.goalIntroLead, { color: theme.colors.text }]}>Plan for what matters.</Text>
              <Text style={[S.goalIntroText, { color: theme.colors.secondaryText }]}>Track each goal and build progress through contributions.</Text>
            </View>
            {SHOW_GOAL_SYNC_DIAGNOSTICS ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Goal Sync Diagnostics"
                onPress={() => setShowGoalSyncDiagnostics(true)}
                style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: theme.colors.secondaryText, fontSize: 12, fontWeight: "700" }}>Goal Sync Diagnostics</Text>
              </Pressable>
            ) : null}
            <Button
              title={show ? "Cancel goal creation" : "Create Goal"}
              accessibilityLabel={show ? "Cancel goal creation" : "Create financial goal"}
              icon={<AppIcon name="plus" color={theme.colors.onPrimary} size={20} strokeWidth={2.8} />}
              onPress={() => setShow((visible) => !visible)}
            />
            {notice ? <Text style={S.successMessage} accessibilityRole="alert" accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}>{notice}</Text> : null}
            {show && (
              <Card style={S.goalFormCard}>
                <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text }]}>What are you saving for?</Text>
                <GoalCategorySelector
                  value={type}
                  onSelect={(category) => {
                    setType(category.name);
                    setName(category.goalName);
                    if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
                  }}
                />
                <Field
                  label="Goal name"
                  value={name}
                  onChangeText={(value) => { setName(value); if (errors.name) setErrors((current) => ({ ...current, name: undefined })); }}
                  placeholder={type === "Other" ? "What are you saving for?" : "Goal name"}
                  error={errors.name}
                />
                <CurrencyField
                  label="Target amount"
                  value={target}
                  onChangeText={(value) => { setTarget(value); if (errors.target) setErrors((current) => ({ ...current, target: undefined })); }}
                  symbol={f.symbol}
                  inputStyle={[S.goalAmountInput, { color: theme.colors.text }]}
                  error={errors.target}
                  accessibilityHint="Enter a target greater than zero"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <DatePickerField
                  label="Target date"
                  value={targetDate}
                  onChange={(value) => { setTargetDate(value); if (errors.targetDate) setErrors((current) => ({ ...current, targetDate: undefined })); }}
                />
                <Card style={S.goalReviewCard} accessibilityLabel={`Review goal ${name || "unnamed"}, target ${target ? money(target, f.symbol) : "not entered"}${targetDate ? `, target date ${formatDateLabel(targetDate)}` : ""}`}>
                  <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text }]}>Review your goal</Text>
                  <Text style={[S.bodyText, { color: theme.colors.text }]}>{name || type} · {target ? money(target, f.symbol) : "Enter target amount"}{targetDate ? ` · ${formatDateLabel(targetDate)}` : ""}</Text>
                </Card>
                <Button title="Create Goal" accessibilityLabel="Create goal" onPress={save} disabled={submitting} loading={submitting} />
              </Card>
            )}
          </View>
        )}
        ListEmptyComponent={!show ? (
          <Empty
            text="No goals yet"
            description="Create your first financial goal and start building toward it."
            icon={Landmark}
          />
        ) : null}
        renderItem={({ item }) => <GoalCard goal={item} />}
      />
      {SHOW_GOAL_SYNC_DIAGNOSTICS ? (
        <Modal visible={showGoalSyncDiagnostics} animationType="slide" onRequestClose={() => setShowGoalSyncDiagnostics(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <ScrollView contentContainerStyle={{ padding: SPACE.page, paddingBottom: SPACE.xxl, gap: SPACE.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.md }}>
                <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text, flex: 1 }]}>BudgetFlow Goal Sync Diagnostics</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Close Goal Sync Diagnostics" onPress={() => setShowGoalSyncDiagnostics(false)} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: "700" }}>Close</Text>
                </Pressable>
              </View>
              {f.goalSyncSnapshot ? (
                <>
                  <Card style={{ gap: SPACE.sm }}>
                    <DiagnosticEntry label="Platform" value={f.goalSyncSnapshot.platform} />
                    <DiagnosticEntry label="Supabase Project" value={f.goalSyncSnapshot.project} />
                    <DiagnosticEntry label="Authenticated User ID" value={f.goalSyncSnapshot.userId || "Unavailable"} />
                    <DiagnosticEntry label="Authenticated Email" value={f.goalSyncSnapshot.email || "Unavailable"} />
                    <DiagnosticEntry label="Session" value={f.goalSyncSnapshot.sessionAuthenticated ? "Authenticated" : "Not authenticated"} />
                    <DiagnosticEntry label="Currency Preference" value={f.goalSyncSnapshot.currencyPreference} />
                    <DiagnosticEntry label="Goal Currency Filter" value={f.goalSyncSnapshot.queryCurrencyFilter} />
                    <DiagnosticEntry label="Goals page display filter" value={f.goalSyncSnapshot.displayCurrencyFilter} />
                    <DiagnosticEntry label="Goals Returned" value={f.goalSyncSnapshot.goals.length} />
                    <DiagnosticEntry label="Data Source" value={f.goalSyncSnapshot.dataSource} />
                  </Card>
                  <Card style={{ gap: SPACE.sm }}>
                    <Text style={[S.cardTitle, { color: theme.colors.text }]}>Logical query</Text>
                    <DiagnosticEntry label="Table" value={f.goalSyncSnapshot.table} />
                    <DiagnosticEntry label="User filter" value={`user_id = ${f.goalSyncSnapshot.queryUserId}`} />
                    <DiagnosticEntry label="Currency filter" value={f.goalSyncSnapshot.queryCurrencyFilter} />
                    <DiagnosticEntry label="Other filters" value={f.goalSyncSnapshot.otherFilters.length ? f.goalSyncSnapshot.otherFilters.join(", ") : "None"} />
                  </Card>
                  <Text style={[S.cardTitle, { color: theme.colors.text }]}>Goals returned by the existing query</Text>
                  {f.goalSyncSnapshot.goals.length ? f.goalSyncSnapshot.goals.map((goal) => (
                    <Card key={goal.id} style={{ gap: SPACE.sm }}>
                      <DiagnosticEntry label="Goal ID" value={goal.id} />
                      <DiagnosticEntry label="Name" value={goal.name ?? goal.title} />
                      <DiagnosticEntry label="User ID" value={goal.user_id} />
                      <DiagnosticEntry label="Currency" value={goal.currency} />
                      <DiagnosticEntry label="Target" value={goal.target_amount ?? goal.targetAmount} />
                      <DiagnosticEntry label="Saved" value={goal.current_amount ?? goal.currentAmount} />
                      <DiagnosticEntry label="Legacy Key" value={goal.legacy_key ?? "None"} />
                    </Card>
                  )) : <Card><Text style={{ color: theme.colors.secondaryText }}>The current Supabase query returned no goals.</Text></Card>}
                </>
              ) : <Card><Text style={{ color: theme.colors.secondaryText }}>Waiting for the existing goals query to finish.</Text></Card>}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      ) : null}
    </Page>
  );
}
function GoalCategorySelector({ value, onSelect }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selectedCategory = GOAL_CATEGORIES.find((category) => category.name === value) || GOAL_CATEGORIES[1];

  return (
    <View style={S.field}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${selectedCategory.name} goal`}
        accessibilityHint="Opens goal categories"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[S.goalCategorySelector, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border }]}
      >
        <GoalCategoryIcon category={selectedCategory.name} containerSize={36} size={19} />
        <Text style={[S.dateSelectorText, S.selectValue, { color: theme.colors.text }]}>{selectedCategory.name}</Text>
        <ChevronDown size={18} color={theme.colors.secondaryText} accessible={false} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} accessibilityViewIsModal>
        <Pressable style={S.selectBackdrop} onPress={() => setOpen(false)}>
          <View style={[S.selectSheet, { backgroundColor: theme.colors.card }]} accessibilityRole="radiogroup" accessibilityLabel="Goal categories">
            <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text }]}>What are you saving for?</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {GOAL_CATEGORIES.map((category) => {
                const selected = category.name === selectedCategory.name;
                return (
                  <Pressable
                    key={category.name}
                    accessibilityRole="radio"
                    accessibilityLabel={`${category.name} goal category`}
                    accessibilityState={{ selected }}
                    onPress={() => { onSelect(category); setOpen(false); }}
                    style={[S.goalCategoryOption, { backgroundColor: selected ? theme.colors.purpleTint : theme.colors.card, borderColor: selected ? theme.colors.borderPurple : theme.colors.border }]}
                  >
                    <GoalCategoryIcon category={category.name} containerSize={40} size={20} />
                    <Text style={[S.cardTitle, { color: theme.colors.text, flex: 1 }]}>{category.name}</Text>
                    {selected ? <Check size={18} color={theme.colors.accentText} accessible={false} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
function DiagnosticEntry({ label, value }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: theme.colors.secondaryText, fontSize: 12 }}>{label}</Text>
      <Text selectable style={{ color: theme.colors.text, fontSize: 14, fontWeight: "600" }}>{value == null || value === "" ? "None" : String(value)}</Text>
    </View>
  );
}
function GoalCard({ goal }) {
  const f = useFinance(),
    router = useRouter(),
    theme = useTheme(),
    normalizedGoal = normalizeGoal(goal),
    visual = goalVisual(normalizedGoal),
    rawPct = goal.targetAmount
      ? Math.max((goal.currentAmount / goal.targetAmount) * 100, 0)
      : 0,
    pct = Math.min(rawPct, 100),
    remaining = Math.max(
      Number(goal.targetAmount) - Number(goal.currentAmount),
      0,
    );
  const accent = remaining === 0
    ? theme.colors.positive
    : FUNCTIONAL_ICON_TONES[visual.tone]?.[theme.themeName]?.foreground || theme.colors.primary;
  return (
    <Pressable
      onPress={() => router.push(`/goal/${goal.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${normalizedGoal.name}. ${normalizedGoal.category} goal, ${accessibleMoney(goal.currentAmount, f.currency)} saved of ${accessibleMoney(goal.targetAmount, f.currency)}, ${rawPct > 100 ? `target exceeded, ${Math.round(rawPct)} percent of target` : `${Math.round(pct)} percent complete`}, ${remaining === 0 ? (rawPct > 100 ? "target exceeded" : "target reached") : `${accessibleMoney(remaining, f.currency)} remaining`}${goal.targetDate ? `, target date ${formatDateLabel(goal.targetDate)}` : ""}`}
      accessibilityHint="Opens goal details and contribution history"
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
    >
      <Card style={S.goalCard}>
        <View style={S.row}>
          <View style={S.rowStart}>
            <GoalCategoryIcon category={visual.category} containerSize={48} size={24} strokeWidth={2.5} />
            <View style={S.goalHeading}>
              <Text style={[S.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>{normalizedGoal.name}</Text>
              <Text style={[S.goalType, { color: theme.colors.secondaryText }]}>{normalizedGoal.category}</Text>
            </View>
          </View>
          <View style={S.goalChevron} accessible={false}>
            <ChevronRight color={theme.colors.secondaryText} size={21} />
          </View>
        </View>
        <View style={S.goalMetrics}>
          <View style={S.goalMetric}>
            <Text style={[S.label, { color: theme.colors.secondaryText }]}>SAVED</Text>
            <Text style={[S.goalAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(goal.currentAmount, f.symbol)}</Text>
          </View>
          <View style={S.goalMetric}>
            <Text style={[S.label, { color: theme.colors.secondaryText }]}>TARGET</Text>
            <Text style={[S.goalAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(goal.targetAmount, f.symbol)}</Text>
          </View>
        </View>
        <View style={S.goalCompletionRow}>
          <Text style={[S.goalRemaining, { color: theme.colors.secondaryText }]}>
            {rawPct > 100 ? "Target exceeded" : remaining === 0 ? "Target reached" : `${money(remaining, f.symbol)} remaining`}
          </Text>
          <View style={S.budgetUsageCopy}>
            <Text style={[S.pct, { color: accent }]}>{Math.round(rawPct > 100 ? rawPct : pct)}%</Text>
            <Text style={[S.budgetUsageState, { color: accent }]}>{rawPct > 100 ? "of target" : "complete"}</Text>
          </View>
        </View>
        <Progress value={pct} label={`${goal.name} progress`} accessibilityValueText={rawPct > 100 ? `Target exceeded, ${Math.round(rawPct)} percent of target` : `${Math.round(pct)} percent complete`} color={accent} />
        {goal.targetDate ? <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Target date · {formatDateLabel(goal.targetDate)}</Text> : null}
      </Card>
    </Pressable>
  );
}
export function GoalDetailScreen() {
  return (
    <Guard>
      <GoalDetail />
    </Guard>
  );
}
function GoalDetail() {
  const { id } = useLocalSearchParams(),
    f = useFinance(),
    router = useRouter(),
    theme = useTheme(),
    [amount, setAmount] = useState(""),
    [note, setNote] = useState(""),
    [contributionDate, setContributionDate] = useState(new Date().toISOString().slice(0, 10)),
    [amountError, setAmountError] = useState(""),
    [showContribution, setShowContribution] = useState(false),
    [submitting, setSubmitting] = useState(false),
    [deleting, setDeleting] = useState(false),
    [notice, setNotice] = useState(""),
    g = f.goals.find((x) => String(x.id) === String(id));
  const submittingRef = useRef(false);
  const deletingRef = useRef(false);
  if (!g)
    return (
      <Page title="Goal details" back={backTo(router, "/(tabs)/goals")} backLabel="Back to Goals" backHint="Returns to the goal list">
        <Empty text="This goal could not be found." />
      </Page>
    );
  const rawPct = g.targetAmount
      ? Math.max((g.currentAmount / g.targetAmount) * 100, 0)
      : 0,
    pct = Math.min(rawPct, 100),
    remaining = Math.max(Number(g.targetAmount) - Number(g.currentAmount), 0);
  const normalizedGoal = normalizeGoal(g);
  const visual = goalVisual(normalizedGoal);
  const goalAccent = remaining === 0
    ? theme.colors.positive
    : FUNCTIONAL_ICON_TONES[visual.tone]?.[theme.themeName]?.foreground || theme.colors.primary;
  async function addContribution() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    Keyboard.dismiss();
    try {
      await f.addSaving(g, { amount, date: contributionDate, note });
      setAmount("");
      setNote("");
      setContributionDate(new Date().toISOString().slice(0, 10));
      setAmountError("");
      setShowContribution(false);
      const successMessage = "Contribution added successfully.";
      setNotice(successMessage);
      announceAccessibility(successMessage);
    } catch (e) {
      if (e.message === "Enter a valid amount within the remaining goal balance.")
        setAmountError(e.message);
      else Alert.alert("Could not record contribution", e.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  function removeContribution(contribution) {
    Alert.alert(
      "Delete contribution?",
      "This will update the goal balance and remove this history item.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await f.deleteSaving(g.id, contribution.id);
      const successMessage = "Contribution deleted. Goal balance updated.";
      setNotice(successMessage);
      announceAccessibility(successMessage);
            } catch (e) {
              Alert.alert("Could not delete contribution", e.message);
            }
          },
        },
      ],
    );
  }
  function confirmDeleteGoal() {
    if (deletingRef.current) return;
    Alert.alert("Delete goal?", `Are you sure you want to delete ${g.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Goal", style: "destructive", onPress: async () => {
        if (deletingRef.current) return;
        deletingRef.current = true;
        setDeleting(true);
        try {
          await f.deleteGoal(g.id);
          announceAccessibility("Goal deleted.");
          router.replace("/(tabs)/goals");
          Alert.alert("Goal deleted.");
        } catch (_error) {
          Alert.alert("Couldn't delete this goal. Try again.");
          deletingRef.current = false;
          setDeleting(false);
        }
      } },
    ]);
  }
  return (
    <Page title={g.name} back={backTo(router, "/(tabs)/goals")} backLabel="Back to Goals" backHint="Returns to the goal list" scroll={false} keyboardAvoiding>
      <FlatList
        data={g.savingsHistory || []}
        keyExtractor={(item, index) => String(item.id || index)}
        contentContainerStyle={S.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {notice ? (
              <Text
                style={S.successMessage}
                accessibilityRole="alert"
                accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}
              >
                {notice}
              </Text>
            ) : null}
            <Card style={S.goalDetailSummary}>
              <View style={S.goalDetailIconRow}>
                <GoalCategoryIcon category={visual.category} containerSize={48} size={24} strokeWidth={2.5} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[S.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>{normalizedGoal.name}</Text>
                  <Text style={[S.caption, { color: theme.colors.secondaryText }]}>{normalizedGoal.category}</Text>
                </View>
              </View>
              <View style={[S.goalDetailSaved, { backgroundColor: theme.colors.purpleTint }]}>
                <Text style={[S.label, { color: theme.colors.secondaryText }]}>SAVED</Text>
                <Text style={[S.goalDetailAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(g.currentAmount, f.symbol)}</Text>
              </View>
              <View style={S.goalDetailAmounts}>
                <View style={[S.goalDetailMetric, { backgroundColor: theme.colors.mutedTint, borderColor: theme.colors.border, borderWidth: 1 }]}>
                  <Text style={[S.label, { color: theme.colors.secondaryText }]}>TARGET</Text>
                  <Text style={[S.goalDetailMetricAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(g.targetAmount, f.symbol)}</Text>
                </View>
                <View style={[S.goalDetailMetric, { backgroundColor: theme.colors.mutedTint, borderColor: theme.colors.border, borderWidth: 1 }]}>
                  <Text style={[S.label, { color: theme.colors.secondaryText }]}>{remaining === 0 ? "STATUS" : "REMAINING"}</Text>
                  <Text style={[S.goalDetailMetricAmount, { color: theme.colors.text }]} numberOfLines={2} adjustsFontSizeToFit>{remaining === 0 ? "Goal completed" : money(remaining, f.symbol)}</Text>
                </View>
              </View>
              <View style={S.row}>
                <Text style={[S.goalCompleteText, { color: goalAccent }]}>
                  {rawPct > 100 ? `Target exceeded · ${Math.round(rawPct)}% of target` : remaining === 0 ? "Target reached · 100% complete" : `${Math.round(pct)}% complete`}
                </Text>
                {remaining === 0 ? <Check size={18} color={C.green} accessible={false} /> : null}
              </View>
              <Progress value={pct} label={`${g.name} progress`} accessibilityValueText={rawPct > 100 ? `Target exceeded, ${Math.round(rawPct)} percent of target` : `${Math.round(pct)} percent complete`} color={goalAccent} />
              {g.targetDate ? <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Target date · {formatDateLabel(g.targetDate)}</Text> : null}
            </Card>
            {remaining > 0 && !showContribution && (
              <Button title="Add Contribution" accessibilityLabel="Add contribution" onPress={() => setShowContribution(true)} />
            )}
            {showContribution && remaining > 0 && (
              <Card style={S.contributionFormCard}>
                <Text accessibilityRole="header" style={[S.cardTitle, { color: theme.colors.text }]}>Add Contribution</Text>
                <CurrencyField
                  label="Amount"
                  value={amount}
                  onChangeText={(value) => { setAmount(value); if (amountError) setAmountError(""); }}
                  symbol={f.symbol}
                  inputStyle={[S.goalAmountInput, { color: theme.colors.text }]}
                  error={amountError}
                  accessibilityHint="Contribution must be within the remaining goal balance"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <Field
                  label="Note (optional)"
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Monthly savings"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <DatePickerField label="Contribution date" value={contributionDate} onChange={setContributionDate} />
                <Button title="Save Contribution" accessibilityLabel="Save contribution" onPress={addContribution} disabled={submitting} loading={submitting} />
                <Button title="Cancel" secondary onPress={() => setShowContribution(false)} disabled={submitting} />
              </Card>
            )}
            <Section title="Contribution history" />
          </>
        }
        renderItem={({ item }) => (
          <View style={S.contributionHistoryRow}>
            <ListRow
              style={S.contributionListRow}
              divider={false}
              leading={(
                <View style={S.historyIcon} accessible={false}>
                  <CalendarDays size={20} color={C.purple} accessible={false} />
                </View>
              )}
              title={formatDateLabel(item.date)}
              subtitle={item.note || "Contribution"}
              accessibilityLabel={`Contribution on ${formatDateLabel(item.date)}${item.note ? `, ${item.note}` : ""}, ${accessibleMoney(item.amount, g.currency)}`}
              trailing={(
                <Text style={S.contributionAmount} numberOfLines={1} adjustsFontSizeToFit>
                  +{money(item.amount, f.symbol)}
                </Text>
              )}
            />
            <Pressable
              style={S.deleteButton}
              onPress={() => removeContribution(item)}
              accessibilityRole="button"
              accessibilityLabel={`Delete contribution of ${accessibleMoney(item.amount, g.currency)} dated ${formatDateLabel(item.date)}`}
              accessibilityHint="Removes this contribution and updates the goal balance"
            >
              <Trash2 size={20} color={C.red} accessible={false} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Empty
            text="No contributions yet"
            description="Start by adding your first contribution."
            icon={Landmark}
            actionLabel={remaining > 0 && !showContribution ? "Add Contribution" : undefined}
            onAction={remaining > 0 && !showContribution ? () => setShowContribution(true) : undefined}
          />
        }
        ListFooterComponent={<Button title={deleting ? "Deleting Goal…" : "Delete Goal"} variant="danger" accessibilityLabel="Delete goal, button" accessibilityHint={`Deletes ${g.name} after confirmation`} onPress={confirmDeleteGoal} disabled={deleting} loading={deleting} style={S.goalDeleteAction} />}
      />
    </Page>
  );
}
function SignOutButton() {
  const f = useFinance();
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    Alert.alert("Sign out?", "You will need to sign in again to access your BudgetFlow account.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await f.signOut();
          } catch (error) {
            Alert.alert("Could not sign out", error?.message || "Please try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Button
      title={busy ? "Signing out..." : "Sign out"}
      variant="danger"
      onPress={handlePress}
      disabled={busy}
      accessibilityLabel="Sign out"
      accessibilityHint="Ends your current BudgetFlow session. Your financial data remains saved."
    />
  );
}

export function MoreScreen() {
  return (
    <Guard>
      <More />
    </Guard>
  );
}

export function OnboardingScreen() {
  const f = useFinance();
  const router = useRouter();
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState(f.currency);
  const [busy, setBusy] = useState(false);
  const savingRef = useRef(false);
  if (f.loading) return <ScreenContainer contentStyle={S.loadingContainer}><LoadingState label={startupLabel(f.startupStage)} /></ScreenContainer>;
  if (f.error) return <Page title={f.errorKind === "network" ? "Connection issue" : f.errorKind === "authentication" ? "Sign-in required" : "Account data issue"}><ErrorState title={f.errorKind === "authentication" ? "Your session needs attention" : "Your account could not be loaded"} description={__DEV__ ? `Retry account loading. Details: ${f.error}` : f.errorKind === "network" ? "Please check your connection and try again." : "Your account data could not be loaded. Please try again."} onRetry={f.refresh} /></Page>;
  if (!f.user) return <AuthScreen />;
  if (f.onboardingStatus === "completed" || f.onboardingStatus === "skipped") return <Redirect href="/" />;
  const saveState = async (status, code = selectedCurrency) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setBusy(true);
    try { await f.saveOnboardingStatus(status, code); return true; }
    catch (error) { Alert.alert("Could not save setup", error.message || "Please try again."); return false; }
    finally { savingRef.current = false; setBusy(false); }
  };
  const skip = async () => { if (await saveState("skipped", selectedCurrency)) router.replace("/"); };
  return <ThemeScope><ScreenContainer scroll contentStyle={S.onboardingContent}>
    <View style={S.onboardingBrand}><BudgetFlowLogo size={52} /><Text style={[S.onboardingBrandText, { color: theme.colors.text }]}>BudgetFlow</Text></View>
    {step === 0 ? <>
      <Text accessibilityRole="header" style={[S.onboardingTitle, { color: theme.colors.text }]}>Welcome to BudgetFlow 👋</Text>
      <Text style={[S.bodyText, { color: theme.colors.secondaryText }]}>Let&apos;s set up your financial workspace in a few quick steps.</Text>
      <Text style={[S.onboardingPromise, { color: theme.colors.accentText }]}>Your money. Your goals. Your plan.</Text>
      <Button title="Get Started" accessibilityLabel="Get started with BudgetFlow" onPress={async () => { if (await saveState("in_progress")) setStep(1); }} disabled={busy} loading={busy} />
      <Button title="Skip for now" secondary onPress={skip} disabled={busy} />
    </> : step === 1 ? <>
      <Text accessibilityRole="header" style={[S.onboardingTitle, { color: theme.colors.text }]}>What currency do you use?</Text>
      <Text style={[S.bodyText, { color: theme.colors.secondaryText }]}>Choose the currency you&apos;ll use to manage your money.</Text>
      <View style={S.onboardingCurrencyList} accessibilityRole="radiogroup" accessibilityLabel="Preferred currency">
        {Object.entries(currencySymbols).map(([code, symbol]) => {
          const selected = selectedCurrency === code;
          return <Pressable key={code} accessibilityRole="radio" accessibilityLabel={`${code} ${currencyNames[code] || code}, ${selected ? "selected" : "not selected"}`} accessibilityState={{ selected }} onPress={() => setSelectedCurrency(code)} style={[S.onboardingCurrencyOption, { backgroundColor: selected ? theme.colors.purpleTint : theme.colors.card, borderColor: selected ? theme.colors.borderPurple : theme.colors.border }]}><CircleDollarSign size={22} color={theme.colors.accentText} accessible={false} /><Text style={[S.bodyText, { color: theme.colors.text, flex: 1 }]}>{currencyNames[code] || code} ({code} · {symbol})</Text>{selected ? <Check size={19} color={theme.colors.accentText} accessible={false} /> : null}</Pressable>;
        })}
      </View>
      <Button title="Continue" onPress={async () => { if (await saveState("in_progress", selectedCurrency)) setStep(2); }} disabled={busy} loading={busy} />
      <Button title="Skip for now" secondary onPress={skip} disabled={busy} />
    </> : <>
      <Text accessibilityRole="header" style={[S.onboardingTitle, { color: theme.colors.text }]}>✨ Meet Smart Plan</Text>
      <Text style={[S.onboardingPromise, { color: theme.colors.text }]}>Your money doesn&apos;t have to be complicated.</Text>
      <Text style={[S.bodyText, { color: theme.colors.secondaryText }]}>Smart Plan helps you decide where your money should go before you start spending it.</Text>
      <View style={S.onboardingHighlights}>{[["budgets", "Budget"], ["expenses", "Spending"], ["savings", "Savings"], ["goals", "Goals"]].map(([icon, label]) => <View key={label} style={[S.onboardingHighlight, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}><FunctionalIcon name={icon} containerSize={40} size={19} /><Text style={[S.cardTitle, { color: theme.colors.text }]}>{label}</Text></View>)}</View>
      <Button title="Build My Plan" accessibilityLabel="Build my financial plan" onPress={async () => { if (await saveState("in_progress", selectedCurrency)) router.replace("/planner"); }} disabled={busy} loading={busy} />
      <Button title="Skip for now" secondary onPress={skip} disabled={busy} />
    </>}
  </ScreenContainer></ThemeScope>;
}

function More() {
  const router = useRouter();
  const groups = [
    {
      title: "Financial Tools",
      items: [
        ["Smart Plan", "Plan your money", "/planner", "planner"],
        ["Reports", "Understand your finances", "/reports", "reports"],
        ["Compound Interest", "Calculate investment growth", "/compound-interest", "compoundInterest"],
      ],
    },
    {
      title: "Financial Management",
      items: [
        ["Financial Profile", "Your income and financial details", "/profile", "financialProfile"],
        ["Transaction History", "Browse income and expenses", "/transactions", "history"],
        ["Settings", "Currency and app preferences", "/settings", "settings"],
      ],
    },
  ];
  return (
    <Page title="More">
      <View style={S.pageIntro}>
        <Text style={S.sub}>Manage your finances</Text>
      </View>
      {groups.map((group) => (
        <View key={group.title}>
          <Section title={group.title} />
          <Card>
            {group.items.map(([label, description, path, iconName], index) => (
              <FeatureRow
                key={`${label}-${index}`}
                title={label}
                description={description}
                iconName={iconName}
                onPress={() => router.push(path)}
                divider={index < group.items.length - 1}
              />
            ))}
          </Card>
        </View>
      ))}
      <Section title="Account" />
      <Card style={S.accountActionCard}>
        <SignOutButton />
      </Card>
    </Page>
  );
}
const goalOptions = [
  { label: "Save money", icon: PiggyBank },
  { label: "Build emergency fund", icon: ShieldCheck },
  { label: "Invest", icon: TrendingUp },
  { label: "Pay debt", icon: CreditCard },
  { label: "Start a business", icon: BriefcaseBusiness },
  { label: "Other", icon: CircleEllipsis },
];
const budgetPreferences = [
  "Balanced",
  "Aggressive Saving",
  "Essentials First",
  "Custom",
];

function SettingsSection({ title, children }) {
  return (
    <View style={{ marginTop: SPACE.md }}>
      <Text style={[S.label, { marginBottom: SPACE.sm, paddingHorizontal: SPACE.xs }]}>{title}</Text>
      {children}
    </View>
  );
}

export function AccountScreen() {
  return (
    <Guard>
      <Account />
    </Guard>
  );
}

function Account() {
  const f = useFinance();
  const router = useRouter();
  const theme = useTheme();
  const metadata = f.user?.user_metadata || {};
  const name = String(metadata.full_name || metadata.name || "").trim()
    || f.user?.email?.split("@")[0]
    || "BudgetFlow user";
  const avatarUrl = metadata.avatar_url || metadata.picture;
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
  const providers = f.user?.app_metadata?.providers || [];
  const provider = providers.includes("google") || f.user?.app_metadata?.provider === "google"
    ? "Google"
    : "Email and password";

  return (
    <Page title="Account" back={backTo(router, "/")} backLabel="Back to Dashboard" backHint="Returns to your Dashboard">
      <SettingsSection title="Profile">
        <Card style={S.accountIdentityCard}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={S.accountAvatar} accessibilityLabel={`${name}'s profile photo`} />
          ) : (
            <View style={[S.accountAvatarFallback, { backgroundColor: theme.colors.primary }]} accessible={false}>
              <Text style={[S.accountAvatarInitials, { color: theme.colors.onPrimary }]}>{initials}</Text>
            </View>
          )}
          <View style={S.accountIdentityCopy}>
            <Text style={[S.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>{name}</Text>
            {f.user?.email ? <Text style={[S.caption, { marginTop: 3, color: theme.colors.secondaryText }]} numberOfLines={2}>{f.user.email}</Text> : null}
            <Text style={[S.caption, { marginTop: 3, color: theme.colors.secondaryText }]}>{provider} account</Text>
          </View>
        </Card>
      </SettingsSection>

      <SettingsSection title="Account">
        <SettingsRow
          icon="financialProfile"
          title="Financial Profile"
          description="Income, savings targets, and financial preferences"
          onPress={() => router.push("/profile")}
          accessibilityLabel="Open Financial Profile"
          accessibilityHint="Opens your Financial Profile"
        />
      </SettingsSection>

      <PreferencesControls />

      <SettingsSection title="Account actions">
        <Card style={S.accountActionCard}>
          <SignOutButton />
        </Card>
      </SettingsSection>
    </Page>
  );
}

function PreferencesControls() {
  const f = useFinance();
  const theme = useTheme();
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const currencyRows = Object.entries(currencySymbols).map(([code, symbol]) => ({
    code,
    name: currencyNames[code] || code,
    symbol,
    label: `${currencyNames[code] || code} (${code} · ${symbol})`,
  }));
  const toggleTheme = async () => {
    const next = theme.themeName === "dark" ? "light" : "dark";
    try {
      await theme.setTheme(next);
    } catch (error) {
      Alert.alert("Could not save appearance", error.message || "Please try again.");
    }
  };

  return (
    <>
      <SettingsSection title="Preferences">
        <SettingsRow
          icon="balance"
          title="Currency"
          description="Choose the preferred display currency"
          value={f.currency}
          onPress={() => setCurrencyPickerOpen(true)}
          accessibilityLabel="Change currency"
          accessibilityHint="Choose the default display currency"
        />
        <SettingsRow
          icon="settings"
          title="Appearance"
          description="App display preferences"
          value={theme.themeName === "dark" ? "Dark" : "Light"}
          onPress={toggleTheme}
          accessibilityLabel="Change appearance"
          accessibilityHint="Toggles the app appearance between light and dark mode"
        />
      </SettingsSection>
      <Text style={[S.caption, { marginTop: SPACE.md, color: theme.colors.secondaryText }]}>
        Currency preference is saved on this device. Existing transactions are not converted when the display currency changes.
      </Text>
      <Modal visible={currencyPickerOpen} transparent animationType="fade" onRequestClose={() => setCurrencyPickerOpen(false)} accessibilityViewIsModal>
        <Pressable style={S.selectBackdrop} onPress={() => setCurrencyPickerOpen(false)}>
          <View style={[S.selectSheet, { backgroundColor: theme.colors.card }]} accessibilityRole="radiogroup" accessibilityLabel="Currency options">
            <Text style={[S.cardTitle, { color: theme.colors.text }]}>Currency</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {currencyRows.map((option) => {
                const selected = option.code === f.currency;
                return (
                  <Pressable
                    key={option.code}
                    accessibilityRole="radio"
                    accessibilityLabel={`${option.label}${selected ? ", selected" : ""}`}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      f.changeCurrency(option.code).catch((error) => Alert.alert("Could not save currency", error.message || "Please try again."));
                      setCurrencyPickerOpen(false);
                    }}
                    style={[S.selectOption, selected && S.selectOptionSelected, { backgroundColor: selected ? theme.colors.purpleTint : "transparent" }]}
                  >
                    <View style={[S.currencyBadge, { backgroundColor: theme.colors.purpleTint, borderColor: theme.colors.border }]}><Text style={[S.currencyBadgeText, { color: theme.colors.accentText }]}>{option.symbol}</Text></View>
                    <View style={{ flex: 1 }}><Text style={[S.bodyText, { color: theme.colors.text, fontWeight: "700" }]}>{option.name}</Text><Text style={[S.caption, { color: theme.colors.secondaryText }]}>{option.code} · {option.symbol}</Text></View>
                    {selected ? <Check size={18} color={theme.colors.accentText} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function SettingsIcon({ name, tone = "blue" }) {
  return <FunctionalIcon name={name} tone={tone} containerSize={42} size={18} />;
}

function SettingsValue({ value }) {
  if (!value) return null;
  return <Text style={[S.caption, { marginTop: 0, color: COLORS.primary, fontWeight: "700" }]} numberOfLines={1}>{value}</Text>;
}

function SettingsChevron() {
  return <ChevronRight size={18} color={COLORS.secondaryText} />;
}

function SettingsRow({ icon, title, description, value, onPress, destructive = false, showChevron = true, accessibilityLabel, accessibilityHint }) {
  const { colors } = useTheme();
  const resolvedLabel = accessibilityLabel || `${title}${value ? `, ${value}` : ""}${description ? `. ${description}` : ""}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      accessibilityHint={accessibilityHint || description || "Opens this setting"}
      onPress={onPress}
      style={({ pressed }) => [{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE.md,
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.purpleTint : colors.card,
        marginBottom: SPACE.sm,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      }, destructive && { borderColor: colors.borderDanger, backgroundColor: colors.redTint }]}
    >
      <SettingsIcon name={icon} tone={destructive ? "red" : "blue"} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[S.cardTitle, { color: colors.text }]}>{title}</Text>
        {description ? <Text style={[S.caption, { marginTop: 4, color: colors.secondaryText }]}>{description}</Text> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.xs, maxWidth: "38%" }}>
        {value ? <SettingsValue value={value} /> : null}
        {showChevron ? <SettingsChevron /> : null}
      </View>
    </Pressable>
  );
}

export function SettingsScreen() {
  return (
    <Guard>
      <Settings />
    </Guard>
  );
}
function Settings() {
  const router = useRouter();

  return (
    <Page title="Settings" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen">
      <View style={S.pageIntro}>
        <Text style={S.sub}>Manage your BudgetFlow preferences</Text>
      </View>

      <SettingsSection title="Account">
        <SettingsRow
          icon="profile"
          title="Financial Profile"
          description="Manage your income and financial preferences"
          onPress={() => router.push("/profile")}
          accessibilityHint="Opens your financial profile"
        />
      </SettingsSection>

      <PreferencesControls />

      <SettingsSection title="Account actions">
        <Card style={S.accountActionCard}>
          <SignOutButton />
        </Card>
      </SettingsSection>
    </Page>
  );
}
export function ProfileScreen() {
  return (
    <Guard>
      <Profile />
    </Guard>
  );
}
function Profile() {
  const f = useFinance();
  const router = useRouter();
  const [draft, setDraft] = useState(() => ({
    monthlyIncome: String(f.profile?.monthly_income ?? ""),
    mainGoal: f.profile?.main_goal || goalOptions[0],
    monthlySavingsTarget: String(f.profile?.monthly_savings_target ?? ""),
    emergencyFundTarget: String(f.profile?.emergency_fund_target ?? ""),
    budgetPreference: f.profile?.budget_preference || budgetPreferences[0],
  }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFeedback({ type: "", message: "" });
  };

  const handleSave = async () => {
    const errors = validateFinancialProfileAmounts(draft);
    if (Object.keys(errors).length) {
      const firstMessage = Object.values(errors)[0];
      setFeedback({ type: "error", message: firstMessage });
      return;
    }

    setSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      await f.saveFinancialProfile({
        monthlyIncome: draft.monthlyIncome,
        mainGoal: draft.mainGoal,
        monthlySavingsTarget: draft.monthlySavingsTarget,
        emergencyFundTarget: draft.emergencyFundTarget,
        budgetPreference: draft.budgetPreference,
      });
      setFeedback({ type: "success", message: "Profile updated." });
      Alert.alert("Profile updated", "Your financial profile was saved.");
    } catch (error) {
      setFeedback({ type: "error", message: "Couldn't update your profile. Try again." });
      Alert.alert("Couldn't update your profile", error?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (f.loading && !f.profile) {
    return (
      <Page title="Financial Profile" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen">
        <LoadingState message="Loading your profile..." />
      </Page>
    );
  }

  return (
    <Page title="Financial Profile" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen" keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={S.sub}>Help BudgetFlow personalize your planning.</Text>
        <Text style={S.caption}>Use your current account values to keep Smart Planner and goals aligned with your finances.</Text>
      </View>

      <Section title="Account" />
      <Card>
        <Label>Signed in as</Label>
        <Text style={S.metric} accessibilityLabel={`Signed in as ${f.user?.email || "BudgetFlow user"}`}>
          {f.user?.email || "BudgetFlow user"}
        </Text>
      </Card>

      <Section title="Income" />
      <Card style={S.profileInfoCard}>
        <CurrencyField
          label="Monthly income"
          value={draft.monthlyIncome}
          onChangeText={(value) => updateDraft("monthlyIncome", value)}
          symbol={f.symbol}
          currency={f.currency}
          accessibilityLabel={`Monthly income, ${currencyNames[f.currency] || f.currency}`}
        />
        <Text style={S.caption}>This amount is used as a starting point in Smart Planner.</Text>
      </Card>

      <Section title="Financial goals" />
      <Card style={S.profileInfoCard}>
        <SelectField
          label="Main financial goal"
          value={draft.mainGoal}
          selectedIcon={goalOptions.find((option) => option.label === draft.mainGoal)?.icon || CircleEllipsis}
          options={goalOptions.map((option) => ({ value: option.label, ...option }))}
          onChange={(value) => updateDraft("mainGoal", value)}
          accessibilityLabel="Main financial goal"
        />
        <CurrencyField
          label="Monthly savings target"
          value={draft.monthlySavingsTarget}
          onChangeText={(value) => updateDraft("monthlySavingsTarget", value)}
          symbol={f.symbol}
          currency={f.currency}
          accessibilityLabel="Monthly savings target"
        />
        <CurrencyField
          label="Emergency fund target"
          value={draft.emergencyFundTarget}
          onChangeText={(value) => updateDraft("emergencyFundTarget", value)}
          symbol={f.symbol}
          currency={f.currency}
          accessibilityLabel="Emergency fund target"
        />
      </Card>

      <Section title="Planning preferences" />
      <Card style={S.profileInfoCard}>
        <SelectField
          label="Budget preference"
          value={draft.budgetPreference}
          leadingIcon="balance"
          tone="purple"
          options={budgetPreferences.map((option) => ({ value: option, label: option }))}
          onChange={(value) => updateDraft("budgetPreference", value)}
          accessibilityLabel="Budget preference"
        />
      </Card>

      {feedback.message ? (
        <Text accessibilityRole="alert" style={feedback.type === "success" ? S.successMessage : S.inlineError}>
          {feedback.message}
        </Text>
      ) : null}

      <Button
        title={saving ? "Saving..." : "Save Changes"}
        onPress={handleSave}
        disabled={saving}
        accessibilityLabel="Save financial profile changes"
        accessibilityHint="Saves the financial profile for the current account"
      />
    </Page>
  );
}
export function ReportsScreen() {
  return (
    <Guard>
      <Reports />
    </Guard>
  );
}
const reportChartColors = ["#6C4DFF", "#08A88A", "#F59E0B", "#E45468", "#2584D8", "#9857D6", "#5E8A35", "#DD6B20"];
function DonutChart({ items, total, theme, currency }) {
  const positive = items.filter((item) => Number(item.amount) > 0);
  const arcs = positive.map((item, index) => {
    const share = Number(item.amount) / total;
    const start = -90 + positive.slice(0, index).reduce((sum, previous) => sum + Number(previous.amount) / total * 360, 0);
    const end = start + share * 360;
    if (share >= 0.9999) return <Circle key={item.category} cx="100" cy="100" r="66" fill="none" stroke={reportChartColors[index % reportChartColors.length]} strokeWidth="25" />;
    const point = (degrees) => { const radians = degrees * Math.PI / 180; return { x: 100 + 66 * Math.cos(radians), y: 100 + 66 * Math.sin(radians) }; };
    const from = point(start), to = point(end), largeArc = share > 0.5 ? 1 : 0;
    return <Path key={item.category} d={`M ${from.x} ${from.y} A 66 66 0 ${largeArc} 1 ${to.x} ${to.y}`} fill="none" stroke={reportChartColors[index % reportChartColors.length]} strokeWidth="25" />;
  });
  const largest = positive.reduce((best, item) => !best || item.amount > best.amount ? item : best, null);
  return <View style={S.reportDonut} accessible accessibilityRole="image" accessibilityLabel={`Donut chart: ${positive.map((item) => `${item.category} ${money(item.amount, currencySymbolsFor(currency))}`).join(", ")}`}>
    <Svg width={190} height={190} viewBox="0 0 200 200"><Circle cx="100" cy="100" r="66" fill="none" stroke={theme.colors.borderSubtle} strokeWidth="25" />{arcs}</Svg>
    <View pointerEvents="none" style={S.reportDonutCenter}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>TOTAL SPENT</Text><Text style={[S.reportDonutTotal, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(total, currencySymbolsFor(currency))}</Text>{largest ? <Text style={[S.caption, { color: theme.colors.secondaryText }]} numberOfLines={1}>{largest.category}</Text> : null}</View>
  </View>;
}
function currencySymbolsFor(code) { return currencySymbols[code] || code; }
function Reports() {
  const f = useFinance(), router = useRouter(), theme = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(f.currentMonth);
  const [exportingPdf, setExportingPdf] = useState(false);
  const currencyTransactions = useMemo(
    () => f.transactions.filter((t) => (t.currency || "NGN") === f.currency),
    [f.transactions, f.currency],
  );
  const currencyBudgets = useMemo(
    () => f.budgets.filter((b) => b.currency === f.currency),
    [f.budgets, f.currency],
  );
  const availableMonths = useMemo(() => [...new Set([
    f.currentMonth,
    ...currencyTransactions.map(transactionMonth),
    ...currencyBudgets.map((b) => b.month),
    ...(f.cycle?.status === "completed" ? [f.cycle.cycle_month] : []),
  ].filter(Boolean))].sort((a, b) => b.localeCompare(a)), [f.currentMonth, currencyTransactions, currencyBudgets, f.cycle]);
  const reportMonth = availableMonths.includes(selectedMonth) ? selectedMonth : f.currentMonth;
  const tx = useMemo(() => transactionsForMonth(f.transactions, reportMonth, f.currency), [f.transactions, reportMonth, f.currency]);
  const income = totalForType(tx, "Income"), spent = totalForType(tx, "Expense"), net = income - spent;
  const cats = useMemo(() => expenseCategoryTotals(tx), [tx]);
  const budgets = useMemo(() => currencyBudgets.filter((b) => b.month === reportMonth).map((budget) => ({
    budget,
    budgetAmount: Number(budget.amount || 0),
    ...budgetPerformance(f.transactions, budget, reportMonth, f.currency),
  })), [currencyBudgets, f.transactions, f.currency, reportMonth]);
  const history = useMemo(() => availableMonths.filter((month) => month !== f.currentMonth).map((month) => {
    const rows = transactionsForMonth(f.transactions, month, f.currency);
    const monthBudgets = currencyBudgets.filter((b) => b.month === month);
    const budgetTotal = monthBudgets.reduce((total, b) => total + Number(b.amount || 0), 0);
    const monthIncome = totalForType(rows, "Income"), monthExpenses = totalForType(rows, "Expense");
    return { month, income: monthIncome, expenses: monthExpenses, net: monthIncome - monthExpenses, budget: budgetTotal };
  }), [availableMonths, f.currentMonth, f.transactions, f.currency, currencyBudgets]);
  const monthOptions = availableMonths.map((month) => ({ value: month, label: `${monthLabel(month)}${month === f.currentMonth ? " · Current" : ""}` }));
  const maxComparison = Math.max(income, spent, 1);
  const largestCategory = cats[0];
  async function exportPdf() {
    setExportingPdf(true);
    try {
      const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
      const categoryRows = cats.map((item) => `<tr><td>${escapeHtml(item.category)}</td><td>${escapeHtml(money(item.amount, f.symbol))}</td><td>${spent ? (item.amount / spent * 100).toFixed(1) : "0.0"}%</td></tr>`).join("");
      const budgetRows = budgets.map(({ budget, budgetAmount, spent: budgetSpent, remaining }) => `<tr><td>${escapeHtml(budget.category)}</td><td>${escapeHtml(money(budgetAmount, f.symbol))}</td><td>${escapeHtml(money(budgetSpent, f.symbol))}</td><td>${escapeHtml(money(remaining, f.symbol))}</td></tr>`).join("");
      const html = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#172033;padding:28px}h1{color:#5143c7}h2{margin-top:28px;font-size:18px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{text-align:left;border-bottom:1px solid #e4e7ee;padding:9px 6px;font-size:12px}.metrics{display:flex;gap:28px}.metric{padding:12px;background:#f4f2ff;border-radius:8px;flex:1}.label{font-size:11px;color:#5d6575}.value{font-size:17px;font-weight:700;margin-top:5px}</style></head><body><h1>BudgetFlow report</h1><p>${escapeHtml(monthLabel(reportMonth))} · ${escapeHtml(f.currency)}</p><div class="metrics"><div class="metric"><div class="label">Income</div><div class="value">${escapeHtml(money(income, f.symbol))}</div></div><div class="metric"><div class="label">Expenses</div><div class="value">${escapeHtml(money(spent, f.symbol))}</div></div><div class="metric"><div class="label">Net</div><div class="value">${escapeHtml(money(net, f.symbol))}</div></div></div><h2>Spending by category</h2><table><thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead><tbody>${categoryRows || "<tr><td colspan=\"3\">No expenses recorded</td></tr>"}</tbody></table><h2>Budget performance</h2><table><thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th></tr></thead><tbody>${budgetRows || "<tr><td colspan=\"4\">No budgets for this month</td></tr>"}</tbody></table></body></html>`;
      const file = await Print.printToFileAsync({ html });
      if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: ".pdf", dialogTitle: `${monthLabel(reportMonth)} BudgetFlow report` });
      } else if (Platform.OS !== "web") {
        await Print.printAsync({ html });
      } else {
        Alert.alert("Report ready", `The ${monthLabel(reportMonth)} PDF is ready.`);
      }
    } catch (error) {
      Alert.alert("Could not export report", error?.message || "Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }
  return (
    <Page title="Reports" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen">
      <View style={S.pageIntro}>
        <Text style={[S.sub, { color: theme.colors.secondaryText }]}>Understand your financial activity</Text>
      </View>
      <SelectField label="Reporting month" value={monthLabel(reportMonth)} options={monthOptions} onChange={setSelectedMonth} accessibilityLabel={`Reporting month, ${monthLabel(reportMonth)} selected`} leadingIcon="calendar" tone="purple" />
      <Section title="Financial Overview" />
      <Card style={S.reportSummary}>
        <Metric label="Income" value={money(income, f.symbol)} color={theme.colors.positive} accessibilityLabel={`${monthLabel(reportMonth)} income, ${accessibleMoney(income, f.currency)}`} />
        <Metric label="Expenses" value={money(spent, f.symbol)} color={theme.colors.danger} accessibilityLabel={`${monthLabel(reportMonth)} expenses, ${accessibleMoney(spent, f.currency)}`} />
        <Metric label="Net" value={money(net, f.symbol)} color={net < 0 ? theme.colors.danger : theme.colors.text} accessibilityLabel={`${monthLabel(reportMonth)} net, ${accessibleMoney(net, f.currency)}`} />
      </Card>
      {tx.length === 0 ? (
        <Empty
          text="No transactions yet"
          description={`Add your first income or expense to start building your ${monthLabel(reportMonth)} report.`}
          icon={ReceiptText}
          actionLabel="Add transaction"
          onAction={() => router.push("/(tabs)/add")}
        />
      ) : null}
      <Section title="Income vs Expenses" />
      <Card style={S.reportComparison} accessibilityLabel={`${monthLabel(reportMonth)} comparison. Income ${accessibleMoney(income, f.currency)}. Expenses ${accessibleMoney(spent, f.currency)}.`}>
        <View style={S.reportCompareRow}>
          <View style={S.reportCompareHeading}><Text style={[S.bodyText, { color: theme.colors.text }]}>Income</Text><Text style={[S.value, { color: theme.colors.text }]}>{money(income, f.symbol)}</Text></View>
          <Progress value={income / maxComparison * 100} label={`${monthLabel(reportMonth)} income comparison`} accessibilityValueText={`${Math.round(income / maxComparison * 100)} percent of the larger monthly total`} color={theme.colors.positive} compact />
        </View>
        <View style={S.reportCompareRow}>
          <View style={S.reportCompareHeading}><Text style={[S.bodyText, { color: theme.colors.text }]}>Expenses</Text><Text style={[S.value, { color: theme.colors.text }]}>{money(spent, f.symbol)}</Text></View>
          <Progress value={spent / maxComparison * 100} label={`${monthLabel(reportMonth)} expenses comparison`} accessibilityValueText={`${Math.round(spent / maxComparison * 100)} percent of the larger monthly total`} color={theme.colors.danger} compact />
        </View>
      </Card>
      <Section title="Spending by Category" />
      {cats.length ? <Card style={S.reportDonutCard} accessibilityLabel={`Spending breakdown for ${monthLabel(reportMonth)}`}>
        <DonutChart items={cats} total={spent} theme={theme} currency={f.currency} />
        <View style={S.reportDonutLegend}>{cats.map((item, index) => <View key={item.category} style={S.reportDonutLegendRow} accessibilityLabel={`${item.category}, ${money(item.amount, f.symbol)}, ${spent ? (item.amount / spent * 100).toFixed(1) : 0} percent`}><View style={[S.reportDonutSwatch, { backgroundColor: reportChartColors[index % reportChartColors.length] }]} /><Text style={[S.bodyText, { color: theme.colors.text, flex: 1 }]} numberOfLines={1}>{item.category}</Text><Text style={[S.caption, { color: theme.colors.secondaryText }]}>{spent ? (item.amount / spent * 100).toFixed(1) : "0.0"}%</Text></View>)}</View>
      </Card> : null}
      {cats.length ? <Card style={S.reportCategoryList}>
        {cats.map((item, index) => {
          const share = spent ? item.amount / spent * 100 : 0;
          const shareLabel = `${share.toFixed(share % 1 ? 1 : 0)}%`;
          const color = progressAccent(item.category, theme);
          return <View key={item.category} style={[S.reportCategory, index === cats.length - 1 && S.reportCategoryLast]} accessible accessibilityRole="text" accessibilityLabel={`${item.category}, ${accessibleMoney(item.amount, f.currency)}, ${shareLabel} of ${monthLabel(reportMonth)} expenses`}>
            <View style={S.reportCategoryHeading}>
              <View style={S.reportCategoryName}><CategoryIcon name={item.category} size={18} /><Text style={[S.cardTitle, { color: theme.colors.text, flexShrink: 1 }]}>{item.category}</Text></View>
              <View style={S.reportCategoryAmount}><Text style={[S.value, { color: theme.colors.text }]}>{money(item.amount, f.symbol)}</Text><Text style={[S.caption, { color: theme.colors.secondaryText }]}>{shareLabel}</Text></View>
            </View>
            <Progress value={share} label={`${item.category} share of ${monthLabel(reportMonth)} expenses`} accessibilityValueText={`${shareLabel} of spending`} color={color} compact />
          </View>;
        })}
      </Card> : <Empty text="No expenses this month" description="Category spending will appear here when you record an expense." icon={ReceiptText} actionLabel="Add transaction" onAction={() => router.push("/(tabs)/add")} />}
      <Section title="Financial Insights" />
      <Button title={exportingPdf ? "Preparing PDF..." : "Download PDF Report"} loading={exportingPdf} disabled={exportingPdf} onPress={exportPdf} accessibilityHint={`Creates a PDF report for ${monthLabel(reportMonth)}`} />
      <Card style={S.insightsCard}>
        {income > 0 ? <Text style={S.bodyText}>{income >= spent ? `Your income exceeded your expenses by ${money(income - spent, f.symbol)}.` : `Your expenses exceeded your income by ${money(spent - income, f.symbol)}.`}</Text> : null}
        {income > 0 && spent > 0 ? <Text style={S.bodyText}>Your expenses are {((spent / income) * 100).toFixed(1)}% of your income.</Text> : null}
        {largestCategory ? <Text style={S.bodyText}>{largestCategory.category} is your largest spending category at {money(largestCategory.amount, f.symbol)}.</Text> : null}
        {!income && !spent ? <Text style={S.caption}>Add income or expenses to see insights for this month.</Text> : null}
      </Card>
      <Section title="Budget Performance" action="View budgets" onPress={() => router.push("/(tabs)/budgets")} />
      {budgets.length ? <Card style={S.reportCategoryList}>
        {budgets.map(({ budget, budgetAmount, spent: budgetSpent, remaining, percent }, index) => {
          const over = remaining < 0;
          const state = over ? `Over budget by ${money(Math.abs(remaining), f.symbol)}` : `${money(remaining, f.symbol)} remaining`;
          const color = over ? theme.colors.danger : percent >= 80 ? theme.colors.warning : progressAccent(budget.category, theme);
          return <View key={budget.id} style={[S.reportCategory, index === budgets.length - 1 && S.reportCategoryLast]} accessible accessibilityRole="text" accessibilityLabel={`${budget.category} budget, ${accessibleMoney(budgetAmount, f.currency)} budget, ${accessibleMoney(budgetSpent, f.currency)} spent, ${state}, ${Math.round(percent)} percent used`}>
            <View style={S.reportCategoryHeading}>
              <View style={S.reportCategoryName}><CategoryIcon name={budget.category} size={18} /><View style={{ flexShrink: 1 }}><Text style={[S.cardTitle, { color: theme.colors.text }]}>{budget.category}</Text><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Budget {money(budgetAmount, f.symbol)}</Text></View></View>
              <Text style={[S.pct, { color }]}>{Math.round(percent)}% used</Text>
            </View>
            <Progress value={percent} label={`${budget.category} budget use for ${monthLabel(reportMonth)}`} accessibilityValueText={`${Math.round(percent)} percent used. ${money(budgetSpent, f.symbol)} spent of ${money(budgetAmount, f.symbol)} budget. ${state}.`} color={color} compact />
            <View style={S.reportCategoryHeading}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>{money(budgetSpent, f.symbol)} spent</Text><Text style={[S.caption, { color: over ? theme.colors.danger : theme.colors.secondaryText }]}>{state}</Text></View>
          </View>;
        })}
      </Card> : <Empty text="No budget for this month" description="Budgets for the selected month will appear here when available." actionLabel="View budgets" onAction={() => router.push("/(tabs)/budgets")} />}
      <Section title="Financial History" />
      {history.length ? history.map((entry) => <Pressable key={entry.month} accessibilityRole="button" accessibilityLabel={`${monthLabel(entry.month)} report. Income ${accessibleMoney(entry.income, f.currency)}; expenses ${accessibleMoney(entry.expenses, f.currency)}; net ${accessibleMoney(entry.net, f.currency)}. Select to view this month.`} accessibilityHint="Selects this month in Reports" onPress={() => setSelectedMonth(entry.month)} style={[S.historyMonthCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={S.row}><Text style={[S.cardTitle, { color: theme.colors.text }]}>{monthLabel(entry.month)}</Text><ChevronRight size={18} color={theme.colors.secondaryText} accessible={false} /></View>
        <View style={S.reportHistoryValues}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Income {money(entry.income, f.symbol)}</Text><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Expenses {money(entry.expenses, f.symbol)}</Text></View>
        <View style={S.reportHistoryValues}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Net {money(entry.net, f.symbol)}</Text><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Budget {money(entry.budget, f.symbol)}</Text></View>
      </Pressable>) : <Empty text="No historical reports" description="Previous months appear here when transactions or budgets are available." />}
    </Page>
  );
}
const plannerWeights = {
  Food: 25, Transport: 15, Bills: 15, Entertainment: 5, Shopping: 5, Health: 10,
  Savings: 20, "Emergency Fund": 15, Investment: 10, Rent: 30, Education: 10,
  "Debt Repayment": 20, Business: 15, "Personal Care": 8, Other: 5,
};
const OPTIONS = EXPENSE_CATEGORIES.map((category) => [category, plannerWeights[category]]);
export function PlannerScreen() {
  return (
    <Guard>
      <Planner />
    </Guard>
  );
}
function Planner() {
  const f = useFinance();
  const theme = useTheme();
  const [initialAvailable] = useState(() => String(f.profile?.monthly_income || ""));
  const [available, setAvailable] = useState(initialAvailable),
    [selected, setSelected] = useState([]),
    [plan, setPlan] = useState(null),
    [step, setStep] = useState(1),
    [formError, setFormError] = useState(""),
    [applyError, setApplyError] = useState(""),
    [applying, setApplying] = useState(false),
    router = useRouter();
  const applyingRef = useRef(false);
  const availableMinor = toMinorUnits(available, AMOUNT_DECIMAL_SEPARATOR);
  const plannedMinor = plan ? totalMinorUnits(plan.rows) : null;
  const remainingMinor = plan && plannedMinor !== null ? plan.totalMinor - plannedMinor : null;
  const specificRows = selected.filter((item) => item.mode === "specific");
  const specificMinorValues = specificRows.map((item) => toMinorUnits(item.amount, AMOUNT_DECIMAL_SEPARATOR));
  const specificTotalMinor = specificMinorValues.some((value) => value === null)
    ? null
    : totalMinorUnits(specificMinorValues.map((amountMinor) => ({ amountMinor })));
  const specificOverMinor = availableMinor !== null && specificTotalMinor !== null
    ? Math.max(specificTotalMinor - availableMinor, 0)
    : 0;
  const hasUnsavedPlannerState = available !== initialAvailable || step > 1 || selected.length > 0 || Boolean(plan);
  const exitPlanner = useCallback(() => {
    const leave = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/more");
    if (!hasUnsavedPlannerState) {
      leave();
      return;
    }
    Alert.alert("Leave Smart Planner?", "Your current plan has not been applied.", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: leave },
    ]);
  }, [hasUnsavedPlannerState, router]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      exitPlanner();
      return true;
    });
    return () => subscription.remove();
  }, [exitPlanner]));
  function toggle([name, weight]) {
    setSelected((x) =>
      x.some((c) => c.name === name)
        ? x.filter((c) => c.name !== name)
        : [...x, { name, weight, mode: "automatic", amount: "" }],
    );
  }
  function generate() {
    setFormError("");
    if (!availableMinor || availableMinor <= 0) {
      setFormError("Enter an available amount greater than zero.");
      return;
    }
    const result = allocatePlannerAmounts(availableMinor, selected, AMOUNT_DECIMAL_SEPARATOR);
    if (result.error === "no_categories") {
      setFormError("Select at least one category.");
      return;
    }
    if (result.error === "overallocated") {
      setFormError(`Your allocations are ${money(fromMinorUnits(result.overMinor), f.symbol)} over your available amount.`);
      return;
    }
    if (result.error === "invalid_amount") {
      setFormError(`Enter a valid amount for ${result.category}.`);
      return;
    }
    if (result.error) {
      setFormError("Check the available amount and category allocations, then try again.");
      return;
    }
    setPlan({
      total: fromMinorUnits(result.totalMinor),
      totalMinor: result.totalMinor,
      rows: result.rows.map((row) => ({
        ...row,
        amount: fromMinorUnits(row.amountMinor),
        amountInput: plannerInputFromMinor(row.amountMinor),
      })),
    });
    setApplyError("");
    setStep(4);
  }
  async function apply() {
    if (!plan || applying || applyingRef.current) return;
    const finalPlannedMinor = totalMinorUnits(plan.rows);
    if (finalPlannedMinor === null) return setApplyError("Enter a valid amount for every category.");
    if (finalPlannedMinor !== plan.totalMinor)
      return setApplyError(finalPlannedMinor > plan.totalMinor
        ? `Your allocations are ${money(fromMinorUnits(finalPlannedMinor - plan.totalMinor), f.symbol)} over your available amount.`
        : `Allocate the remaining ${money(fromMinorUnits(plan.totalMinor - finalPlannedMinor), f.symbol)} before applying this plan.`);
    setApplyError("");
    applyingRef.current = true;
    setApplying(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const oldIncome = f.transactions.find(
        (t) =>
          t.type === "Income" &&
          t.category === "Smart Planned Income" &&
          t.month === f.currentMonth &&
          t.currency === f.currency,
      );
      if (oldIncome) {
        await f.updateTransactionAmount(oldIncome.id, plan.total);
      } else
        await f.addTransaction({
          type: "Income",
          category: "Smart Planned Income",
          amount: plan.total,
          date,
          month: f.currentMonth,
        });
      for (const x of plan.rows) {
        const amount = fromMinorUnits(x.amountMinor);
        if (["Savings", "Emergency Fund"].includes(x.name) && amount > 0)
          await f.saveGoal({
            name:
              x.name === "Savings"
                ? "BudgetFlow Savings Plan"
                : "BudgetFlow Emergency Fund",
            type: x.name,
            targetAmount: amount,
            reuseExisting: true,
          });
        else if (amount > 0)
          await f.saveBudget({ category: x.name, amount });
      }
      if (f.onboardingStatus === "in_progress") {
        await f.saveOnboardingStatus("completed", f.currency);
        Alert.alert("Your plan is ready! 🎉", "BudgetFlow will help you stay on track throughout the month.", [{ text: "Go to Dashboard", onPress: () => router.replace("/") }]);
      } else {
        Alert.alert("Plan applied", "Income and budget allocations saved.");
        router.replace("/budgets");
      }
    } catch (e) {
      Alert.alert("Could not apply plan", e.message);
    } finally {
      applyingRef.current = false;
      setApplying(false);
    }
  }
  function startNewPlan() {
    setPlan(null);
    setSelected([]);
    setFormError("");
    setApplyError("");
    setStep(1);
  }
  const steps = ["Available", "Categories", "Priorities", "Plan"];
  return (
    <Page title="Smart Planner" back={exitPlanner} backLabel="Back to More" backHint="Returns to More. You will be asked before leaving an unapplied plan." keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={S.sub}>Let’s build a plan for your money.</Text>
        <Text style={S.caption}>Use your current currency and choose how to allocate the amount you have available.</Text>
      </View>
      <View
        style={S.stepper}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Planning step ${step} of 4: ${steps[step - 1]}`}
        accessibilityValue={{ min: 1, max: 4, now: step, text: `${step} of 4` }}
      >
        {steps.map((label, index) => (
          <View key={label} style={S.stepperItem}>
            <View
              style={[S.stepNumber, index + 1 <= step && S.stepNumberActive]}
            >
              <Text
                style={[
                  S.stepNumberText,
                  index + 1 <= step && S.stepNumberTextActive,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[S.stepLabel, index + 1 === step && S.stepLabelActive]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>
      {step === 1 && (
        <>
          <Section title="How much do you have?" />
          <Card>
            <PlannerAmountField
              label="Available money this month"
              value={available}
              onChangeText={(value) => { setAvailable(value); setFormError(""); }}
              onValidationError={setFormError}
              symbol={f.symbol}
              currency={f.currency}
              accessibilityLabel={`Available money, amount in ${currencyNames[f.currency] || f.currency}`}
              accessibilityHint="Enter a positive amount. Decimals up to two places are supported."
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <Text style={S.caption}>
              {f.profile?.monthly_income
                ? "Started with your monthly income from Financial Profile. You can adjust it for this plan."
                : "Enter the amount you want to allocate for this plan."}
            </Text>
          </Card>
          {formError ? <Text style={S.inlineError} accessibilityRole="alert">{formError}</Text> : null}
          <Button
            title="Continue"
            accessibilityLabel="Continue to choose categories"
            accessibilityHint="Moves to category selection"
            onPress={() => {
              const amount = toMinorUnits(available, AMOUNT_DECIMAL_SEPARATOR);
              if (amount === null || amount <= 0) {
                setFormError("Enter an amount greater than zero to continue.");
                return;
              }
              setFormError("");
              setStep(2);
            }}
          />
        </>
      )}
      {step === 2 && (
        <>
          <Section title="What do you need to cover?" />
          <Text style={S.caption}>Select the categories you want included. Suggested percentages guide automatic allocation.</Text>
          <Card>
            <View style={S.row}>
              <Text style={S.cardTitle}>Monthly needs and priorities</Text>
              <View style={S.row}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Select all planner categories"
                  onPress={() => {
                    setFormError("");
                    setSelected(
                      OPTIONS.map(([name, weight]) => ({
                        name,
                        weight,
                        mode: "automatic",
                        amount: "",
                      })),
                    );
                  }}
                  hitSlop={8}
                  style={S.plannerTextAction}
                >
                  <Text style={S.link}>Select all</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear planner categories"
                  onPress={() => { setSelected([]); setFormError(""); }}
                  hitSlop={8}
                  style={S.plannerTextAction}
                >
                  <Text style={S.link}>Clear</Text>
                </Pressable>
              </View>
            </View>
            {OPTIONS.map((option) => {
              const [name, weight] = option,
                chosen = selected.some((item) => item.name === name);
              return (
                <Pressable
                  key={name}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${name}, suggested ${weight} percent weighting`}
                  accessibilityHint="Select or remove this category from your plan"
                  accessibilityState={{ checked: chosen }}
                  style={[S.plannerOption, chosen && S.plannerOptionOn]}
                  onPress={() => { toggle(option); setFormError(""); }}
                >
                  <View style={S.rowStart}>
                    {
                      <View style={[S.checkBox, chosen && S.checkBoxOn]}>
                        {chosen && <Check size={14} color="#FFFFFF" />}
                      </View>
                    }
                    <CategoryIcon name={name} size={18} />
                    <Text style={S.cardTitle}>{name}</Text>
                  </View>
                  <Text style={S.caption}>{weight}%</Text>
                </Pressable>
              );
            })}
          </Card>
          <View style={S.row}>
            <Button title="Back" secondary onPress={() => setStep(1)} />
            <View style={{ flex: 1 }}>
              <Button
                title="Set amounts"
                onPress={() => {
                  if (!selected.length) {
                    setFormError("Select at least one category to continue.");
                    return;
                  }
                  setFormError("");
                  setStep(3);
                }}
              />
            </View>
          </View>
          {formError ? <Text style={S.inlineError} accessibilityRole="alert">{formError}</Text> : null}
        </>
      )}
      {step === 3 && (
        <>
          <Section title="Set your priorities" />
          <Text style={S.caption}>Keep automatic allocations or enter a specific amount for a category.</Text>
          <Card style={S.plannerTotalsCard} accessibilityLabel={`Available ${accessibleMoney(fromMinorUnits(availableMinor), f.currency)}. Specific allocations ${specificTotalMinor === null ? "include an invalid amount" : accessibleMoney(fromMinorUnits(specificTotalMinor), f.currency)}${specificOverMinor > 0 ? `, ${accessibleMoney(fromMinorUnits(specificOverMinor), f.currency)} over available` : ""}`}>
            <View style={S.plannerSummaryGrid}>
              <View style={S.plannerSummaryMetric}>
                <Text style={S.label}>AVAILABLE</Text>
                <Text style={S.plannerSummaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(fromMinorUnits(availableMinor), f.symbol)}</Text>
              </View>
              <View style={S.plannerSummaryMetric}>
                <Text style={S.label}>SPECIFIC AMOUNTS</Text>
                <Text style={S.plannerSummaryAmount} numberOfLines={1} adjustsFontSizeToFit>{specificTotalMinor === null ? "Check amounts" : money(fromMinorUnits(specificTotalMinor), f.symbol)}</Text>
              </View>
            </View>
            {selected.some((item) => item.mode === "automatic") ? (
              <Text style={S.caption}>Automatic categories split the remaining amount using their suggested weights.</Text>
            ) : null}
            {specificOverMinor > 0 ? (
              <Text style={[S.inlineError, { marginTop: 0 }]} accessibilityRole="alert">
                Your allocations are {money(fromMinorUnits(specificOverMinor), f.symbol)} over your available amount.
              </Text>
            ) : null}
          </Card>
          {selected.map((item) => (
            <Card key={item.name} style={S.adjustCard}>
              <View style={S.rowStart}>
                <CategoryIcon name={item.name} />
                <View>
                  <Text style={S.cardTitle}>{item.name}</Text>
                  <Text style={S.caption}>{item.weight}% suggested weight</Text>
                </View>
              </View>
              <View style={S.modeRow}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityLabel="Automatic allocation"
                  accessibilityState={{ selected: item.mode === "automatic" }}
                  style={[
                    S.modeChoice,
                    item.mode === "automatic" && S.modeChoiceOn,
                  ]}
                  onPress={() =>
                    {
                      setFormError("");
                      setSelected((xs) =>
                        xs.map((x) =>
                          x.name === item.name ? { ...x, mode: "automatic" } : x,
                        ),
                      );
                    }
                  }
                >
                  <Text
                    style={[
                      S.modeText,
                      item.mode === "automatic" && S.modeTextOn,
                    ]}
                  >
                    Automatic
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityLabel="Set a specific amount"
                  accessibilityState={{ selected: item.mode === "specific" }}
                  style={[
                    S.modeChoice,
                    item.mode === "specific" && S.modeChoiceOn,
                  ]}
                  onPress={() =>
                    {
                      setFormError("");
                      setSelected((xs) =>
                        xs.map((x) =>
                          x.name === item.name ? { ...x, mode: "specific" } : x,
                        ),
                      );
                    }
                  }
                >
                  <Text
                    style={[
                      S.modeText,
                      item.mode === "specific" && S.modeTextOn,
                    ]}
                  >
                    Set amount
                  </Text>
                </Pressable>
              </View>
              {item.mode === "specific" && (
                <PlannerAmountField
                  label={`${item.name} amount`}
                  value={item.amount}
                  onChangeText={(value) =>
                    {
                      setFormError("");
                      setSelected((xs) =>
                        xs.map((x) =>
                          x.name === item.name ? { ...x, amount: value } : x,
                        ),
                      );
                    }
                  }
                  onValidationError={() => setFormError("")}
                  symbol={f.symbol}
                  currency={f.currency}
                  accessibilityLabel={`${item.name} allocation amount in ${currencyNames[f.currency] || f.currency}`}
                  accessibilityHint={`Enter a specific amount for ${item.name}`}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              )}
            </Card>
          ))}
          <View style={S.row}>
            <Button title="Back" secondary onPress={() => setStep(2)} />
            <View style={{ flex: 1 }}>
              <Button title="Review plan" accessibilityHint="Calculate and review the category allocations" onPress={generate} />
            </View>
          </View>
          {formError ? <Text style={S.inlineError} accessibilityRole="alert">{formError}</Text> : null}
        </>
      )}
      {step === 4 && plan && (
        <>
          <Section title="Your Suggested Plan" />
          <Card style={S.plannerTotalsCard} accessibilityLabel={`Available ${accessibleMoney(plan.total, f.currency)}, planned ${plannedMinor === null ? "invalid allocation" : accessibleMoney(fromMinorUnits(plannedMinor), f.currency)}, ${remainingMinor === null ? "check category amounts" : remainingMinor < 0 ? `${accessibleMoney(fromMinorUnits(Math.abs(remainingMinor)), f.currency)} over available` : `${accessibleMoney(fromMinorUnits(remainingMinor), f.currency)} remaining`}`}>
            <View style={S.plannerSummaryGrid}>
              <View style={S.plannerSummaryMetric}>
                <Text style={S.label}>AVAILABLE</Text>
                <Text style={S.plannerSummaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(fromMinorUnits(plan.totalMinor), f.symbol)}</Text>
              </View>
              <View style={S.plannerSummaryMetric}>
                <Text style={S.label}>PLANNED</Text>
                <Text style={S.plannerSummaryAmount} numberOfLines={1} adjustsFontSizeToFit>{plannedMinor === null ? "Check amounts" : money(fromMinorUnits(plannedMinor), f.symbol)}</Text>
              </View>
              <View style={S.plannerSummaryMetric}>
                <Text style={S.label}>REMAINING</Text>
                <Text style={[S.plannerSummaryAmount, remainingMinor !== null && remainingMinor < 0 ? { color: theme.colors.danger } : null]} numberOfLines={1} adjustsFontSizeToFit>
                  {remainingMinor === null ? "Check amounts" : remainingMinor < 0 ? `-${money(fromMinorUnits(Math.abs(remainingMinor)), f.symbol)}` : money(fromMinorUnits(remainingMinor), f.symbol)}
                </Text>
              </View>
            </View>
          </Card>
          {remainingMinor !== null && remainingMinor < 0 ? (
            <Text style={S.inlineError} accessibilityRole="alert">
              Your allocations are {money(fromMinorUnits(Math.abs(remainingMinor)), f.symbol)} over your available amount.
            </Text>
          ) : remainingMinor !== null && remainingMinor > 0 ? (
            <Text style={S.caption} accessibilityRole="text">
              {money(fromMinorUnits(remainingMinor), f.symbol)} remains unallocated. Apply is available when allocations match the available amount.
            </Text>
          ) : null}
          {plan.rows.map((item) => {
            const amountInvalid = !Number.isSafeInteger(item.amountMinor) || item.amountMinor < 0;
            const share = plan.totalMinor > 0 && Number.isSafeInteger(item.amountMinor)
              ? (item.amountMinor / plan.totalMinor) * 100
              : 0;
            return (
          <Card key={item.name} style={S.plannerAllocationCard}>
            <View style={S.rowStart}>
              <CategoryIcon name={item.name} />
              <View style={{ flex: 1 }}>
                <Text style={S.cardTitle}>{item.name}</Text>
                <Text style={S.caption}>{money(fromMinorUnits(Number.isSafeInteger(item.amountMinor) ? item.amountMinor : 0), f.symbol)} suggested allocation</Text>
              </View>
            </View>
            <Progress
              value={share}
              label={`${item.name} share of available amount`}
              accessibilityValueText={`${share.toFixed(1)} percent of available amount`}
              color={progressAccent(item.name, theme)}
            />
            <PlannerAmountField
              label={`${item.name} allocation`}
              value={item.amountInput}
              onChangeText={(value) => {
                const amountMinor = toMinorUnits(value, AMOUNT_DECIMAL_SEPARATOR);
                setPlan((previous) => ({
                  ...previous,
                  rows: previous.rows.map((row) => row.name === item.name
                    ? { ...row, mode: "specific", amountInput: value, amountMinor }
                    : row),
                }));
                setApplyError("");
              }}
              symbol={f.symbol}
              currency={f.currency}
              accessibilityLabel={`${item.name} allocation, amount in ${currencyNames[f.currency] || f.currency}`}
              accessibilityHint={`Edit the suggested amount for ${item.name}`}
              error={amountInvalid ? "Enter a valid amount with up to two decimal places." : undefined}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </Card>
            );
          })}
          {applyError ? <Text style={S.inlineError} accessibilityRole="alert">{applyError}</Text> : null}
          <View style={S.row}>
            <Button title="Change priorities" secondary disabled={applying} onPress={() => {
              setSelected((items) => items.map((item) => {
                const row = plan.rows.find((candidate) => candidate.name === item.name);
                return row ? { ...item, mode: row.mode, amount: row.amountInput } : item;
              }));
              setApplyError("");
              setStep(3);
            }} />
            <View style={{ flex: 1 }}>
              <Button title="Apply plan" accessibilityHint="Save this plan using your existing budgets and goals" onPress={apply} disabled={applying || plannedMinor === null || remainingMinor !== 0} loading={applying} />
            </View>
          </View>
          <Button title="Create new plan" secondary disabled={applying} onPress={startNewPlan} />
        </>
      )}
    </Page>
  );
}
export function CompoundScreen() {
  return (
    <Guard>
      <Compound />
    </Guard>
  );
}
function Compound() {
  const [principal, setPrincipal] = useState(""),
    [monthly, setMonthly] = useState(""),
    [rate, setRate] = useState(""),
    [years, setYears] = useState(""),
    [frequency, setFrequency] = useState("Monthly"),
    [contributionFrequency, setContributionFrequency] = useState("Monthly"),
    [fieldErrors, setFieldErrors] = useState({}),
    [resultError, setResultError] = useState(""),
    [result, setResult] = useState(null),
    f = useFinance(),
    router = useRouter(),
    theme = useTheme();
  function setInput(field, value) {
    const setters = { principal: setPrincipal, contribution: setMonthly, rate: setRate, years: setYears };
    setters[field](value);
    setFieldErrors((errors) => ({ ...errors, [field]: undefined }));
    setResult(null);
    setResultError("");
  }
  function setDecimalInput(field, value) {
    const escapedSeparator = AMOUNT_DECIMAL_SEPARATOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`^\\d*(?:${escapedSeparator}\\d*)?$`).test(value)) {
      setFieldErrors((errors) => ({ ...errors, [field]: "Use digits and one decimal separator only." }));
      setResult(null);
      setResultError("");
      return;
    }
    setInput(field, value);
  }
  function calculate() {
    const numericText = (value) => AMOUNT_DECIMAL_SEPARATOR === "." ? value : String(value).replace(AMOUNT_DECIMAL_SEPARATOR, ".");
    const inputs = { principal: numericText(principal), monthlyContribution: numericText(monthly), interestRate: numericText(rate), years: numericText(years) };
    const errors = { ...validateCompoundInputs(inputs) };
    Object.entries(fieldErrors).forEach(([key, value]) => { if (value) errors[key] = value; });
    setFieldErrors(errors);
    setResultError("");
    if (Object.keys(errors).length) {
      setResult(null);
      return;
    }
    const estimate = calculateCompoundInterest({ ...inputs, frequency, contributionFrequency });
    if (Object.values(estimate).some((value) => !Number.isFinite(value))) {
      setResult(null);
      setResultError("These values exceed the calculator's supported numeric range. Try smaller amounts or a shorter period.");
      return;
    }
    setResult(estimate);
  }
  function reset() {
    setPrincipal(""); setMonthly(""); setRate(""); setYears("");
    setFrequency("Monthly"); setContributionFrequency("Monthly");
    setFieldErrors({}); setResultError(""); setResult(null);
    Keyboard.dismiss();
  }
  const contributionShare = result && result.futureValue > 0
    ? Math.max(0, Math.min(result.totalContributions / result.futureValue * 100, 100))
    : 0;
  const interestShare = result && result.futureValue > 0
    ? Math.max(0, Math.min(result.interestEarned / result.futureValue * 100, 100))
    : 0;
  return (
    <Page title="Compound Interest" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen" keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={[S.sub, { color: theme.colors.secondaryText }]}>See how your money could grow over time.</Text>
        <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Enter your investment details to estimate a possible future value.</Text>
      </View>
      <Section title="Investment details" />
      <Card style={S.compoundInputCard}>
        <View style={S.row}><Text style={[S.caption, { color: theme.colors.secondaryText }]}>Currency</Text><Text style={[S.cardTitle, { color: theme.colors.text }]}>{f.currency} ({f.symbol})</Text></View>
        <PlannerAmountField
          label="Initial investment"
          value={principal}
          onChangeText={(value) => setInput("principal", value)}
          onValidationError={(error) => { setFieldErrors((errors) => ({ ...errors, principal: error || undefined })); if (error) { setResult(null); setResultError(""); } }}
          symbol={f.symbol}
          currency={f.currency}
          error={fieldErrors.principal}
          accessibilityLabel={`Initial investment, amount in ${currencyNames[f.currency] || f.currency}`}
          accessibilityHint="Enter zero or more. Up to two decimal places are supported."
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <PlannerAmountField
          label="Contribution amount per period"
          value={monthly}
          onChangeText={(value) => setInput("contribution", value)}
          onValidationError={(error) => { setFieldErrors((errors) => ({ ...errors, contribution: error || undefined })); if (error) { setResult(null); setResultError(""); } }}
          symbol={f.symbol}
          currency={f.currency}
          error={fieldErrors.contribution}
          accessibilityLabel={`Contribution amount per period, amount in ${currencyNames[f.currency] || f.currency}`}
          accessibilityHint="Enter zero or more. Contribution timing is selected below."
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <Text style={[S.caption, { color: theme.colors.secondaryText }]}>This amount is added at the contribution frequency selected below.</Text>
      </Card>
      <Section title="Growth assumptions" />
      <Card style={S.compoundInputCard}>
        <Field
          label="Annual interest rate (%)"
          value={rate}
          onChangeText={(value) => setDecimalInput("rate", value)}
          keyboardType="decimal-pad"
          error={fieldErrors.rate}
          accessibilityLabel={`Annual interest rate, ${rate || "not entered"} percent`}
          accessibilityHint="Enter a non-negative annual percentage. The percent sign is not part of the value."
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Enter the annual rate as a number. For example, 10 means 10%.</Text>
        <Field
          label="Investment period (years)"
          value={years}
          onChangeText={(value) => setDecimalInput("years", value)}
          keyboardType="decimal-pad"
          error={fieldErrors.years}
          accessibilityLabel={`Investment period, ${years || "not entered"} years`}
          accessibilityHint="Enter a period greater than zero. Decimal years are supported."
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </Card>
      <Section title="Frequency" />
      <Card style={S.compoundInputCard}>
        <SelectField label="Compounding frequency" value={frequency} leadingIcon="compoundInterest" options={["Daily", "Weekly", "Monthly", "Yearly"].map((value) => ({ value, label: value }))} onChange={(value) => { setFrequency(value); setResult(null); setResultError(""); }} accessibilityLabel={`Compounding frequency, ${frequency}`} />
        <SelectField label="Contribution frequency" value={contributionFrequency} leadingIcon="savings" tone="teal" options={["Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"].map((value) => ({ value, label: value }))} onChange={(value) => { setContributionFrequency(value); setResult(null); setResultError(""); }} accessibilityLabel={`Contribution frequency, ${contributionFrequency}`} />
        <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Contributions are added at the end of each selected period; interest is applied first when both occur together.</Text>
        <Button
          title="Calculate"
          accessibilityLabel="Calculate compound interest estimate"
          accessibilityHint="Calculate the future value using the inputs above"
          onPress={calculate}
        />
        <Button title="Reset calculator" secondary accessibilityHint="Clears calculator inputs and results. It does not change your BudgetFlow financial records." onPress={reset} />
      </Card>
      {resultError ? <Text style={S.inlineError} accessibilityRole="alert">{resultError}</Text> : null}
      {result ? (
        <>
          <Section title="Estimated result" />
          <Card
            style={S.compoundResultHero}
            accessibilityLabel={`Estimated future value, ${accessibleMoney(result.futureValue, f.currency)}. This is a projection, not a guarantee.`}
          >
            <Text style={[S.compoundResultLabel, { color: theme.colors.heroText }]} accessible={false}>ESTIMATED FUTURE VALUE</Text>
            <Text style={[S.compoundResultAmount, { color: theme.colors.onPrimary }]} accessible={false} adjustsFontSizeToFit>{money(result.futureValue, f.symbol)}</Text>
            <Text style={[S.caption, { color: theme.colors.heroText }]}>A projection based on the assumptions you entered.</Text>
          </Card>
          <Card style={S.compoundResultDetails}>
            <Metric label="Your contributions" value={money(result.totalContributions, f.symbol)} accessibilityLabel={`Your contributions, ${accessibleMoney(result.totalContributions, f.currency)}`} />
            <Metric label="Interest earned" value={money(result.interestEarned, f.symbol)} color={theme.colors.positive} accessibilityLabel={`Interest earned, ${accessibleMoney(result.interestEarned, f.currency)}`} />
            <View accessible accessibilityRole="progressbar" accessibilityLabel="Estimated value composition" accessibilityValue={{ min: 0, max: 100, now: Math.round(contributionShare), text: `${Math.round(contributionShare)} percent contributions and ${Math.round(interestShare)} percent interest` }} style={[S.compoundCompositionTrack, { backgroundColor: theme.colors.border }]}>
              {contributionShare > 0 ? <View style={[S.compoundCompositionContribution, { width: `${contributionShare}%`, backgroundColor: theme.colors.primary }]} /> : null}
              {interestShare > 0 ? <View style={[S.compoundCompositionInterest, { width: `${interestShare}%`, backgroundColor: theme.colors.positive }]} /> : null}
            </View>
            <View style={S.compoundCompositionLegend}>
              <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Contributions {Math.round(contributionShare)}%</Text>
              <Text style={[S.caption, { color: theme.colors.secondaryText }]}>Interest {Math.round(interestShare)}%</Text>
            </View>
          </Card>
        </>
      ) : !resultError ? <Card><Text style={[S.bodyText, { color: theme.colors.secondaryText }]}>Your estimate will appear here after you enter the investment details and calculate.</Text></Card> : null}
    </Page>
  );
}
function sum(rows, type) {
  return rows
    .filter((t) => t.type === type)
    .reduce((a, t) => a + Number(t.amount || 0), 0);
}
function categorySpent(rows, budget, month, currency) {
  return budgetPerformance(rows, budget, month, currency).spent;
}
function cycleBalance(rows, month, currency) {
  const x = rows.filter(
    (t) =>
      t.currency === currency && (t.month || t.date?.slice(0, 7)) === month,
  );
  return sum(x, "Income") - sum(x, "Expense");
}
function monthLabel(m) {
  const [y, n] = m.split("-").map(Number);
  return new Date(y, n - 1, 1).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
}
const S = StyleSheet.create({
  header: {
    minHeight: CONTROL.minTouchTarget + SPACE.lg,
    paddingHorizontal: SPACE.page,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dashboardHeader: { minHeight: 56 },
  content: { paddingVertical: SPACE.lg, paddingBottom: SPACE.xxl, gap: SPACE.lg },
  dashboardContent: { paddingVertical: SPACE.md, paddingBottom: SPACE.xl, gap: SPACE.md },
  listContent: { flexGrow: 1, paddingHorizontal: COMPONENT.screenHorizontalPadding, paddingVertical: SPACE.lg, paddingBottom: SPACE.xxl },
  goalsListContent: { flexGrow: 1, paddingHorizontal: COMPONENT.screenHorizontalPadding, paddingTop: SPACE.md, paddingBottom: 72, gap: SPACE.lg },
  goalListHeader: { gap: SPACE.md },
  goalTopAddIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  goalIntroLead: { color: COLORS.text, fontSize: 16, fontWeight: TYPE.weight.semibold },
  goalIntroText: { ...TEXT.secondary, fontSize: 14, lineHeight: 21 },
  listContainer: { flex: 1, paddingHorizontal: 0, paddingVertical: 0, gap: 0 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  buttonSpacing: { marginTop: SPACE.xs },
  emptyCard: { alignItems: "center" },
  emptyState: { padding: 0 },
  sectionSpacing: { marginTop: SPACE.sm },
  progressSpacing: { marginVertical: SPACE.md },
  budgetUsageCopy: { alignItems: "flex-end", minWidth: 76 },
  budgetUsageState: { fontSize: TYPE.eyebrow, lineHeight: TYPE.lineHeight.caption, fontWeight: TYPE.weight.semibold, textAlign: "right" },
  field: { marginTop: SPACE.md },
  goalCard: { gap: SPACE.md, padding: SPACE.lg, borderRadius: RADIUS.card },
  goalHeading: { flex: 1, minWidth: 0, gap: SPACE.xs },
  budgetCategoryCopy: { flex: 1, minWidth: 0 },
  homeBudgetCard: { padding: SPACE.md, gap: SPACE.xs },
  homeBudgetProgress: { marginVertical: SPACE.xs },
  homeBudgetBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm, paddingTop: SPACE.xs },
  homeBudgetRemaining: { maxWidth: "48%", fontSize: 13, fontWeight: TYPE.weight.semibold, textAlign: "right", flexShrink: 1 },
  budgetWeeklySummary: { gap: SPACE.xs, marginTop: SPACE.sm, padding: SPACE.sm, borderWidth: 1, borderRadius: RADIUS.md },
  budgetWeeklyHeading: { fontSize: TYPE.small, fontWeight: TYPE.weight.bold },
  budgetWeeklyStatus: { fontSize: TYPE.caption, lineHeight: TYPE.lineHeight.caption, fontWeight: TYPE.weight.bold, textAlign: "right", flexShrink: 1 },
  budgetWeeklyDetail: { gap: SPACE.md },
  goalChevron: { minWidth: 32, minHeight: CONTROL.minTouchTarget, alignItems: "center", justifyContent: "center" },
  goalType: { ...TEXT.secondary, marginTop: SPACE.xs, fontSize: 14 },
  goalMetrics: { flexDirection: "row", gap: SPACE.lg, marginTop: SPACE.sm },
  goalMetric: { flex: 1, minWidth: 0, gap: SPACE.xs },
  goalCompletionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm },
  goalRemaining: { ...TEXT.secondary, flex: 1, minWidth: 0, fontSize: 14 },
  goalCompleteText: { ...TEXT.body, color: COLORS.positiveText, fontWeight: TYPE.weight.bold },
  goalFormCard: { gap: SPACE.md },
  goalCategorySelector: { minHeight: CONTROL.minTouchTarget + 4, flexDirection: "row", alignItems: "center", gap: SPACE.md, paddingHorizontal: SPACE.md, borderWidth: 1, borderRadius: RADIUS.md },
  goalCategoryOption: { minHeight: CONTROL.minTouchTarget + 4, flexDirection: "row", alignItems: "center", gap: SPACE.md, paddingHorizontal: SPACE.md, borderWidth: 1, borderRadius: RADIUS.md, marginVertical: SPACE.xs },
  goalReviewCard: { gap: SPACE.sm, backgroundColor: COLORS.mutedTint },
  goalAmountInput: { fontSize: 26, lineHeight: 32, fontWeight: TYPE.weight.heavy, color: COLORS.text },
  goalDetailSummary: { gap: SPACE.md },
  goalDetailIconRow: { flexDirection: "row", alignItems: "center", gap: SPACE.md },
  goalDetailSaved: { gap: SPACE.xs, padding: SPACE.md, borderRadius: RADIUS.md },
  goalDetailAmount: { ...TEXT.metricAmount },
  goalDetailAmounts: { flexDirection: "row", gap: SPACE.md },
  goalDetailMetric: { flex: 1, minWidth: 0, gap: SPACE.xs, padding: SPACE.md, borderRadius: RADIUS.md },
  goalDetailMetricAmount: { fontSize: 15, lineHeight: 21, fontWeight: TYPE.weight.bold },
  contributionFormCard: { gap: SPACE.md },
  contributionHistoryRow: { minHeight: CONTROL.minTouchTarget + SPACE.md, flexDirection: "row", alignItems: "center", gap: SPACE.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  contributionListRow: { flex: 1 },
  contributionAmount: { fontSize: 14, fontWeight: TYPE.weight.bold, color: COLORS.positiveText, textAlign: "right", flexShrink: 1 },
  inlineError: { ...TEXT.error, marginTop: SPACE.xs },
  hero: {
    overflow: "hidden",
    padding: SPACE.xl,
    borderRadius: RADIUS.card,
  },
  heroGlow: { position: "absolute", width: 230, height: 230, right: -98, bottom: -156, borderRadius: 115, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.035)" },
  balanceAmountRow: { flexDirection: "row", alignItems: "center", gap: SPACE.xs },
  balanceVisibility: { width: CONTROL.minTouchTarget, height: CONTROL.minTouchTarget, alignItems: "center", justifyContent: "center" },
  budgetSummaryCard: { gap: SPACE.sm },
  budgetSummaryLabel: { ...TEXT.cardTitle, color: COLORS.secondaryText },
  budgetSummaryAmount: {
    ...TEXT.financialAmount,
    color: COLORS.navy,
    marginVertical: SPACE.xs,
  },
  budgetSummaryMetrics: { gap: SPACE.sm, marginTop: SPACE.xs },
  budgetHistoryMonth: {
    ...TEXT.label,
    color: COLORS.secondaryText,
    marginHorizontal: SPACE.xs,
    marginBottom: SPACE.xs,
  },
  budgetDetailCard: { gap: SPACE.md },
  budgetDetailHeading: { flex: 1, gap: SPACE.xs },
  budgetDetailAmount: {
    ...TEXT.metricAmount,
    color: COLORS.navy,
    marginTop: SPACE.sm,
  },
  budgetDetailStats: { gap: SPACE.xs },
  editBudgetCard: { gap: SPACE.md },
  editCategory: {
    minHeight: CONTROL.inputHeight,
    justifyContent: "center",
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  heroLabel: {
    color: COLORS.heroText,
    ...TEXT.label,
    letterSpacing: 1.1,
  },
  heroAmount: {
    ...TEXT.financialAmount,
    color: COLORS.white,
    marginVertical: SPACE.xs,
    letterSpacing: -0.7,
  },
  heroMetric: {
    ...TEXT.sectionTitle,
    color: COLORS.white,
    marginTop: SPACE.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
  },
  rowStart: { flexDirection: "row", alignItems: "center", gap: SPACE.md, flex: 1 },
  half: { flex: 1, minHeight: 100, justifyContent: "center" },
  metric: { ...TEXT.metricAmount, marginTop: SPACE.sm, letterSpacing: -0.3 },
  label: { ...TEXT.label, letterSpacing: 0.15 },
  sub: { ...TEXT.secondary, marginBottom: SPACE.xs },
  caption: {
    ...TEXT.secondary,
    marginTop: SPACE.xs,
  },
  cardTitle: { ...TEXT.cardTitle },
  pct: { ...TEXT.label, color: COLORS.primary },
  dailyTarget: { ...TEXT.cardTitle },
  goalAmount: { ...TEXT.metricAmount },
  goalOf: { ...TEXT.secondary, fontWeight: "500" },
  currencyInput: {
    minHeight: 56,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "stretch",
  },
  currencySymbol: {
    minWidth: 62,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 10,
  },
  currencyTextInput: {
    flex: 1,
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  successMessage: {
    color: COLORS.positive,
    ...TEXT.success,
    lineHeight: TYPE.lineHeight.body,
    paddingVertical: SPACE.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyChip: {
    minWidth: 88,
    minHeight: CONTROL.minTouchTarget,
    paddingHorizontal: SPACE.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  value: { fontWeight: "800", fontSize: 14, color: COLORS.text },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: SPACE.md,
  },
  tx: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  txDot: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mutedTint,
  },
  transactionAmountCard: { paddingVertical: SPACE.xl },
  transactionAmountInput: { fontSize: 32, lineHeight: 40, fontWeight: "800", color: COLORS.navy },
  transactionDescriptionInput: { minHeight: 88, textAlignVertical: "top" },
  transactionFieldsCard: { gap: SPACE.lg },
  transactionReviewCard: { gap: SPACE.xs, paddingVertical: SPACE.md },
  transactionReviewType: { ...TEXT.label, marginTop: 0 },
  transactionReviewAmount: { ...TEXT.metricAmount, fontSize: 24, lineHeight: 30 },
  transactionAmount: { fontSize: 14, fontWeight: "800", textAlign: "right", flexShrink: 1 },
  budgetMatch: {
    minHeight: CONTROL.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.borderPurpleSoft,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.purpleTint,
  },
  budgetMatchCopy: { flex: 1, minWidth: 0 },
  budgetMatchState: { ...TEXT.label, color: COLORS.primary },
  budgetNoMatch: {
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  dateSelector: {
    minHeight: CONTROL.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
    paddingHorizontal: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
  },
  dateSelectorText: { ...TEXT.body, flexShrink: 1 },
  datePicker: {
    padding: SPACE.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  selectionMarker: { ...TEXT.label, color: COLORS.primary, fontSize: TYPE.small },
  typeButton: {
    flex: 1,
    minHeight: CONTROL.buttonHeight,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.mutedTint,
  },
  typeActive: { backgroundColor: COLORS.red },
  incomeActive: { backgroundColor: COLORS.positive },
  chip: {
    alignSelf: "flex-start",
    minHeight: CONTROL.minTouchTarget,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipOn: { backgroundColor: COLORS.purpleTint, borderColor: COLORS.borderPurpleSoft },
  link: { color: COLORS.primary, fontWeight: TYPE.weight.bold, paddingVertical: SPACE.sm },
  auth: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  authKeyboard: { flex: 1 },
  authContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACE.page,
  },
  authTitle: {
    ...TEXT.screenTitle,
    textAlign: "center",
    marginTop: SPACE.md,
  },
  authSub: {
    ...TEXT.secondary,
    textAlign: "center",
    marginTop: SPACE.xs,
    marginBottom: SPACE.sm,
  },
  authSubmit: { marginTop: SPACE.xl },
  googleAuthDivider: { flexDirection: "row", alignItems: "center", gap: SPACE.md, marginTop: SPACE.md, marginBottom: SPACE.sm },
  googleAuthRule: { height: 1, flex: 1 },
  googleAuthOr: { fontSize: TYPE.small, fontWeight: TYPE.weight.semibold },
  googleAuthButton: { minHeight: CONTROL.minTouchTarget + 4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.md, paddingHorizontal: SPACE.lg, borderWidth: 1, borderRadius: RADIUS.md },
  googleAuthText: { flex: 1, textAlign: "center", fontSize: TYPE.button, fontWeight: TYPE.weight.semibold },
  googleAuthTrailingSpace: { width: 20, height: 20 },
  authSwitch: { minHeight: CONTROL.minTouchTarget, padding: SPACE.lg, justifyContent: "center" },
  authSwitchText: { color: COLORS.primary, textAlign: "center", ...TEXT.cardTitle },
  monthPill: {
    alignSelf: "flex-start",
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    backgroundColor: COLORS.purpleTint,
  },
  monthPillText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  dashboardGreeting: { gap: SPACE.xs, marginBottom: SPACE.xs },
  headerIconAction: { width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: RADIUS.pill, backgroundColor: "transparent" },
  headerAvatarAction: { width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: RADIUS.pill, backgroundColor: "transparent" },
  dashboardAvatarImage: { width: 34, height: 34, borderRadius: 17 },
  dashboardAvatarFallback: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  dashboardAvatarInitials: { fontSize: 12, lineHeight: 16, fontWeight: TYPE.weight.bold },
  accountIdentityCard: { flexDirection: "row", alignItems: "center", gap: SPACE.md, padding: SPACE.md },
  accountAvatar: { width: 56, height: 56, borderRadius: 28 },
  accountAvatarFallback: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  accountAvatarInitials: { fontSize: 17, lineHeight: 22, fontWeight: TYPE.weight.bold },
  accountIdentityCopy: { flex: 1, minWidth: 0 },
  smartPlanIcon: { width: 36, height: 36, borderRadius: Math.round(36 * 0.29), alignItems: "center", justifyContent: "center" },
  smartPlanSparkle: { position: "absolute", top: 3, right: 3, backgroundColor: "transparent" },
  dashboardOverviewHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm, marginTop: SPACE.sm },
  dashboardOverviewTitle: { ...TEXT.sectionTitle, flexShrink: 1 },
  dashboardSmartPlanAction: { minHeight: CONTROL.minTouchTarget, flexDirection: "row", alignItems: "center", gap: SPACE.xs, paddingHorizontal: SPACE.sm, borderWidth: 1, borderRadius: RADIUS.md, flexShrink: 0 },
  dashboardSmartPlanText: { fontSize: TYPE.small, lineHeight: TYPE.lineHeight.caption, fontWeight: TYPE.weight.bold },
  onboardingContent: { flexGrow: 1, justifyContent: "center", padding: SPACE.page, gap: SPACE.lg },
  onboardingBrand: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.md },
  onboardingBrandText: { fontSize: 20, fontWeight: TYPE.weight.heavy },
  onboardingTitle: { fontSize: 28, lineHeight: 36, fontWeight: TYPE.weight.heavy },
  onboardingPromise: { fontSize: 19, lineHeight: 27, fontWeight: TYPE.weight.bold },
  onboardingCurrencyList: { gap: SPACE.sm },
  onboardingCurrencyOption: { minHeight: CONTROL.minTouchTarget, flexDirection: "row", alignItems: "center", gap: SPACE.md, padding: SPACE.md, borderWidth: 1.5, borderRadius: RADIUS.md },
  onboardingHighlights: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm },
  onboardingHighlight: { minWidth: "47%", flexGrow: 1, alignItems: "center", gap: SPACE.sm, padding: SPACE.md, borderWidth: 1, borderRadius: RADIUS.md },
  greetingTitle: { ...TEXT.sectionTitle, fontSize: 21 },
  profileAvatar: { width: 24, height: 24, borderRadius: 12 },
  segmentedToggle: { flexDirection: "row", padding: SPACE.xs, borderRadius: RADIUS.md, backgroundColor: COLORS.controlBackground },
  segmentedOption: { flex: 1, minHeight: CONTROL.minTouchTarget, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.sm },
  segmentedOptionSelected: { backgroundColor: COLORS.white },
  segmentedOptionText: { ...TEXT.label, color: COLORS.secondaryText },
  segmentedOptionTextSelected: { color: COLORS.primary },
  historyMonthCard: { gap: SPACE.sm, padding: SPACE.lg, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  selectBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.42)" },
  selectSheet: { maxHeight: "75%", padding: SPACE.lg, gap: SPACE.xs, borderTopLeftRadius: RADIUS.card, borderTopRightRadius: RADIUS.card, backgroundColor: COLORS.white },
  selectOption: { minHeight: CONTROL.minTouchTarget, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.md, paddingHorizontal: SPACE.md, borderRadius: RADIUS.md },
  currencyBadge: { width: 38, height: 38, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  currencyBadgeText: { fontSize: TYPE.small, fontWeight: "800" },
  categorySearch: { minHeight: CONTROL.minTouchTarget, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, marginBottom: SPACE.sm },
  goalDeleteAction: { marginTop: SPACE.xl, marginBottom: SPACE.xl },
  selectOptionSelected: { backgroundColor: COLORS.purpleTint },
  bodyText: { ...TEXT.body, lineHeight: TYPE.lineHeight.body },
  insightsCard: { gap: SPACE.md },
  chartCard: { gap: SPACE.md },
  chartLegend: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.md },
  chartLegendItem: { ...TEXT.label, color: COLORS.text },
  chartPeriod: { gap: SPACE.xs, paddingBottom: SPACE.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  chartLine: { minHeight: 24, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  chartKind: { width: 58, ...TEXT.label, color: COLORS.text },
  chartBar: { height: 12, minWidth: 0, borderRadius: RADIUS.pill },
  incomeBar: { backgroundColor: COLORS.positive },
  expenseBar: { backgroundColor: COLORS.primary },
  chartValue: { ...TEXT.secondary, flexShrink: 1 },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  changeIndicator: { minHeight: 18, flexDirection: "row", alignItems: "flex-start", gap: SPACE.xs, marginTop: 2, flexShrink: 1 },
  changeText: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16, fontWeight: TYPE.weight.semibold },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.overlayWhite12,
  },
  heroDivider: {
    height: 1,
    backgroundColor: COLORS.overlayWhite14,
    marginVertical: SPACE.lg,
  },
  heroStatDivider: {
    height: 32,
    width: 1,
    backgroundColor: COLORS.overlayWhite18,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE.md,
  },
  monthlySavingsCard: { flexDirection: "row", alignItems: "center", gap: SPACE.md },
  monthlySavingsCopy: { flex: 1, minWidth: 0, gap: SPACE.xs },
  monthlySavingsAmount: { fontSize: 18, lineHeight: 24, fontWeight: "800", color: COLORS.positive },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm },
  quickAction: { flexGrow: 1, flexBasis: "45%", minWidth: 128, minHeight: 64, flexDirection: "row", alignItems: "center", gap: SPACE.sm, padding: SPACE.sm, borderWidth: 1, borderRadius: RADIUS.md },
  quickActionText: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: TYPE.weight.bold },
  homeGoalPreview: { gap: SPACE.xs, padding: SPACE.md, borderWidth: 1, borderRadius: RADIUS.card },
  homeGoalHeading: { minHeight: CONTROL.minTouchTarget, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  homeGoalCopy: { flex: 1, minWidth: 0, gap: 2 },
  summaryCard: {
    flex: 1,
    minWidth: 140,
    gap: SPACE.xs,
    padding: SPACE.md,
  },
  summaryHeading: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryIdentity: { minWidth: 0, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  summaryLabel: { ...TEXT.label, color: COLORS.secondaryText },
  summaryAmount: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: COLORS.text,
    flexShrink: 1,
  },
  dailyHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dailyIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purpleTint,
  },
  dailyStats: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginTop: SPACE.xl },
  dailyStat: {
    flex: 1,
    minWidth: 96,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACE.sm,
    gap: 2,
  },
  dailyStatWide: {
    flex: 1,
    minWidth: 96,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACE.sm,
    gap: 2,
  },
  dailyLabel: { ...TEXT.label, fontSize: 9, lineHeight: 12 },
  dailyValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACE.xs,
  },
  cycleCopy: { flex: 1, minWidth: 0 },
  cycleValue: { flexDirection: "row", alignItems: "center", gap: SPACE.xs, maxWidth: "42%" },
  dailyNotice: {
    backgroundColor: COLORS.greenTint,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    marginTop: SPACE.md,
  },
  dailyNoticeDanger: { backgroundColor: COLORS.redTint },
  dailyNoticeReached: { backgroundColor: COLORS.purpleTint },
  dailyNoticeTitle: { color: COLORS.positive, fontSize: 13, fontWeight: "800" },
  alertCard: { backgroundColor: COLORS.redTint, borderColor: COLORS.borderDanger },
  alertTitle: { color: COLORS.danger, fontSize: 14, fontWeight: "800" },
  alertText: { color: COLORS.danger, fontSize: TYPE.caption, marginTop: SPACE.sm },
  pageIntro: { marginBottom: SPACE.xs },
  formIntro: { marginBottom: SPACE.xs },
  typeSwitcher: {
    flexDirection: "row",
    padding: SPACE.xs,
    gap: SPACE.xs,
    backgroundColor: COLORS.controlBackground,
    borderRadius: RADIUS.md,
  },
  typeOption: {
    minHeight: CONTROL.buttonHeight,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  expenseSelected: { backgroundColor: COLORS.white },
  incomeSelected: { backgroundColor: COLORS.white },
  typeOptionText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: "800",
  },
  categoryChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE.sm,
    marginTop: SPACE.sm,
  },
  categoryChoice: {
    minHeight: CONTROL.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  categoryChoiceOn: {
    borderColor: COLORS.borderPurple,
    backgroundColor: COLORS.purpleTint,
  },
  categoryChoiceText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.secondaryText,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginTop: SPACE.sm },
  categoryTile: { width: "48%", minHeight: 64, flexDirection: "row", alignItems: "center", gap: SPACE.sm, padding: SPACE.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  categoryTileSelected: { backgroundColor: COLORS.purpleTint, borderColor: COLORS.borderPurple },
  categoryChoiceTextSelected: { color: COLORS.text, fontWeight: "800", flex: 1 },
  accountActionCard: { paddingVertical: SPACE.xs },
  summaryIconIncome: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.greenTint },
  summaryIconExpense: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.redTint },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purpleTint,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE.sm,
    marginTop: SPACE.lg,
  },
  currencyChipOn: {
    borderColor: COLORS.borderPurple,
    backgroundColor: COLORS.purpleTint,
  },
  currencyCode: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  currencySymbolSmall: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  filterRow: { flexDirection: "row", gap: 4, marginBottom: 4 },
  filterText: { fontSize: 13, fontWeight: "700", color: COLORS.secondaryText },
  historyRow: { borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  historyActions: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purpleTint,
  },
  historyText: { flex: 1 },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.redTint,
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  stepperItem: { alignItems: "center", gap: 5, flex: 1 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.border,
  },
  stepNumberActive: { backgroundColor: COLORS.primary },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.secondaryText,
  },
  stepNumberTextActive: { color: COLORS.white },
  stepLabel: { fontSize: 10, fontWeight: "700", color: COLORS.secondaryText },
  stepLabelActive: { color: COLORS.primary },
  plannerOption: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  plannerTextAction: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: SPACE.xs,
  },
  plannerTotalsCard: { gap: SPACE.md },
  plannerSummaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm },
  plannerSummaryMetric: {
    flex: 1,
    minWidth: 82,
    gap: SPACE.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.mutedTint,
    padding: SPACE.sm,
  },
  plannerSummaryAmount: { fontSize: 15, lineHeight: 20, fontWeight: "800", color: COLORS.text },
  plannerAllocationCard: { gap: SPACE.md },
  plannerOptionOn: { backgroundColor: COLORS.noticeBackground },
  checkBox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  checkBoxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  adjustCard: { gap: 10 },
  modeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  modeChoice: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.mutedTint,
  },
  modeChoiceOn: {
    backgroundColor: COLORS.purpleTint,
    borderWidth: 1,
    borderColor: COLORS.borderPurpleStrong,
  },
  modeText: { fontSize: 13, fontWeight: "700", color: COLORS.secondaryText },
  modeTextOn: { color: COLORS.primary },
  planTotal: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  reportPeriod: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE.md,
  },
  reportPeriodLabel: {
    ...TEXT.label,
    color: COLORS.secondaryText,
  },
  reportPeriodTitle: {
    ...TEXT.cardTitle,
    color: COLORS.navy,
    marginTop: SPACE.xs,
  },
  reportSummary: { gap: SPACE.md },
  reportDonutCard: { alignItems: "center", gap: SPACE.lg },
  reportDonut: { width: 190, height: 190, alignItems: "center", justifyContent: "center" },
  reportDonutCenter: { position: "absolute", width: 112, alignItems: "center", gap: 2 },
  reportDonutTotal: { fontSize: TYPE.body, fontWeight: "800" },
  reportDonutLegend: { width: "100%", gap: SPACE.sm },
  reportDonutLegendRow: { minHeight: CONTROL.minTouchTarget, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  reportDonutSwatch: { width: 12, height: 12, borderRadius: 6 },
  reportComparison: { gap: SPACE.lg },
  reportCompareRow: { gap: SPACE.xs },
  reportCompareHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm },
  reportCategoryList: { gap: SPACE.sm },
  reportCategory: {
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  reportCategoryLast: { borderBottomWidth: 0 },
  reportCategoryHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm },
  reportCategoryName: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, flex: 1, minWidth: 0 },
  reportCategoryAmount: { alignItems: "flex-end", gap: 2 },
  reportHistoryValues: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: SPACE.sm },
  compoundInputCard: { gap: SPACE.md },
  compoundFrequencyOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE.sm,
  },
  compoundFrequencyChip: {
    marginRight: 0,
    flexGrow: 1,
    alignItems: "center",
  },
  compoundResultHero: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
    gap: SPACE.sm,
  },
  compoundResultLabel: {
    ...TEXT.label,
    color: COLORS.heroText,
  },
  compoundResultAmount: {
    ...TEXT.financialAmount,
    color: COLORS.white,
    alignSelf: "stretch",
    flexShrink: 1,
  },
  compoundResultDetails: { gap: SPACE.md },
  compoundCompositionTrack: { height: 14, flexDirection: "row", overflow: "hidden", borderRadius: RADIUS.pill, marginTop: SPACE.xs },
  compoundCompositionContribution: { height: "100%" },
  compoundCompositionInterest: { height: "100%" },
  compoundCompositionLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: SPACE.sm },
  settingsCurrencyCard: { gap: SPACE.sm },
  settingsCurrencyCode: {
    width: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.mutedTint,
  },
  settingsCurrencyCodeSelected: { backgroundColor: COLORS.purpleTint },
  settingsCurrencyCodeText: { ...TEXT.label, color: COLORS.secondaryText },
  settingsCurrencyCodeTextSelected: { color: COLORS.primary },
  settingsCurrencySelected: {
    minHeight: CONTROL.minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
  },
  settingsCurrencySelectedText: { ...TEXT.label, color: COLORS.primary },
  profileInfoCard: { gap: SPACE.md },
  profileIncome: { ...TEXT.financialAmount, color: COLORS.navy, marginTop: SPACE.xs },
});
