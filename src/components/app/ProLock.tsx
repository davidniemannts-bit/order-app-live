import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { ProCodeDialog } from "@/components/app/ProCodeDialog";

/** Shows Pro-only content to Basic restaurants, but disabled and with an unlock button. */
export function ProLock({ locked, restaurantId, children }: { locked: boolean; restaurantId: string; children: ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div aria-hidden="true" inert className="pointer-events-none select-none opacity-50 blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-16">
        <div className="mx-4 max-w-sm rounded-2xl border bg-card p-6 text-center shadow-pop">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-pro text-pro-foreground">
            <Lock className="h-5 w-5" />
          </span>
          <h3 className="mt-3 text-lg font-extrabold">Nur mit Pro</h3>
          <p className="mt-1 text-sm text-muted-foreground">Diese Funktion siehst du in Basic, nutzen kannst du sie mit Pro.</p>
          <div className="mt-4">
            <ProCodeDialog restaurantId={restaurantId} />
          </div>
        </div>
      </div>
    </div>
  );
}
