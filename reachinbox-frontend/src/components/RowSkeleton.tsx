export default function RowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-neutral-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="skeleton w-2 h-2 rounded-full" />
          <div className="skeleton h-3 w-40" />
          <div className="skeleton h-3 flex-1" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
