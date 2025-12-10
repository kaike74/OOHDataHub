import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OOH Data Hub - Sistema de Gestão E-MÍDIAS",
  description: "Sistema moderno de gestão de pontos OOH com mapa interativo e identidade visual E-MÍDIAS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
