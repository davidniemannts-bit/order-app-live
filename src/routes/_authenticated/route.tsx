import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  staticData: { sitemap: "exclude-subtree" },
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Restore the persisted browser session locally. getUser() makes an extra
    // network request and can report no user during a transient Auth/API issue,
    // even when the browser still has a valid persisted session.
    const { data, error } = await supabase.auth.getSession();
    const session = data.session;

    if (error || !session?.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    return { user: session.user };
  },
  component: () => <Outlet />,
});
