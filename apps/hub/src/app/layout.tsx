import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceGuard } from "@/components/WorkspaceGuard";
import fs from 'fs';
import path from 'path';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hub Hospitalario",
  description: "Plataforma SaaS integral para la gestión hospitalaria",
};

// Leer el contenido del CSS de novel directamente
let novelStyles = '';
try {
  // Ajustar la ruta para el monorepo: subir dos niveles para llegar al node_modules raíz
  const novelCssPath = path.join(process.cwd(), '..', '..', 'node_modules', 'novel', 'dist', 'index.css');
  novelStyles = fs.readFileSync(novelCssPath, 'utf8');
} catch (error) {
  console.error('Error al leer novel/dist/index.css:', error);
  // En producción, esto podría ser un problema, pero en desarrollo podemos continuar
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inyectar los estilos de novel aquí */}
        {novelStyles && <style dangerouslySetInnerHTML={{ __html: novelStyles }} />}
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