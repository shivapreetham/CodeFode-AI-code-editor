"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";
import { ActiveFileProvider } from "@/context/ActiveFileContext";
import { DaisyUIThemeProvider } from "@/context/DaisyUIThemeContext";
import { Providers } from "./Providers";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" data-theme="dark">
      <Providers>
        <DaisyUIThemeProvider>
          <ThemeProvider>
            <FontSizeProvider>
              <ActiveFileProvider>
                <ChatProvider>
                  <body className={inter.className}>
                    {children}
                  </body>
                </ChatProvider>
              </ActiveFileProvider>
            </FontSizeProvider>
          </ThemeProvider>
        </DaisyUIThemeProvider>
      </Providers>
    </html>
  );
}
