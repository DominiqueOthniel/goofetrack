import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIA-GOOFE',
  description: 'Application de gestion de flotte de transport',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
