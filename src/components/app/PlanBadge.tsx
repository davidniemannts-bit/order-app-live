import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { planLabel, type Plan } from "@/lib/plans";

export function PlanBadge({ plan, className }: { plan: Plan | string; className?: string }) {
  const p: Plan = plan === "pro" ? "pro" : "basic";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
        p === "pro" ? "bg-gradient-pro text-pro-foreground" : "bg-basic text-basic-foreground",
        className,
      )}
    >
      {p === "pro" && <Crown className="h-3 w-3" />}
      {planLabel(p)}
    </span>
  );
}
