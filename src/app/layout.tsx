import type { Metadata, Viewport } from "next";
import { Open_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
// Keep the cascade identical in development and production builds.
import "../components/common/luxury-admin.css";
import "../components/common/admin-finish.css";
import "../components/common/brand-system.css";
import "../components/common/role-workspace.css";
import "../components/common/role-refinement.css";
import "../components/common/clean-workspace.css";
import "../components/employee/employee-portal.css";
import "../components/auth/login.css";
import "../components/common/workspace-button.css";
import "../context/notifications.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "quickslogx | People & Projects",
  description: "Your people, projects, attendance and everyday work in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "quickslogx HRMS",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080a11",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${openSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#f6f8fc] dark:bg-[#07090e] text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(function(err) {
                    console.warn('SW registration:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
