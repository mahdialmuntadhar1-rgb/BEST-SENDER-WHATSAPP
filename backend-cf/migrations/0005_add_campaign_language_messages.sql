-- Migration: Add language-specific message columns to campaigns table

ALTER TABLE campaigns ADD COLUMN message_ar TEXT;
ALTER TABLE campaigns ADD COLUMN message_ku TEXT;
ALTER TABLE campaigns ADD COLUMN message_en TEXT;
