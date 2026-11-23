import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EduBuddy Parent — AI Desk Robot for CBSE Students",
  description: "Parent companion web app & device cloud backend for EduBuddy (DuDu) ESP32-S3 AI desk robot.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F6F3EE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-[#F6F3EE] text-[#1F2328]`}>
        {children}
      </body>
    </html>
  );
}
