CREATE TABLE `legal_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`locale` text NOT NULL,
	`content` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `legal_documents_slug_locale_idx` ON `legal_documents` (`slug`,`locale`);--> statement-breakpoint
CREATE UNIQUE INDEX `legal_documents_slug_locale_unique` ON `legal_documents` (`slug`,`locale`);--> statement-breakpoint
ALTER TABLE `translations` ADD `type` text DEFAULT 'content' NOT NULL;