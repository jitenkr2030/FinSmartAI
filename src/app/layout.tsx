import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SessionProviderWrapper from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinSmartAI - Complete Financial AI Ecosystem",
  description: "Empowering financial decisions with 12 specialized AI models, 25+ API endpoints, and cutting-edge machine learning technology",
  keywords: ["FinSmartAI", "Financial AI", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React", "Trading", "Investment"],
  authors: [{ name: "FinSmartAI Team" }],

  openGraph: {
    title: "FinSmartAI - Complete Financial AI Ecosystem",
    description: "Empowering financial decisions with 12 specialized AI models and cutting-edge machine learning technology",
    url: "https://finsmartai.com",
    siteName: "FinSmartAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinSmartAI - Complete Financial AI Ecosystem",
    description: "Empowering financial decisions with 12 specialized AI models and cutting-edge machine learning technology",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <SessionProviderWrapper>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </SessionProviderWrapper>
        <Toaster />
      </body>
    </html>
  );
}
