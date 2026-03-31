import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Rubik } from "next/font/google"
import { cn } from "@/lib/utils"

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "SOZLab",
  description: "SOZLab Speech Center",
  icons: {
    icon: "/logo-sozlab.svg",
    shortcut: "/logo-sozlab.svg",
    apple: "/logo-sozlab.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={cn("font-sans", rubik.variable)}>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body> 
    </html>
  )
}
