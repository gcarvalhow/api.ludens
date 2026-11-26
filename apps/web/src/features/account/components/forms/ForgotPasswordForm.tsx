'use client';

import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';

import type { ForgotPasswordRequest } from '@account/server/types/auth.types';

type ForgotPasswordFormProps = {
  form: UseFormReturn<ForgotPasswordRequest>;
  onSubmit: () => void;
  isPending: boolean;
};

export function ForgotPasswordForm({ form, onSubmit, isPending }: ForgotPasswordFormProps) {
  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar'}
        </Button>
      </form>
    </Form>
  );
}
