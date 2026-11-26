'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  Armchair,
  ChevronRight,
  Drama,
  Lock,
  Tags,
  Ticket,
} from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Card, CardContent } from '@components/ui/card';
import { LogoIcon } from '@components/LogoIcon';

interface HubOption {
  href?: string;
  title: string;
  description: string;
  icon: 'shows' | 'tags' | 'seats' | 'sales';
}

const OPTIONS: HubOption[] = [
  {
    href: '/admin/espetaculos',
    title: 'Espetáculos e sessões',
    description:
      'Cadastre espetáculos, gerencie sessões e publique o catálogo.',
    icon: 'shows',
  },
  {
    href: '/admin/generos',
    title: 'Gêneros',
    description:
      'Crie e edite as categorias usadas pelos espetáculos.',
    icon: 'tags',
  },
  {
    title: 'Assentos',
    description:
      'Mapa de assentos por sessão. Depende do módulo de reservas no backend.',
    icon: 'seats',
  },
  {
    href: '/admin/pedidos',
    title: 'Pedidos e cancelamentos',
    description:
      'Acompanhe pedidos simulados, cancelamentos e valide ingressos no check-in.',
    icon: 'sales',
  },
];

function OptionIcon({ icon }: { icon: HubOption['icon'] }) {
  if (icon === 'shows') {
    return <Drama className="size-full" />;
  }

  if (icon === 'tags') {
    return <Tags className="size-full" />;
  }

  if (icon === 'seats') {
    return <Armchair className="size-full" />;
  }

  return <Ticket className="size-full" />;
}

export function AdminHub() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Início
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fae9e9] p-2.5">
          <LogoIcon className="size-full" />
        </span>

        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Painel administrativo
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha o que você quer gerenciar.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) =>
          option.href ? (
            <Link
              key={option.title}
              href={option.href}
              className="block"
            >
              <Card className="h-full border-t-2 border-t-primary/70 transition hover:shadow-md">
                <CardContent className="flex h-full items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 p-2 text-primary">
                    <OptionIcon icon={option.icon} />
                  </span>

                  <div className="flex-1 space-y-1">
                    <h2 className="font-medium">
                      {option.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card
              key={option.title}
              className="h-full opacity-70"
            >
              <CardContent className="flex h-full items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted p-2 text-muted-foreground">
                  <OptionIcon icon={option.icon} />
                </span>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium">
                      {option.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className="gap-1"
                    >
                      <Lock className="size-3 text-primary" />
                      Em breve
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </main>
  );
}
