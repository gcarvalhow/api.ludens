'use client';

import { TicketPercent, TriangleAlert } from 'lucide-react';
import type { FormEventHandler } from 'react';
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

import { formatPriceBRL } from '@catalog/lib';

import type { SessionFormValues } from '@catalog/server/types';

interface SessionFormProps {
  form: UseFormReturn<SessionFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  isPending: boolean;
  mode: 'create' | 'edit';
  ticketsSold: number;
}

export function SessionForm({
  form,
  onSubmit,
  onCancel,
  isPending,
  mode,
  ticketsSold,
}: SessionFormProps) {
  const fullPrice = form.watch('full_price');
  const halfPriceLabel =
    typeof fullPrice === 'number' && fullPrice > 0
      ? formatPriceBRL(fullPrice / 2)
      : null;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {mode === 'edit' && ticketsSold > 0 ? (
          <Alert variant="destructive" className="items-start">
            <TriangleAlert className="mt-0.5" />
            <AlertDescription>
              Esta sessão já vendeu {ticketsSold} ingresso(s). Alterar
              data/horário notifica os compradores, e a capacidade não
              pode ficar abaixo do total já comprometido.
            </AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="starts_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data e hora</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  disabled={isPending}
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Local</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: Teatro Municipal, sala principal"
                  disabled={isPending}
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidade</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    disabled={isPending}
                    className="min-h-11"
                    {...field}
                    value={
                      Number.isNaN(field.value)
                        ? ''
                        : field.value
                    }
                    onChange={(event) =>
                      field.onChange(event.target.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="full_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço da inteira (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={isPending}
                    className="min-h-11"
                    {...field}
                    value={
                      Number.isNaN(field.value)
                        ? ''
                        : field.value
                    }
                    onChange={(event) =>
                      field.onChange(event.target.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <TicketPercent className="size-3.5 shrink-0 text-primary" />
          A meia-entrada é calculada automaticamente em 50% da
          inteira{halfPriceLabel ? ` — hoje seria ${halfPriceLabel}` : ''}.
        </p>

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
