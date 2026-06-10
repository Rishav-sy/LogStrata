# LogStrata V1 Product Design

## Objective

Deliver a cohesive LogStrata v1 product with:

- Correct public navigation and real Supabase authentication.
- A public, fully functional DevOps playground at `/dashboard`.
- A protected single-user workspace at `/console`.
- Complete account workspace and saved playground scenario features.
- A persisted cluster-management foundation without Kubernetes or cloud-provider integrations.
- A refined dashboard, marketing site, documentation experience, and shared product design.

## Delivery Sequence

Implementation will proceed incrementally:

1. Define the Supabase schema, migrations, row-level security policies, generated types, and data contracts.
2. Fix public navigation and implement authentication.
3. Build the authenticated `/console` shell and its account, scenario, and cluster modules.
4. Integrate authenticated scenario persistence into the public dashboard.
5. Refine the dashboard, marketing site, documentation, and cross-product cohesion.

This sequence preserves the existing simulator while establishing backend contracts early and introducing the new console as isolated modules.

## Route Architecture

### Public Routes

- `/`: Marketing landing page.
- `/docs/*`: Technical documentation.
- `/dashboard`: Fully functional public simulator requiring no account.
- `/login`: Email/password and Google OAuth login.
- `/signup`: Email/password and Google OAuth registration.
- `/auth/callback`: Server-side OAuth code exchange and redirect handling.

### Protected Routes

- `/console`: Workspace overview.
- `/console/account`: Profile, authentication, session, and sign-out controls.
- `/console/scenarios`: Saved scenario management.
- `/console/clusters`: Cluster foundation management and onboarding.

Protected routes validate the Supabase session server-side. Unauthenticated access redirects to `/login` with a safe return path.

## Authentication

Supabase Auth will support:

- Email and password registration and login.
- Google OAuth registration and login.
- Password reset and password update.
- Server-validated sessions.
- Sign out.

Magic-link authentication is explicitly deferred.

The app will support both a local Supabase CLI stack and hosted Supabase projects through environment variables. Local migrations and seed-safe development configuration will be committed. Hosted secrets will never be committed.

## Data Model

All persisted product data belongs directly to one authenticated user. Organizations, teams, invitations, and shared ownership are out of scope for v1.

### `profiles`

- `id`: UUID primary key matching `auth.users.id`.
- `display_name`: Optional user-visible name.
- `avatar_url`: Optional avatar URL.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.

A database trigger creates a profile after signup. Users may read and update only their own profile.

### `saved_scenarios`

- `id`: UUID primary key.
- `user_id`: Owning user.
- `name`: Required scenario name.
- `description`: Optional description.
- `configuration`: Validated JSON representation of playground state.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.

Users may create, read, update, duplicate, and delete only their own scenarios.

### `clusters`

- `id`: UUID primary key.
- `user_id`: Owning user.
- `name`: Required display name.
- `provider`: Enumerated provider selection.
- `environment`: Enumerated environment classification.
- `status`: Enumerated user-managed lifecycle status.
- `connection_metadata`: Validated JSON containing non-secret connection identifiers and descriptive configuration.
- `onboarding_step`: Current onboarding progress.
- `last_status_change_at`: Status-change timestamp.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.

Supported initial providers will include generic Kubernetes, Amazon EKS, Google GKE, Azure AKS, and local development. Cluster credentials, tokens, kubeconfigs, and cloud secrets must not be stored.

## Security

Row Level Security will be enabled on every application table. Policies will require `user_id = auth.uid()` for all user-owned reads and mutations. Profile access will require `id = auth.uid()`.

All mutations will execute through validated server-side functions or server actions. Client-provided ownership IDs will not be trusted. Mutation handlers will derive ownership from the authenticated session.

Redirect paths will be restricted to internal application routes to prevent open redirects. Authentication and database errors shown to users will avoid exposing sensitive implementation details.

## Authenticated Console

The console will use a dedicated responsive application shell with:

- Sidebar navigation on desktop.
- Compact mobile navigation.
- Account menu and sign-out action.
- Consistent loading, empty, error, unauthorized, and not-found states.

### Overview

The overview will show:

- Account summary.
- Saved scenario count and recent scenarios.
- Cluster count grouped by status.
- Incomplete cluster onboarding shortcuts.

### Account Workspace

The account workspace will fully implement:

- Profile display and editing.
- Authentication provider details.
- Password update for password-capable accounts.
- Current session information.
- Sign out.

### Saved Playground Scenarios

The scenarios module will fully implement:

- Search and list views.
- Create and save from the playground.
- Rename and description editing.
- Duplication.
- Deletion with confirmation.
- Opening a saved configuration in the public playground.

Scenario configuration will use a versioned, validated serialization contract so future dashboard changes can migrate stored scenarios.

### Cluster Management Foundation

The cluster module will implement:

- Create, read, update, and delete operations.
- Provider selection.
- Environment classification.
- Non-secret connection metadata.
- User-managed status tracking.
- Guided onboarding UI and persisted onboarding progress.
- List and detail views.

Actual Kubernetes connectivity, provider APIs, credential validation, live health checks, and automated status synchronization are deferred.

## Public Playground

The `/dashboard` route remains usable without authentication and preserves its simulation capabilities.

Authenticated users receive save and load controls backed by Supabase. Unauthenticated users can use every simulation feature but will be prompted to log in when attempting persistence. After authentication, the user returns to the intended dashboard flow.

Saved scenarios will capture the meaningful simulator configuration, including traffic mode, injected failures, resource overrides, autoscaling settings, and selected anomaly or scenario state. Ephemeral logs, random IDs, timers, and telemetry history will not be persisted.

## Navigation And Marketing

Every navigation item must target a real route or section:

- Features and Architecture target valid landing-page anchors.
- Playground targets `/dashboard`.
- Docs targets `/docs/getting-started`.
- Log In targets `/login`.
- Sign Up targets `/signup`.
- Authenticated console actions target `/console`.

Misleading footer links and placeholder destinations will be corrected or removed. The dashboard, marketing site, docs, auth pages, and console will share a coherent visual system while preserving the denser operational character of the simulator.

## Validation And Error Handling

Server-side validation will cover:

- Authentication forms.
- Profile updates.
- Scenario names, descriptions, and serialized configuration.
- Cluster names, provider values, environment values, statuses, onboarding steps, and connection metadata.

Forms will preserve submitted values and show actionable inline errors. The UI will provide explicit loading, empty, unauthorized, not-found, and recoverable error states.

Missing Supabase environment configuration will produce a clear development-time configuration error rather than silently degrading authentication or persistence.

## Testing And Verification

Focused automated coverage will include:

- Scenario serialization and validation.
- Profile and cluster validators.
- Internal redirect sanitization.
- Data-access ownership behavior where practical.

Database migrations will define and verify RLS policies. Manual verification will cover:

- All public and footer navigation links.
- Email/password signup and login.
- Google OAuth callback behavior.
- Password reset and update.
- Protected console redirects.
- Account updates and sign out.
- Scenario CRUD and playground loading.
- Cluster CRUD and onboarding progress.
- Anonymous playground operation.
- Responsive navigation and major console states.

ESLint and the Next.js production build will run after each major delivery stage. Relevant Next.js 16 documentation in `node_modules/next/dist/docs/` will be consulted before implementation.

## Explicitly Deferred

- Magic-link authentication.
- Organizations, teams, invitations, and shared resources.
- Kubernetes API connectivity.
- Cloud-provider API connectivity.
- Storage of cluster or provider credentials.
- Automated cluster status checks.
- Production billing and subscriptions.
