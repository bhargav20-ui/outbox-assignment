import { Inbox } from "lucide-react";

export default function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
        <Inbox className="w-5 h-5 text-neutral-400" />
      </div>
      <p className="text-neutral-700 font-medium">{title}</p>
      {subtitle && <p className="text-neutral-400 text-xs mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}
