import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Naminto IA',
  description:
    "Naminto IA — transforme une intention en langage naturel en application logicielle complète, fonctionnelle et testée.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
