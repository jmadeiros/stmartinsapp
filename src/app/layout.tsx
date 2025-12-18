import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aitrium - Oasis St Martins Village",
  description: "A unified digital collaboration hub for Oasis St Martins Village community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistSans.variable}>
      <body className={`${GeistSans.className} antialiased bg-background text-foreground`} style={{
        fontFeatureSettings: '"rlig" 1, "calt" 1',
      }}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
