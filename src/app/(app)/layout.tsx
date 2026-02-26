'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { RoleProvider } from '@/lib/role-context'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { useState } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <RoleProvider>
      <KeyboardShortcuts />
      <div className="flex h-screen">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  )
}
