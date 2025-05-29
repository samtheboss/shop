import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import MobileNav from "./components/mobile-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Janix Sales Management System",
  description: "Manage your sales team, inventory, and track performance",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    generator: 'SmartApps Developers'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MobileNav />
        {children}
      </body>
    </html>
  )
}
