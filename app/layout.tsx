import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { HeaderCustom } from "@/components/custom-header";
import { Poppins, Inter } from "next/font/google"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "SpeechCenter",
  description: "SpeechCenter app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`antialiased px-[29px] py-[15px] ${poppins.className}`} >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <HeaderCustom/>
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
