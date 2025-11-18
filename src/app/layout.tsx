import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Village Hub - Internal Communications",
  description: "A unified digital collaboration hub for The Village Hub community",
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
        {children}
      </body>
    </html>
  );
}
