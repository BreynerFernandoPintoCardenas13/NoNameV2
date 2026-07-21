import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAppUserByAuthId } from "@/modules/auth/services/auth.service";
import { getSupabaseServerClient } from "@/modules/auth/services/supabase.server";
import { ROLES } from "@/modules/auth/types";
import { AdminDashboardPage } from "@/modules/admin/pages/AdminDashboardPage";

export const metadata: Metadata = {
  title: "Panel Administrador · NoName",
};

/**
 * Acceso restringido a admin/superadmin. La validación ocurre aquí, en el
 * servidor, no en el sidebar: ocultar el botón para otros roles es solo
 * cortesía de UX, nunca la barrera real (ver ADMIN_ANALYTICS_PLAN.md §2.3).
 */
export default async function Admin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appUser = await getAppUserByAuthId(supabase, user.id);
  const isAdmin = appUser?.role === ROLES.ADMIN || appUser?.role === ROLES.SUPERADMIN;
  if (!isAdmin) redirect("/dashboard");

  return <AdminDashboardPage />;
}
