import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/supabase';

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('pending');
  const confirmation = useRef(null);
  const code = first(params.code);
  const tokenHash = first(params.token_hash);
  const type = first(params.type);
  const authError = first(params.error) || first(params.error_code);
  const hasCallback = Boolean(authError || code || tokenHash);
  const message = status === 'confirmed'
    ? 'Email confirmed. Opening BudgetFlow...'
    : status === 'failed'
      ? 'We could not confirm this email link. It may have expired. Request a new confirmation email, then try again.'
      : hasCallback
        ? 'Confirming your email...'
        : 'This confirmation link is incomplete. Request a new email and try again.';

  useEffect(() => {
    let active = true;
    if (hasCallback) {
      if (!confirmation.current) {
        confirmation.current = (async () => {
          if (authError) return false;
          try {
            const result = code
              ? await supabase.auth.exchangeCodeForSession(code)
              : await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type || 'email' });
            return !result.error;
          } catch {
            return false;
          }
        })();
      }
      void confirmation.current.then((confirmed) => {
        if (!active) return;
        setStatus(confirmed ? 'confirmed' : 'failed');
        if (confirmed) router.replace('/');
      });
    }
    return () => { active = false; };
  }, [authError, code, hasCallback, router, tokenHash, type]);

  return (
    <View style={styles.container}>
      {hasCallback && status === 'pending' && <ActivityIndicator color="#4F46E5" />}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#0B0F17' },
  message: { marginTop: 16, color: '#FFFFFF', fontSize: 16, textAlign: 'center', lineHeight: 24 },
});