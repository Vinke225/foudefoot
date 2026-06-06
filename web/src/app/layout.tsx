import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FOU DE FOOT",
  description: "Le réseau social des émotions football",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased h-full`}>
      <body className="min-h-full bg-white text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
