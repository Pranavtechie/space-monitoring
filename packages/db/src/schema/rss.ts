import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const rssFeeds = sqliteTable(
  "rss_feed",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull().unique(),
    title: text("title"),
    description: text("description"),
    siteUrl: text("site_url"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    lastFetchedAt: integer("last_fetched_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("rss_feed_active_idx").on(table.active)],
);

export const rssItems = sqliteTable(
  "rss_item",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    feedId: integer("feed_id")
      .notNull()
      .references(() => rssFeeds.id, { onDelete: "cascade" }),
    guid: text("guid").notNull(),
    link: text("link"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    format: text("format").notNull(),
    raw: text("raw").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("rss_item_guid_feed_idx").on(table.feedId, table.guid),
    index("rss_item_feed_idx").on(table.feedId),
    index("rss_item_published_idx").on(table.publishedAt),
  ],
);
