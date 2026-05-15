CREATE TABLE `organization` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`institution_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`relevance` text NOT NULL,
	`confidence` text,
	`website` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institution`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `organization_institution_idx` ON `organization` (`institution_id`);--> statement-breakpoint
CREATE INDEX `organization_type_idx` ON `organization` (`type`);--> statement-breakpoint
CREATE INDEX `organization_category_idx` ON `organization` (`category`);--> statement-breakpoint
CREATE INDEX `organization_relevance_idx` ON `organization` (`relevance`);
