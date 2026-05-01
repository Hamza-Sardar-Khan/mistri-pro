import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AppHeader from "@/components/AppHeader";
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
  title: "MISTRI PRO",
  description: "The professional platform for tradespeople and clients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1d6ef0",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorText: "#0f172a",
          colorTextSecondary: "#6b7280",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-geist-sans)",
        },
        elements: {
          rootBox: "bg-transparent p-0",
          cardBox: "bg-transparent p-0 shadow-none",
          modal: "bg-transparent p-0 shadow-none",
          modalContent: "bg-transparent p-0 shadow-none border-0",
          card: "rounded-2xl border border-slate-200 bg-white shadow-lg",
          header: "text-center",
          headerTitle: "text-xl font-semibold text-slate-900",
          headerSubtitle: "text-sm text-slate-500",
          formFieldLabel: "text-sm font-semibold text-slate-700",
          formFieldRow: "space-y-2",
          formFieldInput:
            "h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-slate-700 focus:border-blue-500 focus:ring-blue-500",
          formFieldInputIcon: "text-slate-400",
          formFieldInputShowPasswordButton: "text-slate-400 hover:text-slate-600",
          formButtonPrimary:
            "h-11 w-full rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700",
          socialButtonsBlockButton:
            "h-11 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          dividerLine: "bg-slate-200",
          dividerText: "text-xs text-slate-400",
          dividerRow: "items-center",
          footer: "hidden",
          footerAction: "hidden",
          badge: "hidden",
          footerActionText: "text-xs text-slate-500",
          footerActionLink: "text-blue-600 hover:text-blue-700",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AppHeader />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
