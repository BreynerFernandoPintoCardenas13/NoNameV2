import type { Metadata } from "next";

import { LoginPage } from "@/modules/auth/pages/LoginPage";

export const metadata: Metadata = {
  title: "Iniciar sesión · NoName",
};

export default function Login() {
  return <LoginPage />;
}
