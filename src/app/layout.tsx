import type React from "react"
import "~/styles/globals.css"

import type { Metadata } from "next"
import { Lexend } from "next/font/google"

import { TRPCReactProvider } from "~/trpc/react"
import Navbar from "~/components/layout/Navbar"

export const metadata: Metadata = {
  title: "Learning App PWA",
  description: "A Progressive Web App for learning Latin and Braille",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lexend",
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lexend.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#4CD6C1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${lexend.className} antialiased`}>
        <TRPCReactProvider>
          <>
            {children}
            <Navbar/>
          </>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
