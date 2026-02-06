"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [showPrompt, setShowPrompt] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    if (typeof window === "undefined") return
    const dismissed = window.localStorage.getItem("themePromptDismissed")
    if (!dismissed && (resolvedTheme ?? theme) === "light") {
      setShowPrompt(true)
    }
  }, [mounted, resolvedTheme, theme])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light")
  }

  const switchNow = () => {
    setTheme("dark")
    if (typeof window !== "undefined") {
      window.localStorage.setItem("themePromptDismissed", "1")
    }
    setShowPrompt(false)
  }

  const dismissPrompt = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("themePromptDismissed", "1")
    }
    setShowPrompt(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative overflow-hidden"
      >
        <span className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity" />
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {showPrompt && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl dark:bg-slate-900 dark:border-slate-800 p-4 z-50">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Better at night?
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Try dark mode for a smoother view.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1" onClick={switchNow}>
              Switch now
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={dismissPrompt}>
              No thanks
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
