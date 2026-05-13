import Image from "next/image"
import { ParentLoginForm } from "@/components/parent-login-form"

export default function ParentLoginPage() {
  return (
    <div className="grid min-h-screen w-full overflow-hidden lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ParentLoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/bermuda.jpg"
          alt="SpeechCenter"
          fill
          priority
          className="absolute inset-0 object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
