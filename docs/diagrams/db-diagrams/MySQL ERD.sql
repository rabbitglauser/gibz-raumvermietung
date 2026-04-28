CREATE TABLE `customers` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `department` varchar(150),
  `email` varchar(255) NOT NULL,
  `phone` varchar(50),
  `customer_type` ENUM ('external', 'public_sector', 'canton_zug', 'gibz_internal_school', 'gibz_internal_private') NOT NULL,
  `created_at` datetime
);

CREATE TABLE `invoice_addresses` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `company_name` varchar(150),
  `address` varchar(255) NOT NULL,
  `zip_code` varchar(20) NOT NULL,
  `city` varchar(100) NOT NULL,
  `additional_invoice_info` text
);

CREATE TABLE `rooms` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `building` varchar(100),
  `floor` varchar(50),
  `area_m2` int,
  `max_persons` int,
  `description` text,
  `is_active` boolean DEFAULT true
);

CREATE TABLE `room_prices` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `customer_type` ENUM ('external', 'public_sector', 'canton_zug', 'gibz_internal_school', 'gibz_internal_private') NOT NULL,
  `half_day_price` decimal(10,2),
  `full_day_price` decimal(10,2)
);

CREATE TABLE `seating_variants` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `max_tables` int,
  `max_chairs_per_table` int,
  `max_persons` int,
  `description` text
);

CREATE TABLE `materials` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `max_quantity` int,
  `description` text
);

CREATE TABLE `reservations` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `room_id` int NOT NULL,
  `invoice_address_id` int,
  `event_name` varchar(150) NOT NULL,
  `event_date` date NOT NULL,
  `setup_from` datetime,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `number_of_persons` int,
  `status` ENUM ('draft', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
  `agb_accepted` boolean NOT NULL,
  `remarks` text,
  `created_at` datetime,
  `updated_at` datetime,
  `editable_until` datetime
);

CREATE TABLE `reservation_catering` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `time_type` ENUM ('before_event', 'during_event', 'after_event') NOT NULL,
  `is_requested` boolean DEFAULT false,
  `time_from` time,
  `time_to` time,
  `notes` text
);

CREATE TABLE `reservation_setup` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `seating_variant_id` int,
  `custom_seating` text,
  `microphone_required` boolean DEFAULT false,
  `direction_required` boolean DEFAULT false,
  `direction_hours` decimal(4,1),
  `info_screen_text_required` boolean DEFAULT false,
  `info_screen_text` varchar(255),
  `publish_event` boolean DEFAULT false,
  `target_group` text
);

CREATE TABLE `reservation_materials` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity` int NOT NULL
);

CREATE TABLE `reminders` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `reminder_type` varchar(100) NOT NULL,
  `message` text,
  `sent_at` datetime,
  `is_resolved` boolean DEFAULT false
);

CREATE TABLE `app_settings` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `setting_key` varchar(100) UNIQUE NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `description` text
);

ALTER TABLE `invoice_addresses` ADD FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

ALTER TABLE `reservations` ADD FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

ALTER TABLE `reservations` ADD FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`);

ALTER TABLE `reservations` ADD FOREIGN KEY (`invoice_address_id`) REFERENCES `invoice_addresses` (`id`);

ALTER TABLE `room_prices` ADD FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`);

ALTER TABLE `seating_variants` ADD FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`);

ALTER TABLE `reservation_catering` ADD FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`);

ALTER TABLE `reservation_setup` ADD FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`);

ALTER TABLE `reservation_setup` ADD FOREIGN KEY (`seating_variant_id`) REFERENCES `seating_variants` (`id`);

ALTER TABLE `reservation_materials` ADD FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`);

ALTER TABLE `reservation_materials` ADD FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`);

ALTER TABLE `reminders` ADD FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`);
