import type { ReactNode } from "react"

import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SeasonProvider } from "@/hooks/use-season"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SeasonProvider>
      <TooltipProvider>
        <div className="flex min-h-svh flex-col">
          <Navbar />
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
          <Footer />
        </div>
      </TooltipProvider>
    </SeasonProvider>
  )
}
