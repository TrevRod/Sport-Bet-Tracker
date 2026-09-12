# Sports Betting Tracker & PFF Predictive Analytics

A comprehensive, professional sports betting tracker and predictive modeling web application powered by Pro Football Focus (PFF) grades, advanced statistical modeling, and AI-driven edge analysis.

## Key Features

- **Weekly Game Insights & Adaptive Line Engine**:
  - Full NFL schedule navigation with game-by-game betting recommendations for Spreads and Totals (Over/Under).
  - Dynamic recalculation: When games finish (or are simulated), cumulative team stats (PPG, PAPG, yards, EPA, PFF grades) automatically re-aggregate and update all future week line projections.
  - Interactive game simulator & manual final score editor.
  - One-click bet slip integration to log recommended lines or point totals straight to your active tracker.

- **Bet Tracker & Bankroll Management**:
  - Track active, won, lost, pushed, or cashed-out bets with unit sizing, ROI, and net profit calculations.
  - Filter by sportsbook (DraftKings, FanDuel, BetMGM, Caesars, etc.), bet type, and status.
  - CSV export for external spreadsheet analysis.

- **Predictive Edge Terminal**:
  - Quantitative fair-spread and total modeling comparing bookmaker lines against underlying team efficiency.
  - PFF grade differentials (pass blocking vs. pass rush, coverage vs. receiving) highlighting statistical mismatches.
  - Expected value (+EV) percentages and confidence star ratings.

- **Player Prop Finder**:
  - Prop market projection models for passing yards, rushing yards, receiving yards, and touchdowns.
  - Matchup grading factoring in opposing defense coverage and pressure metrics.

- **Interactive PFF Team Matrix**:
  - 32-team database with overall, offensive, defensive, passing, pass-rush, and coverage grades.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend / Dev**: Node.js, Express, Vite
- **Data Persistence**: LocalStorage state management with automatic schema syncing

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd sports-betting-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` if you plan to use server-side AI integrations:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```
