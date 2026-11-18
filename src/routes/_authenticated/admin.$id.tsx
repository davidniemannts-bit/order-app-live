import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, ExternalLink, Loader2, Lock, Palette, FileText, Settings, UtensilsCrossed, HandPlatter } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";
import { canUse, type Feature } from "@/lib/plans";
import { AppHeader } from "@/components/app/AppHeader";
import { PlanBadge } from "@/components/app/PlanBadge";
import { ProCodeDialog } from "@/components/app/ProCodeDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  head: () => ({
    meta: [
      { title: "Restaurant verwalten – OrderApp Free" },
      { name: "description", content: "Bestellungen, Speisekarte und Design deines Restaurants verwalten." },
      { property: "og:title", content: "Restaurant verwalten – OrderApp Free" },
      { property: "og:description", content: "Verwaltung für dein Restaurant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV: { to: string; label: string; icon: typeof ClipboardList; feature: Feature; exact?: boolean }[] = [
  { to: "/admin/$id", label: "Bestellungen", icon: ClipboardList, feature: "orders", exact: true },
  { to: "/admin/$id/kasse", label: "Kasse", icon: HandPlatter, feature: "staff" },
  { to: "/admin/$id/menu", label: "Speisekarte", icon: UtensilsCrossed, feature: "menu" },
  { to: "/admin/$id/design", label: "Design", icon: Palette, feature: "branding" },
  { to: "/admin/$id/pages", label: "Seiten", icon: FileText, feature: "pages" },
  { to: "/admin/$id/settings", label: "Einstellungen", icon: Settings, feature: "settings" },
];

function AdminLayout() {
  const { id } = Route.useParams();
  const { restaurant, plan, isLoading } = useRestaurant(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-md py-20 text-center">
          <h1 className="text-2xl font-extrabold">Restaurant nicht gefunden</h1>
          <Button asChild variant="hero" className="mt-6"><Link to="/dashboard">Zu meinen Restaurants</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ ["--brand" as string]: restaurant.primary_color, ["--brand-2" as string]: restaurant.accent_color }}
    >
      <AppHeader />
      <div className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Meine Restaurants
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt="" className="h-14 w-14 rounded-2xl object-cover shadow-card" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-2xl font-black text-brand-foreground shadow-card">
                {restaurant.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{restaurant.name}</h1>
                <PlanBadge plan={plan} />
              </div>
              <div className="text-sm text-muted-foreground">/r/{restaurant.slug}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {plan === "basic" && <ProCodeDialog restaurantId={restaurant.id} />}
              <Button asChild variant="outline">
                <a href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink /> Kundenansicht
                </a>
              </Button>
            </div>
          </div>
          <nav className="-mb-px mt-6 flex gap-1 overflow-x-auto" aria-label="Verwaltung">
            {NAV.map((n) => {
              const locked = !canUse(plan, n.feature);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  params={{ id }}
                  activeOptions={{ exact: !!n.exact }}
                  className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground data-[status=active]:border-brand-blue data-[status=active]:text-foreground"
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                  {locked && <Lock className="h-3.5 w-3.5 text-pro" aria-label="Nur mit Pro" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
