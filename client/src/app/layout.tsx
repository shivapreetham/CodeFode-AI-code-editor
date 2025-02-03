"use client";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";
import { ActiveFileProvider } from "@/context/ActiveFileContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <SessionProvider>
        <ThemeProvider>
          <FontSizeProvider>
            <ActiveFileProvider>
          <ChatProvider>
          <body className={inter.className}>{children}</body>
        `  </ChatProvider>
        </ActiveFileProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </SessionProvider>
    </html>
  );
}
