import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AppLayout } from "@/components/app-layout";
import { NextLaunchWidget } from "@/components/next-launch-widget";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  staticData: {
    title: "Dashboard",
  },
  component: HomeComponent,
});

function HomeComponent() {
  const trpc = useTRPC();
  const nextLaunch = useQuery(trpc.nextLaunch.queryOptions());

  return (
    <AppLayout>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-1">
          {nextLaunch.isLoading ? (
            <div className="overflow-hidden rounded-none border bg-card text-card-foreground shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="h-4 w-28 animate-pulse bg-muted" />
                <div className="size-4 animate-pulse bg-muted" />
              </div>
              <div className="aspect-video animate-pulse bg-muted" />
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
    </AppLayout>
  );
}
