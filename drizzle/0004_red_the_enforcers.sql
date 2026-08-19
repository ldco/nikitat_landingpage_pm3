CREATE TABLE `portfolio_item_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text,
	`description` text,
	`content` text,
	`category` text,
	`updated_at` integer,
	FOREIGN KEY (`item_id`) REFERENCES `portfolio_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `portfolio_item_translations_item_idx` ON `portfolio_item_translations` (`item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_item_translations_item_id_locale_unique` ON `portfolio_item_translations` (`item_id`,`locale`);--> statement-breakpoint
CREATE TABLE `portfolio_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`portfolio_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text,
	`description` text,
	`updated_at` integer,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `portfolio_translations_portfolio_idx` ON `portfolio_translations` (`portfolio_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `portfolio_translations_portfolio_id_locale_unique` ON `portfolio_translations` (`portfolio_id`,`locale`);