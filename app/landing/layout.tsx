import { HeaderCustom } from "@/components/custom-header"
import LandingLanguageTransition from "@/components/landing-language-transition"
import { LanguageProvider } from "@/components/language-provider"

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <LanguageProvider>
      <main className="min-h-screen bg-white px-[29px] py-[14px] text-black ">
        <LandingLanguageTransition>
          <HeaderCustom />
          <div className="pt-8">{children}</div>
        </LandingLanguageTransition>
      </main>
    </LanguageProvider>
  )
}
