import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from './supabase';
import { financialProfilePayload } from './financialProfile.mjs';

const Ctx = createContext(null);
export const currencySymbols = { NGN: '\u20a6', USD: '$', GBP: '\u00a3', EUR: '\u20ac', JPY: '\u00a5', CNY: '\u00a5', CAD: 'C$', AUD: 'A$', CHF: 'CHF' };
const currencies = Object.keys(currencySymbols);
const STARTUP_TIMEOUT_MS = 15000;
const withStartupTimeout = (promise, resource) => {
  let timeoutId;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${resource} request timed out.`)), STARTUP_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timeoutId));
};
const resourceOutcome = (settled, key, label) => {
  const result = settled.status === 'fulfilled' ? settled.value : null;
  const error = settled.status === 'rejected' ? settled.reason : result?.error;
  if (error) {
    if (__DEV__) console.error(`[BudgetFlow Startup] ${label} failed:`, error.message || 'Unknown error');
    return { key, ok: false, data: null };
  }
  if (__DEV__) console.info(`[BudgetFlow Startup] ${label} loaded`);
  return { key, ok: true, data: result?.data ?? result };
};
const classifyStartupError = (error, fallback) => {
  const message = error?.message || '';
  if (/network|fetch|timeout|connection/i.test(message)) return 'network';
  if (error?.status === 401 || error?.name === 'AuthSessionMissingError') return 'authentication';
  return fallback;
};
const monthNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const contributionView = (row) => ({ id: row.id, amount: Number(row.amount), date: row.date, note: row.note || '', updatedAt: row.updated_at || row.created_at || null });

export function FinanceProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [resourceErrors, setResourceErrors] = useState({});
  const [startupStage, setStartupStage] = useState('AUTHENTICATING');
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalSyncSnapshot, setGoalSyncSnapshot] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [currency, setCurrency] = useState('NGN');
  const [onboardingStatus, setOnboardingStatus] = useState('not_started');
  const [onboardingStatusReady, setOnboardingStatusReady] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(monthNow);
  const requestId = useRef(0);
  const loadedUserId = useRef(null);
  const authUserId = useRef(null);
  const userId = user?.id;

  useEffect(() => {
    const checkMonth = () => {
      const nextMonth = monthNow();
      setCurrentMonth((month) => month === nextMonth ? month : nextMonth);
    };
    const timer = setInterval(checkMonth, 60_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') checkMonth(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  // Supabase emits INITIAL_SESSION only after its persistent mobile session is restored.
  // getSession is a fallback for the web runtime and for missed initial events.
  useEffect(() => {
    if (__DEV__) console.info('[BudgetFlow Startup] App started; restoring session');
    let active = true;
    let authEventSeen = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventSeen = true;
      const nextUser = session?.user ?? null;
      if (__DEV__ && _event === 'INITIAL_SESSION') console.info('[BudgetFlow Startup] Session restored', { authenticated: Boolean(nextUser) });
      if (__DEV__ && nextUser) console.info('[BudgetFlow Startup] User identified', { userId: nextUser.id });
      if (authUserId.current !== (nextUser?.id ?? null)) {
        authUserId.current = nextUser?.id ?? null;
        requestId.current += 1;
        loadedUserId.current = null;
        setTransactions([]); setBudgets([]); setGoals([]); setProfile(null); setCycle(null);
        setOnboardingStatus('not_started');
        setOnboardingStatusReady(false);
        setResourceErrors({});
        setGoalSyncSnapshot(null);
        setError(''); setErrorKind(''); setRefreshError(''); setLoading(Boolean(nextUser));
      }
      setUser(nextUser);
      setAuthReady(true);
    });
    withStartupTimeout(supabase.auth.getSession(), 'Session restoration').then(({ data, error: sessionError }) => {
      if (!active || authEventSeen) return;
      if (sessionError) {
        setError(sessionError.message);
        setErrorKind(classifyStartupError(sessionError, 'authentication'));
      }
      const nextUser = data.session?.user ?? null;
      if (__DEV__) console.info('[BudgetFlow Startup] Session restored', { authenticated: Boolean(nextUser) });
      if (__DEV__ && nextUser) console.info('[BudgetFlow Startup] User identified', { userId: nextUser.id });
      authUserId.current = nextUser?.id ?? null;
      setUser(nextUser);
      setAuthReady(true);
    }).catch((sessionError) => {
      if (!active || authEventSeen) return;
      if (__DEV__) console.error('[BudgetFlow Startup] Session restoration failed:', sessionError?.message || 'Unknown error');
      setError(sessionError?.message || 'Could not restore your session.');
      setErrorKind(classifyStartupError(sessionError, 'authentication'));
      authUserId.current = null;
      setUser(null);
      setAuthReady(true);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const loadData = useCallback(async () => {
    const id = ++requestId.current;
    if (!authReady) return;
    if (!userId) {
      loadedUserId.current = null;
      setTransactions([]); setBudgets([]); setGoals([]); setProfile(null); setCycle(null);
      setOnboardingStatus('not_started');
      setOnboardingStatusReady(false);
      setGoalSyncSnapshot(null);
      setError(''); setErrorKind(''); setRefreshError(''); setResourceErrors({}); setLoading(false);
      return;
    }

    const hasWorkspace = loadedUserId.current === userId;
    if (!hasWorkspace) {
      setTransactions([]); setBudgets([]); setGoals([]); setProfile(null); setCycle(null);
      setLoading(true);
      setError(''); setErrorKind('');
      setResourceErrors({});
    } else {
      setRefreshError('');
    }
    setStartupStage(hasWorkspace ? 'READY' : 'AUTHENTICATING');
    let profileLoaded = false;
    let financialDataStarted = false;
    try {
      setStartupStage('LOADING ACCOUNT');
      const { data: authData, error: authError } = await withStartupTimeout(supabase.auth.getUser(), 'User validation');
      if (authError) throw Object.assign(authError, { budgetFlowKind: 'authentication', budgetFlowOperation: 'getUser' });
      const authenticatedUser = authData?.user ?? null;
      if (!authenticatedUser || authenticatedUser.id !== userId) {
        throw Object.assign(new Error('The authenticated account changed. Please sign in again.'), { budgetFlowKind: 'authentication', budgetFlowOperation: 'getUser' });
      }
      if (__DEV__) console.info('[BudgetFlow Startup] Authenticated user verified', { userId: authenticatedUser.id });

      setStartupStage('LOADING FINANCIAL DATA');
      financialDataStarted = true;
      if (__DEV__) console.info('[BudgetFlow Startup] Loading core financial resources concurrently');
      const [transactionsSettled, budgetsSettled, goalsSettled] = await Promise.allSettled([
        withStartupTimeout(supabase.from('transactions').select('*').eq('user_id', authenticatedUser.id).order('date', { ascending: false }), 'Transactions'),
        withStartupTimeout(supabase.from('budgets').select('*').eq('user_id', authenticatedUser.id).order('month', { ascending: false }), 'Budgets'),
        withStartupTimeout(supabase.from('goals').select('*').eq('user_id', authenticatedUser.id), 'Goals'),
      ]);
      const core = [
        resourceOutcome(transactionsSettled, 'transactions', 'Transactions'),
        resourceOutcome(budgetsSettled, 'budgets', 'Budgets'),
        resourceOutcome(goalsSettled, 'goals', 'Goals'),
      ];
      if (id !== requestId.current) return;
      const coreErrors = Object.fromEntries(core.filter(({ ok }) => !ok).map(({ key }) => [key, true]));
      const transactionsData = core[0].ok ? core[0].data || [] : null;
      const budgetsData = core[1].ok ? core[1].data || [] : null;
      const goalsData = core[2].ok ? core[2].data || [] : null;
      if (transactionsData) setTransactions(transactionsData.map((row) => ({ ...row, amount: Number(row.amount), month: row.month || row.date?.slice(0, 7) })));
      if (budgetsData) setBudgets(budgetsData.map((row) => ({ ...row, amount: Number(row.amount) })));
      if (goalsData) setGoals((currentGoals) => goalsData.map((row) => {
        const existingGoal = currentGoals.find((goal) => String(goal.id) === String(row.id));
        return {
          ...row,
          targetAmount: Number(row.target_amount),
          currentAmount: Number(row.current_amount || 0),
          targetDate: row.target_date || '',
          savingsHistory: existingGoal?.savingsHistory || [],
          savingsUpdatedAtByMonth: existingGoal?.savingsUpdatedAtByMonth || {},
        };
      }));
      setResourceErrors((current) => {
        const next = { ...current };
        core.forEach(({ key, ok }) => ok ? delete next[key] : next[key] = true);
        return next;
      });
      loadedUserId.current = userId;
      setError(''); setErrorKind(''); setRefreshError('');
      setStartupStage('READY');
      setLoading(false);
      if (__DEV__) console.info('[BudgetFlow Startup] Core workspace ready', { userId, failedResources: Object.keys(coreErrors) });

      if (__DEV__) console.info('[BudgetFlow Startup] Loading profile and supporting resources concurrently');
      const optional = await Promise.allSettled([
        withStartupTimeout(supabase.from('financial_profiles').select('*').eq('user_id', authenticatedUser.id).maybeSingle(), 'Financial profile'),
        withStartupTimeout(supabase.from('goal_contributions').select('*').eq('user_id', authenticatedUser.id).order('date', { ascending: false }), 'Goal contributions'),
        withStartupTimeout(supabase.from('financial_cycles').select('*').eq('user_id', authenticatedUser.id).eq('cycle_month', prevMonth(currentMonth)).maybeSingle(), 'Financial cycle'),
        withStartupTimeout(AsyncStorage.getItem('defaultCurrency'), 'Currency preference'),
      ]);
      if (id !== requestId.current) return;
      const supporting = [
        resourceOutcome(optional[0], 'financial_profiles', 'Financial profile'),
        resourceOutcome(optional[1], 'goal_contributions', 'Goal contributions'),
        resourceOutcome(optional[2], 'financial_cycles', 'Financial cycle'),
        resourceOutcome(optional[3], 'currency_preference', 'Currency preference'),
      ];
      const optionalLoaded = Object.fromEntries(supporting.map(({ key, ok }) => [key, ok]));
      const profileResult = supporting[0].data;
      const contributionRows = supporting[1].data || [];
      const cycleResult = supporting[2].data;
      const savedCurrency = optionalLoaded.currency_preference ? supporting[3].data : null;
      const preferredCurrency = currencies.includes(profileResult?.preferred_currency)
        ? profileResult.preferred_currency
        : currencies.includes(savedCurrency) ? savedCurrency : null;
      const historyByGoal = contributionRows.reduce((map, row) => {
        (map[row.goal_id] ||= []).push(contributionView(row));
        return map;
      }, {});
      if (optionalLoaded.goal_contributions) setGoals((currentGoals) => currentGoals.map((goal) => {
        const savingsHistory = historyByGoal[goal.id] || [];
        return {
          ...goal,
          savingsHistory,
          savingsUpdatedAtByMonth: savingsHistory.reduce((months, saving) => {
            const month = saving.date?.slice(0, 7);
            if (month && saving.updatedAt && (!months[month] || saving.updatedAt > months[month])) months[month] = saving.updatedAt;
            return months;
          }, {}),
        };
      }));
      if (optionalLoaded.financial_profiles) {
        profileLoaded = true;
        setProfile(profileResult || null);
        const existingFinancialData = (transactionsData || []).length + (budgetsData || []).length + (goalsData || []).length > 0;
        if (profileResult?.onboarding_status) {
          setOnboardingStatus(profileResult.onboarding_status);
          setOnboardingStatusReady(true);
        } else if (existingFinancialData) {
          setOnboardingStatus('completed');
          setOnboardingStatusReady(true);
        } else if (transactionsData && budgetsData && goalsData) {
          setOnboardingStatus('not_started');
          setOnboardingStatusReady(true);
        }
      }
      if (optionalLoaded.financial_cycles) setCycle(cycleResult || null);
      if (optionalLoaded.financial_profiles || (optionalLoaded.currency_preference && currencies.includes(savedCurrency))) {
        setCurrency((currentCurrency) => currencies.includes(profileResult?.preferred_currency)
          ? profileResult.preferred_currency
          : currencies.includes(savedCurrency) ? savedCurrency : currentCurrency);
      }
      setResourceErrors((current) => {
        const next = { ...current };
        supporting.forEach(({ key, ok }) => ok ? delete next[key] : next[key] = true);
        return next;
      });
      if (__DEV__ && process.env.EXPO_PUBLIC_SUPABASE_URL && goalsData) {
        setGoalSyncSnapshot({
          platform: 'MOBILE',
          project: new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).hostname.split('.')[0],
          userId,
          email: authenticatedUser.email ?? null,
          sessionAuthenticated: Boolean(authenticatedUser),
          queryUserId: userId,
          currencyPreference: preferredCurrency || 'Unavailable',
          queryCurrencyFilter: 'NONE',
          displayCurrencyFilter: preferredCurrency || 'Unavailable',
          dataSource: 'SUPABASE',
          table: 'public.goals',
          otherFilters: [],
          goals: goalsData || [],
        });
      }
    } catch (e) {
      if (id === requestId.current) {
        const kind = classifyStartupError(e, e.budgetFlowKind || 'database');
        if (loadedUserId.current === userId) {
          setRefreshError(e.message || 'Could not refresh your financial data.');
        } else {
          setErrorKind(kind);
          setError(e.message || 'Could not load your financial data.');
          setStartupStage('ERROR');
        }
        if (__DEV__) console.error('[BudgetFlow Account]', {
          Auth: e.budgetFlowOperation === 'getUser' || kind === 'authentication' ? 'FAILED' : 'OK',
          Profile: e.budgetFlowOperation === 'financial_profiles' ? 'FAILED' : profileLoaded ? 'OK' : 'not attempted',
          FinancialData: financialDataStarted ? (e.budgetFlowOperation && e.budgetFlowOperation !== 'financial_profiles' ? `FAILED (${e.budgetFlowOperation})` : 'FAILED') : 'not attempted',
          FailedOperation: e.budgetFlowOperation || 'startup', ErrorKind: kind, Message: e.message || 'Unknown error',
        });
      }
    } finally {
      if (id === requestId.current && !hasWorkspace) setLoading(false);
    }
  }, [authReady, userId, currentMonth]);

  useEffect(() => { const timer = setTimeout(() => { void loadData(); }, 0); return () => clearTimeout(timer); }, [loadData, reloadKey]);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  const addTransaction = async (input) => {
    if (!user) throw new Error('You must be logged in to add a transaction.');
    const date = input.date || new Date().toISOString().slice(0, 10);
    const row = { user_id: user.id, type: input.type, category: String(input.category || '').trim(), amount: Number(input.amount), date, month: input.month || date.slice(0, 7), currency: input.currency || currency, description: String(input.description || '').trim() };
    let result = await supabase.from('transactions').insert(row).select().single();
    if (result.error?.code === 'PGRST204' && result.error.message.includes('month')) {
      delete row.month; result = await supabase.from('transactions').insert(row).select().single();
    }
    if (result.error?.code === 'PGRST204' && result.error.message.includes('description')) {
      delete row.description; result = await supabase.from('transactions').insert(row).select().single();
    }
    if (result.error) throw result.error;
    const saved = { ...result.data, amount: Number(result.data.amount), month: result.data.month || date.slice(0, 7) };
    setTransactions((items) => [saved, ...items]);
    return saved;
  };

  const updateTransactionAmount = async (transactionId, amount) => {
    if (!user) throw new Error('You must be logged in to update a transaction.');
    const { data, error: updateError } = await supabase.from('transactions')
      .update({ amount: Number(amount) })
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .select()
      .single();
    if (updateError) throw updateError;
    const saved = { ...data, amount: Number(data.amount), month: data.month || data.date?.slice(0, 7) };
    setTransactions((items) => items.map((item) => String(item.id) === String(transactionId) ? { ...item, ...saved } : item));
    return saved;
  };

  const saveBudget = async (input) => {
    if (!user) throw new Error('You must be logged in to save a budget.');
    const row = { user_id: user.id, category: input.category.trim(), amount: Number(input.amount), currency: input.currency || currency, month: input.month || currentMonth };
    const { data, error: saveError } = await supabase.from('budgets').upsert(row, { onConflict: 'user_id,category,currency,month' }).select().single();
    if (saveError) throw saveError;
    setBudgets((items) => [...items.filter((item) => !(item.category === data.category && item.month === data.month && item.currency === data.currency)), { ...data, amount: Number(data.amount) }]);
    return data;
  };

  const deleteBudget = async (budgetId) => {
    if (!user) throw new Error('You must be logged in to delete a budget.');
    const { error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', user.id);
    if (deleteError) throw deleteError;
    setBudgets((items) => items.filter((item) => String(item.id) !== String(budgetId)));
  };

  const saveGoal = async (input) => {
    if (!user) throw new Error('You must be logged in to save a goal.');
    const existing = input.reuseExisting ? goals.find((goal) => goal.name === input.name && goal.currency === currency) : null;
    if (existing && Number(input.targetAmount) < existing.currentAmount) throw new Error('Target amount cannot be lower than the amount already saved.');
    const query = existing
      ? supabase.from('goals').update({ type: input.type, target_amount: Number(input.targetAmount), target_date: input.targetDate || null }).eq('id', existing.id).eq('user_id', user.id)
      : supabase.from('goals').insert({ user_id: user.id, name: input.name.trim(), type: input.type || 'Goal', target_amount: Number(input.targetAmount), current_amount: Number(input.currentAmount || 0), target_date: input.targetDate || null, currency: input.currency || currency });
    const { data, error: saveError } = await query.select().single();
    if (saveError) throw saveError;
    const saved = { ...data, targetAmount: Number(data.target_amount), currentAmount: Number(data.current_amount || 0), targetDate: data.target_date || '', savingsHistory: existing?.savingsHistory || [] };
    setGoals((items) => existing ? items.map((goal) => goal.id === existing.id ? saved : goal) : [...items, saved]);
    return saved;
  };

  const updateGoal = async (goalId, updates) => {
    if (!user) throw new Error('You must be logged in.');
    const current = goals.find((goal) => String(goal.id) === String(goalId));
    if (!current) throw new Error('Goal not found.');
    const amount = Number(updates.targetAmount ?? current.targetAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount < current.currentAmount) throw new Error('Target must be at least the amount already saved.');
    const { data, error: updateError } = await supabase.from('goals').update({ name: updates.name?.trim() ?? current.name, type: updates.type ?? current.type, target_amount: amount, target_date: updates.targetDate || null, currency: updates.currency || current.currency }).eq('id', goalId).eq('user_id', user.id).select().single();
    if (updateError) throw updateError;
    const saved = { ...current, ...updates, ...data, targetAmount: Number(data.target_amount), currentAmount: Number(data.current_amount || 0), targetDate: data.target_date || '' };
    setGoals((items) => items.map((goal) => String(goal.id) === String(goalId) ? saved : goal));
    return saved;
  };

  const deleteGoal = async (goalId) => {
    if (!user) throw new Error('You must be logged in.');
    const { error: deleteError } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', user.id);
    if (deleteError) throw deleteError;
    setGoals((items) => items.filter((goal) => String(goal.id) !== String(goalId)));
  };

  const addSaving = async (goal, input) => {
    if (!user) throw new Error('You must be logged in.');
    const amount = Number(input?.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > goal.targetAmount - goal.currentAmount) throw new Error('Enter a valid amount within the remaining goal balance.');
    const { data, error: contributionError } = await supabase.rpc('add_goal_contribution', {
      p_goal_id: goal.id, p_amount: amount, p_date: input.date || new Date().toISOString().slice(0, 10), p_note: input.note || '',
    });
    if (contributionError) throw contributionError;
    const row = Array.isArray(data) ? data[0] : data;
    const contribution = contributionView(row);
    setGoals((items) => items.map((item) => String(item.id) === String(goal.id) ? { ...item, currentAmount: item.currentAmount + amount, savingsHistory: [contribution, ...(item.savingsHistory || [])] } : item));
    return contribution;
  };

  const deleteSaving = async (goalId, contributionId) => {
    if (!user) throw new Error('You must be logged in.');
    const goal = goals.find((item) => String(item.id) === String(goalId));
    const contribution = goal?.savingsHistory?.find((item) => String(item.id) === String(contributionId));
    if (!goal || !contribution) throw new Error('Contribution not found.');
    const { error: deleteError } = await supabase.rpc('delete_goal_contribution', { p_contribution_id: contributionId });
    if (deleteError) throw deleteError;
    setGoals((items) => items.map((item) => String(item.id) === String(goalId) ? { ...item, currentAmount: Math.max(item.currentAmount - contribution.amount, 0), savingsHistory: item.savingsHistory.filter((saving) => String(saving.id) !== String(contributionId)) } : item));
  };

  const completeFinancialCycle = async ({ action, previousBalance, carriedForwardAmount = 0, cycleMonth = prevMonth(currentMonth), nextMonth = currentMonth, carryForwardDescription }) => {
    if (!user) throw new Error('You must be logged in.');
    const claim = { user_id: user.id, cycle_month: cycleMonth, next_month: nextMonth, status: 'pending', rollover_action: action, previous_balance: Number(previousBalance) || 0, carried_forward_amount: Number(carriedForwardAmount) || 0 };
    let { data, error: claimError } = await supabase.from('financial_cycles').insert(claim).select().single();
    if (claimError?.code === '23505') {
      const existing = await supabase.from('financial_cycles').select('*').eq('user_id', user.id).eq('cycle_month', cycleMonth).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data?.status === 'completed') { setCycle(existing.data); return existing.data; }
      const age = Date.now() - new Date(existing.data?.updated_at || 0).getTime();
      if (age >= 5 * 60 * 1000) {
        const takeover = await supabase.from('financial_cycles').update({ ...claim, updated_at: new Date().toISOString() }).eq('id', existing.data.id).eq('status', 'pending').eq('updated_at', existing.data.updated_at).select().maybeSingle();
        if (takeover.error) throw takeover.error;
        if (takeover.data) { data = takeover.data; claimError = null; }
      }
      if (claimError) {
        if (action === 'carry_forward') {
          const matchingTransaction = await supabase.from('transactions').select('id').eq('user_id', user.id).eq('type', 'Income').eq('category', 'Carry Forward').eq('amount', Number(carriedForwardAmount) || 0).eq('date', `${nextMonth}-01`).limit(1).maybeSingle();
          if (matchingTransaction.error) throw matchingTransaction.error;
          if (matchingTransaction.data) {
            const completed = await supabase.from('financial_cycles').update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', existing.data.id).eq('status', 'pending').select().single();
            if (completed.error) throw completed.error;
            setCycle(completed.data); return completed.data;
          }
        }
        throw new Error('This rollover is already being processed on another device.');
      }
    }
    if (claimError) throw claimError;
    if (action === 'carry_forward' && carriedForwardAmount > 0) {
      try {
        await addTransaction({ type: 'Income', category: 'Carry Forward', description: carryForwardDescription || `Remaining balance carried forward from ${cycleMonth}`, amount: carriedForwardAmount, date: `${nextMonth}-01`, month: nextMonth, currency });
      } catch (e) {
      await supabase.from('financial_cycles').delete().eq('id', data.id).eq('status', 'pending');
      throw e;
      }
    }
    const { data: completed, error: completeError } = await supabase.from('financial_cycles').update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', data.id).eq('status', 'pending').select().single();
    if (completeError) throw completeError;
    setCycle(completed); return completed;
  };

  const saveFinancialProfile = async (updates) => {
    if (!user) throw new Error('You must be logged in to save your financial profile.');
    const payload = financialProfilePayload(user.id, updates);
    const { data, error: profileError } = await supabase
      .from('financial_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (profileError) throw profileError;
    setProfile(data);
    return data;
  };

  const profilePayload = (updates = {}) => financialProfilePayload(user.id, {
    monthlyIncome: profile?.monthly_income,
    mainGoal: profile?.main_goal,
    monthlySavingsTarget: profile?.monthly_savings_target,
    emergencyFundTarget: profile?.emergency_fund_target,
    budgetPreference: profile?.budget_preference,
    ...updates,
  });
  const saveOnboardingStatus = async (status, preferredCurrency = currency) => {
    if (!user) throw new Error('You must be logged in.');
    if (!['in_progress', 'completed', 'skipped'].includes(status)) throw new Error('Invalid onboarding status.');
    const { data, error: saveError } = await supabase.from('financial_profiles').upsert({
      ...profilePayload(), onboarding_status: status, preferred_currency: preferredCurrency,
    }, { onConflict: 'user_id' }).select().single();
    if (saveError) throw saveError;
    setProfile(data);
    setOnboardingStatus(status);
    setOnboardingStatusReady(true);
    if (currencies.includes(preferredCurrency)) {
      setCurrency(preferredCurrency);
      await AsyncStorage.setItem('defaultCurrency', preferredCurrency);
    }
    return data;
  };

  const changeCurrency = async (value) => {
    if (!currencies.includes(value)) return;
    if (user) {
      const { data, error: saveError } = await supabase.from('financial_profiles').upsert({
        ...profilePayload(), preferred_currency: value,
      }, { onConflict: 'user_id' }).select().single();
      if (saveError) throw saveError;
      setProfile(data);
    }
    setCurrency(value);
    await AsyncStorage.setItem('defaultCurrency', value);
  };
  const signOut = async () => { const { error: signOutError } = await supabase.auth.signOut(); if (signOutError) throw signOutError; };
  const value = { user, authReady, loading: !authReady || loading, error, errorKind, refreshError, resourceErrors, startupStage, transactions, budgets, goals, goalSyncSnapshot, profile, cycle, currency, onboardingStatus, onboardingStatusReady, symbol: currencySymbols[currency] || '₦', currentMonth, refresh, addTransaction, updateTransactionAmount, saveBudget, deleteBudget, saveGoal, updateGoal, deleteGoal, addSaving, deleteSaving, completeFinancialCycle, saveFinancialProfile, saveOnboardingStatus, changeCurrency, signOut };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFinance = () => useContext(Ctx);
export function prevMonth(month) { const [year, number] = month.split('-').map(Number); const d = new Date(year, number - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
export function daysInMonth(month) { const [year, number] = month.split('-').map(Number); return new Date(year, number, 0).getDate(); }
