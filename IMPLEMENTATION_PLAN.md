# TrackFolio Master Implementation Plan

This document serves as the master roadmap for building TrackFolio. We will proceed phase by phase, allowing for testing and verification after each step.

## ✅ Completed Phases
- **Phase 1:** Database Schema & Supabase RLS Setup.
- **Phase 2:** Authentication System (Login/Signup flow).

---

## 🚀 Upcoming Phases (To be executed one by one)

### Phase 3: Stock / Company Management
**Goal:** Allow users to add and manage the companies they have invested in.
- **UI:** Create `/stocks` page to list all tracked stocks.
- **Actions:** Add, Edit, and Delete stocks via Server Actions.
- **Form:** Symbol, Company Name, Sector, and an option to manually update the `current_price`.
- **Validation:** Ensure users can only see and edit their own stocks.

### Phase 4: Transactions (Buy & Sell)
**Goal:** Record stock purchases and sales.
- **UI:** Create `/transactions` page or a modal within the stock details.
- **Actions:** Secure Server Actions to record BUY and SELL transactions.
- **Logic:** 
  - Ensure Sell quantity does not exceed the current holding quantity.
  - Automatically calculate realized gain/loss per sell transaction.

### Phase 5: Dividend Tracking
**Goal:** Track Cash and Bonus dividends received.
- **UI:** Create `/dividends` page to log dividends.
- **Actions:** Add Cash Dividend (flat amount or %) and Bonus Dividend (%).
- **Logic:** Bonus shares should automatically adjust the total holding quantity and recalculate the average buy price (cost basis).

### Phase 6: Portfolio Dashboard & Analytics
**Goal:** Display the user's financial summary on the home page.
- **UI:** Update the main `/` dashboard.
- **Metrics to Calculate on-the-fly:**
  - Current holding quantity per stock.
  - Average buy price (cost basis).
  - Total Invested vs Current Value.
  - Unrealized Gain/Loss & Total Realized Gain/Loss.

### Phase 7: Transaction History & UI Polish
**Goal:** Provide an audit trail and finalize the application look.
- **UI:** Build a chronological timeline of all events (Buys, Sells, Dividends) for a specific stock.
- **Polish:** Enhance the UI with Lucide React icons, loading states, and clean Tailwind CSS styling.

---

## User Review Required
> [!IMPORTANT]
> Please review this Master Plan. Once you approve, I will begin implementing **Phase 3 (Stock Management)**. I have also saved this plan in your project folder as `IMPLEMENTATION_PLAN.md` so you can track the progress!
