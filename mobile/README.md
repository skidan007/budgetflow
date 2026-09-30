# BudgetFlow Mobile

Separate Expo Router app for Android and iOS. The web app remains in `../web` and is not changed by this application.

## Run locally

1. Copy `.env.example` to `.env` and set the existing Supabase project URL and **publishable/anon key**. Never use a service-role key in a client app.
2. From this directory run `npm install`, then `npx expo start`.

Auth sessions use AsyncStorage and Supabase's normal email/password authentication. The app reads and writes the existing `transactions`, `budgets`, `goals`, `financial_profiles`, and `financial_cycles` tables under the signed-in user's RLS policies.

Goals contributions update the existing `current_amount` column. Contribution history is retained on this device because the web implementation keeps that history in browser storage and does not define a shared history column/table.
