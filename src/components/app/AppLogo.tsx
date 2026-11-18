import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function AppLogo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 font-display font-extrabold tracking-tight", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5 10 17 19 7" />
        </svg>
      </span>
      <span className={cn("text-lg", dark ? "text-ink-foreground" : "text-foreground")}>
        OrderApp<span className="ml-1 text-brand-blue">Free</span>
      </span>
    </Link>
  );
}
