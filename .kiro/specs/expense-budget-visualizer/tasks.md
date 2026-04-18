# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a single-page, client-side expense tracker using plain HTML, CSS, and vanilla JavaScript. No build step, no framework. Chart.js 4 is loaded via CDN. All state is persisted in `localStorage`. The implementation proceeds file-by-file, wiring each feature incrementally so the app is runnable at every major milestone.

## Tasks

- [x] 1. Scaffold project files and HTML structure
  - Create `index.html` with the full semantic HTML skeleton: `<header>`, `<main>`, and all named sections (`#balance-display`, `#limit-section`, `#theme-toggle`, `#form-section`, `#category-manager`, `#chart-section`, `#list-section`, `#summary-section`)
  - Add the no-flash inline `<script>` in `<head>` that reads `localStorage.getItem('theme')` (or falls back to `prefers-color-scheme`) and sets `data-theme` on `<html>` before any CSS is parsed
  - Add `<link rel="stylesheet" href="css/styles.css">` and the Chart.js CDN `<script defer>` tag
  - Add `<script src="js/app.js" defer></script>`
  - Create empty `css/styles.css` and `js/app.js` placeholder files
  - _Requirements: 7.2, 8.1, 8.2, 8.3, 13.4_

- [x] 2. Implement CSS — mobile-first layout and theming
  - [x] 2.1 Define CSS custom properties (color tokens) for both `[data-theme="light"]` and `[data-theme="dark"]` using the palette from the design (`--bg`, `--surface`, `--text`, `--accent`, `--warning`, `--border`)
    - Ensure all foreground/background pairs meet WCAG 2.1 AA 4.5:1 contrast ratio
    - _Requirements: 13.6, 6.3_
  - [x] 2.2 Implement mobile-first single-column grid layout for `<main>`, with a `@media (min-width: 640px)` breakpoint switching to two-column
    - All interactive targets must be at least 44×44 px; body font size minimum 14px using `rem` units
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 2.3 Style the header, balance display (normal and `.warning` state), limit section, and theme toggle button
    - _Requirements: 3.1, 12.4, 12.5, 13.1_
  - [x] 2.4 Style the transaction input form, category manager, sort controls, transaction list items, monthly summary, and chart section
    - _Requirements: 1.1, 2.1, 9.1, 10.1, 11.1_
  - [ ]* 2.5 Write property test for WCAG contrast ratio compliance
    - **Property 19: WCAG Contrast Ratio Compliance**
    - **Validates: Requirements 13.6**
  - [ ]* 2.6 Write property test for minimum font size
    - **Property 20: Minimum Font Size**
    - **Validates: Requirements 6.3**

- [x] 3. Implement state management and localStorage persistence (`js/app.js`)
  - [x] 3.1 Implement `getDefaultState()`, `loadState()`, and `saveState()` functions
    - `loadState()` must parse JSON from `localStorage` key `"expense_app_state"`, fall back to default state on parse error, and log a console warning on corruption
    - Wrap all `localStorage` access in try/catch; if storage is unavailable, operate in-memory only and display a non-blocking banner
    - _Requirements: 5.1, 5.2, 5.3, 7.1_
  - [ ]* 3.2 Write unit tests for `loadState()` and `saveState()`
    - Test: corrupted JSON triggers default state and console warning
    - Test: unavailable `localStorage` triggers in-memory fallback and banner
    - _Requirements: 5.3_

- [x] 4. Implement utility functions
  - [x] 4.1 Implement `generateId()` using `crypto.randomUUID()` with a `Math.random()` fallback, `formatCurrency(amount)`, `groupByMonth(transactions)`, and `getCategoryTotals(transactions)`
    - `groupByMonth` must group by `"YYYY-MM"` key and return groups in reverse-chronological order
    - _Requirements: 10.1, 10.2, 10.3, 10.7_
  - [ ]* 4.2 Write property test for monthly summary grouping and ordering
    - **Property 13: Monthly Summary Grouping and Ordering**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.7**

- [x] 5. Implement validation functions
  - [x] 5.1 Implement `validateTransaction(name, amount, category)` returning `{ valid, errors: { name?, amount?, category? } }`
    - Reject empty name, empty/non-numeric/zero/negative amount, missing category
    - _Requirements: 1.4, 1.5_
  - [x] 5.2 Implement `validateCategory(name)` returning `{ valid, error? }`
    - Reject empty name; reject case-insensitive duplicates against `state.categories`
    - _Requirements: 9.5, 9.6_
  - [x] 5.3 Implement `validateLimit(value)` returning `{ valid, error? }`
    - Reject zero, negative, non-numeric, and empty values
    - _Requirements: 12.7_
  - [ ]* 5.4 Write property test for validation rejecting invalid amounts
    - **Property 7: Validation Rejects Invalid Amounts**
    - **Validates: Requirements 1.5**
  - [ ]* 5.5 Write property test for validation reporting missing fields
    - **Property 8: Validation Reports Missing Fields**
    - **Validates: Requirements 1.4**
  - [ ]* 5.6 Write property test for duplicate category rejection
    - **Property 11: Duplicate Category Rejection**
    - **Validates: Requirements 9.5, 9.6**
  - [ ]* 5.7 Write property test for invalid limit rejection
    - **Property 16: Invalid Limit Rejected**
    - **Validates: Requirements 12.7**

- [x] 6. Implement render functions (read-only UI)
  - [x] 6.1 Implement `renderCategoryDropdown()` — rebuilds `<select>` options from `state.categories` (defaults + custom)
    - _Requirements: 1.1, 9.2, 9.4_
  - [x] 6.2 Implement `renderTransactionList()` — rebuilds `#transaction-list` innerHTML from `getSortedTransactions()`; each item shows name, amount, category, and a delete button
    - _Requirements: 2.1, 2.3, 2.4, 11.3_
  - [x] 6.3 Implement `renderBalance()` — updates `#balance-display` text with `formatCurrency(sum)`; adds/removes `.warning` class based on limit threshold
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 12.4, 12.5, 12.6_
  - [x] 6.4 Implement `renderChart()` — destroys previous Chart.js instance, shows placeholder when no transactions, otherwise renders pie chart with `getCategoryColors()` providing distinct colors per category
    - _Requirements: 4.1, 4.4, 4.5_
  - [x] 6.5 Implement `renderMonthlySummary()` — rebuilds `#monthly-summary` from `groupByMonth(state.transactions)`; shows placeholder when empty
    - _Requirements: 10.1, 10.2, 10.3, 10.6_
  - [x] 6.6 Implement `renderCustomCategoryList()` — rebuilds the deletable custom category list in `#category-manager`; shows delete button only for custom categories with zero associated transactions
    - _Requirements: 9.7, 9.8_
  - [x] 6.7 Implement `renderAll()` — calls all render sub-functions; used on initial load
    - _Requirements: 5.3_
  - [ ]* 6.8 Write property test for transaction list rendering all fields
    - **Property 9: Transaction List Renders All Fields**
    - **Validates: Requirements 2.1, 2.4**
  - [ ]* 6.9 Write property test for chart reflecting category totals
    - **Property 4: Chart Reflects Category Totals**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  - [ ]* 6.10 Write property test for distinct category colors
    - **Property 5: Distinct Category Colors**
    - **Validates: Requirements 4.5**
  - [ ]* 6.11 Write property test for balance equals sum of transactions
    - **Property 3: Balance Equals Sum of Transactions**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - [ ]* 6.12 Write property test for delete control visibility for custom categories
    - **Property 12: Delete Control Visibility for Custom Categories**
    - **Validates: Requirements 9.7, 9.8**

- [x] 7. Implement transaction operations and event wiring
  - [x] 7.1 Implement `getSortedTransactions()` — returns a sorted copy of `state.transactions` respecting `state.sortField` and `state.sortDirection`; uses insertion order as stable tiebreaker
    - _Requirements: 11.4, 11.5, 11.6, 11.7_
  - [x] 7.2 Implement `addTransaction(name, amount, category)` — validates input, creates transaction object with UUID and ISO timestamp, mutates state, calls `saveState()`, calls `renderTransactionList()`, `renderBalance()`, `renderChart()`, `renderMonthlySummary()`
    - _Requirements: 1.2, 1.3, 2.3, 3.2, 4.2, 5.1, 10.4, 10.7_
  - [x] 7.3 Implement `deleteTransaction(id)` — removes transaction by ID, calls `saveState()`, re-renders list, balance, chart, and monthly summary
    - _Requirements: 2.5, 3.3, 4.3, 5.2, 10.5_
  - [x] 7.4 Wire the transaction form submit event: call `addTransaction`, display inline validation errors adjacent to offending fields, reset form on success
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 7.5 Wire delete button click events on `#transaction-list` (event delegation) to call `deleteTransaction(id)`
    - _Requirements: 2.4, 2.5_
  - [ ]* 7.6 Write property test for transaction persistence round-trip
    - **Property 1: Transaction Persistence Round-Trip**
    - **Validates: Requirements 1.2, 2.2, 5.1, 5.3**
  - [ ]* 7.7 Write property test for transaction deletion round-trip
    - **Property 2: Transaction Deletion Round-Trip**
    - **Validates: Requirements 2.5, 5.2**
  - [ ]* 7.8 Write property test for form resets after valid submission
    - **Property 6: Form Resets After Submission**
    - **Validates: Requirements 1.3**
  - [ ]* 7.9 Write property test for sort correctness and stability
    - **Property 14: Sort Correctness and Stability**
    - **Validates: Requirements 11.4, 11.5, 11.6**

- [x] 8. Implement category operations and event wiring
  - [x] 8.1 Implement `addCategory(name)` — validates uniqueness (case-insensitive), appends to `state.categories`, calls `saveState()`, calls `renderCategoryDropdown()` and `renderCustomCategoryList()`
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_
  - [x] 8.2 Implement `deleteCategory(name)` — validates no transactions reference the category, removes from `state.categories`, calls `saveState()`, calls `renderCategoryDropdown()` and `renderCustomCategoryList()`
    - _Requirements: 9.7, 9.8_
  - [x] 8.3 Wire the add-category form submit event: call `addCategory`, display inline error below the category input on failure
    - _Requirements: 9.1, 9.5, 9.6_
  - [x] 8.4 Wire delete-category button click events (event delegation on `#category-manager`) to call `deleteCategory(name)`
    - _Requirements: 9.7, 9.8_
  - [ ]* 8.5 Write property test for category persistence round-trip
    - **Property 10: Category Persistence Round-Trip**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [x] 9. Implement spending limit and event wiring
  - [x] 9.1 Implement `setLimit(value)` — validates, saves to `state.limit`, calls `saveState()`, calls `renderBalance()`
    - _Requirements: 12.1, 12.2, 12.7_
  - [x] 9.2 Implement `clearLimit()` — sets `state.limit` to `null`, calls `saveState()`, calls `renderBalance()`
    - _Requirements: 12.8_
  - [x] 9.3 Wire the limit input submit/change event to call `setLimit`; display inline error below the limit field on invalid input; wire the clear-limit button to call `clearLimit()`
    - _Requirements: 12.1, 12.7, 12.8_
  - [ ]* 9.4 Write property test for spending limit warning reflecting threshold
    - **Property 15: Spending Limit Warning Reflects Threshold**
    - **Validates: Requirements 12.4, 12.5, 12.6, 12.8**
  - [ ]* 9.5 Write property test for limit persistence round-trip
    - **Property 17: Limit Persistence Round-Trip**
    - **Validates: Requirements 12.2, 12.3**

- [x] 10. Implement theme toggle and event wiring
  - [x] 10.1 Implement `applyTheme(theme)` — sets `data-theme` on `<html>`, updates toggle button label/icon, writes theme to `localStorage` under both `"theme"` key and inside the state object
    - _Requirements: 13.2, 13.3, 13.4_
  - [x] 10.2 Implement `toggleTheme()` — reads current `data-theme`, flips it, calls `applyTheme()`
    - _Requirements: 13.1, 13.2_
  - [x] 10.3 Wire the `#theme-toggle` click event to call `toggleTheme()` (completed)
    - _Requirements: 13.1_
  - [ ]* 10.4 Write property test for theme toggle round-trip
    - **Property 18: Theme Toggle Round-Trip**
    - **Validates: Requirements 13.2, 13.3**

- [x] 11. Implement sort controls and event wiring
  - [x] 11.1 Add sort field `<select>` (options: Amount, Category) and sort direction `<select>` (options: Ascending, Descending) inside `#sort-controls` in `index.html`
    - _Requirements: 11.1, 11.2_
  - [x] 11.2 Wire change events on both sort selects to update `state.sortField` / `state.sortDirection`, call `saveState()`, and call `renderTransactionList()`
    - _Requirements: 11.3_

- [x] 12. Wire initial load — restore full state on `DOMContentLoaded`
  - Call `loadState()` to populate the global `state` object
  - Restore sort control values, limit input value, and category dropdown from state
  - Apply OS color-scheme preference via `prefers-color-scheme` when no stored theme exists
  - Call `renderAll()` to render the full UI from restored state
  - _Requirements: 2.2, 5.3, 9.4, 11.7, 12.3, 13.4, 13.5_

- [x] 13. Add Chart.js CDN failure handling and storage unavailability banner
  - Detect Chart.js load failure (e.g., `window.Chart` undefined after `DOMContentLoaded`) and display a fallback message in `#chart-section`: "Chart unavailable — please check your internet connection."
  - Ensure the storage-unavailable banner (from task 3.1) is wired to a visible DOM element and dismissible
  - _Requirements: 7.1, 8.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- No test framework setup is required (NFR-1); all test sub-tasks are optional
- Each task references specific requirements for traceability
- The app must be runnable directly from the filesystem (`file://`) with no build step
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations per property if implemented
