import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import type { Session } from "@supabase/supabase-js";
import capturedCSS from "../styles/site.css?raw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OrderApp Free – Bestellungen. Ohne Umwege." },
      { name: "description", content: "Kostenloses Bestellsystem mit Speisekartenverwaltung: am Tisch, zur Abholung, als Lieferung oder durchs Personal – alles live in einer Übersicht." },
      { property: "og:title", content: "OrderApp Free – Bestellungen. Ohne Umwege." },
      { property: "og:description", content: "Kostenloses Bestellsystem mit Speisekartenverwaltung – Tisch, Abholung, Lieferung und Personal in einer Übersicht." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  staticData: { sitemap: true, importedDocument: { html: { "lang": "de" }, body: { "data-react-root": "true" } } },
  component: Index,
});

function Index() {
  const { session } = useSession();
  const primaryHref = session ? "/dashboard" : "/login?mode=signup";
  const primaryLabel = session ? "Zum Dashboard" : "Kostenlos starten";

  return (
    <>
      <style>{capturedCSS}</style>
      <div className="[min-height:100vh]">
        <ImportedSectionBestellungenOhneUmwege session={session} />
        <ImportedSectionVierWegeZurBestellung />
        <section className={"\x6dx-auto \x70x-5 pb-24 [max-width:72rem]"}>
          <div className={"grid gap-8 rounded-3xl \x62g-ink p-8 text-ink-foreground \x73m:\x70-12 [@media(width_>=_1024px)]:[grid-template-columns:repeat(3,minmax(0px,1fr))]"}>
            <div>
              <span className={"font-display \x74ext-5xl \x66ont-black text-primary-glow"}>1</span>
              <h3 className={"mt-3 \x74ext-xl \x66ont-extrabold [letter-spacing:-0.025em]"}>Restaurant anlegen</h3>
              <p className={"mt-1 \x74ext-sm text-ink-muted"}>Name eingeben, Web-Adresse wählen – fertig.</p>
            </div>
            <div>
              <span className={"font-display \x74ext-5xl \x66ont-black text-primary-glow"}>2</span>
              <h3 className={"mt-3 \x74ext-xl \x66ont-extrabold [letter-spacing:-0.025em]"}>Speisekarte pflegen</h3>
              <p className={"mt-1 \x74ext-sm text-ink-muted"}>Kategorien, Gerichte, Preise. Ausverkauft? Ein Klick.</p>
            </div>
            <div>
              <span className={"font-display \x74ext-5xl \x66ont-black text-primary-glow"}>3</span>
              <h3 className={"mt-3 \x74ext-xl \x66ont-extrabold [letter-spacing:-0.025em]"}>Bestellungen empfangen</h3>
              <p className={"mt-1 \x74ext-sm text-ink-muted"}>Live mit Ton, Status für Gäste in Echtzeit.</p>
            </div>
            <div className="[@media(width_>=_1024px)]:[grid-column:span_3/span_3]">
              <a className={"inline-flex h-12 items-center gap-2 rounded-xl \x62g-gradient-primary \x70x-6 \x74ext-base \x66ont-semibold text-primary-foreground \x73hadow-glow transition-all \x68over:\x62rightness-110 \x61ctive:\x73cale-[\x30.\x398] [&]:justify-center [text-decoration:inherit] [&:hover]:[filter:var(--tw-blur)_var(--tw-brightness)_var(--tw-contrast)_var(--tw-grayscale)_var(--tw-hue-rotate)_var(--tw-invert)_var(--tw-saturate)_var(--tw-sepia)_var(--tw-drop-shadow)]"} href={primaryHref}>{primaryLabel}{" "}<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
            </div>
          </div>
        </section>
        <footer className={"\x62order-t \x70y-8 \x74ext-sm text-muted-foreground [&]:text-center"}>
          <span className={"inline-flex items-center gap-2 font-display \x66ont-extrabold [&]:justify-center [letter-spacing:-0.025em]"}>
            <span className={"grid h-8 w-8 place-items-center rounded-lg \x62g-gradient-primary text-primary-foreground \x73hadow-glow"}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5 10 17 19 7" />
              </svg>
            </span>
            <span className={"\x74ext-lg text-foreground"}>OrderApp<span className="ml-1 text-primary">Free</span></span>
          </span>
          <p className="mt-2">Bezahlung erfolgt direkt vor Ort.</p>
        </footer>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} aria-live="polite" aria-relevant="additions text" aria-atomic="false" />
    </>
  );
}

function ImportedSectionBestellungenOhneUmwege({ session }: { session: Session | null }) {

  return (
    <section className={"\x62g-gradient-ink text-ink-foreground"}>
      <header className={"\x6dx-auto flex items-center \x70x-5 \x70y-5 [&]:justify-between [max-width:72rem]"}>
        <span className={"inline-flex items-center gap-2 font-display \x66ont-extrabold [letter-spacing:-0.025em]"}>
          <span className={"grid h-8 w-8 place-items-center rounded-lg \x62g-gradient-primary text-primary-foreground \x73hadow-glow"}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5 10 17 19 7" />
            </svg>
          </span>
          <span className={"\x74ext-lg text-ink-foreground"}>OrderApp<span className="ml-1 text-primary">Free</span></span>
        </span>
        <a className={"\x74ext-sm \x66ont-semibold text-ink-foreground \x68over:\x74ext-primary-glow [text-decoration:inherit]"} href={session ? "/dashboard" : "/login"}>{session ? "Restaurant Manager" : "Anmelden"}</a>
      </header>
      <div className={"\x6dx-auto grid items-center gap-12 \x70x-5 pb-20 pt-10 \x6cg:\x70t-16 [max-width:72rem] [@media(width_>=_1024px)]:grid-cols-[1.1fr_1fr]"}>
        <div>
          <span className={"inline-flex items-center gap-2 rounded-full \x62order \x62order-ink-border \x70x-3 \x70y-1 \x74ext-xs \x66ont-semibold text-ink-muted"}><span className={"h-1.5 w-1.5 rounded-full \x62g-primary-glow"} />100 % kostenlos · keine Provision</span>
          <h1 className={"mt-6 \x74ext-5xl \x66ont-black \x6ceading-[\x31.\x302] \x73m:\x74ext-6xl \x6cg:\x74ext-7xl [letter-spacing:-0.025em]"}>Bestellungen.<br /><span className="text-primary-glow">Ohne Umwege.</span></h1>
          <p className={"mt-6 \x74ext-lg text-ink-muted [max-width:32rem]"}>Dein eigenes Bestellsystem mit Speisekarten­verwaltung: am Tisch, zur Abholung, als Lieferung oder durchs Personal – alles live in einer Übersicht.</p>
          <div className={"mt-8 flex items-center gap-4 [&]:flex-wrap"}>
            <a className={"inline-flex h-12 items-center gap-2 rounded-xl \x62g-gradient-primary \x70x-6 \x74ext-base \x66ont-semibold text-primary-foreground \x73hadow-glow transition-all \x68over:\x62rightness-110 \x61ctive:\x73cale-[\x30.\x398] [&]:justify-center [text-decoration:inherit] [&:hover]:[filter:var(--tw-blur)_var(--tw-brightness)_var(--tw-contrast)_var(--tw-grayscale)_var(--tw-hue-rotate)_var(--tw-invert)_var(--tw-saturate)_var(--tw-sepia)_var(--tw-drop-shadow)]"} href="/login?mode=signup">Kostenlos starten{" "}<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
            <span className={"\x74ext-sm text-ink-muted"}>In 2 Minuten online</span>
          </div>
        </div>
        <div className={"relative \x6dx-auto w-full [max-width:24rem]"}>
          <div className={"absolute -inset-6 rounded-[2.5rem] \x62g-primary/\x330 \x62lur-3xl [filter:var(--tw-blur)_var(--tw-brightness)_var(--tw-contrast)_var(--tw-grayscale)_var(--tw-hue-rotate)_var(--tw-invert)_var(--tw-saturate)_var(--tw-sepia)_var(--tw-drop-shadow)]"} aria-hidden="true" />
          <div className={"relative \x72otate-[\x2d2deg] rounded-3xl \x62g-card p-5 text-card-foreground \x73hadow-pop"}>
            <div className={"flex items-start [&]:justify-between"}>
              <div>
                <p className={"tabular font-display \x74ext-4xl \x66ont-black \x6ceading-none"}>#42</p>
                <p className={"mt-1.5 flex items-center gap-1.5 \x74ext-sm \x66ont-semibold"}><svg className="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" /><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" /><path d="m2.1 21.8 6.4-6.3" /><path d="m19 5-7 7" /></svg> Tisch 7</p>
              </div>
              <span className={"rounded-full \x62g-primary \x70x-2.\x35 \x70y-0.\x35 \x74ext-xs \x66ont-bold text-primary-foreground"}>Neu</span>
            </div>
            <ul className={"mt-4 \x73pace-y-1.\x35 \x62order-t pt-4 \x74ext-sm"}>
              <li className={"flex [&]:justify-between"}>
                <span><b>2×</b> Pizza Margherita</span>
                <span className="tabular text-muted-foreground">19,00 €</span>
              </li>
              <li className={"flex [&]:justify-between"}>
                <span><b>1×</b> Burger Classic</span>
                <span className="tabular text-muted-foreground">13,90 €</span>
              </li>
              <li className={"flex [&]:justify-between"}>
                <span><b>3×</b> Cola 0,33 l</span>
                <span className="tabular text-muted-foreground">8,70 €</span>
              </li>
            </ul>
            <div className={"mt-4 flex items-center \x62order-t pt-4 [&]:justify-between"}>
              <span className={"tabular font-display \x74ext-xl \x66ont-extrabold"}>41,60 €</span>
              <span className={"rounded-lg \x62g-gradient-primary \x70x-4 \x70y-2 \x74ext-sm \x66ont-bold text-primary-foreground"}>Annehmen</span>
            </div>
          </div>
          <div className={"absolute -bottom-6 -left-4 flex \x72otate-[\x33deg] items-center gap-3 rounded-2xl \x62g-ink-foreground \x70x-4 \x70y-3 text-ink \x73hadow-pop"}>
            <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
            <span className={"\x74ext-sm \x66ont-bold"}>Neue Bestellung #43</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImportedSectionVierWegeZurBestellung() {
  return (
    <section className={"\x6dx-auto \x70x-5 \x70y-20 [max-width:72rem]"}>
      <h2 className={"\x74ext-4xl \x66ont-black [letter-spacing:-0.025em] [max-width:36rem]"}>Vier Wege zur Bestellung. Eine Übersicht.</h2>
      <div className={"mt-10 grid gap-4 \x73m:\x67rid-cols-2 \x6cg:\x67rid-cols-4"}>
        <div className={"rounded-2xl \x62order \x62g-card p-6 \x73hadow-card"}>
          <span className={"grid h-11 w-11 place-items-center rounded-xl \x62g-accent text-accent-foreground"}>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M12 16v.01" />
              <path d="M16 12h1" />
              <path d="M21 12v.01" />
              <path d="M12 21v-1" />
            </svg>
          </span>
          <h3 className={"mt-5 \x74ext-lg \x66ont-extrabold [letter-spacing:-0.025em]"}>Bestellen am Tisch</h3>
          <p className={"mt-2 \x74ext-sm text-muted-foreground"}>Jeder Tisch bekommt seinen QR-Code. Gäste scannen, wählen, bestellen.</p>
        </div>
        <div className={"rounded-2xl \x62order \x62g-card p-6 \x73hadow-card"}>
          <span className={"grid h-11 w-11 place-items-center rounded-xl \x62g-accent text-accent-foreground"}>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
              <path d="M2 7h20" />
              <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
            </svg>
          </span>
          <h3 className={"mt-5 \x74ext-lg \x66ont-extrabold [letter-spacing:-0.025em]"}>Abholung</h3>
          <p className={"mt-2 \x74ext-sm text-muted-foreground"}>Ein Link für Website &amp; Social Media – Kunden bestellen vorab und holen ab.</p>
        </div>
        <div className={"rounded-2xl \x62order \x62g-card p-6 \x73hadow-card"}>
          <span className={"grid h-11 w-11 place-items-center rounded-xl \x62g-accent text-accent-foreground"}>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5" />
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="15" cy="5" r="1" />
              <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
            </svg>
          </span>
          <h3 className={"mt-5 \x74ext-lg \x66ont-extrabold [letter-spacing:-0.025em]"}>Lieferung</h3>
          <p className={"mt-2 \x74ext-sm text-muted-foreground"}>Mit Adresse, Liefergebühr und Mindestbestellwert, ganz wie du willst.</p>
        </div>
        <div className={"rounded-2xl \x62order \x62g-card p-6 \x73hadow-card"}>
          <span className={"grid h-11 w-11 place-items-center rounded-xl \x62g-accent text-accent-foreground"}>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <h3 className={"mt-5 \x74ext-lg \x66ont-extrabold [letter-spacing:-0.025em]"}>Durchs Personal</h3>
          <p className={"mt-2 \x74ext-sm text-muted-foreground"}>Die Kasse fürs Team: Bestellung aufnehmen, an die Küche senden, fertig.</p>
        </div>
      </div>
    </section>
  );
}
