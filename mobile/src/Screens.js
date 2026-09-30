import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
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
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  Trash2,
  Wallet,
  WalletCards,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { announceAccessibility } from "../components/accessibility/announce";
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
import { COLORS, SPACE, RADIUS, TYPE, TEXT, CONTROL, COMPONENT } from "./theme";

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
const money = (v, s) =>
  `${s}${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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
  rightAction,
  keyboardAvoiding = false,
}) {
  return (
    <ScreenContainer
      header={<AppHeader title={title} onBack={back} rightAction={rightAction} style={S.header} />}
      scroll={scroll}
      keyboardAvoiding={keyboardAvoiding}
      edges={back ? ["top", "bottom", "left", "right"] : ["top", "left", "right"]}
      contentStyle={scroll ? S.content : S.listContainer}
    >
      {children}
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
function Button({
  title,
  onPress,
  secondary = false,
  accessibilityLabel = title,
  accessibilityHint,
  disabled,
  loading,
  variant,
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
      style={S.buttonSpacing}
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
  const iconName =
    CATEGORY_ICONS[
      String(name || "")
        .trim()
        .toLowerCase()
    ] || "balance";
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        S.categoryIcon,
        {
          backgroundColor:
            tint === COLORS.white
              ? COLORS.overlayWhite16
              : tint === C.green
                ? COLORS.greenTint
                : tint === C.red
                  ? COLORS.redTint
                  : COLORS.purpleTint,
        },
      ]}
    >
      <AppIcon name={iconName} size={size} color={tint} strokeWidth={2} />
    </View>
  );
}
function CurrencyField({ label, value, onChangeText, symbol, inputStyle, ...inputProps }) {
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
      accessibilityLabel={`${label}, amount in ${symbol === currencySymbols.NGN ? "Nigerian naira" : symbol}`}
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
  const router = useRouter();
  async function submit() {
    if (!supabaseConfigured)
      return Alert.alert(
        "Setup required",
        "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to mobile/.env.",
      );
    setBusy(true);
    const res = signup
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
    setBusy(false);
    if (res.error) Alert.alert("Sign in failed", res.error.message);
    else if (signup && !res.data.session)
      Alert.alert("Check your email", "Confirm your account, then sign in.");
    else router.replace("/");
  }
  return (
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
        />
      </View>
      <Pressable
        onPress={() => setSignup(!signup)}
        accessibilityRole="button"
        accessibilityLabel={signup ? "Switch to sign in" : "Create a BudgetFlow account"}
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
  );
}
function Guard({ children }) {
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
        <ErrorState onRetry={refresh} />
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
function Home() {
  const f = useFinance(),
    router = useRouter();
  const tx = f.transactions.filter(
      (t) =>
        (t.currency || "NGN") === f.currency &&
        (t.month || t.date?.slice(0, 7)) === f.currentMonth,
    ),
    inc = sum(tx, "Income"),
    spent = sum(tx, "Expense"),
    bud = f.budgets.filter(
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
  return (
    <Page
      title="BudgetFlow"
      rightAction={{
        label: "Open profile",
        hint: "View your account profile",
        icon: <AppIcon name="financialProfile" color={C.ink} />,
        onPress: () => router.push("/profile"),
      }}
    >
      <View style={S.monthPill}>
        <CircleDollarSign size={16} color={C.purple} accessible={false} />
        <Text style={S.monthPillText}>
          {monthLabel(f.currentMonth)}
        </Text>
      </View>
      <Card style={S.hero}>
        <View style={S.heroTop}>
          <View>
            <Text style={S.heroLabel} accessible={false}>TOTAL BALANCE</Text>
            <Text style={S.heroAmount} accessibilityLabel={`Total balance, ${accessibleMoney(inc - spent, f.currency)}`}>{money(inc - spent, f.symbol)}</Text>
          </View>
          <View style={S.balanceIcon}>
            <Wallet size={21} color={COLORS.white} accessible={false} />
          </View>
        </View>
      </Card>
      <View style={S.summaryGrid}>
        <Card style={S.summaryCard} accessibilityLabel={`Income, ${accessibleMoney(inc, f.currency)}${inc === 0 ? ". No income recorded this month." : ""}`}>
          <View style={S.summaryHeading}>
            <ArrowDownLeft size={18} color={C.green} accessible={false} />
            <Text style={S.summaryLabel}>Income</Text>
          </View>
          <Text style={S.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(inc, f.symbol)}</Text>
          {inc === 0 && <Text style={S.caption}>No income recorded this month.</Text>}
        </Card>
        <Card style={S.summaryCard} accessibilityLabel={`Expenses, ${accessibleMoney(spent, f.currency)}`}>
          <View style={S.summaryHeading}>
            <ArrowUpRight size={18} color={C.red} accessible={false} />
            <Text style={S.summaryLabel}>Expenses</Text>
          </View>
          <Text style={S.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(spent, f.symbol)}</Text>
        </Card>
      </View>
      <Section
        title="Budget Overview"
        action="View all budgets"
        onPress={() => router.push("/budgets")}
      />
      {bud.length ? (
        bud.slice(0, 4).map((b) => <BudgetCard key={b.id} budget={b} />)
      ) : (
        <Empty
          text="No budgets yet"
          description="Create a budget to start tracking your spending."
          icon={WalletCards}
          actionLabel="View budgets"
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
      <Section title="Daily Spending" />
      <Card>
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
            <Text style={S.label}>TODAY&apos;S TARGET</Text>
            <Text style={S.dailyValue}>{money(dailyTarget, f.symbol)}</Text>
          </View>
          <View style={S.dailyStat}>
            <Text style={S.label}>SPENT TODAY</Text>
            <Text style={S.dailyValue}>{money(spentToday, f.symbol)}</Text>
          </View>
          <View style={S.dailyStatWide}>
            <Text style={S.label}>REMAINING TODAY</Text>
            <Text style={S.dailyValue}>{money(Math.max(dailyRemaining, 0), f.symbol)}</Text>
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
          <Text
            style={[S.dailyNoticeTitle, dailyRemaining < 0 && { color: C.red }]}
          >
            {dailyRemaining < 0
              ? `You overspent today by ${money(Math.abs(dailyRemaining), f.symbol)}`
              : dailyRemaining === 0
                ? "Today's target reached"
                : "You're on track"}
          </Text>
          {dailyRemaining < 0 && (
            <Text style={S.caption}>
              New daily target from tomorrow: {money(tomorrowTarget, f.symbol)}
            </Text>
          )}
        </View>
      </Card>
      <Section
        title="Recent Transactions"
        action="View all transactions"
        onPress={() => router.push("/transactions")}
      />
      {tx.slice(0, 5).map((t) => (
        <Transaction key={t.id} t={t} symbol={f.symbol} currency={f.currency} />
      ))}
      {!tx.length && (
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
          <View>
            <Text style={S.cardTitle}>
              {monthLabel(prevMonth(f.currentMonth))}
            </Text>
            <Text style={S.caption}>Previous month balance</Text>
          </View>
          <Text style={S.metric}>{money(previous, f.symbol)}</Text>
        </View>
        <Text style={S.caption}>
          Cycle status: {f.cycle?.status || "No rollover recorded"}
        </Text>
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
function Progress({ value, label = "Progress", accessibilityValueText }) {
  const progress = Math.max(0, Math.min(value, 100));
  return <ProgressBar value={progress} label={label} accessibilityValueText={accessibilityValueText || `${Math.round(progress)} percent`} style={S.progressSpacing} />;
}
function BudgetCard({ budget, detail = true }) {
  const f = useFinance(),
    router = useRouter(),
    spent = categorySpent(f.transactions, budget, budget.month, f.currency),
    remain = Number(budget.amount) - spent,
    pct = Number(budget.amount) ? (spent / Number(budget.amount)) * 100 : 0,
    days = daysInMonth(budget.month),
    daily = Number(budget.amount) / Math.max(days, 1);
  return (
    <Pressable
      onPress={detail ? () => router.push(`/budget/${budget.id}`) : undefined}
      accessibilityRole={detail ? "button" : undefined}
      accessibilityLabel={
        detail
          ? `${budget.category} budget, ${accessibleMoney(budget.amount, f.currency)} total, ${accessibleMoney(spent, f.currency)} spent, ${remain < 0 ? `${accessibleMoney(Math.abs(remain), f.currency)} over budget` : `${accessibleMoney(remain, f.currency)} remaining`}`
          : undefined
      }
      accessibilityHint={
        detail ? "Opens budget details and spending history" : undefined
      }
      style={({ pressed }) => (pressed && detail ? { opacity: 0.9 } : null)}
    >
      <Card>
        <View style={S.row}>
          <View style={S.rowStart}>
            <CategoryIcon name={budget.category} />
            <View>
              <Text style={S.cardTitle}>{budget.category}</Text>
              <Text style={S.caption}>
                {money(budget.amount, f.symbol)} monthly budget
              </Text>
            </View>
          </View>
          <Text style={S.pct}>{Math.round(pct)}%</Text>
        </View>
        <Progress value={pct} label={`${budget.category} budget used`} />
        <View style={S.row}>
          <View>
            <Text style={S.value}>{money(spent, f.symbol)} spent</Text>
            <Text style={S.caption}>
              {remain < 0
                ? `Over by ${money(Math.abs(remain), f.symbol)}`
                : `${money(remain, f.symbol)} left`}
            </Text>
          </View>
          <Text style={S.dailyTarget}>
            {money(daily, f.symbol)}
            <Text style={S.caption}> / day</Text>
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
export function BudgetsScreen() {
  return (
    <Guard>
      <Budgets />
    </Guard>
  );
}
function Budgets() {
  const f = useFinance(),
    bs = f.budgets.filter(
      (b) => b.currency === f.currency && b.month === f.currentMonth,
    ),
    pastBudgets = f.budgets.filter(
      (b) => b.currency === f.currency && b.month !== f.currentMonth,
    ),
    [show, setShow] = useState(false),
    [category, setCategory] = useState("Food"),
    [amount, setAmount] = useState("");
  const totalBudget = bs.reduce((total, b) => total + Number(b.amount || 0), 0),
    totalSpent = bs.reduce(
      (total, b) =>
        total + categorySpent(f.transactions, b, f.currentMonth, f.currency),
      0,
    ),
    totalRemaining = totalBudget - totalSpent,
    totalPercent = totalBudget ? (totalSpent / totalBudget) * 100 : 0;
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
    <Page title="Budgets" keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={S.sub}>{monthLabel(f.currentMonth)}</Text>
        <Text style={S.caption}>Current month budget overview</Text>
      </View>
      <Card style={S.budgetSummaryCard}>
        <Text style={S.budgetSummaryLabel}>{monthLabel(f.currentMonth)} budget</Text>
        <Text style={S.budgetSummaryAmount} numberOfLines={1} adjustsFontSizeToFit>{money(totalBudget, f.symbol)}</Text>
        <View style={S.budgetSummaryMetrics}>
          <Metric label="Amount spent" value={money(totalSpent, f.symbol)} />
          <Metric
            label={totalRemaining < 0 ? "Over budget" : "Amount remaining"}
            value={totalRemaining < 0 ? money(Math.abs(totalRemaining), f.symbol) : money(totalRemaining, f.symbol)}
            color={totalRemaining < 0 ? C.red : undefined}
          />
        </View>
        <View style={S.row}>
          <Text style={S.caption}>Percentage used</Text>
          <Text style={S.pct}>{Math.round(totalPercent)}%</Text>
        </View>
        <Progress value={totalPercent} label={`${monthLabel(f.currentMonth)} total budget used`} />
      </Card>
      <Section title="Monthly budgets" />
      {show && (
        <Card>
          <Text accessibilityRole="header" style={S.cardTitle}>New monthly budget</Text>
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
      {bs.map((b) => (
        <BudgetCard key={b.id} budget={b} />
      ))}
      {!bs.length && (
        <Empty
          text="No budgets yet"
          description="Create a budget to set a monthly limit for a category."
          icon={WalletCards}
        />
      )}
      {pastBudgets.length > 0 && (
        <>
          <Section title="Past budgets" />
          {pastBudgets.map((b) => (
            <View key={b.id}>
              <Text style={S.budgetHistoryMonth}>{monthLabel(b.month)}</Text>
              <BudgetCard budget={b} />
            </View>
          ))}
        </>
      )}
      <Button
        title={show ? "Close add budget form" : "Add budget"}
        accessibilityLabel={show ? "Close add budget form" : "Add budget"}
        onPress={() => setShow(!show)}
      />
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
    budget = f.budgets.find((b) => String(b.id) === String(id)),
    [editing, setEditing] = useState(false),
    [editAmount, setEditAmount] = useState("");
  if (!budget)
    return (
      <Page title="Budget details" back={backTo(router, "/(tabs)/budgets")}>
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
              <Text style={S.sub}>
                {monthLabel(budget.month)} · {budget.month === f.currentMonth ? "Current" : "History"}
              </Text>
            </View>
            {editing && (
              <Card style={S.editBudgetCard}>
                <Text accessibilityRole="header" style={S.cardTitle}>Edit Budget</Text>
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
                  <Text style={S.cardTitle}>{budget.category}</Text>
                  <Text style={S.caption}>{monthLabel(budget.month)} budget</Text>
                </View>
              </View>
              <Text style={S.budgetDetailAmount} numberOfLines={1} adjustsFontSizeToFit>{money(budget.amount, f.symbol)}</Text>
              <View style={S.budgetDetailStats}>
                <Metric label="Spent" value={money(spent, f.symbol)} />
                <Metric
                  label={remaining < 0 ? "Over budget" : "Remaining"}
                  value={remaining < 0 ? money(Math.abs(remaining), f.symbol) : money(remaining, f.symbol)}
                  color={remaining < 0 ? C.red : undefined}
                />
              </View>
              <View style={S.row}>
                <Text style={S.caption}>Percentage used</Text>
                <Text style={S.pct}>{Math.round(budgetPercent)}%</Text>
              </View>
              <Progress
                value={budgetPercent}
                label={`${budget.category} budget used`}
              />
            </Card>
            {canEdit && <Button title="Edit Budget" secondary accessibilityLabel="Edit budget" onPress={() => { setEditAmount(String(budget.amount)); setEditing(true); }} />}
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
                label="Monthly budget remaining"
                value={money(remaining, f.symbol)}
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
  return (
    <View
      style={S.metricRow}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `${label}: ${value}`}
    >
      <Text style={S.caption} accessible={false}>
        {label}
      </Text>
      <Text style={[S.value, color && { color }]} accessible={false}>
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
    [type, setType] = useState("Expense"),
    [amount, setAmount] = useState(""),
    [category, setCategory] = useState("Food"),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [desc, setDesc] = useState(""),
    [notice, setNotice] = useState(""),
    [errors, setErrors] = useState({}),
    [submitting, setSubmitting] = useState(false),
    [showDatePicker, setShowDatePicker] = useState(false),
    [amountFocused, setAmountFocused] = useState(false);
  const submittingRef = useRef(false);
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
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0)
      nextErrors.amount = amount.trim() ? "Enter a valid amount." : "Enter an amount.";
    if (!category.trim()) nextErrors.category = "Select a category.";
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
        amount,
        category,
        date,
        description: desc,
      });
      setAmount("");
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
        <View style={S.typeSwitcher} accessibilityRole="radiogroup" accessibilityLabel="Transaction type">
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Expense"
            accessibilityState={{ selected: type === "Expense" }}
            style={[S.typeOption, type === "Expense" && S.expenseSelected]}
            onPress={() => { Keyboard.dismiss(); setType("Expense"); }}
          >
            <View accessible={false}>
              <ArrowUpRight
                size={18}
                color={type === "Expense" ? C.red : C.muted}
              />
            </View>
            <Text
              style={[S.typeOptionText, type === "Expense" && { color: C.red }]}
            >
              Expense
            </Text>
            {type === "Expense" && <Text style={S.selectionMarker}>Selected</Text>}
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Income"
            accessibilityState={{ selected: type === "Income" }}
            style={[S.typeOption, type === "Income" && S.incomeSelected]}
            onPress={() => {
              Keyboard.dismiss();
              setType("Income");
              setCategory("Salary");
            }}
          >
            <View accessible={false}>
              <ArrowDownLeft
                size={18}
                color={type === "Income" ? C.green : C.muted}
              />
            </View>
            <Text
              style={[
                S.typeOptionText,
                type === "Income" && { color: C.green },
              ]}
            >
              Income
            </Text>
            {type === "Income" && <Text style={S.selectionMarker}>Selected</Text>}
          </Pressable>
        </View>
        <Card style={S.transactionAmountCard}>
          <CurrencyField
            label="Amount"
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }));
            }}
            symbol={f.symbol}
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
            <View style={S.categoryChoices} accessibilityRole="radiogroup" accessibilityLabel="Transaction category">
              {categories.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="radio"
                  accessibilityLabel={`${item} category`}
                  accessibilityState={{ selected: category === item }}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCategory(item);
                    if (errors.category) setErrors((current) => ({ ...current, category: undefined }));
                  }}
                  style={[
                    S.categoryChoice,
                    category === item && S.categoryChoiceOn,
                  ]}
                >
                  <CategoryIcon name={item} size={16} />
                  <Text
                    style={[
                      S.categoryChoiceText,
                      category === item && { color: C.purple },
                    ]}
                  >
                    {item}
                  </Text>
                  {category === item && <Text style={S.selectionMarker}>Selected</Text>}
                </Pressable>
              ))}
            </View>
            <Field
              label="Category name"
              value={category}
              onChangeText={(value) => {
                setCategory(value);
                if (errors.category) setErrors((current) => ({ ...current, category: undefined }));
              }}
              placeholder="Choose or enter a category"
              error={errors.category}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
          {type === "Expense" && (
            <View style={S.field}>
              <Label>Budget association</Label>
              {matchingBudget ? (
                <View accessible accessibilityLabel={`${category} budget, ${money(matchingBudget.amount, f.symbol)}, expenses for ${monthLabel(date.slice(0, 7))} are counted in this budget`} style={S.budgetMatch}>
                  <CategoryIcon name={matchingBudget.category} size={18} />
                  <View style={S.budgetMatchCopy}>
                    <Text style={S.cardTitle}>{matchingBudget.category}</Text>
                    <Text style={S.caption}>{money(matchingBudget.amount, f.symbol)} / {monthLabel(matchingBudget.month)}</Text>
                  </View>
                  <Text style={S.budgetMatchState}>Matched</Text>
                </View>
              ) : (
                <View style={S.budgetNoMatch}>
                  <Text style={S.cardTitle}>No matching budget</Text>
                  <Text style={S.caption}>This expense can still be saved. A budget is matched by category, currency, and month.</Text>
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
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          <View style={S.field}>
            {Platform.OS === "web" ? (
              <Field
                label="Date"
                accessibilityLabel={`Transaction date, ${formatDateLabel(date)}`}
                value={date}
                onChangeText={setDate}
                type="date"
              />
            ) : (
              <>
                <Label>Date</Label>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Date, ${formatDateLabel(date)}`}
                  accessibilityHint="Opens the date picker"
                  onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                  style={S.dateSelector}
                >
                  <Text style={S.dateSelectorText}>{formatDateLabel(date)}</Text>
                  <AppIcon name="calendar" color={C.purple} />
                </Pressable>
                {showDatePicker && (
                  <View style={S.datePicker}>
                    <DateTimePicker
                      value={dateFromKey(date)}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onValueChange={(_event, selectedDate) => {
                        setDate(dateToKey(selectedDate));
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
          <Button
            title={`Save ${type}`}
            accessibilityLabel={`Save ${type}`}
            onPress={save}
            disabled={submitting}
            loading={submitting}
          />
        </Card>
        {notice ? (
          <Text
            style={S.successMessage}
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
    <Page title="Transactions" scroll={false} back={backTo(router, "/(tabs)/more")}>
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
        <Text style={[S.transactionAmount, { color: income ? C.green : C.ink }]} numberOfLines={1} adjustsFontSizeToFit>
          {income ? "+" : "-"}{money(t.amount, symbol)}
        </Text>
      )}
    />
  );
}
export function GoalsScreen() {
  return (
    <Guard>
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
    [notice, setNotice] = useState("");
  const submittingRef = useRef(false);
  const goals = f.goals.filter((g) => g.currency === f.currency);
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
    <Page title="Goals" keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={S.sub}>Plan for what matters</Text>
        <Text style={S.caption}>Track each goal and build progress through contributions.</Text>
      </View>
      <Button
        title={show ? "Cancel goal creation" : "Create Goal"}
        accessibilityLabel={show ? "Cancel goal creation" : "Create Goal"}
        onPress={() => setShow((visible) => !visible)}
      />
      {notice ? <Text style={S.successMessage} accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}>{notice}</Text> : null}
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
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} />
      ))}
      {!goals.length && (
        <Empty
          text="No financial goals yet"
          description="Create a goal to start planning for something important."
          icon={Landmark}
          actionLabel={show ? undefined : "Create Goal"}
          onAction={show ? undefined : () => setShow(true)}
        />
      )}
    </Page>
  );
}
function GoalCard({ goal }) {
  const f = useFinance(),
    router = useRouter(),
    pct = goal.targetAmount
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0,
    remaining = Math.max(
      Number(goal.targetAmount) - Number(goal.currentAmount),
      0,
    );
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
            <CategoryIcon name="Savings" />
            <View style={S.goalHeading}>
              <Text style={S.cardTitle} numberOfLines={2}>{goal.name}</Text>
              <Text style={S.caption}>{goal.type}</Text>
            </View>
          </View>
          <View style={S.goalChevron} accessible={false}>
            <ChevronRight color={C.muted} size={20} />
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
        <View style={S.row}>
          <Text style={S.caption}>
            {remaining === 0 ? "Goal complete" : `${money(remaining, f.symbol)} remaining`}
          </Text>
          <Text style={S.pct}>{Math.round(pct)}% complete</Text>
        </View>
        <Progress value={pct} label={`${goal.name} progress`} accessibilityValueText={`${Math.round(pct)} percent complete`} />
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
      <Page title="Goal details" back={backTo(router, "/(tabs)/goals")}>
        <Empty text="This goal could not be found." />
      </Page>
    );
  const pct = g.targetAmount
      ? Math.min((g.currentAmount / g.targetAmount) * 100, 100)
      : 0,
    remaining = Math.max(Number(g.targetAmount) - Number(g.currentAmount), 0);
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
    <Page title={g.name} back={backTo(router, "/(tabs)/goals")} scroll={false} keyboardAvoiding>
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
                accessibilityLiveRegion={Platform.OS === "android" ? "polite" : undefined}
              >
                {notice}
              </Text>
            ) : null}
            <Card style={S.goalDetailSummary}>
              <View style={S.goalDetailIconRow}>
                <CategoryIcon name="Savings" />
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
                  <Text style={S.label}>REMAINING</Text>
                  <Text style={S.goalDetailMetricAmount} numberOfLines={1} adjustsFontSizeToFit>{money(remaining, f.symbol)}</Text>
                </View>
              </View>
              <View style={S.row}>
                <Text style={S.goalCompleteText}>{remaining === 0 ? "Goal complete" : `${Math.round(pct)}% complete`}</Text>
                {remaining === 0 ? <Check size={18} color={C.green} accessible={false} /> : null}
              </View>
              <Progress value={pct} label={`${g.name} progress`} accessibilityValueText={`${Math.round(pct)} percent complete`} />
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
      title: "Profile",
      items: [
        [
          "Financial Profile",
          "Your income and financial details",
          "/profile",
          "financialProfile",
        ],
      ],
    },
    {
      title: "Tools",
      items: [
        ["Reports", "Review monthly activity", "/reports", "reports"],
        ["Smart Planner", "Plan monthly spending", "/planner", "planner"],
        ["Compound Interest", "Explore long-term growth", "/compound-interest", "compoundInterest"],
      ],
    },
    {
      title: "History",
      items: [
        [
          "Transaction History",
          "Browse income and expenses",
          "/transactions",
          "history",
        ],
      ],
    },
    {
      title: "Account",
      items: [
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
              <ListRow
                key={`${label}-${index}`}
                leading={(
                  <View style={S.menuIcon}>
                    <AppIcon name={iconName} size={20} color={C.purple} />
                  </View>
                )}
                title={label}
                subtitle={description}
                trailing={<ChevronRight color={C.muted} size={20} />}
                onPress={() => router.push(path)}
                accessibilityLabel={`${label}. ${description}.`}
                accessibilityHint={`Opens ${label}`}
                divider={index < group.items.length - 1}
              />
            ))}
          </Card>
        </View>
      ))}
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
    <Page title="Settings" back={backTo(router, "/(tabs)/more")}>
      <View style={S.pageIntro}>
        <Text style={S.sub}>Manage your BudgetFlow preferences</Text>
        <Text style={S.caption}>Choose how financial amounts are shown in the app.</Text>
      </View>
      <Section title="Currency" />
      <Card style={S.settingsCurrencyCard}>
        <Text style={S.caption}>Choose the currency used to display financial amounts and prefill new entries.</Text>
        {currencies.map((c, index) => {
          const isSelected = f.currency === c;
          return (
            <ListRow
              key={c}
              leading={(
                <View style={[S.settingsCurrencyCode, isSelected && S.settingsCurrencyCodeSelected]}>
                  <Text style={[S.settingsCurrencyCodeText, isSelected && S.settingsCurrencyCodeTextSelected]}>{c}</Text>
                </View>
              )}
              title={currencyNames[c]}
              subtitle={`${c} - ${currencySymbols[c]}`}
              trailing={isSelected ? (
                <View style={S.settingsCurrencySelected}>
                  <Check size={16} color={C.purple} />
                  <Text style={S.settingsCurrencySelectedText}>Selected</Text>
                </View>
              ) : <ChevronRight color={C.muted} size={20} />}
              onPress={() => f.changeCurrency(c)}
              selected={isSelected}
              accessibilityLabel={`${currencyNames[c]}, ${c}, ${isSelected ? "selected" : "not selected"}`}
              accessibilityHint="Changes the selected currency. Existing financial amounts are not converted."
              divider={index < currencies.length - 1}
            />
          );
        })}
      </Card>
      <Section title="Account" />
      <Card>
        <ListRow
          leading={<View style={S.menuIcon}><Wallet size={20} color={C.purple} /></View>}
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
    <Page title="Financial Profile" back={backTo(router, "/(tabs)/more")}>
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
  return (
    <Page title="Reports" back={backTo(router, "/(tabs)/more")}>
      <Text style={S.sub}>Understand your financial activity</Text>
      <Card style={S.reportPeriod} accessibilityLabel={`Report period: ${monthLabel(f.currentMonth)}`}>
        <View>
          <Text style={S.reportPeriodLabel}>REPORTING PERIOD</Text>
          <Text style={S.reportPeriodTitle}>{monthLabel(f.currentMonth)}</Text>
        </View>
        <Text style={S.caption}>Monthly summary</Text>
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
          <Section title="Monthly summary" />
          <Card style={S.reportSummary}>
            <Metric
              label="Income"
              value={money(income, f.symbol)}
              color={C.green}
              accessibilityLabel={`${monthLabel(f.currentMonth)} income, ${accessibleMoney(income, f.currency)}`}
            />
            <Metric
              label="Expenses"
              value={money(spent, f.symbol)}
              color={C.red}
              accessibilityLabel={`${monthLabel(f.currentMonth)} expenses, ${accessibleMoney(spent, f.currency)}`}
            />
            <Metric
              label="Net balance"
              value={money(income - spent, f.symbol)}
              accessibilityLabel={`${monthLabel(f.currentMonth)} net balance, ${accessibleMoney(income - spent, f.currency)}`}
            />
          </Card>
          <Section title="Spending by category" />
          {cats.length ? (
            <Card style={S.reportCategoryList}>
              {cats.map((x, index) => {
                const share = spent ? ((x.amount / spent) * 100).toFixed(1) : 0;
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
                    />
                    <Text style={S.caption}>{share}% of spending</Text>
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
    <Page title="Smart Planner" back={backTo(router, "/(tabs)/more")} keyboardAvoiding>
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
                        {chosen && <Check size={14} color={COLORS.white} />}
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
    <Page title="Compound Interest" back={backTo(router, "/(tabs)/more")} keyboardAvoiding>
      <View style={S.pageIntro}>
        <Text style={S.sub}>Explore how your investment may grow.</Text>
        <Text style={S.caption}>Enter your assumptions to calculate an estimate.</Text>
      </View>
      <Section title="Investment details" />
      <Card style={S.compoundInputCard}>
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
        <Label>Compounding frequency</Label>
        <View style={S.compoundFrequencyOptions} accessibilityRole="radiogroup" accessibilityLabel="Compounding frequency">
          {["Daily", "Weekly", "Monthly", "Yearly"].map((x) => (
            <Pressable
              key={x}
              accessibilityRole="radio"
              accessibilityLabel={`${x} compounding frequency`}
              accessibilityHint="Select how often interest compounds"
              accessibilityState={{ selected: frequency === x }}
              onPress={() => setFrequency(x)}
              style={[S.chip, S.compoundFrequencyChip, frequency === x && S.chipOn]}
            >
              <Text
                style={{
                  color: frequency === x ? C.purple : C.muted,
                  fontWeight: "700",
                }}
              >
                {x}
              </Text>
            </Pressable>
          ))}
        </View>
        <Label>Contribution frequency</Label>
        <View style={S.compoundFrequencyOptions} accessibilityRole="radiogroup" accessibilityLabel="Contribution frequency">
          {["Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"].map(
            (x) => (
              <Pressable
                key={x}
                accessibilityRole="radio"
                accessibilityLabel={`${x} contribution frequency`}
                accessibilityHint="Select how often contributions are added"
                accessibilityState={{ selected: contributionFrequency === x }}
                onPress={() => setContributionFrequency(x)}
                style={[S.chip, S.compoundFrequencyChip, contributionFrequency === x && S.chipOn]}
              >
                <Text
                  style={{
                    color: contributionFrequency === x ? C.purple : C.muted,
                    fontWeight: "700",
                  }}
                >
                  {x}
                </Text>
              </Pressable>
            ),
          )}
        </View>
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
          <Section title="Your estimate" />
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
  listContainer: { flex: 1, paddingHorizontal: 0, paddingVertical: 0, gap: 0 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  buttonSpacing: { marginTop: SPACE.xs },
  emptyCard: { alignItems: "center" },
  emptyState: { padding: 0 },
  sectionSpacing: { marginTop: SPACE.sm },
  progressSpacing: { marginVertical: SPACE.md },
  field: { marginTop: SPACE.md },
  goalCard: { gap: SPACE.md },
  goalHeading: { flex: 1, minWidth: 0, gap: SPACE.xs },
  goalChevron: { minWidth: 32, minHeight: CONTROL.minTouchTarget, alignItems: "center", justifyContent: "center" },
  goalMetrics: { flexDirection: "row", gap: SPACE.md, marginTop: SPACE.sm },
  goalMetric: { flex: 1, minWidth: 0, gap: SPACE.xs },
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
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
    padding: SPACE.xxl,
    borderRadius: RADIUS.card,
  },
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
  transactionAmountInput: { fontSize: 28, lineHeight: 34, fontWeight: "800", color: COLORS.navy },
  transactionFieldsCard: { gap: SPACE.lg },
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
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
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
  summaryCard: {
    flex: 1,
    minWidth: 140,
    gap: SPACE.sm,
  },
  summaryHeading: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
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
  dailyStats: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.md, marginTop: SPACE.xl },
  dailyStat: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  dailyStatWide: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  dailyValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACE.xs,
  },
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
