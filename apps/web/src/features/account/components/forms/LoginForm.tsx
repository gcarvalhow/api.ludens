'use client';

import Link from 'next/link';
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

import type { LoginRequest } from '@account/server/types/auth.types';

type LoginFormProps = {
  form: UseFormReturn<LoginRequest>;
  onSubmit: () => void;
  isPending: boolean;
  returnTo?: string;
};

export function LoginForm({ form, onSubmit, isPending, returnTo = '/' }: LoginFormProps) {
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Entrando...' : 'Entrar'}
        </Button>

        <Link
          href="/recuperar-senha"
          className="self-center text-sm text-primary underline-offset-4 hover:underline"
        >
          Esqueci minha senha
        </Link>
        <Link href={`/registro?returnTo=${encodeURIComponent(returnTo)}`} className="self-center text-sm underline">
          Criar conta
        </Link>
      </form>
    </Form>
  );
}
