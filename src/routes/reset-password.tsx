import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppLogo } from "@/components/app/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Neues Passwort – OrderApp Free" },
      { name: "description", content: "Lege ein neues Passwort für dein OrderApp-Konto fest." },
      { property: "og:title", content: "Neues Passwort – OrderApp Free" },
      { property: "og:description", content: "Passwort für OrderApp Free zurücksetzen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Das Passwort braucht mindestens 8 Zeichen."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error("Der Link ist abgelaufen. Bitte fordere einen neuen an."); return; }
    toast.success("Passwort gespeichert");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto w-full max-w-6xl px-5 py-5"><AppLogo /></header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-card">
          <KeyRound className="h-8 w-8 text-brand-blue" />
          <h1 className="mt-3 text-2xl font-extrabold">Neues Passwort</h1>
          <div className="mt-6 grid gap-2">
            <Label htmlFor="pw">Passwort</Label>
            <Input id="pw" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
          </div>
          <Button type="submit" variant="hero" size="xl" className="mt-6 w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}Speichern
          </Button>
        </form>
      </main>
    </div>
  );
}
