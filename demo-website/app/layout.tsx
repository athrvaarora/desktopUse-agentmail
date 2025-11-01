import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Desktop.use - AI-Controlled UI Components",
  description: "Live demo of AI-controlled desktop UI components using desktopuse-sdk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-black`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
