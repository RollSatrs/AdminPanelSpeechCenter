import { HeaderCustom } from "@/components/custom-header"
import { LanguageProvider } from "@/components/language-provider"

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <LanguageProvider>
      <main className="min-h-screen bg-white px-[29px] py-[14px] text-black ">
        <HeaderCustom />
        <div className="pt-8">{children}</div>
      </main>
    </LanguageProvider>
  )
}
