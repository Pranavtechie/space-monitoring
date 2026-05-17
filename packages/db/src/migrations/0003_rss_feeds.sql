CREATE TABLE `rss_feed` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`description` text,
	`site_url` text,
	`active` integer DEFAULT true NOT NULL,
	`last_fetched_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rss_feed_url_unique` ON `rss_feed` (`url`);--> statement-breakpoint
CREATE INDEX `rss_feed_active_idx` ON `rss_feed` (`active`);--> statement-breakpoint
CREATE TABLE `rss_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer NOT NULL,
	`guid` text NOT NULL,
	`link` text,
	`published_at` integer,
	`format` text NOT NULL,
	`raw` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `rss_feed`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rss_item_guid_feed_idx` ON `rss_item` (`feed_id`,`guid`);--> statement-breakpoint
CREATE INDEX `rss_item_feed_idx` ON `rss_item` (`feed_id`);--> statement-breakpoint
CREATE INDEX `rss_item_published_idx` ON `rss_item` (`published_at`);
