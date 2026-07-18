-- Migration: Add portfolio_items.metadata column
-- This column was lost during migration 0001's table rewrite (DROP + RENAME)
-- where the __new_portfolio_items table didn't include the metadata column.

ALTER TABLE `portfolio_items` ADD COLUMN `metadata` text;
