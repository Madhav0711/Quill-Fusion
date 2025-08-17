import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import "./globals.css";
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/sonner";
import AppStateProvider from '@/lib/providers/state-provider';
import { SupabaseUserProvider } from '@/lib/providers/supabase-user-provider';
import { twMerge } from "tailwind-merge";
import { SocketProvider } from "@/lib/providers/socket-provider";

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quill-Fusion – Your AI Workspace",
  description: "Collaborate, build, and grow with the power of AI. Notes, tasks, and team productivity — all in one place.",
  icons: {
    icon: '/images/icon.png?v=1',
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={twMerge(
          geistSans.variable,
          geistMono.variable,
          'font-sans bg-background text-foreground min-h-screen'
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppStateProvider>
            <SupabaseUserProvider>
              <SocketProvider>
              {children}
              <Toaster richColors />
              </SocketProvider>
            </SupabaseUserProvider>
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
