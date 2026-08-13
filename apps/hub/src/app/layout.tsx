import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "prosemirror-view/style/prosemirror.css"; // Importación directa de estilos de ProseMirror
import { SessionProvider } from "@/components/SessionProvider";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceGuard } from "@/components/WorkspaceGuard";

import { UmamiScript } from "@/components/analytics/UmamiScript";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hub Hospitalario",
  description: "Plataforma SaaS integral para la gestión hospitalaria",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Los estilos de novel se importan globalmente en globals.css */}
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
          <UmamiScript />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}