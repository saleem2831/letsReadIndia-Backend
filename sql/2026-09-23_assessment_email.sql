-- Run this hotfix if 2026-09-22_platform_upgrade.sql was already applied.
-- Compatible with MySQL versions that do not support ADD COLUMN IF NOT EXISTS.

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reading_assessments' AND COLUMN_NAME='parent_email_sent')=0,
  'ALTER TABLE reading_assessments ADD COLUMN parent_email_sent TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reading_assessments' AND COLUMN_NAME='parent_email_sent_at')=0,
  'ALTER TABLE reading_assessments ADD COLUMN parent_email_sent_at DATETIME NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reading_assessments' AND COLUMN_NAME='email_error')=0,
  'ALTER TABLE reading_assessments ADD COLUMN email_error TEXT NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;
