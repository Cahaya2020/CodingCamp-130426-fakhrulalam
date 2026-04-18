# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side web application built with vanilla HTML, CSS, and JavaScript. It requires no build step, no server, and no framework — just a browser. All state is persisted in `localStorage`. Chart.js is loaded via CDN for the pie chart.

The app is structured as a single `index.html` entry point, one stylesheet (`css/styles.css`), and one JavaScript module (`js/app.js`). The JS file owns all application logic: state management, DOM rendering, event handling, validation, storage I/O, and chart updates.

### Key Design Decisions

- **No framework**: Keeps the dependency surface minimal and the app instantly runnable from the filesystem.
- **Single JS file**: Avoids module bundling complexity while keeping code organized through clear function grouping.
- **localStorage as the source of truth**: On every mutation (add/delete transaction, add/delete category, set limit, toggle theme), the full state is serialized and written to `localStorage`. On load, state is read once and the entire UI is rendered from it.
- **Chart.js via CDN**: Provides a production-quality pie chart without a build step. Loaded with a `defer` attribute to avoid blocking render.
- **Theme applied before first paint**: A tiny inline `<script>` in `<head>` reads the theme from `localStorage` (or `prefers-color-scheme`) and sets a `data-theme` attribute on `<html>` before any CSS is applied, eliminating flash-of-wrong-theme (FOWT).

---

## Architecture

The application follows a simple **state → render** cycle:

```
User Action
    │
    ▼
Event Handler (js/app.js)
    │
    ├─► Validate input
    │
    ├─► Mutate in-memory state object
    │
    ├─► Persist state to localStorage
    │
    └─► Re-render affected UI regions
            │
            ├─► renderTransactionList()
            ├─► renderBalance()
            ├─► renderChart()
            ├─► renderMonthlySummary()
            └─► renderCategoryDropdown()
```

There is no virtual DOM or reactive framework. Each render function reads from the global `state` object and performs a targeted DOM update (innerHTML replacement or attribute toggle). This keeps the code predictable and debuggable.

### File Structure

```
index.html
css/
  styles.css
js/
  app.js
```

### Theme Initialization (No-Flash Strategy)

```html
<head>
  <!-- Inline script runs synchronously before CSS is parsed -->
  <script>
    (function() {
      var stored = localStorage.getItem('theme');
      var theme = stored
        ? stored
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
  <link rel="stylesheet" href="css/styles.css">
</head>
```

CSS uses `[data-theme="dark"]` selectors to apply the dark palette. The toggle button flips the attribute and writes to `localStorage`.

---

## Components and Interfaces

### HTML Structure (`index.html`)

```
<html data-theme="light|dark">
  <head>
    <!-- inline theme script -->
    <!-- styles.css -->
    <!-- Chart.js CDN (defer) -->
  </head>
  <body>
    <header>
      #balance-display        — total + warning highlight
      #limit-section          — spending limit input + clear button
      #theme-toggle           — dark/light toggle button
    </header>

    <main>
      <section id="form-section">
        #transaction-form     — name, amount, category, submit
        #category-manager     — add custom category input + list
      </section>

      <section id="chart-section">
        <canvas id="spending-chart">
      </section>

      <section id="list-section">
        #sort-controls        — sort field select + direction select
        #transaction-list     — scrollable list of transaction items
      </section>

      <section id="summary-section">
        #monthly-summary      — grouped monthly totals
      </section>
    </main>
  </body>
</html>
```

### JavaScript Functions (`js/app.js`)

#### State Management

| Function | Description |
|---|---|
| `loadState()` | Reads and parses state from `localStorage`; returns default state if absent |
| `saveState()` | Serializes the current `state` object and writes it to `localStorage` |
| `getDefaultState()` | Returns the initial state shape with empty arrays and defaults |

#### Transaction Operations

| Function | Description |
|---|---|
| `addTransaction(name, amount, category)` | Validates, creates a transaction object with a UUID and timestamp, mutates state, saves, re-renders |
| `deleteTransaction(id)` | Removes transaction by ID from state, saves, re-renders |
| `getSortedTransactions()` | Returns a sorted copy of `state.transactions` based on `state.sortField` and `state.sortDirection` |

#### Category Operations

| Function | Description |
|---|---|
| `addCategory(name)` | Validates uniqueness (case-insensitive), appends to `state.categories`, saves, re-renders dropdown |
| `deleteCategory(name)` | Validates no transactions reference the category, removes from state, saves, re-renders |

#### Validation

| Function | Description |
|---|---|
| `validateTransaction(name, amount, category)` | Returns `{ valid: boolean, errors: { name?, amount?, category? } }` |
| `validateCategory(name)` | Returns `{ valid: boolean, error?: string }` |
| `validateLimit(value)` | Returns `{ valid: boolean, error?: string }` |

#### Render Functions

| Function | Description |
|---|---|
| `renderAll()` | Calls all render sub-functions; used on initial load |
| `renderTransactionList()` | Rebuilds `#transaction-list` innerHTML from sorted transactions |
| `renderBalance()` | Updates `#balance-display` text and applies/removes warning class |
| `renderChart()` | Destroys and recreates the Chart.js pie chart from category totals |
| `renderMonthlySummary()` | Rebuilds `#monthly-summary` from transactions grouped by month/year |
| `renderCategoryDropdown()` | Rebuilds the `<select>` options from `state.categories` |
| `renderCustomCategoryList()` | Rebuilds the deletable custom category list in `#category-manager` |

#### Theme

| Function | Description |
|---|---|
| `applyTheme(theme)` | Sets `data-theme` on `<html>`, updates toggle button label, saves to `localStorage` |
| `toggleTheme()` | Reads current theme, flips it, calls `applyTheme()` |

#### Spending Limit

| Function | Description |
|---|---|
| `setLimit(value)` | Validates, saves to state, re-renders balance |
| `clearLimit()` | Removes limit from state, saves, re-renders balance |

#### Utility

| Function | Description |
|---|---|
| `generateId()` | Returns a UUID v4 string using `crypto.randomUUID()` with a `Math.random()` fallback |
| `formatCurrency(amount)` | Returns a locale-formatted currency string |
| `groupByMonth(transactions)` | Returns transactions grouped by `"YYYY-MM"` key, sorted reverse-chronologically |
| `getCategoryTotals(transactions)` | Returns a map of `{ category: totalAmount }` |

---

## Data Models

All state is stored in `localStorage` under the key `"expense_app_state"` as a single JSON object.

### State Shape

```js
{
  transactions: Transaction[],
  categories: string[],          // includes defaults + custom
  limit: number | null,
  sortField: "date" | "amount" | "category",
  sortDirection: "asc" | "desc",
  theme: "light" | "dark"
}
```

### Transaction Object

```js
{
  id: string,          // UUID v4
  name: string,        // item name, non-empty
  amount: number,      // positive float
  category: string,    // must exist in state.categories
  date: string         // ISO 8601 date string, e.g. "2025-06-15T14:32:00.000Z"
}
```

### Default State

```js
{
  transactions: [],
  categories: ["Food", "Transport", "Fun"],
  limit: null,
  sortField: "date",
  sortDirection: "desc",
  theme: "light"   // overridden by inline script before first paint
}
```

### localStorage Keys

| Key | Value |
|---|---|
| `"expense_app_state"` | Full serialized state JSON |

> Note: The `theme` field is also stored inside the state object. The inline `<head>` script reads `localStorage.getItem('theme')` as a separate lightweight key to avoid parsing the full state JSON before first paint. Both are kept in sync by `applyTheme()`.

### Chart.js Integration

Chart.js is loaded via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" defer></script>
```

The chart instance is stored in a module-level variable `let chartInstance = null`. Before each re-render, `chartInstance.destroy()` is called to prevent canvas memory leaks. If there are no transactions, the canvas is hidden and a placeholder message is shown instead.

```js
function renderChart() {
  const totals = getCategoryTotals(state.transactions);
  const canvas = document.getElementById('spending-chart');

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (state.transactions.length === 0) {
    canvas.style.display = 'none';
    document.getElementById('chart-placeholder').style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  document.getElementById('chart-placeholder').style.display = 'none';

  chartInstance = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: Object.keys(totals),
      datasets: [{
        data: Object.values(totals),
        backgroundColor: getCategoryColors(Object.keys(totals))
      }]
    },
    options: { responsive: true }
  });
}
```

### Responsive Layout Strategy

CSS uses a single-column mobile-first layout with a breakpoint at `640px` for wider screens:

```css
/* Mobile-first: single column */
main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

/* Wider screens: two-column */
@media (min-width: 640px) {
  main {
    grid-template-columns: 1fr 1fr;
  }
}
```

All interactive targets meet a minimum touch target size of 44×44px. Font sizes use `rem` units with a base of `16px`, ensuring body text is never below `14px`.

### Color Palette

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#ffffff` | `#1a1a2e` |
| `--surface` | `#f5f5f5` | `#16213e` |
| `--text` | `#1a1a1a` | `#e0e0e0` |
| `--accent` | `#4a90d9` | `#5ba3f5` |
| `--warning` | `#e53e3e` | `#fc8181` |
| `--border` | `#d0d0d0` | `#2d3748` |

All foreground/background pairs meet WCAG 2.1 AA (4.5:1 contrast ratio).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Transaction Persistence Round-Trip

*For any* valid transaction (non-empty name, positive amount, valid category), adding it to the app should result in it appearing in the transaction list and being retrievable from `localStorage` after the operation — and after a simulated page reload, the transaction should still be present in the rendered list.

**Validates: Requirements 1.2, 2.2, 5.1, 5.3**

---

### Property 2: Transaction Deletion Round-Trip

*For any* non-empty set of transactions, deleting a randomly selected transaction should remove it from the rendered transaction list and from `localStorage`, while all other transactions remain unchanged.

**Validates: Requirements 2.5, 5.2**

---

### Property 3: Balance Equals Sum of Transactions

*For any* set of transactions (including the empty set), the value displayed in the Balance_Display should equal the arithmetic sum of all transaction amounts. This must hold after any add or delete operation.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

---

### Property 4: Chart Reflects Category Totals

*For any* set of transactions, the pie chart's data labels should correspond exactly to the set of categories that have at least one transaction, and each segment's value should equal the sum of amounts for that category. When there are no transactions, the chart should not render.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

### Property 5: Distinct Category Colors

*For any* set of category names passed to `getCategoryColors()`, the returned color array should contain no duplicate values — each category receives a visually distinct color.

**Validates: Requirements 4.5**

---

### Property 6: Form Resets After Valid Submission

*For any* valid transaction submission, all form fields (name, amount, category) should be reset to their default empty/initial state immediately after the transaction is added.

**Validates: Requirements 1.3**

---

### Property 7: Validation Rejects Invalid Amounts

*For any* value in the amount field that is zero, negative, or non-numeric, the validator should return an error and the transaction list should remain unchanged (no new transaction added).

**Validates: Requirements 1.5**

---

### Property 8: Validation Reports Missing Fields

*For any* non-empty subset of form fields left empty on submission, the validator should report an error for each missing field and no transaction should be added.

**Validates: Requirements 1.4**

---

### Property 9: Transaction List Renders All Fields

*For any* set of transactions in state, each rendered list item should contain the transaction's name, amount, and category, and should include a delete control.

**Validates: Requirements 2.1, 2.4**

---

### Property 10: Category Persistence Round-Trip

*For any* valid new category name (non-empty, unique case-insensitively), adding it should make it immediately available in the category dropdown, persist it to `localStorage`, and restore it in the dropdown after a simulated page reload alongside the default categories.

**Validates: Requirements 9.2, 9.3, 9.4**

---

### Property 11: Duplicate Category Rejection

*For any* existing category name and any case permutation of that name, attempting to add it as a new category should be rejected with an error message and the category list should remain unchanged.

**Validates: Requirements 9.5, 9.6**

---

### Property 12: Delete Control Visibility for Custom Categories

*For any* application state containing custom categories, a delete control should be visible for each custom category that has zero associated transactions, and no delete control should be visible for custom categories that have one or more associated transactions.

**Validates: Requirements 9.7, 9.8**

---

### Property 13: Monthly Summary Grouping and Ordering

*For any* set of transactions spanning multiple calendar months, `groupByMonth()` should group all transactions by their month/year, compute the correct total amount and transaction count for each group, and return the groups in reverse-chronological order (most recent first).

**Validates: Requirements 10.1, 10.2, 10.3, 10.7**

---

### Property 14: Sort Correctness and Stability

*For any* set of transactions, sorting by "Amount" should produce a list ordered by numeric amount value (ascending or descending as selected), sorting by "Category" should produce a list ordered alphabetically by category name, and when two transactions share the same sort-field value, their relative order should match their original insertion order (stable sort).

**Validates: Requirements 11.4, 11.5, 11.6**

---

### Property 15: Spending Limit Warning Reflects Threshold

*For any* combination of transaction total and spending limit, the Balance_Display should apply the warning highlight class if and only if the total is greater than or equal to the limit. When no limit is set, no warning class should be present regardless of the total.

**Validates: Requirements 12.4, 12.5, 12.6, 12.8**

---

### Property 16: Invalid Limit Rejected

*For any* invalid limit value (zero, negative, non-numeric, empty), the validator should display an error message and the previously stored limit should remain unchanged in `localStorage`.

**Validates: Requirements 12.7**

---

### Property 17: Limit Persistence Round-Trip

*For any* valid positive numeric limit, setting it should persist it to `localStorage` and restore it correctly after a simulated page reload.

**Validates: Requirements 12.2, 12.3**

---

### Property 18: Theme Toggle Round-Trip

*For any* current theme state, activating the Theme_Toggle should switch the `data-theme` attribute on `<html>` to the opposite theme and persist the new theme to `localStorage`. Toggling twice should return to the original theme.

**Validates: Requirements 13.2, 13.3**

---

### Property 19: WCAG Contrast Ratio Compliance

*For any* (foreground, background) color token pair defined in both the light and dark themes, the computed WCAG 2.1 relative luminance contrast ratio should be greater than or equal to 4.5:1.

**Validates: Requirements 13.6**

---

### Property 20: Minimum Font Size

*For any* text-bearing DOM element rendered by the app, its computed `font-size` should be greater than or equal to 14px in both light and dark themes.

**Validates: Requirements 6.3**

---

## Error Handling

### Form Validation Errors

All validation errors are displayed inline, adjacent to the offending field. Errors are cleared when the user modifies the field or successfully submits the form.

| Scenario | Error Location | Message |
|---|---|---|
| Empty item name | Below name field | "Item name is required." |
| Empty amount | Below amount field | "Amount is required." |
| Non-numeric amount | Below amount field | "Amount must be a number." |
| Zero or negative amount | Below amount field | "Amount must be greater than zero." |
| No category selected | Below category dropdown | "Please select a category." |
| Empty category name | Below category input | "Category name cannot be empty." |
| Duplicate category name | Below category input | "A category with this name already exists." |
| Invalid limit value | Below limit input | "Limit must be a positive number." |

### Storage Errors

`localStorage` access is wrapped in try/catch. If `localStorage` is unavailable (e.g., private browsing with storage blocked), the app falls back to in-memory state only and displays a non-blocking banner: "Storage unavailable — your data will not be saved between sessions."

### Chart Errors

If Chart.js fails to load from CDN, the chart section displays a fallback message: "Chart unavailable — please check your internet connection." The rest of the app continues to function normally.

### State Corruption

If the JSON stored in `localStorage` cannot be parsed (corrupted data), `loadState()` catches the error, discards the corrupted data, and initializes with the default empty state. A console warning is logged.

---

## Testing Strategy

### Dual Testing Approach

The testing strategy combines **unit/example-based tests** for specific behaviors and **property-based tests** for universal correctness guarantees.

### Property-Based Testing

**Library**: [fast-check](https://github.com/dubzzz/fast-check) — a mature JavaScript property-based testing library compatible with vanilla JS projects.

**Configuration**: Each property test runs a minimum of **100 iterations** with randomized inputs.

**Tag format**: Each property test is tagged with a comment:
```js
// Feature: expense-budget-visualizer, Property N: <property_text>
```

**Properties to implement as PBT tests** (one test per property):

| Property | Test Description |
|---|---|
| P1: Transaction Persistence Round-Trip | Generate random valid transactions, add them, verify list and storage |
| P2: Transaction Deletion Round-Trip | Generate random transaction sets, delete one, verify removal |
| P3: Balance Equals Sum | Generate random amount arrays, verify displayed sum |
| P4: Chart Reflects Category Totals | Generate random categorized transactions, verify chart data |
| P5: Distinct Category Colors | Generate random category name sets, verify no duplicate colors |
| P6: Form Resets After Submission | Generate random valid transactions, verify form reset |
| P7: Validation Rejects Invalid Amounts | Generate invalid amounts, verify rejection |
| P8: Validation Reports Missing Fields | Generate empty-field subsets, verify error reporting |
| P9: Transaction List Renders All Fields | Generate random transactions, verify DOM completeness |
| P10: Category Persistence Round-Trip | Generate random category names, verify add/persist/restore |
| P11: Duplicate Category Rejection | Generate case permutations of existing names, verify rejection |
| P12: Delete Control Visibility | Generate states with used/unused categories, verify control visibility |
| P13: Monthly Summary Grouping and Ordering | Generate transactions across random months, verify grouping |
| P14: Sort Correctness and Stability | Generate random transaction sets, verify sort output |
| P15: Spending Limit Warning | Generate (total, limit) pairs, verify warning class presence |
| P16: Invalid Limit Rejected | Generate invalid limit values, verify rejection and state preservation |
| P17: Limit Persistence Round-Trip | Generate valid limits, verify persist/restore |
| P18: Theme Toggle Round-Trip | Verify toggle switches theme and persists correctly |
| P19: WCAG Contrast Ratio | Verify all color token pairs meet 4.5:1 ratio |
| P20: Minimum Font Size | Verify all text elements have computed font-size >= 14px |

### Unit / Example-Based Tests

Unit tests cover specific scenarios, UI structure checks, and edge cases not suited for PBT:

- Form contains required input elements (name, amount, category dropdown)
- Sort controls exist with correct options
- Limit input field exists
- Theme toggle button exists
- Default sort order is newest-first
- Clearing the limit removes the warning highlight
- App loads correctly with `data-theme` set before content renders
- OS color-scheme preference is applied when no stored theme exists
- `localStorage` unavailability triggers graceful fallback
- Corrupted `localStorage` data triggers default state initialization
- Chart.js CDN failure shows fallback message

### Integration / Smoke Tests

- App opens correctly from `file://` protocol (no server required)
- All four default browsers render the layout without horizontal scroll at 320px
- Chart.js loads from CDN and renders a pie chart

### Test File Location

Tests are co-located with the source in a `tests/` directory:
```
tests/
  unit/
    validation.test.js
    storage.test.js
    sorting.test.js
    categories.test.js
    theme.test.js
  property/
    transactions.property.test.js
    balance.property.test.js
    chart.property.test.js
    categories.property.test.js
    summary.property.test.js
    sorting.property.test.js
    limit.property.test.js
    theme.property.test.js
    accessibility.property.test.js
```
