"use client";

import { CheckCircle2, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type {
  RegisterStepApiKeyInput,
  RegisterStepEmailInput,
  RegisterStepUsernameInput,
} from "@/modules/auth/schemas/auth.schemas";

const inputClassName =
  "h-10 border-white/10 bg-white/[0.04] text-[#f7f7f7] placeholder:text-white/30";
const labelClassName = "text-[12.5px] text-white/70";

export function StepUsername({ form }: { form: UseFormReturn<RegisterStepUsernameInput> }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <h3 className="text-lg font-medium text-[#f7f7f7]">Bienvenido a NoName</h3>
      <p className="text-[13px] leading-relaxed text-white/55">
        Antes de comenzar necesitamos algunos datos.
      </p>
      <Form {...form}>
        <form noValidate onSubmit={(e) => e.preventDefault()}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClassName}>Nombre de usuario</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="username"
                    placeholder="mi-usuario"
                    maxLength={30}
                    className={inputClassName}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

export function StepCredentials({ form }: { form: UseFormReturn<RegisterStepEmailInput> }) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 py-2">
      <h3 className="text-lg font-medium text-[#f7f7f7]">Tu cuenta</h3>
      <p className="text-[13px] leading-relaxed text-white/55">
        Usaremos este correo para verificar tu identidad.
      </p>
      <Form {...form}>
        <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClassName}>Correo electrónico</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    className={inputClassName}
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
                <FormLabel className={labelClassName}>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={`${inputClassName} pr-10`}
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
        </form>
      </Form>
    </div>
  );
}

interface StepVerifyEmailProps {
  email: string;
  creating: boolean;
  createError: string | null;
  verified: boolean;
}

/** Feedback del estado REAL de verificación consultado a Supabase (sin simulación). */
export function StepVerifyEmail({ email, creating, createError, verified }: StepVerifyEmailProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      {creating ? (
        <>
          <Loader2 className="size-8 animate-spin text-white/60" aria-hidden="true" />
          <h3 className="text-lg font-medium text-[#f7f7f7]">Creando tu cuenta…</h3>
        </>
      ) : createError ? (
        <>
          <h3 className="text-lg font-medium text-[#f7f7f7]">No se pudo crear la cuenta</h3>
          <p role="alert" className="text-[13px] text-red-400/90">
            {createError}
          </p>
          <p className="text-[12.5px] text-white/45">Vuelve atrás para corregir tus datos.</p>
        </>
      ) : verified ? (
        <>
          <CheckCircle2 className="size-8 text-white" aria-hidden="true" />
          <h3 className="text-lg font-medium text-[#f7f7f7]">Correo verificado</h3>
          <p className="text-[13px] text-white/55">Ya puedes continuar con el último paso.</p>
        </>
      ) : (
        <>
          <span className="relative flex size-10 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/10" />
            <MailCheck className="size-6 text-white/70" aria-hidden="true" />
          </span>
          <h3 className="text-lg font-medium text-[#f7f7f7]">Verifica tu correo</h3>
          <p className="text-[13px] leading-relaxed text-white/55">
            Enviamos un enlace de confirmación a <span className="text-white/85">{email}</span>.
            Esta pantalla se actualizará sola en cuanto Supabase confirme la verificación.
          </p>
          <p
            className="flex items-center gap-1.5 text-[12px] text-white/40"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            Esperando confirmación…
          </p>
        </>
      )}
    </div>
  );
}

export function StepApiKey({ form }: { form: UseFormReturn<RegisterStepApiKeyInput> }) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 py-2">
      <h3 className="text-lg font-medium text-[#f7f7f7]">API KEY de OpenProject</h3>

      <Form {...form}>
        <form noValidate onSubmit={(e) => e.preventDefault()}>
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClassName}>API KEY</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={show ? "text" : "password"}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="••••••••••••••••"
                      className={`${inputClassName} pr-18`}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-[12px] font-medium text-white/50 transition-colors hover:text-white/85"
                    >
                      {show ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <p className="text-[11.5px] leading-relaxed text-white/35">
        Tu API KEY se guarda cifrada en tránsito y nunca vuelve a mostrarse en el navegador.
      </p>
    </div>
  );
}
