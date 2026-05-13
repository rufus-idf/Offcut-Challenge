import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavigationLoader } from "@/components/navigation-loader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Offcut Challenge",
    template: "%s — Offcut Challenge",
  },
  description: "The UK B2B marketplace for material offcuts between workshops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavigationLoader />
        {children}
      </body>
    </html>
  );
}
