import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceGuard } from "@/components/WorkspaceGuard";
// Eliminado: import fs from 'fs';
// Eliminado: import path from 'path';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hub Hospitalario",
  description: "Plataforma SaaS integral para la gestión hospitalaria",
};

// Eliminado: Leer el contenido del CSS de novel directamente
// Eliminado: let novelStyles = '';
// Eliminado: try {
// Eliminado:   const novelCssPath = path.join(process.cwd(), '..', '..', 'node_modules', 'novel', 'dist', 'index.css');
// Eliminado:   novelStyles = fs.readFileSync(novelCssPath, 'utf8');
// Eliminado: } catch (error) {
// Eliminado:   console.error('Error al leer novel/dist/index.css:', error);
// Eliminado: }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Eliminado: Inyectar los estilos de novel aquí */}
        {/* Eliminado: {novelStyles && <style dangerouslySetInnerHTML={{ __html: novelStyles }} />} */}
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <SessionProvider>
          <ThemeProvider>
            <WorkspaceProvider>
              <WorkspaceGuard>
                {children}
              </WorkspaceGuard>
            </WorkspaceProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}