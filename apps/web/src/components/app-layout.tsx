import type * as React from "react";
import { useMatches } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@app/ui/components/breadcrumb";
import { Separator } from "@app/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@app/ui/components/sidebar";

function useCurrentPageTitle() {
  const matches = useMatches();
  const titleMatch = [...matches]
    .reverse()
    .find((match) => typeof match.staticData.title === "string");

  return titleMatch?.staticData.title ?? "Space Monitoring";
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const title = useCurrentPageTitle();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
