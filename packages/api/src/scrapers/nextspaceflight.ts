const NEXT_SPACEFLIGHT_HOME_URL = "https://nextspaceflight.com/";
const NEXT_SPACEFLIGHT_DETAILS_URL = "https://nextspaceflight.com/launches/details/";
const NEXT_SPACEFLIGHT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type NextSpaceflightLaunchPayload = {
  id: number;
  name: string;
  lsp_name: string;
  status_id: number;
  net: string;
  net_precision: string;
  rocket_config_name: string;
  rocket_config_thumbnail: string;
  pad_location_name: string;
  pad_name: string;
  vid_url: string;
  short_recoveries: Array<{
    landing_status: string;
    recovery_status: string;
    landing_zone: {
      name: string;
      icon: string;
      custom_icon: boolean;
    };
  }>;
};

export type NextLaunch = {
  id: number;
  name: string;
  provider: string;
  statusId: number;
  net: string;
  netPrecision: string;
  rocket: string;
  rocketThumbnail: string;
  location: string;
  pad: string;
  videoUrl: string | null;
  recoveries: Array<{
    landingStatus: string;
    recoveryStatus: string;
    landingZone: string;
  }>;
  sourceUrl: string;
};

type CacheEntry = {
  launch: NextLaunch;
  fetchedAt: string;
  expiresAt: string;
};

let cache: CacheEntry | null = null;

export function parseNextLaunch(html: string, now = new Date()): NextLaunch {
  const launches = extractLaunchPayloads(html);
  const launch = launches
    .filter((candidate) => new Date(candidate.net) >= now)
    .sort((first, second) => new Date(first.net).getTime() - new Date(second.net).getTime())[0];

  if (!launch) {
    throw new Error("No upcoming launch was found in the Next Spaceflight page HTML.");
  }

  return {
    id: launch.id,
    name: launch.name,
    provider: launch.lsp_name,
    statusId: launch.status_id,
    net: launch.net,
    netPrecision: launch.net_precision,
    rocket: launch.rocket_config_name,
    rocketThumbnail: launch.rocket_config_thumbnail,
    location: launch.pad_location_name,
    pad: launch.pad_name,
    videoUrl: launch.vid_url || null,
    recoveries: launch.short_recoveries.map((recovery) => ({
      landingStatus: recovery.landing_status,
      recoveryStatus: recovery.recovery_status,
      landingZone: recovery.landing_zone.name,
    })),
    sourceUrl: `${NEXT_SPACEFLIGHT_DETAILS_URL}${launch.id}/`,
  };
}

export async function getCachedNextLaunch(now = new Date()) {
  if (cache && new Date(cache.expiresAt) > now) {
    return {
      ...cache,
      cacheStatus: "hit" as const,
    };
  }

  const response = await fetch(NEXT_SPACEFLIGHT_HOME_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "SpaceDashboardBot/0.1 (+https://nextspaceflight.com/)",
    },
  });

  if (!response.ok) {
    throw new Error(`Next Spaceflight returned ${response.status} ${response.statusText}.`);
  }

  const html = await response.text();
  const fetchedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + NEXT_SPACEFLIGHT_CACHE_TTL_MS).toISOString();

  cache = {
    launch: parseNextLaunch(html, now),
    fetchedAt,
    expiresAt,
  };

  return {
    ...cache,
    cacheStatus: "miss" as const,
  };
}

function extractLaunchPayloads(html: string): NextSpaceflightLaunchPayload[] {
  const launches: NextSpaceflightLaunchPayload[] = [];
  let searchFrom = 0;

  while (true) {
    const launchKeyIndex = html.indexOf('\\"launch\\":', searchFrom);

    if (launchKeyIndex === -1) {
      break;
    }

    const objectStart = html.indexOf("{", launchKeyIndex);

    if (objectStart === -1) {
      break;
    }

    const objectEnd = findEscapedJsonObjectEnd(html, objectStart);

    if (objectEnd === -1) {
      searchFrom = objectStart + 1;
      continue;
    }

    const escapedObject = html.slice(objectStart, objectEnd + 1);
    searchFrom = objectEnd + 1;

    try {
      const decodedObject = JSON.parse(`"${escapedObject}"`) as string;
      const launch = JSON.parse(decodedObject) as NextSpaceflightLaunchPayload;

      if (isLaunchPayload(launch)) {
        launches.push(launch);
      }
    } catch {
      continue;
    }
  }

  return launches;
}

function findEscapedJsonObjectEnd(input: string, objectStart: number) {
  let depth = 0;
  let inString = false;

  for (let index = objectStart; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === "\\" && nextCharacter === '"') {
      inString = !inString;
      index += 1;
      continue;
    }

    if (character === "\\" && inString) {
      index += 1;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function isLaunchPayload(value: unknown): value is NextSpaceflightLaunchPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const launch = value as Partial<NextSpaceflightLaunchPayload>;

  return (
    typeof launch.id === "number" &&
    typeof launch.name === "string" &&
    typeof launch.lsp_name === "string" &&
    typeof launch.net === "string" &&
    typeof launch.rocket_config_name === "string" &&
    typeof launch.pad_location_name === "string" &&
    Array.isArray(launch.short_recoveries)
  );
}
