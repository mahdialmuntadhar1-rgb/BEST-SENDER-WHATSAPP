-- Migration: Add missing indexes for message_logs table

CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_nabda_message_id ON message_logs(nabda_message_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient ON message_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at);
