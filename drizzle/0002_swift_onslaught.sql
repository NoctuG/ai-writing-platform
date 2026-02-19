CREATE TABLE `paperVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`outline` text,
	`content` text,
	`changeDescription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paperVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `paperVersions` ADD CONSTRAINT `paperVersions_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE cascade ON UPDATE no action;