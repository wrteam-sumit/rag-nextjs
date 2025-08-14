import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF RAG Assistant - AI-Powered Document Q&A",
  description:
    "Upload PDF documents and ask questions using AI-powered retrieval augmented generation (RAG)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/*
          Auth-aware apps would typically include a provider here. For now,
          we rely on server-set cookies and simple fetches.
        */}
        {children}
      </body>
    </html>
  );
}
