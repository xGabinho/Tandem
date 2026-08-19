import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Tándem — Metas compartidas",
  description:
    "Planea, ahorra y alcanza metas financieras en pareja o grupo. Gestión colaborativa de ahorros con proyecciones inteligentes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-theme="minimal_dark" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
