import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StealthWorks — AI Interview Platform",
  description: "Launch your AI interview agent in minutes. Custom AI interviewers for accelerators, incubators, and hiring teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
