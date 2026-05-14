import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const institution = sqliteTable(
  "institution",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    website: text("website").notNull(),
    city: text("city").notNull(),
    state: text("state"),
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(),
    institutionType: text("institution_type").notNull().default("university"),
    fundingType: text("funding_type").notNull(),
    sourceCsvPath: text("source_csv_path").notNull(),
    duplicateCsvPaths: text("duplicate_csv_paths"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("institution_slug_idx").on(table.slug),
    index("institution_type_idx").on(table.institutionType),
    index("institution_funding_type_idx").on(table.fundingType),
    index("institution_location_idx").on(table.countryCode, table.state, table.city),
  ],
);
