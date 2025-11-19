import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceGuard } from "@/components/WorkspaceGuard";
import "novel/dist/styles.css"; // Importar los estilos de novel aquí

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hub Hospitalario",
  description: "Plataforma SaaS integral para la gestión hospitalaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Los estilos de novel ahora se importan directamente en NotionEditor.tsx */}
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