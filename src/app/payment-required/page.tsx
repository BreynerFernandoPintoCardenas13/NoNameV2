import type { Metadata } from "next";

import { PaymentRequiredPage } from "@/modules/auth/pages/PaymentRequiredPage";

export const metadata: Metadata = {
  title: "Pago requerido · NoName",
};

export default function PaymentRequired() {
  return <PaymentRequiredPage />;
}
