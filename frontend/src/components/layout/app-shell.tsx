import type { ReactNode } from "react"

import { Navbar } from "@/components/layout/navbar"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
    </div>
  )
}
