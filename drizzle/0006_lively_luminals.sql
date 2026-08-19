DROP INDEX `blog_category_translations_category_idx`;--> statement-breakpoint
DROP INDEX `blog_post_translations_post_idx`;--> statement-breakpoint
DROP INDEX `faq_item_translations_faq_idx`;--> statement-breakpoint
DROP INDEX `feature_translations_feature_idx`;--> statement-breakpoint
DROP INDEX `legal_documents_slug_locale_idx`;--> statement-breakpoint
DROP INDEX `portfolio_item_translations_item_idx`;--> statement-breakpoint
DROP INDEX `portfolio_translations_portfolio_idx`;--> statement-breakpoint
DROP INDEX `pricing_feature_translations_feature_idx`;--> statement-breakpoint
DROP INDEX `pricing_tier_translations_tier_idx`;--> statement-breakpoint
DROP INDEX `team_member_translations_member_idx`;--> statement-breakpoint
DROP INDEX `testimonial_translations_testimonial_idx`;--> statement-breakpoint
DROP INDEX `user_2fa_user_idx`;--> statement-breakpoint
CREATE INDEX `contact_submissions_read_idx` ON `contact_submissions` (`read`);--> statement-breakpoint
CREATE INDEX `contact_submissions_created_idx` ON `contact_submissions` (`created_at`);