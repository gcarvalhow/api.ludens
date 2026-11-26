'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

import { Button } from '@components/ui/button';
import { ThemeToggle } from '@components/ThemeToggle';
import { useAuth } from '@account/contexts/AuthContext';
import { useCurrentUser } from '@account/hooks/queries/useAccountQueries';
import { loginUrl } from '@account/lib/navigation';

function subscribeHash(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

function getHash() { return window.location.hash; }
function getServerHash() { return ''; }

export function AccountNavigation() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { data: user } = useCurrentUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const destination = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}${hash}`;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setPending(true);
    setError('');
    try {
      await logout();
      router.replace('/');
    } catch {
      setError('Você saiu neste dispositivo, mas não foi possível confirmar o encerramento das outras sessões. Entre novamente para tentar.');
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="border-b bg-background">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:block focus:p-3 focus:underline">Ir para o conteúdo</a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="min-h-11 content-center text-xl font-semibold">Ludens</Link>
        <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-2">
          {isLoading ? <span role="status">Carregando conta...</span> : isAuthenticated ? <>
            <span className="max-w-44 truncate px-2" title={user?.name}>Olá, {user?.name ?? 'comprador'}</span>
            <Button variant="ghost" className="min-h-11" asChild>
              <Link href="/minha-conta" aria-current={pathname === '/minha-conta' ? 'page' : undefined}>Minha conta</Link>
            </Button>
            <Button variant="ghost" className="min-h-11" asChild>
              <Link href="/minhas-reservas" aria-current={pathname === '/minhas-reservas' ? 'page' : undefined}>Minhas reservas</Link>
            </Button>
            <Button variant="ghost" className="min-h-11" asChild>
              <Link href="/minhas-compras" aria-current={pathname.startsWith('/minhas-compras') ? 'page' : undefined}>Minhas compras</Link>
            </Button>
            <Button variant="ghost" className="min-h-11" asChild>
              <Link href="/meus-ingressos" aria-current={pathname === '/meus-ingressos' ? 'page' : undefined}>Meus ingressos</Link>
            </Button>
            {user?.is_admin ? <Button variant="outline" className="min-h-11" asChild><Link href="/admin">Painel administrativo</Link></Button> : null}
            <Button variant="outline" className="min-h-11" onClick={() => void signOut()} disabled={pending} aria-describedby="efeito-logout">
              {pending ? 'Saindo...' : 'Sair'}
            </Button>
          </> : <>
            <Button variant="ghost" className="min-h-11" asChild><Link href={loginUrl(destination)}>Entrar</Link></Button>
            <Button className="min-h-11" asChild><Link href={`/registro?returnTo=${encodeURIComponent(destination)}`}>Criar conta</Link></Button>
          </>}
          <ThemeToggle />
        </nav>
        {isAuthenticated ? <p id="efeito-logout" className="w-full text-right text-xs text-muted-foreground">Sair encerra suas sessões em todos os dispositivos.</p> : null}
        {error ? <p role="alert" className="w-full text-sm text-destructive">{error}</p> : null}
      </div>
    </header>
  );
}
