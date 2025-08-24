import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import Provider from "@/components/Provider";

export const metadata: Metadata = {
  title: "ShapeVillage",
  description: "Start a village, watch life unfold.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  generator: "ShapeVillage",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-black min-h-screen">
        <ThemeProvider
          attribute="class"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Provider>
            <main className="flex min-h-screen flex-col items-center justify-center">
              {children}
            </main>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
