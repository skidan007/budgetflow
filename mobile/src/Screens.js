import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
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
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowDown,
  ArrowUpRight,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  Eye,
  EyeOff,
  Landmark,
  Minus,
  ReceiptText,
  Trash2,
  Wallet,
  WalletCards,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { announceAccessibility } from "../components/accessibility/announce";
import { analyzeMonthlyChange, monthlyChangeTone } from "./monthlyChange.mjs";
import { AMOUNT_DECIMAL_SEPARATOR, amountCursorForEdit, editedTextRange, formatEditableAmount, parseEditableAmount, validateEditableAmount } from "./amountInput.mjs";
import { ThemeScope, useTheme } from "./ThemeContext";
import { FunctionalIcon, functionalToneForName } from "../components/ui/FunctionalIcon";
import { FeatureRow } from "../components/ui/FeatureRow";
import { AppIcon } from "../components/icons";
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
import { COLORS, FUNCTIONAL_ICON_TONES, SPACE, RADIUS, TYPE, TEXT, CONTROL, COMPONENT, SHADOW } from "./theme";

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
  keyboardAvoiding = false,
}) {
  return (
    <ScreenContainer
      header={<AppHeader title={title} onBack={back} backLabel={backLabel} backHint={backHint} rightAction={rightAction} rightActions={rightActions} style={S.header} />}
      scroll={scroll}
      keyboardAvoiding={keyboardAvoiding}
      edges={back ? ["top", "bottom", "left", "right"] : ["top", "left", "right"]}
      contentStyle={scroll ? S.content : S.listContainer}
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
function SelectField({ label, value, options, onChange, accessibilityLabel = label, leadingIcon, tone }) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  return (
    <View style={S.field}>
      <Label>{label}</Label>
      <Pressable accessibilityRole="button" accessibilityLabel={`${accessibilityLabel}, ${value}`} accessibilityHint="Opens available options" onPress={() => setOpen(true)} style={[S.dateSelector, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
        {leadingIcon ? <FunctionalIcon name={leadingIcon} tone={tone} containerSize={36} size={17} /> : null}
        <Text style={[S.dateSelectorText, leadingIcon && S.selectValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
        <ChevronDown size={18} color={colors.accentText} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[S.selectBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <View style={[S.selectSheet, { backgroundColor: colors.card }]} accessibilityRole="radiogroup" accessibilityLabel={label}>
            <Text accessibilityRole="header" style={[S.cardTitle, { color: colors.text }]}>{label}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option.value === value;
              return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ selected }} onPress={() => { onChange(option.value); setOpen(false); }} style={[S.selectOption, selected && S.selectOptionSelected, { backgroundColor: selected ? colors.purpleTint : "transparent" }]}>
                <Text style={[S.bodyText, { color: colors.text }]}>{option.label}</Text>{selected ? <Check size={18} color={colors.accentText} /> : null}
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
const CATEGORY_ICONS = {
  food: "food",
  transport: "transport",
  bills: "bills",
  entertainment: "entertainment",
  shopping: "shopping",
  business: "business",
  travel: "travel",
  laptop: "laptop",
  "emergency fund": "emergencyFund",
  health: "health",
  education: "education",
  rent: "home",
  housing: "home",
  savings: "savings",
  investment: "savings",
  salary: "income",
  income: "income",
  expense: "expenses",
};
function CategoryIcon({ name, size = 20, tint = C.purple }) {
  const normalized = String(name || "").trim().toLowerCase();
  const iconName = CATEGORY_ICONS[normalized] || "balance";
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
  const label = `${goal?.name || ""} ${goal?.type || ""}`.toLowerCase();
  if (/emergency/.test(label)) return { icon: "emergencyFund", tone: "green" };
  if (/business/.test(label)) return { icon: "business", tone: "blue" };
  if (/house|home|property/.test(label)) return { icon: "home", tone: "pink" };
  if (/vacation|travel|trip|holiday/.test(label)) return { icon: "travel", tone: "orange" };
  if (/car|vehicle|transport/.test(label)) return { icon: "transport", tone: "purple" };
  if (/education|school|tuition/.test(label)) return { icon: "education", tone: "teal" };
  if (/laptop|computer|device/.test(label)) return { icon: "laptop", tone: "indigo" };
  if (/investment/.test(label)) return { icon: "compoundInterest", tone: "teal" };
  if (/health|medical/.test(label)) return { icon: "health", tone: "red" };
  if (/saving/.test(label)) return { icon: "savings", tone: "green" };
  return { icon: "savings", tone: "teal" };
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

export function AuthScreen() {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const router = useRouter();
  async function submit() {
    if (submittingRef.current) return;
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
      <View style={S.logo}>
        <Wallet color="white" size={28} />
      </View>
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
          disabled={busy}
          loading={busy}
        />
      </View>
      <Pressable
        onPress={() => setSignup(!signup)}
        accessibilityRole="button"
        accessibilityLabel={signup ? "Switch to sign in" : "Create a BudgetFlow account"}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
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
  const { f, waiting, auth } = useData(),
    focused = useRef(false),
    refresh = f.refresh,
    userId = f.user?.id;
  useFocusEffect(
    useCallback(() => {
      if (focused.current && userId) refresh();
      focused.current = true;
    }, [refresh, userId]),
  );
  if (waiting)
    return (
      <ScreenContainer
        edges={["top", "bottom", "left", "right"]}
        contentStyle={S.loadingContainer}
      >
        <LoadingState label="Loading your finances..." />
      </ScreenContainer>
    );
  if (auth) return <AuthScreen />;
  if (f.error)
    return (
      <Page title="Connection issue">
        <ErrorState title={errorTitle} description={errorDescription} onRetry={refresh} />
      </Page>
    );
  return children;
}
export function HomeScreen() {
  return (
    <Guard>
      <Home />
    </Guard>
  );
}
function ChangeIndicator({ metric, analysis }) {
  const { colors } = useTheme();
  const tone = monthlyChangeTone(metric, analysis.direction);
  const color = tone === "positive" ? colors.positive : tone === "danger" ? colors.danger : colors.secondaryText;
  const DirectionIcon = analysis.direction === "up" ? ArrowUp : analysis.direction === "down" ? ArrowDown : analysis.direction === "same" ? Minus : null;
  return (
    <View accessibilityRole="text" accessibilityLabel={analysis.spoken} style={S.changeIndicator}>
      {DirectionIcon ? <DirectionIcon size={15} color={color} strokeWidth={2.6} accessible={false} /> : null}
      <Text style={[S.changeText, { color }]} numberOfLines={2}>{analysis.label}</Text>
    </View>
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
    dayOfMonth = Number(today.slice(-2)),
    futureDays = Math.max(days - dayOfMonth, 1),
    tomorrowTarget =
      Math.max(monthlyRemaining - Math.max(dailyRemaining, 0), 0) / futureDays;
  const currentGoals = f.goals.filter((goal) => goal.currency === f.currency);
  const netSavings = inc - spent;
  const metadata = f.user?.user_metadata || {};
  const displayName = metadata.full_name || metadata.name || f.user?.email?.split("@")[0] || "there";
  const avatarUrl = metadata.avatar_url || metadata.picture;
  return (
    <Page
      title="BudgetFlow"
      rightActions={[
        { label: "Notifications", hint: "Notifications are not available in mobile yet", icon: <AppIcon name="notifications" color={theme.colors.text} />, onPress: () => Alert.alert("Notifications", "Notifications are not available in the mobile app yet.") },
        { label: "Profile", hint: "View your account profile", icon: avatarUrl ? <Image source={{ uri: avatarUrl }} style={S.profileAvatar} /> : <AppIcon name="profile" color={theme.colors.text} />, onPress: () => router.push("/profile") },
      ]}
    >
      <View style={S.monthPill}>
        <CalendarDays size={16} color={theme.colors.accentText} accessible={false} />
        <Text style={S.monthPillText}>
          {monthLabel(f.currentMonth)}
        </Text>
      </View>
      <View style={S.dashboardGreeting}>
        <Text accessibilityRole="header" style={S.greetingTitle}>{`${new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, ${displayName}.`}</Text>
        <Text style={S.sub}>Here&apos;s your financial overview.</Text>
        <Text style={S.caption}>Currency: {f.currency}</Text>
      </View>
      <Card style={[S.hero, { backgroundColor: theme.isDark ? "#352DA0" : "#5143C7", borderColor: theme.isDark ? "#5145D5" : "#5143C7" }]}>
        <View pointerEvents="none" style={S.heroGlow} />
        <View style={S.heroTop}>
          <View>
            <Text style={S.heroLabel} accessible={false}>TOTAL BALANCE</Text>
            <View style={S.balanceAmountRow}>
              <Text style={S.heroAmount} accessibilityLabel={balanceVisible ? `Total balance, ${accessibleMoney(inc - spent, f.currency)}` : "Total balance hidden"}>{balanceVisible ? money(inc - spent, f.symbol) : "••••••"}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={balanceVisible ? "Hide total balance" : "Show total balance"} accessibilityHint="Toggles whether your total balance is visible" onPress={() => setBalanceVisible((visible) => !visible)} style={S.balanceVisibility}>
                {balanceVisible ? <Eye size={19} color="#FFFFFF" /> : <EyeOff size={19} color="#FFFFFF" />}
              </Pressable>
            </View>
          </View>
          <View style={S.balanceIcon}>
            <Wallet size={21} color="#FFFFFF" accessible={false} />
          </View>
        </View>
        <ChangeIndicator metric="balance" analysis={balanceChange} />
      </Card>
      <Section title="Monthly Overview" />
      <View style={S.summaryGrid}>
        <Card style={S.summaryCard} accessibilityLabel={`Income, ${accessibleMoney(inc, f.currency)}. ${incomeChange.spoken}${inc === 0 ? ". No income recorded this month." : ""}`}>
          <View style={S.summaryHeading}>
            <View style={S.summaryIdentity}>
              <FunctionalIcon name="income" containerSize={40} size={18} />
              <Text style={S.summaryLabel}>Income</Text>
            </View>
            <ChevronRight size={21} color={theme.colors.accentText} accessible={false} />
          </View>
          <Text style={S.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(inc, f.symbol)}</Text>
          <ChangeIndicator metric="income" analysis={incomeChange} />
          {inc === 0 && <Text style={S.caption}>No income recorded this month.</Text>}
        </Card>
        <Card style={S.summaryCard} accessibilityLabel={`Expenses, ${accessibleMoney(spent, f.currency)}. ${expensesChange.spoken}`}>
          <View style={S.summaryHeading}>
            <View style={S.summaryIdentity}>
              <FunctionalIcon name="expenses" tone="red" containerSize={40} size={18} />
              <Text style={S.summaryLabel}>Expenses</Text>
            </View>
            <ChevronRight size={21} color={theme.colors.accentText} accessible={false} />
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
          <View style={S.dailyStat}>
            <FunctionalIcon name="goals" tone="purple" containerSize={34} size={17} />
            <Text style={S.dailyLabel}>TODAY&apos;S TARGET</Text>
            <Text style={S.dailyValue} numberOfLines={1} adjustsFontSizeToFit>{money(dailyTarget, f.symbol)}</Text>
          </View>
          <View style={S.dailyStat}>
            <FunctionalIcon name="expenses" tone="red" containerSize={34} size={17} />
            <Text style={S.dailyLabel}>SPENT TODAY</Text>
            <Text style={S.dailyValue} numberOfLines={1} adjustsFontSizeToFit>{money(spentToday, f.symbol)}</Text>
          </View>
          <View style={S.dailyStatWide}>
            <FunctionalIcon name={dailyRemaining < 0 ? "expenses" : "history"} tone={dailyRemaining < 0 ? "red" : "orange"} containerSize={34} size={17} />
            <Text style={S.dailyLabel}>{dailyRemaining < 0 ? "OVERSPENT TODAY" : "REMAINING TODAY"}</Text>
            <Text style={S.dailyValue} numberOfLines={1} adjustsFontSizeToFit>{money(Math.abs(dailyRemaining), f.symbol)}</Text>
          </View>
        </View>
        <View
          accessible
          accessibilityLabel={dailyRemaining < 0
            ? `You overspent today by ${accessibleMoney(Math.abs(dailyRemaining), f.currency)}. New daily target from tomorrow: ${accessibleMoney(tomorrowTarget, f.currency)}`
            : dailyRemaining === 0
              ? "Today's target reached"
              : "You're on track"}
          style={[S.dailyNotice, dailyRemaining < 0 && S.dailyNoticeDanger, dailyRemaining === 0 && S.dailyNoticeReached]}
        >
          <Text style={[S.dailyNoticeTitle, dailyRemaining < 0 && { color: C.red }]}>
            {dailyRemaining < 0
              ? `You overspent today by ${money(Math.abs(dailyRemaining), f.symbol)}`
              : dailyRemaining === 0
                ? "Today's target reached"
                : "You're on track"}
          </Text>
          {dailyRemaining < 0 && (
            <Text style={S.caption}>New daily target from tomorrow: {money(tomorrowTarget, f.symbol)}</Text>
          )}
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
            <ChevronRight size={20} color={theme.colors.tabInactive} accessible={false} />
          </View>
        </View>
        {previous > 0 && f.cycle?.status !== "completed" && (
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
      style={({ pressed }) => [S.quickAction, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, pressed && { opacity: 0.78 }]}
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
    visual = goalIcon.icon === "savings" ? { icon: "goals", tone: "purple" } : goalIcon,
    progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const accessibleGoal = `${goal.name}, ${accessibleMoney(goal.currentAmount, goal.currency)} saved of ${accessibleMoney(goal.targetAmount, goal.currency)}, ${Math.round(progress)} percent complete`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibleGoal}
      accessibilityHint="Opens this goal's details"
      onPress={() => router.push(`/goal/${goal.id}`)}
      style={({ pressed }) => [S.homeGoalPreview, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }, pressed && { opacity: 0.82 }]}
    >
      <View style={S.homeGoalHeading}>
        <FunctionalIcon {...visual} containerSize={40} size={19} />
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
        color={FUNCTIONAL_ICON_TONES[visual.tone]?.[theme.themeName]?.foreground || theme.colors.primary}
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
          ? `${budget.category} budget, ${usageState}, ${Math.round(pct)} percent used, ${accessibleMoney(spent, f.currency)} spent of ${accessibleMoney(budget.amount, f.currency)}, ${remain < 0 ? `${accessibleMoney(Math.abs(remain), f.currency)} over budget` : `${accessibleMoney(remain, f.currency)} remaining`}`
          : undefined
      }
      accessibilityHint={
        detail ? "Opens budget details and spending history" : undefined
      }
      style={({ pressed }) => (pressed && detail ? { opacity: 0.9 } : null)}
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
  const months = [...new Set(f.budgets.filter((b) => b.currency === f.currency).map((b) => b.month).filter(Boolean))].sort((a, b) => b.localeCompare(a));
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
      <View style={S.segmentedToggle} accessibilityRole="radiogroup" accessibilityLabel="Budget period view">
        {["ongoing", "history"].map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityLabel={item === "ongoing" ? "Ongoing budgets" : "Budget history"} accessibilityState={{ selected: view === item }} style={[S.segmentedOption, view === item && S.segmentedOptionSelected]} onPress={() => { setView(item); setSelectedMonth(null); }}><Text style={[S.segmentedOptionText, view === item && S.segmentedOptionTextSelected]}>{item.toUpperCase()}</Text></Pressable>)}
      </View>
      {activeView === "ongoing" ? <Section title="Ongoing budgets" /> : <Section title="Budget History" />}
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
      }) : <Empty text="No budget history" description="Monthly budgets will appear here when available." />)}
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
    [category, setCategory] = useState("Food"),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [desc, setDesc] = useState(""),
    [notice, setNotice] = useState(""),
    [errors, setErrors] = useState({}),
    [submitting, setSubmitting] = useState(false),
    [showDatePicker, setShowDatePicker] = useState(false),
    [amountFocused, setAmountFocused] = useState(false);
  const submittingRef = useRef(false);
  const amountSelectionRef = useRef({ start: 0, end: 0 });
  const amountDisplay = money(amount, "", { editing: true });
  useFocusEffect(useCallback(() => {
    if (requestedType === "Income" || requestedType === "Expense") {
      setType(requestedType);
      setCategory(requestedType === "Income" ? "Salary" : "Food");
    }
  }, [requestedType]));
  const categories =
    type === "Expense"
      ? ["Food", "Transport", "Bills", "Shopping", "Health", "Entertainment"]
      : ["Salary", "Business", "Investment", "Other"];
  const matchingBudget = type === "Expense"
    ? f.budgets.find((budget) => budget.category === category && budget.currency === f.currency && budget.month === date.slice(0, 7))
    : null;
  async function save() {
    if (submittingRef.current) return;
    const nextErrors = {};
    const amountError = errors.amount || validateEditableAmount(amount);
    if (amountError) nextErrors.amount = amountError;
    if (!category.trim()) nextErrors.category = "Select a category.";
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
        category,
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
            onPress={() => { Keyboard.dismiss(); setType("Expense"); setCategory("Food"); setErrors((current) => ({ ...current, category: undefined })); }}
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
            <Label>Choose category</Label>
            <View style={S.categoryGrid} accessibilityRole="radiogroup" accessibilityLabel="Transaction category">
              {categories.map((item) => {
                const iconName = CATEGORY_ICONS[item.toLowerCase()] || "balance";
                const selected = category === item;
                return <Pressable key={item} accessibilityRole="radio" accessibilityLabel={`${item} category${selected ? ", selected" : ""}`} accessibilityHint="Selects this transaction category" accessibilityState={{ selected }} onPress={() => { Keyboard.dismiss(); setCategory(item); if (errors.category) setErrors((current) => ({ ...current, category: undefined })); }} style={[S.categoryTile, selected && { backgroundColor: theme.colors.purpleTint, borderColor: theme.colors.borderPurple }]}>
                  <FunctionalIcon name={iconName} tone={functionalToneForName(item)} containerSize={40} size={18} />
                  <Text style={[S.categoryChoiceText, selected && S.categoryChoiceTextSelected]}>{item}</Text>
                  {selected ? <Check size={18} color={theme.colors.accentText} accessible={false} /> : null}
                </Pressable>;
              })}
            </View>
          </View>
          {errors.category ? <Text accessibilityRole="alert" style={S.inlineError}>{errors.category}</Text> : null}
          {type === "Expense" && (
            <View style={S.field}>
              <Label>Budget</Label>
              {matchingBudget ? (
                <View accessible accessibilityLabel={`${category} budget, ${money(matchingBudget.amount, f.symbol)}, expenses for ${monthLabel(date.slice(0, 7))} are counted in this budget`} style={S.budgetMatch}>
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
            <Card style={S.transactionReviewCard} accessibilityLabel={`${type}, ${money(amount, f.symbol)}, ${category}, ${formatDateLabel(date)}${matchingBudget ? `, ${matchingBudget.category} budget` : type === "Expense" ? ", no budget available" : ""}`}>
              <View style={S.row}>
                <Text style={[S.caption, { color: theme.colors.secondaryText, marginTop: 0 }]}>Review transaction</Text>
                <Text style={[S.transactionReviewType, { color: theme.colors.accentText }]}>{type}</Text>
              </View>
              <Text style={[S.transactionReviewAmount, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{money(amount, f.symbol)}</Text>
              <Text style={[S.caption, { color: theme.colors.secondaryText }]}>{category} · {formatDateLabel(date)}{matchingBudget ? ` · ${matchingBudget.category} budget` : type === "Expense" ? " · No budget available" : ""}</Text>
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
    [name, setName] = useState(""),
    [target, setTarget] = useState(""),
    [type, setType] = useState("Savings Goal"),
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
    if (!targetDate) nextErrors.targetDate = "Please select a target date.";
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
      setName("");
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
    <Page title="Goals" scroll={false} keyboardAvoiding rightAction={{
      label: "Create financial goal",
      hint: "Opens the goal creation form",
      icon: <View style={[S.goalTopAddIcon, { backgroundColor: theme.colors.primary }]}><AppIcon name="plus" color={theme.colors.onPrimary} size={21} strokeWidth={2.7} /></View>,
      onPress: () => setShow(true),
    }}>
      <FlatList
        data={goals}
        keyExtractor={(goal) => String(goal.id)}
        contentContainerStyle={S.goalsListContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={S.goalListHeader}>
            <View style={S.pageIntro}>
              <Text style={S.goalIntroLead}>Plan for what matters.</Text>
              <Text style={S.goalIntroText}>Track each goal and build progress through contributions.</Text>
            </View>
            {__DEV__ ? (
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
              style={S.createGoalButton}
            />
            {notice ? <Text style={S.successMessage} accessibilityRole="alert" accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}>{notice}</Text> : null}
            {show && (
              <Card style={S.goalFormCard}>
                <Text accessibilityRole="header" style={S.cardTitle}>Create a goal</Text>
                <Field
                  label="Goal name"
                  value={name}
                  onChangeText={(value) => { setName(value); if (errors.name) setErrors((current) => ({ ...current, name: undefined })); }}
                  placeholder="Emergency fund"
                  error={errors.name}
                />
                <Field
                  label="Goal type"
                  value={type}
                  onChangeText={setType}
                  placeholder="Savings goal"
                />
                <CurrencyField
                  label="Target amount"
                  value={target}
                  onChangeText={(value) => { setTarget(value); if (errors.target) setErrors((current) => ({ ...current, target: undefined })); }}
                  symbol={f.symbol}
                  inputStyle={S.goalAmountInput}
                  error={errors.target}
                  accessibilityHint="Enter a target greater than zero"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <DatePickerField
                  label="Target date"
                  value={targetDate}
                  onChange={(value) => { setTargetDate(value); if (errors.targetDate) setErrors((current) => ({ ...current, targetDate: undefined })); }}
                  error={errors.targetDate}
                />
                <Button title="Save Goal" accessibilityLabel="Save goal" onPress={save} disabled={submitting} loading={submitting} />
              </Card>
            )}
          </View>
        )}
        ListEmptyComponent={!show ? (
          <Empty
            text="No goals yet"
            description="Create your first financial goal and start building toward it."
            icon={Landmark}
            actionLabel="Create Goal"
            onAction={() => setShow(true)}
          />
        ) : null}
        renderItem={({ item }) => <GoalCard goal={item} />}
      />
      {__DEV__ ? (
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
    visual = goalVisual(goal),
    pct = goal.targetAmount
      ? Math.max(0, Math.min((goal.currentAmount / goal.targetAmount) * 100, 100))
      : 0,
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
      accessibilityLabel={`${goal.name} goal, ${accessibleMoney(goal.currentAmount, f.currency)} saved of ${accessibleMoney(goal.targetAmount, f.currency)}, ${Math.round(pct)} percent complete, ${remaining === 0 ? "goal complete" : `${accessibleMoney(remaining, f.currency)} remaining`}${goal.targetDate ? `, target date ${formatDateLabel(goal.targetDate)}` : ""}`}
      accessibilityHint="Opens goal details and contribution history"
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
    >
      <Card style={S.goalCard}>
        <View style={S.row}>
          <View style={S.rowStart}>
            <FunctionalIcon {...visual} containerSize={52} size={23} />
            <View style={S.goalHeading}>
              <Text style={S.cardTitle} numberOfLines={2}>{goal.name}</Text>
              <Text style={S.goalType}>{goal.type}</Text>
            </View>
          </View>
          <View style={S.goalChevron} accessible={false}>
            <ChevronRight color={theme.colors.secondaryText} size={21} />
          </View>
        </View>
        <View style={S.goalMetrics}>
          <View style={S.goalMetric}>
            <Text style={S.label}>SAVED</Text>
            <Text style={S.goalAmount} numberOfLines={1} adjustsFontSizeToFit>{money(goal.currentAmount, f.symbol)}</Text>
          </View>
          <View style={S.goalMetric}>
            <Text style={S.label}>TARGET</Text>
            <Text style={S.goalAmount} numberOfLines={1} adjustsFontSizeToFit>{money(goal.targetAmount, f.symbol)}</Text>
          </View>
        </View>
        <View style={S.goalCompletionRow}>
          <Text style={S.goalRemaining}>
            {remaining === 0 ? "Goal completed" : `${money(remaining, f.symbol)} remaining`}
          </Text>
          <Text style={[S.goalCompletion, { color: accent }]}>{Math.round(pct)}% complete</Text>
        </View>
        <Progress value={pct} label={`${goal.name} progress`} accessibilityValueText={`${Math.round(pct)} percent complete`} color={accent} />
        {goal.targetDate ? <Text style={S.caption}>Target date · {formatDateLabel(goal.targetDate)}</Text> : null}
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
    [notice, setNotice] = useState(""),
    g = f.goals.find((x) => String(x.id) === String(id));
  const submittingRef = useRef(false);
  if (!g)
    return (
      <Page title="Goal details" back={backTo(router, "/(tabs)/goals")} backLabel="Back to Goals" backHint="Returns to the goal list">
        <Empty text="This goal could not be found." />
      </Page>
    );
  const pct = g.targetAmount
      ? Math.max(0, Math.min((g.currentAmount / g.targetAmount) * 100, 100))
      : 0,
    remaining = Math.max(Number(g.targetAmount) - Number(g.currentAmount), 0);
  const visual = goalVisual(g);
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
                <FunctionalIcon {...visual} containerSize={52} size={23} />
                <Text style={S.cardTitle} numberOfLines={2}>{g.name}</Text>
              </View>
              <View style={S.goalDetailSaved}>
                <Text style={S.label}>SAVED</Text>
                <Text style={S.goalDetailAmount} numberOfLines={1} adjustsFontSizeToFit>{money(g.currentAmount, f.symbol)}</Text>
              </View>
              <View style={S.goalDetailAmounts}>
                <View style={S.goalDetailMetric}>
                  <Text style={S.label}>TARGET</Text>
                  <Text style={S.goalDetailMetricAmount} numberOfLines={1} adjustsFontSizeToFit>{money(g.targetAmount, f.symbol)}</Text>
                </View>
                <View style={S.goalDetailMetric}>
                  <Text style={S.label}>{remaining === 0 ? "STATUS" : "REMAINING"}</Text>
                  <Text style={S.goalDetailMetricAmount} numberOfLines={2} adjustsFontSizeToFit>{remaining === 0 ? "Goal completed" : money(remaining, f.symbol)}</Text>
                </View>
              </View>
              <View style={S.row}>
                <Text style={[S.goalCompleteText, { color: goalAccent }]}>{Math.round(pct)}% complete</Text>
                {remaining === 0 ? <Check size={18} color={C.green} accessible={false} /> : null}
              </View>
              <Progress value={pct} label={`${g.name} progress`} accessibilityValueText={`${Math.round(pct)} percent complete`} color={goalAccent} />
              {g.targetDate ? <Text style={S.caption}>Target date · {formatDateLabel(g.targetDate)}</Text> : null}
            </Card>
            {remaining > 0 && !showContribution && (
              <Button title="Add Contribution" accessibilityLabel="Add contribution" onPress={() => setShowContribution(true)} />
            )}
            {showContribution && remaining > 0 && (
              <Card style={S.contributionFormCard}>
                <Text accessibilityRole="header" style={S.cardTitle}>Add Contribution</Text>
                <CurrencyField
                  label="Amount"
                  value={amount}
                  onChangeText={(value) => { setAmount(value); if (amountError) setAmountError(""); }}
                  symbol={f.symbol}
                  inputStyle={S.goalAmountInput}
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
      />
    </Page>
  );
}
export function MoreScreen() {
  return (
    <Guard>
      <More />
    </Guard>
  );
}
function More() {
  const router = useRouter(),
    f = useFinance();
  const groups = [
    {
      title: "Financial Tools",
      items: [
        ["Smart Planner", "Plan your money", "/planner", "planner"],
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
      <Button
        title="Sign out"
        variant="danger"
        accessibilityLabel="Sign out"
        accessibilityHint="Ends your current BudgetFlow session. Your financial data will remain saved."
        onPress={() => Alert.alert(
          "Sign out?",
          "You will need to sign in again to access BudgetFlow.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign out",
              style: "destructive",
              onPress: () => f.signOut().catch((e) => Alert.alert("Could not sign out", e.message)),
            },
          ],
        )}
      />
      </Card>
    </Page>
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
  const f = useFinance(),
    router = useRouter(),
    theme = useTheme(),
    currencies = [
      "NGN",
      "USD",
      "GBP",
      "EUR",
      "JPY",
      "CNY",
      "CAD",
      "AUD",
      "CHF",
    ];
  return (
    <Page title="Settings" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen">
      <View style={S.pageIntro}>
        <Text style={S.sub}>Manage your BudgetFlow preferences</Text>
        <Text style={S.caption}>Choose how financial amounts are shown in the app.</Text>
      </View>
      <Section title="Appearance" />
      <Card style={S.settingsCurrencyCard}>
        <Text style={S.caption}>Choose the app color theme.</Text>
        <SelectField label="Appearance" value={theme.themeName === "dark" ? "Dark" : "Light"} leadingIcon="settings" tone="purple" options={[{ value: "Light", label: "Light" }, { value: "Dark", label: "Dark" }]} onChange={(value) => theme.setTheme(value.toLowerCase()).catch((error) => Alert.alert("Could not save appearance", error.message))} />
      </Card>
      <Section title="Currency" />
      <Card style={S.settingsCurrencyCard}>
        <Text style={S.caption}>Choose the currency used to display financial amounts and prefill new entries.</Text>
        <SelectField label="Currency" value={`${currencyNames[f.currency]} (${f.currency} · ${currencySymbols[f.currency]})`} leadingIcon="balance" tone="green" options={currencies.map((code) => ({ value: `${currencyNames[code]} (${code} · ${currencySymbols[code]})`, label: `${currencyNames[code]} (${code} · ${currencySymbols[code]})` }))} onChange={(label) => f.changeCurrency(currencies.find((code) => label.startsWith(currencyNames[code])) || f.currency)} accessibilityLabel="Selected currency" />
        <Text style={S.caption}>Existing financial amounts are not converted when you change this preference.</Text>
      </Card>
      <Section title="Account" />
      <Card>
        <ListRow
          leading={<FunctionalIcon name="financialProfile" />}
          title="Financial Profile"
          subtitle={f.user?.email || "Manage your account"}
          trailing={<ChevronRight color={C.muted} size={20} />}
          onPress={() => router.push("/profile")}
          accessibilityLabel={`Financial Profile${f.user?.email ? `, ${f.user.email}` : ""}`}
          accessibilityHint="Opens your financial profile"
          divider={false}
        />
      </Card>
      <Text style={S.caption}>
        Currency preference is saved on this device. Changing it does not convert existing financial records.
      </Text>
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
  const f = useFinance(),
    router = useRouter();
  return (
    <Page title="Financial Profile" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen">
      <View style={S.pageIntro}>
        <Text style={S.sub}>Your account and financial information</Text>
        <Text style={S.caption}>Profile information is loaded from your BudgetFlow account.</Text>
      </View>
      <Section title="Account" />
      <Card>
        <Label>Signed in as</Label>
        <Text style={S.metric} accessibilityLabel={`Signed in as ${f.user?.email || "BudgetFlow user"}`}>
          {f.user?.email || "BudgetFlow user"}
        </Text>
      </Card>
      <Section title="Financial information" />
      <Card style={S.profileInfoCard}>
        <View accessible accessibilityRole="text" accessibilityLabel={`Monthly income, ${accessibleMoney(f.profile?.monthly_income, f.currency)}`}>
          <Text style={S.caption} accessible={false}>Monthly income</Text>
          <Text style={S.profileIncome} accessible={false}>{money(f.profile?.monthly_income, f.symbol)}</Text>
        </View>
        <Text style={S.caption}>Used as a starting amount in Smart Planner.</Text>
      </Card>
      <Section title="Account actions" />
      <Button
        title="Sign out"
        variant="danger"
        accessibilityLabel="Sign out"
        accessibilityHint="Ends your current BudgetFlow session. Your financial data remains saved."
        onPress={() => f.signOut()}
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
function Reports() {
  const f = useFinance(),
    router = useRouter(),
    theme = useTheme(),
    tx = f.transactions.filter(
      (t) =>
        t.currency === f.currency &&
        (t.month || t.date?.slice(0, 7)) === f.currentMonth,
    ),
    income = sum(tx, "Income"),
    spent = sum(tx, "Expense"),
    cats = [
      ...new Set(tx.filter((t) => t.type === "Expense").map((t) => t.category)),
    ]
      .map((category) => ({
        category,
        amount: tx
          .filter((t) => t.type === "Expense" && t.category === category)
          .reduce((a, t) => a + Number(t.amount), 0),
      }))
      .sort((a, b) => b.amount - a.amount);
  const periodKeys = [...new Set(f.transactions.filter((t) => (t.currency || "NGN") === f.currency).map((t) => t.month || t.date?.slice(0, 7)).filter(Boolean))].sort();
  const periods = periodKeys.slice(-6).map((month) => {
    const rows = f.transactions.filter((t) => (t.currency || "NGN") === f.currency && (t.month || t.date?.slice(0, 7)) === month);
    return { month, income: sum(rows, "Income"), expenses: sum(rows, "Expense") };
  });
  const historyMonths = [...new Set(f.budgets.filter((b) => b.currency === f.currency).map((b) => b.month).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const largestCategory = cats[0];
  return (
    <Page title="Reports" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen">
      <Text style={S.sub}>Understand your financial activity</Text>
      <Card style={S.reportPeriod} accessibilityLabel={`Report period: ${monthLabel(f.currentMonth)}`}>
        <View>
          <Text style={S.reportPeriodLabel}>REPORTING PERIOD</Text>
          <Text style={S.reportPeriodTitle}>{monthLabel(f.currentMonth)}</Text>
        </View>
        <Text style={S.caption}>Monthly summary</Text>
      </Card>
      <Section title="Monthly summary" />
      <Card style={S.reportSummary}>
        <Metric label="Income" value={money(income, f.symbol)} color={C.green} accessibilityLabel={`${monthLabel(f.currentMonth)} income, ${accessibleMoney(income, f.currency)}`} />
        <Metric label="Expenses" value={money(spent, f.symbol)} color={C.red} accessibilityLabel={`${monthLabel(f.currentMonth)} expenses, ${accessibleMoney(spent, f.currency)}`} />
        <Metric label="Net balance" value={money(income - spent, f.symbol)} accessibilityLabel={`${monthLabel(f.currentMonth)} net balance, ${accessibleMoney(income - spent, f.currency)}`} />
      </Card>
      {tx.length === 0 ? (
        <Empty
          text="No financial activity this month"
          description="Add an income or expense to start seeing your report."
          icon={ReceiptText}
          actionLabel="Add transaction"
          onAction={() => router.push("/(tabs)/add")}
        />
      ) : (
        <>
          <Section title="Spending by category" />
          {cats.length ? (
            <Card style={S.reportCategoryList}>
              {cats.map((x, index) => {
                const share = spent ? ((x.amount / spent) * 100).toFixed(1) : 0;
                const progressColor = progressAccent(x.category, theme);
                return (
                  <View
                    key={x.category}
                    style={[S.reportCategory, index === cats.length - 1 && S.reportCategoryLast]}
                  >
                    <View
                      style={S.row}
                      accessible
                      accessibilityRole="text"
                      accessibilityLabel={`${x.category}, ${accessibleMoney(x.amount, f.currency)}`}
                    >
                      <Text style={S.cardTitle} accessible={false}>{x.category}</Text>
                      <Text style={S.value} accessible={false}>{money(x.amount, f.symbol)}</Text>
                    </View>
                    <Progress
                      value={spent ? (x.amount / spent) * 100 : 0}
                      label={`${x.category} share of ${monthLabel(f.currentMonth)} expenses`}
                      accessibilityValueText={`${share} percent of spending`}
                      color={progressColor}
                    />
                    <Text style={[S.caption, { color: progressColor }]}>{share}% of spending</Text>
                  </View>
                );
              })}
            </Card>
          ) : (
            <Empty
              text="No expenses this month"
              description="Category spending will appear here when you record an expense."
              icon={ReceiptText}
              actionLabel="Add transaction"
              onAction={() => router.push("/(tabs)/add")}
            />
          )}
        </>
      )}
      <Section title="Financial Insights" />
      <Card style={S.insightsCard}>
        {income > 0 ? <Text style={S.bodyText}>{income >= spent ? `Your income exceeded your expenses by ${money(income - spent, f.symbol)}.` : `Your expenses exceeded your income by ${money(spent - income, f.symbol)}.`}</Text> : null}
        {income > 0 && spent > 0 ? <Text style={S.bodyText}>Your expenses are {((spent / income) * 100).toFixed(1)}% of your income.</Text> : null}
        {largestCategory ? <Text style={S.bodyText}>{largestCategory.category} is your largest spending category at {money(largestCategory.amount, f.symbol)}.</Text> : null}
        {!income && !spent ? <Text style={S.caption}>Add income or expenses to see insights for this month.</Text> : null}
      </Card>
      <Section title="Income vs Expenses" />
      {periods.length ? <Card accessibilityLabel={`Income versus expenses across ${periods.length} available months: ${periods.map((p) => `${monthLabel(p.month)}, income ${accessibleMoney(p.income, f.currency)}, expenses ${accessibleMoney(p.expenses, f.currency)}`).join("; ")}`} style={S.chartCard}>
      <View style={S.chartLegend}><Text style={S.chartLegendItem}>Income (green)</Text><Text style={S.chartLegendItem}>Expenses (purple)</Text></View>
        {periods.map((period) => { const max = Math.max(...periods.flatMap((p) => [p.income, p.expenses]), 1); return <View key={period.month} style={S.chartPeriod}><Text style={S.caption}>{monthLabel(period.month)}</Text><View style={S.chartLine}><Text style={S.chartKind}>Income</Text><View style={[S.chartBar, S.incomeBar, { width: `${Math.max(period.income / max * 48, period.income ? 2 : 0)}%` }]} /><Text style={S.chartValue}>{money(period.income, f.symbol)}</Text></View><View style={S.chartLine}><Text style={S.chartKind}>Expenses</Text><View style={[S.chartBar, S.expenseBar, { width: `${Math.max(period.expenses / max * 48, period.expenses ? 2 : 0)}%` }]} /><Text style={S.chartValue}>{money(period.expenses, f.symbol)}</Text></View></View>; })}
      </Card> : <Empty text="No reporting periods yet" description="Monthly comparisons appear when transactions are available." />}
      <Section title="Budget History" />
      {historyMonths.length ? historyMonths.map((month) => {
        const monthBudgets = f.budgets.filter((b) => b.currency === f.currency && b.month === month);
        const total = monthBudgets.reduce((a, b) => a + Number(b.amount || 0), 0);
        const expenses = sum(f.transactions.filter((t) => (t.currency || "NGN") === f.currency && (t.month || t.date?.slice(0, 7)) === month), "Expense");
        return <Pressable key={month} accessibilityRole="button" accessibilityLabel={`${monthLabel(month)} ${month === f.currentMonth ? "current" : "completed"}. Budget ${accessibleMoney(total, f.currency)}; expenses ${accessibleMoney(expenses, f.currency)}; remaining ${accessibleMoney(total - expenses, f.currency)}`} onPress={() => router.push({ pathname: "/(tabs)/budgets", params: { month } })} style={S.historyMonthCard}><View style={S.row}><Text style={S.cardTitle}>{monthLabel(month)}</Text><Text style={S.label}>{month === f.currentMonth ? "Current" : "Completed"}</Text></View><Text style={S.caption}>Budget {money(total, f.symbol)}  ·  Expenses {money(expenses, f.symbol)}</Text><Text style={S.caption}>Remaining {money(total - expenses, f.symbol)}</Text></Pressable>;
      }) : <Empty text="No budget history" description="Monthly budgets will appear here when available." />}
    </Page>
  );
}
const OPTIONS = [
  ["Food", 25],
  ["Transport", 15],
  ["Bills", 15],
  ["Entertainment", 5],
  ["Shopping", 5],
  ["Health", 10],
  ["Savings", 20],
  ["Emergency Fund", 15],
  ["Investment", 10],
  ["Rent", 30],
  ["Education", 10],
  ["Debt Repayment", 20],
  ["Business", 15],
  ["Personal Care", 8],
  ["Other", 5],
];
export function PlannerScreen() {
  return (
    <Guard>
      <Planner />
    </Guard>
  );
}
function Planner() {
  const f = useFinance(),
    [available, setAvailable] = useState(
      String(f.profile?.monthly_income || ""),
    ),
    [selected, setSelected] = useState([]),
    [plan, setPlan] = useState(null),
    [step, setStep] = useState(1),
    [formError, setFormError] = useState(""),
    [applyError, setApplyError] = useState(""),
    [applying, setApplying] = useState(false),
    router = useRouter();
  function toggle([name, weight]) {
    setSelected((x) =>
      x.some((c) => c.name === name)
        ? x.filter((c) => c.name !== name)
        : [...x, { name, weight, mode: "automatic", amount: "" }],
    );
  }
  function generate() {
    const total = Math.round(Number(available));
    setFormError("");
    if (total <= 0 || !selected.length) {
      setFormError("Enter available money and select at least one category.");
      return;
    }
    const fixed = selected
        .filter((x) => x.mode === "specific")
        .reduce((a, x) => a + Number(x.amount || 0), 0),
      auto = selected.filter((x) => x.mode === "automatic"),
      remaining = total - fixed;
    if (remaining < 0 || (!auto.length && fixed !== total)) {
      setFormError("Specific amounts must fit the available amount. Add automatic categories or adjust amounts.");
      return;
    }
    const weights = auto.reduce((a, x) => a + x.weight, 0);
    let used = 0;
    const rows = selected.map((x) => {
      let amount =
        x.mode === "specific"
          ? Number(x.amount || 0)
          : auto.indexOf(x) === auto.length - 1
            ? remaining - used
            : Math.round((remaining * x.weight) / weights);
      if (x.mode === "automatic") used += amount;
      return { ...x, amount };
    });
    setPlan({ total, rows });
    setStep(4);
  }
  async function apply() {
    if (!plan || applying) return;
    if (plan.rows.reduce((a, x) => a + Number(x.amount || 0), 0) !== plan.total)
      return setApplyError("Adjust the amounts so they equal the available money.");
    setApplyError("");
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
        const { error } = await supabase
          .from("transactions")
          .update({ amount: plan.total })
          .eq("id", oldIncome.id)
          .eq("user_id", f.user.id);
        if (error) throw error;
        await f.refresh();
      } else
        await f.addTransaction({
          type: "Income",
          category: "Smart Planned Income",
          amount: plan.total,
          date,
          month: f.currentMonth,
        });
      for (const x of plan.rows) {
        if (["Savings", "Emergency Fund"].includes(x.name))
          await f.saveGoal({
            name:
              x.name === "Savings"
                ? "BudgetFlow Savings Plan"
                : "BudgetFlow Emergency Fund",
            type: x.name,
            targetAmount: x.amount,
            reuseExisting: true,
          });
        else if (x.amount > 0)
          await f.saveBudget({ category: x.name, amount: x.amount });
      }
      Alert.alert("Plan applied", "Income and budget allocations saved.");
      router.replace("/budgets");
    } catch (e) {
      Alert.alert("Could not apply plan", e.message);
    } finally {
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
  const steps = ["Amount", "Categories", "Adjust", "Review"];
  return (
    <Page title="Smart Planner" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen" keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={S.sub}>Plan your spending with confidence.</Text>
        <Text style={S.caption}>Choose an amount, select categories, then review your allocations before applying.</Text>
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
          <Section title="Set your amount" />
          <Card>
            <CurrencyField
              label="Available money this month"
              value={available}
              onChangeText={(value) => { setAvailable(value); setFormError(""); }}
              symbol={f.symbol}
              returnKeyType="done"
            />
            <Text style={S.caption}>
              {f.profile?.monthly_income
                ? "Started with your monthly income from Financial Profile. You can adjust it for this plan."
                : "Enter the amount you want to allocate for this plan."}
            </Text>
          </Card>
          {formError ? <Text style={S.inlineError} accessibilityRole="alert">{formError}</Text> : null}
          <Button
            title="Choose categories"
            accessibilityHint="Continue to choose spending categories"
            onPress={() => {
              const amount = Math.round(Number(available));
              if (amount <= 0) {
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
          <Section title="Choose categories" />
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
          <Section title="Set priorities and amounts" />
          <Text style={S.caption}>Keep automatic allocations or enter a specific amount for a category.</Text>
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
                    setSelected((xs) =>
                      xs.map((x) =>
                        x.name === item.name ? { ...x, mode: "automatic" } : x,
                      ),
                    )
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
                    setSelected((xs) =>
                      xs.map((x) =>
                        x.name === item.name ? { ...x, mode: "specific" } : x,
                      ),
                    )
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
                <CurrencyField
                  label={`${item.name} amount`}
                  value={item.amount}
                  onChangeText={(value) =>
                    setSelected((xs) =>
                      xs.map((x) =>
                        x.name === item.name ? { ...x, amount: value } : x,
                      ),
                    )
                  }
                  symbol={f.symbol}
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
          <Section title="Review your plan" />
          <Card style={S.planTotal} accessibilityLabel={`Total allocated, ${accessibleMoney(plan.total, f.currency)}`}>
            <Text style={S.heroLabel}>TOTAL ALLOCATED</Text>
            <Text style={S.heroAmount}>{money(plan.total, f.symbol)}</Text>
          </Card>
          <Card>
            {plan.rows.map((item) => (
              <CurrencyField
                key={item.name}
                label={`${item.name} allocation`}
                value={String(item.amount)}
                onChangeText={(value) =>
                  setPlan((previous) => ({
                    ...previous,
                    rows: previous.rows.map((row) =>
                      row.name === item.name
                        ? { ...row, amount: Math.max(Number(value) || 0, 0) }
                        : row,
                    ),
                  }))
                }
                symbol={f.symbol}
                accessibilityHint={`${item.name} recommended allocation`}
              />
            ))}
          </Card>
          {applyError ? <Text style={S.inlineError} accessibilityRole="alert">{applyError}</Text> : null}
          <View style={S.row}>
            <Button title="Adjust plan" secondary disabled={applying} onPress={() => { setApplyError(""); setStep(3); }} />
            <View style={{ flex: 1 }}>
              <Button title="Apply plan" accessibilityHint="Save this plan using your existing budgets and goals" onPress={apply} disabled={applying} loading={applying} />
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
    [inflation, setInflation] = useState(""),
    [years, setYears] = useState(""),
    [frequency, setFrequency] = useState("Monthly"),
    [contributionFrequency, setContributionFrequency] = useState("Monthly"),
    [result, setResult] = useState(null),
    f = useFinance(),
    router = useRouter(),
    contributionPeriods = {
      Weekly: 52,
      "Bi-weekly": 26,
      Monthly: 12,
      Quarterly: 4,
      Yearly: 1,
    }[contributionFrequency],
    totalContributions = Number(principal) +
      Number(monthly) * contributionPeriods * Number(years),
    inflationAdjusted =
      result / (1 + Number(inflation) / 100) ** Number(years);
  return (
    <Page title="Compound Interest" back={backTo(router, "/(tabs)/more")} backLabel="Back to More" backHint="Returns to the More screen" keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={S.sub}>Explore how your investment may grow.</Text>
        <Text style={S.caption}>Enter your assumptions to calculate an estimate.</Text>
      </View>
      <Section title="Investment details" />
      <Card style={S.compoundInputCard}>
        <View style={S.row}><Text style={S.caption}>Currency</Text><Text style={S.cardTitle}>{f.currency} ({f.symbol})</Text></View>
        <CurrencyField
          label="Initial investment"
          value={principal}
          onChangeText={setPrincipal}
          symbol={f.symbol}
          returnKeyType="done"
        />
        <CurrencyField
          label="Contribution amount"
          value={monthly}
          onChangeText={setMonthly}
          symbol={f.symbol}
          returnKeyType="done"
        />
        <Text style={S.caption}>Added at the contribution frequency selected below.</Text>
      </Card>
      <Section title="Growth assumptions" />
      <Card style={S.compoundInputCard}>
        <Field
          label="Annual interest rate (%)"
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          accessibilityLabel="Annual interest rate, percent"
          accessibilityHint="Enter 10 for an annual rate of 10 percent"
          returnKeyType="done"
        />
        <Text style={S.caption}>Enter the annual rate as a percentage. For example, 10 means 10%.</Text>
        <Field
          label="Inflation rate (%)"
          value={inflation}
          onChangeText={setInflation}
          keyboardType="decimal-pad"
          accessibilityLabel="Inflation rate, percent"
          accessibilityHint="Used to calculate the inflation-adjusted value"
          returnKeyType="done"
        />
        <Text style={S.caption}>Used for the inflation-adjusted value in the result.</Text>
        <Field
          label="Years"
          value={years}
          onChangeText={setYears}
          keyboardType="decimal-pad"
          accessibilityLabel="Time period, years"
          returnKeyType="done"
        />
      </Card>
      <Section title="Frequency" />
      <Card style={S.compoundInputCard}>
        <SelectField label="Compounding frequency" value={frequency} leadingIcon="compoundInterest" options={["Daily", "Weekly", "Monthly", "Yearly"].map((value) => ({ value, label: value }))} onChange={setFrequency} />
        <SelectField label="Contribution frequency" value={contributionFrequency} leadingIcon="savings" tone="teal" options={["Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"].map((value) => ({ value, label: value }))} onChange={setContributionFrequency} />
        <Text style={S.caption}>Contribution amount is applied at this frequency.</Text>
        <Button
          title="Calculate"
          accessibilityLabel="Calculate compound interest estimate"
          accessibilityHint="Calculate the future value using the inputs above"
          onPress={() =>
            setResult(
              compoundValue(
                Number(principal),
                Number(monthly),
                Number(rate),
                Number(years),
                frequency,
                contributionFrequency,
              ),
            )
          }
        />
      </Card>
      {result !== null && (
        <>
          <Section title="Investment Summary" />
          <Card
            style={S.compoundResultHero}
            accessibilityLabel={`Estimated future value, ${accessibleMoney(result, f.currency)}`}
          >
            <Text style={S.compoundResultLabel} accessible={false}>ESTIMATED FUTURE VALUE</Text>
            <Text style={S.compoundResultAmount} accessible={false}>{money(result, f.symbol)}</Text>
          </Card>
          <Card style={S.compoundResultDetails}>
          <Metric
            label="Total contributions"
            value={money(totalContributions, f.symbol)}
            accessibilityLabel={`Total contributions, ${accessibleMoney(totalContributions, f.currency)}`}
          />
          <Metric
            label="Inflation-adjusted value"
            value={money(inflationAdjusted, f.symbol)}
            accessibilityLabel={`Inflation-adjusted value, ${accessibleMoney(inflationAdjusted, f.currency)}`}
          />
          </Card>
          <Section title="Financial Insights" />
          <Card style={S.insightsCard}>
            <Text style={S.bodyText}>Interest earned: {money(result - totalContributions, f.symbol)}</Text>
            {result > 0 ? <Text style={S.bodyText}>Interest contribution: {(((result - totalContributions) / result) * 100).toFixed(2)}% of future value.</Text> : null}
            {totalContributions > 0 ? <Text style={S.bodyText}>Investment growth: {(((result - totalContributions) / totalContributions) * 100).toFixed(2)}% above contributions.</Text> : null}
          </Card>
        </>
      )}
    </Page>
  );
}
function sum(rows, type) {
  return rows
    .filter((t) => t.type === type)
    .reduce((a, t) => a + Number(t.amount || 0), 0);
}
function categorySpent(rows, budget, month, currency) {
  return rows
    .filter(
      (t) =>
        t.type === "Expense" &&
        t.category === budget.category &&
        t.currency === currency &&
        (t.month || t.date?.slice(0, 7)) === month,
    )
    .reduce((a, t) => a + Number(t.amount || 0), 0);
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
function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}
function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}
function compoundValue(
  principal,
  contribution,
  annualRate,
  years,
  frequency,
  contributionFrequency,
) {
  const cps =
      { Daily: 365, Weekly: 52, Monthly: 12, Yearly: 1 }[frequency] || 12,
    cfps =
      { Weekly: 52, "Bi-weekly": 26, Monthly: 12, Quarterly: 4, Yearly: 1 }[
        contributionFrequency
      ] || 12,
    base = lcm(cps, cfps),
    compoundInterval = base / cps,
    contributionInterval = base / cfps,
    periods = Math.round(Math.max(years, 0) * base);
  let value = Math.max(principal, 0);
  for (let i = 1; i <= periods; i++) {
    if (i % compoundInterval === 0) value *= 1 + annualRate / 100 / cps;
    if (i % contributionInterval === 0) value += Math.max(contribution, 0);
  }
  return value;
}
const S = StyleSheet.create({
  header: {
    minHeight: CONTROL.minTouchTarget + SPACE.lg,
    paddingHorizontal: SPACE.page,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  content: { paddingVertical: SPACE.lg, paddingBottom: SPACE.xxl, gap: SPACE.lg },
  listContent: { flexGrow: 1, paddingHorizontal: COMPONENT.screenHorizontalPadding, paddingVertical: SPACE.lg, paddingBottom: SPACE.xxl },
  goalsListContent: { flexGrow: 1, paddingHorizontal: COMPONENT.screenHorizontalPadding, paddingTop: SPACE.md, paddingBottom: 72, gap: SPACE.lg },
  goalListHeader: { gap: SPACE.md },
  goalTopAddIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  goalIntroLead: { color: COLORS.text, fontSize: 16, fontWeight: TYPE.weight.semibold },
  goalIntroText: { ...TEXT.secondary, fontSize: 14, lineHeight: 21 },
  createGoalButton: { width: "100%", minHeight: 56, borderRadius: RADIUS.card, backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOW.action },
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
  goalChevron: { minWidth: 32, minHeight: CONTROL.minTouchTarget, alignItems: "center", justifyContent: "center" },
  goalType: { ...TEXT.secondary, marginTop: SPACE.xs, fontSize: 14 },
  goalMetrics: { flexDirection: "row", gap: SPACE.lg, marginTop: SPACE.sm },
  goalMetric: { flex: 1, minWidth: 0, gap: SPACE.xs },
  goalCompletionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm },
  goalRemaining: { ...TEXT.secondary, flex: 1, minWidth: 0, fontSize: 14 },
  goalCompletion: { fontSize: 14, fontWeight: TYPE.weight.bold, flexShrink: 0 },
  goalCompleteText: { ...TEXT.body, color: COLORS.positiveText, fontWeight: TYPE.weight.bold },
  goalFormCard: { gap: SPACE.md },
  goalAmountInput: { fontSize: 26, lineHeight: 32, fontWeight: TYPE.weight.heavy, color: COLORS.navy },
  goalDetailSummary: { gap: SPACE.md },
  goalDetailIconRow: { flexDirection: "row", alignItems: "center", gap: SPACE.md },
  goalDetailSaved: { gap: SPACE.xs, padding: SPACE.md, borderRadius: RADIUS.md, backgroundColor: COLORS.purpleTint },
  goalDetailAmount: { ...TEXT.metricAmount, color: COLORS.navy },
  goalDetailAmounts: { flexDirection: "row", gap: SPACE.md },
  goalDetailMetric: { flex: 1, minWidth: 0, gap: SPACE.xs, padding: SPACE.md, borderRadius: RADIUS.md, backgroundColor: COLORS.background },
  goalDetailMetricAmount: { fontSize: 15, lineHeight: 21, fontWeight: TYPE.weight.bold, color: COLORS.text },
  contributionFormCard: { gap: SPACE.md },
  contributionHistoryRow: { minHeight: CONTROL.minTouchTarget + SPACE.md, flexDirection: "row", alignItems: "center", gap: SPACE.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  contributionListRow: { flex: 1 },
  contributionAmount: { fontSize: 14, fontWeight: TYPE.weight.bold, color: COLORS.positiveText, textAlign: "right", flexShrink: 1 },
  inlineError: { ...TEXT.error, marginTop: SPACE.xs },
  hero: {
    overflow: "hidden",
    padding: SPACE.xxl,
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
    marginVertical: SPACE.sm,
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
    minHeight: 64,
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
  logo: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
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
  authSwitch: { minHeight: CONTROL.minTouchTarget, padding: SPACE.lg, justifyContent: "center" },
  authSwitchText: { color: COLORS.primary, textAlign: "center", ...TEXT.cardTitle },
  monthPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    backgroundColor: COLORS.purpleTint,
  },
  monthPillText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  dashboardGreeting: { gap: SPACE.xs, marginBottom: SPACE.xs },
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
  selectOption: { minHeight: CONTROL.minTouchTarget, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACE.md, borderRadius: RADIUS.md },
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
    width: 42,
    height: 42,
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
    gap: SPACE.sm,
  },
  summaryHeading: {
    minHeight: 40,
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
  reportCategoryList: { gap: SPACE.sm },
  reportCategory: {
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  reportCategoryLast: { borderBottomWidth: 0 },
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
  },
  compoundResultDetails: { gap: SPACE.md },
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
