-- Migration: Add display fields to channels table
-- Purpose: Store emoji, color, and sort order for dynamic portal navigation

ALTER TABLE channels ADD COLUMN emoji TEXT DEFAULT '📚';
ALTER TABLE channels ADD COLUMN color TEXT DEFAULT 'from-gray-400 to-gray-500';
ALTER TABLE channels ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing channels with display data
UPDATE channels SET emoji = '💻', color = 'from-blue-400 to-indigo-500', sort_order = 1 WHERE slug = 'programming-ai';
UPDATE channels SET emoji = '✈️', color = 'from-cyan-400 to-blue-500', sort_order = 2 WHERE slug = 'travel';
UPDATE channels SET emoji = '💪', color = 'from-teal-400 to-cyan-500', sort_order = 3 WHERE slug = 'fitness';
UPDATE channels SET emoji = '🥗', color = 'from-emerald-400 to-teal-500', sort_order = 4 WHERE slug = 'nutrition';

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_channels_sort ON channels(sort_order);
