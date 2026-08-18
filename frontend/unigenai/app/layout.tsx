import type { Metadata } from "next";
import { Marcellus, Josefin_Sans, Inter } from "next/font/google";
import "./globals.css";

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marcellus",
  display: "swap",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniGenAI — The Art Deco Neural Instrument",
  description: "Exquisite craftsmanship meets generative intelligence. A grand editorial reveal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${marcellus.variable} ${josefinSans.variable} ${inter.variable}`}>
      <body className="bg-[#0A0A0A] text-[#F2F0E4] antialiased selection:bg-[#D4AF37] selection:text-black">
        {children}
      </body>
    </html>
  );
}
