export function SkeletonCard({ className='' }) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"/>
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"/>
      <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse"/>
      <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"/>
    </div>
  )
}
export function SkeletonGrid({ cols=3, count=6 }) {
  return (
    <div className={`grid sm:grid-cols-2 lg:grid-cols-${cols} gap-6`}>
      {Array.from({length:count}).map((_,i)=><SkeletonCard key={i}/>)}
    </div>
  )
}
export function SkeletonTable({ rows=5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"/>
      </div>
      {Array.from({length:rows}).map((_,i)=>(
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0"/>
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"/>
            <div className="h-2.5 w-1/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"/>
          </div>
          <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"/>
        </div>
      ))}
    </div>
  )
}