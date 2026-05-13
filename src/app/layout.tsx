import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-stone-100 bg-white">
          <div className="flex items-center justify-between px-8 py-3">
            <p className="text-xs text-stone-400">© {new Date().getFullYear()} Offcut Challenge</p>
            <div className="flex items-center gap-5">
              <Link href="/terms"   className="text-xs text-stone-400 hover:text-stone-600">Terms &amp; Conditions</Link>
              <Link href="/privacy" className="text-xs text-stone-400 hover:text-stone-600">Privacy Policy</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
