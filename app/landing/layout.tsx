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
      <main className="min-h-screen bg-white px-4 py-[14px] text-black sm:px-6 md:px-[29px] max-[350px]:px-3">
        <LandingLanguageTransition>
          <HeaderCustom />
          <div className="pt-8">{children}</div>
        </LandingLanguageTransition>
      </main>
    </LanguageProvider>
  )
}
