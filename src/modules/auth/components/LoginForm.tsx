"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/modules/auth/hooks/useLogin";
import { loginSchema, type LoginInput } from "@/modules/auth/schemas/auth.schemas";

export function LoginForm() {
  const { passwordLogin } = useLogin();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => passwordLogin.mutate(values);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[12.5px] text-white/70">Correo</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className="h-10 border-white/10 bg-white/[0.04] text-[#f7f7f7] placeholder:text-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[12.5px] text-white/70">Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-10 border-white/10 bg-white/[0.04] pr-10 text-[#f7f7f7] placeholder:text-white/30"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition-colors hover:text-white/80"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {passwordLogin.isError && (
          <p role="alert" className="text-[13px] text-red-400/90">
            {passwordLogin.error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={passwordLogin.isPending || passwordLogin.isSuccess}
          className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-medium text-neutral-950 transition-all duration-300 hover:opacity-[0.85] disabled:pointer-events-none disabled:opacity-60"
        >
          {(passwordLogin.isPending || passwordLogin.isSuccess) && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          Iniciar sesión
        </button>
      </form>
    </Form>
  );
}
