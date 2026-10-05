import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "quickslogx HRMS | Liquid Glassmorphic Enterprise OS",
  description: "Next-generation Human Resource Management System with Apple-grade spring physics, liquid glassmorphism, and real-time workforce telemetry.",
};

export const viewport: Viewport = {
  themeColor: "#080a11",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f4f6fb] dark:bg-[#080a11] text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
