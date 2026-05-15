import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { institution } from "./institution";

export const organization = sqliteTable(
  "organization",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    institutionId: integer("institution_id")
      .notNull()
      .references(() => institution.id),
    name: text("name").notNull(),
    type: text("type").notNull(),
    category: text("category").notNull(),
    relevance: text("relevance").notNull(),
    confidence: text("confidence"),
    website: text("website"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("organization_institution_idx").on(table.institutionId),
    index("organization_type_idx").on(table.type),
    index("organization_category_idx").on(table.category),
    index("organization_relevance_idx").on(table.relevance),
  ],
);
