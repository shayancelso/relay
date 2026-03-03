'use client'

export function TeamsConnect() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 text-white text-[13px] font-bold shadow-sm">
        MT
      </div>
      <div className="space-y-2 max-w-sm">
        <p className="text-[15px] font-semibold">Connect Microsoft Teams</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Connect your Teams workspace to get transition notifications in channels — approvals, stall alerts, weekly digests, and more.
        </p>
      </div>
      <div className="space-y-2 w-full max-w-xs">
        <button className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-600 transition-colors">
          Connect Microsoft Teams →
        </button>
        <p className="text-[10px] text-muted-foreground/60">
          You'll be redirected to Microsoft to authorize the connection.
        </p>
      </div>
    </div>
  )
}
