import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { AuthGate } from "@/components/AuthGate";
import { AuthProvider } from "@/context/AuthContext";
import { CycleProvider } from "@/context/CycleContext";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeWell — Bee & Pink Period Tracker",
  description:
    "Track your cycle with a sweet bee-and-pink themed app. See your phase, calendar, and history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AuthProvider>
          <CycleProvider>
            <AuthGate>
              <div className="flex min-h-full flex-col">{children}</div>
            </AuthGate>
          </CycleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
