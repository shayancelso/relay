import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { RoleProvider } from '@/lib/role-context'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <KeyboardShortcuts />
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  )
}
