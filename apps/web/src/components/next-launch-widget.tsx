import { useEffect, useMemo, useState } from "react";
import type { AppRouter } from "@app/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";
import dayjs from "dayjs";
import { CalendarClock, ExternalLink, MapPin, Rocket, Satellite } from "lucide-react";

type NextLaunchData = inferRouterOutputs<AppRouter>["nextLaunch"];

type NextLaunchWidgetProps = {
  data: NextLaunchData;
};

type CountdownParts = {
  units: Array<{
    label: string;
    value: string;
  }>;
  isLive: boolean;
};

export function NextLaunchWidget({ data }: NextLaunchWidgetProps) {
  const launchAt = useMemo(() => dayjs(data.launch.net), [data.launch.net]);
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const countdown = getCountdownParts(launchAt.diff(now));
  const launchTime = launchAt.format("MMM D, YYYY h:mm A");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <a
      href={data.launch.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-none border bg-card text-card-foreground shadow-sm transition-colors hover:border-cyan-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      aria-label={`Open ${data.launch.name} on Next Spaceflight`}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Satellite className="size-4 shrink-0 text-cyan-500" aria-hidden="true" />
          <h2 className="truncate text-sm font-medium">Next Launch</h2>
        </div>
        <ExternalLink
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan-500"
          aria-hidden="true"
        />
      </div>

      <div className="border-b bg-muted/30 p-4">
        <p className="text-xs font-medium uppercase text-cyan-600 dark:text-cyan-400">
          {data.launch.provider}
        </p>
        <h3 className="mt-1 line-clamp-2 text-xl font-semibold tracking-normal">
          {data.launch.name}
        </h3>
      </div>

      <div className="grid gap-4 p-4">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${countdown.units.length}, minmax(0, 1fr))` }}
          aria-label="Countdown to T-0"
        >
          {countdown.units.map((unit) => (
            <CountdownUnit key={unit.label} label={unit.label} value={unit.value} />
          ))}
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <Rocket className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <span>{data.launch.rocket}</span>
          </div>
          <div className="flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            <span>
              {data.launch.pad}, {data.launch.location}
            </span>
          </div>
          <div className="flex gap-2">
            <CalendarClock
              className="mt-0.5 size-4 shrink-0 text-muted-foreground/70"
              aria-hidden="true"
            />
            <span>
              {launchTime} <span className="text-xs">({timezone})</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>{countdown.isLive ? "T-0 reached" : "Counting down to T-0"}</span>
          <span>Credit: Next Spaceflight</span>
        </div>
      </div>
    </a>
  );
}

function CountdownUnit({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border bg-muted/40 px-2 py-3 text-center">
      <div className="font-mono text-2xl font-semibold tabular-nums tracking-normal">{value}</div>
      <div className="mt-1 text-[0.65rem] font-medium uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function getCountdownParts(diffMs: number): CountdownParts {
  const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(remainingSeconds / 86_400);
  const hours = Math.floor((remainingSeconds % 86_400) / 3_600);
  const minutes = Math.floor((remainingSeconds % 3_600) / 60);
  const seconds = remainingSeconds % 60;
  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ];
  const firstVisibleUnitIndex = units.findIndex((unit) => unit.value > 0);
  const visibleUnits =
    firstVisibleUnitIndex === -1 ? units.slice(-1) : units.slice(firstVisibleUnitIndex);

  return {
    units: visibleUnits.map((unit) => ({
      label: unit.label,
      value: String(unit.value).padStart(2, "0"),
    })),
    isLive: diffMs <= 0,
  };
}
