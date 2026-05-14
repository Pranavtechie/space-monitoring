CREATE TABLE `institution` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`website` text NOT NULL,
	`city` text NOT NULL,
	`state` text,
	`country` text NOT NULL,
	`country_code` text NOT NULL,
	`institution_type` text DEFAULT 'university' NOT NULL,
	`funding_type` text NOT NULL,
	`source_csv_path` text NOT NULL,
	`duplicate_csv_paths` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `institution_slug_unique` ON `institution` (`slug`);--> statement-breakpoint
CREATE INDEX `institution_slug_idx` ON `institution` (`slug`);--> statement-breakpoint
CREATE INDEX `institution_type_idx` ON `institution` (`institution_type`);--> statement-breakpoint
CREATE INDEX `institution_funding_type_idx` ON `institution` (`funding_type`);--> statement-breakpoint
CREATE INDEX `institution_location_idx` ON `institution` (`country_code`,`state`,`city`);
