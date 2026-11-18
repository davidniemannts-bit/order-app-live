import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, LogIn, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { AppLogo } from "@/components/app/AppLogo";
import { SocialButtons } from "@/components/app/SocialButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup" | "forgot";

function safeRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; mode?: "signup" } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    mode: search.mode === "signup" ? "signup" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Anmelden – OrderApp Free" },
      { name: "description", content: "Melde dich bei OrderApp Free an oder erstelle kostenlos ein Konto für dein Restaurant." },
      { property: "og:title", content: "Anmelden – OrderApp Free" },
      { property: "og:description", content: "Konto erstellen und dein Bestellsystem in 2 Minuten starten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<Mode>(search.mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);
  const target = safeRedirect(search.redirect);

  useEffect(() => {
    if (!loading && session) navigate({ to: target, replace: true });
  }, [loading, session, navigate, target]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(
            error.message.includes("Email not confirmed")
              ? "Bitte bestätige zuerst deine E-Mail-Adresse."
              : "E-Mail oder Passwort ist falsch.",
          );
          return;
        }
        navigate({ to: target, replace: true });
      } else if (mode === "signup") {
        if (password.length < 8) {
          toast.error("Das Passwort braucht mindestens 8 Zeichen.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/login" },
        });
        if (error) {
          toast.error(error.message.includes("registered") ? "Diese E-Mail ist schon registriert." : error.message);
          return;
        }
        if (data.session) navigate({ to: target, replace: true });
        else setSent("confirm");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        setSent("reset");
      }
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Willkommen zurück" : mode === "signup" ? "Konto erstellen" : "Passwort vergessen";
  const subtitle =
    mode === "signin"
      ? "Melde dich bei deinem Konto an"
      : mode === "signup"
        ? "Kostenlos starten – in 2 Minuten online"
        : "Wir schicken dir einen Link zum Zurücksetzen";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <AppLogo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md animate-pop-in">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              {mode === "signup" ? <UserPlus className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
            {sent ? (
              <div className="text-center">
                <Mail className="mx-auto h-10 w-10 text-brand-blue" />
                <h2 className="mt-3 text-xl font-bold">Schau in dein Postfach</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {sent === "confirm"
                    ? `Wir haben dir eine E-Mail an ${email} geschickt. Klicke auf den Link darin, um dein Konto zu bestätigen.`
                    : `Wenn ${email} registriert ist, bekommst du gleich einen Link zum Zurücksetzen.`}
                </p>
                <Button variant="link" className="mt-4" onClick={() => { setSent(null); setMode("signin"); }}>
                  Zurück zur Anmeldung
                </Button>
              </div>
            ) : (
              <>
                {mode !== "forgot" && (
                  <>
                    <SocialButtons onSignedIn={() => navigate({ to: target, replace: true })} />
                    <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted-foreground">
                      <span className="h-px flex-1 bg-border" /> oder <span className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}
                <form onSubmit={onSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" required autoComplete="email" placeholder="du@beispiel.de" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" />
                    </div>
                  </div>
                  {mode !== "forgot" && (
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Passwort</Label>
                        {mode === "signin" && (
                          <button type="button" className="text-xs text-brand-blue hover:underline" onClick={() => setMode("forgot")}>
                            Passwort vergessen?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          required
                          minLength={mode === "signup" ? 8 : undefined}
                          autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pl-10"
                        />
                      </div>
                    </div>
                  )}
                  <Button type="submit" variant="hero" size="xl" disabled={busy} className="w-full">
                    {busy && <Loader2 className="animate-spin" />}
                    {mode === "signin" ? "Anmelden" : mode === "signup" ? "Konto erstellen" : "Link senden"}
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {mode === "signin" ? (
                    <>Noch kein Konto?{" "}<button className="font-semibold text-brand-blue hover:underline" onClick={() => setMode("signup")}>Jetzt registrieren</button></>
                  ) : (
                    <>Schon ein Konto?{" "}<button className="font-semibold text-brand-blue hover:underline" onClick={() => setMode("signin")}>Anmelden</button></>
                  )}
                </p>
              </>
            )}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">← Zur Startseite</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
