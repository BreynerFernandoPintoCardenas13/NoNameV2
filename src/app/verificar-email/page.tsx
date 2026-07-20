import type { Metadata } from "next";

import { VerifyEmailPage } from "@/modules/auth/pages/VerifyEmailPage";

export const metadata: Metadata = {
  title: "Verificar correo · NoName",
};

export default function VerificarEmail() {
  return <VerifyEmailPage />;
}
