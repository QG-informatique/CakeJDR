# Migration Notes

## Bug fixes

- **Hydration mismatch**: the animated dice background used `Math.random()` during server render, causing attributes to differ when the client hydrated. The new `DiceBackground` component generates its SVG rectangles only after the client is hydrated using the `useClientHydrated` hook.
- **Login failures**: corrupted data or registration errors would always display a generic "Erreur interne". Parsing of `jdr_profile` is now guarded and clearer messages are shown. Profiles are stored as `{pseudo, password, isMJ?, color?}` and a `jdr_profile_change` event is dispatched.

## How to test

1. Start the dev server with `npm run dev` and open the app.
2. Create a new account from the login screen, then you are redirected to `/menu`.
3. Refresh the page, log out from the menu, then log in again with the same credentials.
4. No hydration warnings should appear in the console.
