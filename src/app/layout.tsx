import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SYSADM | Humor Project Dashboard",
  description: "Secure Terminal Administration Interface",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="scanline" />
        <div className="crt-overlay" />
        {children}
      </body>
    </html>
  )
}
