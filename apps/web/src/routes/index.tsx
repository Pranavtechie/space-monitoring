import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { NextLaunchWidget } from "@/components/next-launch-widget";
import { useTRPC } from "@/utils/trpc";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@app/ui/components/breadcrumb";
import { Separator } from "@app/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@app/ui/components/sidebar";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const trpc = useTRPC();
  const nextLaunch = useQuery(trpc.nextLaunch.queryOptions());

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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <section className="grid gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              A shared workspace for orbital data, monitoring tools, and mission
              workflows.
            </p>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-1">
              {nextLaunch.isLoading ? (
                <div className="overflow-hidden rounded-none border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="h-4 w-28 animate-pulse bg-muted" />
                    <div className="h-4 w-4 animate-pulse bg-muted" />
                  </div>
                  <div className="aspect-[16/9] animate-pulse bg-muted" />
                  <div className="grid gap-4 p-4">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="h-16 animate-pulse bg-muted" />
                      <div className="h-16 animate-pulse bg-muted" />
                      <div className="h-16 animate-pulse bg-muted" />
                      <div className="h-16 animate-pulse bg-muted" />
                    </div>
                    <div className="h-4 w-2/3 animate-pulse bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse bg-muted" />
                  </div>
                </div>
              ) : nextLaunch.error ? (
                <div className="rounded-none border bg-card p-4 text-card-foreground">
                  <h2 className="text-sm font-medium">Next Launch</h2>
                  <p className="text-muted-foreground mt-3 text-sm">
                    Failed to fetch the Next Spaceflight launch data.
                  </p>
                </div>
              ) : nextLaunch.data ? (
                <NextLaunchWidget data={nextLaunch.data} />
              ) : null}
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
