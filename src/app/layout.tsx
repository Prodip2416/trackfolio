import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getLocale } from "@/i18n/getDictionary";
import GlobalLoader from "@/components/shared/GlobalLoader";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/AppLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    template: "%s | TrackFolio",
    default: "TrackFolio | Modern Portfolio & Investment Tracker",
  },
  description: "TrackFolio is a comprehensive portfolio tracking application to monitor your investments in real-time, calculate profit/loss, and analyze your financial performance across multiple assets.",
  keywords: ["portfolio tracker", "investment tracker", "stock tracker", "crypto tracker", "financial performance", "wealth management", "profit and loss", "finance dashboard"],
  authors: [{ name: "TrackFolio Team" }],
  creator: "TrackFolio",
  publisher: "TrackFolio",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "TrackFolio | Modern Portfolio & Investment Tracker",
    description: "Monitor your investments, calculate profit/loss, and analyze your financial performance with TrackFolio.",
    siteName: "TrackFolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackFolio | Modern Portfolio & Investment Tracker",
    description: "Monitor your investments, calculate profit/loss, and analyze your financial performance with TrackFolio.",
    creator: "@trackfolio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GlobalLoader />
          {user ? (
            <AppLayout user={user}>
              {children}
            </AppLayout>
          ) : (
            children
          )}
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              duration: 4000,
              style: {
                background: 'rgba(15, 23, 42, 0.9)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
                fontWeight: 'bold',
                padding: '12px 20px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }} 
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
