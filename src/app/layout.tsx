import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Relay — Account Transition Engine",
  description: "Automate account handoffs with AI-powered briefs and personalized intro emails. Stop losing revenue during rep transitions.",
  keywords: ["account transition", "customer handoff", "sales handoff", "account management", "AI briefs", "CRM integration"],
  authors: [{ name: "Relay" }],
  openGraph: {
    title: "Relay — Account Transition Engine",
    description: "Automate account handoffs with AI-powered briefs and personalized intro emails.",
    url: "https://relay.app",
    siteName: "Relay",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Relay — Account Transition Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Relay — Account Transition Engine",
    description: "Automate account handoffs with AI-powered briefs and personalized intro emails.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/relay-icon.png",
    apple: "/relay-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
