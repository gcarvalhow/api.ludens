import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Geist } from 'next/font/google';

import { cn } from '@web/lib/utils';
import { ThemeProvider } from '@components/ThemeProvider';
import { AccountNavigation } from '@account/components/AccountNavigation';

import { Providers } from './providers';

import '@web/lib/zod-pt-br';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Ludens',
  description: 'Ingressos do teatro comunitário',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={cn('font-sans', geist.variable)}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <Suspense fallback={<header className="border-b p-4" aria-busy="true">Ludens</header>}>
              <AccountNavigation />
            </Suspense>
            <div id="conteudo" tabIndex={-1}>{children}</div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
