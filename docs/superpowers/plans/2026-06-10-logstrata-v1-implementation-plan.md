# LogStrata V1 Implementation Plan

## Goal

Implement the approved LogStrata v1 design in incremental, independently verifiable stages while preserving the existing public simulator.

## Technical Direction

- Use Supabase Auth, PostgreSQL, migrations, and Row Level Security.
- Support local Supabase CLI development and hosted Supabase environment configuration.
- Keep `/dashboard` public and fully functional.
- Protect `/console/*` with server-side session checks.
- Use Next.js 16 `proxy.ts` only to refresh auth cookies and perform optimistic redirects.
- Recheck authentication and ownership in every protected server action.
- Keep console pages server-rendered and isolate interactivity in small client form components.
- Use versioned, validated JSON for saved simulator scenarios.

## Phase 1: Supabase And Data Foundation

### Dependencies And Configuration

- Add `@supabase/ssr`, `@supabase/supabase-js`, and `zod`.
- Add `.env.example` with public Supabase URL and publishable key variables.
- Add Supabase local configuration and migrations.
- Document local and hosted setup in the README.

### Database Migration

Create:

- `profiles`
- `saved_scenarios`
- `clusters`
- Provider, environment, and cluster-status enums.
- Updated-at triggers.
- Profile-on-signup trigger.
- Row Level Security policies for all CRUD operations.
- Indexes for user ownership, status, and recent records.

### Application Data Layer

Create:

- Browser, server, and proxy Supabase client helpers.
- Environment validation helper.
- Generated-style database TypeScript types aligned with the migration.
- Authenticated-user helper.
- Internal redirect sanitizer.
- Zod schemas for auth, profiles, scenarios, and clusters.
- Versioned scenario serialization contract.

### Verification

- Run TypeScript/ESLint checks.
- Run production build.
- Inspect migration for ownership and RLS completeness.

## Phase 2: Navigation And Authentication

### Navigation Repair

- Update desktop and mobile header links.
- Route Log In to `/login`.
- Route Sign Up to `/signup`.
- Add authenticated Console navigation state.
- Correct misleading footer routes and remove unavailable legal destinations.
- Avoid browser-global access during render for active anchor styles.

### Auth Routes And Actions

Create:

- `/login`
- `/signup`
- `/forgot-password`
- `/update-password`
- `/auth/callback`
- Auth server actions for email/password signup, login, reset, password update, and sign out.
- Google OAuth initiation.
- Auth form client components using `useActionState`.

### Route Protection

- Add `src/proxy.ts` for Supabase cookie refresh and optimistic `/console` redirects.
- Add server-side authorization checks in the console layout and all console actions.
- Sanitize return paths.

### Verification

- Verify public routes remain public.
- Verify protected route redirects.
- Verify auth form validation and callback handling.
- Run lint and production build.

## Phase 3: Authenticated Console

### Console Shell

Create:

- Protected console layout.
- Responsive sidebar and mobile navigation.
- Account menu and sign-out action.
- Console loading, error, and not-found states.
- Shared cards, empty states, status badges, and form controls.

### Overview

- Query profile, scenario counts, recent scenarios, cluster counts, and incomplete onboarding.
- Render shortcuts to scenario and cluster workflows.

### Account Workspace

- Display account identity and provider information.
- Edit profile display name and avatar URL.
- Display current session metadata.
- Update password.
- Sign out.

### Saved Scenarios

- List and search scenarios.
- Create manually and from dashboard state.
- Edit name and description.
- Duplicate.
- Delete with confirmation.
- Open a saved scenario in `/dashboard`.
- Recheck ownership in every mutation.

### Cluster Foundation

- List clusters with provider, environment, status, and onboarding progress.
- Create clusters through onboarding UI.
- View and edit cluster records.
- Update non-secret connection metadata.
- Update user-managed status.
- Delete with confirmation.
- Make deferred integration boundaries explicit in UI.

### Verification

- Verify single-user ownership behavior.
- Verify empty and error states.
- Verify all CRUD actions.
- Run lint and production build.

## Phase 4: Playground Persistence Integration

### Dashboard Refactor

- Extract scenario-related types and default state from the monolithic dashboard.
- Add a stable scenario import/export boundary without rewriting simulation internals.
- Read a saved scenario ID from a sanitized query parameter.
- Hydrate meaningful configuration fields only.

### Persistence Controls

- Show save/load controls for authenticated users.
- Prompt unauthenticated users to log in only when persistence is requested.
- Save current dashboard configuration through a validated server action.
- Load saved scenarios after ownership validation.
- Preserve anonymous simulator behavior.

### Tests

- Add focused tests for scenario serialization, version handling, and invalid configuration rejection.

### Verification

- Verify anonymous simulation.
- Verify authenticated save/load.
- Verify saved scenarios cannot be loaded across users.
- Run lint and production build.

## Phase 5: Product Refinement

### Dashboard

- Improve information hierarchy and responsive behavior.
- Preserve operational density while reducing visual noise.
- Improve accessibility, keyboard behavior, labels, and status announcements.
- Split oversized dashboard sections into focused components where this directly supports maintenance.

### Marketing

- Correct messaging inconsistencies and unavailable claims.
- Refine primary conversion paths toward Playground, Sign Up, and Docs.
- Reduce the landing page client boundary by extracting static sections when practical.
- Ensure every CTA targets a real route.

### Documentation And Cohesion

- Correct docs navigation and missing-route behavior.
- Align shared headers, footers, typography, spacing, badges, and states.
- Add consistent metadata and route-level loading/error handling.
- Perform responsive and accessibility review.

### Final Verification

- Run ESLint.
- Run production build.
- Run focused automated tests.
- Manually verify all navigation, auth, console CRUD, scenario persistence, responsive states, and public demo behavior.
- Review final git diff for unrelated changes and committed secrets.

## Implementation Constraints

- Do not store kubeconfigs, tokens, cloud credentials, or provider secrets.
- Do not implement Kubernetes or cloud-provider API connections.
- Do not introduce organizations or shared ownership.
- Do not make the public simulator require authentication.
- Do not trust user IDs, record ownership, or redirect paths supplied by the client.
- Do not rely on `proxy.ts` as the sole authorization layer.
