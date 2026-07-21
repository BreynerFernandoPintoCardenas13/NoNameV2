import type { Metadata } from "next";

import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard · NoName",
};

export default function Dashboard() {
  return <DashboardPage />;
}
