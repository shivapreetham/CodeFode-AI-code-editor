
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers"; // Import the Providers component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "code-assistant: A Real-time AI Powered Code Editor",
  description: "A real-time code editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}