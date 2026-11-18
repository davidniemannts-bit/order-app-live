import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { AppLogo } from "@/components/app/AppLogo";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <AppLogo />
        <div className="flex items-center gap-3">
          {user?.email && <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>}
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut /> Abmelden
          </Button>
        </div>
      </div>
    </header>
  );
}
