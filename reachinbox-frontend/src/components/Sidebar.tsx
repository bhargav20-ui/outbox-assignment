import { useState } from "react";
import { Search, ChevronDown, LogOut, Slack, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../hooks/useAuth";
import type { SlackStatus } from "../types";

type Tab = "scheduled" | "sent";

export default function Sidebar({
  activeTab,
  onTabChange,
  scheduledCount,
  sentCount,
  onCompose,
  query,
  onQueryChange,
  slackStatus,
  onOpenSlack,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  scheduledCount: number;
  sentCount: number;
  onCompose: () => void;
  query: string;
  onQueryChange: (v: string) => void;
  slackStatus?: SlackStatus;
  onOpenSlack: () => void;
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="w-72 shrink-0 border-r border-neutral-100 flex flex-col h-full bg-white">
      {/* Brand + profile */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-wide text-neutral-900">ONG</span>
          <button
            onClick={onOpenSlack}
            title="Slack notifications"
            className={clsx(
              "p-1.5 rounded-md border transition-colors",
              slackStatus?.connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-neutral-200 text-neutral-400 hover:text-neutral-600"
            )}
          >
            <Slack className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative mt-4">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-full flex items-center gap-2 rounded-lg hover:bg-neutral-50 px-2 py-1.5 -mx-2"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "U")}`}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-neutral-400 truncate">{user?.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
          {menuOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-neutral-100 rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-100 rounded-md px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search"
            className="bg-transparent outline-none text-xs flex-1 placeholder:text-neutral-400"
          />
          <RefreshCw className="w-3 h-3 text-neutral-300" />
        </div>
      </div>

      {/* Compose */}
      <div className="px-4 pb-3">
        <button
          onClick={onCompose}
          className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs py-2 rounded-md transition-colors"
        >
          Compose
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        <button
          onClick={() => onTabChange("scheduled")}
          className={clsx(
            "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs",
            activeTab === "scheduled"
              ? "bg-emerald-50 text-emerald-700 font-medium"
              : "text-neutral-500 hover:bg-neutral-50"
          )}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" /> Scheduled
          </span>
          <span className="text-[11px] text-neutral-400">{scheduledCount}</span>
        </button>
        <button
          onClick={() => onTabChange("sent")}
          className={clsx(
            "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs",
            activeTab === "sent"
              ? "bg-emerald-50 text-emerald-700 font-medium"
              : "text-neutral-500 hover:bg-neutral-50"
          )}
        >
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current opacity-60"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
            Sent
          </span>
          <span className="text-[11px] text-neutral-400">{sentCount}</span>
        </button>
      </nav>
    </aside>
  );
}
