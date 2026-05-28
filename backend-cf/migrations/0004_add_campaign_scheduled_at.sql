-- Migration: Add missing scheduled_at column to campaigns table

ALTER TABLE campaigns ADD COLUMN scheduled_at DATETIME;
