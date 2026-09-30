import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const Ctx = createContext(null);
export const currencySymbols = { NGN: '\u20a6', USD: '$', GBP: '\u00a3', EUR: '\u20ac', JPY: '\u00a5', CNY: '\u00a5', CAD: 'C$', AUD: 'A$', CHF: 'CHF' };
const currencies = Object.keys(currencySymbols);
const monthNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const contributionView = (row) => ({ id: row.id, amount: Number(row.amount), date: row.date, note: row.note || '', updatedAt: row.updated_at || row.created_at || null });

export function FinanceProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [currency, setCurrency] = useState('NGN');
  const [reloadKey, setReloadKey] = useState(0);
  const currentMonth = monthNow();
  const requestId = useRef(0);
  const loadedUserId = useRef(null);

  // Supabase emits INITIAL_SESSION only after its persistent mobile session is restored.
  // getSession is a fallback for the web runtime and for missed initial events.
  useEffect(() => {
    let active = true;
    let authEventSeen = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventSeen = true;
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || authEventSeen) return;
      if (sessionError) setError(sessionError.message);
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const loadData = useCallback(async () => {
    const id = ++requestId.current;
    if (!authReady) return;
    if (!user) {
      loadedUserId.current = null;
      setTransactions([]); setBudgets([]); setGoals([]); setProfile(null); setCycle(null);
      setError(''); setLoading(false);
      return;
    }

    if (loadedUserId.current !== user.id) {
      setTransactions([]); setBudgets([]); setGoals([]); setProfile(null); setCycle(null);
    }
    loadedUserId.current = user.id;
    setLoading(true); setError('');
    try {
      const [t, b, g, contributions, p, c, storedCurrency] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id).order('month', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('goal_contributions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('financial_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('financial_cycles').select('*').eq('user_id', user.id).eq('cycle_month', prevMonth(currentMonth)).maybeSingle(),
        AsyncStorage.getItem('defaultCurrency'),
      ]);
      const failed = [t, b, g, contributions, p, c].find((result) => result.error);
      if (failed?.error) throw failed.error;
      if (id !== requestId.current) return;

      const historyByGoal = (contributions.data || []).reduce((map, row) => {
        (map[row.goal_id] ||= []).push(contributionView(row));
        return map;
      }, {});
      setTransactions((t.data || []).map((row) => ({ ...row, amount: Number(row.amount), month: row.month || row.date?.slice(0, 7) })));
      setBudgets((b.data || []).map((row) => ({ ...row, amount: Number(row.amount) })));
      setGoals((g.data || []).map((row) => ({
        ...row,
        targetAmount: Number(row.target_amount),
        currentAmount: Number(row.current_amount || 0),
        targetDate: row.target_date || '',
        savingsHistory: historyByGoal[row.id] || [],
        savingsUpdatedAtByMonth: (historyByGoal[row.id] || []).reduce((months, saving) => {
          const month = saving.date?.slice(0, 7);
          if (month && saving.updatedAt && (!months[month] || saving.updatedAt > months[month])) months[month] = saving.updatedAt;
          return months;
        }, {}),
      })));
      setProfile(p.data || null); setCycle(c.data || null);
      const preferred = currencies.includes(storedCurrency) ? storedCurrency : 'NGN';
      setCurrency(preferred);
    } catch (e) {
      if (id === requestId.current) setError(e.message || 'Could not load your financial data.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [authReady, user, currentMonth]);

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

  const saveBudget = async (input) => {
    if (!user) throw new Error('You must be logged in to save a budget.');
    const row = { user_id: user.id, category: input.category.trim(), amount: Number(input.amount), currency: input.currency || currency, month: input.month || currentMonth };
    const { data, error: saveError } = await supabase.from('budgets').upsert(row, { onConflict: 'user_id,category,currency,month' }).select().single();
    if (saveError) throw saveError;
    setBudgets((items) => [...items.filter((item) => !(item.category === data.category && item.month === data.month && item.currency === data.currency)), { ...data, amount: Number(data.amount) }]);
    return data;
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

  const completeFinancialCycle = async ({ action, previousBalance, carriedForwardAmount = 0 }) => {
    if (!user) throw new Error('You must be logged in.');
    const prior = prevMonth(currentMonth);
    const claim = { user_id: user.id, cycle_month: prior, next_month: currentMonth, status: 'pending', rollover_action: action, previous_balance: Number(previousBalance) || 0, carried_forward_amount: Number(carriedForwardAmount) || 0 };
    let { data, error: claimError } = await supabase.from('financial_cycles').insert(claim).select().single();
    if (claimError?.code === '23505') {
      const existing = await supabase.from('financial_cycles').select('*').eq('user_id', user.id).eq('cycle_month', prior).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data?.status === 'completed') { setCycle(existing.data); return existing.data; }
      const age = Date.now() - new Date(existing.data?.updated_at || 0).getTime();
      if (age < 5 * 60 * 1000) throw new Error('This rollover is already being processed on another device.');
      const takeover = await supabase.from('financial_cycles').update({ ...claim, updated_at: new Date().toISOString() }).eq('id', existing.data.id).eq('status', 'pending').eq('updated_at', existing.data.updated_at).select().maybeSingle();
      if (takeover.error) throw takeover.error;
      if (!takeover.data) throw new Error('This rollover is already being processed on another device.');
      data = takeover.data; claimError = null;
    }
    if (claimError) throw claimError;
    try {
      if (action === 'carry_forward' && carriedForwardAmount > 0) await addTransaction({ type: 'Income', category: 'Carry Forward', description: `Remaining balance carried forward from ${prior}`, amount: carriedForwardAmount, date: `${currentMonth}-01`, month: currentMonth, currency });
      const { data: completed, error: completeError } = await supabase.from('financial_cycles').update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', data.id).select().single();
      if (completeError) throw completeError;
      setCycle(completed); return completed;
    } catch (e) {
      await supabase.from('financial_cycles').delete().eq('id', data.id).eq('status', 'pending');
      throw e;
    }
  };

  const changeCurrency = async (value) => { if (!currencies.includes(value)) return; setCurrency(value); await AsyncStorage.setItem('defaultCurrency', value); };
  const signOut = async () => { const { error: signOutError } = await supabase.auth.signOut(); if (signOutError) throw signOutError; };
  const value = { user, authReady, loading: !authReady || loading, error, transactions, budgets, goals, profile, cycle, currency, symbol: currencySymbols[currency] || '₦', currentMonth, refresh, addTransaction, saveBudget, saveGoal, updateGoal, deleteGoal, addSaving, deleteSaving, completeFinancialCycle, changeCurrency, signOut };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFinance = () => useContext(Ctx);
export function prevMonth(month) { const [year, number] = month.split('-').map(Number); const d = new Date(year, number - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
export function daysInMonth(month) { const [year, number] = month.split('-').map(Number); return new Date(year, number, 0).getDate(); }
