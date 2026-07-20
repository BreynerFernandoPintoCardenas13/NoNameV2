import * as React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField as FormFieldPrimitive,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FieldKind = "text" | "email" | "password" | "textarea" | "checkbox" | "switch" | "select";

type FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: FieldKind;
  options?: { value: string; label: string }[];
};

/** Field compuesto (label + control + descripción + error) sobre ui/form.tsx, para no reimplementar validación visual en cada formulario. */
export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  label,
  description,
  placeholder,
  type = "text",
  options,
}: FormFieldProps<TFieldValues, TName>) {
  const isToggle = type === "checkbox" || type === "switch";

  return (
    <FormFieldPrimitive
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={isToggle ? "flex-row items-center justify-between" : undefined}>
          {label && !isToggle && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {type === "textarea" ? (
              <Textarea placeholder={placeholder} {...field} />
            ) : type === "checkbox" ? (
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            ) : type === "switch" ? (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            ) : type === "select" ? (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input type={type} placeholder={placeholder} {...field} />
            )}
          </FormControl>
          {label && isToggle && <FormLabel className="font-normal">{label}</FormLabel>}
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
