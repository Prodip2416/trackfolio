# TrackFolio - AI Agent Instructions

## 📌 Project Overview
**TrackFolio** is a Stock Portfolio Management & Analytics Dashboard for tracking investments, dividends, trades, and price alerts (Dhaka Stock Exchange - DSE).

## 🛠️ Tech Stack
- **Framework**: Next.js 16.3 (App Router)
- **Language**: TypeScript, React 19
- **Database / ORM**: PostgreSQL via Supabase, Prisma ORM
- **Styling**: Tailwind CSS v4
- **Components/Icons**: Lucide React, Framer Motion, Recharts
- **Forms & Validation**: React Hook Form, Zod
- **State/Notifications**: React Hot Toast

## 📐 Architecture & Development Guidelines
When writing or modifying code for this project, always adhere to the following rules:

### 1. Next.js App Router & Server Actions
- Use the **App Router** (`src/app/` directory).
- Use **Server Actions** for data mutations (creates, updates, deletes) instead of API routes where possible.
- Keep components as Server Components by default. Use `"use client"` only when hooks (`useState`, `useEffect`, event listeners) are necessary.

### 2. Database & Prisma
- Always use `PrismaClient` for database operations.
- Ensure type safety by leveraging Prisma's generated types.

### 3. Styling (Tailwind CSS v4)
- Use standard Tailwind utility classes for all styling.
- Support both **Light Mode** and **Dark Mode** (`dark:` variants).
- Maintain responsive design (mobile-first approach using `sm:`, `md:`, `lg:`).

### 4. Language & i18n
- The application supports both **English** and **Bengali (বাংলা)**. Do not hardcode English strings if an i18n structure is available.

### 5. Modularity
- Break complex UI into smaller, reusable components (e.g., `Table`, `Filters`, `SummaryCards`).
- Keep business logic separate from UI components.

## 🤖 AI Assistant Instructions
- **Read this file first** to understand the context of the project before providing code solutions.
- Generate concise, modular, and type-safe TypeScript code.
- Avoid deprecated React or Next.js patterns (e.g., `getInitialProps`, `getServerSideProps`).

