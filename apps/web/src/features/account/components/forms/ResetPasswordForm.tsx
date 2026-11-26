'use client';

import type { UseFormReturn } from 'react-hook-form';

import { Alert, AlertDescription } from '@components/ui/alert';
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

import type { ResetPasswordRequest } from '@account/server/types/auth.types';

type ResetPasswordFormProps = {
  form: UseFormReturn<ResetPasswordRequest>;
  onSubmit: () => void;
  isPending: boolean;
  hasToken: boolean;
};

export function ResetPasswordForm({
  form,
  onSubmit,
  isPending,
  hasToken,
}: ResetPasswordFormProps) {
  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {!hasToken && (
          <Alert variant="destructive">
            <AlertDescription>Token de recuperação não encontrado.</AlertDescription>
          </Alert>
        )}

        <input type="hidden" {...form.register('token')} />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  disabled={isPending || !hasToken}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending || !hasToken}>
          {isPending ? 'Redefinindo...' : 'Redefinir senha'}
        </Button>
      </form>
    </Form>
  );
}
