// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "./globals.css";
// import { ChatProvider } from "@/context/ChatContext";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "code-assistant: A Real-time AI Powered Code Editor",
//   description: "A real-time code editor",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <ChatProvider>
//         <body className={inter.className}>{children}</body>
//       </ChatProvider>
//     </html>
//   );
// }
"use client";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <SessionProvider>
        <ThemeProvider>
          <FontSizeProvider>
          <ChatProvider>
          <body className={inter.className}>{children}</body>
        `  </ChatProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </SessionProvider>
    </html>
  );
}
