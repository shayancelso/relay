import { PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons'

export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} cols={7} />
    </div>
  )
}
