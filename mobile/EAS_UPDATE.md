# EAS Update workflow

BudgetFlow uses EAS Update for JavaScript and bundled asset changes. Native module, native configuration, or other native runtime changes require a new build.

## Configuration

- The Expo project is `skidan007/budgetflow-mobile` with EAS project ID `f83063f6-9ec3-4faf-97ae-d7c0bf757bbc`.
- Android's application ID remains `com.budgetflow.app`.
- `expo-updates` is enabled and points to this EAS project.
- Runtime compatibility uses the `appVersion` policy recommended by Expo for this release workflow. Increment `expo.version` before building whenever a change affects the native runtime; EAS build numbers alone do not change this runtime version.
- The `preview` EAS Build profile uses internal distribution, produces an APK, uses the preview channel, and reads the EAS `preview` environment.
- The `production` profile retains its app bundle and automatic build number behavior, and uses the production channel and EAS `production` environment.

## One-time EAS setup

Create the `preview` and `production` channels in this EAS project if they do not already exist:

```sh
npx eas-cli@latest channel:create preview
npx eas-cli@latest channel:create production
```

Add the following client configuration variables to both the EAS `preview` and `production` environments:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use the existing project values from the secure project configuration. These are client-side variables; never add a Supabase service-role key to an `EXPO_PUBLIC_` variable or to the mobile bundle. Keep `mobile/.env.local` ignored for local development. EAS Build and EAS Update use EAS environments, so the ignored local file is not a substitute for setting these values in EAS. The optional `EXPO_PUBLIC_BUDGETFLOW_GOAL_DIAGNOSTICS` variable can be set to `true` in preview when goal diagnostics are needed.

## Test a JavaScript or UI update

From the `mobile` directory, publish to preview and explicitly select the matching EAS environment:

```sh
npx eas-cli@latest update --channel preview --environment preview --message "Description"
```

Install a preview APK first. Release APKs check for updates on launch and apply a downloaded update after restarting the app.

## Build after native changes

```sh
npx eas-cli@latest build --platform android --profile preview
```

Install the new APK. An existing binary cannot gain `expo-updates` through an OTA update.

## Publish to production

For a JavaScript or bundled asset change compatible with the installed native runtime:

```sh
npx eas-cli@latest update --channel production --environment production --message "Description"
```

When a native binary is required:

```sh
npx eas-cli@latest build --platform android --profile production
```

Increment `expo.version` before any native preview or production build so that incompatible native runtimes do not share an update target. The production profile's automatic build number does not change `expo.version`.
