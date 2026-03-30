import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thitronik Campus Online",
  description: "Thitronik Händler-Schulungsplattform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Campus Online",
  },
};

export const viewport: Viewport = {
  themeColor: "#1D3661",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F0F0F0] text-[#111111]">
        {children}
      </body>
    </html>
  );
}
