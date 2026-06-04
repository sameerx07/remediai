# Phase 14 - React Dashboard

## Goal

Define the canonical React dashboard contract implemented in the Vite frontend.

This phase establishes:
- the route map and shared application shell
- dashboard data fetching and provider wiring
- the incident list, incident detail, metrics, targets, and local logs pages
- the current frontend type expectations used by the dashboard

## Deliverables

### 1) Frontend stack and runtime contract

File: apps/dashboard/package.json

Current stack:
- React 18
- TypeScript
- Vite
- React Router v6
- TanStack Query v5
- Axios
- Recharts
- Tailwind CSS
- Radix UI dialog primitives
- lucide-react icons
- react-error-boundary

Script contract:
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`

### 2) Application composition contract

Files:
- apps/dashboard/src/App.tsx
- apps/dashboard/src/components/Layout.tsx
- apps/dashboard/src/components/shell/AppShell.tsx

Provider contract:
- `ThemeProvider`
- `ToastProvider`
- `QueryClientProvider`
- `BrowserRouter`
- `ErrorBoundary`

Query client contract:
- default query `staleTime` is 30 seconds
- default query `retry` is 1

Shared shell contract:
- Desktop uses a collapsible sidebar persisted in local storage.
- Mobile uses a top bar and bottom tab bar.
- Main content renders through `Layout` and `Outlet`.

Layout contract:
- Displays an integration status bar above page content.
- Displays a dismissible warning banner when integration warnings exist.
- Stores the last dismissed warning text in local storage.

### 3) Route map contract

Files:
- apps/dashboard/src/App.tsx
- apps/dashboard/src/components/shell/nav.tsx

Canonical routes:
- `/metrics`
- `/incidents`
- `/incidents/:id`
- `/targets`
- `/logs`

Navigation contract:
- Default route redirects `/` to `/metrics`.
- Unknown routes render `NotFound`.
- Navigation tabs are Metrics, Incidents, Targets, and Logs.

### 4) API helper and type contract

Files:
- apps/dashboard/src/api/incidents.ts
- apps/dashboard/src/api/metrics.ts
- apps/dashboard/src/api/targets.ts
- apps/dashboard/src/api/integrations.ts
- apps/dashboard/src/api/approvals.ts
- apps/dashboard/src/api/localLogs.ts
- apps/dashboard/src/types/incident.ts
- apps/dashboard/src/types/metrics.ts
- apps/dashboard/src/types/targets.ts
- apps/dashboard/src/types/integrations.ts
- apps/dashboard/src/types/localLogs.ts

HTTP contract:
- Axios client uses `/api/v1` as the base path.

Current frontend incident type contract:
- `IncidentListItem` expects `pr_url` on list rows.
- `IncidentDetail` expects approval and PR fields:
  - approval_status
  - approved_by
  - approved_at
  - approved_recommendation_rank
  - pr_url
  - pr_branch

Current integration type contract:
- `IntegrationsHealthResponse` expects:
  - llm_provider_id
  - retrieval_provider_id
  - scm
  - warnings

This type contract reflects the cleaned frontend implementation and matches the
current backend response shape for the shared dashboard contracts.

### 5) Incident list page contract

File: apps/dashboard/src/pages/IncidentList.tsx

Route:
- `/incidents`

Behavior contract:
- Fetches paginated incidents with page, priority, and status filters.
- Resets the current page to 1 whenever a filter changes.
- Uses desktop and mobile-specific presentations.

Desktop contract:
- Renders a table with columns:
  - Exception
  - Message
  - Priority
  - Status
  - Created
  - PR
- Clicking a row navigates to `/incidents/:id`.
  - The PR link cell uses `pr_url` and stops row click
  propagation when activated.

Mobile contract:
- Renders incident cards instead of a table.
- Shows exception type, truncated message, badges, and created timestamp.

Filtering contract:
- Desktop shows inline filter selects.
- Mobile opens filters in a Radix dialog.

### 6) Incident detail page contract

File: apps/dashboard/src/pages/IncidentDetail.tsx

Route:
- `/incidents/:id`

Behavior contract:
- Loads incident detail by route parameter.
- Shows loading skeletons and a failure empty state.
- Splits content into main detail content and a secondary side column.

Main content contract:
- Root Cause card with summary and selected structured fields.
- Recommendations card with ranked recommendations, confidence text,
  suggested change blocks, and affected file pills.
- Stack Trace card when stack trace exists.

Secondary column contract:
- Create Pull Request approval card when recommendations exist and status is
  `analyzed`.
- Agent Trace card when trace entries exist.

Approval card contract:
- When `approval_status === "approved"`, show queued PR state and optional
  `pr_url` link plus the branch when available.
- Otherwise, show recommendation radio selection plus approve and reject
  actions.
- Approval uses `approveIncident()` with a selected recommendation rank.
- Rejection uses `rejectIncident()`.

### 7) Metrics page contract

File: apps/dashboard/src/pages/MetricsPage.tsx

Route:
- `/metrics`

Behavior contract:
- Fetches dashboard metrics and auto-refreshes every 30 seconds.
- Shows three stat cards:
  - Total Incidents
  - Analyzed
  - Analysis Rate
- Computes analysis rate from total incidents and analyzed incidents.
- Renders two bar charts:
  - incidents by status
  - incidents by priority
- Renders a top exception types card when data exists.
- Renders an empty state when no metric rows exist.

### 8) Targets page contract

File: apps/dashboard/src/pages/TargetsPage.tsx

Route:
- `/targets`

Behavior contract:
- Supports `local` and `kubernetes` environments.
- Loads discovered targets and persisted targets separately.
- Initializes selected target keys from persisted enabled targets.
- Supports search and target-type filtering.
- Supports bulk actions:
  - enable visible
  - disable visible
  - reset
- Saves the full current target selection through `upsertTargets()`.
- Shows success and failure toast notifications for save actions.

Presentation contract:
- Left pane shows discovered targets.
- Right pane shows selected targets.
- Save action is sticky near the bottom on smaller viewports.

### 9) Local logs page contract

File: apps/dashboard/src/pages/LocalLogsPage.tsx

Route:
- `/logs`

Behavior contract:
- Fetches local log lines through `fetchLocalLogs()`.
- Supports filtering by container.
- Supports auto-refresh toggle with a 2 second polling interval.
- Highlights exception lines visually.
- Navigates to the matching incident when an exception log includes an
  `incident_id`.

Presentation contract:
- Page header uses the Observability eyebrow.
- Displays a local-mode badge in the toolbar.
- Shows newest-first log rows in a scrollable card.

## Security Touchpoints

- Dashboard API access is centralized through the Axios client under `/api/v1`.
- Approval and rejection actions require explicit user interaction on the
  incident detail page.
- Integration warnings are displayed to the user but secrets are not rendered.
- Local logs navigation to incidents is limited to incident identifiers already
  present in API log responses.

## Acceptance Criteria

- `npm run build` in `apps/dashboard` completes successfully once frontend
  dependencies are installed in the workspace.
- The application renders with the shared app shell and route navigation for
  Metrics, Incidents, Targets, and Logs.
- `/` redirects to `/metrics`.
- Incident list supports priority and status filtering with pagination.
- Incident detail renders root cause, recommendations, stack trace, agent trace,
  and the current approval panel behavior.
- Metrics page renders stat cards and both charts.
- Targets page supports discovery, selection, bulk changes, and save actions.
- Local logs page supports container filtering, live refresh, and incident
  navigation from exception log rows.

## Out of Scope

- Backend API contract corrections for legacy frontend fields.
- Authentication UX beyond the current API-driven behavior.
- Visual design tokens and shell component internals beyond the behavior needed
  to render the current dashboard.
- Dashboard test strategy expansion or frontend e2e automation.
