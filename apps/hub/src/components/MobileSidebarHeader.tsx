"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";

interface MobileSidebarHeaderProps {
  currentPage: 'dashboard' | 'blog' | 'admin' | 'expedientes' | 'supply' | 'prestadores' | 'tesoreria';
  title?: string;
  children?: React.ReactNode;
}

export function MobileSidebarHeader({ currentPage, title = "Hub Hospitalario", children }: MobileSidebarHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#e6e6e6] dark:border-[#2e2e2e] bg-[#f6f5f4]/95 dark:bg-[#191919]/95 backdrop-blur-md px-4">
      <div className="flex items-center gap-3 min-w-0">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-slate-700 dark:text-slate-200">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navegación Móvil</SheetTitle>
            <AppSidebar currentPage={currentPage} isMobile onMobileClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {title}
        </span>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
