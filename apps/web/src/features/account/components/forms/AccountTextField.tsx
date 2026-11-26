'use client';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Input } from '@components/ui/input';

type AccountTextFieldProps = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  maxLength?: number;
};

export function AccountTextField({ name, label, ...props }: AccountTextFieldProps) {
  const { control } = useFormContext();
  return <FormField control={control} name={name} render={({ field }) => (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl><Input {...field} {...props} /></FormControl>
      <FormMessage />
    </FormItem>
  )} />;
}
