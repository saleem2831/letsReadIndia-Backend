-- LetsReadIndia operations upgrade.
-- Run once against the same database configured in .env before deploying this release.
-- Safe to run again on older MySQL versions that do not support ADD COLUMN IF NOT EXISTS.

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='coupons' AND COLUMN_NAME='deleted_at')=0,
  'ALTER TABLE coupons ADD COLUMN deleted_at DATETIME NULL AFTER is_active',
  'SELECT 1'
);
PREPARE operations_upgrade FROM @ddl;
EXECUTE operations_upgrade;
DEALLOCATE PREPARE operations_upgrade;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='coupons' AND INDEX_NAME='idx_coupon_deleted')=0,
  'ALTER TABLE coupons ADD INDEX idx_coupon_deleted (deleted_at)',
  'SELECT 1'
);
PREPARE operations_upgrade FROM @ddl;
EXECUTE operations_upgrade;
DEALLOCATE PREPARE operations_upgrade;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND INDEX_NAME='idx_orders_status_created')=0,
  'ALTER TABLE orders ADD INDEX idx_orders_status_created (status,created_at)',
  'SELECT 1'
);
PREPARE operations_upgrade FROM @ddl;
EXECUTE operations_upgrade;
DEALLOCATE PREPARE operations_upgrade;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND INDEX_NAME='idx_orders_payment_id')=0,
  'ALTER TABLE orders ADD INDEX idx_orders_payment_id (payment_id)',
  'SELECT 1'
);
PREPARE operations_upgrade FROM @ddl;
EXECUTE operations_upgrade;
DEALLOCATE PREPARE operations_upgrade;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND INDEX_NAME='idx_orders_razorpay_order')=0,
  'ALTER TABLE orders ADD INDEX idx_orders_razorpay_order (razorpay_order_id)',
  'SELECT 1'
);
PREPARE operations_upgrade FROM @ddl;
EXECUTE operations_upgrade;
DEALLOCATE PREPARE operations_upgrade;
