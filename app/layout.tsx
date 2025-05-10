import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { UIShell } from "@/components/ui-shell"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Tax Assistant - SEC EDGAR AI Chat",
  description: "Get answers to your tax questions using SEC EDGAR data and advanced AI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <UIShell>{children}</UIShell>
        </ThemeProvider>
      </body>
    </html>
  )
}

