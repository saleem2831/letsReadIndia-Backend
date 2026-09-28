-- LetsReadIndia platform upgrade: reading assessments, coupons and secure checkout.
-- Run once against the same database configured in .env before deploying this release.

CREATE TABLE IF NOT EXISTS reading_students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  age_years TINYINT UNSIGNED NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  school_name VARCHAR(200) NOT NULL,
  email VARCHAR(190) NULL,
  whatsapp_country_code VARCHAR(10) NULL,
  whatsapp_number VARCHAR(30) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reading_student_name (name),
  INDEX idx_reading_student_school (school_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reading_assessments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_number VARCHAR(64) NOT NULL UNIQUE,
  student_id BIGINT UNSIGNED NOT NULL,
  chronological_age_months SMALLINT UNSIGNED NOT NULL,
  reading_age_code VARCHAR(10) NOT NULL,
  reading_age_months SMALLINT UNSIGNED NULL,
  reading_gap_months SMALLINT NULL,
  classification VARCHAR(100) NOT NULL,
  intervention VARCHAR(255) NOT NULL,
  correct_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  incorrect_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  last_correct_item_index SMALLINT UNSIGNED NULL,
  last_correct_item VARCHAR(500) NULL,
  status ENUM('completed','b4') NOT NULL DEFAULT 'completed',
  parent_email_sent TINYINT(1) NOT NULL DEFAULT 0,
  parent_email_sent_at DATETIME NULL,
  email_error TEXT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reading_student FOREIGN KEY (student_id) REFERENCES reading_students(id) ON DELETE CASCADE,
  INDEX idx_reading_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reading_assessment_responses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  assessment_id BIGINT UNSIGNED NOT NULL,
  item_index SMALLINT UNSIGNED NOT NULL,
  item_text VARCHAR(500) NOT NULL,
  ra_key VARCHAR(10) NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  response_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reading_response FOREIGN KEY (assessment_id) REFERENCES reading_assessments(id) ON DELETE CASCADE,
  UNIQUE KEY uq_reading_response_item (assessment_id,item_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  discount_type ENUM('percent','fixed') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0,
  maximum_discount DECIMAL(10,2) NULL,
  maximum_uses INT UNSIGNED NULL,
  uses_per_email INT UNSIGNED NULL,
  starts_at DATETIME NULL,
  expires_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_redemption_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  UNIQUE KEY uq_coupon_order (coupon_id,order_id),
  INDEX idx_coupon_email (coupon_id,customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS checkout_quotes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_number VARCHAR(64) NOT NULL UNIQUE,
  razorpay_order_id VARCHAR(100) NULL UNIQUE,
  customer_json JSON NOT NULL,
  items_json JSON NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  coupon_id BIGINT UNSIGNED NULL,
  coupon_code VARCHAR(50) NULL,
  shipping_mode ENUM('domestic','international') NOT NULL,
  courier_id VARCHAR(50) NULL,
  courier_name VARCHAR(150) NULL,
  estimated_delivery_days VARCHAR(80) NULL,
  shipping_rate_json JSON NULL,
  status ENUM('quoted','payment_created','consumed','expired') NOT NULL DEFAULT 'quoted',
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quote_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  INDEX idx_quote_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shipment_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  awb VARCHAR(100) NULL,
  shipment_status VARCHAR(150) NOT NULL,
  activity VARCHAR(500) NULL,
  location VARCHAR(255) NULL,
  event_time DATETIME NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shipment_order (order_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Older MySQL installations do not support ADD COLUMN IF NOT EXISTS.
-- Each statement below checks information_schema first, keeping this migration rerunnable.

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='weight_kg')=0,
  'ALTER TABLE products ADD COLUMN weight_kg DECIMAL(8,3) NOT NULL DEFAULT 0.50', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reading_assessments' AND COLUMN_NAME='parent_email_sent')=0,
  'ALTER TABLE reading_assessments ADD COLUMN parent_email_sent TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reading_assessments' AND COLUMN_NAME='parent_email_sent_at')=0,
  'ALTER TABLE reading_assessments ADD COLUMN parent_email_sent_at DATETIME NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reading_assessments' AND COLUMN_NAME='email_error')=0,
  'ALTER TABLE reading_assessments ADD COLUMN email_error TEXT NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='length_cm')=0,
  'ALTER TABLE products ADD COLUMN length_cm DECIMAL(8,2) NOT NULL DEFAULT 20', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='breadth_cm')=0,
  'ALTER TABLE products ADD COLUMN breadth_cm DECIMAL(8,2) NOT NULL DEFAULT 15', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='height_cm')=0,
  'ALTER TABLE products ADD COLUMN height_cm DECIMAL(8,2) NOT NULL DEFAULT 5', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND COLUMN_NAME='hsn_code')=0,
  'ALTER TABLE products ADD COLUMN hsn_code VARCHAR(20) NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='currency')=0,
  'ALTER TABLE orders ADD COLUMN currency CHAR(3) NOT NULL DEFAULT ''INR''', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='discount_amount')=0,
  'ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='coupon_id')=0,
  'ALTER TABLE orders ADD COLUMN coupon_id BIGINT UNSIGNED NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='coupon_code')=0,
  'ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='shipping_mode')=0,
  'ALTER TABLE orders ADD COLUMN shipping_mode ENUM(''domestic'',''international'') NOT NULL DEFAULT ''domestic''', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='quoted_courier_id')=0,
  'ALTER TABLE orders ADD COLUMN quoted_courier_id VARCHAR(50) NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='estimated_delivery_days')=0,
  'ALTER TABLE orders ADD COLUMN estimated_delivery_days VARCHAR(80) NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='shipping_quote_json')=0,
  'ALTER TABLE orders ADD COLUMN shipping_quote_json JSON NULL', 'SELECT 1');
PREPARE add_column FROM @ddl; EXECUTE add_column; DEALLOCATE PREPARE add_column;
