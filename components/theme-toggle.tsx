"use client"

import { useSyncExternalStore } from "react"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!isHydrated) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Переключить тему"
        title="Переключить тему"
        disabled
      >
        <IconMoon className="size-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Переключить тему"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      {isDark ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
    </Button>
  )
}
