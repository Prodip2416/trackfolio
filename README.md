# TrackFolio 📈

TrackFolio is a modern, comprehensive **Stock Portfolio Management & Analytics Dashboard** built for investors to track their investments, monitor dividends, analyze trading performance, and get real-time price alerts.

Built with **Next.js 15 (App Router)**, **Prisma**, **Supabase PostgreSQL**, and **Tailwind CSS**.

## ✨ Key Features

### 1. 📊 Interactive Dashboard
- **KPI Summary Cards**: Quickly view Total Investment, Current Portfolio Value, Total Profit/Loss, and Dividend Income.
- **Visual Analytics**: Interactive Pie Charts for Sector/Portfolio allocation and Bar Charts for Monthly Trade Activity & Dividend Yields.
- **Recent Trades**: A quick glance at your latest Buy/Sell activities.

### 2. 👁️ Watchlist & Price Alerts
- **Real-Time Monitoring**: Add stocks to your personalized watchlist and fetch live prices from the Dhaka Stock Exchange (DSE).
- **Smart Price Alerts**: Set minimum and maximum price ranges for Buy/Sell decisions. Get visual indicators (🟢 In Range, 🔴 Above Range, 🟡 Below Range) based on current live prices.

### 3. 💼 Portfolio & Ledger
- **Asset Ledger**: A detailed ledger showing transaction-by-transaction details of your holdings with total share, average price, and bonus stock calculations.
- **Average Down Calculator**: Built-in tools to calculate how purchasing more shares at a lower price will affect your overall portfolio average.

### 4. 📝 Trade & Dividend History
- **Trade Log Management**: Record and manage BUY/SELL transactions including brokerage fees and quantity.
- **Dividend Tracking**: Track Cash Dividends and Bonus Shares separately. Filter history by specific Stock, Month, and Year.

### 5. 📈 Advanced Analytics
- **Performance**: Track realized vs. unrealized gains.
- **Risk & Diversification**: Analyze sector exposure and portfolio concentration.
- **Trading & Timing**: Analyze your entry and exit points to improve trading strategy.
- **Warnings**: Automated alerts for over-concentrated positions or continuous loss-making assets.

### 6. 📄 Automated Tax & Financial Reports
- Generate precise Buy, Sell, and Dividend Reports for tax season. 
- Auto-calculate total realized profit and brokerage fees for any financial year.

### 7. 🔐 Security & Personalization
- **Supabase Authentication**: Secure Login & Sign-Up flows.
- **i18n Localization**: Fully supports both **English** and **Bengali (বাংলা)** languages.
- **Dark Mode**: Beautifully optimized Light and Dark mode themes.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions)
- **Database**: PostgreSQL (Hosted on [Supabase](https://supabase.com/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Toast Notifications**: `react-hot-toast`

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Node.js** (v18+) and **npm/yarn/pnpm** installed.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/trackfolio.git
cd trackfolio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` file in the root directory and add your Supabase and Prisma credentials:
```env
DATABASE_URL="your_supabase_postgres_connection_string"
DIRECT_URL="your_supabase_postgres_direct_string"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 4. Setup Prisma Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running.

---

## 🏗️ Architecture Note

The project emphasizes a highly modular architecture. Complex UI elements (like the Dashboard, Ledger, and Price Alerts) are broken down into specific, maintainable React components (e.g., `Table`, `Filters`, `SummaryCards`, `Modals`), utilizing **Next.js Server Actions** for data mutations and **Tailwind CSS** for responsive design.
