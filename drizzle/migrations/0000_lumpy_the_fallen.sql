CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text,
	`created_at` text NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE TABLE `question_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`option_text` text NOT NULL,
	`order_index` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`revision_number` integer NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`options_snapshot` text NOT NULL,
	`changed_by` text,
	`change_reason` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`question_number` text NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`min_selections` integer,
	`max_selections` integer,
	`has_other_option` integer DEFAULT false NOT NULL,
	`conditional_logic` text,
	`researcher_note` text,
	`order_index` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`current_revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `respondent_contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`participant_name` text,
	`participant_contact` text,
	`collected_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `survey_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `respondent_contacts_session_id_unique` ON `respondent_contacts` (`session_id`);--> statement-breakpoint
CREATE TABLE `response_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`response_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`option_id` integer,
	`other_text` text,
	`free_text` text,
	FOREIGN KEY (`response_id`) REFERENCES `responses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`option_id`) REFERENCES `question_options`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`question_revision` integer NOT NULL,
	`submitted_at` text NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `survey_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`survey_id` integer NOT NULL,
	`section_key` text NOT NULL,
	`section_title` text NOT NULL,
	`description` text,
	`concept_text` text,
	`order_index` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `survey_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`survey_id` integer NOT NULL,
	`session_token` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`current_question_index` integer DEFAULT 0 NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	`last_activity_at` text NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `survey_sessions_session_token_unique` ON `survey_sessions` (`session_token`);--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`incentive_text` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
