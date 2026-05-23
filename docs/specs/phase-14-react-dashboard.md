# Phase 14 — React Dashboard

## Goal

Build the engineer-facing UI: incident list with filtering, incident detail with
root cause and recommendations, and a metrics panel with charts.  All data
comes from the FastAPI endpoints added in Phase 12.

---

## Stack

| Concern | Library |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 (dev proxy: `/api` → `localhost:8000`) |
| Routing | React Router v6 |
| Server state | TanStack Query v5 (30 s stale time, auto-refetch) |
| HTTP | Axios (base URL `/api/v1`) |
| Charts | Recharts v2 |
| Styling | Tailwind CSS v3 |
| Utilities | clsx |

---

## File Layout

```
apps/dashboard/
  package.json
  vite.config.ts          # dev proxy for /api
  tailwind.config.js
  index.html
  src/
    main.tsx
    App.tsx               # QueryClientProvider + BrowserRouter + Routes
    index.css             # Tailwind directives
    api/
      client.ts           # axios instance (baseURL /api/v1)
      incidents.ts        # listIncidents, getIncident
      metrics.ts          # getMetrics
    types/
      incident.ts         # IncidentListItem, IncidentDetail, etc.
      metrics.ts          # MetricsResponse, StatusCount, etc.
    components/
      Layout.tsx          # top nav (Incidents / Metrics) + <Outlet>
      PriorityBadge.tsx   # colour-coded priority pill
      StatusBadge.tsx     # colour-coded status pill
      Pagination.tsx      # prev/next with page info
    pages/
      IncidentList.tsx    # table, priority+status filters, pagination
      IncidentDetail.tsx  # root cause, recommendations, trace, work items
      MetricsPage.tsx     # stat cards + bar charts + top-errors table
```

---

## Views

### Incident List (`/incidents`)

- Table columns: exception type (short), message (truncated), priority badge,
  status badge, created timestamp, ADO bug link.
- Filters: priority select + status select.  Changing a filter resets to page 1.
- Row click navigates to `/incidents/:id`.
- ADO bug link opens in new tab without triggering row navigation.

### Incident Detail (`/incidents/:id`)

- Header: short exception type, priority + status badges, back link.
- **Work items** section: badge links to ADO bug (opens in new tab).
- **Root cause** section: summary paragraph + structured breakdown
  (component, likely cause, contributing factors, confidence %).
- **Recommendations** section: ordered list, each showing title, description,
  suggested change (monospace block), affected files (monospace pills),
  confidence %.
- **Stack trace** section: pre-formatted dark block.
- **Agent trace** section: table with agent name, prompt version, output
  summary, latency (ms), error.

### Metrics (`/metrics`)

- Three stat cards: Total Incidents / Analyzed / Analysis Rate.
- Side-by-side bar charts: by status (indigo bars) and by priority
  (colour-coded: critical=red, high=orange, medium=yellow, low=green).
- Top exception types table.
- Auto-refetches every 30 s.

---

## Makefile Targets

| Target | Command |
|---|---|
| `make ui-install` | `cd apps/dashboard && npm install --legacy-peer-deps` |
| `make ui-build` | `cd apps/dashboard && npm run build` |
| `make ui-dev` | `cd apps/dashboard && npm run dev` (port 5173) |

---

## Acceptance Criteria

- `tsc --noEmit` reports zero errors.
- `npm run build` produces a clean Vite bundle.
- Incident list renders with priority and status filter dropdowns.
- Clicking a row navigates to detail; back link returns to list.
- Metrics page shows charts and stat cards.
- Work item links visible on detail page when present.
