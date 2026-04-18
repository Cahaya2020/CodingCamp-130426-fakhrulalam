# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application that helps users track their daily spending. It provides a transaction input form, a scrollable transaction history, an auto-updating total balance display, and a pie chart that visualizes spending distribution by category. All data is persisted in the browser's Local Storage. The app is built with plain HTML, CSS, and vanilla JavaScript — no frameworks or backend required.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single spending record consisting of an item name, a monetary amount, and a category.
- **Transaction_List**: The scrollable UI component that displays all recorded transactions.
- **Input_Form**: The UI form through which the user enters a new transaction.
- **Balance_Display**: The UI component at the top of the page that shows the current total balance.
- **Chart**: The pie chart UI component that visualizes spending distribution by category.
- **Storage**: The browser's Local Storage API used to persist transaction data client-side.
- **Category**: One of the three predefined spending classifications: Food, Transport, or Fun.
- **Validator**: The client-side logic responsible for checking that all required form fields are filled before submission.

---

## Requirements

### Requirement 1: Transaction Input

**User Story:** As a user, I want to enter a new transaction using a form, so that I can record my spending quickly.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name, a numeric field for the amount, and a dropdown selector for the category (Food, Transport, Fun).
2. WHEN the user submits the Input_Form with all fields filled, THE App SHALL add the transaction to the Transaction_List and persist it to Storage.
3. WHEN the user submits the Input_Form with all fields filled, THE Input_Form SHALL reset all fields to their default empty state after the transaction is added.
4. IF the user submits the Input_Form with one or more fields empty, THEN THE Validator SHALL display an inline error message indicating which fields are missing.
5. IF the user enters a non-positive number or non-numeric value in the amount field, THEN THE Validator SHALL display an inline error message and prevent the transaction from being added.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions, each showing the item name, amount, and category.
2. WHEN the App loads, THE Transaction_List SHALL populate from Storage so that previously recorded transactions are visible.
3. WHEN a new transaction is added, THE Transaction_List SHALL update immediately to include the new entry without requiring a page reload.
4. THE Transaction_List SHALL provide a delete control for each transaction entry.
5. WHEN the user activates the delete control for a transaction, THE App SHALL remove that transaction from the Transaction_List and from Storage.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total amount spent at the top of the page, so that I always know my current spending total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts currently in Storage.
2. WHEN a transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a transaction is deleted, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
4. WHEN Storage contains no transactions, THE Balance_Display SHALL show a total of zero.

---

### Requirement 4: Spending Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render a pie chart that shows the proportion of total spending for each category (Food, Transport, Fun).
2. WHEN a transaction is added, THE Chart SHALL update automatically to reflect the new spending distribution.
3. WHEN a transaction is deleted, THE Chart SHALL update automatically to reflect the revised spending distribution.
4. WHEN Storage contains no transactions, THE Chart SHALL display an empty or placeholder state.
5. THE Chart SHALL visually distinguish each category using a distinct color.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between sessions, so that I do not lose my spending history when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a transaction is added, THE Storage SHALL persist the transaction so that it survives a page reload.
2. WHEN a transaction is deleted, THE Storage SHALL remove the transaction so that it is no longer present after a page reload.
3. WHEN the App loads, THE App SHALL read all transactions from Storage and restore the Transaction_List, Balance_Display, and Chart to the state matching the stored data.

---

### Requirement 6: Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on my phone, so that I can track spending on the go.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that adapts to screen widths from 320px to 1280px without horizontal scrolling.
2. THE Input_Form, Transaction_List, Balance_Display, and Chart SHALL remain fully usable on touch-screen devices.
3. THE App SHALL use typography with a minimum font size of 14px for all body text to ensure readability on small screens.

---

### Requirement 7: Browser Compatibility

**User Story:** As a user, I want the app to work in any modern browser, so that I am not restricted to a specific browser.

#### Acceptance Criteria

1. THE App SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari.
2. THE App SHALL operate as a standalone web page that requires no installation, server, or build step to run.

---

### Requirement 8: Code Structure

**User Story:** As a developer, I want the codebase to follow a clear folder structure, so that the project is easy to maintain.

#### Acceptance Criteria

1. THE App SHALL contain exactly one CSS file located in the `css/` directory.
2. THE App SHALL contain exactly one JavaScript file located in the `js/` directory.
3. THE App SHALL use only HTML, CSS, and vanilla JavaScript with no external frameworks or backend dependencies beyond a charting library (e.g., Chart.js) loaded via CDN.

---

### Requirement 9: Custom Categories

**User Story:** As a user, I want to create my own spending categories beyond the defaults, so that I can organize my expenses in a way that fits my lifestyle.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a control that allows the user to add a new custom category by entering a non-empty, unique name.
2. WHEN the user adds a custom category, THE App SHALL append it to the category dropdown so that it is immediately available for selection.
3. WHEN the user adds a custom category, THE Storage SHALL persist the category so that it is present after a page reload.
4. WHEN the App loads, THE App SHALL restore all custom categories from Storage and include them in the category dropdown alongside the default categories (Food, Transport, Fun).
5. IF the user attempts to add a category whose name, compared case-insensitively, matches an existing category, THEN THE Validator SHALL display an inline error message and prevent the duplicate from being added.
6. IF the user attempts to add a category with an empty name, THEN THE Validator SHALL display an inline error message and prevent the category from being added.
7. THE App SHALL provide a delete control for each custom category that has no associated transactions.
8. WHEN the user activates the delete control for a custom category, THE App SHALL remove that category from the dropdown and from Storage.

---

### Requirement 10: Monthly Summary View

**User Story:** As a user, I want to see a summary of my spending grouped by month, so that I can understand my spending trends over time.

#### Acceptance Criteria

1. THE App SHALL provide a Monthly_Summary view that groups transactions by calendar month and year (e.g., "June 2025").
2. THE Monthly_Summary SHALL display the total amount spent and the transaction count for each month.
3. THE Monthly_Summary SHALL display months in reverse-chronological order, with the most recent month first.
4. WHEN a transaction is added, THE Monthly_Summary SHALL update automatically to reflect the new totals without requiring a page reload.
5. WHEN a transaction is deleted, THE Monthly_Summary SHALL update automatically to reflect the revised totals without requiring a page reload.
6. WHEN Storage contains no transactions, THE Monthly_Summary SHALL display an empty or placeholder state indicating no data is available.
7. THE App SHALL record the date of each transaction at the time it is submitted, and THE Storage SHALL persist this date alongside the transaction.

---

### Requirement 11: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by amount or category, so that I can quickly find and compare entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL provide a sort control that allows the user to select a sort field of either "Amount" or "Category".
2. THE Transaction_List SHALL provide a sort-direction control that allows the user to select ascending or descending order.
3. WHEN the user changes the sort field or sort direction, THE Transaction_List SHALL re-render immediately in the selected order without requiring a page reload.
4. WHEN sorted by "Amount", THE Transaction_List SHALL order entries by their numeric amount value.
5. WHEN sorted by "Category", THE Transaction_List SHALL order entries alphabetically by category name.
6. WHEN two transactions share the same sort-field value, THE Transaction_List SHALL use the transaction entry order as a stable tiebreaker.
7. THE App SHALL apply the default sort order of most-recently-added first when no explicit sort selection has been made.

---

### Requirement 12: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit and see a visual warning when I exceed it, so that I can stay within my budget.

#### Acceptance Criteria

1. THE App SHALL provide a Limit_Input field that allows the user to set a positive numeric spending limit.
2. WHEN the user sets a spending limit, THE Storage SHALL persist the limit so that it is present after a page reload.
3. WHEN the App loads, THE App SHALL restore the spending limit from Storage and apply it immediately.
4. WHILE the total spending in the Balance_Display equals or exceeds the spending limit, THE Balance_Display SHALL apply a distinct visual highlight (e.g., a warning color) to indicate the limit has been reached or exceeded.
5. WHILE the total spending in the Balance_Display is below the spending limit, THE Balance_Display SHALL display in its normal style with no warning highlight.
6. WHEN a transaction is added or deleted and the new total crosses the spending limit threshold, THE Balance_Display SHALL update its visual state immediately without requiring a page reload.
7. IF the user enters a non-positive number or non-numeric value in the Limit_Input field, THEN THE Validator SHALL display an inline error message and retain the previously saved limit.
8. THE App SHALL provide a control to clear the spending limit, after which THE Balance_Display SHALL revert to its normal style regardless of the current total.

---

### Requirement 13: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light display modes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a Theme_Toggle control that switches the display between dark mode and light mode.
2. WHEN the user activates the Theme_Toggle, THE App SHALL apply the selected theme to all visible UI components immediately without requiring a page reload.
3. WHEN the user activates the Theme_Toggle, THE Storage SHALL persist the selected theme so that it is restored after a page reload.
4. WHEN the App loads, THE App SHALL read the persisted theme from Storage and apply it before rendering any visible content, preventing an unstyled flash.
5. IF no theme preference is found in Storage, THEN THE App SHALL apply the theme that matches the operating system's color-scheme preference as reported by the browser.
6. THE App SHALL ensure that both dark and light themes meet a minimum contrast ratio of 4.5:1 between text and background colors, in compliance with WCAG 2.1 Level AA.
