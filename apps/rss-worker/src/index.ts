import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { generateOpml, generateRssFeed, parseFeed, parseOpml } from "feedsmith";
import type { AnyFeed, AtomFeed, JsonFeed, RdfFeed, RssFeed } from "feedsmith";
import * as schema from "@app/db/schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;
type Format = AnyFeed["format"];

function extractGuid(format: Format, item: unknown): string {
  if (format === "rss") return (item as RssFeed.Item<string>).guid?.value ?? (item as RssFeed.Item<string>).link ?? crypto.randomUUID();
  if (format === "atom") return (item as AtomFeed.Entry<string>).id ?? crypto.randomUUID();
  if (format === "rdf") return (item as RdfFeed.Item<string>).link ?? crypto.randomUUID();
  if (format === "json") return (item as JsonFeed.Item<string>).id ?? crypto.randomUUID();
  return crypto.randomUUID();
}

function extractLink(format: Format, item: unknown): string | undefined {
  if (format === "rss") return (item as RssFeed.Item<string>).link;
  if (format === "atom") return (item as AtomFeed.Entry<string>).links?.find((l: AtomFeed.Link<string>) => !l.rel || l.rel === "alternate")?.href;
  if (format === "rdf") return (item as RdfFeed.Item<string>).link;
  if (format === "json") return (item as JsonFeed.Item<string>).url;
  return undefined;
}

function extractDate(format: Format, item: unknown): Date | undefined {
  let raw: string | undefined;
  if (format === "rss") raw = (item as RssFeed.Item<string>).pubDate;
  else if (format === "atom") { const e = item as AtomFeed.Entry<string>; raw = e.published ?? e.updated; }
  else if (format === "rdf") raw = (item as RdfFeed.Item<string>).dc?.dates?.[0];
  else if (format === "json") raw = (item as JsonFeed.Item<string>).date_published;
  return raw ? new Date(raw) : undefined;
}

function itemsFrom(result: AnyFeed<string>): unknown[] {
  if (result.format === "atom") return result.feed.entries ?? [];
  return result.feed.items ?? [];
}

async function fetchFeed(db: DB, feed: typeof schema.rssFeeds.$inferSelect): Promise<void> {
  const res = await fetch(feed.url, { headers: { "User-Agent": "space-monitoring-rss/1.0" } });
  if (!res.ok) return;

  const result = parseFeed(await res.text());
  const { format, feed: parsed } = result;

  const feedTitle =
    format === "atom"
      ? (parsed as AtomFeed.Feed<string>).title?.value
      : (parsed as RssFeed.Feed<string> | RdfFeed.Feed<string> | JsonFeed.Feed<string>).title;

  await db
    .update(schema.rssFeeds)
    .set({ title: feedTitle ?? feed.title, lastFetchedAt: new Date() })
    .where(eq(schema.rssFeeds.id, feed.id));

  const items = itemsFrom(result as AnyFeed<string>);
  if (items.length === 0) return;

  await db
    .insert(schema.rssItems)
    .values(
      items.map((item) => ({
        feedId: feed.id,
        guid: extractGuid(format, item),
        link: extractLink(format, item),
        publishedAt: extractDate(format, item),
        format,
        raw: JSON.stringify(item),
      })),
    )
    .onConflictDoNothing();
}

function toRssItem(row: {
  guid: string;
  link: string | null;
  publishedAt: Date | null;
  format: string;
  raw: string;
  feedTitle: string | null;
}) {
  const item = JSON.parse(row.raw) as Record<string, unknown>;
  const format = row.format as Format;

  let title: string | undefined;
  let description: string | undefined;
  let author: string | undefined;

  if (format === "rss") {
    const r = item as RssFeed.Item<string>;
    title = r.title;
    description = r.content?.encoded ?? r.description;
    author = r.authors?.[0]?.name ?? r.authors?.[0]?.email;
  } else if (format === "atom") {
    const a = item as AtomFeed.Entry<string>;
    title = a.title?.value;
    description = a.content?.value ?? a.summary?.value;
    author = a.authors?.[0]?.name;
  } else if (format === "rdf") {
    const r = item as RdfFeed.Item<string>;
    title = r.title;
    description = r.content?.encoded ?? r.description;
    author = r.dc?.creators?.[0];
  } else if (format === "json") {
    const j = item as JsonFeed.Item<string>;
    title = j.title;
    description = j.content_html ?? j.content_text ?? j.summary;
    author = j.authors?.[0]?.name;
  }

  return {
    guid: { value: row.guid },
    title,
    link: row.link ?? undefined,
    description,
    authors: author ? [{ name: author }] : undefined,
    pubDate: row.publishedAt ? new Date(row.publishedAt).toUTCString() : undefined,
    source: row.feedTitle ? { name: row.feedTitle, url: row.link ?? "" } : undefined,
  };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const db = drizzle(env.DB, { schema });
    const feeds = await db.select().from(schema.rssFeeds).where(eq(schema.rssFeeds.active, true));
    await Promise.allSettled(feeds.map((feed) => fetchFeed(db, feed)));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const db = drizzle(env.DB, { schema });

    if (url.pathname === "/feed.xml" && request.method === "GET") {
      const rows = await db
        .select({
          id: schema.rssItems.id,
          guid: schema.rssItems.guid,
          link: schema.rssItems.link,
          publishedAt: schema.rssItems.publishedAt,
          format: schema.rssItems.format,
          raw: schema.rssItems.raw,
          createdAt: schema.rssItems.createdAt,
          feedTitle: schema.rssFeeds.title,
        })
        .from(schema.rssItems)
        .leftJoin(schema.rssFeeds, eq(schema.rssItems.feedId, schema.rssFeeds.id))
        .orderBy(desc(schema.rssItems.publishedAt))
        .limit(100);

      return new Response(
        generateRssFeed({
          title: "Space Monitoring",
          link: "https://space-monitoring.tech",
          description: "Aggregated space industry feed",
          items: rows.map(toRssItem),
        }),
        { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
      );
    }

    if (url.pathname === "/opml" && request.method === "GET") {
      const feeds = await db
        .select()
        .from(schema.rssFeeds)
        .where(eq(schema.rssFeeds.active, true))
        .orderBy(schema.rssFeeds.title);

      return new Response(
        generateOpml({
          head: { title: "Space Monitoring Feeds" },
          body: {
            outlines: feeds.map((feed) => ({
              text: feed.title ?? feed.url,
              type: "rss",
              xmlUrl: feed.url,
              htmlUrl: feed.siteUrl ?? undefined,
              title: feed.title ?? undefined,
            })),
          },
        }),
        { headers: { "Content-Type": "text/x-opml; charset=utf-8" } },
      );
    }

    if (url.pathname === "/feeds" && request.method === "GET") {
      const feeds = await db.select().from(schema.rssFeeds).orderBy(schema.rssFeeds.createdAt);
      return Response.json(feeds);
    }

    if (url.pathname === "/feeds" && request.method === "POST") {
      const body = await request.json<{ url: string; title?: string }>();
      if (!body.url) return new Response("url required", { status: 400 });
      const [feed] = await db
        .insert(schema.rssFeeds)
        .values({ url: body.url, title: body.title })
        .onConflictDoNothing()
        .returning();
      return Response.json(feed ?? { error: "already exists" }, { status: feed ? 201 : 409 });
    }

    const deleteMatch = url.pathname.match(/^\/feeds\/(\d+)$/);
    if (deleteMatch && request.method === "DELETE") {
      await db.delete(schema.rssFeeds).where(eq(schema.rssFeeds.id, parseInt(deleteMatch[1]!, 10)));
      return new Response(null, { status: 204 });
    }

    if (url.pathname === "/feeds/import-opml" && request.method === "POST") {
      const opml = parseOpml(await request.text());
      const outlines = opml.body?.outlines ?? [];

      const feedUrls = outlines.flatMap((outline) => {
        const feeds: { url: string; title?: string; siteUrl?: string }[] = [];
        if (outline.xmlUrl) {
          feeds.push({ url: outline.xmlUrl, title: outline.title ?? outline.text, siteUrl: outline.htmlUrl });
        }
        for (const child of outline.outlines ?? []) {
          if (child.xmlUrl) {
            feeds.push({ url: child.xmlUrl, title: child.title ?? child.text, siteUrl: child.htmlUrl });
          }
        }
        return feeds;
      });

      if (feedUrls.length === 0) return new Response("no feeds found in OPML", { status: 400 });
      await db.insert(schema.rssFeeds).values(feedUrls).onConflictDoNothing();
      return Response.json({ imported: feedUrls.length });
    }

    return new Response("not found", { status: 404 });
  },
};
