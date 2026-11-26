'use client';

import type { FormEventHandler } from 'react';
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

import type { GenreFormValues } from '@catalog/server/types';

interface GenreFormProps {
  form: UseFormReturn<GenreFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  isPending: boolean;
  mode: 'create' | 'edit';
}

export function GenreForm({
  form,
  onSubmit,
  onCancel,
  isPending,
}: GenreFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: Drama, Comédia, Infantil"
                  disabled={isPending}
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            className="min-h-11 px-5"
            disabled={isPending}
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
