/* ============================================================
   Expense & Budget Visualizer — js/script.js
   Vanilla JavaScript, no frameworks, no imports.
   Works when opened directly from the filesystem (file://).
   ============================================================ */

/* ------------------------------------------------------------
   Task 3: Constants & State Management
   ------------------------------------------------------------ */

const STATE_KEY = 'expense_app_state';
const THEME_KEY = 'theme';

/** Returns the initial default application state. */
function getDefaultState() {
  return {
    transactions: [],
    categories: ['Food', 'Transport', 'Fun'],
    limit: null,
    sortField: 'date',
    sortDirection: 'desc',
    theme: 'light'
  };
}

/**
 * Module-level state object. Populated on DOMContentLoaded via loadState().
 * All mutations go through this object, followed by saveState().
 */
let state = getDefaultState();

/** Chart.js instance — kept so we can destroy before re-creating. */
let chartInstance = null;

/** Whether localStorage is available. Determined once on first access. */
let storageAvailable = null;

/** Test whether localStorage is accessible. */
function checkStorageAvailable() {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch (e) {
    storageAvailable = false;
  }
  return storageAvailable;
}

/**
 * Load state from localStorage.
 * Falls back to default state on parse error or missing key.
 * Shows #storage-banner if localStorage is unavailable.
 */
function loadState() {
  if (!checkStorageAvailable()) {
    // Show the storage unavailability banner
    const banner = document.getElementById('storage-banner');
    if (banner) banner.removeAttribute('hidden');
    return getDefaultState();
  }

  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle missing keys from older versions
    return Object.assign(getDefaultState(), parsed);
  } catch (e) {
    console.warn('expense-app: localStorage state corrupted, resetting to defaults.', e);
    return getDefaultState();
  }
}

/**
 * Persist the current state to localStorage.
 * Also writes state.theme under the separate THEME_KEY for the no-flash inline script.
 */
function saveState() {
  if (!checkStorageAvailable()) return; // in-memory only

  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    localStorage.setItem(THEME_KEY, state.theme);
  } catch (e) {
    console.warn('expense-app: failed to save state to localStorage.', e);
  }
}

/* ------------------------------------------------------------
   Task 4: Utility Functions
   ------------------------------------------------------------ */

/**
 * Generate a unique ID using crypto.randomUUID() with a Math.random() fallback.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 UUID using Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a number as a locale currency string (e.g. "$12.50").
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Group transactions by calendar month.
 * @param {Array} transactions
 * @returns {Array<{key: string, label: string, total: number, count: number}>}
 *   Sorted reverse-chronologically (most recent first).
 */
function groupByMonth(transactions) {
  const groups = {};

  transactions.forEach(function (tx) {
    const d = new Date(tx.date);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    const key = year + '-' + String(month + 1).padStart(2, '0');

    if (!groups[key]) {
      const label = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
      groups[key] = { key: key, label: label, total: 0, count: 0 };
    }
    groups[key].total += tx.amount;
    groups[key].count += 1;
  });

  // Sort reverse-chronologically by key ("YYYY-MM" sorts lexicographically)
  return Object.values(groups).sort(function (a, b) {
    return b.key.localeCompare(a.key);
  });
}

/**
 * Compute total spending per category.
 * @param {Array} transactions
 * @returns {Object} { categoryName: totalAmount, ... }
 */
function getCategoryTotals(transactions) {
  const totals = {};
  transactions.forEach(function (tx) {
    if (!totals[tx.category]) totals[tx.category] = 0;
    totals[tx.category] += tx.amount;
  });
  return totals;
}

/**
 * Return an array of distinct hex colors, one per category.
 * Cycles through a palette of 12 colors.
 * @param {Array<string>} categories
 * @returns {Array<string>}
 */
function getCategoryColors(categories) {
  const palette = [
    '#4a90d9', // blue
    '#e67e22', // orange
    '#2ecc71', // green
    '#e74c3c', // red
    '#9b59b6', // purple
    '#1abc9c', // teal
    '#f39c12', // yellow
    '#e91e63', // pink
    '#00bcd4', // cyan
    '#8bc34a', // light green
    '#ff5722', // deep orange
    '#607d8b'  // blue grey
  ];
  return categories.map(function (_, i) {
    return palette[i % palette.length];
  });
}

/* ------------------------------------------------------------
   Task 5: Validation Functions
   ------------------------------------------------------------ */

/**
 * Validate a transaction form submission.
 * @param {string} name
 * @param {string} amount
 * @param {string} category
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateTransaction(name, amount, category) {
  const errors = {};

  // Name validation
  if (!name || !name.trim()) {
    errors.name = 'Item name is required.';
  }

  // Amount validation
  if (amount === '' || amount === null || amount === undefined) {
    errors.amount = 'Amount is required.';
  } else {
    const num = parseFloat(amount);
    if (isNaN(num)) {
      errors.amount = 'Amount must be a number.';
    } else if (num <= 0) {
      errors.amount = 'Amount must be greater than zero.';
    }
  }

  // Category validation
  if (!category || !category.trim()) {
    errors.category = 'Please select a category.';
  }

  return { valid: Object.keys(errors).length === 0, errors: errors };
}

/**
 * Validate a new custom category name.
 * @param {string} name
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCategory(name) {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Category name cannot be empty.' };
  }

  const normalized = name.trim().toLowerCase();
  const duplicate = state.categories.some(function (c) {
    return c.toLowerCase() === normalized;
  });

  if (duplicate) {
    return { valid: false, error: 'A category with this name already exists.' };
  }

  return { valid: true };
}

/**
 * Validate a spending limit value.
 * @param {string|number} value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateLimit(value) {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Limit must be a positive number.' };
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: 'Limit must be a positive number.' };
  }
  if (num <= 0) {
    return { valid: false, error: 'Limit must be a positive number.' };
  }

  return { valid: true };
}

/* ------------------------------------------------------------
   Task 6: Render Functions
   ------------------------------------------------------------ */

/**
 * Rebuild the #item-category <select> options from state.categories.
 * Preserves the "Select a category" placeholder as the first disabled option.
 */
function renderCategoryDropdown() {
  const select = document.getElementById('item-category');
  if (!select) return;

  // Remember current selection so we can restore it if still valid
  const currentValue = select.value;

  select.innerHTML = '<option value="" disabled selected>Select a category</option>';

  state.categories.forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // Restore selection if still valid
  if (currentValue && state.categories.includes(currentValue)) {
    select.value = currentValue;
  }
}

/**
 * Rebuild #transaction-list from getSortedTransactions().
 */
function renderTransactionList() {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  const sorted = getSortedTransactions();
  list.innerHTML = '';

  sorted.forEach(function (tx) {
    const li = document.createElement('li');

    // Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'transaction-name';
    nameSpan.textContent = tx.name;

    // Amount
    const amountSpan = document.createElement('span');
    amountSpan.className = 'transaction-amount';
    amountSpan.textContent = formatCurrency(tx.amount);

    // Category badge
    const categorySpan = document.createElement('span');
    categorySpan.className = 'transaction-category';
    categorySpan.textContent = tx.category;

    // Date — formatted as "Jun 15"
    const dateSpan = document.createElement('span');
    dateSpan.className = 'transaction-date';
    const d = new Date(tx.date);
    dateSpan.textContent = d.toLocaleString(undefined, { month: 'short', day: 'numeric' });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('data-id', tx.id);
    deleteBtn.setAttribute('aria-label', 'Delete transaction: ' + tx.name);

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(dateSpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

/**
 * Update #balance-display text and apply/remove the "warning" class.
 */
function renderBalance() {
  const display = document.getElementById('balance-display');
  if (!display) return;

  const total = state.transactions.reduce(function (sum, tx) {
    return sum + tx.amount;
  }, 0);

  display.textContent = 'Total: ' + formatCurrency(total);

  if (state.limit !== null && total >= state.limit) {
    display.classList.add('warning');
  } else {
    display.classList.remove('warning');
  }
}

/**
 * Destroy the previous Chart.js instance and create a new pie chart,
 * or show the placeholder if there are no transactions.
 */
function renderChart() {
  const canvas = document.getElementById('spending-chart');
  const placeholder = document.getElementById('chart-placeholder');
  if (!canvas || !placeholder) return;

  // Destroy previous instance to prevent memory leaks
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Check if Chart.js is available
  if (typeof window.Chart === 'undefined') {
    canvas.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Chart unavailable — please check your internet connection.';
    return;
  }

  if (state.transactions.length === 0) {
    canvas.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'No transactions yet — add one to see the chart.';
    return;
  }

  canvas.style.display = 'block';
  placeholder.style.display = 'none';

  const totals = getCategoryTotals(state.transactions);
  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = getCategoryColors(labels);

  chartInstance = new window.Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

/**
 * Rebuild #monthly-summary from groupByMonth(state.transactions).
 */
function renderMonthlySummary() {
  const container = document.getElementById('monthly-summary');
  if (!container) return;

  container.innerHTML = '';

  const groups = groupByMonth(state.transactions);

  if (groups.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No transactions yet.';
    placeholder.style.textAlign = 'center';
    placeholder.style.opacity = '0.6';
    placeholder.style.padding = '2rem 1rem';
    container.appendChild(placeholder);
    return;
  }

  groups.forEach(function (group) {
    const div = document.createElement('div');
    div.className = 'month-group';

    const header = document.createElement('div');
    header.className = 'month-group-header';

    const title = document.createElement('span');
    title.className = 'month-group-title';
    title.textContent = group.label;

    const total = document.createElement('span');
    total.className = 'month-group-total';
    total.textContent = formatCurrency(group.total);

    header.appendChild(title);
    header.appendChild(total);

    const count = document.createElement('div');
    count.className = 'month-group-count';
    count.textContent = group.count + (group.count === 1 ? ' transaction' : ' transactions');

    div.appendChild(header);
    div.appendChild(count);
    container.appendChild(div);
  });
}

/**
 * Rebuild #custom-category-list.
 * Default categories (Food, Transport, Fun): plain <li>, no delete button.
 * Custom categories with 0 transactions: show delete button.
 * Custom categories with 1+ transactions: show "(in use)" label, no delete button.
 */
function renderCustomCategoryList() {
  const list = document.getElementById('custom-category-list');
  if (!list) return;

  list.innerHTML = '';

  const defaultCategories = ['Food', 'Transport', 'Fun'];

  state.categories.forEach(function (cat) {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'category-name';
    nameSpan.textContent = cat;
    li.appendChild(nameSpan);

    const isDefault = defaultCategories.includes(cat);

    if (!isDefault) {
      // Count transactions using this category
      const usageCount = state.transactions.filter(function (tx) {
        return tx.category === cat;
      }).length;

      if (usageCount > 0) {
        // In use — show label, no delete button
        const inUseLabel = document.createElement('span');
        inUseLabel.textContent = '(in use)';
        inUseLabel.style.fontSize = '0.8125rem';
        inUseLabel.style.opacity = '0.65';
        li.appendChild(inUseLabel);
      } else {
        // Not in use — show delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('data-category', cat);
        deleteBtn.setAttribute('aria-label', 'Delete category: ' + cat);
        li.appendChild(deleteBtn);
      }
    }

    list.appendChild(li);
  });
}

/**
 * Call all render functions. Used on initial load and after bulk state changes.
 */
function renderAll() {
  renderCategoryDropdown();
  renderTransactionList();
  renderBalance();
  renderChart();
  renderMonthlySummary();
  renderCustomCategoryList();
}

/* ------------------------------------------------------------
   Task 7: Transaction Operations & Event Wiring
   ------------------------------------------------------------ */

/**
 * Return a sorted copy of state.transactions.
 * Stable sort: preserves insertion order for ties.
 */
function getSortedTransactions() {
  // Tag each transaction with its original index for stable sort
  const indexed = state.transactions.map(function (tx, i) {
    return { tx: tx, index: i };
  });

  indexed.sort(function (a, b) {
    let cmp = 0;

    if (state.sortField === 'date') {
      cmp = a.tx.date.localeCompare(b.tx.date);
    } else if (state.sortField === 'amount') {
      cmp = a.tx.amount - b.tx.amount;
    } else if (state.sortField === 'category') {
      cmp = a.tx.category.localeCompare(b.tx.category);
    }

    // Stable tiebreaker: preserve insertion order
    if (cmp === 0) cmp = a.index - b.index;

    return state.sortDirection === 'asc' ? cmp : -cmp;
  });

  return indexed.map(function (item) { return item.tx; });
}

/**
 * Show inline validation errors for the transaction form.
 * @param {{ name?: string, amount?: string, category?: string }} errors
 */
function showTransactionErrors(errors) {
  document.getElementById('name-error').textContent = errors.name || '';
  document.getElementById('amount-error').textContent = errors.amount || '';
  document.getElementById('category-error').textContent = errors.category || '';
}

/** Clear all transaction form inline errors. */
function clearTransactionErrors() {
  showTransactionErrors({});
}

/**
 * Add a new transaction.
 * @param {string} name
 * @param {string} amount
 * @param {string} category
 */
function addTransaction(name, amount, category) {
  const result = validateTransaction(name, amount, category);

  if (!result.valid) {
    showTransactionErrors(result.errors);
    return;
  }

  clearTransactionErrors();

  const transaction = {
    id: generateId(),
    name: name.trim(),
    amount: parseFloat(amount),
    category: category,
    date: new Date().toISOString()
  };

  state.transactions.push(transaction);
  saveState();

  renderTransactionList();
  renderBalance();
  renderChart();
  renderMonthlySummary();

  // Reset form fields
  document.getElementById('item-name').value = '';
  document.getElementById('item-amount').value = '';
  document.getElementById('item-category').value = '';
}

/**
 * Delete a transaction by ID.
 * @param {string} id
 */
function deleteTransaction(id) {
  state.transactions = state.transactions.filter(function (tx) {
    return tx.id !== id;
  });
  saveState();

  renderTransactionList();
  renderBalance();
  renderChart();
  renderMonthlySummary();
}

/** Wire transaction form and list events. */
function wireTransactionEvents() {
  // Form submit → addTransaction
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('item-name').value;
      const amount = document.getElementById('item-amount').value;
      const category = document.getElementById('item-category').value;
      addTransaction(name, amount, category);
    });
  }

  // Transaction list click (event delegation) → deleteTransaction
  const list = document.getElementById('transaction-list');
  if (list) {
    list.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-id]');
      if (btn) {
        deleteTransaction(btn.getAttribute('data-id'));
      }
    });
  }
}

/* ------------------------------------------------------------
   Task 8: Category Operations & Event Wiring
   ------------------------------------------------------------ */

/**
 * Add a new custom category.
 * @param {string} name
 */
function addCategory(name) {
  const result = validateCategory(name);

  if (!result.valid) {
    const errorEl = document.getElementById('new-category-error');
    if (errorEl) errorEl.textContent = result.error;
    return;
  }

  // Clear error
  const errorEl = document.getElementById('new-category-error');
  if (errorEl) errorEl.textContent = '';

  state.categories.push(name.trim());
  saveState();

  renderCategoryDropdown();
  renderCustomCategoryList();

  // Clear input
  const input = document.getElementById('new-category-input');
  if (input) input.value = '';
}

/**
 * Delete a custom category (only if no transactions reference it).
 * @param {string} name
 */
function deleteCategory(name) {
  // Safety check: ensure no transactions use this category
  const inUse = state.transactions.some(function (tx) {
    return tx.category === name;
  });
  if (inUse) return; // Should not happen if UI is correct, but guard anyway

  state.categories = state.categories.filter(function (c) {
    return c !== name;
  });
  saveState();

  renderCategoryDropdown();
  renderCustomCategoryList();
}

/** Wire category manager events. */
function wireCategoryEvents() {
  // Add category button
  const addBtn = document.getElementById('add-category-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      const input = document.getElementById('new-category-input');
      addCategory(input ? input.value : '');
    });
  }

  // Allow pressing Enter in the new category input
  const newCatInput = document.getElementById('new-category-input');
  if (newCatInput) {
    newCatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCategory(newCatInput.value);
      }
    });
  }

  // Custom category list click (event delegation) → deleteCategory
  const list = document.getElementById('custom-category-list');
  if (list) {
    list.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-category]');
      if (btn) {
        deleteCategory(btn.getAttribute('data-category'));
      }
    });
  }
}

/* ------------------------------------------------------------
   Task 9: Spending Limit & Event Wiring
   ------------------------------------------------------------ */

/**
 * Set the spending limit.
 * @param {string|number} value
 */
function setLimit(value) {
  const result = validateLimit(value);

  if (!result.valid) {
    const errorEl = document.getElementById('limit-error');
    if (errorEl) errorEl.textContent = result.error;
    return;
  }

  // Clear error
  const errorEl = document.getElementById('limit-error');
  if (errorEl) errorEl.textContent = '';

  state.limit = parseFloat(value);
  saveState();
  renderBalance();
}

/** Clear the spending limit. */
function clearLimit() {
  state.limit = null;
  saveState();
  renderBalance();

  // Clear the limit input field and any error
  const input = document.getElementById('limit-input');
  if (input) input.value = '';
  const errorEl = document.getElementById('limit-error');
  if (errorEl) errorEl.textContent = '';
}

/** Wire spending limit events. */
function wireLimitEvents() {
  const setBtn = document.getElementById('set-limit-btn');
  if (setBtn) {
    setBtn.addEventListener('click', function () {
      const input = document.getElementById('limit-input');
      setLimit(input ? input.value : '');
    });
  }

  const clearBtn = document.getElementById('clear-limit-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearLimit);
  }
}

/* ------------------------------------------------------------
   Task 10: Theme Toggle & Event Wiring
   ------------------------------------------------------------ */

/**
 * Apply a theme to the document and persist it.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;

  // Update toggle button label
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  // Write to the separate THEME_KEY for the no-flash inline script
  if (checkStorageAvailable()) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // Ignore storage errors here; saveState() will also attempt this
    }
  }

  saveState();
}

/** Toggle between dark and light themes. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/** Wire theme toggle event. */
function wireThemeEvents() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
}

/* ------------------------------------------------------------
   Task 11: Sort Controls & Event Wiring
   ------------------------------------------------------------ */

/** Wire sort control change events. */
function wireSortEvents() {
  const sortField = document.getElementById('sort-field');
  if (sortField) {
    sortField.addEventListener('change', function () {
      state.sortField = sortField.value;
      saveState();
      renderTransactionList();
    });
  }

  const sortDirection = document.getElementById('sort-direction');
  if (sortDirection) {
    sortDirection.addEventListener('change', function () {
      state.sortDirection = sortDirection.value;
      saveState();
      renderTransactionList();
    });
  }
}

/* ------------------------------------------------------------
   Task 12: Initial Load on DOMContentLoaded
   ------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', function () {
  // Load persisted state (also shows storage banner if unavailable)
  state = loadState();

  // Restore sort controls to match persisted state
  const sortFieldEl = document.getElementById('sort-field');
  if (sortFieldEl) sortFieldEl.value = state.sortField;

  const sortDirectionEl = document.getElementById('sort-direction');
  if (sortDirectionEl) sortDirectionEl.value = state.sortDirection;

  // Restore limit input if a limit is set
  if (state.limit !== null) {
    const limitInput = document.getElementById('limit-input');
    if (limitInput) limitInput.value = state.limit;
  }

  // Apply theme — sync with what the inline script already set on <html>
  // The inline script may have set a different theme than what's in state
  // (e.g. OS preference on first visit), so we read the attribute as the source of truth.
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(currentTheme);
  state.theme = currentTheme;

  // Wire all event listeners
  wireTransactionEvents();
  wireCategoryEvents();
  wireLimitEvents();
  wireThemeEvents();
  wireSortEvents();

  // Task 13: Check for Chart.js CDN failure after wiring events
  // Chart.js is loaded with defer, so by DOMContentLoaded it should be available.
  // We check inside renderChart() as well, but also do an explicit check here.
  if (typeof window.Chart === 'undefined') {
    const canvas = document.getElementById('spending-chart');
    const placeholder = document.getElementById('chart-placeholder');
    if (canvas) canvas.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'block';
      placeholder.textContent = 'Chart unavailable — please check your internet connection.';
    }
  }

  // Render the full UI from loaded state
  renderAll();
});
