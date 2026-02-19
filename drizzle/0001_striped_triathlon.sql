CREATE TABLE `papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`type` enum('graduation','journal','proposal','professional') NOT NULL,
	`status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`outline` text,
	`content` text,
	`wordFileKey` text,
	`wordFileUrl` text,
	`pdfFileKey` text,
	`pdfFileUrl` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `papers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `papers` ADD CONSTRAINT `papers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;