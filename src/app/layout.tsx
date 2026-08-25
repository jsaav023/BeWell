import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
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
  title: "BeWell — Period Tracker",
  description:
    "Track your cycle, see your phase, and revisit period history with BeWell.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <CycleProvider>
          <div className="flex min-h-full flex-col">{children}</div>
        </CycleProvider>
      </body>
    </html>
  );
}
