import { AuthBackground } from "@/modules/auth/components/AuthBackground";
import { LoginCard } from "@/modules/auth/components/LoginCard";

export function LoginPage() {
  return (
    <AuthBackground>
      <LoginCard />
    </AuthBackground>
  );
}
