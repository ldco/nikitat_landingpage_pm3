CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`user_id` integer,
	`target_user_id` integer,
	`ip_address` text,
	`user_agent` text,
	`details` text,
	`success` integer DEFAULT true,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE TABLE `blog_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`order` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_categories_slug_unique` ON `blog_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `blog_category_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`updated_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `blog_category_translations_category_idx` ON `blog_category_translations` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `blog_category_translations_category_id_locale_unique` ON `blog_category_translations` (`category_id`,`locale`);--> statement-breakpoint
CREATE TABLE `blog_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`thumbnail_url` text,
	`alt` text,
	`width` integer,
	`height` integer,
	`size_bytes` integer,
	`order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `blog_media_post_idx` ON `blog_media` (`post_id`);--> statement-breakpoint
CREATE TABLE `blog_post_tags` (
	`post_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `blog_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `blog_post_tags_post_idx` ON `blog_post_tags` (`post_id`);--> statement-breakpoint
CREATE INDEX `blog_post_tags_tag_idx` ON `blog_post_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `blog_post_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`content` text,
	`updated_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `blog_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `blog_post_translations_post_idx` ON `blog_post_translations` (`post_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `blog_post_translations_post_id_locale_unique` ON `blog_post_translations` (`post_id`,`locale`);--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`author_id` integer,
	`category_id` integer,
	`cover_image_url` text,
	`cover_image_alt` text,
	`published` integer DEFAULT false,
	`published_at` integer,
	`reading_time_minutes` integer,
	`view_count` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `blog_posts_published_idx` ON `blog_posts` (`published`);--> statement-breakpoint
CREATE INDEX `blog_posts_author_idx` ON `blog_posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `blog_posts_category_idx` ON `blog_posts` (`category_id`);--> statement-breakpoint
CREATE TABLE `blog_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_tags_slug_unique` ON `blog_tags` (`slug`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo_url` text NOT NULL,
	`website_url` text,
	`category` text DEFAULT 'client',
	`featured` integer DEFAULT false,
	`published` integer DEFAULT true,
	`order` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE INDEX `clients_published_idx` ON `clients` (`published`);--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`subject` text,
	`message` text NOT NULL,
	`consent` integer DEFAULT false,
	`read` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `faq_item_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`faq_item_id` integer NOT NULL,
	`locale` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`faq_item_id`) REFERENCES `faq_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `faq_item_translations_faq_idx` ON `faq_item_translations` (`faq_item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `faq_item_translations_faq_item_id_locale_unique` ON `faq_item_translations` (`faq_item_id`,`locale`);--> statement-breakpoint
CREATE TABLE `faq_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`category` text,
	`published` integer DEFAULT true,
	`order` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faq_items_slug_unique` ON `faq_items` (`slug`);--> statement-breakpoint
CREATE INDEX `faq_items_published_idx` ON `faq_items` (`published`);--> statement-breakpoint
CREATE TABLE `feature_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feature_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`updated_at` integer,
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feature_translations_feature_idx` ON `feature_translations` (`feature_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `feature_translations_feature_id_locale_unique` ON `feature_translations` (`feature_id`,`locale`);--> statement-breakpoint
CREATE TABLE `features` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`image_url` text,
	`hover_image_url` text,
	`category` text,
	`published` integer DEFAULT true,
	`order` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `features_slug_unique` ON `features` (`slug`);--> statement-breakpoint
CREATE INDEX `features_published_idx` ON `features` (`published`);--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`portfolio_id` integer NOT NULL,
	`item_type` text NOT NULL,
	`order` integer DEFAULT 0,
	`published` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	`media_url` text,
	`thumbnail_url` text,
	`caption` text,
	`slug` text,
	`title` text,
	`description` text,
	`content` text,
	`tags` text,
	`category` text,
	`published_at` integer,
	`metadata` text,
	FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `portfolio_items_portfolio_idx` ON `portfolio_items` (`portfolio_id`);--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`cover_image_url` text,
	`cover_thumbnail_url` text,
	`order` integer DEFAULT 0,
	`published` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portfolios_slug_unique` ON `portfolios` (`slug`);--> statement-breakpoint
CREATE INDEX `portfolios_published_idx` ON `portfolios` (`published`);--> statement-breakpoint
CREATE TABLE `pricing_feature_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feature_id` integer NOT NULL,
	`locale` text NOT NULL,
	`text` text,
	`updated_at` integer,
	FOREIGN KEY (`feature_id`) REFERENCES `pricing_features`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pricing_feature_translations_feature_idx` ON `pricing_feature_translations` (`feature_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_feature_translations_feature_id_locale_unique` ON `pricing_feature_translations` (`feature_id`,`locale`);--> statement-breakpoint
CREATE TABLE `pricing_features` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tier_id` integer NOT NULL,
	`text` text NOT NULL,
	`included` integer DEFAULT true,
	`order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`tier_id`) REFERENCES `pricing_tiers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pricing_features_tier_idx` ON `pricing_features` (`tier_id`);--> statement-breakpoint
CREATE TABLE `pricing_tier_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tier_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text,
	`description` text,
	`cta_text` text,
	`updated_at` integer,
	FOREIGN KEY (`tier_id`) REFERENCES `pricing_tiers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pricing_tier_translations_tier_idx` ON `pricing_tier_translations` (`tier_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_tier_translations_tier_id_locale_unique` ON `pricing_tier_translations` (`tier_id`,`locale`);--> statement-breakpoint
CREATE TABLE `pricing_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer,
	`currency` text DEFAULT 'USD',
	`period` text DEFAULT 'month',
	`featured` integer DEFAULT false,
	`cta_text` text,
	`cta_url` text DEFAULT '/contact',
	`order` integer DEFAULT 0,
	`published` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_tiers_slug_unique` ON `pricing_tiers` (`slug`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`permissions` text NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`is_built_in` integer DEFAULT false,
	`color` text DEFAULT 'secondary',
	`icon` text DEFAULT 'pencil',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_slug_unique` ON `roles` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_expires_idx` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`type` text DEFAULT 'string' NOT NULL,
	`group` text DEFAULT 'general',
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `team_member_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`locale` text NOT NULL,
	`position` text,
	`bio` text,
	`updated_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `team_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_member_translations_member_idx` ON `team_member_translations` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_member_translations_member_id_locale_unique` ON `team_member_translations` (`member_id`,`locale`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`position` text,
	`bio` text,
	`photo_url` text,
	`hover_photo_url` text,
	`email` text,
	`phone` text,
	`department` text,
	`social_links` text,
	`published` integer DEFAULT true,
	`order` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_slug_unique` ON `team_members` (`slug`);--> statement-breakpoint
CREATE INDEX `team_members_published_idx` ON `team_members` (`published`);--> statement-breakpoint
CREATE TABLE `testimonial_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`testimonial_id` integer NOT NULL,
	`locale` text NOT NULL,
	`quote` text NOT NULL,
	`author_title` text,
	`updated_at` integer,
	FOREIGN KEY (`testimonial_id`) REFERENCES `testimonials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `testimonial_translations_testimonial_idx` ON `testimonial_translations` (`testimonial_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `testimonial_translations_testimonial_id_locale_unique` ON `testimonial_translations` (`testimonial_id`,`locale`);--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_name` text NOT NULL,
	`author_title` text,
	`author_company` text,
	`author_photo_url` text,
	`rating` integer,
	`featured` integer DEFAULT false,
	`published` integer DEFAULT true,
	`order` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE INDEX `testimonials_published_idx` ON `testimonials` (`published`);--> statement-breakpoint
CREATE TABLE `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`locale` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `translations_locale_key_unique` ON `translations` (`locale`,`key`);--> statement-breakpoint
CREATE TABLE `user_2fa` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`secret` text NOT NULL,
	`backup_codes` text NOT NULL,
	`backup_codes_remaining` integer DEFAULT 10,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_2fa_user_id_unique` ON `user_2fa` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_2fa_user_idx` ON `user_2fa` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'editor' NOT NULL,
	`role_id` integer,
	`failed_login_attempts` integer DEFAULT 0,
	`locked_until` integer,
	`last_failed_login` integer,
	`two_factor_enabled` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);