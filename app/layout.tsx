import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "./components/Footer";
import NavBar from "./components/NavBar";
import Providers from "./components/Providers";
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
  title: "Word Dictionary",
  description: "Search words, meanings, phonetics, and pronunciation audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.03_250)_0%,_transparent_55%),linear-gradient(to_bottom,_transparent,_oklch(0.96_0.01_250))]"
            />
            <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
              <NavBar />
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
