"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Step, Stepper } from "@/components/effects/stepper";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  StepApiKey,
  StepCredentials,
  StepUsername,
  StepVerifyEmail,
} from "@/modules/auth/components/register-steps";
import { useRegister } from "@/modules/auth/hooks/useRegister";
import {
  registerStepApiKeySchema,
  registerStepEmailSchema,
  registerStepUsernameSchema,
  type RegisterStepApiKeyInput,
  type RegisterStepEmailInput,
  type RegisterStepUsernameInput,
} from "@/modules/auth/schemas/auth.schemas";
import { resolvePostLoginRoute } from "@/modules/auth/utils/auth-redirect";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Modal de registro: stepper de 4 pasos con verificación real de correo. */
export function RegisterModal({ open, onOpenChange }: RegisterModalProps) {
  const router = useRouter();
  const register = useRegister();
  const [step, setStep] = React.useState(1);

  const usernameForm = useForm<RegisterStepUsernameInput>({
    resolver: zodResolver(registerStepUsernameSchema),
    mode: "onChange",
    defaultValues: { username: "" },
  });
  const credentialsForm = useForm<RegisterStepEmailInput>({
    resolver: zodResolver(registerStepEmailSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });
  const apiKeyForm = useForm<RegisterStepApiKeyInput>({
    resolver: zodResolver(registerStepApiKeySchema),
    mode: "onChange",
    defaultValues: { apiKey: "" },
  });

  const handleStepChange = (newStep: number) => {
    setStep(newStep);
    if (newStep === 2) register.setUsername(usernameForm.getValues("username"));
    if (newStep === 3 && !register.accountCreated) {
      const { email, password } = credentialsForm.getValues();
      register.setCredentials(email, password);
      register.signUp.mutate({
        username: usernameForm.getValues("username"),
        email,
        password,
      });
    }
  };

  const handleFinish = () => {
    register.finish.mutate(apiKeyForm.getValues("apiKey"), {
      onSuccess: (user) => {
        toast.success("Cuenta creada correctamente");
        router.replace(resolvePostLoginRoute(user));
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const nextDisabled =
    (step === 1 && !usernameForm.formState.isValid) ||
    (step === 2 && !credentialsForm.formState.isValid) ||
    (step === 3 && (register.signUp.isPending || !register.emailVerified)) ||
    (step === 4 && (!apiKeyForm.formState.isValid || register.finish.isPending));

  // En el último paso el botón ejecuta el registro final en lugar de
  // avanzar el stepper (el spread de nextButtonProps pisa el onClick interno).
  const nextButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement> =
    step === 4 ? { disabled: nextDisabled, onClick: handleFinish } : { disabled: nextDisabled };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/60 backdrop-blur-md"
        className="max-w-md border-none bg-[#0a0a0a] p-0 text-[#f7f7f7] ring-white/10 sm:max-w-md"
      >
        <DialogTitle className="sr-only">Crear cuenta en NoName</DialogTitle>
        <Stepper
          initialStep={1}
          onStepChange={handleStepChange}
          disableStepIndicators
          backButtonText="Atrás"
          nextButtonText="Continuar"
          completeButtonText={register.finish.isPending ? "Guardando…" : "Finalizar"}
          stepCircleContainerClassName="border-none shadow-none"
          backButtonProps={{
            // Tras crear la cuenta ya no se puede retroceder (salvo error de creación).
            disabled: register.accountCreated && !register.signUp.isError,
          }}
          nextButtonProps={nextButtonProps}
        >
          <Step>
            <StepUsername form={usernameForm} />
          </Step>
          <Step>
            <StepCredentials form={credentialsForm} />
          </Step>
          <Step>
            <StepVerifyEmail
              email={register.data.email}
              creating={register.signUp.isPending}
              createError={register.signUp.error?.message ?? null}
              verified={register.emailVerified}
            />
          </Step>
          <Step>
            <StepApiKey form={apiKeyForm} />
          </Step>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
