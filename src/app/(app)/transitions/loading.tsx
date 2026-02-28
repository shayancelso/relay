import { PageHeaderSkeleton, ListItemSkeleton } from '@/components/ui/skeletons'

export default function TransitionsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
