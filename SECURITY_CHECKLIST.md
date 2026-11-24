# VogueCraft Production Security & Verification Checklist

This document details the manual security, authorization, data isolation, and compliance verification procedures for VogueCraft.

---

## 1. Account Deletion & Data Purge (GDPR / Right to Erasure)

- [ ] **Edge Function Invocation**:
  - Call the `delete-account` Edge Function via client session (`supabase.functions.invoke('delete-account')`).
  - Confirm the request includes the authenticated user JWT in the `Authorization: Bearer <token>` header.
  - Verify that requests missing a valid Bearer JWT return HTTP `401 Unauthorized`.
- [ ] **Storage Bucket Purge**:
  - Inspect storage buckets: `sketch-thumbnails`, `board-photos`, `ai-motifs`, and `exports`.
  - Confirm that all files stored under the path prefix `{user_id}/` are deleted.
- [ ] **Cascade Table Row Purge**:
  - Verify that the target user record is removed from `auth.users`.
  - Verify that all rows associated with `user_id` are removed via `ON DELETE CASCADE` across:
    - `public.profiles`
    - `public.sketches`
    - `public.boards`
    - `public.board_items`
    - `public.palettes`
    - `public.tech_packs`
    - `public.ai_usage`
    - `public.motifs`
- [ ] **Local Client Cache Invalidation**:
  - Confirm `AsyncStorage` is cleared completely.
  - Confirm the application temporary cache directory (`FileSystem.cacheDirectory`) is purged.
  - Confirm local auth session is cleared and the user is redirected to the `Welcome` screen.
  - Confirm a toast notification `Account deleted` displays.
- [ ] **Re-login Rejection**:
  - Attempt to sign in again using the deleted email and password.
  - Confirm authentication fails with invalid login credentials.
- [ ] **Guest / Anonymous Account Support**:
  - Trigger account deletion on a guest account created via anonymous sign-in.
  - Confirm all temporary data and guest auth records are purged identically.

---

## 2. Authentication, Authorization & Secrets Isolation

- [ ] **Service Role Key Seclusion**:
  - Verify that `SUPABASE_SERVICE_ROLE_KEY` is never referenced, imported, or bundled inside any client-side bundle or screen file.
  - Verify that privileged actions (user deletion, bucket administration) are executed solely inside Supabase Edge Functions where the key is read from server environment variables.
- [ ] **Row Level Security (RLS)**:
  - Verify RLS is enabled on all tables: `profiles`, `sketches`, `boards`, `board_items`, `palettes`, `tech_packs`, `ai_usage`, and `motifs`.
  - Verify policies enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE operations.
  - Attempt cross-tenant queries from an unauthenticated or alternate authenticated session and verify 0 rows are accessible.
- [ ] **Storage Policies**:
  - Verify that storage objects require `(storage.foldername(name))[1] = auth.uid()::text` for SELECT, INSERT, UPDATE, and DELETE.

---

## 3. Legal, Privacy & Compliance Disclosures

- [ ] **Welcome Screen Links**:
  - Verify that unauthenticated users can access both `Privacy Policy` and `Terms of Service` via text links at the bottom of the `Welcome` screen without signing in.
- [ ] **Profile Settings Links**:
  - Verify that authenticated designers can access `Privacy Policy` and `Terms of Service` directly within the Profile screen settings list.
- [ ] **Data Disclosures**:
  - Verify that the Privacy Policy clearly states which data is retained: email address, designer display name, role title, custom sketches, vector paths, moodboard swatches, and uploaded images.
  - Verify explicit disclosure that AI Studio queries transmit design prompts to third-party AI inference providers (Groq and NVIDIA Cloud APIs).

---

## 4. Resilience, Safety & Error Handling

- [ ] **ErrorBoundary**:
  - Intentionally trigger a render error or invalid state in a child component.
  - Verify that instead of a blank white screen, the app displays a styled screen with title, explanation, and an active `Try again` button that recovers the session.
- [ ] **Offline Network Connectivity Banner**:
  - Toggle device/simulator into Airplane mode or disconnect network interfaces.
  - Verify that a global `Offline` banner surfaces automatically.
  - Re-enable connectivity and verify the banner dismisses smoothly.
- [ ] **Production Console Log Sanitization**:
  - Verify that production builds (`!__DEV__`) suppress standard console outputs (`log`, `info`, `debug`, `warn`).
  - Verify that `console.error` sanitizes output to strip email addresses, JWT tokens, and detailed stack objects.
