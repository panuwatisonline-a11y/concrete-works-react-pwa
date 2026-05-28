# Job Scope Audit Snapshot

Updated: 2026-05-28 09:38 +07

## Purpose

This document is a quick reference for which data paths are job-scoped and which are intentionally global.

## Scoped By Default (Current Standard)

- **Read/Write helpers**: `applyScopeToQuery`, `scopedSelect`, `fetchScopedRows`, `fetchScopedRowById`, `updateScopedRowById`, `deleteScopedRowById`
- **Write with job_id**: `withInsertJobId`, `insertScopedRow`, `insertScopedRowReturning`
- **Core resolver**: `resolveQueryJobScope`, `resolveInsertJobId`, `applyJobScope`

## Scoped Domains (Verified)

- **Request flow**
  - list/count/search/status summary
  - detail/edit/new/clone
  - request mutations and request logs
- **Master data admin**
  - Client, Location, Structure, Concrete Works, Mixed Code
  - ABC Code + segments, WBS Code + segments
  - Compression Machine, Inspector
- **CST flow**
  - CST create/edit/delete/read
  - CST report number generation logic
  - CST report/print data fetching
- **Analytics**
  - Admin Dashboard
  - Loss Concrete
  - Concrete Summary
  - booking/summary-related datasets
- **Printing data sources**
  - checklist print request fetch
  - CST print request fetch

## Inspector Scope Notes

- `inspectorScope` now resolves inspector rows through scoped inspector queries.
- Membership updates are guarded to prevent modifying inspector lines outside current job scope.

## Global By Design (Intentional)

- `Status` registry
- `Jobs` registry
- profile onboarding/update flows (`profiles` in auth/profile pages)
- push subscription table (`user_push_subscriptions`)

## Guardrails For New Code

- For any job-scoped table, do not call `supabase.from(... )` directly from feature code unless it is wrapped by scope-aware helper.
- Prefer `jobScopeQueries` helpers for all CRUD paths.
- If a path must stay global, document it explicitly in code comments and keep it listed in this file.

## Suggested PR Checklist

- [ ] No new direct query to job-scoped tables without scope helper
- [ ] All inserts include `job_id` via helper
- [ ] Detail-by-id paths enforce current job scope
- [ ] Search paths are scoped before ID merge
- [ ] Lints pass for touched files
