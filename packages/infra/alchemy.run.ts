import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });

const app = await alchemy("app", {
  adopt: true,
  stateStore: (scope) =>
    new CloudflareStateStore(scope, {
      scriptName: "space-monitoring-alchemy-state",
      forceUpdate: process.env.ALCHEMY_STATE_STORE_FORCE_UPDATE === "true",
    }),
});

const db = await D1Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

export const web = await TanStackStart("web", {
  cwd: "../../apps/web",
  name: "space-monitoring",
  domains: [{ domainName: "space-monitoring.tech", adopt: true }],
  bindings: {
    DB: db,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    GOOGLE_CLIENT_ID: alchemy.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: alchemy.secret.env.GOOGLE_CLIENT_SECRET!,
    TWITTER_CLIENT_ID: alchemy.env.TWITTER_CLIENT_ID!,
    TWITTER_CLIENT_SECRET: alchemy.secret.env.TWITTER_CLIENT_SECRET!,
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
